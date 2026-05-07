"use client";

import type { Document, Page, Slot, SlotRole } from "@/lib/types";
import { toPx } from "@/lib/units";
import { effectiveSideMargins } from "@/lib/geometry";
import { GridLayer } from "./GridLayer";
import { BaselineLayer } from "./BaselineLayer";
import { RulerOverlay } from "./RulerOverlay";
import { SlotLayer } from "./SlotLayer";

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
  page: Page;
  scale: number;
  showGrid: boolean;
  showRulers: boolean;
  showMargins: boolean;
  showBaseline: boolean;
  showSlots: boolean;
  selectedSlotId: string | null;
  defaultRole: SlotRole;
  snapToGrid: boolean;
  onSelectSlot?: (slotId: string | null) => void;
  onCreateSlot?: (
    pageId: string,
    draft: CreateInput & { name: string; role: SlotRole; z_index?: number },
  ) => void;
  onPatchSlot?: (pageId: string, slotId: string, patch: PatchInput) => void;
  onRemoveSlot?: (pageId: string, slotId: string) => void;
}

export function PageBoard({
  document,
  page,
  scale,
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
  onRemoveSlot,
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

  const handleCreate = (input: CreateInput) => {
    if (!onCreateSlot) return;
    const name = nextSlotName(page.slots ?? [], defaultRole);
    onCreateSlot(page.id, { ...input, name, role: defaultRole });
  };

  return (
    <div className="relative">
      {showRulers ? (
        <RulerOverlay document={document} pagePx={{ w: wPx, h: hPx }} scale={scale} />
      ) : null}

      <figure
        className="relative bg-page text-page-ink shadow-[0_18px_36px_-22px_rgba(20,20,16,0.25)] ring-1 ring-rule-strong"
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

        {page.baseline && showBaseline ? (
          <BaselineLayer
            baseline={page.baseline}
            document={document}
            pagePx={{ w: wPx, h: hPx }}
            scale={scale}
          />
        ) : null}

        {page.grid && showGrid ? (
          <GridLayer grid={page.grid} rect={contentRect} />
        ) : null}

        {showSlots && onSelectSlot && onPatchSlot ? (
          <SlotLayer
            page={page}
            rect={contentRect}
            selectedSlotId={selectedSlotId}
            snapToGrid={snapToGrid}
            onSelect={onSelectSlot}
            onCreate={handleCreate}
            onPatch={(slotId, patch) => onPatchSlot(page.id, slotId, patch)}
            onRemove={(slotId) => onRemoveSlot?.(page.id, slotId)}
          />
        ) : null}

        <figcaption className="absolute -bottom-6 left-0 text-[10px] uppercase tracking-wide text-ink-faint">
          Page {page.page_number}
          {document.facing_pages ? ` · ${page.side}` : ""}
        </figcaption>
      </figure>
    </div>
  );
}

function nextSlotName(slots: Slot[], role: SlotRole): string {
  const base = role.replace("-", " ");
  let n = 1;
  const existing = new Set(slots.map((s) => s.name));
  while (existing.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}
