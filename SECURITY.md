# Security and testing

This is an alpha runtime compatibility plugin. Test in a new DSH profile first and perform installs/uninstalls with all Agents idle. Runtime decorators are restored only when still owned by this plugin; arbitrary decorator combinations remain unverified.

Reproduction tests use Mock models and disposable DSH_HOME directories under `work/`. They exercise real local subprocess providers with `danger-full-access` in the isolated test workspace, matching the original development execution environment. Do not run untrusted programs through that fixture or point it at a production DSH_HOME. The plugin itself does not change permission policy or suppress tool guards.

Report normal bugs using Issues with redacted logs. Never share API keys, authentication URL parameters, private conversation logs or cookies. For security reports, use GitHub private vulnerability reporting when available rather than a public issue containing sensitive details.
