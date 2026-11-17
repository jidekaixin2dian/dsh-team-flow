# Team Flow 代码地图

维护 `src/`，通过 `npm run build` 生成并提交 `lib/`。GitHub 来源安装直接使用生成文件。

1. `cordis.patch.yml` 在官方 Agent Teams bundle 之后替换 tool-agent-team entry。
2. `src/index.ts` 先安装 wait 输出适配和 Steer hook，再加载官方 TeamTools；Config 仅复用并传给 TeamTools。
3. `src/register.ts` 的 installWaitResultAdapter 在注册前适配 wait_agent 输出 schema 与展示，不修改已注册只读定义。
4. `src/wake-core.ts` 的 installSteerWake 记录用户 Steer 的消息身份，结束当前 wait，保留宿主领取原消息的流程。

wake-core 的 receipts 对应消息身份，triggers 对应当前等待，controllers 和 flights 对应插件拥有的在途工作。卸载恢复自身的方法装饰并等待这些工作结束，不取消队友。错误码 TEAM_FLOW_RC2_STEER / TEAM_FLOW_RC2_DISABLED 保留兼容含义，内部函数名不再绑定某个宿主版本。

直接前台 workflow 是否可以暂缓，由 canDeferForegroundWorkflow 核对宿主能力与准入；PTC 内部调用继续走宿主流程，避免影响同脚本内的其他调用。调用者取消、插件停用和用户 Steer 分别生成明确结果。

`scripts/hosts.mjs` 固定实际 tag/SHA。可使用完整版本 `--host 0.2.2-rc.1` 或 `--host 0.2.1-rc.2`，旧 rc1/rc2 等短参数继续兼容。构建与宿主验证步骤见 [开发与验证](development.md)。
