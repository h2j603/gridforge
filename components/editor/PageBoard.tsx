import type { Document, Page } from "@/lib/types";
import { toPx } from "@/lib/units";
import { effectiveSideMargins } from "@/lib/geometry";
import { GridLayer } from "./GridLayer";
import { RulerOverlay } from "./RulerOverlay";

const VIEW_DPI = 96;

interface Props {
  document: Document;
  page: Page;
  scale: number;
  showGrid: boolean;
  showRulers: boolean;
  showMargins: boolean;
}

export function PageBoard({
  document,
  page,
  scale,
  showGrid,
  showRulers,
  showMargins,
}: Props) {
  const wPx = toPx(document.width, document.unit, VIEW_DPI) * scale;
  const hPx = toPx(document.height, document.unit, VIEW_DPI) * scale;

  const m = effectiveSideMargins(page, document);
  const marginLeft = toPx(m.left, document.unit, VIEW_DPI) * scale;
  const marginRight = toPx(m.right, document.unit, VIEW_DPI) * scale;
  const marginTop = toPx(m.top, document.unit, VIEW_DPI) * scale;
  const marginBottom = toPx(m.bottom, document.unit, VIEW_DPI) * scale;

  const contentRect = {
    x: marginLeft,
    y: marginTop,
    w: wPx - marginLeft - marginRight,
    h: hPx - marginTop - marginBottom,
  };

  return (
    <div className="relative">
      {showRulers ? (
        <RulerOverlay document={document} pagePx={{ w: wPx, h: hPx }} scale={scale} />
      ) : null}

      <figure
        className="relative bg-paper shadow-[0_2px_24px_rgba(17,17,17,0.08)] ring-1 ring-rule"
        style={{ width: wPx, height: hPx }}
      >
        {showMargins ? (
          <div
            aria-hidden
            className="pointer-events-none absolute border border-dashed border-ink/20"
            style={{
              left: marginLeft,
              right: marginRight,
              top: marginTop,
              bottom: marginBottom,
            }}
          />
        ) : null}

        {page.grid && showGrid ? (
          <GridLayer grid={page.grid} rect={contentRect} />
        ) : null}

        <figcaption className="absolute -bottom-6 left-0 text-[10px] uppercase tracking-wide text-ink-soft">
          Page {page.page_number}
          {document.facing_pages ? ` · ${page.side}` : ""}
        </figcaption>
      </figure>
    </div>
  );
}
