import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { applyEntryPatches } from '@deepseek-ai/cordis-plugin-include'

const require = createRequire(resolve(process.cwd(), 'package.json'))
const { load } = require('js-yaml')
const official = load(readFileSync('packages/experimental/agent-team-profile/cordis.patch.yml', 'utf8'))
const plugin = load(readFileSync(resolve(process.env.TEAM_FLOW_PROJECT!, 'cordis.patch.yml'), 'utf8'))
const base = ['tool-subagent-control', 'tool-subagent-list-agents', 'tool-subagent', 'tool-subagent-fork'].map(id => ({ id, name: id }))
const compose = (enabled: boolean) => applyEntryPatches(base, structuredClone([...official, ...(enabled ? plugin : [])]), () => {})

it('bundle activation, disable and re-enable use official patch composition without mutating the stock layer', () => {
  const stock = compose(false)
  const enabled = compose(true)
  expect(enabled.find(row => row.id === 'tool-agent-team')).toMatchObject({ disabled: true, name: '@deepseek-ai/dsh-experimental-tool-agent-team', config: { freshProvider: 'spawn', forkProvider: 'fork' } })
  expect(enabled.filter(row => row.id === 'dsh-team-flow-continuous')).toHaveLength(1)
  expect(compose(false)).toEqual(stock)
  expect(stock.find(row => row.id === 'tool-agent-team')?.disabled).not.toBe(true)
  expect(compose(true)).toEqual(enabled)
})
