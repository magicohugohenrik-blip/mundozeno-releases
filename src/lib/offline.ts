import { useEffect, useState } from "react";
import { flushQueue, pendingCount } from "@/lib/session-sync";

/** Registra o service worker que mantém a mesa utilizável sem internet. */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

/** Estado de conexão + fila de sessões pendentes, com reenvio automático ao voltar online. */
export function useConnection(onPending?: (left: number) => void) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    let timer: ReturnType<typeof setInterval> | null = null;

    const sync = () => {
      void flushQueue().then((left) => onPending?.(left));
    };
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => {
      setOnline(false);
      onPending?.(pendingCount());
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    timer = setInterval(() => {
      if (navigator.onLine && pendingCount() > 0) sync();
    }, 30000);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      if (timer) clearInterval(timer);
    };
  }, [onPending]);

  return online;
}
