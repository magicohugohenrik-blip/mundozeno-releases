import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { prompt, sample, shuffle, wordsFor } from "@/lib/literacy/content";

interface Card {
  id: number;
  pair: string;
  face: string;
  matched: boolean;
  open: boolean;
}

/**
 * Memória das Letras.
 * Nível 1: maiúscula ↔ maiúscula · Nível 2: maiúscula ↔ minúscula ·
 * Nível 3: letra ↔ figura que começa com ela.
 */
export function LetterMemoryGame({ level, onComplete }: { level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();

  const pairs = level >= 3 ? 6 : level === 2 ? 5 : 4;

  const initial = useMemo<Card[]>(() => {
    const bank = sample(wordsFor(lang), pairs);
    const built = bank.flatMap((item, i) => {
      const letter = item.word[0]!;
      const partner = level >= 3 ? item.emoji : level === 2 ? letter.toLowerCase() : letter;
      return [
        { id: i * 2, pair: letter, face: letter, matched: false, open: false },
        { id: i * 2 + 1, pair: letter, face: partner, matched: false, open: false },
      ];
    });
    return shuffle(built);
  }, [lang, level, pairs]);

  const [cards, setCards] = useState<Card[]>(initial);
  const [picked, setPicked] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);

  const matched = cards.filter((c) => c.matched).length / 2;
  const allDone = cards.length > 0 && cards.every((c) => c.matched);

  useEffect(() => {
    const id = setTimeout(() => speak(prompt(lang, "memoryPrompt")), 250);
    return () => clearTimeout(id);
  }, [lang]);

  useEffect(() => {
    stage.setProgress(matched, pairs);
  }, [matched, pairs, stage]);

  useEffect(() => {
    if (!allDone) return;
    stage.react("done", prompt(lang, "great"));
    const id = setTimeout(
      () => onComplete(Math.max(10, 100 - misses * 6), tracker.getEvents()),
      800,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const flip = (id: number) => {
    if (picked.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || card.open) return;
    const next = cards.map((c) => (c.id === id ? { ...c, open: true } : c));
    const list = [...picked, id];
    setCards(next);
    setPicked(list);
    if (list.length < 2) return;
    const [a, b] = list.map((pid) => next.find((c) => c.id === pid)!);
    setTimeout(() => {
      if (a!.pair === b!.pair) {
        playSfx("hit");
        tracker.correct({ pair: a!.pair });
        stage.react("correct", prompt(lang, "great"));
        setCards((s) => s.map((c) => (c.id === a!.id || c.id === b!.id ? { ...c, matched: true } : c)));
      } else {
        tracker.wrong({ a: a!.face, b: b!.face });
        stage.react("wrong", prompt(lang, "tryAgain"));
        setMisses((m) => m + 1);
        setCards((s) => s.map((c) => (c.id === a!.id || c.id === b!.id ? { ...c, open: false } : c)));
      }
      setPicked([]);
    }, 700);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-center font-display text-2xl leading-tight sm:text-3xl">{prompt(lang, "memoryPrompt")}</p>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((c) => {
          const open = c.open || c.matched;
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => flip(c.id)}
              className={`flex aspect-square items-center justify-center rounded-[1.5rem] shadow-card ${
                open ? "bg-card" : "bg-zeno-blue/85"
              } ${c.matched ? "opacity-90 ring-4 ring-zeno-green/50" : ""}`}
            >
              <span className={`font-display leading-none ${open ? "text-4xl sm:text-5xl" : "text-3xl text-white"}`}>
                {open ? c.face : "?"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
