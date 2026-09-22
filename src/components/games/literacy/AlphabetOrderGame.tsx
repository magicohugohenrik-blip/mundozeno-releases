import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { alphabet, prompt, shuffle } from "@/lib/literacy/content";

/** Ordem do Alfabeto: sequências curtas que crescem conforme o nível. */
export function AlphabetOrderGame({ level, onComplete }: { level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();

  const rounds = useMemo(() => {
    const size = level >= 3 ? 6 : level === 2 ? 5 : 3;
    return Array.from({ length: 4 }, (_, r) => {
      const start = Math.floor(Math.random() * (alphabet.length - size - r));
      const seq = alphabet.slice(start, start + size);
      return { seq, shuffled: shuffle(seq) };
    });
  }, [level]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [hits, setHits] = useState(0);

  const round = rounds[index]!;
  const done = picked.length === round.seq.length;

  useEffect(() => {
    stage.setProgress(index, rounds.length);
    tracker.mark();
    const id = setTimeout(() => speak(prompt(lang, "orderPrompt")), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (!done) return;
    playSfx("hit");
    tracker.correct({ seq: round.seq.join("") });
    stage.react("correct", prompt(lang, "great"));
    const nextHits = hits + 1;
    setHits(nextHits);
    const id = setTimeout(() => {
      if (index + 1 >= rounds.length) {
        stage.react("done", prompt(lang, "great"));
        onComplete(Math.max(10, Math.round((nextHits / rounds.length) * 100 - misses * 4)), tracker.getEvents());
      } else {
        setPicked([]);
        setIndex((v) => v + 1);
      }
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const tap = (letter: string) => {
    if (picked.includes(letter) || done) return;
    if (letter !== round.seq[picked.length]) {
      tracker.wrong({ picked: letter, expected: round.seq[picked.length] });
      stage.react("wrong", prompt(lang, "tryAgain"));
      setMisses((m) => m + 1);
      return;
    }
    playSfx("tap");
    setPicked((list) => [...list, letter]);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <p className="text-center font-display text-2xl leading-tight sm:text-3xl">{prompt(lang, "orderPrompt")}</p>

      <div className="flex flex-wrap justify-center gap-3 rounded-[2rem] bg-card px-6 py-5 shadow-card">
        {round.seq.map((ch, i) => (
          <span
            key={i}
            className={`flex h-16 w-16 items-center justify-center rounded-[1.25rem] font-display text-3xl ${
              i < picked.length ? "bg-zeno-green text-white" : "bg-secondary/60 text-muted-foreground"
            }`}
          >
            {i < picked.length ? picked[i] : i + 1}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {round.shuffled.map((letter) => (
          <motion.button
            key={letter}
            whileTap={{ scale: 0.94 }}
            onClick={() => tap(letter)}
            className={`flex h-20 w-20 items-center justify-center rounded-[1.5rem] font-display text-4xl shadow-card ${
              picked.includes(letter) ? "bg-secondary/40 text-muted-foreground opacity-50" : "bg-card"
            }`}
          >
            {letter}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
