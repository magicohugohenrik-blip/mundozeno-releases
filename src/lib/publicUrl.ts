/** Endereço público para links abertos em outros aparelhos (QR Code, compartilhar).
 * No aplicativo do Windows a origem é interna (zeno-app://), então usa o site publicado. */
export function publicOrigin(): string {
  const o = typeof window !== "undefined" ? window.location.origin : "";
  return o.startsWith("http") ? o : "https://turmadozeno.lovable.app";
}
