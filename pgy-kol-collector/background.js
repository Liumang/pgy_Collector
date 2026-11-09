const DETAIL_RE = /\/solar\/pre-trade\/blogger-detail\/([^/?#]+)/;
const COLLECTING_KEY = "pgyKolCollectorIsCollecting";
const CAPTURE_QUEUE_KEY = "pgyKolCollectorCapturedUrls";
let isCollecting = false;
let capturedQueue = [];

function isDetailUrl(url) {
  return typeof url === "string" && DETAIL_RE.test(url);
}

function notifyCollectors(url, via, sourceTabId) {
  chrome.tabs.query({ url: "https://pgy.xiaohongshu.com/*" }, tabs => {
    for (const tab of tabs) {
      if (!tab.id || tab.id === sourceTabId) continue;
      try {
        const result = chrome.tabs.sendMessage(tab.id, {
          source: "pgy-kol-background",
          type: "detail-url",
          url,
          via
        });
        if (result && typeof result.catch === "function") result.catch(() => {});
      } catch (_) {}
    }
  });
}

function appendCapturedUrl(url, via) {
  capturedQueue.push({ url, via, at: Date.now() });
  capturedQueue = capturedQueue.slice(-100);

  chrome.storage.local.get([CAPTURE_QUEUE_KEY], result => {
    const queue = Array.isArray(result[CAPTURE_QUEUE_KEY]) ? result[CAPTURE_QUEUE_KEY] : [];
    queue.push({ url, via, at: Date.now() });
    chrome.storage.local.set({ [CAPTURE_QUEUE_KEY]: queue.slice(-100) });
  });
}

function handleDetailUrl(tabId, url, via, shouldClose) {
  if (!isDetailUrl(url)) return;

  chrome.storage.local.get([COLLECTING_KEY], result => {
    if (!isCollecting && !result[COLLECTING_KEY]) return;

    appendCapturedUrl(url, via);
    notifyCollectors(url, via, tabId);

    if (shouldClose) {
      setTimeout(() => {
        try {
          const result = chrome.tabs.remove(tabId);
          if (result && typeof result.catch === "function") result.catch(() => {});
        } catch (_) {}
      }, 150);
    }
  });
}

function handleTabUrl(tabId, changeInfo, tab) {
  const url = changeInfo.url || tab.url || tab.pendingUrl;
  handleDetailUrl(tabId, url, "tab", Boolean(tab.openerTabId || !tab.active));
}

chrome.tabs.onCreated.addListener(tab => {
  const url = tab.url || tab.pendingUrl;
  if (tab.id) handleDetailUrl(tab.id, url, "tab-created", true);
});

chrome.tabs.onUpdated.addListener(handleTabUrl);

function sendDebuggerCommand(target, method, params) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand(target, method, params, result => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
  });
}

function attachDebugger(target) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach(target, "1.3", () => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

function detachDebugger(target) {
  return new Promise(resolve => {
    chrome.debugger.detach(target, () => resolve());
  });
}

async function realClick(tabId, x, y) {
  const target = { tabId };
  await attachDebugger(target);
  try {
    await sendDebuggerCommand(target, "Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y,
      button: "none"
    });
    await sendDebuggerCommand(target, "Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1
    });
    await sendDebuggerCommand(target, "Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      clickCount: 1
    });
  } finally {
    await detachDebugger(target);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.source === "pgy-kol-content" && message.type === "set-collecting") {
    isCollecting = Boolean(message.value);
    if (isCollecting) capturedQueue = [];
    chrome.storage.local.set({ [COLLECTING_KEY]: isCollecting, [CAPTURE_QUEUE_KEY]: isCollecting ? [] : capturedQueue }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message && message.source === "pgy-kol-content" && message.type === "drain-captured-urls") {
    const queue = capturedQueue;
    capturedQueue = [];
    chrome.storage.local.set({ [CAPTURE_QUEUE_KEY]: [] }, () => {
      sendResponse({ ok: true, queue });
    });
    return true;
  }

  if (message && message.source === "pgy-kol-content" && message.type === "detail-page-opened" && message.url) {
    const tabId = sender.tab && sender.tab.id;
    if (!tabId || !isDetailUrl(message.url)) {
      sendResponse({ ok: false, error: "invalid detail page" });
      return false;
    }

    chrome.storage.local.get([COLLECTING_KEY], result => {
      if (!isCollecting && !result[COLLECTING_KEY]) {
        sendResponse({ ok: false, error: "not collecting" });
        return;
      }

      appendCapturedUrl(message.url, "detail-content");
      notifyCollectors(message.url, "detail-content", tabId);
      setTimeout(() => {
        try {
          const closeResult = chrome.tabs.remove(tabId);
          if (closeResult && typeof closeResult.catch === "function") closeResult.catch(() => {});
        } catch (_) {}
      }, 150);
      sendResponse({ ok: true });
    });
    return true;
  }

  if (!message || message.source !== "pgy-kol-content" || message.type !== "real-click") return false;
  const tabId = sender.tab && sender.tab.id;
  if (!tabId) {
    sendResponse({ ok: false, error: "missing tab id" });
    return false;
  }

  realClick(tabId, message.x, message.y)
    .then(() => sendResponse({ ok: true }))
    .catch(error => sendResponse({ ok: false, error: error.message || String(error) }));
  return true;
});
