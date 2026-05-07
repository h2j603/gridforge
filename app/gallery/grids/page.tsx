import Link from "next/link";
import { ConfigBanner } from "@/components/ConfigBanner";
import { createClient, isConfigured } from "@/lib/supabase/server";
import {
  listGridGallery,
  type GridGalleryEntry,
} from "@/lib/queries";
import { GridGalleryClient } from "./GridGalleryClient";

export const dynamic = "force-dynamic";

export default async function GridGalleryPage() {
  const configured = isConfigured();
  let grids: GridGalleryEntry[] = [];
  if (configured) {
    try {
      const supabase = await createClient();
      grids = await listGridGallery(supabase, 60);
    } catch {
      grids = [];
    }
  }

  return (
    <div className="min-h-screen">
      <ConfigBanner configured={configured} />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/gallery"
          className="text-xs text-ink-soft underline-offset-4 hover:underline"
        >
          ← Documents
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Grids</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Reusable grids saved across documents. Click a grid to apply it to
          another document.
        </p>
        <GridGalleryClient grids={grids} />
      </div>
    </div>
  );
}
