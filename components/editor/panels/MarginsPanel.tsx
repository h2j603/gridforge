"use client";

import { useEffect, useState } from "react";
import type { Document, Margins, Page } from "@/lib/types";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PanelSection } from "./PanelSection";

interface Props {
  document: Document;
  page: Page | null;
  onApply: (pageId: string, margins: Margins) => void;
}

export function MarginsPanel({ document, page, onApply }: Props) {
  if (!page) {
    return (
      <PanelSection title="Margins">
        <p className="text-xs text-ink-soft">Select a page first.</p>
      </PanelSection>
    );
  }
  return (
    <PanelSection title="Margins">
      <MarginsControls
        key={page.id}
        document={document}
        page={page}
        onApply={onApply}
      />
    </PanelSection>
  );
}

function MarginsControls({
  document,
  page,
  onApply,
}: {
  document: Document;
  page: Page;
  onApply: Props["onApply"];
}) {
  const [m, setM] = useState<Margins>(page.margins);
  useEffect(() => {
    setM(page.margins);
  }, [page.margins]);

  const apply = () => onApply(page.id, sanitize(m));

  const insideLabel = document.facing_pages ? "Inside" : "Left";
  const outsideLabel = document.facing_pages ? "Outside" : "Right";

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Top">
          <Input
            type="number"
            step="any"
            value={m.top}
            onChange={(e) => setM({ ...m, top: Number(e.target.value) })}
          />
        </Field>
        <Field label="Bottom">
          <Input
            type="number"
            step="any"
            value={m.bottom}
            onChange={(e) => setM({ ...m, bottom: Number(e.target.value) })}
          />
        </Field>
        <Field label={insideLabel}>
          <Input
            type="number"
            step="any"
            value={m.inside}
            onChange={(e) => setM({ ...m, inside: Number(e.target.value) })}
          />
        </Field>
        <Field label={outsideLabel}>
          <Input
            type="number"
            step="any"
            value={m.outside}
            onChange={(e) => setM({ ...m, outside: Number(e.target.value) })}
          />
        </Field>
      </div>
      <p className="text-[10px] text-ink-soft">Values in {document.unit}.</p>
      <Button onClick={apply} variant="primary" size="sm">
        Apply margins
      </Button>
    </>
  );
}

function sanitize(m: Margins): Margins {
  const safe = (n: number) => (Number.isFinite(n) && n >= 0 ? n : 0);
  return {
    top: safe(m.top),
    bottom: safe(m.bottom),
    inside: safe(m.inside),
    outside: safe(m.outside),
  };
}
