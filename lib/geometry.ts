import type { Grid, GridType, Margins, Page, Document, Unit } from "./types";
import { toPx } from "./units";

// ─── Page content area in unit space ──────────────────

export interface PageBox {
  // outer page in unit space
  width: number;
  height: number;
  // inner content area (after margins) in unit space
  contentX: number;
  contentY: number;
  contentW: number;
  contentH: number;
  unit: Unit;
}

export function getPageBox(page: Page, document: Document): PageBox {
  const m = page.margins;
  const isLeft = page.side === "left";
  const leftMargin = document.facing_pages
    ? isLeft
      ? m.outside
      : m.inside
    : m.inside;
  const rightMargin = document.facing_pages
    ? isLeft
      ? m.inside
      : m.outside
    : m.outside;
  return {
    width: document.width,
    height: document.height,
    contentX: leftMargin,
    contentY: m.top,
    contentW: document.width - leftMargin - rightMargin,
    contentH: document.height - m.top - m.bottom,
    unit: document.unit,
  };
}

// ─── Grid line geometry (0–1 fractions inside content area) ────

export interface GridLines {
  /** Vertical lines including the two edges (0 and 1). */
  v: number[];
  /** Horizontal lines including the two edges (0 and 1). */
  h: number[];
  /** Whether each vertical line is a column "edge" vs gutter side. */
  vKind: LineKind[];
  hKind: LineKind[];
}

export type LineKind = "edge" | "outer";

/**
 * Produce the line positions for a grid as fractions of the content area
 * width/height. For columnar/modular/manuscript these are evenly spaced
 * with gutters; for "custom" we use the explicit lists on the grid.
 */
export function computeGridLines(grid: Grid): GridLines {
  if (grid.type === "custom") {
    const v = unique([0, ...grid.custom_v.filter(insideUnit), 1]);
    const h = unique([0, ...grid.custom_h.filter(insideUnit), 1]);
    return {
      v,
      h,
      vKind: v.map((p) => (p === 0 || p === 1 ? "outer" : "edge")),
      hKind: h.map((p) => (p === 0 || p === 1 ? "outer" : "edge")),
    };
  }

  const cols = Math.max(1, grid.cols);
  const rows = grid.type === "modular" ? Math.max(1, grid.rows) : 1;
  const v = evenLines(cols, grid.gutter_x);
  const h = evenLines(rows, grid.gutter_y);
  return {
    v,
    h,
    vKind: v.map((p) => (p === 0 || p === 1 ? "outer" : "edge")),
    hKind: h.map((p) => (p === 0 || p === 1 ? "outer" : "edge")),
  };
}

/**
 * For N tracks with given gutter (as fraction of content), returns N+1 line
 * fractions BUT for gutters we include both sides, so the result alternates
 * edge-gutter-edge. For simple visualization we collapse into edges only:
 * we draw (N-1) gutter PAIRS plus 2 outer edges = 2N lines if there are
 * gutters, else N+1.
 */
function evenLines(n: number, gutter: number): number[] {
  const safeGutter = clamp01(gutter);
  // Each cell width: (1 - (n-1)*g) / n
  const cell = (1 - (n - 1) * safeGutter) / n;
  if (cell <= 0) {
    // Gutters too big — fall back to no gutter so the canvas stays usable.
    return Array.from({ length: n + 1 }, (_, i) => i / n);
  }
  if (safeGutter === 0) {
    return Array.from({ length: n + 1 }, (_, i) => i / n);
  }
  const lines: number[] = [];
  let pos = 0;
  for (let i = 0; i < n; i += 1) {
    lines.push(pos);
    pos += cell;
    lines.push(pos);
    if (i < n - 1) pos += safeGutter;
  }
  return lines;
}

// ─── Conversions ──────────────────────────────────────

export interface ContentRectPx {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

export function getContentRectPx(
  page: Page,
  document: Document,
  scale: number,
  dpi = 96,
): ContentRectPx {
  const box = getPageBox(page, document);
  return {
    x: toPx(box.contentX, document.unit, dpi) * scale,
    y: toPx(box.contentY, document.unit, dpi) * scale,
    w: toPx(box.contentW, document.unit, dpi) * scale,
    h: toPx(box.contentH, document.unit, dpi) * scale,
    scale,
  };
}

export type FracKind = "edge" | "gutter";

/**
 * Returns alternating edge/gutter pairs. For drawing column blocks:
 * pair i is [v[2i], v[2i+1]] for i in [0, cols).
 */
export function gridCellFractions(
  grid: Grid,
): { v: number[]; h: number[]; cols: number; rows: number } {
  const lines = computeGridLines(grid);
  // For evenLines output the column edges are pairs of consecutive lines,
  // since alternating pattern is edge-edge-gutter-edge-edge-gutter-...
  return {
    v: lines.v,
    h: lines.h,
    cols: grid.cols,
    rows: grid.type === "modular" ? grid.rows : 1,
  };
}

// ─── Validation ──────────────────────────────────────

export function isValidGridSpec(
  type: GridType,
  cols: number,
  rows: number,
): boolean {
  if (cols < 1 || cols > 32) return false;
  if (rows < 1 || rows > 32) return false;
  if (type === "modular" && rows < 1) return false;
  return true;
}

export function clampMargin(value: number, axis: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > axis / 2) return axis / 2;
  return value;
}

// ─── Util ────────────────────────────────────────────

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function insideUnit(n: number): boolean {
  return Number.isFinite(n) && n > 0 && n < 1;
}

function unique(values: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const v of values) {
    const key = Math.round(v * 1e6) / 1e6;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.sort((a, b) => a - b);
}

// margins helper for facing layout
export function effectiveSideMargins(
  page: Page,
  document: Document,
): { left: number; right: number; top: number; bottom: number } {
  const m = page.margins;
  if (!document.facing_pages || page.side === "single") {
    return { left: m.inside, right: m.outside, top: m.top, bottom: m.bottom };
  }
  if (page.side === "left") {
    return { left: m.outside, right: m.inside, top: m.top, bottom: m.bottom };
  }
  return { left: m.inside, right: m.outside, top: m.top, bottom: m.bottom };
}

// for callers that need margin field labels
export function marginAxisLabels(
  document: Document,
): { x1: keyof Margins; x2: keyof Margins } {
  return document.facing_pages
    ? { x1: "inside", x2: "outside" }
    : { x1: "inside", x2: "outside" };
}
