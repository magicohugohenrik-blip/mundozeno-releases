import { useMemo, useRef } from "react";
import type { GameEvent } from "@/lib/gameTelemetry";
import type { GameResult } from "@/lib/zeno";
import { MemoryGame as ZenoMemoryGame } from "@/components/games/MemoryGame";
import { ShapeGame } from "@/components/games/ShapeGame";
import { ColorMatchGame } from "@/components/games/bia/ColorMatchGame";
import { RingStackGame } from "@/components/games/bia/RingStackGame";
import { SoundSequenceGame } from "@/components/games/bia/SoundSequenceGame";
import { PuzzleGame } from "@/components/games/bia/PuzzleGame";
import { PaintGame } from "@/components/games/bia/PaintGame";
import { DrawGame } from "@/components/games/bia/DrawGame";
import { CountGame, MemoryGame, OddOneOutGame, PatternGame } from "@/components/games/bia/ClassicGames";
import { LiteracyPlayer } from "@/components/games/literacy/LiteracyPlayer";
import { isLiteracy } from "@/lib/literacy/catalog";
import { ChoiceActivity } from "@/components/games/literacy/ChoiceActivity";
import { isArcade } from "@/lib/arcade/catalog";
import { buildArcadeRounds } from "@/lib/arcade/rounds";
import { isAction } from "@/lib/arcade/action";
import { ActionPlayer } from "@/components/games/action/ActionPlayer";
import { isFono } from "@/lib/fono/catalog";
import { FonoPlayer } from "@/components/games/fono/FonoPlayer";

import { avatarCharacters } from "@/lib/zeno";

const MEMORY_FACES = avatarCharacters.map((c) => ({ key: c.id, image: c.image, label: c.name }));

export function GamePlayer({
  slug,
  level,
  config,
  onFinish,
}: {
  slug: string;
  level: number;
  config?: { count?: number } | undefined;
  onFinish: (r: GameResult) => void;
}) {
  const started = useRef(Date.now());

  const complete = useMemo(
    () => (score: number, events?: GameEvent[]) => {
      const list = events ?? [];
      const hits = list.filter((e) => e.event_type === "correct").length;
      const misses = list.filter((e) => e.event_type === "wrong").length;
      onFinish({
        score,
        hits,
        misses,
        durationSeconds: Math.max(1, Math.round((Date.now() - started.current) / 1000)),
        events: list,
      });
    },
    [onFinish],
  );

  if (isAction(slug)) {
    return <ActionPlayer slug={slug} level={level} onComplete={complete} />;
  }
  if (isFono(slug)) {
    return <FonoPlayer slug={slug} level={level} onComplete={complete} />;
  }

  if (isArcade(slug)) {

    return <ChoiceActivity slug={slug} level={level} onComplete={complete} builder={buildArcadeRounds} />;
  }

  if (isLiteracy(slug)) {
    return <LiteracyPlayer slug={slug} level={level} onComplete={complete} />;
  }

  switch (slug) {
    case "memoria-turma":
      return (
        <MemoryGame
          faces={MEMORY_FACES.slice(0, Math.min(MEMORY_FACES.length, config?.count ?? 2 + level))}
          onComplete={complete}
        />
      );
    case "cores-em-acao":
      return <ColorMatchGame onComplete={complete} />;
    case "formas-e-encaixes":
      return <ShapeGame level={level} onFinish={onFinish} />;
    case "quebra-cabeca-zeno":
      return <PuzzleGame onComplete={complete} size={(config?.count ?? (level <= 1 ? 2 : 3)) >= 3 ? 3 : 2} />;
    case "torre-de-argolas":
      return <RingStackGame onComplete={complete} />;
    case "sons-em-sequencia":
      return <SoundSequenceGame onComplete={complete} />;
    case "quantos-tem":
      return <CountGame onComplete={complete} />;
    case "qual-nao-combina":
      return <OddOneOutGame onComplete={complete} />;
    case "sequencia-magica":
      return <PatternGame onComplete={complete} />;
    case "pintura-da-turma":
      return <PaintGame onComplete={complete} />;
    case "desenho-livre":
      return <DrawGame onComplete={complete} />;
    default:
      return <ZenoMemoryGame level={level} onFinish={onFinish} />;
  }
}
