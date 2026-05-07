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
    <div className="min-h-dvh bg-canvas">
      <ConfigBanner configured={configured} />

      <header className="sticky top-0 z-20 border-b border-rule bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <LogoMark />
            GridForge
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/gallery"
              className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-paper-soft hover:text-ink"
            >
              Gallery
            </Link>
            <Link
              href="/gallery/grids"
              className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-paper-soft hover:text-ink"
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
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Web ↔ Print, one source
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
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
              className="text-xs text-ink-soft underline-offset-4 hover:text-accent hover:underline"
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
            className="underline-offset-4 hover:text-accent hover:underline"
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

function LogoMark() {
  return (
    <span
      aria-hidden
      className="grid h-6 w-6 place-items-center rounded-md bg-accent text-[var(--color-accent-ink)]"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M3 3h8v8H3z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M3 7h8M7 3v8"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    </span>
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
        <div className="text-sm font-medium text-ink">{doc.name}</div>
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
        <div className="absolute inset-x-8 -top-2 h-[260px] rounded-2xl bg-paper shadow-[0_30px_60px_-30px_rgba(20,20,16,0.25)] ring-1 ring-rule" />
        <svg
          viewBox="0 0 800 260"
          className="relative block w-full"
          role="presentation"
        >
          <rect x="40" y="20" width="720" height="220" fill="#ffffff" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <line
              key={i}
              x1={80 + i * (640 / 12)}
              x2={80 + i * (640 / 12)}
              y1={50}
              y2={210}
              stroke="rgba(17,17,17,0.18)"
              strokeWidth="0.6"
            />
          ))}
          <line x1="80" y1="50" x2="720" y2="50" stroke="rgba(17,17,17,0.18)" strokeWidth="0.6" />
          <line x1="80" y1="210" x2="720" y2="210" stroke="rgba(17,17,17,0.18)" strokeWidth="0.6" />
          {/* heading */}
          <rect
            x="80"
            y="50"
            width={(640 / 12) * 8}
            height="42"
            fill="rgba(17,17,17,0.06)"
            stroke="rgba(17,17,17,0.55)"
            strokeWidth="0.6"
          />
          {/* image (lime accent) */}
          <rect
            x={80 + (640 / 12) * 8}
            y="50"
            width={(640 / 12) * 4}
            height={120}
            fill="rgba(163,230,53,0.12)"
            stroke="#a3e635"
            strokeWidth="1.1"
          />
          {/* body */}
          <rect
            x={80}
            y={50 + 50}
            width={(640 / 12) * 8}
            height={110}
            fill="rgba(17,17,17,0.04)"
            stroke="rgba(17,17,17,0.55)"
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
