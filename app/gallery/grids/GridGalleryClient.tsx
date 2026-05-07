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
      <div className="mt-8 rounded-lg border border-dashed border-rule bg-paper p-10 text-center text-sm text-ink-soft">
        No reusable grids yet. Create grids in any document and they'll appear
        here.
      </div>
    );
  }
  return (
    <>
      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grids.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => setActive(g)}
              className="block w-full rounded-lg border border-rule bg-paper p-4 text-left transition hover:border-ink"
            >
              <div className="text-sm font-medium">
                {g.cols} × {g.rows} {g.type}
              </div>
              <div className="mt-1 text-xs text-ink-soft">
                from {g.document_name} ({g.width} × {g.height} {g.unit}) ·
                {" "}
                {g.descendant_count} reuse
                {g.descendant_count === 1 ? "" : "s"}
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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-rule bg-paper p-5 shadow-xl">
          <Dialog.Title className="text-sm font-semibold tracking-tight">
            Apply grid {grid ? `(${grid.cols}×${grid.rows} ${grid.type})` : ""}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-ink-soft">
            Choose a target document. The grid lands on its first page; older
            grids on that page are replaced.
          </Dialog.Description>
          <ul className="mt-3 max-h-[50vh] divide-y divide-rule overflow-y-auto rounded border border-rule">
            {docs === null ? (
              <li className="px-3 py-3 text-sm text-ink-soft">Loading…</li>
            ) : docs.length === 0 ? (
              <li className="px-3 py-3 text-sm text-ink-soft">
                No documents yet.
              </li>
            ) : (
              docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="text-sm">{d.name}</div>
                    <div className="text-[10px] text-ink-soft">
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
