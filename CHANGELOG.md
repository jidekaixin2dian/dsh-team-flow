# Changelog

## 0.2.0-alpha.8 — 2026-10-26

- 重整中英文 README：安装更新优先，保留兼容与权限边界，开发说明移入独立文档。
- Refresh Chinese/English documentation and installation guidance; runtime behavior is unchanged.
- 新增流程示意，保留 alpha 标识；GitHub 源安装支持市场版本检查。


## 0.2.0-alpha.7 — 2026-10-24

Verify official DSH 0.2.1-rc.3 (`1f81c047`) and make it the default pinned host: strict TypeScript check and the full 18/18 isolated matrix pass, with the `interrupt=false` check now also running on rc.3 (rc.2 re-verified 18/18). rc.2 → rc.3 ships UI features and version bumps only — none of the packages this plugin binds to changed source, so the runtime adapter is unchanged. CI matrix grows to four hosts (alpha1/alpha2/rc2/rc3); evidence and the rc.3 compatibility report are added under docs/ and verification/.

## 0.2.0-alpha.6 — 2026-10-24

Bind the `presentResult` wake detection to the serialized `{"timedOut":false,"reason":"user-steer"}` value instead of matching the Chinese presentation copy by prefix, so future copy or locale changes cannot break result routing; Steer wake behavior is unchanged and the 18/18 rc.2 isolated matrix re-runs green. Also carries the earlier non-runtime commits: the unified public host verification matrix and the typecheck output directory for reused host checkouts.

## 0.2.0-alpha.5

Verify latest official DSH 0.2.1-rc.2 (687f282e8625c6b8d11ff58211a90524be2e4317). Add it as the default pinned host and third Windows CI target, adapt the isolated harness to the host's lifecycle-owned JSONL persistence plugin, and test Steer with the new `interrupt=false` configuration. Runtime capability adapter and package identity remain unchanged. Chinese display name: 团队插话助手.

## 0.2.0-alpha.4

DSH Market packaging: declare Agent Teams bundle ordering and the minimum DSH version, ship an icon and exported manifest/patch paths, and track generated runtime files so the market's GitHub-source fallback installs without build scripts. Add isolated marketplace source/toggle/order checks, package installation checks and official patch composition regression coverage. The Steer runtime implementation is unchanged.

## 0.2.0-alpha.3

First public preview of the plugin-only capability adapter. Packages the same runtime implementation tested locally across rc.2, alpha.1 and alpha.2, with a standalone source tree, reproducible test harness and public installation guide. No host source patch.
