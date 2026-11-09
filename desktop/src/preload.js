const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  getWebviewPreloadPath: () => ipcRenderer.invoke("desktop:get-webview-preload"),
  getDataConsolePreloadPath: () => ipcRenderer.invoke("desktop:get-data-console-preload"),
  showSaveDialog: defaultPath => ipcRenderer.invoke("desktop:show-save-dialog", defaultPath),
  saveTextFile: payload => ipcRenderer.invoke("desktop:save-text-file", payload),
  saveNicknameTemplate: () => ipcRenderer.invoke("desktop:save-nickname-template"),
  openNicknameFile: () => ipcRenderer.invoke("desktop:open-nickname-file"),
  openDataConsole: () => ipcRenderer.invoke("desktop:open-data-console"),
  startDataConsole: () => ipcRenderer.invoke("desktop:start-data-console"),
  sendWebviewInputEvent: payload => ipcRenderer.invoke("desktop:send-webview-input-event", payload),
  createDatabaseBatch: payload => ipcRenderer.invoke("desktop:create-database-batch", payload),
  appendRecordsToDatabase: payload => ipcRenderer.invoke("desktop:append-records-to-database", payload),
  finishDatabaseBatch: payload => ipcRenderer.invoke("desktop:finish-database-batch", payload),
  saveRecordsToDatabase: payload => ipcRenderer.invoke("desktop:save-records-to-database", payload),
  dataConsoleRequest: payload => ipcRenderer.invoke("desktop:data-console-request", payload)
});
