/**
 * Liberação de aplicativos por mesa.
 * O super admin define quais aplicativos cada mesa usa e até quando.
 * O último estado conhecido fica no dispositivo para funcionar off-line.
 */
import { supabase } from "@/integrations/supabase/client";
import { getDeviceCode } from "@/lib/session-sync";
import type { ZenoAppId } from "@/lib/apps";

export interface AppAccess {
  enabled: boolean;
  expiresAt: string | null;
}

export type AppAccessMap = Partial<Record<ZenoAppId, AppAccess>>;

const CACHE_KEY = "zeno.app-access";

function readCache(): AppAccessMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as AppAccessMap) : {};
  } catch {
    return {};
  }
}

function writeCache(map: AppAccessMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* armazenamento indisponível */
  }
}

/** Estado imediato (cache local), sem esperar a rede. */
export function cachedAppAccess(): AppAccessMap {
  return readCache();
}

/** Busca na nuvem a liberação da mesa atual e atualiza o cache. */
export async function loadAppAccess(): Promise<AppAccessMap> {
  const code = getDeviceCode();
  if (!code) return readCache();
  try {
    const { data: device } = await supabase.from("devices").select("id").eq("code", code).maybeSingle();
    if (!device) return readCache();
    const { data, error } = await supabase
      .from("device_app_access")
      .select("app_id, enabled, expires_at")
      .eq("device_id", device.id);
    if (error || !data) return readCache();
    const map: AppAccessMap = {};
    for (const row of data) {
      map[row.app_id as ZenoAppId] = { enabled: row.enabled, expiresAt: row.expires_at };
    }
    writeCache(map);
    return map;
  } catch {
    return readCache();
  }
}

export type AppState = "ok" | "expired" | "blocked";

/** Sem registro conhecido, o aplicativo continua liberado (mesa nova ou off-line). */
export function appState(map: AppAccessMap, id: ZenoAppId): AppState {
  const entry = map[id];
  if (!entry) return "ok";
  if (!entry.enabled) return "blocked";
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) return "expired";
  return "ok";
}
