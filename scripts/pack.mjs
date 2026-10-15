import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
const npm = process.env.npm_execpath
if (!npm?.endsWith('npm-cli.js')) throw new Error('Run npm run pack:local')
const build = spawnSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' })
if (build.status) throw new Error('Build failed')
mkdirSync('dist', { recursive: true })
const result = spawnSync(process.execPath, [npm, 'pack', '--ignore-scripts', '--json', '--pack-destination', 'dist'], { encoding: 'utf8' })
if (result.status) throw new Error(result.stderr)
const parsed = JSON.parse(result.stdout), report = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0]
const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
if (report.name !== manifest.name) throw new Error('Unexpected archive')
const allowed = new Set(['package.json', 'cordis.patch.yml', 'icon.svg', 'README.md', 'README.en.md', 'LICENSE', 'SECURITY.md', ...['index', 'register', 'wake-core'].flatMap(n => [`lib/${n}.js`, `lib/${n}.d.ts`])])
if (report.files.some(f => !allowed.has(f.path)) || report.files.length !== allowed.size) throw new Error('Archive whitelist mismatch')
const file = resolve('dist', report.filename), sha256 = createHash('sha256').update(readFileSync(file)).digest('hex')
writeFileSync('dist/SHA256SUMS.txt', `${sha256}  ${report.filename}\n`)
writeFileSync('dist/package-audit.json', JSON.stringify({ filename: report.filename, sha256, bytes: report.size, files: report.files.map(f => f.path), publishedToNpm: false }, null, 2) + '\n')
console.log(JSON.stringify({ filename: report.filename, sha256, bytes: report.size }))
