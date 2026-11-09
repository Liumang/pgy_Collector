# 授权码生成器配置

此目录是仅供运营方使用的历史授权码生成器，不是客户采集 App。生成器需要授权私钥及飞书配置；当前桌面 Demo 没有接入完整客户授权流程。

飞书配置从以下环境变量读取，非空环境变量优先于本地 JSON：

| 环境变量 | 本地 JSON 字段 |
| --- | --- |
| `FEISHU_APP_ID` | `feishuAppId` |
| `FEISHU_APP_SECRET` | `feishuAppSecret` |
| `FEISHU_BASE_APP_TOKEN` | `feishuBaseAppToken` |

本地运行时，将 `config.example.json` 复制为同目录的 `config.local.json`，再在本机填写配置。也可设置 `PGY_LICENSE_GENERATOR_CONFIG` 为另一个 JSON 文件的绝对路径。缺少配置时，点击生成会显示缺失项；不会将配置值写入错误信息。环境变量或配置在首次成功加载后缓存，修改后重启生成器。

`config.local.json`、授权私钥和配置值不应提交到源码仓库或发给客户。此轮将旧源码中的配置保留在本机 `config.local.json`，未更改私钥。

现有打包脚本不复制 `config.local.json`；从源码重新打包生成器后，须由运营方在自己的运行环境提供上述环境变量，或通过 `PGY_LICENSE_GENERATOR_CONFIG` 指定本地文件。现有历史生成器 App/zip 未重新打包，不能据本次源码改动认定历史产物已去除配置或私钥。

配置行为与语法验证（不请求飞书、不签发授权）：

```bash
node --test license-generator/test/config.test.js
node --check license-generator/src/config.js
node --check license-generator/src/main.js
node --check license-generator/src/preload.js
node --check license-generator/src/renderer.js
```
