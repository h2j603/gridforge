"use client";

import { useEffect, useState } from "react";
import type { Page, Slot, SlotRole } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { PanelSection } from "./PanelSection";

const ROLES: SlotRole[] = [
  "heading-1",
  "heading-2",
  "heading-3",
  "body",
  "caption",
  "quote",
  "image",
  "graphic",
  "decoration",
  "spacer",
  "custom",
];

interface Props {
  page: Page | null;
  selectedSlotId: string | null;
  defaultRole: SlotRole;
  onDefaultRoleChange: (role: SlotRole) => void;
  onPatch: (
    pageId: string,
    slotId: string,
    patch: Partial<Slot>,
  ) => void;
  onRemove: (pageId: string, slotId: string) => void;
}

export function SlotPanel({
  page,
  selectedSlotId,
  defaultRole,
  onDefaultRoleChange,
  onPatch,
  onRemove,
}: Props) {
  const slot = page?.slots?.find((s) => s.id === selectedSlotId) ?? null;

  return (
    <PanelSection title="Slot">
      <Field label="New slot role" htmlFor="slot-default-role">
        <Select
          id="slot-default-role"
          value={defaultRole}
          onChange={(e) => onDefaultRoleChange(e.target.value as SlotRole)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      <p className="text-[10px] leading-snug text-ink-soft">
        Click-drag inside a page to create. Hold Alt to draw without snapping
        to grid cells.
      </p>

      {slot && page ? (
        <SelectedSlot
          key={slot.id}
          page={page}
          slot={slot}
          onPatch={onPatch}
          onRemove={onRemove}
        />
      ) : (
        <p className="text-xs text-ink-soft">No slot selected.</p>
      )}
    </PanelSection>
  );
}

function SelectedSlot({
  page,
  slot,
  onPatch,
  onRemove,
}: {
  page: Page;
  slot: Slot;
  onPatch: Props["onPatch"];
  onRemove: Props["onRemove"];
}) {
  const [name, setName] = useState(slot.name);
  const [role, setRole] = useState<SlotRole>(slot.role);
  const [zIndex, setZIndex] = useState(slot.z_index);

  useEffect(() => {
    setName(slot.name);
    setRole(slot.role);
    setZIndex(slot.z_index);
  }, [slot.id, slot.name, slot.role, slot.z_index]);

  return (
    <div className="flex flex-col gap-3 border-t border-rule pt-3">
      <Field label="Name" htmlFor={`slot-name-${slot.id}`}>
        <Input
          id={`slot-name-${slot.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name !== slot.name) onPatch(page.id, slot.id, { name });
          }}
        />
      </Field>
      <Field label="Role" htmlFor={`slot-role-${slot.id}`}>
        <Select
          id={`slot-role-${slot.id}`}
          value={role}
          onChange={(e) => {
            const next = e.target.value as SlotRole;
            setRole(next);
            onPatch(page.id, slot.id, { role: next });
          }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Z-index" htmlFor={`slot-z-${slot.id}`}>
        <Input
          id={`slot-z-${slot.id}`}
          type="number"
          value={zIndex}
          onChange={(e) => setZIndex(Number(e.target.value))}
          onBlur={() => {
            if (zIndex !== slot.z_index)
              onPatch(page.id, slot.id, { z_index: zIndex });
          }}
        />
      </Field>

      <SlotGeometry slot={slot} />

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onRemove(page.id, slot.id)}
      >
        Delete slot
      </Button>
    </div>
  );
}

function SlotGeometry({ slot }: { slot: Slot }) {
  if (slot.mode === "cell") {
    return (
      <div className="rounded border border-rule bg-canvas px-2 py-1.5 text-[11px] text-ink-soft">
        <div>
          <strong className="text-ink">cell</strong>{" "}
          col {slot.col_start}–{slot.col_end} · row {slot.row_start}–
          {slot.row_end}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded border border-rule bg-canvas px-2 py-1.5 text-[11px] text-ink-soft">
      <strong className="text-ink">free</strong>{" "}
      x {fmt(slot.x)} y {fmt(slot.y)} · w {fmt(slot.w)} h {fmt(slot.h)}
    </div>
  );
}

function fmt(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "–";
  return v.toFixed(3);
}
