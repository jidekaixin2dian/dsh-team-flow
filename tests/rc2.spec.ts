import { expect, it } from 'vitest'
import * as officialTeamTools from '@deepseek-ai/dsh-experimental-tool-agent-team'
import * as compat from '../lib/index.js'
import { setup, input } from './harness.ts'

// The interrupt=false option arrived in 0.2.1-rc.2 and carries into later hosts.
it.skipIf(!['rc2', 'rc3'].includes(process.env.TEAM_FLOW_HOST))('rc.2+ keeps the host interrupt=false option while Steer still wakes one wait', async () => {
  expect(compat.Config).toBe(officialTeamTools.Config)
  const h = await setup('rc2-interrupt-disabled', { toolTeam: false, prepare: async ctx => {
    await ctx.plugin(compat, { interrupt: false })
  } })
  expect(h.ctx.tools.get('interrupt_agent', h.lead)).toBeUndefined()
  expect(h.ctx.tools.get('wait_agent', h.lead)).toBeDefined()
  await h.startLead()
  const steer = input()
  h.lead.steer(steer)
  await expect.poll(() => h.results.filter(row => row.name === 'wait_agent').length).toBe(1)
  expect(h.results.find(row => row.name === 'wait_agent')?.result).toMatchObject({ isError: false, value: { timedOut: false, reason: 'user-steer' } })
  await expect.poll(() => h.claims.filter(row => row.agent === h.lead && row.id === steer.id).length).toBe(1)
  expect(h.child?.status).toBe('running')
})
