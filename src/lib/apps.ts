/**
 * Registro de aplicativos do Mundo Zeno.
 * Para adicionar um novo aplicativo no futuro, basta incluir um item aqui
 * (e tratar o `id` na Home). Nada mais precisa ser reconstruído.
 */
import type { TKey } from "@/lib/i18n/pt";
import cover_cores from "@/assets/app-covers/cores.webp";
import cover_criar from "@/assets/app-covers/criar.webp";
import cover_fonoplay from "@/assets/app-covers/fonoplay.webp";
import cover_formas from "@/assets/app-covers/formas.webp";
import cover_literacy from "@/assets/app-covers/literacy.webp";
import cover_logica from "@/assets/app-covers/logica.webp";
import cover_memoria from "@/assets/app-covers/memoria.webp";
import cover_settings from "@/assets/app-covers/settings.webp";

export type ZenoAppId =
  | "games"
  | "memoria"
  | "cores"
  | "formas"
  | "logica"
  | "criar"
  | "literacy"
  | "fonoplay"
  | "desenho"
  | "magica"
  | "atividades"
  | "settings";

export interface ZenoApp {
  id: ZenoAppId;
  titleKey: TKey;
  descKey: TKey;
  emoji: string;
  /** classe de cor do design system */
  color: string;
  /** capa visual do aplicativo */
  coverUrl?: string;
  /** true = só aparece para quem tem permissão administrativa */
  adminOnly?: boolean;
  /** quando presente, o aplicativo abre direto os jogos desta categoria */
  category?: string;
}

/** Cada tipo de jogo é um aplicativo próprio na Home. */
export const zenoApps: ZenoApp[] = [
  {
    id: "memoria",
    titleKey: "app.memoria.title",
    descKey: "app.memoria.desc",
    emoji: "🧠",
    color: "bg-zeno-blue",
    coverUrl: cover_memoria,
    category: "memoria",
  },
  {
    id: "logica",
    titleKey: "app.logica.title",
    descKey: "app.logica.desc",
    emoji: "🔢",
    color: "bg-zeno-purple",
    coverUrl: cover_logica,
    category: "logica",
  },
  {
    id: "cores",
    titleKey: "app.cores.title",
    descKey: "app.cores.desc",
    emoji: "🎯",
    color: "bg-zeno-green",
    coverUrl: cover_cores,
    category: "cores",
  },
  {
    id: "formas",
    titleKey: "app.formas.title",
    descKey: "app.formas.desc",
    emoji: "🔷",
    color: "bg-zeno-orange",
    coverUrl: cover_formas,
    category: "formas",
  },
  {
    id: "criar",
    titleKey: "app.criar.title",
    descKey: "app.criar.desc",
    emoji: "🎨",
    color: "bg-zeno-pink",
    coverUrl: cover_criar,
    category: "criar",
  },
  {
    id: "literacy",
    titleKey: "app.literacy.title",
    descKey: "app.literacy.desc",
    emoji: "🔤",
    color: "bg-zeno-green",
    coverUrl: cover_literacy,
  },
  {
    id: "fonoplay",
    titleKey: "app.fonoplay.title",
    descKey: "app.fonoplay.desc",
    emoji: "🗣️",
    color: "bg-zeno-pink",
    coverUrl: cover_fonoplay,
  },
  {
    id: "desenho",
    titleKey: "app.desenho.title",
    descKey: "app.desenho.desc",
    emoji: "✏️",
    color: "bg-zeno-pink",
  },
  {
    id: "magica",
    titleKey: "app.magica.title",
    descKey: "app.magica.desc",
    emoji: "✨",
    color: "bg-zeno-purple",
  },
  {
    id: "atividades",
    titleKey: "app.atividades.title",
    descKey: "app.atividades.desc",
    emoji: "📚",
    color: "bg-zeno-orange",
  },
  {
    id: "settings",
    titleKey: "app.settings.title",
    descKey: "app.settings.desc",
    emoji: "⚙️",
    color: "bg-wood-dark",
    coverUrl: cover_settings,
    adminOnly: true,
  },
];

export function appsFor(isAdmin: boolean): ZenoApp[] {
  return zenoApps.filter((app) => !app.adminOnly || isAdmin);
}

/** Categoria de jogos ligada a um aplicativo (quando houver). */
export function categoryOfApp(id: ZenoAppId): string | null {
  return zenoApps.find((a) => a.id === id)?.category ?? null;
}

