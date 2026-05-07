import Link from "next/link";
import { ConfigBanner } from "@/components/ConfigBanner";
import { isConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function GridGalleryPage() {
  return (
    <div className="min-h-screen">
      <ConfigBanner configured={isConfigured()} />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/gallery"
          className="text-xs text-ink-soft underline-offset-4 hover:underline"
        >
          ← Documents
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Grids</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Reusable grids with descendant counts. Lands in v1.0.
        </p>
        <div className="mt-8 rounded-lg border border-dashed border-rule bg-paper p-10 text-center text-sm text-ink-soft">
          No reusable grids yet.
        </div>
      </div>
    </div>
  );
}
