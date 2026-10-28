import { resolve } from 'node:path'

export const hosts = {
  alpha1: { tag: 'dsh-v0.2.1-alpha.1', sha: '5badb15009ae1756c3afe0ae0cef1faafc290ccc' },
  alpha2: { tag: 'dsh-v0.2.1-alpha.2', sha: 'd743267388641bc76f17c45ce8b4c231aed1d32c' },
  rc2: { tag: 'dsh-v0.2.1-rc.2', sha: '687f282e8625c6b8d11ff58211a90524be2e4317' },
  rc3: { tag: 'dsh-v0.2.1-rc.3', sha: '1f81c047fc48fa190a683e469daa699857e9afe8' },
  rc4: { tag: 'dsh-v0.2.1-rc.4', sha: '504a01a9578abc2c6f1fb896b1dc322c9fe24f66' },
}

/** Shared version selection keeps setup, semantic checks and runtime tests aligned. */
export function selectHost(argv = process.argv.slice(2)) {
  let key = 'rc4', directory
  const forwarded = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--alpha1') key = 'alpha1'
    else if (argv[i] === '--host' || argv[i] === '--host-path') {
      const option = argv[i], value = argv[++i]
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${option}`)
      if (option === '--host') key = value
      else directory = value
    } else forwarded.push(argv[i])
  }
  if (!Object.hasOwn(hosts, key)) throw new Error(`Unknown host ${key}; choose ${Object.keys(hosts).join(', ')}`)
  return { key, ...hosts[key], directory: resolve(directory ?? `work/${key}`), forwarded }
}
