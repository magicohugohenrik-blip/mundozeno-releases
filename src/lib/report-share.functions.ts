import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Relatório da criança no celular do profissional.
 * A mesa gera um link curto (QR Code) com validade; o celular abre o relatório
 * somente leitura, sem login e sem acesso a nada administrativo.
 */

function token(): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(22));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Profissional autenticado na mesa cria o link temporário do relatório. */
export const createReportShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        /** Sem criança: link unificado da mesa (turmas, crianças, relatórios e gráficos). */
        studentId: z.string().uuid().optional(),
        /** Validade em horas (usado pelos atalhos rápidos). */
        hours: z.number().int().min(1).max(168).default(12),
        /** Validade em dias digitada pelo profissional. */
        days: z.number().int().min(1).max(3650).optional(),
        /** Acesso sem tempo determinado (validade longa de 10 anos). */
        unlimited: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const hours = data.unlimited ? 3650 * 24 : data.days ? data.days * 24 : data.hours;
    const value = token();
    const expiresAt = new Date(Date.now() + hours * 3600_000).toISOString();

    if (!data.studentId) {
      // Link da mesa inteira: usa a instituição do profissional autenticado.
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", context.userId)
        .maybeSingle();
      if (!profile?.organization_id) throw new Error("Esta conta não está vinculada a uma instituição.");
      const { error } = await context.supabase.from("report_org_shares").insert({
        token: value,
        organization_id: profile.organization_id,
        created_by: context.userId,
        expires_at: expiresAt,
      });
      if (error) throw new Error(error.message);
      return { token: value, expiresAt, unlimited: !!data.unlimited, scope: "org" as const };
    }

    // O cliente autenticado respeita a RLS: só enxerga alunos da própria instituição.
    const { data: student, error } = await context.supabase
      .from("students")
      .select("id, organization_id")
      .eq("id", data.studentId)
      .maybeSingle();
    if (error || !student) throw new Error("Criança não encontrada nesta instituição.");

    const { error: insErr } = await context.supabase.from("report_shares").insert({
      token: value,
      student_id: student.id,
      organization_id: student.organization_id,
      created_by: context.userId,
      expires_at: expiresAt,
    });
    if (insErr) throw new Error(insErr.message);

    return { token: value, expiresAt, unlimited: !!data.unlimited, scope: "student" as const };
  });

type Resolved =
  | { ok: false; reason: "invalid" | "expired" }
  | { ok: true; organizationId: string; studentId: string | null; expiresAt: string };

/** Descobre a que instituição (e criança, quando houver) o token dá acesso. */
async function resolveShare(value: string): Promise<Resolved> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: one }, { data: all }] = await Promise.all([
    supabaseAdmin
      .from("report_shares")
      .select("student_id, organization_id, expires_at, revoked")
      .eq("token", value)
      .maybeSingle(),
    supabaseAdmin
      .from("report_org_shares")
      .select("organization_id, expires_at, revoked")
      .eq("token", value)
      .maybeSingle(),
  ]);

  const share = one ?? all;
  if (!share || share.revoked) return { ok: false, reason: "invalid" };
  if (new Date(share.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  return {
    ok: true,
    organizationId: share.organization_id,
    studentId: one ? one.student_id : null,
    expiresAt: share.expires_at,
  };
}



/**
 * Cadastro de criança pelo celular do profissional (link do QR Code).
 * O token comprova que o profissional recebeu o acesso da própria mesa;
 * a criança entra somente na instituição daquela mesa.
 */
export const createStudentFromShare = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().trim().min(10).max(64),
        fullName: z.string().trim().min(2).max(120),
        nickname: z.string().trim().max(60).optional(),
        birthDate: z.string().trim().max(10).optional(),
        character: z.string().trim().max(30).default("zeno"),
        /** Cadastro completo: anamnese e CIDs (opcionais). */
        anamnesis: z.record(z.string(), z.string().max(1000)).optional(),
        cids: z.array(z.string().trim().max(12)).max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: false; reason: "invalid" | "expired" } | { ok: true; name: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const resolved = await resolveShare(data.token);
    if (!resolved.ok) return { ok: false as const, reason: resolved.reason };

    const { error } = await supabaseAdmin.from("students").insert({
      organization_id: resolved.organizationId,

      full_name: data.fullName,
      nickname: data.nickname || null,
      birth_date: data.birthDate || null,
      avatar: { character: data.character },
      ...(data.anamnesis && Object.keys(data.anamnesis).length > 0 ? { anamnesis: data.anamnesis } : {}),
      ...(data.cids && data.cids.length > 0 ? { cid_codes: data.cids } : {}),
    });
    if (error) throw new Error(error.message);


    return { ok: true as const, name: data.fullName };
  });

export interface SharedReport {
  student: { name: string; nickname: string | null };
  organization: string | null;
  expiresAt: string;
  totals: { sessions: number; hits: number; misses: number; accuracy: number; minutes: number };
  daily: { day: string; hits: number; misses: number; sessions: number }[];
  games: { slug: string; sessions: number; hits: number; misses: number; accuracy: number }[];
  recent: { slug: string; level: number; score: number; hits: number; misses: number; playedAt: string }[];
}

/** Leitura pública do relatório por token (usada pelo celular). */
export const readSharedReport = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().trim().min(10).max(64),
        /** Token da mesa inteira: escolhe qual criança abrir. */
        studentId: z.string().uuid().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: false; reason: "invalid" | "expired" } | { ok: true; report: SharedReport }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const resolved = await resolveShare(data.token);
    if (!resolved.ok) return { ok: false as const, reason: resolved.reason };

    const studentId = resolved.studentId ?? data.studentId;
    if (!studentId) return { ok: false as const, reason: "invalid" as const };
    const share = {
      student_id: studentId,
      organization_id: resolved.organizationId,
      expires_at: resolved.expiresAt,
    };

    const since = new Date(Date.now() - 90 * 86400000).toISOString();
    const [{ data: student }, { data: org }, { data: sessions }] = await Promise.all([
      supabaseAdmin
        .from("students")
        .select("full_name, nickname, organization_id")
        .eq("id", share.student_id)
        .maybeSingle(),
      supabaseAdmin.from("organizations").select("name").eq("id", share.organization_id).maybeSingle(),
      supabaseAdmin
        .from("game_sessions")
        .select("game_slug, score, hits, misses, level, played_at, duration_seconds")
        .eq("student_id", share.student_id)
        .gte("played_at", since)
        .order("played_at", { ascending: false })
        .limit(600),
    ]);

    // A criança precisa pertencer à instituição do link.
    if (!student || student.organization_id !== resolved.organizationId) {
      return { ok: false as const, reason: "invalid" as const };
    }


    type Row = {
      game_slug: string;
      score: number | null;
      hits: number | null;
      misses: number | null;
      level: number | null;
      played_at: string;
      duration_seconds?: number | null;
    };
    const rows = (sessions ?? []) as Row[];

    let hits = 0;
    let misses = 0;
    let seconds = 0;
    const byDay = new Map<string, { hits: number; misses: number; sessions: number }>();
    const byGame = new Map<string, { sessions: number; hits: number; misses: number }>();

    for (const r of rows) {
      const h = r.hits ?? 0;
      const m = r.misses ?? 0;
      hits += h;
      misses += m;
      seconds += r.duration_seconds ?? 0;
      const day = r.played_at.slice(0, 10);
      const d = byDay.get(day) ?? { hits: 0, misses: 0, sessions: 0 };
      byDay.set(day, { hits: d.hits + h, misses: d.misses + m, sessions: d.sessions + 1 });
      const g = byGame.get(r.game_slug) ?? { sessions: 0, hits: 0, misses: 0 };
      byGame.set(r.game_slug, { sessions: g.sessions + 1, hits: g.hits + h, misses: g.misses + m });
    }

    const pct = (h: number, m: number) => (h + m ? Math.round((h / (h + m)) * 100) : 0);

    return {
      ok: true as const,
      report: {
        student: { name: student.full_name, nickname: student.nickname ?? null },
        organization: org?.name ?? null,
        expiresAt: share.expires_at,
        totals: {
          sessions: rows.length,
          hits,
          misses,
          accuracy: pct(hits, misses),
          minutes: Math.round(seconds / 60),
        },
        daily: [...byDay.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-30)
          .map(([day, v]) => ({ day, ...v })),
        games: [...byGame.entries()]
          .map(([slug, v]) => ({ slug, ...v, accuracy: pct(v.hits, v.misses) }))
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 12),
        recent: rows.slice(0, 15).map((r) => ({
          slug: r.game_slug,
          level: r.level ?? 1,
          score: r.score ?? 0,
          hits: r.hits ?? 0,
          misses: r.misses ?? 0,
          playedAt: r.played_at,
        })),
      },
    };
  });

export interface SharedOverview {
  organization: string | null;
  expiresAt: string;
  classes: { id: string; name: string; ageRange: string | null; students: number }[];
  students: {
    id: string;
    name: string;
    nickname: string | null;
    classId: string | null;
    character: string | null;
    sessions: number;
    accuracy: number;
    minutes: number;
    lastPlayedAt: string | null;
  }[];
  totals: { sessions: number; hits: number; misses: number; accuracy: number; minutes: number; children: number };
  daily: { day: string; hits: number; misses: number; sessions: number }[];
  games: { slug: string; sessions: number; hits: number; misses: number; accuracy: number }[];
}

/**
 * Leitura pública da mesa inteira por token (turmas, crianças, relatórios e gráficos).
 * Funciona com o token unificado da mesa; com token de uma criança devolve só ela.
 */
export const readSharedOverview = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ token: z.string().trim().min(10).max(64) }).parse(data))
  .handler(
    async ({
      data,
    }): Promise<
      { ok: false; reason: "invalid" | "expired" } | { ok: true; scope: "org" | "student"; overview: SharedOverview }
    > => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const resolved = await resolveShare(data.token);
      if (!resolved.ok) return { ok: false as const, reason: resolved.reason };

      const since = new Date(Date.now() - 90 * 86400000).toISOString();
      const studentQuery = supabaseAdmin
        .from("students")
        .select("id, full_name, nickname, class_id, avatar")
        .eq("organization_id", resolved.organizationId)
        .eq("active", true)
        .order("full_name");

      const [{ data: org }, { data: classRows }, { data: studentRows }] = await Promise.all([
        supabaseAdmin.from("organizations").select("name").eq("id", resolved.organizationId).maybeSingle(),
        supabaseAdmin
          .from("classes")
          .select("id, name, age_range")
          .eq("organization_id", resolved.organizationId)
          .order("name"),
        resolved.studentId ? studentQuery.eq("id", resolved.studentId) : studentQuery,
      ]);

      const students = (studentRows ?? []) as {
        id: string;
        full_name: string;
        nickname: string | null;
        class_id: string | null;
        avatar: { character?: string } | null;
      }[];
      const ids = students.map((s) => s.id);

      type Row = {
        student_id: string;
        game_slug: string;
        hits: number | null;
        misses: number | null;
        played_at: string;
        duration_seconds?: number | null;
      };
      let rows: Row[] = [];
      if (ids.length > 0) {
        const { data: sessions } = await supabaseAdmin
          .from("game_sessions")
          .select("student_id, game_slug, hits, misses, played_at, duration_seconds")
          .in("student_id", ids)
          .gte("played_at", since)
          .order("played_at", { ascending: false })
          .limit(3000);
        rows = (sessions ?? []) as Row[];
      }

      const pct = (h: number, m: number) => (h + m ? Math.round((h / (h + m)) * 100) : 0);

      let hits = 0;
      let misses = 0;
      let seconds = 0;
      const byDay = new Map<string, { hits: number; misses: number; sessions: number }>();
      const byGame = new Map<string, { sessions: number; hits: number; misses: number }>();
      const byStudent = new Map<
        string,
        { sessions: number; hits: number; misses: number; seconds: number; last: string | null }
      >();

      for (const r of rows) {
        const h = r.hits ?? 0;
        const m = r.misses ?? 0;
        const secs = r.duration_seconds ?? 0;
        hits += h;
        misses += m;
        seconds += secs;
        const day = r.played_at.slice(0, 10);
        const d = byDay.get(day) ?? { hits: 0, misses: 0, sessions: 0 };
        byDay.set(day, { hits: d.hits + h, misses: d.misses + m, sessions: d.sessions + 1 });
        const g = byGame.get(r.game_slug) ?? { sessions: 0, hits: 0, misses: 0 };
        byGame.set(r.game_slug, { sessions: g.sessions + 1, hits: g.hits + h, misses: g.misses + m });
        const st = byStudent.get(r.student_id) ?? { sessions: 0, hits: 0, misses: 0, seconds: 0, last: null };
        byStudent.set(r.student_id, {
          sessions: st.sessions + 1,
          hits: st.hits + h,
          misses: st.misses + m,
          seconds: st.seconds + secs,
          last: st.last && st.last > r.played_at ? st.last : r.played_at,
        });
      }

      const classes = ((classRows ?? []) as { id: string; name: string; age_range: string | null }[]).map((c) => ({
        id: c.id,
        name: c.name,
        ageRange: c.age_range ?? null,
        students: students.filter((s) => s.class_id === c.id).length,
      }));

      return {
        ok: true as const,
        scope: resolved.studentId ? ("student" as const) : ("org" as const),
        overview: {
          organization: org?.name ?? null,
          expiresAt: resolved.expiresAt,
          classes,
          students: students.map((s) => {
            const st = byStudent.get(s.id);
            return {
              id: s.id,
              name: s.full_name,
              nickname: s.nickname ?? null,
              classId: s.class_id ?? null,
              character: s.avatar?.character ?? null,
              sessions: st?.sessions ?? 0,
              accuracy: pct(st?.hits ?? 0, st?.misses ?? 0),
              minutes: Math.round((st?.seconds ?? 0) / 60),
              lastPlayedAt: st?.last ?? null,
            };
          }),
          totals: {
            sessions: rows.length,
            hits,
            misses,
            accuracy: pct(hits, misses),
            minutes: Math.round(seconds / 60),
            children: students.length,
          },
          daily: [...byDay.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-30)
            .map(([day, v]) => ({ day, ...v })),
          games: [...byGame.entries()]
            .map(([slug, v]) => ({ slug, ...v, accuracy: pct(v.hits, v.misses) }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 12),
        },
      };
    },
  );
