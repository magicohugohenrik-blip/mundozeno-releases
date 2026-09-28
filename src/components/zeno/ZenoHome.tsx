import { useState } from "react";
import { motion } from "motion/react";
import { appsFor, type ZenoApp, type ZenoAppId } from "@/lib/apps";
import { appState, isHidden, type AppAccessMap } from "@/lib/appAccess";
import { useT } from "@/lib/i18n";
import { portraitOf } from "@/lib/zeno";

/**
 * Home do Mundo Zeno: uma "tela de aplicativos" para a criança.
 * Novos aplicativos aparecem automaticamente ao serem incluídos em src/lib/apps.ts.
 */
export function ZenoHome({
  childName,
  avatarCharacter,
  avatarColor,
  isAdmin,
  access,
  onOpenApp,
  onSwitchChild,
}: {
  childName: string;
  avatarCharacter?: string | undefined;
  avatarColor?: string | undefined;
  isAdmin: boolean;
  access?: AppAccessMap;
  onOpenApp: (id: ZenoAppId) => void;
  onSwitchChild: () => void;
}) {
  const t = useT();
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const map: AppAccessMap = access ?? {};
  const apps: ZenoApp[] = appsFor(isAdmin).filter((a) => !isHidden(map, a.id));


  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-card/90 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-4">
          <img
            src={portraitOf(avatarCharacter)}
            alt=""
            width={256}
            height={256}
            className={`h-16 w-16 rounded-full object-cover ${avatarColor ?? "bg-zeno-blue"}`}
          />
          <div>
            <h1 className="font-display text-3xl text-foreground sm:text-4xl">{t("home.hi", { name: childName })}</h1>
            <p className="text-base text-muted-foreground">{t("home.subtitle")}</p>
          </div>
        </div>
        <button
          onClick={onSwitchChild}
          className="min-h-[3.5rem] rounded-full bg-secondary px-6 font-display text-lg text-secondary-foreground shadow-card active:scale-95"
        >
          👧 {t("home.switchChild")}
        </button>
      </div>

      <h2 className="mt-6 font-display text-2xl text-foreground sm:text-3xl">{t("home.apps")}</h2>

      <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {apps.map((app, i) => {
          // Aplicativos de categoria herdam a liberação geral dos jogos.
          const own = appState(map, app.id);
          const state = app.category && own === "ok" ? appState(map, "games") : own;
          const locked = state !== "ok";

          return (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: locked ? 1 : 0.95 }}
              disabled={locked}
              onClick={() => !locked && onOpenApp(app.id)}
              aria-label={`${t(app.titleKey)} — ${locked ? t(state === "expired" ? "home.expired" : "home.locked") : t(app.descKey)}`}
              className={`relative aspect-square min-h-[11rem] overflow-hidden rounded-[2rem] text-left text-primary-foreground shadow-toy ${app.color} ${
                locked ? "opacity-60 grayscale" : ""
              }`}
            >
              {app.coverUrl && !broken[app.id] ? (
                <img
                  onError={() => setBroken((b) => ({ ...b, [app.id]: true }))}
                  src={app.coverUrl}
                  alt=""
                  className="absolute inset-[-2px] h-[calc(100%+4px)] w-[calc(100%+4px)] max-w-none object-fill"
                  draggable={false}
                />
              ) : (
                <>
                  <span className="pattern-stars absolute inset-0 opacity-25" />
                  <span className="relative block p-6 text-6xl leading-none">{app.emoji}</span>
                  <span className="relative block px-6 font-display text-2xl leading-tight">{t(app.titleKey)}</span>
                  <span className="relative mt-1 block px-6 text-sm opacity-90">{t(app.descKey)}</span>
                </>
              )}
              {locked && (
                <span className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/55 p-4 text-center">
                  <span className="text-5xl" aria-hidden="true">🔒</span>
                  <span className="mt-2 font-display text-lg">
                    {t(state === "expired" ? "home.expired" : "home.locked")}
                  </span>
                </span>
              )}
            </motion.button>
          );
        })}


        <div className="flex min-h-[11rem] items-center justify-center rounded-[2rem] border-4 border-dashed border-white/60 bg-card/50 p-6 text-center font-display text-lg text-muted-foreground">
          ✨ {t("home.soon")}
        </div>
      </div>
    </section>
  );
}
