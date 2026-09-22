import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { readSharedReport } from "@/lib/report-share.functions";
import { arcadeBySlug } from "@/lib/arcade/catalog";
import { literacyBySlug } from "@/lib/literacy/catalog";
import { fonoBySlug } from "@/lib/fono/catalog";

export const Route = createFileRoute("/m/$token")({
  head: () => ({
    meta: [
      { title: "Relatório da criança — Mundo Zeno" },
      { name: "description", content: "Acompanhe no celular a evolução da criança na mesa Mundo Zeno." },
      { property: "og:title", content: "Relatório da criança — Mundo Zeno" },
      { property: "og:description", content: "Gráficos e evolução da criança gerados pela mesa interativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MobileReport,
});

function gameTitle(slug: string): string {
  const a = arcadeBySlug(slug);
  if (a) return a.title.pt;
  const l = literacyBySlug(slug);
  if (l) return l.title.pt;
  const f = fonoBySlug(slug);
  if (f) return f.title.pt;
  return slug;
}

function MobileReport() {
  const { token } = Route.useParams();
  const fetchReport = useServerFn(readSharedReport);
  const { data, isPending } = useQuery({
    queryKey: ["shared-report", token],
    queryFn: () => fetchReport({ data: { token } }),
    refetchInterval: 60_000,
  });

  if (isPending) {
    return <Shell><p className="text-muted-foreground">Carregando relatório…</p></Shell>;
  }

  if (!data?.ok) {
    return (
      <Shell>
        <h1 className="font-display text-2xl">Link indisponível</h1>
        <p className="mt-2 text-muted-foreground">
          {data && !data.ok && data.reason === "expired"
            ? "Este link expirou. Gere um novo QR Code na mesa."
            : "Este link não é válido. Gere um novo QR Code na mesa."}
        </p>
      </Shell>
    );
  }

  const r = data.report;
  const daily = r.daily.map((d) => ({
    dia: new Date(`${d.day}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    acertos: d.hits,
    erros: d.misses,
  }));
  const games = r.games.map((g) => ({ jogo: gameTitle(g.slug), acerto: g.accuracy, sessoes: g.sessions }));

  return (
    <Shell>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mundo Zeno</p>
        <h1 className="font-display text-3xl leading-tight">{r.student.nickname || r.student.name}</h1>
        {r.organization && <p className="text-sm text-muted-foreground">{r.organization}</p>}
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Atividades" value={String(r.totals.sessions)} />
        <Kpi label="Aproveitamento" value={`${r.totals.accuracy}%`} />
        <Kpi label="Acertos" value={String(r.totals.hits)} />
        <Kpi label="Tempo de jogo" value={`${r.totals.minutes} min`} />
      </div>

      <Card title="Evolução (últimos dias)">
        {daily.length === 0 ? (
          <Empty />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="acertos" stroke="hsl(var(--chart-1, 200 80% 45%))" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="erros" stroke="hsl(var(--chart-2, 0 70% 60%))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Aproveitamento por atividade">
        {games.length === 0 ? (
          <Empty />
        ) : (
          <div style={{ height: Math.max(180, games.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={games} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" domain={[0, 100]} fontSize={11} />
                <YAxis type="category" dataKey="jogo" width={120} fontSize={10} />
                <Tooltip />
                <Bar dataKey="acerto" fill="hsl(var(--chart-1, 200 80% 45%))" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Últimas atividades">
        {r.recent.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {r.recent.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-semibold">{gameTitle(s.slug)}</p>
                  <p className="text-xs text-muted-foreground">
                    Nível {s.level} · {new Date(s.playedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {s.hits}✓ {s.misses}✗
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="pb-8 text-xs text-muted-foreground">
        Este relatório é um apoio pedagógico e não substitui avaliação clínica. Link válido até{" "}
        {new Date(r.expiresAt).toLocaleString("pt-BR")}.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg space-y-4 bg-background p-4">{children}</main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-display text-lg">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Ainda não há dados neste período.</p>;
}
