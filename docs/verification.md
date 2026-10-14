# Verification and evidence boundaries

Recorded 2026-10-14, UTC+8. The public preview packages the same runtime JavaScript implementation tested in the local matrix; publishing changes source layout, declarations and documentation.

| Host | Evidence | Result |
|---|---|---|
| Installed Desktop/core 0.2.0-rc.2; build manifest `04f392c9ddd144fa426da2045178797da6db6c11`; copied unchanged program modules; Node 24.15 | [rc2](../verification/local/rc2/run.log) | 16/16 |
| Same modules, installed Desktop exe in Node 24.18.1 mode | [desktop-node](../verification/local/rc2-desktop-node/run.log) | 16/16 |
| Official 0.2.1-alpha.1, `5badb15009ae1756c3afe0ae0cef1faafc290ccc`, own frozen dependencies/pnpm 11.7 | [alpha1](../verification/local/alpha1/run.log) | 16/16 |
| Official 0.2.1-alpha.2, `d743267388641bc76f17c45ce8b4c231aed1d32c`, frozen dependencies | [alpha2](../verification/local/alpha2/run.log) | 16/16 |

Each suite checks the stock blocked-Steer baseline, Queue/user-inject exclusions, 20 repeated exact-ID claims, real Node PTC continuation and subprocess completion, both Stop orders, send/Inbox/other-session/teammate exclusions, entry timing, unload restoration, original tool reloading, invalid arguments/no peer, guards, illegal output rejection, Team-first/Steer ordering, a 10-second timeout, task CRUD and roster behavior. All models are Mock. Real user UI and model inference latency are not measured.

The rc.2 build SHA could not be retrieved by exact-SHA fetch from its manifest's declared official repository. Its evidence is the actual installation's manifest and selected program-file integrity hashes, not an invented source checkout. Those installed program files and private build artifacts are not redistributed. The two public commits remain unmodified.

Strict source type checking passes against alpha.2 declarations. The rc.2 installation does not supply the equivalent complete declarations, so this is not a claim of separate rc.2 compile-time ABI certification. Standalone public CI performs strict checks and runtime regression on both public host commits.

Recorded [profile lifecycle](../verification/local/package-lifecycle.json) verifies installation bytes, disabled original component, enabled substitute, package removal and restored original composition. It does not claim a real Desktop window was exercised.

## Source evidence

On the installed rc.2, `steer(message)` delegates to `send(message,'next-step',true)` and `inject(message)` to the same target with wakeup=false. The Inbox inserted payload lacks delivery-operation metadata. This motivated observing the public Steer entry instead of guessing from `source.kind` alone.

The stock wait success contract rejects an additional reason. A legal error ends Native wait but aborts an uncaught Node PTC program's later statements. The registration adapter clones the definition before registration and adds a disjoint schema branch for `{timedOut:false,reason:'user-steer'}`; it does not mutate a registered readonly definition or bypass final result validation.

The around wrapper awaits the real body after a derived cancellation and retains the original caller signal. It converts only its own Steer cancellation. Permission guards remain authoritative.

## Limits

Future versions, full production Desktop input chain, SSH, Python PTC, every approval mode, all operating systems and arbitrary third-party decorator combinations are unverified. An earlier cached bound method can bypass observation; a later decorator can retain a disabled pass-through closure. Capability checks are defensive, not proof of future compatibility.

The preview is a community compatibility layer, not an upstream fix or a stable official decorator API. Independent-user acceptance is pending. Compatibility aims to continue from rc.2, but breaking upstream changes may require a plugin update.

Local evidence was path-redacted before publication. Timeline records contain only synthetic fixture traffic; no production sessions, credentials or authentication links are included.
