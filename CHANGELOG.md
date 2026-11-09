# Changelog

## 0.2.1 — 2026-11-10

- Lead 有待处理的用户 Steer 时，延后尚未启动的前台 `workflow`，让宿主先处理插话。已运行的工作流和后台工作流继续执行。
- Defer foreground `workflow` calls that have yet to start when the Lead has a pending user Steer. Running and background workflows continue.

## 0.2.0 — 2026-11-06

- 版本命名转正：不再使用 `-alpha.N` 后缀，与 File Actions / Toolgate 一致采用纯 semver 版本号；0.2.0 高于 0.2.0-alpha.9，旧预览版用户可正常收到更新提示。
- npm 默认通道与 GitHub Release 从预览版转为正式版本；运行时代码与 0.2.0-alpha.9 完全一致，本轮只改版本元数据与相关说明。

- 兼容验证扩展到 DSH **0.2.2-rc.1**（`66491b05`）：严格 TypeScript 检查与 18 项
  隔离矩阵全部通过（`--host rc1`，CI 矩阵同步加入该 pin）。0.2.2 将
  `tools.execute` 改为原始调用批量、执行器按 Agent 作用域拆分——测试驱动以
  `tools.executable` 探测双代际并适配，生产代码不直接调用 `tools.execute`，
  wait_agent 装饰、Steer 唤醒、Node PTC 续跑与卸载还原行为不变。
- Extend verified host coverage to DSH **0.2.2-rc.1**: the strict TypeScript
  check and the full 18-item isolated matrix pass (`--host rc1`; the CI matrix
  gains the pin). 0.2.2 reshaped `tools.execute` into raw call batches and
  split executors per Agent scope — the test driver probes `tools.executable`
  and speaks both generations, production code never calls `tools.execute`
  directly, and wait_agent decoration, Steer wake, Node PTC continuation and
  unload restoration are unchanged.
- `tests/rc2.spec.ts` 的 interrupt 检查宿主名单加入 rc1：`interrupt=false`
  选项延续到 0.2.2，此前该检查在新 pin 上被跳过。
- The interrupt check in `tests/rc2.spec.ts` now also runs on the rc1 pin:
  the `interrupt=false` option carries into 0.2.2, where it was previously
  skipped.

## 0.2.0-alpha.9 — 2026-10-28

- 发布与更新维护：明确 npm 安装、GitHub 来源迁移、市场检测与重启步骤；保留既有运行时行为。
- 固定并验证 DSH 0.2.1-rc.4，同时保留较旧宿主回归。
- 新增 npm 公开发布配置、tag/main/CI/归档门槛与 Trusted Publishing 工作流；继续复用宿主运行时，不安装第二份 DSH。
- 保留 alpha 版本；npm 默认安装仍是预览版，先在测试 profile 验证。


## 0.2.0-alpha.8 — 2026-10-26

- 重整中英文 README：安装更新优先，保留兼容与权限边界，开发说明移入独立文档。
- Refresh Chinese/English documentation and installation guidance; runtime behavior is unchanged.
- 新增流程示意，保留 alpha 标识；GitHub 源安装支持市场版本检查。


## 0.2.0-alpha.7 — 2026-10-24

Verify official DSH 0.2.1-rc.3 (`1f81c047`) and make it the default pinned host: strict TypeScript check and the full 18/18 isolated matrix pass, with the `interrupt=false` check now also running on rc.3 (rc.2 re-verified 18/18). rc.2 → rc.3 ships UI features and version bumps only — none of the packages this plugin binds to changed source, so the runtime adapter is unchanged. CI matrix grows to four hosts (alpha1/alpha2/rc2/rc3); evidence and the rc.3 compatibility report are added under docs/ and verification/.

## 0.2.0-alpha.6 — 2026-10-24

Bind the `presentResult` wake detection to the serialized `{"timedOut":false,"reason":"user-steer"}` value instead of matching the Chinese presentation copy by prefix, so future copy or locale changes cannot break result routing; Steer wake behavior is unchanged and the 18/18 rc.2 isolated matrix re-runs green. Also carries the earlier non-runtime commits: the unified public host verification matrix and the typecheck output directory for reused host checkouts.

## 0.2.0-alpha.5

Verify latest official DSH 0.2.1-rc.2 (687f282e8625c6b8d11ff58211a90524be2e4317). Add it as the default pinned host and third Windows CI target, adapt the isolated harness to the host's lifecycle-owned JSONL persistence plugin, and test Steer with the new `interrupt=false` configuration. Runtime capability adapter and package identity remain unchanged. Chinese display name: 团队插话助手.

## 0.2.0-alpha.4

DSH Market packaging: declare Agent Teams bundle ordering and the minimum DSH version, ship an icon and exported manifest/patch paths, and track generated runtime files so the market's GitHub-source fallback installs without build scripts. Add isolated marketplace source/toggle/order checks, package installation checks and official patch composition regression coverage. The Steer runtime implementation is unchanged.

## 0.2.0-alpha.3

First public preview of the plugin-only capability adapter. Packages the same runtime implementation tested locally across rc.2, alpha.1 and alpha.2, with a standalone source tree, reproducible test harness and public installation guide. No host source patch.
