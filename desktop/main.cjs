/**
 * Mundo Zeno — aplicativo Windows (mesa interativa).
 * Abre a plataforma em tela cheia/quiosque, sem barra de tarefas nem menus,
 * e mantém os dados locais da mesa entre atualizações.
 */
const { app, BrowserWindow, ipcMain, session, shell, dialog, protocol, net } = require("electron");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const fs = require("node:fs");
const { exec } = require("node:child_process");
const { autoUpdater } = require("electron-updater");

const APP_URL = process.env.ZENO_URL || "https://turmadozeno.lovable.app";
const isDev = !app.isPackaged;

// Modo offline: se a pasta "webapp" vier embutida no instalador, a aplicação
// é carregada dos arquivos locais e não depende da internet nem do Lovable.
// Sem ela, cai no site publicado (comportamento atual da versão web).
const LOCAL_INDEX = path.join(__dirname, "webapp", "index.html");
const OFFLINE_PAGE = path.join(__dirname, "offline.html");
const hasLocalApp = fs.existsSync(LOCAL_INDEX);

function loadApp(target) {
  if (hasLocalApp) return target.loadURL(LOCAL_ORIGIN + "/");
  return target.loadURL(APP_URL);
}

/** Tela amigável de "sem internet", com botão de voltar para o início. */
function loadOfflinePage(target) {
  if (fs.existsSync(OFFLINE_PAGE)) return target.loadFile(OFFLINE_PAGE);
  return loadApp(target);
}


/**
 * Os arquivos locais são servidos por "zeno-app://mesa/", uma origem própria:
 * caminhos absolutos ("/assets/...", "/app-covers/...") e rotas internas
 * resolvem dentro de webapp/, sem cair na raiz do disco (C:\\) do Windows.
 */
const WEBAPP_DIR = path.join(__dirname, "webapp");
const LOCAL_ORIGIN = "zeno-app://mesa";
protocol.registerSchemesAsPrivileged([
  { scheme: "zeno-app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);
function installLocalFileRedirect() {
  if (!hasLocalApp || installLocalFileRedirect.done) return;
  installLocalFileRedirect.done = true;
  protocol.handle("zeno-app", async (request) => {
    const reqUrl = new URL(request.url);
    // Funções do servidor (ativação da mesa, sincronização) vão para o site publicado.
    if (reqUrl.pathname.startsWith("/_serverFn/") || reqUrl.pathname.startsWith("/api/")) {
      const remote = APP_URL.replace(/\/+$/, "") + reqUrl.pathname + reqUrl.search;
      const headers = new Headers(request.headers);
      // Proteção CSRF do servidor: a chamada precisa parecer vir do próprio site.
      const appOrigin = new URL(APP_URL).origin;
      headers.set("origin", appOrigin);
      headers.set("referer", appOrigin + "/");
      const hasBody = !["GET", "HEAD"].includes(request.method);
      try {
        return await net.fetch(remote, {
          method: request.method,
          headers,
          body: hasBody ? await request.arrayBuffer() : undefined,
          // Sem resposta em 20s: trata como offline em vez de travar a mesa.
          signal: AbortSignal.timeout(20000),
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "offline", message: String(error) }), {
          status: 503,
          headers: { "content-type": "application/json" },
        });
      }
    }
    let rel = decodeURIComponent(reqUrl.pathname).replace(/^\/+/, "");
    let file = path.normalize(path.join(WEBAPP_DIR, rel));
    if (!file.startsWith(WEBAPP_DIR) || !rel || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = LOCAL_INDEX; // rotas internas do app (/, /painel, ...) abrem o index
    }
    return net.fetch(pathToFileURL(file).toString());
  });
}

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
  installLocalFileRedirect();
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
  loadApp(win);

  // A criança nunca sai do aplicativo: links externos são bloqueados.
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (!hasLocalApp && !url.startsWith(APP_URL)) event.preventDefault();
  });

  // Sem internet: mostra a tela amigável com "Voltar para o início".
  // Em modo local (offline pronto), só acontece se a própria página falhar.
  win.webContents.on("did-fail-load", (_e, _code, _desc, _url, isMainFrame) => {
    if (isMainFrame && win) loadOfflinePage(win);
  });
}

/* ------- Tela "sem internet" ------- */

ipcMain.handle("zeno:offline:home", () => {
  if (win) loadApp(win);
  return true;
});

ipcMain.handle("zeno:offline:retry", () => {
  if (win) loadApp(win);
  return true;
});


/* ------- Recuperação da ativação de versões anteriores -------
 * O navegador guarda os dados (localStorage) separados por endereço de origem.
 * Versões antigas abriam a mesa pelo site (https://turmadozeno.lovable.app) ou por
 * file://; a atual abre por zeno-app://mesa. A ativação salva lá continua no disco,
 * mas a nova origem não a enxerga. Aqui lemos (só leitura) essas origens antigas
 * e entregamos ao preload, que copia apenas as chaves que ainda não existem.
 */
let legacyStorage = {};

async function readOriginStorage(load) {
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
  try {
    await Promise.race([load(w), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000))]);
    const json = await w.webContents.executeJavaScript(
      "(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify(o); })()",
    );
    return JSON.parse(json || "{}");
  } catch {
    return {};
  } finally {
    if (!w.isDestroyed()) w.destroy();
  }
}

async function collectLegacyStorage() {
  if (!hasLocalApp) return;
  const appOrigin = new URL(APP_URL).origin;
  const stub = "<!doctype html><title>zeno</title>";
  // Intercepta só o endereço do site durante a leitura: funciona mesmo sem internet.
  protocol.handle("https", (req) =>
    new URL(req.url).origin === appOrigin
      ? new Response(stub, { headers: { "content-type": "text/html" } })
      : net.fetch(req, { bypassCustomProtocolHandlers: true }),
  );
  let fromSite = {};
  try {
    fromSite = await readOriginStorage((w) => w.loadURL(appOrigin + "/__zeno-migrate"));
  } finally {
    protocol.unhandle("https");
  }
  const fromFile = fs.existsSync(OFFLINE_PAGE) ? await readOriginStorage((w) => w.loadFile(OFFLINE_PAGE)) : {};
  // Prioridade: a origem que tem a mesa ativada.
  const ranked = [fromSite, fromFile].sort(
    (a, b) => (b.zeno_device_activated === "1") - (a.zeno_device_activated === "1"),
  );
  legacyStorage = Object.assign({}, ranked[1], ranked[0]);
}

ipcMain.on("zeno:legacy-storage", (event) => {
  event.returnValue = legacyStorage;
});

app.whenReady().then(async () => {
  // Tela sempre acesa e sem pedidos de permissão intrusivos.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "fullscreen" || permission === "media");
  });
  try {
    await collectLegacyStorage();
  } catch {
    /* segue sem migração */
  }
  createWindow();
  // Consulta automática das GitHub Releases: 1 min após abrir e a cada 6 horas.
  // O aviso aparece na tela "Atualização do sistema"; nada é instalado sem confirmação.
  if (!isDev) {
    const check = () => autoUpdater.checkForUpdates().catch(() => {});
    setTimeout(check, 60 * 1000);
    setInterval(check, 6 * 60 * 60 * 1000);
  }
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
