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

// ─── Slot geometry ──────────────────────────────────

export interface CellRange {
  col_start: number;
  col_end: number;
  row_start: number;
  row_end: number;
}

export interface FreeRect {
  x: number; // 0–1
  y: number;
  w: number;
  h: number;
}

/**
 * For a given grid, return the column edge fractions (start, end pairs).
 * E.g. for cols=3 with no gutter: [[0,1/3],[1/3,2/3],[2/3,1]].
 */
export function gridColumnRanges(grid: Grid): Array<[number, number]> {
  const lines = computeGridLines(grid);
  const out: Array<[number, number]> = [];
  for (let i = 0; i + 1 < lines.v.length; i += 2) {
    out.push([lines.v[i], lines.v[i + 1]]);
  }
  return out;
}

export function gridRowRanges(grid: Grid): Array<[number, number]> {
  const lines = computeGridLines(grid);
  const out: Array<[number, number]> = [];
  for (let i = 0; i + 1 < lines.h.length; i += 2) {
    out.push([lines.h[i], lines.h[i + 1]]);
  }
  return out;
}

/**
 * Snap a fractional rect (0..1) to the nearest grid cell range. Returns the
 * inclusive col_start/col_end (exclusive) etc.
 */
export function snapToGridCells(
  grid: Grid,
  rect: FreeRect,
): CellRange {
  const cols = gridColumnRanges(grid);
  const rows = gridRowRanges(grid);

  // Pick the column whose start is closest to rect.x, and end closest to rect.x+w.
  const startCol = nearestIndex(cols.map(([s]) => s), rect.x);
  const endColInclusive = nearestIndex(
    cols.map(([, e]) => e),
    rect.x + rect.w,
  );
  const startRow = nearestIndex(rows.map(([s]) => s), rect.y);
  const endRowInclusive = nearestIndex(
    rows.map(([, e]) => e),
    rect.y + rect.h,
  );

  const colStart = Math.min(startCol, endColInclusive);
  const colEnd = Math.max(startCol, endColInclusive) + 1; // exclusive
  const rowStart = Math.min(startRow, endRowInclusive);
  const rowEnd = Math.max(startRow, endRowInclusive) + 1;

  return {
    col_start: colStart,
    col_end: Math.max(colEnd, colStart + 1),
    row_start: rowStart,
    row_end: Math.max(rowEnd, rowStart + 1),
  };
}

function nearestIndex(xs: number[], v: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < xs.length; i += 1) {
    const d = Math.abs(xs[i] - v);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * Convert a CellRange to a fractional rect using the grid's column/row ranges.
 */
export function cellRangeToRect(grid: Grid, range: CellRange): FreeRect {
  const cols = gridColumnRanges(grid);
  const rows = gridRowRanges(grid);
  const cs = clampIndex(range.col_start, cols.length);
  const ce = clampIndex(range.col_end - 1, cols.length);
  const rs = clampIndex(range.row_start, rows.length);
  const re = clampIndex(range.row_end - 1, rows.length);
  const x0 = cols[cs][0];
  const x1 = cols[ce][1];
  const y0 = rows[rs][0];
  const y1 = rows[re][1];
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(len - 1, i));
}

/**
 * Compute the displayed rect (in CSS px relative to the content rect) for
 * a slot, supporting both modes.
 */
export function slotPx(
  slot: { mode: "cell" | "free"; col_start?: number; col_end?: number; row_start?: number; row_end?: number; x?: number; y?: number; w?: number; h?: number },
  grid: Grid | undefined,
  contentW: number,
  contentH: number,
): { x: number; y: number; w: number; h: number } | null {
  if (slot.mode === "cell") {
    if (
      !grid ||
      slot.col_start === undefined ||
      slot.col_end === undefined ||
      slot.row_start === undefined ||
      slot.row_end === undefined
    ) {
      return null;
    }
    const r = cellRangeToRect(grid, {
      col_start: slot.col_start,
      col_end: slot.col_end,
      row_start: slot.row_start,
      row_end: slot.row_end,
    });
    return {
      x: r.x * contentW,
      y: r.y * contentH,
      w: r.w * contentW,
      h: r.h * contentH,
    };
  }
  if (
    slot.x === undefined ||
    slot.y === undefined ||
    slot.w === undefined ||
    slot.h === undefined
  ) {
    return null;
  }
  return {
    x: slot.x * contentW,
    y: slot.y * contentH,
    w: slot.w * contentW,
    h: slot.h * contentH,
  };
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
