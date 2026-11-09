const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");
const { defaultDbPath } = require("./path");
const { normalizeCollectorRecord } = require("./importer");
const { SNAPSHOT_FIELDS, SNAPSHOT_NUMBER_FIELDS, SNAPSHOT_TEXT_FIELDS } = require("./collector-fields");

const STATUS_VALUES = new Set(["未跟进", "已收藏", "黑名单", "待联系", "已合作", "不合适"]);
const LICENSE_PRODUCT_ID = "pgy-blogger-collector";
const LICENSE_STATUS_VALUES = new Set(["未激活", "已激活", "已停用", "已过期"]);

function json(value) {
  return JSON.stringify(value == null ? null : value);
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeLicenseCode(value) {
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function licenseCodeHash(value) {
  return crypto.createHash("sha256").update(normalizeLicenseCode(value)).digest("hex");
}

function licenseCodeMask(value) {
  const code = normalizeLicenseCode(value);
  if (code.length <= 14) return code;
  return `${code.slice(0, 8)}...${code.slice(-6)}`;
}

function generateLicenseCode() {
  const raw = crypto.randomBytes(18).toString("hex").toUpperCase();
  return `PGY-${raw.match(/.{1,4}/g).join("-")}`;
}

function dateOnlyExpiresAt(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T23:59:59.999+08:00` : text;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error("到期时间无效");
  return date.toISOString();
}

function licenseExpiryFromInput(input = {}) {
  if (input.permanent) return "";
  if (input.expiresAt) return dateOnlyExpiresAt(input.expiresAt);
  const days = Number(input.durationDays || input.days || 0);
  if (!Number.isFinite(days) || days <= 0) throw new Error("授权时长无效");
  const date = new Date();
  date.setDate(date.getDate() + Math.round(days));
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function durationLabelFromInput(input = {}, expiresAt = "") {
  if (input.permanent || !expiresAt) return "永久";
  if (input.expiresAt) return `至 ${String(input.expiresAt).slice(0, 10)}`;
  return `${Math.round(Number(input.durationDays || input.days || 0))} 天`;
}

function parseJsonObject(value) {
  if (!value) return {};
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function existingColumns(db, tableName) {
  return new Set(db.prepare(`PRAGMA table_info(${tableName})`).all().map(row => row.name));
}

function ensureColumns(db, tableName, columns) {
  const existing = existingColumns(db, tableName);
  for (const [name, type] of columns) {
    if (existing.has(name)) continue;
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${type}`).run();
  }
}

function normalizeMcnForCompare(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text || /^(无机构|暂无|无|未认证|未加入|-|null|undefined)$/i.test(text)) return "无机构";
  return text;
}

function meaningfulMcn(value) {
  return normalizeMcnForCompare(value) !== "无机构";
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createDataStore(options = {}) {
  const dbPath = options.dbPath || defaultDbPath();
  ensureDir(dbPath);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  ensureRuntimeColumns(db);
  seed(db);
  return new DataStore(db, dbPath);
}

function ensureRuntimeColumns(db) {
  ensureColumns(db, "blogger_snapshots", [
    ...SNAPSHOT_NUMBER_FIELDS.map(field => [field, "REAL"]),
    ...SNAPSHOT_TEXT_FIELDS.map(field => [field, "TEXT"]),
    ["raw_api_json", "TEXT"]
  ]);
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      login_name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'staff',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bloggers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blogger_id TEXT UNIQUE,
      blogger_url TEXT,
      nickname TEXT NOT NULL DEFAULT '',
      red_id TEXT,
      province TEXT,
      city TEXT,
      mcn_name TEXT,
      mcn_status TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      content_tags_json TEXT NOT NULL DEFAULT '[]',
      sub_content_tags_json TEXT NOT NULL DEFAULT '[]',
      feature_tags_json TEXT NOT NULL DEFAULT '[]',
      collab_status TEXT NOT NULL DEFAULT '未跟进',
      latest_snapshot_id INTEGER,
      first_collected_at TEXT,
      last_collected_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_bloggers_blogger_id ON bloggers(blogger_id);
    CREATE INDEX IF NOT EXISTS idx_bloggers_red_nickname ON bloggers(red_id, nickname);
    CREATE INDEX IF NOT EXISTS idx_bloggers_status ON bloggers(collab_status);
    CREATE INDEX IF NOT EXISTS idx_bloggers_last_collected ON bloggers(last_collected_at);

    CREATE TABLE IF NOT EXISTS collect_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_mode TEXT NOT NULL,
      collect_mode TEXT NOT NULL,
      source_name TEXT,
      max_pages INTEGER,
      per_page_limit INTEGER,
      status TEXT NOT NULL DEFAULT '完成',
      total_collected INTEGER NOT NULL DEFAULT 0,
      duplicate_count INTEGER NOT NULL DEFAULT 0,
      empty_recheck_count INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blogger_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER REFERENCES collect_batches(id) ON DELETE SET NULL,
      blogger_row_id INTEGER NOT NULL REFERENCES bloggers(id) ON DELETE CASCADE,
      fans_count REAL,
      read_median REAL,
      interaction_median REAL,
      image_note_price REAL,
      video_note_price REAL,
      exposure_median REAL,
      like_median REAL,
      collect_median REAL,
      comment_median REAL,
      coop_30_note_count REAL,
      coop_90_note_count REAL,
      business_note_count REAL,
      raw_json TEXT NOT NULL DEFAULT '{}',
      raw_api_json TEXT,
      collected_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_blogger ON blogger_snapshots(blogger_row_id, collected_at);
    CREATE INDEX IF NOT EXISTS idx_snapshots_batch ON blogger_snapshots(batch_id);

    CREATE TABLE IF NOT EXISTS blogger_mcn_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blogger_row_id INTEGER NOT NULL REFERENCES bloggers(id) ON DELETE CASCADE,
      previous_mcn_status TEXT,
      current_mcn_status TEXT NOT NULL,
      previous_snapshot_id INTEGER REFERENCES blogger_snapshots(id) ON DELETE SET NULL,
      current_snapshot_id INTEGER REFERENCES blogger_snapshots(id) ON DELETE SET NULL,
      changed_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_mcn_history_blogger ON blogger_mcn_history(blogger_row_id, changed_at);

    CREATE TABLE IF NOT EXISTS update_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '每日增强更新',
      status TEXT NOT NULL DEFAULT 'PAUSED',
      run_time TEXT NOT NULL DEFAULT '09:30',
      daily_limit INTEGER NOT NULL DEFAULT 1000,
      selection_rule TEXT NOT NULL DEFAULT 'oldest_first',
      last_run_at TEXT,
      next_run_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS update_job_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES update_jobs(id) ON DELETE SET NULL,
      batch_id INTEGER REFERENCES collect_batches(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT '待开始',
      total_target INTEGER NOT NULL DEFAULT 0,
      processed_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      message TEXT,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      finished_at TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_update_runs_job ON update_job_runs(job_id, started_at);

    CREATE TABLE IF NOT EXISTS batch_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL REFERENCES collect_batches(id) ON DELETE CASCADE,
      blogger_row_id INTEGER REFERENCES bloggers(id) ON DELETE SET NULL,
      seed_nickname TEXT,
      page_no TEXT,
      rank_in_page TEXT,
      status TEXT NOT NULL DEFAULT '成功',
      missing_fields TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blogger_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blogger_row_id INTEGER NOT NULL REFERENCES bloggers(id) ON DELETE CASCADE,
      tag_type TEXT NOT NULL,
      tag_name TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT '采集',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(blogger_row_id, tag_type, tag_name)
    );

    CREATE INDEX IF NOT EXISTS idx_blogger_tags_name ON blogger_tags(tag_name);

    CREATE TABLE IF NOT EXISTS blogger_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blogger_row_id INTEGER NOT NULL REFERENCES bloggers(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      status TEXT,
      next_follow_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_id TEXT NOT NULL UNIQUE,
      product_id TEXT NOT NULL DEFAULT 'pgy-blogger-collector',
      code_hash TEXT NOT NULL UNIQUE,
      code_mask TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      duration_label TEXT NOT NULL,
      duration_days INTEGER,
      expires_at TEXT,
      status TEXT NOT NULL DEFAULT '未激活',
      machine_code TEXT,
      activated_at TEXT,
      last_seen_at TEXT,
      activation_count INTEGER NOT NULL DEFAULT 0,
      generated_by TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_licenses_customer ON licenses(customer_name);
    CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
    CREATE INDEX IF NOT EXISTS idx_licenses_machine ON licenses(machine_code);
    CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);

    CREATE TABLE IF NOT EXISTS license_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_row_id INTEGER REFERENCES licenses(id) ON DELETE SET NULL,
      license_id TEXT,
      event_type TEXT NOT NULL,
      machine_code TEXT,
      app_version TEXT,
      ip TEXT,
      user_agent TEXT,
      device_info_json TEXT NOT NULL DEFAULT '{}',
      message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_license_events_license ON license_events(license_row_id, created_at);

    CREATE VIRTUAL TABLE IF NOT EXISTS blogger_search USING fts5(
      nickname,
      red_id,
      mcn_status,
      tags,
      notes,
      tokenize='unicode61'
    );
  `);
}

function seed(db) {
  const user = db.prepare("SELECT id FROM users WHERE id = 1").get();
  if (!user) {
    db.prepare("INSERT INTO users (id, name, login_name, role) VALUES (1, '默认员工', 'default', 'admin')").run();
  }
  const job = db.prepare("SELECT id FROM update_jobs WHERE id = 1").get();
  if (!job) {
    db.prepare(`
      INSERT INTO update_jobs (id, name, status, run_time, daily_limit, selection_rule, next_run_at)
      VALUES (1, '每日增强更新', 'PAUSED', '09:30', 1000, 'oldest_first', NULL)
    `).run();
  }
}

class DataStore {
  constructor(db, dbPath) {
    this.db = db;
    this.dbPath = dbPath;
  }

  close() {
    this.db.close();
  }

  generateLicenses(input = {}) {
    const customerName = String(input.customerName || input.customer || "").trim();
    if (!customerName) throw new Error("客户名不能为空");
    const quantity = Math.max(1, Math.min(500, Math.round(Number(input.quantity || 1))));
    const expiresAt = licenseExpiryFromInput(input);
    const durationDays = input.permanent || input.expiresAt ? null : Math.round(Number(input.durationDays || input.days || 0));
    const durationLabel = durationLabelFromInput(input, expiresAt);
    const generatedBy = String(input.generatedBy || "admin").trim() || "admin";
    const note = String(input.note || "").trim();
    const now = nowIso();
    const insert = this.db.prepare(`
      INSERT INTO licenses (
        license_id, product_id, code_hash, code_mask, customer_name, duration_label, duration_days,
        expires_at, status, generated_by, note, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '未激活', ?, ?, ?, ?)
    `);

    const run = this.db.transaction(() => {
      const licenses = [];
      for (let index = 0; index < quantity; index += 1) {
        let licenseCode = "";
        let result = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          licenseCode = generateLicenseCode();
          try {
            result = insert.run(
              crypto.randomUUID(),
              LICENSE_PRODUCT_ID,
              licenseCodeHash(licenseCode),
              licenseCodeMask(licenseCode),
              customerName,
              durationLabel,
              durationDays,
              expiresAt || null,
              generatedBy,
              note,
              now,
              now
            );
            break;
          } catch (error) {
            if (!/UNIQUE/.test(String(error && error.message))) throw error;
          }
        }
        if (!result) throw new Error("授权码生成失败，请重试");
        const row = this.db.prepare("SELECT * FROM licenses WHERE id = ?").get(result.lastInsertRowid);
        this.addLicenseEvent(row, {
          eventType: "generated",
          message: `生成授权码：${durationLabel}`,
          deviceInfo: { generatedBy, quantity }
        });
        licenses.push({ ...this.presentLicense(row), licenseCode });
      }
      return { count: licenses.length, licenses };
    });
    return run();
  }

  listLicenses(filters = {}) {
    const where = [];
    const params = {};
    if (filters.keyword) {
      where.push("(customer_name LIKE @keyword OR code_mask LIKE @keyword OR machine_code LIKE @keyword OR note LIKE @keyword)");
      params.keyword = `%${String(filters.keyword).trim()}%`;
    }
    if (filters.status) {
      where.push("status = @status");
      params.status = filters.status;
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = this.db.prepare(`
      SELECT l.*,
        (SELECT COUNT(1) FROM license_events e WHERE e.license_row_id = l.id) AS event_count
      FROM licenses l
      ${whereSql}
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT 500
    `).all(params);
    return { items: rows.map(row => this.presentLicense(row)) };
  }

  getLicense(id) {
    const row = this.db.prepare("SELECT * FROM licenses WHERE id = ?").get(id);
    if (!row) return null;
    const events = this.db.prepare("SELECT * FROM license_events WHERE license_row_id = ? ORDER BY created_at DESC, id DESC LIMIT 100")
      .all(id)
      .map(event => ({ ...event, device_info: parseJsonObject(event.device_info_json) }));
    return { ...this.presentLicense(row), events };
  }

  activateLicense(input = {}) {
    const licenseCode = normalizeLicenseCode(input.licenseCode || input.license_code);
    const machineCode = String(input.machineCode || input.machine_code || "").trim();
    if (!licenseCode) return { authorized: false, message: "授权码不能为空" };
    if (!machineCode) return { authorized: false, message: "机器码不能为空" };

    const now = nowIso();
    const row = this.db.prepare("SELECT * FROM licenses WHERE code_hash = ?").get(licenseCodeHash(licenseCode));
    if (!row) return { authorized: false, message: "授权码不存在或未登记" };
    if (row.product_id && row.product_id !== LICENSE_PRODUCT_ID) {
      this.addLicenseEvent(row, { ...input, eventType: "denied", message: "授权码不适用于当前工具" });
      return { authorized: false, message: "授权码不适用于当前工具" };
    }
    if (row.status === "已停用") {
      this.addLicenseEvent(row, { ...input, eventType: "denied", message: "授权码已停用" });
      return { authorized: false, message: "授权码已停用" };
    }
    if (row.expires_at && Date.now() > Date.parse(row.expires_at)) {
      this.db.prepare("UPDATE licenses SET status = '已过期', updated_at = ? WHERE id = ?").run(now, row.id);
      this.addLicenseEvent(row, { ...input, eventType: "denied", message: "授权码已过期" });
      return { authorized: false, message: "授权码已过期" };
    }
    if (row.machine_code && row.machine_code !== machineCode) {
      this.addLicenseEvent(row, { ...input, eventType: "denied", message: "授权码已在其他设备激活" });
      return { authorized: false, message: "授权码已在其他设备激活" };
    }

    const isFirstActivation = !row.machine_code;
    this.db.prepare(`
      UPDATE licenses
      SET status = '已激活',
          machine_code = COALESCE(machine_code, ?),
          activated_at = COALESCE(activated_at, ?),
          last_seen_at = ?,
          activation_count = activation_count + 1,
          updated_at = ?
      WHERE id = ?
    `).run(machineCode, now, now, now, row.id);
    const updated = this.db.prepare("SELECT * FROM licenses WHERE id = ?").get(row.id);
    this.addLicenseEvent(updated, {
      ...input,
      eventType: isFirstActivation ? "activated" : "login",
      message: isFirstActivation ? "首次激活成功" : "同设备登录成功"
    });
    return { authorized: true, license: this.presentLicense(updated) };
  }

  setLicenseStatus({ id, status, note = "", operator = "admin" }) {
    if (!LICENSE_STATUS_VALUES.has(status)) throw new Error("授权状态无效");
    const row = this.db.prepare("SELECT * FROM licenses WHERE id = ?").get(Number(id));
    if (!row) throw new Error("授权记录不存在");
    this.db.prepare("UPDATE licenses SET status = ?, note = COALESCE(NULLIF(?, ''), note), updated_at = ? WHERE id = ?")
      .run(status, String(note || "").trim(), nowIso(), row.id);
    const updated = this.db.prepare("SELECT * FROM licenses WHERE id = ?").get(row.id);
    this.addLicenseEvent(updated, {
      eventType: "status_changed",
      message: `授权状态改为：${status}`,
      deviceInfo: { operator }
    });
    return this.presentLicense(updated);
  }

  resetLicenseMachine({ id, operator = "admin" }) {
    const row = this.db.prepare("SELECT * FROM licenses WHERE id = ?").get(Number(id));
    if (!row) throw new Error("授权记录不存在");
    this.db.prepare(`
      UPDATE licenses
      SET machine_code = NULL, activated_at = NULL, last_seen_at = NULL, status = '未激活', updated_at = ?
      WHERE id = ?
    `).run(nowIso(), row.id);
    const updated = this.db.prepare("SELECT * FROM licenses WHERE id = ?").get(row.id);
    this.addLicenseEvent(updated, {
      eventType: "machine_reset",
      message: "已重置机器绑定",
      deviceInfo: { operator, previousMachineCode: row.machine_code || "" }
    });
    return this.presentLicense(updated);
  }

  licenseStats() {
    const total = this.db.prepare("SELECT COUNT(1) AS count FROM licenses").get().count;
    const byStatus = this.db.prepare("SELECT status, COUNT(1) AS count FROM licenses GROUP BY status").all();
    const recentEvents = this.db.prepare(`
      SELECT e.*, l.customer_name, l.code_mask
      FROM license_events e
      LEFT JOIN licenses l ON l.id = e.license_row_id
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT 20
    `).all().map(event => ({ ...event, device_info: parseJsonObject(event.device_info_json) }));
    return { total, byStatus, recentEvents };
  }

  addLicenseEvent(licenseRow, input = {}) {
    this.db.prepare(`
      INSERT INTO license_events (
        license_row_id, license_id, event_type, machine_code, app_version, ip, user_agent, device_info_json, message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      licenseRow ? licenseRow.id : null,
      licenseRow ? licenseRow.license_id : "",
      input.eventType || input.event_type || "event",
      input.machineCode || input.machine_code || "",
      input.appVersion || input.app_version || "",
      input.ip || "",
      input.userAgent || input.user_agent || "",
      json(input.deviceInfo || input.device_info || {}),
      input.message || ""
    );
  }

  importRecords(input = {}) {
    const run = this.db.transaction(() => {
      const batch = this.createBatch(input);
      const appended = this.appendRecordsToBatch({ batchId: batch.batchId, records: input.records || [] });
      this.finishBatch({
        batchId: batch.batchId,
        status: input.status || "完成",
        duplicateCount: input.duplicateCount || 0,
        emptyRecheckCount: input.emptyRecheckCount || 0,
        finishedAt: input.finishedAt || nowIso()
      });
      return { batchId: batch.batchId, imported: appended.imported, skipped: appended.skipped };
    });
    return run();
  }

  createBatch(input = {}) {
    const result = this.db.prepare(`
      INSERT INTO collect_batches (task_mode, collect_mode, source_name, max_pages, per_page_limit, status, total_collected, duplicate_count, empty_recheck_count, started_at, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, NULL)
    `).run(
      input.taskMode || "list",
      input.collectMode || "normal",
      input.sourceName || "",
      input.maxPages || null,
      input.perPageLimit || null,
      input.status || "采集中",
      input.startedAt || nowIso()
    );
    return { batchId: Number(result.lastInsertRowid) };
  }

  appendRecordsToBatch(input = {}) {
    const batchId = Number(input.batchId || 0);
    if (!batchId) throw new Error("缺少批次 ID");
    const batch = this.db.prepare("SELECT id FROM collect_batches WHERE id = ?").get(batchId);
    if (!batch) throw new Error("批次不存在");
    const records = (input.records || []).map(normalizeCollectorRecord).filter(record => record.blogger_id);
    const countTowardsBatch = input.countTowardsBatch !== false;
    const run = this.db.transaction(() => {
      let imported = 0;
      for (const record of records) {
        const existing = this.findExistingBlogger(record);
        const bloggerId = this.upsertBlogger(record, existing);
        const snapshotId = this.insertSnapshot(batchId, bloggerId, record);
        this.recordMcnChange({
          bloggerId,
          previousMcnStatus: existing && existing.mcn_status,
          currentMcnStatus: record.mcn_status,
          previousSnapshotId: existing && existing.latest_snapshot_id,
          currentSnapshotId: snapshotId,
          changedAt: record.collected_at || nowIso()
        });
        this.db.prepare("UPDATE bloggers SET latest_snapshot_id = ?, last_collected_at = ?, updated_at = ? WHERE id = ?")
          .run(snapshotId, record.collected_at || nowIso(), nowIso(), bloggerId);
        this.insertBatchItem(batchId, bloggerId, record);
        this.replaceCollectedTags(bloggerId, record);
        this.refreshSearch(bloggerId);
        imported += 1;
      }
      const counted = countTowardsBatch ? imported : 0;
      this.db.prepare("UPDATE collect_batches SET total_collected = total_collected + ?, status = CASE WHEN status = '完成' THEN '采集中' ELSE status END WHERE id = ?")
        .run(counted, batchId);
      return { batchId, imported, counted, skipped: (input.records || []).length - imported };
    });
    return run();
  }

  finishBatch(input = {}) {
    const batchId = Number(input.batchId || 0);
    if (!batchId) throw new Error("缺少批次 ID");
    this.db.prepare(`
      UPDATE collect_batches
      SET status = ?, duplicate_count = ?, empty_recheck_count = ?, finished_at = ?
      WHERE id = ?
    `).run(
      input.status || "完成",
      input.duplicateCount || 0,
      input.emptyRecheckCount || 0,
      input.finishedAt || nowIso(),
      batchId
    );
    return this.db.prepare("SELECT * FROM collect_batches WHERE id = ?").get(batchId);
  }

  upsertBlogger(record, existing = this.findExistingBlogger(record)) {
    const tags = json(record.tags || []);
    const contentTags = json(record.content_tags || []);
    const subContentTags = json(record.sub_content_tags || []);
    const featureTags = json(record.feature_tags || []);
    const timestamp = record.collected_at || nowIso();
    if (existing) {
      this.db.prepare(`
        UPDATE bloggers
        SET blogger_id = COALESCE(NULLIF(?, ''), blogger_id),
            blogger_url = COALESCE(NULLIF(?, ''), blogger_url),
            nickname = COALESCE(NULLIF(?, ''), nickname),
            red_id = COALESCE(NULLIF(?, ''), red_id),
            province = COALESCE(NULLIF(?, ''), province),
            city = COALESCE(NULLIF(?, ''), city),
            mcn_status = COALESCE(NULLIF(?, ''), mcn_status),
            tags_json = ?,
            content_tags_json = ?,
            sub_content_tags_json = ?,
            feature_tags_json = ?,
            first_collected_at = COALESCE(first_collected_at, ?),
            updated_at = ?
        WHERE id = ?
      `).run(
        record.blogger_id || "",
        record.blogger_url || "",
        record.nickname || "",
        record.red_id || "",
        record.province || "",
        record.city || "",
        record.mcn_status || "",
        tags,
        contentTags,
        subContentTags,
        featureTags,
        timestamp,
        nowIso(),
        existing.id
      );
      return existing.id;
    }
    const result = this.db.prepare(`
      INSERT INTO bloggers (blogger_id, blogger_url, nickname, red_id, province, city, mcn_status, tags_json, content_tags_json, sub_content_tags_json, feature_tags_json, first_collected_at, last_collected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.blogger_id || null,
      record.blogger_url || "",
      record.nickname || "",
      record.red_id || "",
      record.province || "",
      record.city || "",
      record.mcn_status || "",
      tags,
      contentTags,
      subContentTags,
      featureTags,
      timestamp,
      timestamp
    );
    return Number(result.lastInsertRowid);
  }

  findExistingBlogger(record) {
    if (record.blogger_id) {
      const byId = this.db.prepare("SELECT id, mcn_status, latest_snapshot_id FROM bloggers WHERE blogger_id = ?").get(record.blogger_id);
      if (byId) return byId;
    }
    if (record.red_id && record.nickname) {
      return this.db.prepare("SELECT id, mcn_status, latest_snapshot_id FROM bloggers WHERE red_id = ? AND nickname = ?").get(record.red_id, record.nickname);
    }
    return null;
  }

  insertSnapshot(batchId, bloggerId, record) {
    const fields = [
      "batch_id",
      "blogger_row_id",
      ...SNAPSHOT_FIELDS,
      "raw_json",
      "raw_api_json",
      "collected_at"
    ];
    const values = [
      batchId,
      bloggerId,
      ...SNAPSHOT_FIELDS.map(field => record[field] ?? null),
      json(record.normalized || record.raw || record),
      typeof record.raw_api_json === "string" ? record.raw_api_json : json(record.raw_api_json || {}),
      record.collected_at || nowIso()
    ];
    const result = this.db.prepare(`
      INSERT INTO blogger_snapshots (${fields.join(", ")})
      VALUES (${fields.map(() => "?").join(", ")})
    `).run(...values);
    return Number(result.lastInsertRowid);
  }

  recordMcnChange(input = {}) {
    const bloggerId = Number(input.bloggerId || 0);
    const currentRaw = String(input.currentMcnStatus || "").trim();
    if (!bloggerId || !currentRaw) return;
    const previousRaw = String(input.previousMcnStatus || "").trim();
    const previous = normalizeMcnForCompare(previousRaw);
    const current = normalizeMcnForCompare(currentRaw);
    if (previous === current) return;
    if (!meaningfulMcn(previousRaw) && !meaningfulMcn(currentRaw)) return;
    this.db.prepare(`
      INSERT INTO blogger_mcn_history (
        blogger_row_id, previous_mcn_status, current_mcn_status,
        previous_snapshot_id, current_snapshot_id, changed_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      bloggerId,
      previousRaw || "未记录",
      currentRaw,
      input.previousSnapshotId || null,
      input.currentSnapshotId || null,
      input.changedAt || nowIso()
    );
  }

  insertBatchItem(batchId, bloggerId, record) {
    this.db.prepare(`
      INSERT INTO batch_items (batch_id, blogger_row_id, seed_nickname, page_no, rank_in_page, status, missing_fields, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      batchId,
      bloggerId,
      record.seed_nickname || "",
      record.page_no || "",
      record.rank_in_page || "",
      record.detail_collect_status || "成功",
      record.detail_missing_fields || "",
      record.error_message || ""
    );
  }

  replaceCollectedTags(bloggerId, record) {
    const insert = this.db.prepare("INSERT OR IGNORE INTO blogger_tags (blogger_row_id, tag_type, tag_name, source) VALUES (?, ?, ?, ?)");
    for (const [type, tags] of [
      ["列表标签", record.tags],
      ["内容大类", record.content_tags],
      ["内容细分", record.sub_content_tags],
      ["账号特征", record.feature_tags]
    ]) {
      for (const tag of tags || []) insert.run(bloggerId, type, tag, "采集");
    }
  }

  latestSelect() {
    const snapshotFields = SNAPSHOT_FIELDS.map(field => {
      if (field === "red_id") return "COALESCE(NULLIF(s.red_id, ''), b.red_id) AS red_id";
      if (field === "mcn_status") return "COALESCE(NULLIF(s.mcn_status, ''), b.mcn_status) AS mcn_status";
      return `s.${field}`;
    }).join(",\n      ");
    return `
      b.*,
      ${snapshotFields},
      CASE WHEN s.recent_note_count > 0 THEN s.coop_30_note_count * 1.0 / s.recent_note_count ELSE NULL END AS commercial_order_rate,
      s.raw_json AS latest_raw_json,
      s.raw_api_json AS latest_raw_api_json,
      s.collected_at AS latest_collected_at,
      (SELECT COUNT(1) FROM blogger_notes n WHERE n.blogger_row_id = b.id) AS note_count
    `;
  }

  listBloggers(filters = {}) {
    const where = [];
    const params = {};
    const joins = ["LEFT JOIN blogger_snapshots s ON s.id = b.latest_snapshot_id"];

    if (filters.keyword) {
      joins.push("JOIN blogger_search fts ON fts.rowid = b.id");
      where.push("blogger_search MATCH @keyword");
      params.keyword = `"${String(filters.keyword).replace(/"/g, "\"\"")}"*`;
    }
    if (filters.province) {
      where.push("b.province = @province");
      params.province = filters.province;
    }
    if (filters.city) {
      where.push("b.city = @city");
      params.city = filters.city;
    }
    for (const [key, column] of [
      ["fansMin", "s.fans_count"],
      ["readMin", "s.read_median"],
      ["interactionMin", "s.interaction_median"],
      ["priceMin", "s.image_note_price"],
      ["coop30Min", "s.coop_30_note_count"],
      ["coop90Min", "s.coop_90_note_count"]
    ]) {
      if (filters[key] !== undefined && filters[key] !== "" && filters[key] !== null) {
        where.push(`${column} >= @${key}`);
        params[key] = Number(filters[key]);
      }
    }
    for (const [key, column] of [
      ["fansMax", "s.fans_count"],
      ["readMax", "s.read_median"],
      ["interactionMax", "s.interaction_median"],
      ["priceMax", "s.image_note_price"]
    ]) {
      if (filters[key] !== undefined && filters[key] !== "" && filters[key] !== null) {
        where.push(`${column} <= @${key}`);
        params[key] = Number(filters[key]);
      }
    }
    if (filters.statuses && filters.statuses.length) {
      where.push(`b.collab_status IN (${filters.statuses.map((_, index) => `@status${index}`).join(",")})`);
      filters.statuses.forEach((status, index) => { params[`status${index}`] = status; });
    }
    if (filters.tags && filters.tags.length) {
      filters.tags.forEach((tag, index) => {
        where.push(`EXISTS (SELECT 1 FROM blogger_tags t${index} WHERE t${index}.blogger_row_id = b.id AND t${index}.tag_name = @tag${index})`);
        params[`tag${index}`] = tag;
      });
    }
    if (filters.batchId) {
      where.push("EXISTS (SELECT 1 FROM batch_items bi WHERE bi.blogger_row_id = b.id AND bi.batch_id = @batchId)");
      params.batchId = Number(filters.batchId);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const allowedSort = new Map([
      ["last_collected_at", "b.last_collected_at"],
      ["fans_count", "s.fans_count"],
      ["fans_growth_num", "s.fans_growth_num"],
      ["read_median", "s.read_median"],
      ["interaction_median", "s.interaction_median"],
      ["image_note_price", "s.image_note_price"],
      ["coop_30_note_count", "s.coop_30_note_count"],
      ["recent_note_count", "s.recent_note_count"],
      ["commercial_order_rate", "CASE WHEN s.recent_note_count > 0 THEN s.coop_30_note_count * 1.0 / s.recent_note_count ELSE NULL END"],
      ["nickname", "b.nickname"]
    ]);
    const sortBy = allowedSort.get(filters.sortBy) || "b.last_collected_at";
    const sortDir = String(filters.sortDir || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const page = Math.max(1, Number(filters.page || 1));
    const pageSize = Math.min(200, Math.max(10, Number(filters.pageSize || 50)));
    params.limit = pageSize;
    params.offset = (page - 1) * pageSize;

    const base = `FROM bloggers b ${joins.join(" ")} ${whereSql}`;
    const total = this.db.prepare(`SELECT COUNT(DISTINCT b.id) AS total ${base}`).get(params).total;
    const items = this.db.prepare(`
      SELECT ${this.latestSelect()}
      ${base}
      GROUP BY b.id
      ORDER BY ${sortBy} ${sortDir} NULLS LAST, b.id DESC
      LIMIT @limit OFFSET @offset
    `).all(params).map(row => this.presentBlogger(row));
    return { total, page, pageSize, items };
  }

  getBlogger(id) {
    const row = this.db.prepare(`
      SELECT ${this.latestSelect()}
      FROM bloggers b
      LEFT JOIN blogger_snapshots s ON s.id = b.latest_snapshot_id
      WHERE b.id = ?
    `).get(id);
    if (!row) return null;
    const snapshots = this.db.prepare("SELECT * FROM blogger_snapshots WHERE blogger_row_id = ? ORDER BY collected_at DESC, id DESC").all(id);
    const notes = this.db.prepare(`
      SELECT n.*, u.name AS user_name FROM blogger_notes n
      LEFT JOIN users u ON u.id = n.user_id
      WHERE n.blogger_row_id = ?
      ORDER BY n.created_at DESC, n.id DESC
    `).all(id);
    const batches = this.db.prepare(`
      SELECT cb.*, bi.page_no, bi.rank_in_page, bi.status AS item_status
      FROM batch_items bi
      JOIN collect_batches cb ON cb.id = bi.batch_id
      WHERE bi.blogger_row_id = ?
      ORDER BY cb.started_at DESC
    `).all(id);
    const tags = this.db.prepare("SELECT * FROM blogger_tags WHERE blogger_row_id = ? ORDER BY tag_type, tag_name").all(id);
    const audits = this.db.prepare(`
      SELECT a.*, u.name AS user_name FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.target_type = 'blogger' AND a.target_id = ?
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT 50
    `).all(id);
    const mcnHistory = this.db.prepare(`
      SELECT * FROM blogger_mcn_history
      WHERE blogger_row_id = ?
      ORDER BY changed_at DESC, id DESC
      LIMIT 50
    `).all(id);
    return { ...this.presentBlogger(row), snapshots, notes, batches, tags, audits, mcn_history: mcnHistory };
  }

  addNote({ bloggerId, userId = 1, content, status = "", nextFollowAt = "" }) {
    const result = this.db.prepare(`
      INSERT INTO blogger_notes (blogger_row_id, user_id, content, status, next_follow_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(bloggerId, userId, String(content || "").trim(), status || null, nextFollowAt || null);
    if (status && STATUS_VALUES.has(status)) this.setBloggerStatus({ bloggerId, status, userId });
    this.audit(userId, "add_note", "blogger", bloggerId, { noteId: result.lastInsertRowid, status });
    this.refreshSearch(bloggerId);
    return this.db.prepare("SELECT * FROM blogger_notes WHERE id = ?").get(result.lastInsertRowid);
  }

  updateNote({ noteId, userId = 1, content, status = "", nextFollowAt = "" }) {
    const existing = this.db.prepare("SELECT * FROM blogger_notes WHERE id = ?").get(noteId);
    if (!existing) throw new Error("备注不存在");
    this.db.prepare(`
      UPDATE blogger_notes
      SET content = ?, status = ?, next_follow_at = ?, updated_at = ?
      WHERE id = ?
    `).run(String(content || "").trim(), status || null, nextFollowAt || null, nowIso(), noteId);
    if (status && STATUS_VALUES.has(status)) this.setBloggerStatus({ bloggerId: existing.blogger_row_id, status, userId });
    this.audit(userId, "update_note", "blogger", existing.blogger_row_id, { noteId, status });
    this.refreshSearch(existing.blogger_row_id);
    return this.db.prepare("SELECT * FROM blogger_notes WHERE id = ?").get(noteId);
  }

  deleteNote({ noteId, userId = 1 }) {
    const existing = this.db.prepare("SELECT * FROM blogger_notes WHERE id = ?").get(noteId);
    if (!existing) return { ok: true };
    this.db.prepare("DELETE FROM blogger_notes WHERE id = ?").run(noteId);
    this.audit(userId, "delete_note", "blogger", existing.blogger_row_id, { noteId });
    this.refreshSearch(existing.blogger_row_id);
    return { ok: true };
  }

  deleteBlogger({ bloggerId, userId = 1 }) {
    const id = Number(bloggerId);
    if (!id) throw new Error("博主ID无效");
    const existing = this.db.prepare("SELECT * FROM bloggers WHERE id = ?").get(id);
    if (!existing) return { ok: true, deleted: null };

    const run = this.db.transaction(() => {
      const deleted = this.presentBlogger(existing);
      this.audit(userId, "delete_blogger", "blogger", id, {
        blogger_id: existing.blogger_id || "",
        red_id: existing.red_id || "",
        nickname: existing.nickname || ""
      });
      this.db.prepare("DELETE FROM blogger_search WHERE rowid = ?").run(id);
      this.db.prepare("DELETE FROM bloggers WHERE id = ?").run(id);
      return { ok: true, deleted };
    });
    return run();
  }

  setBloggerStatus({ bloggerId, status, userId = 1 }) {
    const normalized = STATUS_VALUES.has(status) ? status : "未跟进";
    this.db.prepare("UPDATE bloggers SET collab_status = ?, updated_at = ? WHERE id = ?").run(normalized, nowIso(), bloggerId);
    this.audit(userId, "set_status", "blogger", bloggerId, { status: normalized });
    return this.getBlogger(bloggerId);
  }

  nextRunAt(runTime, fromDate = new Date()) {
    const match = String(runTime || "09:30").match(/^(\d{1,2}):(\d{2})$/);
    const hour = Math.min(23, Math.max(0, Number(match ? match[1] : 9)));
    const minute = Math.min(59, Math.max(0, Number(match ? match[2] : 30)));
    const next = new Date(fromDate);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= fromDate.getTime()) next.setDate(next.getDate() + 1);
    return next.toISOString();
  }

  getUpdateJob() {
    return this.db.prepare(`
      SELECT j.*,
        (SELECT COUNT(1) FROM bloggers b WHERE b.blogger_id IS NOT NULL AND b.blogger_id != '') AS candidate_pool_count
      FROM update_jobs j
      WHERE j.id = 1
    `).get();
  }

  saveUpdateJob(input = {}) {
    const runTime = String(input.runTime || input.run_time || "09:30").trim();
    if (!/^\d{1,2}:\d{2}$/.test(runTime)) throw new Error("更新时间需要使用 HH:mm 格式");
    const dailyLimit = Math.max(1, Math.min(5000, Math.round(Number(input.dailyLimit || input.daily_limit || 1000))));
    const status = String(input.status || "PAUSED").toUpperCase() === "ACTIVE" ? "ACTIVE" : "PAUSED";
    const now = nowIso();
    const nextRun = status === "ACTIVE" ? this.nextRunAt(runTime) : null;
    this.db.prepare(`
      UPDATE update_jobs
      SET status = ?, run_time = ?, daily_limit = ?, next_run_at = ?, updated_at = ?
      WHERE id = 1
    `).run(status, runTime, dailyLimit, nextRun, now);
    return this.getUpdateJob();
  }

  dueUpdateJob() {
    const now = nowIso();
    return this.db.prepare(`
      SELECT * FROM update_jobs
      WHERE id = 1 AND status = 'ACTIVE' AND next_run_at IS NOT NULL AND next_run_at <= ?
    `).get(now) || null;
  }

  listUpdateCandidates(limit = 1000) {
    const safeLimit = Math.max(1, Math.min(5000, Math.round(Number(limit || 1000))));
    return this.db.prepare(`
      SELECT ${this.latestSelect()}
      FROM bloggers b
      LEFT JOIN blogger_snapshots s ON s.id = b.latest_snapshot_id
      WHERE b.blogger_id IS NOT NULL AND b.blogger_id != ''
      ORDER BY
        CASE WHEN b.last_collected_at IS NULL OR b.last_collected_at = '' THEN 0 ELSE 1 END,
        b.last_collected_at ASC,
        b.id ASC
      LIMIT ?
    `).all(safeLimit).map(row => this.presentBlogger(row));
  }

  createUpdateRun(input = {}) {
    const jobId = Number(input.jobId || input.job_id || 1);
    const totalTarget = Math.max(0, Math.round(Number(input.totalTarget || input.total_target || 0)));
    const now = nowIso();
    const result = this.db.prepare(`
      INSERT INTO update_job_runs (job_id, batch_id, status, total_target, message, started_at, updated_at)
      VALUES (?, ?, '运行中', ?, ?, ?, ?)
    `).run(jobId, input.batchId || input.batch_id || null, totalTarget, input.message || "", now, now);
    this.db.prepare("UPDATE update_jobs SET last_run_at = ?, next_run_at = ?, updated_at = ? WHERE id = ?")
      .run(now, this.nextRunAt(this.getUpdateJob()?.run_time || "09:30", new Date()), now, jobId);
    return this.getUpdateRun(Number(result.lastInsertRowid));
  }

  getUpdateRun(id) {
    return this.db.prepare("SELECT * FROM update_job_runs WHERE id = ?").get(Number(id));
  }

  getUpdateRunDetail(id, options = {}) {
    const run = this.getUpdateRun(id);
    if (!run) return null;
    const limit = Math.max(1, Math.min(500, Number(options.limit || 120)));
    const failedWhere = `
      (
        bi.status NOT IN ('成功', '完成')
        OR NULLIF(bi.missing_fields, '') IS NOT NULL
        OR NULLIF(bi.error_message, '') IS NOT NULL
      )
    `;
    const selectSql = `
      SELECT bi.*, b.nickname, b.blogger_id, b.red_id, b.blogger_url, b.last_collected_at
      FROM batch_items bi
      LEFT JOIN bloggers b ON b.id = bi.blogger_row_id
      WHERE bi.batch_id = ?
    `;
    const items = run.batch_id
      ? this.db.prepare(`${selectSql} ORDER BY bi.id DESC LIMIT ?`).all(run.batch_id, limit)
      : [];
    const failedItems = run.batch_id
      ? this.db.prepare(`${selectSql} AND ${failedWhere} ORDER BY bi.id ASC LIMIT 200`).all(run.batch_id)
      : [];
    return { run, items, failedItems };
  }

  updateUpdateRun(input = {}) {
    const id = Number(input.id || input.runId || input.run_id || 0);
    if (!id) throw new Error("缺少更新任务运行 ID");
    const existing = this.getUpdateRun(id);
    if (!existing) throw new Error("更新任务运行记录不存在");
    const status = input.status || existing.status;
    const finishedAt = ["完成", "异常", "中止"].includes(status) ? (input.finishedAt || input.finished_at || nowIso()) : existing.finished_at;
    this.db.prepare(`
      UPDATE update_job_runs
      SET status = ?,
          batch_id = COALESCE(?, batch_id),
          total_target = ?,
          processed_count = ?,
          success_count = ?,
          failed_count = ?,
          skipped_count = ?,
          message = ?,
          finished_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      status,
      input.batchId || input.batch_id || null,
      input.totalTarget ?? input.total_target ?? existing.total_target,
      input.processedCount ?? input.processed_count ?? existing.processed_count,
      input.successCount ?? input.success_count ?? existing.success_count,
      input.failedCount ?? input.failed_count ?? existing.failed_count,
      input.skippedCount ?? input.skipped_count ?? existing.skipped_count,
      input.message ?? existing.message,
      finishedAt,
      nowIso(),
      id
    );
    return this.getUpdateRun(id);
  }

  listUpdateRuns(limit = 20) {
    return this.db.prepare("SELECT * FROM update_job_runs ORDER BY started_at DESC, id DESC LIMIT ?")
      .all(Math.max(1, Math.min(100, Number(limit || 20))));
  }

  listBatches() {
    return this.db.prepare("SELECT * FROM collect_batches ORDER BY started_at DESC, id DESC LIMIT 200").all();
  }

  listUsers() {
    return this.db.prepare("SELECT id, name, login_name, role, status, created_at FROM users ORDER BY id").all();
  }

  addUser({ name, loginName, role = "staff" }) {
    const cleanName = String(name || "").trim();
    const cleanLogin = String(loginName || cleanName || "").trim();
    if (!cleanName || !cleanLogin) throw new Error("员工姓名不能为空");
    const result = this.db.prepare(`
      INSERT INTO users (name, login_name, role, status)
      VALUES (?, ?, ?, 'active')
      ON CONFLICT(login_name) DO UPDATE SET name = excluded.name, role = excluded.role, status = 'active', updated_at = CURRENT_TIMESTAMP
    `).run(cleanName, cleanLogin, role || "staff");
    return this.db.prepare("SELECT id, name, login_name, role, status FROM users WHERE login_name = ?")
      .get(cleanLogin) || this.db.prepare("SELECT id, name, login_name, role, status FROM users WHERE id = ?").get(result.lastInsertRowid);
  }

  audit(userId, action, targetType, targetId, payload) {
    this.db.prepare("INSERT INTO audit_logs (user_id, action, target_type, target_id, payload_json) VALUES (?, ?, ?, ?, ?)")
      .run(userId || null, action, targetType, targetId, json(payload || {}));
  }

  refreshSearch(bloggerId) {
    const blogger = this.db.prepare("SELECT * FROM bloggers WHERE id = ?").get(bloggerId);
    if (!blogger) return;
    const tags = this.db.prepare("SELECT tag_name FROM blogger_tags WHERE blogger_row_id = ?").all(bloggerId).map(row => row.tag_name).join(" ");
    const notes = this.db.prepare("SELECT content FROM blogger_notes WHERE blogger_row_id = ?").all(bloggerId).map(row => row.content).join(" ");
    this.db.prepare("DELETE FROM blogger_search WHERE rowid = ?").run(bloggerId);
    this.db.prepare("INSERT INTO blogger_search (rowid, nickname, red_id, mcn_status, tags, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .run(bloggerId, blogger.nickname || "", blogger.red_id || "", blogger.mcn_status || "", tags, notes);
  }

  presentBlogger(row) {
    const parse = value => {
      try { return JSON.parse(value || "[]"); } catch (_) { return []; }
    };
    const commercialOrderRate = row.commercial_order_rate != null
      ? row.commercial_order_rate
      : Number(row.recent_note_count) > 0
        ? Number(row.coop_30_note_count || 0) / Number(row.recent_note_count)
        : null;
    return {
      ...row,
      commercial_order_rate: commercialOrderRate,
      tags: parse(row.tags_json),
      content_tags: parse(row.content_tags_json),
      sub_content_tags: parse(row.sub_content_tags_json),
      feature_tags: parse(row.feature_tags_json)
    };
  }

  presentLicense(row) {
    if (!row) return null;
    return {
      id: row.id,
      license_id: row.license_id,
      product_id: row.product_id,
      code_mask: row.code_mask,
      customer_name: row.customer_name,
      duration_label: row.duration_label,
      duration_days: row.duration_days,
      expires_at: row.expires_at,
      status: row.status,
      machine_code: row.machine_code,
      activated_at: row.activated_at,
      last_seen_at: row.last_seen_at,
      activation_count: row.activation_count,
      generated_by: row.generated_by,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
      event_count: row.event_count || 0
    };
  }
}

module.exports = { createDataStore };
