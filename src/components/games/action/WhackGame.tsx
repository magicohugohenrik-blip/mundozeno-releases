import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { actionText, type ActionGame } from "@/lib/arcade/action";
import { themeEmojis, themeNames } from "@/lib/arcade/content";
import { ArenaFrame, useCountdown } from "@/components/games/action/arena";

const EXPLOSION_PARTICLES = ["bg-zeno-orange", "bg-destructive", "bg-zeno-pink", "bg-zeno-green"];

/** Toca-toupeira: figuras aparecem por instantes; a bomba não pode ser tocada. */
export function WhackGame({ game, level, onComplete }: { game: ActionGame; level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const bank = themeEmojis[game.theme];
  const seconds = 40;
  const holes = level >= 3 ? 12 : level === 2 ? 10 : 8;
  const columns = level >= 2 ? 5 : 4;
  const showFor = level >= 3 ? 750 : level === 2 ? 950 : 1200;
  const gap = level >= 3 ? 450 : level === 2 ? 600 : 800;

  const [active, setActive] = useState<{ hole: number; emoji: string; bomb: boolean } | null>(null);
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const [boom, setBoom] = useState<number | null>(null);
  const missRef = useRef(0);
  const hitsRef = useRef(0);
  const boomTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const finish = () => {
    setRunning(false);
    playSfx("win");
    stage.react("done");
    const score = Math.max(10, hitsRef.current * 10 - missRef.current * 4);
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);

  useEffect(() => {
    if (!running) return;
    let show: ReturnType<typeof setTimeout>;
    let hide: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const bomb = Math.random() < (level >= 3 ? 0.3 : 0.2);
      const emoji = bomb ? "💣" : bank[Math.floor(Math.random() * bank.length)]!;
      setActive({ hole: Math.floor(Math.random() * holes), emoji, bomb });
      tracker.mark();
      hide = setTimeout(() => {
        setActive(null);
        show = setTimeout(cycle, gap);
      }, showFor);
    };
    show = setTimeout(cycle, 500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      if (boomTimer.current) clearTimeout(boomTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const triggerBoom = (hole: number) => {
    if (boomTimer.current) clearTimeout(boomTimer.current);
    setBoom(hole);
    boomTimer.current = setTimeout(() => setBoom(null), 700);
  };

  const tap = (hole: number) => {
    if (!running || !active || active.hole !== hole) return;
    if (active.bomb) {
      playSfx("miss");
      tracker.wrong({ bomb: true });
      stage.react("wrong");
      missRef.current += 1;
      triggerBoom(hole);
    } else {
      playSfx("hit");
      tracker.correct({ emoji: active.emoji });
      stage.react("correct");
      hitsRef.current += 1;
      setHits(hitsRef.current);
    }
    setActive(null);
  };

  const prompt = actionText(lang, "whackPrompt", { theme: themeNames[game.theme][lang] ?? themeNames[game.theme].pt });
  const gridClass = columns === 5 ? (holes === 12 ? "grid-cols-5 grid-rows-3" : "grid-cols-5 grid-rows-2") : "grid-cols-4 grid-rows-2";

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(prompt)}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      <div className={`grid h-full w-full gap-3 p-4 sm:p-5 ${gridClass}`}>
        {Array.from({ length: holes }, (_, i) => (
          <button
            key={i}
            onPointerDown={() => tap(i)}
            className="relative flex min-h-24 items-end justify-center overflow-hidden rounded-[1.5rem] border-4 border-card bg-zeno-orange/20 shadow-inner"
          >
            <span className="absolute inset-x-3 top-3 h-3 rounded-full bg-card/50" />
            <span className="absolute bottom-0 h-5 w-full rounded-t-full bg-zeno-orange/40" />
            {active?.hole === i ? (
              <motion.span
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="relative mb-2 text-5xl sm:text-6xl"
              >
                {active.emoji}
              </motion.span>
            ) : null}
            {boom === i ? (
              <motion.div
                key={`boom-${i}-${missRef.current}`}
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.75, ease: "easeOut" }}
              >
                <motion.span
                  className="absolute h-16 w-16 rounded-full bg-destructive/80 shadow-toy ring-8 ring-zeno-orange/70"
                  initial={{ scale: 0.2 }}
                  animate={{ scale: 2.3 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
                <motion.span
                  className="absolute h-24 w-24 rounded-full border-8 border-zeno-orange"
                  initial={{ scale: 0.1, opacity: 1 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
                <motion.span
                  className="relative z-10 h-20 w-20 rounded-[35%] bg-zeno-orange shadow-toy ring-8 ring-destructive/40 sm:h-24 sm:w-24"
                  initial={{ scale: 0.25, rotate: -24 }}
                  animate={{ scale: 1.15, rotate: 18 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <span className="absolute inset-2 rotate-45 rounded-[35%] bg-destructive/80" />
                  <span className="absolute inset-5 rounded-full bg-card/80" />
                </motion.span>
                {Array.from({ length: 12 }).map((_, p) => {
                  const angle = (p / 12) * Math.PI * 2;
                  const color = EXPLOSION_PARTICLES[p % EXPLOSION_PARTICLES.length]!;
                  return (
                    <motion.span
                      key={p}
                      className={`absolute h-4 w-4 rounded-full shadow-card ${color}`}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos(angle) * 110,
                        y: Math.sin(angle) * 110,
                        opacity: 0,
                        scale: 0.15,
                      }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  );
                })}
              </motion.div>
            ) : null}
          </button>
        ))}
      </div>
    </ArenaFrame>
  );
}
