import { coverBackground, coverIcon, coverStyle } from "@/lib/coverArt";

/**
 * Capa gerada do jogo: fundo em CSS puro + ícone vetorial.
 * Sem SVG por referência interna e sem emoji, para aparecer igual
 * no site e na mesa Windows, com ou sem internet.
 */
export function GameCover({ slug, className = "" }: { slug: string; emoji?: string; className?: string }) {
  const style = coverStyle(slug);
  const Icon = coverIcon(slug);

  return (
    <span
      className={`relative block aspect-square w-full overflow-hidden ${className}`}
      style={{ background: coverBackground(style) }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${style.rotation / 2}deg)` }}
      >
        <Icon
          className="h-[46%] w-[46%]"
          strokeWidth={1.9}
          color="#ffffff"
          style={{ filter: `drop-shadow(0 3px 6px ${style.ink}66)` }}
          aria-hidden="true"
        />
      </span>
    </span>
  );
}
