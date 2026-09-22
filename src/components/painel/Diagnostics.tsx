import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateAssessment } from "@/lib/assessment.functions";
import { cidLabel } from "@/lib/cid";
import { anamnesisFilled } from "@/lib/anamnesis";
import { gameCatalog } from "@/lib/zeno";
import { arcadeBySlug } from "@/lib/arcade/catalog";
import { actionBySlug } from "@/lib/arcade/action";
import { literacyBySlug } from "@/lib/literacy/catalog";
import { skillLabels, type SkillId } from "@/lib/skills";
import { toast } from "sonner";

/** Nome legível de um jogo, olhando todos os catálogos (clássicos, gerados, dinâmicos, alfabetização). */
function gameTitle(slug: string): string {
  const classic = gameCatalog.find((g) => g.slug === slug);
  if (classic) return classic.title;
  const arcade = arcadeBySlug(slug);
  if (arcade) return arcade.title.pt;
  const action = actionBySlug(slug);
  if (action) return action.title.pt;
  const literacy = literacyBySlug(slug);
  if (literacy) return literacy.title.pt;
  return slug;
}

/** Habilidade em texto amigável (o banco guarda o identificador). */
function skillTitle(skill: string): string {
  const pt = skillLabels.pt;
  return skill
    .split(",")
    .map((s) => s.trim())
    .map((s) => pt[s as SkillId] ?? s.charAt(0).toUpperCase() + s.slice(1))
    .join(" · ");
}

interface StudentLite {
  id: string;
  full_name: string;
  nickname: string | null;
  anamnesis?: Record<string, string> | null;
  cid_codes?: string[] | null;
}

interface Assessment {
  id: string;
  student_id: string;
  period_days: number;
  summary: string;
  strengths: string;
  attention_points: string;
  recommendations: string;
  metrics: Metrics | null;
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
}

/** Aba "Relatório": relatório de desempenho gerado a partir da jogabilidade + anamnese. */
export function Diagnostics({ students }: { students: StudentLite[] }) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [days, setDays] = useState(90);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Assessment[]>([]);

  const load = useCallback(async () => {
    if (!studentId) return;
    const { data } = await supabase
      .from("assessments")
      .select("id, student_id, period_days, summary, strengths, attention_points, recommendations, metrics, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);
    setList((data ?? []) as unknown as Assessment[]);
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const student = students.find((s) => s.id === studentId);

  async function run() {
    if (!studentId) return;
    setBusy(true);
    try {
      await generateAssessment({ data: { studentId, periodDays: days } });
      toast.success("Relatório gerado!");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar o relatório.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display text-xl">Relatório de desempenho</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Combina a anamnese, os CIDs registrados e tudo que a criança fez nos jogos (acertos, erros, tempo de resposta,
          dicas) para gerar um relatório de desempenho. Não substitui avaliação clínica.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2"
          >
            <option value="">Escolha a criança</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-xl border border-border bg-background px-4 py-2"
          >
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={180}>Últimos 6 meses</option>
            <option value={365}>Último ano</option>
          </select>
          <button
            onClick={run}
            disabled={!studentId || busy}
            className="rounded-full bg-zeno-blue px-6 py-2 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Analisando…" : "Gerar relatório"}
          </button>
        </div>
        {student && (
          <p className="mt-3 text-sm text-muted-foreground">
            Anamnese: {anamnesisFilled(student.anamnesis)} campos preenchidos ·{" "}
            {student.cid_codes?.length ? student.cid_codes.map(cidLabel).join(" · ") : "sem CID registrado"}
          </p>
        )}
      </div>

      {list.map((a) => (
        <article key={a.id} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg">
              Relatório de {new Date(a.created_at).toLocaleDateString("pt-BR")}
            </h3>
            <span className="text-sm text-muted-foreground">Período: {a.period_days} dias</span>
          </header>

          {a.metrics && <MetricsGrid m={a.metrics} />}

          <Block title="Resumo" text={a.summary} />
          <Block title="Pontos fortes" text={a.strengths} />
          <Block title="Pontos de atenção" text={a.attention_points} />
          <Block title="Recomendações" text={a.recommendations} />

          {a.metrics && Object.keys(a.metrics.bySkill).length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Desempenho por habilidade</h4>
              <div className="space-y-1">
                {Object.entries(a.metrics.bySkill)
                  .sort((x, y) => y[1].accuracy - x[1].accuracy)
                  .map(([skill, v]) => (
                    <div key={skill} className="flex items-center gap-3 text-sm">
                      <span className="w-44 shrink-0">{skillTitle(skill)}</span>
                      <div className="h-2 flex-1 rounded-full bg-secondary">
                        <div className="h-2 rounded-full bg-zeno-green" style={{ width: `${v.accuracy}%` }} />
                      </div>
                      <span className="w-24 text-right text-muted-foreground">
                        {v.accuracy}% · {v.sessions}x
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {a.metrics && Object.keys(a.metrics.byGame).length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Atividades jogadas</h4>
              <div className="flex flex-wrap gap-2 text-sm">
                {Object.entries(a.metrics.byGame).map(([slug, v]) => (
                  <span key={slug} className="rounded-full bg-secondary px-3 py-1">
                    {gameTitle(slug)} · {v.sessions}x · {v.avgScore} pts
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Este relatório é um apoio pedagógico gerado a partir da jogabilidade e da anamnese. Não substitui o
            diagnóstico de um profissional de saúde.
          </p>

          <button
            onClick={() => window.print()}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
          >
            Imprimir / salvar PDF
          </button>
        </article>
      ))}

      {studentId && list.length === 0 && (
        <p className="text-muted-foreground">Nenhum relatório gerado para esta criança ainda.</p>
      )}
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function MetricsGrid({ m }: { m: Metrics }) {
  const cells: [string, string][] = [
    ["Partidas", String(m.sessions)],
    ["Atividades", String(m.games)],
    ["Acerto geral", `${m.accuracy}%`],
    ["Tempo médio", `${m.avgDurationSeconds}s`],
    ["Resposta média", m.avgResponseMs ? `${(m.avgResponseMs / 1000).toFixed(1)}s` : "—"],
    ["Dicas usadas", String(m.hintsUsed)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
      {cells.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-secondary/60 p-3 text-center">
          <p className="font-display text-xl">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
