"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface Props {
  showGrid: boolean;
  showRulers: boolean;
  showMargins: boolean;
  showBaseline: boolean;
  showSlots: boolean;
  onToggleGrid: () => void;
  onToggleRulers: () => void;
  onToggleMargins: () => void;
  onToggleBaseline: () => void;
  onToggleSlots: () => void;
  onExport: () => void;
}

export function Toolbar(props: Props) {
  return (
    <div className="flex items-center gap-1 text-xs text-ink-soft">
      <Toggle active={props.showGrid} onClick={props.onToggleGrid} label="Grid" />
      <Toggle
        active={props.showBaseline}
        onClick={props.onToggleBaseline}
        label="Baseline"
      />
      <Toggle
        active={props.showMargins}
        onClick={props.onToggleMargins}
        label="Margins"
      />
      <Toggle
        active={props.showRulers}
        onClick={props.onToggleRulers}
        label="Rulers"
      />
      <Toggle
        active={props.showSlots}
        onClick={props.onToggleSlots}
        label="Slots"
      />
      <span className="mx-1 h-4 w-px bg-rule" />
      <Button size="sm" variant="secondary" onClick={props.onExport}>
        Export
      </Button>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded px-2 text-xs",
        active ? "bg-ink text-paper" : "text-ink hover:bg-canvas",
      )}
    >
      {label}
    </button>
  );
}
