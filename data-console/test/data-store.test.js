const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createDataStore } = require("../src/db");
const { normalizeCollectorRecord, parseCsvText } = require("../src/importer");

function tempDbPath(name) {
  return path.join(os.tmpdir(), `pgy-data-console-${Date.now()}-${Math.random().toString(16).slice(2)}-${name}.db`);
}

test("imports duplicate blogger into one blogger with multiple snapshots", () => {
  const store = createDataStore({ dbPath: tempDbPath("dedupe") });
  try {
    const first = normalizeCollectorRecord({
      "博主昵称": "王清早",
      "博主ID": "abc123",
      "小红书号": "red001",
      "省": "浙江",
      "市": "杭州",
      "粉丝数": "51000",
      "阅读中位数": "36510",
      "互动中位数": "954",
      "图文笔记一口价": "4600",
      "标签": "美食|探店",
      "采集时间": "2026-05-25 10:00:00"
    });
    const second = normalizeCollectorRecord({
      ...first.raw,
      "粉丝数": "52000",
      "采集时间": "2026-05-25 11:00:00"
    });

    const batchA = store.importRecords({ records: [first], collectMode: "normal", taskMode: "list", sourceName: "测试A" });
    const batchB = store.importRecords({ records: [second], collectMode: "normal", taskMode: "list", sourceName: "测试B" });
    const bloggers = store.listBloggers({ keyword: "王清早" });
    const detail = store.getBlogger(bloggers.items[0].id);

    assert.equal(batchA.imported, 1);
    assert.equal(batchB.imported, 1);
    assert.equal(bloggers.total, 1);
    assert.equal(bloggers.items[0].fans_count, 52000);
    assert.equal(detail.snapshots.length, 2);
  } finally {
    store.close();
  }
});

test("skips collector records without blogger id", () => {
  const store = createDataStore({ dbPath: tempDbPath("require-blogger-id") });
  try {
    const result = store.importRecords({
      records: [
        normalizeCollectorRecord({
          "博主昵称": "没有ID的博主",
          "粉丝数": "10w",
          "阅读中位数": "12345"
        })
      ],
      collectMode: "normal",
      taskMode: "nickname",
      sourceName: "缺ID测试"
    });

    assert.equal(result.imported, 0);
    assert.equal(result.skipped, 1);
    assert.equal(store.listBloggers({ keyword: "没有ID" }).total, 0);
  } finally {
    store.close();
  }
});

test("filters bloggers by keyword, numeric range, tags, status and notes", () => {
  const store = createDataStore({ dbPath: tempDbPath("filters") });
  try {
    const records = [
      normalizeCollectorRecord({
        "博主昵称": "美食小王",
        "博主ID": "food001",
        "标签": "美食|探店",
        "粉丝数": "80000",
        "互动中位数": "1200",
        "图文笔记一口价": "5000"
      }),
      normalizeCollectorRecord({
        "博主昵称": "穿搭小李",
        "博主ID": "fashion001",
        "标签": "穿搭",
        "粉丝数": "20000",
        "互动中位数": "300",
        "图文笔记一口价": "1800"
      })
    ];

    store.importRecords({ records, collectMode: "normal", taskMode: "list", sourceName: "筛选测试" });
    const food = store.listBloggers({ keyword: "美食", tags: ["探店"], fansMin: 50000, interactionMin: 1000 });
    assert.equal(food.total, 1);
    assert.equal(food.items[0].nickname, "美食小王");

    const bloggerId = food.items[0].id;
    store.addNote({ bloggerId, userId: 1, content: "预算合适，优先联系", status: "待联系" });
    store.setBloggerStatus({ bloggerId, status: "待联系", userId: 1 });
    const noted = store.listBloggers({ keyword: "预算", statuses: ["待联系"] });
    assert.equal(noted.total, 1);
    assert.equal(noted.items[0].collab_status, "待联系");
  } finally {
    store.close();
  }
});

test("manages staff notes with create, update and delete", () => {
  const store = createDataStore({ dbPath: tempDbPath("notes") });
  try {
    const user = store.addUser({ name: "运营A", loginName: "staff-a", role: "staff" });
    store.importRecords({
      records: [normalizeCollectorRecord({ "博主昵称": "备注测试", "博主ID": "note001" })],
      collectMode: "normal",
      taskMode: "list",
      sourceName: "备注测试"
    });
    const blogger = store.listBloggers({ keyword: "备注测试" }).items[0];
    const note = store.addNote({ bloggerId: blogger.id, userId: user.id, content: "初始备注", status: "待联系" });
    const updated = store.updateNote({ noteId: note.id, userId: user.id, content: "更新后的备注", status: "已合作" });
    assert.equal(updated.content, "更新后的备注");
    assert.equal(store.getBlogger(blogger.id).collab_status, "已合作");

    store.deleteNote({ noteId: note.id, userId: user.id });
    assert.equal(store.getBlogger(blogger.id).notes.length, 0);
  } finally {
    store.close();
  }
});

test("deletes a blogger and removes dependent local data", () => {
  const store = createDataStore({ dbPath: tempDbPath("delete-blogger") });
  try {
    const batch = store.importRecords({
      records: [normalizeCollectorRecord({
        "博主昵称": "待删除博主",
        "博主ID": "delete-001",
        "标签": "美食|探店",
        "粉丝数": "10000"
      })],
      collectMode: "normal",
      taskMode: "list",
      sourceName: "删除测试"
    });
    const blogger = store.listBloggers({ keyword: "待删除" }).items[0];
    const note = store.addNote({ bloggerId: blogger.id, userId: 1, content: "这条备注应随博主删除", status: "不合适" });

    const result = store.deleteBlogger({ bloggerId: blogger.id, userId: 1 });

    assert.equal(result.ok, true);
    assert.equal(result.deleted.id, blogger.id);
    assert.equal(store.getBlogger(blogger.id), null);
    assert.equal(store.listBloggers({ keyword: "待删除" }).total, 0);
    assert.equal(store.db.prepare("SELECT COUNT(1) AS count FROM blogger_snapshots WHERE blogger_row_id = ?").get(blogger.id).count, 0);
    assert.equal(store.db.prepare("SELECT COUNT(1) AS count FROM blogger_tags WHERE blogger_row_id = ?").get(blogger.id).count, 0);
    assert.equal(store.db.prepare("SELECT COUNT(1) AS count FROM blogger_notes WHERE id = ?").get(note.id).count, 0);
    assert.equal(store.db.prepare("SELECT blogger_row_id FROM batch_items WHERE batch_id = ?").get(batch.batchId).blogger_row_id, null);
  } finally {
    store.close();
  }
});

test("supports incremental batch import while collecting", () => {
  const store = createDataStore({ dbPath: tempDbPath("incremental") });
  try {
    const batch = store.createBatch({ taskMode: "list", collectMode: "enhanced", sourceName: "边采边入库", maxPages: 5, perPageLimit: 20 });
    const first = store.appendRecordsToBatch({
      batchId: batch.batchId,
      records: [normalizeCollectorRecord({ "博主昵称": "边采A", "博主ID": "inc-a", "粉丝数": "1w" })]
    });
    const second = store.appendRecordsToBatch({
      batchId: batch.batchId,
      records: [normalizeCollectorRecord({ "博主昵称": "边采B", "博主ID": "inc-b", "粉丝数": "2w" })]
    });
    const enhancedPatch = store.appendRecordsToBatch({
      batchId: batch.batchId,
      countTowardsBatch: false,
      records: [normalizeCollectorRecord({ "博主昵称": "边采A", "博主ID": "inc-a", "曝光中位数（日常笔记/图文+视频/近30日/全流量）": "12345" })]
    });
    const finished = store.finishBatch({ batchId: batch.batchId, status: "完成", duplicateCount: 1, emptyRecheckCount: 0 });
    const bloggers = store.listBloggers({ keyword: "边采" });

    assert.equal(first.imported, 1);
    assert.equal(second.imported, 1);
    assert.equal(enhancedPatch.imported, 1);
    assert.equal(enhancedPatch.counted, 0);
    assert.equal(finished.total_collected, 2);
    assert.equal(finished.duplicate_count, 1);
    assert.equal(bloggers.total, 2);
  } finally {
    store.close();
  }
});

test("parses exported csv with chinese headers", () => {
  const csv = "\uFEFF\"博主昵称\",\"博主ID\",\"标签\",\"粉丝数\"\n\"-爱吃榴莲的张张\",\"id-1\",\"美食|生活\",\"5.1w\"";
  const rows = parseCsvText(csv);
  const record = normalizeCollectorRecord(rows[0]);
  assert.equal(record.nickname, "-爱吃榴莲的张张");
  assert.equal(record.blogger_id, "id-1");
  assert.equal(record.fans_count, 51000);
  assert.deepEqual(record.tags, ["美食", "生活"]);
});

test("imports daily note cost metrics from chinese headers", () => {
  const record = normalizeCollectorRecord({
    "博主昵称": "兜里有糖",
    "博主ID": "cost-001",
    "预估CPM（日常笔记/按成本）": "73.17 元/千次曝光",
    "预估阅读单价（日常笔记/按成本）": "1.06 元/阅读",
    "预估互动单价（日常笔记/按成本）": "5.48 元/互动"
  });

  assert.equal(record.estimate_cpm, 73.17);
  assert.equal(record.estimate_read_unit_price, 1.06);
  assert.equal(record.estimate_interaction_unit_price, 5.48);
});

test("stores enhanced collector fields as structured snapshot columns", () => {
  const store = createDataStore({ dbPath: tempDbPath("enhanced-fields") });
  try {
    const enhancedRecord = normalizeCollectorRecord({
        "博主昵称": "增强字段测试",
        "博主ID": "enhanced-001",
        "机构状态": "测试MCN",
        "发布笔记数（日常笔记/图文+视频/近30日/全流量）": "40",
        "发布笔记数（合作笔记/图文+视频/近30日/全流量）": "10",
        "合作笔记曝光中位数（近30日/图文+视频/全流量）": "12,345",
        "合作笔记互动率（近90日/图文+视频/全流量）": "4.7%",
        "粉丝年龄占比：18-24": "37.5%",
        "最近合作品牌与发布时间": "京东（2026-05-24）"
    });
    enhancedRecord.raw_api_json = JSON.stringify({
      profile: { userId: "enhanced-001" },
      notesRate: { noteNumber: 40 },
      captured_at: "2026-05-25T00:00:00.000Z"
    });
    store.importRecords({
      records: [enhancedRecord],
      collectMode: "enhanced",
      taskMode: "manual_refresh",
      sourceName: "增强字段结构化测试"
    });
    const detail = store.getBlogger(store.listBloggers({ keyword: "增强字段测试" }).items[0].id);
    const snapshot = detail.snapshots[0];

    assert.equal(detail.mcn_status, "测试MCN");
    assert.equal(detail.recent_note_count, 40);
    assert.equal(detail.coop_30_note_count, 10);
    assert.equal(detail.commercial_order_rate, 0.25);
    assert.equal(snapshot.coop_30_exposure_median, 12345);
    assert.equal(snapshot.coop_90_interaction_rate, 4.7);
    assert.equal(snapshot.fans_age_18_24, 37.5);
    assert.equal(snapshot.recent_coop_brand_notes, "京东（2026-05-24）");
    assert.equal(JSON.parse(snapshot.raw_json).recent_coop_brand_notes, "京东（2026-05-24）");
    assert.equal(JSON.parse(snapshot.raw_api_json).profile.userId, "enhanced-001");
  } finally {
    store.close();
  }
});

test("records mcn history when enhanced refresh changes institution", () => {
  const store = createDataStore({ dbPath: tempDbPath("mcn-history") });
  try {
    store.importRecords({
      records: [normalizeCollectorRecord({ "博主昵称": "MCN变更", "博主ID": "mcn-001", "机构状态": "无机构", "采集时间": "2026-05-01 10:00:00" })],
      collectMode: "enhanced",
      taskMode: "manual_refresh",
      sourceName: "第一次增强"
    });
    store.importRecords({
      records: [normalizeCollectorRecord({ "博主昵称": "MCN变更", "博主ID": "mcn-001", "机构状态": "东鹄文化", "采集时间": "2026-05-02 10:00:00" })],
      collectMode: "enhanced",
      taskMode: "manual_refresh",
      sourceName: "第二次增强"
    });

    const detail = store.getBlogger(store.listBloggers({ keyword: "MCN变更" }).items[0].id);
    assert.equal(detail.mcn_status, "东鹄文化");
    assert.equal(detail.mcn_history.length, 1);
    assert.equal(detail.mcn_history[0].previous_mcn_status, "无机构");
    assert.equal(detail.mcn_history[0].current_mcn_status, "东鹄文化");
  } finally {
    store.close();
  }
});

test("saves daily update job and selects oldest bloggers as candidates", () => {
  const store = createDataStore({ dbPath: tempDbPath("update-job") });
  try {
    store.importRecords({
      records: [
        normalizeCollectorRecord({ "博主昵称": "旧博主", "博主ID": "job-old", "采集时间": "2026-05-01 10:00:00" }),
        normalizeCollectorRecord({ "博主昵称": "新博主", "博主ID": "job-new", "采集时间": "2026-05-03 10:00:00" })
      ],
      collectMode: "enhanced",
      taskMode: "manual_refresh",
      sourceName: "任务候选"
    });

    const job = store.saveUpdateJob({ status: "ACTIVE", runTime: "08:30", dailyLimit: 1200 });
    const candidates = store.listUpdateCandidates(1);
    const run = store.createUpdateRun({ jobId: job.id, totalTarget: 1, message: "开始" });
    const updated = store.updateUpdateRun({ id: run.id, status: "完成", processedCount: 1, successCount: 1, message: "完成" });

    assert.equal(job.status, "ACTIVE");
    assert.equal(job.daily_limit, 1200);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].nickname, "旧博主");
    assert.equal(updated.status, "完成");
    assert.equal(updated.success_count, 1);
  } finally {
    store.close();
  }
});

test("returns daily update run items and failed details", () => {
  const store = createDataStore({ dbPath: tempDbPath("update-run-detail") });
  try {
    const batch = store.createBatch({
      taskMode: "daily_manual_update",
      collectMode: "enhanced",
      sourceName: "每日更新清单测试"
    });
    const run = store.createUpdateRun({
      jobId: 1,
      batchId: batch.batchId,
      totalTarget: 2,
      message: "开始更新"
    });
    store.appendRecordsToBatch({
      batchId: batch.batchId,
      records: [
        normalizeCollectorRecord({ "博主昵称": "成功博主", "博主ID": "run-ok", "增强采集状态": "完成" }),
        normalizeCollectorRecord({ "博主昵称": "失败博主", "博主ID": "run-fail", "增强采集状态": "需复查", "增强采集缺失项": "合作笔记近30日" })
      ]
    });

    const detail = store.getUpdateRunDetail(run.id);

    assert.equal(detail.items.length, 2);
    assert.equal(detail.failedItems.length, 1);
    assert.equal(detail.failedItems[0].nickname, "失败博主");
    assert.equal(detail.failedItems[0].missing_fields, "合作笔记近30日");
  } finally {
    store.close();
  }
});

test("generates online licenses and binds activation to one machine", () => {
  const store = createDataStore({ dbPath: tempDbPath("licenses") });
  try {
    const generated = store.generateLicenses({
      customerName: "测试客户",
      durationDays: 30,
      quantity: 1,
      generatedBy: "owner"
    });
    const licenseCode = generated.licenses[0].licenseCode;
    const first = store.activateLicense({
      licenseCode,
      machineCode: "MACHINE-A",
      appVersion: "0.2.0",
      ip: "127.0.0.1",
      deviceInfo: { platform: "darwin" }
    });
    const second = store.activateLicense({
      licenseCode,
      machineCode: "MACHINE-A",
      appVersion: "0.2.0"
    });
    const stolen = store.activateLicense({
      licenseCode,
      machineCode: "MACHINE-B",
      appVersion: "0.2.0"
    });
    const detail = store.getLicense(generated.licenses[0].id);

    assert.equal(generated.count, 1);
    assert.match(licenseCode, /^PGY-/);
    assert.equal(generated.licenses[0].customer_name, "测试客户");
    assert.equal(first.authorized, true);
    assert.equal(second.authorized, true);
    assert.equal(stolen.authorized, false);
    assert.equal(stolen.message, "授权码已在其他设备激活");
    assert.equal(detail.status, "已激活");
    assert.equal(detail.machine_code, "MACHINE-A");
    assert.ok(detail.events.some(event => event.event_type === "denied"));
  } finally {
    store.close();
  }
});

test("resets license machine binding for a replacement device", () => {
  const store = createDataStore({ dbPath: tempDbPath("license-reset") });
  try {
    const generated = store.generateLicenses({ customerName: "换机客户", durationDays: 90 });
    const licenseCode = generated.licenses[0].licenseCode;
    store.activateLicense({ licenseCode, machineCode: "OLD-MACHINE" });
    const reset = store.resetLicenseMachine({ id: generated.licenses[0].id, operator: "owner" });
    const replacement = store.activateLicense({ licenseCode, machineCode: "NEW-MACHINE" });

    assert.equal(reset.status, "未激活");
    assert.equal(reset.machine_code, null);
    assert.equal(replacement.authorized, true);
    assert.equal(replacement.license.machine_code, "NEW-MACHINE");
  } finally {
    store.close();
  }
});
