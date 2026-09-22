import { useEffect, useState } from "react";

/**
 * Preferências de acessibilidade da mesa, salvas no dispositivo (offline).
 * Fase 1 do design system: movimento reduzido e feedback consistente.
 */

const MOTION_KEY = "zeno-reduce-motion";

export function reduceMotionEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MOTION_KEY) === "on";
}

export function setReduceMotion(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOTION_KEY, on ? "on" : "off");
  applyReduceMotion(on);
  window.dispatchEvent(new CustomEvent("zeno-prefs"));
}

export function applyReduceMotion(on: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("reduce-motion", on);
}

/** Hook: lê e escreve a preferência de movimento reduzido. */
export function useReduceMotion(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => {
      const value = reduceMotionEnabled();
      setOn(value);
      applyReduceMotion(value);
    };
    sync();
    window.addEventListener("zeno-prefs", sync);
    return () => window.removeEventListener("zeno-prefs", sync);
  }, []);

  return [
    on,
    (next: boolean) => {
      setReduceMotion(next);
      setOn(next);
    },
  ];
}
