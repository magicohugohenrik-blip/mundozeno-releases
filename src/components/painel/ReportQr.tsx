import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { createReportShare } from "@/lib/report-share.functions";

/**
 * Gera na mesa um QR Code temporário para o profissional acompanhar
 * os relatórios e gráficos da criança pelo celular.
 */
export function ReportQr({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await createReportShare({ data: { studentId, hours: 12 } });
        if (!alive) return;
        const link = `${window.location.origin}/m/${res.token}`;
        setUrl(link);
        setExpiresAt(res.expiresAt);
        setImage(await QRCode.toDataURL(link, { width: 420, margin: 1 }));
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Não foi possível gerar o QR Code.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl">Acompanhar no celular</h2>
        <p className="mt-1 text-sm text-muted-foreground">{studentName}</p>

        {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
        {!error && !image && <p className="mt-6 text-sm text-muted-foreground">Gerando o código…</p>}
        {image && (
          <>
            <img src={image} alt="QR Code do relatório" className="mx-auto mt-4 w-64 rounded-2xl bg-white p-3" />
            <p className="mt-3 text-sm text-muted-foreground">
              Aponte a câmera do celular. O link expira em{" "}
              {expiresAt ? new Date(expiresAt).toLocaleString("pt-BR") : "12 horas"}.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (url) void navigator.clipboard?.writeText(url);
                  toast.success("Link copiado!");
                }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                Copiar link
              </button>
              <button type="button" onClick={onClose} className="rounded-xl bg-zeno-blue px-5 py-2 text-sm font-semibold text-white">
                Fechar
              </button>
            </div>
          </>
        )}
        {(error || !image) && (
          <button type="button" onClick={onClose} className="mt-6 rounded-xl border border-border px-5 py-2 text-sm font-semibold">
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}
