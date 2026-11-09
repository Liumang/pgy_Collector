function csvCell(value) {
  const raw = Array.isArray(value) ? value.join("|") : String(value == null ? "" : value);
  const safe = /^[=+\-@]/.test(raw) ? `\t${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

const { labels: FIELD_LABELS } = require("./field-labels.json");

function parseRawJson(value) {
  if (!value) return {};
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function bloggersToCsv(items) {
  const rowsWithRaw = (items || []).map(item => ({ item, raw: parseRawJson(item.latest_raw_json) }));
  const orderedKeys = [
    "nickname", "blogger_id", "blogger_url", "red_id", "province", "city", "mcn_status", "collab_status",
    "tags", "fans_count", "fans_growth_num", "read_median", "interaction_median", "image_note_price", "video_note_price",
    "coop_30_note_count", "recent_note_count", "commercial_order_rate"
  ];
  for (const { raw } of rowsWithRaw) {
    for (const key of Object.keys(raw)) {
      if (!orderedKeys.includes(key)) orderedKeys.push(key);
    }
  }
  for (const key of ["page_no", "rank_in_page", "collected_at", "last_collected_at"]) {
    if (!orderedKeys.includes(key)) orderedKeys.push(key);
  }
  const fields = orderedKeys.map(key => [key, FIELD_LABELS[key] || "其他采集数据"]);
  const rows = [fields.map(([, label]) => csvCell(label)).join(",")];
  for (const { item, raw } of rowsWithRaw) {
    rows.push(fields.map(([key]) => csvCell(raw[key] ?? item[key])).join(","));
  }
  return `\uFEFF${rows.join("\n")}`;
}

module.exports = { bloggersToCsv };
