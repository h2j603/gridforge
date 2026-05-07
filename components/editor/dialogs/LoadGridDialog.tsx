"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  listGridGallery,
  type GridGalleryEntry,
} from "@/lib/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (sourceGridId: string) => Promise<void> | void;
}

export function LoadGridDialog({ open, onOpenChange, onPick }: Props) {
  const [grids, setGrids] = useState<GridGalleryEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || grids) return;
    (async () => {
      try {
        const supabase = createClient();
        const list = await listGridGallery(supabase, 60);
        setGrids(list);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [open, grids]);

  const apply = async (sourceGridId: string) => {
    setBusy(true);
    setErr(null);
    try {
      await onPick(sourceGridId);
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-paper p-5 shadow-2xl">
          <Dialog.Title className="text-base font-semibold tracking-tight">
            Load grid from gallery
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-ink-soft">
            Pick a saved grid to apply to the current page. The original is
            tracked as the source so lineage is preserved.
          </Dialog.Description>
          <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-lg border border-rule">
            {grids === null ? (
              <p className="px-3 py-3 text-sm text-ink-soft">Loading…</p>
            ) : grids.length === 0 ? (
              <p className="px-3 py-3 text-sm text-ink-soft">
                No reusable grids yet. Create a grid in any document and it
                appears here.
              </p>
            ) : (
              <ul className="grid grid-cols-1 divide-y divide-rule">
                {grids.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <MiniGrid cols={g.cols} rows={g.rows} />
                      <div className="min-w-0">
                        <div className="text-sm">
                          {g.cols} × {g.rows}{" "}
                          <span className="text-ink-soft">{g.type}</span>
                        </div>
                        <div className="truncate text-[11px] text-ink-soft">
                          from {g.document_name}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => apply(g.id)}
                    >
                      Apply
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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

function MiniGrid({ cols, rows }: { cols: number; rows: number }) {
  return (
    <svg width="48" height="36" viewBox="0 0 48 36" role="presentation">
      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="35"
        fill="white"
        stroke="#c8c7c0"
        strokeWidth="0.5"
      />
      {Array.from({ length: cols + 1 }, (_, i) => i).map((i) => (
        <line
          key={`v-${i}`}
          x1={(i / cols) * 48}
          x2={(i / cols) * 48}
          y1={0}
          y2={36}
          stroke="rgba(17,17,17,0.45)"
          strokeWidth="0.4"
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => i).map((i) => (
        <line
          key={`h-${i}`}
          x1={0}
          x2={48}
          y1={(i / rows) * 36}
          y2={(i / rows) * 36}
          stroke="rgba(17,17,17,0.45)"
          strokeWidth="0.4"
        />
      ))}
    </svg>
  );
}
