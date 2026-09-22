/**
 * Geradores de rodadas dos jogos de escolha da Alfabetização.
 * Um jogo novo do tipo "escolha" só precisa de um caso novo aqui.
 */
import type { Lang } from "@/lib/i18n";
import { alphabet, prompt, sample, shuffle, vowels, wordsFor } from "@/lib/literacy/content";
import { numberKeys, signWords } from "@/lib/libras/signs";

export interface ChoiceOption {
  /** Texto grande do botão (letra ou palavra). */
  label?: string | undefined;
  /** Emoji grande do botão (imagens). */
  emoji?: string | undefined;
  /** Símbolo (letra ou número) desenhado como sinal em Libras. */
  sign?: string | undefined;
}

export interface ChoiceRound {
  /** Pergunta escrita e falada pelo Zeno. */
  prompt: string;
  /** Texto alternativo para a narração (ex.: falar a palavra). */
  speak?: string | undefined;
  /** Estímulo mostrado acima das opções. */
  showEmoji?: string | undefined;
  showText?: string | undefined;
  /** Sinal em Libras mostrado como estímulo. */
  showSign?: string | undefined;
  options: ChoiceOption[];
  correct: number;
}

/** Quantidade de opções por nível: fácil 3, intermediário 4, avançado 6. */
function optionCount(level: number): number {
  return level >= 3 ? 6 : level === 2 ? 4 : 3;
}

function roundsCount(level: number): number {
  return level >= 3 ? 8 : level === 2 ? 6 : 5;
}

function letterOptions(correct: string, level: number, pool = alphabet): ChoiceOption[] {
  const others = sample(
    pool.filter((l) => l !== correct),
    Math.max(1, optionCount(level) - 1),
  );
  return shuffle([correct, ...others]).map((label) => ({ label }));
}

export function buildRounds(slug: string, level: number, lang: Lang): ChoiceRound[] {
  const bank = wordsFor(lang);
  const total = roundsCount(level);

  switch (slug) {
    case "alfa-libras-alfabeto": {
      const letters = level >= 3 ? alphabet : level === 2 ? alphabet.slice(0, 15) : vowels.concat(["B", "C", "D", "M", "P", "S"]);
      return Array.from({ length: total }, () => {
        const target = sample(letters, 1)[0]!;
        const options = shuffle([
          target,
          ...sample(letters.filter((l) => l !== target), Math.max(1, optionCount(level) - 1)),
        ]).map((label) => ({ label }));
        return {
          prompt: prompt(lang, "signLetter"),
          showSign: target,
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });
    }

    case "alfa-libras-letra-sinal": {
      const letters = level >= 3 ? alphabet : level === 2 ? alphabet.slice(0, 15) : vowels.concat(["B", "C", "M", "P"]);
      return Array.from({ length: total }, () => {
        const target = sample(letters, 1)[0]!;
        const options = shuffle([
          target,
          ...sample(letters.filter((l) => l !== target), Math.max(1, optionCount(level) - 1)),
        ]).map((sign) => ({ sign }));
        return {
          prompt: prompt(lang, "letterSign", { letter: target }),
          showText: target,
          options,
          correct: options.findIndex((o) => o.sign === target),
        };
      });
    }

    case "alfa-libras-numeros": {
      const pool = level >= 3 ? numberKeys : numberKeys.slice(0, level === 2 ? 8 : 6);
      return Array.from({ length: total }, (_, i) => {
        const target = sample(pool, 1)[0]!;
        const others = sample(pool.filter((n) => n !== target), Math.max(1, optionCount(level) - 1));
        if (i % 2 === 0) {
          const options = shuffle([target, ...others]).map((label) => ({ label }));
          return {
            prompt: prompt(lang, "signNumber"),
            showSign: target,
            options,
            correct: options.findIndex((o) => o.label === target),
          };
        }
        const options = shuffle([target, ...others]).map((sign) => ({ sign }));
        return {
          prompt: prompt(lang, "numberSign", { letter: target }),
          showText: target,
          options,
          correct: options.findIndex((o) => o.sign === target),
        };
      });
    }

    case "alfa-libras-palavras":
      return sample(signWords, total).map((item) => {
        const word = item.word[lang] ?? item.word.pt;
        const target = word[0]!;
        const options = shuffle([
          target,
          ...sample(alphabet.filter((l) => l !== target), Math.max(1, optionCount(level) - 1)),
        ]).map((sign) => ({ sign }));
        return {
          prompt: prompt(lang, "signWord", { word }),
          speak: `${word}. ${prompt(lang, "signWord", { word })}`,
          showEmoji: item.emoji,
          showText: word,
          options,
          correct: options.findIndex((o) => o.sign === target),
        };
      });

    case "alfa-caca-letras":
      return Array.from({ length: total }, () => {
        const target = sample(alphabet, 1)[0]!;
        const options = letterOptions(target, level);
        return {
          prompt: prompt(lang, "findLetter", { letter: target }),
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });

    case "alfa-qual-letra":
      return sample(bank, total).map((item) => {
        const target = item.word[0]!;
        const options = letterOptions(target, level);
        return {
          prompt: prompt(lang, "whichLetter"),
          showEmoji: item.emoji,
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });

    case "alfa-primeiro-som":
      return sample(bank, total).map((item) => {
        const target = item.word[0]!;
        const options = letterOptions(target, level);
        return {
          prompt: prompt(lang, "firstSound", { word: item.word }),
          speak: `${item.word}. ${prompt(lang, "firstSound", { word: item.word })}`,
          showEmoji: level >= 3 ? undefined : item.emoji,
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });

    case "alfa-complete-palavra":
      return sample(
        bank.filter((w) => w.word.length >= 3),
        total,
      ).map((item) => {
        const positions = item.word
          .split("")
          .map((ch, i) => ({ ch, i }))
          .filter((p) => (level >= 3 ? true : vowels.includes(p.ch)));
        const pick = (positions.length ? sample(positions, 1)[0] : { ch: item.word[1]!, i: 1 })!;
        const masked = item.word
          .split("")
          .map((ch, i) => (i === pick.i ? "_" : ch))
          .join(" ");
        const pool = level >= 3 ? alphabet : vowels;
        const options = letterOptions(pick.ch, level, pool);
        return {
          prompt: prompt(lang, "completeWord"),
          speak: `${prompt(lang, "completeWord")} ${item.word}`,
          showEmoji: item.emoji,
          showText: masked,
          options,
          correct: options.findIndex((o) => o.label === pick.ch),
        };
      });

    case "alfa-vogais":
      return Array.from({ length: total }, (_, i) => {
        const useWord = i % 2 === 1;
        if (useWord) {
          const candidates = bank.filter((w) => vowels.includes(w.word[0]!));
          const item = (candidates.length ? sample(candidates, 1)[0] : sample(bank, 1)[0])!;
          const target = vowels.includes(item.word[0]!) ? item.word[0]! : "A";
          const options = shuffle(vowels).map((label) => ({ label }));
          return {
            prompt: prompt(lang, "whichLetter"),
            showEmoji: item.emoji,
            options,
            correct: options.findIndex((o) => o.label === target),
          };
        }
        const target = sample(vowels, 1)[0]!;
        const options = shuffle(vowels).map((label) => ({ label }));
        return {
          prompt: prompt(lang, "findLetter", { letter: target }),
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });

    case "alfa-palavra-imagem":
      return Array.from({ length: total }, (_, i) => {
        const picks = sample(bank, optionCount(level));
        const target = picks[0]!;
        if (i % 2 === 0) {
          const options = shuffle(picks).map((w) => ({ emoji: w.emoji, label: undefined }));
          return {
            prompt: prompt(lang, "wordToImage", { word: target.word }),
            showText: target.word,
            options,
            correct: options.findIndex((o) => o.emoji === target.emoji),
          };
        }
        const options = shuffle(picks).map((w) => ({ label: w.word }));
        return {
          prompt: prompt(lang, "imageToWord"),
          showEmoji: target.emoji,
          options,
          correct: options.findIndex((o) => o.label === target.word),
        };
      });

    case "alfa-ultima-letra":
      return sample(bank, total).map((item) => {
        const target = item.word[item.word.length - 1]!;
        const options = letterOptions(target, level);
        return {
          prompt: prompt(lang, "lastLetter"),
          speak: `${item.word}. ${prompt(lang, "lastLetter")}`,
          showEmoji: item.emoji,
          showText: item.word,
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });

    case "alfa-rimas":
      return Array.from({ length: total }, () => {
        const base = sample(bank, 1)[0]!;
        const end = base.word.slice(-2);
        const rhyme = bank.find((w) => w.word !== base.word && w.word.slice(-2) === end);
        const target = rhyme ?? bank.find((w) => w.word !== base.word && w.word.at(-1) === base.word.at(-1)) ?? base;
        const distractors = sample(
          bank.filter((w) => w.word !== target.word && w.word !== base.word),
          Math.max(1, optionCount(level) - 1),
        );
        const options = shuffle([target, ...distractors]).map((w) => ({ label: w.word }));
        return {
          prompt: prompt(lang, "rhyme", { word: base.word }),
          showEmoji: base.emoji,
          options,
          correct: options.findIndex((o) => o.label === target.word),
        };
      });

    case "alfa-conta-letras":
      return sample(bank, total).map((item) => {
        const n = item.word.length;
        const pool = new Set<number>([n]);
        let guard = 0;
        while (pool.size < optionCount(level) && guard++ < 40) {
          const candidate = n + Math.round(Math.random() * 6) - 3;
          if (candidate >= 2) pool.add(candidate);
        }
        const options = shuffle([...pool]).map((v) => ({ label: String(v) }));
        return {
          prompt: prompt(lang, "countLetters", { word: item.word }),
          showEmoji: item.emoji,
          showText: item.word.split("").join(" "),
          options,
          correct: options.findIndex((o) => o.label === String(n)),
        };
      });

    case "alfa-silabas":
      return sample(bank, total).map((item) => {
        const groups = item.word.match(/[AEIOU]+/g) ?? ["A"];
        const n = groups.length;
        const pool = new Set<number>([n, 1, 2, 3]);
        const options = shuffle([...pool].slice(0, optionCount(level))).map((v) => ({ label: String(v) }));
        const withTarget = options.some((o) => o.label === String(n))
          ? options
          : [{ label: String(n) }, ...options.slice(1)];
        return {
          prompt: prompt(lang, "syllables", { word: item.word }),
          speak: `${item.word}. ${prompt(lang, "syllables", { word: item.word })}`,
          showEmoji: item.emoji,
          showText: item.word,
          options: withTarget,
          correct: withTarget.findIndex((o) => o.label === String(n)),
        };
      });

    case "alfa-maiuscula-minuscula":
      return Array.from({ length: total }, () => {
        const target = sample(alphabet, 1)[0]!;
        const others = sample(
          alphabet.filter((l) => l !== target),
          Math.max(1, optionCount(level) - 1),
        );
        const options = shuffle([target, ...others]).map((l) => ({ label: l.toLowerCase() }));
        return {
          prompt: prompt(lang, "matchCase", { letter: target }),
          showText: target,
          options,
          correct: options.findIndex((o) => o.label === target.toLowerCase()),
        };
      });

    case "alfa-letra-seguinte":
      return Array.from({ length: total }, () => {
        const i = Math.floor(Math.random() * (alphabet.length - 1));
        const target = alphabet[i + 1]!;
        const options = letterOptions(target, level);
        return {
          prompt: prompt(lang, "nextLetter", { letter: alphabet[i]! }),
          showText: alphabet[i]!,
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });

    case "alfa-letra-anterior":
      return Array.from({ length: total }, () => {
        const i = 1 + Math.floor(Math.random() * (alphabet.length - 1));
        const target = alphabet[i - 1]!;
        const options = letterOptions(target, level);
        return {
          prompt: prompt(lang, "prevLetter", { letter: alphabet[i]! }),
          showText: alphabet[i]!,
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });

    case "alfa-palavra-comeca":
      return Array.from({ length: total }, () => {
        const target = sample(bank, 1)[0]!;
        const letter = target.word[0]!;
        const distractors = sample(
          bank.filter((w) => w.word[0] !== letter),
          Math.max(1, optionCount(level) - 1),
        );
        const options = shuffle([target, ...distractors]).map((w) => ({ label: w.word }));
        return {
          prompt: prompt(lang, "startsWith", { letter }),
          showText: letter,
          options,
          correct: options.findIndex((o) => o.label === target.word),
        };
      });

    case "alfa-escrita-certa":
      return sample(bank, total).map((item) => {
        const scramble = (word: string) => {
          const letters = word.split("");
          const a = 1 % letters.length;
          const b = Math.max(0, letters.length - 2);
          [letters[a], letters[b]] = [letters[b]!, letters[a]!];
          return letters.join("");
        };
        const wrongs: string[] = [];
        let guard = 0;
        while (wrongs.length < Math.max(1, optionCount(level) - 1) && guard++ < 20) {
          const candidate = shuffle(item.word.split("")).join("");
          if (candidate !== item.word && !wrongs.includes(candidate)) wrongs.push(candidate);
        }
        if (!wrongs.length) wrongs.push(scramble(item.word));
        const options = shuffle([item.word, ...wrongs]).map((label) => ({ label }));
        return {
          prompt: prompt(lang, "correctSpelling"),
          speak: `${item.word}. ${prompt(lang, "correctSpelling")}`,
          showEmoji: item.emoji,
          options,
          correct: options.findIndex((o) => o.label === item.word),
        };
      });

    case "alfa-ache-vogal":
      return Array.from({ length: total }, () => {
        const target = sample(vowels, 1)[0]!;
        const consonants = sample(
          alphabet.filter((l) => !vowels.includes(l)),
          Math.max(1, optionCount(level) - 1),
        );
        const options = shuffle([target, ...consonants]).map((label) => ({ label }));
        return {
          prompt: prompt(lang, "vowelAmong"),
          options,
          correct: options.findIndex((o) => o.label === target),
        };
      });

    default:
      return [];
  }
}
