import { motion } from "motion/react";
import { literacyCatalog, type LiteracyActivity } from "@/lib/literacy/catalog";
import { skillLabels } from "@/lib/skills";
import { useI18n } from "@/lib/i18n";
import { playSfx } from "@/lib/audio";

const LEVEL_BADGE: Record<number, { dot: string; key: "literacy.easy" | "literacy.medium" | "literacy.hard" }> = {
  1: { dot: "bg-zeno-green", key: "literacy.easy" },
  2: { dot: "bg-zeno-orange", key: "literacy.medium" },
  3: { dot: "bg-zeno-pink", key: "literacy.hard" },
};

/** Ordem dos cards: Libras primeiro, depois dinâmicos, depois os demais. */
function rank(slug: string): number {
  if (slug.startsWith("alfa-libras-")) return 0;
  if (slug.startsWith("alfa-d-")) return 1;
  return 2;
}

/** Área independente de Alfabetização: cards grandes, sem barras de progresso. */
export function LiteracyScreen({
  onBack,
  onPlay,
}: {
  onBack: () => void;
  onPlay: (activity: LiteracyActivity) => void;
}) {
  const { t, lang } = useI18n();
  const badge = LEVEL_BADGE[3]!;

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
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">🔤 {t("literacy.title")}</h2>
          <p className="text-sm text-muted-foreground sm:text-base">{t("literacy.subtitle")}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...literacyCatalog]
          .sort((a, b) => rank(a.slug) - rank(b.slug))
          .map((activity, i) => (
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
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-xl leading-tight sm:text-2xl">{activity.title[lang]}</span>
              {activity.slug.startsWith("alfa-libras-") ? (
                <span className="rounded-full bg-zeno-purple/20 px-3 py-1 text-xs font-semibold">🤟 Libras</span>
              ) : null}
            </span>
            <span className="text-sm leading-snug text-muted-foreground">{activity.description[lang]}</span>
            <span className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              <span className="flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1 text-xs font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${badge.dot}`} />
                {t("literacy.easy")} · {t("literacy.medium")} · {t("literacy.hard")}
              </span>
              <span className="rounded-full bg-secondary/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                {skillLabels[lang][activity.skills[0]!]}
              </span>
              {!activity.available ? (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">🔒 {t("literacy.locked")}</span>
              ) : null}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

/** Cartão de entrada da área, exibido na tela de atividades. */
export function LiteracyAreaCard({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        playSfx("tap");
        onOpen();
      }}
      className="flex w-full items-center gap-4 rounded-[2rem] bg-card p-4 text-left shadow-card sm:p-5"
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-zeno-blue/15 text-3xl sm:h-20 sm:w-20 sm:text-4xl">
        🔤
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl leading-tight sm:text-2xl">{t("literacy.title")}</span>
        <span className="block text-sm text-muted-foreground sm:text-base">{t("literacy.subtitle")}</span>
      </span>
      <span className="shrink-0 rounded-full bg-zeno-blue px-5 py-2 font-display text-base text-white sm:text-lg">
        {t("literacy.open")}
      </span>
    </motion.button>
  );
}
