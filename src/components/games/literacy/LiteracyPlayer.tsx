import type { GameCompleteFn } from "@/lib/gameTelemetry";
import { literacyBySlug } from "@/lib/literacy/catalog";
import { literacyDynamicVariant } from "@/lib/literacy/dynamic";
import { ChoiceActivity } from "@/components/games/literacy/ChoiceActivity";
import { BuildWordGame } from "@/components/games/literacy/BuildWordGame";
import { LetterMemoryGame } from "@/components/games/literacy/LetterMemoryGame";
import { AlphabetOrderGame } from "@/components/games/literacy/AlphabetOrderGame";
import { StoryGame } from "@/components/games/literacy/StoryGame";
import { LetterPopGame } from "@/components/games/literacy/dynamic/LetterPopGame";
import { LetterCatchGame } from "@/components/games/literacy/dynamic/LetterCatchGame";
import { LetterWhackGame } from "@/components/games/literacy/dynamic/LetterWhackGame";

/** Roteador dos motores de alfabetização — novos jogos entram pelo catálogo. */
export function LiteracyPlayer({
  slug,
  level,
  onComplete,
}: {
  slug: string;
  level: number;
  onComplete: GameCompleteFn;
}) {
  const activity = literacyBySlug(slug);
  const capped = Math.min(Math.max(1, level), activity?.maxLevel ?? 3);
  const variant = literacyDynamicVariant[slug] ?? "letter";

  switch (activity?.engine) {
    case "build":
      return <BuildWordGame level={capped} onComplete={onComplete} />;
    case "memory":
      return <LetterMemoryGame level={capped} onComplete={onComplete} />;
    case "order":
      return <AlphabetOrderGame level={capped} onComplete={onComplete} />;
    case "story":
      return <StoryGame level={capped} onComplete={onComplete} />;
    case "letter-pop":
      return <LetterPopGame variant={variant} level={capped} onComplete={onComplete} />;
    case "letter-catch":
      return <LetterCatchGame variant={variant} level={capped} onComplete={onComplete} />;
    case "letter-whack":
      return <LetterWhackGame variant={variant} level={capped} onComplete={onComplete} />;
    default:
      return <ChoiceActivity slug={slug} level={capped} onComplete={onComplete} />;
  }
}
