# rednote 开发操作记录与固定流程

日期：2026-05-25

## 1. 文档定位

这份文档记录每次开发和交付相关操作。

后续每次做事按这个顺序写：

1. 用户提出的问题或需求
2. 本次判断
3. 改了哪些文件
4. 执行了哪些检查
5. 是否打包
6. 交付文件是什么
7. 还有什么风险或待确认

## 2. 固定开发流程

### 2.1 开始前

- 先确认用户最新需求，不沿用旧上下文里的过期目标
- 先看相关代码和已有文档
- 如果是 bug，先复现或定位原因，再改代码
- 如果是字段问题，优先用真实页面、真实导出 CSV 或截图核对

### 2.2 修改中

- 改代码前先说明本次要改哪里
- 保持改动聚焦，不顺手重构无关文件
- 涉及用户操作变化，同步更新使用说明
- 涉及字段变化，同步更新字段字典或迭代计划
- 涉及交付方式变化，同步更新发布检查清单

### 2.3 完成后

- 运行必要检查
- 需要交付 App 时重新打包
- 记录本次变更到 `docs/plans/2026-05-25-feature-iteration-tracker.md`
- 记录本次操作到本文档
- 告诉用户最终产物在哪里

## 3. 固定检查命令

采集助手：

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote/desktop
npm run check
```

授权码生成器：

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote
node --check license-generator/src/main.js
node --check license-generator/src/preload.js
node --check license-generator/src/renderer.js
```

打包：

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote/desktop
npm run package:mac
```

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote
node license-generator/package-license-app.mjs
```

签名检查：

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote
codesign --verify --deep --strict --verbose=2 dist/PGY\ Collector\ Desktop.app
codesign --verify --deep --strict --verbose=2 dist/PGY\ License\ Generator.app
```

## 4. 本次操作记录

### 2026-11-09 各组件源码和交接资料归档到GitHub

用户要求：将各组件最新版本代码及交接文档上传至 `https://github.com/Liumang/pgy_Collector` 的main分支。

归档范围：desktop 0.2.3-demo、data-console 0.2.0、license-generator 1.2.1、license-tools、早期Chrome插件0.4.0、构建工具、必要图标资源、现有测试与项目文档。独立视频工程不属于本次归档。

实施内容：

- 初始化本地Git并连接指定origin，添加 `.gitignore`，排除依赖、产物、数据库/导出文件、私钥及运营本地配置。
- 生成器通过 `src/config.js` 读取环境变量或可选JSON；真实配置留在被忽略的本地文件，新增空值示例、配置说明及7项行为测试。
- 文档链接适配GitHub，历史服务器地址脱敏，更新README、最新交接及迭代记录。旧App/zip未重新打包，不能据源码调整认定旧产物已脱敏。

验收条件：上传文件包含各组件源码/资源/测试/交接，暂存内容不含已知真实凭据/私钥/用户数据，配置读取不回显秘密，远端main最终树与本地提交一致。提交及推送结果以Git记录为准。

验证：新增生成器配置测试7/7及main/config/preload/renderer/打包脚本语法检查通过；原核心源码的16项测试结果仍适用，业务缺陷未在本次修复。暂存检查和远端核对在提交推送阶段执行；不将上传源码等同于产品验收通过。

### 2026-11-09 代码完整性复核与项目交接

用户要求：读取“采集助手”原聊天，核查当前项目代码是否完整，并输出交接文档。

本次处理：

- 核对原聊天最后决定为本地优化、暂缓上云；检查desktop、data-console、授权工具、历史插件和发布脚本。
- 新增 `docs/plans/2026-11-09-project-handoff.md`，包含完整性判断、目录版本、调用链、数据配置、当前缺陷、验证结果、授权与交付边界及接手顺序。
- 更新README交接入口和新会话恢复指令。未改业务代码、用户库、版本号或已有发布物。

检查结果：desktop测试2/2、data-console测试14/14及两端语法检查通过；历史插件check与生成器三个JS入口语法检查通过；前端构建到独立临时目录通过。旧内存库复现脚本21项缺陷观察全部命中，表示问题仍存在，不是产品验收通过。

发布核对：现有App及0.2.3-demo zip中19个业务源码文件与当前源文件一致，App签名完整性检查通过；当前为arm64、ad-hoc签名。zip按路径未发现PEM、env、DB、SQLite、CSV类型文件，此检查不代表完整秘密扫描。

结论：核心源码基本齐备，仍为本地Demo；数据准确性、可靠入库、恢复能力及正式发布未完成。现有26项本地优化任务仍待实施。本次未访问真实网页登录态、未读取真实库统计、未做GUI/长跑/干净机器安装或重新打包。

### 2026-09-13 调整为本地服务优化计划

用户最新指示：暂停考虑上云，先给出服务优化具体明细和开发计划。

本次处理：

- 将19组审查问题重新映射到本地范围；公网账号/多租户/服务器/PostgreSQL与授权改造挂起。
- 新增 `dev-work/local-service-optimization/` 六份开发规划：实施计划、技术上下文、T00-T25任务清单、AC00-AC25验收、风险、执行入口。
- 按基线准备与四批交付组织：A数据准确性、B任务与服务恢复、C查询导出维护、D容量与交付验证。
- 明确普通采集保留未尝试增强模块、增强失败不伪装新值、MCN三态、自检仅补一次、日更本机暂停续跑、逐页节点和完整清单。
- 文件路径/命令经当前源码重新核对；本次只修改规划文档，未修改业务代码、用户库或打包App。

验证：检查规划文件完整性、26个任务与26项验收一一对应、依赖无循环、已有源码路径可定位。计划Ready表示可开始执行，不表示功能完成。

### 2026-09-13 代码复核与云端数据库迁移规划

用户目标：梳理代码和逻辑的细节问题，同时给出数据库上云、员工共享数据的建议方案。

本次判断：

- 当前本地版本尚不能直接作为公网服务；主要阻断在身份匹配、字段口径、有效最新数据、可靠入库、任务恢复和员工鉴权。
- 采用Mac继续采集、SQLite持久待同步队列、云端Node API+React+PostgreSQL的方案。
- 可独立复用youbet所在服务器，但不修改其业务代码/数据库；本次没有连接或部署服务器。

修改文件：

- 新增 `docs/plans/2026-09-13-cloud-database-migration-plan.md`。
- 新增 `acceptance-work/2026-09-13-cloud-readiness/`：需求覆盖、回归记录、验证报告、19组问题清单、上线清单、验收判断及内存数据复现脚本。
- 更新README入口/版本、功能迭代记录、旧服务器规划的最新方案链接。
- 未修改业务源代码或用户数据；后台构建检查会重生成data-console/dist。

检查结果：

- `data-console npm test`：14/14；`desktop npm test`：2/2。
- 两端 `npm run check` 和 `data-console npm run build`：通过。
- 内存假数据复现21项问题行为（不是产品通过21项验收），临时HTTP服务结束后关闭。
- 用户SQLite只读核查：114位博主、482份快照、22批次、2次更新任务；quick_check=ok；2位历史博主无ID。
- 当前50位列表响应约6.04MB、112位任务候选约13.76MB；原始API在raw_json和raw_api_json重复保存。
- 本地3188当前无服务监听，未声称完成真实蒲公英/桌面运行回归。

是否打包：否，本次是审查和方案，不生成新App、不切换用户进程。

待实施：优先修复P1；后续完成4万规模压测、真实页面字段对照、Mac休眠/断网恢复、迁移预演和备份恢复演练。

### 2026-06-03 线上授权中心与服务器版规划

用户需求：

- 授权码改为线上验证后，希望降低被盗用风险
- 需要管理后台替代飞书表格和本地授权码生成 App
- 需要判断未来线上入库时每 100 条数据占用多大空间
- 需要更新 README、交付清单、使用说明，规划服务器版数据库后台
- 涉及前端更改后，版本号从 `v0.2.0` 开始

本次判断：

- 线上验证可以大幅降低授权码被转发盗用的风险，因为授权码由服务端统一登记、首次激活绑定机器码、跨机器使用会被拒绝
- 线上验证不是绝对防护：如果服务器不可访问则无法验证；如果用户机器被复制或被远控，仍需要管理端停用或重置
- 授权管理后台不能默认出现在客户本地 App 中，因此新增 `PGY_LICENSE_ADMIN_ENABLED=1` 管理端开关
- 当前只做本地代码和规划，不部署服务器，不改 youbet 业务代码

本次修改文件：

- `desktop/package.json`
- `desktop/package-lock.json`
- `desktop/src/main.js`
- `desktop/src/index.html`
- `desktop/src/renderer.js`
- `data-console/package.json`
- `data-console/package-lock.json`
- `data-console/src/db.js`
- `data-console/src/server.js`
- `data-console/src/ui/App.jsx`
- `data-console/src/ui/LicenseAdmin.jsx`
- `data-console/src/ui/styles.css`
- `data-console/test/data-store.test.js`
- `README.md`
- `RELEASE_CHECKLIST.md`
- `蒲公英博主采集助手_使用说明.md`
- `docs/plans/2026-05-25-feature-iteration-tracker.md`
- `docs/plans/2026-05-25-release-and-delivery-checklist.md`
- `docs/plans/2026-06-03-server-database-backend-plan.md`

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`
- `desktop`: `npm run package:mac`
- 本地浏览器烟测：默认模式不显示授权管理
- 本地浏览器烟测：`PGY_LICENSE_ADMIN_ENABLED=1` 后显示授权管理
- 授权接口烟测：生成 1 个授权码，同机器激活返回 `200`，换机器激活返回 `403`
- 源码启动 `Desktop v0.2.0`：授权状态正常，App 内数据后台可打开，版本显示正确
- 打包 App 启动验证：`dist/PGY Collector Desktop.app` 可打开，右侧显示 `Desktop v0.2.0`
- 打包 App 数据后台验证：点击“数据后台”后 `127.0.0.1:3188` 正常渲染，已加载本地库 `80` 位博主，不白屏
- 打包 App 接口验证：`/api/health` 返回正常，`/api/config` 显示 `licenseAdminEnabled=false`，客户默认模式访问 `/api/licenses` 返回 `404`
- 真实蒲公英采集回归尝试：点击 `打开找博主` 后 Electron 内置浏览器回到蒲公英未登录首页，未进入找博主列表，因此没有点击 `开始采集`
- Chrome 登录态尝试：Chrome 当前没有可接管的蒲公英标签，无法用 Chrome 登录态补做真实页面采集验证
- 二次真实回归尝试：重新打开 `dist/PGY Collector Desktop.app` 后仍停留在蒲公英登录弹窗，真实采集回归需要用户先在 App 内完成蒲公英登录

存储估算：

- 本机真实库：`80` 个博主、`192` 个快照，主库约 `648KB`，SQLite page 约 `760KB`，WAL 约 `4MB`
- 合成增强样本：`100` 个博主、`100` 个快照、`100` 个批次明细、`400` 个标签，主库约 `452KB`
- 服务器预留建议：按 `2-5MB/100条增强采集数据` 估算，包含 WAL、索引、原始 JSON、后续字段膨胀和备份冗余

本次未做：

- 未部署线上服务
- 未修改 youbet 业务代码
- 真实蒲公英采集回归待后续在 Electron 内置浏览器登录蒲公英后执行

交付/测试文件：

- `dist/PGY Collector Desktop.app`
- `dist/pgy-collector-desktop-mac-v0.2.0.zip`

### 2026-05-26 新增按成本核心指标采集

用户反馈：

- 详情页核心指标里有“按成本”页签
- 需要采集其中的预估CPM、预估阅读单价、预估互动单价

本次调整：

- 桌面采集助手升级到 `0.1.38`
- 增强采集在详情页加载完成后自动点击“按成本”，读取三项成本指标
- 导出 CSV 增加中文表头：`预估CPM（日常笔记/按成本）`、`预估阅读单价（日常笔记/按成本）`、`预估互动单价（日常笔记/按成本）`
- 数据后台字段字典和历史 CSV 导入同步支持这三项字段

测试 App：

- `PGY Collector Desktop v0.1.38.app`

### 2026-05-25 新增合作品牌与完整粉丝年龄分布

用户反馈：

- 子页面合作笔记里能看到合作品牌，例如美团福利官、榴芒一刻、京东、香飘飘等
- 需要把合作品牌与该条合作笔记发布时间一起保存
- 粉丝年龄分布需要完整保存 `<18`、`18-24`、`25-34`、`35-44`、`>44` 所有占比
- 数据后台展示年龄分布时，把占比最高的一档加粗高亮

本次调整：

- 桌面采集助手升级到 `0.1.37`
- 增强采集新增 `recent_coop_brand_notes`，展示为“品牌名（发布时间）”
- 增强采集新增 `fans_age_distribution` 与五个年龄段占比字段
- 数据后台详情页新增年龄分布高亮展示
- CSV 导出和历史 CSV 导入同步支持新增中文表头

测试 App：

- `PGY Collector Desktop v0.1.37.app`

### 2026-05-25 修复徐拖拉重刷后阅读和互动为 0

用户反馈：

- 徐拖拉重刷后仍显示阅读中位数和互动中位数为 `0`
- 实际蒲公英里有有效数值

排查结论：

- 徐拖拉详情页的日常笔记表现接口返回 `0`
- 同次增强采集已拿到合作笔记近30日数据：阅读中位数 `11765`、互动中位数 `509`
- 主表阅读/互动字段被日常笔记的 `0` 覆盖，导致列表显示不符合当前业务查看口径

本次调整：

- 桌面采集助手升级到 `0.1.36`
- 当主表阅读中位数/互动中位数为空或为 `0`，且合作笔记近30日对应字段有有效值时，自动用合作笔记近30日数据补主表字段
- 已将徐拖拉当前最新快照补回阅读中位数 `11765`、互动中位数 `509`

测试 App：

- `PGY Collector Desktop v0.1.36.app`

### 2026-05-25 修复单个博主重刷后列表找不到

用户反馈：

- 刚刚重刷徐拖拉后，右侧提示已重刷，但是列表里找不到这个博主

排查结论：

- 数据库里徐拖拉记录仍存在，未被删除
- 手动重刷写入的采集时间使用了 UTC 文本时间，早于当前本地采集批次时间
- 数据后台默认按“最近采集”降序排序，所以徐拖拉被排到后面的页里，看起来像从当前列表消失

本次调整：

- 桌面采集助手升级到 `0.1.35`
- 手动重刷统一写入本地时间
- 重刷完成后数据后台自动回到最近采集第一页，并刷新该博主详情
- 重刷增加身份锁校验，避免详情页跳转异常时把当前博主写成另一个博主
- 已将徐拖拉当前最新快照时间修正为本地时间，让她回到最近采集列表前列

测试 App：

- `PGY Collector Desktop v0.1.35.app`

### 2026-05-25 单个博主最新数据重刷

用户反馈：

- 数据后台里需要选择某个博主，重刷最新数据
- 例如 `639976201` 的徐拖拉，阅读中位数和互动中位数是 `-`，大概率是采集时失误，需要重新采集该博主

本次调整：

- 桌面采集助手升级到 `0.1.34`
- 数据后台博主详情页新增 `重刷最新数据` 按钮
- 新增 `desktop/src/data-console-preload.js`，用于 App 内数据后台向桌面采集助手发送重刷请求
- 桌面采集助手收到请求后，会用当前蒲公英登录态打开该博主详情页
- 重刷时会重新解析基础字段和增强字段，包括阅读中位数、互动中位数、报价、合作笔记、粉丝画像等
- 重刷结果写入新的数据库批次和新快照，不覆盖历史快照
- 重刷完成后数据后台会刷新当前博主详情和列表数据

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 实际启动 `PGY Collector Desktop v0.1.34.app`，进入数据后台，确认博主详情显示 `重刷最新数据` 按钮

测试 App：

- `PGY Collector Desktop v0.1.34.app`

### 2026-05-25 博主详情完整字段中文化

用户反馈：

- 博主详情里的全部采集字段不能直接堆开发字段名
- 客户不认识字段名对应什么数据
- 右边博主详情区域需要放大
- 所有数据需要对应到蒲公英里的名称

本次调整：

- 桌面采集助手升级到 `0.1.33`
- 新增 `data-console/src/field-labels.json`，集中维护数据库后台详情和导出的中文字段口径
- 数据后台详情里的“全部采集字段”改为中文字段名展示
- 字段按蒲公英页面结构分组：基础资料、合作报价、日常笔记数据、合作笔记数据、粉丝分析、采集信息等
- 数据后台右侧详情栏宽度从 `340px` 调整到 `520px`
- 数据后台导出当前筛选复用同一套中文字段名称

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 实际启动 `PGY Collector Desktop v0.1.33.app`，进入数据后台，确认右侧详情加宽且“全部采集字段”按中文分组展示

测试 App：

- `PGY Collector Desktop v0.1.33.app`

### 2026-05-25 增强采集详情阶段进度与单实例保护

用户反馈：

- 当前运行中的 App 看起来又开始一直重复采集不停止

原因判断：

- 现场查看时，列表采集已经达到最大页数 `2`，共识别 `40` 条
- 后续并不是回到第 1 页重复采集列表，而是在增强采集阶段逐个打开 40 个博主详情页补充字段
- 旧 UI 仍显示 `当前页 2`，没有把详情阶段的 `第几个/总数` 单独展示出来，容易被误判为第 2 页一直重复
- 同时发现用户电脑上存在两个同版本 App 实例，分别来自根目录 App 和 `dist` App，存在互相干扰风险

本次调整：

- 桌面采集助手升级到 `0.1.32`
- 增强详情阶段的当前页展示改为带详情进度，例如 `2 · 详情 3/40`
- 合作笔记读取提示补充总进度、页码和页内序号
- 停止按钮在详情页加载、接口等待、合作笔记重试之间增加更多停止检查点
- 主进程增加单实例锁，重复打开同一个新版 App 时聚焦已有窗口，不再启动第二个采集器

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 退出旧版运行进程后启动 `PGY Collector Desktop v0.1.32.app`，确认界面显示 `Desktop v0.1.32`
- 重复打开 `PGY Collector Desktop v0.1.32.app`，确认未新增第二个主 App 进程

测试 App：

- `PGY Collector Desktop v0.1.32.app`

### 2026-05-25 数据后台布局与完整字段导出调整

用户反馈：

- 导出的数据字段不止博主库表格里展示的几列
- 数据后台不需要继续展示右侧采集控制
- 数据后台筛选栏和博主库表格发生重叠
- 采集助手里的常规采集和增强采集应该放到右侧任务模式上方

原因判断：

- 数据后台列表表格本来只用于展示核心字段，完整字段主要保存在最新采集快照的 `raw_json`
- 后台内嵌到 App 后仍沿用了采集助手的右侧控制栏，占用了后台横向空间
- 三栏布局固定宽度偏大，导致部分窗口宽度下出现挤压和重叠

本次调整：

- 桌面采集助手升级到 `0.1.31`
- 数据后台 Tab 下隐藏右侧采集控制栏
- 采集助手 Tab 将“采集方式”移动到右侧控制栏，并放在“任务模式”上方
- 数据后台布局改为左侧筛选、中间表格、右侧详情的稳定三栏结构
- 博主详情新增“全部采集字段”，展示最新采集快照里的原始字段
- 后台“导出当前筛选”合并最新快照 `raw_json`，导出字段不再局限于表格展示列

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 实际启动 App 后点击 `采集助手 / 数据后台`，确认数据后台可显示、右侧采集控制已隐藏、采集方式已移动到右侧任务模式上方

测试 App：

- `PGY Collector Desktop v0.1.31.app`

### 2026-05-25 数据后台标签对象白屏修复

用户反馈：

- 打开 `0.1.29` 后点击数据后台仍然白屏

原因判断：

- 包内后台已经返回生产静态页面，API 和静态资源都正常
- 数据后台 React 页面在加载第一条博主详情时崩溃
- 详情接口里的 `tags` 是对象数组，例如 `{ tag_name: "美食" }`
- 前端 `TagList` 之前直接渲染 `tag`，对象不能作为 React 子元素，导致整个后台白屏

本次调整：

- 桌面采集助手升级到 `0.1.30`
- `data-console/src/ui/App.jsx` 增加 `cleanText`、`normalizeTags`、`mergeTags`
- 标签组件统一把字符串、对象、空值转成可展示文本
- 详情面板合并 `tags` 和 `content_tags` 时走容错归一化

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 实际启动 App 后点击 `数据后台`，确认可以显示博主库、表格、筛选和详情面板

测试 App：

- `PGY Collector Desktop v0.1.30.app`

### 2026-05-25 停止后切换数据后台白屏修复

用户反馈：

- 点击开始采集后点停止，再点数据后台，App 内数据后台白屏加载不出来
- 后续测试版 App 只放项目文件夹，不再放桌面

原因判断：

- `3188` 后台 API 正常，`/api/health` 可以返回数据库路径
- 但当前桌面测试版启动的数据后台首页返回了 Vite 开发页面，包含 `/@vite/client` 和 `/src/ui/App.jsx`
- 说明 `.app` 放在桌面直接运行时，Electron `app.isPackaged` 不稳定符合预期，数据后台误走开发模式
- 白屏来自前端页面加载层，不是 SQLite 或 API 服务损坏

本次调整：

- 桌面采集助手升级到 `0.1.29`
- 包内数据后台启动时强制传入 `PGY_DATA_CONSOLE_STATIC=1`
- `data-console` 服务识别 `PGY_DATA_CONSOLE_STATIC=1` 后直接使用 `dist` 静态生产页面
- 新测试 App 只复制到项目文件夹根目录

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 使用包内 Electron 启动 `data-console/src/server.js`，确认首页不再包含 `/@vite/client`，静态资源 `/assets/index-ePTRiwyD.js` 返回 200

测试 App：

- `PGY Collector Desktop v0.1.29.app`

### 2026-05-25 边采边入库与 App 内数据后台

用户反馈：

- 采集完成后再入库不符合预期，用户希望采集时就入库
- 单独打开网页后台来回切换麻烦，希望直接集成到 App 里，像两个 Tab 一样切换

原因判断：

- 结束后整批写入依赖最终流程完整走到收尾，一旦中途停止、异常或窗口状态丢失，已采集数据存在落库风险
- 外部浏览器后台虽然可用，但对非技术用户不够顺手，容易造成“网页拒绝连接/不知道怎么打开”的理解成本

本次调整：

- 桌面采集助手升级到 `0.1.28`
- 开始采集时先创建 `collect_batches` 批次
- 列表页每识别出新博主后立即追加写入数据库
- 增强采集详情页补齐后追加增强快照，但设置为不重复计入批次采集条数
- 增加数据库写入队列，结束批次前等待所有已排队写入完成
- App 左侧区域增加 `采集助手 / 数据后台` 两个页面，数据后台用内置 `webview` 打开 `http://127.0.0.1:3188`
- 右侧按钮从外部打开改为 `查看数据后台`，点击后切换到 App 内数据后台页面

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`

打包与交付：

- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 交付包：`dist/pgy-collector-desktop-mac-v0.1.28.zip`

### 2026-05-25 采集结束回到第 1 页与未入库修复

用户反馈：

- 最大页数设为 5、每页 20，第 5 页跑完后页面又回到第 1 页
- 采集完成提示已采集 99 条，但数据库刷新后没有数据

原因判断：

- 页面回到第 1 页不是重新采集，而是增强采集结束后代码强制执行 `els.webview.src = PGY_URL`，导致蒲公英页面回到找博主页初始视图
- 数据库写入原先只在 `!state.stopRequested` 时执行；如果过程中出现停止标记或异常结束状态，就会跳过已有数据写入
- 数据库写入超时原为 20 秒，大批量增强采集数据写入时容忍度偏低

本次调整：

- 桌面采集助手升级到 `0.1.27`
- 结束流程不再强制重置网页地址，避免视觉上回到第 1 页
- 只要 `state.records.length > 0` 就尝试写入本地数据库
- 写库 payload 增加 `status`，中止任务也会形成批次
- 写库超时从 20 秒放宽到 120 秒

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check`
- `data-console`: `npm test`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`

交付文件：

- `dist/pgy-collector-desktop-mac-v0.1.27.zip`

当前 99 条数据处理：

- 系统当前已看不到旧采集助手窗口，只有后台 Electron 进程，无法再通过 UI 点击导出当前内存中的 99 条
- 如果旧窗口仍在用户屏幕上可见，需要先点 `导出 CSV` 保存一次，再用数据后台 `导入历史 CSV` 入库
- 如果旧窗口已经不可操作，需用 `0.1.27` 重新跑一次；新版会自动入库

### 2026-05-25 本地数据后台自动启动修复

用户反馈：

- 打开 `http://127.0.0.1:3188` 时提示拒绝连接

原因判断：

- 3188 是本地后台服务地址，只有服务启动后才能访问
- 上一版主要在点击“打开数据后台”或采集写入数据库时启动服务；如果用户直接打开 URL，就会看到拒绝连接

本次调整：

- 桌面采集助手升级到 `0.1.26`
- 授权状态有效并进入工具后，自动调用 `startDataConsole`
- 授权码首次登录成功后，也自动启动本地数据后台
- 保留 `openDataConsole` 负责启动并打开浏览器

已执行检查：

- `desktop`: `npm run check`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`

交付文件：

- `dist/pgy-collector-desktop-mac-v0.1.26.zip`

### 2026-05-25 本地数据库后台 v1

用户需求：

- 建一个本地 localhost 可访问的数据库前端
- 采集数据入库后，可以像蒲公英一样多维筛选搜索
- 公司员工可以各自查询、备注、更新博主状态
- 先本地运行，后续再给服务器

本次判断：

- 第一版采用 `SQLite + Node API + React`，访问地址固定为 `http://127.0.0.1:3188`
- 保留现有 CSV 导出，数据库作为新增能力
- 采集完成后自动写入数据库；写入失败不阻断 CSV 导出
- 先做本地员工账号和备注协作，真正多人同时访问等服务器阶段再完善

本次新增文件：

- `data-console/package.json`
- `data-console/src/db.js`
- `data-console/src/importer.js`
- `data-console/src/server.js`
- `data-console/src/exporter.js`
- `data-console/src/path.js`
- `data-console/src/ui/App.jsx`
- `data-console/src/ui/styles.css`
- `data-console/test/data-store.test.js`

本次修改文件：

- `desktop/src/main.js`
- `desktop/src/preload.js`
- `desktop/src/renderer.js`
- `desktop/src/index.html`
- `desktop/package.json`
- `desktop/package-lock.json`
- `desktop/tools/package-mac.mjs`
- `蒲公英博主采集助手_使用说明.md`

已执行检查：

- `data-console`: `npm run check`
- `data-console`: `npm test`
- `data-console`: `npm run build`
- `desktop`: `npm run check`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`

本地验证：

- 已启动 `http://127.0.0.1:3188`
- 已通过 API 写入样例博主
- 已验证关键词 + 标签筛选
- 已验证新增员工、添加备注、编辑备注、删除备注、状态更新
- 已验证打包 App 内置 data-console 能用 Electron 内置 Node 启动
- 已验证打包 App 内置 data-console 的生产静态页面可访问

交付文件：

- `dist/pgy-collector-desktop-mac-v0.1.25.zip`

风险：

- 当前本地后台依赖 SQLite 原生模块 `better-sqlite3`，打包包体会变大
- 当前仍是本地单机协作模型，上服务器后需要正式登录态和权限控制

### 2026-05-25 文档体系对齐

用户需求：

- 参考 `sheenzen/sheenzen_code` 的开发文档格式
- 在本项目中按同样方式做好开发记录和所有操作

本次判断：

- `sheenzen/sheenzen` 路径不存在
- 用户更正为 `sheenzen/sheenzen_code`
- 参考对象为 `docs/plans` 下的项目交接、迭代计划、发布事故/SOP、同步清单等文档格式

本次新增文件：

- `README.md`
- `docs/plans/2026-05-25-project-status-handoff.md`
- `docs/plans/2026-05-25-feature-iteration-tracker.md`
- `docs/plans/2026-05-25-release-and-delivery-checklist.md`
- `docs/plans/2026-05-25-user-database-architecture.md`
- `docs/plans/2026-05-25-development-operation-log.md`

本次未做：

- 未移动旧文档，避免破坏原有引用路径
- 未删除旧 Chrome 插件说明，作为历史版本保留
- 未重新打包 App，本次只做文档体系整理

后续口径：

- 每次开发改动写入功能点与迭代计划
- 每次检查、打包、交付写入本操作记录
- 每次发布前按发布与交付检查清单执行

### 2026-06-03 youbet 服务器连通性检查

用户需求：

- 先确认采集助手线上部分能否连到 `youbet` 所在服务器
- 当前线上方案还未最终确定，不部署服务
- 不修改 `youbet` 业务代码

本次只读检查：

- 已定位 `youbet` 项目：`/Users/jiazhen/Documents/sheenzen/youbet`
- 已读取 `youbet` 部署文档与服务配置
- 已通过 SSH 连通新服务器：`SERVER_IP:22022`
- 远端用户：`ubuntu`
- 远端主机名：`ubuntu-2vcpu-amd-4gb-sg-youbet`
- 远端现有项目目录：`/opt/bc`
- 现有 `youbet` 服务状态：`bc-web.service active`
- 现有反代状态：`nginx active`
- 现有监听端口：`80`、`443`、`3000`
- 预留检查：`3188` 未被占用
- 预留目录检查：`/opt/pgy`、`/opt/pgy-collector` 当前不存在
- 远端运行环境：Node `v24.14.1`、npm `11.11.0`、SQLite `3.37.2`
- 远端容量：系统盘约 `58G`，已用约 `28G`，可用约 `31G`
- 远端内存：约 `3.8Gi`，可用约 `3.1Gi`
- 公网主域检查：`https://SERVER_DOMAIN` 返回 `HTTP/2 200`
- `www.SERVER_DOMAIN` 检查：现有证书不匹配 `www` 域名
- IP HTTP 检查：`http://SERVER_IP` 返回 `301` 跳转到 HTTPS

本次未做：

- 未部署 `data-console`
- 未创建远端目录
- 未上传文件
- 未修改 nginx/systemd
- 未修改 `youbet` 项目文件

阶段结论：

- 服务器 SSH、现有 Web 服务、公网主域均已连通
- 后续如果决定部署，建议采集助手线上部分作为独立服务放在独立目录和独立端口，不混入 `/opt/bc` 或 `bc-web.service`
- 线上入口方案仍需后续确定：独立子域名、独立路径，或仅内网/SSH 隧道访问

### 2026-06-03 v0.2.1 真实采集回归与收口

用户目标：

- 对线上授权、授权管理后台、存储估算、文档与真实采集回归做完整收口
- 前端相关版本从 `v0.2.0` 开始

本次发现：

- 使用辅助工具直接设置“最大页数”时，输入框可能被置空
- 旧逻辑会把空值按默认 `100` 页处理，有误跑多页风险
- 旧版页面脚本可以逐行读取 20 个博主，但主界面可能没有收到 `records` 数组，导致批次显示 `0` 条

本次修复：

- 桌面端升级到 `0.2.1`
- 最大页数、每页最多、延迟改为启动前严格校验，空值或非法值直接提示，不再兜底成 `100`
- 采集页面脚本的记录消息改为 `recordsJson` 传输，主界面再解析，避免 Electron 消息桥丢失数组字段
- 数据库批次创建改为读取启动时锁定的采集参数，避免输入框后续变化影响批次口径

真实蒲公英回归：

- 使用打包 App：`dist/PGY Collector Desktop.app`
- 窗口显示：`Desktop v0.2.1`
- 采集方式：常规采集
- 任务模式：当前列表
- 最大页数：`1`
- 每页最多：`20`
- 延迟：`1400ms`
- 页面：蒲公英找博主真实列表
- 结果：批次 `#10` 完成，正式采集 `20` 条
- 自检：发现 `2` 个博主有空值，已各补采 `1` 次，剩余空值按最终结果保留
- 翻页：未进入第 `2` 页

数据库核验：

- 数据库：`~/Library/Application Support/PGY Collector/data/pgy.db`
- `collect_batches` 最新批次：`id=10`
- `task_mode=list`
- `collect_mode=normal`
- `max_pages=1`
- `per_page_limit=20`
- `status=完成`
- `total_collected=20`
- `empty_recheck_count=2`
- `batch_items` 最新批次明细：第 `1` 页 `22` 条，其中 `20` 条为正式列表采集，`2` 条为自检补采记录
- `blogger_snapshots` 最新批次快照：`22` 条

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check && npm test && npm run build`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 本地后台：`GET http://127.0.0.1:3188/api/health`
- 本地后台配置：`GET http://127.0.0.1:3188/api/config`，客户模式下 `licenseAdminEnabled=false`
- 客户模式授权接口：`GET http://127.0.0.1:3188/api/licenses` 返回 `404`
- 临时管理验证：使用 `PGY_DATA_CONSOLE_PORT=3190`、`PGY_LICENSE_ADMIN_ENABLED=1`、临时数据库启动 data-console
- 临时管理验证结果：`POST /api/licenses/generate` 可生成授权码；`POST /api/licenses/activate` 可首次激活并绑定机器码；同一授权码换机器码再次激活会返回“授权码已在其他设备激活”；授权列表不暴露完整授权码
- 临时管理服务验证后已停止，`3190` 端口已释放

交付文件：

- `dist/PGY Collector Desktop.app`
- `dist/pgy-collector-desktop-mac-v0.2.1.zip`

阶段结论：

- `v0.2.1` 已完成一页真实采集回归
- 授权管理后台仍默认不对客户显示
- 线上服务仅完成连通检查，未部署

### 2026-06-10 v0.2.2-demo 本地验收 Demo

用户目标：

- 交付一版客户先验收用的本地 Demo
- 移除桌面端飞书通知链路和授权登录门槛
- 保留采集、CSV 导出、自动入库和本地数据后台能力

本次调整：

- 桌面端升级到 `0.2.2-demo`
- 删除桌面端主进程里的飞书密钥、飞书请求、授权校验 IPC
- 删除预加载层暴露的授权状态、激活、退出登录方法
- 删除授权码弹窗和退出登录按钮
- 右侧底部改为 `本地 Demo｜离线演示`
- 打开 App 后直接进入采集助手，同时自动启动本地数据后台

已执行检查：

- `desktop`: `npm run check`
- `data-console`: `npm run check && npm test && npm run build`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- `dist/PGY Collector Desktop.app`: `CFBundleShortVersionString=0.2.2-demo`
- 包内敏感信息扫描：未发现飞书接口、飞书 app id/app secret/base token、旧桌面授权 IPC、公钥/私钥、webhook、`.pem/.key/.env`
- 本地后台：`GET http://127.0.0.1:3188/api/health` 返回 `ok=true`
- 本地后台配置：`GET http://127.0.0.1:3188/api/config` 返回 `licenseAdminEnabled=false`
- 本地后台授权激活入口：客户模式下 `POST http://127.0.0.1:3188/api/licenses/activate` 返回 `404`
- 打开打包 App 后界面显示 `Desktop v0.2.2-demo`，无授权弹窗，直接进入采集助手

交付文件：

- `dist/PGY Collector Desktop.app`
- `dist/pgy-collector-desktop-mac-v0.2.2-demo.zip`

### 2026-08-13 数据后台字段全量展示与详情阅读优化

用户反馈：

- 数据后台详情页不应该隐藏空字段，空值展示 `-` 即可
- 增强采集额外保存原始接口数据可以接受
- 筛选功能应该放在顶部，左侧留给每日增强更新
- 右侧博主详情需要参考蒲公英详情页布局优化，目前太难找数据

本次调整：

- `blogger_snapshots` 新增 `raw_api_json`，老数据库启动时自动补列
- 增强采集在每个博主详情采集完成后，把捕获到的详情接口、合作笔记接口、成本指标页面文本、合作笔记页面文本等保存为原始接口快照
- 数据后台详情页不再过滤空字段，所有 `field-labels.json` 中配置的采集字段都会展示，空值统一显示 `-`
- 数据后台筛选表单、批次筛选、历史 CSV 导入、当前筛选导出、员工切换移动到博主库顶部
- 左侧栏只保留品牌导航和每日增强更新工具
- 右侧详情重排为蒲公英式分区：基础信息、核心指标、合作报价、全部采集字段、员工备注、协作状态、MCN 历史、历史采集
- 全部采集字段增加分组导航，便于快速定位日常笔记、合作笔记近 30/90 日、粉丝分析、笔记与相似博主等模块

已执行检查：

- `data-console`: `npm test`
- `data-console`: `npm run check`
- `data-console`: `npm run build`
- `desktop`: `npm run check`
- `desktop`: `npm test`
- 临时打开 `http://127.0.0.1:3190` 做 UI 截图检查：无白屏，顶部筛选和表格不重叠，右侧详情分区正常
- `desktop`: 升级到 `0.2.3-demo`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- `dist/PGY Collector Desktop.app`: `CFBundleShortVersionString=0.2.3-demo`
- 已退出旧版运行进程并打开 `dist/PGY Collector Desktop.app`
- 本地后台：`GET http://127.0.0.1:3188/api/health` 返回 `ok=true`

交付文件：

- `dist/PGY Collector Desktop.app`
- `dist/pgy-collector-desktop-mac-v0.2.3-demo.zip`

待验证：

- 打开最新 App 后切到数据后台，确认顶部筛选区不与表格重叠
- 选择任一增强采集过的博主，确认右侧全部字段完整展示且空值为 `-`
- 进行一次增强重刷，确认新快照包含 `raw_api_json`

### 2026-08-13 博主库列表核心经营字段

用户目标：

- 博主库列表增加最近 30 天涨粉数、最近 30 天合作数据、最近 30 天内容总数、商单占比、最近更新时间
- 最近 30 天合作数据在列表里只展示合作笔记数
- 最近 30 天内容总数在列表里展示笔记数
- 商单占比按合作笔记数除以内容总数计算

本次调整：

- 博主库列表新增 `30天涨粉`、`合作笔记数`、`笔记数`、`商单占比`、`最近更新时间`
- `合作笔记数` 使用 `coop_30_note_count`
- `笔记数` 使用 `recent_note_count`
- `商单占比` 使用 `coop_30_note_count / recent_note_count`
- 后台 API 增加 `commercial_order_rate` 计算字段
- 排序下拉新增 `30天涨粉`、`合作笔记数`、`笔记数`、`商单占比`
- 数据后台导出当前筛选同步带出这些字段
- 表格最小宽度调大，避免新增列挤压

已执行检查：

- `data-console`: `npm test`
- `data-console`: `npm run check`
- `data-console`: `npm run build`
- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- 已关闭旧进程并打开最新 `dist/PGY Collector Desktop.app`
- 本地后台：`GET http://127.0.0.1:3188/api/bloggers` 正常返回新增字段

交付文件：

- `dist/PGY Collector Desktop.app`
- `dist/pgy-collector-desktop-mac-v0.2.2-demo.zip`

阶段结论：

- `v0.2.2-demo` 可用于客户本地验收演示
- 该版本无桌面端授权门槛，不适合正式付费交付
- 数据后台源码仍保留默认关闭的授权管理模块，客户模式不可见且不参与 Demo 登录；后续正式线上版再重新设计授权/账号方案

### 2026-08-13 每日增强更新可暂停与近30天统计口径修复

用户反馈：

- 每日增强更新点击“立即更新”后，运行中不能暂停
- 运行中和结束后看不到本次更新清单，失败后也不知道具体哪些博主失败
- 博主库列表中的合作笔记数、笔记数、商单占比需要在名称前明确“近30天”
- 个别博主的近30天合作笔记数与近30天笔记数相同，实际蒲公英合作笔记页显示合作发布数更少

原因定位：

- 数据后台只保存运行进度，没有把 `batch_items` 的本次明细暴露到前端
- 桌面端已支持停止标记，但每日更新面板没有发送暂停请求入口
- 合作笔记数存在兜底风险：当合作笔记页文本没有确认加载完成时，可能误用日常笔记接口里的笔记总数

本次调整：

- 数据后台新增每日更新运行详情接口，返回本次最近处理明细和失败/需复查清单
- 每日增强更新面板新增 `暂停本次`、`刷新清单`
- 运行中每处理完一个博主，自动刷新本次清单
- 失败/需复查清单展示博主昵称、状态、缺失字段或错误信息
- 博主库列表和排序项改名为 `最近30天涨粉`、`近30天合作笔记数`、`近30天笔记数`、`近30天商单占比`
- 合作笔记数只认蒲公英合作笔记页里明确出现的 `发布笔记 X 篇`
- 如果合作笔记页没有确认加载完成，合作笔记数保持空值并进入需复查，不再用日常笔记数补齐

待验证：

- 跑一小批每日增强更新，确认暂停后当前博主收尾、后续博主不再继续
- 对“拓海智能宇宙”等样本重刷，确认近30天合作笔记数按合作笔记页 `发布笔记 X 篇` 入库
- 旧快照里的错误数值不会自动改写，需要重刷后由新快照覆盖最新展示

### 2026-08-13 重刷身份比对逻辑调整

用户反馈：

- 每日增强更新失败清单里，很多失败原因是昵称不对应或小红书号不一致
- 这些情况可能是博主改名、修改小红书号，不一定是打开错页

调整口径：

- `博主ID` 是主身份，昵称和小红书号是可变资料
- 重刷详情页时优先校验当前详情页地址和接口返回的 `博主ID`
- 如果 `博主ID` 一致，昵称或小红书号变化不再判定失败
- 昵称或小红书号变化会写入 `身份比对状态=资料变更`，并在 `身份比对说明` 记录旧值到新值
- 如果详情页地址或接口返回的 `博主ID` 与目标不一致，仍然判定为身份不一致并取消写入
- 详情页加载判断不再要求旧昵称必须出现在页面里，避免改名后被误判为未加载

### 2026-08-13 大规模博主库与每日增强更新迭代

用户目标：

- 后续本地/线上库会沉淀 `3-4万` 位博主
- 每天需要用增强采集刷新 `1000-2000` 位博主
- 增强采集能抓到的渠道数据要尽量结构化落进数据后台
- 数据后台需要能配置每日更新时间、更新数量，并显示更新进度
- 增强刷新后如果 MCN 状态变化，要记录历史变化

本次调整：

- 新增 `data-console/src/collector-fields.js`，统一维护增强采集可结构化入库字段
- `blogger_snapshots` 自动补齐增强采集字段列，包含日常笔记、合作笔记近 30/90 日、成本指标、粉丝画像、近期笔记、相似博主、采集状态等字段
- CSV 导入和边采边入库统一读取 `field-labels.json`，中文表头和内部字段自动建立映射
- 快照 `raw_json` 改为优先保存标准化字段，便于后续继续扩展展示和迁移
- 新增 `blogger_mcn_history`，增强采集发现 MCN 从无到有、从 A 变 B、从有到无时记录变化
- 新增 `update_jobs` 与 `update_job_runs`，保存每日增强更新时间、数量、候选池和每次运行进度
- 数据后台左侧新增“每日增强更新”小工具，可保存启用/暂停、更新时间、每日数量，并可手动立即更新
- 数据后台博主详情新增“MCN 历史”展示
- 桌面端新增数据后台内部请求通道，支持后台触发每日增强更新
- 每日增强更新复用单个博主增强重刷逻辑，按博主串行打开详情页、校验字段、入库、更新进度

已执行检查：

- `data-console`: `npm test`
- `data-console`: `npm run check`
- `data-console`: `npm run build`
- `desktop`: `npm run check`
- `desktop`: `npm test`

已执行补充检查：

- `desktop`: `npm run package:mac`
- `dist/PGY Collector Desktop.app`: `codesign --verify --deep --strict --verbose=2`
- `dist/PGY Collector Desktop.app`: `CFBundleShortVersionString=0.2.2-demo`
- 已关闭旧进程并打开 `dist/PGY Collector Desktop.app`
- 本地后台：`GET http://127.0.0.1:3188/api/health` 返回 `ok=true`
- 更新任务接口：`GET http://127.0.0.1:3188/api/update-job` 返回默认任务配置，候选池当前为 `112` 位

交付文件：

- `dist/PGY Collector Desktop.app`
- `dist/pgy-collector-desktop-mac-v0.2.2-demo.zip`
