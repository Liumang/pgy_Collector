const express = require("express");
const path = require("path");
const { createDataStore } = require("./db");
const { parseCsvText, normalizeCollectorRecord } = require("./importer");
const { bloggersToCsv } = require("./exporter");

const PORT = Number(process.env.PGY_DATA_CONSOLE_PORT || 3188);
const HOST = process.env.PGY_DATA_CONSOLE_HOST || "127.0.0.1";
const LICENSE_ADMIN_ENABLED = ["1", "true", "yes"].includes(String(process.env.PGY_LICENSE_ADMIN_ENABLED || "").toLowerCase());

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(parseList);
  return String(value).split(",").map(item => item.trim()).filter(Boolean);
}

function parseFilters(query) {
  return {
    keyword: query.keyword || "",
    province: query.province || "",
    city: query.city || "",
    tags: parseList(query.tags),
    statuses: parseList(query.statuses),
    batchId: query.batchId || "",
    fansMin: query.fansMin,
    fansMax: query.fansMax,
    readMin: query.readMin,
    readMax: query.readMax,
    interactionMin: query.interactionMin,
    interactionMax: query.interactionMax,
    priceMin: query.priceMin,
    priceMax: query.priceMax,
    coop30Min: query.coop30Min,
    coop90Min: query.coop90Min,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    page: query.page,
    pageSize: query.pageSize
  };
}

function requestIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "";
}

function licenseRequestMeta(req) {
  return {
    ip: requestIp(req),
    userAgent: req.headers["user-agent"] || "",
    appVersion: req.body.appVersion || req.body.app_version || "",
    machineCode: req.body.machineCode || req.body.machine_code || "",
    deviceInfo: req.body.deviceInfo || req.body.device_info || {}
  };
}

function requireLicenseAdmin(_req, res, next) {
  if (!LICENSE_ADMIN_ENABLED) return res.status(404).json({ message: "授权管理后台未启用" });
  return next();
}

function createApp(options = {}) {
  const app = express();
  const store = options.store || createDataStore({ dbPath: options.dbPath });

  app.disable("x-powered-by");
  app.use(express.json({ limit: "20mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, dbPath: store.dbPath });
  });

  app.get("/api/config", (_req, res) => {
    res.json({
      ok: true,
      licenseAdminEnabled: LICENSE_ADMIN_ENABLED
    });
  });

  app.get("/api/bloggers", (req, res, next) => {
    try {
      res.json(store.listBloggers(parseFilters(req.query)));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bloggers/export", (req, res, next) => {
    try {
      const result = store.listBloggers({ ...parseFilters(req.query), page: 1, pageSize: 20000 });
      res.setHeader("content-type", "text/csv; charset=utf-8");
      res.setHeader("content-disposition", `attachment; filename="pgy_bloggers_${Date.now()}.csv"`);
      res.send(bloggersToCsv(result.items));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bloggers/:id", (req, res, next) => {
    try {
      const detail = store.getBlogger(Number(req.params.id));
      if (!detail) return res.status(404).json({ message: "博主不存在" });
      return res.json(detail);
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/bloggers/:id", (req, res, next) => {
    try {
      res.json(store.deleteBlogger({
        bloggerId: Number(req.params.id),
        userId: Number(req.query.userId || 1)
      }));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/bloggers/:id/notes", (req, res, next) => {
    try {
      const content = String(req.body.content || "").trim();
      if (!content) return res.status(400).json({ message: "备注不能为空" });
      const note = store.addNote({
        bloggerId: Number(req.params.id),
        userId: Number(req.body.userId || 1),
        content,
        status: req.body.status || "",
        nextFollowAt: req.body.nextFollowAt || ""
      });
      return res.json(note);
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/notes/:id", (req, res, next) => {
    try {
      res.json(store.updateNote({
        noteId: Number(req.params.id),
        userId: Number(req.body.userId || 1),
        content: req.body.content || "",
        status: req.body.status || "",
        nextFollowAt: req.body.nextFollowAt || ""
      }));
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/notes/:id", (req, res, next) => {
    try {
      res.json(store.deleteNote({
        noteId: Number(req.params.id),
        userId: Number(req.query.userId || 1)
      }));
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/bloggers/:id/status", (req, res, next) => {
    try {
      res.json(store.setBloggerStatus({
        bloggerId: Number(req.params.id),
        status: req.body.status || "未跟进",
        userId: Number(req.body.userId || 1)
      }));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/batches", (_req, res, next) => {
    try {
      res.json({ items: store.listBatches() });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/update-job", (_req, res, next) => {
    try {
      res.json({
        ok: true,
        job: store.getUpdateJob(),
        runs: store.listUpdateRuns(10)
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/update-job", (req, res, next) => {
    try {
      res.json({ ok: true, job: store.saveUpdateJob(req.body || {}) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/update-job/due", (_req, res, next) => {
    try {
      res.json({ ok: true, job: store.dueUpdateJob() });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/update-job/candidates", (req, res, next) => {
    try {
      const limit = Number(req.query.limit || store.getUpdateJob()?.daily_limit || 1000);
      res.json({ ok: true, items: store.listUpdateCandidates(limit) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/update-job/runs", (req, res, next) => {
    try {
      res.json({ ok: true, run: store.createUpdateRun(req.body || {}) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/update-job/runs/:id", (req, res, next) => {
    try {
      const detail = store.getUpdateRunDetail(Number(req.params.id), { limit: req.query.limit || 120 });
      if (!detail) return res.status(404).json({ message: "更新任务运行记录不存在" });
      return res.json({ ok: true, ...detail });
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/update-job/runs/:id", (req, res, next) => {
    try {
      res.json({ ok: true, run: store.updateUpdateRun({ ...(req.body || {}), id: Number(req.params.id) }) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users", (_req, res, next) => {
    try {
      res.json({ items: store.listUsers() });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", (req, res, next) => {
    try {
      res.json(store.addUser({
        name: req.body.name || "",
        loginName: req.body.loginName || "",
        role: req.body.role || "staff"
      }));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/licenses", requireLicenseAdmin, (req, res, next) => {
    try {
      res.json(store.listLicenses({
        keyword: req.query.keyword || "",
        status: req.query.status || ""
      }));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/licenses/stats", requireLicenseAdmin, (_req, res, next) => {
    try {
      res.json(store.licenseStats());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/licenses/:id", requireLicenseAdmin, (req, res, next) => {
    try {
      const detail = store.getLicense(Number(req.params.id));
      if (!detail) return res.status(404).json({ message: "授权记录不存在" });
      return res.json(detail);
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/licenses/generate", requireLicenseAdmin, (req, res, next) => {
    try {
      res.json({ ok: true, ...store.generateLicenses(req.body || {}) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/licenses/activate", requireLicenseAdmin, (req, res, next) => {
    try {
      const result = store.activateLicense({
        ...(req.body || {}),
        ...licenseRequestMeta(req)
      });
      res.status(result.authorized ? 200 : 403).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/licenses/:id/status", requireLicenseAdmin, (req, res, next) => {
    try {
      res.json(store.setLicenseStatus({
        id: Number(req.params.id),
        status: req.body.status || "",
        note: req.body.note || "",
        operator: req.body.operator || "admin"
      }));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/licenses/:id/reset-machine", requireLicenseAdmin, (req, res, next) => {
    try {
      res.json(store.resetLicenseMachine({
        id: Number(req.params.id),
        operator: req.body.operator || "admin"
      }));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/import", (req, res, next) => {
    try {
      const records = (req.body.records || []).map(normalizeCollectorRecord);
      const result = store.importRecords({
        records,
        taskMode: req.body.taskMode || "list",
        collectMode: req.body.collectMode || "normal",
        sourceName: req.body.sourceName || "采集助手写入",
        maxPages: req.body.maxPages || null,
        perPageLimit: req.body.perPageLimit || null,
        duplicateCount: req.body.duplicateCount || 0,
        emptyRecheckCount: req.body.emptyRecheckCount || 0,
        startedAt: req.body.startedAt || undefined,
        finishedAt: req.body.finishedAt || undefined
      });
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/batches", (req, res, next) => {
    try {
      res.json({ ok: true, ...store.createBatch({
        taskMode: req.body.taskMode || "list",
        collectMode: req.body.collectMode || "normal",
        sourceName: req.body.sourceName || "采集助手写入",
        maxPages: req.body.maxPages || null,
        perPageLimit: req.body.perPageLimit || null,
        startedAt: req.body.startedAt || undefined
      }) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/batches/:id/records", (req, res, next) => {
    try {
      res.json({ ok: true, ...store.appendRecordsToBatch({
        batchId: Number(req.params.id),
        records: (req.body.records || []).map(normalizeCollectorRecord),
        countTowardsBatch: req.body.countTowardsBatch !== false
      }) });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/batches/:id/finish", (req, res, next) => {
    try {
      res.json({ ok: true, batch: store.finishBatch({
        batchId: Number(req.params.id),
        status: req.body.status || "完成",
        duplicateCount: req.body.duplicateCount || 0,
        emptyRecheckCount: req.body.emptyRecheckCount || 0,
        finishedAt: req.body.finishedAt || undefined
      }) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/import-csv", (req, res, next) => {
    try {
      const rows = parseCsvText(req.body.text || "");
      const result = store.importRecords({
        records: rows.map(normalizeCollectorRecord),
        taskMode: req.body.taskMode || "csv",
        collectMode: req.body.collectMode || "unknown",
        sourceName: req.body.sourceName || "历史 CSV 导入"
      });
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: error && error.message ? error.message : "服务器异常" });
  });

  return { app, store };
}

async function attachFrontend(app) {
  if (process.env.NODE_ENV === "production" || process.env.PGY_DATA_CONSOLE_STATIC === "1") {
    const distDir = path.join(__dirname, "..", "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
    return;
  }
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: path.join(__dirname, ".."),
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

async function start() {
  const { app } = createApp();
  await attachFrontend(app);
  app.listen(PORT, HOST, () => {
    console.log(`PGY data console running at http://${HOST}:${PORT}`);
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { createApp, parseFilters };
