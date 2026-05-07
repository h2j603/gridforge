"use client";

import { useEffect, useState } from "react";
import type { Page, Slot, SlotTypography } from "@/lib/types";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PanelSection } from "./PanelSection";

interface Props {
  page: Page | null;
  selectedSlotId: string | null;
  onPatch: (
    pageId: string,
    slotId: string,
    patch: Partial<Slot>,
  ) => void;
}

export function TypographyPanel({ page, selectedSlotId, onPatch }: Props) {
  const slot = page?.slots?.find((s) => s.id === selectedSlotId) ?? null;
  if (!slot || !page) {
    return (
      <PanelSection title="Typography">
        <p className="text-xs text-ink-soft">Select a slot to set type.</p>
      </PanelSection>
    );
  }
  return (
    <PanelSection title="Typography">
      <Controls
        key={slot.id}
        slot={slot}
        onPatch={(patch) => onPatch(page.id, slot.id, patch)}
      />
    </PanelSection>
  );
}

function Controls({
  slot,
  onPatch,
}: {
  slot: Slot;
  onPatch: (patch: Partial<Slot>) => void;
}) {
  const [t, setT] = useState<SlotTypography>(
    slot.typography ?? {
      font_size: 12,
      line_height_baselines: 1.5,
      leading_top_baselines: 1,
    },
  );

  useEffect(() => {
    if (slot.typography) setT(slot.typography);
  }, [slot.id, slot.typography]);

  const apply = () =>
    onPatch({ typography: { ...t, font_size: Math.max(1, t.font_size) } });
  const clear = () => onPatch({ typography: undefined });

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Size (pt)">
          <Input
            type="number"
            step={0.5}
            value={t.font_size}
            onChange={(e) => setT({ ...t, font_size: Number(e.target.value) })}
          />
        </Field>
        <Field label="Line / baselines">
          <Input
            type="number"
            step={0.5}
            value={t.line_height_baselines}
            onChange={(e) =>
              setT({ ...t, line_height_baselines: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Top leading">
          <Input
            type="number"
            step={0.5}
            value={t.leading_top_baselines}
            onChange={(e) =>
              setT({ ...t, leading_top_baselines: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Weight">
          <Input
            type="number"
            min={100}
            max={900}
            step={100}
            value={t.font_weight ?? 400}
            onChange={(e) => setT({ ...t, font_weight: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Family">
        <Input
          type="text"
          value={t.font_family ?? ""}
          placeholder="e.g. Inter"
          onChange={(e) => setT({ ...t, font_family: e.target.value })}
        />
      </Field>
      <Field label="Letter spacing (em)">
        <Input
          type="number"
          step={0.001}
          value={t.letter_spacing ?? 0}
          onChange={(e) =>
            setT({ ...t, letter_spacing: Number(e.target.value) })
          }
        />
      </Field>
      <div className="flex gap-2">
        <Button size="sm" onClick={apply}>
          Apply
        </Button>
        {slot.typography ? (
          <Button size="sm" variant="secondary" onClick={clear}>
            Clear
          </Button>
        ) : null}
      </div>
    </>
  );
}
