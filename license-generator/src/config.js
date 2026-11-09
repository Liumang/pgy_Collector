const fs = require("fs");
const path = require("path");

const CONFIG_FIELDS = {
  feishuAppId: "FEISHU_APP_ID",
  feishuAppSecret: "FEISHU_APP_SECRET",
  feishuBaseAppToken: "FEISHU_BASE_APP_TOKEN"
};

function textValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function loadFeishuConfig(options = {}) {
  const env = options.env || process.env;
  const configPath = options.configPath || env.PGY_LICENSE_GENERATOR_CONFIG ||
    path.join(__dirname, "..", "config.local.json");
  let localConfig = {};
  const needsLocalConfig = Object.values(CONFIG_FIELDS).some(name => !textValue(env[name]));

  if (needsLocalConfig) {
    try {
      localConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (!localConfig || typeof localConfig !== "object" || Array.isArray(localConfig)) {
        throw new Error("invalid config object");
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw new Error("本地授权配置无法读取或格式无效，请检查 config.local.json 或 PGY_LICENSE_GENERATOR_CONFIG 指定的 JSON 文件。");
      }
    }
  }

  const config = {};
  const missing = [];
  for (const [key, envName] of Object.entries(CONFIG_FIELDS)) {
    config[key] = textValue(env[envName]) || textValue(localConfig[key]);
    if (!config[key]) missing.push(envName);
  }
  if (missing.length) {
    throw new Error(`授权配置缺失：${missing.join("、")}。请设置这些环境变量，或参考 config.example.json 创建仅保留在本机的 config.local.json。`);
  }
  return config;
}

module.exports = { loadFeishuConfig };
