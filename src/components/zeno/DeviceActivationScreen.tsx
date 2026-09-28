import { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
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

/** Reconecta a mesa já ativada usando o código guardado (sem digitar nada). */
export async function reconnectDevice(code: string): Promise<boolean> {
  try {
    const res = await activateDevice({ data: { code } });
    if (!res.ok) {
      if (res.reason !== "no_account") clearDeviceActivation();
      return false;
    }
    const { error } = await supabase.auth.verifyOtp({ token_hash: res.tokenHash, type: "magiclink" });
    return !error;
  } catch {
    return false;
  }
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
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return;
    setError(null);
    if (!navigator.onLine) {
      setError(t("activation.offline"));
      return;
    }
    setLoading(true);
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
      setError(navigator.onLine ? t("activation.error") : t("activation.offline"));
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
          <p className="text-sm text-muted-foreground">{t("activation.internetOnce")}</p>
          <span
            className={`mt-1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
              online ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}
          >
            {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {online ? t("activation.statusOnline") : t("activation.statusOffline")}
          </span>
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
            <div className="space-y-3 rounded-2xl bg-destructive/10 px-4 py-3 text-center">
              <p className="font-semibold text-destructive">{error}</p>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-background px-5 py-2 font-semibold text-destructive disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                {t("activation.retry")}
              </button>
            </div>
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
