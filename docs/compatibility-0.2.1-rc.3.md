# DSH 0.2.1-rc.3 compatibility

Host `dsh-v0.2.1-rc.3` / `1f81c047fc48fa190a683e469daa699857e9afe8`, added as the default pinned host on 2026-10-24 (plugin `0.2.0-alpha.7`). Suite and evidence layout follow the rc.2 report.

## Source-confirmed / 源码证实

rc.2 → rc.3 (`687f282e…1f81c047`) ships UI navigation customization, preset analytics and the official `/models` listing, plus workspace-wide version bumps. None of the packages this plugin binds to changed source: `dsh-tools`, `dsh-agent`, `dsh-agent-loop`, remotes, workspace-files, client connection, skill filesystem, app-boot, plugin-include and the experimental agent-team tools are untouched except for version metadata. The `Agent.steer()` delivery contract, `wait_agent` output schema and tools registration ABI are identical to rc.2.

## Actually tested / 实际测试通过

- Strict TypeScript check against the rc.3 official source: passed.
- Isolated runtime matrix on rc.3: **18/18** (the `interrupt=false` check now also runs on rc.3; alpha hosts still skip it). Evidence: [run.log](../verification/local/dsh-0.2.1-rc.3/rc3/run.log), [environment.json](../verification/local/dsh-0.2.1-rc.3/rc3/environment.json).
- rc.2 regression after the suite change: 18/18.
- Windows CI reruns all four source pins (alpha1, alpha2, rc2, rc3) on every push.

## Unverified / 尚未验证

Same boundaries as rc.2: Mock inference and real local Node PTC only; not the complete Desktop input chain, SSH, Python PTC, production latency or third-party plugin combinations.
