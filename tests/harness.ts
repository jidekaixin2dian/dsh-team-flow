import { appendFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import { ToolCallId, createUserMessage } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import * as JsonlPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import SubagentService from '@deepseek-ai/dsh-subagent'
import * as SubagentSpawn from '@deepseek-ai/dsh-subagent-spawn-in-process'
import TeamService from '@deepseek-ai/dsh-experimental-agent-team'
import * as toolTeam from '@deepseek-ai/dsh-experimental-tool-agent-team'
import type { ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { expect, onTestFinished } from 'vitest'
import { MockAdapter, textResponse, toolCallResponse } from 'm1-upstream/packages/core/agent-loop/tests/mock-adapter.ts'
import { mountWorkingDirectoryFixture } from 'm1-upstream/packages/subagent/subagent/tests/working-directory-fixture.ts'
import { TestSessionQuery } from 'm1-upstream/packages/experimental/agent-team/tests/test-session-query.ts'

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap { 'm2-fixture': { kind: 'm2-fixture' } }
}

export const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
export const input = (kind: 'user' | 'm2-fixture' = 'user') => createUserMessage({ content: [{ type: 'text', text: 'synthetic M2 input' }], source: { kind } })
let call = 0

export async function setup(scenario: string, options: { ptc?: string; spike?: boolean; child?: boolean; toolTeam?: boolean; prepare?: (ctx: Context, root: string) => Promise<void> } = {}) {
  if (!process.env.M2_HOME || process.env.DSH_HOME !== process.env.M2_HOME) throw new Error('isolated M2_HOME is required')
  const root = mkdtempSync(join(process.env.M2_HOME, 'case-'))
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  await mountAgentLoopTestDependencies(ctx, { tools: { mode: options.ptc ? 'ptc' : 'native' } })
  await mountWorkingDirectoryFixture(ctx)
  // rc.2 exposes the lifecycle-owning apply plugin; older hosts export the service default.
  await ctx.plugin(JsonlPersistence.default ?? JsonlPersistence, { root })
  await ctx.plugin(TestSessionQuery)
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(SubagentService)
  await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
  await ctx.plugin(TeamService)
  if (options.toolTeam !== false) await ctx.plugin(toolTeam)
  await options.prepare?.(ctx, root)
  const adapter = new MockAdapter([
    ...(options.child === false ? [] : ['hang' as const]),
    options.ptc ? toolCallResponse('outer-1', 'run_code', { description: 'M2 wait', code: options.ptc }) : toolCallResponse('wait-1', 'wait_agent', { timeout_ms: 10000 }),
    ...Array.from({ length: 12 }, () => textResponse('M2 continuation')),
  ])
  ctx.llm.registerAdapter(['mock'], adapter)
  const lead = await ctx.agentLoop.create(SessionId('lead'), { provider: 'mock', model: 'mock' }, { cwd: root })
  const otherAdapter = new MockAdapter([textResponse('other independent response')])
  ctx.llm.registerAdapter(['other-mock'], otherAdapter)
  const other = await ctx.agentLoop.create(SessionId('other'), { provider: 'other-mock', model: 'mock' }, { cwd: root })
  const start = performance.now()
  const events: Array<{ event: string; ms: number; [key: string]: unknown }> = []
  const ids = new Map<string, string>()
  const alias = (id: string) => { if (!ids.has(id)) ids.set(id, `message-${ids.size + 1}`); return ids.get(id) }
  const label = (agent: Agent) => agent === lead ? 'lead' : agent === other ? 'other' : 'teammate'
  const record = (event: string, fields: object = {}) => {
    const row = { event, ms: Number((performance.now() - start).toFixed(3)), ...fields }
    events.push(row)
    appendFileSync(process.env.M2_TIMELINE!, JSON.stringify({ scenario, ...row }) + '\n')
  }
  const claims: Array<{ agent: Agent; id: string; turn: number }> = []
  const results: Array<{ name: string; result: ToolExecutionResult; signal: AbortSignal }> = []
  let ready!: () => void
  const entered = new Promise<void>(resolve => { ready = resolve })
  ctx.on('agent/inbox/inserted', ({ agent, message }) => record('inbox/inserted', { agent: label(agent), message: alias(message.id), source: message.source.kind, nextStep: agent.inbox.nextStep.some(item => item.id === message.id), nextTurn: agent.inbox.nextTurn.some(item => item.id === message.id) }))
  ctx.on('agent/inbox/claimed', ({ agent, message, turn }) => { claims.push({ agent, id: message.id, turn }); record('inbox/claimed', { agent: label(agent), message: alias(message.id), turn }) })
  ctx.on('agent/inbox/discarded', ({ agent, message }) => record('inbox/discarded', { agent: label(agent), message: alias(message.id) }))
  ctx.on('agent/status', ({ agent, status }) => record('agent/status', { agent: label(agent), status }))
  ctx.on('session/event', (session, event) => {
    if (session === lead.session && ['tool/call', 'tool/result', 'tool/ptc-dispatch-start', 'tool/ptc-dispatch', 'step/start', 'turn/end'].includes(event.type)) record(event.type, { seq: event.seq })
  })
  ctx.on('tools/result', (exec, result) => {
    if (exec.agent !== lead) return
    results.push({ name: exec.name, result, signal: exec.signal })
    record('tool/final', { name: exec.name, nested: exec.parent !== undefined, isError: result.isError, ...(result.isError ? { error: result.error } : { value: result.value }) })
  })
  const spike = undefined // Historical spike is excluded from this public package.
  // Downstream observation means the real native body has been admitted.
  ctx.on('tools/execute', async (exec, next) => {
    const pending = next()
    if (exec.agent === lead && exec.name === 'wait_agent') { record('wait/dispatched'); ready() }
    return await pending
  })
  let child: Agent | undefined
  if (options.child !== false) {
    const spawned = await ctx.agentTeams.spawnTeammate(lead, { name: 'worker', description: 'M2 Mock worker', prompt: [{ type: 'text', text: 'keep working' }], context: 'fresh', provider: 'spawn', signal: new AbortController().signal })
    child = ctx.agents.get(spawned.member.id)
    await expect.poll(() => adapter.requests.length).toBe(1)
    expect(child?.status).toBe('running')
  }
  const execute = (name: string, args: object, signal = new AbortController().signal, agent: Agent = lead) => ctx.tools.execute({ callId: ToolCallId(`direct-${++call}`), name, arguments: args, signal, agent })
  const release = async () => {
    record('control/team-change')
    const result = await execute('team_task_create', { subject: 'M2 release', description: 'real Team event' })
    expect(result.isError).toBe(false)
  }
  const startLead = async () => {
    lead.followup(input())
    await entered
    if (options.child !== false) { await delay(30); expect(results.filter(row => row.name === 'wait_agent')).toHaveLength(0) }
  }
  return { ctx, root, lead, child, other, adapter, otherAdapter, record, events, claims, results, spike, execute, release, startLead, alias }
}
