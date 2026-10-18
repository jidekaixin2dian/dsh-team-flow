# Changelog

## 0.2.0-alpha.5

Verify latest official DSH 0.2.1-rc.2 (687f282e8625c6b8d11ff58211a90524be2e4317). Add it as the default pinned host and third Windows CI target, adapt the isolated harness to the host's lifecycle-owned JSONL persistence plugin, and test Steer with the new `interrupt=false` configuration. Runtime capability adapter and package identity remain unchanged. Chinese display name: 团队插话助手.

## 0.2.0-alpha.4

DSH Market packaging: declare Agent Teams bundle ordering and the minimum DSH version, ship an icon and exported manifest/patch paths, and track generated runtime files so the market's GitHub-source fallback installs without build scripts. Add isolated marketplace source/toggle/order checks, package installation checks and official patch composition regression coverage. The Steer runtime implementation is unchanged.

## 0.2.0-alpha.3

First public preview of the plugin-only capability adapter. Packages the same runtime implementation tested locally across rc.2, alpha.1 and alpha.2, with a standalone source tree, reproducible test harness and public installation guide. No host source patch.
