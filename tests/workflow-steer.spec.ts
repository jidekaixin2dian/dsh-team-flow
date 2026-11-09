import { expect, it, vi } from 'vitest'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import type { WorkflowResult, WorkflowRun, WorkflowStartRequest } from '@deepseek-ai/dsh-workflow'
import { toolCallResponse } from 'm1-upstream/packages/core/agent-loop/tests/mock-adapter.ts'
import * as compat from '../lib/index.js'
import { input, setup } from './harness.ts'

it.runIf(process.env.TEAM_FLOW_HOST === 'rc1')('defers the next foreground workflow without stopping active work', async () => {
  const [{ WorkflowEngine, WorkflowRunId }, WorkflowTool, { default: LocalJobs }, ToolJobs] = await Promise.all([
    import('@deepseek-ai/dsh-workflow'),
    import('@deepseek-ai/dsh-tool-workflow'),
    import('@deepseek-ai/dsh-jobs-local'),
    import('@deepseek-ai/dsh-tool-jobs'),
  ])
  const active = Promise.withResolvers<WorkflowResult>()
  const completed: WorkflowResult = { stopReason: 'completed', agentsStarted: 0, value: 1 }
  const calls: WorkflowStartRequest[] = []
  const cancelled = vi.fn()
  class StubEngine extends WorkflowEngine {
    start(request: WorkflowStartRequest): WorkflowRun {
      calls.push(request)
      return {
        id: WorkflowRunId(`run-${calls.length}`),
        meta: request.meta,
        result: request.meta.name === 'first' ? active.promise : Promise.resolve(completed),
        cancel: cancelled,
        async dispose() {},
      }
    }
  }
  const args = (name: string) => ({ script: 'return 1', meta: { name, description: 'Test workflow' } })
  const first = toolCallResponse('workflow-1', 'workflow', args('first'))
  const second = toolCallResponse('workflow-2', 'workflow', args('second'))
  const h = await setup('workflow-steer', {
    toolTeam: false,
    leadResponse: [...first.slice(0, -2), ...second.map(chunk => 'index' in chunk ? { ...chunk, index: 1 } : chunk)],
    prepare: async ctx => {
      await ctx.plugin(LocalJobs)
      await ctx.plugin(ToolJobs)
      await ctx.plugin(StubEngine)
      await ctx.plugin(WorkflowTool)
      await ctx.plugin(compat)
    },
  })
  const steer = input()
  h.lead.followup(input())
  try {
    await expect.poll(() => calls.map(call => call.meta.name)).toEqual(['first'])
    h.lead.inject(input())
    h.lead.followup(input())
    expect(await h.execute('workflow', args('ordinary'))).toMatchObject({ isError: false })

    h.lead.steer(steer)
    expect(await h.execute('workflow', { ...args('explicit-foreground'), run_in_background: false }))
      .toMatchObject({ isError: true, error: { info: { code: 'TEAM_FLOW_WORKFLOW_DEFERRED' } } })
    expect(await h.execute('workflow', { ...args('background'), run_in_background: true }))
      .toMatchObject({ isError: false, value: { kind: 'background' } })
    expect(await h.execute('workflow', { meta: args('invalid').meta }))
      .toMatchObject({ isError: true, error: { info: { code: 'INVALID_ARGS' } } })
    const signal = new AbortController().signal
    const lift = h.lead.ctx.tools.restrict({ deny: ['workflow'] })
    const toolSet = await h.ctx.tools.resolve({ agent: h.lead, modelSelection: { provider: 'mock', model: 'mock' }, signal })
      .finally(lift)
    try {
      expect(h.ctx.tools.get('workflow', h.lead)).toBeDefined()
      const batch = await h.ctx.tools.execute({
        agent: h.lead, signal, toolSet,
        calls: [{ id: ToolCallId('unavailable'), name: 'workflow', arguments: JSON.stringify(args('unavailable')) }],
      })
      expect(batch.results[0]?.result)
        .toMatchObject({ isError: true, error: { info: { code: 'UNKNOWN_TOOL' } } })
    } finally {
      toolSet.dispose()
    }
    expect(calls[0]?.signal?.aborted).toBe(false)
    expect(h.child?.status).toBe('running')
    expect(h.claims.some(claim => claim.id === steer.id)).toBe(false)
  } finally {
    active.resolve(completed)
  }
  await h.lead.whenIdle()
  expect(calls.map(call => call.meta.name)).toEqual(['first', 'ordinary', 'background'])
  expect(cancelled).not.toHaveBeenCalled()
  expect(h.results.filter(row => row.name === 'workflow').at(-1)?.result).toMatchObject({
    isError: true,
    error: { info: { code: 'TEAM_FLOW_WORKFLOW_DEFERRED' } },
  })
  expect(h.claims.filter(claim => claim.id === steer.id)).toHaveLength(1)
  expect(await h.execute('workflow', args('after-steer'))).toMatchObject({ isError: false })
})
