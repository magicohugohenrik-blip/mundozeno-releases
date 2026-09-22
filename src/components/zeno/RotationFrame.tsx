import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "zeno-rotation";

export function useRotation() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(STORAGE_KEY) ?? "0");
    if ([0, 90, 180, 270].includes(saved)) setRotation(saved);
  }, []);

  function rotate() {
    setRotation((prev) => {
      const next = (prev + 90) % 360;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return { rotation, rotate };
}

/** Rotates the whole table UI so it faces the child's side of the table. */
export function RotationFrame({ rotation, children }: { rotation: number; children: ReactNode }) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!size.width) return <div className="min-h-screen">{children}</div>;

  const quarter = rotation === 90 || rotation === 270;
  const width = quarter ? size.height : size.width;
  const height = quarter ? size.width : size.height;

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        data-zeno-frame
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width,
          height,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}