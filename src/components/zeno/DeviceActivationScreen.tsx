import { useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { activateDevice } from "@/lib/device.functions";
import { setDeviceCode } from "@/lib/session-sync";
import { BrandMark } from "@/components/zeno/BrandMark";
import { LanguageSwitch } from "@/components/zeno/LanguageSwitch";
import { useT } from "@/lib/i18n";
import { portraitOf } from "@/lib/zeno";

const ACTIVE_KEY = "zeno_device_activated";

/** Marca local: esta mesa já foi identificada com um código válido. */
export function deviceActivated(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ACTIVE_KEY) === "1";
}

export function clearDeviceActivation(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(ACTIVE_KEY);
}

/**
 * Primeiro acesso da mesa: sem um código válido o Mundo Zeno não abre.
 * O código é conferido no servidor, que devolve um acesso de uso único —
 * a criança nunca digita usuário nem senha.
 */
export function DeviceActivationScreen({ onActivated }: { onActivated: () => void }) {
  const t = useT();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await activateDevice({ data: { code: code.trim().toUpperCase() } });
      if (!res.ok) {
        setError(
          res.reason === "not_found"
            ? t("activation.notFound")
            : res.reason === "blocked"
              ? t("activation.blocked")
              : t("activation.noAccount"),
        );
        return;
      }
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: res.tokenHash,
        type: "magiclink",
      });
      if (otpError) {
        setError(t("activation.error"));
        return;
      }
      setDeviceCode(res.code);
      window.localStorage.setItem(ACTIVE_KEY, "1");
      onActivated();
    } catch {
      setError(t("activation.error"));
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
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">{t("activation.title")}</h1>
          <p className="text-base text-muted-foreground">{t("activation.subtitle")}</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-muted-foreground">{t("activation.code")}</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              autoCapitalize="characters"
              placeholder="MESA-XXXX-XXXX"
              className="min-h-[3.75rem] w-full rounded-2xl border border-border bg-background px-5 text-center font-mono text-2xl tracking-widest"
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
            {loading ? t("activation.loading") : t("activation.submit")}
          </button>
        </form>
      </motion.section>
    </main>
  );
}
