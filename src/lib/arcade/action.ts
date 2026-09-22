/**
 * Catálogo dos jogos DINÂMICOS (movimento, tempo e reflexo).
 * Um jogo novo = uma linha nova em `rows`; os motores ficam em
 * src/components/games/action/.
 */
import type { Lang } from "@/lib/i18n";
import type { SkillId } from "@/lib/skills";
import type { CatalogGame } from "@/lib/zeno";
import { themeNames, type ThemeId } from "@/lib/arcade/content";

export type ActionKind = "pop" | "whack" | "catch" | "sort" | "reflex" | "chase";

export interface ActionGame {
  slug: string;
  emoji: string;
  categoryId: string;
  kind: ActionKind;
  theme: ThemeId;
  skills: SkillId[];
  title: Record<Lang, string>;
}

const SKILLS: Record<ActionKind, SkillId[]> = {
  pop: ["atencao"],
  whack: ["atencao", "memoria"],
  catch: ["atencao", "sequenciamento"],
  sort: ["atencao", "associacao-imagem-palavra"],
  reflex: ["atencao"],
  chase: ["atencao", "memoria"],
};

const CATEGORY: Record<ActionKind, string> = {
  pop: "cores",
  whack: "cores",
  catch: "formas",
  sort: "formas",
  reflex: "logica",
  chase: "memoria",
};

type Row = [string, string, ActionKind, ThemeId, string, string, string];

const rows: Row[] = [
  ["d-estoura-frutas", "🫧", "pop", "fruits", "Estoura Frutas", "Pop the Fruits", "Reventa Frutas"],
  ["d-estoura-mar", "🐠", "pop", "sea", "Bolhas do Mar", "Sea Bubbles", "Burbujas del Mar"],
  ["d-estoura-espaco", "🚀", "pop", "space", "Bolhas Espaciais", "Space Bubbles", "Burbujas Espaciales"],
  ["d-toca-animais", "🐹", "whack", "animals", "Toca-Toca dos Animais", "Animal Whack", "Toca-Toca de Animales"],
  ["d-toca-insetos", "🐞", "whack", "insects", "Toca-Toca dos Insetos", "Bug Whack", "Toca-Toca de Insectos"],
  ["d-cesta-frutas", "🧺", "catch", "fruits", "Cesta de Frutas", "Fruit Basket", "Canasta de Frutas"],
  ["d-cesta-mar", "🪣", "catch", "sea", "Pesca na Cesta", "Basket Fishing", "Pesca en la Canasta"],
  ["d-cesta-doces", "🧁", "catch", "food", "Chuva de Comidinhas", "Snack Rain", "Lluvia de Comiditas"],
  ["d-separa-animais", "🐻", "sort", "animals", "Separa os Animais", "Sort the Animals", "Separa los Animales"],
  ["d-separa-veiculos", "🚚", "sort", "vehicles", "Separa os Veículos", "Sort the Vehicles", "Separa los Vehículos"],
  ["d-reflexo-foguete", "🟢", "reflex", "space", "Reflexo do Foguete", "Rocket Reflex", "Reflejo del Cohete"],
  ["d-reflexo-corrida", "🏁", "reflex", "sports", "Largada Rápida", "Fast Start", "Salida Rápida"],
  ["d-pega-brinquedo", "🎈", "chase", "toys", "Pega o Balão", "Catch the Balloon", "Atrapa el Globo"],
  ["d-pega-passaros", "🦜", "chase", "birds", "Pega o Passarinho", "Catch the Bird", "Atrapa el Pájaro"],
];

export const actionCatalog: ActionGame[] = rows.map(([slug, emoji, kind, theme, pt, en, es]) => ({
  slug,
  emoji,
  categoryId: CATEGORY[kind],
  kind,
  theme,
  skills: SKILLS[kind],
  title: { pt, en, es },
}));

export function actionBySlug(slug: string): ActionGame | undefined {
  return actionCatalog.find((g) => g.slug === slug);
}

export function isAction(slug: string): boolean {
  return slug.startsWith("d-");
}

export const actionCategoryBySlug: Record<string, string> = Object.fromEntries(
  actionCatalog.map((g) => [g.slug, g.categoryId]),
);

/** Textos dos motores dinâmicos nos 3 idiomas. */
type ActionTextKey =
  | "popPrompt"
  | "whackPrompt"
  | "catchPrompt"
  | "sortPrompt"
  | "reflexWait"
  | "reflexGo"
  | "reflexEarly"
  | "chasePrompt"
  | "timeLeft"
  | "hits"
  | "sortHere"
  | "sortOther"
  | "ready";

const TEXTS: Record<Lang, Record<ActionTextKey, string>> = {
  pt: {
    popPrompt: "Estoure só as bolhas com {item}!",
    whackPrompt: "Toque nas figuras que aparecem. Cuidado com a bomba 💣!",
    catchPrompt: "Arraste a cesta e pegue apenas {theme}. Não pegue as pedras 🪨!",
    sortPrompt: "Coloque cada figura na cesta certa antes de cair!",
    reflexWait: "Espere o verde...",
    reflexGo: "Agora! Toque rápido!",
    reflexEarly: "Calma, espere o verde!",
    chasePrompt: "Pegue o {item} que foge!",
    timeLeft: "Tempo",
    hits: "Acertos",
    sortHere: "{theme}",
    sortOther: "Outros",
    ready: "Preparar...",
  },
  en: {
    popPrompt: "Pop only the bubbles with {item}!",
    whackPrompt: "Tap the figures that pop up. Watch out for the bomb 💣!",
    catchPrompt: "Drag the basket and catch only {theme}. Avoid the rocks 🪨!",
    sortPrompt: "Put each figure in the right basket before it falls!",
    reflexWait: "Wait for green...",
    reflexGo: "Now! Tap fast!",
    reflexEarly: "Easy, wait for green!",
    chasePrompt: "Catch the {item} that runs away!",
    timeLeft: "Time",
    hits: "Hits",
    sortHere: "{theme}",
    sortOther: "Others",
    ready: "Get ready...",
  },
  es: {
    popPrompt: "¡Revienta solo las burbujas con {item}!",
    whackPrompt: "¡Toca las figuras que aparecen. Cuidado con la bomba 💣!",
    catchPrompt: "¡Arrastra la canasta y atrapa solo {theme}. Evita las piedras 🪨!",
    sortPrompt: "¡Pon cada figura en la canasta correcta antes de que caiga!",
    reflexWait: "Espera el verde...",
    reflexGo: "¡Ahora! ¡Toca rápido!",
    reflexEarly: "¡Calma, espera el verde!",
    chasePrompt: "¡Atrapa el {item} que escapa!",
    timeLeft: "Tiempo",
    hits: "Aciertos",
    sortHere: "{theme}",
    sortOther: "Otros",
    ready: "Preparados...",
  },
};

export function actionText(lang: Lang, key: ActionTextKey, vars?: Record<string, string>): string {
  const raw = TEXTS[lang]?.[key] ?? TEXTS.pt[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

/** Instrução falada pelo Zeno ao abrir o jogo dinâmico. */
export function actionInstruction(game: ActionGame, lang: Lang): string {
  const theme = themeNames[game.theme][lang] ?? themeNames[game.theme].pt;
  switch (game.kind) {
    case "pop":
      return actionText(lang, "popPrompt", { item: theme });
    case "whack":
      return actionText(lang, "whackPrompt", { theme });
    case "catch":
      return actionText(lang, "catchPrompt", { theme });
    case "sort":
      return actionText(lang, "sortPrompt");
    case "reflex":
      return actionText(lang, "reflexWait");
    case "chase":
      return actionText(lang, "chasePrompt", { item: theme });
  }
}

export function actionToGame(game: ActionGame, lang: Lang): CatalogGame {
  const title = game.title[lang] ?? game.title.pt;
  return {
    slug: game.slug,
    title,
    skill: game.skills.join(", "),
    emoji: game.emoji,
    color: "bg-zeno-pink",
    character: "beni",
    customTitle: title,
    customInstruction: actionInstruction(game, lang),
    config: { skills: game.skills, dynamic: true },
  };
}
