/** Preserve the host's current Team tools; adapt only missing wait capabilities. */
import type { Context } from '@deepseek-ai/cordis'
import * as TeamTools from '@deepseek-ai/dsh-experimental-tool-agent-team'
import { install as installWake, type Diagnostics } from './wake-core.js'
import { decorateRegistrations } from './register.js'
export const name = 'dsh-team-flow-continuous'
export const inject: string[] = ['agents', 'agentTeams', 'tools', 'systemPrompt']
export const Config: typeof TeamTools.Config = TeamTools.Config
export async function apply(ctx: Context, config: TeamTools.Config = {}): Promise<void> { await install(ctx, config) }
export async function install(ctx: Context, config: TeamTools.Config = {}, observe?: (event: string, fields?: object) => void): Promise<{ diagnostics: Diagnostics }> {
  // Startup must precede the stock tool component; existing readonly definitions stay untouched.
  if (ctx.agents.list().some(agent => ctx.agentTeams.tryMembership(agent) && ctx.tools.get('wait_agent', agent))) throw new Error('Team Flow must replace the tool-agent-team component; duplicate tool owners are unsupported')
  const restore = decorateRegistrations(ctx)
  ctx.effect(() => restore)
  const control = installWake(ctx, config, observe)
  await ctx.plugin(TeamTools, config)
  return control
}
