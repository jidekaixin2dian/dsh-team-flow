import { expect, it } from 'vitest'
import * as officialTeamTools from '@deepseek-ai/dsh-experimental-tool-agent-team'
import { decorateRegistrations } from '../src/register.ts'
import { setup } from './harness.ts'
it('public registration decoration reaches agent scopes and preserves the original definition', async () => {
  let restore!: () => void, originalDescriptor
  const h = await setup('register-probe', { spike: false, toolTeam: false, prepare: async ctx => {
    originalDescriptor = Object.getOwnPropertyDescriptor(ctx.tools, 'register')
    restore = decorateRegistrations(ctx)
    await ctx.plugin(officialTeamTools)
  } })
  expect(h.ctx.tools.get('wait_agent', h.lead)!.output.schema).toHaveProperty('oneOf')
  expect(await h.execute('team_task_list', {})).toMatchObject({ isError: false })
  restore()
  expect(Object.getOwnPropertyDescriptor(h.ctx.tools, 'register')).toEqual(originalDescriptor)
  expect(h.ctx.tools.register.name).toBe('register')
})
