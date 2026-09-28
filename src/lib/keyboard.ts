import { supabase } from "@/integrations/supabase/client";
import { getDeviceCode } from "@/lib/session-sync";

/**
 * Teclado virtual da mesa. Fica ligado por padrão e pode ser desligado
 * pelo super administrador, mesa por mesa (coluna `virtual_keyboard`).
 * O valor é guardado no dispositivo para funcionar offline.
 */

const KEY = "zeno_virtual_keyboard";
export const KEYBOARD_EVENT = "zeno-keyboard-setting";

/** Celulares e tablets já têm teclado próprio — o teclado da mesa é desligado neles. */
export function isPhone(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod|iPad|Android|Mobi|Silk|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  // iPad recente se identifica como Macintosh: reconhecido pelo toque na tela.
  const touchPoints = navigator.maxTouchPoints ?? 0;
  if (/Macintosh/i.test(ua) && touchPoints > 1) return true;
  // Tela pequena com toque = aparelho de mão (a mesa tem tela grande).
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const small = Math.min(window.innerWidth, window.innerHeight) < 820;
  return coarse && small;
}

export function keyboardEnabled(): boolean {
  if (typeof window === "undefined") return false;
  // App Windows da mesa: sempre tela touch grande, mesmo com resolução baixa.
  const desktopApp = window.location.protocol === "zeno-app:" || "zenoDesktop" in window;
  if (!desktopApp && isPhone()) return false;
  return window.localStorage.getItem(KEY) !== "off";
}


export function setKeyboardEnabledLocal(on: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, on ? "on" : "off");
  window.dispatchEvent(new CustomEvent(KEYBOARD_EVENT));
}

/** Busca no painel se esta mesa deve mostrar o teclado na tela. */
export async function syncKeyboardSetting(): Promise<void> {
  try {
    const { data } = await supabase
      .from("devices")
      .select("virtual_keyboard")
      .eq("code", getDeviceCode())
      .maybeSingle();
    if (data && typeof data.virtual_keyboard === "boolean") setKeyboardEnabledLocal(data.virtual_keyboard);
  } catch {
    /* offline: mantém o valor guardado na mesa */
  }
}
