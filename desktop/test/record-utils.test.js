const assert = require("node:assert/strict");
const test = require("node:test");

const {
  recordIdentityKey,
  splitCollectorRecords,
  summarizeMissingIdRecords
} = require("../src/record-utils");

test("splits accepted, duplicate, and missing-id collector records", () => {
  const known = new Set(["id:old-1"]);
  const result = splitCollectorRecords([
    { nickname: "已存在", blogger_id: "old-1" },
    { nickname: "可保存", blogger_id: "new-1" },
    { nickname: "缺ID昵称" }
  ], known);

  assert.equal(recordIdentityKey({ blogger_id: "new-1" }), "id:new-1");
  assert.equal(result.accepted.length, 1);
  assert.equal(result.accepted[0].nickname, "可保存");
  assert.equal(result.duplicateCount, 1);
  assert.equal(result.skippedMissingId.length, 1);
  assert.equal(result.skippedMissingId[0].nickname, "缺ID昵称");
  assert.equal(known.has("id:new-1"), true);
});

test("summarizes missing-id blogger names for final status", () => {
  const summary = summarizeMissingIdRecords([
    { nickname: "昵称A" },
    { nickname: "昵称B" },
    { nickname: "昵称A" }
  ], 1);

  assert.equal(summary.count, 3);
  assert.deepEqual(summary.names, ["昵称A"]);
  assert.equal(summary.remaining, 1);
});
