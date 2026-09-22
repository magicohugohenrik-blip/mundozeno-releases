import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { actionText, type ActionGame } from "@/lib/arcade/action";
import { themeEmojis } from "@/lib/arcade/content";
import { ArenaFrame, randBetween, useCountdown, useRafLoop } from "@/components/games/action/arena";

/** Perseguição: o alvo desliza pelo palco e precisa ser tocado. */
export function ChaseGame({ game, level, onComplete }: { game: ActionGame; level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const bank = themeEmojis[game.theme];
  const target = useMemo(() => bank[Math.floor(Math.random() * bank.length)]!, [bank]);
  const seconds = 40;
  const speed = level >= 3 ? 55 : level === 2 ? 40 : 28;
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const dir = useRef({ x: randBetween(-1, 1), y: randBetween(-1, 1) });
  const hitsRef = useRef(0);
  const missRef = useRef(0);

  const finish = () => {
    setRunning(false);
    playSfx("win");
    stage.react("done");
    const score = Math.max(10, hitsRef.current * 10 - missRef.current * 2);
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);

  const posRef = useRef({ x: 50, y: 50 });

  useRafLoop(running, (dt) => {
    let { x, y } = posRef.current;
    x += dir.current.x * speed * dt;
    y += dir.current.y * speed * dt;
    if (x < 8 || x > 92) {
      dir.current.x *= -1;
      x = Math.min(92, Math.max(8, x));
    }
    if (y < 12 || y > 88) {
      dir.current.y *= -1;
      y = Math.min(88, Math.max(12, y));
    }
    posRef.current = { x, y };
    setPos(posRef.current);
  });


  const jump = () => {
    dir.current = { x: randBetween(-1, 1) || 0.6, y: randBetween(-1, 1) || 0.6 };
    posRef.current = { x: randBetween(12, 88), y: randBetween(16, 84) };
    setPos(posRef.current);
  };

  const catchIt = () => {
    if (!running) return;
    playSfx("hit");
    tracker.correct({ emoji: target });
    stage.react("correct");
    hitsRef.current += 1;
    setHits(hitsRef.current);
    jump();
  };

  const missIt = () => {
    if (!running) return;
    tracker.wrong({ missed: true });
    missRef.current += 1;
  };

  const prompt = actionText(lang, "chasePrompt", { item: target });

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(prompt)}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      <div className="absolute inset-0 touch-none" onPointerDown={missIt}>
        <motion.button
          onPointerDown={(e) => {
            e.stopPropagation();
            catchIt();
          }}
          whileTap={{ scale: 0.85 }}
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          className="absolute flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zeno-pink/25 text-5xl shadow-card ring-4 ring-white/60"
        >
          {target}
        </motion.button>
      </div>
    </ArenaFrame>
  );
}
