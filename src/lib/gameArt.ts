import memoria from "@/assets/games/memoria-turma.png";
import cores from "@/assets/games/cores-em-acao.png";
import formas from "@/assets/games/formas-e-encaixes.png";
import puzzle from "@/assets/games/quebra-cabeca-zeno.png";
import argolas from "@/assets/games/torre-de-argolas.png";
import sons from "@/assets/games/sons-em-sequencia.png";
import quantos from "@/assets/games/quantos-tem.png";
import combina from "@/assets/games/qual-nao-combina.png";
import sequencia from "@/assets/games/sequencia-magica.png";
import pintura from "@/assets/games/pintura-da-turma.png";
import desenho from "@/assets/games/desenho-livre.png";
import { categoryOf } from "@/lib/categories";

/** Ilustração de capa de cada jogo (sem personagens, sem emojis). */
export const gameArt: Record<string, string> = {
  "memoria-turma": memoria,
  "cores-em-acao": cores,
  "formas-e-encaixes": formas,
  "quebra-cabeca-zeno": puzzle,
  "torre-de-argolas": argolas,
  "sons-em-sequencia": sons,
  "quantos-tem": quantos,
  "qual-nao-combina": combina,
  "sequencia-magica": sequencia,
  "pintura-da-turma": pintura,
  "desenho-livre": desenho,
};

/** Tom pastel do quadro da ilustração, por categoria. */
const categoryTint: Record<string, string> = {
  memoria: "bg-zeno-blue/15",
  cores: "bg-zeno-green/15",
  formas: "bg-zeno-orange/15",
  logica: "bg-zeno-purple/15",
  criar: "bg-zeno-pink/15",
};

/** Ilustração do jogo, com fallback pela categoria (atividades personalizadas). */
export function artOf(slug: string): string {
  if (gameArt[slug]) return gameArt[slug]!;
  const fallback = categoryOf(slug).slugs.find((s) => gameArt[s]);
  return gameArt[fallback ?? "memoria-turma"]!;
}

export function tintOf(slug: string): string {
  return categoryTint[categoryOf(slug).id] ?? "bg-muted";
}
