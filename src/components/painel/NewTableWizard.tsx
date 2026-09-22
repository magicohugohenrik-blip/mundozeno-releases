import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createDeviceWithAccount } from "@/lib/admin.functions";

/**
 * Criação de mesa em um só lugar, em 3 passos:
 * 1) a quem a mesa pertence (município, rede ou unidade avulsa)
 * 2) escolher ou criar a unidade dentro dessa hierarquia
 * 3) dar nome à mesa — o sistema gera código, usuário e senha exclusivos
 */

export interface WizardMunicipality {
  id: string;
  name: string;
  state: string | null;
}

export interface WizardOrg {
  id: string;
  name: string;
  type: string;
  city: string | null;
  municipality_id: string | null;
  parent_id: string | null;
}

type Scope = "municipio" | "rede" | "avulsa";

const SCOPES: { id: Scope; emoji: string; title: string; desc: string }[] = [
  { id: "municipio", emoji: "🏛️", title: "Município", desc: "Rede pública: escolas e clínicas do município" },
  { id: "rede", emoji: "🏢", title: "Rede privada", desc: "Grupo com várias unidades (franquia, rede de clínicas)" },
  { id: "avulsa", emoji: "🏠", title: "Unidade avulsa", desc: "Uma escola ou clínica independente" },
];

export function NewTableWizard({
  munis,
  orgs,
  onDone,
}: {
  munis: WizardMunicipality[];
  orgs: WizardOrg[];
  onDone: () => void;
}) {
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState<Scope>("municipio");

  const [muniId, setMuniId] = useState("");
  const [newMuni, setNewMuni] = useState({ name: "", state: "" });

  const [networkId, setNetworkId] = useState("");
  const [newNetwork, setNewNetwork] = useState("");

  const [orgId, setOrgId] = useState("");
  const [newOrg, setNewOrg] = useState({ name: "", city: "", type: "escola" });

  const [label, setLabel] = useState("");
  const [location, setLocation] = useState("");

  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<{ code: string; username: string; password: string; org: string } | null>(null);

  const networks = useMemo(() => orgs.filter((o) => o.type === "rede"), [orgs]);
  const units = useMemo(() => {
    const list = orgs.filter((o) => o.type !== "rede");
    if (scope === "municipio") return list.filter((o) => muniId && o.municipality_id === muniId);
    if (scope === "rede") return list.filter((o) => networkId && o.parent_id === networkId);
    return list.filter((o) => !o.municipality_id && !o.parent_id);
  }, [orgs, scope, muniId, networkId]);

  function reset() {
    setStep(1);
    setMuniId("");
    setNetworkId("");
    setOrgId("");
    setNewMuni({ name: "", state: "" });
    setNewNetwork("");
    setNewOrg({ name: "", city: "", type: "escola" });
    setLabel("");
    setLocation("");
  }

  async function createMunicipality() {
    if (newMuni.name.trim().length < 2) {
      toast.error("Informe o nome do município.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("municipalities")
      .insert({ name: newMuni.name.trim(), state: newMuni.state.trim() || null })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Não foi possível cadastrar o município.");
      return;
    }
    setMuniId(data.id);
    setNewMuni({ name: "", state: "" });
    toast.success("Município cadastrado!");
    onDone();
  }

  async function createNetwork() {
    if (newNetwork.trim().length < 2) {
      toast.error("Informe o nome da rede.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: newNetwork.trim(), type: "rede" as never })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Não foi possível cadastrar a rede.");
      return;
    }
    setNetworkId(data.id);
    setNewNetwork("");
    toast.success("Rede cadastrada!");
    onDone();
  }

  async function createUnit() {
    if (newOrg.name.trim().length < 2) {
      toast.error("Informe o nome da unidade.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: newOrg.name.trim(),
        city: newOrg.city.trim() || null,
        type: newOrg.type as "escola" | "clinica" | "outro",
        municipality_id: scope === "municipio" ? muniId : null,
        parent_id: scope === "rede" ? networkId : null,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Não foi possível cadastrar a unidade.");
      return;
    }
    setOrgId(data.id);
    setNewOrg({ name: "", city: "", type: "escola" });
    toast.success("Unidade cadastrada!");
    onDone();
  }

  async function createTable() {
    if (!orgId) {
      toast.error("Escolha a unidade da mesa.");
      return;
    }
    setBusy(true);
    try {
      const res = await createDeviceWithAccount({
        data: { organizationId: orgId, label: label.trim() || "Mesa", location: location.trim() || undefined },
      });
      setGenerated({
        code: res.code,
        username: res.username,
        password: res.password,
        org: orgs.find((o) => o.id === orgId)?.name ?? "",
      });
      toast.success("Mesa criada com identidade própria!");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar a mesa.");
    } finally {
      setBusy(false);
    }
  }

  const canGoStep2 = scope === "avulsa" || (scope === "municipio" ? Boolean(muniId) : Boolean(networkId));

  if (generated) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Mesa criada 🎉</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {generated.org} · anote agora: a senha aparece uma única vez. Na instalação, digite estes dados na mesa.
        </p>
        <div className="mt-4 space-y-1 rounded-xl bg-secondary px-4 py-3">
          <p className="font-mono text-lg">{generated.code}</p>
          <p className="font-mono text-sm">usuário: {generated.username}</p>
          <p className="font-mono text-sm">senha: {generated.password}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(
                `Mesa: ${label || "Mesa"}\nInstituição: ${generated.org}\nCódigo: ${generated.code}\nUsuário: ${generated.username}\nSenha: ${generated.password}`,
              );
              toast.success("Dados copiados!");
            }}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
          >
            Copiar dados
          </button>
          <button
            type="button"
            onClick={() => {
              setGenerated(null);
              reset();
            }}
            className="rounded-xl bg-zeno-blue px-5 py-2 text-sm font-semibold text-white"
          >
            Criar outra mesa
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl">Nova mesa</h2>
        <div className="flex gap-1 text-xs font-semibold">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`grid h-7 w-7 place-items-center rounded-full ${step === n ? "bg-zeno-blue text-white" : step > n ? "bg-zeno-green/40" : "bg-secondary"}`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">A quem esta mesa pertence?</p>
          <div className="grid gap-3 md:grid-cols-3">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                className={`rounded-2xl border p-4 text-left ${scope === s.id ? "border-zeno-blue bg-zeno-blue/10" : "border-border"}`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <p className="mt-1 font-display text-lg">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </button>
            ))}
          </div>

          {scope === "municipio" && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold">Município</p>
              <select
                value={muniId}
                onChange={(e) => setMuniId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2"
              >
                <option value="">Escolha o município…</option>
                {munis.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.state ? ` / ${m.state}` : ""}</option>
                ))}
              </select>
              <div className="mt-3 flex flex-wrap gap-2">
                <Input value={newMuni.name} onChange={(v) => setNewMuni({ ...newMuni, name: v })} placeholder="Cadastrar novo município" />
                <Input value={newMuni.state} onChange={(v) => setNewMuni({ ...newMuni, state: v.toUpperCase().slice(0, 2) })} placeholder="UF" className="w-20" />
                <button type="button" disabled={busy} onClick={() => void createMunicipality()} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60">
                  Cadastrar
                </button>
              </div>
            </div>
          )}

          {scope === "rede" && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold">Rede</p>
              <select
                value={networkId}
                onChange={(e) => setNetworkId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2"
              >
                <option value="">Escolha a rede…</option>
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
              <div className="mt-3 flex flex-wrap gap-2">
                <Input value={newNetwork} onChange={setNewNetwork} placeholder="Cadastrar nova rede" />
                <button type="button" disabled={busy} onClick={() => void createNetwork()} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60">
                  Cadastrar
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canGoStep2}
              onClick={() => setStep(2)}
              className="rounded-xl bg-zeno-blue px-5 py-2 font-semibold text-white disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {scope === "municipio" && `Escolas e clínicas de ${munis.find((m) => m.id === muniId)?.name ?? "—"}`}
            {scope === "rede" && `Unidades da rede ${networks.find((n) => n.id === networkId)?.name ?? "—"}`}
            {scope === "avulsa" && "Escolas e clínicas independentes"}
          </p>

          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2"
          >
            <option value="">Escolha a unidade…</option>
            {units.map((o) => (
              <option key={o.id} value={o.id}>{o.name}{o.city ? ` · ${o.city}` : ""}</option>
            ))}
          </select>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">Ou cadastre a unidade agora</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Input value={newOrg.name} onChange={(v) => setNewOrg({ ...newOrg, name: v })} placeholder="Nome da escola ou clínica" />
              <Input value={newOrg.city} onChange={(v) => setNewOrg({ ...newOrg, city: v })} placeholder="Cidade" />
              <select
                value={newOrg.type}
                onChange={(e) => setNewOrg({ ...newOrg, type: e.target.value })}
                className="rounded-xl border border-border bg-background px-4 py-2"
              >
                <option value="escola">Escola</option>
                <option value="clinica">Clínica</option>
                <option value="outro">Outra instituição</option>
              </select>
              <button type="button" disabled={busy} onClick={() => void createUnit()} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60">
                Cadastrar
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-border px-5 py-2 font-semibold">
              Voltar
            </button>
            <button
              type="button"
              disabled={!orgId}
              onClick={() => setStep(3)}
              className="rounded-xl bg-zeno-blue px-5 py-2 font-semibold text-white disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Identidade da mesa em {orgs.find((o) => o.id === orgId)?.name}. O código, o usuário e a senha são gerados
            automaticamente e são exclusivos desta mesa — só o super admin pode alterá-los.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input value={label} onChange={setLabel} placeholder="Nome da mesa (Mesa Serra Talhada)" />
            <Input value={location} onChange={setLocation} placeholder="Local (Sala Azul, 2º andar)" />
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-border px-5 py-2 font-semibold">
              Voltar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createTable()}
              className="rounded-xl bg-zeno-green px-5 py-2 font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Criando…" : "Criar mesa"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-xl border border-border bg-background px-4 py-2 ${className}`}
    />
  );
}
