# DSH Team Flow

[中文](README.md) · [Preview releases](https://github.com/jidekaixin2dian/dsh-team-flow/releases) · [Verification](docs/verification.md)

Let user Steer end one Agent Teams `wait_agent` call while teammates keep running. The original AgentLoop consumes the original message at its next step. This is an independent implementation related to [DSH Discussion #9214](https://github.com/deepseek-ai/deepseek-harness/discussions/9214).

**Alpha preview.** No host source patch or installation-file changes. It uses reversible runtime decorators; production Desktop UI, SSH, Python PTC and arbitrary third-party plugin combinations remain unverified. Start with an isolated profile.

The same implementation passed 16 isolated Mock-runtime checks on the installed 0.2.0-rc.2 and public 0.2.1-alpha.1 / alpha.2. Each includes 20 repeated Steer wakes and a real Node PTC subprocess. The current Desktop's Node 24.18.1 mode also passed. These are functional checks, not production latency measurements.

## Install

Requires **DSH >=0.2.0-rc.2 and Node >=24**, with official **Agent Teams** enabled first. See [marketplace verification](docs/marketplace.md). Once the catalog submission is merged and synced, search DSH Market for `DSH Team Flow` and verify source `jidekaixin2dian/dsh-team-flow`. Until then, use the Release package below.

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

For alpha.1, pass `-- --alpha1` to setup, typecheck and test. All model traffic is Mock and all DSH data is confined to this checkout's `work/`. CI runs the two public-source versions. Installation-owned rc.2 files are not redistributed.

MIT. Community project, not affiliated with DeepSeek. Share versions, minimal reproduction and redacted logs in Issues; never include credentials or private conversations.
