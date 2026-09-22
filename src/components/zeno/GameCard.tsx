import { motion } from "motion/react";
import { portraitOf, type CatalogGame } from "@/lib/zeno";
import { categoryOf } from "@/lib/categories";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";

export function GameCard({
  game,
  level,
  index = 0,
  onPlay,
}: {
  game: CatalogGame;
  level: number;
  index?: number;
  onPlay: () => void;
}) {
  const t = useT();
  const category = categoryOf(game.slug);
  const title = game.customTitle ?? t(`game.${game.slug}.title` as TKey);
  const description = game.customInstruction ?? t(`game.${game.slug}.instruction` as TKey);

  return (
    <motion.button
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 22 }}
      whileTap={{ scale: 0.96 }}
      onClick={onPlay}
      className="group relative w-full overflow-hidden rounded-[2rem] text-left shadow-card"
    >
      <img
        src={category.scene}
        alt=""
        loading="lazy"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <span className={`absolute inset-0 opacity-80 mix-blend-multiply ${game.color}`} />
      <span className="pattern-stars absolute inset-0 opacity-20" />
      <span className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 text-white sm:gap-5 sm:p-5">
        <img
          src={portraitOf(game.character)}
          alt=""
          loading="lazy"
          width={256}
          height={256}
          className="h-20 w-20 shrink-0 rounded-full bg-card/40 object-cover ring-4 ring-white/70 sm:h-24 sm:w-24"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-2xl leading-none">{game.emoji}</span>
            <span className="truncate font-display text-2xl sm:text-3xl">{title}</span>
          </span>
          <span className="mt-1 block text-sm opacity-95 sm:text-base">{description}</span>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-xs font-semibold">
            📊 {t("games.levelBadge", { level })} · {t(`category.${category.id}` as TKey)}
          </span>

        </span>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card text-2xl text-zeno-blue shadow-card sm:h-14 sm:w-14">
          →
        </span>
      </span>
    </motion.button>
  );
}
