"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Grid, Page, Slot } from "@/lib/types";
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
  /** When false, new draws go straight to free mode (Alt-equivalent for touch). */
  snapToGrid: boolean;
  onSelect: (slotId: string | null) => void;
  onCreate: (input: CreateInput) => void;
  onPatch: (slotId: string, patch: PatchInput) => void;
  onRemove: (slotId: string) => void;
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
  snapToGrid,
  onSelect,
  onCreate,
  onPatch,
  onRemove,
}: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    drag: DragState | null;
    pointerId: number | null;
    altPressed: boolean;
  }>({ drag: null, pointerId: null, altPressed: false });
  const previewRef = useRef<{
    drawRect: FRect | null;
    movedRect: { slotId: string; rect: FRect } | null;
  }>({ drawRect: null, movedRect: null });
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

  // Pointer move/up at the window level so drags survive crossing the layer
  // boundary. Pointer Events handle mouse + touch + pen in a single API.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const state = dragRef.current;
      if (!state.drag || state.pointerId !== e.pointerId) return;
      e.preventDefault();
      state.altPressed = e.altKey || state.altPressed;
      const { x, y } = localPos(e);
      const drag = state.drag;
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

    const onUp = (e: PointerEvent) => {
      const state = dragRef.current;
      if (!state.drag || state.pointerId !== e.pointerId) return;
      const drag = state.drag;
      // touch always reports altKey=false; the user controls "free draw"
      // through the snapToGrid prop instead.
      const altPressed = e.altKey || state.altPressed;
      const wantFree = !snapToGrid || altPressed;
      if (drag.kind === "draw") {
        const r = previewRef.current.drawRect;
        if (r && r.w > 0.005 && r.h > 0.005) {
          if (!grid || wantFree) {
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
            slot && grid && slot.mode === "cell" && !wantFree;
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
      dragRef.current = { drag: null, pointerId: null, altPressed: false };
      previewRef.current = { drawRect: null, movedRect: null };
      tick();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [grid, localPos, onCreate, onPatch, slots, snapToGrid]);

  const startDrag = (
    e: React.PointerEvent,
    drag: DragState,
  ) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse")
      return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      drag,
      pointerId: e.pointerId,
      altPressed: e.altKey,
    };
  };

  const onLayerPointerDown = (e: React.PointerEvent) => {
    if (e.target !== layerRef.current) return;
    onSelect(null);
    const { x, y } = localPos(e);
    e.preventDefault();
    previewRef.current.drawRect = { x, y, w: 0, h: 0 };
    startDrag(e, { kind: "draw", startX: x, startY: y });
    tick();
  };

  const onSlotPointerDown = (e: React.PointerEvent, slot: Slot) => {
    e.stopPropagation();
    onSelect(slot.id);
    const { x, y } = localPos(e);
    const r = renderRect(slot, grid);
    if (!r) return;
    startDrag(e, {
      kind: "move",
      slotId: slot.id,
      originX: x,
      originY: y,
      slotStart: r,
    });
  };

  const onHandlePointerDown = (
    e: React.PointerEvent,
    slot: Slot,
    handle: ResizeHandle,
  ) => {
    e.stopPropagation();
    onSelect(slot.id);
    const { x, y } = localPos(e);
    const r = renderRect(slot, grid);
    if (!r) return;
    startDrag(e, {
      kind: "resize",
      slotId: slot.id,
      handle,
      originX: x,
      originY: y,
      slotStart: r,
    });
  };

  const drawRect = previewRef.current.drawRect;

  return (
    <div
      ref={layerRef}
      onPointerDown={onLayerPointerDown}
      className="absolute touch-none"
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
            onPointerDown={(e) => onSlotPointerDown(e, slot)}
            onHandleDown={(e, h) => onHandlePointerDown(e, slot, h)}
            onRemove={() => {
              onRemove(slot.id);
              onSelect(null);
            }}
          />
        );
      })}

      {drawRect && (drawRect.w > 0 || drawRect.h > 0) ? (
        <div
          className="pointer-events-none absolute border-2 border-dashed bg-[rgba(163,230,53,0.1)]"
          style={{
            left: drawRect.x * rect.w,
            top: drawRect.y * rect.h,
            width: drawRect.w * rect.w,
            height: drawRect.h * rect.h,
            borderColor: "var(--color-accent)",
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
  onPointerDown,
  onHandleDown,
  onRemove,
}: {
  slot: Slot;
  r: FRect;
  rect: { w: number; h: number };
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onHandleDown: (e: React.PointerEvent, h: ResizeHandle) => void;
  onRemove: () => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left: r.x * rect.w,
        top: r.y * rect.h,
        width: r.w * rect.w,
        height: r.h * rect.h,
        zIndex: 1 + (slot.z_index ?? 0),
      }}
      className={cn(
        "group cursor-move touch-none rounded-[2px] text-[10px]",
        selected
          ? "bg-[rgba(163,255,18,0.12)] ring-1.5 ring-[var(--color-accent)]"
          : "bg-black/5 ring-1 ring-black/30 hover:ring-black/55",
      )}
    >
      <div
        className={cn(
          "absolute left-1 top-1 select-none rounded-sm px-1 font-medium",
          selected
            ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
            : "bg-white/85 text-[var(--color-page-ink)]",
        )}
      >
        {slot.name}
      </div>
      {selected ? (
        <>
          {/* Delete button overlay (top-right of selected slot) */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Delete slot"
            className="absolute -right-2.5 -top-2.5 grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-red-500 bg-white text-red-600 shadow-md transition hover:bg-red-500 hover:text-white touch-none"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 3l6 6M9 3l-6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
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
  onDown: (e: React.PointerEvent, h: ResizeHandle) => void;
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
      onPointerDown={(e) => onDown(e, pos)}
      className={cn(
        // Larger touch target on small screens (Apple HIG min 44px-ish);
        // visual inner box stays small.
        "absolute flex h-5 w-5 items-center justify-center touch-none",
        placement[pos],
      )}
    >
      <span
        className="block h-2 w-2 rounded-sm border bg-white"
        style={{ borderColor: "var(--color-accent)" }}
      />
    </span>
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
