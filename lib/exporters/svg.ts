import type { Document, Page, Slot } from "@/lib/types";
import {
  computeGridLines,
  effectiveSideMargins,
  slotPx,
} from "@/lib/geometry";

export interface SVGExportOptions {
  include_bleed: boolean;
  include_margins: boolean;
  include_grid: boolean;
  include_baseline: boolean;
  include_slots: boolean;
  include_slot_labels: boolean;
  color_mode: "color" | "outline";
}

export const DEFAULT_SVG_OPTIONS: SVGExportOptions = {
  include_bleed: false,
  include_margins: true,
  include_grid: true,
  include_baseline: false,
  include_slots: true,
  include_slot_labels: true,
  color_mode: "color",
};

/**
 * Render a single page to a self-contained SVG string. Coordinates are in
 * the document's unit (e.g. mm), so the SVG prints at 1:1 when given the
 * same physical size.
 */
export function exportPageSVG(
  page: Page,
  document: Document,
  opts: SVGExportOptions = DEFAULT_SVG_OPTIONS,
): string {
  const u = document.unit;
  const w = document.width;
  const h = document.height;
  const bleedT = opts.include_bleed ? document.bleed.top : 0;
  const bleedB = opts.include_bleed ? document.bleed.bottom : 0;
  const m = effectiveSideMargins(page, document);
  const bleedL = opts.include_bleed ? marginAxisLeft(document, page) : 0;
  const bleedR = opts.include_bleed ? marginAxisRight(document, page) : 0;

  const totalW = w + bleedL + bleedR;
  const totalH = h + bleedT + bleedB;
  const offsetX = bleedL;
  const offsetY = bleedT;

  const stroke = opts.color_mode === "outline" ? "#000" : "#111";
  const margin =
    opts.color_mode === "outline" ? "#000" : "rgba(17,17,17,0.35)";
  const slotStroke =
    opts.color_mode === "outline" ? "#000" : "rgba(17,17,17,0.55)";
  const slotFill =
    opts.color_mode === "outline" ? "none" : "rgba(17,17,17,0.05)";

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}${u}" height="${totalH}${u}" viewBox="0 0 ${totalW} ${totalH}">`,
  );
  parts.push(
    `<rect x="${offsetX}" y="${offsetY}" width="${w}" height="${h}" fill="white" stroke="${stroke}" stroke-width="0.5"/>`,
  );

  if (opts.include_bleed && (bleedT || bleedB || bleedL || bleedR)) {
    parts.push(
      `<rect x="0" y="0" width="${totalW}" height="${totalH}" fill="none" stroke="rgba(255,0,0,0.4)" stroke-width="0.3" stroke-dasharray="2 1"/>`,
    );
  }

  if (opts.include_margins) {
    const mx = offsetX + m.left;
    const my = offsetY + m.top;
    const mw = w - m.left - m.right;
    const mh = h - m.top - m.bottom;
    parts.push(
      `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="none" stroke="${margin}" stroke-width="0.3" stroke-dasharray="2 1"/>`,
    );
  }

  if (page.grid && opts.include_grid) {
    const lines = computeGridLines(page.grid);
    const cx = offsetX + m.left;
    const cy = offsetY + m.top;
    const cw = w - m.left - m.right;
    const ch = h - m.top - m.bottom;
    const gridStroke =
      opts.color_mode === "outline"
        ? "#000"
        : page.grid.color === "dark"
          ? "rgba(17,17,17,0.7)"
          : "rgba(17,17,17,0.25)";
    for (const v of lines.v) {
      const x = cx + v * cw;
      parts.push(
        `<line x1="${x}" y1="${cy}" x2="${x}" y2="${cy + ch}" stroke="${gridStroke}" stroke-width="0.2"/>`,
      );
    }
    for (const hh of lines.h) {
      const y = cy + hh * ch;
      parts.push(
        `<line x1="${cx}" y1="${y}" x2="${cx + cw}" y2="${y}" stroke="${gridStroke}" stroke-width="0.2"/>`,
      );
    }
  }

  if (page.baseline && opts.include_baseline && page.baseline.increment > 0) {
    const incrUnit = ptToUnit(page.baseline.increment, u);
    const baseStroke =
      opts.color_mode === "outline" ? "#000" : "rgba(17,17,17,0.4)";
    for (let i = 0, y = page.baseline.start; y <= h; y += incrUnit, i += 1) {
      parts.push(
        `<line x1="${offsetX}" y1="${offsetY + y}" x2="${offsetX + w}" y2="${offsetY + y}" stroke="${baseStroke}" stroke-width="${i % page.baseline.division === 0 ? 0.25 : 0.15}"/>`,
      );
    }
  }

  if (opts.include_slots && page.slots) {
    const cw = w - m.left - m.right;
    const ch = h - m.top - m.bottom;
    for (const slot of page.slots) {
      const r = slotPx(
        {
          mode: slot.mode,
          col_start: slot.col_start,
          col_end: slot.col_end,
          row_start: slot.row_start,
          row_end: slot.row_end,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        },
        page.grid,
        cw,
        ch,
      );
      if (!r) continue;
      const sx = offsetX + m.left + r.x;
      const sy = offsetY + m.top + r.y;
      parts.push(
        `<rect x="${sx}" y="${sy}" width="${r.w}" height="${r.h}" fill="${slotFill}" stroke="${slotStroke}" stroke-width="0.3"/>`,
      );
      if (opts.include_slot_labels) {
        parts.push(
          `<text x="${sx + 1}" y="${sy + 4}" font-size="3" fill="${stroke}" font-family="sans-serif">${escapeXml(slot.name)}</text>`,
        );
      }
    }
  }

  parts.push("</svg>");
  return parts.join("\n");
}

export interface SpreadSVGExport {
  pageId: string;
  side: Page["side"];
  pageNumber: number;
  svg: string;
}

export function exportSpreadSVGs(
  pages: Page[],
  document: Document,
  opts: SVGExportOptions = DEFAULT_SVG_OPTIONS,
): SpreadSVGExport[] {
  return pages.map((p) => ({
    pageId: p.id,
    side: p.side,
    pageNumber: p.page_number,
    svg: exportPageSVG(p, document, opts),
  }));
}

function marginAxisLeft(document: Document, page: Page): number {
  if (!document.facing_pages || page.side === "single") {
    return document.bleed.outside;
  }
  return page.side === "left" ? document.bleed.outside : document.bleed.inside;
}
function marginAxisRight(document: Document, page: Page): number {
  if (!document.facing_pages || page.side === "single") {
    return document.bleed.outside;
  }
  return page.side === "left" ? document.bleed.inside : document.bleed.outside;
}

function ptToUnit(pt: number, unit: Document["unit"]): number {
  switch (unit) {
    case "pt":
      return pt;
    case "in":
      return pt / 72;
    case "mm":
      return (pt / 72) * 25.4;
    case "px":
      return pt * (96 / 72);
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// keep type-only import in case downstream consumers want it
export type { Slot };
