// ─── 단위 / 페이지 ────────────────────────────────────

export type Unit = "mm" | "px" | "pt" | "in";
export type Orientation = "portrait" | "landscape";

export interface Bleed {
  top: number;
  bottom: number;
  inside: number;
  outside: number;
}

export interface Margins {
  top: number;
  bottom: number;
  inside: number;
  outside: number;
}

// ─── Document ───────────────────────────────────────

export interface Document {
  id: string;
  name: string;
  description?: string;

  width: number;
  height: number;
  unit: Unit;
  dpi: number;
  orientation: Orientation;
  facing_pages: boolean;
  bleed: Bleed;
  start_page_number: number;

  source_document_id: string | null;
  created_at: string;
  updated_at: string;

  spreads: Spread[];
}

// ─── Spread ─────────────────────────────────────────

export interface Spread {
  id: string;
  document_id: string;
  index: number;
  name?: string;
  pages: Page[];
}

// ─── Page ───────────────────────────────────────────

export interface Page {
  id: string;
  spread_id: string;
  side: "left" | "right" | "single";
  page_number: number;
  margins: Margins;
  grid?: Grid;
  baseline?: Baseline;
  slots?: Slot[];
  references?: Reference[];
}

// ─── Grid ───────────────────────────────────────────

export type GridType = "columnar" | "modular" | "manuscript" | "custom";

export interface Grid {
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

// ─── Baseline ───────────────────────────────────────

export interface Baseline {
  id: string;
  page_id: string;
  start: number;
  increment: number;
  division: number;
  color: "dark" | "light";
}

// ─── Slot ───────────────────────────────────────────

export type SlotMode = "cell" | "free";

export type SlotRole =
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "body"
  | "caption"
  | "quote"
  | "image"
  | "graphic"
  | "decoration"
  | "spacer"
  | "custom";

export interface SlotTypography {
  font_size: number;
  line_height_baselines: number;
  leading_top_baselines: number;
  font_family?: string;
  font_weight?: number;
  letter_spacing?: number;
}

export interface Slot {
  id: string;
  page_id: string;
  name: string;
  role: SlotRole;

  mode: SlotMode;

  col_start?: number;
  col_end?: number;
  row_start?: number;
  row_end?: number;

  x?: number;
  y?: number;
  w?: number;
  h?: number;

  typography?: SlotTypography;
  z_index: number;
  notes?: string;
}

// ─── Reference ──────────────────────────────────────

export interface Reference {
  id: string;
  page_id: string;
  image_url: string;
  opacity: number;
  visible: boolean;
}

// ─── Defaults ───────────────────────────────────────

export const DEFAULT_BLEED: Bleed = {
  top: 0,
  bottom: 0,
  inside: 0,
  outside: 0,
};

export const DEFAULT_MARGINS: Margins = {
  top: 20,
  bottom: 20,
  inside: 20,
  outside: 20,
};
