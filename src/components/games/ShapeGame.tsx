import { useEffect, useMemo, useRef, useState } from "react";
import zenoImg from "@/assets/zeno.png";
import type { GameResult } from "@/lib/zeno";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";

type ShapeKey = "square" | "triangle" | "diamond" | "star" | "circle" | "heart";

const PATHS: Record<ShapeKey, string> = {
  square: "M14 20a6 6 0 0 1 6-6h60a6 6 0 0 1 6 6v60a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z",
  triangle: "M50 12 88 84a5 5 0 0 1-4.4 7.4H16.4A5 5 0 0 1 12 84z",
  diamond: "M50 8 92 50 50 92 8 50z",
  star: "m50 8 12.4 25.6L90 37.6 70 57.2l4.8 27.6L50 71.8 25.2 84.8 30 57.2 10 37.6l27.6-4z",
  circle: "M50 8a42 42 0 1 1 0 84 42 42 0 0 1 0-84z",
  heart: "M50 88C22 68 12 54 12 39A21 21 0 0 1 50 27 21 21 0 0 1 88 39c0 15-10 29-38 49z",
};

const COLORS: Record<ShapeKey, string> = {
  square: "var(--zeno-green)",
  triangle: "oklch(0.58 0.22 27)",
  diamond: "var(--zeno-blue)",
  star: "var(--zeno-orange)",
  circle: "var(--zeno-purple)",
  heart: "var(--zeno-pink)",
};

const ORDER: ShapeKey[] = ["square", "triangle", "diamond", "star", "circle", "heart"];

function Shape({ shape, mode }: { shape: ShapeKey; mode: "piece" | "slot" | "done" }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      {mode === "slot" ? (
        <>
          <path d={PATHS[shape]} fill="oklch(0.32 0.035 45)" transform="translate(0,3)" />
          <path d={PATHS[shape]} fill="oklch(0.38 0.04 45)" />
        </>
      ) : (
        <>
          <path d={PATHS[shape]} fill="oklch(0.28 0.03 45 / 0.35)" transform="translate(0,4)" />
          <path d={PATHS[shape]} fill={COLORS[shape]} stroke="oklch(1 0 0 / 0.75)" strokeWidth="4" />
        </>
      )}
    </svg>
  );
}

/** Accumulated CSS transform of all ancestors (FitToScreen scale + RotationFrame rotate). */
function ancestorMatrix(el: HTMLElement | null): DOMMatrix {
  let m = new DOMMatrix();
  let node: HTMLElement | null = el;
  const chain: HTMLElement[] = [];
  while (node) {
    chain.push(node);
    node = node.parentElement;
  }
  for (const n of chain.reverse()) {
    const t = getComputedStyle(n).transform;
    if (t && t !== "none") m = m.multiply(new DOMMatrix(t));
  }
  return m;
}

export function ShapeGame({ level, onFinish }: { level: number; onFinish: (r: GameResult) => void }) {
  const started = useMemo(() => Date.now(), []);
  const stage = useGameStage();
  const { t } = useI18n();
  const count = Math.min(ORDER.length, 2 + level);
  const shapes = useMemo(() => ORDER.slice(0, count), [count]);
  const [placed, setPlaced] = useState<ShapeKey[]>([]);
  const [misses, setMisses] = useState(0);
  const [shakeSlot, setShakeSlot] = useState<ShapeKey | null>(null);
  const [drag, setDrag] = useState<{ shape: ShapeKey; dx: number; dy: number } | null>(null);
  const [hover, setHover] = useState<ShapeKey | null>(null);
  const inverse = useRef<DOMMatrix>(new DOMMatrix());
  const origin = useRef({ x: 0, y: 0 });

  const pieces = useMemo(() => [...shapes].sort(() => Math.random() - 0.5), [shapes]);
  const slots = useMemo(() => [...shapes].sort(() => Math.random() - 0.5), [shapes]);

  useEffect(() => {
    stage.setProgress(placed.length, shapes.length);
  }, [placed.length, shapes.length, stage]);

  useEffect(() => {
    if (placed.length === shapes.length) {
      const timer = setTimeout(
        () =>
          onFinish({
            score: Math.max(0, shapes.length * 10 - misses * 2),
            hits: shapes.length,
            misses,
            durationSeconds: Math.round((Date.now() - started) / 1000),
          }),
        600,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [placed, shapes.length, misses, onFinish, started]);

  function slotUnder(clientX: number, clientY: number): ShapeKey | null {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const target = el?.closest<HTMLElement>("[data-slot]");
    if (target) return target.dataset["slot"] as ShapeKey;
    // fallback: nearest slot whose box contains (or is close to) the pointer
    let best: { key: ShapeKey; dist: number } | null = null;
    document.querySelectorAll<HTMLElement>("[data-slot]").forEach((node) => {
      const r = node.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(clientX - cx, clientY - cy);
      const reach = Math.max(r.width, r.height) * 0.8;
      if (dist <= reach && (!best || dist < best.dist)) {
        best = { key: node.dataset["slot"] as ShapeKey, dist };
      }
    });
    return best ? (best as { key: ShapeKey }).key : null;
  }


  function localDelta(clientX: number, clientY: number) {
    const m = inverse.current;
    const x = clientX - origin.current.x;
    const y = clientY - origin.current.y;
    return { dx: m.a * x + m.c * y, dy: m.b * x + m.d * y };
  }

  function onPointerDown(shape: ShapeKey, e: React.PointerEvent<HTMLButtonElement>) {
    if (placed.includes(shape)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    inverse.current = ancestorMatrix(e.currentTarget).inverse();
    origin.current = { x: e.clientX, y: e.clientY };
    setDrag({ shape, dx: 0, dy: 0 });
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    const { dx, dy } = localDelta(e.clientX, e.clientY);
    setDrag((d) => (d ? { ...d, dx, dy } : d));
    setHover(slotUnder(e.clientX, e.clientY));
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    const slot = slotUnder(e.clientX, e.clientY);
    const shape = drag.shape;
    setDrag(null);
    setHover(null);
    if (!slot) return;
    if (slot === shape) {
      stage.react("correct", t("celebration.2"));
      setPlaced((p) => (p.includes(slot) ? p : [...p, slot]));
    } else {
      stage.react("wrong", t("encourage.tryAgain"));
      setMisses((m) => m + 1);
      setShakeSlot(slot);
      setTimeout(() => setShakeSlot(null), 400);
    }
  }

  return (
    <div className="flex h-full w-full touch-none select-none items-end justify-center gap-4">
      <img
        src={zenoImg}
        alt="Zeno"
        className="animate-float hidden h-[42%] w-auto self-end object-contain drop-shadow-xl sm:block"
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-5">
          {pieces.map((shape) => {
            const dragging = drag?.shape === shape;
            return (
              <button
                key={shape}
                disabled={placed.includes(shape)}
                onPointerDown={(e) => onPointerDown(shape, e)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={`h-20 w-20 touch-none disabled:opacity-0 sm:h-24 sm:w-24 ${
                  dragging ? "z-50 scale-110 drop-shadow-2xl" : "transition-transform"
                }`}
                style={
                  dragging
                    ? {
                        transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.1)`,
                        position: "relative",
                        pointerEvents: "none",
                      }
                    : undefined
                }

                aria-label={shape}
              >
                <Shape shape={shape} mode="piece" />
              </button>
            );
          })}
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-5 rounded-[2rem] border-b-8 px-6 py-5 shadow-toy"
          style={{
            background: "linear-gradient(180deg, oklch(0.5 0.055 47), oklch(0.42 0.05 45))",
            borderColor: "oklch(0.33 0.04 45)",
          }}
        >
          {slots.map((slot) => {
            const done = placed.includes(slot);
            return (
              <div
                key={slot}
                data-slot={slot}
                className={`h-20 w-20 transition-transform sm:h-24 sm:w-24 ${
                  shakeSlot === slot ? "animate-pulse" : ""
                } ${done ? "animate-pop" : ""} ${hover === slot && !done ? "scale-110" : ""}`}
                aria-label={slot}
              >
                <Shape shape={slot} mode={done ? "piece" : "slot"} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

