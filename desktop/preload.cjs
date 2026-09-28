const { contextBridge, ipcRenderer } = require("electron");

// Versão real do aplicativo instalado (app.getVersion() no processo principal).
// É a única fonte da verdade: nunca há número de versão escrito no código da interface.
const appVersion = ipcRenderer.sendSync("zeno:version-sync");

// Recupera a ativação e os dados locais salvos por versões antigas (outra origem).
// Só copia chaves ausentes: nunca sobrescreve nem apaga nada da mesa atual.
try {
  if (location.protocol === "zeno-app:") {
    const legacy = ipcRenderer.sendSync("zeno:legacy-storage") || {};
    if (legacy.zeno_device_activated === "1" && localStorage.getItem("zeno_device_activated") !== "1") {
      for (const [k, v] of Object.entries(legacy)) {
        if (localStorage.getItem(k) === null && typeof v === "string") localStorage.setItem(k, v);
      }
      if (legacy.zeno_device_code) localStorage.setItem("zeno_device_code", legacy.zeno_device_code);
      localStorage.setItem("zeno_device_activated", "1");
    }
  }
} catch {
  /* sem dados antigos */
}

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

// Tela "sem internet": botões de voltar ao início e tentar de novo.
contextBridge.exposeInMainWorld("zenoOffline", {
  goHome: () => ipcRenderer.invoke("zeno:offline:home"),
  retry: () => ipcRenderer.invoke("zeno:offline:retry"),
});

