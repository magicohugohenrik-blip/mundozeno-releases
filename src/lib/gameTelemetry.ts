// Telemetria fina dos jogos da BIA.
// Coleta eventos durante a partida (acertos, erros, tentativas, dicas) e mede
// o tempo de reação entre o estímulo e a resposta. Os eventos são enviados
// junto com a sessão ao finalizar, alimentando a avaliação da IA (game_events).

import { useRef } from "react";

export type GameEventType = "correct" | "wrong" | "attempt" | "hint" | "complete";

export interface GameEvent {
  event_type: GameEventType;
  payload?: Record<string, unknown>;
  response_time_ms?: number;
}

/** Assinatura padrão de conclusão de jogo, agora carregando os eventos coletados. */
export type GameCompleteFn = (score: number, events?: GameEvent[]) => void;

export interface GameTracker {
  /** Marca o instante em que um novo estímulo é apresentado (base do tempo de reação). */
  mark: () => void;
  /** Registra um evento genérico calculando o tempo de reação desde o último mark. */
  track: (type: GameEventType, payload?: Record<string, unknown>) => void;
  /** Atalho para acerto. */
  correct: (payload?: Record<string, unknown>) => void;
  /** Atalho para erro. */
  wrong: (payload?: Record<string, unknown>) => void;
  /** Atalho para uso de dica/ajuda. */
  hint: (payload?: Record<string, unknown>) => void;
  /** Retorna os eventos coletados até agora. */
  getEvents: () => GameEvent[];
  /** Limpa os eventos (usado ao reiniciar a partida). */
  reset: () => void;
}

export function createTracker(): GameTracker {
  const events: GameEvent[] = [];
  let lastMark = typeof performance !== "undefined" ? performance.now() : Date.now();

  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  const mark = () => {
    lastMark = now();
  };

  const track: GameTracker["track"] = (type, payload) => {
    const t = now();
    const rt = Math.max(0, Math.round(t - lastMark));
    events.push(payload ? { event_type: type, payload, response_time_ms: rt } : { event_type: type, response_time_ms: rt });
    lastMark = t;
  };

  return {
    mark,
    track,
    correct: (payload) => track("correct", payload),
    wrong: (payload) => track("wrong", payload),
    hint: (payload) => track("hint", payload),
    getEvents: () => events.slice(),
    reset: () => {
      events.length = 0;
      lastMark = now();
    },
  };
}

/** Hook que devolve um tracker estável durante o ciclo de vida do componente. */
export function useGameTracker(): GameTracker {
  const ref = useRef<GameTracker | null>(null);
  if (!ref.current) ref.current = createTracker();
  return ref.current;
}
