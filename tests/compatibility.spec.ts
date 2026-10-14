import { expect, it, vi } from 'vitest'
import { appendFileSync } from 'node:fs'
import FsLocal from '@deepseek-ai/dsh-fs-local'
import SubprocessLocal from '@deepseek-ai/dsh-subprocess-local'
import SandboxLocal from '@deepseek-ai/dsh-sandbox-local'
import SandboxPolicy from '@deepseek-ai/dsh-sandbox-policy'
import NodeRuntime from '@deepseek-ai/dsh-ptc-runtime-node'
import * as officialTeamTools from '@deepseek-ai/dsh-experimental-tool-agent-team'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import * as compat from '../lib/index.js'
import { input, delay, setup } from './harness.ts'
async function compatible(scenario: string, options: { ptc?: string; child?: boolean; prepare?: (ctx: Context, root: string) => Promise<void> } = {}) {
  let fiber, control
  const h = await setup(scenario, { ...options, spike: false, toolTeam: false, prepare: async (ctx, root) => {
    await options.prepare?.(ctx, root)
    fiber = await ctx.plugin({ name: compat.name, inject: compat.inject, async apply(inner) { control = await compat.install(inner, {}, (event, fields) => {
      // Evidence excludes synthetic message text; events keep exact-ID assertions in tests.
      if (process.env.M2_TIMELINE) appendFileSync(process.env.M2_TIMELINE, JSON.stringify({ scenario, event, ms: performance.now(), ...fields }) + '\n')
    }) } })
  } })
  return { ...h, fiber: fiber!, control: control! }
}
it('host compatibility: plugin alone distinguishes Steer/Queue/user inject and returns success', async () => {
  let control: ReturnType<typeof compat.install>
  const h = await setup('rc2-strict-native', { spike: false, toolTeam: false, prepare: async ctx => {
    await ctx.plugin({ name: compat.name, inject: compat.inject, async apply(inner) { control = await compat.install(inner) } })
  } })
  await h.startLead()
  const injected = input(), queue = input(), steer = input()
  h.lead.inject(injected); h.lead.followup(queue)
  await delay(70)
  expect(h.results.filter(row => row.name === 'wait_agent')).toHaveLength(0)
  h.lead.steer(steer)
  await h.lead.whenIdle()
  expect(h.results.find(row => row.name === 'wait_agent')!.result).toMatchObject({ isError: false, value: { timedOut: false, reason: 'user-steer' } })
  expect(h.claims.filter(row => row.id === injected.id)).toHaveLength(1)
  expect(h.claims.filter(row => row.id === steer.id)).toHaveLength(1)
  expect(h.claims.find(row => row.id === queue.id)!.turn).toBe(2)
  expect(h.child!.status).toBe('running')
  expect(control!.diagnostics).toMatchObject({ active: 0, wakes: 1 })
})

it('stock host baseline still blocks same-session Steer until actual Team change', async () => {
  const h = await setup('rc2-stock-baseline', { spike: false })
  await h.startLead()
  const message = input()
  h.lead.steer(message)
  await delay(90)
  expect(h.results.filter(row => row.name === 'wait_agent')).toHaveLength(0)
  expect(h.claims.filter(row => row.id === message.id)).toHaveLength(0)
  await h.release(); await h.lead.whenIdle()
  expect(h.claims.filter(row => row.id === message.id)).toHaveLength(1)
  expect(h.child!.status).toBe('running')
})

it('host compatibility: 20 repeated waits consume each original Steer exactly once', async () => {
  for (let n = 0; n < 20; n++) {
    const h = await compatible(`rc2-repeat-${n}`)
    await h.startLead()
    const message = input()
    h.lead.steer(message); await h.lead.whenIdle()
    expect(h.results.filter(row => row.name === 'wait_agent')).toHaveLength(1)
    expect(h.results.find(row => row.name === 'wait_agent')!.result).toMatchObject({ isError: false, value: { reason: 'user-steer' } })
    expect(h.claims.filter(row => row.id === message.id)).toHaveLength(1)
    expect(h.child!.status).toBe('running')
    expect(h.control.diagnostics).toMatchObject({ active: 0, wakes: 1 })
  }
})

it('host compatibility: uncaught real Node PTC continues after wait success', async () => {
  let markers = 0, completed = 0
  const h = await compatible('rc2-ptc', { ptc: 'const waited=await tools.wait_agent({timeout_ms:10000}); const marker=await tools.rc2_marker({}); return {waited,marker};', prepare: async (ctx, root) => {
    await ctx.plugin(FsLocal); await ctx.plugin(SubprocessLocal); await ctx.plugin(SandboxLocal, {})
    await ctx.plugin(SandboxPolicy, { mode: 'danger-full-access', workspaceRoot: root })
    await ctx.plugin(NodeRuntime, { timeoutMs: 15000, maxTimeoutMs: 20000 })
    ctx.effect(() => ctx.tools.register(defineTool({ name: 'rc2_marker', description: 'record actual PTC continuation', parameters: {}, output: { schema: { type: 'integer' }, render: (_args, value) => [{ type: 'text', text: String(value) }] }, execute: async () => ++markers })))
  } })
  const spawn = h.ctx.subprocess.spawn.bind(h.ctx.subprocess)
  const spy = vi.spyOn(h.ctx.subprocess, 'spawn').mockImplementation(spec => {
    const handle = spawn(spec)
    void handle.done.then(() => completed++, () => completed++)
    return handle
  })
  await h.startLead()
  const message = input(); h.lead.steer(message); await h.lead.whenIdle()
  expect(h.results.find(row => row.name === 'run_code')!.result).toMatchObject({ isError: false, value: { result: { waited: { timedOut: false, reason: 'user-steer' }, marker: 1 } } })
  expect(markers).toBe(1); expect(completed).toBe(1)
  expect(h.claims.filter(row => row.id === message.id)).toHaveLength(1)
  expect(h.child!.status).toBe('running')
  spy.mockRestore()
})

it.each(['stop-first', 'steer-first'])('host compatibility: %s preserves caller Stop', async order => {
  const h = await compatible(`rc2-${order}`)
  await h.startLead()
  if (order === 'stop-first') { h.lead.cancel({ kind: 'user' }, { keepInbox: true }); h.lead.steer(input()) }
  else { h.lead.steer(input()); h.lead.cancel({ kind: 'user' }, { keepInbox: true }) }
  await h.lead.whenIdle()
  expect(h.results.find(row => row.name === 'wait_agent')!.result.isError).toBe(true)
  expect(h.child!.status).toBe('running')
  expect(h.control.diagnostics.active).toBe(0)
})

it('host compatibility: generic send/direct inbox mutation/other Session never trigger Lead wake', async () => {
  const h = await compatible('rc2-exclusions')
  await h.startLead()
  const sent = input(), mutated = input()
  h.lead.send(sent, 'next-step', true); h.lead.inbox.append('next-step', mutated)
  h.other.steer(input()); h.child!.steer(input())
  await delay(80)
  expect(h.results.filter(row => row.name === 'wait_agent')).toHaveLength(0)
  expect(h.control.diagnostics.wakes).toBe(0)
  h.lead.steer(input()); await h.lead.whenIdle()
  expect(h.child!.status).toBe('running')
})

it('host compatibility: unloading ends only the current wait with an honest disabled error and restores methods', async () => {
  const h = await compatible('rc2-unload')
  await h.startLead()
  expect(Object.hasOwn(h.lead, 'steer')).toBe(true)
  await h.fiber.dispose(); await h.lead.whenIdle()
  expect(h.results.find(row => row.name === 'wait_agent')!.result).toMatchObject({ isError: true, error: { info: { code: 'TEAM_FLOW_RC2_DISABLED' } } })
  expect(Object.hasOwn(h.lead, 'steer')).toBe(false)
  expect(h.ctx.tools.get('wait_agent', h.lead)).toBeUndefined()
  expect(h.control.diagnostics).toMatchObject({ active: 0, decorated: 0, disabled: true })
  expect(h.child!.status).toBe('running')
  await h.ctx.plugin(officialTeamTools)
  const pending = h.execute('wait_agent', { timeout_ms: 10000 })
  await delay(30); await h.release()
  expect(await pending).toMatchObject({ isError: false, value: { timedOut: false } })
})

it('host compatibility: pending Steer at wrapper entry is not missed', async () => {
  const h = await compatible('rc2-pending')
  const message = input()
  h.ctx.on('tools/execute', async (exec, next) => {
    if (exec.agent === h.lead && exec.name === 'wait_agent') h.lead.steer(message)
    return await next()
  }, { prepend: true })
  h.lead.followup(input())
  await h.lead.whenIdle()
  expect(h.results.find(row => row.name === 'wait_agent')!.result).toMatchObject({ isError: false, value: { reason: 'user-steer' } })
  expect(h.claims.filter(row => row.id === message.id)).toHaveLength(1)
})

it('host compatibility: invalid arguments and no-active-peer keep original results', async () => {
  const h = await compatible('rc2-invalid-nopeer', { child: false })
  expect(await h.execute('wait_agent', { timeout_ms: -1 })).toMatchObject({ isError: true })
  expect(await h.execute('wait_agent', { timeout_ms: 10000 })).toMatchObject({ isError: false, value: { timedOut: false, noProgress: { reason: 'no-active-peer' } } })
  expect(h.control.diagnostics.wakes).toBe(0)
})

it('host compatibility: permission guard denial is retained', async () => {
  const h = await compatible('rc2-guard')
  h.ctx.effect(() => h.lead.ctx.tools.guard(exec => exec.name === 'wait_agent' ? 'synthetic guard denial' : undefined))
  expect(await h.execute('wait_agent', { timeout_ms: 10000 })).toMatchObject({ isError: true, error: { message: 'synthetic guard denial' } })
  expect(h.control.diagnostics.active).toBe(0)
})

it('host compatibility: expanded success schema still rejects bogus result fields', async () => {
  const h = await compatible('rc2-schema')
  h.ctx.on('tools/execute', async (exec, next) => exec.name === 'wait_agent' ? { isError: false, value: { timedOut: false, reason: 'user-steer', forged: true }, content: [] } : await next())
  expect(await h.execute('wait_agent', { timeout_ms: 10000 })).toMatchObject({ isError: true, error: { info: { code: 'INVALID_TOOL_OUTPUT' } } })
})

it('host compatibility: original Team-first result and consecutive Steer ordering are retained', async () => {
  const h = await compatible('rc2-team-first')
  const first = input(), second = input()
  h.ctx.on('tools/execute', async (exec, next) => {
    const result = await next()
    if (exec.name === 'wait_agent' && exec.agent === h.lead && !result.isError) { h.lead.steer(first); h.lead.steer(second) }
    return result
  })
  await h.startLead(); await h.release(); await h.lead.whenIdle()
  expect(h.results.find(row => row.name === 'wait_agent')!.result).toMatchObject({ isError: false, value: { timedOut: false } })
  expect(h.results.find(row => row.name === 'wait_agent')!.result.value).not.toHaveProperty('reason')
  expect(h.claims.filter(row => [first.id, second.id].includes(row.id)).map(row => row.id)).toEqual([first.id, second.id])
})

it('host compatibility: ordinary timeout remains timedOut true', async () => {
  const h = await compatible('rc2-timeout')
  const started = performance.now()
  expect(await h.execute('wait_agent', { timeout_ms: 10000 })).toMatchObject({ isError: false, value: { timedOut: true } })
  expect(performance.now() - started).toBeGreaterThan(9900)
  expect(h.control.diagnostics.wakes).toBe(0)
})

it('host compatibility: copied tool set preserves task CRUD and roster contracts', async () => {
  const h = await compatible('rc2-team-contracts')
  const roster = await h.execute('list_agents', {})
  expect(roster.isError).toBe(false)
  const created = await h.execute('team_task_create', { subject: 'compat task', description: 'synthetic compatibility task' })
  expect(created.isError).toBe(false)
  if (created.isError) throw new Error('task create failed')
  const task = created.value as { id: string; revision: number }
  const read = await h.execute('team_task_get', { task_id: task.id })
  expect(read).toMatchObject({ isError: false, value: { id: task.id, status: 'pending' } })
  const changed = await h.execute('team_task_update', { task_id: task.id, expected_revision: task.revision, action: 'claim' })
  expect(changed.isError).toBe(false)
  expect(await h.execute('team_task_list', {})).toMatchObject({ isError: false })
})
