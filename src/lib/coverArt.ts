/**
 * Capas geradas por slug: cada jogo recebe uma combinação única de cores,
 * padrão de fundo e ícone, para a criança reconhecer o jogo pela imagem.
 * Nada de aleatório em runtime — tudo derivado do slug (sempre igual).
 * Só CSS e ícones vetoriais: funciona igual no site e na mesa sem internet.
 */
import {
  Apple,
  Bird,
  Bone,
  BookA,
  Brain,
  Bug,
  Calculator,
  Car,
  Carrot,
  Cake,
  CircleDot,
  Cloud,
  Copy,
  Equal,
  Fish,
  Flag,
  Flower2,
  Gamepad2,
  Hand,
  Hash,
  Heart,
  Layers,
  Leaf,
  ListOrdered,
  Minus,
  Music,
  PaintBucket,
  Palette,
  PawPrint,
  Pencil,
  Plus,
  Puzzle,
  Rocket,
  Ruler,
  Search,
  Shapes,
  ShoppingBasket,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Truck,
  Type,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

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

/** Fundo da capa em CSS puro (sem SVG): funciona no site e na mesa offline. */
export function coverBackground(style: CoverStyle): string {
  const base = `linear-gradient(135deg, ${style.from} 0%, ${style.to} 100%)`;
  const ink = (alpha: number) => hexWithAlpha(style.ink, alpha);
  switch (style.pattern) {
    case "dots":
      return `radial-gradient(${ink(0.2)} 18%, transparent 19%) 0 0/22px 22px, ${base}`;
    case "stripes":
      return `repeating-linear-gradient(35deg, ${ink(0.16)} 0 8px, transparent 8px 20px), ${base}`;
    case "waves":
      return `radial-gradient(circle at 50% 120%, ${ink(0.18)} 22%, transparent 23%) 0 0/28px 18px, ${base}`;
    case "grid":
      return `repeating-linear-gradient(0deg, ${ink(0.14)} 0 2px, transparent 2px 22px), repeating-linear-gradient(90deg, ${ink(0.14)} 0 2px, transparent 2px 22px), ${base}`;
    case "rays":
      return `repeating-linear-gradient(20deg, ${ink(0.14)} 0 3px, transparent 3px 24px), ${base}`;
    case "confetti":
      return `repeating-linear-gradient(15deg, ${ink(0.18)} 0 6px, transparent 6px 26px), radial-gradient(${ink(0.14)} 14%, transparent 15%) 12px 12px/30px 30px, ${base}`;
    case "arcs":
      return `radial-gradient(circle at 50% 100%, transparent 38%, ${ink(0.16)} 39%, ${ink(0.16)} 45%, transparent 46%) 0 0/26px 26px, ${base}`;
    case "bubbles":
      return `radial-gradient(circle at 30% 30%, transparent 30%, ${ink(0.18)} 31%, ${ink(0.18)} 38%, transparent 39%) 0 0/32px 32px, radial-gradient(${ink(0.16)} 12%, transparent 13%) 20px 22px/32px 32px, ${base}`;
  }
}

function hexWithAlpha(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Ícone vetorial da capa, escolhido por palavras do nome interno do jogo. */
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/foguete|espac|rocket/, Rocket],
  [/corrida|largada|reflexo|sports/, Flag],
  [/fruta|maca|apple/, Apple],
  [/legume|verdura|horta/, Carrot],
  [/mar|peix|fundo-do-mar|pesca/, Fish],
  [/inseto|bicho/, Bug],
  [/passar|passaros|aves/, Bird],
  [/veicul|carro/, Car],
  [/caminh|transporte/, Truck],
  [/animais|animal|fazenda/, PawPrint],
  [/cachorro|osso/, Bone],
  [/cesta|piquenique|compras/, ShoppingBasket],
  [/doce|bolo|comida|receita/, Cake],
  [/balao|bolha|estoura/, CircleDot],
  [/brinquedo|toca|pega/, Gamepad2],
  [/memoria|lembr/, Brain],
  [/quebra-cabeca|puzzle|encaixe/, Puzzle],
  [/forma|shape/, Shapes],
  [/cor|pintura|tinta/, Palette],
  [/pinta|colorir/, PaintBucket],
  [/desenho|risco|traco/, Pencil],
  [/letra|alfabeto|silaba|palavra/, BookA],
  [/letr|texto|fonte/, Type],
  [/soma|mais|plus/, Plus],
  [/sub|menos|sobrar/, Minus],
  [/conta|conte|quantos|numero/, Calculator],
  [/igual|mesmo|combina/, Equal],
  [/sequencia|ordem|depois|antes/, ListOrdered],
  [/maior|menor|tamanho/, Ruler],
  [/falta|escondi|procura|acha/, Search],
  [/som|musica|audio|ritmo/, Music],
  [/tempo|rapido|cronometro/, Timer],
  [/sopro|ar|nuvem|vento/, Cloud],
  [/mao|dedo|toque|praxia/, Hand],
  [/flor|jardim|planta/, Flower2],
  [/folha|natureza/, Leaf],
  [/agua|onda/, Waves],
  [/coracao|amor|emocao/, Heart],
  [/estrela|star/, Star],
  [/troféu|trofeu|conquista|premio/, Trophy],
  [/copia|duplo|par/, Copy],
  [/camada|pilha|argola|torre/, Layers],
  [/energia|raio|choque/, Zap],
  [/magic|magia|brilho/, Sparkles],
  [/numeros|logica/, Hash],
];

const FALLBACKS: LucideIcon[] = [Star, Sparkles, Shapes, Palette, Brain, Gamepad2, Puzzle, Rocket];

export function coverIcon(slug: string): LucideIcon {
  const key = slug.toLowerCase();
  for (const [re, icon] of ICON_RULES) if (re.test(key)) return icon;
  return FALLBACKS[hash(slug) % FALLBACKS.length]!;
}
