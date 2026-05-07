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

  const [gridsRes, baselinesRes, slotsRes] = pageIds.length
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
      ])
    : [
        { data: [] as GridRow[], error: null },
        { data: [] as BaselineRow[], error: null },
        { data: [] as SlotRow[], error: null },
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
