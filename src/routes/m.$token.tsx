import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, GraduationCap, LineChart as LineIcon, Printer, Users } from "lucide-react";
import { NewStudentForm } from "@/components/zeno/NewStudentForm";
import { portraitOf } from "@/lib/zeno";
import { isHandheld } from "@/lib/deviceKind";
import { createStudentFromShare, readSharedOverview, readSharedReport } from "@/lib/report-share.functions";
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
import { arcadeBySlug } from "@/lib/arcade/catalog";
import { literacyBySlug } from "@/lib/literacy/catalog";
import { fonoBySlug } from "@/lib/fono/catalog";

export const Route = createFileRoute("/m/$token")({
  head: () => ({
    meta: [
      { title: "Relatórios da mesa — Mundo Zeno" },
      { name: "description", content: "Acompanhe no celular turmas, crianças, relatórios e gráficos da mesa Mundo Zeno." },
      { property: "og:title", content: "Relatórios da mesa — Mundo Zeno" },
      { property: "og:description", content: "Turmas, crianças, relatórios e gráficos gerados pela mesa interativa." },
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

type Tab = "turmas" | "criancas" | "relatorios" | "graficos";

const TABS: { key: Tab; label: string; Icon: typeof Users }[] = [
  { key: "turmas", label: "Turmas", Icon: GraduationCap },
  { key: "criancas", label: "Crianças", Icon: Users },
  { key: "relatorios", label: "Relatórios", Icon: BarChart3 },
  { key: "graficos", label: "Gráficos", Icon: LineIcon },
];

function MobileReport() {
  const { token } = Route.useParams();
  const fetchOverview = useServerFn(readSharedOverview);
  const fetchReport = useServerFn(readSharedReport);
  const addStudent = useServerFn(createStudentFromShare);
  const [tab, setTab] = useState<Tab>("relatorios");
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [canPrint, setCanPrint] = useState(false);
  useEffect(() => setCanPrint(isHandheld()), []);

  const overview = useQuery({
    queryKey: ["shared-overview", token],
    queryFn: () => fetchOverview({ data: { token } }),
    refetchInterval: 60_000,
  });

  const detail = useQuery({
    queryKey: ["shared-report", token, studentId],
    queryFn: () => fetchReport({ data: { token, ...(studentId ? { studentId } : {}) } }),
    enabled: !!studentId,
  });

  if (overview.isPending) {
    return <Shell><p className="text-muted-foreground">Carregando dados da mesa…</p></Shell>;
  }

  const data = overview.data;
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

  const o = data.overview;
  const single = data.scope === "student" ? o.students[0] ?? null : null;
  const active = studentId ?? single?.id ?? null;
  const activeName = o.students.find((s) => s.id === active)?.nickname ?? o.students.find((s) => s.id === active)?.name;

  const daily = o.daily.map((d) => ({
    dia: new Date(`${d.day}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    acertos: d.hits,
    erros: d.misses,
  }));
  const games = o.games.map((g) => ({ jogo: gameTitle(g.slug), acerto: g.accuracy, sessoes: g.sessions }));

  const report = detail.data?.ok ? detail.data.report : null;

  return (
    <Shell>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mundo Zeno</p>
          <h1 className="font-display text-2xl leading-tight">
            {single ? single.nickname || single.name : o.organization || "Mesa Mundo Zeno"}
          </h1>
          {!single && o.organization && <p className="text-sm text-muted-foreground">Relatórios da mesa</p>}
        </div>
        {canPrint && (
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold active:scale-95"
          >
            <Printer size={16} strokeWidth={2.2} />
            Imprimir
          </button>
        )}
      </header>

      <nav className="no-print flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
              tab === key ? "bg-zeno-blue text-white" : "border border-border bg-card"
            }`}
          >
            <Icon size={16} strokeWidth={2.2} />
            {label}
          </button>
        ))}
      </nav>

      {tab === "turmas" && (
        <Card title="Turmas da instituição">
          {o.classes.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {o.classes.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    {c.ageRange && <p className="text-xs text-muted-foreground">{c.ageRange}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                    {c.students} criança(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "criancas" && (
        <>
          {!single && (
            <section className="no-print rounded-2xl border border-border bg-card p-4">
              {showForm ? (
                <>
                  <h2 className="font-display text-lg">Cadastrar criança</h2>
                  <p className="mb-3 mt-1 text-xs text-muted-foreground">
                    A criança entra na lista desta mesa e já pode jogar.
                  </p>
                  <NewStudentForm
                    onCancel={() => setShowForm(false)}
                    onSave={async (d) => {
                      const res = await addStudent({
                        data: {
                          token,
                          fullName: d.fullName,
                          nickname: d.nickname,
                          birthDate: d.birthDate,
                          character: d.character,
                          ...(d.anamnesis ? { anamnesis: d.anamnesis } : {}),
                          ...(d.cids ? { cids: d.cids } : {}),
                        },
                      });
                      if (!res.ok) {
                        toast.error(
                          res.reason === "expired"
                            ? "Este link expirou. Gere um novo QR Code na mesa."
                            : "Este link não é mais válido.",
                        );
                        return;
                      }
                      toast.success(`${res.name} cadastrado(a)!`);
                      setShowForm(false);
                      void overview.refetch();
                    }}
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="w-full rounded-xl bg-zeno-green px-5 py-3 font-display text-base text-white active:scale-95"
                >
                  Cadastrar nova criança
                </button>
              )}
            </section>
          )}

          <Card title="Crianças da mesa">
            {o.students.length === 0 ? (
              <Empty />
            ) : (
              <ul className="divide-y divide-border">
                {o.students.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentId(s.id);
                        setTab("relatorios");
                      }}
                      className="flex w-full items-center gap-3 py-2 text-left active:scale-[0.99]"
                    >
                      <img
                        src={portraitOf(s.character ?? undefined)}
                        alt=""
                        width={96}
                        height={96}
                        className="h-10 w-10 shrink-0 rounded-full bg-secondary object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{s.nickname || s.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {s.sessions} atividade(s) · {s.accuracy}% de acerto
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {tab === "relatorios" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Kpi label={single ? "Atividades" : "Crianças"} value={String(single ? o.totals.sessions : o.totals.children)} />
            <Kpi label="Aproveitamento" value={`${o.totals.accuracy}%`} />
            <Kpi label="Acertos" value={String(o.totals.hits)} />
            <Kpi label="Tempo de jogo" value={`${o.totals.minutes} min`} />
          </div>

          {active && (
            <Card title={`Detalhe de ${activeName ?? "criança"}`}>
              {detail.isPending && <p className="text-sm text-muted-foreground">Carregando…</p>}
              {report && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Kpi label="Atividades" value={String(report.totals.sessions)} />
                    <Kpi label="Aproveitamento" value={`${report.totals.accuracy}%`} />
                  </div>
                  <ul className="mt-3 divide-y divide-border text-sm">
                    {report.recent.map((s, i) => (
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
                    {report.recent.length === 0 && <Empty />}
                  </ul>
                </>
              )}
              {!single && (
                <button
                  type="button"
                  onClick={() => setStudentId(null)}
                  className="no-print mt-3 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
                >
                  Ver a mesa inteira
                </button>
              )}
            </Card>
          )}

          {!active && (
            <Card title="Crianças com mais atividades">
              {o.students.length === 0 ? (
                <Empty />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {[...o.students]
                    .sort((a, b) => b.sessions - a.sessions)
                    .slice(0, 10)
                    .map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="truncate font-semibold">{s.nickname || s.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {s.sessions} · {s.accuracy}% · {s.minutes} min
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}

      {tab === "graficos" && (
        <>
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
        </>
      )}

      <p className="pb-8 text-xs text-muted-foreground">
        Este relatório é um apoio pedagógico e não substitui avaliação clínica. Link válido até{" "}
        {new Date(o.expiresAt).toLocaleString("pt-BR")}.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-dvh w-full max-w-lg space-y-4 bg-background p-4">{children}</main>;
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
