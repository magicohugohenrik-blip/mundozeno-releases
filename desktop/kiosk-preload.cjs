const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("zenoKiosk", {
  exit: (password, action) => ipcRenderer.invoke("zeno:kiosk-exit", { password, action }),
  cancel: () => ipcRenderer.invoke("zeno:kiosk-cancel"),
});
