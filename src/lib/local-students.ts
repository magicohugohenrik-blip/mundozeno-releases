import { supabase } from "@/integrations/supabase/client";

/**
 * Crianças guardadas na própria mesa (offline-first).
 *
 * Cada criança recebe um identificador único gerado na mesa (uuid) e um estado
 * de sincronização. Como o mesmo identificador é usado no banco, as partidas
 * gravadas off-line continuam ligadas à criança correta e nada é duplicado:
 * o envio usa upsert pelo próprio identificador.
 */

export interface LocalStudent {
  id: string;
  full_name: string;
  nickname: string | null;
  organization_id: string;
  birth_date: string | null;
  avatar: { color?: string; face?: string; character?: string } | null;
  /** Cadastro completo feito na mesa (anamnese e CIDs), quando houver. */
  anamnesis?: Record<string, string> | null;
  cid_codes?: string[] | null;
  /** "pending" ainda não chegou ao servidor; "synced" já está gravada. */
  sync: "pending" | "synced";
  updated_at: string;
}


const KEY = "zeno_students_local";
const ORG_KEY = "zeno_org_id";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function read(): LocalStudent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as LocalStudent[];
  } catch {
    return [];
  }
}

function write(items: LocalStudent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

/** Guarda a unidade da mesa para o cadastro continuar possível sem internet. */
export function rememberOrg(orgId: string) {
  if (typeof window !== "undefined" && orgId) window.localStorage.setItem(ORG_KEY, orgId);
}

export function rememberedOrg(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ORG_KEY);
}

/** Lista as crianças da mesa (cadastros locais + o que já veio do servidor). */
export function listLocalStudents(orgId?: string | null): LocalStudent[] {
  const all = read();
  const list = orgId ? all.filter((s) => s.organization_id === orgId) : all;
  return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export function pendingStudentCount(): number {
  return read().filter((s) => s.sync === "pending").length;
}

/** Atualiza o cache com o que veio do servidor, sem perder cadastros pendentes. */
export function cacheServerStudents(
  rows: Omit<LocalStudent, "sync" | "updated_at" | "birth_date">[],
): LocalStudent[] {
  const local = read();
  const pendingById = new Map(local.filter((s) => s.sync === "pending").map((s) => [s.id, s]));
  const fromServer: LocalStudent[] = rows.map((r) => ({
    ...r,
    birth_date: null,
    sync: "synced",
    updated_at: new Date().toISOString(),
  }));
  const merged = [...fromServer.filter((s) => !pendingById.has(s.id)), ...pendingById.values()];
  write(merged);
  return merged;
}

/** Cadastra uma criança na mesa. Funciona igual com ou sem internet. */
export function saveStudentLocal(data: {
  organization_id: string;
  full_name: string;
  nickname?: string | null;
  birth_date?: string | null;
  character?: string;
  anamnesis?: Record<string, string> | null | undefined;
  cid_codes?: string[] | null | undefined;
}): LocalStudent {
  const item: LocalStudent = {
    id: uuid(),
    organization_id: data.organization_id,
    full_name: data.full_name,
    nickname: data.nickname || null,
    birth_date: data.birth_date || null,
    avatar: data.character ? { character: data.character } : null,
    anamnesis: data.anamnesis ?? null,
    cid_codes: data.cid_codes ?? null,
    sync: "pending",
    updated_at: new Date().toISOString(),
  };

  write([...read(), item]);
  return item;
}

/** Edita uma criança na mesa; a alteração fica pendente até haver conexão. */
export function updateStudentLocal(id: string, patch: Partial<Omit<LocalStudent, "id">>): LocalStudent | null {
  const all = read();
  const index = all.findIndex((s) => s.id === id);
  if (index < 0) return null;
  const current = all[index]!;
  const next: LocalStudent = {
    ...current,
    ...patch,
    id: current.id,
    sync: "pending",
    updated_at: new Date().toISOString(),
  };
  all[index] = next;
  write(all);
  return next;
}

/**
 * Envia as crianças pendentes. Idempotente: reenvios da mesma criança são
 * gravados pelo mesmo identificador, nunca criando um registro repetido.
 * Se falhar, os dados continuam na mesa para uma nova tentativa depois.
 */
export async function flushStudents(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return pendingStudentCount();
  const all = read();
  const pending = all.filter((s) => s.sync === "pending");
  if (pending.length === 0) return 0;

  const rows = pending.map((s) => ({
    id: s.id,
    organization_id: s.organization_id,
    full_name: s.full_name,
    nickname: s.nickname,
    // Só envia a data quando existe, para não apagar o que já está gravado.
    ...(s.birth_date ? { birth_date: s.birth_date } : {}),
    ...(s.anamnesis && Object.keys(s.anamnesis).length > 0 ? { anamnesis: s.anamnesis as never } : {}),
    ...(s.cid_codes && s.cid_codes.length > 0 ? { cid_codes: s.cid_codes } : {}),
    avatar: (s.avatar ?? {}) as never,
  }));


  const { error } = await supabase.from("students").upsert(rows, { onConflict: "id" });
  if (error) return pending.length;

  write(all.map((s) => (s.sync === "pending" ? { ...s, sync: "synced" } : s)));
  return 0;
}
