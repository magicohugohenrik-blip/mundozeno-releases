/**
 * Desenho vetorial de configurações de mão (Libras).
 * Um sinal é descrito por dados (dedos, polegar, giro, movimento) e o
 * componente monta o desenho — sem imagens, funciona off-line e em qualquer tela.
 */

export type FingerState = "up" | "half" | "curl" | "down";
export type ThumbState = "side" | "out" | "up" | "across" | "in" | "between" | "touch";
export type SpecialShape = "c" | "o" | "cross";

export interface HandSpec {
  /** Indicador, médio, anelar e mínimo, nesta ordem. */
  fingers: [FingerState, FingerState, FingerState, FingerState];
  thumb: ThumbState;
  /** Giro da mão em graus (positivo = deitada para a direita). */
  rotate?: number;
  /** Formatos especiais desenhados no lugar dos dedos. */
  shape?: SpecialShape;
  /** Movimento indicado por seta (letras J e Z, números com movimento). */
  motion?: "j" | "z";
  /** Dedos afastados (V) ou juntos (U). */
  spread?: boolean;
}

const SKIN = "hsl(28 62% 78%)";
const SKIN_DARK = "hsl(24 48% 66%)";

const FINGERS = [
  { x: 39, w: 14, len: 46 },
  { x: 55, w: 14, len: 52 },
  { x: 71, w: 14, len: 46 },
  { x: 86, w: 12, len: 36 },
];

const PALM_TOP = 66;

function lengthFor(state: FingerState, full: number): number {
  if (state === "up") return full;
  if (state === "half") return full * 0.52;
  if (state === "curl") return full * 0.3;
  return 0;
}

function Finger({
  x,
  w,
  len,
  state,
  offset = 0,
}: {
  x: number;
  w: number;
  len: number;
  state: FingerState;
  offset?: number;
}) {
  const l = lengthFor(state, len);
  if (state === "down") {
    return (
      <rect
        x={x - w / 2}
        y={PALM_TOP - 12}
        width={w}
        height={18}
        rx={w / 2}
        fill={SKIN_DARK}
        stroke={SKIN_DARK}
        strokeWidth={1}
      />
    );
  }
  return (
    <rect
      x={x - w / 2 + offset}
      y={PALM_TOP - l}
      width={w}
      height={l + 12}
      rx={w / 2}
      fill={SKIN}
      stroke={SKIN_DARK}
      strokeWidth={1.5}
    />
  );
}

function Thumb({ state }: { state: ThumbState }) {
  const common = { fill: SKIN, stroke: SKIN_DARK, strokeWidth: 1.5 } as const;
  switch (state) {
    case "up":
      return <rect x={12} y={54} width={14} height={46} rx={7} {...common} />;
    case "out":
      return <rect x={0} y={82} width={40} height={14} rx={7} {...common} />;
    case "across":
      return <rect x={26} y={86} width={52} height={14} rx={7} {...common} />;
    case "in":
      return <rect x={30} y={70} width={26} height={13} rx={6.5} {...common} />;
    case "between":
      return <rect x={44} y={56} width={13} height={20} rx={6.5} {...common} />;
    case "touch":
      return <rect x={22} y={62} width={16} height={34} rx={8} {...common} />;
    case "side":
    default:
      return <rect x={16} y={68} width={15} height={40} rx={7.5} {...common} />;
  }
}

function Motion({ kind }: { kind: "j" | "z" }) {
  const d = kind === "j" ? "M100 118 q0 18 -18 18 q-12 0 -14 -10" : "M92 108 h26 l-26 20 h26";
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="7 7"
      opacity={0.55}
    />
  );
}

/** Mão desenhada a partir da configuração informada. */
export function HandSign({ spec, className = "" }: { spec: HandSpec; className?: string }) {
  const spread = spec.spread ?? false;
  const offsets = spread ? [-6, 4, 0, 0] : [0, 0, 0, 0];

  return (
    <svg
      viewBox="0 0 130 160"
      className={`text-zeno-blue ${className}`}
      role="img"
      aria-hidden
      focusable="false"
    >
      <g transform={`rotate(${spec.rotate ?? 0} 65 95)`}>
        {spec.shape !== "c" && spec.shape !== "o" ? (
          <>
            {spec.shape === "cross" ? (
              <>
                <rect
                  x={FINGERS[0]!.x - 7}
                  y={PALM_TOP - 46}
                  width={14}
                  height={58}
                  rx={7}
                  fill={SKIN}
                  stroke={SKIN_DARK}
                  strokeWidth={1.5}
                  transform={`rotate(12 ${FINGERS[0]!.x} ${PALM_TOP})`}
                />
                <rect
                  x={FINGERS[1]!.x - 7}
                  y={PALM_TOP - 46}
                  width={14}
                  height={58}
                  rx={7}
                  fill={SKIN}
                  stroke={SKIN_DARK}
                  strokeWidth={1.5}
                  transform={`rotate(-14 ${FINGERS[1]!.x} ${PALM_TOP})`}
                />
                <Finger {...FINGERS[2]!} state="down" />
                <Finger {...FINGERS[3]!} state="down" />
              </>
            ) : (
              FINGERS.map((f, i) => (
                <Finger key={i} {...f} state={spec.fingers[i]!} offset={offsets[i] ?? 0} />
              ))
            )}
          </>
        ) : null}

        <Thumb state={spec.thumb} />

        {/* palma */}
        <rect x={28} y={PALM_TOP} width={76} height={64} rx={24} fill={SKIN} stroke={SKIN_DARK} strokeWidth={2} />
        {/* punho */}
        <rect x={44} y={126} width={44} height={24} rx={12} fill={SKIN_DARK} opacity={0.9} />

        {spec.shape === "c" ? (
          <path
            d="M96 46 a40 40 0 1 0 0 74"
            fill="none"
            stroke={SKIN}
            strokeWidth={22}
            strokeLinecap="round"
          />
        ) : null}
        {spec.shape === "o" ? (
          <circle cx={66} cy={62} r={30} fill="none" stroke={SKIN} strokeWidth={20} />
        ) : null}
      </g>
      {spec.motion ? <Motion kind={spec.motion} /> : null}
    </svg>
  );
}
