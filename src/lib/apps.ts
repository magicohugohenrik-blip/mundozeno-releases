/**
 * Registro de aplicativos do Mundo Zeno.
 * Para adicionar um novo aplicativo no futuro, basta incluir um item aqui
 * (e tratar o `id` na Home). Nada mais precisa ser reconstruído.
 */
import type { TKey } from "@/lib/i18n/pt";

export type ZenoAppId = "games" | "literacy" | "fonoplay" | "settings";

export interface ZenoApp {
  id: ZenoAppId;
  titleKey: TKey;
  descKey: TKey;
  emoji: string;
  /** classe de cor do design system */
  color: string;
  /** true = só aparece para quem tem permissão administrativa */
  adminOnly?: boolean;
}

export const zenoApps: ZenoApp[] = [
  {
    id: "games",
    titleKey: "app.games.title",
    descKey: "app.games.desc",
    emoji: "🎮",
    color: "bg-zeno-blue",
  },
  {
    id: "literacy",
    titleKey: "app.literacy.title",
    descKey: "app.literacy.desc",
    emoji: "🔤",
    color: "bg-zeno-green",
  },
  {
    id: "fonoplay",
    titleKey: "app.fonoplay.title",
    descKey: "app.fonoplay.desc",
    emoji: "🗣️",
    color: "bg-zeno-pink",
  },
  {
    id: "settings",
    titleKey: "app.settings.title",
    descKey: "app.settings.desc",
    emoji: "⚙️",
    color: "bg-wood-dark",
    adminOnly: true,
  },
];

export function appsFor(isAdmin: boolean): ZenoApp[] {
  return zenoApps.filter((app) => !app.adminOnly || isAdmin);
}
