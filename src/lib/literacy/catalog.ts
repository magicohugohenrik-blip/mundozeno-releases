/**
 * Catálogo da área Alfabetização.
 * Adicionar um jogo novo = acrescentar uma entrada aqui + um gerador de
 * rodadas (ou um componente) em `src/components/games/literacy`.
 */
import type { Lang } from "@/lib/i18n";
import type { SkillId } from "@/lib/skills";
import type { CatalogGame } from "@/lib/zeno";

export type LiteracyEngine =
  | "choice"
  | "build"
  | "memory"
  | "order"
  | "story"
  | "letter-pop"
  | "letter-catch"
  | "letter-whack";

export interface LiteracyActivity {
  slug: string;
  emoji: string;
  /** Fundo pastel do ícone (tokens da identidade Zeno). */
  tint: string;
  engine: LiteracyEngine;
  skills: SkillId[];
  /** Níveis suportados: 1 fácil, 2 intermediário, 3 avançado. */
  maxLevel: 1 | 2 | 3;
  available: boolean;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  instruction: Record<Lang, string>;
}

export const literacyCatalog: LiteracyActivity[] = [
  {
    slug: "alfa-caca-letras",
    emoji: "🔎",
    tint: "bg-zeno-blue/15",
    engine: "choice",
    skills: ["reconhecimento-letras", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Caça-Letras", en: "Letter Hunt", es: "Caza-Letras" },
    description: {
      pt: "Encontre a letra pedida entre as outras.",
      en: "Find the requested letter among the others.",
      es: "Encuentra la letra pedida entre las demás.",
    },
    instruction: {
      pt: "Ouça o Zeno e toque na letra certa.",
      en: "Listen to Zeno and tap the right letter.",
      es: "Escucha a Zeno y toca la letra correcta.",
    },
  },
  {
    slug: "alfa-qual-letra",
    emoji: "🖼️",
    tint: "bg-zeno-green/15",
    engine: "choice",
    skills: ["som-inicial", "reconhecimento-letras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Qual é a Letra?", en: "Which Letter?", es: "¿Cuál es la Letra?" },
    description: {
      pt: "Descubra com qual letra a figura começa.",
      en: "Discover which letter the picture starts with.",
      es: "Descubre con qué letra empieza la figura.",
    },
    instruction: {
      pt: "Veja a figura e toque na letra inicial.",
      en: "Look at the picture and tap the first letter.",
      es: "Mira la figura y toca la letra inicial.",
    },
  },
  {
    slug: "alfa-primeiro-som",
    emoji: "🔊",
    tint: "bg-zeno-orange/15",
    engine: "choice",
    skills: ["consciencia-fonologica", "som-inicial"],
    maxLevel: 3,
    available: true,
    title: { pt: "Primeiro Som", en: "First Sound", es: "Primer Sonido" },
    description: {
      pt: "Escute a palavra e escolha o primeiro som.",
      en: "Listen to the word and pick the first sound.",
      es: "Escucha la palabra y elige el primer sonido.",
    },
    instruction: {
      pt: "O Zeno fala a palavra. Toque no som que começa.",
      en: "Zeno says the word. Tap the sound it starts with.",
      es: "Zeno dice la palabra. Toca el sonido inicial.",
    },
  },
  {
    slug: "alfa-monte-palavra",
    emoji: "🧩",
    tint: "bg-zeno-purple/15",
    engine: "build",
    skills: ["formacao-palavras", "reconhecimento-letras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Monte a Palavra", en: "Build the Word", es: "Forma la Palabra" },
    description: {
      pt: "Use as letras embaralhadas para escrever a palavra.",
      en: "Use the shuffled letters to write the word.",
      es: "Usa las letras mezcladas para escribir la palabra.",
    },
    instruction: {
      pt: "Toque nas letras na ordem certa para montar a palavra.",
      en: "Tap the letters in order to build the word.",
      es: "Toca las letras en orden para formar la palabra.",
    },
  },
  {
    slug: "alfa-complete-palavra",
    emoji: "✏️",
    tint: "bg-zeno-pink/15",
    engine: "choice",
    skills: ["formacao-palavras", "vogais"],
    maxLevel: 3,
    available: true,
    title: { pt: "Complete a Palavra", en: "Complete the Word", es: "Completa la Palabra" },
    description: {
      pt: "Escolha a letra que falta na palavra.",
      en: "Choose the missing letter in the word.",
      es: "Elige la letra que falta en la palabra.",
    },
    instruction: {
      pt: "Toque na letra que completa a palavra.",
      en: "Tap the letter that completes the word.",
      es: "Toca la letra que completa la palabra.",
    },
  },
  {
    slug: "alfa-vogais",
    emoji: "🎈",
    tint: "bg-zeno-blue/15",
    engine: "choice",
    skills: ["vogais", "reconhecimento-letras", "som-inicial"],
    maxLevel: 3,
    available: true,
    title: { pt: "Vogais Divertidas", en: "Fun Vowels", es: "Vocales Divertidas" },
    description: {
      pt: "Reconheça e associe as vogais A, E, I, O e U.",
      en: "Recognize and match the vowels A, E, I, O and U.",
      es: "Reconoce y asocia las vocales A, E, I, O y U.",
    },
    instruction: {
      pt: "Vamos brincar com as vogais! Toque na vogal certa.",
      en: "Let's play with the vowels! Tap the right one.",
      es: "¡Vamos a jugar con las vocales! Toca la correcta.",
    },
  },
  {
    slug: "alfa-memoria-letras",
    emoji: "🧠",
    tint: "bg-zeno-green/15",
    engine: "memory",
    skills: ["memoria", "reconhecimento-letras", "associacao-imagem-palavra"],
    maxLevel: 3,
    available: true,
    title: { pt: "Memória das Letras", en: "Letter Memory", es: "Memoria de Letras" },
    description: {
      pt: "Encontre os pares de letras e figuras.",
      en: "Find the pairs of letters and pictures.",
      es: "Encuentra los pares de letras y figuras.",
    },
    instruction: {
      pt: "Vire as cartas e encontre os pares.",
      en: "Flip the cards and find the pairs.",
      es: "Voltea las cartas y encuentra los pares.",
    },
  },
  {
    slug: "alfa-ordem-alfabeto",
    emoji: "🔤",
    tint: "bg-zeno-orange/15",
    engine: "order",
    skills: ["sequenciamento", "reconhecimento-letras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Ordem do Alfabeto", en: "Alphabet Order", es: "Orden del Alfabeto" },
    description: {
      pt: "Coloque as letras na ordem correta.",
      en: "Put the letters in the correct order.",
      es: "Coloca las letras en el orden correcto.",
    },
    instruction: {
      pt: "Toque nas letras seguindo a ordem do alfabeto.",
      en: "Tap the letters following the alphabet order.",
      es: "Toca las letras siguiendo el orden del alfabeto.",
    },
  },
  {
    slug: "alfa-palavra-imagem",
    emoji: "🎯",
    tint: "bg-zeno-purple/15",
    engine: "choice",
    skills: ["associacao-imagem-palavra", "leitura"],
    maxLevel: 3,
    available: true,
    title: { pt: "Palavra e Imagem", en: "Word and Picture", es: "Palabra e Imagen" },
    description: {
      pt: "Ligue a palavra à imagem certa — e o contrário.",
      en: "Match the word to the right picture — and back.",
      es: "Une la palabra con la imagen correcta — y al revés.",
    },
    instruction: {
      pt: "Leia com o Zeno e toque na resposta certa.",
      en: "Read with Zeno and tap the right answer.",
      es: "Lee con Zeno y toca la respuesta correcta.",
    },
  },
  {
    slug: "alfa-historia",
    emoji: "📚",
    tint: "bg-zeno-pink/15",
    engine: "story",
    skills: ["compreensao", "leitura", "sequenciamento"],
    maxLevel: 3,
    available: true,
    title: { pt: "História Interativa", en: "Interactive Story", es: "Historia Interactiva" },
    description: {
      pt: "Ouça a história e responda as perguntinhas.",
      en: "Listen to the story and answer small questions.",
      es: "Escucha la historia y responde las preguntas.",
    },
    instruction: {
      pt: "Ouça o Zeno contar a história e responda.",
      en: "Listen to Zeno telling the story and answer.",
      es: "Escucha a Zeno contar la historia y responde.",
    },
  },
  {
    slug: "alfa-ultima-letra",
    emoji: "🔚",
    tint: "bg-zeno-blue/15",
    engine: "choice",
    skills: ["reconhecimento-letras", "consciencia-fonologica"],
    maxLevel: 3,
    available: true,
    title: { pt: "Última Letra", en: "Last Letter", es: "Última Letra" },
    description: { pt: "Descubra com qual letra a palavra termina.", en: "Discover which letter the word ends with.", es: "Descubre con qué letra termina la palabra." },
    instruction: { pt: "Ouça a palavra e toque na última letra.", en: "Listen to the word and tap the last letter.", es: "Escucha la palabra y toca la última letra." },
  },
  {
    slug: "alfa-rimas",
    emoji: "🎶",
    tint: "bg-zeno-green/15",
    engine: "choice",
    skills: ["consciencia-fonologica", "leitura"],
    maxLevel: 3,
    available: true,
    title: { pt: "Rimas Divertidas", en: "Fun Rhymes", es: "Rimas Divertidas" },
    description: { pt: "Encontre a palavra que rima com a outra.", en: "Find the word that rhymes with the other.", es: "Encuentra la palabra que rima con la otra." },
    instruction: { pt: "Ouça a palavra e toque na que rima.", en: "Listen to the word and tap the one that rhymes.", es: "Escucha la palabra y toca la que rima." },
  },
  {
    slug: "alfa-conta-letras",
    emoji: "🔢",
    tint: "bg-zeno-orange/15",
    engine: "choice",
    skills: ["reconhecimento-letras", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Conte as Letras", en: "Count the Letters", es: "Cuenta las Letras" },
    description: { pt: "Conte quantas letras a palavra tem.", en: "Count how many letters the word has.", es: "Cuenta cuántas letras tiene la palabra." },
    instruction: { pt: "Conte as letras e toque no número certo.", en: "Count the letters and tap the right number.", es: "Cuenta las letras y toca el número correcto." },
  },
  {
    slug: "alfa-silabas",
    emoji: "👏",
    tint: "bg-zeno-purple/15",
    engine: "choice",
    skills: ["consciencia-fonologica", "sequenciamento"],
    maxLevel: 3,
    available: true,
    title: { pt: "Bata as Sílabas", en: "Clap the Syllables", es: "Palmea las Sílabas" },
    description: { pt: "Descubra quantas sílabas a palavra tem.", en: "Find out how many syllables the word has.", es: "Descubre cuántas sílabas tiene la palabra." },
    instruction: { pt: "Bata palmas com o Zeno e toque no número.", en: "Clap with Zeno and tap the number.", es: "Aplaude con Zeno y toca el número." },
  },
  {
    slug: "alfa-maiuscula-minuscula",
    emoji: "🔠",
    tint: "bg-zeno-pink/15",
    engine: "choice",
    skills: ["reconhecimento-letras", "associacao-imagem-palavra"],
    maxLevel: 3,
    available: true,
    title: { pt: "Grande e Pequena", en: "Big and Small", es: "Grande y Pequeña" },
    description: { pt: "Ligue a letra maiúscula à minúscula.", en: "Match the uppercase letter to the lowercase one.", es: "Une la letra mayúscula con la minúscula." },
    instruction: { pt: "Veja a letra grande e toque na pequenininha.", en: "Look at the big letter and tap the small one.", es: "Mira la letra grande y toca la pequeñita." },
  },
  {
    slug: "alfa-letra-seguinte",
    emoji: "➡️",
    tint: "bg-zeno-blue/15",
    engine: "choice",
    skills: ["sequenciamento", "reconhecimento-letras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Letra Seguinte", en: "Next Letter", es: "Letra Siguiente" },
    description: { pt: "Descubra qual letra vem depois.", en: "Find out which letter comes next.", es: "Descubre qué letra viene después." },
    instruction: { pt: "Pense no alfabeto e toque na letra seguinte.", en: "Think of the alphabet and tap the next letter.", es: "Piensa en el alfabeto y toca la letra siguiente." },
  },
  {
    slug: "alfa-letra-anterior",
    emoji: "⬅️",
    tint: "bg-zeno-green/15",
    engine: "choice",
    skills: ["sequenciamento", "reconhecimento-letras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Letra Anterior", en: "Previous Letter", es: "Letra Anterior" },
    description: { pt: "Descubra qual letra vem antes.", en: "Find out which letter comes before.", es: "Descubre qué letra viene antes." },
    instruction: { pt: "Pense no alfabeto e toque na letra anterior.", en: "Think of the alphabet and tap the previous letter.", es: "Piensa en el alfabeto y toca la letra anterior." },
  },
  {
    slug: "alfa-palavra-comeca",
    emoji: "🅰️",
    tint: "bg-zeno-orange/15",
    engine: "choice",
    skills: ["som-inicial", "leitura"],
    maxLevel: 3,
    available: true,
    title: { pt: "Começa Com...", en: "Starts With...", es: "Empieza Con..." },
    description: { pt: "Escolha a palavra que começa com a letra.", en: "Choose the word that starts with the letter.", es: "Elige la palabra que empieza con la letra." },
    instruction: { pt: "Leia com o Zeno e toque na palavra certa.", en: "Read with Zeno and tap the right word.", es: "Lee con Zeno y toca la palabra correcta." },
  },
  {
    slug: "alfa-escrita-certa",
    emoji: "✅",
    tint: "bg-zeno-purple/15",
    engine: "choice",
    skills: ["leitura", "formacao-palavras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Escrita Certinha", en: "Correct Spelling", es: "Escritura Correcta" },
    description: { pt: "Descubra qual palavra está escrita certo.", en: "Find which word is spelled correctly.", es: "Descubre qué palabra está bien escrita." },
    instruction: { pt: "Veja a figura e toque na palavra certinha.", en: "Look at the picture and tap the correct word.", es: "Mira la figura y toca la palabra correcta." },
  },
  {
    slug: "alfa-ache-vogal",
    emoji: "🎯",
    tint: "bg-zeno-pink/15",
    engine: "choice",
    skills: ["vogais", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Ache a Vogal", en: "Find the Vowel", es: "Encuentra la Vocal" },
    description: { pt: "Encontre a vogal entre as consoantes.", en: "Find the vowel among the consonants.", es: "Encuentra la vocal entre las consonantes." },
    instruction: { pt: "Toque na vogal escondida entre as letras.", en: "Tap the vowel hidden among the letters.", es: "Toca la vocal escondida entre las letras." },
  },
  {
    slug: "alfa-d-bolhas-letras",
    emoji: "🫧",
    tint: "bg-zeno-blue/15",
    engine: "letter-pop",
    skills: ["reconhecimento-letras", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Bolhas de Letras", en: "Letter Bubbles", es: "Burbujas de Letras" },
    description: {
      pt: "Estoure as bolhas com a letra certa antes que subam.",
      en: "Pop the bubbles with the right letter before they float away.",
      es: "Revienta las burbujas con la letra correcta antes de que suban.",
    },
    instruction: {
      pt: "Olhe a letra pedida e estoure só as bolhas dela.",
      en: "Look at the letter asked and pop only its bubbles.",
      es: "Mira la letra pedida y revienta solo sus burbujas.",
    },
  },
  {
    slug: "alfa-d-bolhas-vogais",
    emoji: "🎈",
    tint: "bg-zeno-pink/15",
    engine: "letter-pop",
    skills: ["vogais", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Caça-Vogais Voadoras", en: "Flying Vowel Hunt", es: "Caza-Vocales Voladoras" },
    description: {
      pt: "Só as vogais podem ser estouradas!",
      en: "Only vowels can be popped!",
      es: "¡Solo las vocales pueden reventarse!",
    },
    instruction: {
      pt: "Estoure A, E, I, O e U e deixe as outras letras subirem.",
      en: "Pop A, E, I, O and U and let the other letters float away.",
      es: "Revienta A, E, I, O y U y deja subir las demás letras.",
    },
  },
  {
    slug: "alfa-d-cesta-inicial",
    emoji: "🧺",
    tint: "bg-zeno-green/15",
    engine: "letter-catch",
    skills: ["som-inicial", "reconhecimento-letras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Cesta da Letra Inicial", en: "First Letter Basket", es: "Canasta de la Letra Inicial" },
    description: {
      pt: "Mova a cesta e pegue a letra que começa a palavra.",
      en: "Move the basket and catch the letter the word starts with.",
      es: "Mueve la canasta y atrapa la letra inicial de la palabra.",
    },
    instruction: {
      pt: "Arraste a cesta para pegar a letra inicial da figura.",
      en: "Drag the basket to catch the picture's first letter.",
      es: "Arrastra la canasta para atrapar la letra inicial de la figura.",
    },
  },
  {
    slug: "alfa-d-cesta-final",
    emoji: "🪣",
    tint: "bg-zeno-orange/15",
    engine: "letter-catch",
    skills: ["consciencia-fonologica", "reconhecimento-letras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Cesta da Letra Final", en: "Last Letter Basket", es: "Canasta de la Letra Final" },
    description: {
      pt: "Pegue a letra que termina cada palavra.",
      en: "Catch the letter each word ends with.",
      es: "Atrapa la letra final de cada palabra.",
    },
    instruction: {
      pt: "Arraste a cesta para pegar a última letra da palavra.",
      en: "Drag the basket to catch the word's last letter.",
      es: "Arrastra la canasta para atrapar la última letra de la palabra.",
    },
  },
  {
    slug: "alfa-d-toca-letras",
    emoji: "🔨",
    tint: "bg-zeno-purple/15",
    engine: "letter-whack",
    skills: ["reconhecimento-letras", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Toca-Letras", en: "Letter Whack", es: "Toca-Letras" },
    description: {
      pt: "As letras aparecem rapidinho: toque só na certa.",
      en: "Letters pop up fast: tap only the right one.",
      es: "Las letras aparecen rápido: toca solo la correcta.",
    },
    instruction: {
      pt: "Fique atento e toque só na letra pedida.",
      en: "Stay alert and tap only the requested letter.",
      es: "Mantente atento y toca solo la letra pedida.",
    },
  },
  {
    slug: "alfa-d-toca-palavra",
    emoji: "⚡",
    tint: "bg-zeno-blue/15",
    engine: "letter-whack",
    skills: ["formacao-palavras", "sequenciamento"],
    maxLevel: 3,
    available: true,
    title: { pt: "Palavra Relâmpago", en: "Lightning Word", es: "Palabra Relámpago" },
    description: {
      pt: "Toque nas letras da palavra na ordem certa.",
      en: "Tap the word's letters in the right order.",
      es: "Toca las letras de la palabra en el orden correcto.",
    },
    instruction: {
      pt: "Monte a palavra tocando nas letras que aparecem, uma a uma.",
      en: "Build the word by tapping the letters as they pop up, one by one.",
      es: "Forma la palabra tocando las letras que aparecen, una a una.",
    },
  },
  {
    slug: "alfa-libras-alfabeto",
    emoji: "🤟",
    tint: "bg-zeno-purple/15",
    engine: "choice",
    skills: ["reconhecimento-letras", "associacao-imagem-palavra", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Alfabeto em Libras", en: "Sign Alphabet", es: "Alfabeto en Señas" },
    description: {
      pt: "Veja o sinal da mão e descubra a letra.",
      en: "Look at the handshape and find the letter.",
      es: "Mira la seña y descubre la letra.",
    },
    instruction: {
      pt: "Olhe a mãozinha e toque na letra que ela mostra.",
      en: "Look at the hand and tap the letter it shows.",
      es: "Mira la mano y toca la letra que muestra.",
    },
  },
  {
    slug: "alfa-libras-letra-sinal",
    emoji: "✋",
    tint: "bg-zeno-blue/15",
    engine: "choice",
    skills: ["reconhecimento-letras", "atencao", "memoria"],
    maxLevel: 3,
    available: true,
    title: { pt: "Ache o Sinal", en: "Find the Sign", es: "Encuentra la Seña" },
    description: {
      pt: "A letra aparece: escolha o sinal em Libras certo.",
      en: "The letter appears: choose the right sign.",
      es: "Aparece la letra: elige la seña correcta.",
    },
    instruction: {
      pt: "Veja a letra e toque na mãozinha que faz esse sinal.",
      en: "See the letter and tap the hand that makes the sign.",
      es: "Mira la letra y toca la mano que hace la seña.",
    },
  },
  {
    slug: "alfa-libras-numeros",
    emoji: "🔟",
    tint: "bg-zeno-green/15",
    engine: "choice",
    skills: ["reconhecimento-letras", "atencao", "sequenciamento"],
    maxLevel: 3,
    available: true,
    title: { pt: "Números em Libras", en: "Numbers in Sign", es: "Números en Señas" },
    description: {
      pt: "Reconheça os números de 0 a 10 em Libras.",
      en: "Recognize numbers 0 to 10 in sign language.",
      es: "Reconoce los números de 0 a 10 en señas.",
    },
    instruction: {
      pt: "Olhe a mãozinha e toque no número certo.",
      en: "Look at the hand and tap the right number.",
      es: "Mira la mano y toca el número correcto.",
    },
  },
  {
    slug: "alfa-libras-palavras",
    emoji: "🙌",
    tint: "bg-zeno-pink/15",
    engine: "choice",
    skills: ["som-inicial", "associacao-imagem-palavra", "formacao-palavras"],
    maxLevel: 3,
    available: true,
    title: { pt: "Palavras em Libras", en: "Words in Sign", es: "Palabras en Señas" },
    description: {
      pt: "Palavras do dia a dia soletradas em Libras.",
      en: "Everyday words fingerspelled in sign language.",
      es: "Palabras cotidianas deletreadas en señas.",
    },
    instruction: {
      pt: "Veja a palavra e toque no sinal da primeira letra.",
      en: "See the word and tap the sign of its first letter.",
      es: "Mira la palabra y toca la seña de su primera letra.",
    },
  },
];

export function literacyBySlug(slug: string): LiteracyActivity | undefined {
  return literacyCatalog.find((a) => a.slug === slug);
}

export function isLiteracy(slug: string): boolean {
  return slug.startsWith("alfa-");
}

/** Converte uma atividade de alfabetização num cartão jogável do shell existente. */
export function literacyToGame(activity: LiteracyActivity, lang: Lang): CatalogGame {
  return {
    slug: activity.slug,
    title: activity.title[lang] ?? activity.title.pt,
    skill: activity.skills.join(", "),
    emoji: activity.emoji,
    color: "bg-zeno-blue",
    character: "zeno",
    customTitle: activity.title[lang] ?? activity.title.pt,
    customInstruction: activity.instruction[lang] ?? activity.instruction.pt,
    config: { skills: activity.skills },
  };
}
