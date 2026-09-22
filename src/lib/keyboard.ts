import { supabase } from "@/integrations/supabase/client";
import { getDeviceCode } from "@/lib/session-sync";

/**
 * Teclado virtual da mesa. Fica ligado por padrão e pode ser desligado
 * pelo super administrador, mesa por mesa (coluna `virtual_keyboard`).
 * O valor é guardado no dispositivo para funcionar offline.
 */

const KEY = "zeno_virtual_keyboard";
export const KEYBOARD_EVENT = "zeno-keyboard-setting";

export function keyboardEnabled(): boolean {
  if (typeof window === "undefined") return false;
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
