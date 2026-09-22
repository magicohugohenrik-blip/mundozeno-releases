/**
 * Conteúdo dos jogos gerais (não alfabetização): temas de emojis, cores,
 * formas e falas do Zeno em pt-BR, en-US e es-ES.
 * Novo tema = nova entrada aqui; nenhum componente precisa mudar.
 */
import type { Lang } from "@/lib/i18n";

export type ThemeId =
  | "animals"
  | "farm"
  | "sea"
  | "insects"
  | "birds"
  | "dino"
  | "fruits"
  | "food"
  | "vehicles"
  | "space"
  | "weather"
  | "sports"
  | "music"
  | "garden"
  | "toys";

export const themeEmojis: Record<ThemeId, string[]> = {
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"],
  farm: ["🐮", "🐷", "🐔", "🐴", "🐑", "🦆", "🐐", "🦃"],
  sea: ["🐟", "🐬", "🐳", "🦈", "🐙", "🦀", "🐚", "🦑"],
  insects: ["🐝", "🐛", "🦋", "🐞", "🐜", "🦗", "🪲", "🕸️"],
  birds: ["🦜", "🦉", "🦢", "🐦", "🦅", "🕊️", "🐧", "🦚"],
  dino: ["🦕", "🦖", "🐊", "🐢", "🦎", "🐍"],
  fruits: ["🍎", "🍌", "🍇", "🍓", "🍊", "🍉", "🍍", "🥝"],
  food: ["🍕", "🍔", "🍟", "🌭", "🥗", "🍞", "🧁", "🍪"],
  vehicles: ["🚗", "🚌", "🚑", "🚒", "🚕", "🚚", "🚜", "🏎️"],
  space: ["🚀", "🌟", "🪐", "🌙", "☄️", "👽", "🛸", "🔭"],
  weather: ["☀️", "🌧️", "⛈️", "🌈", "❄️", "🌪️", "🌤️", "🌊"],
  sports: ["⚽", "🏀", "🏈", "🎾", "🏐", "🏓", "🥎", "🏒"],
  music: ["🎸", "🥁", "🎻", "🎺", "🎹", "🎷", "🪘", "🪗"],
  garden: ["🌻", "🌷", "🌹", "🌼", "🌵", "🍀", "🌿", "🌸"],
  toys: ["🧸", "🪀", "🎈", "🎁", "🪁", "🧩", "🎨", "🚂"],
};

export const themeNames: Record<ThemeId, Record<Lang, string>> = {
  animals: { pt: "animais", en: "animals", es: "animales" },
  farm: { pt: "animais da fazenda", en: "farm animals", es: "animales de granja" },
  sea: { pt: "animais do mar", en: "sea animals", es: "animales del mar" },
  insects: { pt: "insetos", en: "insects", es: "insectos" },
  birds: { pt: "pássaros", en: "birds", es: "pájaros" },
  dino: { pt: "dinossauros", en: "dinosaurs", es: "dinosaurios" },
  fruits: { pt: "frutas", en: "fruits", es: "frutas" },
  food: { pt: "comidas", en: "food", es: "comidas" },
  vehicles: { pt: "veículos", en: "vehicles", es: "vehículos" },
  space: { pt: "coisas do espaço", en: "space things", es: "cosas del espacio" },
  weather: { pt: "coisas do tempo", en: "weather things", es: "cosas del clima" },
  sports: { pt: "esportes", en: "sports", es: "deportes" },
  music: { pt: "instrumentos", en: "instruments", es: "instrumentos" },
  garden: { pt: "flores e plantas", en: "flowers and plants", es: "flores y plantas" },
  toys: { pt: "brinquedos", en: "toys", es: "juguetes" },
};

export const colorItems: { emoji: string; name: Record<Lang, string> }[] = [
  { emoji: "🔴", name: { pt: "vermelho", en: "red", es: "rojo" } },
  { emoji: "🔵", name: { pt: "azul", en: "blue", es: "azul" } },
  { emoji: "🟢", name: { pt: "verde", en: "green", es: "verde" } },
  { emoji: "🟡", name: { pt: "amarelo", en: "yellow", es: "amarillo" } },
  { emoji: "🟣", name: { pt: "roxo", en: "purple", es: "morado" } },
  { emoji: "🟠", name: { pt: "laranja", en: "orange", es: "naranja" } },
  { emoji: "🟤", name: { pt: "marrom", en: "brown", es: "marrón" } },
  { emoji: "⚫", name: { pt: "preto", en: "black", es: "negro" } },
  { emoji: "⚪", name: { pt: "branco", en: "white", es: "blanco" } },
];

export const shapeItems: { emoji: string; name: Record<Lang, string> }[] = [
  { emoji: "🔵", name: { pt: "círculo", en: "circle", es: "círculo" } },
  { emoji: "🟦", name: { pt: "quadrado", en: "square", es: "cuadrado" } },
  { emoji: "🔺", name: { pt: "triângulo", en: "triangle", es: "triángulo" } },
  { emoji: "⭐", name: { pt: "estrela", en: "star", es: "estrella" } },
  { emoji: "❤️", name: { pt: "coração", en: "heart", es: "corazón" } },
  { emoji: "🔶", name: { pt: "losango", en: "diamond", es: "rombo" } },
];

export type ArcadePromptKey =
  | "count"
  | "odd"
  | "same"
  | "pattern"
  | "bigger"
  | "smaller"
  | "next"
  | "missing"
  | "sum"
  | "sub"
  | "moreOf"
  | "lessOf"
  | "themePick"
  | "colorPick"
  | "shapePick"
  | "shadow";

export const arcadePrompts: Record<Lang, Record<ArcadePromptKey, string>> = {
  pt: {
    count: "Quantos você vê?",
    odd: "Qual não combina?",
    same: "Encontre o igual.",
    pattern: "O que vem agora na sequência?",
    bigger: "Toque no número maior.",
    smaller: "Toque no número menor.",
    next: "Qual número vem depois?",
    missing: "Qual número está faltando?",
    sum: "Quanto é ao todo?",
    sub: "Quantos ficaram?",
    moreOf: "Qual grupo tem mais?",
    lessOf: "Qual grupo tem menos?",
    themePick: "Toque em {theme}.",
    colorPick: "Toque na cor {name}.",
    shapePick: "Toque no {name}.",
    shadow: "Qual sombra combina?",
  },
  en: {
    count: "How many do you see?",
    odd: "Which one does not belong?",
    same: "Find the same one.",
    pattern: "What comes next in the sequence?",
    bigger: "Tap the bigger number.",
    smaller: "Tap the smaller number.",
    next: "Which number comes next?",
    missing: "Which number is missing?",
    sum: "How many altogether?",
    sub: "How many are left?",
    moreOf: "Which group has more?",
    lessOf: "Which group has fewer?",
    themePick: "Tap the {theme}.",
    colorPick: "Tap the color {name}.",
    shapePick: "Tap the {name}.",
    shadow: "Which shadow matches?",
  },
  es: {
    count: "¿Cuántos ves?",
    odd: "¿Cuál no combina?",
    same: "Encuentra el igual.",
    pattern: "¿Qué sigue en la secuencia?",
    bigger: "Toca el número mayor.",
    smaller: "Toca el número menor.",
    next: "¿Qué número viene después?",
    missing: "¿Qué número falta?",
    sum: "¿Cuántos hay en total?",
    sub: "¿Cuántos quedaron?",
    moreOf: "¿Cuál grupo tiene más?",
    lessOf: "¿Cuál grupo tiene menos?",
    themePick: "Toca {theme}.",
    colorPick: "Toca el color {name}.",
    shapePick: "Toca el {name}.",
    shadow: "¿Cuál sombra combina?",
  },
};

export function arcadePrompt(lang: Lang, key: ArcadePromptKey, vars?: Record<string, string>): string {
  const raw = arcadePrompts[lang]?.[key] ?? arcadePrompts.pt[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

/**
 * Famílias semânticas: temas do mesmo grupo não podem virar distrator um do
 * outro (ex.: "🐮" da fazenda não pode contar como "não é animal").
 */
const themeFamilies: ThemeId[][] = [
  ["animals", "farm", "sea", "insects", "birds", "dino"],
  ["fruits", "food"],
  ["garden"],
  ["vehicles"],
  ["space", "weather"],
  ["sports", "toys"],
  ["music"],
];

function familyOf(theme: ThemeId): ThemeId[] {
  return themeFamilies.find((f) => f.includes(theme)) ?? [theme];
}

/** Emojis que com certeza NÃO pertencem ao tema (nem a temas irmãos). */
export function distractorEmojis(theme: ThemeId): string[] {
  const family = familyOf(theme);
  const own = new Set(family.flatMap((t) => themeEmojis[t]));
  return (Object.keys(themeEmojis) as ThemeId[])
    .filter((t) => !family.includes(t))
    .flatMap((t) => themeEmojis[t])
    .filter((e) => !own.has(e));
}
