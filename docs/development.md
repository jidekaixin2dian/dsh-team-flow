# 开发与验证



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

默认准备和验证 `0.2.1-rc.3`。已有相同固定 commit 的干净宿主 checkout 时，可给 typecheck 和 test 传 `-- --host-path <绝对路径>`，无需重复安装依赖。旧版矩阵统一传 `-- --host alpha1`、`-- --host alpha2` 或 `-- --host rc2` 给 setup、typecheck 和 test；原 `--alpha1` 参数继续可用。Windows GitHub Actions 持续运行这四档公开源码；旧 `0.2.0-rc.2` 的安装文件副本不会被上传，保留本地脱敏证据。


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

Setup, typecheck and test default to `0.2.1-rc.3`. Typecheck and test accept `-- --host-path <absolute-path>` to reuse a clean checkout at the pinned commit. Pass `-- --host alpha1` or `-- --host alpha2` for older public hosts; legacy `--alpha1` still works. All model traffic is Mock and all DSH data is confined to this checkout's `work/`. CI runs all four public-source versions. Installation-owned old `0.2.0-rc.2` files are not redistributed.

MIT. Community project, not affiliated with DeepSeek. Share versions, minimal reproduction and redacted logs in Issues; never include credentials or private conversations.
