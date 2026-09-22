/**
 * Conteúdo do aplicativo FonoPlay (pt-BR, en-US, es-ES).
 * Todo texto falado/escrito das atividades de fonoaudiologia vem daqui.
 */
import type { Lang } from "@/lib/i18n";

export interface FonoWord {
  word: string;
  emoji: string;
  /** Número de sílabas (usado no jogo de sílabas). */
  syllables: number;
  /** Categoria semântica (animal, comida, objeto, corpo, transporte). */
  category: FonoCategory;
  /** Som/letra inicial em maiúscula. */
  initial: string;
}

export type FonoCategory = "animal" | "comida" | "objeto" | "corpo" | "transporte";

export const fonoWords: Record<Lang, FonoWord[]> = {
  pt: [
    { word: "GATO", emoji: "🐱", syllables: 2, category: "animal", initial: "G" },
    { word: "PATO", emoji: "🦆", syllables: 2, category: "animal", initial: "P" },
    { word: "CAVALO", emoji: "🐴", syllables: 3, category: "animal", initial: "C" },
    { word: "MACACO", emoji: "🐵", syllables: 3, category: "animal", initial: "M" },
    { word: "SAPO", emoji: "🐸", syllables: 2, category: "animal", initial: "S" },
    { word: "BANANA", emoji: "🍌", syllables: 3, category: "comida", initial: "B" },
    { word: "BOLO", emoji: "🎂", syllables: 2, category: "comida", initial: "B" },
    { word: "MACA", emoji: "🍎", syllables: 2, category: "comida", initial: "M" },
    { word: "PAO", emoji: "🍞", syllables: 1, category: "comida", initial: "P" },
    { word: "UVA", emoji: "🍇", syllables: 2, category: "comida", initial: "U" },
    { word: "BOLA", emoji: "⚽", syllables: 2, category: "objeto", initial: "B" },
    { word: "CHAVE", emoji: "🔑", syllables: 2, category: "objeto", initial: "C" },
    { word: "LIVRO", emoji: "📕", syllables: 2, category: "objeto", initial: "L" },
    { word: "FACA", emoji: "🔪", syllables: 2, category: "objeto", initial: "F" },
    { word: "MAO", emoji: "✋", syllables: 1, category: "corpo", initial: "M" },
    { word: "PE", emoji: "🦶", syllables: 1, category: "corpo", initial: "P" },
    { word: "OLHO", emoji: "👁️", syllables: 2, category: "corpo", initial: "O" },
    { word: "BOCA", emoji: "👄", syllables: 2, category: "corpo", initial: "B" },
    { word: "CARRO", emoji: "🚗", syllables: 2, category: "transporte", initial: "C" },
    { word: "AVIAO", emoji: "✈️", syllables: 3, category: "transporte", initial: "A" },
    { word: "BARCO", emoji: "⛵", syllables: 2, category: "transporte", initial: "B" },
    { word: "TREM", emoji: "🚆", syllables: 1, category: "transporte", initial: "T" },
  ],
  en: [
    { word: "CAT", emoji: "🐱", syllables: 1, category: "animal", initial: "C" },
    { word: "DUCK", emoji: "🦆", syllables: 1, category: "animal", initial: "D" },
    { word: "HORSE", emoji: "🐴", syllables: 1, category: "animal", initial: "H" },
    { word: "MONKEY", emoji: "🐵", syllables: 2, category: "animal", initial: "M" },
    { word: "FROG", emoji: "🐸", syllables: 1, category: "animal", initial: "F" },
    { word: "BANANA", emoji: "🍌", syllables: 3, category: "comida", initial: "B" },
    { word: "CAKE", emoji: "🎂", syllables: 1, category: "comida", initial: "C" },
    { word: "APPLE", emoji: "🍎", syllables: 2, category: "comida", initial: "A" },
    { word: "BREAD", emoji: "🍞", syllables: 1, category: "comida", initial: "B" },
    { word: "GRAPE", emoji: "🍇", syllables: 1, category: "comida", initial: "G" },
    { word: "BALL", emoji: "⚽", syllables: 1, category: "objeto", initial: "B" },
    { word: "KEY", emoji: "🔑", syllables: 1, category: "objeto", initial: "K" },
    { word: "BOOK", emoji: "📕", syllables: 1, category: "objeto", initial: "B" },
    { word: "KNIFE", emoji: "🔪", syllables: 1, category: "objeto", initial: "K" },
    { word: "HAND", emoji: "✋", syllables: 1, category: "corpo", initial: "H" },
    { word: "FOOT", emoji: "🦶", syllables: 1, category: "corpo", initial: "F" },
    { word: "EYE", emoji: "👁️", syllables: 1, category: "corpo", initial: "E" },
    { word: "MOUTH", emoji: "👄", syllables: 1, category: "corpo", initial: "M" },
    { word: "CAR", emoji: "🚗", syllables: 1, category: "transporte", initial: "C" },
    { word: "PLANE", emoji: "✈️", syllables: 1, category: "transporte", initial: "P" },
    { word: "BOAT", emoji: "⛵", syllables: 1, category: "transporte", initial: "B" },
    { word: "TRAIN", emoji: "🚆", syllables: 1, category: "transporte", initial: "T" },
  ],
  es: [
    { word: "GATO", emoji: "🐱", syllables: 2, category: "animal", initial: "G" },
    { word: "PATO", emoji: "🦆", syllables: 2, category: "animal", initial: "P" },
    { word: "CABALLO", emoji: "🐴", syllables: 3, category: "animal", initial: "C" },
    { word: "MONO", emoji: "🐵", syllables: 2, category: "animal", initial: "M" },
    { word: "RANA", emoji: "🐸", syllables: 2, category: "animal", initial: "R" },
    { word: "BANANA", emoji: "🍌", syllables: 3, category: "comida", initial: "B" },
    { word: "PASTEL", emoji: "🎂", syllables: 2, category: "comida", initial: "P" },
    { word: "MANZANA", emoji: "🍎", syllables: 3, category: "comida", initial: "M" },
    { word: "PAN", emoji: "🍞", syllables: 1, category: "comida", initial: "P" },
    { word: "UVA", emoji: "🍇", syllables: 2, category: "comida", initial: "U" },
    { word: "PELOTA", emoji: "⚽", syllables: 3, category: "objeto", initial: "P" },
    { word: "LLAVE", emoji: "🔑", syllables: 2, category: "objeto", initial: "L" },
    { word: "LIBRO", emoji: "📕", syllables: 2, category: "objeto", initial: "L" },
    { word: "CUCHILLO", emoji: "🔪", syllables: 3, category: "objeto", initial: "C" },
    { word: "MANO", emoji: "✋", syllables: 2, category: "corpo", initial: "M" },
    { word: "PIE", emoji: "🦶", syllables: 1, category: "corpo", initial: "P" },
    { word: "OJO", emoji: "👁️", syllables: 2, category: "corpo", initial: "O" },
    { word: "BOCA", emoji: "👄", syllables: 2, category: "corpo", initial: "B" },
    { word: "COCHE", emoji: "🚗", syllables: 2, category: "transporte", initial: "C" },
    { word: "AVION", emoji: "✈️", syllables: 3, category: "transporte", initial: "A" },
    { word: "BARCO", emoji: "⛵", syllables: 2, category: "transporte", initial: "B" },
    { word: "TREN", emoji: "🚆", syllables: 1, category: "transporte", initial: "T" },
  ],
};

export function fonoWordsFor(lang: Lang): FonoWord[] {
  return fonoWords[lang] ?? fonoWords.pt;
}

/** Pares mínimos: palavras que mudam por um único som. */
export interface MinimalPair {
  a: FonoWord;
  b: FonoWord;
}

const w = (word: string, emoji: string, initial: string, syllables = 2): FonoWord => ({
  word,
  emoji,
  syllables,
  category: "objeto",
  initial,
});

export const minimalPairs: Record<Lang, MinimalPair[]> = {
  pt: [
    { a: w("FACA", "🔪", "F"), b: w("VACA", "🐄", "V") },
    { a: w("PATO", "🦆", "P"), b: w("GATO", "🐱", "G") },
    { a: w("BOLA", "⚽", "B"), b: w("BOLO", "🎂", "B") },
    { a: w("CASA", "🏠", "C"), b: w("CAsA", "🏠", "C") },
    { a: w("MALA", "🧳", "M"), b: w("MOLA", "🌀", "M") },
    { a: w("DADO", "🎲", "D"), b: w("DEDO", "🫵", "D") },
    { a: w("PEIXE", "🐟", "P"), b: w("QUEIJO", "🧀", "Q") },
    { a: w("SINO", "🔔", "S"), b: w("PINO", "📍", "P") },
  ],
  en: [
    { a: w("FAN", "🌀", "F", 1), b: w("VAN", "🚐", "V", 1) },
    { a: w("CAT", "🐱", "C", 1), b: w("HAT", "🎩", "H", 1) },
    { a: w("BALL", "⚽", "B", 1), b: w("BELL", "🔔", "B", 1) },
    { a: w("SHEEP", "🐑", "S", 1), b: w("SHIP", "🚢", "S", 1) },
    { a: w("PEAR", "🍐", "P", 1), b: w("BEAR", "🐻", "B", 1) },
    { a: w("MOUSE", "🐭", "M", 1), b: w("HOUSE", "🏠", "H", 1) },
    { a: w("SUN", "☀️", "S", 1), b: w("SON", "👦", "S", 1) },
    { a: w("KEY", "🔑", "K", 1), b: w("TEA", "🍵", "T", 1) },
  ],
  es: [
    { a: w("PATO", "🦆", "P"), b: w("GATO", "🐱", "G") },
    { a: w("CASA", "🏠", "C"), b: w("TAZA", "🍵", "T") },
    { a: w("PERA", "🍐", "P"), b: w("PERRO", "🐶", "P") },
    { a: w("MANO", "✋", "M"), b: w("MONO", "🐵", "M") },
    { a: w("SILLA", "🪑", "S"), b: w("SILBA", "😗", "S") },
    { a: w("DADO", "🎲", "D"), b: w("DEDO", "🫵", "D") },
    { a: w("VELA", "🕯️", "V"), b: w("BELLA", "🌸", "B") },
    { a: w("LUNA", "🌙", "L"), b: w("CUNA", "🛏️", "C") },
  ],
};

export function minimalPairsFor(lang: Lang): MinimalPair[] {
  return minimalPairs[lang] ?? minimalPairs.pt;
}

/** Exercícios de praxia oral: o Zeno mostra e a criança imita. */
export interface Praxia {
  emoji: string;
  seconds: number;
  label: Record<Lang, string>;
}

export const praxias: Praxia[] = [
  {
    emoji: "😛",
    seconds: 5,
    label: { pt: "Coloque a língua para fora", en: "Stick your tongue out", es: "Saca la lengua" },
  },
  {
    emoji: "😗",
    seconds: 5,
    label: { pt: "Faça biquinho de beijo", en: "Make a kiss face", es: "Haz un beso" },
  },
  {
    emoji: "😁",
    seconds: 5,
    label: { pt: "Sorria bem grande", en: "Smile really big", es: "Sonríe muy grande" },
  },
  {
    emoji: "😮",
    seconds: 5,
    label: { pt: "Abra bem a boca", en: "Open your mouth wide", es: "Abre bien la boca" },
  },
  {
    emoji: "🫦",
    seconds: 5,
    label: { pt: "Estale a língua: tec, tec", en: "Click your tongue: tick, tick", es: "Chasquea la lengua" },
  },
  {
    emoji: "🎈",
    seconds: 5,
    label: { pt: "Encha as bochechas de ar", en: "Puff your cheeks with air", es: "Infla los cachetes" },
  },
  {
    emoji: "🤪",
    seconds: 5,
    label: { pt: "Passe a língua nos lábios", en: "Lick around your lips", es: "Pasa la lengua por los labios" },
  },
  {
    emoji: "😝",
    seconds: 5,
    label: { pt: "Toque a língua no nariz", en: "Touch your nose with the tongue", es: "Toca la nariz con la lengua" },
  },
];

/** Sons usados na memória auditiva (nome falado + emoji). */
export const soundBank: Record<Lang, { emoji: string; name: string }[]> = {
  pt: [
    { emoji: "🐶", name: "au au" },
    { emoji: "🐱", name: "miau" },
    { emoji: "🐄", name: "muu" },
    { emoji: "🐔", name: "co co" },
    { emoji: "🚗", name: "brum" },
    { emoji: "🔔", name: "tim tim" },
  ],
  en: [
    { emoji: "🐶", name: "woof" },
    { emoji: "🐱", name: "meow" },
    { emoji: "🐄", name: "moo" },
    { emoji: "🐔", name: "cluck" },
    { emoji: "🚗", name: "vroom" },
    { emoji: "🔔", name: "ding" },
  ],
  es: [
    { emoji: "🐶", name: "guau" },
    { emoji: "🐱", name: "miau" },
    { emoji: "🐄", name: "muu" },
    { emoji: "🐔", name: "co co" },
    { emoji: "🚗", name: "brum" },
    { emoji: "🔔", name: "tilín" },
  ],
};

export type FonoPromptKey =
  | "listen"
  | "great"
  | "tryAgain"
  | "startSound"
  | "whichWord"
  | "howManySyllables"
  | "nameIt"
  | "whichCategory"
  | "whichDifferent"
  | "followOrder"
  | "repeatAfter"
  | "yourTurn"
  | "blowNow"
  | "blowTouch"
  | "micDenied"
  | "holdPose"
  | "nextPose"
  | "done";

export const fonoPrompts: Record<Lang, Record<FonoPromptKey, string>> = {
  pt: {
    listen: "Ouvir de novo",
    great: "Isso mesmo!",
    tryAgain: "Quase! Vamos de novo.",
    startSound: "Qual começa com o som {sound}?",
    whichWord: "Toque na figura que eu falei: {word}",
    howManySyllables: "Quantas sílabas tem {word}?",
    nameIt: "Como se chama esta figura?",
    whichCategory: "Qual destes é {category}?",
    whichDifferent: "Qual som é diferente?",
    followOrder: "Toque na ordem que você ouviu",
    repeatAfter: "Repita comigo",
    yourTurn: "Sua vez!",
    blowNow: "Sopre no microfone!",
    blowTouch: "Toque rápido para soprar",
    micDenied: "Sem microfone: dá para tocar na tela.",
    holdPose: "Segure por {seconds} segundos",
    nextPose: "Consegui!",
    done: "Atividade concluída!",
  },
  en: {
    listen: "Listen again",
    great: "That's it!",
    tryAgain: "Almost! Let's try again.",
    startSound: "Which one starts with the {sound} sound?",
    whichWord: "Tap the picture I said: {word}",
    howManySyllables: "How many syllables in {word}?",
    nameIt: "What is this picture called?",
    whichCategory: "Which one is a {category}?",
    whichDifferent: "Which sound is different?",
    followOrder: "Tap in the order you heard",
    repeatAfter: "Repeat after me",
    yourTurn: "Your turn!",
    blowNow: "Blow into the microphone!",
    blowTouch: "Tap fast to blow",
    micDenied: "No microphone: you can tap the screen.",
    holdPose: "Hold for {seconds} seconds",
    nextPose: "Done it!",
    done: "Activity complete!",
  },
  es: {
    listen: "Escuchar otra vez",
    great: "¡Muy bien!",
    tryAgain: "¡Casi! Vamos de nuevo.",
    startSound: "¿Cuál empieza con el sonido {sound}?",
    whichWord: "Toca la figura que dije: {word}",
    howManySyllables: "¿Cuántas sílabas tiene {word}?",
    nameIt: "¿Cómo se llama esta figura?",
    whichCategory: "¿Cuál es {category}?",
    whichDifferent: "¿Cuál sonido es diferente?",
    followOrder: "Toca en el orden que escuchaste",
    repeatAfter: "Repite conmigo",
    yourTurn: "¡Tu turno!",
    blowNow: "¡Sopla en el micrófono!",
    blowTouch: "Toca rápido para soplar",
    micDenied: "Sin micrófono: puedes tocar la pantalla.",
    holdPose: "Sostén por {seconds} segundos",
    nextPose: "¡Conseguí!",
    done: "¡Actividad completada!",
  },
};

export function fonoPrompt(lang: Lang, key: FonoPromptKey, vars?: Record<string, string>): string {
  let text = (fonoPrompts[lang] ?? fonoPrompts.pt)[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, v);
  return text;
}

export const categoryNames: Record<Lang, Record<FonoCategory, string>> = {
  pt: { animal: "animal", comida: "comida", objeto: "objeto", corpo: "parte do corpo", transporte: "transporte" },
  en: { animal: "animal", comida: "food", objeto: "object", corpo: "body part", transporte: "vehicle" },
  es: { animal: "animal", comida: "comida", objeto: "objeto", corpo: "parte del cuerpo", transporte: "transporte" },
};

export function fonoShuffle<T>(list: T[]): T[] {
  return [...list].sort(() => Math.random() - 0.5);
}

export function fonoSample<T>(list: T[], n: number): T[] {
  return fonoShuffle(list).slice(0, n);
}
