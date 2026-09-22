import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NetworkReports } from "@/components/painel/NetworkReports";
import { NewTableWizard } from "@/components/painel/NewTableWizard";
import {
  createManager,
  linkManager,
  resetAccountPassword,
  unlinkManager,
} from "@/lib/admin.functions";

import { toast } from "sonner";

interface Municipality { id: string; name: string; state: string | null; code: string; active: boolean }
interface OrgRow { id: string; name: string; type: string; city: string | null; join_code: string; municipality_id: string | null; parent_id: string | null }
interface DeviceRow { id: string; code: string; label: string | null; organization_id: string | null; last_sync_at: string | null; status: string; location: string | null; app_version: string | null; last_seen_at: string | null; virtual_keyboard: boolean }
interface ProfileRow { id: string; full_name: string; organization_id: string | null; municipality_id: string | null }
interface RoleRow { user_id: string; role: string }
interface DeviceManagerRow { device_id: string; user_id: string }
interface StudentRow { id: string; organization_id: string }
interface SessionRow { organization_id: string; played_at: string }

const TYPE_LABEL: Record<string, string> = { escola: "Escola", clinica: "Clínica", rede: "Rede", outro: "Instituição" };
const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  table_manager: "Gestor de mesas",
  city_admin: "Admin municipal",
  org_admin: "Admin da instituição",
  professional: "Profissional",
};

type Sub = "visao" | "rede" | "municipios" | "instituicoes" | "mesas" | "gestores" | "equipe";

const SUBS: [Sub, string][] = [
  ["visao", "Visão geral"],
  ["rede", "Relatórios da rede"],
  ["municipios", "Municípios"],
  ["instituicoes", "Instituições"],
  ["mesas", "Mesas"],
  ["gestores", "Gestores de mesa"],
  ["equipe", "Equipe e acessos"],
];


export function AdminArea({ isSuper, currentOrgId, onSwitchOrg }: { isSuper: boolean; currentOrgId?: string | null; onSwitchOrg?: () => void }) {
  const [munis, setMunis] = useState<Municipality[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [links, setLinks] = useState<DeviceManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<Sub>("visao");

  const load = useCallback(async () => {
    const [m, o, d, p, r, st, se] = await Promise.all([
      supabase.from("municipalities").select("id, name, state, code, active").order("name"),
      supabase.from("organizations").select("id, name, type, city, join_code, municipality_id, parent_id").order("name"),
      supabase.from("devices").select("id, code, label, organization_id, last_sync_at, status, location, app_version, last_seen_at, virtual_keyboard").order("created_at"),
      supabase.from("profiles").select("id, full_name, organization_id, municipality_id").order("full_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("students").select("id, organization_id").eq("active", true),
      supabase.from("game_sessions").select("organization_id, played_at").order("played_at", { ascending: false }).limit(2000),
    ]);
    const dm = await supabase.from("device_managers").select("device_id, user_id");
    setLinks((dm.data ?? []) as DeviceManagerRow[]);
    setMunis((m.data ?? []) as Municipality[]);
    setOrgs((o.data ?? []) as OrgRow[]);
    setDevices((d.data ?? []) as DeviceRow[]);
    setProfiles((p.data ?? []) as ProfileRow[]);
    setRoles((r.data ?? []) as RoleRow[]);
    setStudents((st.data ?? []) as StudentRow[]);
    setSessions((se.data ?? []) as SessionRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function switchOrg(orgId: string) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("profiles").update({ organization_id: orgId }).eq("id", auth.user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Instituição ativa alterada.");
    onSwitchOrg?.();
  }

  if (loading) return <p className="text-muted-foreground">Carregando administração…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SUBS.filter(([k]) => isSuper || (k !== "municipios" && k !== "gestores")).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${sub === key ? "bg-zeno-blue text-white" : "bg-secondary"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === "visao" && (
        <Overview
          isSuper={isSuper}
          munis={munis}
          orgs={orgs}
          devices={devices}
          students={students}
          sessions={sessions}
          currentOrgId={currentOrgId}
          onSwitchOrg={switchOrg}
        />
      )}

      {sub === "rede" && <NetworkReports munis={munis} orgs={orgs} />}

      {sub === "municipios" && isSuper && (
        <div className="space-y-6">

          <MunicipalityForm onDone={load} />
          <section>
            <h2 className="font-display text-xl">Municípios ({munis.length})</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {munis.map((m) => {
                const list = orgs.filter((o) => o.municipality_id === m.id);
                return (
                  <article key={m.id} className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="font-display text-lg">{m.name}{m.state ? ` · ${m.state}` : ""}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{m.code}</p>
                    <p className="mt-2 text-sm">{list.length} instituição(ões)</p>
                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                      {list.map((o) => (
                        <li key={o.id}>• {o.name} — {TYPE_LABEL[o.type] ?? o.type}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {sub === "instituicoes" && (
        <div className="space-y-6">
          <OrgForm munis={munis} isSuper={isSuper} onDone={load} />
          <section>
            <h2 className="font-display text-xl">Instituições ({orgs.length})</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Município</th>
                    <th className="px-4 py-2">Crianças</th>
                    <th className="px-4 py-2">Mesas</th>
                    <th className="px-4 py-2">Código da equipe</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-4 py-2 font-semibold">
                        {o.name}
                        {o.parent_id && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            Rede: {orgs.find((p) => p.id === o.parent_id)?.name ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">{TYPE_LABEL[o.type] ?? o.type}</td>
                      <td className="px-4 py-2">{munis.find((m) => m.id === o.municipality_id)?.name ?? "Particular"}</td>
                      <td className="px-4 py-2">{students.filter((s) => s.organization_id === o.id).length}</td>
                      <td className="px-4 py-2">{devices.filter((d) => d.organization_id === o.id).length}</td>
                      <td className="px-4 py-2 font-mono text-zeno-blue">{o.join_code}</td>
                      <td className="px-4 py-2 text-right">
                        {o.id === currentOrgId ? (
                          <span className="text-xs font-semibold text-muted-foreground">Ativa</span>
                        ) : (
                          <button onClick={() => switchOrg(o.id)} className="rounded-xl border border-border px-3 py-1 text-xs font-semibold">
                            Abrir painel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {sub === "mesas" && (
        <div className="space-y-6">
          <NewTableWizard munis={munis} orgs={orgs} onDone={load} />
          <section>
            <h2 className="font-display text-xl">Mesas ({devices.length})</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {devices.map((d) => (
                <DeviceCard key={d.id} device={d} isSuper={isSuper} orgName={orgs.find((o) => o.id === d.organization_id)?.name ?? "Sem instituição"} onDone={load} />
              ))}
            </div>
          </section>
        </div>
      )}

      {sub === "gestores" && (
        <ManagersArea orgs={orgs} devices={devices} profiles={profiles} roles={roles} links={links} onDone={load} />
      )}

      {sub === "equipe" && (
        <TeamArea isSuper={isSuper} profiles={profiles} roles={roles} orgs={orgs} munis={munis} onDone={load} />
      )}
    </div>
  );
}

function Overview({
  isSuper,
  munis,
  orgs,
  devices,
  students,
  sessions,
  currentOrgId,
  onSwitchOrg,
}: {
  isSuper: boolean;
  munis: Municipality[];
  orgs: OrgRow[];
  devices: DeviceRow[];
  students: StudentRow[];
  sessions: SessionRow[];
  currentOrgId?: string | null | undefined;
  onSwitchOrg: (id: string) => void;
}) {
  const since = useMemo(() => Date.now() - 7 * 86400000, []);
  const week = sessions.filter((s) => new Date(s.played_at).getTime() >= since);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {isSuper && <Kpi label="Municípios" value={munis.length} icon="🏛️" />}
        <Kpi label="Instituições" value={orgs.length} icon="🏫" />
        <Kpi label="Crianças" value={students.length} icon="🧒" />
        <Kpi label="Mesas" value={devices.length} icon="🪵" />
        <Kpi label="Partidas (7 dias)" value={week.length} icon="🎮" />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Hierarquia de acesso</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>• <b>Super admin</b>: cria municípios, instituições e mesas; vê tudo.</li>
          <li>• <b>Admin municipal</b>: cadastra escolas/clínicas do seu município, gera mesas e acompanha os relatórios da rede.</li>
          <li>• <b>Admin da instituição</b>: turmas, crianças, atividades e mesas da própria escola/clínica.</li>
          <li>• <b>Profissional</b>: crianças, atividades e diagnósticos da instituição onde atua.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl">Rede por município</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...munis.map((m) => ({ id: m.id as string | null, name: `${m.name}${m.state ? ` / ${m.state}` : ""}` })), { id: null, name: "Particulares (sem município)" }].map((group) => {
            const list = orgs.filter((o) => o.municipality_id === group.id);
            if (!list.length) return null;
            return (
              <article key={group.id ?? "none"} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-display text-lg">{group.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {list.length} instituição(ões) ·{" "}
                  {students.filter((s) => list.some((o) => o.id === s.organization_id)).length} crianças
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {list.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2">
                      <span>{o.name}</span>
                      {o.id === currentOrgId ? (
                        <span className="text-xs text-muted-foreground">ativa</span>
                      ) : (
                        <button onClick={() => onSwitchOrg(o.id)} className="rounded-lg border border-border px-2 py-0.5 text-xs font-semibold">
                          abrir
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="text-2xl">{icon}</span>
      <p className="font-display text-3xl">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function TeamArea({
  isSuper,
  profiles,
  roles,
  orgs,
  munis,
  onDone,
}: {
  isSuper: boolean;
  profiles: ProfileRow[];
  roles: RoleRow[];
  orgs: OrgRow[];
  munis: Municipality[];
  onDone: () => void;
}) {
  const grantable = isSuper
    ? ["super_admin", "city_admin", "org_admin", "professional"]
    : ["org_admin", "professional"];

  async function toggleRole(userId: string, role: string, has: boolean) {
    const q = has
      ? supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as never)
      : supabase.from("user_roles").insert({ user_id: userId, role: role as never });
    const { error } = await q;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(has ? "Acesso removido." : "Acesso concedido.");
    onDone();
  }

  async function setOrg(userId: string, orgId: string) {
    const { error } = await supabase.from("profiles").update({ organization_id: orgId || null }).eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Instituição atualizada.");
    onDone();
  }

  async function setMuni(userId: string, muniId: string) {
    const { error } = await supabase.from("profiles").update({ municipality_id: muniId || null }).eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Município atualizado.");
    onDone();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Como dar acesso a alguém</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>A pessoa cria a conta na tela de login do painel.</li>
          <li>Ela entra na instituição com o <b>código da equipe</b> — ou você define aqui a instituição dela.</li>
          <li>Marque o papel: admin municipal, admin da instituição ou profissional.</li>
        </ol>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-2">Pessoa</th>
              <th className="px-4 py-2">Instituição</th>
              {isSuper && <th className="px-4 py-2">Município</th>}
              <th className="px-4 py-2">Acessos</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const mine = roles.filter((r) => r.user_id === p.id).map((r) => r.role);
              return (
                <tr key={p.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-semibold">
                    {p.full_name || "Sem nome"}
                    <span className="block font-mono text-[10px] text-muted-foreground">{p.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.organization_id ?? ""}
                      onChange={(e) => setOrg(p.id, e.target.value)}
                      className="rounded-xl border border-border bg-background px-3 py-1"
                    >
                      <option value="">Sem instituição</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </td>
                  {isSuper && (
                    <td className="px-4 py-3">
                      <select
                        value={p.municipality_id ?? ""}
                        onChange={(e) => setMuni(p.id, e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-1"
                      >
                        <option value="">—</option>
                        {munis.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {grantable.map((role) => {
                        const has = mine.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => toggleRole(p.id, role, has)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${has ? "bg-zeno-blue text-white" : "bg-secondary"}`}
                          >
                            {ROLE_LABEL[role]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="rounded-xl border border-border bg-background px-4 py-2" />;
}

function MunicipalityForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("municipalities").insert({ name, state: state || null });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setState("");
    toast.success("Município cadastrado!");
    onDone();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl">Novo município</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do município" required minLength={2} />
        <Field value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="UF" maxLength={2} className="w-24 rounded-xl border border-border bg-background px-4 py-2" />
        <button disabled={busy} className="rounded-xl bg-zeno-blue px-5 py-2 font-semibold text-white disabled:opacity-60">
          Cadastrar
        </button>
      </div>
    </form>
  );
}

function OrgForm({ munis, isSuper, onDone }: { munis: Municipality[]; isSuper: boolean; onDone: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("escola");
  const [muni, setMuni] = useState(!isSuper && munis.length === 1 ? (munis[0]?.id ?? "") : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("organizations")
      .insert({ name, city: city || null, type: type as "escola" | "clinica" | "outro", municipality_id: muni || null });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setCity("");
    toast.success("Instituição cadastrada!");
    onDone();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl">Nova escola ou clínica</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da instituição" required minLength={2} />
        <Field value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-border bg-background px-4 py-2">
          <option value="escola">Escola</option>
          <option value="clinica">Clínica</option>
          <option value="outro">Outra instituição</option>
        </select>
        <select value={muni} onChange={(e) => setMuni(e.target.value)} className="rounded-xl border border-border bg-background px-4 py-2">
          <option value="">Sem município (particular)</option>
          {munis.map((m) => (
            <option key={m.id} value={m.id}>{m.name}{m.state ? ` / ${m.state}` : ""}</option>
          ))}
        </select>
        <button disabled={busy} className="rounded-xl bg-zeno-blue px-5 py-2 font-semibold text-white disabled:opacity-60">
          Cadastrar
        </button>
      </div>
    </form>
  );
}

function ManagersArea({
  orgs,
  devices,
  profiles,
  roles,
  links,
  onDone,
}: {
  orgs: OrgRow[];
  devices: DeviceRow[];
  profiles: ProfileRow[];
  roles: RoleRow[];
  links: DeviceManagerRow[];
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [org, setOrg] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);

  const managerIds = new Set(roles.filter((r) => r.role === "table_manager").map((r) => r.user_id));
  const managers = profiles.filter((p) => managerIds.has(p.id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!org) {
      toast.error("Escolha a instituição do gestor.");
      return;
    }
    setBusy(true);
    try {
      const res = await createManager({ data: { fullName, username, organizationId: org } });
      setCreated({ username: res.username, password: res.password });
      setFullName("");
      setUsername("");
      toast.success("Gestor criado!");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar o gestor.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleLink(deviceId: string, userId: string, linked: boolean) {
    try {
      if (linked) await unlinkManager({ data: { deviceId, userId } });
      else await linkManager({ data: { deviceId, userId } });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível alterar o vínculo.");
    }
  }

  async function resetPassword(userId: string) {
    try {
      const res = await resetAccountPassword({ data: { userId } });
      setCreated({ username: "", password: res.password });
      toast.success("Nova senha gerada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Criar gestor de mesas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O gestor entra com usuário e senha próprios e administra apenas as mesas atribuídas a ele.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Field value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome do gestor" />
          <Field value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário (ex.: joao.silva)" />
          <select value={org} onChange={(e) => setOrg(e.target.value)} className="rounded-xl border border-border bg-background px-4 py-2">
            <option value="">Escolha a instituição…</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <button disabled={busy} className="rounded-xl bg-zeno-blue px-5 py-2 font-semibold text-white disabled:opacity-60">
            {busy ? "Criando…" : "Criar gestor"}
          </button>
        </div>
        {created && (
          <div className="mt-4 space-y-1 rounded-xl bg-secondary px-4 py-3">
            <p className="text-sm font-semibold text-muted-foreground">Anote agora: a senha aparece uma única vez.</p>
            {created.username && <p className="font-mono text-sm">usuário: {created.username}</p>}
            <p className="font-mono text-sm">senha: {created.password}</p>
          </div>
        )}
      </form>

      <section>
        <h2 className="font-display text-xl">Gestores ({managers.length})</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {managers.map((m) => {
            const orgDevices = devices.filter((d) => d.organization_id === m.organization_id);
            return (
              <article key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-display text-lg">{m.full_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {orgs.find((o) => o.id === m.organization_id)?.name ?? "Sem instituição"}
                </p>
                <ul className="mt-3 space-y-1">
                  {orgDevices.length === 0 && (
                    <li className="text-xs text-muted-foreground">Nenhuma mesa nesta instituição.</li>
                  )}
                  {orgDevices.map((d) => {
                    const linked = links.some((l) => l.device_id === d.id && l.user_id === m.id);
                    return (
                      <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                        <span>{d.label || "Mesa"} <span className="font-mono text-xs text-muted-foreground">{d.code}</span></span>
                        <button
                          type="button"
                          onClick={() => void toggleLink(d.id, m.id, linked)}
                          className={`rounded-xl px-3 py-1 text-xs font-semibold ${linked ? "bg-zeno-green/30" : "border border-border"}`}
                        >
                          {linked ? "Desvincular" : "Vincular"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => void resetPassword(m.id)}
                  className="mt-3 rounded-xl border border-border px-3 py-1 text-xs font-semibold"
                >
                  Redefinir senha
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}


const DEVICE_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Aguardando ativação", cls: "bg-zeno-yellow/30 text-foreground" },
  active: { label: "Ativa", cls: "bg-zeno-green/25 text-foreground" },
  blocked: { label: "Bloqueada", cls: "bg-destructive/20 text-foreground" },
};

function DeviceCard({
  device,
  orgName,
  onDone,
  isSuper = false,
}: {
  device: DeviceRow;
  orgName: string;
  onDone: () => void;
  isSuper?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const st = DEVICE_STATUS[device.status] ?? DEVICE_STATUS["pending"]!;

  async function setStatus(status: string) {
    setBusy(true);
    const { error } = await supabase.from("devices").update({ status }).eq("id", device.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "blocked" ? "Mesa bloqueada." : "Mesa liberada.");
    onDone();
  }

  async function toggleKeyboard() {
    const next = !device.virtual_keyboard;
    setBusy(true);
    const { error } = await supabase.from("devices").update({ virtual_keyboard: next }).eq("id", device.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Teclado na tela ligado." : "Teclado na tela desligado.");
    onDone();
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg">{device.label || "Mesa"}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
      </div>
      <p className="font-mono text-xs text-muted-foreground">{device.code}</p>
      <p className="mt-1 text-sm">{orgName}</p>
      {device.location && <p className="text-xs text-muted-foreground">Local: {device.location}</p>}
      <p className="text-xs text-muted-foreground">Versão: {device.app_version ?? "—"}</p>
      <p className="text-xs text-muted-foreground">
        Teclado na tela: {device.virtual_keyboard ? "ligado" : "desligado"}
      </p>
      <p className="text-xs text-muted-foreground">
        {device.last_sync_at ? `Última sincronização: ${new Date(device.last_sync_at).toLocaleString("pt-BR")}` : "Ainda não sincronizou"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(device.code);
            toast.success("Código copiado!");
          }}
          className="rounded-xl border border-border px-3 py-1 text-xs font-semibold"
        >
          Copiar código
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void setStatus(device.status === "blocked" ? "active" : "blocked")}
          className="rounded-xl border border-border px-3 py-1 text-xs font-semibold disabled:opacity-60"
        >
          {device.status === "blocked" ? "Liberar" : "Bloquear"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleKeyboard()}
          className="rounded-xl border border-border px-3 py-1 text-xs font-semibold disabled:opacity-60"
        >
          {device.virtual_keyboard ? "Desligar teclado" : "Ligar teclado"}
        </button>
      </div>

      <AppAccessPanel deviceId={device.id} isSuper={isSuper} />
    </article>
  );
}

const APP_LABELS: Record<string, string> = {
  games: "Jogos e Atividades",
  literacy: "Alfabetização",
  fonoplay: "FonoPlay",
  settings: "Configurações",
};

interface AccessRow {
  app_id: string;
  enabled: boolean;
  expires_at: string | null;
}

/** Liberação de aplicativos por mesa. Só o super admin altera; os demais visualizam. */
function AppAccessPanel({ deviceId, isSuper }: { deviceId: string; isSuper: boolean }) {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("device_app_access")
      .select("app_id, enabled, expires_at")
      .eq("device_id", deviceId);
    setRows((data ?? []) as AccessRow[]);
  }, [deviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(appId: string, patch: { enabled?: boolean; expires_at?: string | null }) {
    setBusy(true);
    const { error } = await supabase
      .from("device_app_access")
      .update(patch)
      .eq("device_id", deviceId)
      .eq("app_id", appId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Acesso atualizado.");
    void load();
  }

  if (rows.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aplicativos liberados</p>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => {
          const expired = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
          return (
            <li key={row.app_id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold">{APP_LABELS[row.app_id] ?? row.app_id}</span>
              <span className={expired || !row.enabled ? "text-destructive" : "text-muted-foreground"}>
                {!row.enabled
                  ? "Bloqueado"
                  : expired
                    ? "Expirado"
                    : row.expires_at
                      ? `Até ${new Date(row.expires_at).toLocaleDateString("pt-BR")}`
                      : "Sem prazo"}
              </span>
              {isSuper && (
                <span className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void update(row.app_id, { enabled: !row.enabled })}
                    className="rounded-lg border border-border px-2 py-1 font-semibold disabled:opacity-60"
                  >
                    {row.enabled ? "Bloquear" : "Liberar"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const next = new Date();
                      next.setFullYear(next.getFullYear() + 1);
                      void update(row.app_id, { enabled: true, expires_at: next.toISOString() });
                    }}
                    className="rounded-lg border border-border px-2 py-1 font-semibold disabled:opacity-60"
                  >
                    +1 ano
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

