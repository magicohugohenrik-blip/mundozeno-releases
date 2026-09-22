import { useEffect, useRef, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import zenoCharacter from "@/assets/zeno.png";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { framePoint } from "@/lib/pointer";

interface Props {
  onComplete: GameCompleteFn;
  /** dificuldade: 3 = 3x3 (padrão), 2 = 2x2 */
  size?: 2 | 3;
  image?: string;
}

interface Tile {
  /** posição correta (0..n-1) */
  correct: number;
  /** posição atual no tabuleiro */
  current: number;
}

/**
 * Quebra-cabeça com arrastar e soltar usando Pointer Events,
 * funciona igual em mouse, toque e caneta. A peça arrastada
 * acompanha o ponteiro como um "fantasma" e ao soltar sobre
 * outra peça, as duas trocam de posição.
 */
export const PuzzleGame = ({ onComplete, size = 3, image = zenoCharacter }: Props) => {
  const total = size * size;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moves, setMoves] = useState(0);
  const [seed, setSeed] = useState(0);
  const tracker = useGameTracker();
  const stage = useGameStage();
  const { t } = useI18n();

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const tileSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const positions = Array.from({ length: total }, (_, i) => i);
    let shuffled = [...positions];
    do {
      shuffled = [...positions].sort(() => Math.random() - 0.5);
    } while (shuffled.every((v, i) => v === i));
    setTiles(shuffled.map((correct, current) => ({ correct, current })));
    setDragFrom(null);
    setHoverPos(null);
    setGhost(null);
    setMoves(0);
    tracker.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, total]);

  const solved = tiles.length > 0 && tiles.every((t) => t.correct === t.current);
  const correctCount = tiles.filter((t) => t.correct === t.current).length;

  useEffect(() => {
    stage.setProgress(correctCount, total);
  }, [correctCount, total, stage]);

  useEffect(() => {
    if (solved) {
      stage.react("done", t("puzzle.done"));
      const score = Math.max(20, 100 - moves * 4);
      const timer = setTimeout(() => onComplete(score, tracker.getEvents()), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [solved, moves, onComplete, tracker, stage, t]);

  const swap = (from: number, to: number) => {
    if (from === to) return;
    // avalia se a troca colocou alguma peça no lugar correto (raciocínio/coordenação)
    const fromTile = tiles.find((t) => t.current === from);
    const toTile = tiles.find((t) => t.current === to);
    const improved =
      (fromTile && fromTile.correct === to) || (toTile && toTile.correct === from);
    if (improved) {
      tracker.correct({ from, to });
      stage.react("correct", t("celebration.1"));
    } else {
      tracker.wrong({ from, to });
      stage.react("wrong", t("encourage.tryAgain"));
    }
    setTiles((prev) =>
      prev.map((t) => {
        if (t.current === from) return { ...t, current: to };
        if (t.current === to) return { ...t, current: from };
        return t;
      })
    );
    setMoves((m) => m + 1);
  };

  const findPosFromPoint = (x: number, y: number): number | null => {
    const board = boardRef.current;
    if (!board) return null;
    const els = board.querySelectorAll<HTMLElement>("[data-pos]");
    for (const el of Array.from(els)) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const p = el.getAttribute("data-pos");
        return p ? Number(p) : null;
      }
    }
    return null;
  };

  const onPointerDown = (pos: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (solved) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    tileSizeRef.current = { w: r.width, h: r.height };
    setDragFrom(pos);
    setHoverPos(pos);
    const g0 = framePoint(e.clientX, e.clientY);
    setGhost({ x: g0.x, y: g0.y, w: r.width, h: r.height });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragFrom === null) return;
    e.preventDefault();
    const gp = framePoint(e.clientX, e.clientY);
    setGhost((g) => (g ? { ...g, x: gp.x, y: gp.y } : g));
    const p = findPosFromPoint(e.clientX, e.clientY);
    setHoverPos(p);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragFrom === null) return;
    const target = findPosFromPoint(e.clientX, e.clientY);
    if (target !== null) swap(dragFrom, target);
    setDragFrom(null);
    setHoverPos(null);
    setGhost(null);
  };

  const grid = [...tiles].sort((a, b) => a.current - b.current);

  // peça que está sendo arrastada (para renderizar o fantasma)
  const draggedTile = dragFrom !== null ? tiles.find((t) => t.current === dragFrom) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-semibold text-foreground">
        <span>{t("puzzle.moves", { count: moves })}</span>
        <button onClick={() => setSeed((s) => s + 1)} className="inline-flex items-center gap-1 text-zeno-blue">
          <RefreshCw className="w-4 h-4" /> {t("puzzle.restart")}
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t("puzzle.hint")}
      </p>

      <div
        className="mx-auto bg-secondary rounded-[1.75rem] p-2 shadow-inner"
        style={{ width: "min(520px, 100%)" }}
      >
        <div
          ref={boardRef}
          className="grid gap-1 select-none"
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            aspectRatio: "1 / 1",
            touchAction: "none",
          }}
        >
          {grid.map((t) => {
            const row = Math.floor(t.correct / size);
            const col = t.correct % size;
            const isDragging = dragFrom === t.current;
            const isHover =
              hoverPos === t.current && dragFrom !== null && dragFrom !== t.current;
            const isRight = t.correct === t.current;
            return (
              <div
                key={t.correct}
                data-pos={t.current}
                onPointerDown={onPointerDown(t.current)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? "border-zeno-orange opacity-30"
                    : isHover
                    ? "border-zeno-blue scale-105 ring-2 ring-sky-300"
                    : isRight
                    ? "border-zeno-green"
                    : "border-white hover:border-zeno-blue"
                }`}
                style={{
                  backgroundImage: `url(${image})`,
                  backgroundSize: `${size * 100}% ${size * 100}%`,
                  backgroundPosition: `${(col / (size - 1)) * 100}% ${
                    (row / (size - 1)) * 100
                  }%`,
                  touchAction: "none",
                }}
                aria-label={`${t.correct + 1}`}
              >
                {/* Número grande para ajudar a criança a identificar a ordem/lugar da peça */}
                <span
                  className={`pointer-events-none absolute top-1 left-1 flex items-center justify-center rounded-full font-extrabold shadow-md ${
                    isRight ? "bg-zeno-green/150 text-white" : "bg-card/90 text-zeno-blue"
                  }`}
                  style={{
                    width: "38%",
                    height: "38%",
                    minWidth: "22px",
                    minHeight: "22px",
                    fontSize: "clamp(14px, 6vw, 26px)",
                    border: "2px solid rgba(255,255,255,0.9)",
                  }}
                >
                  {t.correct + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Peça fantasma seguindo o ponteiro */}
      {ghost && draggedTile && (() => {
        const row = Math.floor(draggedTile.correct / size);
        const col = draggedTile.correct % size;
        return (
          <div
            className="pointer-events-none fixed z-50 rounded-lg overflow-hidden border-2 border-zeno-orange shadow-2xl"
            style={{
              width: ghost.w,
              height: ghost.h,
              left: ghost.x - ghost.w / 2,
              top: ghost.y - ghost.h / 2,
              backgroundImage: `url(${image})`,
              backgroundSize: `${size * 100}% ${size * 100}%`,
              backgroundPosition: `${(col / (size - 1)) * 100}% ${
                (row / (size - 1)) * 100
              }%`,
              transform: "scale(1.05)",
            }}
          />
        );
      })()}

      {solved && (
        <div className="bg-zeno-green/15 border-2 border-zeno-green rounded-[1.75rem] p-4 text-center font-display text-xl text-foreground inline-flex items-center justify-center gap-2 w-full">
          <Trophy className="w-5 h-5" /> {t("puzzle.done")}
        </div>
      )}
    </div>
  );
};
