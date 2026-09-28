import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Flame, Wind } from "lucide-react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { fonoPrompt } from "@/lib/fono/content";

/**
 * Jogo de sopro sem microfone (a mesa não tem): o Zeno conduz o ritmo
 * "puxa o ar → sopra" e a criança sopra de verdade enquanto arrasta o dedo
 * para cima (balão) ou por cima da velinha. O profissional acompanha o sopro.
 */
export function BlowGame({ slug, level, onComplete }: { slug: string; level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const candles = slug === "fono-sopro-vela";
  const targets = level >= 3 ? 6 : level === 2 ? 4 : 3;

  const [done, setDone] = useState(0);
  const [phase, setPhase] = useState<"inhale" | "blow">("inhale");
  const [power, setPower] = useState(0);
  const finished = useRef(false);
  const drag = useRef<{ y: number; x: number } | null>(null);

  useEffect(() => {
    stage.setProgress(done, targets);
    tracker.mark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Ritmo guiado: 2 s puxando o ar, depois é a vez de soprar.
  useEffect(() => {
    if (finished.current) return;
    setPhase("inhale");
    setPower(0);
    speak(fonoPrompt(lang, "micDenied"));
    const id = setTimeout(() => {
      setPhase("blow");
      speak(fonoPrompt(lang, "blowNow"));
    }, 2200);
    return () => clearTimeout(id);
  }, [done, lang]);

  function hit() {
    if (finished.current) return;
    playSfx("hit");
    tracker.correct({ target: done });
    const next = done + 1;
    setDone(next);
    if (next >= targets) {
      finished.current = true;
      stage.react("done", fonoPrompt(lang, "great"));
      setTimeout(() => onComplete(100, tracker.getEvents()), 700);
    } else stage.react("correct", fonoPrompt(lang, "great"));
  }

  function onMove(e: React.PointerEvent) {
    if (!drag.current || phase !== "blow") return;
    const dist = candles ? Math.abs(e.clientX - drag.current.x) : drag.current.y - e.clientY;
    const value = Math.min(100, Math.max(0, dist / 2.2));
    setPower(value);
    if (value >= 100) {
      drag.current = null;
      hit();
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-center font-display text-2xl leading-tight sm:text-3xl">
        {phase === "inhale" ? fonoPrompt(lang, "micDenied") : fonoPrompt(lang, "blowTouch")}
      </p>

      <div
        className="relative h-72 w-full max-w-xl touch-none select-none overflow-hidden rounded-[2rem] bg-card shadow-card sm:h-80"
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, x: e.clientX };
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={onMove}
        onPointerUp={() => {
          drag.current = null;
          if (power < 100) setPower(0);
        }}
      >
        <motion.span
          className="absolute left-1/2 top-4 h-16 w-16 -translate-x-1/2 rounded-full bg-zeno-blue/25"
          animate={{ scale: phase === "inhale" ? [1, 1.6] : [1.6, 1] }}
          transition={{ duration: phase === "inhale" ? 2.2 : 0.6 }}
        />
        {candles ? (
          <div className="absolute inset-x-0 bottom-8 flex items-end justify-center gap-4">
            {Array.from({ length: targets }, (_, i) => (
              <span key={i} className="flex flex-col items-center">
                <Flame
                  className={`h-10 w-10 text-zeno-orange transition ${i < done ? "opacity-0" : i === done ? "" : "opacity-60"}`}
                  style={i === done ? { transform: `scale(${1 - power / 150}) skewX(${power / 3}deg)` } : undefined}
                />
                <span className="h-20 w-5 rounded-t-md bg-zeno-pink" />
              </span>
            ))}
          </div>
        ) : (
          <motion.span
            className="absolute left-1/2 flex h-24 w-20 -translate-x-1/2 items-center justify-center rounded-[50%] bg-zeno-pink shadow-toy"
            animate={{ bottom: `${8 + power * 0.6}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
        )}
        <div className="absolute inset-x-6 bottom-2 h-3 overflow-hidden rounded-full bg-secondary/50">
          <div className="h-full rounded-full bg-zeno-green" style={{ width: `${power}%` }} />
        </div>
      </div>

      <p className="flex items-center gap-2 text-center text-base text-muted-foreground">
        <Wind className="h-5 w-5" /> {done} / {targets}
      </p>
    </div>
  );
}
