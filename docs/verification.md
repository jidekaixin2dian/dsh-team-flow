# Verification and evidence boundaries

Updated 2026-10-28, UTC+8. This page is the current support matrix and the index of historical evidence. The source pins are shared by setup, strict type checking, runtime tests and CI through [`scripts/hosts.mjs`](../scripts/hosts.mjs). Package peer ranges are compatibility targets, not evidence that every host version has been tested.

## Current public-source matrix

| Host | Pinned official commit | Current suite | Evidence |
|---|---|---|---|
| 0.2.1-alpha.1 | `5badb15009ae1756c3afe0ae0cef1faafc290ccc` | 17 passed; 1 rc.2+ interrupt check skipped | [Recorded run](../verification/local/dsh-0.2.1-rc.2/alpha1/run.log) |
| 0.2.1-alpha.2 | `d743267388641bc76f17c45ce8b4c231aed1d32c` | 17 passed; 1 rc.2+ interrupt check skipped | [Recorded run](../verification/local/dsh-0.2.1-rc.2/alpha2/run.log) |
| 0.2.1-rc.2 | `687f282e8625c6b8d11ff58211a90524be2e4317` | 18 passed | [Runtime](../verification/local/dsh-0.2.1-rc.2/rc2/run.log), [strict TypeScript](../verification/local/dsh-0.2.1-rc.2/typecheck.txt) |
| 0.2.1-rc.3 | `1f81c047fc48fa190a683e469daa699857e9afe8` | 18 passed | [Runtime](../verification/local/dsh-0.2.1-rc.3/rc3/run.log), [strict TypeScript](../verification/local/dsh-0.2.1-rc.3/typecheck.txt) |

| 0.2.1-rc.4 (default) | `504a01a9578abc2c6f1fb896b1dc322c9fe24f66` | 18 passed | [Runtime](../verification/local/dsh-0.2.1-rc.4/run.log), [strict TypeScript](../verification/local/dsh-0.2.1-rc.4/typecheck.txt) |

The [Compatibility workflow](../.github/workflows/compatibility.yml) reruns all five source pins. The [verified main run](https://github.com/jidekaixin2dian/dsh-team-flow/actions/runs/39408500060) passed each matrix job on 2026-10-20; 0.2.1-rc.3 was added on 2026-10-24. For subsequent commits, inspect the corresponding run rather than treating any dated result as permanent certification. Runtime tests use Mock inference and real local Node PTC; they do not exercise the complete Desktop input chain. See [the rc.2 report](compatibility-0.2.1-rc.2.md) and [the rc.3 report](compatibility-0.2.1-rc.3.md) for the contract changes and evidence boundaries.

## Historical installation and first-public-matrix evidence

Recorded 2026-10-14. These 16-check records predate the current suite; they are retained as provenance, not the current public-host test counts. In particular, installed **0.2.0-rc.2** below is different from public **0.2.1-rc.2** above.

| Host | Evidence | Result |
|---|---|---|
| Installed Desktop/core 0.2.0-rc.2; build manifest `04f392c9ddd144fa426da2045178797da6db6c11`; copied unchanged program modules; Node 24.15 | [rc2](../verification/local/rc2/run.log) | 16/16 |
| Same modules, installed Desktop exe in Node 24.18.1 mode | [desktop-node](../verification/local/rc2-desktop-node/run.log) | 16/16 |
| Official 0.2.1-alpha.1, `5badb15009ae1756c3afe0ae0cef1faafc290ccc`, own frozen dependencies/pnpm 11.7 | [alpha1](../verification/local/alpha1/run.log) | 16/16 |
| Official 0.2.1-alpha.2, `d743267388641bc76f17c45ce8b4c231aed1d32c`, frozen dependencies | [alpha2](../verification/local/alpha2/run.log) | 16/16 |

Each suite checks the stock blocked-Steer baseline, Queue/user-inject exclusions, 20 repeated exact-ID claims, real Node PTC continuation and subprocess completion, both Stop orders, send/Inbox/other-session/teammate exclusions, entry timing, unload restoration, original tool reloading, invalid arguments/no peer, guards, illegal output rejection, Team-first/Steer ordering, a 10-second timeout, task CRUD and roster behavior. All models are Mock. Real user UI and model inference latency are not measured.

The rc.2 build SHA could not be retrieved by exact-SHA fetch from its manifest's declared official repository. Its evidence is the actual installation's manifest and selected program-file integrity hashes, not an invented source checkout. Those installed program files and private build artifacts are not redistributed. The two public commits remain unmodified.

At that historical stage, strict source type checking passed against alpha.2 declarations. The old 0.2.0-rc.2 installation did not supply equivalent complete declarations, so its runtime result is not separate compile-time ABI certification. The current public-source matrix above includes strict checks and runtime regression against all five public commits, including 0.2.1-rc.4.

Recorded [profile lifecycle](../verification/local/package-lifecycle.json) verifies installation bytes, disabled original component, enabled substitute, package removal and restored original composition. It does not claim a real Desktop window was exercised.

## Source evidence

On the installed rc.2, `steer(message)` delegates to `send(message,'next-step',true)` and `inject(message)` to the same target with wakeup=false. The Inbox inserted payload lacks delivery-operation metadata. This motivated observing the public Steer entry instead of guessing from `source.kind` alone.

The stock wait success contract rejects an additional reason. A legal error ends Native wait but aborts an uncaught Node PTC program's later statements. The registration adapter clones the definition before registration and adds a disjoint schema branch for `{timedOut:false,reason:'user-steer'}`; it does not mutate a registered readonly definition or bypass final result validation.

The around wrapper awaits the real body after a derived cancellation and retains the original caller signal. It converts only its own Steer cancellation. Permission guards remain authoritative.

## Limits

Future versions, full production Desktop input chain, SSH, Python PTC, every approval mode, all operating systems and arbitrary third-party decorator combinations are unverified. An earlier cached bound method can bypass observation; a later decorator can retain a disabled pass-through closure. Capability checks are defensive, not proof of future compatibility.

The preview is a community compatibility layer, not an upstream fix or a stable official decorator API. Independent-user acceptance is pending. Compatibility aims to continue from rc.2, but breaking upstream changes may require a plugin update.

Local evidence was path-redacted before publication. Timeline records contain only synthetic fixture traffic; no production sessions, credentials or authentication links are included.
