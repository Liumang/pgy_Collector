const { ipcRenderer } = require("electron");

function installApiCapture() {
  const script = document.createElement("script");
  script.textContent = `
(() => {
  if (window.__pgyApiCaptureInstalled) return;
  window.__pgyApiCaptureInstalled = true;
  window.__pgyCapturedApiResponses = [];

  const shouldCapture = url => /\\/api\\/solar\\/(kol|cooperator)\\//.test(String(url || ""));
  const post = payload => {
    try {
      window.__pgyCapturedApiResponses.push(payload);
      window.postMessage({ source: "pgy-api-capture", ...payload }, "*");
    } catch (_) {}
  };
  const captureText = async (url, status, text) => {
    if (!shouldCapture(url) || !text) return;
    try {
      const body = JSON.parse(text);
      post({ type: "api-response", url: String(url), status, body, at: Date.now() });
    } catch (_) {}
  };

  const originalFetch = window.fetch;
  window.fetch = async function patchedFetch(input, init) {
    const response = await originalFetch.apply(this, arguments);
    const url = typeof input === "string" ? input : input && input.url;
    if (shouldCapture(url)) {
      response.clone().text().then(text => captureText(url, response.status, text)).catch(() => {});
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    this.__pgyCaptureUrl = url;
    return originalOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function patchedSend() {
    this.addEventListener("loadend", () => {
      const url = this.__pgyCaptureUrl;
      if (!shouldCapture(url)) return;
      captureText(url, this.status, this.responseText);
    });
    return originalSend.apply(this, arguments);
  };
})();
`;
  (document.documentElement || document.head || document).appendChild(script);
  script.remove();
}

try {
  installApiCapture();
} catch (_) {
  window.addEventListener("DOMContentLoaded", () => {
    try {
      installApiCapture();
    } catch (_) {}
  }, { once: true });
}

window.addEventListener("message", event => {
  if (!event.data || !["pgy-desktop-collector", "pgy-api-capture"].includes(event.data.source)) return;
  ipcRenderer.sendToHost("collector-message", event.data);
});
