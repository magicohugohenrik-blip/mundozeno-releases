import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Check,
  Eraser,
  Paintbrush,
  Pen,
  Pencil,
  Redo2,
  SlidersHorizontal,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { localPoint } from "@/lib/pointer";
import { useT } from "@/lib/i18n";


export type Tool = "pen" | "pencil" | "brush" | "eraser";
interface Stroke {
  tool: Tool;
  color: string;
  size: number;
  points: [number, number][];
}
export interface BoardText {
  id: string;
  x: number;
  y: number;
  text: string;
  size: number;
  color: string;
}
export interface BoardState {
  strokes: Stroke[];
  texts: BoardText[];
  background?: string | null;
}
export interface MagicBoardHandle {
  exportImage: () => Promise<string>;
  texts: () => string[];
  isEmpty: () => boolean;
  state: () => BoardState;
  load: (s: BoardState) => void;
}

const W = 1600;
const H = 1000;
const COLORS = ["#1f2937", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#8b5a2b"];
const STORE = "zeno.magic.board";

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  if (s.points.length === 0) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.globalAlpha = s.tool === "pencil" ? 0.75 : 1;
  ctx.lineWidth = s.tool === "brush" ? s.size * 2.2 : s.tool === "pencil" ? Math.max(1, s.size * 0.5) : s.size;
  if (s.tool === "brush") {
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.size;
  }
  ctx.beginPath();
  const [x0, y0] = s.points[0]!;
  ctx.moveTo(x0, y0);
  if (s.points.length === 1) ctx.lineTo(x0 + 0.1, y0 + 0.1);
  for (let i = 1; i < s.points.length; i++) {
    const [x, y] = s.points[i]!;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

export const MagicBoard = forwardRef<MagicBoardHandle>(function MagicBoard(_props, ref) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [texts, setTexts] = useState<BoardText[]>([]);
  const [background, setBackground] = useState<string | null>(null);
  const bgImg = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]!);
  const [size, setSize] = useState(8);
  const [selected, setSelected] = useState<string | null>(null);
  const current = useRef<Stroke | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const toBoard = useCallback((cx: number, cy: number): [number, number] => {
    const el = wrapRef.current!;
    const p = localPoint(el, cx, cy);
    return [(p.x / el.offsetWidth) * W, (p.y / el.offsetHeight) * H];
  }, []);

  const redraw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (const s of strokes) drawStroke(ctx, s);
    if (current.current) drawStroke(ctx, current.current);
  }, [strokes]);

  useEffect(redraw, [redraw]);

  useEffect(() => {
    if (!background) {
      bgImg.current = null;
      return;
    }
    const img = new Image();
    img.src = background;
    bgImg.current = img;
  }, [background]);

  // restaura quadro salvo no aparelho (funciona sem internet)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw) as BoardState;
        setStrokes(s.strokes ?? []);
        setTexts(s.texts ?? []);
        setBackground(s.background ?? null);
      }
    } catch {
      /* ignorar */
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORE, JSON.stringify({ strokes, texts, background }));
      } catch {
        /* cheio */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [strokes, texts, background]);

  useImperativeHandle(ref, () => ({
    texts: () => texts.map((x) => x.text).filter(Boolean),
    isEmpty: () => strokes.length === 0 && texts.length === 0 && !background,
    state: () => ({ strokes, texts, background }),
    load: (s) => {
      setStrokes(s.strokes ?? []);
      setTexts(s.texts ?? []);
      setBackground(s.background ?? null);
      setRedo([]);
    },
    exportImage: async () => {
      const out = document.createElement("canvas");
      out.width = 1024;
      out.height = 640;
      const ctx = out.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.width, out.height);
      if (bgImg.current) {
        await bgImg.current.decode().catch(() => undefined);
        ctx.drawImage(bgImg.current, 0, 0, out.width, out.height);
      }
      ctx.drawImage(canvasRef.current!, 0, 0, out.width, out.height);
      const k = out.width / W;
      for (const tx of texts) {
        ctx.fillStyle = tx.color;
        ctx.font = `bold ${tx.size * k}px "Baloo 2", sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(tx.text, tx.x * k, tx.y * k);
      }
      return out.toDataURL("image/jpeg", 0.85);
    },
  }));

  const onDown = (e: React.PointerEvent) => {
    if (e.target !== canvasRef.current) return;
    setSelected(null);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    current.current = { tool, color, size, points: [toBoard(e.clientX, e.clientY)] };
    redraw();
  };
  const onMove = (e: React.PointerEvent) => {
    if (drag.current) {
      const [x, y] = toBoard(e.clientX, e.clientY);
      const d = drag.current;
      setTexts((all) => all.map((tx) => (tx.id === d.id ? { ...tx, x: x - d.dx, y: y - d.dy } : tx)));
      return;
    }
    if (!current.current) return;
    current.current.points.push(toBoard(e.clientX, e.clientY));
    redraw();
  };
  const onUp = () => {
    drag.current = null;
    if (!current.current) return;
    const s = current.current;
    current.current = null;
    setStrokes((all) => [...all, s]);
    setRedo([]);
  };

  const addText = () => {
    const id = crypto.randomUUID();
    setTexts((all) => [...all, { id, x: W / 2 - 150, y: H / 2 - 40, text: t("mg.text"), size: 72, color }]);
    setSelected(id);
  };
  const sel = texts.find((x) => x.id === selected) ?? null;
  const patchSel = (p: Partial<BoardText>) =>
    setTexts((all) => all.map((tx) => (tx.id === selected ? { ...tx, ...p } : tx)));

  const btn = (active: boolean) =>
    `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 font-display text-base shadow-card active:scale-95 ${
      active ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
    }`;


  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-border/60 bg-card/90 p-2 shadow-card backdrop-blur">
        {(
          [
            ["pen", Pen, "mg.pen"],
            ["pencil", Pencil, "mg.pencil"],
            ["brush", Paintbrush, "mg.brush"],
            ["eraser", Eraser, "mg.eraser"],
          ] as const
        ).map(([id, Icon, key]) => (
          <button key={id} onClick={() => setTool(id)} className={btn(tool === id)} aria-label={t(key)}>
            <Icon size={20} strokeWidth={2.2} />
            <span className="hidden sm:inline">{t(key)}</span>
          </button>
        ))}
        <div className="flex items-center gap-1 rounded-2xl bg-card px-2 py-1 shadow-card">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                if (tool === "eraser") setTool("pen");
                if (sel) patchSel({ color: c });
              }}
              aria-label={c}
              className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm">
          <SlidersHorizontal size={18} strokeWidth={2.2} className="text-muted-foreground" />
          <span className="hidden sm:inline">{t("mg.size")}</span>
          <input type="range" min={2} max={40} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          {/* Mostra a espessura real do traço escolhido. */}
          <span
            className="inline-block shrink-0 rounded-full"
            style={{ width: Math.max(4, size), height: Math.max(4, size), background: color }}
          />
        </label>

        <button onClick={addText} className={btn(false)} aria-label={t("mg.text")}>
          <Type size={20} strokeWidth={2.2} />
          <span className="hidden sm:inline">{t("mg.text")}</span>
        </button>

        <button
          onClick={() => {
            const last = strokes[strokes.length - 1];
            if (!last) return;
            setStrokes(strokes.slice(0, -1));
            setRedo([...redo, last]);
          }}
          className={btn(false)}
          aria-label={t("mg.undo")}
        >
          <Undo2 size={20} strokeWidth={2.2} />
        </button>
        <button
          onClick={() => {
            const last = redo[redo.length - 1];
            if (!last) return;
            setRedo(redo.slice(0, -1));
            setStrokes([...strokes, last]);
          }}
          className={btn(false)}
          aria-label={t("mg.redo")}
        >
          <Redo2 size={20} strokeWidth={2.2} />
        </button>
        <button
          onClick={() => {
            setStrokes([]);
            setRedo([]);
            setTexts([]);
            setBackground(null);
          }}
          className={btn(false)}
          aria-label={t("mg.clear")}
        >
          <Trash2 size={20} strokeWidth={2.2} />
          <span className="hidden sm:inline">{t("mg.clear")}</span>
        </button>

      </div>

      {sel && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-2 shadow-card">
          <input
            value={sel.text}
            onChange={(e) => patchSel({ text: e.target.value })}
            placeholder={t("mg.textPrompt")}
            className="min-h-12 flex-1 rounded-xl border border-input bg-background px-3 text-lg"
          />
          <button onClick={() => patchSel({ size: Math.max(24, sel.size - 12) })} className={btn(false)}>
            A−
          </button>
          <button onClick={() => patchSel({ size: Math.min(200, sel.size + 12) })} className={btn(false)}>
            A+
          </button>
          <button
            onClick={() => {
              setTexts(texts.filter((x) => x.id !== sel.id));
              setSelected(null);
            }}
            className={btn(false)}
            aria-label={t("mg.delete")}
          >
            <Trash2 size={20} strokeWidth={2.2} />
          </button>
          <button onClick={() => setSelected(null)} className={btn(true)} aria-label={t("mg.check")}>
            <Check size={20} strokeWidth={2.4} />
          </button>

        </div>
      )}

      <div className="flex min-h-0 flex-1 items-start justify-center">
        <div
          ref={wrapRef}
          className="studio-paper relative w-full max-h-full overflow-hidden rounded-[1.5rem] border border-border/70 shadow-card"
          style={{ aspectRatio: `${W} / ${H}`, touchAction: "none", containerType: "inline-size" }}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {background && <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={onDown}
            className="absolute inset-0 h-full w-full cursor-crosshair"
          />
          {texts.map((tx) => (
            <div
              key={tx.id}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId);
                const [x, y] = toBoard(e.clientX, e.clientY);
                drag.current = { id: tx.id, dx: x - tx.x, dy: y - tx.y };
                setSelected(tx.id);
              }}
              className={`absolute cursor-move select-none whitespace-nowrap font-display font-bold leading-none ${
                selected === tx.id ? "rounded outline-dashed outline-2 outline-primary" : ""
              }`}
              style={{
                left: `${(tx.x / W) * 100}%`,
                top: `${(tx.y / H) * 100}%`,
                fontSize: `${(tx.size / W) * 100}cqw`,
                color: tx.color,
              }}
            >
              <span style={{ fontSize: "inherit" }}>{tx.text || "…"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
