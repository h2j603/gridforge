import Link from "next/link";
import { ConfigBanner } from "@/components/ConfigBanner";
import { Button } from "@/components/ui/Button";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { listRecentDocuments, type DocumentSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const configured = isConfigured();
  let docs: DocumentSummary[] = [];

  if (configured) {
    try {
      const supabase = await createClient();
      docs = await listRecentDocuments(supabase, 60);
    } catch {
      docs = [];
    }
  }

  return (
    <div className="min-h-screen">
      <ConfigBanner configured={configured} />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-xs text-ink-soft underline-offset-4 hover:underline"
            >
              ← Back
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Documents
            </h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/gallery/grids">Grids</Link>
            </Button>
            <Button asChild>
              <Link href="/new">New</Link>
            </Button>
          </div>
        </header>

        {docs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-rule bg-paper p-10 text-center text-sm text-ink-soft">
            No documents yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/d/${doc.id}`}
                  className="block rounded-lg border border-rule bg-paper p-4 transition hover:border-ink"
                >
                  <div className="text-sm font-medium">{doc.name}</div>
                  <div className="mt-1 text-xs text-ink-soft">
                    {doc.width} × {doc.height} {doc.unit} · {doc.orientation}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
