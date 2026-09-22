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
        studentId: z.string().uuid(),
        hours: z.number().int().min(1).max(168).default(12),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // O cliente autenticado respeita a RLS: só enxerga alunos da própria instituição.
    const { data: student, error } = await context.supabase
      .from("students")
      .select("id, organization_id")
      .eq("id", data.studentId)
      .maybeSingle();
    if (error || !student) throw new Error("Criança não encontrada nesta instituição.");

    const value = token();
    const expiresAt = new Date(Date.now() + data.hours * 3600_000).toISOString();
    const { error: insErr } = await context.supabase.from("report_shares").insert({
      token: value,
      student_id: student.id,
      organization_id: student.organization_id,
      created_by: context.userId,
      expires_at: expiresAt,
    });
    if (insErr) throw new Error(insErr.message);

    return { token: value, expiresAt };
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
  .inputValidator((data) => z.object({ token: z.string().trim().min(10).max(64) }).parse(data))
  .handler(async ({ data }): Promise<{ ok: false; reason: "invalid" | "expired" } | { ok: true; report: SharedReport }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: share } = await supabaseAdmin
      .from("report_shares")
      .select("student_id, organization_id, expires_at, revoked")
      .eq("token", data.token)
      .maybeSingle();

    if (!share || share.revoked) return { ok: false as const, reason: "invalid" as const };
    if (new Date(share.expires_at).getTime() < Date.now()) return { ok: false as const, reason: "expired" as const };

    const since = new Date(Date.now() - 90 * 86400000).toISOString();
    const [{ data: student }, { data: org }, { data: sessions }] = await Promise.all([
      supabaseAdmin.from("students").select("full_name, nickname").eq("id", share.student_id).maybeSingle(),
      supabaseAdmin.from("organizations").select("name").eq("id", share.organization_id).maybeSingle(),
      supabaseAdmin
        .from("game_sessions")
        .select("game_slug, score, hits, misses, level, played_at, duration_seconds")
        .eq("student_id", share.student_id)
        .gte("played_at", since)
        .order("played_at", { ascending: false })
        .limit(600),
    ]);

    if (!student) return { ok: false as const, reason: "invalid" as const };

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
