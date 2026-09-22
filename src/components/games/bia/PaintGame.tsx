import { useEffect, useRef, useState } from "react";
import { Eraser, RotateCcw, Check } from "lucide-react";
import { avatarCharacters } from "@/lib/zeno";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useT } from "@/lib/i18n";

const COLORS = [
  "#2F9BD9",
  "#57B94A",
  "#F5A623",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#FDE047",
  "#7C4A21",
  "#111827",
  "#FFFFFF",
];

const SIZES = [10, 22, 40];

/** Ateliê de pintura: a criança pinta livremente sobre o contorno de um personagem da Turma do Zeno. */
export const PaintGame = ({ onComplete }: { onComplete: GameCompleteFn }) => {
  const tracker = useGameTracker();
  const stage = useGameStage();
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [character, setCharacter] = useState(avatarCharacters[0]!);
  const [color, setColor] = useState(COLORS[0]!);
  const [size, setSize] = useState(SIZES[1]!);
  const [erasing, setErasing] = useState(false);
  const [strokes, setStrokes] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes(0);
  }, [character]);

  useEffect(() => {
    // Para jogos criativos, progresso reflete o engajamento (traços)
    const target = 8;
    stage.setProgress(Math.min(strokes, target), target);
  }, [strokes, stage]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    // offsetX/offsetY já vêm no espaço do próprio canvas, então funcionam
    // mesmo com a tela girada ou com escala aplicada pelo FitToScreen.
    const ne = e.nativeEvent as PointerEvent;
    return {
      x: (ne.offsetX / canvas.clientWidth) * canvas.width,
      y: (ne.offsetY / canvas.clientHeight) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y);
    paint(ctx);
    setStrokes((s) => s + 1);
    tracker.track("attempt", { color, size, erasing });
    if (strokes === 0) stage.react("correct", t("celebration.4"));
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    paint(ctx);
  };

  const paint = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size;
    ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
    ctx.strokeStyle = erasing ? "rgba(0,0,0,1)" : color;
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes(0);
  };

  const finish = () => {
    tracker.correct({ strokes, character: character.id });
    stage.react("done", t("celebration.4"));
    onComplete(Math.min(100, 40 + strokes * 3), tracker.getEvents());
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2">
      <div className="flex shrink-0 flex-wrap justify-center gap-2">
        {avatarCharacters.map((c) => (
          <button
            key={c.id}
            onClick={() => setCharacter(c)}
            aria-label={c.name}
            className={`h-11 w-11 overflow-hidden rounded-full bg-card shadow-card transition-transform active:scale-95 ${
              character.id === c.id ? "ring-4 ring-zeno-blue" : ""
            }`}
          >
            <img src={c.image} alt={c.name} className="h-full w-full object-contain" />
          </button>
        ))}
      </div>

      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[1.5rem] bg-card shadow-card">
        <img
          src={character.image}
          alt={`Desenho de ${character.name}`}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain opacity-25 grayscale"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">

        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setErasing(false);
            }}
            aria-label={c}
            style={{ backgroundColor: c }}
            className={`h-11 w-11 rounded-full border-4 border-border shadow-card transition-transform active:scale-90 ${
              !erasing && color === c ? "ring-4 ring-zeno-blue" : ""
            }`}
          />
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
        {SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            aria-label={`${s}`}
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-card active:scale-95 ${
              size === s ? "ring-4 ring-zeno-blue" : ""
            }`}
          >
            <span className="rounded-full bg-foreground" style={{ width: s / 2, height: s / 2 }} />
          </button>
        ))}
        <button
          onClick={() => setErasing((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full bg-card px-4 py-3 font-display shadow-card active:scale-95 ${
            erasing ? "ring-4 ring-zeno-blue" : ""
          }`}
        >
          <Eraser className="h-5 w-5" /> {t("draw.eraser")}
        </button>
        <button
          onClick={clear}
          className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-3 font-display shadow-card active:scale-95"
        >
          <RotateCcw className="h-5 w-5" /> {t("draw.clear")}
        </button>
        <button
          onClick={finish}
          className="inline-flex items-center gap-2 rounded-full bg-zeno-green px-5 py-3 font-display text-lg shadow-card active:scale-95"
        >
          <Check className="h-5 w-5" /> {t("draw.done")}
        </button>
      </div>
    </div>
  );
};
