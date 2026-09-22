import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { actionText, type ActionGame } from "@/lib/arcade/action";
import { themeEmojis } from "@/lib/arcade/content";
import { ArenaFrame, nextId, randBetween, useCountdown, useRafLoop } from "@/components/games/action/arena";

interface Bubble {
  id: number;
  x: number;
  y: number;
  speed: number;
  emoji: string;
  good: boolean;
  gone?: boolean;
}

/** Bolhas sobem pelo palco: estourar só as do alvo. */
export function PopGame({ game, level, onComplete }: { game: ActionGame; level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const bank = themeEmojis[game.theme];
  const target = useMemo(() => bank[Math.floor(Math.random() * bank.length)]!, [bank]);
  const seconds = 40;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const listRef = useRef<Bubble[]>([]);
  const hitsRef = useRef(0);
  const missRef = useRef(0);
  const spawnRef = useRef(0);

  const finish = () => {
    setRunning(false);
    playSfx("win");
    const score = Math.max(10, hitsRef.current * 10 - missRef.current * 4);
    stage.react("done");
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);

  const spawnEvery = level >= 3 ? 0.55 : level === 2 ? 0.75 : 1;
  const riseSpeed = level >= 3 ? 26 : level === 2 ? 20 : 15;

  useRafLoop(running, (dt) => {
    spawnRef.current += dt;
    const next = listRef.current
      .map((b) => ({ ...b, y: b.y - b.speed * dt }))
      .filter((b) => b.y > -18);
    if (spawnRef.current >= spawnEvery) {
      spawnRef.current = 0;
      const good = Math.random() < 0.55;
      const others = bank.filter((e) => e !== target);
      next.push({
        id: nextId(),
        x: randBetween(8, 88),
        y: 104,
        speed: randBetween(riseSpeed * 0.8, riseSpeed * 1.3),
        emoji: good ? target : others[Math.floor(Math.random() * others.length)]!,
        good,
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
      tracker.correct({ emoji: bubble.emoji });
      stage.react("correct");
      hitsRef.current += 1;
      setHits(hitsRef.current);
    } else {
      playSfx("miss");
      tracker.wrong({ emoji: bubble.emoji });
      stage.react("wrong");
      missRef.current += 1;
    }
  };


  const prompt = actionText(lang, "popPrompt", { item: target });

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(prompt)}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      {bubbles.map((b) => (
        <motion.button
          key={b.id}
          onPointerDown={() => pop(b)}
          whileTap={{ scale: 0.85 }}
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
          className="absolute flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-zeno-blue/20 text-4xl shadow-card ring-4 ring-white/50 sm:h-24 sm:w-24 sm:text-5xl"
        >
          {b.emoji}
        </motion.button>
      ))}
    </ArenaFrame>
  );
}
