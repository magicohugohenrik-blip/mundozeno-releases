/**
 * Endereço público usado nos QR Codes e links compartilhados.
 *
 * Na mesa Windows o aplicativo abre por um endereço interno (zeno-app://),
 * que nenhum celular consegue abrir. Por isso os links sempre apontam para o
 * domínio oficial, exceto quando estamos em desenvolvimento local.
 */
export const PUBLIC_SITE = "https://www.mundozeno.com";

export function publicOrigin(): string {
  if (typeof window === "undefined") return PUBLIC_SITE;
  const origin = window.location.origin;
  if (!origin.startsWith("http")) return PUBLIC_SITE;
  const host = window.location.hostname;
  // Desenvolvimento local e pré-visualização continuam usando o próprio endereço.
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".lovable.app")) return origin;
  return PUBLIC_SITE;
}
