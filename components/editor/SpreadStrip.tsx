"use client";

import type { Document } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  document: Document;
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

export function SpreadStrip({ document, activeIndex, onSelect, onAdd }: Props) {
  return (
    <div className="flex h-20 shrink-0 items-center gap-2 border-t border-rule bg-paper px-4 text-xs text-ink-soft">
      {document.spreads.map((spread) => (
        <button
          key={spread.id}
          type="button"
          onClick={() => onSelect(spread.index)}
          className={cn(
            "flex h-12 min-w-16 flex-col items-center justify-center rounded border px-3 transition",
            spread.index === activeIndex
              ? "border-accent bg-accent-soft text-ink"
              : "border-rule bg-canvas-soft text-ink hover:border-rule-strong",
          )}
        >
          <span className="text-[10px] uppercase tracking-wide text-ink-faint">
            Spread
          </span>
          <span className="text-sm font-medium">{spread.index + 1}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        title="Add spread"
        className="flex h-12 w-10 items-center justify-center rounded border border-dashed border-rule text-ink-soft hover:border-accent hover:text-accent"
        aria-label="Add spread"
      >
        +
      </button>
    </div>
  );
}
