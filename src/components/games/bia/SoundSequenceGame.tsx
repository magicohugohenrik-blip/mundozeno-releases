import { useEffect, useMemo, useState } from "react";
import { Trophy, Volume2 } from "lucide-react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";

interface Props { onComplete: GameCompleteFn; }

/** Memória Auditiva — repita a sequência de sons. */
export const SoundSequenceGame = ({ onComplete }: Props) => {
  const tracker = useGameTracker();
  const stage = useGameStage();
  const { t } = useI18n();
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [messageKey, setMessageKey] = useState<TKey>("sound.listen");
  const [gameOver, setGameOver] = useState(false);

  const tones = useMemo(() => ["Do", "Ré", "Mi", "Fá"], []);

  const playTone = (index: number, duration = 400) => {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freqs = [261.63, 293.66, 329.63, 349.23];
    osc.frequency.value = freqs[index];
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  };

  const generateSequence = (len: number) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 4));
  };

  const startLevel = (lvl: number) => {
    const seq = generateSequence(lvl + 2);
    setSequence(seq);
    setPlayerSequence([]);
    setPlaying(true);
    setMessageKey("sound.listening");
    setGameOver(false);

    let i = 0;
    const playNext = () => {
      if (i >= seq.length) {
        setPlaying(false);
        setMessageKey("sound.yourTurn");
        return;
      }
      const toneIndex = seq[i]!;
      setHighlighted(toneIndex);
      playTone(toneIndex);
      setTimeout(() => {
        setHighlighted(null);
        i++;
        setTimeout(playNext, 150);
      }, 500);
    };
    setTimeout(playNext, 600);
  };

  useEffect(() => {
    stage.setProgress(level, 5);
  }, [level, stage]);

  useEffect(() => {
    startLevel(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePadClick = (index: number) => {
    if (playing || gameOver) return;
    playTone(index, 300);
    const newPlayerSeq = [...playerSequence, index];
    setPlayerSequence(newPlayerSeq);

    if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
      tracker.wrong({ level, pos: newPlayerSeq.length - 1 });
      stage.react("wrong", t("sound.wrong"));
      setGameOver(true);
      setMessageKey("sound.wrong");
      const score = Math.max(10, (level - 1) * 20);
      setTimeout(() => onComplete(score, tracker.getEvents()), 1500);
      return;
    }

    tracker.correct({ level, pos: newPlayerSeq.length - 1 });
    stage.react("correct", t("celebration.1"));

    if (newPlayerSeq.length === sequence.length) {
      if (level >= 5) {
        setGameOver(true);
        setMessageKey("sound.complete");
        stage.react("done", t("sound.complete"));
        setTimeout(() => onComplete(100, tracker.getEvents()), 1500);
      } else {
        setMessageKey("sound.next");
        setTimeout(() => {
          setLevel((l) => l + 1);
          startLevel(level + 1);
        }, 1200);
      }
    }
  };

  const colors = [
    "bg-red-400 border-red-500 hover:bg-red-500",
    "bg-amber-400 border-amber-500 hover:bg-amber-500",
    "bg-emerald-400 border-emerald-500 hover:bg-emerald-500",
    "bg-sky-400 border-zeno-blue hover:bg-sky-500",
  ];

  return (
    <div className="space-y-5 w-full">
      <div className="text-center space-y-1">
        <p className="font-display text-xl text-foreground text-lg">{t("sound.level", { level })}</p>
        <p className="text-sm text-muted-foreground">{t(messageKey)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tones.map((tone, i) => (
          <button
            key={i}
            onClick={() => handlePadClick(i)}
            disabled={playing || gameOver}
            className={`aspect-square rounded-3xl border-4 flex flex-col items-center justify-center text-white font-bold text-2xl transition-all ${colors[i]} ${
              highlighted === i ? "scale-110 brightness-125 shadow-lg" : "shadow-md"
            } ${(playing || gameOver) ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
          >
            <Volume2 className="w-8 h-8 mb-1" />
            <span className="text-sm">{tone}</span>
          </button>
        ))}
      </div>

      {gameOver && (
        <div className="bg-zeno-green/15 border-2 border-zeno-green rounded-[1.75rem] p-4 text-center font-display text-xl text-foreground inline-flex items-center justify-center gap-2 w-full">
          <Trophy className="w-5 h-5" /> {t(messageKey)}
        </div>
      )}
    </div>
  );
};
