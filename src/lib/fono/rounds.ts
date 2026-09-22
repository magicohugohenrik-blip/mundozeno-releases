/**
 * Geradores de rodadas das atividades de escolha do FonoPlay.
 * Um jogo novo do tipo escolha só precisa de um caso novo aqui.
 */
import type { Lang } from "@/lib/i18n";
import type { ChoiceRound } from "@/lib/literacy/rounds";
import {
  categoryNames,
  fonoPrompt,
  fonoSample,
  fonoShuffle,
  fonoWordsFor,
  minimalPairsFor,
  type FonoCategory,
  type FonoWord,
} from "@/lib/fono/content";

function optionCount(level: number): number {
  return level >= 3 ? 6 : level === 2 ? 4 : 3;
}

function roundsCount(level: number): number {
  return level >= 3 ? 8 : level === 2 ? 6 : 5;
}

export function buildFonoRounds(slug: string, level: number, lang: Lang): ChoiceRound[] {
  const bank = fonoWordsFor(lang);
  const total = roundsCount(level);
  const opts = optionCount(level);

  switch (slug) {
    case "fono-som-inicial": {
      return Array.from({ length: total }, () => {
        const target = fonoSample(bank, 1)[0]!;
        const others = fonoSample(
          bank.filter((x) => x.initial !== target.initial),
          Math.max(1, opts - 1),
        );
        const options = fonoShuffle([target, ...others]);
        return {
          prompt: fonoPrompt(lang, "startSound", { sound: target.initial }),
          speak: fonoPrompt(lang, "startSound", { sound: target.initial }),
          options: options.map((o) => ({ emoji: o.emoji })),
          correct: options.indexOf(target),
        };
      });
    }

    case "fono-pares-minimos": {
      const pairs = minimalPairsFor(lang);
      return Array.from({ length: total }, () => {
        const pair = fonoSample(pairs, 1)[0]!;
        const target = Math.random() < 0.5 ? pair.a : pair.b;
        const options = fonoShuffle([pair.a, pair.b]);
        return {
          prompt: fonoPrompt(lang, "whichWord", { word: target.word }),
          speak: target.word,
          options: options.map((o) => ({ emoji: o.emoji })),
          correct: options.indexOf(target),
        };
      });
    }

    case "fono-silabas": {
      const pool = level === 1 ? bank.filter((x) => x.syllables <= 2) : bank;
      return Array.from({ length: total }, () => {
        const target = fonoSample(pool, 1)[0]!;
        const numbers = [1, 2, 3, 4];
        return {
          prompt: fonoPrompt(lang, "howManySyllables", { word: target.word }),
          speak: target.word,
          showEmoji: target.emoji,
          showText: target.word,
          options: numbers.map((n) => ({ label: String(n) })),
          correct: numbers.indexOf(target.syllables),
        };
      });
    }

    case "fono-nomear": {
      return Array.from({ length: total }, () => {
        const target = fonoSample(bank, 1)[0]!;
        const others = fonoSample(
          bank.filter((x) => x.word !== target.word),
          Math.max(1, Math.min(opts, 4) - 1),
        );
        const options = fonoShuffle([target, ...others]);
        return {
          prompt: fonoPrompt(lang, "nameIt"),
          speak: fonoPrompt(lang, "nameIt"),
          showEmoji: target.emoji,
          options: options.map((o) => ({ label: o.word })),
          correct: options.indexOf(target),
        };
      });
    }

    case "fono-categorias": {
      const categories: FonoCategory[] = ["animal", "comida", "objeto", "corpo", "transporte"];
      return Array.from({ length: total }, () => {
        const category = fonoSample(categories, 1)[0]!;
        const target = fonoSample(
          bank.filter((x) => x.category === category),
          1,
        )[0]!;
        const others = fonoSample(
          bank.filter((x) => x.category !== category),
          Math.max(1, opts - 1),
        );
        const options = fonoShuffle([target, ...others]);
        const label = (categoryNames[lang] ?? categoryNames.pt)[category];
        return {
          prompt: fonoPrompt(lang, "whichCategory", { category: label }),
          speak: fonoPrompt(lang, "whichCategory", { category: label }),
          options: options.map((o) => ({ emoji: o.emoji })),
          correct: options.indexOf(target),
        };
      });
    }

    case "fono-som-diferente": {
      return Array.from({ length: total }, () => {
        const base = fonoSample(bank, 1)[0]!;
        const same = fonoSample(
          bank.filter((x) => x.initial === base.initial && x.word !== base.word),
          Math.max(1, opts - 2),
        );
        const family: FonoWord[] = [base, ...same];
        const odd = fonoSample(
          bank.filter((x) => x.initial !== base.initial),
          1,
        )[0]!;
        const options = fonoShuffle([...family, odd]);
        return {
          prompt: fonoPrompt(lang, "whichDifferent"),
          speak: options.map((o) => o.word).join(", "),
          options: options.map((o) => ({ emoji: o.emoji })),
          correct: options.indexOf(odd),
        };
      });
    }

    case "fono-siga-instrucao":
    default: {
      // Só o áudio guia: nenhuma pista escrita do alvo.
      return Array.from({ length: total }, () => {
        const options = fonoSample(bank, Math.max(2, opts));
        const target = options[Math.floor(Math.random() * options.length)]!;
        return {
          prompt: fonoPrompt(lang, "followOrder"),
          speak: fonoPrompt(lang, "whichWord", { word: target.word }),
          options: options.map((o) => ({ emoji: o.emoji })),
          correct: options.indexOf(target),
        };
      });
    }
  }
}
