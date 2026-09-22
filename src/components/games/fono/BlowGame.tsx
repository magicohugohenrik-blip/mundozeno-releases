import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { fonoPrompt } from "@/lib/fono/content";

/**
 * Jogo de sopro: usa o microfone (getUserMedia + AnalyserNode) para medir a
 * intensidade do sopro. Nada é gravado nem enviado. Sem microfone ou sem
 * permissão, a criança avança tocando na tela.
 */
export function BlowGame({
  slug,
  level,
  onComplete,
}: {
  slug: string;
  level: number;
  onComplete: GameCompleteFn;
}) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const candles = slug === "fono-sopro-vela";
  const targets = level >= 3 ? 6 : level === 2 ? 4 : 3;

  const [done, setDone] = useState(0);
  const [power, setPower] = useState(0);
  const [mic, setMic] = useState<"idle" | "on" | "off">("idle");
  const finished = useRef(false);
  const powerRef = useRef(0);

  useEffect(() => {
    stage.setProgress(done, targets);
    tracker.mark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  useEffect(() => {
    const id = setTimeout(() => speak(fonoPrompt(lang, "blowNow")), 300);
    return () => clearTimeout(id);
  }, [lang]);

  // Microfone
  useEffect(() => {
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setMic("off");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new Ctor();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        setMic("on");
        const loop = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i]! - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          const value = Math.min(100, Math.max(0, (rms - 0.02) * 600));
          powerRef.current = powerRef.current * 0.7 + value * 0.3;
          setPower(powerRef.current);
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        setMic("off");
      }
    }
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, []);

  // Contabiliza um alvo quando o sopro passa do limite.
  useEffect(() => {
    if (finished.current || power < 55) return;
    hit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power]);

  function hit() {
    if (finished.current) return;
    playSfx("hit");
    tracker.correct({ target: done });
    powerRef.current = 0;
    setPower(0);
    const next = done + 1;
    setDone(next);
    if (next >= targets) {
      finished.current = true;
      stage.react("done", fonoPrompt(lang, "great"));
      setTimeout(() => onComplete(100, tracker.getEvents()), 700);
    } else {
      stage.react("correct", fonoPrompt(lang, "great"));
    }
  }

  const height = Math.min(100, power);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-center font-display text-2xl leading-tight sm:text-3xl">
        {mic === "off" ? fonoPrompt(lang, "blowTouch") : fonoPrompt(lang, "blowNow")}
      </p>

      <div className="relative h-64 w-full max-w-xl overflow-hidden rounded-[2rem] bg-card shadow-card sm:h-80">
        {candles ? (
          <div className="absolute inset-x-0 bottom-6 flex items-end justify-center gap-4">
            {Array.from({ length: targets }, (_, i) => (
              <span key={i} className={`text-6xl transition ${i < done ? "opacity-25 grayscale" : ""}`}>
                {i < done ? "🕯️" : "🔥"}
              </span>
            ))}
          </div>
        ) : (
          <motion.span
            className="absolute left-1/2 text-7xl sm:text-8xl"
            style={{ x: "-50%" }}
            animate={{ bottom: `${10 + height * 0.7}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            🎈
          </motion.span>
        )}

        <div className="absolute inset-x-6 bottom-2 h-3 overflow-hidden rounded-full bg-secondary/50">
          <div className="h-full rounded-full bg-zeno-green transition-[width]" style={{ width: `${height}%` }} />
        </div>
      </div>

      <p className="text-center text-base text-muted-foreground">
        {done} / {targets}
        {mic === "off" ? ` · ${fonoPrompt(lang, "micDenied")}` : ""}
      </p>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={hit}
        className="min-h-[4rem] rounded-full bg-zeno-blue px-10 font-display text-2xl text-white shadow-toy"
      >
        💨 {fonoPrompt(lang, "blowTouch")}
      </motion.button>
    </div>
  );
}
