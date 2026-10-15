# DSH Team Flow

[English](README.en.md) · [下载预览版](https://github.com/jidekaixin2dian/dsh-team-flow/releases) · [验证记录](docs/verification.md)

**主代理等待队友时，让用户的 Steer 结束这一次等待，队友继续工作。**

DSH Agent Teams 的 Lead 可能停在 `wait_agent` 中。新消息虽进入收件箱，仍要等 Team 变化或 timeout 后才能被下一步领取。Team Flow 是围绕 [Discussion #9214](https://github.com/deepseek-ai/deepseek-harness/discussions/9214) 的独立插件实现：仅结束本次 wait，再由原生 AgentLoop 领取原消息。

这是 **alpha 预览版**。无需修改宿主源码或安装文件，但使用运行时方法装饰，尚未验证正式 Desktop UI、SSH、Python PTC 与任意第三方插件组合。请先在隔离 profile 试用。

## 已验证的行为

| 输入 / 条件 | 行为 |
|---|---|
| 同一 Lead 的 user Steer | 本次 wait 返回 `{timedOut:false, reason:'user-steer'}`，原消息恰好一次领取 |
| Queue、user-sourced inject、普通 send、直接 Inbox mutation | 不归因为 Steer 唤醒 |
| 其他会话 / teammate 输入 | 不直接结束这里的 Lead 等待 |
| Stop、guard 拒绝、Team-first、原生 timeout | 保留各自结果 |
| 真实 Node PTC | 成功唤醒后，后续程序语句继续执行 |
| 禁用插件时仍在 wait | 仅取消这个 wait，返回明确的插件禁用错误，队友继续运行 |

隔离 Mock runtime 测试：当前安装的 **0.2.0-rc.2**、公开的 **0.2.1-alpha.1 / alpha.2** 每档 16/16；每档包含 20 次重复 Steer 和真实 Node PTC。当前安装版还使用 Desktop 自带 Node 24.18.1 模式补测。数字是功能验证，不是生产延迟或真实模型响应指标。

## 安装

需要 **DSH >=0.2.0-rc.2、Node >=24**，并先启用官方 **Agent Teams**。市场收录流程与验收见 [市场适配记录](docs/marketplace.md)。收录合并并同步后，可在 DSH Market 搜索 `DSH Team Flow`，核对来源 `jidekaixin2dian/dsh-team-flow` 后安装；审核期间使用下面的 Release 安装方式。

1. 让所有 Agent idle，并备份自己的 profile 配置。建议先使用新的测试 profile。
2. 先启用官方 **Agent Teams** bundle。
3. 从 [Releases](https://github.com/jidekaixin2dian/dsh-team-flow/releases) 下载 `dsh-team-flow-continuous-*.tgz`，在 DSH 插件管理器安装本地包；也可使用 CLI：

```powershell
dsh plugin --profile <你的测试profile> add <tgz绝对路径>
```

4. 确保本插件 bundle 在 Agent Teams bundle **之后**。包已声明 `dsh.bundle.order.after`，市场诊断可识别并建议顺序；这不是自动启用 Agent Teams。它停用原 `tool-agent-team` profile entry，自己加载宿主当版的官方 Team 工具，避免双重注册。若你曾自定义官方工具的 `freshProvider` / `forkProvider`，请在本插件配置中使用相同值。
5. 开新会话，按你的发送设置使用 **Steer / 插话**。Queue / 排队仍按原语义执行；普通 Enter 的行为由 DSH 设置决定。

卸载同样建议先 idle，然后在插件管理器移除，或运行：

```powershell
dsh plugin --profile <你的测试profile> remove dsh-team-flow-continuous
```

若主动禁用时仍有 wait，会返回 `TEAM_FLOW_RC2_DISABLED` 错误；未捕获该错误的 PTC 程序可能停止后续语句。移除 bundle 后恢复原版工具配置。请勿与另一套同名 Team 工具 owner 同时启用。

在 DSH Market 中禁用时，市场会移除本插件的整层补丁，使官方工具恢复；重新启用后再应用本插件。请使用**包级开关**或卸载：手工只将 `dsh-team-flow-continuous` loader entry 设为 disabled，会留下下层对官方工具的停用。市场可能要求重启；等所有 Agent idle 后操作。预构建包与 GitHub 源码均包含 `lib`，无需允许安装脚本；未发布 npm。

## 如何工作与兼容边界

插件加载**宿主自己的** Team 工具，不复制冻结旧版工具。注册前克隆 wait 定义，仅在缺少合法 Steer 成功值时扩展 schema / render；已经支持该值时保留契约。它还临时装饰公开 `Agent.steer()`，记录原消息 ID，再通过 `tools/execute` 的派生 signal 结束单次真实 wait，等待底层 promise 收敛。没有调用 Agent cancel，也不 claim / remove / 重发 Inbox 输入。

这些方法装饰不是官方专用扩展 hook。提前缓存旧 bound 方法、其他插件装饰同一方法、事件语义或 ABI 变化都可能影响兼容。检测到不支持的输入形状或成功 schema 时保留原等待并告警；模块 ABI 不符时可能加载失败。

**兼容目标从 0.2.0-rc.2 起持续维护，不锁死 commit 或版本上限。尚未发布版本无法提前承诺永远兼容；破坏性变化可能要求更新插件。** peer `*` 用于复用宿主，不代表所有版本已测试。“user Steer”指通过 `Agent.steer()` 投递的 user 消息，不认证任意第三方调用是否来自真人。

## 从源码复现

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

alpha.1 矩阵：`npm run setup:host -- --alpha1`，然后 `npm run typecheck -- --alpha1`、`npm test -- --alpha1`。Windows GitHub Actions 持续运行这两档公开源码；rc.2 的安装文件副本不会被上传，保留本地脱敏证据。

## 反馈

欢迎通过 [Issues](https://github.com/jidekaixin2dian/dsh-team-flow/issues) 提供 DSH / Node / OS 版本、Native 或 PTC、Steer / Queue 设置、最小步骤和脱敏日志。不要附 API Key、会话原文或认证链接。安全问题见 [SECURITY.md](SECURITY.md)。

MIT。独立社区项目，与 DeepSeek 官方无隶属关系；不宣称这是上游已经合并的修复。
