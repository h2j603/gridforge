import type { Baseline, Document } from "@/lib/types";
import { toPx } from "@/lib/units";

interface Props {
  baseline: Baseline;
  document: Document;
  /** PageBoard CSS px size (already scaled). */
  pagePx: { w: number; h: number };
  scale: number;
  visible?: boolean;
}

export function BaselineLayer({
  baseline,
  document,
  pagePx,
  scale,
  visible = true,
}: Props) {
  if (!visible || baseline.increment <= 0) return null;
  const startPx = toPx(baseline.start, document.unit, 96) * scale;
  // Baseline increment is in pt (per spec); convert pt -> px.
  const incrementPx = (baseline.increment * (96 / 72)) * scale;
  if (incrementPx < 1) return null;

  const lines: number[] = [];
  for (let y = startPx; y <= pagePx.h; y += incrementPx) {
    lines.push(y);
  }

  const stroke =
    baseline.color === "dark" ? "rgba(17,17,17,0.55)" : "rgba(17,17,17,0.18)";
  const major =
    baseline.color === "dark" ? "rgba(17,17,17,0.85)" : "rgba(17,17,17,0.4)";

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={pagePx.w}
      height={pagePx.h}
      role="presentation"
      aria-hidden
    >
      {lines.map((y, i) => (
        <line
          key={`bl-${i}`}
          x1={0}
          x2={pagePx.w}
          y1={y}
          y2={y}
          stroke={i % baseline.division === 0 ? major : stroke}
          strokeWidth={i % baseline.division === 0 ? 0.6 : 0.4}
          shapeRendering="crispEdges"
        />
      ))}
    </svg>
  );
}
