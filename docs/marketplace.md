# DSH Market integration

Recorded 2026-10-16 (UTC+8), preview `0.2.0-alpha.4`. Runtime Steer code is unchanged from alpha.3.

Listing application: [awesome-dsh-plugin PR #7497](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/7497), submitted for maintainer review. Submission is not acceptance or a live-market listing.

## Source-confirmed / 源码证实

- [DSH Market submission instructions](https://github.com/dsh-market/dsh-market/blob/b8948c1aee21a5a10cf78266aadd0b49f8d2515c/README.zh.md#提交你的插件) direct entries to [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin), not the market application repository. Its [contribution guide](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/4f4219f6e94ac9b8a6208b60bb4cf62765e1c7d9/contributing.md) requires one `data/plugins/<owner>__<repo>.yml` entry, real code, a `dsh.bundle`, a repository at least one day old and the `dsh-plugin` topic. npm publication is optional.
- Market `1.66.21`, commit `b8948c1aee21a5a10cf78266aadd0b49f8d2515c`: [`installTargetFor` / `sourceFallbackFor`](https://github.com/dsh-market/dsh-market/blob/b8948c1aee21a5a10cf78266aadd0b49f8d2515c/src/sources.ts) select verified npm, own-repository Release tarball, then GitHub source. pnpm 11.0–11.8 may require source fallback for a remote Release URL. This package therefore tracks its generated `lib` files and needs no install-time build scripts on either route.
- [`switchPluginLayers`](https://github.com/dsh-market/dsh-market/blob/b8948c1aee21a5a10cf78266aadd0b49f8d2515c/src/routes.ts) and [`carrierDisableIds`](https://github.com/dsh-market/dsh-market/blob/b8948c1aee21a5a10cf78266aadd0b49f8d2515c/src/patch.ts) recognize a bundle disabling a foreign entry. Disabling removes this bundle from `dsh.profile.bundles`; it does not persist a disable for the official `tool-agent-team` entry. A row-only manual disable has different semantics.
- Package metadata declares `engines.dsh >=0.2.0-rc.2`, Node >=24, an icon, exported manifest/patch paths, and `dsh.bundle.order.after` the official Team profile. Order metadata supports diagnosis; it does not activate a missing official bundle. Official packages remain optional peers; none is copied into the plugin.

## Actually tested / 实际测试通过

- Official alpha.1 and alpha.2: strict TypeScript checks and **17/17 runtime tests each**, including the prior 16 semantic checks plus official `applyEntryPatches` enable/disable/re-enable composition. All model traffic is Mock; the Node PTC subprocess is real.
- `npm run test:market`: executes the above pinned market's actual source helpers, with all writes under `work/dsh-home/market-*`. Real pnpm **11.7.0 and 11.28.5** installs with scripts disabled verify artifact bytes, loadability, zero additional host packages, source selection, order conflict recognition, foreign-disable detection and package disable/re-enable persistence. This is not a simulated reimplementation of market rules.
- CI checks that rebuilding from TypeScript leaves tracked `lib` unchanged. The package whitelist excludes tests, host files, development dependencies and private evidence.
- The unchanged installed rc.2 CLI copy performed actual `plugin add` / `remove` in an isolated profile using pnpm 11.21.0. `--dump-config` confirmed the original tool is disabled with this bundle and restored after removal. No Desktop window or model execution was involved. Evidence: [CLI lifecycle](../verification/local/market-cli-lifecycle.json), [market helpers/install](../verification/local/marketplace.json), [alpha.1](../verification/local/market-alpha1/summary.json), [alpha.2](../verification/local/market-alpha2/summary.json).
- The published [Release](https://github.com/jidekaixin2dian/dsh-team-flow/releases/tag/v0.2.0-alpha.4) was downloaded again and SHA256 matched `505b12a17a4e2527e343989266704d4e9465986402d5278992f053dd77ac2f02`. [Remote Release installs](../verification/local/marketplace-release.json) passed on both asserted pnpm versions using fresh stores; neither needed fallback in this environment. [Published GitHub source installs](../verification/local/marketplace-source.json) also passed on both versions. This does not prove every pnpm/platform avoids the market's documented remote-integrity failure.
- Public Windows CI passed for both host versions on the release commit: [main run](https://github.com/jidekaixin2dian/dsh-team-flow/actions/runs/38807349398), [tag run](https://github.com/jidekaixin2dian/dsh-team-flow/actions/runs/38807511405). This includes tracked-build consistency, strict checks, 17 runtime tests per host and local marketplace package/helper checks.

Commands (Node >=24, Git, npm; network needed for pinned market and pnpm):

```text
npm ci --ignore-scripts
npm run setup:host
npm run build
npm run typecheck
npm test
npm run pack:local
npm run test:market
```

To reuse the exact pinned market checkout: `npm run test:market -- --market-path <absolute-checkout>`. It verifies SHA and tracked-file cleanliness before installing production dependencies with scripts disabled. To exercise a published route, pass `--release-url <own-release-tgz-url>` or `--source-spec github:jidekaixin2dian/dsh-team-flow#<commit>`; the local package version and installed JS hashes must match.

## Unverified / 尚未验证

Catalog submission is not approval or proof that a live market has synced. Full market HTTP/UI installation, live Desktop input, real model latency, SSH, Python PTC and arbitrary third-party combinations remain unverified. Host minimum metadata is a compatibility target, not evidence for every intermediate or future version. The underlying public-method decorators retain the alpha limitations in [verification.md](verification.md).

No production DSH profile, user conversations or installation files are modified by these tests.
