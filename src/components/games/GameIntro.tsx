import { useEffect } from "react";
import { motion } from "motion/react";
import zenoImg from "@/assets/zeno.png";
import { useI18n } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";
import type { CatalogGame } from "@/lib/zeno";

/** Transição animada com o Zeno dançando antes de abrir cada jogo. */
export function GameIntro({
  game,
  onDone,
  duration = 1900,
}: {
  game: CatalogGame;
  onDone: () => void;
  duration?: number;
}) {
  const { t } = useI18n();
  const title = t(`game.${game.slug}.title` as TKey);

  useEffect(() => {
    const id = setTimeout(onDone, duration);
    return () => clearTimeout(id);
  }, [onDone, duration]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="surface-wood pattern-stars flex h-full w-full flex-col items-center justify-center gap-6 p-6"
    >
      <motion.img
        src={zenoImg}
        alt="Zeno"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="animate-dance h-40 w-40 object-contain drop-shadow-xl sm:h-56 sm:w-56"
      />
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="rounded-[1.75rem] bg-card/90 px-8 py-4 text-center shadow-card backdrop-blur"
      >
        <p className="font-display text-sm uppercase tracking-wide text-muted-foreground">{t("intro.getReady")}</p>
        <p className="font-display text-2xl sm:text-3xl">{title}</p>
      </motion.div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-3 w-3 rounded-full bg-zeno-green"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
