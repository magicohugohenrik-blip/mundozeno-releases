import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import cardFrame from "@/assets/scenes/memory-card.png.asset.json";



/** Jogos clássicos (base da Bia) com o visual da Turma do Zeno. */

interface Card { id: number; key: string; image: string; label: string; flipped: boolean; matched: boolean }

export interface MemoryFace { key: string; image: string; label: string }

export const MemoryGame = ({ faces, onComplete }: { faces: MemoryFace[]; onComplete: GameCompleteFn }) => {
  const tracker = useGameTracker();
  const stage = useGameStage();
  const { t } = useI18n();
  const [seed, setSeed] = useState(0);
  const [wrongPair, setWrongPair] = useState<number[]>([]);
  const cards = useMemo<Card[]>(() => {
    return [...faces, ...faces]
      .sort(() => Math.random() - 0.5)
      .map((it, id) => ({ id, key: it.key, image: it.image, label: it.label, flipped: false, matched: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const [state, setState] = useState<Card[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    setState(cards);
    setPicked([]);
    setMoves(0);
  }, [cards]);

  const allDone = state.length > 0 && state.every((c) => c.matched);
  const foundPairs = state.filter((c) => c.matched).length / 2;
  const totalPairs = faces.length;

  useEffect(() => {
    stage.setProgress(foundPairs, totalPairs);
  }, [foundPairs, totalPairs, stage]);

  useEffect(() => {
    if (!allDone) return;
    stage.react("done", t("shell.finished"));
    const score = Math.max(10, 100 - moves * 5);
    const timer = setTimeout(() => onComplete(score, tracker.getEvents()), 900);
    return () => clearTimeout(timer);
  }, [allDone, moves, onComplete, tracker, stage, t]);

  const flip = (id: number) => {
    if (picked.length === 2) return;
    const card = state.find((c) => c.id === id);
    if (!card || card.matched || card.flipped) return;
    const next = state.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const newPicked = [...picked, id];
    setState(next);
    setPicked(newPicked);
    if (newPicked.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newPicked.map((pid) => next.find((c) => c.id === pid)!);
      setTimeout(() => {
        if (a!.key === b!.key) {
          tracker.correct({ pair: a!.key });
          stage.react("correct", t("celebration.1"));
          setState((s) => s.map((c) => (c.id === a!.id || c.id === b!.id ? { ...c, matched: true } : c)));
        } else {
          tracker.wrong({ a: a!.key, b: b!.key });
          stage.react("wrong", t("encourage.tryAgain"));
          setWrongPair([a!.id, b!.id]);
          setTimeout(() => setWrongPair([]), 400);
          setState((s) => s.map((c) => (c.id === a!.id || c.id === b!.id ? { ...c, flipped: false } : c)));
        }
        setPicked([]);
      }, 700);
    }
  };


  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setSeed((s) => s + 1)}
          aria-label={t("shell.again")}
          className="btn-round bg-card text-zeno-blue active:scale-95"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto grid w-full grid-cols-4 gap-3">
        {state.map((c) => {
          const open = c.flipped || c.matched;
          return (
            <button
              key={c.id}
              onClick={() => flip(c.id)}
              className={`flip-scene relative aspect-[440/580] w-full transition-transform active:scale-95 ${
                c.matched ? "scale-95 opacity-90" : ""
              } ${wrongPair.includes(c.id) ? "animate-shake" : ""}`}
              aria-label={open ? c.label : "Carta virada"}
            >

              <span
                className="flip-inner block"
                style={{ transform: open ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                <span
                  className="flip-face bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${cardFrame.url})` }}
                >
                  <span className="font-display text-4xl text-wood-dark/70">?</span>
                </span>
                <span
                  className="flip-face bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${cardFrame.url})`, transform: "rotateY(180deg)" }}
                >
                  <img src={c.image} alt={c.label} className="h-[68%] w-[68%] object-contain" />
                </span>
              </span>
            </button>
          );
        })}
      </div>


      {allDone && (
        <p className="flex items-center justify-center gap-2 rounded-[1.5rem] bg-zeno-green/15 p-4 text-center font-display text-xl">
          <Trophy className="h-5 w-5" /> {t("shell.finished")}
        </p>
      )}
    </div>
  );
};

export const CountGame = ({ onComplete }: { onComplete: GameCompleteFn }) => {
  const tracker = useGameTracker();
  const stage = useGameStage();
  const { t } = useI18n();
  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const rounds = useMemo(() => {
    const items = ["🍎", "⭐", "🐝", "🌸", "🐟", "🍓"];
    return Array.from({ length: 5 }, () => {
      const n = Math.floor(Math.random() * 6) + 3;
      const item = items[Math.floor(Math.random() * items.length)]!;
      const options = new Set<number>([n]);
      while (options.size < 4) options.add(Math.max(1, n + Math.floor(Math.random() * 5) - 2));
      return { n, item, options: [...options].sort(() => Math.random() - 0.5) };
    });
  }, []);
  const current = rounds[round]!;

  useEffect(() => {
    stage.setProgress(round, rounds.length);
  }, [round, rounds.length, stage]);

  const pick = (v: number) => {
    const ok = v === current.n;
    if (ok) {
      setCorrectCount((c) => c + 1);
      tracker.correct({ round });
      stage.react("correct", t("celebration.1"));
    } else {
      tracker.wrong({ round, picked: v, expected: current.n });
      stage.react("wrong", t("encourage.tryAgain"));
    }
    if (round + 1 >= rounds.length) {
      const score = Math.round(((correctCount + (ok ? 1 : 0)) / rounds.length) * 100);
      setTimeout(() => onComplete(score, tracker.getEvents()), 400);
    } else setRound((r) => r + 1);
  };

  return (
    <div className="space-y-5">
      <p className="text-center font-display text-2xl">{t("count.prompt")}</p>
      <div className="flex min-h-[160px] flex-wrap items-center justify-center gap-3 rounded-[1.75rem] bg-card p-6 text-5xl shadow-card">
        {Array.from({ length: current.n }).map((_, i) => (
          <span key={i}>{current.item}</span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {current.options.map((o) => (
          <button
            key={o}
            onClick={() => pick(o)}
            className="rounded-[1.5rem] bg-card py-5 font-display text-3xl shadow-card active:scale-95"
          >
            {o}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {t("game.round", { current: round + 1, total: rounds.length })}
      </p>
    </div>
  );
};

export const OddOneOutGame = ({ onComplete }: { onComplete: GameCompleteFn }) => {
  const tracker = useGameTracker();
  const stage = useGameStage();
  const { t } = useI18n();
  const sets = useMemo(
    () => [
      { items: ["🍎", "🍌", "🍇", "🚗"], odd: 3, theme: "frutas" },
      { items: ["🐶", "🐱", "🐰", "🌵"], odd: 3, theme: "animais" },
      { items: ["🚗", "🚌", "🚲", "🍕"], odd: 3, theme: "transportes" },
      { items: ["⭐", "🌙", "☀️", "🥕"], odd: 3, theme: "céu" },
      { items: ["🔵", "🔷", "🟦", "🍓"], odd: 3, theme: "azuis" },
    ],
    [],
  );
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const current = sets[round]!;

  useEffect(() => {
    stage.setProgress(round, sets.length);
  }, [round, sets.length, stage]);

  const pick = (i: number) => {
    const ok = i === current.odd;
    if (ok) {
      tracker.correct({ theme: current.theme });
      stage.react("correct", t("celebration.2"));
    } else {
      tracker.wrong({ theme: current.theme, picked: i });
      stage.react("wrong", t("encourage.tryAgain"));
    }
    const newCorrect = correct + (ok ? 1 : 0);
    if (round + 1 >= sets.length) {
      setTimeout(() => onComplete(Math.round((newCorrect / sets.length) * 100), tracker.getEvents()), 400);
    } else {
      setCorrect(newCorrect);
      setRound((r) => r + 1);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-center font-display text-2xl">{t("odd.prompt")}</p>
      <div className="grid grid-cols-2 gap-4">
        {current.items.map((it, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            className="flex aspect-square items-center justify-center rounded-[1.75rem] bg-card text-6xl shadow-card active:scale-95"
          >
            {it}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {t("game.round", { current: round + 1, total: sets.length })}
      </p>
    </div>
  );
};

export const PatternGame = ({ onComplete }: { onComplete: GameCompleteFn }) => {
  const tracker = useGameTracker();
  const stage = useGameStage();
  const { t } = useI18n();
  const rounds = useMemo(
    () => [
      { seq: ["🔴", "🔵", "🔴", "🔵", "🔴"], options: ["🔵", "🔴", "🟡"], correct: 0 },
      { seq: ["⭐", "⭐", "🌙", "⭐", "⭐"], options: ["⭐", "🌙", "☀️"], correct: 1 },
      { seq: ["🟦", "🟨", "🟥", "🟦", "🟨"], options: ["🟥", "🟦", "🟨"], correct: 0 },
      { seq: ["🐶", "🐱", "🐶", "🐱"], options: ["🐱", "🐶", "🐰"], correct: 1 },
      { seq: ["🍎", "🍎", "🍌", "🍎", "🍎"], options: ["🍌", "🍎", "🍇"], correct: 0 },
    ],
    [],
  );
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const current = rounds[round]!;

  useEffect(() => {
    stage.setProgress(round, rounds.length);
  }, [round, rounds.length, stage]);

  const pick = (i: number) => {
    const ok = i === current.correct;
    if (ok) {
      tracker.correct({ round });
      stage.react("correct", t("celebration.3"));
    } else {
      tracker.wrong({ round, picked: i });
      stage.react("wrong", t("encourage.tryAgain"));
    }
    const newCorrect = correct + (ok ? 1 : 0);
    if (round + 1 >= rounds.length) {
      setTimeout(() => onComplete(Math.round((newCorrect / rounds.length) * 100), tracker.getEvents()), 400);
    } else {
      setCorrect(newCorrect);
      setRound((r) => r + 1);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-center font-display text-2xl">{t("pattern.prompt")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1.75rem] bg-card p-4 shadow-card">
        {current.seq.map((s, i) => (
          <span key={i} className="text-4xl">
            {s}
          </span>
        ))}
        <span className="text-3xl text-muted-foreground">→ ?</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {current.options.map((o, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            className="flex aspect-square items-center justify-center rounded-[1.75rem] bg-card text-5xl shadow-card active:scale-95"
          >
            {o}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {t("game.round", { current: round + 1, total: rounds.length })}
      </p>
    </div>
  );
};
