import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Apple,
  ArrowLeft,
  BookA,
  BookOpen,
  Box,
  Brain,
  Calculator,
  Download,
  FolderOpen,
  Gamepad2,
  Hand,
  HeartHandshake,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Mic,
  Palette,
  Pencil,
  Play,
  Puzzle,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";
import { speak } from "@/lib/audio";
import { generateMagic, interpretBoard, transformDrawing } from "@/lib/magica.functions";
import { createMagicShare, importMagicShare } from "@/lib/magica-share.functions";
import { MagicBoard, type BoardState, type MagicBoardHandle } from "@/components/magica/MagicBoard";
import { ActivityEngine, resultSpeech, type MagicResult } from "@/components/magica/ActivityEngine";
import { PROFESSIONS, PROFESSION_STORE, allowsRecipe, isProfession, type Profession } from "@/lib/magica/professions";
import { publicOrigin } from "@/lib/publicUrl";



export const Route = createFileRoute("/_authenticated/tela-magica")({
  validateSearch: (s: Record<string, unknown>): { view?: "history"; share?: string } => ({
    ...(s["view"] === "history" ? { view: "history" as const } : {}),
    ...(typeof s["share"] === "string" && s["share"] ? { share: s["share"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Tela Mágica IA — Mundo Zeno" },
      { name: "description", content: "Desenhe no quadro e transforme ideias em atividades, histórias e ilustrações com IA." },
      { property: "og:title", content: "Tela Mágica IA — Mundo Zeno" },
      { property: "og:description", content: "Quadro digital que transforma desenhos em atividades educativas com IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TelaMagica,
});

type Understood = { object: string; emoji: string; context: string; intent: string; summary: string; suggestions: string[] };
type TextAction = "activity" | "game" | "challenge" | "story" | "explain" | "recipe";
type ImgAction = "transform" | "cartoon3d";
const IMG_ACTIONS: ImgAction[] = ["transform", "cartoon3d"];
/** Sugestões agrupadas por finalidade, como abas limpas. */
const PLAY_ACTIONS: TextAction[] = ["activity", "game", "challenge"];
/** Receita não entra na lista geral: só aparece no perfil de nutrição. */
const READ_ACTIONS: TextAction[] = ["story", "explain"];
/** Ícone de cada ação da IA. */
const ACTION_ICON: Record<string, LucideIcon> = {
  activity: Gamepad2,
  game: Puzzle,
  challenge: Trophy,
  story: BookOpen,
  explain: Lightbulb,
  recipe: Apple,
  transform: Palette,
  cartoon3d: Box,
};
/** Ícone de cada profissão da barra de contexto. */
const PROF_ICON: Record<Profession, LucideIcon> = {
  general: Sparkles,
  speech: Mic,
  psychopedagogy: Brain,
  occupational: Hand,
  math: Calculator,
  literacy: BookA,
  nutrition: Apple,
  psychology: HeartHandshake,
};
/** Selo do tipo de criação mostrado na capa do cartão. */
const KIND_ICON: Record<string, LucideIcon> = {
  activity: Gamepad2,
  game: Puzzle,
  challenge: Trophy,
  quiz: Lightbulb,
  truefalse: Lightbulb,
  sequence: Calculator,
  classify: Brain,
  count: Calculator,
  memory: Brain,
  story: BookOpen,
  explain: Lightbulb,
  recipe: Apple,
  image: ImageIcon,
  board: Pencil,
};


interface Creation {
  id: string;
  kind: string;
  title: string;
  result: MagicResult;
  drawing_url: string | null;
  image_url: string | null;
  created_at: string;
}

/** Criações ainda não enviadas ao servidor (ficam no aparelho até subir). */
const LOCAL_KEY = "zeno.magic.pending";
type LocalRow = Record<string, unknown> & { id: string };
function readLocal(): LocalRow[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as LocalRow[];
  } catch {
    return [];
  }
}
function writeLocal(rows: LocalRow[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 30)));
  } catch {
    // sem espaço: mantém só as mais recentes, sem imagens
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 10).map((r) => ({ ...r, drawing_url: null }))));
    } catch {}
  }
}
/** Envia as criações pendentes; as que subirem saem da fila local. */
async function syncLocal() {
  const rows = readLocal();
  if (!rows.length || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return;
  const left: LocalRow[] = [];
  for (const r of rows) {
    const { error } = await supabase
      .from("magic_creations")
      .upsert({ ...r, owner_id: uid } as never, { onConflict: "id", ignoreDuplicates: true });
    if (error) left.push(r);
  }
  writeLocal(left);
}

function errKey(e: unknown): TKey {
  const m = e instanceof Error ? e.message : "";
  const k = ["ai_credits", "ai_busy", "ai_refused", "ai_denied"].find((x) => m.includes(x)) ?? "ai_error";
  return `mg.err.${k}` as TKey;
}

function TelaMagica() {
  const { t, lang } = useI18n();
  const board = useRef<MagicBoardHandle>(null);
  const interpret = useServerFn(interpretBoard);
  const generate = useServerFn(generateMagic);
  const transform = useServerFn(transformDrawing);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snap, setSnap] = useState<{ image: string; texts: string[] } | null>(null);
  const [understood, setUnderstood] = useState<Understood | null>(null);
  const [result, setResult] = useState<MagicResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [preserve, setPreserve] = useState(true);
  const [profession, setProfession] = useState<Profession>("general");

  // A mesa lembra o perfil profissional escolhido, mesmo sem internet.
  useEffect(() => {
    const saved = localStorage.getItem(PROFESSION_STORE);
    if (isProfession(saved)) setProfession(saved);
  }, []);
  const pickProfession = (p: Profession) => {
    setProfession(p);
    try {
      localStorage.setItem(PROFESSION_STORE, p);
    } catch {
      /* cheio */
    }
  };

  const search = Route.useSearch();
  const shareFn = useServerFn(createMagicShare);
  const importFn = useServerFn(importMagicShare);
  const [view, setView] = useState<"board" | "history">(search.view === "history" || search.share ? "history" : "board");
  const [importCode, setImportCode] = useState("");
  const [shareInfo, setShareInfo] = useState<{ token: string; url: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<Creation[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [studentId, setStudentId] = useState<string>("");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: p } = await supabase.from("profiles").select("organization_id").eq("id", u.user.id).maybeSingle();
        setOrgId((p?.organization_id as string | null) ?? null);
      }
      const { data } = await supabase.from("students").select("id, full_name").order("full_name").limit(200);
      setStudents((data ?? []) as { id: string; full_name: string }[]);
    })().catch(() => undefined);
  }, []);

  const loadHistory = useCallback(async () => {
    await syncLocal();
    const { data } = await supabase
      .from("magic_creations")
      .select("id, kind, title, result, drawing_url, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    const remote = (data ?? []) as unknown as Creation[];
    const ids = new Set(remote.map((c) => c.id));
    const pending = readLocal().filter((c) => !ids.has(c.id)) as unknown as Creation[];
    setHistory([...pending, ...remote]);
  }, []);

  useEffect(() => {
    if (view === "history") void loadHistory();
  }, [view, loadHistory]);

  const doShare = async (creationId: string) => {
    const r = await run(() => shareFn({ data: { creationId, days: 30 } }));
    if (!r) return;
    const url = `${publicOrigin()}/tela-magica?share=${r.token}`;
    setShareInfo({ token: r.token, url });
    void navigator.clipboard?.writeText(url).catch(() => undefined);
  };

  const doImport = async (code: string) => {
    setNotice(null);
    const clean = code.includes("share=") ? code.split("share=")[1]!.split("&")[0]! : code;
    const r = await run(() => importFn({ data: { token: clean } }));
    if (r) {
      setImportCode("");
      setNotice(`✅ ${t("mg.imported")} ${r.title}`);
      void loadHistory();
    } else setNotice(t("mg.importFail"));
  };

  useEffect(() => {
    if (search.share) {
      setView("history");
      void doImport(search.share);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.share]);

  const run = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(t("mg.offline"));
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(t(errKey(e)));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const onTransform = async () => {
    const b = board.current;
    if (!b || b.isEmpty()) {
      setError(t("mg.empty"));
      return;
    }
    const img = await b.exportImage();
    const texts = b.texts();
    setSnap({ image: img, texts });
    setResult(null);
    setImage(null);
    const u = await run(() => interpret({ data: { image: img, texts, lang, profession } }));
    if (u) {
      setUnderstood(u);
      speak(`${t("mg.understood")} ${u.summary}`);
    }
  };

  const understoodText = () => (understood ? `${understood.object}; ${understood.context}; ${understood.intent}. ${understood.summary}` : "");

  const doText = async (action: TextAction) => {
    if (!snap) return;
    const r = await run(() => generate({ data: { ...snap, lang, action, profession, understood: understoodText() } }));
    if (r) {
      const parsed = JSON.parse(r.json) as MagicResult;
      setImage(null);
      setResult(parsed);
      // Guarda na hora: a atividade já aparece em Minhas Atividades.
      void persist(parsed, null);
    }
  };
  const doImage = async (mode: ImgAction) => {
    if (!snap) return;
    const r = await run(() => transform({ data: { ...snap, lang, mode, preserve, profession, understood: understoodText() } }));
    if (r) {
      setResult(null);
      setImage(r.imageUrl);
      void persist(null, r.imageUrl);
    }
  };

  /** Grava a criação no acervo da mesa (usado automaticamente e pelo botão). */
  const persist = async (res: MagicResult | null, img: string | null) => {
    if (!snap) return;
    const title = String(res?.title ?? understood?.object ?? t("mg.title"));
    const small = img ? await shrink(img, 768) : null;
    const row = {
      id: crypto.randomUUID(),
      organization_id: orgId,
      student_id: studentId || null,
      kind: res ? String(res.kind ?? "activity") : img ? "image" : "board",
      title,
      input_text: snap.texts.join(" | "),
      result: { ...(res ?? {}), understood, board: board.current?.state() ?? null },
      drawing_url: await shrink(snap.image, 480),
      image_url: small,
      created_at: new Date().toISOString(),
    };
    // Guarda sempre uma cópia local: aparece em Minhas Atividades mesmo se o envio falhar.
    writeLocal([row, ...readLocal()]);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2600);
    await syncLocal();
    if (view === "history") void loadHistory();
  };

  const save = () => persist(result, image);


  const openCreation = (c: Creation) => {
    const st = (c.result as { board?: BoardState | null }).board;
    setView("board");
    setTimeout(() => {
      if (st) board.current?.load(st);
      const { board: _b, understood: u, ...rest } = c.result as Record<string, unknown>;
      setUnderstood((u as Understood) ?? null);
      setResult(Object.keys(rest).length ? (rest as MagicResult) : null);
      setImage(c.image_url);
      setSnap(c.drawing_url ? { image: c.drawing_url, texts: [] } : null);
    }, 50);
  };

  const suggested = (a: string) => understood?.suggestions.includes(a);
  const actionBtn = (a: string) =>
    `inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-4 font-display text-lg shadow-card active:scale-95 disabled:opacity-50 ${
      suggested(a) ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
    }`;
  const ActionIcon = (a: string) => {
    const I = ACTION_ICON[a] ?? Sparkles;
    return <I size={20} strokeWidth={2.2} />;
  };
  /** Receita entra apenas no perfil de nutrição. */
  const readActions: TextAction[] = allowsRecipe(profession) ? [...READ_ACTIONS, "recipe"] : READ_ACTIONS;

  return (
    <main className="surface-studio flex min-h-screen flex-col gap-4 p-3 sm:p-5">
      <header className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-card/90 px-4 py-3 shadow-card backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 py-2 font-display text-secondary-foreground"
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
              {t("mg.back")}
            </Link>
            <h1 className="inline-flex items-center gap-2 font-display text-2xl leading-none text-foreground sm:text-3xl">
              <Sparkles size={26} strokeWidth={2.2} className="text-primary" />
              {t("mg.title")}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              aria-label={t("mg.student")}
              className="min-h-11 rounded-2xl border border-input bg-background px-3"
            >
              <option value="">{t("mg.student")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <button
              onClick={() => setView(view === "board" ? "history" : "board")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-display text-primary-foreground"
            >
              {view === "board" ? <FolderOpen size={18} strokeWidth={2.2} /> : <Pencil size={18} strokeWidth={2.2} />}
              {view === "board" ? t("mg.history") : t("mg.newBoard")}
            </button>
          </div>
        </div>

        {/* Perfil do profissional: dá contexto para a IA gerar o conteúdo certo. */}
        <div className="flex items-center gap-2 border-t border-border/50 pt-2">
          <span className="hidden shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:inline">
            {t("mg.prof.title")}
          </span>
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
            {PROFESSIONS.map((p) => {
              const I = PROF_ICON[p];
              const on = profession === p;
              return (
                <button
                  key={p}
                  onClick={() => pickProfession(p)}
                  aria-pressed={on}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-display transition active:scale-95 ${
                    on ? "bg-primary text-primary-foreground shadow-card" : "bg-background text-foreground border border-border/60"
                  }`}
                >
                  <I size={17} strokeWidth={2.2} />
                  {t(`mg.prof.${p}` as TKey)}
                </button>
              );
            })}
          </div>
        </div>
      </header>




      {view === "history" ? (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-full flex flex-wrap items-center gap-2 rounded-3xl bg-card/95 p-4 shadow-card">
            <span className="inline-flex items-center gap-2 font-display text-lg text-foreground">
              <Download size={18} strokeWidth={2.2} />
              {t("mg.importTitle")}
            </span>

            <input
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder={t("mg.importPlaceholder")}
              className="min-h-12 flex-1 rounded-2xl border border-input bg-background px-3 font-mono uppercase"
            />
            <button
              disabled={busy || importCode.trim().length < 6}
              onClick={() => void doImport(importCode)}
              className="min-h-12 rounded-full bg-primary px-5 font-display text-primary-foreground disabled:opacity-50"
            >
              {t("mg.import")}
            </button>
          </div>
          {shareInfo && (
            <div className="col-span-full rounded-3xl bg-card p-4 text-center shadow-card">
              <p className="text-sm text-muted-foreground">{t("mg.shareCode")}</p>
              <p className="font-mono text-3xl tracking-widest text-foreground">{shareInfo.token}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{shareInfo.url}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("mg.shareHint")}</p>
            </div>
          )}
          {notice && <p className="col-span-full rounded-2xl bg-card p-3 text-center text-foreground">{notice}</p>}
          {history.length === 0 && <p className="col-span-full text-center text-lg text-muted-foreground">{t("mg.noHistory")}</p>}
          {history.map((c) => (
            <div key={c.id} className="flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
              <div className="relative">
                <img src={c.image_url ?? c.drawing_url ?? ""} alt="" className="aspect-[16/10] w-full bg-muted object-cover" />
                <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-card/90 p-2 text-foreground">
                  {(() => {
                    const I = KIND_ICON[c.kind] ?? Sparkles;
                    return <I size={16} strokeWidth={2.2} />;
                  })()}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <p className="font-display text-lg leading-tight text-foreground">{c.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <button
                    onClick={() => openCreation(c)}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 font-display text-sm text-primary-foreground"
                  >
                    <Play size={16} strokeWidth={2.4} />
                    {t("mg.open")}
                  </button>
                  <button
                    onClick={() => void doShare(c.id)}
                    aria-label={t("mg.share")}
                    className="inline-flex min-h-10 items-center rounded-full bg-zeno-green px-4 text-primary-foreground"
                  >
                    <Share2 size={16} strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm(t("mg.confirmDelete"))) return;
                      await supabase.from("magic_creations").delete().eq("id", c.id);
                      void loadHistory();
                    }}
                    aria-label={t("mg.delete")}
                    className="inline-flex min-h-10 items-center rounded-full bg-secondary px-4 text-secondary-foreground"
                  >
                    <Trash2 size={16} strokeWidth={2.2} />
                  </button>

                </div>
              </div>
            </div>
          ))}

        </section>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex min-h-[60vh] flex-col gap-3">
            <MagicBoard ref={board} />
            <button
              onClick={onTransform}
              disabled={busy}
              className="magic-cta inline-flex min-h-16 items-center justify-center gap-3 rounded-full font-display text-2xl text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? <Loader2 size={26} strokeWidth={2.4} className="animate-spin" /> : <Sparkles size={26} strokeWidth={2.4} />}
              {busy ? t("mg.thinking") : t("mg.transform")}
            </button>
          </div>

          <aside className="flex flex-col gap-3">
            {error && <p className="rounded-2xl bg-destructive/10 p-3 text-destructive">{error}</p>}
            {savedMsg && (
              <p className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zeno-green/15 p-3 text-center font-display text-lg text-foreground">
                <Save size={18} strokeWidth={2.2} />
                {t("mg.autoSaved")}
              </p>
            )}
            {understood && (
              <div className="rounded-[2rem] border border-border/60 bg-card/95 p-4 shadow-card">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("mg.understood")}</p>
                <p className="font-display text-2xl text-foreground">{understood.object}</p>
                <p className="text-base text-foreground">{understood.summary}</p>

                <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <Gamepad2 size={15} strokeWidth={2.4} />
                  {t("mg.groupPlay")}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PLAY_ACTIONS.map((a) => (
                    <button key={a} disabled={busy} onClick={() => doText(a)} className={actionBtn(a)}>
                      {ActionIcon(a)}
                      {t(`mg.act.${a}` as TKey)}
                    </button>
                  ))}
                </div>

                <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <BookOpen size={15} strokeWidth={2.4} />
                  {t("mg.groupRead")}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {readActions.map((a) => (
                    <button key={a} disabled={busy} onClick={() => doText(a)} className={actionBtn(a)}>
                      {ActionIcon(a)}
                      {t(`mg.act.${a}` as TKey)}
                    </button>
                  ))}
                </div>

                <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <Palette size={15} strokeWidth={2.4} />
                  {t("mg.groupArt")}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {IMG_ACTIONS.map((a) => (
                    <button key={a} disabled={busy} onClick={() => doImage(a)} className={actionBtn(a)}>
                      {ActionIcon(a)}
                      {t(`mg.act.${a}` as TKey)}
                    </button>
                  ))}
                </div>

                <label className="mt-3 flex items-center gap-2 text-base">
                  <input type="checkbox" checked={preserve} onChange={(e) => setPreserve(e.target.checked)} className="h-5 w-5" />
                  {t("mg.preserve")}
                </label>
              </div>
            )}
            {image && (
              <div className="rounded-[2rem] border border-border/60 bg-card/95 p-4 shadow-card">
                <img src={image} alt={understood?.object ?? ""} className="w-full rounded-2xl" />
              </div>
            )}
            {(result || image) && (
              <button
                onClick={save}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary font-display text-base text-secondary-foreground shadow-card"
              >
                <Save size={18} strokeWidth={2.2} />
                {t("mg.save")}
              </button>
            )}

            {result && (
              <button onClick={() => speak(resultSpeech(result))} className="sr-only">
                {t("mg.read")}
              </button>
            )}
          </aside>


          {result && (
            <div className="lg:col-span-2">
              <ActivityEngine key={JSON.stringify(result).length + String(result.title)} result={result} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

async function shrink(src: string, max: number): Promise<string> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } catch {
    return src;
  }
}
