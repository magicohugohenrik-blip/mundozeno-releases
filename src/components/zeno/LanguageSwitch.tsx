import { LANGS, useI18n } from "@/lib/i18n";
import { playSfx } from "@/lib/audio";

/** Seletor de idioma da mesa: português, inglês e espanhol. */
export function LanguageSwitch({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("lang.aria")}
      className={`flex shrink-0 items-center gap-1 rounded-full bg-card p-1 shadow-card ${className}`}
    >
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => {
            playSfx("tap");
            setLang(l.id);
          }}
          aria-pressed={lang === l.id}
          className={`flex items-center gap-1 rounded-full font-bold transition-colors ${
            compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
          } ${lang === l.id ? "bg-zeno-blue text-white" : "text-muted-foreground"}`}
        >
          <span aria-hidden className={compact ? "text-sm leading-none" : "text-base leading-none"}>
            {l.flag}
          </span>
          {l.label}
        </button>
      ))}
    </div>
  );
}
