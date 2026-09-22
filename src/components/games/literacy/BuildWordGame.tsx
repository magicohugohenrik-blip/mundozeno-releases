import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { prompt, sample, shuffle, wordsFor } from "@/lib/literacy/content";

/** Monte a Palavra: letras embaralhadas (+ distratores) formam a palavra da figura. */
export function BuildWordGame({ level, onComplete }: { level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();

  const rounds = useMemo(() => {
    const bank = wordsFor(lang).filter((w) => w.word.length <= (level >= 3 ? 9 : level === 2 ? 6 : 4));
    const list = bank.length >= 3 ? bank : wordsFor(lang);
    return sample(list, level >= 3 ? 5 : 4).map((item) => {
      const extra = level >= 2 ? sample("BCDFGLMPRSTV".split(""), level >= 3 ? 3 : 2) : [];
      return { ...item, letters: shuffle([...item.word.split(""), ...extra]) };
    });
  }, [lang, level]);

  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [hits, setHits] = useState(0);

  const round = rounds[index]!;
  const current = typed.map((i) => round.letters[i]).join("");
  const done = current === round.word;

  useEffect(() => {
    stage.setProgress(index, rounds.length);
    tracker.mark();
    const id = setTimeout(() => speak(`${round.word}. ${prompt(lang, "buildHint")}`), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (!done) return;
    playSfx("hit");
    tracker.correct({ word: round.word });
    stage.react("correct", prompt(lang, "great"));
    const nextHits = hits + 1;
    setHits(nextHits);
    const id = setTimeout(() => {
      if (index + 1 >= rounds.length) {
        stage.react("done", prompt(lang, "great"));
        const score = Math.max(10, Math.round((nextHits / rounds.length) * 100 - misses * 4));
        onComplete(score, tracker.getEvents());
      } else {
        setTyped([]);
        setIndex((v) => v + 1);
      }
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const tap = (i: number) => {
    if (typed.includes(i) || done) return;
    const expected = round.word[typed.length];
    if (round.letters[i] !== expected) {
      tracker.wrong({ word: round.word, picked: round.letters[i] });
      stage.react("wrong", prompt(lang, "tryAgain"));
      setMisses((m) => m + 1);
      return;
    }
    playSfx("tap");
    setTyped((list) => [...list, i]);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <p className="text-center font-display text-2xl leading-tight sm:text-3xl">{prompt(lang, "buildWord")}</p>

      <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-card px-6 py-5 shadow-card">
        <span className="text-7xl sm:text-8xl">{round.emoji}</span>
        <div className="flex flex-wrap justify-center gap-2">
          {round.word.split("").map((ch, i) => (
            <span
              key={i}
              className={`flex h-16 w-14 items-center justify-center rounded-[1rem] font-display text-3xl ${
                i < typed.length ? "bg-zeno-green text-white" : "bg-secondary/60 text-muted-foreground"
              }`}
            >
              {i < typed.length ? ch : "_"}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {round.letters.map((letter, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.94 }}
            onClick={() => tap(i)}
            className={`flex h-20 w-20 items-center justify-center rounded-[1.5rem] font-display text-4xl shadow-card ${
              typed.includes(i) ? "bg-secondary/40 text-muted-foreground opacity-50" : "bg-card"
            }`}
          >
            {letter}
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setTyped([])}
          className="rounded-full bg-card px-6 py-3 font-display text-lg shadow-card active:scale-95"
        >
          ↩ {prompt(lang, "clear")}
        </button>
      </div>
    </div>
  );
}
