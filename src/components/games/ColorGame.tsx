import { useEffect, useMemo, useState } from "react";
import type { GameResult } from "@/lib/zeno";

const COLORS = [
  { name: "azul", className: "bg-zeno-blue" },
  { name: "verde", className: "bg-zeno-green" },
  { name: "laranja", className: "bg-zeno-orange" },
  { name: "roxo", className: "bg-zeno-purple" },
  { name: "rosa", className: "bg-zeno-pink" },
];

export function ColorGame({ level, onFinish }: { level: number; onFinish: (r: GameResult) => void }) {
  const started = useMemo(() => Date.now(), []);
  const rounds = 4 + level * 2;
  const optionCount = Math.min(COLORS.length, 2 + level);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);

  const options = useMemo(
    () => [...COLORS].sort(() => Math.random() - 0.5).slice(0, optionCount),
    [round, optionCount],
  );
  const target = useMemo(() => options[Math.floor(Math.random() * options.length)]!, [options]);

  useEffect(() => {
    if (round >= rounds) {
      onFinish({
        score: hits * 10,
        hits,
        misses,
        durationSeconds: Math.round((Date.now() - started) / 1000),
      });
    }
  }, [round, rounds, hits, misses, onFinish, started]);

  function pick(name: string) {
    if (name === target.name) {
      setHits((h) => h + 1);
      setWrong(null);
      setRound((r) => r + 1);
    } else {
      setMisses((m) => m + 1);
      setWrong(name);
      setTimeout(() => setWrong(null), 500);
    }
  }

  if (round >= rounds) return null;

  return (
    <div className="w-full text-center">
      <p className="font-display text-2xl text-foreground sm:text-4xl">
        Toque na cor <span className="text-zeno-blue">{target.name}</span>
      </p>
      <p className="mt-2 text-muted-foreground">
        Rodada {round + 1} de {rounds}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
        {options.map((color) => (
          <button
            key={color.name}
            aria-label={color.name}
            onClick={() => pick(color.name)}
            className={`aspect-square rounded-[2rem] shadow-card transition-transform active:scale-95 ${color.className} ${
              wrong === color.name ? "opacity-50" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
