"use client";

import { useEffect, useState } from "react";
import type { Baseline, Page } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PanelSection } from "./PanelSection";

interface Props {
  page: Page | null;
  onApply: (
    pageId: string,
    spec: {
      start: number;
      increment: number;
      division: number;
      color: "dark" | "light";
    } | null,
  ) => void;
}

export function BaselinePanel({ page, onApply }: Props) {
  if (!page) {
    return (
      <PanelSection title="Baseline">
        <p className="text-xs text-ink-soft">Select a page first.</p>
      </PanelSection>
    );
  }
  return (
    <PanelSection title="Baseline">
      <BaselineControls key={page.id} page={page} onApply={onApply} />
    </PanelSection>
  );
}

function BaselineControls({
  page,
  onApply,
}: {
  page: Page;
  onApply: Props["onApply"];
}) {
  const b = page.baseline;
  const [start, setStart] = useState<number>(b?.start ?? 0);
  const [increment, setIncrement] = useState<number>(b?.increment ?? 12);
  const [division, setDivision] = useState<number>(b?.division ?? 4);
  const [color, setColor] = useState<Baseline["color"]>(b?.color ?? "light");

  useEffect(() => {
    if (!b) return;
    setStart(b.start);
    setIncrement(b.increment);
    setDivision(b.division);
    setColor(b.color);
  }, [b]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Start" hint="page units">
          <Input
            type="number"
            step="any"
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
          />
        </Field>
        <Field label="Increment" hint="pt">
          <Input
            type="number"
            step="any"
            min={0.5}
            value={increment}
            onChange={(e) => setIncrement(Number(e.target.value))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Division">
          <Input
            type="number"
            min={1}
            value={division}
            onChange={(e) =>
              setDivision(Math.max(1, Math.round(Number(e.target.value))))
            }
          />
        </Field>
        <Field label="Color">
          <Select
            value={color}
            onChange={(e) => setColor(e.target.value as Baseline["color"])}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </Field>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            onApply(page.id, { start, increment, division, color })
          }
        >
          {b ? "Update" : "Create"}
        </Button>
        {b ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onApply(page.id, null)}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </>
  );
}
