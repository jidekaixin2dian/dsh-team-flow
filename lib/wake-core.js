/** Capability-based plugin compatibility layer. Does not alter installed files. */
import { validateJsonSchemaValue } from '@deepseek-ai/dsh-tools';
import { HarnessError } from '@deepseek-ai/dsh-llm';
import { TOOL_ABORTED } from '@deepseek-ai/dsh-tools';
const STEER_WAKE_CODE = 'TEAM_FLOW_RC2_STEER';
const PLUGIN_DISABLED_CODE = 'TEAM_FLOW_RC2_DISABLED';
const WORKFLOW_DEFERRED = 'TEAM_FLOW_WORKFLOW_DEFERRED';
function canDeferForegroundWorkflow(ctx, exec, agent, pendingSteer) {
    const args = exec.arguments;
    // A nested tool error can unwind run_code and abort its in-flight siblings.
    if (exec.parent !== undefined || exec.signal.aborted || !args || typeof args !== 'object'
        || ('run_in_background' in args && args.run_in_background !== false)
        || !pendingSteer)
        return false;
    const tools = ctx.tools;
    // Older hosts cannot resolve the admitted tool for this execution.
    if (!('executable' in tools) || typeof tools.executable !== 'function')
        return false;
    const workflow = tools.executable('workflow', agent, 'toolSet' in exec ? exec.toolSet : undefined);
    if (!workflow?.output.schema.oneOf?.some(branch => branch.properties?.kind?.const === 'foreground'
        && ['kind', 'runId', 'agentsStarted', 'result'].every(field => branch.required?.includes(field)))
        || validateJsonSchemaValue(workflow.parameters, args, 'arguments').length)
        return false;
    return true;
}
function makeAbortResult(source) {
    return {
        isError: true,
        error: { message: 'tool call aborted', info: { name: 'AbortError', code: TOOL_ABORTED } },
        content: [{ type: 'text', text: 'Error: tool call aborted' }],
        ...(source.additionalContexts ? { additionalContexts: source.additionalContexts } : {}),
    };
}
function makeDisabledResult(source) {
    const message = 'Team Flow plugin disabled during this wait; teammates keep running.';
    return {
        isError: true,
        error: { message, info: { name: 'PluginDisabledError', code: PLUGIN_DISABLED_CODE } },
        content: [{ type: 'text', text: message }],
        ...(source.additionalContexts ? { additionalContexts: source.additionalContexts } : {}),
    };
}
function makeSteerWakeResult(source) {
    return {
        isError: false,
        value: { timedOut: false, reason: 'user-steer' },
        content: [],
        ...(source.additionalContexts ? { additionalContexts: source.additionalContexts } : {}),
    };
}
export function installSteerWake(ctx, observe) {
    const diagnostics = { active: 0, wakes: 0, decorated: 0, disabled: false };
    const receipts = new WeakMap();
    const entries = new Map();
    const controllers = new Set();
    const flights = new Set();
    const record = (event, fields = {}) => observe?.(event, fields);
    const hasPendingSteer = (agent) => {
        const ids = receipts.get(agent);
        return !!ids?.size && Array.isArray(agent.inbox.nextStep) && agent.inbox.nextStep.some(message => ids.has(message.id));
    };
    const attach = (agent) => {
        if (entries.has(agent) || diagnostics.disabled)
            return;
        const original = agent.steer;
        // Unknown delivery shapes preserve the native method and disable wake.
        if (typeof original !== 'function' || !Array.isArray(agent.inbox.nextStep) || typeof agent.whenIdle !== 'function' || !Object.isExtensible(agent)) {
            ctx.logger.warn('DSH Team Flow: unsupported Agent delivery contract; wake disabled for this Agent');
            return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(agent, 'steer');
        const wrapper = function (message) {
            if (this !== agent || diagnostics.disabled || message?.source?.kind !== 'user' || typeof message.id !== 'string')
                return original.call(this, message);
            let ids = receipts.get(agent);
            if (!ids) {
                ids = new Set();
                receipts.set(agent, ids);
            }
            ids.add(message.id);
            try {
                return original.call(this, message);
            }
            catch (error) {
                ids.delete(message.id);
                throw error;
            }
        };
        Object.defineProperty(agent, 'steer', { value: wrapper, configurable: true, writable: true });
        let restored = false;
        const entry = { restore: () => {
                if (restored)
                    return;
                restored = true;
                // Do not overwrite a later decorator installed by someone else.
                if (agent.steer === wrapper) {
                    if (descriptor)
                        Object.defineProperty(agent, 'steer', descriptor);
                    else
                        Reflect.deleteProperty(agent, 'steer');
                }
                receipts.delete(agent);
                diagnostics.decorated--;
            } };
        entries.set(agent, entry);
        diagnostics.decorated++;
    };
    ctx.on('agent/created', ({ agent }) => { attach(agent); });
    ctx.on('agent/disposed', ({ agent }) => {
        const entry = entries.get(agent);
        entry?.restore();
        entries.delete(agent);
    });
    ctx.on('agent/inbox/claimed', ({ agent, message }) => receipts.get(agent)?.delete(message.id));
    ctx.on('agent/inbox/discarded', ({ agent, message }) => receipts.get(agent)?.delete(message.id));
    const triggers = new Map();
    ctx.on('agent/inbox/inserted', ({ agent, message }) => {
        if (!receipts.get(agent)?.has(message.id))
            return;
        record('compat/steer-inserted', { id: message.id });
        for (const trigger of triggers.get(agent) ?? [])
            trigger();
    });
    ctx.on('tools/execute', async (exec, next) => {
        const agent = exec.agent;
        if (diagnostics.disabled || (exec.name !== 'wait_agent' && exec.name !== 'workflow') || !agent
            || ctx.agentTeams.tryMembership(agent)?.role !== 'lead')
            return await next();
        if (exec.name === 'workflow') {
            if (!canDeferForegroundWorkflow(ctx, exec, agent, hasPendingSteer(agent)))
                return await next();
            const message = 'Foreground workflow was deferred before starting. Process the pending user Steer before deciding whether to run it.';
            record('compat/workflow-deferred');
            return { isError: true, error: { message, info: { name: 'WorkflowDeferredError', code: WORKFLOW_DEFERRED } },
                content: [{ type: 'text', text: message }] };
        }
        if (!ctx.agentTeams.listMembers(agent).some(member => member.id !== agent.id && ['running', 'provisioning'].includes(member.status)))
            return await next();
        const definition = ctx.tools.get('wait_agent', agent);
        if (!definition || validateJsonSchemaValue(definition.output.schema, { timedOut: false, reason: 'user-steer' }, 'value').length) {
            ctx.logger.warn('DSH Team Flow: unsupported wait result contract; preserving native wait');
            return await next();
        }
        const controller = new AbortController(), caller = exec.signal;
        const reason = new HarnessError('This single wait ended because user Steer is pending; teammates keep running.', STEER_WAKE_CODE);
        const trigger = () => {
            if (diagnostics.disabled || caller.aborted || controller.signal.aborted || !hasPendingSteer(agent))
                return;
            diagnostics.wakes++;
            controller.abort(reason);
            record('compat/wake');
        };
        let group = triggers.get(agent);
        if (!group) {
            group = new Set();
            triggers.set(agent, group);
        }
        group.add(trigger);
        controllers.add(controller);
        diagnostics.active++;
        exec.signal = AbortSignal.any([caller, controller.signal]);
        const flight = (async () => {
            try {
                const body = next();
                trigger();
                const result = await body;
                if (caller.aborted)
                    return makeAbortResult(result);
                // Plugin disposal ends this wait, without acknowledging a Steer.
                if (diagnostics.disabled && controller.signal.aborted)
                    return makeDisabledResult(result);
                if (!result.isError || controller.signal.reason !== reason || result.error.info?.code !== STEER_WAKE_CODE)
                    return result;
                return makeSteerWakeResult(result);
            }
            finally {
                group.delete(trigger);
                if (!group.size)
                    triggers.delete(agent);
                controllers.delete(controller);
                exec.signal = caller;
                diagnostics.active--;
                record('compat/settled', { ...diagnostics });
            }
        })();
        flights.add(flight);
        try {
            return await flight;
        }
        finally {
            flights.delete(flight);
        }
    });
    ctx.effect(() => async () => {
        diagnostics.disabled = true;
        for (const controller of controllers)
            controller.abort(new HarnessError('Team Flow plugin disabled', PLUGIN_DISABLED_CODE));
        triggers.clear();
        for (const entry of entries.values())
            entry.restore();
        // Await the bodies, without abandoning a promise or cancelling an Agent/teammate.
        await Promise.allSettled(flights);
        entries.clear();
    });
    for (const agent of ctx.agents.list())
        attach(agent);
    return { diagnostics };
}
