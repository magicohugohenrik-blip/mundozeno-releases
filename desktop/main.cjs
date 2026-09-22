/**
 * Mundo Zeno — aplicativo Windows (mesa interativa).
 * Abre a plataforma em tela cheia/quiosque, sem barra de tarefas nem menus,
 * e mantém os dados locais da mesa entre atualizações.
 */
const { app, BrowserWindow, ipcMain, session, shell, dialog } = require("electron");
const path = require("node:path");
const { exec } = require("node:child_process");
const { autoUpdater } = require("electron-updater");

const APP_URL = process.env.ZENO_URL || "https://turmadozeno.lovable.app";
const isDev = !app.isPackaged;

let win = null;

// Uma única instância: evita duas mesas abertas no mesmo computador.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    show: false,
    fullscreen: true,
    kiosk: !isDev,
    autoHideMenuBar: true,
    backgroundColor: "#0b1020",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.setMenuBarVisibility(false);
  win.once("ready-to-show", () => win.show());
  win.loadURL(APP_URL);

  // A criança nunca sai do aplicativo: links externos são bloqueados.
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(APP_URL)) event.preventDefault();
  });

  // Sem internet no primeiro carregamento: tenta de novo em 5s.
  win.webContents.on("did-fail-load", () => {
    setTimeout(() => win && win.loadURL(APP_URL), 5000);
  });
}

app.whenReady().then(() => {
  // Tela sempre acesa e sem pedidos de permissão intrusivos.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "fullscreen" || permission === "media");
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());

/* ------- Ponte usada pela área técnica da mesa ------- */

// Versão real do aplicativo: fonte única, lida do próprio executável instalado.
ipcMain.handle("zeno:version", () => app.getVersion());
ipcMain.on("zeno:version-sync", (event) => {
  event.returnValue = app.getVersion();
});


ipcMain.handle("zeno:quit", () => {
  app.quit();
  return true;
});

ipcMain.handle("zeno:relaunch", () => {
  app.relaunch();
  app.exit(0);
  return true;
});

ipcMain.handle("zeno:auto-launch:get", () => app.getLoginItemSettings().openAtLogin);

ipcMain.handle("zeno:auto-launch:set", (_e, enabled) => {
  app.setLoginItemSettings({ openAtLogin: !!enabled, path: process.execPath, args: [] });
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle("zeno:kiosk", (_e, enabled) => {
  if (!win) return false;
  win.setKiosk(!!enabled);
  win.setFullScreen(!!enabled);
  return win.isKiosk();
});

/* ------- Atualização do aplicativo instalado -------
 * A comparação usa sempre app.getVersion() (versão real instalada) contra a
 * versão publicada em latest.yml na release já configurada. Nenhum dado local
 * (mesa, fila offline, PIN) é apagado nesse processo.
 */
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false;

function sendStatus(status) {
  if (win && !win.isDestroyed()) win.webContents.send("zeno:update:status", status);
}

autoUpdater.on("checking-for-update", () => sendStatus({ status: "checking" }));
autoUpdater.on("update-available", (info) =>
  sendStatus({ status: "available", version: info && info.version }),
);
autoUpdater.on("update-not-available", () =>
  sendStatus({ status: "not-available", version: app.getVersion() }),
);
autoUpdater.on("download-progress", (p) =>
  sendStatus({ status: "downloading", percent: p && p.percent }),
);
autoUpdater.on("update-downloaded", (info) =>
  sendStatus({ status: "ready", version: info && info.version }),
);
autoUpdater.on("error", (error) => sendStatus({ status: "error", message: String(error) }));

ipcMain.handle("zeno:update:check", async () => {
  if (isDev) return { status: "not-available", version: app.getVersion() };
  try {
    const result = await autoUpdater.checkForUpdates();
    const remote = result && result.updateInfo ? result.updateInfo.version : null;
    if (remote && remote !== app.getVersion()) return { status: "available", version: remote };
    return { status: "not-available", version: app.getVersion() };
  } catch (error) {
    return { status: "error", message: String(error) };
  }
});

ipcMain.handle("zeno:update:download", async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { status: "ready" };
  } catch (error) {
    return { status: "error", message: String(error) };
  }
});

ipcMain.handle("zeno:update:install", () => {
  autoUpdater.quitAndInstall(false, true);
  return true;
});

/** Botão antigo da área técnica: verifica a atualização real do aplicativo. */
ipcMain.handle("zeno:update", async () => {
  if (isDev) return { available: false, version: app.getVersion() };
  try {
    const result = await autoUpdater.checkForUpdates();
    const remote = result && result.updateInfo ? result.updateInfo.version : null;
    if (remote && remote !== app.getVersion()) {
      await autoUpdater.downloadUpdate();
      return { available: true, version: remote };
    }
    return { available: false, version: app.getVersion() };
  } catch (error) {
    return { available: false, version: app.getVersion(), error: String(error) };
  }
});

/** Abre as configurações de Wi-Fi do Windows a pedido da tela de Configurações. */
ipcMain.handle("zeno:wifi", () => {
  if (process.platform === "win32") exec("start ms-settings:network-wifi", { shell: "cmd.exe" });
  return true;
});

/**
 * Desligamento seguro do computador da mesa.
 * A janela é avisada para salvar os dados, o aplicativo encerra normalmente
 * e o Windows recebe um pedido de desligamento comum (nunca corte de energia).
 */
ipcMain.handle("zeno:shutdown", async () => {
  try {
    if (win) win.webContents.send("zeno:will-shutdown");
    // Tempo para o navegador gravar a fila local antes de encerrar.
    await new Promise((r) => setTimeout(r, 1200));

    if (process.platform === "win32") {
      // /s = desligar, /t 5 = 5s de margem, /f só fecha janelas já avisadas.
      exec('shutdown /s /t 5 /c "Mundo Zeno esta desligando a mesa com seguranca."');
    } else if (process.platform === "darwin") {
      exec('osascript -e \'tell application "System Events" to shut down\'');
    } else {
      exec("shutdown -h +0");
    }

    setTimeout(() => app.quit(), 800);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

ipcMain.handle("zeno:open-external", (_e, url) => shell.openExternal(url));

process.on("uncaughtException", (error) => {
  dialog.showErrorBox("Mundo Zeno", String(error));
});
