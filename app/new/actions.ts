"use server";

import { redirect } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { createDocument } from "@/lib/queries";
import type { Orientation, Unit } from "@/lib/types";

const ALLOWED_UNITS: Unit[] = ["mm", "px", "pt", "in"];
const ALLOWED_ORIENTATIONS: Orientation[] = ["portrait", "landscape"];

interface PresetSize {
  width: number;
  height: number;
  unit: Unit;
}

const PRESETS: Record<string, PresetSize> = {
  a4: { width: 210, height: 297, unit: "mm" },
  a5: { width: 148, height: 210, unit: "mm" },
  letter: { width: 8.5, height: 11, unit: "in" },
  square: { width: 200, height: 200, unit: "mm" },
};

export interface NewDocumentResult {
  ok: boolean;
  error?: string;
}

export async function createDocumentAction(
  _prev: NewDocumentResult | undefined,
  formData: FormData,
): Promise<NewDocumentResult> {
  if (!isConfigured()) {
    return {
      ok: false,
      error: "Supabase is not configured. See .env.example.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };

  const presetKey = String(formData.get("preset") ?? "a4");
  const orientationRaw = String(formData.get("orientation") ?? "portrait");
  const orientation: Orientation = ALLOWED_ORIENTATIONS.includes(
    orientationRaw as Orientation,
  )
    ? (orientationRaw as Orientation)
    : "portrait";

  let width: number;
  let height: number;
  let unit: Unit;

  if (presetKey === "custom") {
    width = Number(formData.get("width"));
    height = Number(formData.get("height"));
    const u = String(formData.get("unit") ?? "mm");
    if (!ALLOWED_UNITS.includes(u as Unit)) {
      return { ok: false, error: "Invalid unit." };
    }
    unit = u as Unit;
    if (!Number.isFinite(width) || width <= 0) {
      return { ok: false, error: "Width must be a positive number." };
    }
    if (!Number.isFinite(height) || height <= 0) {
      return { ok: false, error: "Height must be a positive number." };
    }
  } else {
    const preset = PRESETS[presetKey] ?? PRESETS.a4;
    width = preset.width;
    height = preset.height;
    unit = preset.unit;
  }

  if (orientation === "landscape" && height > width) {
    [width, height] = [height, width];
  } else if (orientation === "portrait" && width > height) {
    [width, height] = [height, width];
  }

  const facing = formData.get("facing_pages") === "on";
  const dpi = Number(formData.get("dpi") ?? 300) || 300;

  let documentId: string;
  try {
    const supabase = await createClient();
    const { document_id } = await createDocument(supabase, {
      name,
      width,
      height,
      unit,
      orientation,
      facing_pages: facing,
      dpi,
    });
    documentId = document_id;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create document.",
    };
  }

  redirect(`/d/${documentId}`);
}
