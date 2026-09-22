const { contextBridge, ipcRenderer } = require("electron");

// Versão real do aplicativo instalado (app.getVersion() no processo principal).
// É a única fonte da verdade: nunca há número de versão escrito no código da interface.
const appVersion = ipcRenderer.sendSync("zeno:version-sync");

contextBridge.exposeInMainWorld("zenoDesktop", {
  platform: process.platform,
  appVersion,
  quit: () => ipcRenderer.invoke("zeno:quit"),
  relaunch: () => ipcRenderer.invoke("zeno:relaunch"),
  getAutoLaunch: () => ipcRenderer.invoke("zeno:auto-launch:get"),
  setAutoLaunch: (enabled) => ipcRenderer.invoke("zeno:auto-launch:set", enabled),
  setKiosk: (enabled) => ipcRenderer.invoke("zeno:kiosk", enabled),
  checkForUpdates: () => ipcRenderer.invoke("zeno:update"),
  shutdown: () => ipcRenderer.invoke("zeno:shutdown"),
  onWillShutdown: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("zeno:will-shutdown", handler);
    return () => ipcRenderer.removeListener("zeno:will-shutdown", handler);
  },
});

// Ponte usada pela tela "Atualização do sistema" (Configurações).
contextBridge.exposeInMainWorld("mundoZenoUpdater", {
  version: appVersion,
  checkForUpdates: () => ipcRenderer.invoke("zeno:update:check"),
  downloadUpdate: () => ipcRenderer.invoke("zeno:update:download"),
  installUpdate: () => ipcRenderer.invoke("zeno:update:install"),
  onUpdateStatus: (cb) => {
    const handler = (_e, status) => cb(status);
    ipcRenderer.on("zeno:update:status", handler);
    return () => ipcRenderer.removeListener("zeno:update:status", handler);
  },
});

contextBridge.exposeInMainWorld("mundoZenoSystem", {
  openWifiSettings: () => ipcRenderer.invoke("zeno:wifi"),
});
