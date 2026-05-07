import Link from "next/link";
import { ConfigBanner } from "@/components/ConfigBanner";
import { Button } from "@/components/ui/Button";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { listGridGallery, type GridGalleryEntry } from "@/lib/queries";
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
    <div className="min-h-dvh">
      <ConfigBanner configured={configured} />
      <header className="border-b border-rule bg-mint-soft">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            GridForge
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/gallery"
              className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-paper hover:text-ink"
            >
              Documents
            </Link>
            <Button asChild size="sm">
              <Link href="/new">New</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Grids</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Reusable grids saved across documents. Tap one to apply it to
            another document — its lineage is recorded.
          </p>
        </div>
        <GridGalleryClient grids={grids} />
      </main>
    </div>
  );
}
