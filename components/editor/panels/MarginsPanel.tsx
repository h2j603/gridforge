import type { Document } from "@/lib/types";
import { PanelSection } from "./PanelSection";

export function MarginsPanel({ document }: { document: Document }) {
  const m = document.spreads[0]?.pages[0]?.margins;
  if (!m) return null;
  return (
    <PanelSection title="Margins">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Cell label="Top" value={m.top} unit={document.unit} />
        <Cell label="Bottom" value={m.bottom} unit={document.unit} />
        <Cell
          label={document.facing_pages ? "Inside" : "Left"}
          value={m.inside}
          unit={document.unit}
        />
        <Cell
          label={document.facing_pages ? "Outside" : "Right"}
          value={m.outside}
          unit={document.unit}
        />
      </div>
    </PanelSection>
  );
}

function Cell({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded border border-rule px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-soft">
        {label}
      </div>
      <div className="text-sm font-medium">
        {value} {unit}
      </div>
    </div>
  );
}
