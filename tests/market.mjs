// Exercise pinned, unmodified market code. No real DSH profile is read or written.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const marketSha = 'b8948c1aee21a5a10cf78266aadd0b49f8d2515c'
const project = process.cwd(), manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1] }
const market = resolve(arg('--market-path') ?? 'work/market')
const npm = process.env.npm_execpath
if (!npm?.endsWith('npm-cli.js')) throw new Error('Run npm run test:market')
function run(program, args, cwd) {
  const result = spawnSync(program, args, { cwd, encoding: 'utf8', env: { ...process.env, CI: 'true', DSH_TELEMETRY_DISABLED: '1' } })
  if (result.status !== 0) throw new Error(`${program} failed (${result.status})\n${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  return result.stdout.trim()
}
fs.mkdirSync('work/dsh-home', { recursive: true })
const home = fs.mkdtempSync(resolve('work/dsh-home/market-'))
process.env.DSH_HOME = home
if (!fs.existsSync(market)) {
  fs.mkdirSync(market, { recursive: true })
  run('git', ['init', '--quiet'], market)
  run('git', ['fetch', '--depth', '1', 'https://github.com/dsh-market/dsh-market.git', marketSha], market)
  run('git', ['checkout', '--detach', 'FETCH_HEAD'], market)
}
assert.equal(run('git', ['rev-parse', 'HEAD'], market), marketSha)
run('git', ['diff', '--exit-code'], market)
run('git', ['diff', '--cached', '--exit-code'], market)
run(process.execPath, [npm, 'ci', '--omit=dev', '--ignore-scripts'], market)
const mod = file => import(pathToFileURL(join(market, 'src', file)).href)
const { installTargetFor, sourceFallbackFor } = await mod('sources.ts')
const { carrierDisableIds, foreignRowIds, rowIdsForPackage, disableRow, enableRow } = await mod('patch.ts')
const { hasLoadableEntry, readProfileBundles, removeProfileBundle, addProfileBundle } = await mod('profile.ts')
const { readBundleRules, validateOrder } = await mod('order.ts')
const { parsePatchFile } = await mod('check.ts')
const entry = { url: 'https://github.com/jidekaixin2dian/dsh-team-flow', tarball: `https://github.com/jidekaixin2dian/dsh-team-flow/releases/download/v${manifest.version}/${manifest.name}-${manifest.version}.tgz` }
assert.equal(installTargetFor(entry), entry.tarball)
assert.equal(sourceFallbackFor(entry, entry.tarball), 'github:jidekaixin2dian/dsh-team-flow')
assert.equal(installTargetFor({ ...entry, tarball: 'https://github.com/someone/else/releases/download/v1/x.tgz' }), 'github:jidekaixin2dian/dsh-team-flow')
const rows = []
const archive = resolve('dist', `${manifest.name}-${manifest.version}.tgz`)
assert.ok(fs.existsSync(archive), 'Run npm run pack:local first')
for (const manager of ['11.7.0', '11.28.5']) {
  const profile = join(home, 'profiles', `pnpm-${manager}`)
  fs.mkdirSync(profile, { recursive: true })
  const team = '@deepseek-ai/dsh-experimental-agent-team-profile'
  fs.writeFileSync(join(profile, 'package.json'), JSON.stringify({ private: true, dsh: { profile: { bundles: [team] } } }))
  fs.writeFileSync(join(profile, '.npmrc'), 'node-linker=hoisted\nauto-install-peers=false\n')
  assert.equal(run(process.execPath, [npm, 'exec', '--yes', `--package=pnpm@${manager}`, '--', 'pnpm', '--version'], profile), manager)
  const spec = arg('--source-spec') ?? arg('--release-url') ?? `file:${archive}`
  let installedTarget = spec, fallbackReason
  const install = target => run(process.execPath, [npm, 'exec', '--yes', `--package=pnpm@${manager}`, '--', 'pnpm', 'add', '--ignore-scripts', '--store-dir', join(home, 'pnpm-store', manager), '--save-prod', target], profile)
  try { install(spec) } catch (error) {
    if (!arg('--release-url') || !error.message.includes('ERR_PNPM_MISSING_TARBALL_INTEGRITY')) throw error
    installedTarget = sourceFallbackFor(entry, spec)
    if (!installedTarget) throw error
    fallbackReason = 'ERR_PNPM_MISSING_TARBALL_INTEGRITY'
    install(installedTarget) // Same profile, using the market's actual fallback selection.
  }
  const installed = join(profile, 'node_modules', manifest.name)
  const installedManifest = JSON.parse(fs.readFileSync(join(installed, 'package.json'), 'utf8'))
  assert.equal(installedManifest.version, manifest.version)
  assert.ok(hasLoadableEntry(profile, manifest.name))
  for (const name of ['index', 'register', 'wake-core']) {
    const hash = path => createHash('sha256').update(fs.readFileSync(path)).digest('hex')
    assert.equal(hash(join(installed, `lib/${name}.js`)), hash(resolve(project, `lib/${name}.js`)))
  }
  assert.equal(Object.keys(installedManifest.dependencies ?? {}).length, 0)
  assert.ok(!fs.existsSync(join(profile, 'node_modules/@deepseek-ai')), 'No duplicate host runtime may be installed')
  assert.equal(installedManifest.engines.dsh, '>=0.2.0-rc.2')
  assert.deepEqual(carrierDisableIds(profile, manifest.name), ['tool-agent-team'])
  assert.deepEqual(foreignRowIds(profile, manifest.name), ['tool-agent-team'])
  assert.deepEqual(rowIdsForPackage({ loader: { entries: () => [] } }, profile, manifest.name), [manifest.name])
  assert.equal(addProfileBundle(profile, manifest.name), true)
  const rules = readBundleRules(profile)
  assert.deepEqual(rules.find(rule => rule.name === manifest.name)?.after, [team])
  assert.deepEqual(validateOrder(readProfileBundles(profile), rules), [])
  assert.equal(validateOrder([manifest.name, team], rules).length, 1)
  const patch = join(profile, 'cordis.patch.yml')
  fs.writeFileSync(patch, '[]\n')
  assert.equal(removeProfileBundle(profile, manifest.name), true)
  assert.equal((await disableRow(patch, manifest.name)).ok, true)
  assert.deepEqual(readProfileBundles(profile), [team])
  assert.deepEqual(parsePatchFile(patch), [{ id: manifest.name, disabled: true }])
  assert.equal(addProfileBundle(profile, manifest.name), true)
  assert.equal((await enableRow(patch, manifest.name)).ok, true)
  assert.deepEqual(readProfileBundles(profile), [team, manifest.name])
  assert.deepEqual(parsePatchFile(patch), []) // enableRow removes its redundant override.
  assert.ok(!fs.readFileSync(patch, 'utf8').includes('tool-agent-team'), 'Market must not persist a foreign disable')
  rows.push({ pnpm: manager, install: spec.startsWith('file:') ? 'local prebuilt tarball' : installedTarget, ...(fallbackReason ? { requested: spec, fallbackReason } : {}), packageVersion: installedManifest.version, loadable: true, duplicateHostPackages: false, orderAndCarrierToggle: 'passed' })
}
fs.mkdirSync('work/results', { recursive: true })
fs.writeFileSync('work/results/market.json', JSON.stringify({ marketSha, marketVersion: JSON.parse(fs.readFileSync(join(market, 'package.json'), 'utf8')).version, node: process.version, tests: rows, scope: 'Real pnpm installs and market helper calls; not market HTTP/UI or complete Desktop E2E.' }, null, 2) + '\n')
console.log(JSON.stringify({ marketSha, tests: rows }, null, 2))
