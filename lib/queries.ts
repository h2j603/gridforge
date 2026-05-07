import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Baseline,
  Document,
  Grid,
  GridType,
  Margins,
  Page,
  Slot,
  SlotMode,
  SlotRole,
  SlotTypography,
  Spread,
  Unit,
  Orientation,
  Bleed,
} from "./types";
import { DEFAULT_BLEED, DEFAULT_MARGINS } from "./types";

// ─── Document creation ──────────────────────────────

export interface CreateDocumentInput {
  name: string;
  description?: string;
  width: number;
  height: number;
  unit: Unit;
  dpi?: number;
  orientation: Orientation;
  facing_pages?: boolean;
  bleed?: Bleed;
  start_page_number?: number;
  default_margins?: Margins;
  source_document_id?: string | null;
}

/**
 * Create a Document plus an initial Spread + Page so the editor has
 * something to render right after `/new`.
 */
export async function createDocument(
  supabase: SupabaseClient,
  input: CreateDocumentInput,
): Promise<{ document_id: string }> {
  const facing = input.facing_pages ?? false;

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      name: input.name,
      description: input.description ?? null,
      width: input.width,
      height: input.height,
      unit: input.unit,
      dpi: input.dpi ?? 300,
      orientation: input.orientation,
      facing_pages: facing,
      bleed: input.bleed ?? DEFAULT_BLEED,
      start_page_number: input.start_page_number ?? 1,
      default_margins: input.default_margins ?? DEFAULT_MARGINS,
      source_document_id: input.source_document_id ?? null,
    })
    .select("id")
    .single();

  if (docErr || !doc) {
    throw new Error(docErr?.message ?? "Failed to create document");
  }

  const { data: spread, error: spreadErr } = await supabase
    .from("spreads")
    .insert({ document_id: doc.id, index: 0, name: null })
    .select("id")
    .single();

  if (spreadErr || !spread) {
    throw new Error(spreadErr?.message ?? "Failed to create spread");
  }

  const pageRows = facing
    ? [
        { spread_id: spread.id, side: "left", margins: null },
        { spread_id: spread.id, side: "right", margins: null },
      ]
    : [{ spread_id: spread.id, side: "single", margins: null }];

  const { error: pagesErr } = await supabase.from("pages").insert(pageRows);
  if (pagesErr) {
    throw new Error(pagesErr.message);
  }

  return { document_id: doc.id as string };
}

// ─── Document loading ───────────────────────────────

interface DocumentRow {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  unit: Unit;
  dpi: number;
  orientation: Orientation;
  facing_pages: boolean;
  bleed: Bleed;
  start_page_number: number;
  default_margins: Margins;
  source_document_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SpreadRow {
  id: string;
  document_id: string;
  index: number;
  name: string | null;
}

interface PageRow {
  id: string;
  spread_id: string;
  side: "left" | "right" | "single";
  margins: Margins | null;
}

interface GridRow {
  id: string;
  page_id: string;
  type: GridType;
  cols: number;
  rows: number;
  gutter_x: number;
  gutter_y: number;
  custom_v: number[];
  custom_h: number[];
  color: "dark" | "light";
  source_grid_id: string | null;
}

interface BaselineRow {
  id: string;
  page_id: string;
  start: number;
  increment: number;
  division: number;
  color: "dark" | "light";
}

interface SlotRow {
  id: string;
  page_id: string;
  name: string;
  role: string;
  mode: SlotMode;
  col_start: number | null;
  col_end: number | null;
  row_start: number | null;
  row_end: number | null;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  typography: SlotTypography | null;
  z_index: number;
  notes: string | null;
}

function mapGrid(row: GridRow): Grid {
  return {
    id: row.id,
    page_id: row.page_id,
    type: row.type,
    cols: row.cols,
    rows: row.rows,
    gutter_x: Number(row.gutter_x),
    gutter_y: Number(row.gutter_y),
    custom_v: (row.custom_v ?? []).map(Number),
    custom_h: (row.custom_h ?? []).map(Number),
    color: row.color,
    source_grid_id: row.source_grid_id,
  };
}

function mapBaseline(row: BaselineRow): Baseline {
  return {
    id: row.id,
    page_id: row.page_id,
    start: Number(row.start),
    increment: Number(row.increment),
    division: row.division,
    color: row.color,
  };
}

function mapSlot(row: SlotRow): Slot {
  return {
    id: row.id,
    page_id: row.page_id,
    name: row.name,
    role: row.role as SlotRole,
    mode: row.mode,
    col_start: row.col_start ?? undefined,
    col_end: row.col_end ?? undefined,
    row_start: row.row_start ?? undefined,
    row_end: row.row_end ?? undefined,
    x: row.x ?? undefined,
    y: row.y ?? undefined,
    w: row.w ?? undefined,
    h: row.h ?? undefined,
    typography: row.typography ?? undefined,
    z_index: row.z_index,
    notes: row.notes ?? undefined,
  };
}

/**
 * Load a single Document with its Spreads + Pages. Slots/grids/baselines
 * loading is split into later milestones (v0.2+).
 */
export async function getDocument(
  supabase: SupabaseClient,
  id: string,
): Promise<Document | null> {
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle<DocumentRow>();

  if (docErr) throw new Error(docErr.message);
  if (!doc) return null;

  const { data: spreads, error: spreadsErr } = await supabase
    .from("spreads")
    .select("*")
    .eq("document_id", id)
    .order("index", { ascending: true })
    .returns<SpreadRow[]>();

  if (spreadsErr) throw new Error(spreadsErr.message);

  const spreadIds = (spreads ?? []).map((s) => s.id);

  const { data: pages, error: pagesErr } = spreadIds.length
    ? await supabase
        .from("pages")
        .select("*")
        .in("spread_id", spreadIds)
        .returns<PageRow[]>()
    : { data: [] as PageRow[], error: null };

  if (pagesErr) throw new Error(pagesErr.message);

  const pagesBySpread = new Map<string, PageRow[]>();
  for (const p of pages ?? []) {
    const list = pagesBySpread.get(p.spread_id) ?? [];
    list.push(p);
    pagesBySpread.set(p.spread_id, list);
  }

  const pageIds = (pages ?? []).map((p) => p.id);

  const [gridsRes, baselinesRes, slotsRes, referencesByPage] = pageIds.length
    ? await Promise.all([
        supabase
          .from("grids")
          .select("*")
          .in("page_id", pageIds)
          .returns<GridRow[]>(),
        supabase
          .from("baselines")
          .select("*")
          .in("page_id", pageIds)
          .returns<BaselineRow[]>(),
        supabase
          .from("slots")
          .select("*")
          .in("page_id", pageIds)
          .order("z_index", { ascending: true })
          .returns<SlotRow[]>(),
        listPageReferences(supabase, pageIds),
      ])
    : [
        { data: [] as GridRow[], error: null },
        { data: [] as BaselineRow[], error: null },
        { data: [] as SlotRow[], error: null },
        {} as Record<string, PageReferenceRow[]>,
      ];

  if (gridsRes.error) throw new Error(gridsRes.error.message);
  if (baselinesRes.error) throw new Error(baselinesRes.error.message);
  if (slotsRes.error) throw new Error(slotsRes.error.message);

  const gridByPage = new Map<string, GridRow>();
  for (const g of gridsRes.data ?? []) gridByPage.set(g.page_id, g);
  const baselineByPage = new Map<string, BaselineRow>();
  for (const b of baselinesRes.data ?? []) baselineByPage.set(b.page_id, b);
  const slotsByPage = new Map<string, SlotRow[]>();
  for (const s of slotsRes.data ?? []) {
    const list = slotsByPage.get(s.page_id) ?? [];
    list.push(s);
    slotsByPage.set(s.page_id, list);
  }

  const builtSpreads: Spread[] = (spreads ?? []).map((s) => {
    const spreadPages = pagesBySpread.get(s.id) ?? [];
    spreadPages.sort((a, b) => sideOrder(a.side) - sideOrder(b.side));
    const builtPages: Page[] = spreadPages.map((p, idx) => {
      const page = buildPage(p, doc, s.index, idx);
      const gridRow = gridByPage.get(p.id);
      if (gridRow) page.grid = mapGrid(gridRow);
      const baselineRow = baselineByPage.get(p.id);
      if (baselineRow) page.baseline = mapBaseline(baselineRow);
      const slotRows = slotsByPage.get(p.id);
      if (slotRows && slotRows.length > 0) page.slots = slotRows.map(mapSlot);
      const refs = referencesByPage[p.id];
      if (refs && refs.length > 0) {
        page.references = refs.map((r) => ({
          id: r.id,
          page_id: r.page_id,
          image_url: r.image_url,
          opacity: Number(r.opacity),
          visible: Boolean(r.visible),
          tx: Number(r.tx ?? 0),
          ty: Number(r.ty ?? 0),
          scale: Number(r.scale ?? 1),
          rotation: Number(r.rotation ?? 0),
        }));
      }
      return page;
    });
    return {
      id: s.id,
      document_id: s.document_id,
      index: s.index,
      name: s.name ?? undefined,
      pages: builtPages,
    };
  });

  return {
    id: doc.id,
    name: doc.name,
    description: doc.description ?? undefined,
    width: doc.width,
    height: doc.height,
    unit: doc.unit,
    dpi: doc.dpi,
    orientation: doc.orientation,
    facing_pages: doc.facing_pages,
    bleed: doc.bleed,
    start_page_number: doc.start_page_number,
    source_document_id: doc.source_document_id,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    spreads: builtSpreads,
  };
}

function sideOrder(side: "left" | "right" | "single"): number {
  if (side === "left") return 0;
  if (side === "single") return 1;
  return 2;
}

function buildPage(
  row: PageRow,
  doc: DocumentRow,
  spreadIndex: number,
  pageInSpread: number,
): Page {
  const pagesPerSpread = doc.facing_pages ? 2 : 1;
  const page_number =
    doc.start_page_number + spreadIndex * pagesPerSpread + pageInSpread;
  return {
    id: row.id,
    spread_id: row.spread_id,
    side: row.side,
    page_number,
    margins: row.margins ?? doc.default_margins,
  };
}

// ─── Recent documents ───────────────────────────────

export async function listRecentDocuments(
  supabase: SupabaseClient,
  limit = 12,
): Promise<DocumentSummary[]> {
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id,name,description,width,height,unit,orientation,updated_at,facing_pages",
    )
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<DocumentSummary[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface DocumentSummary {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  unit: Unit;
  orientation: Orientation;
  facing_pages: boolean;
  updated_at: string;
}

// ─── Mutations ──────────────────────────────────────

export interface UpdateDocumentPatch {
  name?: string;
  description?: string | null;
  width?: number;
  height?: number;
  unit?: Unit;
  dpi?: number;
  orientation?: Orientation;
  facing_pages?: boolean;
  bleed?: Bleed;
  start_page_number?: number;
  default_margins?: Margins;
}

export async function updateDocument(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateDocumentPatch,
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updatePageMargins(
  supabase: SupabaseClient,
  pageId: string,
  margins: Margins | null,
): Promise<void> {
  const { error } = await supabase
    .from("pages")
    .update({ margins })
    .eq("id", pageId);
  if (error) throw new Error(error.message);
}

export interface GridUpsertInput {
  page_id: string;
  type: GridType;
  cols: number;
  rows: number;
  gutter_x: number;
  gutter_y: number;
  custom_v?: number[];
  custom_h?: number[];
  color?: "dark" | "light";
  source_grid_id?: string | null;
}

export async function upsertGrid(
  supabase: SupabaseClient,
  input: GridUpsertInput,
): Promise<Grid> {
  const { data, error } = await supabase
    .from("grids")
    .upsert(
      {
        page_id: input.page_id,
        type: input.type,
        cols: input.cols,
        rows: input.rows,
        gutter_x: input.gutter_x,
        gutter_y: input.gutter_y,
        custom_v: input.custom_v ?? [],
        custom_h: input.custom_h ?? [],
        color: input.color ?? "dark",
        source_grid_id: input.source_grid_id ?? null,
      },
      { onConflict: "page_id" },
    )
    .select("*")
    .single<GridRow>();
  if (error || !data) throw new Error(error?.message ?? "Failed to save grid");
  return mapGrid(data);
}

export async function deleteGrid(
  supabase: SupabaseClient,
  pageId: string,
): Promise<void> {
  const { error } = await supabase.from("grids").delete().eq("page_id", pageId);
  if (error) throw new Error(error.message);
}

// ─── Page references (v0.7) ────────────────────────

export const REFERENCES_BUCKET = "references";

export interface PageReferenceRow {
  id: string;
  page_id: string;
  image_url: string;
  opacity: number;
  visible: boolean;
  tx: number;
  ty: number;
  scale: number;
  rotation: number;
}

export async function listPageReferences(
  supabase: SupabaseClient,
  pageIds: string[],
): Promise<Record<string, PageReferenceRow[]>> {
  if (pageIds.length === 0) return {};
  const { data, error } = await supabase
    .from("page_references")
    .select(
      "id, page_id, image_url, opacity, visible, tx, ty, scale, rotation",
    )
    .in("page_id", pageIds)
    .returns<PageReferenceRow[]>();
  if (error) throw new Error(error.message);
  const out: Record<string, PageReferenceRow[]> = {};
  for (const row of data ?? []) {
    const list = out[row.page_id] ?? [];
    list.push(normalizeRefRow(row));
    out[row.page_id] = list;
  }
  return out;
}

function normalizeRefRow(row: PageReferenceRow): PageReferenceRow {
  return {
    ...row,
    opacity: Number(row.opacity),
    tx: Number(row.tx ?? 0),
    ty: Number(row.ty ?? 0),
    scale: Number(row.scale ?? 1),
    rotation: Number(row.rotation ?? 0),
  };
}

/**
 * Upload a file to the public `references` bucket and create a
 * page_references row. Returns the inserted row.
 */
export async function uploadPageReference(
  supabase: SupabaseClient,
  documentId: string,
  pageId: string,
  file: File,
): Promise<PageReferenceRow> {
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "bin";
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${documentId}/${pageId}/${stamp}-${rand}.${safeExt}`;

  const upload = await supabase.storage
    .from(REFERENCES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (upload.error) {
    throw new Error(
      `Upload failed (${upload.error.message}). ` +
        `Make sure the public "references" bucket exists in Supabase Storage.`,
    );
  }

  const { data: pub } = supabase.storage
    .from(REFERENCES_BUCKET)
    .getPublicUrl(path);

  const { data: row, error } = await supabase
    .from("page_references")
    .insert({
      page_id: pageId,
      image_url: pub.publicUrl,
      opacity: 0.5,
      visible: true,
      tx: 0,
      ty: 0,
      scale: 1,
      rotation: 0,
    })
    .select(
      "id, page_id, image_url, opacity, visible, tx, ty, scale, rotation",
    )
    .single<PageReferenceRow>();
  if (error || !row) {
    throw new Error(error?.message ?? "Failed to save reference row");
  }
  return normalizeRefRow(row);
}

export interface PageReferencePatch {
  opacity?: number;
  visible?: boolean;
  tx?: number;
  ty?: number;
  scale?: number;
  rotation?: number;
}

export async function updatePageReference(
  supabase: SupabaseClient,
  refId: string,
  patch: PageReferencePatch,
): Promise<void> {
  const { error } = await supabase
    .from("page_references")
    .update(patch)
    .eq("id", refId);
  if (error) throw new Error(error.message);
}

export async function deletePageReference(
  supabase: SupabaseClient,
  refId: string,
): Promise<void> {
  const { error } = await supabase
    .from("page_references")
    .delete()
    .eq("id", refId);
  if (error) throw new Error(error.message);
}

// ─── Slots ──────────────────────────────────────────

export interface SlotInsertInput {
  page_id: string;
  name: string;
  role: SlotRole;
  mode: SlotMode;
  col_start?: number | null;
  col_end?: number | null;
  row_start?: number | null;
  row_end?: number | null;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
  typography?: SlotTypography | null;
  z_index?: number;
  notes?: string | null;
}

export async function insertSlot(
  supabase: SupabaseClient,
  input: SlotInsertInput,
): Promise<Slot> {
  const { data, error } = await supabase
    .from("slots")
    .insert({
      page_id: input.page_id,
      name: input.name,
      role: input.role,
      mode: input.mode,
      col_start: input.col_start ?? null,
      col_end: input.col_end ?? null,
      row_start: input.row_start ?? null,
      row_end: input.row_end ?? null,
      x: input.x ?? null,
      y: input.y ?? null,
      w: input.w ?? null,
      h: input.h ?? null,
      typography: input.typography ?? null,
      z_index: input.z_index ?? 0,
      notes: input.notes ?? null,
    })
    .select("*")
    .single<SlotRow>();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create slot");
  }
  return mapSlot(data);
}

export interface SlotPatch {
  name?: string;
  role?: SlotRole;
  mode?: SlotMode;
  col_start?: number | null;
  col_end?: number | null;
  row_start?: number | null;
  row_end?: number | null;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
  typography?: SlotTypography | null;
  z_index?: number;
  notes?: string | null;
}

export async function updateSlot(
  supabase: SupabaseClient,
  slotId: string,
  patch: SlotPatch,
): Promise<void> {
  const { error } = await supabase.from("slots").update(patch).eq("id", slotId);
  if (error) throw new Error(error.message);
}

export async function deleteSlot(
  supabase: SupabaseClient,
  slotId: string,
): Promise<void> {
  const { error } = await supabase.from("slots").delete().eq("id", slotId);
  if (error) throw new Error(error.message);
}

// ─── Baselines ──────────────────────────────────────

export interface BaselineUpsertInput {
  page_id: string;
  start: number;
  increment: number;
  division: number;
  color: "dark" | "light";
}

export async function upsertBaseline(
  supabase: SupabaseClient,
  input: BaselineUpsertInput,
): Promise<Baseline> {
  const { data, error } = await supabase
    .from("baselines")
    .upsert(input, { onConflict: "page_id" })
    .select("*")
    .single<BaselineRow>();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save baseline");
  }
  return mapBaseline(data);
}

export async function deleteBaseline(
  supabase: SupabaseClient,
  pageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("baselines")
    .delete()
    .eq("page_id", pageId);
  if (error) throw new Error(error.message);
}

// ─── Spread management (v0.5) ───────────────────────

export async function addSpread(
  supabase: SupabaseClient,
  documentId: string,
  facing: boolean,
): Promise<{ spread_id: string }> {
  const { data: maxRow } = await supabase
    .from("spreads")
    .select("index")
    .eq("document_id", documentId)
    .order("index", { ascending: false })
    .limit(1)
    .maybeSingle<{ index: number }>();
  const nextIndex = (maxRow?.index ?? -1) + 1;

  const { data: spread, error } = await supabase
    .from("spreads")
    .insert({ document_id: documentId, index: nextIndex, name: null })
    .select("id")
    .single<{ id: string }>();
  if (error || !spread) {
    throw new Error(error?.message ?? "Failed to add spread");
  }

  const pageRows = facing
    ? [
        { spread_id: spread.id, side: "left", margins: null },
        { spread_id: spread.id, side: "right", margins: null },
      ]
    : [{ spread_id: spread.id, side: "single", margins: null }];
  const { error: pErr } = await supabase.from("pages").insert(pageRows);
  if (pErr) throw new Error(pErr.message);

  return { spread_id: spread.id };
}

export async function deleteSpread(
  supabase: SupabaseClient,
  spreadId: string,
): Promise<void> {
  const { error } = await supabase
    .from("spreads")
    .delete()
    .eq("id", spreadId);
  if (error) throw new Error(error.message);
}

// ─── Document copy / lineage (v1.0) ────────────────

export async function duplicateDocument(
  supabase: SupabaseClient,
  documentId: string,
  newName?: string,
): Promise<{ document_id: string }> {
  const original = await getDocument(supabase, documentId);
  if (!original) throw new Error("Source document not found");

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      name: newName ?? `${original.name} copy`,
      description: original.description ?? null,
      width: original.width,
      height: original.height,
      unit: original.unit,
      dpi: original.dpi,
      orientation: original.orientation,
      facing_pages: original.facing_pages,
      bleed: original.bleed,
      start_page_number: original.start_page_number,
      default_margins: original.spreads[0]?.pages[0]?.margins ?? DEFAULT_MARGINS,
      source_document_id: documentId,
    })
    .select("id")
    .single<{ id: string }>();
  if (docErr || !doc) {
    throw new Error(docErr?.message ?? "Failed to duplicate document");
  }

  for (const spread of original.spreads) {
    const { data: newSpread, error: sErr } = await supabase
      .from("spreads")
      .insert({
        document_id: doc.id,
        index: spread.index,
        name: spread.name ?? null,
      })
      .select("id")
      .single<{ id: string }>();
    if (sErr || !newSpread) throw new Error(sErr?.message ?? "spread copy");

    for (const p of spread.pages) {
      const { data: newPage, error: pErr } = await supabase
        .from("pages")
        .insert({
          spread_id: newSpread.id,
          side: p.side,
          margins: p.margins,
        })
        .select("id")
        .single<{ id: string }>();
      if (pErr || !newPage) throw new Error(pErr?.message ?? "page copy");

      if (p.grid) {
        const gridSourceId = p.grid.source_grid_id ?? p.grid.id;
        await supabase.from("grids").insert({
          page_id: newPage.id,
          type: p.grid.type,
          cols: p.grid.cols,
          rows: p.grid.rows,
          gutter_x: p.grid.gutter_x,
          gutter_y: p.grid.gutter_y,
          custom_v: p.grid.custom_v,
          custom_h: p.grid.custom_h,
          color: p.grid.color,
          source_grid_id: gridSourceId,
        });
      }
      if (p.baseline) {
        await supabase.from("baselines").insert({
          page_id: newPage.id,
          start: p.baseline.start,
          increment: p.baseline.increment,
          division: p.baseline.division,
          color: p.baseline.color,
        });
      }
      if (p.slots && p.slots.length > 0) {
        await supabase.from("slots").insert(
          p.slots.map((s) => ({
            page_id: newPage.id,
            name: s.name,
            role: s.role,
            mode: s.mode,
            col_start: s.col_start ?? null,
            col_end: s.col_end ?? null,
            row_start: s.row_start ?? null,
            row_end: s.row_end ?? null,
            x: s.x ?? null,
            y: s.y ?? null,
            w: s.w ?? null,
            h: s.h ?? null,
            typography: s.typography ?? null,
            z_index: s.z_index,
            notes: s.notes ?? null,
          })),
        );
      }
    }
  }
  return { document_id: doc.id };
}

// ─── Apply Grid from gallery (v1.0) ────────────────

export async function applyGridToPage(
  supabase: SupabaseClient,
  sourceGridId: string,
  targetPageId: string,
): Promise<Grid> {
  const { data: source, error } = await supabase
    .from("grids")
    .select("*")
    .eq("id", sourceGridId)
    .single<GridRow>();
  if (error || !source) {
    throw new Error(error?.message ?? "Source grid not found");
  }
  return upsertGrid(supabase, {
    page_id: targetPageId,
    type: source.type,
    cols: source.cols,
    rows: source.rows,
    gutter_x: Number(source.gutter_x),
    gutter_y: Number(source.gutter_y),
    custom_v: (source.custom_v ?? []).map(Number),
    custom_h: (source.custom_h ?? []).map(Number),
    color: source.color,
    source_grid_id: source.source_grid_id ?? sourceGridId,
  });
}

// ─── Grid gallery listing (v1.0) ───────────────────

export interface GridGalleryEntry {
  id: string;
  type: string;
  cols: number;
  rows: number;
  gutter_x: number;
  gutter_y: number;
  color: "dark" | "light";
  document_id: string;
  document_name: string;
  width: number;
  height: number;
  unit: Unit;
  descendant_count: number;
}

export async function listGridGallery(
  supabase: SupabaseClient,
  limit = 60,
): Promise<GridGalleryEntry[]> {
  const { data, error } = await supabase
    .from("grid_gallery")
    .select(
      "id,type,cols,rows,gutter_x,gutter_y,color,document_id,document_name,width,height,unit,descendant_count",
    )
    .order("descendant_count", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as GridGalleryEntry[];
}
