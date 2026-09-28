import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Clock, Copy, Infinity as InfinityIcon, CalendarDays, Table2, User } from "lucide-react";
import { createReportShare } from "@/lib/report-share.functions";
import { publicOrigin } from "@/lib/publicUrl";

type Validity = { kind: "hours"; hours: number } | { kind: "days"; days: number } | { kind: "unlimited" };

/**
 * QR Code unificado da mesa: o profissional acompanha no celular as turmas,
 * as crianças, os relatórios e os gráficos. Pode ser da mesa inteira ou de
 * uma criança específica, com validade em horas, dias ou sem prazo.
 */
export function ReportQr({
  studentId,
  studentName,
  onClose,
}: {
  studentId?: string | null;
  studentName?: string | null;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<"org" | "student">(studentId ? "student" : "org");
  const [url, setUrl] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validity, setValidity] = useState<Validity>({ kind: "hours", hours: 12 });
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(false);

  const generate = useCallback(
    async (choice: Validity, target: "org" | "student") => {
      setLoading(true);
      setError(null);
      setImage(null);
      try {
        const who = target === "student" && studentId ? { studentId } : {};
        const payload =
          choice.kind === "unlimited"
            ? { ...who, unlimited: true }
            : choice.kind === "days"
              ? { ...who, days: choice.days }
              : { ...who, hours: choice.hours };
        const res = await createReportShare({ data: payload });
        const link = `${publicOrigin()}/m/${res.token}`;
        setUrl(link);
        setExpiresAt(choice.kind === "unlimited" ? null : res.expiresAt);
        setImage(await QRCode.toDataURL(link, { width: 420, margin: 1 }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível gerar o QR Code.");
      } finally {
        setLoading(false);
      }
    },
    [studentId],
  );

  useEffect(() => {
    void generate({ kind: "hours", hours: 12 }, studentId ? "student" : "org");
  }, [generate, studentId]);

  function choose(next: Validity) {
    setValidity(next);
    void generate(next, scope);
  }

  function chooseScope(next: "org" | "student") {
    setScope(next);
    void generate(validity, next);
  }

  const chip = (on: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
      on ? "bg-zeno-blue text-white" : "border border-border"
    }`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl">Acompanhar no celular</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Turmas, crianças, relatórios, gráficos e cadastro de novas crianças.
        </p>

        {studentId && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" className={chip(scope === "org")} onClick={() => chooseScope("org")}>
              <Table2 size={16} strokeWidth={2.2} />
              Mesa inteira
            </button>
            <button type="button" className={chip(scope === "student")} onClick={() => chooseScope("student")}>
              <User size={16} strokeWidth={2.2} />
              {studentName || "Esta criança"}
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" className={chip(validity.kind === "hours")} onClick={() => choose({ kind: "hours", hours: 12 })}>
            <Clock size={16} strokeWidth={2.2} />
            12 horas
          </button>
          <button
            type="button"
            className={chip(validity.kind === "days")}
            onClick={() => choose({ kind: "days", days: Math.max(1, Number(days) || 30) })}
          >
            <CalendarDays size={16} strokeWidth={2.2} />
            Dias
          </button>
          <button type="button" className={chip(validity.kind === "unlimited")} onClick={() => choose({ kind: "unlimited" })}>
            <InfinityIcon size={16} strokeWidth={2.2} />
            Sem prazo
          </button>
        </div>

        {validity.kind === "days" && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <input
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-center text-sm"
              aria-label="Quantidade de dias"
            />
            <span className="text-sm text-muted-foreground">dias</span>
            <button
              type="button"
              onClick={() => choose({ kind: "days", days: Math.min(3650, Math.max(1, Number(days) || 30)) })}
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold"
            >
              Aplicar
            </button>
          </div>
        )}

        {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
        {!error && loading && <p className="mt-6 text-sm text-muted-foreground">Gerando o código…</p>}
        {image && !loading && (
          <>
            <img src={image} alt="QR Code do relatório" className="mx-auto mt-4 w-64 rounded-2xl bg-white p-3" />
            <p className="mt-3 text-sm text-muted-foreground">
              Aponte a câmera do celular.{" "}
              {expiresAt ? `O link vale até ${new Date(expiresAt).toLocaleString("pt-BR")}.` : "Este link não tem prazo."}
            </p>
            {url && <p className="mt-1 break-all text-xs text-muted-foreground">{url}</p>}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (url) void navigator.clipboard?.writeText(url);
                  toast.success("Link copiado!");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                <Copy size={16} strokeWidth={2.2} />
                Copiar link
              </button>
              <button type="button" onClick={onClose} className="rounded-xl bg-zeno-blue px-5 py-2 text-sm font-semibold text-white">
                Fechar
              </button>
            </div>
          </>
        )}
        {(error || (!image && !loading)) && (
          <button type="button" onClick={onClose} className="mt-6 rounded-xl border border-border px-5 py-2 text-sm font-semibold">
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}
