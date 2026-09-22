import { useEffect, useMemo, useState } from "react";
import { Check, Trophy } from "lucide-react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";

interface Color {
  id: string;
  nameKey: TKey;
  hex: string;
}

const COLORS: Color[] = [
  { id: "vermelho", nameKey: "color.red", hex: "#e11d48" },
  { id: "azul", nameKey: "color.blue", hex: "#2563eb" },
  { id: "amarelo", nameKey: "color.yellow", hex: "#facc15" },
  { id: "verde", nameKey: "color.green", hex: "#16a34a" },
  { id: "laranja", nameKey: "color.orange", hex: "#f97316" },
  { id: "roxo", nameKey: "color.purple", hex: "#7c3aed" },
  { id: "rosa", nameKey: "color.pink", hex: "#ec4899" },
  { id: "marrom", nameKey: "color.brown", hex: "#92400e" },
];

/**
 * Combine as cores — arraste o nome da cor (escrito na própria cor)
 * até o quadrado da cor correspondente.
 */
export const ColorMatchGame = ({ onComplete }: { onComplete: GameCompleteFn }) => {
  const tracker = useGameTracker();
  const stage = useGameStage();
  const { t } = useI18n();
  // Ordem aleatória estável para os quadrados (coluna direita)
  const squares = useMemo(() => [...COLORS].sort(() => Math.random() - 0.5), []);
  // Ordem aleatória estável para os nomes (coluna esquerda)
  const names = useMemo(() => [...COLORS].sort(() => Math.random() - 0.5), []);

  const [matched, setMatched] = useState<Record<string, true>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Touch fallback: tap name then tap square
  const [tappedName, setTappedName] = useState<string | null>(null);

  const allDone = Object.keys(matched).length === COLORS.length;

  useEffect(() => {
    stage.setProgress(Object.keys(matched).length, COLORS.length);
  }, [matched, stage]);

  useEffect(() => {
    if (!allDone) return;
    stage.react("done", t("colormatch.done"));
    const score = Math.max(40, 100 - Math.max(0, attempts - COLORS.length) * 8);
    const timer = setTimeout(() => onComplete(score, tracker.getEvents()), 900);
    return () => clearTimeout(timer);
  }, [allDone, attempts, COLORS.length, onComplete, tracker, stage, t]);

  const onDragStart = (id: string) => {
    if (matched[id]) return;
    setDragId(id);
  };

  const onDrop = (squareId: string) => {
    if (!dragId) return;
    setAttempts((a) => a + 1);
    if (dragId === squareId) {
      tracker.correct({ color: dragId });
      stage.react("correct", t("celebration.1"));
      setMatched((m) => ({ ...m, [dragId]: true as const }));
    } else {
      tracker.wrong({ picked: dragId, expected: squareId });
      stage.react("wrong", t("encourage.tryAgain"));
      setShakeId(squareId);
      setTimeout(() => setShakeId(null), 450);
    }
    setDragId(null);
    setHoverId(null);
  };

  const onTapName = (id: string) => {
    if (matched[id]) return;
    setTappedName((cur) => (cur === id ? null : id));
  };

  const onTapSquare = (squareId: string) => {
    if (!tappedName) return;
    setAttempts((a) => a + 1);
    if (tappedName === squareId) {
      tracker.correct({ color: tappedName });
      stage.react("correct", t("celebration.1"));
      setMatched((m) => ({ ...m, [tappedName]: true as const }));
    } else {
      tracker.wrong({ picked: tappedName, expected: squareId });
      stage.react("wrong", t("encourage.tryAgain"));
      setShakeId(squareId);
      setTimeout(() => setShakeId(null), 450);
    }
    setTappedName(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-center font-display text-xl text-foreground">
        {t("colormatch.prompt")}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* Coluna esquerda: nomes */}
        <div className="space-y-2.5">
          {names.map((c) => {
            const done = !!matched[c.id];
            const tapped = tappedName === c.id;
            return (
              <button
                key={c.id}
                draggable={!done}
                onDragStart={() => onDragStart(c.id)}
                onDragEnd={() => setDragId(null)}
                onClick={() => onTapName(c.id)}
                disabled={done}
                className={`w-full min-h-[52px] px-3 py-3 rounded-xl border-2 text-base sm:text-lg font-extrabold transition-all select-none ${
                  done
                    ? "bg-zeno-green/15 border-zeno-green opacity-60 cursor-default"
                    : tapped
                      ? "bg-card border-zeno-orange ring-2 ring-zeno-orange cursor-grab"
                      : "bg-card border-border hover:border-border cursor-grab active:cursor-grabbing"
                }`}
                style={{ color: done ? undefined : c.hex }}
                aria-label={t(c.nameKey)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{t(c.nameKey)}</span>
                  {done && <Check className="w-5 h-5 text-zeno-green shrink-0" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Coluna direita: quadrados coloridos */}
        <div className="space-y-2.5">
          {squares.map((c) => {
            const done = !!matched[c.id];
            const isHover = hoverId === c.id && dragId !== null;
            const shake = shakeId === c.id;
            return (
              <div
                key={c.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoverId(c.id);
                }}
                onDragLeave={() => setHoverId((h) => (h === c.id ? null : h))}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(c.id);
                }}
                onClick={() => onTapSquare(c.id)}
                role="button"
                aria-label={t(c.nameKey)}
                className={`relative w-full min-h-[52px] rounded-xl border-2 transition-all flex items-center justify-center ${
                  done
                    ? "border-zeno-green"
                    : isHover
                      ? "border-zeno-orange ring-2 ring-zeno-orange scale-[1.02]"
                      : "border-white/70"
                } ${shake ? "animate-[wiggle_0.4s_ease-in-out]" : ""} ${
                  tappedName ? "cursor-pointer" : "cursor-default"
                }`}
                style={{ background: c.hex }}
              >
                {done && (
                  <span className="bg-card/90 rounded-full p-1 shadow">
                    <Check className="w-5 h-5 text-zeno-green" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("colormatch.matched", { count: Object.keys(matched).length, total: COLORS.length })}
      </p>

      {allDone && (
        <div className="bg-zeno-green/15 border-2 border-zeno-green rounded-[1.75rem] p-4 text-center font-display text-xl text-foreground inline-flex items-center justify-center gap-2 w-full">
          <Trophy className="w-5 h-5" /> {t("colormatch.done")}
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};
