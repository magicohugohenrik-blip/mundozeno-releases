import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { fonoPrompt, fonoSample, fonoWordsFor, praxias } from "@/lib/fono/content";

interface Step {
  emoji: string;
  text: string;
  seconds: number;
}

/**
 * Motor de imitação: o Zeno mostra uma praxia (ou fala uma palavra),
 * a criança executa e confirma. Sem julgamento de acerto/erro — o registro
 * é de execução, como num atendimento presencial.
 */
export function PraxiaGame({
  slug,
  level,
  onComplete,
}: {
  slug: string;
  level: number;
  onComplete: GameCompleteFn;
}) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();

  const steps = useMemo<Step[]>(() => {
    const total = level >= 3 ? 8 : level === 2 ? 6 : 4;
    if (slug === "fono-repete-comigo") {
      const seconds = level >= 3 ? 3 : 4;
      return fonoSample(fonoWordsFor(lang), total).map((word) => ({
        emoji: word.emoji,
        text: word.word,
        seconds,
      }));
    }
    return fonoSample(praxias, total).map((p) => ({
      emoji: p.emoji,
      text: p.label[lang] ?? p.label.pt,
      seconds: level >= 3 ? 8 : level === 2 ? 6 : 5,
    }));
  }, [slug, level, lang]);

  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(steps[0]?.seconds ?? 5);
  const step = steps[index];

  useEffect(() => {
    if (!step) return;
    stage.setProgress(index, steps.length);
    tracker.mark();
    setLeft(step.seconds);
    const say = slug === "fono-repete-comigo" ? `${fonoPrompt(lang, "repeatAfter")}: ${step.text}` : step.text;
    const id = setTimeout(() => speak(say), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, steps.length]);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left, index]);

  if (!step) return null;

  const next = () => {
    playSfx("hit");
    tracker.correct({ step: index, item: step.text });
    stage.react("correct", fonoPrompt(lang, "great"));
    if (index + 1 >= steps.length) {
      stage.react("done", fonoPrompt(lang, "great"));
      const score = Math.max(10, Math.round((steps.length / steps.length) * 100));
      setTimeout(() => onComplete(score, tracker.getEvents()), 700);
      return;
    }
    setTimeout(() => setIndex((v) => v + 1), 500);
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-center font-display text-2xl leading-tight sm:text-3xl">
        {slug === "fono-repete-comigo" ? fonoPrompt(lang, "repeatAfter") : step.text}
      </p>

      <motion.div
        key={index}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex min-h-[12rem] w-full max-w-xl flex-col items-center justify-center gap-3 rounded-[2rem] bg-card px-6 py-6 shadow-card"
      >
        <span className="text-8xl sm:text-9xl">{step.emoji}</span>
        {slug === "fono-repete-comigo" ? (
          <span className="font-display text-4xl tracking-[0.15em] sm:text-5xl">{step.text}</span>
        ) : null}
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => speak(step.text)}
          className="rounded-full bg-card px-5 py-3 font-display text-base shadow-card active:scale-95"
        >
          🔊 {fonoPrompt(lang, "listen")}
        </button>
        <span className="rounded-full bg-secondary/60 px-5 py-3 font-display text-base">
          ⏱️ {fonoPrompt(lang, "holdPose", { seconds: String(Math.max(0, left)) })}
        </span>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={next}
        className="min-h-[4rem] rounded-full bg-zeno-green px-10 font-display text-2xl text-white shadow-toy"
      >
        ✅ {fonoPrompt(lang, "nextPose")}
      </motion.button>
    </div>
  );
}
