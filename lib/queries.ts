import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Document,
  Margins,
  Page,
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

  const builtSpreads: Spread[] = (spreads ?? []).map((s) => {
    const spreadPages = pagesBySpread.get(s.id) ?? [];
    spreadPages.sort((a, b) => sideOrder(a.side) - sideOrder(b.side));
    const builtPages: Page[] = spreadPages.map((p, idx) =>
      buildPage(p, doc, s.index, idx),
    );
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
