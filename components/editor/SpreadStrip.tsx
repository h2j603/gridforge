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
    <div className="flex h-20 shrink-0 items-center gap-2 border-t border-rule bg-mint-soft px-4 text-xs text-ink-soft">
      {document.spreads.map((spread) => (
        <button
          key={spread.id}
          type="button"
          onClick={() => onSelect(spread.index)}
          className={cn(
            "flex h-12 min-w-16 flex-col items-center justify-center rounded-lg border px-3 transition",
            spread.index === activeIndex
              ? "border-[var(--color-accent)] bg-accent-soft text-[var(--color-accent-strong)]"
              : "border-rule bg-paper text-ink hover:border-rule-strong",
          )}
        >
          <span
            className={cn(
              "text-[10px] uppercase tracking-wide",
              spread.index === activeIndex ? "text-[var(--color-accent-strong)]/70" : "text-ink-faint",
            )}
          >
            Spread
          </span>
          <span className="text-sm font-medium">{spread.index + 1}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        title="Add spread"
        className="flex h-12 w-10 items-center justify-center rounded-lg border border-dashed border-rule text-ink-soft hover:border-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
        aria-label="Add spread"
      >
        +
      </button>
    </div>
  );
}
