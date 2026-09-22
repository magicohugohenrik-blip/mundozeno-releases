import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/zeno/BrandMark";
import { avatarCharacters, gameCatalog, portraitOf } from "@/lib/zeno";
import { createOrg, joinOrg } from "@/lib/org.functions";
import { appVersion, generateDeviceCode, getDeviceCode, setDeviceCode } from "@/lib/session-sync";
import { toast } from "sonner";
import { Activities } from "@/components/painel/Activities";
import { Diagnostics } from "@/components/painel/Diagnostics";
import { ReportQr } from "@/components/painel/ReportQr";
import { AdminArea } from "@/components/painel/AdminArea";
import { AnamnesisForm } from "@/components/painel/AnamnesisForm";
import { anamnesisFilled, type Anamnesis } from "@/lib/anamnesis";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel da instituição | Turma do Zeno" },
      {
        name: "description",
        content: "Gerencie turmas, crianças, mesas e acompanhe o desempenho individual na Turma do Zeno.",
      },
      { property: "og:title", content: "Painel da instituição | Turma do Zeno" },
      { property: "og:description", content: "Gestão de turmas, crianças e relatórios de desempenho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Painel,
});

interface Org { id: string; name: string; type: string; city: string | null; join_code: string }
interface Klass { id: string; name: string; age_range: string | null }
interface Student { id: string; full_name: string; nickname: string | null; class_id: string | null; avatar?: { character?: string } | null; anamnesis?: Anamnesis | null; cid_codes?: string[] | null; birth_date?: string | null }
interface Session { game_slug: string; score: number; hits: number; misses: number; level: number; played_at: string; student_id: string }

type Tab = "turmas" | "criancas" | "atividades" | "diagnostico" | "relatorios" | "mesas" | "admin";

function Painel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Org | null>(null);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [tab, setTab] = useState<Tab>("turmas");
  const [roles, setRoles] = useState<string[]>([]);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const [{ data: profile }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("organization_id").eq("id", auth.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", auth.user.id),
    ]);
    setRoles((roleRows ?? []).map((r) => r.role as string));
    if (!profile?.organization_id) {
      setOrg(null);
      setLoading(false);
      return;
    }
    const [o, c, s, g, d] = await Promise.all([
      supabase.from("organizations").select("id, name, type, city, join_code").eq("id", profile.organization_id).maybeSingle(),
      supabase.from("classes").select("id, name, age_range").order("name"),
      supabase.from("students").select("id, full_name, nickname, class_id, avatar, anamnesis, cid_codes, birth_date").eq("active", true).order("full_name"),
      supabase.from("game_sessions").select("game_slug, score, hits, misses, level, played_at, student_id").order("played_at", { ascending: false }).limit(300),
      supabase.from("devices").select("id, code, label, last_sync_at, status, location, app_version").order("created_at"),
    ]);
    setOrg((o.data as Org) ?? null);
    setClasses((c.data ?? []) as Klass[]);
    setStudents((s.data ?? []) as Student[]);
    setSessions((g.data ?? []) as Session[]);
    setDevices(d.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-background">Carregando painel…</main>;
  }

  const isSuper = roles.includes("super_admin");
  const isAdmin = isSuper || roles.includes("city_admin");
  const nav: [Tab, string, string][] = isAdmin ? [...NAV, ["admin", "Administração", "🏛️"]] : NAV;

  if (!org) {
    if (isAdmin) {
      return (
        <main className="min-h-screen bg-muted/40 px-6 py-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <BrandMark />
            <button onClick={signOut} className="rounded-xl border border-border px-4 py-2 font-semibold">
              Sair
            </button>
          </header>
          <h1 className="font-display text-2xl">Administração</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Você ainda não está vinculado a uma instituição. Cadastre uma abaixo ou abra o painel de uma existente.
          </p>
          <AdminArea isSuper={isSuper} currentOrgId={null} onSwitchOrg={load} />
        </main>
      );
    }
    return <CreateOrg onDone={load} />;
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
        <BrandMark />
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-colors ${
                tab === key ? "bg-zeno-blue text-white" : "hover:bg-secondary"
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-2 pt-6">
          <button onClick={() => navigate({ to: "/" })} className="w-full rounded-xl bg-secondary px-4 py-2 font-semibold">
            Modo criança
          </button>
          <button onClick={signOut} className="w-full rounded-xl border border-border px-4 py-2 font-semibold">
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <h1 className="font-display text-2xl">{org.name}</h1>
            <p className="text-sm text-muted-foreground">
              {org.type === "clinica" ? "Clínica" : org.type === "outro" ? "Instituição" : "Escola"}
              {org.city ? ` · ${org.city}` : ""} · {students.length} crianças · {classes.length} turmas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(org.join_code);
                toast.success("Código copiado!");
              }}
              className="rounded-xl border border-border px-4 py-2 text-left"
              title="Copiar código da equipe"
            >
              <span className="block text-xs text-muted-foreground">Código da equipe</span>
              <span className="font-mono font-semibold text-zeno-blue">{org.join_code}</span>
            </button>
            <button onClick={() => navigate({ to: "/" })} className="rounded-xl bg-secondary px-4 py-2 font-semibold lg:hidden">
              Modo criança
            </button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-border bg-card px-6 py-3 lg:hidden">
          {nav.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-5 py-2 font-semibold ${tab === key ? "bg-zeno-blue text-white" : "bg-secondary"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-6 pb-16">
          {tab === "turmas" && <Classes org={org} classes={classes} students={students} reload={load} />}
          {tab === "criancas" && <Students org={org} classes={classes} students={students} reload={load} />}
          {tab === "atividades" && <Activities orgId={org.id} />}
          {tab === "diagnostico" && <Diagnostics students={students} />}
          {tab === "relatorios" && <Reports students={students} sessions={sessions} />}
          {tab === "mesas" && <Devices org={org} devices={devices} reload={load} />}
          {tab === "admin" && isAdmin && <AdminArea isSuper={isSuper} currentOrgId={org.id} onSwitchOrg={load} />}
        </div>
      </main>
    </div>
  );
}

const NAV: [Tab, string, string][] = [
  ["turmas", "Turmas", "🏫"],
  ["criancas", "Crianças", "🧒"],
  ["atividades", "Atividades", "🧩"],
  ["diagnostico", "Relatório", "🧠"],
  ["relatorios", "Gráficos", "📊"],
  ["mesas", "Mesas", "🪵"],
];

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">{children}</div>;
}

const inputCls = "rounded-xl border border-border bg-background px-4 py-2";

function CreateOrg({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <BrandMark className="mb-2" />
        <div className="flex rounded-full bg-secondary p-1">
          {(["create", "join"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full px-4 py-2 font-display ${mode === m ? "bg-zeno-blue text-white" : "text-muted-foreground"}`}
            >
              {m === "create" ? "Criar instituição" : "Entrar em uma existente"}
            </button>
          ))}
        </div>
        {mode === "create" ? (
          <CreateForm busy={busy} setBusy={setBusy} onDone={onDone} />
        ) : (
          <JoinForm busy={busy} setBusy={setBusy} onDone={onDone} />
        )}
      </div>
    </main>
  );
}

function CreateForm({
  busy,
  setBusy,
  onDone,
}: {
  busy: boolean;
  setBusy: (b: boolean) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<"escola" | "clinica" | "outro">("escola");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await createOrg({ data: { name, city, type } });
      if (result) toast.success(`Instituição criada! Código da equipe: ${result.join_code}`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar a instituição.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={create} className="space-y-4">
      <h1 className="font-display text-2xl">Cadastre sua instituição</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome da instituição" className={`w-full ${inputCls}`} />
      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className={`w-full ${inputCls}`} />
      <select value={type} onChange={(e) => setType(e.target.value as "escola" | "clinica" | "outro")} className={`w-full ${inputCls}`}>
        <option value="escola">Escola</option>
        <option value="clinica">Clínica</option>
        <option value="outro">Outro</option>
      </select>
      <button disabled={busy} className="w-full rounded-full bg-zeno-blue px-6 py-3 font-display text-lg text-white disabled:opacity-60">
        Criar instituição
      </button>
    </form>
  );
}

function JoinForm({
  busy,
  setBusy,
  onDone,
}: {
  busy: boolean;
  setBusy: (b: boolean) => void;
  onDone: () => void;
}) {
  const [code, setCode] = useState("");

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await joinOrg({ data: { code } });
      if (result) toast.success(`Bem-vindo a ${result.name}!`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={join} className="space-y-4">
      <h1 className="font-display text-2xl">Entrar em uma instituição</h1>
      <p className="text-sm text-muted-foreground">
        Peça ao administrador da escola ou clínica o código de entrada e digite abaixo.
      </p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
        minLength={4}
        placeholder="CÓDIGO"
        className={`w-full text-center font-mono text-xl tracking-widest ${inputCls}`}
      />
      <button disabled={busy} className="w-full rounded-full bg-zeno-blue px-6 py-3 font-display text-lg text-white disabled:opacity-60">
        Entrar
      </button>
    </form>
  );
}

function Classes({ org, classes, students, reload }: { org: Org; classes: Klass[]; students: Student[]; reload: () => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("classes").insert({ organization_id: org.id, name, age_range: age || null });
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setAge("");
    reload();
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={add} className="flex flex-wrap gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome da turma" className={inputCls} />
          <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Faixa etária (ex.: 4-5 anos)" className={inputCls} />
          <button className="rounded-full bg-zeno-green px-6 py-2 font-semibold text-white">Adicionar turma</button>
        </form>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Card key={c.id}>
            <p className="font-display text-xl">{c.name}</p>
            <p className="text-sm text-muted-foreground">{c.age_range ?? "Sem faixa etária"}</p>
            <p className="mt-2 text-sm">{students.filter((s) => s.class_id === c.id).length} crianças</p>
          </Card>
        ))}
        {classes.length === 0 && <p className="text-muted-foreground">Nenhuma turma cadastrada.</p>}
      </div>
    </div>
  );
}

function Students({ org, classes, students, reload }: { org: Org; classes: Klass[]; students: Student[]; reload: () => void }) {
  const [full, setFull] = useState("");
  const [nick, setNick] = useState("");
  const [birth, setBirth] = useState("");
  const [classId, setClassId] = useState("");
  const [character, setCharacter] = useState("zeno");
  const [anamnesis, setAnamnesis] = useState<Anamnesis>({});
  const [cids, setCids] = useState<string[]>([]);
  const [openAnamnesis, setOpenAnamnesis] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("students").insert({
      organization_id: org.id,
      full_name: full,
      nickname: nick || null,
      birth_date: birth || null,
      class_id: classId || null,
      avatar: { character },
      anamnesis,
      cid_codes: cids,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Criança cadastrada!");
    setFull("");
    setNick("");
    setBirth("");
    setAnamnesis({});
    setCids([]);
    setOpenAnamnesis(false);
    reload();
  }

  async function changeCharacter(id: string, next: string) {
    await supabase.from("students").update({ avatar: { character: next } }).eq("id", id);
    reload();
  }

  async function remove(id: string) {
    await supabase.from("students").update({ active: false }).eq("id", id);
    reload();
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={add} className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Escolha o personagem da Turma do Zeno para esta criança</p>
            <div className="flex flex-wrap gap-3">
              {avatarCharacters.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCharacter(c.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl bg-secondary/40 p-2 ${
                    character === c.id ? "ring-4 ring-zeno-green" : ""
                  }`}
                >
                  <img src={c.image} alt={c.name} className="h-14 w-14 rounded-full object-cover" />
                  <span className="text-xs font-semibold">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <input value={full} onChange={(e) => setFull(e.target.value)} required maxLength={120} placeholder="Nome completo" className={inputCls} />
            <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={60} placeholder="Como gosta de ser chamada" className={inputCls} />
            <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className={inputCls} title="Data de nascimento" />
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
              <option value="">Sem turma</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <button
              type="button"
              onClick={() => setOpenAnamnesis((v) => !v)}
              className="flex w-full items-center justify-between text-left font-display text-lg"
            >
              <span>Anamnese e CID {anamnesisFilled(anamnesis) > 0 || cids.length > 0 ? "✅" : ""}</span>
              <span>{openAnamnesis ? "▲" : "▼"}</span>
            </button>
            {openAnamnesis && (
              <div className="mt-4 max-h-[28rem] overflow-y-auto pr-2">
                <AnamnesisForm value={anamnesis} onChange={setAnamnesis} cids={cids} onCidsChange={setCids} />
              </div>
            )}
          </div>

          <button className="rounded-full bg-zeno-green px-6 py-2 font-semibold text-white">Adicionar criança</button>
        </form>
      </Card>

      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-2">Personagem</th>
              <th className="pb-2">Nome</th>
              <th className="pb-2">Apelido</th>
              <th className="pb-2">Turma</th>
              <th className="pb-2">CID</th>
              <th className="pb-2">Anamnese</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <img src={portraitOf(s.avatar?.character)} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <select
                      value={s.avatar?.character ?? "zeno"}
                      onChange={(e) => changeCharacter(s.id, e.target.value)}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1"
                    >
                      {avatarCharacters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="py-2">{s.full_name}</td>
                <td>{s.nickname ?? "—"}</td>
                <td>{classes.find((c) => c.id === s.class_id)?.name ?? "—"}</td>
                <td className="max-w-[12rem] truncate" title={(s.cid_codes ?? []).join(", ")}>
                  {s.cid_codes?.length ? s.cid_codes.join(", ") : "—"}
                </td>
                <td>{anamnesisFilled(s.anamnesis)} campos</td>
                <td className="space-x-3 text-right">
                  <button onClick={() => setEditing(s)} className="text-zeno-blue underline">Anamnese</button>
                  <button onClick={() => remove(s.id)} className="text-destructive underline">Arquivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <p className="text-muted-foreground">Nenhuma criança cadastrada.</p>}
      </Card>

      {editing && (
        <EditAnamnesis student={editing} onClose={() => setEditing(null)} reload={reload} />
      )}
    </div>
  );
}

function EditAnamnesis({ student, onClose, reload }: { student: Student; onClose: () => void; reload: () => void }) {
  const [anamnesis, setAnamnesis] = useState<Anamnesis>(student.anamnesis ?? {});
  const [cids, setCids] = useState<string[]>(student.cid_codes ?? []);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("students")
      .update({ anamnesis, cid_codes: cids })
      .eq("id", student.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Anamnese atualizada!");
    reload();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Anamnese de {student.full_name}</h2>
          <button onClick={onClose} className="rounded-full bg-secondary px-4 py-1 font-semibold">Fechar</button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto pr-2">
          <AnamnesisForm value={anamnesis} onChange={setAnamnesis} cids={cids} onCidsChange={setCids} />
        </div>
        <button
          onClick={save}
          disabled={busy}
          className="mt-4 rounded-full bg-zeno-green px-6 py-2 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Salvar anamnese"}
        </button>
      </div>
    </div>
  );
}

function Reports({ students, sessions }: { students: Student[]; sessions: Session[] }) {
  const [studentId, setStudentId] = useState("");
  const [qrFor, setQrFor] = useState("");
  const [days, setDays] = useState("0");
  const since = Number(days) > 0 ? Date.now() - Number(days) * 86400000 : 0;
  const filtered = sessions.filter(
    (s) =>
      (!studentId || s.student_id === studentId) &&
      (!since || new Date(s.played_at).getTime() >= since),
  );
  const totalHits = filtered.reduce((a, s) => a + s.hits, 0);
  const totalMisses = filtered.reduce((a, s) => a + s.misses, 0);
  const accuracy = totalHits + totalMisses ? Math.round((totalHits / (totalHits + totalMisses)) * 100) : 0;

  function exportCsv() {
    const head = ["crianca", "jogo", "nivel", "pontos", "acertos", "erros", "quando"];
    const rows = filtered.map((s) => [
      students.find((st) => st.id === s.student_id)?.full_name ?? "—",
      gameCatalog.find((g) => g.slug === s.game_slug)?.title ?? s.game_slug,
      s.level,
      s.score,
      s.hits,
      s.misses,
      new Date(s.played_at).toLocaleString("pt-BR"),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `turma-do-zeno-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls}>
            <option value="">Todas as crianças</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <select value={days} onChange={(e) => setDays(e.target.value)} className={inputCls}>
            <option value="0">Todo o período</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="rounded-full bg-zeno-green px-5 py-2 font-semibold text-white disabled:opacity-50"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => setQrFor(studentId)}
              disabled={!studentId}
              className="rounded-full bg-zeno-blue px-5 py-2 font-semibold text-white disabled:opacity-50"
              title="Escolha uma criança para gerar o QR Code"
            >
              📱 Ver no celular
            </button>
          </div>
        </div>
      </Card>

      {qrFor && (
        <ReportQr
          studentId={qrFor}
          studentName={students.find((s) => s.id === qrFor)?.full_name ?? "Criança"}
          onClose={() => setQrFor("")}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-muted-foreground">Atividades</p><p className="font-display text-3xl">{filtered.length}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Precisão</p><p className="font-display text-3xl">{accuracy}%</p></Card>
        <Card>
          <p className="text-sm text-muted-foreground">Pontuação média</p>
          <p className="font-display text-3xl">
            {filtered.length ? Math.round(filtered.reduce((a, s) => a + s.score, 0) / filtered.length) : 0}
          </p>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="mb-3 font-display text-lg">Precisão por habilidade</p>
          <SkillChart sessions={filtered} />
        </Card>
        <Card>
          <p className="mb-3 font-display text-lg">Evolução das pontuações</p>
          <ScoreTrend sessions={filtered} />
        </Card>
        <Card>
          <p className="mb-3 font-display text-lg">Jogos mais usados</p>
          <GameUsage sessions={filtered} />
        </Card>
      </div>
      <Card>
        <p className="mb-3 font-display text-lg">Últimas sessões</p>
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr><th className="pb-2">Criança</th><th>Jogo</th><th>Nível</th><th>Pontos</th><th>Quando</th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, 20).map((s, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-2">{students.find((st) => st.id === s.student_id)?.full_name ?? "—"}</td>
                <td>{gameCatalog.find((g) => g.slug === s.game_slug)?.title ?? s.game_slug}</td>
                <td>{s.level}</td>
                <td>{s.score}</td>
                <td>{new Date(s.played_at).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-muted-foreground">Nenhuma sessão registrada ainda.</p>}
      </Card>
    </div>
  );
}

function Bar({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm">
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground">{hint}</span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function SkillChart({ sessions }: { sessions: Session[] }) {
  const bySkill = new Map<string, { hits: number; misses: number }>();
  for (const s of sessions) {
    const skill = gameCatalog.find((g) => g.slug === s.game_slug)?.skill ?? "outros";
    const acc = bySkill.get(skill) ?? { hits: 0, misses: 0 };
    acc.hits += s.hits;
    acc.misses += s.misses;
    bySkill.set(skill, acc);
  }
  const rows = [...bySkill.entries()];
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
  return (
    <div>
      {rows.map(([skill, v]) => {
        const total = v.hits + v.misses;
        const pct = total ? Math.round((v.hits / total) * 100) : 0;
        return <Bar key={skill} label={skill} value={pct} hint={`${pct}%`} tone="bg-zeno-green" />;
      })}
    </div>
  );
}

function ScoreTrend({ sessions }: { sessions: Session[] }) {
  const points = [...sessions].reverse().slice(-12);
  if (points.length === 0) return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
  const max = Math.max(...points.map((p) => p.score), 1);
  return (
    <div className="flex h-32 items-end gap-1">
      {points.map((p, i) => (
        <div
          key={i}
          title={`${p.score} pontos em ${new Date(p.played_at).toLocaleDateString("pt-BR")}`}
          className="flex-1 rounded-t-md bg-zeno-blue"
          style={{ height: `${Math.max(6, (p.score / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function GameUsage({ sessions }: { sessions: Session[] }) {
  const counts = new Map<string, number>();
  for (const s of sessions) counts.set(s.game_slug, (counts.get(s.game_slug) ?? 0) + 1);
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
  const max = rows[0]![1];
  return (
    <div>
      {rows.map(([slug, count]) => (
        <Bar
          key={slug}
          label={gameCatalog.find((g) => g.slug === slug)?.title ?? slug}
          value={(count / max) * 100}
          hint={`${count}`}
          tone="bg-zeno-purple"
        />
      ))}
    </div>
  );
}

interface DeviceInfo {
  id: string;
  code: string;
  label: string | null;
  last_sync_at: string | null;
  status: string;
  location: string | null;
  app_version: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando ativação",
  active: "Ativa",
  blocked: "Bloqueada",
};

function Devices({ org, devices, reload }: { org: Org; devices: DeviceInfo[]; reload: () => void }) {
  const [label, setLabel] = useState("");
  const [activation, setActivation] = useState("");
  const [current, setCurrent] = useState(() => getDeviceCode());

  async function activate(e: React.FormEvent) {
    e.preventDefault();
    const code = activation.trim().toUpperCase();
    if (code.length < 4) {
      toast.error("Informe o código gerado no painel do administrador.");
      return;
    }
    const { data, error } = await supabase.from("devices").select("id, label, status").eq("code", code).maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data) {
      toast.error("Código não encontrado para esta instituição.");
      return;
    }
    if (data.status === "blocked") {
      toast.error("Esta mesa está bloqueada pelo administrador.");
      return;
    }
    await supabase
      .from("devices")
      .update({ status: "active", activated_at: new Date().toISOString(), app_version: appVersion(), last_seen_at: new Date().toISOString() })
      .eq("id", data.id);
    setCurrent(setDeviceCode(code));
    setActivation("");
    toast.success(`Mesa ativada como ${data.label ?? "Mesa"}!`);
    reload();
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    const code = generateDeviceCode();
    const { error } = await supabase.from("devices").insert({
      organization_id: org.id,
      code,
      label: label || "Mesa",
      status: "active",
      activated_at: new Date().toISOString(),
      app_version: appVersion(),
      last_seen_at: new Date().toISOString(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrent(setDeviceCode(code));
    setLabel("");
    reload();
  }

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm text-muted-foreground">Código desta mesa</p>
        <p className="font-mono text-lg">{current}</p>
        <form onSubmit={activate} className="mt-4 flex flex-wrap gap-3">
          <input
            value={activation}
            onChange={(e) => setActivation(e.target.value.toUpperCase())}
            placeholder="Ativar esta mesa (código do administrador)"
            className={inputCls}
          />
          <button className="rounded-full bg-zeno-blue px-6 py-2 font-semibold text-white">Ativar</button>
        </form>
        <form onSubmit={register} className="mt-3 flex flex-wrap gap-3">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nome da mesa (ex.: Sala Azul)" className={inputCls} />
          <button className="rounded-full bg-zeno-green px-6 py-2 font-semibold text-white">Gerar código para esta mesa</button>
        </form>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        {devices.map((d) => (
          <Card key={d.id}>
            <p className="font-display text-lg">{d.label ?? "Mesa"}</p>
            <p className="font-mono text-sm text-muted-foreground">{d.code}</p>
            <p className="mt-1 text-xs font-semibold">{STATUS_LABEL[d.status] ?? d.status}</p>
            {d.location && <p className="text-xs text-muted-foreground">Local: {d.location}</p>}
            <p className="text-xs text-muted-foreground">Versão: {d.app_version ?? "—"}</p>
            <p className="mt-2 text-sm">
              {d.last_sync_at ? `Último envio ${new Date(d.last_sync_at).toLocaleString("pt-BR")}` : "Sem sincronização"}
            </p>
          </Card>
        ))}
        {devices.length === 0 && <p className="text-muted-foreground">Nenhuma mesa registrada.</p>}
      </div>
    </div>
  );
}
