import fs from 'node:fs'
import ts from 'typescript'
fs.mkdirSync('lib', { recursive: true })
for (const name of ['index', 'register', 'wake-core']) {
  const source = fs.readFileSync(`src/${name}.ts`, 'utf8')
  const options = { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }
  const output = ts.transpileModule(source, { fileName: `src/${name}.ts`, compilerOptions: options, reportDiagnostics: true })
  const declarations = ts.transpileDeclaration(source, { fileName: `src/${name}.ts`, compilerOptions: { ...options, isolatedDeclarations: true }, reportDiagnostics: true })
  const issues = [...output.diagnostics ?? [], ...declarations.diagnostics ?? []]
  if (issues.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(issues, { getCanonicalFileName: n => n, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' }))
  fs.writeFileSync(`lib/${name}.js`, output.outputText)
  fs.writeFileSync(`lib/${name}.d.ts`, declarations.outputText)
}
console.log('Built JavaScript and declarations; run npm run typecheck separately.')
