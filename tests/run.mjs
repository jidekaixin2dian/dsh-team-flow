import fs from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
const project = process.cwd(), alpha1 = process.argv.includes('--alpha1')
const hostIndex = process.argv.indexOf('--host-path')
const host = hostIndex >= 0 ? resolve(process.argv[hostIndex + 1]) : resolve('work', alpha1 ? 'alpha1' : 'alpha2')
const expected = alpha1 ? '5badb15009ae1756c3afe0ae0cef1faafc290ccc' : 'd743267388641bc76f17c45ce8b4c231aed1d32c'
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: host, encoding: 'utf8' })
if (head.status || head.stdout.trim() !== expected) throw new Error('Run npm run setup:host for the selected pinned host')
for (const args of [['diff', '--exit-code'], ['diff', '--cached', '--exit-code']]) if (spawnSync('git', args, { cwd: host }).status) throw new Error('Host sources changed')
fs.mkdirSync('work/dsh-home', { recursive: true })
const home = fs.mkdtempSync(resolve('work/dsh-home/test-'))
const name = home.split(/[\\/]/).at(-1), output = resolve('work/results', (alpha1 ? 'alpha1-' : 'alpha2-') + name)
fs.mkdirSync(output, { recursive: true }); fs.mkdirSync(resolve(host, 'scratch-team-flow'), { recursive: true })
const config = `scratch-team-flow/${name}.config.ts`
fs.copyFileSync('tests/vitest.config.ts', resolve(host, config))
const forwarded = process.argv.slice(2).filter((arg, index) => arg !== '--alpha1' && arg !== '--host-path' && index + 2 !== hostIndex + 1)
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', config, '--reporter=default', '--reporter=json', `--outputFile=${resolve(output, 'vitest.json')}`, ...forwarded], { cwd: host, encoding: 'utf8', env: { ...process.env, TEAM_FLOW_PROJECT: project, DSH_HOME: home, M2_HOME: home, M2_TIMELINE: resolve(output, 'timeline.jsonl'), DEEPSEEK_API_KEY: '', DSH_TELEMETRY_DISABLED: '1' } })
fs.writeFileSync(resolve(output, 'run.log'), (result.stdout ?? '') + (result.stderr ?? ''))
fs.writeFileSync(resolve(output, 'environment.json'), JSON.stringify({ sha: expected, node: process.version, platform: process.platform, isolatedHome: home, exitCode: result.status }, null, 2) + '\n')
process.stdout.write((result.stdout ?? '') + (result.stderr ?? ''))
console.log(`Evidence: ${output}`)
process.exitCode = result.status ?? 1
