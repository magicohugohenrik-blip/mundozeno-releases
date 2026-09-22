import { useEffect, useRef, useState, type ReactNode } from "react";
import { actionText } from "@/lib/arcade/action";
import type { Lang } from "@/lib/i18n";

/** Contagem regressiva simples (segundos) para os jogos dinâmicos. */
export function useCountdown(seconds: number, active: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const ended = useRef(false);
  const end = useRef(onEnd);
  end.current = onEnd;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(id);
          if (!ended.current) {
            ended.current = true;
            end.current();
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  return left;
}

/** Loop de animação em ~60fps com delta em segundos. */
export function useRafLoop(active: boolean, step: (dt: number) => void) {
  const cb = useRef(step);
  cb.current = step;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cb.current(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

export function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

let seq = 0;
export function nextId(): number {
  seq += 1;
  return seq;
}

/** Moldura dos jogos dinâmicos: instrução, tempo e acertos + palco. */
export function ArenaFrame({
  lang,
  prompt,
  timeLeft,
  total,
  hits,
  children,
}: {
  lang: Lang;
  prompt: string;
  timeLeft: number;
  total: number;
  hits: number;
  children: ReactNode;
}) {
  const pct = total > 0 ? Math.max(0, (timeLeft / total) * 100) : 0;
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <p className="text-center font-display text-xl leading-tight sm:text-2xl">{prompt}</p>
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-full bg-card px-3 py-1 font-display text-base shadow-card">
          ⭐ {actionText(lang, "hits")}: {hits}
        </span>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-card shadow-card">
          <div
            className="h-full rounded-full bg-zeno-green transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 rounded-full bg-card px-3 py-1 font-display text-base shadow-card">
          ⏱️ {timeLeft}s
        </span>
      </div>
      <div className="relative min-h-[30rem] flex-1 overflow-hidden rounded-[2rem] bg-card/95 shadow-card select-none">
        {children}
      </div>
    </div>
  );
}
