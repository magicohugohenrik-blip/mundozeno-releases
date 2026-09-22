import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { alphabet, sample, wordsFor, type WordItem } from "@/lib/literacy/content";
import { dynamicText, type LiteracyVariant } from "@/lib/literacy/dynamic";
import { ArenaFrame, useCountdown } from "@/components/games/action/arena";

/** Toca-letras: letras aparecem por instantes; tocar só na letra pedida. */
export function LetterWhackGame({
  variant,
  level,
  onComplete,
}: {
  variant: LiteracyVariant;
  level: number;
  onComplete: GameCompleteFn;
}) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const bank = wordsFor(lang);
  const wordMode = variant === "word";
  const seconds = 40;
  const holes = level >= 3 ? 12 : level === 2 ? 10 : 8;
  const columns = level >= 2 ? 5 : 4;
  const showFor = level >= 3 ? 850 : level === 2 ? 1050 : 1300;
  const gap = level >= 3 ? 400 : level === 2 ? 550 : 750;

  const [word, setWord] = useState<WordItem>(() => sample(bank, 1)[0]!);
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState(() => alphabet[Math.floor(Math.random() * alphabet.length)]!);
  const [active, setActive] = useState<{ hole: number; letter: string } | null>(null);
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const wordRef = useRef(word);
  const stepRef = useRef(0);
  const targetRef = useRef(target);
  const hitsRef = useRef(0);
  const missRef = useRef(0);
  const runRef = useRef(true);

  const wanted = () => (wordMode ? wordRef.current.word[stepRef.current]! : targetRef.current);

  const finish = () => {
    runRef.current = false;
    setRunning(false);
    playSfx("win");
    stage.react("done");
    const score = Math.max(10, hitsRef.current * 10 - missRef.current * 4);
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    let gapTimer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      if (!runRef.current) return;
      const good = Math.random() < 0.45;
      const need = wanted();
      const pool = alphabet.filter((l) => l !== need);
      setActive({
        hole: Math.floor(Math.random() * holes),
        letter: good ? need : pool[Math.floor(Math.random() * pool.length)]!,
      });
      showTimer = setTimeout(() => {
        setActive(null);
        gapTimer = setTimeout(cycle, gap);
      }, showFor);
    };
    cycle();
    return () => {
      clearTimeout(showTimer);
      clearTimeout(gapTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holes, showFor, gap]);

  const advanceWord = () => {
    const next = stepRef.current + 1;
    if (next >= wordRef.current.word.length) {
      let fresh = sample(bank, 1)[0]!;
      let guard = 0;
      while (fresh.word === wordRef.current.word && guard++ < 10) fresh = sample(bank, 1)[0]!;
      wordRef.current = fresh;
      setWord(fresh);
      stepRef.current = 0;
      setStep(0);
    } else {
      stepRef.current = next;
      setStep(next);
    }
  };

  const tap = (hole: number) => {
    if (!running || !active || active.hole !== hole) return;
    const need = wanted();
    setActive(null);
    if (active.letter === need) {
      playSfx("hit");
      tracker.correct({ letter: active.letter });
      stage.react("correct");
      hitsRef.current += 1;
      setHits(hitsRef.current);
      if (wordMode) advanceWord();
      else {
        let fresh = alphabet[Math.floor(Math.random() * alphabet.length)]!;
        while (fresh === targetRef.current) fresh = alphabet[Math.floor(Math.random() * alphabet.length)]!;
        targetRef.current = fresh;
        setTarget(fresh);
      }
    } else {
      playSfx("miss");
      tracker.wrong({ letter: active.letter });
      stage.react("wrong");
      missRef.current += 1;
    }
  };

  const prompt = wordMode
    ? dynamicText(lang, "whackWord", { word: word.word })
    : dynamicText(lang, "whackLetter", { letter: target });
  const need = wordMode ? word.word[step]! : target;

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(prompt)}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      <span className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full bg-card px-4 py-2 font-display text-2xl shadow-card">
        {wordMode ? (
          <>
            <span aria-hidden>{word.emoji}</span>
            <span className="tracking-[0.2em]">
              {word.word.split("").map((letter, i) => (
                <span key={`${letter}-${i}`} className={i === step ? "text-zeno-green" : i < step ? "opacity-40" : ""}>
                  {letter}
                </span>
              ))}
            </span>
          </>
        ) : (
          <span>{need}</span>
        )}
      </span>
      <div
        className={`grid h-full w-full gap-3 p-4 pt-20 sm:p-5 sm:pt-20 ${columns === 5 ? "grid-cols-5" : "grid-cols-4"}`}
      >
        {Array.from({ length: holes }, (_, i) => (
          <button
            key={i}
            onPointerDown={() => tap(i)}
            className="relative flex min-h-24 items-center justify-center overflow-hidden rounded-[1.5rem] border-4 border-card bg-zeno-purple/15 shadow-inner"
          >
            {active?.hole === i ? (
              <motion.span
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-display text-5xl"
              >
                {active.letter}
              </motion.span>
            ) : null}
          </button>
        ))}
      </div>
    </ArenaFrame>
  );
}
