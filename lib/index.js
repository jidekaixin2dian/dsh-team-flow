import * as TeamTools from '@deepseek-ai/dsh-experimental-tool-agent-team';
import { install as installWake } from './wake-core.js';
import { decorateRegistrations } from './register.js';
export const name = 'dsh-team-flow-continuous';
export const inject = ['agents', 'agentTeams', 'tools', 'systemPrompt'];
export const Config = TeamTools.Config;
export async function apply(ctx, config = {}) { await install(ctx, config); }
export async function install(ctx, config = {}, observe) {
    // Startup must precede the stock tool component; existing readonly definitions stay untouched.
    if (ctx.agents.list().some(agent => ctx.agentTeams.tryMembership(agent) && ctx.tools.get('wait_agent', agent)))
        throw new Error('Team Flow must replace the tool-agent-team component; duplicate tool owners are unsupported');
    const restore = decorateRegistrations(ctx);
    ctx.effect(() => restore);
    const control = installWake(ctx, config, observe);
    await ctx.plugin(TeamTools, config);
    return control;
}
