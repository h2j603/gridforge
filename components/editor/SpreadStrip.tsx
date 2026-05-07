import type { Document } from "@/lib/types";

export function SpreadStrip({ document }: { document: Document }) {
  return (
    <div className="flex h-20 shrink-0 items-center gap-2 border-t border-rule bg-paper px-4 text-xs text-ink-soft">
      {document.spreads.map((spread) => (
        <button
          key={spread.id}
          type="button"
          className="flex h-12 min-w-16 flex-col items-center justify-center rounded border border-rule bg-canvas px-3 text-ink hover:border-ink"
        >
          <span className="text-[10px] uppercase tracking-wide text-ink-soft">
            Spread
          </span>
          <span className="text-sm font-medium">{spread.index + 1}</span>
        </button>
      ))}
      <button
        type="button"
        disabled
        className="flex h-12 w-10 items-center justify-center rounded border border-dashed border-rule text-ink-soft"
        aria-label="Add spread"
      >
        +
      </button>
    </div>
  );
}
