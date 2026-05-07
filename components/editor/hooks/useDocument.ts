"use client";

import { useCallback, useMemo, useReducer, useRef } from "react";
import type {
  Baseline,
  Document,
  Grid,
  GridType,
  Margins,
  Page,
  Reference,
  Slot,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  addSpread as addSpreadQuery,
  applyGridToPage as applyGridToPageQuery,
  deleteBaseline,
  deletePageReference,
  deleteSlot as deleteSlotQuery,
  deleteSpread as deleteSpreadQuery,
  insertSlot,
  updatePageReference,
  updateSlot,
  uploadPageReference,
  upsertBaseline,
  upsertGrid,
  updateDocument as updateDocumentQuery,
  updatePageMargins,
  type SlotPatch,
  type UpdateDocumentPatch,
} from "@/lib/queries";

// ─── Action types ──────────────────────────────────

type SlotMutationPatch = Partial<{
  name: Slot["name"];
  role: Slot["role"];
  mode: Slot["mode"];
  col_start: number | null;
  col_end: number | null;
  row_start: number | null;
  row_end: number | null;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  typography: Slot["typography"] | null;
  z_index: number;
  notes: string | null;
}>;

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
  | {
      type: "patchSlot";
      pageId: string;
      slotId: string;
      patch: SlotMutationPatch;
    }
  | { type: "removeSlot"; pageId: string; slotId: string }
  | { type: "addReference"; pageId: string; reference: Reference }
  | {
      type: "patchReference";
      pageId: string;
      refId: string;
      patch: Partial<Reference>;
    }
  | { type: "removeReference"; pageId: string; refId: string };

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
          s.id === action.slotId ? mergeSlotPatch(s, action.patch) : s,
        ),
      }));

    case "removeSlot":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        slots: (p.slots ?? []).filter((s) => s.id !== action.slotId),
      }));

    case "addReference":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        references: [...(p.references ?? []), action.reference],
      }));

    case "patchReference":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        references: (p.references ?? []).map((r) =>
          r.id === action.refId ? { ...r, ...action.patch } : r,
        ),
      }));

    case "removeReference":
      return mapPage(state, action.pageId, (p) => ({
        ...p,
        references: (p.references ?? []).filter((r) => r.id !== action.refId),
      }));

    default:
      return state;
  }
}

function mergeSlotPatch(slot: Slot, patch: SlotMutationPatch): Slot {
  const next: Record<string, unknown> = { ...slot };
  for (const k of Object.keys(patch) as Array<keyof SlotMutationPatch>) {
    const v = patch[k];
    if (v === null) next[k] = undefined;
    else if (v !== undefined) next[k] = v;
  }
  return next as unknown as Slot;
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
  createSlot: (
    pageId: string,
    draft: {
      name: string;
      role: Slot["role"];
      mode: Slot["mode"];
      col_start?: number;
      col_end?: number;
      row_start?: number;
      row_end?: number;
      x?: number;
      y?: number;
      w?: number;
      h?: number;
      z_index?: number;
    },
  ) => Promise<Slot>;
  patchSlot: (pageId: string, slotId: string, patch: SlotPatch) => void;
  removeSlot: (pageId: string, slotId: string) => void;
  setBaselineSpec: (
    pageId: string,
    spec: { start: number; increment: number; division: number; color: "dark" | "light" } | null,
  ) => void;
  addSpread: () => Promise<void>;
  removeSpread: (spreadId: string) => Promise<void>;
  uploadReference: (pageId: string, file: File) => Promise<Reference>;
  setReferenceOpacity: (
    pageId: string,
    refId: string,
    opacity: number,
  ) => void;
  setReferenceVisible: (
    pageId: string,
    refId: string,
    visible: boolean,
  ) => void;
  setReferenceTransform: (
    pageId: string,
    refId: string,
    patch: { tx?: number; ty?: number; scale?: number; rotation?: number },
  ) => void;
  removeReference: (pageId: string, refId: string) => void;
  applyGridFromGallery: (pageId: string, sourceGridId: string) => Promise<void>;
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

  const createSlot = useCallback<UseDocumentResult["createSlot"]>(
    async (pageId, draft) => {
      const tempId = `temp-slot-${Math.random().toString(36).slice(2, 10)}`;
      const optimistic: Slot = {
        id: tempId,
        page_id: pageId,
        name: draft.name,
        role: draft.role,
        mode: draft.mode,
        col_start: draft.col_start,
        col_end: draft.col_end,
        row_start: draft.row_start,
        row_end: draft.row_end,
        x: draft.x,
        y: draft.y,
        w: draft.w,
        h: draft.h,
        z_index: draft.z_index ?? 0,
      };
      dispatch({ type: "addSlot", pageId, slot: optimistic });
      try {
        pendingRef.current += 1;
        setStatus({ pending: pendingRef.current, error: null });
        const saved = await insertSlot(getSupabase(), {
          page_id: pageId,
          name: draft.name,
          role: draft.role,
          mode: draft.mode,
          col_start: draft.col_start ?? null,
          col_end: draft.col_end ?? null,
          row_start: draft.row_start ?? null,
          row_end: draft.row_end ?? null,
          x: draft.x ?? null,
          y: draft.y ?? null,
          w: draft.w ?? null,
          h: draft.h ?? null,
          z_index: draft.z_index ?? 0,
        });
        // Replace temp with persisted row.
        dispatch({ type: "removeSlot", pageId, slotId: tempId });
        dispatch({ type: "addSlot", pageId, slot: saved });
        return saved;
      } catch (e) {
        dispatch({ type: "removeSlot", pageId, slotId: tempId });
        setStatus({
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      } finally {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        setStatus({ pending: pendingRef.current });
      }
    },
    [],
  );

  const patchSlotCb = useCallback<UseDocumentResult["patchSlot"]>(
    (pageId, slotId, patch) => {
      dispatch({ type: "patchSlot", pageId, slotId, patch });
      if (slotId.startsWith("temp-")) return;
      void runAsync(() => updateSlot(getSupabase(), slotId, patch));
    },
    [runAsync],
  );

  const removeSlotCb = useCallback<UseDocumentResult["removeSlot"]>(
    (pageId, slotId) => {
      dispatch({ type: "removeSlot", pageId, slotId });
      if (slotId.startsWith("temp-")) return;
      void runAsync(() => deleteSlotQuery(getSupabase(), slotId));
    },
    [runAsync],
  );

  const setBaselineSpec = useCallback<UseDocumentResult["setBaselineSpec"]>(
    (pageId, spec) => {
      if (spec === null) {
        dispatch({ type: "setBaseline", pageId, baseline: null });
        void runAsync(() => deleteBaseline(getSupabase(), pageId));
        return;
      }
      const optimistic: Baseline = {
        id: `temp-baseline-${pageId}`,
        page_id: pageId,
        start: spec.start,
        increment: spec.increment,
        division: spec.division,
        color: spec.color,
      };
      dispatch({ type: "setBaseline", pageId, baseline: optimistic });
      void runAsync(async () => {
        const saved = await upsertBaseline(getSupabase(), {
          page_id: pageId,
          start: spec.start,
          increment: spec.increment,
          division: spec.division,
          color: spec.color,
        });
        dispatch({ type: "setBaseline", pageId, baseline: saved });
      });
    },
    [runAsync],
  );

  const addSpread = useCallback(async () => {
    pendingRef.current += 1;
    setStatus({ pending: pendingRef.current, error: null });
    try {
      await addSpreadQuery(getSupabase(), document.id, document.facing_pages);
      // Force a hard reload of the document state via location reload — the
      // current useReducer state doesn't synthesize ids/page_numbers reliably
      // for new spreads. v0.5+ can refine this with a proper merge.
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (e) {
      setStatus({
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setStatus({ pending: pendingRef.current });
    }
  }, [document.id, document.facing_pages]);

  const removeSpread = useCallback(async (spreadId: string) => {
    pendingRef.current += 1;
    setStatus({ pending: pendingRef.current, error: null });
    try {
      await deleteSpreadQuery(getSupabase(), spreadId);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (e) {
      setStatus({
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setStatus({ pending: pendingRef.current });
    }
  }, []);

  const uploadReferenceCb = useCallback<UseDocumentResult["uploadReference"]>(
    async (pageId, file) => {
      pendingRef.current += 1;
      setStatus({ pending: pendingRef.current, error: null });
      try {
        const ref = await uploadPageReference(
          getSupabase(),
          document.id,
          pageId,
          file,
        );
        const reference: Reference = {
          id: ref.id,
          page_id: ref.page_id,
          image_url: ref.image_url,
          opacity: ref.opacity,
          visible: ref.visible,
          tx: ref.tx,
          ty: ref.ty,
          scale: ref.scale,
          rotation: ref.rotation,
        };
        dispatch({ type: "addReference", pageId, reference });
        return reference;
      } catch (e) {
        setStatus({
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      } finally {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        setStatus({ pending: pendingRef.current });
      }
    },
    [document.id],
  );

  const setReferenceOpacity = useCallback<
    UseDocumentResult["setReferenceOpacity"]
  >(
    (pageId, refId, opacity) => {
      dispatch({
        type: "patchReference",
        pageId,
        refId,
        patch: { opacity },
      });
      void runAsync(() =>
        updatePageReference(getSupabase(), refId, { opacity }),
      );
    },
    [runAsync],
  );

  const setReferenceVisible = useCallback<
    UseDocumentResult["setReferenceVisible"]
  >(
    (pageId, refId, visible) => {
      dispatch({
        type: "patchReference",
        pageId,
        refId,
        patch: { visible },
      });
      void runAsync(() =>
        updatePageReference(getSupabase(), refId, { visible }),
      );
    },
    [runAsync],
  );

  const setReferenceTransform = useCallback<
    UseDocumentResult["setReferenceTransform"]
  >(
    (pageId, refId, patch) => {
      dispatch({
        type: "patchReference",
        pageId,
        refId,
        patch,
      });
      void runAsync(() => updatePageReference(getSupabase(), refId, patch));
    },
    [runAsync],
  );

  const removeReferenceCb = useCallback<UseDocumentResult["removeReference"]>(
    (pageId, refId) => {
      dispatch({ type: "removeReference", pageId, refId });
      void runAsync(() => deletePageReference(getSupabase(), refId));
    },
    [runAsync],
  );

  const applyGridFromGallery = useCallback<
    UseDocumentResult["applyGridFromGallery"]
  >(
    async (pageId, sourceGridId) => {
      pendingRef.current += 1;
      setStatus({ pending: pendingRef.current, error: null });
      try {
        const saved = await applyGridToPageQuery(
          getSupabase(),
          sourceGridId,
          pageId,
        );
        dispatch({ type: "upsertGrid", pageId, grid: saved });
      } catch (e) {
        setStatus({
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      } finally {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        setStatus({ pending: pendingRef.current });
      }
    },
    [],
  );

  return useMemo(
    () => ({
      document,
      status,
      patchDocument,
      patchPageMargins,
      upsertGridLocal,
      setGridSpec,
      createSlot,
      patchSlot: patchSlotCb,
      removeSlot: removeSlotCb,
      setBaselineSpec,
      addSpread,
      removeSpread,
      uploadReference: uploadReferenceCb,
      setReferenceOpacity,
      setReferenceVisible,
      setReferenceTransform,
      removeReference: removeReferenceCb,
      applyGridFromGallery,
    }),
    [
      document,
      status,
      patchDocument,
      patchPageMargins,
      upsertGridLocal,
      setGridSpec,
      createSlot,
      patchSlotCb,
      removeSlotCb,
      setBaselineSpec,
      addSpread,
      removeSpread,
      uploadReferenceCb,
      setReferenceOpacity,
      setReferenceVisible,
      setReferenceTransform,
      removeReferenceCb,
      applyGridFromGallery,
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
