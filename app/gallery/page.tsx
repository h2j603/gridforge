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
    <div className="min-h-dvh">
      <ConfigBanner configured={configured} />
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            GridForge
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/gallery/grids"
              className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-canvas hover:text-ink"
            >
              Grids
            </Link>
            <Button asChild size="sm">
              <Link href="/new">New</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {docs.length} document{docs.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rule bg-paper px-6 py-16 text-center">
            <p className="text-sm">No documents yet.</p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/new">Create your first document</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <li key={doc.id}>
                <DocCard doc={doc} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function DocCard({ doc }: { doc: DocumentSummary }) {
  const ratio = Math.max(0.4, Math.min(2.5, doc.width / doc.height));
  return (
    <Link
      href={`/d/${doc.id}`}
      className="group block overflow-hidden rounded-xl border border-rule bg-paper transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_10px_30px_-15px_rgba(132,204,22,0.4)]"
    >
      <div className="grid aspect-[4/3] place-items-center bg-canvas-soft p-6">
        <span
          className="block bg-page shadow-[0_12px_28px_-18px_rgba(20,20,16,0.3)] ring-1 ring-rule"
          style={{
            width: ratio >= 1 ? "70%" : `${70 * ratio}%`,
            aspectRatio: `${ratio}`,
          }}
        />
      </div>
      <div className="border-t border-rule px-4 py-3">
        <div className="text-sm font-medium">{doc.name}</div>
        <div className="mt-0.5 text-xs text-ink-soft">
          {fmt(doc.width)} × {fmt(doc.height)} {doc.unit} · {doc.orientation}
          {doc.facing_pages ? " · facing" : ""}
        </div>
      </div>
    </Link>
  );
}

function fmt(n: number): string {
  if (Math.round(n) === n) return String(n);
  return n.toFixed(1);
}
