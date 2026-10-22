# DSH Team Flow

[中文](README.md) · [Marketplace](https://awesome-dsh-plugin.com/p/jidekaixin2dian/dsh-team-flow/) · [Preview releases](https://github.com/jidekaixin2dian/dsh-team-flow/releases) · [Trial guide and feedback](https://github.com/jidekaixin2dian/dsh-team-flow/discussions/1) · [Verification](docs/verification.md)

Let user Steer end one Agent Teams `wait_agent` call while teammates keep running. The original AgentLoop consumes the original message at its next step. This is an independent implementation related to [DSH Discussion #9214](https://github.com/deepseek-ai/deepseek-harness/discussions/9214).

**Alpha preview.** No host source patch or installation-file changes. It uses reversible runtime decorators; production Desktop UI, SSH, Python PTC and arbitrary third-party plugin combinations remain unverified. Start with an isolated profile.

The current public-source matrix passes **17 checks with 1 rc.2-only check skipped** on each of 0.2.1-alpha.1 / alpha.2, and **18/18** on 0.2.1-rc.2. All three have strict TypeScript checks and Windows CI. The older installed **0.2.0-rc.2** has separate historical 16/16 evidence, including Desktop's Node 24.18.1 mode; it is a different host from 0.2.1-rc.2. See the [unified verification matrix](docs/verification.md). These are isolated Mock-runtime functional checks with repeated Steer wakes and real Node PTC, not complete Desktop UI or production latency measurements.

**2026-10-18: latest official DSH `0.2.1-rc.2` passed 18/18 isolated checks and strict TypeScript validation**, including real Node PTC and Steer with the host's new `interrupt=false` option. Plugin preview `0.2.0-alpha.5` records this compatibility in [the evidence report](docs/compatibility-0.2.1-rc.2.md). The compatibility target still starts at `0.2.0-rc.2`.

## Install

Requires **DSH >=0.2.0-rc.2 and Node >=24**, with official **Agent Teams** enabled first. Listed in [DSH Market](https://awesome-dsh-plugin.com/p/jidekaixin2dian/dsh-team-flow/); the public catalog was verified to point to alpha.5 on 2026-10-20. Search for `dsh-team-flow` and verify source `jidekaixin2dian/dsh-team-flow`, or use the Release package below. See [rc.2 compatibility evidence](docs/compatibility-0.2.1-rc.2.md) for tested boundaries.

Wait until all Agents are idle. Enable the official Agent Teams bundle first, then install the `.tgz` from [Releases](https://github.com/jidekaixin2dian/dsh-team-flow/releases) through DSH's plugin manager or:

```text
dsh plugin --profile <test-profile> add <absolute-tgz-path>
```

This bundle must follow Agent Teams. It disables the original `tool-agent-team` profile entry and loads that host's official tool module itself, avoiding duplicate owners. Open a new conversation. Use Steer; Queue retains its existing behavior. Enter's behavior depends on DSH's setting.

The manifest declares `dsh.bundle.order.after` for market order diagnostics; it does not enable Agent Teams automatically. Copy any custom `freshProvider` / `forkProvider` values from the official tools to this plugin's configuration.

Uninstall while idle with the plugin manager or `dsh plugin --profile <test-profile> remove dsh-team-flow-continuous`. Disabling during an active wait ends only that call with an explicit `TEAM_FLOW_RC2_DISABLED` error; an uncaught PTC program may then skip later statements.

Use DSH Market's **package switch** or uninstall: the market removes this entire bundle layer on disable, restoring the official tools, then reapplies it on enable. Disabling only this plugin's loader entry by hand leaves its stock-tool disable in place. The market may request a restart; operate while Agents are idle. Both the Release archive and GitHub source include `lib`, with no install-time build approval required. Not npm-published.

## Contract and limits

Steer returns `{timedOut:false, reason:'user-steer'}` through the plugin-owned output contract. Queue, user-sourced inject, generic send, direct Inbox mutation and other-session inputs do not count as this Lead's Steer. Stop, guards, Team-first outcomes and timeout retain their semantics. The plugin does not cancel Agents or teammates, consume Inbox messages, resend input or leave a raced body running.

It adapts the host's live Team tools before registration instead of freezing an old implementation. `Agent.steer()` is temporarily decorated to observe delivery IDs. These public methods are not dedicated decorator hooks: cached bound methods, other decorators and future ABI/event changes may break compatibility. Unsupported shapes/contracts retain native wait where detected; module incompatibility may prevent loading.

Compatibility is maintained from 0.2.0-rc.2 without a fixed commit or upper version bound. **Unreleased future versions cannot be guaranteed in advance; breaking changes may require a plugin update.** Optional wildcard peers reuse the host and do not certify every version.

## Reproduce

Node >=24, Git and pnpm:

```text
npm ci --ignore-scripts
npm run setup:host
npm run build
npm run typecheck
npm test
npm run pack:local
npm run test:market
```

Setup, typecheck and test default to `0.2.1-rc.2`. Typecheck and test accept `-- --host-path <absolute-path>` to reuse a clean checkout at the pinned commit. Pass `-- --host alpha1` or `-- --host alpha2` for older public hosts; legacy `--alpha1` still works. All model traffic is Mock and all DSH data is confined to this checkout's `work/`. CI runs all three public-source versions. Installation-owned old `0.2.0-rc.2` files are not redistributed.

MIT. Community project, not affiliated with DeepSeek. Share versions, minimal reproduction and redacted logs in Issues; never include credentials or private conversations.
