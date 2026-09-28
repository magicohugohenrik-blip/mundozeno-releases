import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Sem internet (mesa/Electron offline), getUser() falha na rede.
    // Nesse caso usamos a sessão já guardada no aparelho para não quebrar a tela.
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {
      /* offline: cai no fallback local abaixo */
    }
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) return { user: data.session.user };
    } catch {
      /* sem sessão local */
    }
    // Mesa já ativada e sem internet: deixa abrir para mostrar o relatório local
    // em vez de mandar o profissional para a tela de login.
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem("zeno_device_activated") === "1" &&
      !navigator.onLine
    ) {
      return { user: null };
    }
    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
