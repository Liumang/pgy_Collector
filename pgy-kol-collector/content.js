(() => {
  const ROOT_ID = "pgy-kol-collector-root";
  const STORAGE_KEY = "pgyKolCollectorState";
  const COLLECTING_KEY = "pgyKolCollectorIsCollecting";
  const CAPTURE_QUEUE_KEY = "pgyKolCollectorCapturedUrls";
  const DETAIL_RE = /\/solar\/pre-trade\/blogger-detail\/([^/?#]+)/;
  const DEFAULT_DELAY_MS = 1400;
  const DEFAULT_MAX_PAGES = 100;
  const DEFAULT_MAX_ITEMS_PER_PAGE = 20;
  const VERSION = "0.4.0";

  if (window.__pgyKolCollectorLoaded) return;
  window.__pgyKolCollectorLoaded = true;

  function injectHook() {
    if (!document.documentElement) {
      setTimeout(injectHook, 50);
      return;
    }
    if (document.getElementById("pgy-kol-collector-hook")) return;
    const script = document.createElement("script");
    script.id = "pgy-kol-collector-hook";
    script.src = chrome.runtime.getURL("hook.js");
    script.onload = () => script.remove();
    document.documentElement.appendChild(script);
  }

  injectHook();

  const runtime = {
    running: false,
    paused: false,
    stopRequested: false,
    pageNo: 0,
    duplicateCount: 0,
    missingNicknameCount: 0,
    capturedDetailUrls: [],
    hookReady: false,
    lastMessage: "待开始",
    records: [],
    ids: new Set()
  };

  const ui = {};

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function nowText() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function storageGet() {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get([STORAGE_KEY], result => resolve(result && result[STORAGE_KEY] ? result[STORAGE_KEY] : null));
      } catch (_) {
        resolve(null);
      }
    });
  }

  function storageSet(payload) {
    return new Promise(resolve => {
      try {
        chrome.storage.local.set({ [STORAGE_KEY]: payload }, resolve);
      } catch (_) {
        resolve();
      }
    });
  }

  function storageSetRaw(payload) {
    return new Promise(resolve => {
      try {
        chrome.storage.local.set(payload, resolve);
      } catch (_) {
        resolve();
      }
    });
  }

  function storageGetRaw(keys) {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(keys, result => resolve(result || {}));
      } catch (_) {
        resolve({});
      }
    });
  }

  function sendRuntimeMessage(message) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage(message, response => {
          const error = chrome.runtime.lastError;
          if (error) resolve({ ok: false, error: error.message });
          else resolve(response || { ok: true });
        });
      } catch (error) {
        resolve({ ok: false, error: error.message || String(error) });
      }
    });
  }

  async function loadSavedState() {
    const saved = await storageGet();
    if (!saved || !Array.isArray(saved.records)) return;
    runtime.records = saved.records;
    runtime.ids = new Set(saved.records.map(item => item.blogger_id).filter(Boolean));
    runtime.duplicateCount = Number(saved.duplicateCount || 0);
    runtime.missingNicknameCount = Number(saved.missingNicknameCount || 0);
    runtime.pageNo = Number(saved.pageNo || 0);
    runtime.lastMessage = saved.lastMessage || "已加载历史数据";
  }

  async function persistState() {
    await storageSet({
      version: VERSION,
      records: runtime.records,
      duplicateCount: runtime.duplicateCount,
      missingNicknameCount: runtime.missingNicknameCount,
      pageNo: runtime.pageNo,
      lastMessage: runtime.lastMessage,
      updatedAt: nowText()
    });
  }

  window.addEventListener("message", event => {
    if (event.source !== window || !event.data || event.data.source !== "pgy-kol-hook") return;
    if (event.data.type === "ready") {
      runtime.hookReady = true;
      render();
      return;
    }
    if (event.data.type !== "detail-url" || !event.data.url) return;
    runtime.capturedDetailUrls.push({
      url: event.data.url,
      via: event.data.via || "",
      at: Date.now()
    });
  });

  try {
    chrome.runtime.onMessage.addListener(message => {
      if (!message || message.source !== "pgy-kol-background" || message.type !== "detail-url" || !message.url) return;
      runtime.capturedDetailUrls.push({
        url: message.url,
        via: message.via || "background",
        at: Date.now()
      });
    });
  } catch (_) {}

  async function drainCapturedUrlQueue() {
    const backgroundResult = await sendRuntimeMessage({
      source: "pgy-kol-content",
      type: "drain-captured-urls"
    });
    if (backgroundResult && backgroundResult.ok && Array.isArray(backgroundResult.queue)) {
      for (const item of backgroundResult.queue) {
        if (!item || !item.url || !extractBloggerIdFromUrl(item.url)) continue;
        runtime.capturedDetailUrls.push({
          url: item.url,
          via: item.via || "background-queue",
          at: item.at || Date.now()
        });
      }
    }

    const result = await storageGetRaw([CAPTURE_QUEUE_KEY]);
    const queue = Array.isArray(result[CAPTURE_QUEUE_KEY]) ? result[CAPTURE_QUEUE_KEY] : [];
    if (!queue.length) return;

    await storageSetRaw({ [CAPTURE_QUEUE_KEY]: [] });
    for (const item of queue) {
      if (!item || !item.url || !extractBloggerIdFromUrl(item.url)) continue;
      runtime.capturedDetailUrls.push({
        url: item.url,
        via: item.via || "storage",
        at: item.at || Date.now()
      });
    }
  }

  setInterval(() => {
    if (runtime.running) drainCapturedUrlQueue();
  }, 250);

  function textOf(node) {
    return (node && node.textContent ? node.textContent : "").replace(/\s+/g, " ").trim();
  }

  function cleanNickname(value) {
    const text = String(value || "")
      .replace(/\s+/g, " ")
      .replace(/^达人[:：]\s*/, "")
      .trim();
    if (!text) return "";
    if (text.length > 40) return "";
    if (/^(查看详情|详情|合作|立即邀约|邀约|加入选中|收藏|粉丝|报价|笔记|互动|蒲公英|小红书)$/i.test(text)) return "";
    if (/^(¥|￥)?[\d,.]+([w万k千]?|元)?$/i.test(text)) return "";
    if (/^\d+(\.\d+)?[w万k千]?$/i.test(text)) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return "";
    return text;
  }

  function compactMetric(value) {
    const text = String(value || "")
      .replace(/\s+/g, "")
      .replace(/[，,]/g, "")
      .trim();
    return text === "--" ? "" : text;
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
    return compactMetric(value)
      .replace(/[¥￥]/g, "")
      .replace(/起$/, "")
      .trim();
  }

  function priceAfterLabel(text, label) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = String(text || "").match(new RegExp(`${escaped}\\s*[¥￥]?\\s*([\\d,]+)`, "i"));
    return match ? compactPrice(match[1]) : "";
  }

  function parseQuoteDetailText(text) {
    return {
      image_note_price: priceAfterLabel(text, "图文笔记一口价"),
      video_note_price: priceAfterLabel(text, "视频笔记一口价")
    };
  }

  function isElementVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function getScrollContainer() {
    return document.querySelector(".solar_body") || document.scrollingElement || document.documentElement;
  }

  function getScrollTop() {
    const scroller = getScrollContainer();
    return scroller ? scroller.scrollTop : window.scrollY;
  }

  function setScrollTop(top) {
    const scroller = getScrollContainer();
    if (scroller) scroller.scrollTop = Math.max(0, top);
    else window.scrollTo(0, Math.max(0, top));
  }

  function scrollToElementInContainer(el, offset = 180) {
    const scroller = getScrollContainer();
    if (!scroller || !el) return;
    const sr = scroller.getBoundingClientRect ? scroller.getBoundingClientRect() : { top: 0 };
    const er = el.getBoundingClientRect();
    scroller.scrollTop += er.top - sr.top - offset;
  }

  async function scrollToListTop() {
    const list = document.querySelector(".blogger-list_list");
    if (list) scrollToElementInContainer(list, 90);
    else setScrollTop(0);
    await sleep(900);
  }

  async function scrollToListBottom() {
    const scroller = getScrollContainer();
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
    else window.scrollTo(0, document.documentElement.scrollHeight);
    await sleep(700);
  }

  function getDetailLinks() {
    const seen = new Set();
    const links = [];
    for (const a of document.querySelectorAll("a[href*='/solar/pre-trade/blogger-detail/']")) {
      const href = a.href || a.getAttribute("href") || "";
      const match = href.match(DETAIL_RE);
      if (!match) continue;
      const id = decodeURIComponent(match[1]).trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      links.push({ id, href: new URL(href, location.href).href, anchor: a });
    }
    return links;
  }

  function pickContainer(anchor) {
    const tr = anchor.closest("tr");
    if (tr) return tr;

    let best = anchor;
    let node = anchor;
    for (let i = 0; i < 8 && node && node.parentElement; i += 1) {
      node = node.parentElement;
      const rect = node.getBoundingClientRect();
      const text = textOf(node);
      if (rect.width < 160 || rect.height < 44 || text.length < 2) continue;
      if (rect.width > window.innerWidth * 0.92 && rect.height > window.innerHeight * 0.5) break;
      best = node;
      if (text.length > 20 && rect.height >= 60) break;
    }
    return best;
  }

  function splitProvinceCity(locationText) {
    const text = String(locationText || "").replace(/\s+/g, " ").trim();
    if (!text) return { province: "", city: "" };
    const parts = text.split(" ").filter(Boolean);
    if (!parts.length) return { province: "", city: "" };
    return {
      province: parts[0],
      city: parts.length > 1 ? parts[1] : ""
    };
  }

  function getHeaderCells(row) {
    const table = row && row.closest ? row.closest("table") : null;
    if (!table) return [];
    return Array.from(table.querySelectorAll("thead th")).map(th => textOf(th));
  }

  function getCellByHeader(row, matcher) {
    if (!row || !row.children) return null;
    const headers = getHeaderCells(row);
    const cells = Array.from(row.children);
    const index = headers.findIndex(header => matcher.test(header));
    return index >= 0 ? cells[index] : null;
  }

  function textByHeader(row, matcher) {
    const cell = getCellByHeader(row, matcher);
    return cell ? textOf(cell) : "";
  }

  function extractListFieldsFromContainer(container) {
    const row = container && container.closest ? container.closest("tr") : null;
    if (!row) {
      return {
        province: "",
        city: "",
        tags: "",
        fans_count: "",
        read_median: "",
        interaction_median: "",
        image_note_price: "",
        video_note_price: ""
      };
    }

    const locationEl = row.querySelector(".kol-location span:last-child") || row.querySelector(".kol-location");
    const locationText = textOf(locationEl);
    const tagTexts = Array.from(row.querySelectorAll(".tag-wrap .kol-tag-item"))
      .map(textOf)
      .map(cleanNickname)
      .filter(Boolean)
      .filter(text => !/^\d+\+$/.test(text));

    const fansText = textByHeader(row, /粉丝数|粉丝量/);
    const readText = textByHeader(row, /阅读中位数/);
    const interactionText = textByHeader(row, /互动中位数/);
    const imagePriceText = textByHeader(row, /图文.*(一口价|报价)|图文笔记/);
    const videoPriceText = textByHeader(row, /视频.*(一口价|报价)|视频笔记/);
    const location = splitProvinceCity(locationText);

    return {
      province: location.province,
      city: location.city,
      tags: tagTexts.join("|"),
      fans_count: normalizeFansCount(fansText),
      read_median: compactMetric(readText),
      interaction_median: compactMetric(interactionText),
      image_note_price: compactPrice(imagePriceText),
      video_note_price: compactPrice(videoPriceText)
    };
  }

  function findQuoteTrigger(row) {
    if (!row || !row.querySelector) return null;
    return (
      row.querySelector(".quote-wrapper [style*='cursor']") ||
      row.querySelector(".quote-wrapper .kol-quote") ||
      row.querySelector(".quote-wrapper")
    );
  }

  function getVisibleQuoteDetailText() {
    const popovers = Array.from(document.querySelectorAll(".d-popover, .quote-detail"))
      .filter(isElementVisible)
      .map(textOf)
      .filter(text => /图文笔记一口价|视频笔记一口价/.test(text));
    return popovers[popovers.length - 1] || "";
  }

  async function readQuoteDetailFromHover(row) {
    const trigger = findQuoteTrigger(row);
    if (!trigger || !isElementVisible(trigger)) return {};

    trigger.scrollIntoView({ block: "center", inline: "center" });
    await sleep(120);
    const rect = trigger.getBoundingClientRect();
    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    for (const type of ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove"]) {
      trigger.dispatchEvent(new MouseEvent(type, eventOptions));
    }
    await sleep(450);

    const detailText = getVisibleQuoteDetailText();
    for (const type of ["mouseleave", "mouseout", "pointerleave", "pointerout"]) {
      trigger.dispatchEvent(new MouseEvent(type, eventOptions));
    }
    return parseQuoteDetailText(detailText);
  }

  async function extractListFieldsFromContainerWithHover(container) {
    const fields = extractListFieldsFromContainer(container);
    const row = container && container.closest ? container.closest("tr") : null;
    const hoverPrices = await readQuoteDetailFromHover(row);
    return {
      ...fields,
      image_note_price: hoverPrices.image_note_price || fields.image_note_price,
      video_note_price: hoverPrices.video_note_price || fields.video_note_price
    };
  }

  function nicknameFromAttributes(container, anchor) {
    const candidates = [anchor, container];
    for (const el of candidates) {
      if (!el || !el.getAttribute) continue;
      for (const attr of ["title", "aria-label", "alt"]) {
        const value = cleanNickname(el.getAttribute(attr));
        if (value) return value;
      }
    }
    for (const img of container.querySelectorAll("img[alt], img[title]")) {
      const value = cleanNickname(img.getAttribute("alt") || img.getAttribute("title"));
      if (value) return value;
    }
    return "";
  }

  function nicknameFromNamedElements(container) {
    const selectors = [
      "[class*='name' i]",
      "[class*='nick' i]",
      "[class*='author' i]",
      "[class*='blogger' i]",
      "[class*='user' i]",
      "strong",
      "h1",
      "h2",
      "h3"
    ];
    for (const selector of selectors) {
      for (const el of container.querySelectorAll(selector)) {
        if (!isElementVisible(el)) continue;
        const value = cleanNickname(textOf(el));
        if (value) return value;
      }
    }
    return "";
  }

  function nicknameFromLines(container, anchor) {
    const anchorText = cleanNickname(textOf(anchor));
    if (anchorText) return anchorText;

    const lines = textOf(container)
      .split(/(?=粉丝|报价|互动|笔记|¥|￥)|\n| {2,}/)
      .map(cleanNickname)
      .filter(Boolean);
    return lines[0] || "";
  }

  function extractNickname(anchor) {
    const container = pickContainer(anchor);
    return (
      nicknameFromAttributes(container, anchor) ||
      nicknameFromNamedElements(container) ||
      nicknameFromLines(container, anchor)
    );
  }

  async function extractCurrentPageRecords() {
    const records = [];
    const links = getDetailLinks();
    for (let index = 0; index < links.length; index += 1) {
      const item = links[index];
      const nickname = extractNickname(item.anchor);
      const container = pickContainer(item.anchor);
      records.push({
        nickname,
        blogger_id: item.id,
        blogger_url: `https://www.xiaohongshu.com/user/profile/${item.id}`,
        page_no: runtime.pageNo || "",
        rank_in_page: index + 1,
        collected_at: nowText(),
        ...(await extractListFieldsFromContainerWithHover(container))
      });
    }
    return records;
  }

  async function addRecords(records) {
    let added = 0;
    for (const record of records) {
      if (!record.blogger_id) continue;
      if (runtime.ids.has(record.blogger_id)) {
        runtime.duplicateCount += 1;
        continue;
      }
      if (!record.nickname) runtime.missingNicknameCount += 1;
      runtime.ids.add(record.blogger_id);
      runtime.records.push(record);
      added += 1;
    }
    await persistState();
    return added;
  }

  function getPageSignature() {
    return getDetailLinks().map(item => item.id).join("|");
  }

  function getListSignature() {
    const linkSignature = getPageSignature();
    if (linkSignature) return `links:${linkSignature}`;
    const candidates = getFallbackDetailCandidates();
    if (candidates.length) {
      return `buttons:${candidates.slice(0, 12).map(item => textOf(item.container).slice(0, 80)).join("|")}`;
    }
    const nicknameCandidates = getNicknameClickCandidates();
    if (nicknameCandidates.length) {
      return `nicknames:${nicknameCandidates.slice(0, 20).map(item => item.nickname).join("|")}`;
    }
    return `text:${textOf(document.body).slice(0, 500)}`;
  }

  function getCollectableTargetCounts() {
    const detailLinks = getDetailLinks().length;
    const detailButtons = getFallbackDetailCandidates().length;
    const nicknameCandidates = getNicknameClickCandidates().length;
    return {
      detailLinks,
      detailButtons,
      nicknameCandidates,
      total: detailLinks + detailButtons + nicknameCandidates
    };
  }

  async function waitForCollectableTargets(timeoutMs, label) {
    const started = Date.now();
    let lastCounts = getCollectableTargetCounts();
    let attempt = 0;

    while (Date.now() - started < timeoutMs) {
      lastCounts = getCollectableTargetCounts();
      if (lastCounts.total > 0) return lastCounts;

      attempt += 1;
      runtime.lastMessage = `${label || "等待列表加载"}，第 ${attempt} 次重试`;
      render();

      if (attempt % 3 === 1) await scrollToListTop();
      else if (attempt % 3 === 2) await scrollToListBottom();
      else setScrollTop(0);

      await sleep(900);
    }

    return lastCounts;
  }

  async function collectCurrentPage(pageIndex, maxItemsPerPage, delayMs) {
    const waitMs = Math.max(9000, delayMs * 6);
    const counts = await waitForCollectableTargets(waitMs, `等待第 ${pageIndex} 页列表加载`);
    if (counts.total === 0) {
      return { total: 0, added: 0, counts };
    }

    const records = await extractCurrentPageRecords();
    let added = 0;
    let total = records.length;

    if (records.length > 0) {
      added = await addRecords(records);
    }

    if (total === 0 && (getFallbackDetailCandidates().length > 0 || getNicknameClickCandidates().length > 0)) {
      const clickedResult = await collectCurrentPageByClicking(pageIndex, maxItemsPerPage);
      added = clickedResult.added;
      total = clickedResult.total;
    } else {
      total = total || added;
    }

    return { total, added, counts };
  }

  function isInsideCollector(el) {
    return Boolean(el && el.closest && el.closest(`#${ROOT_ID}`));
  }

  function isSafeDetailTrigger(el) {
    const label = [
      textOf(el),
      el.getAttribute && el.getAttribute("title"),
      el.getAttribute && el.getAttribute("aria-label")
    ].filter(Boolean).join(" ");

    if (!/(查看.*详情|详情|博主详情|达人详情|数据详情|查看主页|主页)/.test(label)) return false;
    if (/(邀约|合作|下单|付款|支付|提交|删除|移除|取消|确认|发送|私信|联系)/.test(label)) return false;
    return true;
  }

  function isLikelyNicknameText(value) {
    const text = cleanNickname(value);
    if (!text) return false;
    if (text.length < 2 || text.length > 24) return false;
    if (/[：:]/.test(text)) return false;
    if (/(全部|筛选|重置|搜索|排序|报价|粉丝|互动|笔记|阅读|收藏|合作|邀约|主页|详情|查看|登录|导出|采集|下一页|上一页|确定|取消|更多|已选|类目|地区|性别|年龄|不限)/.test(text)) return false;
    if (/^[\d\s.,万wWkK千百十%¥￥+-]+$/.test(text)) return false;
    if (/^\d+(\.\d+)?[wW万kK千]?$/.test(text)) return false;
    return /[\u4e00-\u9fa5A-Za-z0-9_·.-]/.test(text);
  }

  function isInResultArea(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (rect.top < 240) return false;
    if (rect.bottom > window.innerHeight - 20) return true;
    return rect.left > window.innerWidth * 0.08 && rect.left < window.innerWidth * 0.72;
  }

  function isLikelyNicknameElement(el) {
    if (!el || isInsideCollector(el) || !isElementVisible(el)) return false;
    if (el.closest("button, input, textarea, select, [role='button']")) return false;
    if (el.closest("thead, [class*='filter' i], [class*='search' i], [class*='pagination' i], [class*='dropdown' i], [class*='menu' i]")) return false;
    if (!isInResultArea(el)) return false;

    const ownText = Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent)
      .join("")
      .trim();
    const text = ownText || textOf(el);
    if (!isLikelyNicknameText(text)) return false;

    const rect = el.getBoundingClientRect();
    if (rect.width > 260 || rect.height > 44) return false;
    return true;
  }

  function getFallbackContainer(el) {
    return (
      el.closest("tr") ||
      el.closest("[class*='item' i]") ||
      el.closest("[class*='card' i]") ||
      el.closest("[class*='row' i]") ||
      el.closest("[class*='list' i] > *") ||
      pickContainer(el)
    );
  }

  function getLikelyRowContainer(el) {
    const tr = el.closest("tr");
    if (tr) return tr;

    let node = el;
    let fallback = el;
    for (let i = 0; i < 8 && node && node.parentElement; i += 1) {
      node = node.parentElement;
      const rect = node.getBoundingClientRect();
      if (rect.top < 180) continue;
      if (rect.width >= 420 && rect.height >= 36 && rect.height <= 180) return node;
      if (rect.width >= 260 && rect.height >= 28 && rect.height <= 220) fallback = node;
      if (rect.width > window.innerWidth * 0.9 && rect.height > window.innerHeight * 0.45) break;
    }
    return fallback;
  }

  function getFallbackDetailCandidates() {
    const raw = Array.from(document.querySelectorAll("button, a, [role='button'], span, div"))
      .filter(el => !isInsideCollector(el))
      .filter(isElementVisible)
      .filter(isSafeDetailTrigger);

    const seen = new Set();
    const candidates = [];
    for (const trigger of raw) {
      const container = getFallbackContainer(trigger);
      const key = textOf(container).slice(0, 160) || `${trigger.tagName}:${textOf(trigger)}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      candidates.push({ trigger, container });
    }
    return candidates;
  }

  function getPgyTableNicknameCandidates() {
    const rows = Array.from(document.querySelectorAll(".blogger-list_list table tbody tr"))
      .filter(isElementVisible);
    const candidates = [];

    for (const row of rows) {
      const trigger =
        row.querySelector(".kol-info_detail .kol-name") ||
        row.querySelector(".kol-info_detail > div:first-child");
      if (!trigger || !isElementVisible(trigger) || isInsideCollector(trigger)) continue;

      const nickname = cleanNickname(textOf(trigger));
      if (!isLikelyNicknameText(nickname)) continue;

      candidates.push({
        trigger,
        container: row,
        nickname
      });
    }

    candidates.sort((a, b) => {
      const ar = a.trigger.getBoundingClientRect();
      const br = b.trigger.getBoundingClientRect();
      return ar.top - br.top || ar.left - br.left;
    });
    return candidates;
  }

  function getNicknameClickCandidates() {
    const tableCandidates = getPgyTableNicknameCandidates();
    if (tableCandidates.length > 0) return tableCandidates;

    const selectors = [
      "[class*='name' i]",
      "[class*='nick' i]",
      "[class*='author' i]",
      "[class*='blogger' i]",
      "[class*='user' i]",
      "td span",
      "td div",
      "li span",
      "li div"
    ];
    const raw = [];
    for (const selector of selectors) {
      raw.push(...document.querySelectorAll(selector));
    }

    const byRow = new Map();
    for (const el of raw) {
      if (!isLikelyNicknameElement(el)) continue;
      const container = getLikelyRowContainer(el);
      const nickname = cleanNickname(textOf(el));
      const rect = el.getBoundingClientRect();
      const rowRect = container.getBoundingClientRect();
      const key = container;
      if (!nickname) continue;
      const score =
        (String(el.className || "").match(/name|nick|blogger|author|user/i) ? 100 : 0) +
        (rect.left < window.innerWidth * 0.45 ? 40 : 0) +
        (rowRect.height >= 40 && rowRect.height <= 130 ? 20 : 0) -
        Math.max(0, rect.left - window.innerWidth * 0.25) / 20;
      const current = byRow.get(key);
      if (!current || score > current.score) {
        byRow.set(key, { trigger: el, container, nickname, score });
      }
    }

    const candidates = Array.from(byRow.values()).map(({ trigger, container, nickname }) => ({ trigger, container, nickname }));
    candidates.sort((a, b) => {
      const ar = a.trigger.getBoundingClientRect();
      const br = b.trigger.getBoundingClientRect();
      return ar.top - br.top || ar.left - br.left;
    });
    return candidates;
  }

  function extractNicknameFromContainer(container) {
    return (
      nicknameFromAttributes(container, container) ||
      nicknameFromNamedElements(container) ||
      nicknameFromLines(container, container)
    );
  }

  function extractNicknameFromDetailPage() {
    const selectors = [
      "[class*='name' i]",
      "[class*='nick' i]",
      "[class*='blogger' i]",
      "[class*='author' i]",
      "h1",
      "h2"
    ];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (!isElementVisible(el) || isInsideCollector(el)) continue;
        const value = cleanNickname(textOf(el));
        if (value) return value;
      }
    }
    return "";
  }

  function extractBloggerIdFromUrl(url) {
    const match = String(url || "").match(DETAIL_RE);
    return match ? decodeURIComponent(match[1]).trim() : "";
  }

  function findBloggerIdInValue(value, options = {}) {
    const seen = options.seen || new WeakSet();
    const depth = options.depth || 0;
    const keyHint = String(options.keyHint || "");
    if (value == null || depth > 7) return null;

    if (typeof value === "string") {
      const detailId = extractBloggerIdFromUrl(value);
      if (detailId) return { id: detailId, confidence: 100, source: "detail-url" };

      const direct = value.match(/\b[a-f0-9]{24}\b/i);
      if (!direct) return null;
      const contextScore = /(blogger|kol|author|user|达人|博主)/i.test(keyHint) ? 80 : 20;
      return { id: direct[0], confidence: contextScore, source: `string:${keyHint}` };
    }

    if (typeof value === "number") return null;
    if (typeof value !== "object") return null;
    if (seen.has(value)) return null;
    seen.add(value);

    let best = null;
    const entries = Array.isArray(value)
      ? value.map((item, index) => [String(index), item])
      : Object.entries(value);

    for (const [key, child] of entries) {
      if (typeof child === "function") continue;
      const nextHint = keyHint ? `${keyHint}.${key}` : key;
      const found = findBloggerIdInValue(child, { seen, depth: depth + 1, keyHint: nextHint });
      if (!found) continue;
      if (/(blogger|kol|author|user).*id|id.*(blogger|kol|author|user)/i.test(nextHint)) {
        found.confidence = Math.max(found.confidence, 90);
        found.source = `key:${nextHint}`;
      }
      if (!best || found.confidence > best.confidence) best = found;
      if (best.confidence >= 100) break;
    }
    return best;
  }

  function extractBloggerIdFromElementInternals(el) {
    const roots = [];
    let node = el;
    for (let i = 0; i < 5 && node; i += 1) {
      roots.push(node);
      node = node.parentElement;
    }

    const descendants = el.querySelectorAll ? Array.from(el.querySelectorAll("*")).slice(0, 80) : [];
    roots.push(...descendants);

    let best = null;
    for (const target of roots) {
      if (!target) continue;

      for (const attr of target.attributes || []) {
        const found = findBloggerIdInValue(attr.value, { keyHint: attr.name });
        if (found && (!best || found.confidence > best.confidence)) best = found;
      }

      for (const key of Object.keys(target)) {
        if (!/^(__react|__vue|__vnode|__fiber|_react|__INITIAL|__data)/i.test(key)) continue;
        const found = findBloggerIdInValue(target[key], { keyHint: key });
        if (found && (!best || found.confidence > best.confidence)) best = found;
      }
    }

    return best && best.confidence >= 80 ? best : null;
  }

  function takeCapturedDetailUrl(startedAt) {
    const index = runtime.capturedDetailUrls.findIndex(item => item.at >= startedAt && extractBloggerIdFromUrl(item.url));
    if (index < 0) return null;
    const [item] = runtime.capturedDetailUrls.splice(index, 1);
    return item;
  }

  async function waitForDetailRoute(timeoutMs, startedAt) {
    const started = startedAt || Date.now();
    while (Date.now() - started < timeoutMs) {
      await drainCapturedUrlQueue();
      const captured = takeCapturedDetailUrl(started);
      if (captured) {
        return {
          id: extractBloggerIdFromUrl(captured.url),
          url: new URL(captured.url, location.href).href,
          sameTab: false
        };
      }
      const id = extractBloggerIdFromUrl(location.href);
      if (id) {
        return {
          id,
          url: location.href,
          sameTab: true
        };
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

  async function collectCurrentPageByClicking(pageIndex, maxItemsPerPage) {
    const listUrl = location.href;
    const originalScrollTop = getScrollTop();
    let added = 0;
    let total = 0;

    const initialDetailCandidates = getFallbackDetailCandidates();
    const initialNicknameCandidates = getNicknameClickCandidates();
    const useNicknameMode = initialDetailCandidates.length === 0 && initialNicknameCandidates.length > 0;
    const initialCount = Math.min(
      useNicknameMode ? initialNicknameCandidates.length : initialDetailCandidates.length,
      maxItemsPerPage
    );
    if (!initialCount) return { total: 0, added: 0 };

    for (let index = 0; index < initialCount; index += 1) {
      await waitWhilePaused();
      if (runtime.stopRequested) break;

      const candidates = useNicknameMode ? getNicknameClickCandidates() : getFallbackDetailCandidates();
      const candidate = candidates[index];
      if (!candidate) break;

      const nicknameFromList = candidate.nickname || extractNicknameFromContainer(candidate.container);
      runtime.lastMessage = `进入第 ${pageIndex} 页第 ${index + 1} 个详情`;
      render();

      const internalId = extractBloggerIdFromElementInternals(candidate.container) || extractBloggerIdFromElementInternals(candidate.trigger);
      if (internalId && internalId.id) {
        total += 1;
        added += await addRecords([{
          nickname: nicknameFromList,
          blogger_id: internalId.id,
          blogger_url: `https://www.xiaohongshu.com/user/profile/${internalId.id}`,
          page_no: pageIndex,
          rank_in_page: index + 1,
          collected_at: nowText(),
          ...(await extractListFieldsFromContainerWithHover(candidate.container))
        }]);
        runtime.lastMessage = `第 ${pageIndex} 页第 ${index + 1} 个已保存`;
        render();
        continue;
      }

      candidate.trigger.scrollIntoView({ block: "center", inline: "center" });
      await sleep(250);
      const clickStartedAt = Date.now() - 100;
      const rect = candidate.trigger.getBoundingClientRect();
      const clickResult = await sendRuntimeMessage({
        source: "pgy-kol-content",
        type: "real-click",
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2)
      });
      if (!clickResult.ok) {
        candidate.trigger.click();
      }

      const detail = await waitForDetailRoute(7000, clickStartedAt);
      if (!detail || !detail.id) {
        runtime.lastMessage = clickResult.ok
          ? `第 ${index + 1} 个未捕获到详情URL，跳过`
          : `第 ${index + 1} 个真实点击失败：${clickResult.error || "未知错误"}`;
        render();
        continue;
      }

      if (detail.sameTab) await sleep(700);
      const record = {
        nickname: nicknameFromList || (detail.sameTab ? extractNicknameFromDetailPage() : ""),
        blogger_id: detail.id,
        blogger_url: `https://www.xiaohongshu.com/user/profile/${detail.id}`,
        page_no: pageIndex,
        rank_in_page: index + 1,
        collected_at: nowText(),
        ...(await extractListFieldsFromContainerWithHover(candidate.container))
      };
      total += 1;
      added += await addRecords([record]);

      if (detail.sameTab) {
        history.back();
        await waitForListRoute(7000, listUrl);
        await sleep(800);
      }
      setScrollTop(originalScrollTop);
    }

    return { total, added };
  }

  function isDisabled(el) {
    if (!el) return true;
    const ariaDisabled = el.getAttribute("aria-disabled");
    const disabled = el.disabled || ariaDisabled === "true";
    const cls = String(el.className || "");
    return disabled || /disabled|disable|inactive/.test(cls);
  }

  function findNextButton() {
    const pager = document.querySelector(".d-pagination");
    if (pager) {
      const pagerButtons = Array.from(pager.querySelectorAll(".d-pagination-page.d-clickable"))
        .filter(isElementVisible)
        .filter(el => !/disabled|--color-text-disabled/.test(String(el.className || "")));
      const arrows = pagerButtons.filter(el => !/\d/.test(textOf(el)));
      const rightArrow = arrows.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0];
      if (rightArrow) return rightArrow;
    }

    const selectors = [
      ".ant-pagination-next",
      ".semi-page-next",
      ".next",
      "button[aria-label*='下一页']",
      "button[title*='下一页']",
      "li[title*='下一页']",
      "a[aria-label*='下一页']"
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isElementVisible(el) && !isDisabled(el)) return el;
    }

    const candidates = Array.from(document.querySelectorAll("button, a, li, span, div"))
      .filter(isElementVisible)
      .filter(el => /下一页|Next|›|>/.test((el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "") + " " + textOf(el)))
      .filter(el => !isDisabled(el));

    return candidates.find(el => {
      const rect = el.getBoundingClientRect();
      return rect.top > window.innerHeight * 0.35 || rect.left > window.innerWidth * 0.45;
    }) || null;
  }

  async function waitForPageChange(previousSignature, timeoutMs) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      await sleep(350);
      const nextSignature = getListSignature();
      if (nextSignature && nextSignature !== previousSignature) return true;
    }
    return false;
  }

  function resetWorkingData() {
    runtime.records = [];
    runtime.ids = new Set();
    runtime.duplicateCount = 0;
    runtime.missingNicknameCount = 0;
    runtime.pageNo = 0;
    runtime.capturedDetailUrls = [];
  }

  async function waitForPageChangeOrRecord(previousSignature, previousCount, timeoutMs) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (runtime.records.length > previousCount) return true;
      const nextSignature = getListSignature();
      if (nextSignature && nextSignature !== previousSignature && getCollectableTargetCounts().total > 0) return true;
      await sleep(350);
    }
    return false;
  }

  async function waitWhilePaused() {
    while (runtime.paused && !runtime.stopRequested) {
      runtime.lastMessage = "已暂停";
      render();
      await sleep(500);
    }
  }

  function readOptions() {
    const maxPages = Number(ui.maxPagesInput.value || DEFAULT_MAX_PAGES);
    const maxItemsPerPage = Number(ui.maxItemsInput.value || DEFAULT_MAX_ITEMS_PER_PAGE);
    const delayMs = Number(ui.delayInput.value || DEFAULT_DELAY_MS);
    return {
      maxPages: Number.isFinite(maxPages) && maxPages > 0 ? Math.floor(maxPages) : DEFAULT_MAX_PAGES,
      maxItemsPerPage: Number.isFinite(maxItemsPerPage) && maxItemsPerPage > 0 ? Math.floor(maxItemsPerPage) : DEFAULT_MAX_ITEMS_PER_PAGE,
      delayMs: Number.isFinite(delayMs) && delayMs >= 300 ? Math.floor(delayMs) : DEFAULT_DELAY_MS
    };
  }

  async function collectLoop() {
    if (runtime.running) return;
    runtime.running = true;
    runtime.paused = false;
    runtime.stopRequested = false;
    resetWorkingData();
    await sendRuntimeMessage({
      source: "pgy-kol-content",
      type: "set-collecting",
      value: true
    });
    await storageSetRaw({
      [COLLECTING_KEY]: true,
      [CAPTURE_QUEUE_KEY]: []
    });
    runtime.lastMessage = "开始采集";
    render();

    const { maxPages, maxItemsPerPage, delayMs } = readOptions();
    let previousPageSignature = "";

    try {
      for (let pageIndex = 1; pageIndex <= maxPages; pageIndex += 1) {
        await waitWhilePaused();
        if (runtime.stopRequested) break;

        runtime.pageNo = pageIndex;
        runtime.lastMessage = `正在读取第 ${pageIndex} 页`;
        render();

        await scrollToListTop();
        await sleep(delayMs);
        const pageSignature = getListSignature();
        if (pageIndex > 1 && pageSignature && pageSignature === previousPageSignature && getCollectableTargetCounts().total > 0) {
          runtime.lastMessage = "页面数据没有变化，已停止";
          break;
        }

        const pageResult = await collectCurrentPage(pageIndex, maxItemsPerPage, delayMs);
        const added = pageResult.added;
        const total = pageResult.total;

        if (total === 0) {
          runtime.lastMessage = "当前页列表未加载完成或没有识别到博主，已停止。可点诊断后发给维护人员";
          break;
        }

        runtime.lastMessage = `第 ${pageIndex} 页完成，新增 ${added} 个`;
        render();

        const nextButton = findNextButton();
        if (!nextButton) {
          await scrollToListBottom();
        }
        const visibleNextButton = nextButton || findNextButton();
        if (!visibleNextButton) {
          runtime.lastMessage = "没有可点击的下一页，采集完成";
          break;
        }

        await waitWhilePaused();
        if (runtime.stopRequested) break;

        previousPageSignature = pageSignature;
        const beforeNextCount = runtime.records.length;
        scrollToElementInContainer(visibleNextButton, 400);
        await sleep(250);
        visibleNextButton.click();

        runtime.lastMessage = "等待下一页加载";
        render();
        const changed = await waitForPageChangeOrRecord(pageSignature, beforeNextCount, Math.max(10000, delayMs * 8));
        if (!changed) {
          runtime.lastMessage = "点击下一页后未等到新列表，已停止。可点诊断后发给维护人员";
          break;
        }
      }
    } catch (error) {
      runtime.lastMessage = `采集异常：${error && error.message ? error.message : String(error)}`;
    } finally {
      runtime.running = false;
      runtime.paused = false;
      runtime.stopRequested = false;
      await sendRuntimeMessage({
        source: "pgy-kol-content",
        type: "set-collecting",
        value: false
      });
      await storageSetRaw({ [COLLECTING_KEY]: false });
      await persistState();
      render();
    }
  }

  function csvCell(value) {
    const text = String(value == null ? "" : value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const headers = [
      "nickname",
      "blogger_id",
      "blogger_url",
      "province",
      "city",
      "tags",
      "fans_count",
      "read_median",
      "interaction_median",
      "image_note_price",
      "video_note_price",
      "page_no",
      "rank_in_page",
      "collected_at"
    ];
    const rows = [headers.join(",")];
    for (const record of runtime.records) {
      rows.push(headers.map(key => csvCell(record[key])).join(","));
    }
    const csv = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `pgy_kol_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.csv`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function runDiagnostics() {
    const links = getDetailLinks();
    const candidates = getFallbackDetailCandidates();
    const nicknameCandidates = getNicknameClickCandidates();
    const internalIdSamples = nicknameCandidates.slice(0, 5).map(item => {
      const found = extractBloggerIdFromElementInternals(item.container) || extractBloggerIdFromElementInternals(item.trigger);
      return {
        nickname: item.nickname,
        id: found ? found.id : "",
        confidence: found ? found.confidence : 0,
        source: found ? found.source : ""
      };
    });
    const queueResult = await storageGetRaw([CAPTURE_QUEUE_KEY, COLLECTING_KEY]);
    const queuedUrls = Array.isArray(queueResult[CAPTURE_QUEUE_KEY]) ? queueResult[CAPTURE_QUEUE_KEY] : [];
    const report = {
      version: VERSION,
      url: location.href,
      title: document.title,
      detailLinks: links.length,
      detailButtons: candidates.length,
      nicknameCandidates: nicknameCandidates.length,
      collectableTargets: getCollectableTargetCounts(),
      visibleTableRows: Array.from(document.querySelectorAll("tbody tr")).filter(isElementVisible).length,
      hookReady: runtime.hookReady,
      savedRecords: runtime.records.length,
      capturedDetailUrls: runtime.capturedDetailUrls.length,
      queuedDetailUrls: queuedUrls.length,
      collectingFlag: Boolean(queueResult[COLLECTING_KEY]),
      internalIdSamples,
      firstLinkIds: links.slice(0, 5).map(item => item.id),
      firstButtonTexts: candidates.slice(0, 5).map(item => textOf(item.trigger).slice(0, 60)),
      firstNicknameTexts: nicknameCandidates.slice(0, 10).map(item => item.nickname),
      time: nowText()
    };
    const text = JSON.stringify(report, null, 2);
    const internalHits = internalIdSamples.filter(item => item.id).length;
    runtime.lastMessage = `诊断v${VERSION}：昵称 ${report.nicknameCandidates} 个，内部ID ${internalHits}/${internalIdSamples.length} 个，链接 ${report.detailLinks} 个`;
    render();
    try {
      await navigator.clipboard.writeText(text);
      runtime.lastMessage += "，已复制";
    } catch (_) {
      console.log("[PGY Collector diagnostics]", report);
      runtime.lastMessage += "，复制失败，已写入控制台";
    }
    render();
  }

  async function clearData() {
    if (runtime.running) return;
    runtime.records = [];
    runtime.ids = new Set();
    runtime.capturedDetailUrls = [];
    runtime.duplicateCount = 0;
    runtime.missingNicknameCount = 0;
    runtime.pageNo = 0;
    runtime.lastMessage = "已清空";
    await storageSetRaw({
      [COLLECTING_KEY]: false,
      [CAPTURE_QUEUE_KEY]: []
    });
    await sendRuntimeMessage({
      source: "pgy-kol-content",
      type: "set-collecting",
      value: false
    });
    await persistState();
    render();
  }

  function render() {
    if (!ui.count) return;
    ui.count.textContent = String(runtime.records.length);
    ui.page.textContent = String(runtime.pageNo || "-");
    ui.duplicates.textContent = String(runtime.duplicateCount);
    ui.missing.textContent = String(runtime.missingNicknameCount);
    ui.status.textContent = runtime.lastMessage;

    ui.startBtn.disabled = runtime.running;
    ui.pauseBtn.disabled = !runtime.running || runtime.paused;
    ui.resumeBtn.disabled = !runtime.running || !runtime.paused;
    ui.stopBtn.disabled = !runtime.running;
    ui.exportBtn.disabled = runtime.records.length === 0;
    ui.clearBtn.disabled = runtime.running || runtime.records.length === 0;
  }

  function styleButton(button, kind) {
    button.style.height = "30px";
    button.style.border = "0";
    button.style.borderRadius = "6px";
    button.style.fontSize = "13px";
    button.style.cursor = "pointer";
    button.style.color = kind === "plain" ? "#1f2937" : "#fff";
    button.style.background = kind === "danger" ? "#dc2626" : kind === "plain" ? "#eef2f7" : "#e11d48";
  }

  function makeButton(text, kind = "primary") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    styleButton(button, kind);
    return button;
  }

  function makeStat(label, valueNode) {
    const box = document.createElement("div");
    box.style.display = "grid";
    box.style.gap = "3px";
    const labelEl = document.createElement("div");
    labelEl.textContent = label;
    labelEl.style.fontSize = "11px";
    labelEl.style.color = "#6b7280";
    valueNode.style.fontSize = "16px";
    valueNode.style.fontWeight = "700";
    valueNode.style.color = "#111827";
    box.append(labelEl, valueNode);
    return box;
  }

  function createPanel() {
    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = ROOT_ID;

    const panel = document.createElement("div");
    panel.style.width = "260px";
    panel.style.boxSizing = "border-box";
    panel.style.background = "#fff";
    panel.style.border = "1px solid rgba(17, 24, 39, 0.12)";
    panel.style.boxShadow = "0 14px 40px rgba(15, 23, 42, 0.18)";
    panel.style.borderRadius = "8px";
    panel.style.padding = "12px";
    panel.style.color = "#111827";
    panel.style.fontFamily = "inherit";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "10px";

    const title = document.createElement("div");
    title.textContent = "蒲公英采集助手";
    title.style.fontSize = "15px";
    title.style.fontWeight = "700";

    const collapse = makeButton("收起", "plain");
    collapse.style.width = "48px";
    collapse.style.height = "26px";

    header.append(title, collapse);

    const stats = document.createElement("div");
    stats.style.display = "grid";
    stats.style.gridTemplateColumns = "1fr 1fr";
    stats.style.gap = "10px";
    stats.style.marginBottom = "10px";

    ui.count = document.createElement("div");
    ui.page = document.createElement("div");
    ui.duplicates = document.createElement("div");
    ui.missing = document.createElement("div");
    stats.append(
      makeStat("已采集", ui.count),
      makeStat("当前页", ui.page),
      makeStat("重复跳过", ui.duplicates),
      makeStat("昵称缺失", ui.missing)
    );

    const statusBox = document.createElement("div");
    statusBox.style.minHeight = "34px";
    statusBox.style.padding = "8px";
    statusBox.style.background = "#f9fafb";
    statusBox.style.borderRadius = "6px";
    statusBox.style.fontSize = "12px";
    statusBox.style.lineHeight = "18px";
    statusBox.style.color = "#374151";
    statusBox.style.marginBottom = "10px";
    ui.status = document.createElement("div");
    statusBox.append(ui.status);

    const options = document.createElement("div");
    options.style.display = "grid";
    options.style.gridTemplateColumns = "1fr 1fr 1fr";
    options.style.gap = "8px";
    options.style.marginBottom = "10px";

    ui.maxPagesInput = makeInput("最大页数", DEFAULT_MAX_PAGES);
    ui.maxItemsInput = makeInput("每页最多", DEFAULT_MAX_ITEMS_PER_PAGE);
    ui.delayInput = makeInput("延迟ms", DEFAULT_DELAY_MS);
    options.append(ui.maxPagesInput.wrapper, ui.maxItemsInput.wrapper, ui.delayInput.wrapper);

    const actions = document.createElement("div");
    actions.style.display = "grid";
    actions.style.gridTemplateColumns = "1fr 1fr";
    actions.style.gap = "8px";

    ui.startBtn = makeButton("开始采集");
    ui.pauseBtn = makeButton("暂停", "plain");
    ui.resumeBtn = makeButton("继续", "plain");
    ui.stopBtn = makeButton("停止", "danger");
    ui.exportBtn = makeButton("导出CSV");
    ui.clearBtn = makeButton("清空", "plain");
    ui.diagnoseBtn = makeButton("诊断", "plain");

    actions.append(ui.startBtn, ui.pauseBtn, ui.resumeBtn, ui.stopBtn, ui.exportBtn, ui.clearBtn, ui.diagnoseBtn);

    const hint = document.createElement("div");
    hint.textContent = "先完成筛选，再点开始。每页最多请按当前页博主数量设置，CSV可直接用Excel打开。";
    hint.style.marginTop = "9px";
    hint.style.fontSize = "11px";
    hint.style.lineHeight = "16px";
    hint.style.color = "#6b7280";

    panel.append(header, stats, statusBox, options, actions, hint);
    root.append(panel);
    document.documentElement.appendChild(root);

    ui.startBtn.addEventListener("click", collectLoop);
    ui.pauseBtn.addEventListener("click", () => {
      runtime.paused = true;
      runtime.lastMessage = "暂停中";
      render();
    });
    ui.resumeBtn.addEventListener("click", () => {
      runtime.paused = false;
      runtime.lastMessage = "继续采集";
      render();
    });
    ui.stopBtn.addEventListener("click", () => {
      runtime.stopRequested = true;
      runtime.lastMessage = "正在停止";
      render();
    });
    ui.exportBtn.addEventListener("click", exportCsv);
    ui.clearBtn.addEventListener("click", clearData);
    ui.diagnoseBtn.addEventListener("click", runDiagnostics);
    collapse.addEventListener("click", () => {
      const hidden = stats.style.display !== "none";
      stats.style.display = hidden ? "none" : "grid";
      statusBox.style.display = hidden ? "none" : "block";
      options.style.display = hidden ? "none" : "grid";
      actions.style.display = hidden ? "none" : "grid";
      hint.style.display = hidden ? "none" : "block";
      collapse.textContent = hidden ? "展开" : "收起";
      panel.style.width = hidden ? "150px" : "260px";
    });
  }

  function makeInput(label, value) {
    const wrapper = document.createElement("label");
    wrapper.style.display = "grid";
    wrapper.style.gap = "4px";
    wrapper.style.fontSize = "11px";
    wrapper.style.color = "#6b7280";
    const text = document.createElement("span");
    text.textContent = label;
    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value);
    input.min = "1";
    input.style.width = "100%";
    input.style.height = "28px";
    input.style.boxSizing = "border-box";
    input.style.border = "1px solid #d1d5db";
    input.style.borderRadius = "6px";
    input.style.padding = "0 7px";
    input.style.fontSize = "12px";
    input.style.color = "#111827";
    input.style.background = "#fff";
    wrapper.append(text, input);
    input.wrapper = wrapper;
    return input;
  }

  async function init() {
    if (extractBloggerIdFromUrl(location.href)) {
      await sendRuntimeMessage({
        source: "pgy-kol-content",
        type: "detail-page-opened",
        url: location.href
      });
      return;
    }
    createPanel();
    await storageSet({
      version: VERSION,
      records: [],
      duplicateCount: 0,
      missingNicknameCount: 0,
      pageNo: 0,
      lastMessage: "新任务待开始",
      updatedAt: nowText()
    });
    runtime.lastMessage = "新任务待开始";
    render();
  }

  init();
})();
