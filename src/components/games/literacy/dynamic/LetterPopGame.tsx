import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { alphabet, vowels } from "@/lib/literacy/content";
import { dynamicText, type LiteracyVariant } from "@/lib/literacy/dynamic";
import { ArenaFrame, nextId, randBetween, useCountdown, useRafLoop } from "@/components/games/action/arena";

interface Bubble {
  id: number;
  x: number;
  y: number;
  speed: number;
  letter: string;
  good: boolean;
}

function pickLetter(): string {
  return alphabet[Math.floor(Math.random() * alphabet.length)]!;
}

/** Bolhas com letras sobem: estourar só a letra pedida (ou as vogais). */
export function LetterPopGame({
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
  const seconds = 40;
  const vowelMode = variant === "vowel";

  const [target, setTarget] = useState(() => (vowelMode ? "" : pickLetter()));
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const targetRef = useRef(target);
  const listRef = useRef<Bubble[]>([]);
  const hitsRef = useRef(0);
  const missRef = useRef(0);
  const spawnRef = useRef(0);

  const finish = () => {
    setRunning(false);
    playSfx("win");
    stage.react("done");
    const score = Math.max(10, hitsRef.current * 10 - missRef.current * 4);
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);
  const spawnEvery = level >= 3 ? 0.55 : level === 2 ? 0.75 : 1;
  const riseSpeed = level >= 3 ? 26 : level === 2 ? 20 : 15;

  const isGood = (letter: string) => (vowelMode ? vowels.includes(letter) : letter === targetRef.current);

  useRafLoop(running, (dt) => {
    spawnRef.current += dt;
    const next = listRef.current.map((b) => ({ ...b, y: b.y - b.speed * dt })).filter((b) => b.y > -18);
    if (spawnRef.current >= spawnEvery) {
      spawnRef.current = 0;
      const good = Math.random() < 0.5;
      const letter = good
        ? vowelMode
          ? vowels[Math.floor(Math.random() * vowels.length)]!
          : targetRef.current
        : (() => {
            const pool = vowelMode ? alphabet.filter((l) => !vowels.includes(l)) : alphabet.filter((l) => l !== targetRef.current);
            return pool[Math.floor(Math.random() * pool.length)]!;
          })();
      next.push({
        id: nextId(),
        x: randBetween(8, 88),
        y: 104,
        speed: randBetween(riseSpeed * 0.8, riseSpeed * 1.3),
        letter,
        good: isGood(letter),
      });
    }
    listRef.current = next;
    setBubbles(next);
  });

  const pop = (bubble: Bubble) => {
    if (!running) return;
    listRef.current = listRef.current.filter((b) => b.id !== bubble.id);
    setBubbles(listRef.current);
    if (bubble.good) {
      playSfx("hit");
      tracker.correct({ letter: bubble.letter });
      stage.react("correct");
      hitsRef.current += 1;
      setHits(hitsRef.current);
      if (!vowelMode && hitsRef.current % 4 === 0) {
        let fresh = pickLetter();
        while (fresh === targetRef.current) fresh = pickLetter();
        targetRef.current = fresh;
        setTarget(fresh);
        listRef.current = listRef.current.map((b) => ({ ...b, good: b.letter === fresh }));
      }
    } else {
      playSfx("miss");
      tracker.wrong({ letter: bubble.letter });
      stage.react("wrong");
      missRef.current += 1;
    }
  };

  const prompt = vowelMode ? dynamicText(lang, "popVowel") : dynamicText(lang, "popLetter", { letter: target });

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(prompt)}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      {!vowelMode ? (
        <span className="absolute top-3 right-3 z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-zeno-blue/25 font-display text-4xl shadow-card">
          {target}
        </span>
      ) : null}
      {bubbles.map((b) => (
        <motion.button
          key={b.id}
          onPointerDown={() => pop(b)}
          whileTap={{ scale: 0.85 }}
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
          className="absolute flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-zeno-blue/20 font-display text-4xl shadow-card ring-4 ring-white/50 sm:h-24 sm:w-24 sm:text-5xl"
        >
          {b.letter}
        </motion.button>
      ))}
    </ArenaFrame>
  );
}
