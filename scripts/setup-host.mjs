import fs from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { selectHost } from './hosts.mjs'
const host = selectHost(), { key, directory } = host
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
const filters = key === 'rc5'
  ? ['@deepseek-ai/dsh-root', '@deepseek-ai/dsh-tool-agent-team...', '@deepseek-ai/dsh-tool-subagent-control...', '@deepseek-ai/dsh-tool-workflow...', '@deepseek-ai/dsh-jobs-local...', '@deepseek-ai/dsh-tool-jobs...', '@deepseek-ai/dsh-agent-loop-testkit...', '@deepseek-ai/dsh-ptc-runtime-node...']
  : ['@deepseek-ai/dsh-root', '@deepseek-ai/dsh-experimental-tool-agent-team...', '@deepseek-ai/dsh-agent-loop-testkit...', '@deepseek-ai/dsh-ptc-runtime-node...']
const args = ['install', '--frozen-lockfile', '--ignore-scripts', ...filters.flatMap(name => ['--filter', name])]
if (process.platform === 'win32') run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', manager, ...args], directory)
else run(manager, args, directory)
console.log(`Ready: ${key} / ${host.sha}`)
