import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { selectHost } from './hosts.mjs'

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const hostApi = false
const compat = false
const continuous = false
const upstream = selectHost().directory
const require = createRequire(resolve(upstream, 'package.json'))
const ts = require('typescript')
const raw = ts.readConfigFile(resolve(upstream, 'tsconfig.base.json'), ts.sys.readFile)
if (raw.error) throw new Error('Official compiler options unavailable')
const paths = Object.fromEntries(Object.entries(raw.config.compilerOptions.paths).map(([key, values]) => [key, values.map(value => resolve(upstream, value))]))
paths['m1-upstream/*'] = [resolve(upstream, '*')]
paths.vitest = [resolve(upstream, 'node_modules/vitest/dist/index.d.ts')]
// Honor each vendor package's own compiler settings rather than subjecting its
// source to the host's stricter options. Declarations exist only in memory.
const virtualFiles = new Map()
const canonical = file => resolve(file).replaceAll('\\', '/').toLowerCase()
const hostFor = options => {
  const host = ts.createCompilerHost(options)
  const read = host.readFile.bind(host), exists = host.fileExists.bind(host)
  host.readFile = file => virtualFiles.get(canonical(file)) ?? read(file)
  host.fileExists = file => virtualFiles.has(canonical(file)) || exists(file)
  host.directoryExists = directory => [...virtualFiles.keys()].some(file => file.startsWith(canonical(directory) + '/')) || ts.sys.directoryExists(directory)
  host.getSourceFile = (file, languageVersion) => {
    const text = host.readFile(file)
    return text === undefined ? undefined : ts.createSourceFile(file, text, languageVersion, true)
  }
  host.writeFile = (file, text) => { virtualFiles.set(canonical(file), text) }
  return host
}
const diagnostics = []
for (const vendor of ['cosmokit', 'schemastery', 'cordis', 'loader', 'include']) {
  const config = resolve(upstream, `vendor/${vendor}/tsconfig.json`)
  const outDir = resolve(project, `work/m2-virtual-types/${vendor}`)
  const parsed = ts.getParsedCommandLineOfConfigFile(config, {
    paths: { ...paths }, composite: false, incremental: false,
    emitDeclarationOnly: true, declaration: true, declarationMap: false, outDir,
  }, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: error => diagnostics.push(error) })
  if (!parsed) break
  const vendorProgram = ts.createProgram(parsed.fileNames, parsed.options, hostFor(parsed.options))
  const issues = [...parsed.errors, ...ts.getPreEmitDiagnostics(vendorProgram)]
  diagnostics.push(...issues)
  if (issues.length) break
  diagnostics.push(...vendorProgram.emit().diagnostics)
  const name = vendor === 'loader' ? '@deepseek-ai/cordis-plugin-loader' : vendor === 'include' ? '@deepseek-ai/cordis-plugin-include' : `@deepseek-ai/${vendor}`
  paths[name] = [resolve(outDir, 'index.d.ts')]
}
const converted = ts.convertCompilerOptionsFromJson({
  ...raw.config.compilerOptions, paths, noEmit: true, composite: false, incremental: false,
  rewriteRelativeImportExtensions: false,
  typeRoots: [resolve(upstream, 'node_modules/@types')],
}, upstream)
const rootFiles = compat ? ['compat/rc2/src/index.ts'] : hostApi ? ['src/index.ts', 'experiments/host-api/wake.ts', 'tests/host-api/strict.spec.ts', 'tests/host-api/coverage.spec.ts', 'tests/host-api/lifecycle.spec.ts', 'tests/host-api/benchmark.spec.ts', 'tests/m2/harness.ts'] : ['experiments/m2/steer-wake.ts', 'tests/m2/harness.ts', 'tests/m2/native.spec.ts', 'tests/m2/ptc.spec.ts']
const roots = ['src/index.ts'].map(file => resolve(project, file))
if (!diagnostics.length) {
  const program = ts.createProgram(roots, converted.options, hostFor(converted.options))
  diagnostics.push(...converted.errors, ...ts.getPreEmitDiagnostics(program))
}
const format = ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: file => file, getCurrentDirectory: () => project, getNewLine: () => '\n' })
const label = 'Strict TypeScript check passed against the selected official host source.'
mkdirSync(resolve(project, 'work'), { recursive: true })
writeFileSync(resolve(project, 'work/typecheck.log'), format || label + '\n')
console.log(format || label)
process.exitCode = diagnostics.length ? 1 : 0
