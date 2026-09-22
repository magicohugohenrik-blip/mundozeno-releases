import { arcadeCategoryBySlug } from "@/lib/arcade/catalog";
import { actionCategoryBySlug } from "@/lib/arcade/action";
import salaScene from "@/assets/scenes/sala.jpg";
import patioScene from "@/assets/scenes/patio.jpg";
import oficinaScene from "@/assets/scenes/oficina.jpg";

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  scene: string;
  slugs: string[];
}

export const categories: Category[] = [
  {
    id: "memoria",
    label: "Memória",
    emoji: "🧠",
    color: "bg-zeno-blue",
    scene: salaScene,
    slugs: ["memoria-turma", "sons-em-sequencia"],
  },
  {
    id: "cores",
    label: "Cores e atenção",
    emoji: "🎯",
    color: "bg-zeno-green",
    scene: patioScene,
    slugs: ["cores-em-acao", "qual-nao-combina"],
  },
  {
    id: "formas",
    label: "Formas e encaixes",
    emoji: "🔷",
    color: "bg-zeno-orange",
    scene: oficinaScene,
    slugs: ["formas-e-encaixes", "quebra-cabeca-zeno", "torre-de-argolas"],
  },
  {
    id: "logica",
    label: "Lógica e números",
    emoji: "🔢",
    color: "bg-zeno-purple",
    scene: salaScene,
    slugs: ["quantos-tem", "sequencia-magica"],
  },
  {
    id: "criar",
    label: "Criatividade",
    emoji: "🎨",
    color: "bg-zeno-pink",
    scene: patioScene,
    slugs: ["pintura-da-turma", "desenho-livre"],
  },
];

export function categoryOf(slug: string): Category {
  const generated = arcadeCategoryBySlug[slug] ?? actionCategoryBySlug[slug];
  if (generated) return categories.find((c) => c.id === generated) ?? categories[0]!;
  return categories.find((c) => c.slugs.includes(slug)) ?? categories[0]!;
}

export function sceneFor(slug: string): string {
  return categoryOf(slug).scene;
}

/** Frase falada ao abrir cada jogo. */
export const gameInstructions: Record<string, string> = {
  "memoria-turma": "Vire as cartinhas e encontre os pares da Turma do Zeno.",
  "cores-em-acao": "Toque na cor que o Zeno pedir. Preste bem atenção!",
  "formas-e-encaixes": "Arraste cada forma para o lugar certinho.",
  "quebra-cabeca-zeno": "Monte o quebra-cabeça arrastando as peças.",
  "torre-de-argolas": "Empilhe as argolas da maior para a menor.",
  "sons-em-sequencia": "Escute a sequência de sons e repita na mesma ordem.",
  "quantos-tem": "Conte os elementos e toque no número certo.",
  "qual-nao-combina": "Descubra qual figura não combina com as outras.",
  "sequencia-magica": "Descubra qual figura continua a sequência.",
  "pintura-da-turma": "Escolha um personagem e pinte do seu jeito.",
  "desenho-livre": "Desenhe o que você quiser na tela em branco.",
};
