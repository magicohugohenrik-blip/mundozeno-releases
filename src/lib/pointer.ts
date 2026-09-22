/**
 * Conversão de coordenadas do dedo/mouse para o espaço interno de um elemento,
 * desfazendo rotação da mesa e escala do FitToScreen.
 */

/** Transformações acumuladas do elemento e de todos os ancestrais. */
function accumulatedMatrix(el: HTMLElement): DOMMatrix {
  let m = new DOMMatrix();
  const chain: HTMLElement[] = [];
  let node: HTMLElement | null = el;
  while (node) {
    chain.push(node);
    node = node.parentElement;
  }
  for (const n of chain.reverse()) {
    const t = getComputedStyle(n).transform;
    if (t && t !== "none") m = m.multiply(new DOMMatrix(t));
  }
  return m;
}

/** Apenas a parte linear (rotação/escala), sem deslocamento. */
function linearInverse(el: HTMLElement): DOMMatrix {
  const m = accumulatedMatrix(el);
  const linear = new DOMMatrix([m.a, m.b, m.c, m.d, 0, 0]);
  try {
    return linear.inverse();
  } catch {
    return new DOMMatrix();
  }
}

/**
 * Ponto do evento em coordenadas internas do elemento (px, sem transformações).
 * Funciona em qualquer ângulo porque o centro do elemento transformado
 * continua sendo o centro do retângulo visível.
 */
export function localPoint(el: HTMLElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  const inv = linearInverse(el);
  const p = inv.transformPoint(
    new DOMPoint(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2)),
  );
  return { x: el.offsetWidth / 2 + p.x, y: el.offsetHeight / 2 + p.y };
}

/** Mesma conversão, em fração 0–1 da largura/altura do elemento. */
export function localFraction(el: HTMLElement, clientX: number, clientY: number): { x: number; y: number } {
  const p = localPoint(el, clientX, clientY);
  const w = el.offsetWidth || 1;
  const h = el.offsetHeight || 1;
  return { x: p.x / w, y: p.y / h };
}

/**
 * Ponto no espaço da moldura girada da mesa — usado por elementos `fixed`,
 * cujo posicionamento passa a ser relativo ao contêiner transformado.
 */
export function framePoint(clientX: number, clientY: number): { x: number; y: number } {
  if (typeof document === "undefined") return { x: clientX, y: clientY };
  const frame = document.querySelector<HTMLElement>("[data-zeno-frame]");
  if (!frame) return { x: clientX, y: clientY };
  return localPoint(frame, clientX, clientY);
}
