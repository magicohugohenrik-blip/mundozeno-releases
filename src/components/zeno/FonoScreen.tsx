import { motion } from "motion/react";
import { fonoCatalog, fonoGroupLabels, type FonoActivity, type FonoGroup } from "@/lib/fono/catalog";
import { skillLabels } from "@/lib/skills";
import { useI18n } from "@/lib/i18n";
import { playSfx } from "@/lib/audio";

const GROUPS: FonoGroup[] = ["sons", "praxias", "vocabulario", "auditiva"];

/** Área independente do FonoPlay: atividades agrupadas por objetivo terapêutico. */
export function FonoScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (activity: FonoActivity) => void }) {
  const { t, lang } = useI18n();
  const groups = fonoGroupLabels[lang] ?? fonoGroupLabels.pt;

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            playSfx("tap");
            onBack();
          }}
          className="flex items-center gap-2 rounded-full bg-card px-5 py-3 font-display text-lg shadow-card active:scale-95"
        >
          ← {t("common.back")}
        </button>
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">🗣️ {t("app.fonoplay.title")}</h2>
          <p className="text-sm text-muted-foreground sm:text-base">{t("fono.subtitle")}</p>
        </div>
      </div>

      {GROUPS.map((group) => {
        const items = fonoCatalog.filter((a) => a.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mt-7">
            <h3 className="font-display text-xl text-foreground sm:text-2xl">{groups[group]}</h3>
            <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((activity, i) => (
                <motion.button
                  key={activity.slug}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 260, damping: 22 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!activity.available}
                  onClick={() => {
                    playSfx("tap");
                    onPlay(activity);
                  }}
                  className={`flex flex-col gap-3 rounded-[2rem] bg-card p-5 text-left shadow-card ${
                    activity.available ? "" : "opacity-60"
                  }`}
                >
                  <span
                    className={`flex h-20 w-20 items-center justify-center rounded-[1.5rem] text-4xl ${activity.tint}`}
                    aria-hidden
                  >
                    {activity.emoji}
                  </span>
                  <span className="font-display text-xl leading-tight sm:text-2xl">{activity.title[lang]}</span>
                  <span className="text-sm leading-snug text-muted-foreground">{activity.description[lang]}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <span className="flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1 text-xs font-semibold">
                      {t("literacy.easy")} · {t("literacy.medium")} · {t("literacy.hard")}
                    </span>
                    <span className="rounded-full bg-secondary/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {skillLabels[lang][activity.skills[0]!]}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
