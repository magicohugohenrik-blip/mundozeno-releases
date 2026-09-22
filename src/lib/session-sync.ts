import { supabase } from "@/integrations/supabase/client";
import type { GameEvent } from "@/lib/gameTelemetry";
import { logLocalPlay } from "@/lib/local-report";
import { desktopVersion } from "@/lib/desktop";

/** Versão usada só quando a mesa roda no navegador (sem o aplicativo instalado). */
const WEB_VERSION = "web";

/**
 * Fonte única da versão da mesa: no aplicativo instalado vem de app.getVersion()
 * (Electron), nunca de um número fixo no código.
 */
export function appVersion(): string {
  return desktopVersion() ?? WEB_VERSION;
}

export interface PendingSession {
  organization_id: string;
  student_id: string;
  game_slug: string;
  skill: string;
  level: number;
  score: number;
  hits: number;
  misses: number;
  duration_seconds: number;
  device_code: string | null;
  played_at: string;
  /** Identificador gerado na mesa: garante que a partida nunca seja gravada duas vezes. */
  client_uuid?: string;
  /** Eventos finos da partida (acerto, erro, dica, tempo de reação). */
  events?: GameEvent[];
  /** Nome da criança, guardado só na mesa para o relatório off-line. */
  student_name?: string;
}

const KEY = "zeno_sync_queue";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function read(): PendingSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as PendingSession[];
  } catch {
    return [];
  }
}

function write(items: PendingSession[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function pendingCount(): number {
  return read().length;
}

export function getDeviceCode(): string {
  if (typeof window === "undefined") return "ZENO-00000";
  let code = window.localStorage.getItem("zeno_device_code");
  if (!code) {
    code = `ZENO-${String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0")}`;
    window.localStorage.setItem("zeno_device_code", code);
  }
  return code;
}

/** Ativa esta mesa com um código gerado no painel do administrador. */
export function setDeviceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (typeof window !== "undefined" && clean) window.localStorage.setItem("zeno_device_code", clean);
  return clean;
}

/** Gera um código de ativação único para uma nova mesa. */
export function generateDeviceCode(): string {
  const block = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MESA-${block()}-${block()}`;
}

/** Avisa o painel que esta mesa está viva (última sincronização + versão instalada). */
export async function heartbeat(): Promise<void> {
  const code = getDeviceCode();
  if (!code) return;
  await supabase
    .from("devices")
    .update({ last_sync_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), app_version: appVersion() })
    .eq("code", code);
}

/** Salva a sessão. Offline-first: guarda localmente e envia quando houver conexão. */
export async function recordSession(session: PendingSession): Promise<void> {
  const queue = read();
  queue.push({ ...session, client_uuid: session.client_uuid ?? uuid() });
  write(queue);
  // Histórico local: permite o relatório simplificado na mesa mesmo off-line.
  const events = session.events ?? [];
  logLocalPlay({
    student_id: session.student_id,
    student_name: session.student_name ?? "",
    game_slug: session.game_slug,
    skill: session.skill,
    score: session.score,
    hits: session.hits,
    misses: session.misses,
    duration_seconds: session.duration_seconds,
    response_ms: events.map((e) => e.response_time_ms ?? 0).filter((n) => n > 0),
    hints: events.filter((e) => e.event_type === "hint").length,
    played_at: session.played_at,
  });
  await flushQueue();
}

export async function flushQueue(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return read().length;
  const queue = read();
  if (queue.length === 0) return 0;
  const rows = queue.map(({ events: _events, student_name: _name, ...rest }) => ({
    ...rest,
    client_uuid: rest.client_uuid ?? uuid(),
  }));
  // Idempotente: reenvios da mesma partida são ignorados pelo identificador da mesa.
  const { data, error } = await supabase
    .from("game_sessions")
    .upsert(rows, { onConflict: "client_uuid", ignoreDuplicates: true })
    .select("id, client_uuid");
  if (error) return queue.length;
  const idByUuid = new Map((data ?? []).map((r) => [r.client_uuid, r.id]));
  const eventRows = queue.flatMap((item, i) => {
    const sessionUuid = rows[i]?.client_uuid ?? "";
    return (item.events ?? []).map((e, j) => ({
      organization_id: item.organization_id,
      student_id: item.student_id,
      session_id: idByUuid.get(sessionUuid) ?? null,
      client_uuid: `${sessionUuid.slice(0, 28)}${String(j).padStart(8, "0").slice(-8)}`,
      game_slug: item.game_slug,
      event_type: e.event_type,
      response_time_ms: e.response_time_ms ?? null,
      payload: JSON.parse(JSON.stringify(e.payload ?? {})) as never,
    }));
  });

  if (eventRows.length > 0) {
    await supabase.from("game_events").upsert(eventRows, { onConflict: "client_uuid", ignoreDuplicates: true });
  }
  write([]);
  void heartbeat();
  return 0;
}
