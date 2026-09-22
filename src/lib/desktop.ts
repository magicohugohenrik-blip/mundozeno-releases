/**
 * Ponte com o aplicativo Windows (Electron).
 * No navegador tudo devolve valores neutros, então a mesma tela funciona na web.
 */

export interface DesktopBridge {
  platform: string;
  appVersion: string;
  quit: () => void;
  relaunch: () => void;
  setAutoLaunch: (enabled: boolean) => Promise<boolean>;
  getAutoLaunch: () => Promise<boolean>;
  checkForUpdates: () => Promise<{ available: boolean; version?: string; error?: string }>;
  setKiosk: (enabled: boolean) => Promise<boolean>;
  shutdown?: () => Promise<{ ok: boolean; error?: string }>;
  onWillShutdown?: (cb: () => void) => () => void;
}

function bridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { zenoDesktop?: DesktopBridge }).zenoDesktop ?? null;
}

export function isDesktop(): boolean {
  return bridge() !== null;
}

export function desktopVersion(): string | null {
  return bridge()?.appVersion ?? null;
}

export function quitApp(): void {
  bridge()?.quit();
}

export function relaunchApp(): void {
  bridge()?.relaunch();
}

export async function getAutoLaunch(): Promise<boolean> {
  return (await bridge()?.getAutoLaunch()) ?? false;
}

export async function setAutoLaunch(enabled: boolean): Promise<boolean> {
  return (await bridge()?.setAutoLaunch(enabled)) ?? false;
}

export async function setNativeKiosk(enabled: boolean): Promise<boolean> {
  return (await bridge()?.setKiosk(enabled)) ?? false;
}

export async function checkForUpdates(
  currentVersion: string,
): Promise<{ available: boolean; version?: string }> {
  const native = bridge();
  if (native) return native.checkForUpdates();
  // Web/PWA: pede ao service worker para buscar uma versão nova dos arquivos.
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    /* ignorado */
  }
  return { available: false, version: currentVersion };
}

/** Verdadeiro quando o aplicativo instalado consegue desligar o computador. */
export function canShutdown(): boolean {
  return typeof bridge()?.shutdown === "function";
}

/** Pede ao Windows um desligamento normal (nunca corte de energia). */
export async function shutdownComputer(): Promise<{ ok: boolean; error?: string }> {
  const native = bridge();
  if (!native?.shutdown) return { ok: false, error: "web" };
  return native.shutdown();
}

/** Avisa a plataforma que a mesa vai desligar, para salvar tudo antes. */
export function onWillShutdown(cb: () => void): () => void {
  return bridge()?.onWillShutdown?.(cb) ?? (() => {});
}
