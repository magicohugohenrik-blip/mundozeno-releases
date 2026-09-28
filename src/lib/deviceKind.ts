/**
 * Distingue celular/tablet da mesa interativa (monitor grande, sem impressora).
 * A opção de imprimir só aparece em aparelhos de mão.
 */
export function isHandheld(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(ua);
  const narrow = window.matchMedia?.("(max-width: 1024px)").matches ?? window.innerWidth <= 1024;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return mobileUa || (narrow && coarse);
}
