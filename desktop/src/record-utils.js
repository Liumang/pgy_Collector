(function initRecordUtils(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PGYRecordUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function recordUtilsFactory() {
  function cleanRecordValue(value) {
    if (value == null) return "";
    if (Array.isArray(value)) return value.map(cleanRecordValue).filter(Boolean).join("|");
    if (typeof value === "object") {
      return cleanRecordValue(value.name || value.label || value.title || value.value || value.tagName || value.text || "");
    }
    return String(value).replace(/\s+/g, " ").trim();
  }

  function recordIdentityKey(record) {
    const id = cleanRecordValue(record && record.blogger_id);
    return id ? `id:${id}` : "";
  }

  function missingIdName(record) {
    return cleanRecordValue(record && (record.nickname || record.red_id || record.blogger_url)) || "未命名博主";
  }

  function splitCollectorRecords(records, knownKeys) {
    const keySet = knownKeys && typeof knownKeys.has === "function" ? knownKeys : new Set();
    const accepted = [];
    const skippedMissingId = [];
    let duplicateCount = 0;

    for (const record of records || []) {
      const key = recordIdentityKey(record);
      if (!key) {
        skippedMissingId.push(record);
        continue;
      }
      if (keySet.has(key)) {
        duplicateCount += 1;
        continue;
      }
      keySet.add(key);
      accepted.push(record);
    }

    return { accepted, skippedMissingId, duplicateCount };
  }

  function summarizeMissingIdRecords(records, limit) {
    const max = Math.max(1, Number(limit || 10));
    const names = Array.from(new Set((records || []).map(missingIdName).filter(Boolean)));
    return {
      count: (records || []).length,
      names: names.slice(0, max),
      remaining: Math.max(0, names.length - max)
    };
  }

  return {
    cleanRecordValue,
    recordIdentityKey,
    splitCollectorRecords,
    summarizeMissingIdRecords
  };
});
