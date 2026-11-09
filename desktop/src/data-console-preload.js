const { ipcRenderer } = require("electron");

window.addEventListener("message", event => {
  const data = event.data || {};
  if (data.source !== "pgy-data-console") return;
  ipcRenderer.sendToHost("data-console-message", data);
});
