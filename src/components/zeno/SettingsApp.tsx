import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import {
  checkForUpdates,
  downloadUpdate,
  hasUpdater,
  installUpdate,
  onUpdateStatus,
  openWifiSettings,
  type UpdateStatus,
} from "@/lib/updater";
import { isDesktop } from "@/lib/desktop";
import { appVersion, getDeviceCode } from "@/lib/session-sync";

/**
 * Aplicativo de Configurações (somente administrador):
 * atualização do sistema, rede/Wi-Fi e informações do dispositivo.
 */
export function SettingsApp({ online, onClose }: { online: boolean; onClose: () => void }) {
  const t = useT();
  const native = hasUpdater();
  const [state, setState] = useState<UpdateStatus>({ status: "idle" });

  useEffect(() => onUpdateStatus((s) => setState(s)), []);

  async function check() {
    setState({ status: "checking" });
    const result = await checkForUpdates();
    if (result) setState(result);
  }

  async function download() {
    setState({ status: "downloading", percent: 0, version: state.version ?? "" });
    const result = await downloadUpdate();
    if (result) setState(result);
  }

  const statusText = (() => {
    switch (state.status) {
      case "checking":
        return t("set.checking");
      case "available":
        return t("set.available", { version: state.version ?? "" });
      case "downloading":
        return t("set.downloading", { percent: Math.round(state.percent ?? 0) });
      case "ready":
        return t("set.ready");
      case "error":
        return state.message || t("set.updateError");
      case "not-available":
        return t("set.upToDate");
      default:
        return native ? t("set.upToDate") : t("set.appOnly");
    }
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-wood-dark/80 p-4 backdrop-blur">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-card p-6 shadow-toy">
        <header className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl sm:text-3xl">⚙️ {t("set.title")}</h2>
          <button
            onClick={onClose}
            className="min-h-[3.5rem] rounded-full bg-secondary px-6 font-display text-lg text-secondary-foreground active:scale-95"
          >
            {t("set.close")}
          </button>
        </header>

        {/* Atualização */}
        <article className="mt-6 rounded-[1.5rem] bg-background p-5">
          <h3 className="font-display text-xl">🔄 {t("set.update")}</h3>
          <p className="mt-2 text-base text-muted-foreground">
            {t("set.version")}: <strong>{appVersion()}</strong>
          </p>
          <p className="mt-1 text-base text-muted-foreground">
            {t("set.status")}: <strong>{statusText}</strong>
          </p>

          {state.status === "downloading" && (
            <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-zeno-green transition-all"
                style={{ width: `${Math.round(state.percent ?? 0)}%` }}
              />
            </div>
          )}

          {native ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={check}
                className="min-h-[3.5rem] rounded-full bg-zeno-blue px-6 font-display text-lg text-white active:scale-95"
              >
                {t("set.check")}
              </button>
              {state.status === "available" && (
                <button
                  onClick={download}
                  className="min-h-[3.5rem] rounded-full bg-zeno-orange px-6 font-display text-lg text-white active:scale-95"
                >
                  {t("set.download")}
                </button>
              )}
              {state.status === "ready" && (
                <button
                  onClick={installUpdate}
                  className="min-h-[3.5rem] rounded-full bg-zeno-green px-6 font-display text-lg text-white active:scale-95"
                >
                  {t("set.install")}
                </button>
              )}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-base text-secondary-foreground">
              {t("set.appOnly")}
            </p>
          )}
        </article>

        {/* Rede */}
        <article className="mt-4 rounded-[1.5rem] bg-background p-5">
          <h3 className="font-display text-xl">📶 {t("set.network")}</h3>
          <p className="mt-2 text-base text-muted-foreground">
            {t("set.connection")}: <strong>{online ? t("set.online") : t("set.offline")}</strong>
          </p>
          <button
            onClick={() => {
              if (!openWifiSettings()) alert(t("set.wifiHint"));
            }}
            className="mt-4 min-h-[3.5rem] rounded-full bg-zeno-blue px-6 font-display text-lg text-white active:scale-95"
          >
            {t("set.wifiOpen")}
          </button>
          <p className="mt-2 text-sm text-muted-foreground">{t("set.wifiHint")}</p>
        </article>

        {/* Sistema */}
        <article className="mt-4 rounded-[1.5rem] bg-background p-5">
          <h3 className="font-display text-xl">💻 {t("set.system")}</h3>
          <ul className="mt-2 space-y-1 text-base text-muted-foreground">
            <li>
              {t("set.product")}: <strong>Mundo Zeno</strong>
            </li>
            <li>
              {t("set.version")}: <strong>{appVersion()}</strong>
            </li>
            <li>
              {t("set.device")}: <strong>{getDeviceCode() || "—"}</strong>
            </li>
            <li>
              {t("set.platform")}: <strong>{isDesktop() ? "Windows (app)" : "Web"}</strong>
            </li>
            <li>
              {t("set.connection")}: <strong>{online ? t("set.online") : t("set.offline")}</strong>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
