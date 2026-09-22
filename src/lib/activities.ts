import { supabase } from "@/integrations/supabase/client";
import { gameCatalog, type CatalogGame, type CharacterId } from "@/lib/zeno";

/** Configuração personalizável de uma atividade (sem programação). */
export interface ActivityConfig {
  [key: string]: unknown;
  /** Quantidade de elementos (cartas, peças, itens) — quando o jogo suporta. */
  count?: number;
  /** Tempo sugerido em segundos (0 = sem tempo). */
  timeSeconds?: number;
  /** Mensagem de conclusão personalizada. */
  message?: string;
  /** Instrução falada pelo Zeno no início. */
  instruction?: string;
}

export interface ActivityRow {
  id: string;
  organization_id: string;
  owner_id: string;
  base_slug: string;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  level: number;
  config: ActivityConfig;
  visibility: "private" | "organization";
  active: boolean;
}

export const ACTIVITY_SELECT =
  "id, organization_id, owner_id, base_slug, title, description, emoji, color, level, config, visibility, active";

function baseOf(slug: string): CatalogGame | undefined {
  return gameCatalog.find((g) => g.slug === slug);
}

/** Converte uma atividade personalizada em um cartão jogável do catálogo. */
export function activityToGame(row: ActivityRow): CatalogGame {
  const base = baseOf(row.base_slug);
  return {
    slug: row.base_slug,
    title: row.title,
    skill: base?.skill ?? "atividade",
    emoji: row.emoji,
    color: row.color,
    character: (base?.character ?? "zeno") as CharacterId,
    activityId: row.id,
    customTitle: row.title,
    customInstruction: row.config?.instruction || row.description || undefined,
    config: row.config ?? {},
  };
}

/** Atividades personalizadas visíveis para a mesa (instituição do usuário logado). */
export async function loadActivities(): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as ActivityRow[];
}

/** Configuração inicial ao duplicar um jogo oficial. */
export function defaultConfigFor(slug: string): ActivityConfig {
  switch (slug) {
    case "memoria-turma":
      return { count: 4 };
    case "quebra-cabeca-zeno":
      return { count: 3 };
    default:
      return {};
  }
}

/** Rótulo do parâmetro "quantidade" para cada jogo (vazio = jogo não usa). */
export function countLabelFor(slug: string): string | null {
  switch (slug) {
    case "memoria-turma":
      return "Pares de cartas";
    case "quebra-cabeca-zeno":
      return "Peças por lado";
    default:
      return null;
  }
}
