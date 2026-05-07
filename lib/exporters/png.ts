import type { Document, Page } from "@/lib/types";
import { toPx } from "@/lib/units";
import {
  DEFAULT_SVG_OPTIONS,
  exportPageSVG,
  type SVGExportOptions,
} from "./svg";

export interface PNGExportOptions extends SVGExportOptions {
  dpi: number;
  background: "transparent" | "white" | string;
}

export const DEFAULT_PNG_OPTIONS: PNGExportOptions = {
  ...DEFAULT_SVG_OPTIONS,
  dpi: 300,
  background: "white",
};

/**
 * Render a page SVG to a PNG Blob via an off-screen canvas. Browser-only.
 */
export async function exportPagePNG(
  page: Page,
  document: Document,
  opts: PNGExportOptions = DEFAULT_PNG_OPTIONS,
): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new Error("PNG export requires the browser");
  }
  const svg = exportPageSVG(page, document, opts);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const totalW =
    document.width +
    (opts.include_bleed ? document.bleed.outside * 2 : 0);
  const totalH =
    document.height +
    (opts.include_bleed ? document.bleed.top + document.bleed.bottom : 0);
  const pxW = Math.max(1, Math.round(toPx(totalW, document.unit, opts.dpi)));
  const pxH = Math.max(1, Math.round(toPx(totalH, document.unit, opts.dpi)));

  const img = await loadImage(svgUrl);
  const canvas = document_().createElement("canvas");
  canvas.width = pxW;
  canvas.height = pxH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  if (opts.background !== "transparent") {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, pxW, pxH);
  }
  ctx.drawImage(img, 0, 0, pxW, pxH);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas.toBlob returned null"));
    }, "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG"));
    img.src = src;
  });
}

// Avoid clashing with the "document" parameter on Document type imports.
function document_(): typeof globalThis.document {
  return globalThis.document;
}
