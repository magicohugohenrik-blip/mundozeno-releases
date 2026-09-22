import { categories } from "@/lib/categories";
import { playSfx } from "@/lib/audio";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";

export function CategoryDial({
  active,
  onChange,
}: {
  active: string | null;
  onChange: (id: string | null) => void;
}) {
  const t = useT();
  const items = [
    { id: null as string | null, label: t("games.all"), emoji: "✨" },
    ...categories.map((c) => ({ id: c.id as string | null, label: t(`category.${c.id}` as TKey), emoji: c.emoji })),
  ];
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map((c) => {
        const on = active === c.id;
        return (
          <button
            key={c.id ?? "all"}
            onClick={() => {
              playSfx("tap");
              onChange(c.id);
            }}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-display text-base shadow-card transition-transform active:scale-95 ${
              on ? "bg-zeno-blue text-white" : "bg-card"
            }`}
          >
            <span className="text-2xl">{c.emoji}</span>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
