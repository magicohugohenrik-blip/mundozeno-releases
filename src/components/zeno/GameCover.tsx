import { coverStyle, type PatternId } from "@/lib/coverArt";

/** Fundo decorativo único por jogo (padrão + cores derivados do slug). */
function Pattern({ id, kind, ink }: { id: string; kind: PatternId; ink: string }) {
  const common = { fill: ink, opacity: 0.16 } as const;
  switch (kind) {
    case "dots":
      return (
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2.4" {...common} />
        </pattern>
      );
    case "stripes":
      return (
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="7" height="16" {...common} />
        </pattern>
      );
    case "waves":
      return (
        <pattern id={id} width="24" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 10 Q6 2 12 10 T24 10" fill="none" stroke={ink} strokeWidth="2.6" opacity="0.18" />
        </pattern>
      );
    case "grid":
      return (
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M18 0H0V18" fill="none" stroke={ink} strokeWidth="2" opacity="0.16" />
        </pattern>
      );
    case "rays":
      return (
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
          <path d="M11 0V22" stroke={ink} strokeWidth="3" opacity="0.14" />
        </pattern>
      );
    case "confetti":
      return (
        <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <rect x="2" y="3" width="6" height="3" rx="1.5" {...common} />
          <rect x="15" y="14" width="6" height="3" rx="1.5" {...common} />
        </pattern>
      );
    case "arcs":
      return (
        <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 20 A10 10 0 0 1 20 20" fill="none" stroke={ink} strokeWidth="2.4" opacity="0.16" />
        </pattern>
      );
    case "bubbles":
      return (
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="5" fill="none" stroke={ink} strokeWidth="2" opacity="0.18" />
          <circle cx="21" cy="20" r="2.6" {...common} />
        </pattern>
      );
  }
}




/** Capa gerada do jogo: forma, cores e padrão exclusivos + ícone do jogo. */
export function GameCover({ slug, emoji, className = "" }: { slug: string; emoji: string; className?: string }) {
  const style = coverStyle(slug);
  const uid = `cv-${slug.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <span className={`relative block aspect-square w-full overflow-hidden ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={style.from} />
            <stop offset="100%" stopColor={style.to} />
          </linearGradient>
          <Pattern id={`${uid}-p`} kind={style.pattern} ink={style.ink} />
        </defs>
        <rect width="100" height="100" fill={`url(#${uid}-g)`} />
        <rect width="100" height="100" fill={`url(#${uid}-p)`} />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[2.9rem] leading-none sm:text-6xl"
        style={{
          transform: `rotate(${style.rotation / 2}deg)`,
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.28))",
        }}
      >
        {emoji}
      </span>

    </span>
  );
}
