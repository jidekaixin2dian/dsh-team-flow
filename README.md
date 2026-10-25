# Team Flow · 团队插话助手

**主代理等队友时，你仍然可以插话。队友继续工作。**

[English](README.en.md) · [插件市场](https://awesome-dsh-plugin.com/p/jidekaixin2dian/dsh-team-flow/) · [下载预览版](https://github.com/jidekaixin2dian/dsh-team-flow/releases) · [更新记录](https://github.com/jidekaixin2dian/dsh-team-flow/blob/main/CHANGELOG.md)

DSH Agent Teams 的主代理可能停在 `wait_agent`。Team Flow 让同会话的用户 **Steer / 插话** 结束当前这一次等待，再由原生 AgentLoop 领取原消息；队友不会被停止，Queue 仍按原语义排队。

![Steer 结束主代理等待，队友继续工作的流程示意](https://raw.githubusercontent.com/jidekaixin2dian/dsh-team-flow/main/docs/team-flow.svg)

> **Alpha 预览版。** 请先在隔离 profile 试用。已做隔离宿主与 Node PTC 验证；正式 Desktop UI、SSH、Python PTC 和任意第三方插件组合尚未完整验收。

| 输入 | 结果 |
|---|---|
| 同一 Lead 的用户 Steer | 结束本次等待，让原生循环继续领取消息 |
| Queue、普通 send、inject | 保留各自语义，不当作 Steer |
| 其他会话或队友输入 | 不直接结束这里的 Lead 等待 |
| Stop、guard、Team 变化、timeout | 保留原有结果 |

## 安装与更新

需要 **DSH >=0.2.0-rc.2、Node >=24**，并先启用官方 **Agent Teams**。当前持续验证 DSH 0.2.1-alpha.1 / alpha.2 / rc.2 / rc.3；详细范围见[验证记录](https://github.com/jidekaixin2dian/dsh-team-flow/blob/main/docs/verification.md)。

在市场搜索 **dsh-team-flow**，确认来源 **jidekaixin2dian/dsh-team-flow**。GitHub 安装源包含预构建文件，无需批准安装脚本；已有源安装可在「已安装」检查版本更新。市场目录更新前，可使用下面的命令。

1. 等所有 Agent 空闲，备份自己的 profile；建议使用测试 profile。
2. 启用官方 Agent Teams，然后安装本插件：

```powershell
dsh plugin --profile <test-profile> add github:jidekaixin2dian/dsh-team-flow
```

3. 确认本插件排在 Agent Teams bundle **之后**。按宿主要求重启，再开新会话，使用 Steer / 插话。

再次执行安装命令可更新。之前安装旧版 `.tgz` 的用户可用同一 profile 执行此命令切换到 GitHub 源，之后再由市场检查更新。Enter 是否执行 Steer 取决于 DSH 发送设置。

<details>
<summary>安装顺序、停用与卸载</summary>

插件声明了 bundle 顺序，但不会替你启用 Agent Teams。它停用原 `tool-agent-team` entry，加载宿主自身的官方工具，避免重复注册。自定义过 `freshProvider` / `forkProvider` 的用户应在本插件配置里保留相同值。

请使用市场的**包级开关**或卸载，恢复完整补丁层；不要只停用 loader entry，否则可能留下对官方工具的停用。

```powershell
dsh plugin --profile <test-profile> remove dsh-team-flow-continuous
```

等待 Agent 空闲后再停用或卸载。活动 wait 被停用时会返回 `TEAM_FLOW_RC2_DISABLED`；未捕获它的 PTC 程序可能停止后续语句。

</details>

## 兼容边界

- 使用可恢复的运行时方法装饰，复用宿主 Team 工具；没有修改宿主源码或安装文件。
- 不取消 Agent、不消费或重发 Inbox 消息。成功值为 `{timedOut:false, reason:'user-steer'}`，不是伪造 timeout。
- 方法装饰不是专用官方扩展 hook；其他装饰器、缓存方法或 ABI 变化可能冲突。不支持的契约在可检测时保留原等待并告警，模块不兼容也可能加载失败。
- `user Steer` 表示经 `Agent.steer()` 投递的 user 消息，不认证第三方调用是否来自真人。
- 不保证未经测试的新版本始终兼容，也不代表上游已合并修复。隔离 Mock 测试不等于真实模型效果或生产延迟。

[开发与复现](https://github.com/jidekaixin2dian/dsh-team-flow/blob/main/docs/development.md) · [验证矩阵](https://github.com/jidekaixin2dian/dsh-team-flow/blob/main/docs/verification.md) · [安全说明](SECURITY.md) · [问题反馈](https://github.com/jidekaixin2dian/dsh-team-flow/issues)

反馈请附 DSH / Node / OS 版本、Native 或 PTC、Steer / Queue 设置与最小复现，隐藏凭据、认证链接和私人会话内容。

MIT · 独立社区插件，与 DeepSeek 官方无隶属关系。
