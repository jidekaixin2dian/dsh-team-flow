import fs from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { selectHost } from '../scripts/hosts.mjs'
const project = process.cwd(), selected = selectHost()
const host = selected.directory, expected = selected.sha
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: host, encoding: 'utf8' })
if (head.status || head.stdout.trim() !== expected) throw new Error('Run npm run setup:host for the selected pinned host')
for (const args of [['diff', '--exit-code'], ['diff', '--cached', '--exit-code']]) if (spawnSync('git', args, { cwd: host }).status) throw new Error('Host sources changed')
fs.mkdirSync('work/dsh-home', { recursive: true })
const home = fs.mkdtempSync(resolve('work/dsh-home/test-'))
const name = home.split(/[\\/]/).at(-1), output = resolve('work/results', `${selected.key}-${name}`)
fs.mkdirSync(output, { recursive: true }); fs.mkdirSync(resolve(host, 'scratch-team-flow'), { recursive: true })
const config = `scratch-team-flow/${name}.config.ts`
fs.copyFileSync('tests/vitest.config.ts', resolve(host, config))
const forwarded = selected.forwarded
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', config, '--reporter=default', '--reporter=json', `--outputFile=${resolve(output, 'vitest.json')}`, ...forwarded], { cwd: host, encoding: 'utf8', env: { ...process.env, TEAM_FLOW_PROJECT: project, TEAM_FLOW_HOST: selected.key, DSH_HOME: home, M2_HOME: home, M2_TIMELINE: resolve(output, 'timeline.jsonl'), DEEPSEEK_API_KEY: '', DSH_TELEMETRY_DISABLED: '1' } })
fs.writeFileSync(resolve(output, 'run.log'), (result.stdout ?? '') + (result.stderr ?? ''))
fs.writeFileSync(resolve(output, 'environment.json'), JSON.stringify({ sha: expected, node: process.version, platform: process.platform, isolatedHome: home, exitCode: result.status }, null, 2) + '\n')
process.stdout.write((result.stdout ?? '') + (result.stderr ?? ''))
console.log(`Evidence: ${output}`)
process.exitCode = result.status ?? 1
