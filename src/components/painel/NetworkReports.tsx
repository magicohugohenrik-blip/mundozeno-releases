import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Municipality { id: string; name: string; state: string | null }
interface OrgRow { id: string; name: string; type: string; municipality_id: string | null }

interface SessionRow {
  organization_id: string;
  student_id: string;
  game_slug: string;
  score: number;
  hits: number;
  misses: number;
  duration_seconds: number;
  played_at: string;
}

interface Agg {
  key: string;
  name: string;
  sessions: number;
  children: number;
  hits: number;
  misses: number;
  minutes: number;
  accuracy: number;
}

const PERIODS: [number, string][] = [
  [7, "7 dias"],
  [30, "30 dias"],
  [90, "90 dias"],
  [365, "12 meses"],
];

/** Fase 5 do PRD — relatórios agregados da rede (município → instituição → atividade). */
export function NetworkReports({ munis, orgs }: { munis: Municipality[]; orgs: OrgRow[] }) {
  const [days, setDays] = useState(30);
  const [muniFilter, setMuniFilter] = useState<string>("all");
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase
      .from("game_sessions")
      .select("organization_id, student_id, game_slug, score, hits, misses, duration_seconds, played_at")
      .gte("played_at", since)
      .order("played_at", { ascending: false })
      .limit(10000);
    if (error) toast.error(error.message);
    setRows((data ?? []) as SessionRow[]);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const orgById = useMemo(() => new Map(orgs.map((o) => [o.id, o])), [orgs]);

  const scoped = useMemo(() => {
    if (muniFilter === "all") return rows;
    return rows.filter((r) => {
      const org = orgById.get(r.organization_id);
      const mid = org?.municipality_id ?? null;
      return muniFilter === "none" ? mid === null : mid === muniFilter;
    });
  }, [rows, muniFilter, orgById]);

  const byMuni = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    for (const r of scoped) {
      const key = orgById.get(r.organization_id)?.municipality_id ?? "none";
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, list]) =>
      aggregate(key, key === "none" ? "Particulares (sem município)" : muniName(munis, key), list),
    ).sort((a, b) => b.sessions - a.sessions);
  }, [scoped, orgById, munis]);

  const byOrg = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    for (const r of scoped) {
      const list = map.get(r.organization_id) ?? [];
      list.push(r);
      map.set(r.organization_id, list);
    }
    return [...map.entries()]
      .map(([key, list]) => aggregate(key, orgById.get(key)?.name ?? "Instituição", list))
      .sort((a, b) => b.sessions - a.sessions);
  }, [scoped, orgById]);

  const byGame = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    for (const r of scoped) {
      const list = map.get(r.game_slug) ?? [];
      list.push(r);
      map.set(r.game_slug, list);
    }
    return [...map.entries()]
      .map(([key, list]) => aggregate(key, key, list))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 15);
  }, [scoped]);

  const total = useMemo(() => aggregate("total", "Rede", scoped), [scoped]);

  function exportCsv() {
    const header = ["nivel", "nome", "criancas", "partidas", "acertos", "erros", "precisao_%", "minutos"];
    const lines: string[][] = [];
    for (const a of byMuni) lines.push(["Município", a.name, a.children, a.sessions, a.hits, a.misses, a.accuracy, a.minutes].map(String));
    for (const a of byOrg) lines.push(["Instituição", a.name, a.children, a.sessions, a.hits, a.misses, a.accuracy, a.minutes].map(String));
    for (const a of byGame) lines.push(["Atividade", a.name, a.children, a.sessions, a.hits, a.misses, a.accuracy, a.minutes].map(String));
    const csv = [header, ...lines].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mundo-zeno-rede-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4">
        <span className="text-sm font-semibold">Período:</span>
        {PERIODS.map(([d, label]) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${days === d ? "bg-zeno-blue text-white" : "bg-secondary"}`}
          >
            {label}
          </button>
        ))}
        <select
          value={muniFilter}
          onChange={(e) => setMuniFilter(e.target.value)}
          className="ml-auto rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">Todos os municípios</option>
          {munis.map((m) => (
            <option key={m.id} value={m.id}>{m.name}{m.state ? ` / ${m.state}` : ""}</option>
          ))}
          <option value="none">Particulares</option>
        </select>
        <button onClick={exportCsv} className="rounded-xl bg-zeno-blue px-4 py-1.5 text-sm font-semibold text-white">
          Exportar CSV
        </button>
      </section>

      {loading ? (
        <p className="text-muted-foreground">Carregando relatórios da rede…</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi label="Partidas" value={total.sessions} icon="🎮" />
            <Kpi label="Crianças ativas" value={total.children} icon="🧒" />
            <Kpi label="Instituições ativas" value={byOrg.length} icon="🏫" />
            <Kpi label="Precisão média" value={`${total.accuracy}%`} icon="🎯" />
            <Kpi label="Minutos de uso" value={total.minutes} icon="⏱️" />
          </section>

          <Table title="Por município" rows={byMuni} />
          <Table title="Por instituição" rows={byOrg} />
          <Table title="Atividades mais usadas" rows={byGame} />
        </>
      )}
    </div>
  );
}

function muniName(munis: Municipality[], id: string) {
  const m = munis.find((x) => x.id === id);
  return m ? `${m.name}${m.state ? ` / ${m.state}` : ""}` : "Município";
}

function aggregate(key: string, name: string, list: SessionRow[]): Agg {
  let hits = 0;
  let misses = 0;
  let seconds = 0;
  const kids = new Set<string>();
  for (const r of list) {
    hits += r.hits;
    misses += r.misses;
    seconds += r.duration_seconds;
    kids.add(r.student_id);
  }
  return {
    key,
    name,
    sessions: list.length,
    children: kids.size,
    hits,
    misses,
    minutes: Math.round(seconds / 60),
    accuracy: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0,
  };
}

function Table({ title, rows }: { title: string; rows: Agg[] }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <section>
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Partidas</th>
              <th className="px-4 py-2">Crianças</th>
              <th className="px-4 py-2">Precisão</th>
              <th className="px-4 py-2">Minutos</th>
              <th className="px-4 py-2 w-40">Uso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-border">
                <td className="px-4 py-2 font-semibold">{r.name}</td>
                <td className="px-4 py-2">{r.sessions}</td>
                <td className="px-4 py-2">{r.children}</td>
                <td className="px-4 py-2">{r.accuracy}%</td>
                <td className="px-4 py-2">{r.minutes}</td>
                <td className="px-4 py-2">
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-zeno-blue" style={{ width: `${(r.sessions / max) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Kpi({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="text-2xl">{icon}</span>
      <p className="font-display text-3xl">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
