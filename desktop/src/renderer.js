const PGY_URL = "https://pgy.xiaohongshu.com/solar/pre-trade/note/kol";
function localDateTimeText(date = new Date()) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const BASE_FIELDS = [
  ["nickname", "博主昵称"],
  ["blogger_id", "博主ID"],
  ["blogger_url", "小红书主页链接"],
  ["province", "省"],
  ["city", "市"],
  ["tags", "标签"],
  ["fans_count", "粉丝数"],
  ["read_median", "阅读中位数"],
  ["interaction_median", "互动中位数"],
  ["image_note_price", "图文笔记一口价"],
  ["video_note_price", "视频笔记一口价"],
  ["page_no", "页码"],
  ["rank_in_page", "页内顺序"],
  ["collected_at", "采集时间"]
];
const ENHANCED_FIELDS = [
  ["red_id", "小红书号"],
  ["gender", "性别"],
  ["mcn_status", "机构状态"],
  ["like_collect_count", "获赞与收藏量"],
  ["coop_30_note_count", "合作笔记发布笔记数（近30日/图文+视频/全流量）"],
  ["coop_30_exposure_median", "合作笔记曝光中位数（近30日/图文+视频/全流量）"],
  ["coop_30_read_median", "合作笔记阅读中位数（近30日/图文+视频/全流量）"],
  ["coop_30_interaction_median", "合作笔记互动中位数（近30日/图文+视频/全流量）"],
  ["coop_30_outside_shop_median", "合作笔记外溢进店中位数（近30日/图文+视频/全流量）"],
  ["coop_30_like_median", "合作笔记点赞中位数（近30日/图文+视频/全流量）"],
  ["coop_30_collect_median", "合作笔记收藏中位数（近30日/图文+视频/全流量）"],
  ["coop_30_comment_median", "合作笔记评论中位数（近30日/图文+视频/全流量）"],
  ["coop_30_share_median", "合作笔记分享中位数（近30日/图文+视频/全流量）"],
  ["coop_30_follow_median", "合作笔记关注中位数（近30日/图文+视频/全流量）"],
  ["coop_30_interaction_rate", "合作笔记互动率（近30日/图文+视频/全流量）"],
  ["coop_30_video_finish_rate", "合作笔记视频完播率（近30日/图文+视频/全流量）"],
  ["coop_30_picture_3s_view_rate", "合作笔记图文3秒阅读率（近30日/图文+视频/全流量）"],
  ["coop_30_thousand_like_percent", "合作笔记千赞笔记比例（近30日/图文+视频/全流量）"],
  ["coop_30_hundred_like_percent", "合作笔记百赞笔记比例（近30日/图文+视频/全流量）"],
  ["coop_90_note_count", "合作笔记发布笔记数（近90日/图文+视频/全流量）"],
  ["coop_90_exposure_median", "合作笔记曝光中位数（近90日/图文+视频/全流量）"],
  ["coop_90_read_median", "合作笔记阅读中位数（近90日/图文+视频/全流量）"],
  ["coop_90_interaction_median", "合作笔记互动中位数（近90日/图文+视频/全流量）"],
  ["coop_90_outside_shop_median", "合作笔记外溢进店中位数（近90日/图文+视频/全流量）"],
  ["coop_90_like_median", "合作笔记点赞中位数（近90日/图文+视频/全流量）"],
  ["coop_90_collect_median", "合作笔记收藏中位数（近90日/图文+视频/全流量）"],
  ["coop_90_comment_median", "合作笔记评论中位数（近90日/图文+视频/全流量）"],
  ["coop_90_share_median", "合作笔记分享中位数（近90日/图文+视频/全流量）"],
  ["coop_90_follow_median", "合作笔记关注中位数（近90日/图文+视频/全流量）"],
  ["coop_90_interaction_rate", "合作笔记互动率（近90日/图文+视频/全流量）"],
  ["coop_90_video_finish_rate", "合作笔记视频完播率（近90日/图文+视频/全流量）"],
  ["coop_90_picture_3s_view_rate", "合作笔记图文3秒阅读率（近90日/图文+视频/全流量）"],
  ["coop_90_thousand_like_percent", "合作笔记千赞笔记比例（近90日/图文+视频/全流量）"],
  ["coop_90_hundred_like_percent", "合作笔记百赞笔记比例（近90日/图文+视频/全流量）"],
  ["business_note_count", "累计商业笔记数"],
  ["content_tags", "内容大类标签"],
  ["sub_content_tags", "内容细分标签"],
  ["feature_tags", "账号特征标签"],
  ["current_level", "账号等级"],
  ["exposure_median", "曝光中位数（日常笔记/图文+视频/近30日/全流量）"],
  ["like_median", "点赞中位数（日常笔记/图文+视频/近30日/全流量）"],
  ["collect_median", "收藏中位数（日常笔记/图文+视频/近30日/全流量）"],
  ["comment_median", "评论中位数（日常笔记/图文+视频/近30日/全流量）"],
  ["share_median", "分享中位数（日常笔记/图文+视频/近30日/全流量）"],
  ["follow_median", "关注中位数（日常笔记/图文+视频/近30日/全流量）"],
  ["interaction_rate", "互动率（日常笔记/图文+视频/近30日/全流量）"],
  ["estimate_cpm", "预估CPM（日常笔记/按成本）"],
  ["estimate_read_unit_price", "预估阅读单价（日常笔记/按成本）"],
  ["estimate_interaction_unit_price", "预估互动单价（日常笔记/按成本）"],
  ["video_finish_rate", "视频完播率（日常笔记/图文+视频/近30日/全流量）"],
  ["picture_3s_view_rate", "图文3秒阅读率（日常笔记/图文+视频/近30日/全流量）"],
  ["hundred_like_percent", "百赞笔记占比（日常笔记/图文+视频/近30日/全流量）"],
  ["thousand_like_percent", "千赞笔记占比（日常笔记/图文+视频/近30日/全流量）"],
  ["fans_growth_num", "粉丝增长数（近30日）"],
  ["fans_growth_rate", "粉丝增长率（近30日）"],
  ["active_fans_rate", "活跃粉丝占比（近30日）"],
  ["read_fans_rate", "阅读粉丝占比（近30日）"],
  ["engage_fans_rate", "互动粉丝占比（近30日）"],
  ["pay_fans_rate", "消费粉丝占比（近30日）"],
  ["fans_female_rate", "女性粉丝占比"],
  ["fans_age_distribution", "粉丝年龄分布"],
  ["fans_age_under_18", "粉丝年龄占比：<18"],
  ["fans_age_18_24", "粉丝年龄占比：18-24"],
  ["fans_age_25_34", "粉丝年龄占比：25-34"],
  ["fans_age_35_44", "粉丝年龄占比：35-44"],
  ["fans_age_over_44", "粉丝年龄占比：>44"],
  ["fans_top_provinces", "粉丝TOP省份"],
  ["fans_top_cities", "粉丝TOP城市"],
  ["fans_top_interests", "粉丝TOP兴趣"],
  ["fans_top_device", "粉丝主要设备"],
  ["data_updated_at", "数据更新时间"],
  ["recent_note_count", "发布笔记数（日常笔记/图文+视频/近30日/全流量）"],
  ["video_note_count", "视频笔记数（日常笔记/图文+视频/近30日/全流量）"],
  ["image_note_count", "图文笔记数（日常笔记/图文+视频/近30日/全流量）"],
  ["recent_coop_brand_notes", "最近合作品牌与发布时间"],
  ["recent_note_titles", "近期笔记标题"],
  ["recent_note_ids", "近期笔记ID"],
  ["similar_kol_ids", "相似博主ID"],
  ["similar_kol_names", "相似博主昵称"],
  ["identity_compare_status", "身份比对状态"],
  ["identity_compare_note", "身份比对说明"],
  ["detail_collect_status", "增强采集状态"],
  ["detail_retry_count", "增强采集重试次数"],
  ["detail_missing_fields", "增强采集缺失项"]
];

const state = {
  records: [],
  ids: new Set(),
  duplicateCount: 0,
  skippedMissingIdRecords: [],
  running: false,
  enhancedMode: false,
  taskMode: "list",
  uploadedNicknames: [],
  uploadedNicknameFile: "",
  awaitingDetailEnhancement: false,
  detailEnhancing: false,
  finalChecking: false,
  detailProgress: null,
  stopRequested: false,
  databaseBatchId: null,
  databaseSavedCount: 0,
  databaseError: "",
  databaseWriteQueue: Promise.resolve(),
  collectOptions: null,
  pageNo: 0,
  lastProgressAt: 0,
  watchdogTimer: null,
  updateJobTimer: null,
  updateJobRunning: false,
  lastDiagnostics: {},
  apiResponses: new Map()
};

const els = {
  demoSummary: document.querySelector("#demoSummary"),
  appShell: document.querySelector(".app-shell"),
  webview: document.querySelector("#pgyView"),
  dataView: document.querySelector("#dataView"),
  collectorTab: document.querySelector("#collectorTab"),
  dataTab: document.querySelector("#dataTab"),
  collectorTabButton: document.querySelector("#collectorTabButton"),
  collectorTabButton2: document.querySelector("#collectorTabButton2"),
  dataTabButton: document.querySelector("#dataTabButton"),
  dataTabButton2: document.querySelector("#dataTabButton2"),
  reloadDataConsole: document.querySelector("#reloadDataConsole"),
  reloadPage: document.querySelector("#reloadPage"),
  openPgy: document.querySelector("#openPgy"),
  collectMode: document.querySelector("#collectMode"),
  taskMode: document.querySelector("#taskMode"),
  downloadTemplate: document.querySelector("#downloadTemplate"),
  uploadNicknames: document.querySelector("#uploadNicknames"),
  uploadInfo: document.querySelector("#uploadInfo"),
  startCollect: document.querySelector("#startCollect"),
  stopCollect: document.querySelector("#stopCollect"),
  exportCsv: document.querySelector("#exportCsv"),
  openDataConsole: document.querySelector("#openDataConsole"),
  copyDiag: document.querySelector("#copyDiag"),
  maxPages: document.querySelector("#maxPages"),
  maxItems: document.querySelector("#maxItems"),
  delayMs: document.querySelector("#delayMs"),
  count: document.querySelector("#count"),
  pageNo: document.querySelector("#pageNo"),
  duplicates: document.querySelector("#duplicates"),
  runState: document.querySelector("#runState"),
  status: document.querySelector("#status")
};

function setStatus(text) {
  els.status.textContent = text;
  if (state.running) state.lastProgressAt = Date.now();
}

function updateDemoSummary() {
  if (els.demoSummary) els.demoSummary.textContent = "本地 Demo｜离线演示";
}

async function warmDataConsole() {
  try {
    const result = await window.desktopApi.startDataConsole();
    if (!result || !result.ok) {
      setStatus(`本地数据后台启动失败：${result && result.message ? result.message : "未知错误"}。采集和 CSV 导出仍可使用。`);
      return result;
    }
    if (els.dataView && !els.dataView.src) els.dataView.src = result.url || "http://127.0.0.1:3188";
    return result;
  } catch (error) {
    setStatus(`本地数据后台启动失败：${error && error.message ? error.message : String(error)}。采集和 CSV 导出仍可使用。`);
    return { ok: false, message: error && error.message ? error.message : String(error) };
  }
}

async function dataConsoleRequest(pathname, options = {}) {
  const result = await window.desktopApi.dataConsoleRequest({
    pathname,
    method: options.method || "GET",
    body: options.body || undefined,
    timeoutMs: options.timeoutMs || 30000
  });
  if (!result || !result.ok) {
    throw new Error(result && result.message ? result.message : "本地数据后台请求失败");
  }
  return result;
}

function switchTab(tabName) {
  const showData = tabName === "data";
  if (els.appShell) els.appShell.classList.toggle("data-mode", showData);
  els.collectorTab.classList.toggle("active", !showData);
  els.dataTab.classList.toggle("active", showData);
  els.collectorTabButton.classList.toggle("active", !showData);
  els.collectorTabButton2.classList.toggle("active", !showData);
  els.dataTabButton.classList.toggle("active", showData);
  els.dataTabButton2.classList.toggle("active", showData);
  if (showData) {
    warmDataConsole().then(result => {
      if (result && result.ok && els.dataView) els.dataView.src = result.url || "http://127.0.0.1:3188";
    });
  }
}

function startWatchdog() {
  stopWatchdog();
  state.lastProgressAt = Date.now();
  state.watchdogTimer = setInterval(async () => {
    if (!state.running) return;
    const idleMs = Date.now() - (state.lastProgressAt || Date.now());
    if (idleMs < 8 * 60 * 1000) return;
    state.stopRequested = true;
    state.awaitingDetailEnhancement = false;
    try {
      await els.webview.executeJavaScript("window.__pgyDesktopStopRequested = true; window.__pgyDesktopCollectorRunning = false;", true);
    } catch (_) {}
    state.running = false;
    state.detailEnhancing = false;
    state.finalChecking = false;
    setStatus("采集可能卡住：超过 8 分钟没有进展，已自动停止。可以导出已采集数据，或刷新页面后重新开始。");
    render();
    stopWatchdog();
  }, 30000);
}

function stopWatchdog() {
  if (state.watchdogTimer) clearInterval(state.watchdogTimer);
  state.watchdogTimer = null;
}

function render() {
  const needsNicknameFile = state.taskMode === "nickname" || state.taskMode === "similar";
  els.count.textContent = String(state.records.length);
  els.pageNo.textContent = state.detailProgress
    ? `${state.detailProgress.pageNo || state.pageNo || "-"} · 详情 ${state.detailProgress.current}/${state.detailProgress.total}`
    : state.pageNo ? String(state.pageNo) : "-";
  els.duplicates.textContent = String(state.duplicateCount);
  els.runState.textContent = state.running ? "采集中" : "待开始";
  els.startCollect.disabled = state.running || (needsNicknameFile && !state.uploadedNicknames.length);
  els.stopCollect.disabled = !state.running;
  els.exportCsv.disabled = state.records.length === 0 || state.running;
  els.collectMode.disabled = state.running || state.taskMode === "similar";
  els.taskMode.disabled = state.running;
  els.downloadTemplate.disabled = state.running || !needsNicknameFile;
  els.uploadNicknames.disabled = state.running || !needsNicknameFile;
  const uploadActions = els.downloadTemplate.closest(".upload-actions");
  if (uploadActions) uploadActions.style.display = needsNicknameFile ? "grid" : "none";
  els.uploadInfo.style.display = needsNicknameFile ? "block" : "none";
  els.uploadInfo.textContent = state.uploadedNicknames.length
    ? `已上传 ${state.uploadedNicknames.length} 个昵称`
    : "未上传昵称文件";
}

function getExportFields() {
  return state.enhancedMode ? [...BASE_FIELDS, ...ENHANCED_FIELDS] : BASE_FIELDS;
}

function csvCell(value) {
  const rawText = String(value == null ? "" : value);
  const text = /^[=+\-@]/.test(rawText) ? `\t${rawText}` : rawText;
  return `"${text.replace(/"/g, '""')}"`;
}

function makeCsv() {
  const fields = getExportFields();
  const rows = [fields.map(([, label]) => csvCell(label)).join(",")];
  for (const record of state.records) {
    rows.push(fields.map(([key]) => csvCell(record[key])).join(","));
  }
  return `\uFEFF${rows.join("\n")}`;
}

async function createDatabaseBatch() {
  const options = state.collectOptions || {};
  state.databaseWriteQueue = Promise.resolve();
  const result = await window.desktopApi.createDatabaseBatch({
    taskMode: state.taskMode,
    collectMode: state.enhancedMode ? "enhanced" : "normal",
    sourceName: state.uploadedNicknameFile || "采集助手边采边入库",
    maxPages: options.maxPages || 1,
    perPageLimit: options.maxItems || 20,
    startedAt: new Date().toISOString()
  });
  if (!result || !result.ok) {
    state.databaseError = result && result.message ? result.message : "数据库批次创建失败";
    setStatus(`数据库批次创建失败：${state.databaseError}。CSV 导出仍可使用。`);
    return null;
  }
  state.databaseBatchId = result.batchId;
  state.databaseSavedCount = 0;
  state.databaseError = "";
  return result.batchId;
}

async function appendRecordsToDatabase(records, options = {}) {
  if (!state.databaseBatchId || !records.length) return;
  state.databaseWriteQueue = state.databaseWriteQueue.then(async () => {
    const result = await window.desktopApi.appendRecordsToDatabase({
      batchId: state.databaseBatchId,
      records,
      countTowardsBatch: options.countTowardsBatch !== false
    });
    if (!result || !result.ok) {
      state.databaseError = result && result.message ? result.message : "数据库写入失败";
      setStatus(`数据库写入失败：${state.databaseError}。CSV 导出仍可使用。`);
      return;
    }
    state.databaseSavedCount += Number(result.counted ?? result.imported ?? 0);
  }).catch(error => {
    state.databaseError = error && error.message ? error.message : String(error);
    setStatus(`数据库写入失败：${state.databaseError}。CSV 导出仍可使用。`);
  });
  return state.databaseWriteQueue;
}

async function finishDatabaseBatch(status, checkedCount) {
  if (!state.databaseBatchId) return "";
  try {
    await state.databaseWriteQueue;
    const result = await window.desktopApi.finishDatabaseBatch({
      batchId: state.databaseBatchId,
      status,
      duplicateCount: state.duplicateCount,
      emptyRecheckCount: checkedCount,
      finishedAt: new Date().toISOString()
    });
    if (!result || !result.ok) {
      state.databaseError = result && result.message ? result.message : "数据库批次结束失败";
      return `\n数据库批次结束失败：${state.databaseError}。已采集数据仍会保留在临时批次中。`;
    }
    return `\n已边采边写入本地数据库：批次 #${state.databaseBatchId}，${state.databaseSavedCount} 条。`;
  } catch (error) {
    state.databaseError = error && error.message ? error.message : String(error);
    return `\n数据库批次结束失败：${state.databaseError}。已采集数据仍会保留在临时批次中。`;
  }
}

function nowFileText() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

function addRecords(records) {
  const result = window.PGYRecordUtils.splitCollectorRecords(records || [], state.ids);
  state.duplicateCount += result.duplicateCount;
  if (result.skippedMissingId.length) state.skippedMissingIdRecords.push(...result.skippedMissingId);
  state.records.push(...result.accepted);
  render();
  if (result.accepted.length) appendRecordsToDatabase(result.accepted);
  return {
    acceptedCount: result.accepted.length,
    skippedMissingIdCount: result.skippedMissingId.length,
    skippedMissingIdText: missingIdNamesText(result.skippedMissingId, 4)
  };
}

function missingIdNamesText(records, limit) {
  const summary = window.PGYRecordUtils.summarizeMissingIdRecords(records || [], limit || 8);
  if (!summary.count) return "";
  const names = summary.names.join("、") || "未命名博主";
  return summary.remaining ? `${names} 等 ${summary.count} 条` : names;
}

function skippedMissingIdFinalText() {
  if (!state.skippedMissingIdRecords.length) return "";
  return `\n缺少博主ID已跳过 ${state.skippedMissingIdRecords.length} 条：${missingIdNamesText(state.skippedMissingIdRecords, 12)}。这些记录没有写入数据库，也不会出现在 CSV 里；可重新采集或检查搜索结果。`;
}

function readPositiveIntegerInput(input, label, min) {
  const raw = String(input.value || "").trim();
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < min) {
    throw new Error(`${label}需要填写不小于 ${min} 的数字。`);
  }
  return Math.floor(value);
}

function readCollectorOptions() {
  return {
    maxPages: readPositiveIntegerInput(els.maxPages, "最大页数", 1),
    maxItems: readPositiveIntegerInput(els.maxItems, "每页最多", 1),
    delayMs: readPositiveIntegerInput(els.delayMs, "延迟 ms", 300)
  };
}

function recordsFromMessage(message) {
  if (Array.isArray(message.records)) return message.records;
  if (!message.recordsJson) return [];
  try {
    const parsed = JSON.parse(message.recordsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function cleanValue(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(cleanValue).filter(Boolean).join("|");
  if (typeof value === "object") {
    return cleanValue(value.name || value.label || value.title || value.value || value.tagName || value.text || "");
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function compactMetric(value) {
  const text = String(value || "").replace(/\s+/g, "").replace(/[，,]/g, "").trim();
  return text === "--" ? "" : text;
}

function isEmptyOrZeroMetric(value) {
  const text = compactMetric(value);
  if (!text) return true;
  const number = Number(text.replace(/%$/, ""));
  return Number.isFinite(number) && number === 0;
}

function fillPrimaryMetricsFromCoop(record) {
  for (const [target, source] of [
    ["read_median", "coop_30_read_median"],
    ["interaction_median", "coop_30_interaction_median"]
  ]) {
    const sourceValue = compactMetric(record[source]);
    if (isEmptyOrZeroMetric(record[target]) && sourceValue && !isEmptyOrZeroMetric(sourceValue)) {
      record[target] = sourceValue;
    }
  }
}

function normalizeFansCount(value) {
  const text = compactMetric(value).toLowerCase();
  if (!text) return "";
  const match = text.match(/^(\d+(?:\.\d+)?)(w|万)?$/i);
  if (!match) return text;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return text;
  return String(match[2] ? Math.round(number * 10000) : Math.round(number));
}

function compactPrice(value) {
  return compactMetric(value).replace(/[¥￥]/g, "").replace(/起$/, "").trim();
}

function priceAfterLabel(text, label) {
  const escaped = String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(text || "").match(new RegExp(escaped + "\\s*[¥￥]?\\s*([\\d,]+)", "i"));
  return match ? compactPrice(match[1]) : "";
}

function fillMissingOnly(record, patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    const next = cleanValue(value);
    if (next && !cleanValue(record[key])) record[key] = value;
  }
}

function isEmptyMcn(value) {
  const text = cleanValue(value);
  return !text || /^(无机构|暂无|无|未认证|未加入|-)$/i.test(text);
}

function mcnFromProfile(profile) {
  const value = firstMetric(profile, [
    "mcnName",
    "mcn.name",
    "mcnInfo.name",
    "mcnInfo.companyName",
    "mcnCompanyName",
    "mcnOrganizationName",
    "agencyName",
    "agency.name",
    "agencyInfo.name",
    "organizationName",
    "organization.name",
    "institutionName",
    "institution.name"
  ], [/mcn.*name/i, /agency.*name/i, /organi[sz]ation.*name/i, /institution.*name/i, /机构.*名称/]);
  return isEmptyMcn(value) ? "" : cleanValue(value);
}

function mcnFromPageText(pageText, redId = "") {
  const lines = String(pageText || "")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);
  if (!lines.length) return "";

  const keyword = /(机构|MCN|传媒|文化|网络|科技|电商|娱乐|传播|营销|工作室)/i;
  const stopLine = /^(粉丝数|获赞与收藏|收藏|邀约|合作报价|与|查看更多|数据更新至|数据概览)$/;
  const locationLine = /^[\u4e00-\u9fa5]{2,}(?:\s+[\u4e00-\u9fa5]{2,}){1,3}$/;
  let start = -1;
  const redText = cleanValue(redId);
  if (redText) start = lines.findIndex(line => line === redText);
  if (start < 0) start = lines.findIndex(line => /^小红书号/.test(line));
  if (start < 0) return "";

  for (let index = start + 1; index < Math.min(lines.length, start + 16); index += 1) {
    const line = lines[index];
    if (stopLine.test(line)) break;
    if (locationLine.test(line)) {
      const nextLine = cleanValue(lines[index + 1]);
      if (nextLine && !stopLine.test(nextLine)) return nextLine;
    }
    if (line === "无机构") return "无机构";
    if (keyword.test(line)) return cleanValue(line);
  }
  return "";
}

function normalizePercent(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string" && /%$/.test(value.trim())) return value.trim();
  const number = Number(value);
  if (!Number.isFinite(number)) return cleanValue(value);
  if (Math.abs(number) <= 1) return `${(number * 100).toFixed(2).replace(/\.00$/, "")}%`;
  return `${number.toFixed(2).replace(/\.00$/, "")}%`;
}

function unwrapData(json) {
  if (!json || typeof json !== "object") return json;
  if (json.data && typeof json.data === "object") return json.data;
  if (json.result && typeof json.result === "object") return json.result;
  return json;
}

function valueAt(object, path) {
  let current = object;
  for (const part of String(path).split(".")) {
    if (current == null) return "";
    current = current[part];
  }
  return current == null ? "" : current;
}

function firstPath(object, paths) {
  for (const path of paths) {
    const value = valueAt(object, path);
    if (value !== "" && value != null) return value;
  }
  return "";
}

function findArray(object, matchers, seen = new WeakSet(), depth = 0) {
  if (!object || typeof object !== "object" || depth > 6 || seen.has(object)) return [];
  seen.add(object);
  const entries = Array.isArray(object) ? object.map((item, index) => [String(index), item]) : Object.entries(object);
  for (const [key, value] of entries) {
    if (Array.isArray(value) && matchers.some(matcher => matcher.test(key))) return value;
    const nested = findArray(value, matchers, seen, depth + 1);
    if (nested.length) return nested;
  }
  return [];
}

function deepFind(object, matchers, seen = new WeakSet(), depth = 0) {
  if (!object || typeof object !== "object" || depth > 6 || seen.has(object)) return "";
  seen.add(object);
  const entries = Array.isArray(object) ? object.map((item, index) => [String(index), item]) : Object.entries(object);
  for (const [key, value] of entries) {
    if (matchers.some(matcher => matcher.test(key)) && value != null && typeof value !== "object") return value;
    const nested = deepFind(value, matchers, seen, depth + 1);
    if (nested !== "" && nested != null) return nested;
  }
  return "";
}

function firstMetric(object, paths, keyMatchers = []) {
  const value = firstPath(object, paths);
  if (value !== "" && value != null) return cleanValue(value);
  return cleanValue(deepFind(object, keyMatchers));
}

function listFromData(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.list || data.notes || data.items || data.dataList || data.kols || data.similarKols || data.noteList || [];
}

function namesFrom(value, limit = 8) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map(item => cleanValue(item)).filter(Boolean).slice(0, limit).join("|");
}

function topItemsFrom(value, limit = 3) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map(item => {
      if (!item || typeof item !== "object") return cleanValue(item);
      const name = cleanValue(item.name || item.label || item.group || item.city || item.province || item.interest || item.device || item.age || item.tagName || item.value);
      const rate = item.rate ?? item.ratio ?? item.percent ?? item.valueRate ?? item.userRate ?? "";
      return name ? name + (rate !== "" ? `(${normalizePercent(rate)})` : "") : "";
    })
    .filter(Boolean)
    .slice(0, limit)
    .join("|");
}

const AGE_BUCKETS = [
  ["fans_age_under_18", "<18"],
  ["fans_age_18_24", "18-24"],
  ["fans_age_25_34", "25-34"],
  ["fans_age_35_44", "35-44"],
  ["fans_age_over_44", ">44"]
];

function ageBucketName(value) {
  const text = cleanValue(value).replace(/\s+/g, "");
  if (!text) return "";
  if (/^(<18|18岁?以下|小于18|0-17|17岁?以下)/i.test(text)) return "<18";
  if (/18[-~至到]?24/.test(text)) return "18-24";
  if (/25[-~至到]?34/.test(text)) return "25-34";
  if (/35[-~至到]?44/.test(text)) return "35-44";
  if (/^(>44|44岁?以上|大于44|45岁?以上|45\+)/i.test(text)) return ">44";
  return "";
}

function rateFromAgeItem(item) {
  if (!item || typeof item !== "object") {
    const match = cleanValue(item).match(/\(([^)]+)\)/);
    return match ? normalizePercent(match[1]) : "";
  }
  const value = item.rate ?? item.ratio ?? item.percent ?? item.valueRate ?? item.userRate ?? item.valuePercent ?? item.proportion ?? "";
  if (value !== "" && value != null && typeof value !== "object") return normalizePercent(value);
  const text = cleanValue(item.name || item.label || item.group || item.age || item.tagName || item.value || "");
  const match = text.match(/\(([^)]+)\)/);
  return match ? normalizePercent(match[1]) : "";
}

function ageDistributionFields(value) {
  const list = Array.isArray(value) ? value : [];
  const byBucket = Object.fromEntries(AGE_BUCKETS.map(([, label]) => [label, ""]));
  for (const item of list) {
    const name = item && typeof item === "object"
      ? cleanValue(item.name || item.label || item.group || item.age || item.tagName || item.value || "")
      : cleanValue(item);
    const bucket = ageBucketName(name);
    const rate = rateFromAgeItem(item);
    if (bucket && rate) byBucket[bucket] = rate;
  }
  const distribution = AGE_BUCKETS.map(([, label]) => `${label}：${byBucket[label] || "-"}`).join("|");
  const fields = { fans_age_distribution: distribution };
  for (const [key, label] of AGE_BUCKETS) fields[key] = byBucket[label] || "";
  return fields;
}

function formatNoteDate(value) {
  const text = cleanValue(value);
  if (!text) return "";
  if (/^\d{13}$/.test(text)) return localDateTimeText(new Date(Number(text))).slice(0, 10);
  if (/^\d{10}$/.test(text)) return localDateTimeText(new Date(Number(text) * 1000)).slice(0, 10);
  const match = text.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/);
  return match ? match[0].replace(/[/.]/g, "-") : text;
}

function noteBrandName(note) {
  if (!note || typeof note !== "object") return "";
  const direct = firstMetric(note, [
    "brandName",
    "brand_name",
    "brand.name",
    "brandInfo.brandName",
    "brandInfo.name",
    "brandUserName",
    "cooperateBrandName",
    "recruitSummary.brandName"
  ], [/brand.*name/i, /品牌.*名/]);
  return cleanValue(direct);
}

function notePublishTime(note) {
  if (!note || typeof note !== "object") return "";
  return formatNoteDate(firstMetric(note, [
    "release",
    "releaseTime",
    "publishTime",
    "postTime",
    "createTime",
    "notePublishTime",
    "noteReleaseTime"
  ], [/release/i, /publish.*time/i, /post.*time/i, /发布时间/]));
}

function recentCoopBrandNotes(notes, limit = 20) {
  const seen = new Set();
  const items = [];
  for (const note of Array.isArray(notes) ? notes : []) {
    const brand = noteBrandName(note);
    if (!brand) continue;
    const date = notePublishTime(note);
    const text = date ? `${brand}（${date}）` : brand;
    if (seen.has(text)) continue;
    seen.add(text);
    items.push(text);
    if (items.length >= limit) break;
  }
  return items.join("|");
}

function taxonomyTags(list, level) {
  const source = Array.isArray(list) ? list : [];
  const values = [];
  for (const item of source) {
    if (!item || typeof item !== "object") {
      const text = cleanValue(item);
      if (text) values.push(text);
      continue;
    }
    if (level === 1) {
      const text = cleanValue(item.taxonomy1Tag || item.name || item.label);
      if (text) values.push(text);
    } else {
      const nested = item.taxonomy2Tags || item.children || item.subTags || [];
      for (const child of Array.isArray(nested) ? nested : [nested]) {
        const text = cleanValue(child);
        if (text) values.push(text);
      }
    }
  }
  return Array.from(new Set(values)).join("|");
}

function genderText(value) {
  const text = cleanValue(value);
  if (!text) return "";
  if (text === "1") return "男";
  if (text === "2") return "女";
  return text;
}

function splitLocationParts(value) {
  return String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function getFemaleRate(profile) {
  const direct = valueAt(profile, "gender.female");
  if (direct !== "" && direct != null) return normalizePercent(direct);
  const genderList = findArray(profile, [/gender|sex/i]);
  const female = genderList.find(item => /女|female/i.test(cleanValue(item)));
  if (female && typeof female === "object") return normalizePercent(female.rate ?? female.ratio ?? female.percent ?? female.valueRate ?? female.userRate ?? "");
  return normalizePercent(firstMetric(profile, ["femaleRate", "femaleUserRate", "womanRate"], [/female.*rate/i, /woman.*rate/i]));
}

function metricFromText(text, label) {
  const escaped = String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(text || "").match(new RegExp(escaped + "\\s*([\\d,.-]+%?)"));
  return match ? cleanValue(match[1]) : "";
}

function noteCountFromText(text) {
  const match = String(text || "").match(/发布笔记\s*(\d+)\s*篇/);
  return match ? match[1] : "";
}

function isConfirmedCoopPageText(text) {
  return /合作行业|外溢进店中位数|仅展示蒲公英合作笔记|合作笔记/.test(String(text || ""));
}

function coopRateFields(notesRate, pageText, prefix) {
  const field = suffix => `${prefix}_${suffix}`;
  const confirmedPageText = isConfirmedCoopPageText(pageText) ? pageText : "";
  return {
    [field("note_count")]: noteCountFromText(confirmedPageText),
    [field("exposure_median")]: metricFromText(confirmedPageText, "曝光中位数") || firstMetric(notesRate, ["impMedian", "exposureMedian", "impressionMedian"], [/imp.*median/i, /exposure.*median/i]),
    [field("read_median")]: metricFromText(confirmedPageText, "阅读中位数") || firstMetric(notesRate, ["readMedian"], [/read.*median/i]),
    [field("interaction_median")]: metricFromText(confirmedPageText, "互动中位数") || firstMetric(notesRate, ["mEngagementNum", "mengagementNum", "interactionMedian"], [/m.*engagement/i, /interaction.*median/i]),
    [field("outside_shop_median")]: metricFromText(confirmedPageText, "外溢进店中位数") || firstMetric(notesRate, ["mCpuvNum30d", "mcpuvNum30d", "overflowNum", "outsideShopMedian"], [/cpuv/i, /overflow/i, /outside.*shop/i]),
    [field("like_median")]: metricFromText(confirmedPageText, "中位点赞量") || firstMetric(notesRate, ["likeMedian", "mLikeCnt"], [/like.*median/i]),
    [field("collect_median")]: metricFromText(confirmedPageText, "中位收藏量") || firstMetric(notesRate, ["collectMedian", "mCollectCnt"], [/collect.*median/i]),
    [field("comment_median")]: metricFromText(confirmedPageText, "中位评论量") || firstMetric(notesRate, ["commentMedian", "mCommentCnt"], [/comment.*median/i]),
    [field("share_median")]: metricFromText(confirmedPageText, "中位分享量") || firstMetric(notesRate, ["shareMedian", "mShareCnt"], [/share.*median/i]),
    [field("follow_median")]: metricFromText(confirmedPageText, "中位关注量") || firstMetric(notesRate, ["mFollowCnt", "mfollowCnt", "followMedian"], [/follow.*median/i, /mfollow/i]),
    [field("interaction_rate")]: metricFromText(confirmedPageText, "互动率") || normalizePercent(firstMetric(notesRate, ["interactionRate", "engagementRate"], [/interaction.*rate/i, /engagement.*rate/i])),
    [field("video_finish_rate")]: metricFromText(confirmedPageText, "视频完播率") || normalizePercent(firstMetric(notesRate, ["videoFullViewRate", "fullViewRate", "videoFinishRate"], [/video.*(full|finish).*rate/i])),
    [field("picture_3s_view_rate")]: metricFromText(confirmedPageText, "图文3秒阅读率") || normalizePercent(firstMetric(notesRate, ["picture3sViewRate", "pictureThreeSecondViewRate"], [/picture.*3.*rate/i, /3s.*view.*rate/i])),
    [field("thousand_like_percent")]: metricFromText(confirmedPageText, "千赞笔记比例") || normalizePercent(firstMetric(notesRate, ["thousandLikePercent", "thousandLikeRate"], [/thousand.*like/i, /1000.*like/i])),
    [field("hundred_like_percent")]: metricFromText(confirmedPageText, "百赞笔记比例") || normalizePercent(firstMetric(notesRate, ["hundredLikePercent", "hundredLikeRate"], [/hundred.*like/i, /100.*like/i]))
  };
}

function userIdFromApiUrl(url) {
  const text = String(url || "");
  const queryMatch = text.match(/[?&](?:userId|kolUserId)=([^&#]+)/);
  if (queryMatch) return decodeURIComponent(queryMatch[1]);
  const pathMatch = text.match(/\/(?:blogger|data)\/([a-f0-9]{24})(?:[/?#]|$)/i);
  return pathMatch ? decodeURIComponent(pathMatch[1]) : "";
}

function userIdFromDetailUrl(url) {
  const match = String(url || "").match(/\/blogger-detail\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function userIdFromProfile(profile) {
  return cleanValue(firstMetric(profile || {}, [
    "userId",
    "user_id",
    "kolUserId",
    "kol_user_id",
    "bloggerId",
    "blogger_id",
    "user.userId",
    "user.user_id",
    "userInfo.userId",
    "userInfo.user_id",
    "user.id",
    "userInfo.id"
  ], [/^(userId|user_id|kolUserId|kol_user_id|bloggerId|blogger_id)$/i]));
}

function isLoadedDetailPageText(text) {
  const value = String(text || "");
  return value.includes("小红书号") && value.includes("粉丝数");
}

function apiKindFromUrl(url) {
  const text = String(url || "");
  if (/\/cooperator\/user\/blogger\//.test(text)) return "profile";
  if (/\/fans_summary/.test(text)) return "fansSummary";
  if (/\/kol_content_tags/.test(text)) return "contentTags";
  if (/\/kol_feature_tags/.test(text)) return "featureTags";
  if (/\/fans_profile/.test(text)) return "fansProfile";
  if (/\/notes_rate/.test(text)) {
    const business = text.match(/[?&]business=([^&#]+)/)?.[1];
    const dateType = text.match(/[?&]dateType=([^&#]+)/)?.[1];
    if (business === "1" && dateType === "1") return "coopNotesRate30";
    if (business === "1" && dateType === "2") return "coopNotesRate90";
    return "notesRate";
  }
  if (/\/notes_detail/.test(text)) return "notesDetail";
  if (/\/get_similar_kol/.test(text)) return "similar";
  if (/\/fans_overall_new_history/.test(text)) return "fansHistory";
  return "";
}

function storeApiResponse(message) {
  const userId = userIdFromApiUrl(message.url);
  const kind = apiKindFromUrl(message.url);
  if (!userId || !kind || !message.body) return;
  const existing = state.apiResponses.get(userId) || {};
  existing[kind] = unwrapData(message.body);
  existing.updatedAt = Date.now();
  state.apiResponses.set(userId, existing);
}

function rawApiSnapshotForRecord(userId) {
  const captured = state.apiResponses.get(userId) || {};
  const payload = {};
  for (const key of [
    "profile",
    "fansSummary",
    "contentTags",
    "featureTags",
    "fansProfile",
    "notesRate",
    "coopNotesRate30",
    "coopNotesRate90",
    "notesDetail",
    "similar",
    "fansHistory"
  ]) {
    if (captured[key] !== undefined) payload[key] = captured[key];
  }
  for (const key of [
    "pageText",
    "costPageText",
    "coopPageText30",
    "coopPageText90",
    "detailUrl",
    "coopCaptureError",
    "costCaptureError"
  ]) {
    if (captured[key]) payload[key] = captured[key];
  }
  payload.captured_at = new Date().toISOString();
  try {
    return JSON.stringify(payload);
  } catch (error) {
    return JSON.stringify({
      captured_at: payload.captured_at,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function parseEnhancedFromCaptured(userId) {
  const captured = state.apiResponses.get(userId) || {};
  const profile = captured.profile || {};
  const fansSummary = captured.fansSummary || {};
  const contentTags = captured.contentTags || {};
  const featureTags = captured.featureTags || {};
  const fansProfile = captured.fansProfile || {};
  const notesRate = captured.notesRate || {};
  const coopNotesRate30 = captured.coopNotesRate30 || {};
  const coopNotesRate90 = captured.coopNotesRate90 || {};
  const notesDetail = captured.notesDetail || {};
  const similar = captured.similar || {};
  const pageText = captured.pageText || "";
  const contentTagList = firstPath(profile, ["contentTags"]) || listFromData(contentTags);
  const locationParts = splitLocationParts(firstPath(profile, ["location"]));
  const redId = cleanValue(firstMetric(profile, ["redId", "red_id", "redID", "user.redId", "userInfo.redId"], [/red.*id/i, /xhs.*id/i]));
  const pageMcnText = mcnFromPageText(pageText, redId);
  const apiMcnText = mcnFromProfile(profile);
  const mcnText = pageMcnText || apiMcnText || "无机构";
  const provinceList = firstPath(fansProfile, ["provinces"]) || findArray(fansProfile, [/province/i, /省/]);
  const cityList = firstPath(fansProfile, ["cities"]) || findArray(fansProfile, [/citi|city/i, /城市/]);
  const ageList = firstPath(fansProfile, ["ages"]) || findArray(fansProfile, [/age/i, /年龄/]);
  const interestList = firstPath(fansProfile, ["interests"]) || findArray(fansProfile, [/interest/i, /兴趣/]);
  const deviceList = firstPath(fansProfile, ["devices"]) || findArray(fansProfile, [/device|phone|brand/i, /设备/]);
  const notes = listFromData(notesDetail);
  const similarKols = listFromData(similar);
  const noteCount = firstMetric(notesRate, ["noteNumber", "noteCnt", "total", "noteCount"], [/note.*number/i, /note.*count/i]) || cleanValue(firstPath(profile, ["totalNoteCount"]));
  const videoCount = firstMetric(notesRate, ["videoNoteNumber", "videoNoteCnt", "videoNoteCount"], [/video.*note.*number/i, /video.*note.*count/i]);
  const imageCount = noteCount !== "" && videoCount !== "" && Number.isFinite(Number(noteCount)) && Number.isFinite(Number(videoCount))
    ? String(Math.max(0, Number(noteCount) - Number(videoCount)))
    : "";
  const adCount = firstMetric(notesRate, ["advertiseNoteNumber", "advertiseNoteCnt", "businessNoteNumber"], [/advertise.*note/i, /business.*note/i]) ||
    cleanValue(firstPath(profile, ["businessNoteCount"]));

  return {
    red_id: redId,
    gender: genderText(firstMetric(profile, ["gender", "sex", "user.gender", "userInfo.gender"], [/gender|sex/i])),
    mcn_status: mcnText,
    like_collect_count: cleanValue(firstMetric(profile, ["likeCollectCountInfo", "likeCollectCount", "likedCollectCount", "likeAndCollectCount", "likedAndCollectedCount"], [/^like.*collect/i, /^liked.*collect/i])),
    ...coopRateFields(coopNotesRate30, captured.coopPageText30 || "", "coop_30"),
    ...coopRateFields(coopNotesRate90, captured.coopPageText90 || "", "coop_90"),
    business_note_count: cleanValue(firstMetric(profile, ["businessNoteCount", "cooperateNoteCount", "commercialNoteCount"], [/business.*note/i, /cooperate.*note/i, /commercial.*note/i])),
    content_tags: taxonomyTags(contentTagList, 1) || namesFrom(listFromData(contentTags), 12),
    sub_content_tags: taxonomyTags(contentTagList, 2),
    feature_tags: namesFrom(listFromData(featureTags) || firstPath(profile, ["featureTags", "featureTagList"]), 12),
    current_level: cleanValue(firstMetric(profile, ["currentLevel", "level", "kolLevel"], [/current.*level/i, /kol.*level/i])),
    exposure_median: firstMetric(notesRate, ["impMedian", "exposureMedian", "impressionMedian"], [/imp.*median/i, /exposure.*median/i]),
    like_median: firstMetric(notesRate, ["likeMedian", "mLikeCnt"], [/like.*median/i]),
    collect_median: firstMetric(notesRate, ["collectMedian", "mCollectCnt"], [/collect.*median/i]),
    comment_median: firstMetric(notesRate, ["commentMedian", "mCommentCnt"], [/comment.*median/i]),
    share_median: firstMetric(notesRate, ["shareMedian", "mShareCnt"], [/share.*median/i]),
    follow_median: firstMetric(notesRate, ["followMedian", "mfollowCnt", "mFollowCnt"], [/follow.*median/i, /mfollow/i]),
    interaction_rate: normalizePercent(firstMetric(notesRate, ["interactionRate", "engagementRate", "interactionMedianRate"], [/interaction.*rate/i, /engagement.*rate/i])),
    estimate_cpm: metricFromText(captured.costPageText || "", "预估CPM") || firstMetric(notesRate, ["cpm", "estimateCpm", "predictCpm", "costPerMille"], [/cpm/i]),
    estimate_read_unit_price: metricFromText(captured.costPageText || "", "预估阅读单价") || firstMetric(notesRate, ["readUnitPrice", "estimateReadUnitPrice", "readCost", "costPerRead"], [/read.*(unit|price|cost)/i]),
    estimate_interaction_unit_price: metricFromText(captured.costPageText || "", "预估互动单价") || firstMetric(notesRate, ["interactionUnitPrice", "estimateInteractionUnitPrice", "interactionCost", "costPerInteraction"], [/interaction.*(unit|price|cost)/i]),
    video_finish_rate: normalizePercent(firstMetric(notesRate, ["videoFullViewRate", "fullViewRate", "videoFinishRate"], [/video.*(full|finish).*rate/i]) || firstPath(profile, ["videoFinishRate"])),
    picture_3s_view_rate: normalizePercent(firstMetric(notesRate, ["picture3sViewRate", "pictureThreeSecondViewRate"], [/picture.*3.*rate/i, /3s.*view.*rate/i])),
    hundred_like_percent: normalizePercent(firstMetric(notesRate, ["hundredLikePercent", "hundredLikeRate"], [/hundred.*like/i, /100.*like/i]) || firstPath(profile, ["hundredLikePercent30"])),
    thousand_like_percent: normalizePercent(firstMetric(notesRate, ["thousandLikePercent", "thousandLikeRate"], [/thousand.*like/i, /1000.*like/i]) || firstPath(profile, ["thousandLikePercent30"])),
    fans_growth_num: firstMetric(fansSummary, ["fansIncreaseNum", "fansGrowthNum", "increaseFansNum"], [/fans.*increase/i, /fans.*growth/i]) || cleanValue(firstPath(profile, ["fans30GrowthNum"])),
    fans_growth_rate: normalizePercent(firstMetric(fansSummary, ["fansGrowthRate", "fansIncreaseRate"], [/fans.*growth.*rate/i, /fans.*increase.*rate/i]) || firstPath(profile, ["fans30GrowthRate"])),
    active_fans_rate: normalizePercent(firstMetric(fansSummary, ["activeFansRate"], [/active.*fans.*rate/i])),
    read_fans_rate: normalizePercent(firstMetric(fansSummary, ["readFansRate"], [/read.*fans.*rate/i])),
    engage_fans_rate: normalizePercent(firstMetric(fansSummary, ["engageFansRate", "engagementFansRate"], [/engage.*fans.*rate/i])),
    pay_fans_rate: normalizePercent(firstMetric(fansSummary, ["payFansUserRate30d", "payFansRate"], [/pay.*fans.*rate/i])),
    fans_female_rate: getFemaleRate(fansProfile),
    ...ageDistributionFields(ageList),
    fans_top_provinces: topItemsFrom(provinceList, 3),
    fans_top_cities: topItemsFrom(cityList, 3),
    fans_top_interests: topItemsFrom(interestList, 5),
    fans_top_device: topItemsFrom(deviceList, 1),
    data_updated_at: cleanValue(firstMetric(fansProfile, ["dateKey", "date", "updateTime"], [/date.*key/i, /update.*time/i])) ||
      cleanValue(firstMetric(notesRate, ["dateKey", "updateTime"], [/date.*key/i, /update.*time/i])),
    recent_note_count: noteCount,
    video_note_count: videoCount,
    image_note_count: imageCount,
    advertise_note_count: adCount,
    recent_coop_brand_notes: recentCoopBrandNotes(notes),
    recent_note_titles: notes.map(note => cleanValue(note.title || note.noteTitle || note.name)).filter(Boolean).slice(0, 10).join("|"),
    recent_note_ids: notes.map(note => cleanValue(note.noteId || note.id)).filter(Boolean).slice(0, 10).join("|"),
    similar_kol_ids: similarKols.map(kol => cleanValue(kol.userId || kol.kolUserId || kol.id)).filter(Boolean).slice(0, 10).join("|"),
    similar_kol_names: similarKols.map(kol => cleanValue(kol.nickName || kol.nickname || kol.name)).filter(Boolean).slice(0, 10).join("|")
  };
}

function parseBaseFromCaptured(userId, existingRecord = {}) {
  const captured = state.apiResponses.get(userId) || {};
  const profile = captured.profile || {};
  const contentTags = captured.contentTags || {};
  const notesRate = captured.notesRate || {};
  const pageText = captured.pageText || "";
  const locationParts = splitLocationParts(firstPath(profile, ["location", "ipLocation", "areaName"]));
  const contentTagList = firstPath(profile, ["contentTags"]) || listFromData(contentTags);
  const fans = firstMetric(profile, ["fansCount", "fansNum", "fansCountInfo", "followerCount"], [/fans.*(count|num)/i, /follower.*count/i]);
  return {
    nickname: cleanValue(firstMetric(profile, ["nickName", "nickname", "name", "user.nickName", "userInfo.nickName"], [/nick.*name/i])) || existingRecord.nickname,
    blogger_id: userId || existingRecord.blogger_id,
    blogger_url: userId ? "https://www.xiaohongshu.com/user/profile/" + userId : existingRecord.blogger_url,
    province: locationParts[0] || existingRecord.province,
    city: locationParts.length > 1 ? locationParts[1] : existingRecord.city,
    tags: taxonomyTags(contentTagList, 1) || namesFrom(listFromData(contentTags), 12) || existingRecord.tags,
    fans_count: normalizeFansCount(fans) || existingRecord.fans_count,
    read_median: firstMetric(notesRate, ["readMedian"], [/read.*median/i]) || existingRecord.read_median,
    interaction_median: firstMetric(notesRate, ["mEngagementNum", "mengagementNum", "interactionMedian"], [/m.*engagement/i, /interaction.*median/i]) || existingRecord.interaction_median,
    image_note_price: priceAfterLabel(pageText, "图文笔记一口价") || existingRecord.image_note_price,
    video_note_price: priceAfterLabel(pageText, "视频笔记一口价") || existingRecord.video_note_price
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForWebviewLoad(timeoutMs) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      els.webview.removeEventListener("did-finish-load", finish);
      els.webview.removeEventListener("dom-ready", finish);
      resolve(true);
    };
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      els.webview.removeEventListener("did-finish-load", finish);
      els.webview.removeEventListener("dom-ready", finish);
      resolve(false);
    }, timeoutMs);
    els.webview.addEventListener("did-finish-load", finish);
    els.webview.addEventListener("dom-ready", finish);
  });
}

async function handleTrustedClickRequest(message) {
  const x = Math.round(Number(message.x));
  const y = Math.round(Number(message.y));
  const requestId = message.requestId || "";
  let ok = false;
  const webContentsId = typeof els.webview.getWebContentsId === "function" ? els.webview.getWebContentsId() : 0;
  const sendInputEvent = async inputEvent => {
    if (window.desktopApi && typeof window.desktopApi.sendWebviewInputEvent === "function" && webContentsId) {
      return window.desktopApi.sendWebviewInputEvent({ webContentsId, event: inputEvent });
    }
    if (typeof els.webview.sendInputEvent === "function") {
      els.webview.sendInputEvent(inputEvent);
      return { ok: true };
    }
    return { ok: false };
  };
  if (Number.isFinite(x) && Number.isFinite(y) && requestId) {
    try {
      els.webview.focus();
      await sendInputEvent({ type: "mouseMove", x, y, movementX: 0, movementY: 0 });
      await sleep(60);
      await sendInputEvent({ type: "mouseDown", x, y, button: "left", clickCount: 1 });
      await sleep(40);
      await sendInputEvent({ type: "mouseUp", x, y, button: "left", clickCount: 1 });
      ok = true;
    } catch (error) {
      ok = false;
      state.lastDiagnostics = { ...state.lastDiagnostics, trustedClickError: error && error.message ? error.message : String(error) };
    }
  }
  const payload = JSON.stringify({ source: "pgy-desktop-host", type: "trusted-click-done", requestId, ok });
  try {
    await els.webview.executeJavaScript(`window.postMessage(${payload}, "*")`, true);
  } catch (_) {}
}

async function waitForCapturedApis(userId, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const captured = state.apiResponses.get(userId) || {};
    if (
      captured.profile &&
      captured.fansSummary &&
      captured.contentTags &&
      captured.featureTags &&
      captured.fansProfile &&
      captured.notesRate &&
      captured.notesDetail &&
      captured.similar
    ) return captured;
    await sleep(400);
  }
  return state.apiResponses.get(userId) || {};
}

async function waitForCoopNotesRates(userId, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const captured = state.apiResponses.get(userId) || {};
    if (captured.coopNotesRate30 && captured.coopNotesRate90) return captured;
    await sleep(400);
  }
  return state.apiResponses.get(userId) || {};
}

function captureMissingParts(userId, record, includeCoop = false) {
  const captured = state.apiResponses.get(userId) || {};
  const missing = [];
  const hasData = value => value && typeof value === "object";
  const hasMetric = value => firstMetric(value || {}, ["noteNumber", "impMedian", "readMedian", "interactionMedian", "mEngagementNum"], [/note.*number/i, /imp.*median/i, /read.*median/i, /interaction.*median/i, /engagement/i]) !== "";
  const hasCoopPageCount = value => isConfirmedCoopPageText(value) && noteCountFromText(value);
  const pageText = captured.pageText || "";
  const hasCostMetrics = metricFromText(captured.costPageText || "", "预估CPM") ||
    firstMetric(captured.notesRate || {}, ["cpm", "estimateCpm", "predictCpm", "costPerMille"], [/cpm/i]);

  if (!hasData(captured.profile)) missing.push("基础资料接口");
  if (!hasData(captured.fansSummary)) missing.push("粉丝概要接口");
  if (!hasData(captured.contentTags)) missing.push("内容标签接口");
  if (!hasData(captured.featureTags)) missing.push("特征标签接口");
  if (!hasData(captured.fansProfile)) missing.push("粉丝画像接口");
  if (!hasMetric(captured.notesRate)) missing.push("日常笔记表现");
  if (!hasData(captured.notesDetail)) missing.push("近期笔记接口");
  if (!hasData(captured.similar)) missing.push("相似博主接口");
  if (!isLoadedDetailPageText(pageText)) {
    missing.push("页面基础资料文本");
  }
  if (includeCoop) {
    if (!hasCostMetrics) missing.push("成本核心指标");
    if (!hasCoopPageCount(captured.coopPageText30 || "")) missing.push("合作笔记近30日");
    if (!hasCoopPageCount(captured.coopPageText90 || "")) missing.push("合作笔记近90日");
  }
  return missing;
}

async function waitForCaptureQuality(userId, record, timeoutMs, includeCoop = false) {
  const started = Date.now();
  let missing = captureMissingParts(userId, record, includeCoop);
  while (missing.length && Date.now() - started < timeoutMs) {
    await sleep(500);
    missing = captureMissingParts(userId, record, includeCoop);
  }
  return missing;
}

async function waitForDetailPageText(record, timeoutMs) {
  const started = Date.now();
  let lastText = "";
  while (Date.now() - started < timeoutMs) {
    try {
      const pageText = await els.webview.executeJavaScript("document.body ? document.body.innerText : ''", true);
      lastText = pageText || lastText;
      if (isLoadedDetailPageText(pageText)) {
        return pageText;
      }
    } catch (_) {}
    await sleep(500);
  }
  return lastText;
}

async function triggerCoopNotesRateCapture() {
  return els.webview.executeJavaScript(`
(async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const textOf = node => (node && node.textContent ? node.textContent : "").replace(/\\s+/g, " ").trim();
  const dataText = () => document.querySelector(".trans-data-wrapper")?.innerText || "";
  const isCoopDataText = text => /合作行业|外溢进店中位数|仅展示蒲公英合作笔记/.test(text || "");
  const waitFor = async (predicate, timeoutMs) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const value = predicate();
      if (value) return value;
      await sleep(500);
    }
    return null;
  };
  const clickElement = el => {
    if (!el) return false;
    el.scrollIntoView({ block: "center", inline: "center" });
    const rect = el.getBoundingClientRect();
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    for (const type of ["pointerover", "mouseover", "mousemove", "pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      el.dispatchEvent(new MouseEvent(type, opts));
    }
    return true;
  };
  const wrapper = await waitFor(() => {
    const el = document.querySelector(".trans-data-wrapper");
    return el && textOf(el).includes("数据表现") ? el : null;
  }, 30000) || document.body;
  wrapper.scrollIntoView({ block: "start", inline: "nearest" });
  await sleep(1000);

  const coop = Array.from(document.querySelectorAll(".trans-data-wrapper button, .trans-data-wrapper div, .trans-data-wrapper span"))
    .find(el => textOf(el) === "合作笔记");
  clickElement(coop);
  const text30 = await waitFor(() => {
    const text = dataText();
    return text.includes("近30日") && isCoopDataText(text) ? text : "";
  }, 30000) || "";

  const dateSelect = Array.from(document.querySelectorAll(".trans-data-wrapper .d-select-wrapper"))
    .find(el => textOf(el) === "近30日");
  clickElement(dateSelect);
  const option90 = await waitFor(() => Array.from(document.querySelectorAll(".d-popover .d-grid-item, .d-popover [class*='option']"))
    .find(el => textOf(el) === "近90日"), 12000);
  clickElement(option90);
  const text90 = await waitFor(() => {
    const text = dataText();
    return text.includes("近90日") && isCoopDataText(text) ? text : "";
  }, 30000) || "";

  return { text30, text90 };
})()
`, true);
}

async function triggerCostMetricsCapture() {
  return els.webview.executeJavaScript(`
(async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const textOf = node => (node && node.textContent ? node.textContent : "").replace(/\\s+/g, " ").trim();
  const dataText = () => document.querySelector(".trans-data-wrapper")?.innerText || document.body?.innerText || "";
  const waitFor = async (predicate, timeoutMs) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const value = predicate();
      if (value) return value;
      await sleep(500);
    }
    return null;
  };
  const clickElement = el => {
    if (!el) return false;
    el.scrollIntoView({ block: "center", inline: "center" });
    const rect = el.getBoundingClientRect();
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    for (const type of ["pointerover", "mouseover", "mousemove", "pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      el.dispatchEvent(new MouseEvent(type, opts));
    }
    return true;
  };
  const wrapper = await waitFor(() => {
    const el = document.querySelector(".trans-data-wrapper");
    return el && textOf(el).includes("核心指标") ? el : null;
  }, 30000) || document.body;
  wrapper.scrollIntoView({ block: "start", inline: "nearest" });
  await sleep(900);
  const costTab = Array.from(document.querySelectorAll(".trans-data-wrapper button, .trans-data-wrapper div, .trans-data-wrapper span"))
    .find(el => textOf(el) === "按成本");
  clickElement(costTab);
  const text = await waitFor(() => {
    const current = dataText();
    return current.includes("预估CPM") && current.includes("预估阅读单价") && current.includes("预估互动单价") ? current : "";
  }, 16000) || dataText();
  return text;
})()
`, true);
}

async function collectCostMetricsWithRetry(userId, record, delayMs) {
  let lastMissing = ["成本核心指标"];
  for (let costAttempt = 1; costAttempt <= 2; costAttempt += 1) {
    if (state.stopRequested) return lastMissing;
    const progress = state.detailProgress
      ? `总进度 ${state.detailProgress.current}/${state.detailProgress.total}，`
      : "";
    setStatus(`正在采集第 ${record.page_no || state.pageNo || "?"} 页的第 ${record.rank_in_page || "?"} 个博主，${progress}正在读取“${record.nickname || userId}”按成本核心指标，第 ${costAttempt}/2 次尝试。`);
    try {
      const costText = await triggerCostMetricsCapture();
      if (state.stopRequested) return lastMissing;
      const captured = state.apiResponses.get(userId) || {};
      captured.costPageText = costText || "";
      state.apiResponses.set(userId, captured);
    } catch (error) {
      const captured = state.apiResponses.get(userId) || {};
      captured.costCaptureError = error && error.message ? error.message : String(error);
      state.apiResponses.set(userId, captured);
    }
    const captured = state.apiResponses.get(userId) || {};
    lastMissing = metricFromText(captured.costPageText || "", "预估CPM") ||
      firstMetric(captured.notesRate || {}, ["cpm", "estimateCpm", "predictCpm", "costPerMille"], [/cpm/i])
      ? [] : ["成本核心指标"];
    if (!lastMissing.length) return [];
    if (state.stopRequested) return lastMissing;
    await sleep(Math.max(1200, delayMs));
  }
  return lastMissing;
}

async function collectCoopNotesWithRetry(userId, record, delayMs) {
  let lastMissing = ["合作笔记近30日", "合作笔记近90日"];
  for (let coopAttempt = 1; coopAttempt <= 3; coopAttempt += 1) {
    if (state.stopRequested) return lastMissing;
    const progress = state.detailProgress
      ? `总进度 ${state.detailProgress.current}/${state.detailProgress.total}，`
      : "";
    setStatus(`正在采集第 ${record.page_no || state.pageNo || "?"} 页的第 ${record.rank_in_page || "?"} 个博主，${progress}正在读取“${record.nickname || userId}”合作笔记数据，第 ${coopAttempt}/3 次尝试。`);
    try {
      const coopTexts = await triggerCoopNotesRateCapture();
      if (state.stopRequested) return lastMissing;
      const captured = state.apiResponses.get(userId) || {};
      captured.coopPageText30 = coopTexts && coopTexts.text30 ? coopTexts.text30 : "";
      captured.coopPageText90 = coopTexts && coopTexts.text90 ? coopTexts.text90 : "";
      state.apiResponses.set(userId, captured);
      await waitForCoopNotesRates(userId, Math.max(18000, delayMs * 10));
    } catch (error) {
      const captured = state.apiResponses.get(userId) || {};
      captured.coopCaptureError = error && error.message ? error.message : String(error);
      state.apiResponses.set(userId, captured);
    }
    lastMissing = captureMissingParts(userId, record, true).filter(item => /^合作笔记/.test(item));
    if (!lastMissing.length) return [];
    if (state.stopRequested) return lastMissing;
    await sleep(Math.max(1800, delayMs));
  }
  return lastMissing;
}

function compareDetailIdentity(record, parsedBase, parsedEnhanced, identityLock) {
  const expectedUserId = cleanValue(identityLock?.blogger_id || record.blogger_id);
  const captured = state.apiResponses.get(record.blogger_id) || {};
  const profileUserId = userIdFromProfile(captured.profile || {});
  const detailUrlUserId = userIdFromDetailUrl(captured.detailUrl || "");
  if (expectedUserId && profileUserId && expectedUserId !== profileUserId) {
    throw new Error(`详情页身份不一致：期望博主ID ${expectedUserId}，实际接口返回 ${profileUserId}，已取消写入。`);
  }
  if (expectedUserId && detailUrlUserId && expectedUserId !== detailUrlUserId) {
    throw new Error(`详情页身份不一致：期望博主ID ${expectedUserId}，实际页面地址 ${detailUrlUserId}，已取消写入。`);
  }

  const expectedNickname = cleanValue(identityLock?.nickname || record.nickname);
  const expectedRedId = cleanValue(identityLock?.red_id || record.red_id);
  const actualNickname = cleanValue(parsedBase.nickname || record.nickname);
  const actualRedId = cleanValue(parsedEnhanced.red_id || record.red_id);
  const notes = [];
  if (expectedNickname && actualNickname && expectedNickname !== actualNickname) {
    notes.push(`昵称变更：${expectedNickname} → ${actualNickname}`);
  }
  if (expectedRedId && actualRedId && expectedRedId !== actualRedId) {
    notes.push(`小红书号变更：${expectedRedId} → ${actualRedId}`);
  }
  return {
    status: notes.length ? "资料变更" : "通过",
    note: notes.join("；")
  };
}

async function collectDetailWithQualityGate(record, index, total, attempt, maxAttempts, delayMs, options = {}) {
  const userId = record.blogger_id;
  const itemNo = index + 1;
  const pageNo = record.page_no || state.pageNo || "?";
  if (state.stopRequested) return ["已停止"];
  state.detailProgress = {
    current: itemNo,
    total,
    pageNo,
    rank: record.rank_in_page || "?",
    nickname: record.nickname || userId,
    attempt,
    maxAttempts
  };
  setStatus(`正在采集第 ${pageNo} 页的第 ${record.rank_in_page || "?"} 个博主（总进度 ${itemNo}/${total}），第 ${attempt}/${maxAttempts} 次加载详情页。`);
  render();

  state.apiResponses.set(userId, {});
  els.webview.src = `https://pgy.xiaohongshu.com/solar/pre-trade/blogger-detail/${encodeURIComponent(userId)}`;
  await waitForWebviewLoad(25000);
  if (state.stopRequested) return ["已停止"];

  const firstPageText = await waitForDetailPageText(record, Math.max(18000, delayMs * 8));
  if (state.stopRequested) return ["已停止"];
  const detailUrl = await els.webview.executeJavaScript("location.href", true).catch(() => "");
  state.apiResponses.set(userId, {
    ...(state.apiResponses.get(userId) || {}),
    pageText: firstPageText || "",
    detailUrl
  });

  await waitForCapturedApis(userId, Math.max(22000, delayMs * 12));
  if (state.stopRequested) return ["已停止"];
  await waitForCaptureQuality(userId, record, Math.max(8000, delayMs * 5), false);
  if (state.stopRequested) return ["已停止"];

  await collectCostMetricsWithRetry(userId, record, delayMs);
  if (state.stopRequested) return ["已停止"];

  await collectCoopNotesWithRetry(userId, record, delayMs);
  if (state.stopRequested) return ["已停止"];

  const finalPageText = await waitForDetailPageText(record, Math.max(8000, delayMs * 5));
  const finalDetailUrl = await els.webview.executeJavaScript("location.href", true).catch(() => "");
  state.apiResponses.set(userId, {
    ...(state.apiResponses.get(userId) || {}),
    pageText: finalPageText || firstPageText || "",
    detailUrl: finalDetailUrl || detailUrl
  });

  const missing = await waitForCaptureQuality(userId, record, Math.max(5000, delayMs * 4), true);
  const parsedBase = parseBaseFromCaptured(userId, record);
  const parsedEnhanced = parseEnhancedFromCaptured(userId);
  const identityResult = compareDetailIdentity(record, parsedBase, parsedEnhanced, options.identityLock);
  Object.assign(record, parsedBase, parsedEnhanced, {
    identity_compare_status: identityResult.status,
    identity_compare_note: identityResult.note,
    detail_collect_status: missing.length ? "需复查" : "完成",
    detail_retry_count: String(attempt - 1),
    detail_missing_fields: missing.join("|"),
    raw_api_json: rawApiSnapshotForRecord(userId)
  });
  if (options.identityLock) {
    record.blogger_id = options.identityLock.blogger_id || record.blogger_id;
    record.blogger_url = options.identityLock.blogger_url || record.blogger_url;
    if (!cleanValue(record.nickname)) record.nickname = options.identityLock.nickname || record.nickname;
    if (!cleanValue(record.red_id)) record.red_id = options.identityLock.red_id || record.red_id;
  }
  fillPrimaryMetricsFromCoop(record);
  render();
  return missing;
}

const EMPTY_CHECK_SKIP_KEYS = new Set(["city", "identity_compare_note", "detail_missing_fields"]);

function emptyFieldLabels(record) {
  return getExportFields()
    .filter(([key]) => !EMPTY_CHECK_SKIP_KEYS.has(key))
    .filter(([key]) => cleanValue(record[key]) === "")
    .map(([, label]) => label);
}

function recordsWithEmptyFields() {
  return state.records
    .map((record, index) => ({ record, index, missingLabels: emptyFieldLabels(record) }))
    .filter(item => item.missingLabels.length && item.record.blogger_id);
}

async function refetchNormalRecordOnce(record, index, total, delayMs) {
  const userId = record.blogger_id;
  setStatus(`自检补采：正在补采第 ${index + 1}/${total} 个有空值的博主“${record.nickname || userId}”。`);
  state.apiResponses.set(userId, {});
  els.webview.src = `https://pgy.xiaohongshu.com/solar/pre-trade/blogger-detail/${encodeURIComponent(userId)}`;
  await waitForWebviewLoad(25000);
  const pageText = await waitForDetailPageText(record, Math.max(16000, delayMs * 8));
  state.apiResponses.set(userId, {
    ...(state.apiResponses.get(userId) || {}),
    pageText: pageText || ""
  });
  await waitForCapturedApis(userId, Math.max(18000, delayMs * 10));
  fillMissingOnly(record, parseBaseFromCaptured(userId, record));
  render();
}

async function selfCheckAndRefetchEmptyOnce() {
  const candidates = recordsWithEmptyFields();
  if (!candidates.length || state.stopRequested) return 0;

  state.finalChecking = true;
  render();
  const delayMs = Math.max(1200, Number(els.delayMs.value || 1400));
  setStatus(`采集完成，正在自检空值。\n发现 ${candidates.length} 个博主存在空值，只补采 1 次。`);

  for (let i = 0; i < candidates.length; i += 1) {
    if (state.stopRequested) break;
    const { record, index } = candidates[i];
    try {
      if (state.enhancedMode) {
        await collectDetailWithQualityGate(record, index, state.records.length, 1, 1, delayMs);
      } else {
        await refetchNormalRecordOnce(record, i, candidates.length, delayMs);
      }
      await appendRecordsToDatabase([record], { countTowardsBatch: false });
    } catch (error) {
      if (state.enhancedMode) {
        record.detail_collect_status = record.detail_collect_status || "需复查";
        record.detail_missing_fields = record.detail_missing_fields || `自检补采异常：${error && error.message ? error.message : String(error)}`;
      }
    }
    await sleep(Math.max(1000, Math.round(delayMs * (0.8 + Math.random() * 0.7))));
  }

  state.finalChecking = false;
  render();
  return candidates.length;
}

async function finishCollection(message, options = {}) {
  const checkedCount = options.skipSelfCheck ? 0 : await selfCheckAndRefetchEmptyOnce();
  const databaseText = await finishDatabaseBatch(state.stopRequested ? "中止" : "完成", checkedCount);
  state.running = false;
  state.awaitingDetailEnhancement = false;
  state.detailEnhancing = false;
  state.finalChecking = false;
  state.detailProgress = null;
  stopWatchdog();
  const suffix = checkedCount ? `\n自检发现 ${checkedCount} 个博主有空值，已各补采 1 次；剩余空值按最终结果保留。` : "\n自检未发现需要补采的空值。";
  setStatus(`${message || "采集完成"}\n已采集 ${state.records.length} 条。${state.stopRequested ? "" : suffix}${skippedMissingIdFinalText()}${databaseText}`);
  render();
}

async function runDetailEnhancement() {
  state.detailEnhancing = true;
  render();
  const delayMs = Math.max(1200, Number(els.delayMs.value || 1400));
  const records = [...state.records];
  const maxAttempts = 3;
  const failedRecords = [];

  for (let index = 0; index < records.length; index += 1) {
    if (state.stopRequested) break;
    const record = records[index];
    const userId = record.blogger_id;
    if (!userId) continue;

    let missing = [];
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (state.stopRequested) break;
      try {
        missing = await collectDetailWithQualityGate(record, index, records.length, attempt, maxAttempts, delayMs);
      } catch (error) {
        missing = [`详情页异常：${error && error.message ? error.message : String(error)}`];
        Object.assign(record, {
          detail_collect_status: "需复查",
          detail_retry_count: String(attempt - 1),
          detail_missing_fields: missing.join("|")
        });
      }
      if (!missing.length) break;
      if (attempt < maxAttempts) {
        setStatus(`“${record.nickname || userId}”详情采集缺失：${missing.join("、")}，准备重试。`);
        await sleep(Math.max(1800, delayMs));
      }
    }

    if (missing.length) failedRecords.push(record);
    await appendRecordsToDatabase([record], { countTowardsBatch: false });
    await sleep(Math.max(1200, Math.round(delayMs * (0.8 + Math.random() * 0.9))));
  }

  state.detailEnhancing = false;
  const failedText = failedRecords.length ? `\n${failedRecords.length} 条未通过完整校验，已在 CSV 的“增强采集状态/缺失项”标出。` : "";
  await finishCollection(`${state.stopRequested ? "已停止" : "增强采集完成"}${failedText}`);
}

function collectorSource(options) {
  return `
(() => {
  if (window.__pgyDesktopCollectorRunning) {
    window.postMessage({ source: "pgy-desktop-collector", type: "status", message: "已有采集任务正在运行" }, "*");
    return;
  }

  window.__pgyDesktopCollectorRunning = true;
  window.__pgyDesktopStopRequested = false;

  const options = ${JSON.stringify(options)};
  const DETAIL_RE = /\\/solar\\/pre-trade\\/blogger-detail\\/([^/?#]+)/;
  const capturedDetailUrls = [];

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const post = payload => window.postMessage({ source: "pgy-desktop-collector", ...payload }, "*");
  const postRecords = payload => {
    const records = Array.isArray(payload.records) ? payload.records : [];
    post({ ...payload, records: undefined, recordsJson: JSON.stringify(records), recordCount: records.length });
  };
  const textOf = node => (node && node.textContent ? node.textContent : "").replace(/\\s+/g, " ").trim();
  const isVisible = el => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  };
  const compactMetric = value => {
    const text = String(value || "").replace(/\\s+/g, "").replace(/[，,]/g, "").trim();
    return text === "--" ? "" : text;
  };
  const normalizeFansCount = value => {
    const text = compactMetric(value).toLowerCase();
    if (!text) return "";
    const match = text.match(/^(\\d+(?:\\.\\d+)?)(w|万)?$/i);
    if (!match) return text;
    const number = Number(match[1]);
    if (!Number.isFinite(number)) return text;
    return String(match[2] ? Math.round(number * 10000) : Math.round(number));
  };
  const compactPrice = value => compactMetric(value).replace(/[¥￥]/g, "").replace(/起$/, "").trim();
  const priceAfterLabel = (text, label) => {
    const escaped = label.replace(/[.*+?^${"{}"}()|[\\]\\\\]/g, "\\\\$&");
    const match = String(text || "").match(new RegExp(escaped + "\\\\s*[¥￥]?\\\\s*([\\\\d,]+)", "i"));
    return match ? compactPrice(match[1]) : "";
  };
  const splitProvinceCity = locationText => {
    const parts = String(locationText || "").replace(/\\s+/g, " ").trim().split(" ").filter(Boolean);
    return { province: parts[0] || "", city: parts.length > 1 ? parts[1] : "" };
  };
  const nowText = () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  };
  const humanPause = async (base = options.delayMs) => {
    const jitter = Math.round(base * (0.45 + Math.random() * 0.75));
    await sleep(Math.max(900, jitter));
  };
  const cleanValue = value => {
    if (value == null) return "";
    if (Array.isArray(value)) return value.map(cleanValue).filter(Boolean).join("|");
    if (typeof value === "object") {
      return cleanValue(value.name || value.label || value.title || value.value || value.tagName || value.text || "");
    }
    return String(value).replace(/\\s+/g, " ").trim();
  };
  const normalizePercent = value => {
    if (value == null || value === "") return "";
    if (typeof value === "string" && /%$/.test(value.trim())) return value.trim();
    const number = Number(value);
    if (!Number.isFinite(number)) return cleanValue(value);
    if (Math.abs(number) <= 1) return (number * 100).toFixed(2).replace(/\\.00$/, "") + "%";
    return number.toFixed(2).replace(/\\.00$/, "") + "%";
  };
  const unwrapData = json => {
    if (!json || typeof json !== "object") return json;
    if (json.data && typeof json.data === "object") return json.data;
    if (json.result && typeof json.result === "object") return json.result;
    return json;
  };
  async function fetchJson(path) {
    try {
      const response = await fetch(path, {
        credentials: "include",
        headers: {
          accept: "application/json, text/plain, */*"
        }
      });
      if (response.status === 401 || response.status === 403) {
        throw new Error("详情数据读取被限制，请暂停后检查登录或验证码");
      }
      if (!response.ok) return null;
      return unwrapData(await response.json());
    } catch (error) {
      post({ type: "status", message: "详情接口读取失败：" + (error && error.message ? error.message : String(error)) });
      return null;
    }
  }
  function valueAt(object, path) {
    const parts = String(path).split(".");
    let current = object;
    for (const part of parts) {
      if (current == null) return "";
      current = current[part];
    }
    return current == null ? "" : current;
  }
  function firstPath(object, paths) {
    for (const path of paths) {
      const value = valueAt(object, path);
      if (value !== "" && value != null) return value;
    }
    return "";
  }
  function deepFind(object, matchers, seen = new WeakSet(), depth = 0) {
    if (!object || typeof object !== "object" || depth > 6 || seen.has(object)) return "";
    seen.add(object);
    const entries = Array.isArray(object) ? object.map((item, index) => [String(index), item]) : Object.entries(object);
    for (const [key, value] of entries) {
      if (matchers.some(matcher => matcher.test(key)) && value != null && typeof value !== "object") return value;
      const nested = deepFind(value, matchers, seen, depth + 1);
      if (nested !== "" && nested != null) return nested;
    }
    return "";
  }
  function findArray(object, matchers, seen = new WeakSet(), depth = 0) {
    if (!object || typeof object !== "object" || depth > 6 || seen.has(object)) return [];
    seen.add(object);
    const entries = Array.isArray(object) ? object.map((item, index) => [String(index), item]) : Object.entries(object);
    for (const [key, value] of entries) {
      if (Array.isArray(value) && matchers.some(matcher => matcher.test(key))) return value;
      const nested = findArray(value, matchers, seen, depth + 1);
      if (nested.length) return nested;
    }
    return [];
  }
  function namesFrom(value, limit = 8) {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return list.map(item => cleanValue(item)).filter(Boolean).slice(0, limit).join("|");
  }
  function topItemsFrom(value, limit = 3) {
    const list = Array.isArray(value) ? value : [];
    return list
      .map(item => {
        if (!item || typeof item !== "object") return cleanValue(item);
        const name = cleanValue(item.name || item.label || item.group || item.city || item.province || item.interest || item.device || item.age || item.tagName || item.value);
        const rate = item.rate ?? item.ratio ?? item.percent ?? item.valueRate ?? item.userRate ?? "";
        return name ? name + (rate !== "" && typeof rate !== "string" ? "(" + normalizePercent(rate) + ")" : "") : "";
      })
      .filter(Boolean)
      .slice(0, limit)
      .join("|");
  }
  const AGE_BUCKETS = [
    ["fans_age_under_18", "<18"],
    ["fans_age_18_24", "18-24"],
    ["fans_age_25_34", "25-34"],
    ["fans_age_35_44", "35-44"],
    ["fans_age_over_44", ">44"]
  ];
  function ageBucketName(value) {
    const text = cleanValue(value).replace(/\\s+/g, "");
    if (!text) return "";
    if (/^(<18|18岁?以下|小于18|0-17|17岁?以下)/i.test(text)) return "<18";
    if (/18[-~至到]?24/.test(text)) return "18-24";
    if (/25[-~至到]?34/.test(text)) return "25-34";
    if (/35[-~至到]?44/.test(text)) return "35-44";
    if (/^(>44|44岁?以上|大于44|45岁?以上|45\\+)/i.test(text)) return ">44";
    return "";
  }
  function rateFromAgeItem(item) {
    if (!item || typeof item !== "object") {
      const match = cleanValue(item).match(/\\(([^)]+)\\)/);
      return match ? normalizePercent(match[1]) : "";
    }
    const value = item.rate ?? item.ratio ?? item.percent ?? item.valueRate ?? item.userRate ?? item.valuePercent ?? item.proportion ?? "";
    if (value !== "" && value != null && typeof value !== "object") return normalizePercent(value);
    const text = cleanValue(item.name || item.label || item.group || item.age || item.tagName || item.value || "");
    const match = text.match(/\\(([^)]+)\\)/);
    return match ? normalizePercent(match[1]) : "";
  }
  function ageDistributionFields(value) {
    const list = Array.isArray(value) ? value : [];
    const byBucket = Object.fromEntries(AGE_BUCKETS.map(([, label]) => [label, ""]));
    for (const item of list) {
      const name = item && typeof item === "object"
        ? cleanValue(item.name || item.label || item.group || item.age || item.tagName || item.value || "")
        : cleanValue(item);
      const bucket = ageBucketName(name);
      const rate = rateFromAgeItem(item);
      if (bucket && rate) byBucket[bucket] = rate;
    }
    const fields = { fans_age_distribution: AGE_BUCKETS.map(([, label]) => label + "：" + (byBucket[label] || "-")).join("|") };
    for (const [key, label] of AGE_BUCKETS) fields[key] = byBucket[label] || "";
    return fields;
  }
  function formatNoteDate(value) {
    const text = cleanValue(value);
    if (!text) return "";
    const pad = n => String(n).padStart(2, "0");
    const fromDate = date => date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
    if (/^\\d{13}$/.test(text)) return fromDate(new Date(Number(text)));
    if (/^\\d{10}$/.test(text)) return fromDate(new Date(Number(text) * 1000));
    const match = text.match(/\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2}/);
    return match ? match[0].replace(/[/.]/g, "-") : text;
  }
  function noteBrandName(note) {
    if (!note || typeof note !== "object") return "";
    return cleanValue(firstMetric(note, [
      "brandName",
      "brand_name",
      "brand.name",
      "brandInfo.brandName",
      "brandInfo.name",
      "brandUserName",
      "cooperateBrandName",
      "recruitSummary.brandName"
    ], [/brand.*name/i, /品牌.*名/]));
  }
  function notePublishTime(note) {
    if (!note || typeof note !== "object") return "";
    return formatNoteDate(firstMetric(note, [
      "release",
      "releaseTime",
      "publishTime",
      "postTime",
      "createTime",
      "notePublishTime",
      "noteReleaseTime"
    ], [/release/i, /publish.*time/i, /post.*time/i, /发布时间/]));
  }
  function recentCoopBrandNotes(notes, limit = 20) {
    const seen = new Set();
    const items = [];
    for (const note of Array.isArray(notes) ? notes : []) {
      const brand = noteBrandName(note);
      if (!brand) continue;
      const date = notePublishTime(note);
      const text = date ? brand + "（" + date + "）" : brand;
      if (seen.has(text)) continue;
      seen.add(text);
      items.push(text);
      if (items.length >= limit) break;
    }
    return items.join("|");
  }
  function genderText(value) {
    const text = cleanValue(value);
    if (!text) return "";
    if (text === "1") return "男";
    if (text === "2") return "女";
    return text;
  }
  function firstMetric(object, paths, keyMatchers = []) {
    const value = firstPath(object, paths);
    if (value !== "" && value != null) return cleanValue(value);
    const found = deepFind(object, keyMatchers);
    return cleanValue(found);
  }
  function numberText(value) {
    const text = cleanValue(value);
    if (!text) return "";
    const number = Number(text);
    return Number.isFinite(number) ? String(number) : "";
  }
  function splitLocationParts(value) {
    return String(value || "").replace(/\\s+/g, " ").trim().split(" ").filter(Boolean);
  }
  function taxonomyTags(list, level) {
    const source = Array.isArray(list) ? list : [];
    const values = [];
    for (const item of source) {
      if (!item || typeof item !== "object") {
        const text = cleanValue(item);
        if (text) values.push(text);
        continue;
      }
      if (level === 1) {
        const text = cleanValue(item.taxonomy1Tag || item.name || item.label);
        if (text) values.push(text);
      } else {
        const nested = item.taxonomy2Tags || item.children || item.subTags || [];
        for (const child of Array.isArray(nested) ? nested : [nested]) {
          const text = cleanValue(child);
          if (text) values.push(text);
        }
      }
    }
    return Array.from(new Set(values)).join("|");
  }
  function listFromData(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.list || data.notes || data.items || data.dataList || data.kols || data.similarKols || data.noteList || [];
  }
  function getFemaleRate(profile) {
    const direct = valueAt(profile, "gender.female");
    if (direct !== "" && direct != null) return normalizePercent(direct);
    const genderList = findArray(profile, [/gender|sex/i]);
    const female = genderList.find(item => /女|female/i.test(cleanValue(item)));
    if (female && typeof female === "object") return normalizePercent(female.rate ?? female.ratio ?? female.percent ?? female.valueRate ?? female.userRate ?? "");
    return normalizePercent(firstMetric(profile, ["femaleRate", "femaleUserRate", "womanRate"], [/female.*rate/i, /woman.*rate/i]));
  }
  function tagsFromData(...sources) {
    for (const source of sources) {
      if (!source) continue;
      const direct = namesFrom(source, 12);
      if (direct) return direct;
      const list = listFromData(source);
      const names = namesFrom(list, 12);
      if (names) return names;
    }
    return "";
  }
  function noteListFromData(data) {
    const list = listFromData(data);
    return Array.isArray(list) ? list : [];
  }
  function similarListFromData(data) {
    const list = listFromData(data);
    return Array.isArray(list) ? list : [];
  }
  async function fetchEnhancedData(userId) {
    const id = encodeURIComponent(userId);
    const profile = await fetchJson("/api/solar/cooperator/user/blogger/" + id);
    await humanPause(420);
    const contentTags = await fetchJson("/api/solar/kol/data_v2/kol_content_tags?userId=" + id);
    await humanPause(360);
    const featureTags = await fetchJson("/api/solar/kol/data_v2/kol_feature_tags?userId=" + id);
    await humanPause(360);
    const fansProfile = await fetchJson("/api/solar/kol/data/" + id + "/fans_profile");
    await humanPause(420);
    const notesDetail = await fetchJson("/api/solar/kol/data_v2/notes_detail?advertiseSwitch=1&orderType=1&pageNumber=1&pageSize=8&userId=" + id + "&noteType=4&isThirdPlatform=0");
    await humanPause(420);
    const similar = await fetchJson("/api/solar/kol/get_similar_kol?userId=" + id + "&pageNum=1&pageSize=4");

    const notes = noteListFromData(notesDetail);
    const similarKols = similarListFromData(similar);
    const contentTagList = firstPath(profile, ["contentTags"]) || listFromData(contentTags);
    const noteCount = numberText(firstPath(profile, ["totalNoteCount"]));
    const videoCount = "";
    const imageCount = "";
    const adCount = "";
    const mcnText = cleanValue(firstPath(profile, ["mcnName"]) || firstPath(profile, ["agencyName"]) || firstPath(profile, ["organizationName"])) || "无机构";
    const provinceList = firstPath(fansProfile, ["provinces"]) || findArray(fansProfile, [/province/i, /省/]);
    const cityList = firstPath(fansProfile, ["cities"]) || findArray(fansProfile, [/citi|city/i, /城市/]);
    const ageList = findArray(fansProfile, [/age/i, /年龄/]);
    const interestList = firstPath(fansProfile, ["interests"]) || findArray(fansProfile, [/interest/i, /兴趣/]);
    const deviceList = firstPath(fansProfile, ["devices"]) || findArray(fansProfile, [/device|phone|brand/i, /设备/]);

    return {
      red_id: cleanValue(firstMetric(profile, ["redId", "red_id", "redID", "user.redId", "userInfo.redId"], [/red.*id/i, /xhs.*id/i])),
      gender: genderText(firstMetric(profile, ["gender", "sex", "user.gender", "userInfo.gender"], [/gender|sex/i])),
      mcn_status: mcnText,
      like_collect_count: cleanValue(firstMetric(profile, ["likeCollectCountInfo", "likeCollectCount", "likedCollectCount", "likeAndCollectCount", "likedAndCollectedCount"], [/^like.*collect/i, /^liked.*collect/i])),
      business_note_count: cleanValue(firstMetric(profile, ["businessNoteCount", "cooperateNoteCount", "commercialNoteCount"], [/business.*note/i, /cooperate.*note/i, /commercial.*note/i])),
      content_tags: taxonomyTags(contentTagList, 1) || tagsFromData(contentTags, firstPath(profile, ["contentTags", "contentTagList", "tags"])),
      sub_content_tags: taxonomyTags(contentTagList, 2) || tagsFromData(firstPath(profile, ["subContentTags", "subTagList", "secondTags"]), findArray(contentTags, [/sub|second|child/i])),
      feature_tags: tagsFromData(featureTags, firstPath(profile, ["featureTags", "featureTagList"])),
      current_level: cleanValue(firstMetric(profile, ["currentLevel", "level", "kolLevel"], [/current.*level/i, /kol.*level/i])),
      exposure_median: cleanValue(firstPath(profile, ["predictiveExposure"])) || "",
      like_median: "",
      collect_median: "",
      comment_median: "",
      share_median: "",
      follow_median: "",
      interaction_rate: "",
      video_finish_rate: normalizePercent(firstPath(profile, ["videoFinishRate"])),
      picture_3s_view_rate: "",
      hundred_like_percent: normalizePercent(firstPath(profile, ["hundredLikePercent30"]) || firstPath(profile, ["pictureHundredLikePercent30"]) || firstPath(profile, ["videoHundredLikePercent30"])),
      thousand_like_percent: normalizePercent(firstPath(profile, ["thousandLikePercent30"]) || firstPath(profile, ["pictureThousandLikePercent30"]) || firstPath(profile, ["videoThousandLikePercent30"])),
      fans_growth_num: cleanValue(firstPath(profile, ["fans30GrowthNum"])),
      fans_growth_rate: normalizePercent(firstPath(profile, ["fans30GrowthRate"])),
      active_fans_rate: "",
      read_fans_rate: "",
      engage_fans_rate: "",
      pay_fans_rate: "",
      fans_female_rate: getFemaleRate(fansProfile),
      ...ageDistributionFields(ageList),
      fans_top_provinces: topItemsFrom(provinceList, 3),
      fans_top_cities: topItemsFrom(cityList, 3),
      fans_top_interests: topItemsFrom(interestList, 5),
      fans_top_device: topItemsFrom(deviceList, 1),
      data_updated_at: cleanValue(firstMetric(fansProfile, ["dateKey", "date", "updateTime"], [/date.*key/i, /update.*time/i])) ||
        "",
      recent_note_count: noteCount,
      video_note_count: videoCount,
      image_note_count: imageCount,
      advertise_note_count: adCount,
      recent_coop_brand_notes: recentCoopBrandNotes(notes),
      recent_note_titles: notes.map(note => cleanValue(note.title || note.noteTitle || note.name)).filter(Boolean).slice(0, 10).join("|"),
      recent_note_ids: notes.map(note => cleanValue(note.noteId || note.id)).filter(Boolean).slice(0, 10).join("|"),
      similar_kol_ids: similarKols.map(kol => cleanValue(kol.userId || kol.kolUserId || kol.id)).filter(Boolean).slice(0, 10).join("|"),
      similar_kol_names: similarKols.map(kol => cleanValue(kol.nickName || kol.nickname || kol.name)).filter(Boolean).slice(0, 10).join("|")
    };
  }

  function captureDetailUrl(url, via) {
    if (!url || !DETAIL_RE.test(String(url))) return;
    capturedDetailUrls.push({
      url: new URL(String(url), location.href).href,
      via,
      at: Date.now()
    });
  }

  if (!window.__pgyDesktopCollectorHooked) {
    window.__pgyDesktopCollectorHooked = true;
    const originalOpen = window.open;
    window.open = function patchedOpen(url, target, features) {
      captureDetailUrl(url, "window.open");
      if (url && DETAIL_RE.test(String(url))) return null;
      return originalOpen.apply(this, arguments);
    };

    for (const method of ["pushState", "replaceState"]) {
      const original = history[method];
      history[method] = function patchedHistory(state, title, url) {
        if (url) captureDetailUrl(url, "history." + method);
        return original.apply(this, arguments);
      };
    }
  }

  function findBloggerIdInValue(value, options = {}) {
    const seen = options.seen || new WeakSet();
    const depth = options.depth || 0;
    const keyHint = String(options.keyHint || "");
    if (value == null || depth > 7) return "";
    if (typeof value === "string") {
      const detail = value.match(DETAIL_RE);
      if (detail) return decodeURIComponent(detail[1]).trim();
      const direct = value.match(/\\b[a-f0-9]{24}\\b/i) || value.match(/\\b\\d{6,20}\\b/);
      return direct && /(^|\\b)(userId|user_id|uid|kolUserId|bloggerId|blogger|kolId|authorId|cooperatorUserId|cooperateUserId)(\\b|$)/i.test(keyHint) ? direct[0] : "";
    }
    if (typeof value !== "object" || seen.has(value)) return "";
    seen.add(value);
    const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
    for (const [key, child] of entries) {
      if (typeof child === "function") continue;
      if (depth > 1 && /^(parent|children|el|vnode|subTree|appContext)$/.test(key)) continue;
      const nextHint = keyHint ? keyHint + "." + key : key;
      const found = findBloggerIdInValue(child, { seen, depth: depth + 1, keyHint: nextHint });
      if (found) return found;
    }
    return "";
  }

  function bloggerIdFromRow(row) {
    const href = row.querySelector("a[href*='/solar/pre-trade/blogger-detail/']")?.href || "";
    const hrefMatch = href.match(DETAIL_RE);
    if (hrefMatch) return decodeURIComponent(hrefMatch[1]).trim();

    const strongTargets = [
      row.querySelector(".kol-name"),
      row.querySelector(".kol-info"),
      row.querySelector(".kol-info_detail"),
      row.querySelector(".quote-wrapper"),
      row
    ].filter(Boolean);
    const roots = [...strongTargets, ...Array.from(row.querySelectorAll("*")).slice(0, 140)];

    for (const target of roots) {
      for (const attr of target.attributes || []) {
        const found = findBloggerIdInValue(attr.value, { keyHint: attr.name });
        if (found) return found;
      }
      for (const key of Object.keys(target)) {
        if (!/^(__react|__vue|__vnode|__fiber|_react|__INITIAL|__data)/i.test(key)) continue;
        const found = findBloggerIdInValue(target[key], { keyHint: key });
        if (found) return found;
      }
    }
    return "";
  }

  function extractBloggerIdFromUrl(url) {
    const match = String(url || "").match(DETAIL_RE);
    return match ? decodeURIComponent(match[1]).trim() : "";
  }

  function takeCapturedDetailUrl(startedAt) {
    const index = capturedDetailUrls.findIndex(item => item.at >= startedAt && extractBloggerIdFromUrl(item.url));
    if (index < 0) return null;
    const [item] = capturedDetailUrls.splice(index, 1);
    return item;
  }

  async function waitForDetailRoute(timeoutMs, startedAt) {
    const started = startedAt || Date.now();
    while (Date.now() - started < timeoutMs) {
      const captured = takeCapturedDetailUrl(started);
      if (captured) {
        return {
          id: extractBloggerIdFromUrl(captured.url),
          sameTab: /^history\./.test(captured.via || ""),
          url: captured.url
        };
      }

      const id = extractBloggerIdFromUrl(location.href);
      if (id) {
        return { id, sameTab: true, url: location.href };
      }
      await sleep(250);
    }
    return null;
  }

  async function waitForListRoute(timeoutMs, listUrl) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (!extractBloggerIdFromUrl(location.href)) return true;
      await sleep(250);
    }
    if (listUrl) location.assign(listUrl);
    return false;
  }

  function clickElement(el) {
    el.scrollIntoView({ block: "center", inline: "center" });
    const rect = el.getBoundingClientRect();
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    for (const type of ["pointerover", "mouseover", "mousemove", "pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      el.dispatchEvent(new MouseEvent(type, opts));
    }
  }

  function clickElementInPlace(el) {
    const target = el.closest(".d-grid-item, [role='menuitem'], a, button, [role='button']") || el;
    const rect = target.getBoundingClientRect();
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    for (const type of ["pointerover", "mouseover", "mousemove", "pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      target.dispatchEvent(new MouseEvent(type, opts));
    }
  }

  let trustedClickSeq = 0;

  function requestTrustedClickAt(x, y) {
    const requestId = "trusted-click-" + Date.now() + "-" + (++trustedClickSeq);
    return new Promise(resolve => {
      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", onMessage);
        resolve(Boolean(ok));
      };
      const onMessage = event => {
        const data = event && event.data;
        if (!data || data.source !== "pgy-desktop-host" || data.type !== "trusted-click-done" || data.requestId !== requestId) return;
        finish(data.ok);
      };
      window.addEventListener("message", onMessage);
      post({ type: "trusted-click-request", requestId, x, y });
      setTimeout(() => finish(false), 1600);
    });
  }

  async function trustedClickElementInPlace(el) {
    const target = el.closest(".d-grid-item, [role='menuitem'], a, button, [role='button']") || el;
    const rect = target.getBoundingClientRect();
    const ok = await requestTrustedClickAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (!ok) clickElementInPlace(target);
    return ok;
  }

  function findDetailTrigger(row) {
    return (
      row.querySelector(".kol-name") ||
      row.querySelector(".kol-info_detail") ||
      row.querySelector(".kol-info") ||
      row.querySelector("a[href*='/solar/pre-trade/blogger-detail/']") ||
      row.querySelector("[class*='name' i]")
    );
  }

  async function bloggerIdFromClick(row) {
    const trigger = findDetailTrigger(row);
    if (!trigger || !isVisible(trigger)) return "";

    const listUrl = location.href;
    const startedAt = Date.now() - 100;
    clickElement(trigger);
    const detail = await waitForDetailRoute(4500, startedAt);
    if (!detail || !detail.id) return "";

    if (detail.sameTab) {
      history.back();
      await waitForListRoute(6000, listUrl);
      await sleep(500);
    }
    if (extractBloggerIdFromUrl(location.href)) {
      await returnToList(listUrl);
    }
    return detail.id;
  }

  async function waitForDetailPage(userId, timeoutMs) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const currentId = extractBloggerIdFromUrl(location.href);
      if (currentId && (!userId || currentId === userId)) return true;
      await sleep(300);
    }
    return false;
  }

  async function returnToList(listUrl) {
    if (!extractBloggerIdFromUrl(location.href)) return true;
    history.back();
    const ready = await waitForListRoute(7000, listUrl);
    await humanPause(900);
    return ready;
  }

  async function enhancedDataFromRow(row, fallbackId, pageNo, itemNo) {
    const trigger = findDetailTrigger(row);
    if (!trigger || !isVisible(trigger)) return { id: fallbackId || "", data: {} };

    const listUrl = location.href;
    const startedAt = Date.now() - 100;
    clickElement(trigger);
    let detail = await waitForDetailRoute(6500, startedAt);

    if (!detail && fallbackId) {
      detail = { id: fallbackId, sameTab: false, url: "" };
    }

    const id = (detail && detail.id) || fallbackId || extractBloggerIdFromUrl(location.href);
    if (!id) return { id: "", data: {} };

    post({ type: "status", pageNo, message: "已触发详情入口，正在采集第 " + pageNo + " 页的第 " + itemNo + " 个博主，慢速读取增强字段中。" });
    await humanPause(Math.max(1600, options.delayMs));
    const data = await fetchEnhancedData(id);
    await humanPause(900);
    if (detail.sameTab) await returnToList(listUrl);
    return { id, data: data || {} };
  }

  function getRows() {
    return Array.from(document.querySelectorAll(".blogger-list_list table tbody tr, table tbody tr"))
      .filter(isVisible)
      .filter(row => textOf(row).length > 10);
  }

  function getScrollContainer() {
    const candidates = [
      document.querySelector(".solar_body"),
      document.querySelector(".blogger-list_list"),
      document.querySelector(".d-table-body"),
      document.querySelector(".d-table__body"),
      document.scrollingElement,
      document.documentElement
    ].filter(Boolean);

    return candidates.find(el => {
      if (!el) return false;
      return el.scrollHeight && el.clientHeight && el.scrollHeight > el.clientHeight + 20;
    }) || document.scrollingElement || document.documentElement;
  }

  async function scrollListTop() {
    const list = document.querySelector(".blogger-list_list");
    if (list) list.scrollIntoView({ block: "start", inline: "nearest" });
    const scroller = getScrollContainer();
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo(0, 0);
    await sleep(600);
  }

  async function scrollListStep(step) {
    const scroller = getScrollContainer();
    if (scroller) {
      scroller.scrollTop = Math.min(scroller.scrollHeight, scroller.scrollTop + step);
      scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
    } else {
      window.scrollBy(0, step);
    }
    await sleep(700);
  }

  async function scrollListBottom() {
    const scroller = getScrollContainer();
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
      scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
    } else {
      window.scrollTo(0, document.documentElement.scrollHeight);
    }
    await sleep(800);
  }

  function getHeaders(row) {
    const table = row.closest("table");
    return table ? Array.from(table.querySelectorAll("thead th")).map(textOf) : [];
  }

  function textByHeader(row, matcher) {
    const headers = getHeaders(row);
    const cells = Array.from(row.children);
    const index = headers.findIndex(header => matcher.test(header));
    return index >= 0 && cells[index] ? textOf(cells[index]) : "";
  }

  function parseQuoteText(text) {
    return {
      image_note_price: priceAfterLabel(text, "图文笔记一口价"),
      video_note_price: priceAfterLabel(text, "视频笔记一口价")
    };
  }

  function quoteText() {
    const popovers = Array.from(document.querySelectorAll(".d-popover, .quote-detail"))
      .filter(isVisible)
      .map(textOf)
      .filter(text => /图文笔记一口价|视频笔记一口价/.test(text));
    return popovers[popovers.length - 1] || "";
  }

  async function hoverQuote(row) {
    const trigger = row.querySelector(".quote-wrapper [style*='cursor']") || row.querySelector(".quote-wrapper .kol-quote") || row.querySelector(".quote-wrapper");
    if (!trigger || !isVisible(trigger)) return {};
    trigger.scrollIntoView({ block: "center", inline: "center" });
    await sleep(120);
    const rect = trigger.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    for (const type of ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove"]) trigger.dispatchEvent(new MouseEvent(type, opts));
    await sleep(450);
    const prices = parseQuoteText(quoteText());
    for (const type of ["mouseleave", "mouseout", "pointerleave", "pointerout"]) trigger.dispatchEvent(new MouseEvent(type, opts));
    return prices;
  }

  async function recordFromRow(row, pageNo, index) {
    const nicknameEl = row.querySelector(".kol-name") || row.querySelector("[class*='name' i]");
    const nickname = textOf(nicknameEl).slice(0, 40);
    const locationEl = row.querySelector(".kol-location span:last-child") || row.querySelector(".kol-location");
    const location = splitProvinceCity(textOf(locationEl));
    const tags = Array.from(row.querySelectorAll(".tag-wrap .kol-tag-item"))
      .map(textOf)
      .filter(Boolean)
      .filter(text => !/^\\d+\\+$/.test(text))
      .join("|");
    const hoverPrices = await hoverQuote(row);
    let id = bloggerIdFromRow(row);
    if (!id || options.forceClickId) id = await bloggerIdFromClick(row);
    let enhanced = {};
    if (options.enhancedMode) {
      post({ type: "status", pageNo, message: "增强采集：准备进入“" + (nickname || "当前博主") + "”详情页" });
      const detailResult = await enhancedDataFromRow(row, id, pageNo, index + 1);
      id = detailResult.id || id;
      enhanced = detailResult.data || {};
    } else {
      id = id || await bloggerIdFromClick(row);
    }

    return {
      nickname,
      blogger_id: id,
      blogger_url: id ? "https://www.xiaohongshu.com/user/profile/" + id : "",
      province: location.province,
      city: location.city,
      tags,
      fans_count: normalizeFansCount(textByHeader(row, /粉丝数|粉丝量/)),
      read_median: compactMetric(textByHeader(row, /阅读中位数/)),
      interaction_median: compactMetric(textByHeader(row, /互动中位数/)),
      image_note_price: hoverPrices.image_note_price || compactPrice(textByHeader(row, /图文.*(一口价|报价)|图文笔记/)),
      video_note_price: hoverPrices.video_note_price || compactPrice(textByHeader(row, /视频.*(一口价|报价)|视频笔记/)),
      page_no: pageNo,
      rank_in_page: index + 1,
      collected_at: nowText(),
      ...enhanced
    };
  }

  async function waitForRows(timeoutMs) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const rows = getRows();
      if (rows.length) return rows;
      await sleep(500);
    }
    return [];
  }

  function paginationState() {
    const current = currentPageNumber();
    if (current) return String(current);
    const selectors = [
      ".ant-pagination-item-active",
      ".semi-page-item-active",
      "[aria-current='page']",
      "li[class*='active' i]",
      "button[class*='active' i]"
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isVisible(el)) {
        const text = textOf(el) || el.getAttribute("title") || el.getAttribute("aria-label") || "";
        if (text) return text;
      }
    }
    return "";
  }

  function paginationPageText(el) {
    if (!el) return "";
    const content = el.querySelector(".d-pagination-page-content");
    if (content) return textOf(content);
    const text = textOf(el);
    const numeric = text.match(/^\\d+$/);
    if (numeric) {
      const half = text.length / 2;
      if (Number.isInteger(half) && text.slice(0, half) === text.slice(half)) return text.slice(0, half);
      return text;
    }
    return text;
  }

  function currentPageNumber() {
    const selectors = [
      ".d-pagination-page.--color-bg-primary-light",
      ".ant-pagination-item-active",
      ".semi-page-item-active",
      "[aria-current='page']"
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (!el || !isVisible(el)) continue;
      const number = Number(paginationPageText(el));
      if (Number.isFinite(number) && number > 0) return number;
    }
    return 0;
  }

  async function waitForPageReady(previousSignature, previousPageState, previousUrl, targetPage, timeoutMs) {
    const started = Date.now();
    let round = 0;

    while (Date.now() - started < timeoutMs) {
      const rows = getRows();
      const signature = listSignature();
      const pageState = paginationState();
      const currentPage = currentPageNumber();
      const reachedTarget = targetPage && currentPage === targetPage;
      const pageChanged = pageState && previousPageState && pageState !== previousPageState;
      const urlChanged = previousUrl && location.href !== previousUrl;
      const listChanged = signature && previousSignature && signature !== previousSignature;
      if (rows.length && (reachedTarget || pageChanged || urlChanged || listChanged)) return true;

      round += 1;
      post({ type: "status", pageNo: targetPage || "", message: "等待第 " + (targetPage || "下一") + " 页列表加载，第 " + round + " 次重试" });
      if (round % 3 === 1) await scrollListTop();
      else await scrollListStep(Math.max(360, Math.floor(window.innerHeight * 0.6)));
      await sleep(500);
    }

    return false;
  }

  function rowKey(row) {
    const id = bloggerIdFromRow(row);
    if (id) return "id:" + id;
    const nickname = textOf(row.querySelector(".kol-name") || row.querySelector("[class*='name' i]"));
    const location = textOf(row.querySelector(".kol-location span:last-child") || row.querySelector(".kol-location"));
    const metrics = [
      textByHeader(row, /粉丝数|粉丝量/),
      textByHeader(row, /阅读中位数/),
      textByHeader(row, /互动中位数/)
    ].join("|");
    return "text:" + [nickname, location, metrics].join("|");
  }

  async function collectCurrentPageRecords(pageNo) {
    const records = [];
    const processed = new Set();
    let missingIdCount = 0;
    let visibleRows = 0;
    let staleRounds = 0;

    await scrollListTop();

    while (!window.__pgyDesktopStopRequested && records.length < options.maxItems && staleRounds < 5) {
      const rows = getRows();
      visibleRows = Math.max(visibleRows, rows.length);
      let addedThisRound = 0;

      for (const row of rows) {
        if (window.__pgyDesktopStopRequested || records.length >= options.maxItems) break;
        const key = rowKey(row);
        if (processed.has(key)) continue;
        processed.add(key);

        post({ type: "status", pageNo, message: "正在读取第 " + pageNo + " 页第 " + (records.length + 1) + " 个" });
        const record = await recordFromRow(row, pageNo, records.length);
        if (!record.blogger_id) missingIdCount += 1;
        records.push(record);
        addedThisRound += 1;
        if (options.enhancedMode) {
          postRecords({ type: "records", pageNo, records: [record], visibleRows, missingIdCount: record.blogger_id ? 0 : 1 });
          break;
        }
      }

      if (records.length >= options.maxItems) break;
      if (addedThisRound === 0) staleRounds += 1;
      else staleRounds = 0;

      post({ type: "status", pageNo, message: "第 " + pageNo + " 页已读取 " + records.length + " 条，继续滚动查找" });
      if (options.enhancedMode && addedThisRound > 0) {
        await humanPause(700);
        continue;
      }
      await scrollListStep(Math.max(420, Math.floor(window.innerHeight * 0.72)));
    }

    return { records, visibleRows, missingIdCount };
  }

  function listSignature() {
    return getRows().slice(0, 20).map(row => textOf(row).slice(0, 80)).join("|");
  }

  function isDisabledButton(el) {
    if (!el) return true;
    const classText = String(el.className || "");
    return el.disabled ||
      /disabled|disable|inactive/.test(classText) ||
      el.getAttribute("aria-disabled") === "true" ||
      el.closest("[aria-disabled='true'], .disabled, .ant-pagination-disabled, .semi-page-item-disabled");
  }

  function findPageButton(pageNo) {
    const target = String(pageNo);
    const candidates = Array.from(document.querySelectorAll(".d-pagination-page, .ant-pagination-item, .semi-page-item, button, a, li"))
      .filter(isVisible)
      .filter(el => !isDisabledButton(el));
    return candidates.find(el => paginationPageText(el) === target) || null;
  }

  function findNextButton() {
    const dPages = Array.from(document.querySelectorAll(".d-pagination .d-pagination-page"))
      .filter(isVisible)
      .filter(el => !isDisabledButton(el));
    const dNext = dPages.length ? dPages[dPages.length - 1] : null;
    if (dNext && !paginationPageText(dNext)) return dNext;

    const selectors = [".ant-pagination-next", ".semi-page-next", ".next", "button[aria-label*='下一页']", "button[title*='下一页']", "li[title*='下一页']", "a[aria-label*='下一页']"];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isVisible(el) && !isDisabledButton(el)) return el.querySelector("button,a") || el;
    }
    return Array.from(document.querySelectorAll("button, a, li"))
      .filter(isVisible)
      .find(el => !isDisabledButton(el) && /下一页|Next|›|>/.test((el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "") + " " + textOf(el))) || null;
  }

  async function goToPageNode(targetPage, previousSignature, previousPageState, previousUrl) {
    await scrollListBottom();
    const pageButton = findPageButton(targetPage);
    if (pageButton) {
      post({ type: "status", pageNo: targetPage - 1, message: "第 " + (targetPage - 1) + " 页完成，正在切换到第 " + targetPage + " 页" });
      pageButton.scrollIntoView({ block: "center", inline: "center" });
      await sleep(250);
      clickElement(pageButton);
      return waitForPageReady(previousSignature, previousPageState, previousUrl, targetPage, Math.max(20000, options.delayMs * 14));
    }

    const next = findNextButton();
    if (!next) return false;
    post({ type: "status", pageNo: targetPage - 1, message: "第 " + (targetPage - 1) + " 页完成，正在点击下一页" });
    next.scrollIntoView({ block: "center", inline: "center" });
    await sleep(250);
    clickElement(next);
    return waitForPageReady(previousSignature, previousPageState, previousUrl, targetPage, Math.max(20000, options.delayMs * 14));
  }

  function setInputValue(input, value) {
    const proto = Object.getPrototypeOf(input);
    const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
    if (descriptor && descriptor.set) descriptor.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function findSearchInput() {
    const inputs = Array.from(document.querySelectorAll("input"))
      .filter(isVisible)
      .filter(input => !input.disabled && input.type !== "hidden");
    return inputs.find(input => /搜索|博主|昵称|小红书号/.test(input.placeholder || input.getAttribute("aria-label") || "")) ||
      inputs.find(input => /search|text/.test(input.type || "text")) ||
      inputs[0] ||
      null;
  }

  function findSearchButton(input) {
    const buttons = Array.from(document.querySelectorAll("button, .d-button, [role='button']"))
      .filter(isVisible)
      .filter(el => !isDisabledButton(el));
    const textButton = buttons.find(el => /^搜索$|查询/.test(textOf(el)));
    if (textButton) return textButton;
    if (input) {
      const wrapper = input.closest("form, .d-input-group, .search, [class*='search' i], [class*='filter' i]");
      const localButton = wrapper ? Array.from(wrapper.querySelectorAll("button, .d-button, [role='button']")).filter(isVisible).find(el => !isDisabledButton(el)) : null;
      if (localButton) return localButton;
    }
    return null;
  }

  async function searchNickname(keyword) {
    const input = findSearchInput();
    if (!input) {
      post({ type: "error", message: "没有找到昵称搜索框，请确认当前在找博主页面" });
      return false;
    }

    const previousSignature = listSignature();
    input.scrollIntoView({ block: "center", inline: "center" });
    input.focus();
    setInputValue(input, "");
    await sleep(120);
    setInputValue(input, keyword);
    await sleep(180);

    const button = findSearchButton(input);
    if (button) clickElement(button);
    else input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter", code: "Enter" }));

    const started = Date.now();
    while (Date.now() - started < Math.max(18000, options.delayMs * 10)) {
      const rows = getRows();
      const signature = listSignature();
      if (rows.length && (signature !== previousSignature || rows.some(row => textOf(row).includes(keyword)))) return true;
      await sleep(500);
    }
    return getRows().length > 0;
  }

  async function ensureSearchPageReady(pageNo) {
    if (findSearchInput()) return true;
    const targetUrl = options.startUrl || location.origin + "/solar/pre-trade/note/kol";
    post({ type: "status", pageNo, message: "正在回到找博主页面，准备处理下一个昵称" });
    location.assign(targetUrl);
    const started = Date.now();
    while (Date.now() - started < Math.max(18000, options.delayMs * 10)) {
      if (findSearchInput()) return true;
      await sleep(500);
    }
    return Boolean(findSearchInput());
  }

  function rowNickname(row) {
    return textOf(row.querySelector(".kol-name") || row.querySelector("[class*='name' i]")).slice(0, 80);
  }

  async function findBestSearchRow(keyword, pageNo) {
    post({ type: "status", pageNo, message: "正在搜索博主昵称：“" + keyword + "”" });
    const searched = await searchNickname(keyword);
    if (!searched) return null;
    const rows = await waitForRows(Math.max(9000, options.delayMs * 6));
    if (!rows.length) return null;
    const exact = rows.find(row => rowNickname(row) === keyword);
    const contains = rows.find(row => rowNickname(row).includes(keyword) || keyword.includes(rowNickname(row)));
    return exact || contains || rows[0];
  }

  async function collectBestSearchResult(keyword, pageNo) {
    const row = await findBestSearchRow(keyword, pageNo);
    if (!row) return null;
    return recordFromRow(row, pageNo, 0);
  }

  function numberLike(value) {
    const text = cleanValue(value);
    if (!text) return "";
    return normalizeFansCount(text);
  }

  function locationFromKol(kol) {
    const locationText = cleanValue(kol.location || kol.ipLocation || kol.areaName || kol.cityName || kol.provinceName || "");
    if (locationText) return splitProvinceCity(locationText);
    return {
      province: cleanValue(kol.province || kol.provinceName),
      city: cleanValue(kol.city || kol.cityName)
    };
  }

  function similarRecordFromKol(kol, sourceNickname, pageNo, index) {
    const id = cleanValue(kol.userId || kol.kolUserId || kol.id || kol.bloggerId || kol.cooperatorUserId);
    const location = locationFromKol(kol);
    const imagePrice = firstMetric(kol, ["picturePrice", "imagePrice", "pictureNotePrice", "imageNotePrice", "priceInfo.picturePrice"], [/picture.*price/i, /image.*price/i, /图文.*价/]);
    const videoPrice = firstMetric(kol, ["videoPrice", "videoNotePrice", "priceInfo.videoPrice"], [/video.*price/i, /视频.*价/]);
    return {
      nickname: cleanValue(kol.nickName || kol.nickname || kol.name),
      blogger_id: id,
      blogger_url: id ? "https://www.xiaohongshu.com/user/profile/" + id : "",
      province: location.province,
      city: location.city,
      tags: namesFrom(kol.tags || kol.contentTags || kol.tagList || kol.featureTags, 12),
      fans_count: numberLike(kol.fansCount || kol.fansNum || kol.followerCount || kol.fansCountInfo),
      read_median: compactMetric(kol.readMedian || kol.readMedianNum || kol.mReadCnt),
      interaction_median: compactMetric(kol.interactionMedian || kol.mEngagementNum || kol.mengagementNum),
      image_note_price: compactPrice(imagePrice),
      video_note_price: compactPrice(videoPrice),
      page_no: pageNo,
      rank_in_page: index + 1,
      collected_at: nowText()
    };
  }

  async function runNicknameSearchMode() {
    const nicknames = Array.isArray(options.nicknames) ? options.nicknames : [];
    for (let index = 0; index < nicknames.length; index += 1) {
      if (window.__pgyDesktopStopRequested) break;
      await ensureSearchPageReady(index + 1);
      const nickname = nicknames[index];
      const record = await collectBestSearchResult(nickname, index + 1);
      if (record) {
        postRecords({ type: "records", pageNo: index + 1, records: [record], visibleRows: getRows().length, missingIdCount: record.blogger_id ? 0 : 1 });
      } else {
        post({ type: "status", pageNo: index + 1, message: "没有找到“" + nickname + "”，已跳过" });
      }
      await humanPause(Math.max(1200, options.delayMs));
    }
    post({ type: "done", message: "昵称批量采集结束" });
  }

  function findVisibleMenuItem(label) {
    const candidates = Array.from(document.querySelectorAll(".d-popover, .d-dropdown, [role='menu'], [class*='popover' i], [class*='dropdown' i], body *"))
      .filter(isVisible);
    return candidates
      .filter(el => textOf(el).includes(label))
      .sort((a, b) => textOf(a).length - textOf(b).length)[0] || null;
  }

  function findMoreAction(row) {
    const lastCell = row && row.children && row.children.length ? row.children[row.children.length - 1] : row;
    const roots = [lastCell, row].filter(Boolean);
    for (const root of roots) {
      const candidates = Array.from(root.querySelectorAll("button, a, span, div, [role='button']"))
        .filter(isVisible)
        .filter(el => /更多操作|更多|···|\.{3}|…/.test(textOf(el) || el.getAttribute("aria-label") || el.getAttribute("title") || ""));
      if (candidates.length) return candidates.sort((a, b) => textOf(a).length - textOf(b).length)[0];
    }
    return null;
  }

  async function openSimilarFromRow(row, keyword, pageNo) {
    const previousSignature = listSignature();
    const previousUrl = location.href;
    const more = findMoreAction(row);
    if (!more) {
      post({ type: "status", pageNo, message: "没有找到“" + keyword + "”这一行的更多操作入口" });
      return false;
    }

    post({ type: "status", pageNo, message: "已找到“" + keyword + "”，正在打开更多操作里的寻找相似" });
    more.scrollIntoView({ block: "center", inline: "center" });
    const rect = more.getBoundingClientRect();
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    for (const type of ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove"]) {
      more.dispatchEvent(new MouseEvent(type, opts));
    }
    await sleep(600);

    let similarItem = findVisibleMenuItem("寻找相似");
    if (!similarItem) {
      clickElement(more);
      await sleep(700);
      similarItem = findVisibleMenuItem("寻找相似");
    }
    if (!similarItem) {
      post({ type: "status", pageNo, message: "更多操作菜单已尝试打开，但没有看到“寻找相似”" });
      return false;
    }

    await trustedClickElementInPlace(similarItem);
    const waitForSimilarList = async timeoutMs => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const rows = getRows();
        const signature = listSignature();
        const bodyText = textOf(document.body);
        const similarReady = bodyText.includes("相似作者") && bodyText.includes(keyword);
        const firstNickname = rows.length ? rowNickname(rows[0]) : "";
        if (rows.length && similarReady && firstNickname !== keyword && (location.href !== previousUrl || (signature && signature !== previousSignature))) {
          return true;
        }
        await sleep(500);
      }
      return false;
    };

    if (await waitForSimilarList(Math.max(3500, Math.min(7000, options.delayMs * 5)))) return true;

    const moreLink = Array.from(document.querySelectorAll("a, button, span, div, [role='button']"))
      .filter(isVisible)
      .filter(el => textOf(el) === "查看更多")
      .filter(el => textOf(document.body).includes("相似的博主推荐"))
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return ar.top - br.top;
      })[0];

    if (moreLink) {
      post({ type: "status", pageNo, message: "正在通过相似推荐里的“查看更多”进入完整相似列表" });
      clickElementInPlace(moreLink);
      if (await waitForSimilarList(Math.max(18000, options.delayMs * 12))) return true;
    }

    const started = Date.now();
    while (Date.now() - started < Math.max(9000, options.delayMs * 6)) {
      const rows = getRows();
      const signature = listSignature();
      const similarReady = textOf(document.body).includes("相似作者") && textOf(document.body).includes(keyword);
      const firstNickname = rows.length ? rowNickname(rows[0]) : "";
      if (rows.length && similarReady && firstNickname !== keyword && (location.href !== previousUrl || (signature && signature !== previousSignature))) {
        return true;
      }
      await sleep(500);
    }
    return getRows().length > 0 && listSignature() !== previousSignature;
  }

  async function runSimilarMode() {
    const nicknames = Array.isArray(options.nicknames) ? options.nicknames : [];
    for (let index = 0; index < nicknames.length; index += 1) {
      if (window.__pgyDesktopStopRequested) break;
      await ensureSearchPageReady(index + 1);
      const nickname = nicknames[index];
      const row = await findBestSearchRow(nickname, index + 1);
      if (!row) {
        post({ type: "status", pageNo: index + 1, message: "没有找到“" + nickname + "”，已跳过相似博主查询" });
        continue;
      }
      const opened = await openSimilarFromRow(row, nickname, index + 1);
      if (!opened) {
        post({ type: "status", pageNo: index + 1, message: "没有成功打开“" + nickname + "”的相似博主列表，已跳过" });
        continue;
      }
      post({ type: "status", pageNo: index + 1, message: "已进入“" + nickname + "”的相似博主列表，开始采集" });
      const pageResult = await collectCurrentPageRecords(index + 1);
      postRecords({ type: "records", pageNo: index + 1, records: pageResult.records, visibleRows: pageResult.visibleRows, missingIdCount: pageResult.missingIdCount });
      await humanPause(Math.max(1400, options.delayMs));
      if (index < nicknames.length - 1) {
        await ensureSearchPageReady(index + 2);
        await humanPause(Math.max(1000, options.delayMs));
      }
    }
    post({ type: "done", message: "相似博主采集结束" });
  }

  async function run() {
    try {
      if (options.taskMode === "nickname") {
        await runNicknameSearchMode();
        return;
      }
      if (options.taskMode === "similar") {
        await runSimilarMode();
        return;
      }
      for (let pageNo = 1; pageNo <= options.maxPages; pageNo += 1) {
        if (window.__pgyDesktopStopRequested) break;
        post({ type: "status", pageNo, message: "正在读取第 " + pageNo + " 页" });
        const rows = await waitForRows(Math.max(9000, options.delayMs * 6));
        if (!rows.length) {
          post({ type: "error", message: "没有等到博主列表，请确认已登录并完成筛选" });
          break;
        }

        const pageResult = await collectCurrentPageRecords(pageNo);
        const records = pageResult.records;
        const missingIdCount = pageResult.missingIdCount;
        if (records.length && missingIdCount === records.length) {
          post({ type: "error", message: "当前页博主 ID 全部识别失败，请复制诊断并反馈" });
          break;
        }
        if (!options.enhancedMode) {
          postRecords({ type: "records", pageNo, records, visibleRows: pageResult.visibleRows, missingIdCount });
        } else {
          post({ type: "status", pageNo, message: "第 " + pageNo + " 页增强采集处理完成" });
        }

        if (window.__pgyDesktopStopRequested || pageNo >= options.maxPages) break;
        const signature = listSignature();
        const pageState = paginationState();
        const pageUrl = location.href;
        const nextPage = pageNo + 1;
        const pageReady = await goToPageNode(nextPage, signature, pageState, pageUrl);
        if (!pageReady) {
          post({ type: "done", message: "没有下一页，采集完成" });
          break;
        }
        await sleep(options.delayMs);
      }
      post({ type: "done", message: "采集结束" });
    } catch (error) {
      post({ type: "error", message: error && error.message ? error.message : String(error) });
    } finally {
      window.__pgyDesktopCollectorRunning = false;
    }
  }

  run();
})();
`;
}

async function init() {
  const preloadPath = await window.desktopApi.getWebviewPreloadPath();
  const dataPreloadPath = await window.desktopApi.getDataConsolePreloadPath();
  els.webview.setAttribute("preload", preloadPath);
  els.dataView.setAttribute("preload", dataPreloadPath);
  updateDemoSummary();
  els.webview.src = PGY_URL;
  setStatus("本地 Demo 版已启用。请先登录蒲公英，并在页面中设置筛选条件。");
  warmDataConsole();
  startUpdateJobTimer();
}

els.webview.addEventListener("ipc-message", event => {
  if (event.channel !== "collector-message") return;
  const message = event.args[0] || {};
  if (message.type === "trusted-click-request") {
    handleTrustedClickRequest(message);
    return;
  }
  if (message.type === "api-response") {
    storeApiResponse(message);
    return;
  }
  if (message.pageNo) state.pageNo = message.pageNo;
  state.lastDiagnostics = { ...state.lastDiagnostics, lastMessage: message, url: els.webview.getURL() };

  if (message.type === "records") {
    const records = recordsFromMessage(message);
    const addResult = addRecords(records);
    const skippedText = addResult.skippedMissingIdCount
      ? `，缺少ID已跳过 ${addResult.skippedMissingIdCount} 条：${addResult.skippedMissingIdText}`
      : "";
    setStatus(`第 ${message.pageNo} 页完成，页面识别 ${message.visibleRows || records.length} 行，本次保存 ${addResult.acceptedCount} 条${skippedText}。`);
  } else if (message.type === "status") {
    setStatus(message.message || "采集中");
  } else if (message.type === "error") {
    state.running = false;
    state.awaitingDetailEnhancement = false;
    state.detailEnhancing = false;
    stopWatchdog();
    setStatus(`采集异常：${message.message}`);
  } else if (message.type === "done") {
    if (state.detailEnhancing) {
      render();
      return;
    } else if (state.awaitingDetailEnhancement && !state.stopRequested) {
      state.awaitingDetailEnhancement = false;
      setStatus(`列表采集完成，准备逐个打开详情页补充增强字段。\n已识别 ${state.records.length} 个博主。`);
      runDetailEnhancement();
    } else {
      finishCollection(message.message || "采集完成");
    }
  }
  render();
});

function sendDataConsoleResult(payload) {
  if (!els.dataView) return;
  const safePayload = JSON.stringify(payload || {});
  els.dataView.executeJavaScript(
    `window.dispatchEvent(new CustomEvent("pgy-refresh-result", { detail: ${safePayload} }));`,
    true
  ).catch(() => {});
}

function sendDataConsoleUpdateResult(payload) {
  if (!els.dataView) return;
  const safePayload = JSON.stringify(payload || {});
  els.dataView.executeJavaScript(
    `window.dispatchEvent(new CustomEvent("pgy-update-job-result", { detail: ${safePayload} }));`,
    true
  ).catch(() => {});
}

function refreshRecordFromBlogger(blogger, pageNo = "每日更新", rank = 1) {
  const userId = blogger && blogger.blogger_id ? String(blogger.blogger_id) : "";
  return {
    nickname: blogger.nickname || "",
    blogger_id: userId,
    blogger_url: blogger.blogger_url || (userId ? `https://www.xiaohongshu.com/user/profile/${userId}` : ""),
    red_id: blogger.red_id || "",
    province: blogger.province || "",
    city: blogger.city || "",
    tags: blogger.tags || [],
    fans_count: blogger.fans_count || "",
    read_median: blogger.read_median || "",
    interaction_median: blogger.interaction_median || "",
    image_note_price: blogger.image_note_price || "",
    video_note_price: blogger.video_note_price || "",
    page_no: pageNo,
    rank_in_page: String(rank),
    collected_at: localDateTimeText()
  };
}

async function createManualRefreshBatch(record) {
  const result = await window.desktopApi.createDatabaseBatch({
    taskMode: "manual_refresh",
    collectMode: "enhanced",
    sourceName: `手动重刷：${record.nickname || record.blogger_id}`,
    maxPages: 1,
    perPageLimit: 1,
    startedAt: localDateTimeText()
  });
  if (!result || !result.ok || !result.batchId) {
    throw new Error(result && result.message ? result.message : "数据库批次创建失败");
  }
  return result.batchId;
}

async function refreshSingleBloggerFromDatabase(blogger) {
  const userId = blogger && blogger.blogger_id ? String(blogger.blogger_id) : "";
  const rowId = blogger && blogger.id ? Number(blogger.id) : 0;
  if (!userId) {
    sendDataConsoleResult({ ok: false, id: rowId, message: "这个博主缺少博主ID，无法重刷详情。" });
    return;
  }
  if (state.running) {
    sendDataConsoleResult({ ok: false, id: rowId, message: "采集助手正在运行，请先停止当前任务后再重刷。" });
    return;
  }

  const previousTaskMode = state.taskMode;
  const previousEnhancedMode = state.enhancedMode;
  const previousBatchId = state.databaseBatchId;
  const record = refreshRecordFromBlogger(blogger, "手动重刷", 1);
  const identityLock = {
    nickname: record.nickname,
    blogger_id: record.blogger_id,
    blogger_url: record.blogger_url,
    red_id: record.red_id
  };

  try {
    state.running = true;
    state.stopRequested = false;
    state.enhancedMode = true;
    state.taskMode = "manual_refresh";
    state.records = [record];
    state.ids = new Set([userId]);
    state.duplicateCount = 0;
    state.skippedMissingIdRecords = [];
    state.pageNo = 0;
    state.apiResponses = new Map();
    state.databaseBatchId = await createManualRefreshBatch(record);
    state.databaseSavedCount = 0;
    state.databaseError = "";
    state.databaseWriteQueue = Promise.resolve();
    startWatchdog();
    render();

    sendDataConsoleResult({ ok: true, running: true, id: rowId, message: `正在重刷“${record.nickname || userId}”的最新数据。` });
    setStatus(`正在从数据后台重刷“${record.nickname || userId}”的最新数据。`);

    let missing = [];
    const delayMs = Math.max(1200, Number(els.delayMs.value || 1400));
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (state.stopRequested) break;
      record.collected_at = localDateTimeText();
      missing = await collectDetailWithQualityGate(record, 0, 1, attempt, maxAttempts, delayMs, { identityLock });
      if (!missing.length) break;
      if (attempt < maxAttempts) {
        setStatus(`“${record.nickname || userId}”重刷缺失：${missing.join("、")}，准备重试。`);
        await sleep(Math.max(1800, delayMs));
      }
    }

    await appendRecordsToDatabase([record], { countTowardsBatch: true });
    await finishDatabaseBatch(state.stopRequested ? "中止" : "完成", 0);

    state.running = false;
    state.detailEnhancing = false;
    state.finalChecking = false;
    state.detailProgress = null;
    state.databaseBatchId = null;
    stopWatchdog();
    render();

    const resultMessage = state.stopRequested
      ? `已停止重刷“${record.nickname || userId}”，已保存当前读取到的数据。`
      : missing.length
        ? `已重刷“${record.nickname || userId}”，但仍有缺失项：${missing.join("、")}。`
        : `已重刷“${record.nickname || userId}”并写入数据库。`;
    setStatus(resultMessage);
    sendDataConsoleResult({ ok: true, running: false, id: rowId, message: resultMessage });
  } catch (error) {
    state.running = false;
    state.detailEnhancing = false;
    state.finalChecking = false;
    state.detailProgress = null;
    stopWatchdog();
    try {
      if (state.databaseBatchId) await finishDatabaseBatch("异常", 0);
    } catch (_) {}
    const message = error && error.message ? error.message : String(error);
    setStatus(`重刷失败：${message}`);
    sendDataConsoleResult({ ok: false, running: false, id: rowId, message: `重刷失败：${message}` });
    render();
  } finally {
    state.stopRequested = false;
    state.taskMode = previousTaskMode;
    state.enhancedMode = previousEnhancedMode;
    state.databaseBatchId = previousBatchId && state.running ? previousBatchId : null;
    render();
  }
}

async function updateJobRunPatch(runId, patch = {}) {
  if (!runId) return null;
  const result = await dataConsoleRequest(`/api/update-job/runs/${runId}`, {
    method: "PUT",
    body: patch,
    timeoutMs: 60000
  });
  return result.run || null;
}

async function runUpdateJobFromDataConsole(jobInput = {}, source = "manual") {
  if (state.running || state.updateJobRunning) {
    sendDataConsoleUpdateResult({
      ok: false,
      complete: true,
      status: "中止",
      message: "采集助手正在运行，请先停止当前任务后再执行每日增强更新。"
    });
    return;
  }

  let runId = 0;
  let batchId = 0;
  let finalStatus = "完成";
  let processed = 0;
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const previousTaskMode = state.taskMode;
  const previousEnhancedMode = state.enhancedMode;
  const previousBatchId = state.databaseBatchId;

  try {
    await warmDataConsole();
    const job = {
      id: Number(jobInput.id || 1),
      run_time: jobInput.run_time || jobInput.runTime || "09:30",
      daily_limit: Math.max(1, Math.min(5000, Math.round(Number(jobInput.daily_limit || jobInput.dailyLimit || 1000))))
    };
    const candidatesResult = await dataConsoleRequest(`/api/update-job/candidates?limit=${job.daily_limit}`, { timeoutMs: 60000 });
    const candidates = candidatesResult.items || [];
    if (!candidates.length) {
      sendDataConsoleUpdateResult({
        ok: true,
        complete: true,
        status: "完成",
        message: "没有找到可更新的博主。只有带博主ID的记录会进入每日增强更新。"
      });
      return;
    }

    const batch = await window.desktopApi.createDatabaseBatch({
      taskMode: source === "scheduled" ? "daily_scheduled_update" : "daily_manual_update",
      collectMode: "enhanced",
      sourceName: `${source === "scheduled" ? "定时" : "立即"}每日增强更新：${candidates.length} 位`,
      maxPages: 1,
      perPageLimit: candidates.length,
      startedAt: localDateTimeText()
    });
    if (!batch || !batch.ok || !batch.batchId) throw new Error(batch && batch.message ? batch.message : "数据库批次创建失败");
    batchId = batch.batchId;

    const runResult = await dataConsoleRequest("/api/update-job/runs", {
      method: "POST",
      body: {
        jobId: job.id,
        batchId,
        totalTarget: candidates.length,
        message: `开始更新 ${candidates.length} 位博主`
      },
      timeoutMs: 60000
    });
    runId = runResult.run?.id || 0;

    state.updateJobRunning = true;
    state.running = true;
    state.stopRequested = false;
    state.enhancedMode = true;
    state.taskMode = source === "scheduled" ? "daily_scheduled_update" : "daily_manual_update";
    state.records = [];
    state.ids = new Set();
    state.duplicateCount = 0;
    state.skippedMissingIdRecords = [];
    state.pageNo = 0;
    state.detailProgress = null;
    state.apiResponses = new Map();
    state.databaseBatchId = batchId;
    state.databaseSavedCount = 0;
    state.databaseError = "";
    state.databaseWriteQueue = Promise.resolve();
    startWatchdog();
    render();

    const startedRun = runResult.run || null;
    sendDataConsoleUpdateResult({
      ok: true,
      running: true,
      status: "运行中",
      run: startedRun,
      message: `每日增强更新已开始：本次 ${candidates.length} 位。`
    });
    setStatus(`每日增强更新已开始：本次 ${candidates.length} 位。请保持蒲公英登录状态，不要操作页面。`);

    const delayMs = Math.max(1200, Number(els.delayMs.value || 1400));
    const maxAttempts = 3;
    for (let index = 0; index < candidates.length; index += 1) {
      if (state.stopRequested) {
        finalStatus = "中止";
        break;
      }
      const blogger = candidates[index];
      const userId = blogger && blogger.blogger_id ? String(blogger.blogger_id) : "";
      if (!userId) {
        skipped += 1;
        processed += 1;
        const run = await updateJobRunPatch(runId, {
          status: "运行中",
          totalTarget: candidates.length,
          processedCount: processed,
          successCount: success,
          failedCount: failed,
          skippedCount: skipped,
          message: `已跳过缺少博主ID的记录：${blogger.nickname || "-"}`
        });
        sendDataConsoleUpdateResult({ ok: true, running: true, status: "运行中", run, message: `已跳过缺少博主ID的记录：${blogger.nickname || "-"}` });
        continue;
      }

      const record = refreshRecordFromBlogger(blogger, "每日更新", index + 1);
      const identityLock = {
        nickname: record.nickname,
        blogger_id: record.blogger_id,
        blogger_url: record.blogger_url,
        red_id: record.red_id
      };
      state.records.push(record);
      state.ids.add(userId);
      render();

      let missing = [];
      let failedMessage = "";
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (state.stopRequested) {
          finalStatus = "中止";
          break;
        }
        try {
          record.collected_at = localDateTimeText();
          missing = await collectDetailWithQualityGate(record, index, candidates.length, attempt, maxAttempts, delayMs, { identityLock });
          failedMessage = "";
          if (!missing.length) break;
          if (attempt < maxAttempts) {
            setStatus(`每日更新：“${record.nickname || userId}”缺失：${missing.join("、")}，准备重试。`);
            await sleep(Math.max(1800, delayMs));
          }
        } catch (error) {
          missing = [`详情页异常：${error && error.message ? error.message : String(error)}`];
          failedMessage = missing[0];
          Object.assign(record, {
            detail_collect_status: "需复查",
            detail_retry_count: String(attempt - 1),
            detail_missing_fields: missing.join("|")
          });
          if (attempt < maxAttempts) await sleep(Math.max(1800, delayMs));
        }
      }

      processed += 1;
      const stoppedBeforeSave = state.stopRequested && missing.includes("已停止");
      if (state.stopRequested) finalStatus = "中止";
      if (stoppedBeforeSave) {
        skipped += 1;
      } else if (missing.length || failedMessage) {
        failed += 1;
      } else {
        success += 1;
      }
      if (!stoppedBeforeSave) await appendRecordsToDatabase([record], { countTowardsBatch: true });
      const progressText = stoppedBeforeSave
        ? `每日更新已暂停：${record.nickname || userId} 未写入，已处理 ${processed}/${candidates.length}`
        : `每日更新进度 ${processed}/${candidates.length}：${record.nickname || userId}${missing.length ? " 有缺失项" : " 已完成"}`;
      const run = await updateJobRunPatch(runId, {
        status: finalStatus === "中止" ? "中止" : "运行中",
        totalTarget: candidates.length,
        processedCount: processed,
        successCount: success,
        failedCount: failed,
        skippedCount: skipped,
        message: progressText
      });
      sendDataConsoleUpdateResult({ ok: true, running: finalStatus !== "中止", status: run?.status || "运行中", run, message: progressText });
      setStatus(progressText);
      if (finalStatus === "中止") break;
      await sleep(Math.max(1200, Math.round(delayMs * (0.9 + Math.random() * 0.8))));
    }

    await finishDatabaseBatch(finalStatus, 0);
    const finalMessage = finalStatus === "中止"
      ? `每日增强更新已停止：已处理 ${processed}/${candidates.length} 位。`
      : `每日增强更新完成：成功 ${success}，缺失/异常 ${failed}，跳过 ${skipped}。`;
    const finalRun = await updateJobRunPatch(runId, {
      status: finalStatus,
      totalTarget: candidates.length,
      processedCount: processed,
      successCount: success,
      failedCount: failed,
      skippedCount: skipped,
      message: finalMessage,
      finishedAt: new Date().toISOString()
    });
    sendDataConsoleUpdateResult({ ok: true, complete: true, running: false, status: finalStatus, run: finalRun, message: finalMessage });
    setStatus(finalMessage);
  } catch (error) {
    finalStatus = "异常";
    const message = error && error.message ? error.message : String(error);
    try {
      if (state.databaseBatchId || batchId) await finishDatabaseBatch("异常", 0);
    } catch (_) {}
    let failedRun = null;
    try {
      failedRun = await updateJobRunPatch(runId, {
        status: "异常",
        processedCount: processed,
        successCount: success,
        failedCount: failed + 1,
        skippedCount: skipped,
        message: `每日增强更新异常：${message}`,
        finishedAt: new Date().toISOString()
      });
    } catch (_) {}
    sendDataConsoleUpdateResult({ ok: false, complete: true, running: false, status: "异常", run: failedRun, message: `每日增强更新异常：${message}` });
    setStatus(`每日增强更新异常：${message}`);
  } finally {
    state.running = false;
    state.updateJobRunning = false;
    state.detailEnhancing = false;
    state.finalChecking = false;
    state.detailProgress = null;
    state.stopRequested = false;
    state.taskMode = previousTaskMode;
    state.enhancedMode = previousEnhancedMode;
    state.databaseBatchId = previousBatchId && state.running ? previousBatchId : null;
    stopWatchdog();
    render();
  }
}

async function checkDueUpdateJob() {
  if (state.running || state.updateJobRunning) return;
  try {
    await warmDataConsole();
    const result = await dataConsoleRequest("/api/update-job/due", { timeoutMs: 15000 });
    if (result.job) await runUpdateJobFromDataConsole(result.job, "scheduled");
  } catch (_) {
    // 定时检查失败不打扰当前采集界面，下一轮继续检查。
  }
}

function startUpdateJobTimer() {
  if (state.updateJobTimer) clearInterval(state.updateJobTimer);
  state.updateJobTimer = setInterval(checkDueUpdateJob, 60 * 1000);
  setTimeout(checkDueUpdateJob, 10000);
}

function stopUpdateJobFromDataConsole() {
  if (!state.updateJobRunning) {
    sendDataConsoleUpdateResult({
      ok: false,
      running: false,
      status: "待开始",
      message: "当前没有正在运行的每日增强更新。"
    });
    return;
  }
  state.stopRequested = true;
  sendDataConsoleUpdateResult({
    ok: true,
    running: true,
    status: "中止中",
    message: "已收到暂停请求，当前博主处理完后停止。"
  });
  setStatus("每日增强更新正在暂停：当前博主处理完后停止。");
}

els.dataView.addEventListener("ipc-message", event => {
  if (event.channel !== "data-console-message") return;
  const message = event.args[0] || {};
  if (message.type === "refresh-blogger") {
    refreshSingleBloggerFromDatabase(message.blogger || {});
  } else if (message.type === "run-update-job") {
    runUpdateJobFromDataConsole(message.job || {}, "manual");
  } else if (message.type === "stop-update-job") {
    stopUpdateJobFromDataConsole();
  }
});

els.collectorTabButton.addEventListener("click", () => switchTab("collector"));
els.collectorTabButton2.addEventListener("click", () => switchTab("collector"));
els.dataTabButton.addEventListener("click", () => switchTab("data"));
els.dataTabButton2.addEventListener("click", () => switchTab("data"));

els.reloadDataConsole.addEventListener("click", async () => {
  setStatus("正在刷新 App 内数据后台...");
  const result = await warmDataConsole();
  if (result && result.ok && els.dataView) els.dataView.reload();
  setStatus(result && result.ok ? "数据后台已刷新。" : `数据后台刷新失败：${result && result.message ? result.message : "未知错误"}`);
});

els.openPgy.addEventListener("click", () => {
  els.webview.src = PGY_URL;
});

els.reloadPage.addEventListener("click", () => {
  els.webview.reload();
});

els.taskMode.addEventListener("change", () => {
  state.taskMode = els.taskMode.value;
  if (state.taskMode === "similar") {
    els.collectMode.value = "normal";
    state.enhancedMode = false;
  }
  render();
});

els.collectMode.addEventListener("change", () => {
  state.enhancedMode = els.collectMode.value === "enhanced" && state.taskMode !== "similar";
  render();
});

els.downloadTemplate.addEventListener("click", async () => {
  const filePath = await window.desktopApi.saveNicknameTemplate();
  if (filePath) setStatus(`模板已保存：${filePath}`);
});

els.uploadNicknames.addEventListener("click", async () => {
  const result = await window.desktopApi.openNicknameFile();
  if (!result) return;
  state.uploadedNicknames = result.nicknames || [];
  state.uploadedNicknameFile = result.filePath || "";
  setStatus(state.uploadedNicknames.length
    ? `已读取 ${state.uploadedNicknames.length} 个博主昵称。`
    : "文件里没有读取到博主昵称，请确认昵称写在第一列。");
  render();
});

els.startCollect.addEventListener("click", async () => {
  state.records = [];
  state.ids = new Set();
  state.duplicateCount = 0;
  state.skippedMissingIdRecords = [];
  state.pageNo = 0;
  state.apiResponses = new Map();
  state.taskMode = els.taskMode.value;
  state.enhancedMode = els.collectMode.value === "enhanced" && state.taskMode !== "similar";
  state.awaitingDetailEnhancement = state.enhancedMode;
  state.detailEnhancing = false;
  state.finalChecking = false;
  state.detailProgress = null;
  state.stopRequested = false;
  state.databaseBatchId = null;
  state.databaseSavedCount = 0;
  state.databaseError = "";
  state.databaseWriteQueue = Promise.resolve();
  state.collectOptions = null;
  state.running = true;
  state.lastProgressAt = Date.now();
  startWatchdog();
  render();
  if ((state.taskMode === "nickname" || state.taskMode === "similar") && !state.uploadedNicknames.length) {
    state.running = false;
    stopWatchdog();
    setStatus("请先上传博主昵称文件。");
    render();
    return;
  }
  try {
    state.collectOptions = readCollectorOptions();
  } catch (error) {
    state.running = false;
    stopWatchdog();
    setStatus(error && error.message ? error.message : String(error));
    render();
    return;
  }
  await createDatabaseBatch();
  const taskText = state.taskMode === "nickname" ? "博主昵称上传" : state.taskMode === "similar" ? "相似博主" : "当前列表";
  const databaseText = state.databaseBatchId ? `数据库批次 #${state.databaseBatchId} 已创建，开始边采边入库。` : "数据库批次创建失败，本次仍可导出 CSV。";
  setStatus(`${taskText}开始采集。${databaseText}${state.enhancedMode ? "增强采集会逐个进入详情页，请不要操作页面。" : "请不要操作页面。"}`);

  const options = {
    startUrl: PGY_URL,
    maxPages: state.collectOptions.maxPages,
    maxItems: state.collectOptions.maxItems,
    delayMs: state.collectOptions.delayMs,
    taskMode: state.taskMode,
    nicknames: state.uploadedNicknames,
    enhancedMode: false,
    forceClickId: false
  };

  try {
    await els.webview.executeJavaScript(collectorSource(options), true);
  } catch (error) {
    state.running = false;
    state.awaitingDetailEnhancement = false;
    state.detailEnhancing = false;
    stopWatchdog();
    await finishDatabaseBatch("异常", 0);
    setStatus(`采集启动失败：${error && error.message ? error.message : String(error)}`);
    render();
  }
});

els.stopCollect.addEventListener("click", async () => {
  state.stopRequested = true;
  state.awaitingDetailEnhancement = false;
  try {
    await els.webview.executeJavaScript("window.__pgyDesktopStopRequested = true", true);
  } catch (_) {}
  setStatus("正在停止，当前行处理完后会结束。");
  setTimeout(() => {
    if (!state.running || !state.stopRequested) return;
    state.running = false;
    state.detailEnhancing = false;
    state.finalChecking = false;
    stopWatchdog();
    setStatus("已强制停止。可以导出已采集数据，或刷新页面后重新开始。");
    render();
  }, 2 * 60 * 1000);
});

els.exportCsv.addEventListener("click", async () => {
  const modeText = state.enhancedMode ? "增强采集" : "常规采集";
  const defaultName = `pgy_kol_${modeText}_${nowFileText()}_${state.records.length}条.csv`;
  const filePath = await window.desktopApi.showSaveDialog(defaultName);
  if (!filePath) return;
  await window.desktopApi.saveTextFile({ filePath, text: makeCsv() });
  setStatus(`已导出：${filePath}`);
});

els.openDataConsole.addEventListener("click", async () => {
  setStatus("正在打开 App 内数据后台...");
  switchTab("data");
});

els.copyDiag.addEventListener("click", async () => {
  const diagnostics = {
    desktopVersion: "0.2.3-demo",
    collectMode: state.enhancedMode ? "enhanced" : "normal",
    taskMode: state.taskMode,
    uploadedNicknameCount: state.uploadedNicknames.length,
    pageUrl: els.webview.getURL(),
    records: state.records.length,
    duplicateCount: state.duplicateCount,
    pageNo: state.pageNo,
    capturedApiUserCount: state.apiResponses.size,
    lastDiagnostics: state.lastDiagnostics
  };
  await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
  setStatus("诊断信息已复制。");
});

init();
render();
