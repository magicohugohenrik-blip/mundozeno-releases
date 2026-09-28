import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Home, RefreshCw, WifiOff } from "lucide-react";
import { localReports } from "@/lib/local-report";
import { pendingCount } from "@/lib/session-sync";

/**
 * Relatório disponível sem internet (mesa/Electron offline).
 * Usa somente o histórico guardado na própria mesa — nenhuma chamada de rede.
 */
export function OfflineReports({ onRetry }: { onRetry?: () => void }) {
  const reports = useMemo(() => localReports(30), []);
  const pending = useMemo(() => pendingCount(), []);

  /** Backup do relatório local em CSV, sem depender de internet. */
  function exportCsv() {
    const head = "crianca,partidas,jogos,acertos_pct,duracao_media_s,tempo_resposta_s,ajudas";
    const rows = reports.map((r) =>
      [
        `"${r.name.replace(/"/g, '""')}"`,
        r.sessions,
        r.games,
        r.accuracy,
        r.avgDurationSeconds,
        r.avgResponseSeconds ?? "",
        r.hints,
      ].join(","),
    );
    const blob = new Blob([[head, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-mesa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-muted/40 px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 font-display text-2xl">
              <WifiOff size={22} strokeWidth={2.2} />
              Relatórios — dados salvos na mesa
            </h1>
            <Link
              to="/"
              className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-card active:scale-95"
            >
              <Home size={18} strokeWidth={2.2} />
              Voltar para o início
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            A mesa está sem internet. Mostrando o histórico guardado no próprio aparelho — ele é
            enviado sozinho quando a conexão voltar.
            {pending > 0 ? ` ${pending} partida(s) aguardando envio.` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-semibold active:scale-95"
              >
                <RefreshCw size={18} strokeWidth={2.2} />
                Tentar de novo
              </button>
            )}
            {reports.length > 0 && (
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-semibold active:scale-95"
              >
                <Download size={18} strokeWidth={2.2} />
                Exportar CSV
              </button>
            )}
          </div>
        </header>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-display text-lg">Nenhum dado sincronizado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assim que as crianças jogarem nesta mesa, o relatório aparece aqui — mesmo sem internet.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.studentId} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-display text-lg">{r.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {r.sessions} partida(s) · {r.games} jogo(s)
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <Stat label="Acertos" value={`${r.accuracy}%`} />
                  <Stat label="Duração média" value={`${r.avgDurationSeconds}s`} />
                  <Stat
                    label="Tempo de resposta"
                    value={r.avgResponseSeconds != null ? `${r.avgResponseSeconds}s` : "—"}
                  />
                  <Stat label="Ajudas" value={String(r.hints)} />
                </div>
                {r.bySkill.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.bySkill.map((s) => `${s.skill}: ${s.accuracy}%`).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="font-display text-base">{value}</span>
    </div>
  );
}
