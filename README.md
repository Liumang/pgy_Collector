# 蒲公英博主采集助手

`rednote` 当前主要维护蒲公英博主采集助手、数据后台，以及正在迁移中的线上授权管理能力。

项目目标不是做一个一次性脚本，而是把蒲公英找博主、按昵称搜索、相似博主采集、增强详情采集、授权交付和打包发布，整理成可以小范围商业交付的 Mac 桌面工具。

本仓库保存各组件最新维护源码、必要资源、测试和交接资料。当前桌面版本为本地 Demo，已知准确性与稳定性问题仍待修复；当前开发范围为本地优化，云迁移暂缓。

## 下载源码和运行

```bash
git clone https://github.com/Liumang/pgy_Collector.git
cd pgy_Collector
npm --prefix desktop ci
npm --prefix data-console ci
npm --prefix desktop start
```

当前已验证环境为 macOS Apple Silicon、Node 20.19.5、npm 11.14.1。干净机器安装与完整打包尚未验收；Electron 与 better-sqlite3 的运行时和原生模块版本需保持一致。

桌面启动可能使用默认本地数据目录。仅调试后台时，使用独立目录和端口：

```bash
audit_data_dir=$(mktemp -d /tmp/pgy-collector-data.XXXXXX)
PGY_DATA_CONSOLE_DIR="$audit_data_dir" PGY_DATA_CONSOLE_HOST=127.0.0.1 PGY_DATA_CONSOLE_PORT=3198 npm --prefix data-console run dev
```

基础检查：

```bash
npm --prefix desktop run check
npm --prefix desktop test
npm --prefix data-console run check
npm --prefix data-console test
npm --prefix data-console run build
```

根目录 `npm run check`、`npm run build`、`npm run build:mac` 针对历史 Chrome 插件；当前桌面打包入口为 `npm --prefix desktop run package:mac`。

## 源码归档范围

- 提交桌面端、数据后台、授权生成器、命令行授权工具、历史插件、构建脚本和项目文档。
- 依赖目录、构建产物、App、历史安装包、用户数据库、CSV/Excel、私钥和本地配置由 `.gitignore` 排除。
- 授权生成器的真实凭据通过环境变量或被忽略的本地配置提供，参见 [生成器配置说明](license-generator/README.md)。私钥需由运营方单独提供。
- `showtime-intro-video/` 是独立视频工程，不属于本仓库归档范围。

## 当前工具

- `desktop/`：蒲公英博主采集助手，当前版本 `0.2.3-demo`（本地Demo，关闭授权门槛）
- `data-console/`：博主数据库后台和线上授权管理后台，当前版本 `0.2.0`
- `license-generator/`：本地授权码生成器，当前版本 `1.2.1`，后续由 `data-console` 授权管理替代
- `license-tools/`：命令行授权码工具和密钥说明，后续只作为历史调试工具保留
- `pgy-kol-collector/`：早期 Chrome 插件版本，作为历史版本和逻辑参考保留

## 文档目录

- [当前项目交接与代码完整性核查 2026-11-09](docs/plans/2026-11-09-project-handoff.md)
- [当前开发计划：本地服务优化](dev-work/local-service-optimization/implementation-plan.md)
- [本地优化具体任务与验收](dev-work/local-service-optimization/task-breakdown.md)
- [2026-09-13代码复核与问题清单](acceptance-work/2026-09-13-cloud-readiness/issue-log.md)
- [云端数据库迁移建议（最新版）](docs/plans/2026-09-13-cloud-database-migration-plan.md)
- [项目现状交接](docs/plans/2026-05-25-project-status-handoff.md)
- [功能点与迭代计划](docs/plans/2026-05-25-feature-iteration-tracker.md)
- [开发操作记录与固定流程](docs/plans/2026-05-25-development-operation-log.md)
- [发布与交付检查清单](docs/plans/2026-05-25-release-and-delivery-checklist.md)
- [数据入库架构设计](docs/plans/2026-05-25-user-database-architecture.md)
- [服务器版数据库后台规划](docs/plans/2026-06-03-server-database-backend-plan.md)
- [蒲公英博主采集助手使用说明](蒲公英博主采集助手_使用说明.md)
- [增强模式字段字典](ENHANCED_MODE_FIELDS.md)
- [产品化方案](PRODUCTIZATION_PLAN.md)
- [历史迭代记录](pgy-kol-collector/ITERATION_LOG.md)

## 固定工作规则

- 每次功能调整后，更新 `docs/plans/2026-05-25-feature-iteration-tracker.md`
- 每次准备交付前，更新并执行 `docs/plans/2026-05-25-release-and-delivery-checklist.md`
- 每次发现交付事故或用户反馈卡住、闪退、字段错误等问题，要把原因和处理方式写入迭代记录
- 授权私钥、飞书密钥、线上后台密钥、打包临时文件、用户导出的 CSV 不进入交付包

## 新会话恢复上下文

新会话里可以直接说：

```text
继续 rednote 项目。
请先阅读 docs/plans/2026-11-09-project-handoff.md 和 dev-work/local-service-optimization/build-handoff.md，
再检查当前代码状态。当前目标是本地服务优化，云迁移暂缓；计划待实施不代表功能已完成。
```
