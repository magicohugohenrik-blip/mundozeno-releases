import { useRef, useState } from "react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { actionText, type ActionGame } from "@/lib/arcade/action";
import { themeEmojis, themeNames } from "@/lib/arcade/content";
import { ArenaFrame, nextId, randBetween, useCountdown, useRafLoop } from "@/components/games/action/arena";
import { localFraction } from "@/lib/pointer";

interface Item {
  id: number;
  x: number;
  y: number;
  speed: number;
  emoji: string;
  good: boolean;
}

/** Chuva de figuras: arraste a cesta para pegar as certas. */
export function CatchGame({ game, level, onComplete }: { game: ActionGame; level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const bank = themeEmojis[game.theme];
  const seconds = 40;
  const [items, setItems] = useState<Item[]>([]);
  const [basket, setBasket] = useState(50);
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const missRef = useRef(0);
  const hitsRef = useRef(0);
  const spawnRef = useRef(0);
  const basketRef = useRef(50);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const finish = () => {
    setRunning(false);
    playSfx("win");
    stage.react("done");
    const score = Math.max(10, hitsRef.current * 10 - missRef.current * 3);
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);
  const fall = level >= 3 ? 42 : level === 2 ? 32 : 24;
  const spawnEvery = level >= 3 ? 0.7 : level === 2 ? 0.95 : 1.2;

  const listRef = useRef<Item[]>([]);

  useRafLoop(running, (dt) => {
    spawnRef.current += dt;
    const next: Item[] = [];
    for (const item of listRef.current) {
      const y = item.y + item.speed * dt;
      if (y >= 80 && y <= 98 && Math.abs(item.x - basketRef.current) < 12) {
        if (item.good) {
          playSfx("hit");
          tracker.correct({ emoji: item.emoji });
          stage.react("correct");
          hitsRef.current += 1;
          setHits(hitsRef.current);
        } else {
          playSfx("miss");
          tracker.wrong({ emoji: item.emoji });
          stage.react("wrong");
          missRef.current += 1;
        }
        continue;
      }
      if (y > 104) {
        if (item.good) {
          tracker.wrong({ missed: item.emoji });
          missRef.current += 1;
        }
        continue;
      }
      next.push({ ...item, y });
    }
    if (spawnRef.current >= spawnEvery) {
      spawnRef.current = 0;
      const good = Math.random() < 0.72;
      next.push({
        id: nextId(),
        x: randBetween(8, 92),
        y: -6,
        speed: randBetween(fall * 0.85, fall * 1.2),
        emoji: good ? bank[Math.floor(Math.random() * bank.length)]! : "🪨",
        good,
      });
    }
    listRef.current = next;
    setItems(next);
  });


  const move = (clientX: number, clientY: number) => {
    const area = areaRef.current;
    if (!area || area.offsetWidth === 0) return;
    const pct = Math.min(92, Math.max(8, localFraction(area, clientX, clientY).x * 100));
    basketRef.current = pct;
    setBasket(pct);
  };

  const prompt = actionText(lang, "catchPrompt", { theme: themeNames[game.theme][lang] ?? themeNames[game.theme].pt });

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(prompt)}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      <div
        ref={areaRef}
        className="absolute inset-0 touch-none"
        onPointerDown={(e) => move(e.clientX, e.clientY)}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === "touch") move(e.clientX, e.clientY);
        }}
      >
        {items.map((item) => (
          <span
            key={item.id}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            className="absolute -translate-x-1/2 text-4xl sm:text-5xl"
          >
            {item.emoji}
          </span>
        ))}
        <span
          style={{ left: `${basket}%` }}
          className="absolute bottom-2 flex h-20 w-24 -translate-x-1/2 items-center justify-center rounded-b-[1.5rem] rounded-t-lg bg-zeno-orange/30 text-5xl shadow-card"
        >
          🧺
        </span>
      </div>
    </ArenaFrame>
  );
}
