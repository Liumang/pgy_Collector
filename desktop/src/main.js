const { app, BrowserWindow, dialog, ipcMain, shell, webContents } = require("electron");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const DATA_CONSOLE_PORT = 3188;
const DATA_CONSOLE_URL = `http://127.0.0.1:${DATA_CONSOLE_PORT}`;

let dataConsoleProcess = null;
let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 2001,
    height: 1127,
    minWidth: 1100,
    minHeight: 720,
    title: "蒲公英博主采集助手",
    icon: path.join(__dirname, "assets", "logo.png"),
    backgroundColor: "#f6f7f9",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));
  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (dataConsoleProcess && !dataConsoleProcess.killed) {
    dataConsoleProcess.kill();
  }
});

ipcMain.handle("desktop:get-webview-preload", () => {
  return `file://${path.join(__dirname, "webview-preload.js")}`;
});

ipcMain.handle("desktop:get-data-console-preload", () => {
  return `file://${path.join(__dirname, "data-console-preload.js")}`;
});

ipcMain.handle("desktop:send-webview-input-event", async (_event, payload = {}) => {
  const webContentsId = Number(payload.webContentsId);
  const inputEvent = payload.event || {};
  const target = Number.isFinite(webContentsId) ? webContents.fromId(webContentsId) : null;
  if (!target || target.isDestroyed()) return { ok: false, message: "webview 不可用" };
  target.sendInputEvent(inputEvent);
  return { ok: true };
});

async function isDataConsoleAlive() {
  try {
    const response = await fetch(`${DATA_CONSOLE_URL}/api/health`, { signal: AbortSignal.timeout(1200) });
    return response.ok;
  } catch (_) {
    return false;
  }
}

function dataConsoleServerPath() {
  const bundledPath = path.join(process.resourcesPath, "data-console", "src", "server.js");
  if (app.isPackaged || process.resourcesPath.includes(`${path.sep}Contents${path.sep}Resources`)) return bundledPath;
  return path.join(__dirname, "..", "..", "data-console", "src", "server.js");
}

function shouldUseStaticDataConsole(serverPath) {
  return app.isPackaged || serverPath.includes(`${path.sep}Contents${path.sep}Resources${path.sep}data-console${path.sep}`);
}

async function ensureDataConsoleRunning() {
  if (await isDataConsoleAlive()) return { ok: true, url: DATA_CONSOLE_URL, alreadyRunning: true };
  const serverPath = dataConsoleServerPath();
  try {
    await fs.access(serverPath);
  } catch (_) {
    return { ok: false, url: DATA_CONSOLE_URL, message: "没有找到数据后台文件，请确认 data-console 已打包。" };
  }
  if (!dataConsoleProcess || dataConsoleProcess.killed) {
    const useStaticDataConsole = shouldUseStaticDataConsole(serverPath);
    dataConsoleProcess = spawn(process.execPath, [serverPath], {
      detached: false,
      stdio: "ignore",
      cwd: path.dirname(path.dirname(serverPath)),
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: useStaticDataConsole ? "production" : "",
        PGY_DATA_CONSOLE_STATIC: useStaticDataConsole ? "1" : "0",
        PGY_DATA_CONSOLE_PORT: String(DATA_CONSOLE_PORT)
      }
    });
    dataConsoleProcess.unref();
  }
  for (let i = 0; i < 25; i += 1) {
    if (await isDataConsoleAlive()) return { ok: true, url: DATA_CONSOLE_URL, alreadyRunning: false };
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  return { ok: false, url: DATA_CONSOLE_URL, message: "数据后台启动超时。" };
}

ipcMain.handle("desktop:open-data-console", async () => {
  const result = await ensureDataConsoleRunning();
  if (result.ok) await shell.openExternal(DATA_CONSOLE_URL);
  return result;
});

ipcMain.handle("desktop:start-data-console", async () => {
  return ensureDataConsoleRunning();
});

ipcMain.handle("desktop:save-records-to-database", async (_event, payload) => {
  const server = await ensureDataConsoleRunning();
  if (!server.ok) return server;
  const response = await fetch(`${DATA_CONSOLE_URL}/api/import`, {
    method: "POST",
    signal: AbortSignal.timeout(120000),
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload || {})
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, url: DATA_CONSOLE_URL, message: json.message || `数据库写入失败：${response.status}` };
  return { ok: true, url: DATA_CONSOLE_URL, ...json };
});

async function dataConsoleRequest(pathname, options = {}) {
  const server = await ensureDataConsoleRunning();
  if (!server.ok) return server;
  const response = await fetch(`${DATA_CONSOLE_URL}${pathname}`, {
    method: options.method || "GET",
    signal: AbortSignal.timeout(options.timeoutMs || 30000),
    headers: { "content-type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, url: DATA_CONSOLE_URL, message: json.message || `数据后台请求失败：${response.status}` };
  return { ok: true, url: DATA_CONSOLE_URL, ...json };
}

ipcMain.handle("desktop:create-database-batch", async (_event, payload) => {
  return dataConsoleRequest("/api/batches", { method: "POST", body: payload || {} });
});

ipcMain.handle("desktop:append-records-to-database", async (_event, payload) => {
  const batchId = Number(payload && payload.batchId);
  if (!batchId) return { ok: false, message: "缺少数据库批次 ID" };
  return dataConsoleRequest(`/api/batches/${batchId}/records`, {
    method: "POST",
    body: {
      records: payload.records || [],
      countTowardsBatch: payload.countTowardsBatch !== false
    },
    timeoutMs: 60000
  });
});

ipcMain.handle("desktop:finish-database-batch", async (_event, payload) => {
  const batchId = Number(payload && payload.batchId);
  if (!batchId) return { ok: false, message: "缺少数据库批次 ID" };
  return dataConsoleRequest(`/api/batches/${batchId}/finish`, { method: "PUT", body: payload || {} });
});

ipcMain.handle("desktop:data-console-request", async (_event, payload = {}) => {
  const pathname = String(payload.pathname || payload.path || "");
  if (!pathname.startsWith("/api/")) return { ok: false, message: "只允许访问本地数据后台 API" };
  return dataConsoleRequest(pathname, {
    method: payload.method || "GET",
    body: payload.body || undefined,
    timeoutMs: payload.timeoutMs || 30000
  });
});

function bufferToBase64Url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

ipcMain.handle("desktop:show-save-dialog", async (_event, defaultPath) => {
  const result = await dialog.showSaveDialog({
    title: "导出 CSV",
    defaultPath,
    filters: [{ name: "CSV 文件", extensions: ["csv"] }]
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle("desktop:save-text-file", async (_event, payload) => {
  if (!payload || !payload.filePath) return false;
  await fs.writeFile(payload.filePath, payload.text || "", "utf8");
  return true;
});

function xmlEscape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlUnescape(value) {
  return String(value == null ? "" : value)
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function writeXlsxTemplate(filePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pgy-template-"));
  try {
    await fs.rm(filePath, { force: true });
    await fs.mkdir(path.join(tempDir, "_rels"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "xl", "_rels"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "xl", "worksheets"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "xl", "styles"), { recursive: true });

    const rows = [
      ["博主昵称"],
      ["请在这一列填写昵称，一行一个"],
      ["示例：开局一口锅锅"]
    ];
    const sheetRows = rows.map((row, rowIndex) => {
      const r = rowIndex + 1;
      const cells = row.map((value, colIndex) => {
        const col = String.fromCharCode("A".charCodeAt(0) + colIndex);
        return `<c r="${col}${r}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
      }).join("");
      return `<row r="${r}">${cells}</row>`;
    }).join("");

    await fs.writeFile(path.join(tempDir, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);
    await fs.writeFile(path.join(tempDir, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
    await fs.writeFile(path.join(tempDir, "xl", "workbook.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="博主昵称" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
    await fs.writeFile(path.join(tempDir, "xl", "_rels", "workbook.xml.rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
    await fs.writeFile(path.join(tempDir, "xl", "styles.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Arial"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf/></cellXfs></styleSheet>`);
    await fs.writeFile(path.join(tempDir, "xl", "worksheets", "sheet1.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols><col min="1" max="1" width="32" customWidth="1"/></cols>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`);

    await execFileAsync("zip", ["-qr", filePath, "."], { cwd: tempDir });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function parseSharedStrings(xml) {
  const strings = [];
  const siMatches = String(xml || "").match(/<si[\s\S]*?<\/si>/g) || [];
  for (const si of siMatches) {
    const texts = Array.from(si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map(match => xmlUnescape(match[1]));
    strings.push(texts.join(""));
  }
  return strings;
}

function parseWorksheetValues(xml, sharedStrings) {
  const values = [];
  const rowMatches = String(xml || "").match(/<row[\s\S]*?<\/row>/g) || [];
  for (const row of rowMatches) {
    const cellMatches = Array.from(row.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g));
    const rowValues = [];
    for (const cell of cellMatches) {
      const attrs = cell[1] || "";
      const body = cell[2] || "";
      const ref = attrs.match(/\br="([A-Z]+)(\d+)"/);
      const colLetters = ref ? ref[1] : "A";
      const colIndex = colLetters.split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1] || "";
      let value = "";
      if (type === "inlineStr") {
        value = Array.from(body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map(match => xmlUnescape(match[1])).join("");
      } else {
        const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] || "";
        value = type === "s" ? sharedStrings[Number(raw)] || "" : xmlUnescape(raw);
      }
      rowValues[colIndex] = value;
    }
    values.push(rowValues);
  }
  return values;
}

async function readNicknameFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let values = [];
  if (ext === ".xlsx") {
    const [{ stdout: sharedXml }, { stdout: sheetXml }] = await Promise.all([
      execFileAsync("unzip", ["-p", filePath, "xl/sharedStrings.xml"], { maxBuffer: 20 * 1024 * 1024 }).catch(() => ({ stdout: "" })),
      execFileAsync("unzip", ["-p", filePath, "xl/worksheets/sheet1.xml"], { maxBuffer: 20 * 1024 * 1024 })
    ]);
    const rows = parseWorksheetValues(sheetXml, parseSharedStrings(sharedXml));
    values = rows.map(row => row && row[0]).filter(Boolean);
  } else {
    const text = await fs.readFile(filePath, "utf8");
    values = text.split(/\r?\n/).map(line => {
      const first = line.split(",")[0] || "";
      return first.replace(/^"|"$/g, "").replace(/""/g, "\"");
    });
  }
  const nicknames = values
    .map(value => String(value || "").replace(/\s+/g, " ").trim())
    .filter(value => value && value !== "博主昵称" && !/^请在这一列填写昵称/.test(value) && !/^示例[:：]/.test(value));
  return Array.from(new Set(nicknames));
}

ipcMain.handle("desktop:save-nickname-template", async () => {
  const result = await dialog.showSaveDialog({
    title: "下载 Excel 模板",
    defaultPath: "蒲公英博主昵称上传模板.xlsx",
    filters: [{ name: "Excel 文件", extensions: ["xlsx"] }]
  });
  if (result.canceled || !result.filePath) return null;
  await writeXlsxTemplate(result.filePath);
  return result.filePath;
});

ipcMain.handle("desktop:open-nickname-file", async () => {
  const result = await dialog.showOpenDialog({
    title: "选择博主昵称文件",
    properties: ["openFile"],
    filters: [
      { name: "昵称文件", extensions: ["xlsx", "csv", "txt"] },
      { name: "所有文件", extensions: ["*"] }
    ]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  return { filePath, nicknames: await readNicknameFile(filePath) };
});
