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

      <header className="sticky top-0 z-20 border-b border-rule bg-mint-soft/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <LogoMark />
            GridForge
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/gallery"
              className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-paper hover:text-ink"
            >
              Gallery
            </Link>
            <Link
              href="/gallery/grids"
              className="rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-paper hover:text-ink"
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
        {/* Hero block in vivid green, like the reference UI's main pane */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-vivid p-6 text-[var(--color-vivid-ink)] shadow-[0_30px_60px_-30px_rgba(5,46,16,0.45)] sm:mt-10 sm:p-12">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-vivid-ink)]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-vivid-ink)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              Web ↔ Print, one source
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              GridForge
            </h1>
            <p className="mt-4 max-w-xl text-base text-[var(--color-vivid-ink)]/85 sm:text-lg">
              Lay out a Müller-Brockmann grid, drop slots, and export the
              same spec as SVG, PNG, and responsive CSS. Trace from a
              reference photo or compose from scratch.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/new">Create new document</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/gallery/grids">Browse grids</Link>
              </Button>
            </div>
          </div>

          <HeroPreview />
        </section>

        <section className="pb-16 pt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Recent
            </h2>
            <Link
              href="/gallery"
              className="text-xs text-ink-soft underline-offset-4 hover:text-[var(--color-accent-strong)] hover:underline"
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
            className="underline-offset-4 hover:text-[var(--color-accent-strong)] hover:underline"
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
      className="grid h-7 w-7 place-items-center rounded-md bg-vivid text-[var(--color-vivid-ink)]"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 3h8v8H3z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 7h8M7 3v8" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

function DocCard({ doc }: { doc: DocumentSummary }) {
  const ratio = Math.max(0.4, Math.min(2.5, doc.width / doc.height));
  return (
    <Link
      href={`/d/${doc.id}`}
      className="group block overflow-hidden rounded-2xl border border-rule bg-paper transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-[0_10px_30px_-15px_rgba(255,92,46,0.4)]"
    >
      <div className="grid aspect-[4/3] place-items-center bg-mint-soft p-6">
        <span
          className="block bg-page shadow-[0_12px_28px_-18px_rgba(5,46,16,0.35)] ring-1 ring-rule"
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
    <div className="rounded-2xl border border-dashed border-rule bg-paper px-6 py-12 text-center">
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
    <div className="mt-10 hidden sm:block" aria-hidden>
      <div className="relative">
        <svg viewBox="0 0 800 240" className="block w-full" role="presentation">
          <rect x="40" y="0" width="720" height="240" fill="#ffffff" rx="10" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <line
              key={i}
              x1={80 + i * (640 / 12)}
              x2={80 + i * (640 / 12)}
              y1={30}
              y2={210}
              stroke="rgba(17,17,17,0.18)"
              strokeWidth="0.6"
            />
          ))}
          <line x1="80" y1="30" x2="720" y2="30" stroke="rgba(17,17,17,0.18)" strokeWidth="0.6" />
          <line x1="80" y1="210" x2="720" y2="210" stroke="rgba(17,17,17,0.18)" strokeWidth="0.6" />
          {/* heading slot */}
          <rect
            x="80"
            y="30"
            width={(640 / 12) * 8}
            height="42"
            fill="rgba(17,17,17,0.06)"
            stroke="rgba(17,17,17,0.55)"
            strokeWidth="0.6"
          />
          {/* image slot — orange (selected feel) */}
          <rect
            x={80 + (640 / 12) * 8}
            y="30"
            width={(640 / 12) * 4}
            height={120}
            fill="rgba(255,92,46,0.12)"
            stroke="#ff5c2e"
            strokeWidth="1.2"
          />
          {/* body slot */}
          <rect
            x={80}
            y={30 + 50}
            width={(640 / 12) * 8}
            height={130}
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
