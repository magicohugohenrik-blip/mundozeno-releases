import { useEffect, useState } from "react";
import { flushQueue, pendingCount } from "@/lib/session-sync";
import { pendingStudentCount } from "@/lib/local-students";

/** Registra o service worker que mantém a mesa utilizável sem internet. */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

export type SyncStatus = "online" | "offline" | "syncing" | "synced";

const EVENT = "zeno:sync-status";

function announce(status: SyncStatus) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: status }));
  }
}

/** Tudo o que ainda não chegou ao servidor: partidas + crianças cadastradas na mesa. */
export function totalPending(): number {
  return pendingCount() + pendingStudentCount();
}

/** Reenvia o que está guardado na mesa e avisa o estado para a interface. */
export async function syncNow(): Promise<number> {
  if (typeof window === "undefined") return 0;
  if (!navigator.onLine) {
    announce("offline");
    return totalPending();
  }
  if (totalPending() === 0) {
    announce("online");
    return 0;
  }
  announce("syncing");
  await flushQueue();
  const left = totalPending();
  announce(left === 0 ? "synced" : "online");
  return left;
}

/** Estado de conexão + fila pendente, com reenvio automático ao voltar online. */
export function useConnection(onPending?: (left: number) => void) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    let timer: ReturnType<typeof setInterval> | null = null;

    const sync = () => {
      void syncNow().then((left) => onPending?.(left));
    };
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => {
      setOnline(false);
      announce("offline");
      onPending?.(totalPending());
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    // Ao abrir o aplicativo: se houver dados guardados, tenta enviar já.
    sync();
    timer = setInterval(() => {
      if (navigator.onLine && totalPending() > 0) sync();
    }, 30000);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      if (timer) clearInterval(timer);
    };
  }, [onPending]);

  return online;
}

/** Aviso discreto de Online / Offline / Sincronizando / Sincronizado. */
export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>("online");

  useEffect(() => {
    setStatus(navigator.onLine ? (totalPending() > 0 ? "online" : "synced") : "offline");
    const handler = (e: Event) => setStatus((e as CustomEvent<SyncStatus>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return status;
}
