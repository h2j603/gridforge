import type { Grid } from "@/lib/types";
import { computeGridLines } from "@/lib/geometry";

interface Props {
  grid: Grid;
  /** Content rect in CSS px, relative to the parent PageBoard. */
  rect: { x: number; y: number; w: number; h: number };
  visible?: boolean;
}

export function GridLayer({ grid, rect, visible = true }: Props) {
  if (!visible) return null;
  const lines = computeGridLines(grid);
  const stroke =
    grid.color === "light" ? "rgba(17,17,17,0.18)" : "rgba(17,17,17,0.85)";
  const cellFill =
    grid.color === "light" ? "rgba(17,17,17,0.04)" : "rgba(17,17,17,0.06)";

  // Each pair (v[2i], v[2i+1]) is a column, (v[2i+1], v[2(i+1)]) is a gutter.
  const cols: Array<[number, number]> = [];
  for (let i = 0; i + 1 < lines.v.length; i += 2) {
    cols.push([lines.v[i], lines.v[i + 1]]);
  }
  const rows: Array<[number, number]> = [];
  for (let i = 0; i + 1 < lines.h.length; i += 2) {
    rows.push([lines.h[i], lines.h[i + 1]]);
  }

  return (
    <svg
      className="pointer-events-none absolute"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      viewBox={`0 0 ${rect.w} ${rect.h}`}
      role="presentation"
      aria-hidden
    >
      {/* Cell fills (subtle) */}
      {cols.map(([cx0, cx1], ci) =>
        rows.map(([ry0, ry1], ri) => (
          <rect
            key={`cell-${ci}-${ri}`}
            x={cx0 * rect.w}
            y={ry0 * rect.h}
            width={(cx1 - cx0) * rect.w}
            height={(ry1 - ry0) * rect.h}
            fill={cellFill}
          />
        )),
      )}

      {/* Vertical lines */}
      {lines.v.map((p, i) => (
        <line
          key={`v-${i}`}
          x1={p * rect.w}
          x2={p * rect.w}
          y1={0}
          y2={rect.h}
          stroke={stroke}
          strokeWidth={p === 0 || p === 1 ? 1 : 0.5}
          shapeRendering="crispEdges"
        />
      ))}

      {/* Horizontal lines */}
      {lines.h.map((p, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          x2={rect.w}
          y1={p * rect.h}
          y2={p * rect.h}
          stroke={stroke}
          strokeWidth={p === 0 || p === 1 ? 1 : 0.5}
          shapeRendering="crispEdges"
        />
      ))}
    </svg>
  );
}
