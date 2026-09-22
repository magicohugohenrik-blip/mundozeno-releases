import { anamnesisFields, anamnesisGroups, type Anamnesis } from "@/lib/anamnesis";
import { CidPicker } from "@/components/painel/CidPicker";

/** Formulário de anamnese + CIDs, usado no cadastro e na edição da criança. */
export function AnamnesisForm({
  value,
  onChange,
  cids,
  onCidsChange,
}: {
  value: Anamnesis;
  onChange: (next: Anamnesis) => void;
  cids: string[];
  onCidsChange: (next: string[]) => void;
}) {
  function set(key: string, v: string) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="font-display text-lg">CID da criança</h3>
        <CidPicker value={cids} onChange={onCidsChange} />
      </section>

      {anamnesisGroups.map((group) => (
        <section key={group} className="space-y-3">
          <h3 className="font-display text-lg">{group}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {anamnesisFields
              .filter((f) => f.group === group)
              .map((f) => (
                <label key={f.key} className={`flex flex-col gap-1 text-sm ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                  <span className="font-semibold text-muted-foreground">{f.label}</span>
                  {f.type === "textarea" ? (
                    <textarea
                      value={value[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      maxLength={1000}
                      rows={2}
                      className="rounded-xl border border-border bg-background px-4 py-2"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={value[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="rounded-xl border border-border bg-background px-4 py-2"
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o} value={o}>{o || "Selecione"}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={value[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      maxLength={200}
                      className="rounded-xl border border-border bg-background px-4 py-2"
                    />
                  )}
                </label>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
