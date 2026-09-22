import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { BrandMark } from "@/components/zeno/BrandMark";
import { ZenoSays } from "@/components/zeno/ZenoSays";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso profissional | Turma do Zeno" },
      {
        name: "description",
        content: "Entrada restrita para profissionais e administradores das instituições da Turma do Zeno.",
      },
      { property: "og:title", content: "Acesso profissional | Turma do Zeno" },
      { property: "og:description", content: "Área restrita da plataforma Turma do Zeno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/painel" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      void navigate({ to: "/painel" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        toast.success("Confira seu e-mail para confirmar o cadastro.");
        return;
      }
      void navigate({ to: "/painel" });
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/painel" });
  }

  return (
    <main className="surface-wood flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-8 shadow-card">
        <BrandMark className="mb-6" />
        <ZenoSays message="Área dos profissionais" size="sm" />
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-lg"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            required
            minLength={6}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-zeno-blue px-6 py-4 font-display text-xl text-white shadow-card active:scale-95 disabled:opacity-60"
          >
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <button
          onClick={google}
          className="mt-3 w-full rounded-full border border-border bg-background px-6 py-4 font-display text-lg active:scale-95"
        >
          Entrar com Google
        </button>
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-5 w-full text-sm text-muted-foreground underline"
        >
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
      </div>
    </main>
  );
}
