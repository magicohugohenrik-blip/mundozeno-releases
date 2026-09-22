import type { GameCompleteFn } from "@/lib/gameTelemetry";
import { actionBySlug } from "@/lib/arcade/action";
import { PopGame } from "@/components/games/action/PopGame";
import { WhackGame } from "@/components/games/action/WhackGame";
import { CatchGame } from "@/components/games/action/CatchGame";
import { SortGame } from "@/components/games/action/SortGame";
import { ReflexGame } from "@/components/games/action/ReflexGame";
import { ChaseGame } from "@/components/games/action/ChaseGame";

/** Roteador dos motores dinâmicos — jogo novo entra pelo catálogo. */
export function ActionPlayer({
  slug,
  level,
  onComplete,
}: {
  slug: string;
  level: number;
  onComplete: GameCompleteFn;
}) {
  const game = actionBySlug(slug);
  if (!game) return null;
  const capped = Math.min(Math.max(1, level), 3);

  switch (game.kind) {
    case "pop":
      return <PopGame game={game} level={capped} onComplete={onComplete} />;
    case "whack":
      return <WhackGame game={game} level={capped} onComplete={onComplete} />;
    case "catch":
      return <CatchGame game={game} level={capped} onComplete={onComplete} />;
    case "sort":
      return <SortGame game={game} level={capped} onComplete={onComplete} />;
    case "reflex":
      return <ReflexGame game={game} level={capped} onComplete={onComplete} />;
    case "chase":
      return <ChaseGame game={game} level={capped} onComplete={onComplete} />;
  }
}
