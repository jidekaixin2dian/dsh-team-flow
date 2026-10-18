# DSH 0.2.1-rc.2 compatibility

Recorded 2026-10-18 (UTC+8), plugin `0.2.0-alpha.5` / 团队插话助手 · DSH Team Flow.

## Source-confirmed / 源码证实

- The [latest official release checked on this date](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.2) is `0.2.1-rc.2`, commit `687f282e8625c6b8d11ff58211a90524be2e4317`. Host package manager: pnpm 11.28.5. The release is a prerelease.
- [`Agent.steer()`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts) still sends to `next-step` with wakeup; inject uses wakeup=false. [`wait_agent`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/experimental/tool-agent-team/src/index.ts) still delegates to Team activity while an active peer exists. This release does not add a same-session user Steer wake contract to native wait.
- Host Team tools now expose an `interrupt` option (default true) controlling registration of `interrupt_agent`, plus updated Team identity context. Team Flow reuses the host's live module and exact Config schema, so these features are retained without copying or freezing an older tool implementation.
- Host JSONL persistence now exports a lifecycle-owning `apply` plugin instead of the old default service. The isolated test harness selects the new plugin where available and the legacy default on older hosts. This is test infrastructure adaptation, not a production data migration.
- Setup, typecheck and tests share a pinned host matrix. The default is rc.2; `--host alpha1`, `--host alpha2`, `--host rc2` select explicit versions. Legacy `--alpha1` remains supported. CI covers all three public commits.

## Actually tested / 实际测试通过

- Official rc.2 tracked source remains unchanged. Strict TypeScript passes; **18/18 runtime checks pass**, including native blocked-Steer baseline, 20 repeated waits, legal output validation, real Node PTC continuation, Queue/inject/other-session exclusions, both Stop orderings, permission guards, unload restoration, Team-first/timeout, task CRUD, official patch composition, and the new `interrupt=false` case.
- All inference is Mock, with a real local Node PTC subprocess. DSH_HOME is confined to repository `work/`. No production profile, conversation, API key or installed program file is modified.
- The first rc.2 test run failed during fixture setup because the legacy persistence default export is absent. Selecting the official new apply plugin resolved the setup failure; the complete suite was rerun. The Steer runtime source did not require modification.

Evidence: [matrix summary](../verification/local/dsh-0.2.1-rc.2/summary.json), [rc.2 runtime](../verification/local/dsh-0.2.1-rc.2/rc2-run.log), [strict check](../verification/local/dsh-0.2.1-rc.2/typecheck.txt), [package/market checks](../verification/local/dsh-0.2.1-rc.2/marketplace.json). Older alpha.1 / alpha.2 were rerun after the persistence harness change: 17 passing checks each, plus one explicitly skipped rc.2-only option test. Runtime JS hashes match alpha.4. Existing historical records are not a claim that an old binary ran against rc.2 at its original publication date.

## Unverified / 尚未验证

Full Desktop input and market HTTP/UI installation, real model latency, SSH, Python PTC, arbitrary third-party decorators and unreleased future hosts remain unverified. The screenshot version is covered by its official source release; a different private Desktop build with the same label is not automatically an identical binary. Runtime methods remain public-method decorators rather than dedicated official hooks.
