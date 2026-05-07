import type { Document } from "@/lib/types";
import { PanelSection } from "./PanelSection";

export function PageSetupPanel({ document }: { document: Document }) {
  return (
    <PanelSection title="Page Setup">
      <Row label="Size">
        {document.width} × {document.height} {document.unit}
      </Row>
      <Row label="Orientation">{document.orientation}</Row>
      <Row label="Facing">{document.facing_pages ? "Yes" : "No"}</Row>
      <Row label="DPI">{document.dpi}</Row>
    </PanelSection>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
