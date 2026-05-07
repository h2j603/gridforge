import type { Document } from "@/lib/types";
import { toPx } from "@/lib/units";

interface Props {
  document: Document;
  /** Total page size in CSS px (already scaled). */
  pagePx: { w: number; h: number };
  /** Render scale (display px / native px). */
  scale: number;
  visible?: boolean;
}

const RULER_THICKNESS = 18;

export function RulerOverlay({
  document,
  pagePx,
  scale,
  visible = true,
}: Props) {
  if (!visible) return null;
  const tickStep = pickTickStep(document.unit);
  const pageW = document.width;
  const pageH = document.height;

  return (
    <>
      {/* Top ruler */}
      <div
        className="pointer-events-none absolute -top-5 left-0 flex items-end text-[9px] uppercase tracking-wide text-ink-soft"
        style={{ width: pagePx.w, height: RULER_THICKNESS }}
      >
        <svg width={pagePx.w} height={RULER_THICKNESS}>
          {ticks(pageW, tickStep).map((t) => {
            const x = toPx(t, document.unit, 96) * scale;
            const isMajor = isMajorTick(t, tickStep);
            return (
              <g key={`tx-${t}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={isMajor ? 4 : 10}
                  y2={RULER_THICKNESS}
                  stroke="rgba(17,17,17,0.45)"
                  strokeWidth={0.5}
                />
                {isMajor && t > 0 ? (
                  <text x={x + 2} y={9} fill="rgba(17,17,17,0.55)">
                    {formatLabel(t, document.unit)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Left ruler */}
      <div
        className="pointer-events-none absolute -left-5 top-0 text-[9px] uppercase tracking-wide text-ink-soft"
        style={{ height: pagePx.h, width: RULER_THICKNESS }}
      >
        <svg width={RULER_THICKNESS} height={pagePx.h}>
          {ticks(pageH, tickStep).map((t) => {
            const y = toPx(t, document.unit, 96) * scale;
            const isMajor = isMajorTick(t, tickStep);
            return (
              <g key={`ty-${t}`}>
                <line
                  x1={isMajor ? 4 : 10}
                  x2={RULER_THICKNESS}
                  y1={y}
                  y2={y}
                  stroke="rgba(17,17,17,0.45)"
                  strokeWidth={0.5}
                />
                {isMajor && t > 0 ? (
                  <text
                    x={2}
                    y={y - 2}
                    fill="rgba(17,17,17,0.55)"
                    transform={`rotate(-90 2 ${y - 2})`}
                  >
                    {formatLabel(t, document.unit)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}

function pickTickStep(unit: Document["unit"]): number {
  switch (unit) {
    case "mm":
      return 5;
    case "in":
      return 0.25;
    case "pt":
      return 24;
    case "px":
      return 50;
  }
}

function ticks(total: number, step: number): number[] {
  const out: number[] = [];
  for (let v = 0; v <= total + 1e-6; v += step) {
    out.push(round(v));
  }
  return out;
}

function isMajorTick(value: number, step: number): boolean {
  // Every 4th tick is major.
  const k = Math.round(value / step);
  return k % 4 === 0;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function formatLabel(value: number, unit: Document["unit"]): string {
  if (unit === "in") return value.toFixed(2);
  return String(Math.round(value));
}
