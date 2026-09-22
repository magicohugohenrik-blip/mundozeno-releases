import type { HandSpec } from "@/lib/libras/HandSign";

/**
 * Configurações de mão do alfabeto manual e dos números em Libras.
 * Cada símbolo é descrito por dados; o desenho é gerado por `HandSign`.
 */
export const letterSigns: Record<string, HandSpec> = {
  A: { fingers: ["down", "down", "down", "down"], thumb: "side" },
  B: { fingers: ["up", "up", "up", "up"], thumb: "across" },
  C: { fingers: ["curl", "curl", "curl", "curl"], thumb: "in", shape: "c" },
  D: { fingers: ["up", "curl", "curl", "curl"], thumb: "touch" },
  E: { fingers: ["curl", "curl", "curl", "curl"], thumb: "in" },
  F: { fingers: ["curl", "up", "up", "up"], thumb: "touch" },
  G: { fingers: ["up", "down", "down", "down"], thumb: "out", rotate: 90 },
  H: { fingers: ["up", "up", "down", "down"], thumb: "in", rotate: 90 },
  I: { fingers: ["down", "down", "down", "up"], thumb: "in" },
  J: { fingers: ["down", "down", "down", "up"], thumb: "in", motion: "j" },
  K: { fingers: ["up", "up", "down", "down"], thumb: "between", spread: true },
  L: { fingers: ["up", "down", "down", "down"], thumb: "out" },
  M: { fingers: ["down", "down", "down", "half"], thumb: "in" },
  N: { fingers: ["down", "down", "half", "half"], thumb: "in" },
  O: { fingers: ["curl", "curl", "curl", "curl"], thumb: "in", shape: "o" },
  P: { fingers: ["up", "up", "down", "down"], thumb: "between", spread: true, rotate: 150 },
  Q: { fingers: ["up", "down", "down", "down"], thumb: "out", rotate: 165 },
  R: { fingers: ["up", "up", "down", "down"], thumb: "in", shape: "cross" },
  S: { fingers: ["down", "down", "down", "down"], thumb: "across" },
  T: { fingers: ["down", "down", "down", "down"], thumb: "between" },
  U: { fingers: ["up", "up", "down", "down"], thumb: "in" },
  V: { fingers: ["up", "up", "down", "down"], thumb: "in", spread: true },
  W: { fingers: ["up", "up", "up", "down"], thumb: "in", spread: true },
  X: { fingers: ["half", "down", "down", "down"], thumb: "in" },
  Y: { fingers: ["down", "down", "down", "up"], thumb: "out" },
  Z: { fingers: ["up", "down", "down", "down"], thumb: "in", motion: "z" },
};

/**
 * Números em Libras. De 6 a 9 o polegar toca a ponta de cada dedo
 * (mínimo, anelar, médio e indicador) com a mão fechada; o 10 leva
 * movimento do polegar. Há variação regional documentada nesses números.
 */
export const numberSigns: Record<string, HandSpec> = {
  "0": { fingers: ["curl", "curl", "curl", "curl"], thumb: "in", shape: "o" },
  "1": { fingers: ["up", "down", "down", "down"], thumb: "in" },
  "2": { fingers: ["up", "up", "down", "down"], thumb: "in", spread: true },
  "3": { fingers: ["up", "up", "up", "down"], thumb: "in", spread: true },
  "4": { fingers: ["up", "up", "up", "up"], thumb: "in" },
  "5": { fingers: ["up", "up", "up", "up"], thumb: "out", spread: true },
  "6": { fingers: ["down", "down", "down", "curl"], thumb: "touch" },
  "7": { fingers: ["down", "down", "curl", "down"], thumb: "touch" },
  "8": { fingers: ["down", "curl", "down", "down"], thumb: "touch" },
  "9": { fingers: ["curl", "down", "down", "down"], thumb: "touch" },
  "10": { fingers: ["down", "down", "down", "down"], thumb: "up", motion: "z" },
};

export const alphabetLetters = Object.keys(letterSigns);
export const numberKeys = Object.keys(numberSigns);

export function signFor(symbol: string): HandSpec | undefined {
  return letterSigns[symbol] ?? numberSigns[symbol];
}

/** Palavras do dia a dia soletradas em Libras (datilologia). */
export interface SignWord {
  word: Record<"pt" | "en" | "es", string>;
  emoji: string;
  /** Letras mostradas em sequência. */
  spell: string;
}

export const signWords: SignWord[] = [
  { word: { pt: "OI", en: "HI", es: "HOLA" }, emoji: "👋", spell: "OI" },
  { word: { pt: "MAE", en: "MOM", es: "MAMA" }, emoji: "👩", spell: "MAE" },
  { word: { pt: "PAI", en: "DAD", es: "PAPA" }, emoji: "👨", spell: "PAI" },
  { word: { pt: "CASA", en: "HOUSE", es: "CASA" }, emoji: "🏠", spell: "CASA" },
  { word: { pt: "AGUA", en: "WATER", es: "AGUA" }, emoji: "💧", spell: "AGUA" },
  { word: { pt: "AMIGO", en: "FRIEND", es: "AMIGO" }, emoji: "🤝", spell: "AMIGO" },
  { word: { pt: "GATO", en: "CAT", es: "GATO" }, emoji: "🐱", spell: "GATO" },
  { word: { pt: "BOLA", en: "BALL", es: "PELOTA" }, emoji: "⚽", spell: "BOLA" },
  { word: { pt: "SOL", en: "SUN", es: "SOL" }, emoji: "☀️", spell: "SOL" },
  { word: { pt: "LUA", en: "MOON", es: "LUNA" }, emoji: "🌙", spell: "LUA" },
  { word: { pt: "ESCOLA", en: "SCHOOL", es: "ESCUELA" }, emoji: "🏫", spell: "ESCOLA" },
  { word: { pt: "AMOR", en: "LOVE", es: "AMOR" }, emoji: "❤️", spell: "AMOR" },
];
