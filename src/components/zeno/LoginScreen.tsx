import { useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { resolveLoginEmail } from "@/lib/login.functions";
import { BrandMark } from "@/components/zeno/BrandMark";
import { LanguageSwitch } from "@/components/zeno/LanguageSwitch";
import { useT } from "@/lib/i18n";
import { portraitOf } from "@/lib/zeno";

/**
 * Tela inicial do Mundo Zeno: entrada segura de responsáveis e administradores.
 * A senha é sempre verificada pelo serviço de autenticação — nunca no navegador.
 */
export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const t = useT();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveEmail(raw: string): Promise<string | null> {
    const value = raw.trim();
    if (value.includes("@")) return value;
    try {
      const { email } = await resolveLoginEmail({ data: { identifier: value } });
      if (email) return email;
    } catch {
      // servidor indisponível: usa a função protegida do banco diretamente
    }
    const { data } = await supabase.rpc("resolve_login_email", { _username: value.toLowerCase() });
    return (data as string | null) ?? null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const email = await resolveEmail(identifier);
      if (!email) {
        setError(t("login.error"));
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(t("login.error"));
        return;
      }
      onSignedIn();
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="surface-kids flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="absolute right-4 top-4">
        <LanguageSwitch compact />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="w-full max-w-xl rounded-[2.5rem] bg-card/95 p-8 shadow-toy backdrop-blur sm:p-10"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={portraitOf("zeno")}
            alt=""
            width={256}
            height={256}
            className="h-24 w-24 animate-float object-contain drop-shadow-lg"
          />
          <BrandMark />
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">{t("login.title")}</h1>
          <p className="text-base text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-muted-foreground">{t("login.user")}</span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              className="min-h-[3.75rem] w-full rounded-2xl border border-border bg-background px-5 text-xl"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-muted-foreground">{t("login.pass")}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="min-h-[3.75rem] w-full rounded-2xl border border-border bg-background px-5 text-xl"
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-center font-semibold text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-[4rem] w-full rounded-full bg-zeno-blue px-6 font-display text-2xl text-white shadow-toy active:scale-95 disabled:opacity-60"
          >
            {loading ? t("login.loading") : t("login.enter")}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">{t("login.hint")}</p>
      </motion.section>
    </main>
  );
}
