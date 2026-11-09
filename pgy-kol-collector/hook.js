(() => {
  if (window.__pgyKolCollectorHookLoaded) return;
  window.__pgyKolCollectorHookLoaded = true;

  const DETAIL_RE = /\/solar\/pre-trade\/blogger-detail\/([^/?#]+)/;

  function notify(url, via) {
    if (!url || !DETAIL_RE.test(String(url))) return;
    window.postMessage({
      source: "pgy-kol-hook",
      type: "detail-url",
      url: String(url),
      via,
      at: Date.now()
    }, "*");
  }

  const originalOpen = window.open;
  window.open = function patchedOpen(url, target, features) {
    notify(url, "window.open");
    if (url && DETAIL_RE.test(String(url))) {
      return null;
    }
    return originalOpen.apply(this, arguments);
  };

  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function patchedHistory(state, title, url) {
      if (url) {
        try {
          notify(new URL(url, location.href).href, `history.${method}`);
        } catch (_) {}
      }
      return original.apply(this, arguments);
    };
  }

  document.addEventListener("click", event => {
    const target = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!target) return;
    const href = target.href || target.getAttribute("href");
    if (!href || !DETAIL_RE.test(href)) return;
    notify(href, "anchor");
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  window.postMessage({
    source: "pgy-kol-hook",
    type: "ready",
    at: Date.now()
  }, "*");
})();
