import { useMemo, useState } from "react";
import { cidCodes, cidLabel, type CidCode } from "@/lib/cid";

/**
 * Seletor de CID com busca e barra de rolagem (CID-10 e CID-11).
 * Permite marcar vários códigos em que a criança se enquadra.
 */
export function CidPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [term, setTerm] = useState("");
  const [system, setSystem] = useState<"todos" | "CID-10" | "CID-11">("todos");

  const list = useMemo<CidCode[]>(() => {
    const q = term.trim().toLowerCase();
    return cidCodes
      .filter((c) => system === "todos" || c.system === system)
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
      .slice(0, 400);
  }, [term, system]);

  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar CID por código ou nome (ex.: autismo, F84, 6A05)"
          className="min-w-[240px] flex-1 rounded-xl border border-border bg-background px-4 py-2"
        />
        <select
          value={system}
          onChange={(e) => setSystem(e.target.value as typeof system)}
          className="rounded-xl border border-border bg-background px-3 py-2"
        >
          <option value="todos">CID-10 e CID-11</option>
          <option value="CID-10">Somente CID-10</option>
          <option value="CID-11">Somente CID-11</option>
        </select>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((code) => (
            <button
              type="button"
              key={code}
              onClick={() => toggle(code)}
              className="rounded-full bg-zeno-blue/10 px-3 py-1 text-sm font-semibold text-zeno-blue"
              title="Remover"
            >
              {cidLabel(code)} ✕
            </button>
          ))}
        </div>
      )}

      <div className="max-h-60 overflow-y-auto rounded-xl border border-border bg-background">
        {list.map((c) => {
          const active = value.includes(c.code);
          return (
            <button
              type="button"
              key={`${c.system}-${c.code}`}
              onClick={() => toggle(c.code)}
              className={`flex w-full items-start gap-3 border-b border-border/60 px-3 py-2 text-left text-sm last:border-0 ${
                active ? "bg-zeno-green/10" : "hover:bg-secondary/60"
              }`}
            >
              <span className="mt-0.5 w-16 shrink-0 font-mono font-semibold text-zeno-blue">{c.code}</span>
              <span className="min-w-0 flex-1">{c.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{c.system}</span>
              {active && <span className="shrink-0 text-zeno-green">✓</span>}
            </button>
          );
        })}
        {list.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum CID encontrado.</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        Registro administrativo do CID informado por profissional habilitado. A plataforma não emite diagnóstico médico.
      </p>
    </div>
  );
}
