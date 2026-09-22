import type { SupabaseClient } from "@supabase/supabase-js";
import { anamnesisToText, type Anamnesis } from "@/lib/anamnesis";
import { cidLabel } from "@/lib/cid";

export interface AssessmentResult {
  id: string;
  summary: string;
  strengths: string;
  attention_points: string;
  recommendations: string;
  metrics: Metrics;
  created_at: string;
}

interface Metrics {
  sessions: number;
  games: number;
  totalHits: number;
  totalMisses: number;
  accuracy: number;
  avgDurationSeconds: number;
  avgResponseMs: number | null;
  hintsUsed: number;
  bySkill: Record<string, { hits: number; misses: number; sessions: number; accuracy: number }>;
  byGame: Record<string, { sessions: number; hits: number; misses: number; avgScore: number }>;
  trend: { date: string; score: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

const SKILL_BY_GAME: Record<string, string> = {
  "memoria-turma": "Memória",
  "cores-em-acao": "Percepção visual",
  "formas-e-encaixes": "Coordenação motora",
  "quebra-cabeca-zeno": "Raciocínio visuoespacial",
  "torre-de-argolas": "Motricidade fina",
  "sons-em-sequencia": "Atenção auditiva",
  "quantos-tem": "Raciocínio lógico",
  "qual-nao-combina": "Atenção seletiva",
  "sequencia-magica": "Raciocínio sequencial",
  "pintura-da-turma": "Criatividade",
  "desenho-livre": "Expressão gráfica",
};

export async function buildAssessment(
  supabase: Client,
  userId: string,
  studentId: string,
  periodDays: number,
): Promise<AssessmentResult> {
  const since = new Date(Date.now() - periodDays * 86400000).toISOString();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, full_name, nickname, birth_date, organization_id, anamnesis, cid_codes")
    .eq("id", studentId)
    .maybeSingle();
  if (studentError || !student) throw new Error("Criança não encontrada.");

  const [{ data: sessions }, { data: events }] = await Promise.all([
    supabase
      .from("game_sessions")
      .select("game_slug, skill, level, score, hits, misses, duration_seconds, played_at")
      .eq("student_id", studentId)
      .gte("played_at", since)
      .order("played_at", { ascending: true }),
    supabase
      .from("game_events")
      .select("game_slug, event_type, response_time_ms")
      .eq("student_id", studentId)
      .gte("created_at", since)
      .limit(4000),
  ]);

  const metrics = computeMetrics(sessions ?? [], events ?? []);
  if (metrics.sessions === 0) {
    throw new Error("Esta criança ainda não tem partidas registradas neste período.");
  }

  const report = await askAi(student, metrics, periodDays);

  const { data: saved, error } = await supabase
    .from("assessments")
    .insert({
      organization_id: student.organization_id,
      student_id: studentId,
      author_id: userId,
      period_days: periodDays,
      summary: report.summary,
      strengths: report.strengths,
      attention_points: report.attention_points,
      recommendations: report.recommendations,
      metrics,
    })
    .select("id, summary, strengths, attention_points, recommendations, metrics, created_at")
    .single();
  if (error || !saved) throw new Error(error?.message ?? "Não foi possível salvar a avaliação.");
  return saved as unknown as AssessmentResult;
}

interface SessionRow {
  game_slug: string;
  skill: string | null;
  level: number;
  score: number;
  hits: number;
  misses: number;
  duration_seconds: number;
  played_at: string;
}
interface EventRow {
  game_slug: string;
  event_type: string;
  response_time_ms: number | null;
}

function computeMetrics(sessions: SessionRow[], events: EventRow[]): Metrics {
  const bySkill: Metrics["bySkill"] = {};
  const byGame: Metrics["byGame"] = {};
  let hits = 0;
  let misses = 0;
  let duration = 0;

  for (const s of sessions) {
    hits += s.hits;
    misses += s.misses;
    duration += s.duration_seconds;
    const skill = s.skill || SKILL_BY_GAME[s.game_slug] || "Geral";
    const sk = (bySkill[skill] ??= { hits: 0, misses: 0, sessions: 0, accuracy: 0 });
    sk.hits += s.hits;
    sk.misses += s.misses;
    sk.sessions += 1;
    const g = (byGame[s.game_slug] ??= { sessions: 0, hits: 0, misses: 0, avgScore: 0 });
    g.sessions += 1;
    g.hits += s.hits;
    g.misses += s.misses;
    g.avgScore += s.score;
  }
  for (const sk of Object.values(bySkill)) {
    sk.accuracy = sk.hits + sk.misses > 0 ? Math.round((sk.hits / (sk.hits + sk.misses)) * 100) : 0;
  }
  for (const g of Object.values(byGame)) {
    g.avgScore = Math.round(g.avgScore / Math.max(1, g.sessions));
  }

  const times = events.map((e) => e.response_time_ms).filter((n): n is number => typeof n === "number" && n > 0);
  const hintsUsed = events.filter((e) => e.event_type === "hint").length;

  return {
    sessions: sessions.length,
    games: Object.keys(byGame).length,
    totalHits: hits,
    totalMisses: misses,
    accuracy: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0,
    avgDurationSeconds: Math.round(duration / Math.max(1, sessions.length)),
    avgResponseMs: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
    hintsUsed,
    bySkill,
    byGame,
    trend: sessions.slice(-20).map((s) => ({ date: s.played_at, score: s.score })),
  };
}

interface StudentRow {
  full_name: string;
  nickname: string | null;
  birth_date: string | null;
  anamnesis: Anamnesis | null;
  cid_codes: string[] | null;
}

async function askAi(student: StudentRow, metrics: Metrics, periodDays: number) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const fallback = () => localReport(student, metrics);
  if (!apiKey) return fallback();

  const prompt = `Criança: ${student.nickname || student.full_name}
Data de nascimento: ${student.birth_date ?? "não informada"}
CIDs registrados: ${(student.cid_codes ?? []).map(cidLabel).join("; ") || "nenhum"}

ANAMNESE:
${anamnesisToText(student.anamnesis) || "não preenchida"}

JOGABILIDADE (últimos ${periodDays} dias):
${JSON.stringify(metrics)}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você apoia profissionais de educação e reabilitação infantil. Com base na anamnese, nos CIDs registrados e nos dados de jogabilidade em uma mesa interativa, escreva um relatório de desempenho em português do Brasil. NÃO emita diagnóstico médico nem sugira CID; descreva desempenho observável (atenção, memória, tempo de resposta, coordenação, persistência) e relacione com as informações da anamnese. Responda SOMENTE com JSON válido no formato {\"summary\":\"\",\"strengths\":\"\",\"attention_points\":\"\",\"recommendations\":\"\"}. Cada campo com 2 a 5 frases, linguagem clara para a família e para a equipe.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return fallback();
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallback();
    const parsed = JSON.parse(match[0]) as Record<string, string>;
    return {
      summary: parsed["summary"] ?? "",
      strengths: parsed["strengths"] ?? "",
      attention_points: parsed["attention_points"] ?? "",
      recommendations: parsed["recommendations"] ?? "",
    };
  } catch {
    return fallback();
  }
}

/** Relatório calculado localmente, usado quando a IA não está disponível. */
function localReport(student: StudentRow, m: Metrics) {
  const skills = Object.entries(m.bySkill).sort((a, b) => b[1].accuracy - a[1].accuracy);
  const best = skills.slice(0, 2).map(([k, v]) => `${k} (${v.accuracy}% de acerto)`);
  const worst = skills.slice(-2).map(([k, v]) => `${k} (${v.accuracy}% de acerto)`);
  const name = student.nickname || student.full_name;
  return {
    summary: `${name} realizou ${m.sessions} partidas em ${m.games} atividades no período, com ${m.accuracy}% de acerto geral e tempo médio de ${m.avgDurationSeconds}s por partida${
      m.avgResponseMs ? `, respondendo em média em ${(m.avgResponseMs / 1000).toFixed(1)}s` : ""
    }.`,
    strengths: best.length ? `Melhor desempenho em: ${best.join(", ")}.` : "Ainda sem dados suficientes por habilidade.",
    attention_points: worst.length ? `Áreas a acompanhar: ${worst.join(", ")}. Dicas utilizadas: ${m.hintsUsed}.` : "—",
    recommendations:
      "Manter sessões curtas e regulares, repetindo as atividades com menor acerto em nível mais simples antes de avançar. Reavaliar após novas partidas.",
  };
}
