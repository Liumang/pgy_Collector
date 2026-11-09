# rednote 发布与交付检查清单

日期：2026-05-25

## 1. 文档定位

这份文档用于每次交付新版 App 前检查。

交付对象分两类：

1. 客户使用的采集助手：`PGY Collector Desktop.app`
2. 自己使用的授权码生成器：`PGY License Generator.app`

授权码生成器包含私钥，只能自己使用，不能发给客户。

## 2. 交付前必须确认

### 2.1 版本号

- [ ] `desktop/package.json` 版本号已递增
- [ ] `desktop/package-lock.json` 版本号已同步
- [ ] `desktop/src/main.js` 中展示/内部版本已同步
- [ ] `desktop/src/index.html` 中展示版本已同步
- [ ] 如果改了授权码生成器，`license-generator/package.json` 版本号已递增
- [ ] 如果改了数据后台前端，`data-console/package.json` 与 `data-console/package-lock.json` 版本号已同步
- [ ] 客户交付版未默认开启 `PGY_LICENSE_ADMIN_ENABLED`

### 2.2 文档

- [ ] 更新 `docs/plans/2026-05-25-feature-iteration-tracker.md`
- [ ] 如涉及字段变化，更新 `ENHANCED_MODE_FIELDS.md`
- [ ] 如涉及用户操作变化，更新 `蒲公英博主采集助手_使用说明.md`
- [ ] 如涉及授权或交付方式变化，更新本检查清单
- [ ] 如涉及线上授权，更新 `README.md` 和 `蒲公英博主采集助手_使用说明.md`

### 2.3 代码检查

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

数据后台：

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote/data-console
npm run check
npm test
npm run build
```

### 2.4 打包

采集助手：

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote/desktop
npm run package:mac
```

授权码生成器：

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote
node license-generator/package-license-app.mjs
```

### 2.5 签名检查

```bash
cd /Users/jiazhen/Documents/sheenzen/rednote
codesign --verify --deep --strict --verbose=2 dist/PGY\ Collector\ Desktop.app
codesign --verify --deep --strict --verbose=2 dist/PGY\ License\ Generator.app
```

## 3. 客户交付文件

客户只发：

- `dist/pgy-collector-desktop-mac-v版本号.zip`

不要发：

- `license-generator/`
- `license-tools/`
- `private-key.pem`
- 任何 `.pem`、`.key`、`.p12`、`.pfx`
- 含飞书密钥的源码目录
- 含线上后台管理密钥或 `PGY_LICENSE_ADMIN_ENABLED=1` 的客户交付配置
- 用户测试导出的 CSV

## 4. 自己保留文件

自己保留：

- `dist/pgy-license-generator-mac-v版本号.zip`
- `license-generator/`
- `license-tools/`
- 私钥文件

## 5. 交付后用户提醒

发给客户时提醒：

- 先解压 zip
- 把 App 拖到“应用程序”或桌面后再打开
- 第一次如果 macOS 拦截，右键 App 后选择“打开”
- 登录授权码后，在工具内登录蒲公英
- 采集过程中不要手动操作左侧网页
- 如果页面出现验证码或登录过期，先手动完成验证
- 如果采集卡住，先不要反复点击开始，截图并反馈当前状态

## 6. 当前已知限制

- 当前是 ad-hoc 签名，不是 Apple Developer ID 正式签名
- 微信传输、网盘转存或公司安全软件可能改写 App，导致 macOS 提示损坏
- 真正彻底解决需要 Apple Developer ID 签名和 notarization
- `0.2.x` 已具备线上授权验证和授权管理后台雏形，但正式对外前仍需要确定服务器域名、HTTPS、管理端访问控制和备份策略
