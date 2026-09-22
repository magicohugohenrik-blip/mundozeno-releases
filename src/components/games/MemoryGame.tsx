import { useEffect, useMemo, useState } from "react";
import type { GameResult } from "@/lib/zeno";

const DECKS: Record<number, string[]> = {
  1: ["⭐", "🧩", "💙", "🐾"],
  2: ["⭐", "🧩", "💙", "🐾", "🎈", "🌈"],
  3: ["⭐", "🧩", "💙", "🐾", "🎈", "🌈", "🚀", "🌻"],
  4: ["⭐", "🧩", "💙", "🐾", "🎈", "🌈", "🚀", "🌻", "🤖", "🎨"],
};

interface Card {
  id: number;
  key: string;
  flipped: boolean;
  matched: boolean;
}

export function MemoryGame({ level, onFinish }: { level: number; onFinish: (r: GameResult) => void }) {
  const started = useMemo(() => Date.now(), []);
  const cards = useMemo<Card[]>(() => {
    const base = DECKS[level] ?? DECKS[1]!;
    return [...base, ...base]
      .map((key) => ({ key, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item, id) => ({ id, key: item.key, flipped: false, matched: false }));
  }, [level]);

  const [state, setState] = useState<Card[]>(cards);
  const [picked, setPicked] = useState<number[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setState(cards);
    setPicked([]);
  }, [cards]);

  useEffect(() => {
    if (state.length > 0 && state.every((c) => c.matched)) {
      const timer = setTimeout(
        () =>
          onFinish({
            score: Math.max(0, hits * 10 - misses * 2),
            hits,
            misses,
            durationSeconds: Math.round((Date.now() - started) / 1000),
          }),
        700,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state, hits, misses, onFinish, started]);

  function flip(id: number) {
    if (picked.length === 2) return;
    const card = state.find((c) => c.id === id);
    if (!card || card.matched || card.flipped) return;
    const next = state.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const nextPicked = [...picked, id];
    setState(next);
    setPicked(nextPicked);
    if (nextPicked.length === 2) {
      const [a, b] = nextPicked.map((pid) => next.find((c) => c.id === pid)!) as [Card, Card];
      if (a.key === b.key) {
        setHits((h) => h + 1);
        setTimeout(() => {
          setState((cur) => cur.map((c) => (c.key === a.key ? { ...c, matched: true } : c)));
          setPicked([]);
        }, 450);
      } else {
        setMisses((m) => m + 1);
        setTimeout(() => {
          setState((cur) => cur.map((c) => (nextPicked.includes(c.id) ? { ...c, flipped: false } : c)));
          setPicked([]);
        }, 800);
      }
    }
  }

  const cols = state.length <= 8 ? "grid-cols-4" : state.length <= 12 ? "grid-cols-4" : "grid-cols-5";

  return (
    <div className={`mx-auto grid w-full gap-3 sm:gap-4 ${cols}`}>
      {state.map((card) => (
        <button
          key={card.id}
          onClick={() => flip(card.id)}
          aria-label={card.flipped || card.matched ? card.key : "Carta virada"}
          className={`flex aspect-square items-center justify-center rounded-3xl text-4xl transition-transform duration-200 sm:text-6xl ${
            card.matched
              ? "scale-95 bg-zeno-green/20 ring-4 ring-zeno-green"
              : card.flipped
                ? "bg-card shadow-card"
                : "bg-zeno-blue shadow-card active:scale-95"
          }`}
        >
          {card.matched || card.flipped ? card.key : <span className="text-3xl opacity-90">🤖</span>}
        </button>
      ))}
    </div>
  );
}
