/**
 * Jogos DINÂMICOS da Alfabetização (movimento, tempo e reflexo com letras).
 * Um jogo novo = uma linha em `dynamicRows` + um caso no LiteracyPlayer.
 */
import type { Lang } from "@/lib/i18n";

export type LiteracyDynamicEngine = "letter-pop" | "letter-catch" | "letter-whack";
export type LiteracyVariant = "letter" | "vowel" | "first" | "last" | "word";

export const literacyDynamicVariant: Record<string, LiteracyVariant> = {
  "alfa-d-bolhas-letras": "letter",
  "alfa-d-bolhas-vogais": "vowel",
  "alfa-d-cesta-inicial": "first",
  "alfa-d-cesta-final": "last",
  "alfa-d-toca-letras": "letter",
  "alfa-d-toca-palavra": "word",
};

type DynamicTextKey =
  | "popLetter"
  | "popVowel"
  | "catchFirst"
  | "catchLast"
  | "whackLetter"
  | "whackWord"
  | "nextLetter";

const TEXTS: Record<Lang, Record<DynamicTextKey, string>> = {
  pt: {
    popLetter: "Estoure só as bolhas com a letra {letter}!",
    popVowel: "Estoure só as bolhas com vogais (A E I O U)!",
    catchFirst: "Pegue na cesta a letra que começa a palavra!",
    catchLast: "Pegue na cesta a letra que termina a palavra!",
    whackLetter: "Toque só na letra {letter} quando ela aparecer!",
    whackWord: "Toque nas letras de {word} na ordem certa!",
    nextLetter: "Próxima letra",
  },
  en: {
    popLetter: "Pop only the bubbles with the letter {letter}!",
    popVowel: "Pop only the bubbles with vowels (A E I O U)!",
    catchFirst: "Catch the letter the word starts with!",
    catchLast: "Catch the letter the word ends with!",
    whackLetter: "Tap only the letter {letter} when it pops up!",
    whackWord: "Tap the letters of {word} in the right order!",
    nextLetter: "Next letter",
  },
  es: {
    popLetter: "¡Revienta solo las burbujas con la letra {letter}!",
    popVowel: "¡Revienta solo las burbujas con vocales (A E I O U)!",
    catchFirst: "¡Atrapa en la canasta la letra inicial de la palabra!",
    catchLast: "¡Atrapa en la canasta la letra final de la palabra!",
    whackLetter: "¡Toca solo la letra {letter} cuando aparezca!",
    whackWord: "¡Toca las letras de {word} en el orden correcto!",
    nextLetter: "Próxima letra",
  },
};

export function dynamicText(lang: Lang, key: DynamicTextKey, vars?: Record<string, string>): string {
  const raw = TEXTS[lang]?.[key] ?? TEXTS.pt[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}
