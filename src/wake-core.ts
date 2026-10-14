/** Capability-based plugin compatibility layer. Does not alter installed files. */
import z from '@deepseek-ai/schemastery'
import { validateJsonSchemaValue } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-experimental-agent-team'
import { HarnessError } from '@deepseek-ai/dsh-llm'
import { TOOL_ABORTED, type ToolExecutionResult } from '@deepseek-ai/dsh-tools'


export const name = 'dsh-team-flow-rc2'
export const inject: string[] = ['agents', 'agentTeams', 'tools', 'systemPrompt']
export interface Config { freshProvider?: string; forkProvider?: string }
export interface Diagnostics { active: number; wakes: number; decorated: number; disabled: boolean }
export const Config: z<Config> = z.object({ freshProvider: z.string().default('spawn'), forkProvider: z.string().default('fork') })
const SIGNAL = 'TEAM_FLOW_RC2_STEER'
const DISABLED = 'TEAM_FLOW_RC2_DISABLED'
export function apply(ctx: Context, config: Config = {}): void { install(ctx, config) }

export function install(ctx: Context, _config: Config = {}, observe?: (event: string, fields?: object) => void): { diagnostics: Diagnostics } {
  const diagnostics = { active: 0, wakes: 0, decorated: 0, disabled: false }
  const receipts = new WeakMap<Agent, Set<string>>()
  const entries = new Map<Agent, { restore: () => void; tools: (() => void) | undefined }>()
  const controllers = new Set<AbortController>()
  const flights = new Set<Promise<unknown>>()
  const record = (event: string, fields: object = {}) => observe?.(event, fields)
  const attach = (agent: Agent) => {
    if (entries.has(agent) || diagnostics.disabled) return
    const original = agent.steer
    // Unknown delivery shapes preserve the native method and disable wake.
    if (typeof original !== 'function' || !Array.isArray(agent.inbox.nextStep) || typeof agent.whenIdle !== 'function' || !Object.isExtensible(agent)) {
      ctx.logger.warn('DSH Team Flow: unsupported Agent delivery contract; wake disabled for this Agent')
      return
    }
    const descriptor = Object.getOwnPropertyDescriptor(agent, 'steer')
    const wrapper: Agent['steer'] = function (this: Agent, message) {
      if (this !== agent || diagnostics.disabled || message?.source?.kind !== 'user' || typeof message.id !== 'string') return original.call(this, message)
      let ids = receipts.get(agent)
      if (!ids) { ids = new Set(); receipts.set(agent, ids) }
      ids.add(message.id)
      try { return original.call(this, message) }
      catch (error) { ids.delete(message.id); throw error }
    }
    Object.defineProperty(agent, 'steer', { value: wrapper, configurable: true, writable: true })
    let restored = false
    const entry = { restore: () => {
      if (restored) return
      restored = true
      // Do not overwrite a later decorator installed by someone else.
      if (agent.steer === wrapper) {
        if (descriptor) Object.defineProperty(agent, 'steer', descriptor)
        else Reflect.deleteProperty(agent, 'steer')
      }
      receipts.delete(agent)
      diagnostics.decorated--
    }, tools: undefined as (() => void) | undefined }
    entries.set(agent, entry)
    diagnostics.decorated++
  }
  ctx.on('agent/created', ({ agent }) => { attach(agent) })
  ctx.on('agent/disposed', ({ agent }) => {
    const entry = entries.get(agent)
    entry?.tools?.(); entry?.restore(); entries.delete(agent)
  })
  ctx.on('agent/inbox/claimed', ({ agent, message }) => receipts.get(agent)?.delete(message.id))
  ctx.on('agent/inbox/discarded', ({ agent, message }) => receipts.get(agent)?.delete(message.id))
  const triggers = new Map<Agent, Set<() => void>>()
  ctx.on('agent/inbox/inserted', ({ agent, message }) => {
    if (!receipts.get(agent)?.has(message.id)) return
    record('compat/steer-inserted', { id: message.id })
    for (const trigger of triggers.get(agent) ?? []) trigger()
  })
  ctx.on('tools/execute', async (exec, next): Promise<ToolExecutionResult> => {
    const agent = exec.agent
    if (diagnostics.disabled || exec.name !== 'wait_agent' || !agent || ctx.agentTeams.tryMembership(agent)?.role !== 'lead') return await next()
    if (!ctx.agentTeams.listMembers(agent).some(member => member.id !== agent.id && ['running', 'provisioning'].includes(member.status))) return await next()
    const definition = ctx.tools.get('wait_agent', agent)
    if (!definition || validateJsonSchemaValue(definition.output.schema, {timedOut:false,reason:'user-steer'}, 'value').length) {
      ctx.logger.warn('DSH Team Flow: unsupported wait result contract; preserving native wait')
      return await next()
    }
    const controller = new AbortController(), caller = exec.signal
    const reason = new HarnessError('This single wait ended because user Steer is pending; teammates keep running.', SIGNAL)
    const trigger = () => {
      if (diagnostics.disabled || caller.aborted || controller.signal.aborted || !agent.inbox.nextStep.some(message => receipts.get(agent)?.has(message.id))) return
      diagnostics.wakes++; controller.abort(reason); record('compat/wake')
    }
    let group = triggers.get(agent)
    if (!group) { group = new Set(); triggers.set(agent, group) }
    group.add(trigger); controllers.add(controller); diagnostics.active++
    exec.signal = AbortSignal.any([caller, controller.signal])
    const flight = (async () => {
      try {
        const body = next(); trigger()
        const result = await body
        if (caller.aborted) return { isError: true as const, error: { message: 'tool call aborted', info: { name: 'AbortError', code: TOOL_ABORTED } }, content: [{ type: 'text' as const, text: 'Error: tool call aborted' }], ...(result.additionalContexts ? { additionalContexts: result.additionalContexts } : {}) }
        // Unload owns cancellation of this wait only; report an honest failure, never Steer success.
        if (diagnostics.disabled && controller.signal.aborted) return { isError: true as const, error: { message: 'Team Flow plugin disabled during this wait; teammates keep running.', info: { name: 'PluginDisabledError', code: DISABLED } }, content: [{ type: 'text' as const, text: 'Team Flow plugin disabled during this wait; teammates keep running.' }], ...(result.additionalContexts ? { additionalContexts: result.additionalContexts } : {}) }
        if (!result.isError || controller.signal.reason !== reason || result.error.info?.code !== SIGNAL) return result
        return { isError: false as const, value: { timedOut: false, reason: 'user-steer' }, content: [], ...(result.additionalContexts ? { additionalContexts: result.additionalContexts } : {}) }
      } finally {
        group.delete(trigger); if (!group.size) triggers.delete(agent)
        controllers.delete(controller); exec.signal = caller; diagnostics.active--
        record('compat/settled', { ...diagnostics })
      }
    })()
    flights.add(flight)
    try { return await flight } finally { flights.delete(flight) }
  })
  ctx.effect(() => async () => {
    diagnostics.disabled = true
    for (const controller of controllers) controller.abort(new HarnessError('Team Flow plugin disabled', DISABLED))
    triggers.clear()
    for (const entry of entries.values()) entry.restore()
    // Await the bodies, without abandoning a promise or cancelling an Agent/teammate.
    await Promise.allSettled(flights)
    for (const entry of entries.values()) entry.tools?.()
    entries.clear()
  })
  for (const agent of ctx.agents.list()) attach(agent)
  return { diagnostics }
}
