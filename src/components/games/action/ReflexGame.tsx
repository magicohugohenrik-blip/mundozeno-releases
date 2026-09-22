import { useEffect, useRef, useState } from "react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { actionText, type ActionGame } from "@/lib/arcade/action";
import { themeEmojis } from "@/lib/arcade/content";
import { ArenaFrame, randBetween, useCountdown } from "@/components/games/action/arena";

type Phase = "wait" | "go" | "early";

/** Tempo de reação: toque assim que o sinal ficar verde. */
export function ReflexGame({ game, level, onComplete }: { game: ActionGame; level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();
  const bank = themeEmojis[game.theme];
  const seconds = 45;
  const goal = level >= 3 ? 10 : level === 2 ? 8 : 6;
  const [phase, setPhase] = useState<Phase>("wait");
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const [emoji, setEmoji] = useState(bank[0]!);
  const hitsRef = useRef(0);
  const missRef = useRef(0);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setRunning(false);
    playSfx("win");
    stage.react("done");
    const score = Math.max(10, hitsRef.current * 12 - missRef.current * 4);
    setTimeout(() => onComplete(score, tracker.getEvents()), 600);
  };

  const timeLeft = useCountdown(seconds, running, finish);

  useEffect(() => {
    if (!running) return;
    let id: ReturnType<typeof setTimeout>;
    if (phase === "wait") {
      id = setTimeout(() => {
        setEmoji(bank[Math.floor(Math.random() * bank.length)]!);
        setPhase("go");
        tracker.mark();
      }, randBetween(900, level >= 3 ? 2600 : 2000));
    } else if (phase === "early") {
      id = setTimeout(() => setPhase("wait"), 900);
    }
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, running]);

  const tap = () => {
    if (!running) return;
    if (phase === "go") {
      playSfx("hit");
      tracker.correct({ reflex: true });
      stage.react("correct");
      hitsRef.current += 1;
      setHits(hitsRef.current);
      if (hitsRef.current >= goal) finish();
      else setPhase("wait");
      return;
    }
    if (phase === "wait") {
      playSfx("miss");
      tracker.wrong({ early: true });
      stage.react("wrong", actionText(lang, "reflexEarly"));
      missRef.current += 1;
      setPhase("early");
    }
  };

  const prompt =
    phase === "go" ? actionText(lang, "reflexGo") : phase === "early" ? actionText(lang, "reflexEarly") : actionText(lang, "reflexWait");

  return (
    <ArenaFrame lang={lang} prompt={prompt} timeLeft={timeLeft} total={seconds} hits={hits}>
      <button
        onClick={() => speak(actionText(lang, "reflexWait"))}
        className="absolute top-3 left-3 z-10 rounded-full bg-card px-3 py-1 font-display text-sm shadow-card"
      >
        🔊
      </button>
      <button
        onPointerDown={tap}
        className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-colors ${
          phase === "go" ? "bg-zeno-green/45" : phase === "early" ? "bg-zeno-orange/35" : "bg-zeno-blue/15"
        }`}
      >
        <span className="text-8xl">{phase === "go" ? emoji : phase === "early" ? "🟠" : "🔴"}</span>
        <span className="font-display text-2xl">
          {hits}/{goal}
        </span>
      </button>
    </ArenaFrame>
  );
}
