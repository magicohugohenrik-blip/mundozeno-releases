/**
 * Catálogo do aplicativo FonoPlay (atividades de fonoaudiologia).
 * Um jogo novo = uma entrada aqui + o motor correspondente em
 * `src/components/games/fono` (ou um caso novo em `rounds.ts`).
 */
import type { Lang } from "@/lib/i18n";
import type { SkillId } from "@/lib/skills";
import type { CatalogGame } from "@/lib/zeno";

export type FonoEngine = "sound-choice" | "naming" | "audio-memory" | "praxia" | "blow";

export type FonoGroup = "sons" | "praxias" | "vocabulario" | "auditiva";

export interface FonoActivity {
  slug: string;
  emoji: string;
  tint: string;
  engine: FonoEngine;
  group: FonoGroup;
  skills: SkillId[];
  maxLevel: 1 | 2 | 3;
  available: boolean;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  instruction: Record<Lang, string>;
}

export const fonoGroupLabels: Record<Lang, Record<FonoGroup, string>> = {
  pt: {
    sons: "Sons da fala",
    praxias: "Praxias e sopro",
    vocabulario: "Vocabulário e nomeação",
    auditiva: "Memória e atenção auditiva",
  },
  en: {
    sons: "Speech sounds",
    praxias: "Oral motor and blowing",
    vocabulario: "Vocabulary and naming",
    auditiva: "Auditory memory and attention",
  },
  es: {
    sons: "Sonidos del habla",
    praxias: "Praxias y soplo",
    vocabulario: "Vocabulario y nombrar",
    auditiva: "Memoria y atención auditiva",
  },
};

export const fonoCatalog: FonoActivity[] = [
  {
    slug: "fono-som-inicial",
    emoji: "🔊",
    tint: "bg-zeno-blue/15",
    engine: "sound-choice",
    group: "sons",
    skills: ["som-inicial", "discriminacao-auditiva"],
    maxLevel: 3,
    available: true,
    title: { pt: "Som Inicial", en: "First Sound", es: "Sonido Inicial" },
    description: {
      pt: "Descubra qual figura começa com o som pedido.",
      en: "Find which picture starts with the given sound.",
      es: "Descubre qué figura empieza con el sonido pedido.",
    },
    instruction: {
      pt: "Ouça o som e toque na figura que começa com ele.",
      en: "Listen to the sound and tap the picture that starts with it.",
      es: "Escucha el sonido y toca la figura que empieza con él.",
    },
  },
  {
    slug: "fono-pares-minimos",
    emoji: "👂",
    tint: "bg-zeno-green/15",
    engine: "sound-choice",
    group: "sons",
    skills: ["discriminacao-auditiva", "articulacao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Sons Parecidos", en: "Similar Sounds", es: "Sonidos Parecidos" },
    description: {
      pt: "Faca ou vaca? Escute com atenção e escolha.",
      en: "Fan or van? Listen carefully and choose.",
      es: "¿Pato o gato? Escucha con atención y elige.",
    },
    instruction: {
      pt: "Escute a palavra e toque na figura certa.",
      en: "Listen to the word and tap the right picture.",
      es: "Escucha la palabra y toca la figura correcta.",
    },
  },
  {
    slug: "fono-silabas",
    emoji: "👏",
    tint: "bg-zeno-orange/15",
    engine: "sound-choice",
    group: "sons",
    skills: ["consciencia-fonologica", "sequenciamento"],
    maxLevel: 3,
    available: true,
    title: { pt: "Bate as Sílabas", en: "Clap the Syllables", es: "Palmea las Sílabas" },
    description: {
      pt: "Conte as sílabas batendo palminhas com o Zeno.",
      en: "Count the syllables clapping along with Zeno.",
      es: "Cuenta las sílabas aplaudiendo con Zeno.",
    },
    instruction: {
      pt: "Bata palmas para cada pedacinho e toque no número.",
      en: "Clap for each part and tap the number.",
      es: "Aplaude en cada parte y toca el número.",
    },
  },
  {
    slug: "fono-repete-comigo",
    emoji: "🗣️",
    tint: "bg-zeno-purple/15",
    engine: "praxia",
    group: "sons",
    skills: ["articulacao", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Repete Comigo", en: "Repeat After Me", es: "Repite Conmigo" },
    description: {
      pt: "O Zeno fala a palavra e a criança repete em voz alta.",
      en: "Zeno says the word and the child repeats out loud.",
      es: "Zeno dice la palabra y el niño la repite en voz alta.",
    },
    instruction: {
      pt: "Escute o Zeno, repita bem alto e toque em consegui.",
      en: "Listen to Zeno, repeat out loud and tap done.",
      es: "Escucha a Zeno, repite en voz alta y toca conseguí.",
    },
  },
  {
    slug: "fono-praxias",
    emoji: "😛",
    tint: "bg-zeno-pink/15",
    engine: "praxia",
    group: "praxias",
    skills: ["praxias-orais", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Ginástica da Boca", en: "Mouth Gym", es: "Gimnasia de la Boca" },
    description: {
      pt: "Exercícios de boca e língua imitando o Zeno.",
      en: "Mouth and tongue exercises imitating Zeno.",
      es: "Ejercicios de boca y lengua imitando a Zeno.",
    },
    instruction: {
      pt: "Faça igual ao Zeno e segure até o tempo acabar.",
      en: "Do the same as Zeno and hold until time is up.",
      es: "Haz igual que Zeno y sostén hasta terminar el tiempo.",
    },
  },
  {
    slug: "fono-sopro-balao",
    emoji: "🎈",
    tint: "bg-zeno-blue/15",
    engine: "blow",
    group: "praxias",
    skills: ["sopro", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Sopra o Balão", en: "Blow the Balloon", es: "Sopla el Globo" },
    description: {
      pt: "Sopre no microfone para o balão subir bem alto.",
      en: "Blow into the microphone to lift the balloon high.",
      es: "Sopla en el micrófono para elevar el globo.",
    },
    instruction: {
      pt: "Encha o peito de ar e sopre para o balão subir.",
      en: "Take a deep breath and blow to lift the balloon.",
      es: "Toma aire y sopla para que suba el globo.",
    },
  },
  {
    slug: "fono-sopro-vela",
    emoji: "🕯️",
    tint: "bg-zeno-orange/15",
    engine: "blow",
    group: "praxias",
    skills: ["sopro"],
    maxLevel: 3,
    available: true,
    title: { pt: "Apaga a Velinha", en: "Blow the Candle", es: "Apaga la Velita" },
    description: {
      pt: "Sopro forte e curto para apagar as velinhas.",
      en: "Short strong blows to put out the candles.",
      es: "Soplos cortos y fuertes para apagar las velitas.",
    },
    instruction: {
      pt: "Sopre forte para apagar cada velinha do bolo.",
      en: "Blow hard to put out each candle on the cake.",
      es: "Sopla fuerte para apagar cada velita del pastel.",
    },
  },
  {
    slug: "fono-nomear",
    emoji: "🖼️",
    tint: "bg-zeno-green/15",
    engine: "naming",
    group: "vocabulario",
    skills: ["nomeacao", "vocabulario"],
    maxLevel: 3,
    available: true,
    title: { pt: "Como se Chama?", en: "What Is It Called?", es: "¿Cómo se Llama?" },
    description: {
      pt: "Veja a figura e escolha o nome certo.",
      en: "Look at the picture and pick the right name.",
      es: "Mira la figura y elige el nombre correcto.",
    },
    instruction: {
      pt: "Fale o nome em voz alta e toque na palavra certa.",
      en: "Say the name out loud and tap the right word.",
      es: "Di el nombre en voz alta y toca la palabra correcta.",
    },
  },
  {
    slug: "fono-categorias",
    emoji: "🧺",
    tint: "bg-zeno-purple/15",
    engine: "naming",
    group: "vocabulario",
    skills: ["vocabulario", "compreensao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Cada Um no Grupo", en: "Sort by Group", es: "Cada Uno en su Grupo" },
    description: {
      pt: "Animal, comida ou transporte? Escolha o que combina.",
      en: "Animal, food or vehicle? Pick the matching one.",
      es: "¿Animal, comida o transporte? Elige el que combina.",
    },
    instruction: {
      pt: "Ouça o grupo e toque na figura que pertence a ele.",
      en: "Listen to the group and tap the picture that belongs.",
      es: "Escucha el grupo y toca la figura que pertenece.",
    },
  },
  {
    slug: "fono-sequencia-sons",
    emoji: "🎵",
    tint: "bg-zeno-blue/15",
    engine: "audio-memory",
    group: "auditiva",
    skills: ["memoria-auditiva", "sequenciamento"],
    maxLevel: 3,
    available: true,
    title: { pt: "Sequência de Sons", en: "Sound Sequence", es: "Secuencia de Sonidos" },
    description: {
      pt: "Escute a sequência e repita na mesma ordem.",
      en: "Listen to the sequence and repeat it in order.",
      es: "Escucha la secuencia y repítela en orden.",
    },
    instruction: {
      pt: "Escute com atenção e toque na mesma ordem.",
      en: "Listen carefully and tap in the same order.",
      es: "Escucha con atención y toca en el mismo orden.",
    },
  },
  {
    slug: "fono-som-diferente",
    emoji: "🔍",
    tint: "bg-zeno-pink/15",
    engine: "sound-choice",
    group: "auditiva",
    skills: ["discriminacao-auditiva", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Qual É Diferente?", en: "Which Is Different?", es: "¿Cuál es Diferente?" },
    description: {
      pt: "Três palavras parecidas e uma diferente.",
      en: "Three similar words and one different.",
      es: "Tres palabras parecidas y una diferente.",
    },
    instruction: {
      pt: "Escute as palavras e toque na que é diferente.",
      en: "Listen to the words and tap the different one.",
      es: "Escucha las palabras y toca la diferente.",
    },
  },
  {
    slug: "fono-siga-instrucao",
    emoji: "🎧",
    tint: "bg-zeno-green/15",
    engine: "naming",
    group: "auditiva",
    skills: ["compreensao-oral", "atencao"],
    maxLevel: 3,
    available: true,
    title: { pt: "Escute e Faça", en: "Listen and Do", es: "Escucha y Haz" },
    description: {
      pt: "Só ouvindo: siga a instrução falada pelo Zeno.",
      en: "Listening only: follow Zeno's spoken instruction.",
      es: "Solo escuchando: sigue la instrucción de Zeno.",
    },
    instruction: {
      pt: "Ouça o Zeno com atenção e toque na figura pedida.",
      en: "Listen to Zeno carefully and tap the requested picture.",
      es: "Escucha a Zeno con atención y toca la figura pedida.",
    },
  },
];

export function fonoBySlug(slug: string): FonoActivity | undefined {
  return fonoCatalog.find((a) => a.slug === slug);
}

export function isFono(slug: string): boolean {
  return slug.startsWith("fono-");
}

/** Converte uma atividade do FonoPlay num cartão jogável do shell existente. */
export function fonoToGame(activity: FonoActivity, lang: Lang): CatalogGame {
  return {
    slug: activity.slug,
    title: activity.title[lang] ?? activity.title.pt,
    skill: activity.skills.join(", "),
    emoji: activity.emoji,
    color: "bg-zeno-green",
    character: "zeno",
    customTitle: activity.title[lang] ?? activity.title.pt,
    customInstruction: activity.instruction[lang] ?? activity.instruction.pt,
    config: { skills: activity.skills },
  };
}
