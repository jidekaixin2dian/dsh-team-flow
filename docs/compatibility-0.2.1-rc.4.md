# DSH 0.2.1-rc.4 compatibility

Host `dsh-v0.2.1-rc.4` / `504a01a9578abc2c6f1fb896b1dc322c9fe24f66`, verified on 2026-10-28. The plugin runtime is unchanged from alpha.8.

Strict TypeScript and the 18-test isolated runtime suite pass, including repeated Steer delivery, real Node PTC continuation, interrupt=false, native timeout and unload restoration. This does not certify complete Desktop UI, SSH, Python PTC or arbitrary plugin combinations. CI includes rc.4 together with the four previous source pins.

See [verification](verification.md) for the recorded results. npm and GitHub distribute the same prebuilt archive; the npm default channel remains an alpha preview.
