import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";

/* Motor de atividades: recebe JSON gerado pela IA e monta a tela com componentes próprios. */

type Opt = { label: string; emoji?: string };
export type MagicResult = Record<string, unknown> & { kind?: string; type?: string; title?: string };

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : "");

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const tile =
  "min-h-20 rounded-3xl bg-card px-4 py-3 font-display text-xl text-foreground shadow-card active:scale-95 disabled:opacity-60";

function Feedback({ ok }: { ok: boolean | null }) {
  const t = useT();
  if (ok === null) return null;
  return (
    <p className={`mt-4 text-center font-display text-2xl ${ok ? "text-zeno-green" : "text-zeno-orange"}`}>
      {ok ? t("mg.correct") : t("mg.tryAgain")}
    </p>
  );
}

function Done({ onRestart }: { onRestart: () => void }) {
  const t = useT();
  return (
    <div className="py-10 text-center">
      <p className="font-display text-4xl text-foreground">{t("mg.done")}</p>
      <button onClick={onRestart} className="mt-6 min-h-14 rounded-full bg-primary px-8 font-display text-xl text-primary-foreground">
        🔁 {t("mg.restart")}
      </button>
    </div>
  );
}

function Quiz({ r }: { r: MagicResult }) {
  const qs = arr<{ question: string; options: Opt[]; answer: string }>(r["questions"]);
  const [i, setI] = useState(0);
  const [ok, setOk] = useState<boolean | null>(null);
  const q = qs[i];
  const options = useMemo(() => shuffle(arr<Opt>(q?.options)), [q]);
  if (!q) return <Done onRestart={() => { setI(0); setOk(null); }} />;
  return (
    <div>
      <p className="text-center font-display text-3xl text-foreground">{q.question}</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.label}
            className={tile}
            onClick={() => {
              const good = o.label.trim().toLowerCase() === str(q.answer).trim().toLowerCase();
              setOk(good);
              playSfx(good ? "hit" : "miss");
              if (good) setTimeout(() => { setOk(null); setI(i + 1); }, 900);
            }}
          >
            <span className="block text-5xl">{o.emoji}</span>
            {o.label}
          </button>
        ))}
      </div>
      <Feedback ok={ok} />
    </div>
  );
}

function TrueFalse({ r }: { r: MagicResult }) {
  const t = useT();
  const list = arr<{ text: string; emoji?: string; answer: boolean }>(r["statements"]);
  const [i, setI] = useState(0);
  const [ok, setOk] = useState<boolean | null>(null);
  const s = list[i];
  if (!s) return <Done onRestart={() => { setI(0); setOk(null); }} />;
  const pick = (v: boolean) => {
    const good = v === Boolean(s.answer);
    setOk(good);
    playSfx(good ? "hit" : "miss");
    if (good) setTimeout(() => { setOk(null); setI(i + 1); }, 900);
  };
  return (
    <div className="text-center">
      <p className="text-6xl">{s.emoji}</p>
      <p className="mt-3 font-display text-3xl text-foreground">{s.text}</p>
      <div className="mt-6 flex justify-center gap-4">
        <button className={`${tile} bg-zeno-green text-primary-foreground`} onClick={() => pick(true)}>✅ {t("mg.true")}</button>
        <button className={`${tile} bg-zeno-orange text-primary-foreground`} onClick={() => pick(false)}>❌ {t("mg.false")}</button>
      </div>
      <Feedback ok={ok} />
    </div>
  );
}

function Sequence({ r }: { r: MagicResult }) {
  const t = useT();
  const steps = arr<Opt>(r["steps"]);
  const [pool, setPool] = useState(() => shuffle(steps));
  const [picked, setPicked] = useState<Opt[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);
  const done = picked.length === steps.length && ok;
  if (done) return <Done onRestart={() => { setPool(shuffle(steps)); setPicked([]); setOk(null); }} />;
  return (
    <div>
      <div className="flex min-h-24 flex-wrap gap-3 rounded-3xl border-4 border-dashed border-border p-3">
        {picked.map((o, n) => (
          <button key={o.label} className={tile} onClick={() => { setPicked(picked.filter((p) => p !== o)); setPool([...pool, o]); setOk(null); }}>
            <span className="mr-1 text-sm text-muted-foreground">{n + 1}.</span> {o.emoji} {o.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {pool.map((o) => (
          <button key={o.label} className={tile} onClick={() => { setPool(pool.filter((p) => p !== o)); setPicked([...picked, o]); }}>
            {o.emoji} {o.label}
          </button>
        ))}
      </div>
      {picked.length === steps.length && (
        <button
          className="mt-4 min-h-14 rounded-full bg-primary px-8 font-display text-xl text-primary-foreground"
          onClick={() => {
            const good = picked.every((p, n) => p.label === steps[n]?.label);
            setOk(good);
            playSfx(good ? "hit" : "miss");
          }}
        >
          {t("mg.check")}
        </button>
      )}
      <Feedback ok={ok === false ? false : null} />
    </div>
  );
}

function Classify({ r }: { r: MagicResult }) {
  const cats = arr<string>(r["categories"]);
  const items = arr<Opt & { category: string }>(r["items"]);
  const [queue, setQueue] = useState(() => shuffle(items));
  const [placed, setPlaced] = useState<Record<string, Opt[]>>({});
  const [ok, setOk] = useState<boolean | null>(null);
  const cur = queue[0];
  if (!cur) return <Done onRestart={() => { setQueue(shuffle(items)); setPlaced({}); setOk(null); }} />;
  return (
    <div className="text-center">
      <p className="text-7xl">{cur.emoji}</p>
      <p className="font-display text-3xl text-foreground">{cur.label}</p>
      <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, cats.length)}, minmax(0,1fr))` }}>
        {cats.map((c) => (
          <button
            key={c}
            className="min-h-40 rounded-3xl bg-secondary p-3 font-display text-2xl text-secondary-foreground shadow-card active:scale-95"
            onClick={() => {
              const good = c === cur.category;
              setOk(good);
              playSfx(good ? "hit" : "miss");
              if (good) {
                setPlaced({ ...placed, [c]: [...(placed[c] ?? []), cur] });
                setQueue(queue.slice(1));
              }
            }}
          >
            {c}
            <span className="mt-2 block text-3xl">{(placed[c] ?? []).map((p) => p.emoji).join(" ")}</span>
          </button>
        ))}
      </div>
      <Feedback ok={ok} />
    </div>
  );
}

function Count({ r }: { r: MagicResult }) {
  const rounds = arr<{ emoji: string; count: number; options: number[] }>(r["rounds"]);
  const [i, setI] = useState(0);
  const [ok, setOk] = useState<boolean | null>(null);
  const q = rounds[i];
  if (!q) return <Done onRestart={() => { setI(0); setOk(null); }} />;
  const n = Math.min(12, Math.max(1, Number(q.count) || 1));
  return (
    <div className="text-center">
      <p className="text-6xl leading-snug tracking-widest">{Array.from({ length: n }, () => q.emoji).join(" ")}</p>
      <div className="mt-6 flex justify-center gap-4">
        {arr<number>(q.options).map((o) => (
          <button
            key={o}
            className={`${tile} min-w-24 text-4xl`}
            onClick={() => {
              const good = Number(o) === n;
              setOk(good);
              playSfx(good ? "hit" : "miss");
              if (good) setTimeout(() => { setOk(null); setI(i + 1); }, 900);
            }}
          >
            {o}
          </button>
        ))}
      </div>
      <Feedback ok={ok} />
    </div>
  );
}

function Memory({ r }: { r: MagicResult }) {
  const pairs = arr<Opt>(r["pairs"]).slice(0, 8);
  const build = () => shuffle(pairs.flatMap((p, k) => [{ k, p, id: `${k}a` }, { k, p, id: `${k}b` }]));
  const [cards, setCards] = useState(build);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<number[]>([]);
  if (pairs.length && found.length === pairs.length)
    return <Done onRestart={() => { setCards(build()); setOpen([]); setFound([]); }} />;
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {cards.map((c) => {
        const shown = open.includes(c.id) || found.includes(c.k);
        return (
          <button
            key={c.id}
            disabled={shown || open.length === 2}
            onClick={() => {
              const next = [...open, c.id];
              setOpen(next);
              if (next.length === 2) {
                const [a, b] = next.map((id) => cards.find((x) => x.id === id)!);
                if (a!.k === b!.k) {
                  playSfx("hit");
                  setFound([...found, a!.k]);
                  setOpen([]);
                } else setTimeout(() => setOpen([]), 900);
              }
            }}
            className={`aspect-square rounded-3xl font-display text-lg shadow-card ${shown ? "bg-card text-foreground" : "bg-primary text-primary-foreground"}`}
          >
            {shown ? (
              <>
                <span className="block text-5xl">{c.p.emoji}</span>
                {c.p.label}
              </>
            ) : (
              <span className="text-4xl">✨</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Texto corrido usado para leitura em voz alta. */
export function resultSpeech(r: MagicResult): string {
  const parts = [str(r.title), str(r["instruction"]), ...arr<string>(r["paragraphs"]), ...arr<string>(r["ingredients"]), ...arr<string>(r["steps"]).filter((s) => typeof s === "string"), str(r["funFact"]), str(r["tip"])];
  return parts.filter(Boolean).join(". ");
}

export function ActivityEngine({ result }: { result: MagicResult }) {
  const t = useT();
  const kind = str(result.kind) || "activity";
  const title = str(result.title);
  const emoji = str(result["emoji"]);

  let body: React.ReactNode = null;
  if (kind === "activity") {
    const type = str(result.type);
    body =
      type === "truefalse" ? <TrueFalse r={result} /> :
      type === "sequence" ? <Sequence r={result} /> :
      type === "classify" ? <Classify r={result} /> :
      type === "count" ? <Count r={result} /> :
      type === "memory" ? <Memory r={result} /> :
      <Quiz r={result} />;
  } else if (kind === "recipe") {
    body = (
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="font-display text-2xl">{t("mg.ingredients")}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-xl">{arr<string>(result["ingredients"]).map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <h3 className="font-display text-2xl">{t("mg.steps")}</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-6 text-xl">{arr<string>(result["steps"]).map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
        {str(result["tip"]) && <p className="rounded-2xl bg-secondary p-4 text-lg sm:col-span-2">💡 {str(result["tip"])}</p>}
      </div>
    );
  } else {
    body = (
      <div className="space-y-3 text-xl leading-relaxed">
        {arr<string>(result["paragraphs"]).map((p, n) => <p key={n}>{p}</p>)}
        {str(result["funFact"]) && <p className="rounded-2xl bg-secondary p-4">🌟 {t("mg.funFact")}: {str(result["funFact"])}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] bg-card/95 p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-foreground">{emoji} {title}</h2>
        <button onClick={() => speak(resultSpeech(result))} className="min-h-12 rounded-full bg-secondary px-5 font-display text-secondary-foreground">
          {t("mg.read")}
        </button>
      </div>
      {str(result["instruction"]) && <p className="mb-4 text-lg text-muted-foreground">{str(result["instruction"])}</p>}
      {body}
    </div>
  );
}
