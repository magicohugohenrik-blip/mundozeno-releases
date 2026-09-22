/**
 * Conteúdo da área de Alfabetização (pt-BR, en-US, es-ES).
 * Todo texto falado/escrito dos jogos vem daqui — para adicionar novas
 * palavras ou histórias basta editar este arquivo.
 */
import type { Lang } from "@/lib/i18n";

export interface WordItem {
  word: string;
  emoji: string;
}

/** Palavras sem acento, adequadas à faixa etária. */
export const words: Record<Lang, WordItem[]> = {
  pt: [
    { word: "GATO", emoji: "🐱" },
    { word: "BOLA", emoji: "⚽" },
    { word: "CASA", emoji: "🏠" },
    { word: "PATO", emoji: "🦆" },
    { word: "BOLO", emoji: "🎂" },
    { word: "SAPO", emoji: "🐸" },
    { word: "FLOR", emoji: "🌸" },
    { word: "SOL", emoji: "☀️" },
    { word: "LUA", emoji: "🌙" },
    { word: "PEIXE", emoji: "🐟" },
    { word: "ABELHA", emoji: "🐝" },
    { word: "UVA", emoji: "🍇" },
    { word: "ELEFANTE", emoji: "🐘" },
    { word: "IGLU", emoji: "🧊" },
    { word: "OVO", emoji: "🥚" },
    { word: "CARRO", emoji: "🚗" },
  ],
  en: [
    { word: "CAT", emoji: "🐱" },
    { word: "BALL", emoji: "⚽" },
    { word: "HOUSE", emoji: "🏠" },
    { word: "DUCK", emoji: "🦆" },
    { word: "CAKE", emoji: "🎂" },
    { word: "FROG", emoji: "🐸" },
    { word: "FLOWER", emoji: "🌸" },
    { word: "SUN", emoji: "☀️" },
    { word: "MOON", emoji: "🌙" },
    { word: "FISH", emoji: "🐟" },
    { word: "BEE", emoji: "🐝" },
    { word: "APPLE", emoji: "🍎" },
    { word: "ELEPHANT", emoji: "🐘" },
    { word: "IGLOO", emoji: "🧊" },
    { word: "EGG", emoji: "🥚" },
    { word: "CAR", emoji: "🚗" },
  ],
  es: [
    { word: "GATO", emoji: "🐱" },
    { word: "PELOTA", emoji: "⚽" },
    { word: "CASA", emoji: "🏠" },
    { word: "PATO", emoji: "🦆" },
    { word: "PASTEL", emoji: "🎂" },
    { word: "RANA", emoji: "🐸" },
    { word: "FLOR", emoji: "🌸" },
    { word: "SOL", emoji: "☀️" },
    { word: "LUNA", emoji: "🌙" },
    { word: "PEZ", emoji: "🐟" },
    { word: "ABEJA", emoji: "🐝" },
    { word: "UVA", emoji: "🍇" },
    { word: "ELEFANTE", emoji: "🐘" },
    { word: "IGLU", emoji: "🧊" },
    { word: "HUEVO", emoji: "🥚" },
    { word: "COCHE", emoji: "🚗" },
  ],
};

export const vowels = ["A", "E", "I", "O", "U"];

export const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type PromptKey =
  | "findLetter"
  | "whichLetter"
  | "firstSound"
  | "completeWord"
  | "wordToImage"
  | "imageToWord"
  | "buildWord"
  | "buildHint"
  | "orderPrompt"
  | "memoryPrompt"
  | "vowelPrompt"
  | "lastLetter"
  | "rhyme"
  | "countLetters"
  | "syllables"
  | "matchCase"
  | "nextLetter"
  | "prevLetter"
  | "startsWith"
  | "correctSpelling"
  | "vowelAmong"
  | "signLetter"
  | "letterSign"
  | "signNumber"
  | "numberSign"
  | "signWord"
  | "listen"
  | "check"
  | "clear"
  | "continue"
  | "tryAgain"
  | "great";

export const prompts: Record<Lang, Record<PromptKey, string>> = {
  pt: {
    findLetter: "Encontre a letra {letter}.",
    whichLetter: "Com qual letra começa?",
    firstSound: "Qual é o primeiro som de {word}?",
    completeWord: "Complete a palavra.",
    wordToImage: "Qual imagem é {word}?",
    imageToWord: "Qual palavra combina com a imagem?",
    buildWord: "Monte a palavra tocando nas letras.",
    buildHint: "Toque nas letras na ordem certa.",
    orderPrompt: "Coloque as letras na ordem do alfabeto.",
    memoryPrompt: "Encontre os pares de letras.",
    vowelPrompt: "Vamos brincar com as vogais!",
    listen: "Ouvir de novo",
    check: "Conferir",
    clear: "Apagar",
    continue: "Continuar",
    tryAgain: "Quase! Vamos tentar novamente?",
    great: "Muito bem!",
    lastLetter: "Com qual letra termina?",
    rhyme: "Qual palavra rima com {word}?",
    countLetters: "Quantas letras tem {word}?",
    syllables: "Quantas sílabas tem {word}?",
    matchCase: "Toque na letra {letter} pequenininha.",
    nextLetter: "Qual letra vem depois do {letter}?",
    prevLetter: "Qual letra vem antes do {letter}?",
    startsWith: "Qual palavra começa com {letter}?",
    correctSpelling: "Qual palavra está escrita certinho?",
    vowelAmong: "Toque na vogal.",
    signLetter: "Qual letra é este sinal em Libras?",
    letterSign: "Qual sinal representa a letra {letter}?",
    signNumber: "Qual número é este sinal em Libras?",
    numberSign: "Qual sinal representa o número {letter}?",
    signWord: "Com qual letra {word} começa? Toque no sinal.",
  },
  en: {
    findLetter: "Find the letter {letter}.",
    whichLetter: "Which letter does it start with?",
    firstSound: "What is the first sound of {word}?",
    completeWord: "Complete the word.",
    wordToImage: "Which picture is {word}?",
    imageToWord: "Which word matches the picture?",
    buildWord: "Build the word by tapping the letters.",
    buildHint: "Tap the letters in the right order.",
    orderPrompt: "Put the letters in alphabet order.",
    memoryPrompt: "Find the letter pairs.",
    vowelPrompt: "Let's play with the vowels!",
    listen: "Listen again",
    check: "Check",
    clear: "Erase",
    continue: "Continue",
    tryAgain: "Almost! Shall we try again?",
    great: "Well done!",
    lastLetter: "Which letter does it end with?",
    rhyme: "Which word rhymes with {word}?",
    countLetters: "How many letters does {word} have?",
    syllables: "How many syllables does {word} have?",
    matchCase: "Tap the small letter {letter}.",
    nextLetter: "Which letter comes after {letter}?",
    prevLetter: "Which letter comes before {letter}?",
    startsWith: "Which word starts with {letter}?",
    correctSpelling: "Which word is spelled correctly?",
    vowelAmong: "Tap the vowel.",
    signLetter: "Which letter is this sign?",
    letterSign: "Which sign shows the letter {letter}?",
    signNumber: "Which number is this sign?",
    numberSign: "Which sign shows the number {letter}?",
    signWord: "Which letter does {word} start with? Tap the sign.",
  },
  es: {
    findLetter: "Encuentra la letra {letter}.",
    whichLetter: "¿Con qué letra empieza?",
    firstSound: "¿Cuál es el primer sonido de {word}?",
    completeWord: "Completa la palabra.",
    wordToImage: "¿Cuál imagen es {word}?",
    imageToWord: "¿Qué palabra combina con la imagen?",
    buildWord: "Forma la palabra tocando las letras.",
    buildHint: "Toca las letras en el orden correcto.",
    orderPrompt: "Coloca las letras en orden del alfabeto.",
    memoryPrompt: "Encuentra los pares de letras.",
    vowelPrompt: "¡Vamos a jugar con las vocales!",
    listen: "Escuchar otra vez",
    check: "Revisar",
    clear: "Borrar",
    continue: "Continuar",
    tryAgain: "¡Casi! ¿Intentamos otra vez?",
    great: "¡Muy bien!",
    lastLetter: "¿Con qué letra termina?",
    rhyme: "¿Qué palabra rima con {word}?",
    countLetters: "¿Cuántas letras tiene {word}?",
    syllables: "¿Cuántas sílabas tiene {word}?",
    matchCase: "Toca la letra {letter} pequeñita.",
    nextLetter: "¿Qué letra viene después de {letter}?",
    prevLetter: "¿Qué letra viene antes de {letter}?",
    startsWith: "¿Qué palabra empieza con {letter}?",
    correctSpelling: "¿Qué palabra está bien escrita?",
    vowelAmong: "Toca la vocal.",
    signLetter: "¿Qué letra es esta seña?",
    letterSign: "¿Qué seña representa la letra {letter}?",
    signNumber: "¿Qué número es esta seña?",
    numberSign: "¿Qué seña representa el número {letter}?",
    signWord: "¿Con qué letra empieza {word}? Toca la seña.",
  },
};

export function prompt(lang: Lang, key: PromptKey, vars?: Record<string, string>): string {
  const raw = prompts[lang]?.[key] ?? prompts.pt[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

export interface StoryQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface StoryScene {
  emoji: string;
  text: string;
  question: StoryQuestion;
}

export interface Story {
  title: string;
  scenes: StoryScene[];
}

export const stories: Record<Lang, Story[]> = {
  pt: [
    {
      title: "O passeio do Zeno",
      scenes: [
        {
          emoji: "🤖",
          text: "O Zeno acordou animado e saiu para passear no parque.",
          question: { question: "Para onde o Zeno foi?", options: ["Parque", "Escola", "Praia"], correct: 0 },
        },
        {
          emoji: "🐝",
          text: "No caminho ele encontrou uma abelha zumbindo perto das flores.",
          question: { question: "Quem o Zeno encontrou?", options: ["Um gato", "Uma abelha", "Um pato"], correct: 1 },
        },
        {
          emoji: "⚽",
          text: "Depois o Zeno brincou de bola com a turma até o sol se despedir.",
          question: { question: "Com o que eles brincaram?", options: ["Bola", "Balde", "Boneca"], correct: 0 },
        },
      ],
    },
  ],
  en: [
    {
      title: "Zeno's walk",
      scenes: [
        {
          emoji: "🤖",
          text: "Zeno woke up happy and went for a walk in the park.",
          question: { question: "Where did Zeno go?", options: ["Park", "School", "Beach"], correct: 0 },
        },
        {
          emoji: "🐝",
          text: "On the way he met a bee buzzing near the flowers.",
          question: { question: "Who did Zeno meet?", options: ["A cat", "A bee", "A duck"], correct: 1 },
        },
        {
          emoji: "⚽",
          text: "Then Zeno played ball with his friends until sunset.",
          question: { question: "What did they play with?", options: ["A ball", "A bucket", "A doll"], correct: 0 },
        },
      ],
    },
  ],
  es: [
    {
      title: "El paseo de Zeno",
      scenes: [
        {
          emoji: "🤖",
          text: "Zeno se despertó contento y salió a pasear al parque.",
          question: { question: "¿A dónde fue Zeno?", options: ["Parque", "Escuela", "Playa"], correct: 0 },
        },
        {
          emoji: "🐝",
          text: "En el camino encontró una abeja zumbando entre las flores.",
          question: { question: "¿A quién encontró Zeno?", options: ["Un gato", "Una abeja", "Un pato"], correct: 1 },
        },
        {
          emoji: "⚽",
          text: "Después Zeno jugó a la pelota con sus amigos hasta el atardecer.",
          question: { question: "¿Con qué jugaron?", options: ["Pelota", "Cubo", "Muñeca"], correct: 0 },
        },
      ],
    },
  ],
};

export function wordsFor(lang: Lang): WordItem[] {
  return words[lang] ?? words.pt;
}

export function storiesFor(lang: Lang): Story[] {
  return stories[lang] ?? stories.pt;
}

export function shuffle<T>(list: T[]): T[] {
  return [...list].sort(() => Math.random() - 0.5);
}

export function sample<T>(list: T[], n: number): T[] {
  return shuffle(list).slice(0, n);
}
