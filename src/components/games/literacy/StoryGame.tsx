import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useGameTracker, type GameCompleteFn } from "@/lib/gameTelemetry";
import { useGameStage } from "@/components/games/GameShell";
import { useI18n } from "@/lib/i18n";
import { playSfx, speak } from "@/lib/audio";
import { prompt, sample, storiesFor } from "@/lib/literacy/content";

/** História Interativa: o Zeno narra cada cena e a criança responde uma pergunta. */
export function StoryGame({ level, onComplete }: { level: number; onComplete: GameCompleteFn }) {
  const { lang } = useI18n();
  const tracker = useGameTracker();
  const stage = useGameStage();

  const story = useMemo(() => sample(storiesFor(lang), 1)[0]!, [lang]);
  const scenes = useMemo(
    () => story.scenes.slice(0, level >= 3 ? story.scenes.length : level === 2 ? Math.min(2, story.scenes.length) : 1 + 0),
    [story, level],
  );

  const [index, setIndex] = useState(0);
  const [asking, setAsking] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  const scene = scenes[index]!;

  useEffect(() => {
    setAsking(false);
    tracker.mark();
    stage.setProgress(index, scenes.length);
    const id = setTimeout(() => speak(scene.text), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const answer = (i: number) => {
    if (i !== scene.question.correct) {
      tracker.wrong({ scene: index, picked: scene.question.options[i] });
      stage.react("wrong", prompt(lang, "tryAgain"));
      setMisses((m) => m + 1);
      return;
    }
    playSfx("hit");
    tracker.correct({ scene: index });
    stage.react("correct", prompt(lang, "great"));
    const nextHits = hits + 1;
    setHits(nextHits);
    setTimeout(() => {
      if (index + 1 >= scenes.length) {
        stage.react("done", prompt(lang, "great"));
        onComplete(Math.max(10, Math.round((nextHits / scenes.length) * 100 - misses * 5)), tracker.getEvents());
      } else setIndex((v) => v + 1);
    }, 700);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <p className="text-center font-display text-xl text-muted-foreground sm:text-2xl">{story.title}</p>

      <motion.div
        key={index}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 rounded-[2rem] bg-card px-6 py-6 shadow-card"
      >
        <span className="text-7xl sm:text-8xl">{scene.emoji}</span>
        <p className="text-center font-display text-2xl leading-snug sm:text-3xl">{scene.text}</p>
        <button
          onClick={() => speak(scene.text)}
          className="rounded-full bg-secondary/60 px-5 py-2 font-display text-base active:scale-95"
        >
          🔊 {prompt(lang, "listen")}
        </button>
      </motion.div>

      {asking ? (
        <div className="flex flex-col gap-4">
          <p className="text-center font-display text-2xl">{scene.question.question}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {scene.question.options.map((option, i) => (
              <motion.button
                key={option}
                whileTap={{ scale: 0.95 }}
                onClick={() => answer(i)}
                className="min-h-[5rem] rounded-[1.75rem] bg-card px-4 py-4 font-display text-2xl shadow-card"
              >
                {option}
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={() => {
              playSfx("tap");
              setAsking(true);
              speak(scene.question.question);
            }}
            className="rounded-full bg-zeno-blue px-8 py-4 font-display text-xl text-white shadow-toy active:scale-95"
          >
            {prompt(lang, "continue")} →
          </button>
        </div>
      )}
    </div>
  );
}
