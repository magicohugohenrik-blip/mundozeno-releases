import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { gameCatalog } from "@/lib/zeno";
import {
  ACTIVITY_SELECT,
  countLabelFor,
  defaultConfigFor,
  type ActivityRow,
} from "@/lib/activities";

const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-2";

const COLORS = ["bg-zeno-blue", "bg-zeno-green", "bg-zeno-orange", "bg-zeno-purple", "bg-zeno-pink"];
const EMOJIS = ["🎲", "🃏", "🎯", "🔷", "🧩", "🪀", "🎵", "🔢", "🔍", "✨", "🎨", "✏️"];

/** Biblioteca de atividades: oficiais (duplicáveis), minhas e da instituição. */
export function Activities({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<"oficiais" | "minhas" | "instituicao">("oficiais");
  const [editing, setEditing] = useState<ActivityRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);
    const { data, error } = await supabase.from("activities").select(ACTIVITY_SELECT).order("created_at", { ascending: false });
    if (error) toast.error("Não foi possível carregar as atividades.");
    setRows((data ?? []) as unknown as ActivityRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function duplicate(slug: string, title: string) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const base = gameCatalog.find((g) => g.slug === slug);
    const { data, error } = await supabase
      .from("activities")
      .insert({
        organization_id: orgId,
        owner_id: auth.user.id,
        base_slug: slug,
        title: `${title} (cópia)`,
        emoji: base?.emoji ?? "🎲",
        color: base?.color ?? "bg-zeno-blue",
        level: 1,
        config: defaultConfigFor(slug) as Record<string, never>,
      })
      .select(ACTIVITY_SELECT)
      .maybeSingle();
    if (error || !data) {
      toast.error("Não foi possível duplicar.");
      return;
    }
    toast.success("Atividade duplicada. Agora é só personalizar!");
    setRows((list) => [data as unknown as ActivityRow, ...list]);
    setTab("minhas");
    setEditing(data as unknown as ActivityRow);
  }

  async function remove(id: string) {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    setRows((list) => list.filter((r) => r.id !== id));
    toast.success("Atividade excluída.");
  }

  const mine = rows.filter((r) => r.owner_id === userId);
  const shared = rows.filter((r) => r.owner_id !== userId);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Atividades</h2>
          <p className="text-sm text-muted-foreground">
            Duplique um jogo oficial e personalize título, dificuldade e mensagens — sem programar.
          </p>
        </div>
        <div className="flex gap-2">
          {(["oficiais", "minhas", "instituicao"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? "bg-zeno-blue text-white" : "bg-secondary"}`}
            >
              {k === "oficiais" ? "Atividades oficiais" : k === "minhas" ? `Minhas (${mine.length})` : `Da instituição (${shared.length})`}
            </button>
          ))}
        </div>
      </header>

      {tab === "oficiais" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gameCatalog.map((g) => (
            <div key={g.slug} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-white ${g.color}`}>
                {g.emoji}
              </span>
              <p className="mt-3 font-display text-lg">{g.title}</p>
              <p className="text-sm text-muted-foreground">Habilidade: {g.skill}</p>
              <button
                onClick={() => duplicate(g.slug, g.title)}
                className="mt-4 w-full rounded-xl bg-zeno-green px-4 py-2 font-semibold text-white"
              >
                Duplicar e personalizar
              </button>
            </div>
          ))}
        </div>
      )}

      {tab !== "oficiais" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading && <p className="text-muted-foreground">Carregando…</p>}
          {!loading && (tab === "minhas" ? mine : shared).length === 0 && (
            <p className="text-muted-foreground">Nenhuma atividade aqui ainda.</p>
          )}
          {(tab === "minhas" ? mine : shared).map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-white ${r.color}`}>
                {r.emoji}
              </span>
              <p className="mt-3 font-display text-lg">{r.title}</p>
              <p className="text-sm text-muted-foreground">
                Base: {gameCatalog.find((g) => g.slug === r.base_slug)?.title ?? r.base_slug} · Nível {r.level}
                {r.active ? "" : " · oculta"}
              </p>
              {r.description ? <p className="mt-1 text-sm">{r.description}</p> : null}
              {tab === "minhas" && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setEditing(r)} className="flex-1 rounded-xl bg-zeno-blue px-4 py-2 font-semibold text-white">
                    Editar
                  </button>
                  <button onClick={() => remove(r.id)} className="rounded-xl border border-border px-4 py-2 font-semibold">
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Editor
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(next) => {
            setRows((list) => list.map((r) => (r.id === next.id ? next : r)));
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function Editor({
  row,
  onClose,
  onSaved,
}: {
  row: ActivityRow;
  onClose: () => void;
  onSaved: (r: ActivityRow) => void;
}) {
  const [form, setForm] = useState<ActivityRow>(row);
  const [busy, setBusy] = useState(false);
  const countLabel = countLabelFor(row.base_slug);

  async function save() {
    setBusy(true);
    const { data, error } = await supabase
      .from("activities")
      .update({
        title: form.title,
        description: form.description,
        emoji: form.emoji,
        color: form.color,
        level: form.level,
        config: form.config as Record<string, never>,
        visibility: form.visibility,
        active: form.active,
      })
      .eq("id", row.id)
      .select(ACTIVITY_SELECT)
      .maybeSingle();
    setBusy(false);
    if (error || !data) {
      toast.error("Não foi possível salvar.");
      return;
    }
    toast.success("Atividade salva!");
    onSaved(data as unknown as ActivityRow);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-lg">
        <h3 className="font-display text-xl">Personalizar atividade</h3>

        <label className="mt-4 block text-sm font-semibold">Título</label>
        <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <label className="mt-4 block text-sm font-semibold">Instrução para a criança</label>
        <input
          className={inputCls}
          value={(form.config.instruction as string) ?? ""}
          placeholder="Ex.: Encontre os pares dos amigos do Zeno!"
          onChange={(e) => setForm({ ...form, config: { ...form.config, instruction: e.target.value } })}
        />

        <label className="mt-4 block text-sm font-semibold">Observação interna</label>
        <input
          className={inputCls}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold">Nível</label>
            <input
              type="number"
              min={1}
              max={4}
              className={inputCls}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: Math.max(1, Math.min(4, Number(e.target.value) || 1)) })}
            />
          </div>
          {countLabel && (
            <div>
              <label className="block text-sm font-semibold">{countLabel}</label>
              <input
                type="number"
                min={2}
                max={6}
                className={inputCls}
                value={Number(form.config.count ?? 3)}
                onChange={(e) =>
                  setForm({ ...form, config: { ...form.config, count: Math.max(2, Math.min(6, Number(e.target.value) || 2)) } })
                }
              />
            </div>
          )}
        </div>

        <label className="mt-4 block text-sm font-semibold">Ícone</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setForm({ ...form, emoji: e })}
              className={`h-10 w-10 rounded-xl text-xl ${form.emoji === e ? "ring-2 ring-zeno-blue" : "bg-secondary"}`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-semibold">Cor</label>
        <div className="mt-1 flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              aria-label={c}
              onClick={() => setForm({ ...form, color: c })}
              className={`h-10 w-10 rounded-full ${c} ${form.color === c ? "ring-2 ring-foreground" : ""}`}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.visibility === "organization"}
              onChange={(e) => setForm({ ...form, visibility: e.target.checked ? "organization" : "private" })}
            />
            Compartilhar com a instituição
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Disponível na mesa
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={save} disabled={busy} className="flex-1 rounded-xl bg-zeno-green px-4 py-2 font-semibold text-white">
            {busy ? "Salvando…" : "Salvar"}
          </button>
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
