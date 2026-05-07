import type { Document, Page } from "@/lib/types";
import { toPx } from "@/lib/units";

const VIEW_DPI = 96;
const MAX_VIEW_HEIGHT = 720;

export function PageBoard({
  document,
  page,
}: {
  document: Document;
  page: Page;
}) {
  const wPx = toPx(document.width, document.unit, VIEW_DPI);
  const hPx = toPx(document.height, document.unit, VIEW_DPI);

  const scale = Math.min(1, MAX_VIEW_HEIGHT / hPx);
  const displayW = wPx * scale;
  const displayH = hPx * scale;

  const m = page.margins;
  const isLeft = page.side === "left";
  const leftMarginUnit = document.facing_pages
    ? isLeft
      ? m.outside
      : m.inside
    : m.inside;
  const rightMarginUnit = document.facing_pages
    ? isLeft
      ? m.inside
      : m.outside
    : m.outside;

  const marginLeft = toPx(leftMarginUnit, document.unit, VIEW_DPI) * scale;
  const marginRight = toPx(rightMarginUnit, document.unit, VIEW_DPI) * scale;
  const marginTop = toPx(m.top, document.unit, VIEW_DPI) * scale;
  const marginBottom = toPx(m.bottom, document.unit, VIEW_DPI) * scale;

  return (
    <figure
      className="relative bg-paper shadow-[0_2px_24px_rgba(17,17,17,0.08)] ring-1 ring-rule"
      style={{ width: displayW, height: displayH }}
    >
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
      <figcaption className="absolute -bottom-6 left-0 text-[10px] uppercase tracking-wide text-ink-soft">
        Page {page.page_number}
        {document.facing_pages ? ` · ${page.side}` : ""}
      </figcaption>
    </figure>
  );
}
