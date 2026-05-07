"use client";

import { useCallback, useMemo, useReducer, useRef } from "react";
import type {
  Baseline,
  Document,
  Grid,
  GridType,
  Margins,
  Page,
  Slot,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  upsertGrid,
  updateDocument as updateDocumentQuery,
  updatePageMargins,
  type UpdateDocumentPatch,
} from "@/lib/queries";

// ─── Action types ──────────────────────────────────

type Action =
  | { type: "patchDocument"; patch: UpdateDocumentPatch }
  | {
      type: "patchPageMargins";
      pageId: string;
      margins: Margins;
    }
  | {
      type: "upsertGrid";
      pageId: string;
      grid: Grid;
    }
  | { type: "removeGrid"; pageId: string }
  | { type: "setBaseline"; pageId: string; baseline: Baseline | null }
  | { type: "addSlot"; pageId: string; slot: Slot }
  | { type: "patchSlot"; pageId: string; slotId: string; patch: Partial<Slot> }
  | { type: "removeSlot"; pageId: string; slotId: string };

function reducer(state: Document, action: Action): Document {
  switch (action.type) {
    case "patchDocument":
      return { ...state, ...action.patch } as Document;

    case "patchPageMargins":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        margins: action.margins,
      }));

    case "upsertGrid":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        grid: action.grid,
      }));

    case "removeGrid":
      return mapPage(state, action.pageId, (p) => ({ ...p, grid: undefined }));

    case "setBaseline":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        baseline: action.baseline ?? undefined,
      }));

    case "addSlot":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        slots: [...(p.slots ?? []), action.slot],
      }));

    case "patchSlot":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        slots: (p.slots ?? []).map((s) =>
          s.id === action.slotId ? { ...s, ...action.patch } : s,
        ),
      }));

    case "removeSlot":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        slots: (p.slots ?? []).filter((s) => s.id !== action.slotId),
      }));

    default:
      return state;
  }
}

function mapPage(
  doc: Document,
  pageId: string,
  fn: (p: Page) => Page,
): Document {
  return {
    ...doc,
    spreads: doc.spreads.map((s) => ({
      ...s,
      pages: s.pages.map((p) => (p.id === pageId ? fn(p) : p)),
    })),
  };
}

// ─── Hook ─────────────────────────────────────────

export interface SyncStatus {
  pending: number;
  error: string | null;
}

export interface UseDocumentResult {
  document: Document;
  status: SyncStatus;
  patchDocument: (patch: UpdateDocumentPatch) => void;
  patchPageMargins: (pageId: string, margins: Margins) => void;
  upsertGridLocal: (pageId: string, grid: Grid) => void;
  setGridSpec: (
    pageId: string,
    spec: {
      type: GridType;
      cols: number;
      rows: number;
      gutter_x: number;
      gutter_y: number;
      custom_v?: number[];
      custom_h?: number[];
      color?: "dark" | "light";
    },
  ) => void;
}

export function useDocument(initial: Document): UseDocumentResult {
  const [document, dispatch] = useReducer(reducer, initial);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const pendingRef = useRef(0);
  const [status, setStatus] = useReducer(
    (prev: SyncStatus, patch: Partial<SyncStatus>): SyncStatus => ({
      ...prev,
      ...patch,
    }),
    { pending: 0, error: null },
  );

  const runAsync = useCallback(
    async (op: () => Promise<void>) => {
      pendingRef.current += 1;
      setStatus({ pending: pendingRef.current, error: null });
      try {
        await op();
      } catch (e) {
        setStatus({ error: e instanceof Error ? e.message : String(e) });
      } finally {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        setStatus({ pending: pendingRef.current });
      }
    },
    [],
  );

  const patchDocument = useCallback(
    (patch: UpdateDocumentPatch) => {
      dispatch({ type: "patchDocument", patch });
      void runAsync(() => updateDocumentQuery(getSupabase(), document.id, patch));
    },
    [document.id, runAsync],
  );

  const patchPageMargins = useCallback(
    (pageId: string, margins: Margins) => {
      dispatch({ type: "patchPageMargins", pageId, margins });
      void runAsync(() => updatePageMargins(getSupabase(), pageId, margins));
    },
    [runAsync],
  );

  const upsertGridLocal = useCallback((pageId: string, grid: Grid) => {
    dispatch({ type: "upsertGrid", pageId, grid });
  }, []);

  const setGridSpec = useCallback<UseDocumentResult["setGridSpec"]>(
    (pageId, spec) => {
      // Optimistically write a local grid (id may be temp until server replies).
      const existing = findGrid(document, pageId);
      const optimistic: Grid = {
        id: existing?.id ?? `temp-${pageId}`,
        page_id: pageId,
        type: spec.type,
        cols: spec.cols,
        rows: spec.type === "modular" ? spec.rows : 1,
        gutter_x: spec.gutter_x,
        gutter_y: spec.gutter_y,
        custom_v: spec.custom_v ?? existing?.custom_v ?? [],
        custom_h: spec.custom_h ?? existing?.custom_h ?? [],
        color: spec.color ?? existing?.color ?? "dark",
        source_grid_id: existing?.source_grid_id ?? null,
      };
      dispatch({ type: "upsertGrid", pageId, grid: optimistic });
      void runAsync(async () => {
        const saved = await upsertGrid(getSupabase(), {
          page_id: pageId,
          type: optimistic.type,
          cols: optimistic.cols,
          rows: optimistic.rows,
          gutter_x: optimistic.gutter_x,
          gutter_y: optimistic.gutter_y,
          custom_v: optimistic.custom_v,
          custom_h: optimistic.custom_h,
          color: optimistic.color,
          source_grid_id: optimistic.source_grid_id,
        });
        dispatch({ type: "upsertGrid", pageId, grid: saved });
      });
    },
    [document, runAsync],
  );

  return useMemo(
    () => ({
      document,
      status,
      patchDocument,
      patchPageMargins,
      upsertGridLocal,
      setGridSpec,
    }),
    [
      document,
      status,
      patchDocument,
      patchPageMargins,
      upsertGridLocal,
      setGridSpec,
    ],
  );
}

function findGrid(doc: Document, pageId: string): Grid | undefined {
  for (const s of doc.spreads) {
    for (const p of s.pages) {
      if (p.id === pageId) return p.grid;
    }
  }
  return undefined;
}
