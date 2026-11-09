const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("licenseApi", {
  generate: payload => ipcRenderer.invoke("license:generate", payload),
  copy: text => ipcRenderer.invoke("license:copy", text)
});
