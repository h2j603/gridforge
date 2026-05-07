"use client";

import { useMemo } from "react";
import type { Document, Spread, SlotRole } from "@/lib/types";
import { toPx } from "@/lib/units";
import { PageBoard } from "./PageBoard";

const VIEW_DPI = 96;
const MAX_VIEW_HEIGHT = 720;
const MAX_VIEW_WIDTH = 1100;

interface CreateInput {
  mode: "cell" | "free";
  col_start?: number;
  col_end?: number;
  row_start?: number;
  row_end?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface PatchInput {
  mode?: "cell" | "free";
  col_start?: number | null;
  col_end?: number | null;
  row_start?: number | null;
  row_end?: number | null;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
}

interface Props {
  document: Document;
  spread: Spread | undefined;
  showGrid: boolean;
  showRulers: boolean;
  showMargins: boolean;
  showBaseline: boolean;
  showSlots: boolean;
  selectedSlotId: string | null;
  defaultRole: SlotRole;
  onSelectSlot: (slotId: string | null) => void;
  onCreateSlot: (
    pageId: string,
    draft: CreateInput & { name: string; role: SlotRole; z_index?: number },
  ) => void;
  onPatchSlot: (pageId: string, slotId: string, patch: PatchInput) => void;
}

export function Canvas({
  document,
  spread,
  showGrid,
  showRulers,
  showMargins,
  showBaseline,
  showSlots,
  selectedSlotId,
  defaultRole,
  onSelectSlot,
  onCreateSlot,
  onPatchSlot,
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
            showBaseline={showBaseline}
            showSlots={showSlots}
            selectedSlotId={selectedSlotId}
            defaultRole={defaultRole}
            onSelectSlot={onSelectSlot}
            onCreateSlot={onCreateSlot}
            onPatchSlot={onPatchSlot}
          />
        ))}
      </div>
    </div>
  );
}
