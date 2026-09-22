/**
 * Ponte com o atualizador do aplicativo instalado (Electron).
 * No navegador tudo devolve valores neutros e a interface avisa que a
 * atualização só existe no aplicativo da mesa.
 */

export interface UpdateStatus {
  status: "idle" | "checking" | "available" | "not-available" | "downloading" | "ready" | "error";
  version?: string;
  percent?: number;
  message?: string;
}

interface UpdaterBridge {
  checkForUpdates: () => Promise<UpdateStatus | void>;
  downloadUpdate: () => Promise<UpdateStatus | void>;
  installUpdate: () => Promise<void> | void;
  onUpdateStatus: (cb: (s: UpdateStatus) => void) => (() => void) | void;
}

function bridge(): UpdaterBridge | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { mundoZenoUpdater?: UpdaterBridge }).mundoZenoUpdater ?? null;
}

export function hasUpdater(): boolean {
  return bridge() !== null;
}

export async function checkForUpdates(): Promise<UpdateStatus | null> {
  const api = bridge();
  if (!api) return null;
  return (await api.checkForUpdates()) ?? null;
}

export async function downloadUpdate(): Promise<UpdateStatus | null> {
  const api = bridge();
  if (!api) return null;
  return (await api.downloadUpdate()) ?? null;
}

export function installUpdate(): void {
  void bridge()?.installUpdate();
}

export function onUpdateStatus(cb: (s: UpdateStatus) => void): () => void {
  const off = bridge()?.onUpdateStatus(cb);
  return typeof off === "function" ? off : () => {};
}

/** Abre as configurações de Wi-Fi do sistema (implementado na camada Electron/Windows). */
export function openWifiSettings(): boolean {
  const api = (typeof window === "undefined"
    ? null
    : (window as unknown as { mundoZenoSystem?: { openWifiSettings?: () => void } }).mundoZenoSystem) ?? null;
  if (api?.openWifiSettings) {
    api.openWifiSettings();
    return true;
  }
  return false;
}
