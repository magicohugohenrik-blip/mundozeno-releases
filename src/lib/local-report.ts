/**
 * Histórico local de partidas guardado na própria mesa.
 * Permite ver um relatório simplificado (sem IA e sem internet) na Área Técnica,
 * mesmo quando a fila já foi sincronizada e esvaziada.
 */

const KEY = "zeno_local_history";
const MAX = 800;

export interface LocalPlay {
  student_id: string;
  student_name: string;
  game_slug: string;
  skill: string;
  score: number;
  hits: number;
  misses: number;
  duration_seconds: number;
  response_ms: number[];
  hints: number;
  played_at: string;
}

function read(): LocalPlay[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as LocalPlay[];
  } catch {
    return [];
  }
}

export function logLocalPlay(play: LocalPlay) {
  if (typeof window === "undefined") return;
  const all = [...read(), play].slice(-MAX);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearLocalHistory() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

export interface LocalStudentReport {
  studentId: string;
  name: string;
  sessions: number;
  games: number;
  accuracy: number;
  avgDurationSeconds: number;
  avgResponseSeconds: number | null;
  hints: number;
  bySkill: { skill: string; accuracy: number; sessions: number }[];
}

/** Agrupa o histórico local por criança nos últimos `days` dias. */
export function localReports(days = 30): LocalStudentReport[] {
  const since = Date.now() - days * 86400000;
  const plays = read().filter((p) => new Date(p.played_at).getTime() >= since);
  const byStudent = new Map<string, LocalPlay[]>();
  for (const p of plays) {
    const list = byStudent.get(p.student_id) ?? [];
    list.push(p);
    byStudent.set(p.student_id, list);
  }

  return [...byStudent.entries()]
    .map(([studentId, list]) => {
      const hits = list.reduce((n, p) => n + p.hits, 0);
      const misses = list.reduce((n, p) => n + p.misses, 0);
      const times = list.flatMap((p) => p.response_ms).filter((n) => n > 0);
      const skills = new Map<string, { hits: number; misses: number; sessions: number }>();
      for (const p of list) {
        const key = p.skill || "geral";
        const s = skills.get(key) ?? { hits: 0, misses: 0, sessions: 0 };
        s.hits += p.hits;
        s.misses += p.misses;
        s.sessions += 1;
        skills.set(key, s);
      }
      return {
        studentId,
        name: list[list.length - 1]?.student_name || studentId,
        sessions: list.length,
        games: new Set(list.map((p) => p.game_slug)).size,
        accuracy: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0,
        avgDurationSeconds: Math.round(list.reduce((n, p) => n + p.duration_seconds, 0) / list.length),
        avgResponseSeconds: times.length
          ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) / 100) / 10
          : null,
        hints: list.reduce((n, p) => n + p.hints, 0),
        bySkill: [...skills.entries()]
          .map(([skill, s]) => ({
            skill,
            sessions: s.sessions,
            accuracy: s.hits + s.misses > 0 ? Math.round((s.hits / (s.hits + s.misses)) * 100) : 0,
          }))
          .sort((a, b) => b.accuracy - a.accuracy),
      };
    })
    .sort((a, b) => b.sessions - a.sessions);
}
