import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { fonoPrompt, soundBank } from "@/lib/fono/content";

/** Memória auditiva: o Zeno fala uma sequência de sons e a criança repete tocando. */
export function SoundMemoryGame({ level, onComplete }: { level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const bank = useMemo(() => (soundBank[lang] ?? soundBank.pt).slice(0, level >= 3 ? 6 : level === 2 ? 5 : 4), [lang, level]);
  const rounds = level >= 3 ? 5 : 4;
  const startLength = level >= 3 ? 3 : 2;

  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    stage.setProgress(round, rounds);
    tracker.mark();
    const next = Array.from({ length: startLength + round }, () => Math.floor(Math.random() * bank.length));
    setSequence(next);
    setStep(0);
    setPlaying(true);
    timers.current.forEach(clearTimeout);
    timers.current = next.map((idx, i) =>
      setTimeout(() => {
        setActive(idx);
        speak(bank[idx]?.name ?? "");
        playSfx("tap");
        setTimeout(() => setActive(null), 500);
        if (i === next.length - 1) setTimeout(() => setPlaying(false), 700);
      }, 600 + i * 1100),
    );
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, bank.length]);

  const pick = (idx: number) => {
    if (playing) return;
    if (sequence[step] !== idx) {
      playSfx("miss");
      tracker.wrong({ round, picked: bank[idx]?.name });
      stage.react("wrong", fonoPrompt(lang, "tryAgain"));
      setMisses((m) => m + 1);
      setStep(0);
      return;
    }
    playSfx("hit");
    setActive(idx);
    setTimeout(() => setActive(null), 250);
    const nextStep = step + 1;
    if (nextStep >= sequence.length) {
      tracker.correct({ round });
      stage.react("correct", fonoPrompt(lang, "great"));
      if (round + 1 >= rounds) {
        stage.react("done", fonoPrompt(lang, "great"));
        const score = Math.max(10, 100 - misses * 8);
        setTimeout(() => onComplete(score, tracker.getEvents()), 700);
        return;
      }
      setTimeout(() => setRound((r) => r + 1), 800);
      return;
    }
    setStep(nextStep);
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-center font-display text-2xl leading-tight sm:text-3xl">
        {playing ? fonoPrompt(lang, "listen") : fonoPrompt(lang, "followOrder")}
      </p>

      <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
        {bank.map((sound, i) => (
          <motion.button
            key={sound.emoji}
            whileTap={{ scale: 0.95 }}
            onClick={() => pick(i)}
            className={`flex min-h-[7rem] items-center justify-center rounded-[1.75rem] bg-card shadow-card transition ${
              active === i ? "ring-4 ring-zeno-green scale-105" : ""
            } ${playing ? "opacity-70" : ""}`}
          >
            <span className="text-6xl sm:text-7xl">{sound.emoji}</span>
          </motion.button>
        ))}
      </div>

      <p className="text-base text-muted-foreground">
        {step} / {sequence.length}
      </p>
    </div>
  );
}
