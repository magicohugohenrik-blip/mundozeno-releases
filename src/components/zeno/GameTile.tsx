import { motion } from "motion/react";
import type { CatalogGame } from "@/lib/zeno";
import { categoryOf } from "@/lib/categories";
import { gameArt, tintOf } from "@/lib/gameArt";
import { GameCover } from "@/components/zeno/GameCover";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";

/** Cartão do jogo: ilustração da atividade, nome e categoria. */
export function GameTile({
  game,
  index = 0,
  onPlay,
}: {
  game: CatalogGame;
  index?: number;
  onPlay: () => void;
}) {
  const t = useT();
  const category = categoryOf(game.slug);
  const title = game.customTitle ?? t(`game.${game.slug}.title` as TKey);
  const categoryLabel = t(`category.${category.id}` as TKey);
  const illustration = gameArt[game.slug];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 280, damping: 22 }}
      whileTap={{ scale: 0.94 }}
      onClick={onPlay}
      aria-label={title}
      title={title}
      className="flex w-full flex-col gap-2 rounded-[1.75rem] bg-card p-2.5 text-left shadow-card"
    >
      <span className={`block overflow-hidden rounded-[1.25rem] ${illustration ? tintOf(game.slug) : ""}`}>
        {illustration ? (
          <img
            src={illustration}
            alt=""
            loading="lazy"
            width={512}
            height={512}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <GameCover slug={game.slug} emoji={game.emoji} />
        )}
      </span>

      <span className="flex flex-col px-1 pb-1">
        <span className="line-clamp-2 font-display text-sm leading-tight text-foreground sm:text-base">{title}</span>
        <span className="line-clamp-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
          {categoryLabel}
        </span>
      </span>
    </motion.button>
  );
}
