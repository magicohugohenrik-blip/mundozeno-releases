import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n, type Lang } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { prompt } from "@/lib/literacy/content";
import { buildRounds, type ChoiceRound } from "@/lib/literacy/rounds";
import { HandSign } from "@/lib/libras/HandSign";
import { signFor } from "@/lib/libras/signs";

/**
 * Motor de atividades de escolha (letra, som, imagem, palavra).
 * Botões grandes para mesa touchscreen, feedback acolhedor e telemetria.
 */
export function ChoiceActivity({
  slug,
  level,
  onComplete,
  builder,
}: {
  slug: string;
  level: number;
  onComplete: GameCompleteFn;
  /** Gerador de rodadas alternativo (jogos gerais usam o motor do arcade). */
  builder?: (slug: string, level: number, lang: Lang) => ChoiceRound[];
}) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const build = builder ?? buildRounds;
  const rounds = useMemo<ChoiceRound[]>(() => build(slug, level, lang), [slug, level, lang, builder]);
  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const round = rounds[index];

  useEffect(() => {
    if (!round) return;
    stage.setProgress(index, rounds.length);
    tracker.mark();
    const id = setTimeout(() => speak(round.speak ?? round.prompt), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, rounds.length]);

  if (!round) return null;

  const finish = (finalHits: number, finalMisses: number) => {
    const base = rounds.length > 0 ? (finalHits / rounds.length) * 100 : 0;
    const score = Math.max(10, Math.round(base - finalMisses * 5));
    stage.react("done", prompt(lang, "great"));
    setTimeout(() => onComplete(score, tracker.getEvents()), 700);
  };

  const pick = (i: number) => {
    if (locked) return;
    const ok = i === round.correct;
    if (!ok) {
      playSfx("tap");
      tracker.wrong({ round: index, picked: round.options[i]?.label ?? round.options[i]?.emoji });
      stage.react("wrong", prompt(lang, "tryAgain"));
      setMisses((m) => m + 1);
      setWrong(i);
      setTimeout(() => setWrong(null), 600);
      return;
    }
    playSfx("hit");
    tracker.correct({ round: index });
    stage.react("correct", prompt(lang, "great"));
    setLocked(true);
    const nextHits = hits + 1;
    setHits(nextHits);
    setTimeout(() => {
      setLocked(false);
      if (index + 1 >= rounds.length) finish(nextHits, misses);
      else setIndex((v) => v + 1);
    }, 650);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <p className="text-center font-display text-2xl leading-tight sm:text-3xl">{round.prompt}</p>
        <button
          onClick={() => speak(round.speak ?? round.prompt)}
          className="rounded-full bg-card px-5 py-2 font-display text-base shadow-card active:scale-95"
        >
          🔊 {prompt(lang, "listen")}
        </button>
      </div>

      {round.showSign && signFor(round.showSign) ? (
        <div className="flex items-center justify-center rounded-[2rem] bg-card px-6 py-4 shadow-card">
          <HandSign spec={signFor(round.showSign)!} className="h-40 w-32 sm:h-52 sm:w-40" />
        </div>
      ) : null}

      {round.showEmoji || round.showText ? (
        <div className="flex min-h-[8rem] flex-col items-center justify-center gap-2 rounded-[2rem] bg-card px-6 py-5 shadow-card">
          {round.showEmoji ? <span className="text-7xl sm:text-8xl">{round.showEmoji}</span> : null}
          {round.showText ? (
            <span className="max-w-full break-words text-center font-display text-4xl leading-snug tracking-[0.2em] sm:text-5xl">{round.showText}</span>
          ) : null}
        </div>
      ) : null}

      <div
        className={`grid gap-4 ${round.options.length > 4 ? "grid-cols-3" : round.options.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}
      >
        {round.options.map((option, i) => (
          <motion.button
            key={`${index}-${i}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => pick(i)}
            className={`flex min-h-[6rem] items-center justify-center rounded-[1.75rem] bg-card px-3 py-5 shadow-card sm:min-h-[7.5rem] ${
              wrong === i ? "animate-shake ring-4 ring-zeno-orange/60" : ""
            }`}
          >
            {option.sign && signFor(option.sign) ? (
              <HandSign spec={signFor(option.sign)!} className="h-24 w-20 sm:h-28 sm:w-24" />
            ) : option.emoji ? (
              <span className="text-6xl sm:text-7xl">{option.emoji}</span>
            ) : (
              <span className="font-display text-4xl leading-none sm:text-5xl">{option.label}</span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
