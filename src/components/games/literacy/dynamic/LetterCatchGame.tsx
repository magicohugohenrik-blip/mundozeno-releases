import { useRef, useState } from "react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { alphabet, sample, wordsFor, type WordItem } from "@/lib/literacy/content";
import { dynamicText, type LiteracyVariant } from "@/lib/literacy/dynamic";
import { ArenaFrame, nextId, randBetween, useCountdown, useRafLoop } from "@/components/games/action/arena";
import { localFraction } from "@/lib/pointer";

interface Falling {
  id: number;
  x: number;
  y: number;
  speed: number;
  letter: string;
}

/** Chuva de letras: arraste a cesta e pegue a letra inicial/final da palavra. */
export function LetterCatchGame({
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
  const last = variant === "last";
  const seconds = 45;

  const targetOf = (item: WordItem) => (last ? item.word[item.word.length - 1]! : item.word[0]!);

  const [word, setWord] = useState<WordItem>(() => sample(bank, 1)[0]!);
  const [items, setItems] = useState<Falling[]>([]);
  const [basket, setBasket] = useState(50);
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const wordRef = useRef(word);
  const listRef = useRef<Falling[]>([]);
  const hitsRef = useRef(0);
  const missRef = useRef(0);
  const spawnRef = useRef(0);
  const basketRef = useRef(50);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const finish = () => {
    setRunning(false);
    playSfx("win");
    stage.react("done");
    const score = Math.max(10, hitsRef.current * 12 - missRef.current * 4);
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);
  const fall = level >= 3 ? 40 : level === 2 ? 30 : 22;
  const spawnEvery = level >= 3 ? 0.7 : level === 2 ? 0.95 : 1.2;

  const nextWord = () => {
    let fresh = sample(bank, 1)[0]!;
    let guard = 0;
    while (fresh.word === wordRef.current.word && guard++ < 10) fresh = sample(bank, 1)[0]!;
    wordRef.current = fresh;
    setWord(fresh);
  };

  useRafLoop(running, (dt) => {
    spawnRef.current += dt;
    const target = targetOf(wordRef.current);
    const next: Falling[] = [];
    for (const item of listRef.current) {
      const y = item.y + item.speed * dt;
      if (y >= 80 && y <= 98 && Math.abs(item.x - basketRef.current) < 12) {
        if (item.letter === target) {
          playSfx("hit");
          tracker.correct({ letter: item.letter, word: wordRef.current.word });
          stage.react("correct");
          hitsRef.current += 1;
          setHits(hitsRef.current);
          nextWord();
        } else {
          playSfx("miss");
          tracker.wrong({ letter: item.letter, word: wordRef.current.word });
          stage.react("wrong");
          missRef.current += 1;
        }
        continue;
      }
      if (y > 104) continue;
      next.push({ ...item, y });
    }
    if (spawnRef.current >= spawnEvery) {
      spawnRef.current = 0;
      const good = Math.random() < 0.4;
      const pool = alphabet.filter((l) => l !== target);
      next.push({
        id: nextId(),
        x: randBetween(8, 92),
        y: -6,
        speed: randBetween(fall * 0.85, fall * 1.2),
        letter: good ? target : pool[Math.floor(Math.random() * pool.length)]!,
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

  const prompt = dynamicText(lang, last ? "catchLast" : "catchFirst");
  const masked = last ? `${word.word.slice(0, -1)} _` : `_ ${word.word.slice(1)}`;

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(`${prompt} ${word.word}`)}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-card px-5 py-2 shadow-card">
        <span className="text-3xl" aria-hidden>
          {word.emoji}
        </span>
        <span className="font-display text-2xl tracking-[0.2em] sm:text-3xl">{masked}</span>
      </div>
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
            className="absolute flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-zeno-green/25 font-display text-3xl shadow-card sm:h-16 sm:w-16 sm:text-4xl"
          >
            {item.letter}
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
