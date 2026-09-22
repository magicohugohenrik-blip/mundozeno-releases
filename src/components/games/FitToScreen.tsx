import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Escala o conteúdo do jogo para caber inteiro na área disponível,
 * evitando rolagem ou partes cortadas fora da tela.
 */
export function FitToScreen({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const box = outer.current;
    const content = inner.current;
    if (!box || !content) return;

    const measure = () => {
      const aw = box.clientWidth;
      const ah = box.clientHeight;
      const cw = content.offsetWidth;
      const ch = content.offsetHeight;
      if (!aw || !ah || !cw || !ch) return;
      const next = Math.min(4, aw / cw, ah / ch);
      setScale((prev) => (Math.abs(prev - next) > 0.005 ? next : prev));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(content);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  return (
    <div ref={outer} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <div
        ref={inner}
        style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
        className="w-full"
      >
        {children}
      </div>
    </div>
  );
}
