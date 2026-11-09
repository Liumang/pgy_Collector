# 发布检查清单

## 最近一次执行结果

- 版本：`PGY Collector Desktop v0.2.1`
- 时间：2026-06-03
- 结果：已通过
- 真实回归：蒲公英当前列表，最大页数 `1`，每页最多 `20`，常规采集，批次 `#10` 正式采集 `20` 条，空值自检补采 `2` 次，未进入第 `2` 页
- 入库核验：最新 `collect_batches.id=10`，`total_collected=20`，`max_pages=1`，`status=完成`
- 代码检查：`desktop npm run check` 已通过；`data-console npm run check && npm test && npm run build` 已通过
- 签名检查：`codesign --verify --deep --strict --verbose=2 dist/PGY\\ Collector\\ Desktop.app` 已通过

## 交付前

- [ ] 确认 `desktop/package.json` 版本号已递增。
- [ ] 确认 `desktop/package-lock.json` 版本号已同步。
- [ ] 确认 `desktop/src/main.js` 里的 `APP_VERSION` 已同步。
- [ ] 确认 `desktop/src/index.html` 右侧展示版本已同步。
- [ ] 确认 `desktop/src/renderer.js` 诊断版本已同步。
- [ ] 如涉及数据后台前端，确认 `data-console/package.json` 和 `package-lock.json` 版本已同步。
- [ ] 运行 `cd desktop && npm run check`。
- [ ] 运行 `cd data-console && npm run check && npm test && npm run build`。
- [ ] 在蒲公英真实页面做 1 页采集回归。
- [ ] 检查采集数据是否边采边入库。
- [ ] 导出 CSV，并用 Excel/WPS 打开确认中文和字段口径。
- [ ] 如果涉及授权，检查授权码生成、激活、同机器复登、换机器拒绝。
- [ ] 更新 `docs/plans/2026-05-25-feature-iteration-tracker.md`。
- [ ] 更新 `docs/plans/2026-05-25-development-operation-log.md`。
- [ ] 更新 `蒲公英博主采集助手_使用说明.md`。

## 交付文件

- [ ] `dist/pgy-collector-desktop-mac-v版本号.zip`
- [ ] 本次更新说明
- [ ] 使用说明链接或文件

## 不交付给客户

- [ ] `license-generator/`
- [ ] `license-tools/`
- [ ] `private-key.pem`
- [ ] 任何 `.pem`、`.key`、`.p12`、`.pfx`
- [ ] 含飞书密钥或线上后台密钥的源码目录
- [ ] 用户测试导出的 CSV

## 交付提醒

发给使用者时提醒：

- 先解压 zip。
- 把 App 拖到“应用程序”或桌面后再打开。
- 第一次如果 macOS 拦截，右键 App 后选择“打开”。
- 登录授权码后，在工具内登录蒲公英。
- 采集过程中不要手动操作左侧网页。
- 如果页面出现验证码或登录过期，先手动完成验证。
- 如果采集卡住，先不要反复点击开始，截图并反馈当前状态。
