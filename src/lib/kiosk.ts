/**
 * Modo quiosque da mesa (Fase 6 do PRD).
 * Tudo local no dispositivo: tela cheia, bloqueio de gestos do sistema,
 * tela sempre acesa e saída protegida por PIN.
 */

const KEY_ON = "zeno_kiosk_on";
const KEY_PIN = "zeno_kiosk_pin";
const DEFAULT_PIN = "2468";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wakeLock: any = null;

export function kioskEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY_ON) === "1";
}

export function kioskPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN;
  return window.localStorage.getItem(KEY_PIN) || DEFAULT_PIN;
}

export function setKioskPin(pin: string): void {
  const clean = pin.replace(/\D/g, "").slice(0, 8);
  if (typeof window !== "undefined" && clean.length >= 4) window.localStorage.setItem(KEY_PIN, clean);
}

function blockEvent(e: Event) {
  e.preventDefault();
}

export async function enterKiosk(): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_ON, "1");
  attachGuards();
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  } catch {
    /* alguns navegadores exigem gesto do usuário; o botão já é um gesto */
  }
  await requestWakeLock();
}

export async function exitKiosk(pin: string): Promise<boolean> {
  if (pin !== kioskPin()) return false;
  if (typeof window === "undefined") return false;
  window.localStorage.removeItem(KEY_ON);
  detachGuards();
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* ignorado */
  }
  try {
    await wakeLock?.release?.();
  } catch {
    /* ignorado */
  }
  wakeLock = null;
  return true;
}

async function requestWakeLock() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (nav.wakeLock?.request) wakeLock = await nav.wakeLock.request("screen");
  } catch {
    /* sem suporte */
  }
}

function attachGuards() {
  document.addEventListener("contextmenu", blockEvent);
  document.addEventListener("gesturestart", blockEvent);
  document.addEventListener("dragstart", blockEvent);
  document.body.style.userSelect = "none";
  document.body.style.touchAction = "manipulation";
}

function detachGuards() {
  document.removeEventListener("contextmenu", blockEvent);
  document.removeEventListener("gesturestart", blockEvent);
  document.removeEventListener("dragstart", blockEvent);
  document.body.style.userSelect = "";
  document.body.style.touchAction = "";
}

/** Reaplica o modo quiosque quando a mesa é reiniciada com o modo ligado. */
export function restoreKiosk(): void {
  if (typeof window === "undefined" || !kioskEnabled()) return;
  attachGuards();
  void requestWakeLock();
  const retry = () => {
    if (kioskEnabled()) void requestWakeLock();
  };
  document.addEventListener("visibilitychange", retry);
}
