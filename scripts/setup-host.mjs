import fs from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
const matrix = {
  alpha1: { tag: 'dsh-v0.2.1-alpha.1', sha: '5badb15009ae1756c3afe0ae0cef1faafc290ccc' },
  alpha2: { tag: 'dsh-v0.2.1-alpha.2', sha: 'd743267388641bc76f17c45ce8b4c231aed1d32c' },
}
const key = process.argv.includes('--alpha1') ? 'alpha1' : 'alpha2', host = matrix[key]
const directory = resolve('work', key)
function run(program, args, cwd = process.cwd()) {
  const result = spawnSync(program, args, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } })
  if (result.status !== 0) throw new Error(`${program} failed with ${result.status}`)
}
fs.mkdirSync('work', { recursive: true })
if (!fs.existsSync(directory)) run('git', ['clone', '--filter=blob:none', '--depth', '1', '--branch', host.tag, 'https://github.com/deepseek-ai/deepseek-harness.git', directory])
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8' })
if (head.status || head.stdout.trim() !== host.sha) throw new Error('Host does not match the pinned public commit')
run('git', ['diff', '--exit-code'], directory)
run('git', ['diff', '--cached', '--exit-code'], directory)
const manager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
// Windows .cmd requires cmd.exe; static arguments only, no interpolated shell text.
const args = ['install', '--frozen-lockfile', '--ignore-scripts', '--filter', '@deepseek-ai/dsh-root', '--filter', '@deepseek-ai/dsh-experimental-tool-agent-team...', '--filter', '@deepseek-ai/dsh-agent-loop-testkit...', '--filter', '@deepseek-ai/dsh-ptc-runtime-node...']
if (process.platform === 'win32') run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', manager, ...args], directory)
else run(manager, args, directory)
console.log(`Ready: ${key} / ${host.sha}`)
