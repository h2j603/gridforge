"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  applyGridToPage,
  listRecentDocuments,
  type DocumentSummary,
  type GridGalleryEntry,
} from "@/lib/queries";

interface Props {
  grids: GridGalleryEntry[];
}

export function GridGalleryClient({ grids }: Props) {
  const [active, setActive] = useState<GridGalleryEntry | null>(null);
  if (grids.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rule bg-paper px-6 py-16 text-center">
        <p className="text-sm">No reusable grids yet.</p>
        <p className="mt-1 text-xs text-ink-soft">
          Create a grid in any document and it will appear here.
        </p>
      </div>
    );
  }
  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grids.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => setActive(g)}
              className="group block w-full overflow-hidden rounded-xl border border-rule bg-paper text-left transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_10px_30px_-15px_rgba(132,204,22,0.4)]"
            >
              <div className="grid aspect-[4/3] place-items-center bg-canvas-soft p-6">
                <GridPreview cols={g.cols} rows={g.rows} />
              </div>
              <div className="border-t border-rule px-4 py-3">
                <div className="text-sm font-medium">
                  {g.cols} × {g.rows}{" "}
                  <span className="text-ink-soft">{g.type}</span>
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  from {g.document_name} · {g.descendant_count} reuse
                  {g.descendant_count === 1 ? "" : "s"}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <ApplyGridDialog
        grid={active}
        open={Boolean(active)}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </>
  );
}

function GridPreview({ cols, rows }: { cols: number; rows: number }) {
  return (
    <svg viewBox="0 0 100 75" className="h-24 w-32" role="presentation">
      <rect
        x="0.5"
        y="0.5"
        width="99"
        height="74"
        fill="white"
        stroke="#c8c7c0"
        strokeWidth="0.5"
      />
      {Array.from({ length: cols + 1 }, (_, i) => i).map((i) => (
        <line
          key={`v-${i}`}
          x1={(i / cols) * 100}
          x2={(i / cols) * 100}
          y1={0}
          y2={75}
          stroke="rgba(14,14,12,0.45)"
          strokeWidth="0.4"
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => i).map((i) => (
        <line
          key={`h-${i}`}
          x1={0}
          x2={100}
          y1={(i / rows) * 75}
          y2={(i / rows) * 75}
          stroke="rgba(14,14,12,0.45)"
          strokeWidth="0.4"
        />
      ))}
    </svg>
  );
}

function ApplyGridDialog({
  grid,
  open,
  onOpenChange,
}: {
  grid: GridGalleryEntry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [docs, setDocs] = useState<DocumentSummary[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const ensureDocs = async () => {
    if (docs) return;
    try {
      const supabase = createClient();
      const list = await listRecentDocuments(supabase, 60);
      setDocs(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onApply = async (targetDocId: string) => {
    if (!grid) return;
    setErr(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: pages, error } = await supabase
        .from("pages")
        .select("id, spreads!inner(document_id)")
        .eq("spreads.document_id", targetDocId)
        .limit(1);
      if (error) throw new Error(error.message);
      const firstPageId = (pages as Array<{ id: string }> | null)?.[0]?.id;
      if (!firstPageId) {
        throw new Error("Target document has no pages.");
      }
      await applyGridToPage(supabase, grid.id, firstPageId);
      onOpenChange(false);
      window.location.href = `/d/${targetDocId}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (o) void ensureDocs();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-paper p-5 shadow-2xl">
          <Dialog.Title className="text-base font-semibold tracking-tight">
            Apply grid{" "}
            {grid ? (
              <span className="text-ink-soft">
                ({grid.cols}×{grid.rows} {grid.type})
              </span>
            ) : null}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-ink-soft">
            Choose a target document. The grid lands on its first page.
          </Dialog.Description>
          <ul className="mt-4 max-h-[50vh] divide-y divide-rule overflow-y-auto rounded-lg border border-rule">
            {docs === null ? (
              <li className="px-3 py-3 text-sm text-ink-soft">Loading…</li>
            ) : docs.length === 0 ? (
              <li className="px-3 py-3 text-sm text-ink-soft">
                No documents yet.
              </li>
            ) : (
              docs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{d.name}</div>
                    <div className="text-[11px] text-ink-soft">
                      {d.width} × {d.height} {d.unit}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onApply(d.id)}
                  >
                    Apply
                  </Button>
                </li>
              ))
            )}
          </ul>
          {err ? (
            <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {err}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
