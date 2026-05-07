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
    <div className="min-h-dvh">
      <ConfigBanner configured={configured} />

      <header className="border-b border-rule bg-paper/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            GridForge
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/gallery"
              className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-canvas hover:text-ink"
            >
              Gallery
            </Link>
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

      <main className="mx-auto max-w-5xl px-5 sm:px-8">
        <section className="py-12 sm:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Web ↔ Print, one source
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Lay out a Müller-Brockmann grid.{" "}
              <span className="text-ink-soft">
                Export SVG, PNG, and responsive CSS from the same spec.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-ink-soft">
              Define a page, drop a grid, place slots — then ship the print
              file and the web layout from one document. Save grids to a
              gallery and reuse them across projects.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/new">Create new document</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/gallery/grids">Browse grids</Link>
              </Button>
            </div>
          </div>

          <HeroPreview />
        </section>

        <section className="border-t border-rule pb-16 pt-10 sm:pt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Recent
            </h2>
            <Link
              href="/gallery"
              className="text-xs text-ink-soft underline-offset-4 hover:underline"
            >
              All →
            </Link>
          </div>
          {recents.length === 0 ? (
            <EmptyRecents configured={configured} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recents.map((doc) => (
                <li key={doc.id}>
                  <DocCard doc={doc} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 text-xs text-ink-faint sm:px-8">
          <span>GridForge · v1</span>
          <a
            href="https://github.com/h2j603/gridforge"
            className="underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            github
          </a>
        </div>
      </footer>
    </div>
  );
}

function DocCard({ doc }: { doc: DocumentSummary }) {
  const ratio = Math.max(0.4, Math.min(2.5, doc.width / doc.height));
  return (
    <Link
      href={`/d/${doc.id}`}
      className="group block overflow-hidden rounded-xl border border-rule bg-paper transition hover:-translate-y-0.5 hover:border-ink hover:shadow-md"
    >
      <div className="grid aspect-[4/3] place-items-center bg-canvas p-6">
        <span
          className="block bg-paper shadow-[0_2px_18px_rgba(14,14,12,0.08)] ring-1 ring-rule"
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

function EmptyRecents({ configured }: { configured: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-rule bg-paper px-6 py-12 text-center">
      <p className="text-sm text-ink">
        {configured ? "No documents yet." : "Connect Supabase to start saving."}
      </p>
      {configured ? (
        <Button asChild className="mt-4" size="sm">
          <Link href="/new">Create your first document</Link>
        </Button>
      ) : null}
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="mt-12 hidden sm:block" aria-hidden>
      <div className="relative mx-auto max-w-3xl">
        <div className="absolute inset-x-8 -top-2 h-[260px] rounded-2xl bg-paper shadow-[0_30px_60px_-30px_rgba(14,14,12,0.25)] ring-1 ring-rule" />
        <svg
          viewBox="0 0 800 260"
          className="relative block w-full"
          role="presentation"
        >
          <defs>
            <pattern
              id="gridlines"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(14,14,12,0.1)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            x="40"
            y="20"
            width="720"
            height="220"
            fill="white"
            stroke="#e1e1dc"
          />
          <rect
            x="80"
            y="50"
            width="640"
            height="160"
            fill="url(#gridlines)"
          />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <line
              key={i}
              x1={80 + i * (640 / 12)}
              x2={80 + i * (640 / 12)}
              y1={50}
              y2={210}
              stroke="rgba(14,14,12,0.15)"
              strokeWidth="0.6"
            />
          ))}
          <rect
            x="80"
            y="50"
            width={(640 / 12) * 8}
            height="42"
            fill="rgba(14,14,12,0.08)"
            stroke="#0e0e0c"
            strokeWidth="0.6"
          />
          <rect
            x={80 + (640 / 12) * 8}
            y="50"
            width={(640 / 12) * 4}
            height={120}
            fill="rgba(31,77,255,0.08)"
            stroke="#1f4dff"
            strokeWidth="0.6"
          />
          <rect
            x={80}
            y={50 + 50}
            width={(640 / 12) * 8}
            height={110}
            fill="rgba(14,14,12,0.04)"
            stroke="#0e0e0c"
            strokeWidth="0.6"
          />
        </svg>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (Math.round(n) === n) return String(n);
  return n.toFixed(1);
}
