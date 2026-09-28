/** Profissões de saúde e educação que dão contexto para a IA da Tela Mágica. */
export const PROFESSIONS = [
  "general",
  "speech",
  "psychopedagogy",
  "occupational",
  "math",
  "literacy",
  "nutrition",
  "psychology",
] as const;

export type Profession = (typeof PROFESSIONS)[number];

/** Guarda a profissão escolhida no próprio aparelho (funciona sem internet). */
export const PROFESSION_STORE = "zeno.magic.profession";

export function isProfession(v: unknown): v is Profession {
  return typeof v === "string" && (PROFESSIONS as readonly string[]).includes(v);
}

/** Receita só faz sentido no contexto de alimentação/nutrição. */
export function allowsRecipe(p: Profession): boolean {
  return p === "nutrition";
}
