import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { type CatalogGame } from "@/lib/zeno";
import { playSfx, speak, stopSpeaking } from "@/lib/audio";
import { FitToScreen } from "@/components/games/FitToScreen";
import { GameProgress, ZenoCorner, type ZenoMood } from "@/components/games/GameFeedback";
import { useReduceMotion } from "@/lib/prefs";
import { useI18n } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";



export interface PlayerSlot {
  name: string;
}

interface StageApi {
  /** Atualiza a barra de progresso da atividade. */
  setProgress: (value: number, total: number) => void;
  /** Reação do Zeno no canto: acolhedora no erro, comemorativa no acerto. */
  react: (mood: ZenoMood, message?: string) => void;
}

const StageContext = createContext<StageApi>({ setProgress: () => {}, react: () => {} });

/** Jogos usam este hook para alimentar progresso e reações do Zeno. */
export function useGameStage(): StageApi {
  return useContext(StageContext);
}

/** Moldura comum a todos os jogos: cenário, HUD, progresso, placar e controles. */
export function GameShell({
  game,
  level,
  players,
  soundOn,
  onToggleSound,
  onRotate,
  onExit,
  fit = true,
  background,
  children,
}: {
  game: CatalogGame;
  level: number;
  players: PlayerSlot[];
  soundOn: boolean;
  onToggleSound: () => void;
  onRotate: () => void;
  onExit: () => void;
  /** false para jogos de canvas, que precisam preencher a área sem escala. */
  fit?: boolean;
  /** URL de cenário de fundo em tela cheia. */
  background?: string | undefined;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const title = game.customTitle ?? t(`game.${game.slug}.title` as TKey);
  const instruction = game.customInstruction ?? t(`game.${game.slug}.instruction` as TKey);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [turn, setTurn] = useState(0);
  const [progress, setProgressState] = useState<{ value: number; total: number } | null>(null);
  const [mood, setMood] = useState<ZenoMood>("idle");
  const [zenoMessage, setZenoMessage] = useState<string | undefined>(undefined);
  const [calm, setCalm] = useReduceMotion();
  const spoken = useRef<string | null>(null);

  useEffect(() => {
    if (spoken.current === instruction) return;
    spoken.current = instruction;
    const id = setTimeout(() => speak(instruction), 400);
    return () => {
      clearTimeout(id);
      stopSpeaking();
    };
  }, [instruction]);

  const stage = useMemo<StageApi>(
    () => ({
      setProgress: (value, total) => setProgressState({ value, total }),
      react: (nextMood, message) => {
        setMood(nextMood);
        setZenoMessage(message);
      },
    }),
    [],
  );

  const duo = players.length > 1;

  function addPoint(index: number) {
    playSfx("hit");
    setScores((list) => list.map((v, i) => (i === index ? v + 1 : v)));
    setTurn((t) => (t + 1) % players.length);
  }


  return (
    <div
      className="flex h-full min-h-0 flex-col gap-2 bg-cover bg-center p-2 sm:p-3"
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      <header
        className={`flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-full px-2 py-1.5 sm:px-4 sm:py-2 ${
          background ? "bg-transparent" : "bg-card/90 shadow-card backdrop-blur"
        }`}
      >
        {background ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-zeno-orange font-display text-lg text-white shadow-toy ring-4 ring-white/80 sm:h-14 sm:w-14 sm:rounded-[1.25rem] sm:text-2xl">
            {level}
          </span>
        ) : null}
        <p
          className={`order-last w-full min-w-0 truncate text-center font-display text-lg leading-tight sm:order-none sm:w-auto sm:flex-1 sm:text-2xl ${
            background ? "sign-wood px-4 py-1 sm:px-6 sm:py-2" : ""
          }`}
        >
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">

          <button
            onClick={() => speak(instruction)}
            aria-label={t("shell.repeat")}
            className="btn-round bg-zeno-blue text-white active:scale-95"
          >
            🔊
          </button>
          <button
            onClick={onRotate}
            aria-label={t("common.rotate")}
            className="btn-round bg-zeno-green text-white active:scale-95"
          >
            🔄
          </button>
          <button
            onClick={onToggleSound}
            aria-label={soundOn ? t("common.sound.off") : t("common.sound.on")}
            className="btn-round bg-card active:scale-95"
          >
            {soundOn ? "🔈" : "🔇"}
          </button>
          <button
            onClick={() => setCalm(!calm)}
            aria-pressed={calm}
            aria-label={t("a11y.motion")}
            className={`btn-round active:scale-95 ${calm ? "bg-zeno-purple text-white" : "bg-card"}`}
          >
            {calm ? "🐢" : "✨"}
          </button>
          <button
            onClick={onExit}
            aria-label={t("common.exit")}
            className="btn-round bg-destructive font-display text-white active:scale-95"
          >
            ✕
          </button>
        </div>

      </header>

      {progress && progress.total > 0 ? (
        <div className="shrink-0 px-1">
          <GameProgress value={progress.value} total={progress.total} />
        </div>
      ) : null}

      {duo && (
          <div className="grid shrink-0 grid-cols-2 gap-2">
            {players.map((p, i) => (
              <button
                key={p.name + i}
                onClick={() => addPoint(i)}
                className={`flex items-center justify-between rounded-full px-4 py-2 text-left shadow-card transition-transform active:scale-95 ${
                  turn === i ? "bg-zeno-green text-white" : "bg-card/90"
                } ${i === 0 ? "rotate-180" : ""}`}
              >
                <span className="truncate font-display text-lg">{p.name}</span>
                <span className="font-display text-xl tabular-nums">{scores[i] ?? 0} ⭐</span>
              </button>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] p-3 sm:p-4 ${
            background ? "stage-area" : "bg-card/85 shadow-card backdrop-blur"
          }`}
        >
          <StageContext.Provider value={stage}>
            {fit ? <FitToScreen>{children}</FitToScreen> : <div className="flex min-h-0 flex-1 flex-col">{children}</div>}
          </StageContext.Provider>
          {mood !== "idle" || zenoMessage ? <ZenoCorner mood={mood} message={zenoMessage} /> : null}
        </motion.div>
    </div>
  );
}
