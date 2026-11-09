const { labels: FIELD_LABELS } = require("./field-labels.json");
const { NUMBER_FIELDS, STRING_FIELDS } = require("./collector-fields");

const HEADER_MAP = new Map([
  ["博主昵称", "nickname"],
  ["nickname", "nickname"],
  ["博主ID", "blogger_id"],
  ["blogger_id", "blogger_id"],
  ["小红书主页链接", "blogger_url"],
  ["blogger_url", "blogger_url"],
  ["小红书号", "red_id"],
  ["red_id", "red_id"],
  ["省", "province"],
  ["province", "province"],
  ["市", "city"],
  ["city", "city"],
  ["机构状态", "mcn_status"],
  ["mcn_status", "mcn_status"],
  ["标签", "tags"],
  ["tags", "tags"],
  ["内容大类标签", "content_tags"],
  ["content_tags", "content_tags"],
  ["内容细分标签", "sub_content_tags"],
  ["sub_content_tags", "sub_content_tags"],
  ["账号特征标签", "feature_tags"],
  ["feature_tags", "feature_tags"],
  ["粉丝数", "fans_count"],
  ["fans_count", "fans_count"],
  ["粉丝年龄分布", "fans_age_distribution"],
  ["fans_age_distribution", "fans_age_distribution"],
  ["粉丝年龄占比：<18", "fans_age_under_18"],
  ["fans_age_under_18", "fans_age_under_18"],
  ["粉丝年龄占比：18-24", "fans_age_18_24"],
  ["fans_age_18_24", "fans_age_18_24"],
  ["粉丝年龄占比：25-34", "fans_age_25_34"],
  ["fans_age_25_34", "fans_age_25_34"],
  ["粉丝年龄占比：35-44", "fans_age_35_44"],
  ["fans_age_35_44", "fans_age_35_44"],
  ["粉丝年龄占比：>44", "fans_age_over_44"],
  ["fans_age_over_44", "fans_age_over_44"],
  ["阅读中位数", "read_median"],
  ["read_median", "read_median"],
  ["互动中位数", "interaction_median"],
  ["interaction_median", "interaction_median"],
  ["图文笔记一口价", "image_note_price"],
  ["image_note_price", "image_note_price"],
  ["视频笔记一口价", "video_note_price"],
  ["video_note_price", "video_note_price"],
  ["曝光中位数（日常笔记/图文+视频/近30日/全流量）", "exposure_median"],
  ["exposure_median", "exposure_median"],
  ["点赞中位数（日常笔记/图文+视频/近30日/全流量）", "like_median"],
  ["like_median", "like_median"],
  ["收藏中位数（日常笔记/图文+视频/近30日/全流量）", "collect_median"],
  ["collect_median", "collect_median"],
  ["评论中位数（日常笔记/图文+视频/近30日/全流量）", "comment_median"],
  ["comment_median", "comment_median"],
  ["预估CPM（日常笔记/按成本）", "estimate_cpm"],
  ["estimate_cpm", "estimate_cpm"],
  ["预估阅读单价（日常笔记/按成本）", "estimate_read_unit_price"],
  ["estimate_read_unit_price", "estimate_read_unit_price"],
  ["预估互动单价（日常笔记/按成本）", "estimate_interaction_unit_price"],
  ["estimate_interaction_unit_price", "estimate_interaction_unit_price"],
  ["合作笔记发布笔记数（近30日/图文+视频/全流量）", "coop_30_note_count"],
  ["coop_30_note_count", "coop_30_note_count"],
  ["合作笔记发布笔记数（近90日/图文+视频/全流量）", "coop_90_note_count"],
  ["coop_90_note_count", "coop_90_note_count"],
  ["累计商业笔记数", "business_note_count"],
  ["business_note_count", "business_note_count"],
  ["最近合作品牌与发布时间", "recent_coop_brand_notes"],
  ["recent_coop_brand_notes", "recent_coop_brand_notes"],
  ["页码", "page_no"],
  ["page_no", "page_no"],
  ["页内顺序", "rank_in_page"],
  ["rank_in_page", "rank_in_page"],
  ["采集时间", "collected_at"],
  ["collected_at", "collected_at"]
]);

for (const [key, label] of Object.entries(FIELD_LABELS)) {
  if (!HEADER_MAP.has(label)) HEADER_MAP.set(label, key);
  if (!HEADER_MAP.has(key)) HEADER_MAP.set(key, key);
}

for (const [label, key] of Object.entries({
  "合作笔记曝光中位数（近30日/图文+视频/全流量）": "coop_30_exposure_median",
  "合作笔记阅读中位数（近30日/图文+视频/全流量）": "coop_30_read_median",
  "合作笔记互动中位数（近30日/图文+视频/全流量）": "coop_30_interaction_median",
  "合作笔记外溢进店中位数（近30日/图文+视频/全流量）": "coop_30_outside_shop_median",
  "合作笔记点赞中位数（近30日/图文+视频/全流量）": "coop_30_like_median",
  "合作笔记收藏中位数（近30日/图文+视频/全流量）": "coop_30_collect_median",
  "合作笔记评论中位数（近30日/图文+视频/全流量）": "coop_30_comment_median",
  "合作笔记分享中位数（近30日/图文+视频/全流量）": "coop_30_share_median",
  "合作笔记关注中位数（近30日/图文+视频/全流量）": "coop_30_follow_median",
  "合作笔记互动率（近30日/图文+视频/全流量）": "coop_30_interaction_rate",
  "合作笔记视频完播率（近30日/图文+视频/全流量）": "coop_30_video_finish_rate",
  "合作笔记图文3秒阅读率（近30日/图文+视频/全流量）": "coop_30_picture_3s_view_rate",
  "合作笔记千赞笔记比例（近30日/图文+视频/全流量）": "coop_30_thousand_like_percent",
  "合作笔记百赞笔记比例（近30日/图文+视频/全流量）": "coop_30_hundred_like_percent",
  "合作笔记曝光中位数（近90日/图文+视频/全流量）": "coop_90_exposure_median",
  "合作笔记阅读中位数（近90日/图文+视频/全流量）": "coop_90_read_median",
  "合作笔记互动中位数（近90日/图文+视频/全流量）": "coop_90_interaction_median",
  "合作笔记外溢进店中位数（近90日/图文+视频/全流量）": "coop_90_outside_shop_median",
  "合作笔记点赞中位数（近90日/图文+视频/全流量）": "coop_90_like_median",
  "合作笔记收藏中位数（近90日/图文+视频/全流量）": "coop_90_collect_median",
  "合作笔记评论中位数（近90日/图文+视频/全流量）": "coop_90_comment_median",
  "合作笔记分享中位数（近90日/图文+视频/全流量）": "coop_90_share_median",
  "合作笔记关注中位数（近90日/图文+视频/全流量）": "coop_90_follow_median",
  "合作笔记互动率（近90日/图文+视频/全流量）": "coop_90_interaction_rate",
  "合作笔记视频完播率（近90日/图文+视频/全流量）": "coop_90_video_finish_rate",
  "合作笔记图文3秒阅读率（近90日/图文+视频/全流量）": "coop_90_picture_3s_view_rate",
  "合作笔记千赞笔记比例（近90日/图文+视频/全流量）": "coop_90_thousand_like_percent",
  "合作笔记百赞笔记比例（近90日/图文+视频/全流量）": "coop_90_hundred_like_percent",
  "粉丝增长数（近30日）": "fans_growth_num",
  "粉丝增长率（近30日）": "fans_growth_rate",
  "百赞笔记占比（日常笔记/图文+视频/近30日/全流量）": "hundred_like_percent",
  "千赞笔记占比（日常笔记/图文+视频/近30日/全流量）": "thousand_like_percent",
  "粉丝TOP省份": "fans_top_provinces",
  "粉丝TOP城市": "fans_top_cities",
  "粉丝TOP兴趣": "fans_top_interests",
  "粉丝主要设备": "fans_top_device",
  "数据更新时间": "data_updated_at"
})) {
  HEADER_MAP.set(label, key);
}

function cleanCell(value) {
  return String(value == null ? "" : value)
    .replace(/^\uFEFF/, "")
    .replace(/^\t/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value) {
  const text = cleanCell(value).replace(/[,\s￥¥]/g, "").toLowerCase();
  if (!text || text === "--") return null;
  const match = text.match(/^(-?\d+(?:\.\d+)?)(w|万)?%?$/);
  if (!match) {
    const loose = Number(text.replace(/[^\d.-]/g, ""));
    return Number.isFinite(loose) ? loose : null;
  }
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;
  return match[2] ? Math.round(number * 10000) : number;
}

function splitTags(value) {
  return cleanCell(value)
    .split(/[|,，;；、]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeCollectorRecord(input) {
  const raw = input && input.raw && input.normalized ? input.raw : { ...(input || {}) };
  const normalized = {};
  for (const [key, value] of Object.entries(raw)) {
    const mapped = HEADER_MAP.get(cleanCell(key)) || key;
    normalized[mapped] = value;
  }

  const record = { raw, normalized };
  for (const field of STRING_FIELDS) record[field] = cleanCell(normalized[field]);
  for (const field of NUMBER_FIELDS) record[field] = parseNumber(normalized[field]);
  const rawApiJson = normalized.raw_api_json || raw.raw_api_json || input?.raw_api_json || "";
  record.raw_api_json = typeof rawApiJson === "string"
    ? rawApiJson
    : rawApiJson
      ? JSON.stringify(rawApiJson)
      : "";

  record.tags = splitTags(normalized.tags);
  record.content_tags = splitTags(normalized.content_tags);
  record.sub_content_tags = splitTags(normalized.sub_content_tags);
  record.feature_tags = splitTags(normalized.feature_tags);
  if (!record.blogger_url && record.blogger_id) {
    record.blogger_url = `https://www.xiaohongshu.com/user/profile/${record.blogger_id}`;
  }
  record.normalized = { ...normalized };
  for (const field of [...STRING_FIELDS, ...NUMBER_FIELDS]) {
    if (record[field] !== undefined) record.normalized[field] = record[field];
  }
  for (const field of ["tags", "content_tags", "sub_content_tags", "feature_tags"]) {
    if (record[field]) record.normalized[field] = record[field].join("|");
  }
  return record;
}

function parseCsvText(text) {
  const source = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (quoted) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        i += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);

  const headers = (rows.shift() || []).map(cleanCell);
  return rows
    .filter(items => items.some(item => cleanCell(item)))
    .map(items => Object.fromEntries(headers.map((header, index) => [header, cleanCell(items[index])])));
}

module.exports = { normalizeCollectorRecord, parseCsvText, parseNumber, splitTags };
