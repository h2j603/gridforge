"use client";

import type { Document } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  document: Document;
  activePageId: string | null;
  onPick: (spreadIndex: number, pageId: string) => void;
  onAddSpread: () => void;
}

export function PagesPanel({
  document,
  activePageId,
  onPick,
  onAddSpread,
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={onAddSpread}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-dashed border-rule bg-paper-soft px-3 text-sm text-ink hover:border-accent hover:text-accent"
        >
          + Add spread
        </button>
      </div>
      <ul className="divide-y divide-rule border-t border-rule">
        {document.spreads.map((s) =>
          s.pages.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(s.index, p.id)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition",
                  p.id === activePageId
                    ? "bg-accent-soft text-ink"
                    : "text-ink hover:bg-paper-soft",
                )}
              >
                <span className="flex items-center gap-3">
                  <PageThumb facing={document.facing_pages} side={p.side} />
                  <span>
                    Page {p.page_number}
                    {document.facing_pages ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-soft">
                        {p.side}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-wide text-ink-faint">
                  Spread {s.index + 1}
                </span>
              </button>
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

function PageThumb({
  facing,
  side,
}: {
  facing: boolean;
  side: "left" | "right" | "single";
}) {
  if (!facing) {
    return (
      <span className="block h-7 w-5 rounded-sm border border-rule bg-canvas-soft" />
    );
  }
  return (
    <span className="flex h-7 items-center gap-px">
      <span
        className={cn(
          "block h-7 w-3 rounded-l-sm border border-rule",
          side === "left" ? "bg-paper-soft" : "bg-canvas-soft",
        )}
      />
      <span
        className={cn(
          "block h-7 w-3 rounded-r-sm border border-rule",
          side === "right" ? "bg-paper-soft" : "bg-canvas-soft",
        )}
      />
    </span>
  );
}
