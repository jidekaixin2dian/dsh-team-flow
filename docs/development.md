# 开发与验证

先读 [代码地图](architecture.md) 定位职责，再按本页准备与验证。



Node >=24，Git，pnpm。宿主 checkout 与 DSH_HOME 均在本仓库 `work/` 内；不会读取正式 DSH 会话。首次准备下载官方源码与锁定依赖，所有模型调用使用 Mock，不需要 API Key。

```powershell
npm ci --ignore-scripts
npm run setup:host
npm run build
npm run typecheck
npm test
npm run pack:local
npm run test:market
```

固定宿主、默认选择和完整 tag/SHA 见 `scripts/hosts.mjs`。setup、typecheck 和 test 可传 `-- --host 0.2.2-rc.1` 等完整版本，旧短参数保留；复用宿主时同时传对应 `--host` 与 `--host-path <绝对路径>`。持续验证范围见 Compatibility workflow。


---

## English



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

Pinned hosts and the default are defined in `scripts/hosts.mjs`. Setup, typecheck and test accept full versions such as `-- --host 0.2.2-rc.1`; legacy aliases remain supported. To reuse a checkout, pass both its matching `--host` and `--host-path <absolute-path>`. The Compatibility workflow defines the continuous matrix.

MIT. Community project, not affiliated with DeepSeek. Share versions, minimal reproduction and redacted logs in Issues; never include credentials or private conversations.


## npm 发布

仅在已获发布授权后操作。新 tag 必须位于 main，完整 CI 成功，GitHub Release 归档与 tag 一致；然后从相同 tag 调度 `npm-publish.yml` 并填入相同版本 tag，直接发布校验后的 GitHub 归档。首次创建 npm 包需要浏览器登录与 2FA；包建立后配置该仓库的 Trusted Publisher（仅 `npm-publish.yml`），后续发布不保存长期 token。更新检测与一键安装由市场/官方安装器完成，插件不另写自更新器。
