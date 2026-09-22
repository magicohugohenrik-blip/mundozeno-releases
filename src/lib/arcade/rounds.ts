/**
 * Geradores de rodadas dos jogos gerais (motor de escolha reutilizável).
 * Cada "kind" do catálogo tem um caso aqui — nenhum componente novo é preciso.
 */
import type { Lang } from "@/lib/i18n";
import { sample, shuffle } from "@/lib/literacy/content";
import type { ChoiceOption, ChoiceRound } from "@/lib/literacy/rounds";
import { arcadeBySlug, type ArcadeKind } from "@/lib/arcade/catalog";
import {
  arcadePrompt,
  colorItems,
  shapeItems,
  themeEmojis,
  themeNames,
  distractorEmojis,
  type ThemeId,
} from "@/lib/arcade/content";

function optionCount(level: number): number {
  return level >= 3 ? 6 : level === 2 ? 4 : 3;
}

function roundsCount(level: number): number {
  return level >= 3 ? 8 : level === 2 ? 6 : 5;
}

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function repeat(emoji: string, n: number): string {
  return Array.from({ length: n }, () => emoji).join("");
}

function otherThemes(theme: ThemeId): string[] {
  return distractorEmojis(theme);
}

/** Opções numéricas em volta da resposta certa. */
function numberOptions(correct: number, level: number, floor = 0): ChoiceOption[] {
  const pool = new Set<number>([correct]);
  let guard = 0;
  while (pool.size < optionCount(level) && guard++ < 50) {
    const candidate = correct + rand(-3, 3);
    if (candidate >= floor) pool.add(candidate);
  }
  return shuffle([...pool]).map((n) => ({ label: String(n) }));
}

function indexOfLabel(options: ChoiceOption[], label: string): number {
  return options.findIndex((o) => o.label === label);
}

function buildRound(kind: ArcadeKind, theme: ThemeId, level: number, lang: Lang, i: number): ChoiceRound {
  const bank = themeEmojis[theme];
  const emoji = sample(bank, 1)[0]!;
  const maxCount = level >= 3 ? 12 : level === 2 ? 9 : 5;

  switch (kind) {
    case "count": {
      const n = rand(1, maxCount);
      const options = numberOptions(n, level, 1);
      return {
        prompt: arcadePrompt(lang, "count"),
        showText: repeat(emoji, n),
        options,
        correct: indexOfLabel(options, String(n)),
      };
    }
    case "sum": {
      const a = rand(1, level >= 3 ? 6 : 3);
      const b = rand(1, level >= 3 ? 6 : 3);
      const options = numberOptions(a + b, level, 1);
      return {
        prompt: arcadePrompt(lang, "sum"),
        showText: `${repeat(emoji, a)} + ${repeat(emoji, b)}`,
        options,
        correct: indexOfLabel(options, String(a + b)),
      };
    }
    case "sub": {
      const a = rand(2, level >= 3 ? 10 : 5);
      const b = rand(1, a - 1);
      const options = numberOptions(a - b, level, 0);
      return {
        prompt: arcadePrompt(lang, "sub"),
        showText: `${repeat(emoji, a)} − ${repeat(emoji, b)}`,
        options,
        correct: indexOfLabel(options, String(a - b)),
      };
    }
    case "bigger":
    case "smaller": {
      const max = level >= 3 ? 50 : level === 2 ? 20 : 10;
      const pool = new Set<number>();
      while (pool.size < Math.min(optionCount(level), max)) pool.add(rand(1, max));
      const numbers = [...pool];
      const target = kind === "bigger" ? Math.max(...numbers) : Math.min(...numbers);
      const options = shuffle(numbers).map((n) => ({ label: String(n) }));
      return {
        prompt: arcadePrompt(lang, kind),
        options,
        correct: indexOfLabel(options, String(target)),
      };
    }
    case "next": {
      const start = rand(1, level >= 3 ? 20 : 8);
      const target = start + 3;
      const options = numberOptions(target, level, 1);
      return {
        prompt: arcadePrompt(lang, "next"),
        showText: `${start}  ${start + 1}  ${start + 2}  ?`,
        options,
        correct: indexOfLabel(options, String(target)),
      };
    }
    case "missing": {
      const start = rand(1, level >= 3 ? 20 : 8);
      const target = start + 1;
      const options = numberOptions(target, level, 1);
      return {
        prompt: arcadePrompt(lang, "missing"),
        showText: `${start}  ?  ${start + 2}`,
        options,
        correct: indexOfLabel(options, String(target)),
      };
    }
    case "moreOf":
    case "lessOf": {
      const total = Math.min(optionCount(level), 4);
      const counts = new Set<number>();
      while (counts.size < total) counts.add(rand(1, level >= 3 ? 9 : 6));
      const list = [...counts];
      const target = kind === "moreOf" ? Math.max(...list) : Math.min(...list);
      const options = shuffle(list).map((n) => ({ label: repeat(emoji, n) }));
      return {
        prompt: arcadePrompt(lang, kind),
        options,
        correct: indexOfLabel(options, repeat(emoji, target)),
      };
    }
    case "same": {
      const others = sample(
        bank.filter((e) => e !== emoji),
        optionCount(level) - 1,
      );
      const options = shuffle([emoji, ...others]).map((e) => ({ emoji: e }));
      return {
        prompt: arcadePrompt(lang, "same"),
        showEmoji: emoji,
        options,
        correct: options.findIndex((o) => o.emoji === emoji),
      };
    }
    case "pattern": {
      const [a, b] = sample(bank, 2) as [string, string];
      const useTriple = level >= 3;
      const cycle = useTriple ? [a, b, b] : [a, b];
      const length = useTriple ? 6 : 5;
      const sequence = Array.from({ length }, (_, k) => cycle[k % cycle.length]!);
      const target = cycle[length % cycle.length]!;
      const others = sample(
        bank.filter((e) => e !== target),
        optionCount(level) - 1,
      );
      const options = shuffle([target, ...others]).map((e) => ({ emoji: e }));
      return {
        prompt: arcadePrompt(lang, "pattern"),
        showText: `${sequence.join(" ")} ?`,
        options,
        correct: options.findIndex((o) => o.emoji === target),
      };
    }
    case "odd": {
      const group = sample(bank, optionCount(level) - 1);
      const intruder = sample(otherThemes(theme), 1)[0]!;
      const options = shuffle([...group, intruder]).map((e) => ({ emoji: e }));
      return {
        prompt: arcadePrompt(lang, "odd"),
        options,
        correct: options.findIndex((o) => o.emoji === intruder),
      };
    }
    case "themePick": {
      const distractors = sample(otherThemes(theme), optionCount(level) - 1);
      const options = shuffle([emoji, ...distractors]).map((e) => ({ emoji: e }));
      return {
        prompt: arcadePrompt(lang, "themePick", { theme: themeNames[theme][lang] ?? themeNames[theme].pt }),
        options,
        correct: options.findIndex((o) => o.emoji === emoji),
      };
    }
    case "colorPick":
    case "shapePick": {
      const items = kind === "colorPick" ? colorItems : shapeItems;
      const picks = sample(items, Math.min(optionCount(level), items.length));
      const target = picks[i % picks.length]!;
      const options = shuffle(picks).map((it) => ({ emoji: it.emoji }));
      return {
        prompt: arcadePrompt(lang, kind, { name: target.name[lang] ?? target.name.pt }),
        options,
        correct: options.findIndex((o) => o.emoji === target.emoji),
      };
    }
  }
}

export function buildArcadeRounds(slug: string, level: number, lang: Lang): ChoiceRound[] {
  const game = arcadeBySlug(slug);
  if (!game) return [];
  return Array.from({ length: roundsCount(level) }, (_, i) => buildRound(game.kind, game.theme, level, lang, i));
}
