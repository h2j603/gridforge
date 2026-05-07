import type { Document, Page, Slot } from "@/lib/types";
import { toRem } from "@/lib/units";
import { effectiveSideMargins, slotPx } from "@/lib/geometry";

export interface CSSExportOptions {
  /** Auto-reduce columns at tablet/mobile breakpoints. */
  responsive: boolean;
  /** Page max-width in rem (overrides default = document.width converted to rem). */
  page_max_width_rem?: number;
  /** Use CSS Grid for cell-mode slots. Free slots are always absolute. */
  use_grid: boolean;
}

export const DEFAULT_CSS_OPTIONS: CSSExportOptions = {
  responsive: true,
  use_grid: true,
};

export interface CSSExportResult {
  css: string;
  html: string;
}

/**
 * Convert a single page (typically the first page) into responsive CSS plus
 * an HTML preview. Spreads/multi-page extend straightforwardly later — the
 * spec calls this v0.9 starter shape.
 */
export function exportPageCSS(
  page: Page,
  document: Document,
  opts: CSSExportOptions = DEFAULT_CSS_OPTIONS,
): CSSExportResult {
  const m = effectiveSideMargins(page, document);
  const pageMaxRem = opts.page_max_width_rem ?? toRem(document.width, document.unit);
  const pxRemX = (toRem(m.left, document.unit) + toRem(m.right, document.unit)) / 2;
  const pyRem = (toRem(m.top, document.unit) + toRem(m.bottom, document.unit)) / 2;

  const cols = page.grid?.cols ?? 1;
  const gx = page.grid?.gutter_x ?? 0;
  const gutterRem = pageMaxRem * gx;
  const baselinePx = page.baseline ? page.baseline.increment * (96 / 72) : 16;
  const baselineRem = baselinePx / 16;

  const slots = (page.slots ?? []).slice().sort((a, b) =>
    sortByVisualOrder(a, b, page),
  );

  const lines: string[] = [];
  lines.push(`/* GridForge export — Document: ${escapeCss(document.name)} */`);
  lines.push(":root {");
  lines.push(`  --page-max-width: ${fmt(pageMaxRem)}rem;`);
  lines.push(`  --page-margin-x: ${fmt(toRem(m.left, document.unit))}rem;`);
  lines.push(`  --page-margin-y: ${fmt(toRem(m.top, document.unit))}rem;`);
  lines.push(`  --gutter: ${fmt(gutterRem)}rem;`);
  lines.push(`  --baseline: ${fmt(baselineRem)}rem;`);
  lines.push("}");
  lines.push("");
  lines.push(".gf-page {");
  lines.push("  position: relative;");
  lines.push("  max-width: var(--page-max-width);");
  lines.push("  margin: 0 auto;");
  lines.push("  padding: var(--page-margin-y) var(--page-margin-x);");
  lines.push(`  line-height: var(--baseline);`);
  if (opts.use_grid) {
    lines.push("  display: grid;");
    lines.push(`  grid-template-columns: repeat(${cols}, 1fr);`);
    lines.push("  gap: var(--gutter);");
  }
  lines.push("}");

  for (const slot of slots) {
    lines.push("");
    const cls = `.gf-slot--${slugify(slot.name)}`;
    lines.push(`${cls} {`);
    if (slot.mode === "cell" && opts.use_grid) {
      const cs = (slot.col_start ?? 0) + 1;
      const ce = (slot.col_end ?? cols) + 1;
      const rs = (slot.row_start ?? 0) + 1;
      const re = (slot.row_end ?? 1) + 1;
      lines.push(`  grid-column: ${cs} / ${ce};`);
      lines.push(`  grid-row: ${rs} / ${re};`);
    } else {
      // Free or use_grid=false: absolute %.
      const cw = document.width - m.left - m.right;
      const ch = document.height - m.top - m.bottom;
      const r = slotPx(
        {
          mode: "free",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          col_start: slot.col_start,
          col_end: slot.col_end,
          row_start: slot.row_start,
          row_end: slot.row_end,
        },
        page.grid,
        cw,
        ch,
      );
      if (r) {
        lines.push("  position: absolute;");
        lines.push(`  left: ${fmt((r.x / cw) * 100)}%;`);
        lines.push(`  top: ${fmt((r.y / ch) * 100)}%;`);
        lines.push(`  width: ${fmt((r.w / cw) * 100)}%;`);
        lines.push(`  height: ${fmt((r.h / ch) * 100)}%;`);
      }
    }
    if (slot.typography) {
      const fs = slot.typography.font_size;
      lines.push(`  font-size: ${fmt(fs / 12)}rem;`);
      lines.push(
        `  line-height: calc(var(--baseline) * ${fmt(slot.typography.line_height_baselines)});`,
      );
      if (slot.typography.font_family) {
        lines.push(
          `  font-family: ${escapeCss(slot.typography.font_family)}, system-ui, sans-serif;`,
        );
      }
      if (slot.typography.font_weight) {
        lines.push(`  font-weight: ${slot.typography.font_weight};`);
      }
      if (slot.typography.letter_spacing) {
        lines.push(
          `  letter-spacing: ${fmt(slot.typography.letter_spacing)}em;`,
        );
      }
    }
    if (slot.z_index) lines.push(`  z-index: ${slot.z_index};`);
    lines.push("}");
  }

  if (opts.responsive && cols > 1) {
    const tabletCols = Math.max(1, Math.ceil(cols / 1.5));
    lines.push("");
    lines.push("@media (max-width: 1023px) {");
    lines.push(`  .gf-page { grid-template-columns: repeat(${tabletCols}, 1fr); }`);
    for (const slot of slots) {
      if (slot.mode === "cell") {
        const cs = Math.min(tabletCols, (slot.col_start ?? 0) + 1);
        const ce = Math.min(tabletCols + 1, (slot.col_end ?? cols) + 1);
        lines.push(
          `  .gf-slot--${slugify(slot.name)} { grid-column: ${cs} / ${ce}; }`,
        );
      }
    }
    lines.push("}");

    lines.push("");
    lines.push("@media (max-width: 767px) {");
    lines.push("  .gf-page { grid-template-columns: 1fr; }");
    for (const slot of slots) {
      lines.push(
        `  .gf-slot--${slugify(slot.name)} { grid-column: 1; ${slot.mode === "free" ? "position: static; left: auto; top: auto; width: 100%; height: auto;" : ""} }`,
      );
    }
    lines.push("}");
  }

  // HTML preview
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(document.name)}</title>
  <style>
${lines.join("\n")}
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f7f7f5; }
  .gf-slot { background: rgba(17,17,17,0.06); border: 1px solid rgba(17,17,17,0.2); padding: 0.5rem; border-radius: 2px; }
  </style>
</head>
<body>
  <main class="gf-page">
${slots
  .map(
    (s) =>
      `    <section class="gf-slot gf-slot--${slugify(s.name)}">${escapeHtml(s.name)}</section>`,
  )
  .join("\n")}
  </main>
</body>
</html>
`;

  return { css: lines.join("\n"), html };
}

function sortByVisualOrder(a: Slot, b: Slot, page: Page): number {
  const ay = anchorY(a, page);
  const by = anchorY(b, page);
  if (ay !== by) return ay - by;
  return anchorX(a, page) - anchorX(b, page);
}

function anchorY(slot: Slot, page: Page): number {
  if (slot.mode === "free") return slot.y ?? 0;
  // For cell mode, use row_start as a proxy; if no grid, fallback to z_index.
  if (slot.row_start !== undefined) return slot.row_start;
  return slot.z_index ?? 0;
}
function anchorX(slot: Slot, _page: Page): number {
  if (slot.mode === "free") return slot.x ?? 0;
  if (slot.col_start !== undefined) return slot.col_start;
  return 0;
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Number(n.toFixed(4)).toString();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function escapeCss(s: string): string {
  return s.replace(/[\\"]/g, "\\$&");
}
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
