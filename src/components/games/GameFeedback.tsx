import { motion } from "motion/react";
import { portraitOf } from "@/lib/zeno";

/** Barra de progresso da atividade (etapas concluídas). */
export function GameProgress({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div
      className="h-4 w-full overflow-hidden rounded-full bg-card/70 ring-4 ring-white/70"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-zeno-green transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export type ZenoMood = "idle" | "correct" | "wrong" | "done";

/**
 * Zeno em canto reservado: ajuda, nunca disputa espaço com a atividade.
 * Reações acolhedoras — nenhum feedback negativo exagerado.
 */
export function ZenoCorner({ mood = "idle", message }: { mood?: ZenoMood; message?: string | undefined }) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-end gap-2">
      <img
        src={portraitOf("zeno")}
        alt=""
        aria-hidden
        className={`h-20 w-20 object-contain drop-shadow-xl sm:h-24 sm:w-24 ${
          mood === "correct" || mood === "done" ? "animate-pop" : "animate-float"
        }`}
      />
      {message ? (
        <span className="mb-3 max-w-[14rem] rounded-[1.25rem] bg-card/95 px-3 py-2 font-display text-sm leading-tight shadow-card sm:text-base">
          {message}
        </span>
      ) : null}
    </div>
  );
}

/** Tela de conclusão comum a todas as atividades. */
export function GameCelebration({
  title,
  stars,
  detail,
  onAgain,
  onBack,
  againLabel,
  backLabel,
}: {
  title: string;
  stars: number;
  detail?: string | undefined;
  onAgain: () => void;
  onBack: () => void;
  againLabel: string;
  backLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full w-full items-center justify-center p-4"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[2rem] bg-card/95 p-6 text-center shadow-card">
        <span className="text-6xl" aria-hidden>
          🏆
        </span>
        <h2 className="font-display text-3xl">{title}</h2>
        <div className="flex gap-1 text-3xl" aria-label={`${stars}`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < stars ? "" : "opacity-25"} aria-hidden>
              ⭐
            </span>
          ))}
        </div>
        {detail ? <p className="text-lg text-muted-foreground">{detail}</p> : null}
        <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={onAgain}
            className="min-h-14 flex-1 rounded-[1.25rem] bg-zeno-green font-display text-xl text-white shadow-toy active:scale-95"
          >
            {againLabel}
          </button>
          <button
            onClick={onBack}
            className="min-h-14 flex-1 rounded-[1.25rem] bg-zeno-blue font-display text-xl text-white shadow-toy active:scale-95"
          >
            {backLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
