"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Document, Spread, SlotRole } from "@/lib/types";
import { toPx } from "@/lib/units";
import { PageBoard } from "./PageBoard";

const VIEW_DPI = 96;

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
  snapToGrid: boolean;
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
  snapToGrid,
  onSelectSlot,
  onCreateSlot,
  onPatchSlot,
}: Props) {
  // Auto-fit scale based on viewport. Recomputes on resize.
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const measure = () => {
      const node = containerRef.current;
      if (!node) return;
      const r = node.getBoundingClientRect();
      setViewport({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    const obs = new ResizeObserver(measure);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", measure);
      obs.disconnect();
    };
  }, []);

  const scale = useMemo(() => {
    if (!spread || viewport.w === 0) return 0.5;
    const totalPages = spread.pages.length;
    const pageW = toPx(document.width, document.unit, VIEW_DPI);
    const pageH = toPx(document.height, document.unit, VIEW_DPI);
    const totalW = pageW * totalPages + 16 * Math.max(0, totalPages - 1);
    const padding = viewport.w < 640 ? 32 : 96;
    const byHeight = (viewport.h - padding) / pageH;
    const byWidth = (viewport.w - padding) / totalW;
    return Math.max(0.05, Math.min(1, byHeight, byWidth));
  }, [document.width, document.height, document.unit, spread, viewport]);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-canvas px-2 py-4 sm:px-8 sm:py-10"
    >
      {!spread ? (
        <p className="text-sm text-ink-soft">No spreads yet.</p>
      ) : (
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
              snapToGrid={snapToGrid}
              onSelectSlot={onSelectSlot}
              onCreateSlot={onCreateSlot}
              onPatchSlot={onPatchSlot}
            />
          ))}
        </div>
      )}
    </div>
  );
}
