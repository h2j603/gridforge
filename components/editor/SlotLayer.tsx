"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Grid, Page, Slot, SlotRole } from "@/lib/types";
import { cn } from "@/lib/cn";
import { slotPx, snapToGridCells } from "@/lib/geometry";

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
  page: Page;
  rect: { x: number; y: number; w: number; h: number };
  selectedSlotId: string | null;
  onSelect: (slotId: string | null) => void;
  onCreate: (input: CreateInput) => void;
  onPatch: (slotId: string, patch: PatchInput) => void;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type DragState =
  | { kind: "draw"; startX: number; startY: number }
  | {
      kind: "move";
      slotId: string;
      originX: number;
      originY: number;
      slotStart: { x: number; y: number; w: number; h: number };
    }
  | {
      kind: "resize";
      slotId: string;
      handle: ResizeHandle;
      originX: number;
      originY: number;
      slotStart: { x: number; y: number; w: number; h: number };
    };

interface FRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function SlotLayer({
  page,
  rect,
  selectedSlotId,
  onSelect,
  onCreate,
  onPatch,
}: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<{
    drawRect: FRect | null;
    movedRect: { slotId: string; rect: FRect } | null;
    altPressed: boolean;
  }>({ drawRect: null, movedRect: null, altPressed: false });
  const [, force] = useState(0);
  const tick = () => force((n) => (n + 1) & 0xffff);

  const grid = page.grid;
  const slots = page.slots ?? [];

  const localPos = useCallback(
    (e: { clientX: number; clientY: number }): { x: number; y: number } => {
      const node = layerRef.current;
      if (!node) return { x: 0, y: 0 };
      const r = node.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      return { x: clamp01(x), y: clamp01(y) };
    },
    [],
  );

  // ESC clears selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  // Window listeners installed once.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      previewRef.current.altPressed = e.altKey;
      const { x, y } = localPos(e);
      if (drag.kind === "draw") {
        previewRef.current.drawRect = normalizeRect(
          drag.startX,
          drag.startY,
          x,
          y,
        );
      } else if (drag.kind === "move") {
        const dx = x - drag.originX;
        const dy = y - drag.originY;
        const nx = clamp01(drag.slotStart.x + dx);
        const ny = clamp01(drag.slotStart.y + dy);
        const nw = Math.min(1 - nx, drag.slotStart.w);
        const nh = Math.min(1 - ny, drag.slotStart.h);
        previewRef.current.movedRect = {
          slotId: drag.slotId,
          rect: { x: nx, y: ny, w: nw, h: nh },
        };
      } else if (drag.kind === "resize") {
        previewRef.current.movedRect = {
          slotId: drag.slotId,
          rect: applyResize(drag.slotStart, drag.handle, x, y),
        };
      }
      tick();
    };

    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const altPressed = e.altKey || previewRef.current.altPressed;
      if (drag.kind === "draw") {
        const r = previewRef.current.drawRect;
        if (r && r.w > 0.005 && r.h > 0.005) {
          if (!grid || altPressed) {
            onCreate({ mode: "free", x: r.x, y: r.y, w: r.w, h: r.h });
          } else {
            const range = snapToGridCells(grid, r);
            onCreate({ mode: "cell", ...range });
          }
        }
      } else if (drag.kind === "move" || drag.kind === "resize") {
        const moved = previewRef.current.movedRect;
        if (moved) {
          const slot = slots.find((s) => s.id === drag.slotId);
          const stayCell =
            slot && grid && slot.mode === "cell" && !altPressed;
          if (stayCell) {
            const range = snapToGridCells(grid, moved.rect);
            onPatch(drag.slotId, {
              mode: "cell",
              col_start: range.col_start,
              col_end: range.col_end,
              row_start: range.row_start,
              row_end: range.row_end,
              x: null,
              y: null,
              w: null,
              h: null,
            });
          } else {
            onPatch(drag.slotId, {
              mode: "free",
              x: moved.rect.x,
              y: moved.rect.y,
              w: moved.rect.w,
              h: moved.rect.h,
              col_start: null,
              col_end: null,
              row_start: null,
              row_end: null,
            });
          }
        }
      }
      dragRef.current = null;
      previewRef.current = {
        drawRect: null,
        movedRect: null,
        altPressed: false,
      };
      tick();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [grid, localPos, onCreate, onPatch, slots]);

  const onLayerMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.target !== layerRef.current) return;
    onSelect(null);
    const { x, y } = localPos(e);
    dragRef.current = { kind: "draw", startX: x, startY: y };
    previewRef.current.drawRect = { x, y, w: 0, h: 0 };
    previewRef.current.altPressed = e.altKey;
    e.preventDefault();
    tick();
  };

  const onSlotMouseDown = (e: React.MouseEvent, slot: Slot) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(slot.id);
    const { x, y } = localPos(e);
    const r = renderRect(slot, grid);
    if (!r) return;
    dragRef.current = {
      kind: "move",
      slotId: slot.id,
      originX: x,
      originY: y,
      slotStart: r,
    };
  };

  const onHandleDown = (
    e: React.MouseEvent,
    slot: Slot,
    handle: ResizeHandle,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(slot.id);
    const { x, y } = localPos(e);
    const r = renderRect(slot, grid);
    if (!r) return;
    dragRef.current = {
      kind: "resize",
      slotId: slot.id,
      handle,
      originX: x,
      originY: y,
      slotStart: r,
    };
  };

  const drawRect = previewRef.current.drawRect;

  return (
    <div
      ref={layerRef}
      onMouseDown={onLayerMouseDown}
      className="absolute"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
      }}
    >
      {slots.map((slot) => {
        const overlay =
          previewRef.current.movedRect?.slotId === slot.id
            ? previewRef.current.movedRect.rect
            : null;
        const r = overlay ?? renderRect(slot, grid);
        if (!r) return null;
        const selected = slot.id === selectedSlotId;
        return (
          <SlotBox
            key={slot.id}
            slot={slot}
            r={r}
            rect={rect}
            selected={selected}
            onMouseDown={(e) => onSlotMouseDown(e, slot)}
            onHandleDown={(e, h) => onHandleDown(e, slot, h)}
          />
        );
      })}

      {drawRect ? (
        <div
          className="pointer-events-none absolute border-2 border-dashed border-ink/70 bg-ink/5"
          style={{
            left: drawRect.x * rect.w,
            top: drawRect.y * rect.h,
            width: drawRect.w * rect.w,
            height: drawRect.h * rect.h,
          }}
        />
      ) : null}
    </div>
  );
}

function SlotBox({
  slot,
  r,
  rect,
  selected,
  onMouseDown,
  onHandleDown,
}: {
  slot: Slot;
  r: FRect;
  rect: { w: number; h: number };
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onHandleDown: (e: React.MouseEvent, h: ResizeHandle) => void;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: r.x * rect.w,
        top: r.y * rect.h,
        width: r.w * rect.w,
        height: r.h * rect.h,
        zIndex: 1 + (slot.z_index ?? 0),
      }}
      className={cn(
        "group cursor-move rounded-[2px] text-[10px]",
        selected
          ? "bg-ink/15 ring-1 ring-ink"
          : "bg-ink/5 ring-1 ring-ink/30 hover:ring-ink/60",
      )}
    >
      <div className="absolute left-1 top-1 select-none rounded-sm bg-paper/85 px-1 font-medium text-ink">
        {slot.name}
      </div>
      {selected ? (
        <>
          <Handle pos="nw" onDown={onHandleDown} />
          <Handle pos="n" onDown={onHandleDown} />
          <Handle pos="ne" onDown={onHandleDown} />
          <Handle pos="e" onDown={onHandleDown} />
          <Handle pos="se" onDown={onHandleDown} />
          <Handle pos="s" onDown={onHandleDown} />
          <Handle pos="sw" onDown={onHandleDown} />
          <Handle pos="w" onDown={onHandleDown} />
        </>
      ) : null}
    </div>
  );
}

function Handle({
  pos,
  onDown,
}: {
  pos: ResizeHandle;
  onDown: (e: React.MouseEvent, h: ResizeHandle) => void;
}) {
  const placement: Record<ResizeHandle, string> = {
    nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
    n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
    ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
    e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
    se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
    s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
    sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
    w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  };
  return (
    <span
      onMouseDown={(e) => onDown(e, pos)}
      className={cn(
        "absolute h-2 w-2 rounded-sm border border-ink bg-paper",
        placement[pos],
      )}
    />
  );
}

function renderRect(slot: Slot, grid: Grid | undefined): FRect | null {
  return slotPx(
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
    grid,
    1,
    1,
  );
}

function normalizeRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): FRect {
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    w: Math.abs(x1 - x0),
    h: Math.abs(y1 - y0),
  };
}

function applyResize(
  start: FRect,
  handle: ResizeHandle,
  curX: number,
  curY: number,
): FRect {
  let { x, y, w, h } = start;
  const right = start.x + start.w;
  const bottom = start.y + start.h;
  if (handle.includes("w")) {
    x = clamp01(Math.min(curX, right - 0.005));
    w = right - x;
  }
  if (handle.includes("e")) {
    w = clamp01(Math.max(0.005, curX - start.x));
  }
  if (handle.includes("n")) {
    y = clamp01(Math.min(curY, bottom - 0.005));
    h = bottom - y;
  }
  if (handle.includes("s")) {
    h = clamp01(Math.max(0.005, curY - start.y));
  }
  return { x, y, w, h };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

// SlotRole import kept for callers; not used directly in this layer.
export type { SlotRole };
