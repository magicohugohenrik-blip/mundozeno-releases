import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";
import { framePoint } from "@/lib/pointer";

interface Props {
  onComplete: GameCompleteFn;
}

type ColorId = "orange" | "red" | "blue" | "green";

interface ColorDef {
  id: ColorId;
  labelKey: TKey;
  base: string; // tailwind/css color
  light: string;
  dark: string;
}

const COLORS: ColorDef[] = [
  { id: "orange", labelKey: "color.orange", base: "#F59E0B", light: "#FCD34D", dark: "#B45309" },
  { id: "red", labelKey: "color.red", base: "#EF4444", light: "#FCA5A5", dark: "#991B1B" },
  { id: "blue", labelKey: "color.blue", base: "#3B82F6", light: "#93C5FD", dark: "#1E40AF" },
  { id: "green", labelKey: "color.green", base: "#22C55E", light: "#86EFAC", dark: "#166534" },
];

const playDing = (ok: boolean) => {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    if (ok) {
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    } else {
      o.frequency.setValueAtTime(220, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.18);
    }
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {}
};

const Ring = ({ color, size = 80, hollow = false }: { color: ColorDef; size?: number; hollow?: boolean }) => {
  const uid = `ring-${color.id}-${hollow ? "h" : "s"}`;
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 100 55" className="block">
      <defs>
        <mask id={uid}>
          <rect width="100" height="55" fill="white" />
          {hollow && <ellipse cx="50" cy="25" rx="14" ry="7" fill="black" />}
        </mask>
      </defs>
      <g mask={`url(#${uid})`}>
        <ellipse cx="50" cy="30" rx="44" ry="22" fill={color.dark} />
        <ellipse cx="50" cy="27" rx="44" ry="22" fill={color.base} />
        <ellipse cx="50" cy="22" rx="30" ry="11" fill={color.light} opacity="0.7" />
      </g>
      {!hollow && (
        <>
          <ellipse cx="50" cy="27" rx="14" ry="7" fill="#fff" />
          <ellipse cx="50" cy="27" rx="11" ry="5" fill={color.dark} opacity="0.25" />
        </>
      )}
    </svg>
  );
};

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

export const RingStackGame = ({ onComplete }: Props) => {
  const tracker = useGameTracker();
  const stage = useGameStage();
  const { t } = useI18n();
  const [tray, setTray] = useState<ColorId[]>(() => shuffle(COLORS.map((c) => c.id)));
  const [placed, setPlaced] = useState<Partial<Record<ColorId, true>>>({});
  const [dragging, setDragging] = useState<ColorId | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [hoverStick, setHoverStick] = useState<ColorId | null>(null);
  const [shake, setShake] = useState(false);
  const [glow, setGlow] = useState<ColorId | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const stickRefs = useRef<Record<ColorId, HTMLDivElement | null>>({
    orange: null, red: null, blue: null, green: null,
  });

  const allDone = COLORS.every((c) => placed[c.id]);
  const placedCount = COLORS.filter((c) => placed[c.id]).length;

  useEffect(() => {
    stage.setProgress(placedCount, COLORS.length);
  }, [placedCount, stage]);

  useEffect(() => {
    if (allDone) {
      stage.react("done", t("ring.done"));
      const timer = setTimeout(() => onComplete(100, tracker.getEvents()), 1600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [allDone, onComplete, tracker, stage, t]);

  const findStickAt = (x: number, y: number): ColorId | null => {
    for (const c of COLORS) {
      const el = stickRefs.current[c.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const tol = 55;
      if (x >= r.left - tol && x <= r.right + tol && y >= r.top - tol && y <= r.bottom + tol) {
        return c.id;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      setPointer(framePoint(e.clientX, e.clientY));
      setHoverStick(findStickAt(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      const target = findStickAt(e.clientX, e.clientY);
      if (target && target === dragging) {
        tracker.correct({ color: dragging });
        stage.react("correct", t("celebration.2"));
        setPlaced((p) => ({ ...p, [dragging]: true }));
        setTray((t) => t.filter((id) => id !== dragging));
        setGlow(dragging);
        playDing(true);
        setTimeout(() => setGlow((g) => (g === dragging ? null : g)), 700);
      } else {
        tracker.wrong({ picked: dragging });
        stage.react("wrong", t("encourage.tryAgain"));
        setShake(true);
        playDing(false);
        setTimeout(() => setShake(false), 400);
      }
      setDragging(null);
      setPointer(null);
      setHoverStick(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const reset = () => {
    setPlaced({});
    setTray(shuffle(COLORS.map((c) => c.id)));
  };

  return (
    <div className="select-none">
      <p className="text-center text-sm text-muted-foreground mb-3 font-semibold">
        {t("ring.prompt")}
      </p>

      <div
        ref={boardRef}
        className={`bg-gradient-to-b from-amber-50 to-orange-100 rounded-3xl p-4 border-2 border-amber-200 ${
          shake ? "animate-[wiggle_0.4s_ease-in-out]" : ""
        }`}
      >
        {/* Bastões em cima da base */}
        <div className="relative">
          <div className="flex justify-around items-end gap-2 px-1 sm:px-3">
            {COLORS.map((c) => {
              const isPlaced = !!placed[c.id];
              const isHover = hoverStick === c.id && dragging === c.id;
              const isGlow = glow === c.id;
              return (
                <div
                  key={c.id}
                  ref={(el) => { stickRefs.current[c.id] = el; }}
                  className={`relative flex flex-col items-center transition-all ${
                    isHover ? "scale-105" : ""
                  } ${isGlow ? "drop-shadow-[0_0_18px_rgba(250,204,21,0.95)]" : ""}`}
                  style={{ width: "20%" }}
                >
                  {/* Argola encaixada — desce pelo bastão até a base */}
                  {isPlaced && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 z-20 animate-[dropin_0.55s_cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{ bottom: -8 }}
                    >
                      <Ring color={c} size={96} hollow />
                    </div>
                  )}
                  {/* Bastão */}
                  <svg viewBox="0 0 30 160" className="w-full h-[160px] sm:h-[180px]" preserveAspectRatio="none">
                    {/* topo cinza */}
                    <rect x="11" y="0" width="8" height="14" rx="3" fill="#9CA3AF" />
                    <rect x="11" y="0" width="3" height="14" rx="2" fill="#D1D5DB" />
                    {/* corpo do bastão */}
                    <rect x="9" y="12" width="12" height="148" rx="4" fill={c.base} />
                    <rect x="10" y="14" width="3" height="144" rx="2" fill={c.light} opacity="0.7" />
                    <rect x="18" y="14" width="2" height="144" rx="1" fill={c.dark} opacity="0.5" />
                  </svg>
                </div>
              );
            })}
          </div>
          {/* Base de madeira */}
          <div className="-mt-2 h-6 sm:h-7 rounded-xl bg-gradient-to-b from-amber-300 to-amber-600 border-2 border-amber-700 shadow-inner" />
        </div>

        {/* Bandeja com argolas soltas */}
        <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3 bg-card/70 rounded-[1.75rem] p-3 border border-white">
          {COLORS.map((c) => {
            const inTray = tray.includes(c.id);
            const isDraggingThis = dragging === c.id;
            return (
              <div key={c.id} className="aspect-square rounded-xl bg-secondary/60 border-2 border-dashed border-border flex items-center justify-center">
                {inTray && (
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setDragging(c.id);
                      setPointer(framePoint(e.clientX, e.clientY));
                    }}
                    className={`touch-none active:scale-95 transition ${isDraggingThis ? "opacity-30" : ""}`}
                    aria-label={t(c.labelKey)}
                  >
                    <Ring color={c} size={70} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center mt-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" /> {t("ring.restart")}
        </button>
      </div>

      {allDone && (
        <div className="mt-3 text-center">
          <span className="inline-block bg-zeno-green/150 text-white text-sm font-extrabold px-4 py-2 rounded-full shadow animate-[fadepop_0.5s_ease-out]">
            {t("ring.done")} 🎉
          </span>
        </div>
      )}

      {/* Argola arrastada */}
      {dragging && pointer && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: pointer.x, top: pointer.y }}
        >
          <div className={hoverStick === dragging ? "drop-shadow-[0_0_18px_rgba(16,185,129,0.85)] scale-110 transition" : "transition"}>
            <Ring color={COLORS.find((c) => c.id === dragging)!} size={90} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadepop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes wiggle { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        @keyframes dropin { 0% { transform: translate(-50%, -180px) scale(0.9); opacity: 0; } 60% { transform: translate(-50%, 8px) scale(1.04); opacity: 1; } 100% { transform: translate(-50%, 0) scale(1); } }
      `}</style>
    </div>
  );
};
