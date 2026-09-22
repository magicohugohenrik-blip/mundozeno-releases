/**
 * Catálogo dos jogos gerais gerados por motor reutilizável.
 * Um jogo novo = uma linha nova aqui (slug, ícone, categoria, motor, tema, títulos).
 */
import type { Lang } from "@/lib/i18n";
import type { SkillId } from "@/lib/skills";
import type { CatalogGame } from "@/lib/zeno";
import type { ThemeId } from "@/lib/arcade/content";

export type ArcadeKind =
  | "count"
  | "odd"
  | "same"
  | "pattern"
  | "bigger"
  | "smaller"
  | "next"
  | "missing"
  | "sum"
  | "sub"
  | "moreOf"
  | "lessOf"
  | "themePick"
  | "colorPick"
  | "shapePick";

export interface ArcadeGame {
  slug: string;
  emoji: string;
  categoryId: string;
  kind: ArcadeKind;
  theme: ThemeId;
  skills: SkillId[];
  title: Record<Lang, string>;
}

type Row = [string, string, string, ArcadeKind, ThemeId, string, string, string];

const SKILLS: Record<ArcadeKind, SkillId[]> = {
  count: ["atencao", "sequenciamento"],
  odd: ["atencao"],
  same: ["memoria", "atencao"],
  pattern: ["sequenciamento", "atencao"],
  bigger: ["sequenciamento"],
  smaller: ["sequenciamento"],
  next: ["sequenciamento"],
  missing: ["sequenciamento", "atencao"],
  sum: ["sequenciamento"],
  sub: ["sequenciamento"],
  moreOf: ["atencao"],
  lessOf: ["atencao"],
  themePick: ["atencao", "associacao-imagem-palavra"],
  colorPick: ["atencao"],
  shapePick: ["atencao"],
};

const rows: Row[] = [
  // ---- Lógica e números ----
  ["z-conta-animais", "🐾", "logica", "count", "animals", "Conte os Animais", "Count the Animals", "Cuenta los Animales"],
  ["z-conta-frutas", "🍎", "logica", "count", "fruits", "Conte as Frutas", "Count the Fruits", "Cuenta las Frutas"],
  ["z-conta-mar", "🐠", "logica", "count", "sea", "Conte no Fundo do Mar", "Count Under the Sea", "Cuenta en el Mar"],
  ["z-conta-carros", "🚗", "logica", "count", "vehicles", "Conte os Veículos", "Count the Vehicles", "Cuenta los Vehículos"],
  ["z-conta-insetos", "🐝", "logica", "count", "insects", "Conte os Insetos", "Count the Insects", "Cuenta los Insectos"],
  ["z-conta-brinquedos", "🧸", "logica", "count", "toys", "Conte os Brinquedos", "Count the Toys", "Cuenta los Juguetes"],
  ["z-soma-frutas", "➕", "logica", "sum", "fruits", "Soma das Frutas", "Fruit Addition", "Suma de Frutas"],
  ["z-soma-brinquedos", "🎁", "logica", "sum", "toys", "Soma dos Brinquedos", "Toy Addition", "Suma de Juguetes"],
  ["z-soma-comidas", "🍕", "logica", "sum", "food", "Soma no Piquenique", "Picnic Addition", "Suma del Picnic"],
  ["z-menos-frutas", "➖", "logica", "sub", "fruits", "Quantas Sobraram?", "How Many Left?", "¿Cuántas Quedaron?"],
  ["z-menos-mar", "🐬", "logica", "sub", "sea", "Peixinhos que Sobraram", "Fish Left Over", "Peces que Quedaron"],
  ["z-menos-fazenda", "🐮", "logica", "sub", "farm", "Fazenda do Zeno", "Zeno's Farm", "La Granja de Zeno"],
  ["z-numero-maior", "🔝", "logica", "bigger", "space", "Número Maior", "Bigger Number", "Número Mayor"],
  ["z-numero-menor", "🔽", "logica", "smaller", "space", "Número Menor", "Smaller Number", "Número Menor"],
  ["z-numero-seguinte", "🔢", "logica", "next", "space", "Qual Vem Depois?", "What Comes Next?", "¿Qué Viene Después?"],
  ["z-numero-faltando", "❓", "logica", "missing", "space", "Número Escondido", "Hidden Number", "Número Escondido"],
  ["z-mais-animais", "🐶", "logica", "moreOf", "animals", "Onde Tem Mais?", "Where Is There More?", "¿Dónde Hay Más?"],
  ["z-mais-frutas", "🍇", "logica", "moreOf", "fruits", "Cesta Mais Cheia", "Fuller Basket", "Canasta Más Llena"],
  ["z-menos-brinquedos", "🪀", "logica", "lessOf", "toys", "Onde Tem Menos?", "Where Is There Less?", "¿Dónde Hay Menos?"],

  // ---- Memória e atenção visual ----
  ["z-igual-animais", "🐱", "memoria", "same", "animals", "Ache o Animal Igual", "Find the Same Animal", "Encuentra el Animal Igual"],
  ["z-igual-frutas", "🍓", "memoria", "same", "fruits", "Ache a Fruta Igual", "Find the Same Fruit", "Encuentra la Fruta Igual"],
  ["z-igual-espaco", "🚀", "memoria", "same", "space", "Ache o Igual no Espaço", "Find the Same in Space", "Encuentra el Igual del Espacio"],
  ["z-igual-instrumentos", "🎸", "memoria", "same", "music", "Ache o Instrumento Igual", "Find the Same Instrument", "Encuentra el Instrumento Igual"],
  ["z-igual-passaros", "🦉", "memoria", "same", "birds", "Ache o Pássaro Igual", "Find the Same Bird", "Encuentra el Pájaro Igual"],
  ["z-sequencia-animais", "🐾", "memoria", "pattern", "animals", "Sequência dos Animais", "Animal Sequence", "Secuencia de Animales"],
  ["z-sequencia-frutas", "🍌", "memoria", "pattern", "fruits", "Sequência das Frutas", "Fruit Sequence", "Secuencia de Frutas"],
  ["z-sequencia-brinquedos", "🎈", "memoria", "pattern", "toys", "Sequência dos Brinquedos", "Toy Sequence", "Secuencia de Juguetes"],
  ["z-sequencia-tempo", "🌈", "memoria", "pattern", "weather", "Sequência do Tempo", "Weather Sequence", "Secuencia del Clima"],
  ["z-sequencia-esportes", "⚽", "memoria", "pattern", "sports", "Sequência dos Esportes", "Sports Sequence", "Secuencia de Deportes"],
  ["z-sequencia-jardim", "🌻", "memoria", "pattern", "garden", "Sequência do Jardim", "Garden Sequence", "Secuencia del Jardín"],

  // ---- Cores e atenção ----
  ["z-cores-arco-iris", "🌈", "cores", "colorPick", "weather", "Cores do Arco-Íris", "Rainbow Colors", "Colores del Arcoíris"],
  ["z-caca-cores", "🎨", "cores", "colorPick", "toys", "Caça-Cores", "Color Hunt", "Caza-Colores"],
  ["z-cores-da-turma", "🖌️", "cores", "colorPick", "garden", "Cores da Turma", "Class Colors", "Colores del Grupo"],
  ["z-diferente-animais", "🔍", "cores", "odd", "animals", "Intruso dos Animais", "Animal Intruder", "El Intruso Animal"],
  ["z-diferente-frutas", "🍉", "cores", "odd", "fruits", "Intruso das Frutas", "Fruit Intruder", "El Intruso Frutal"],
  ["z-diferente-veiculos", "🚌", "cores", "odd", "vehicles", "Intruso dos Veículos", "Vehicle Intruder", "El Intruso Vehicular"],
  ["z-diferente-mar", "🦀", "cores", "odd", "sea", "Intruso do Mar", "Sea Intruder", "El Intruso del Mar"],
  ["z-diferente-musica", "🎺", "cores", "odd", "music", "Intruso da Banda", "Band Intruder", "El Intruso de la Banda"],
  ["z-diferente-espaco", "🪐", "cores", "odd", "space", "Intruso do Espaço", "Space Intruder", "El Intruso Espacial"],
  ["z-diferente-comidas", "🍔", "cores", "odd", "food", "Intruso da Cozinha", "Kitchen Intruder", "El Intruso de la Cocina"],
  ["z-diferente-esportes", "🏀", "cores", "odd", "sports", "Intruso dos Esportes", "Sports Intruder", "El Intruso Deportivo"],

  // ---- Formas e classificação ----
  ["z-formas-basicas", "🔷", "formas", "shapePick", "toys", "Formas Divertidas", "Fun Shapes", "Formas Divertidas"],
  ["z-caca-formas", "⭐", "formas", "shapePick", "space", "Caça-Formas", "Shape Hunt", "Caza-Formas"],
  ["z-formas-do-zeno", "🔺", "formas", "shapePick", "garden", "Formas do Zeno", "Zeno's Shapes", "Formas de Zeno"],
  ["z-grupo-animais", "🐻", "formas", "themePick", "animals", "Onde Está o Animal?", "Where Is the Animal?", "¿Dónde Está el Animal?"],
  ["z-grupo-frutas", "🍊", "formas", "themePick", "fruits", "Onde Está a Fruta?", "Where Is the Fruit?", "¿Dónde Está la Fruta?"],
  ["z-grupo-veiculos", "🚒", "formas", "themePick", "vehicles", "Onde Está o Veículo?", "Where Is the Vehicle?", "¿Dónde Está el Vehículo?"],
  ["z-grupo-insetos", "🐞", "formas", "themePick", "insects", "Onde Está o Insetinho?", "Where Is the Bug?", "¿Dónde Está el Insecto?"],
  ["z-grupo-dinos", "🦕", "formas", "themePick", "dino", "Onde Está o Dinossauro?", "Where Is the Dinosaur?", "¿Dónde Está el Dinosaurio?"],
];

export const arcadeCatalog: ArcadeGame[] = rows.map(([slug, emoji, categoryId, kind, theme, pt, en, es]) => ({
  slug,
  emoji,
  categoryId,
  kind,
  theme,
  skills: SKILLS[kind],
  title: { pt, en, es },
}));

export function arcadeBySlug(slug: string): ArcadeGame | undefined {
  return arcadeCatalog.find((g) => g.slug === slug);
}

export function isArcade(slug: string): boolean {
  return slug.startsWith("z-");
}

/** Categoria de cada jogo gerado (usada pelo mapa de categorias). */
export const arcadeCategoryBySlug: Record<string, string> = Object.fromEntries(
  arcadeCatalog.map((g) => [g.slug, g.categoryId]),
);

export function arcadeToGame(game: ArcadeGame, lang: Lang): CatalogGame {
  const title = game.title[lang] ?? game.title.pt;
  return {
    slug: game.slug,
    title,
    skill: game.skills.join(", "),
    emoji: game.emoji,
    color: "bg-zeno-blue",
    character: "zeno",
    customTitle: title,
    config: { skills: game.skills },
  };
}
