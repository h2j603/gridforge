import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConfigBanner } from "@/components/ConfigBanner";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { listRecentDocuments, type DocumentSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = isConfigured();
  let recents: DocumentSummary[] = [];

  if (configured) {
    try {
      const supabase = await createClient();
      recents = await listRecentDocuments(supabase, 12);
    } catch {
      recents = [];
    }
  }

  return (
    <div className="min-h-screen">
      <ConfigBanner configured={configured} />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">GridForge</h1>
            <p className="mt-2 max-w-xl text-sm text-ink-soft">
              Web ↔ Print bidirectional grid design. Define a page, lay out a
              Müller-Brockmann grid, and export SVG / PNG / responsive CSS from
              the same spec.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/gallery">Gallery</Link>
            </Button>
            <Button asChild>
              <Link href="/new">New document</Link>
            </Button>
          </div>
        </header>

        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Recent
          </h2>
          {recents.length === 0 ? (
            <EmptyRecents configured={configured} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recents.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/d/${doc.id}`}
                    className="block rounded-lg border border-rule bg-paper p-4 transition hover:border-ink"
                  >
                    <div className="text-sm font-medium">{doc.name}</div>
                    <div className="mt-1 text-xs text-ink-soft">
                      {doc.width} × {doc.height} {doc.unit} ·{" "}
                      {doc.orientation}
                      {doc.facing_pages ? " · facing" : ""}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyRecents({ configured }: { configured: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-rule bg-paper p-8 text-center text-sm text-ink-soft">
      {configured
        ? "No documents yet. Create one to get started."
        : "Connect Supabase to start saving documents."}
    </div>
  );
}
