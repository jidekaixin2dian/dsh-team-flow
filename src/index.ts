/** Preserve the host's current Team tools; adapt only missing wait capabilities. */
import type { Context } from '@deepseek-ai/cordis'
import type z from '@deepseek-ai/schemastery'
import { installSteerWake, type Diagnostics } from './wake-core.js'
import { installWaitResultAdapter } from './register.js'

type TeamToolsPlugin = {
  readonly inject?: readonly string[]
  readonly Config: z<Record<string, unknown>>
  readonly apply: (ctx: Context, config?: Record<string, unknown>) => unknown
}

async function loadTeamTools(): Promise<TeamToolsPlugin> {
  for (const id of ['@deepseek-ai/dsh-tool-agent-team', '@deepseek-ai/dsh-experimental-tool-agent-team']) {
    try {
      return await import(id) as TeamToolsPlugin
    } catch (error) {
      if ((error as { code?: string })?.code !== 'ERR_MODULE_NOT_FOUND') throw error
    }
  }
  throw new Error('Team Flow requires @deepseek-ai/dsh-tool-agent-team or @deepseek-ai/dsh-experimental-tool-agent-team')
}

const TeamTools = await loadTeamTools()
const LEGACY_CONFIG_KEYS = new Set(['interrupt', 'freshProvider', 'forkProvider'])

export const name = 'dsh-team-flow-continuous'
export const inject: string[] = Array.from(new Set([
  'agents', 'agentTeams', 'tools', 'systemPrompt',
  ...(Array.isArray(TeamTools.inject) ? TeamTools.inject : []),
]))
export const Config: z<Record<string, unknown>> = TeamTools.Config
export async function apply(ctx: Context, config: Record<string, unknown> = {}): Promise<void> { await install(ctx, config) }
export async function install(ctx: Context, config: Record<string, unknown> = {}, observe?: (event: string, fields?: object) => void): Promise<{ diagnostics: Diagnostics }> {
  const teams = (ctx as unknown as { agentTeams?: { tryMembership?: (agent: unknown) => unknown } }).agentTeams
  const legacyWait = typeof teams?.tryMembership === 'function'
  if (legacyWait) {
    // Startup must precede the stock tool component; existing readonly definitions stay untouched.
    if (ctx.agents.list().some(agent => teams.tryMembership!(agent) && ctx.tools.get('wait_agent', agent))) {
      throw new Error('Team Flow must replace the tool-agent-team component; duplicate tool owners are unsupported')
    }
    const restore = installWaitResultAdapter(ctx)
    ctx.effect(() => restore)
  }
  const control = installSteerWake(ctx, observe)
  // Older profiles upgrading to 0.2.2-rc.3+ may still carry removed TeamTools config keys.
  const forwarded = legacyWait
    ? config
    : Object.fromEntries(Object.entries(config).filter(([key]) => !LEGACY_CONFIG_KEYS.has(key)))
  await ctx.plugin(TeamTools as Parameters<Context['plugin']>[0], forwarded)
  return control
}
