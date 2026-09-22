/**
 * Capas geradas por slug: cada jogo recebe uma combinação única de cores,
 * padrão de fundo e moldura, para a criança reconhecer o jogo pela imagem.
 * Nada de aleatório em runtime — tudo derivado do slug (sempre igual).
 */

export interface CoverStyle {
  from: string;
  to: string;
  ink: string;
  pattern: PatternId;
  rotation: number;
  shape: ShapeId;
}

export type PatternId = "dots" | "stripes" | "waves" | "grid" | "rays" | "confetti" | "arcs" | "bubbles";
export type ShapeId = "blob" | "circle" | "rounded" | "star" | "hex" | "flower";

const palettes: { from: string; to: string; ink: string }[] = [
  { from: "#8ED2FF", to: "#3F8CFF", ink: "#0B3E86" },
  { from: "#A8F0C6", to: "#38C97F", ink: "#0C5B39" },
  { from: "#FFD79A", to: "#FF9F43", ink: "#8A4408" },
  { from: "#E3C4FF", to: "#9B5DE5", ink: "#4A1A7A" },
  { from: "#FFC2DD", to: "#FF6FA8", ink: "#8A1B4A" },
  { from: "#FFF0A3", to: "#FFC93C", ink: "#7A5300" },
  { from: "#B9F1F0", to: "#37BFC0", ink: "#08514F" },
  { from: "#FFBFB0", to: "#FF6F5E", ink: "#8A2415" },
  { from: "#CFE0FF", to: "#6C7DFF", ink: "#2A2F80" },
  { from: "#D8F5A2", to: "#8CC63F", ink: "#3F5B10" },
];

const patterns: PatternId[] = ["dots", "stripes", "waves", "grid", "rays", "confetti", "arcs", "bubbles"];
const shapes: ShapeId[] = ["blob", "circle", "rounded", "star", "hex", "flower"];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function coverStyle(slug: string): CoverStyle {
  const h = hash(slug);
  const palette = palettes[h % palettes.length]!;
  return {
    ...palette,
    pattern: patterns[Math.floor(h / 7) % patterns.length]!,
    shape: shapes[Math.floor(h / 31) % shapes.length]!,
    rotation: ((Math.floor(h / 11) % 13) - 6) * 1.4,
  };
}
