import zenoPortrait from "@/assets/zeno.png";
import rafaelPortrait from "@/assets/characters/rafael.png";
import brendaPortrait from "@/assets/characters/brenda.png";
import beniPortrait from "@/assets/characters/beni.png";
import bernardoPortrait from "@/assets/characters/bernardo.png";
import jessicaPortrait from "@/assets/characters/jessica.png";

export type CharacterId = "zeno" | "rafael" | "brenda" | "beni" | "bernardo" | "jessica";

export interface Character {
  id: CharacterId;
  name: string;
  emoji: string;
  color: string; // tailwind token class
  trait: string;
}

export const characters: Character[] = [
  { id: "rafael", name: "Rafael", emoji: "🧑‍🔬", color: "bg-zeno-blue", trait: "Curioso e observador" },
  { id: "brenda", name: "Brenda", emoji: "🎨", color: "bg-zeno-purple", trait: "Criativa e sonhadora" },
  { id: "beni", name: "Beni", emoji: "⚡", color: "bg-zeno-green", trait: "Cheio de energia" },
  { id: "bernardo", name: "Bernardo", emoji: "🧩", color: "bg-zeno-orange", trait: "Inteligente e determinado" },
  { id: "jessica", name: "Jessica", emoji: "💗", color: "bg-zeno-pink", trait: "Amável e atenta" },
];

export const encouragements = [
  "Vamos tentar novamente?",
  "Você está quase lá!",
  "Boa tentativa!",
  "Vamos descobrir juntos!",
];

export const celebrations = [
  "Muito bem!",
  "Você conseguiu!",
  "Que legal!",
  "Uau, que capricho!",
];

export const levels = [
  { level: 1, name: "Descoberta" },
  { level: 2, name: "Exploração" },
  { level: 3, name: "Desafio" },
  { level: 4, name: "Especial" },
];

export interface GameResult {
  score: number;
  hits: number;
  misses: number;
  durationSeconds: number;
  events?: import("@/lib/gameTelemetry").GameEvent[];
}

export const pilotGames = [
  {
    slug: "memoria-turma",
    title: "Memória da Turma",
    skill: "memória",
    emoji: "🃏",
    color: "bg-zeno-blue",
    character: "rafael" as CharacterId,
  },
  {
    slug: "cores-em-acao",
    title: "Cores em Ação",
    skill: "atenção",
    emoji: "🎯",
    color: "bg-zeno-green",
    character: "beni" as CharacterId,
  },
  {
    slug: "formas-e-encaixes",
    title: "Formas e Encaixes",
    skill: "coordenação",
    emoji: "🔷",
    color: "bg-zeno-orange",
    character: "jessica" as CharacterId,
  },
];

export function randomFrom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

export interface CatalogGame {
  slug: string;
  title: string;
  skill: string;
  emoji: string;
  color: string;
  character: CharacterId;
  /** Preenchidos quando o cartão vem de uma atividade personalizada. */
  activityId?: string;
  customTitle?: string;
  customInstruction?: string | undefined;
  config?: Record<string, unknown>;
}


/** Catálogo completo de jogos disponíveis na mesa. */
export const gameCatalog: CatalogGame[] = [
  { slug: "memoria-turma", title: "Memória da Turma", skill: "memória", emoji: "🃏", color: "bg-zeno-blue", character: "rafael" },
  { slug: "cores-em-acao", title: "Cores em Ação", skill: "atenção", emoji: "🎯", color: "bg-zeno-green", character: "beni" },
  { slug: "formas-e-encaixes", title: "Formas e Encaixes", skill: "coordenação", emoji: "🔷", color: "bg-zeno-orange", character: "jessica" },
  { slug: "quebra-cabeca-zeno", title: "Quebra-cabeça do Zeno", skill: "raciocínio", emoji: "🧩", color: "bg-zeno-purple", character: "bernardo" },
  { slug: "torre-de-argolas", title: "Torre de Argolas", skill: "coordenação", emoji: "🪀", color: "bg-zeno-pink", character: "jessica" },
  { slug: "sons-em-sequencia", title: "Sons em Sequência", skill: "memória auditiva", emoji: "🎵", color: "bg-zeno-blue", character: "brenda" },
  { slug: "quantos-tem", title: "Quantos Tem?", skill: "números", emoji: "🔢", color: "bg-zeno-green", character: "bernardo" },
  { slug: "qual-nao-combina", title: "Qual Não Combina?", skill: "raciocínio", emoji: "🔍", color: "bg-zeno-orange", character: "rafael" },
  { slug: "sequencia-magica", title: "Sequência Mágica", skill: "lógica", emoji: "✨", color: "bg-zeno-purple", character: "brenda" },
  { slug: "pintura-da-turma", title: "Pintura da Turma", skill: "criatividade", emoji: "🎨", color: "bg-zeno-pink", character: "brenda" },
  { slug: "desenho-livre", title: "Desenho Livre", skill: "criatividade", emoji: "✏️", color: "bg-zeno-purple", character: "brenda" },
];

export const characterPortraits: Record<string, string> = {
  zeno: zenoPortrait,
  rafael: rafaelPortrait,
  brenda: brendaPortrait,
  beni: beniPortrait,
  bernardo: bernardoPortrait,
  jessica: jessicaPortrait,
};

/** Avatares disponíveis: o Zeno e os personagens da turma. */
export const avatarCharacters = [
  { id: "zeno", name: "Zeno", emoji: "🤖", color: "bg-zeno-blue", image: zenoPortrait },
  ...characters.map((c) => ({
    id: c.id as string,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
    image: characterPortraits[c.id]!,
  })),
];

export function portraitOf(characterId?: string | null): string {
  return characterPortraits[characterId ?? "zeno"] ?? zenoPortrait;
}
