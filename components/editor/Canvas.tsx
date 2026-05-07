"use client";

import { useMemo } from "react";
import type { Document, Spread } from "@/lib/types";
import { toPx } from "@/lib/units";
import { PageBoard } from "./PageBoard";

const VIEW_DPI = 96;
const MAX_VIEW_HEIGHT = 720;
const MAX_VIEW_WIDTH = 1100;

interface Props {
  document: Document;
  spread: Spread | undefined;
  showGrid: boolean;
  showRulers: boolean;
  showMargins: boolean;
}

export function Canvas({
  document,
  spread,
  showGrid,
  showRulers,
  showMargins,
}: Props) {
  const scale = useMemo(() => {
    if (!spread) return 1;
    const totalPages = spread.pages.length;
    const pageW = toPx(document.width, document.unit, VIEW_DPI);
    const pageH = toPx(document.height, document.unit, VIEW_DPI);
    const totalW = pageW * totalPages + 16 * Math.max(0, totalPages - 1);
    const byHeight = MAX_VIEW_HEIGHT / pageH;
    const byWidth = MAX_VIEW_WIDTH / totalW;
    return Math.min(1, byHeight, byWidth);
  }, [document.width, document.height, document.unit, spread]);

  if (!spread) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-soft">
        No spreads yet.
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-canvas px-12 py-12">
      <div className="flex items-start gap-4">
        {spread.pages.map((page) => (
          <PageBoard
            key={page.id}
            document={document}
            page={page}
            scale={scale}
            showGrid={showGrid}
            showRulers={showRulers}
            showMargins={showMargins}
          />
        ))}
      </div>
    </div>
  );
}
