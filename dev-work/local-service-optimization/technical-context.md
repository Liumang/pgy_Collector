# 技术现场与边界

日期：2026-09-13。

## 已核对事实

- cwd：`/Users/jiazhen/Documents/sheenzen/rednote`；当前非Git仓库。建立版本控制/检查点时先排除密钥、用户库、CSV、旧App和node_modules，不整体无审查加入仓库。
- desktop 0.2.3-demo：Electron 31.7.7系列，JS主进程+原生页面；renderer集中包含采集与定时任务。
- data-console 0.2.0：Express4、React18、TanStack Table8、Vite5、better-sqlite3 11；SQLite WAL。
- 后台固定`127.0.0.1:3188`；主进程通过Electron运行Node启动服务，stdio忽略；没有完整退出清理。
- 原始库：`~/Library/Application Support/PGY Collector/data/pgy.db`，在App外。
- 复核样本114位/482快照；21项缺陷观察已在内存样本复现。14项DB测试与2项桌面工具测试通过，不代表真实采集全通过。
- 当前增强先扫全部列表，再runDetailEnhancement；并非每页详情后翻页。
- 有现成backup/任务/字段的业务基础，但持久待写队列、任务断点和事件防重尚未实现。

## 可复用部分

- `normalizeCollectorRecord`作为入库边界，修正其数值与身份规则。
- `collectDetailWithQualityGate`作为唯一增强详情执行入口，更新判定语义并在三种任务入口复用。
- `field-labels.json`承接业务中文名和分组；`collector-fields.js`已有数值/文本列，扩展时统一来源。
- `update_jobs`、`update_job_runs`保留配置/运行关系，新任务项以增量迁移补上。
- 备注和MCN历史保留主键关联；不重建空库替换真实库。

## 验证命令

| 目录 | 命令 | 用途 |
| --- | --- | --- |
| data-console | `npm test` | DB/导入/任务现有用例 |
| data-console | `npm run check` | Node语法 |
| data-console | `npm run build` | 前端生产构建 |
| desktop | `npm test` | 桌面工具用例，后续补状态机 |
| desktop | `npm run check` | 主进程/preload/renderer语法 |
| 项目根 | `node acceptance-work/2026-09-13-cloud-readiness/reproduce.cjs` | 旧缺陷观察；修复后按项转为期望行为测试，不要求原观察永远通过 |
| desktop | `npm run package:mac` | 每批验收后生成App |

当前未配置统一lint/typecheck，不能将语法检查描述为全量静态类型检查。浏览器UI自动化工具需在实施时检查可用Playwright/Electron运行环境，不临时修改真实用户库以跑测试。

## 默认假设

- [assumption] 每次仅一个采集执行流程，后台浏览/备注可同时使用。
- [assumption] 本轮保持本地Demo；员工切换保持本机归属标记，不宣称已做身份验证。
- [assumption] 真实网页必须有登录和可核对样本；无此条件可先完成本地逻辑与模拟故障，真实字段验收保持未完成。
- [assumption] 中文表头、原始数据留存、App内后台与每次迭代记录继续遵守用户既有要求。
