import type { GameCompleteFn } from "@/lib/gameTelemetry";
import { fonoBySlug } from "@/lib/fono/catalog";
import { buildFonoRounds } from "@/lib/fono/rounds";
import { ChoiceActivity } from "@/components/games/literacy/ChoiceActivity";
import { PraxiaGame } from "@/components/games/fono/PraxiaGame";
import { BlowGame } from "@/components/games/fono/BlowGame";
import { SoundMemoryGame } from "@/components/games/fono/SoundMemoryGame";

/** Roteador dos motores do FonoPlay — novas atividades entram pelo catálogo. */
export function FonoPlayer({
  slug,
  level,
  onComplete,
}: {
  slug: string;
  level: number;
  onComplete: GameCompleteFn;
}) {
  const activity = fonoBySlug(slug);
  const capped = Math.min(Math.max(1, level), activity?.maxLevel ?? 3);

  switch (activity?.engine) {
    case "praxia":
      return <PraxiaGame slug={slug} level={capped} onComplete={onComplete} />;
    case "blow":
      return <BlowGame slug={slug} level={capped} onComplete={onComplete} />;
    case "audio-memory":
      return <SoundMemoryGame level={capped} onComplete={onComplete} />;
    default:
      return <ChoiceActivity slug={slug} level={capped} onComplete={onComplete} builder={buildFonoRounds} />;
  }
}
