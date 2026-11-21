import { installSteerWake } from './wake-core.js';
import { installWaitResultAdapter } from './register.js';
async function loadTeamTools() {
    for (const id of ['@deepseek-ai/dsh-tool-agent-team', '@deepseek-ai/dsh-experimental-tool-agent-team']) {
        try {
            const mod = await import(id);
            if (mod && typeof mod.apply === 'function')
                return mod;
        }
        catch (error) {
            const code = error?.code;
            const message = error instanceof Error ? error.message : String(error);
            if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND' || message.includes('Could not resolve'))
                continue;
            throw error;
        }
    }
    throw new Error('Team Flow requires @deepseek-ai/dsh-tool-agent-team or @deepseek-ai/dsh-experimental-tool-agent-team');
}
const TeamTools = await loadTeamTools();
const LEGACY_CONFIG_KEYS = new Set(['interrupt', 'freshProvider', 'forkProvider']);
export const name = 'dsh-team-flow-continuous';
export const inject = Array.from(new Set([
    'agents', 'agentTeams', 'tools', 'systemPrompt',
    ...(Array.isArray(TeamTools.inject) ? TeamTools.inject : []),
]));
export const Config = TeamTools.Config;
export async function apply(ctx, config = {}) { await install(ctx, config); }
export async function install(ctx, config = {}, observe) {
    const teams = ctx.agentTeams;
    const legacyWait = typeof teams?.tryMembership === 'function';
    if (legacyWait) {
        // Startup must precede the stock tool component; existing readonly definitions stay untouched.
        if (ctx.agents.list().some(agent => teams.tryMembership(agent) && ctx.tools.get('wait_agent', agent))) {
            throw new Error('Team Flow must replace the tool-agent-team component; duplicate tool owners are unsupported');
        }
        const restore = installWaitResultAdapter(ctx);
        ctx.effect(() => restore);
    }
    const control = installSteerWake(ctx, observe);
    // Older profiles upgrading to 0.2.2-rc.3+ may still carry removed TeamTools config keys.
    const forwarded = legacyWait
        ? config
        : Object.fromEntries(Object.entries(config).filter(([key]) => !LEGACY_CONFIG_KEYS.has(key)));
    await ctx.plugin(TeamTools, forwarded);
    return control;
}
