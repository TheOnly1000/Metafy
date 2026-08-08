const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectDir: () => ipcRenderer.invoke("select-dir"),
  runEngine: (opts) => ipcRenderer.invoke("run-engine", opts),
  onEngineEvent: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("engine-event", handler);
    return () => ipcRenderer.removeListener("engine-event", handler);
  },
  writeDebugLog: (logName, content) => ipcRenderer.invoke("write-debug-log", logName, content),
  setTitle: (title) => ipcRenderer.invoke("set-title", title),
  openPath: (p) => ipcRenderer.invoke("open-path", p),
  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (s) => ipcRenderer.invoke("save-settings", s),
  triggerS3Upload: (outputDir) => ipcRenderer.invoke("s3-upload", outputDir),
  saveEditedCsv: (data) => ipcRenderer.invoke("save-edited-csv", data),
  copyToClipboard: (text) => ipcRenderer.invoke("copy-to-clipboard", text),
  onS3Progress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("s3-progress", handler);
    return () => ipcRenderer.removeListener("s3-progress", handler);
  },
  // Update center
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  applyUpdate: () => ipcRenderer.invoke("apply-update"),
  onDownloadProgress: (callback) => {
    const handler = (_event, pct) => callback(pct);
    ipcRenderer.on("dl-progress", handler);
    return () => ipcRenderer.removeListener("dl-progress", handler);
  },
});
