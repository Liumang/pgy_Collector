const { app, BrowserWindow, clipboard, ipcMain } = require("electron");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { loadFeishuConfig } = require("./config");

const PRODUCT_ID = "pgy-blogger-collector";
const FEISHU_REQUEST_TIMEOUT_MS = 15000;
const FEISHU_LICENSE_TABLE_NAME = "授权码";
const FEISHU_FIELDS = [
  "授权码",
  "客户名",
  "授权时长",
  "到期时间",
  "状态",
  "绑定机器码",
  "激活时间",
  "最近登录时间",
  "激活IP",
  "设备信息",
  "授权ID",
  "生成时间",
  "备注"
];
let configuredFeishu = null;
let feishuTokenCache = { token: "", expireAt: 0 };
let feishuTableCache = { tableId: "", expireAt: 0 };

function feishuConfig() {
  if (!configuredFeishu) configuredFeishu = loadFeishuConfig();
  return configuredFeishu;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 760,
    height: 680,
    minWidth: 680,
    minHeight: 620,
    title: "授权码生成器",
    icon: path.join(__dirname, "assets", "logo.png"),
    backgroundColor: "#f7f8fa",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

function bufferToBase64Url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function privateKeyPath() {
  const resourceKey = path.join(process.resourcesPath || "", "app", "private-key.pem");
  if (fs.existsSync(resourceKey)) return resourceKey;
  return path.join(__dirname, "..", "private-key.pem");
}

function expiresFromPayload(payload) {
  if (payload.permanent) return "";
  if (payload.expiresAt) {
    const date = new Date(`${payload.expiresAt}T23:59:59.999+08:00`);
    if (Number.isNaN(date.getTime())) throw new Error("指定到期日无效");
    return date.toISOString();
  }
  const days = Number(payload.days);
  if (!Number.isFinite(days) || days <= 0) throw new Error("授权天数无效");
  const date = new Date();
  date.setDate(date.getDate() + Math.round(days));
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

async function feishuTenantToken() {
  if (feishuTokenCache.token && Date.now() < feishuTokenCache.expireAt) return feishuTokenCache.token;
  const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(FEISHU_REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      app_id: feishuConfig().feishuAppId,
      app_secret: feishuConfig().feishuAppSecret
    })
  });
  const json = await response.json();
  if (!response.ok || json.code !== 0) throw new Error(`飞书授权失败：${json.msg || response.status}`);
  feishuTokenCache = {
    token: json.tenant_access_token,
    expireAt: Date.now() + Math.max(60, Number(json.expire || 7200) - 300) * 1000
  };
  return feishuTokenCache.token;
}

async function feishuRequest(pathname, options = {}) {
  const token = await feishuTenantToken();
  const response = await fetch(`https://open.feishu.cn/open-apis${pathname}`, {
    method: options.method || "GET",
    signal: AbortSignal.timeout(options.timeoutMs || FEISHU_REQUEST_TIMEOUT_MS),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const json = await response.json();
  if (!response.ok || json.code !== 0) throw new Error(`飞书接口失败：${json.msg || response.status}`);
  return json.data || {};
}

function tableIdFromCreate(data) {
  return data.table_id || data.tableId || (data.table && (data.table.table_id || data.table.tableId)) || "";
}

async function ensureFeishuLicenseTable() {
  if (feishuTableCache.tableId && Date.now() < feishuTableCache.expireAt) return feishuTableCache.tableId;
  const tablesData = await feishuRequest(`/bitable/v1/apps/${feishuConfig().feishuBaseAppToken}/tables`);
  const tables = tablesData.items || tablesData.tables || [];
  let table = tables.find(item => item.name === FEISHU_LICENSE_TABLE_NAME);
  if (!table) {
    const created = await feishuRequest(`/bitable/v1/apps/${feishuConfig().feishuBaseAppToken}/tables`, {
      method: "POST",
      body: { table: { name: FEISHU_LICENSE_TABLE_NAME } }
    });
    table = { table_id: tableIdFromCreate(created) };
  }
  const tableId = table.table_id || table.tableId;
  if (!tableId) throw new Error("飞书授权表 ID 读取失败");

  const fieldsData = await feishuRequest(`/bitable/v1/apps/${feishuConfig().feishuBaseAppToken}/tables/${tableId}/fields?page_size=100`);
  const fields = fieldsData.items || fieldsData.fields || [];
  const existing = new Set(fields.map(field => field.field_name || field.name));
  for (const fieldName of FEISHU_FIELDS) {
    if (existing.has(fieldName)) continue;
    await feishuRequest(`/bitable/v1/apps/${feishuConfig().feishuBaseAppToken}/tables/${tableId}/fields`, {
      method: "POST",
      body: { field_name: fieldName, type: 1 }
    });
  }

  feishuTableCache = { tableId, expireAt: Date.now() + 10 * 60 * 1000 };
  return tableId;
}

async function createFeishuLicenseRecords(licenses) {
  const tableId = await ensureFeishuLicenseTable();
  const records = licenses.map(item => ({
    fields: {
      "授权码": item.licenseCode,
      "客户名": item.payload.customer,
      "授权时长": item.payload.durationLabel,
      "到期时间": item.payload.expiresAt || "永久",
      "状态": "未激活",
      "授权ID": item.payload.licenseId,
      "生成时间": item.payload.issuedAt
    }
  }));
  for (let index = 0; index < records.length; index += 500) {
    await feishuRequest(`/bitable/v1/apps/${feishuConfig().feishuBaseAppToken}/tables/${tableId}/records/batch_create`, {
      method: "POST",
      body: { records: records.slice(index, index + 500) }
    });
  }
  return { tableId, count: records.length };
}

ipcMain.handle("license:generate", async (_event, input) => {
  const customer = String(input && input.customer ? input.customer : "").trim();
  const quantity = Math.max(1, Math.min(500, Math.round(Number(input && input.quantity ? input.quantity : 1))));
  if (!customer) throw new Error("请填写客户名");
  feishuConfig();

  const expiresAt = expiresFromPayload(input || {});
  const durationLabel = input && input.permanent
    ? "永久"
    : input && input.expiresAt
      ? `至 ${input.expiresAt}`
      : `${input && input.days ? input.days : ""} 天`;
  const licenses = [];

  const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath(), "utf8"));
  for (let index = 0; index < quantity; index += 1) {
    const payload = {
      product: PRODUCT_ID,
      licenseId: crypto.randomUUID(),
      customer,
      issuedAt: new Date().toISOString(),
      durationDays: input && input.days ? String(input.days) : "",
      durationLabel,
      expiresAt
    };
    const payloadPart = bufferToBase64Url(Buffer.from(JSON.stringify(payload)));
    const signaturePart = bufferToBase64Url(crypto.sign(null, Buffer.from(payloadPart), privateKey));
    licenses.push({
      payload,
      licenseCode: `${payloadPart}.${signaturePart}`
    });
  }
  const feishu = await createFeishuLicenseRecords(licenses);

  return {
    count: licenses.length,
    licenses,
    feishu,
    licenseCode: licenses.map(item => item.licenseCode).join("\n")
  };
});

ipcMain.handle("license:copy", async (_event, text) => {
  clipboard.writeText(String(text || ""));
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
