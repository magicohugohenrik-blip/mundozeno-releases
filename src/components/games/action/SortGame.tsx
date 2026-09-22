import { useMemo, useRef, useState } from "react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { actionText, type ActionGame } from "@/lib/arcade/action";
import { distractorEmojis, themeEmojis, themeNames, type ThemeId } from "@/lib/arcade/content";
import { ArenaFrame, nextId, randBetween, useCountdown, useRafLoop } from "@/components/games/action/arena";

interface Falling {
  id: number;
  x: number;
  y: number;
  speed: number;
  emoji: string;
  good: boolean;
}

function otherEmojis(theme: ThemeId): string[] {
  return distractorEmojis(theme);
}

/** Classificação com tempo: mande cada figura para a cesta certa antes de cair. */
export function SortGame({ game, level, onComplete }: { game: ActionGame; level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const bank = themeEmojis[game.theme];
  const others = useMemo(() => otherEmojis(game.theme), [game.theme]);
  const seconds = 45;
  const [items, setItems] = useState<Falling[]>([]);
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const hitsRef = useRef(0);
  const missRef = useRef(0);
  const spawnRef = useRef(0.8);

  const finish = () => {
    setRunning(false);
    playSfx("win");
    stage.react("done");
    const score = Math.max(10, hitsRef.current * 10 - missRef.current * 4);
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);
  const fall = level >= 3 ? 24 : level === 2 ? 18 : 13;
  const spawnEvery = level >= 3 ? 1.6 : level === 2 ? 2.1 : 2.6;

  const listRef = useRef<Falling[]>([]);

  useRafLoop(running, (dt) => {
    spawnRef.current += dt;
    const next = listRef.current
      .map((it) => ({ ...it, y: it.y + it.speed * dt }))
      .filter((it) => {
        if (it.y > 68) {
          tracker.wrong({ missed: it.emoji });
          missRef.current += 1;
          return false;
        }
        return true;
      });
    if (spawnRef.current >= spawnEvery && next.length < 3) {
      spawnRef.current = 0;
      const wantTheme = Math.random() < 0.5;
      const emoji = wantTheme
        ? bank[Math.floor(Math.random() * bank.length)]!
        : others[Math.floor(Math.random() * others.length)]!;
      next.push({
        id: nextId(),
        x: randBetween(20, 80),
        y: -6,
        speed: randBetween(fall * 0.9, fall * 1.15),
        emoji,
        // a verdade vem sempre do banco do tema, nunca do sorteio
        good: bank.includes(emoji),
      });
    }
    listRef.current = next;
    setItems(next);
  });

  const send = (toTheme: boolean) => {
    if (!running) return;
    const lowest = listRef.current.reduce<Falling | null>((acc, it) => (!acc || it.y > acc.y ? it : acc), null);
    if (!lowest) return;
    listRef.current = listRef.current.filter((it) => it.id !== lowest.id);
    setItems(listRef.current);
    if (lowest.good === toTheme) {
      playSfx("hit");
      tracker.correct({ emoji: lowest.emoji });
      stage.react("correct");
      hitsRef.current += 1;
      setHits(hitsRef.current);
    } else {
      playSfx("miss");
      tracker.wrong({ emoji: lowest.emoji });
      stage.react("wrong");
      missRef.current += 1;
    }
  };


  const prompt = actionText(lang, "sortPrompt");
  const themeLabel = themeNames[game.theme][lang] ?? themeNames[game.theme].pt;

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(`${prompt} ${themeLabel}`)}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      {items.map((it) => (
        <span
          key={it.id}
          style={{ left: `${it.x}%`, top: `${it.y}%` }}
          className="absolute -translate-x-1/2 text-5xl sm:text-6xl"
        >
          {it.emoji}
        </span>
      ))}
      <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-4">
        <button
          onPointerDown={() => send(true)}
          className="flex min-h-[5.5rem] flex-col items-center justify-center rounded-[1.5rem] bg-zeno-green/25 font-display text-lg shadow-card active:scale-95"
        >
          <span className="text-3xl">🧺</span>
          {themeLabel}
        </button>
        <button
          onPointerDown={() => send(false)}
          className="flex min-h-[5.5rem] flex-col items-center justify-center rounded-[1.5rem] bg-zeno-purple/25 font-display text-lg shadow-card active:scale-95"
        >
          <span className="text-3xl">📦</span>
          {actionText(lang, "sortOther")}
        </button>
      </div>
    </ArenaFrame>
  );
}
