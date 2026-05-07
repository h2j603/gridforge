"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface Props {
  showGrid: boolean;
  showRulers: boolean;
  showMargins: boolean;
  onToggleGrid: () => void;
  onToggleRulers: () => void;
  onToggleMargins: () => void;
}

export function Toolbar({
  showGrid,
  showRulers,
  showMargins,
  onToggleGrid,
  onToggleRulers,
  onToggleMargins,
}: Props) {
  return (
    <div className="flex items-center gap-1 text-xs text-ink-soft">
      <Toggle active={showGrid} onClick={onToggleGrid} label="Grid" />
      <Toggle active={showMargins} onClick={onToggleMargins} label="Margins" />
      <Toggle active={showRulers} onClick={onToggleRulers} label="Rulers" />
      <span className="mx-1 h-4 w-px bg-rule" />
      <Button size="sm" variant="secondary" disabled>
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
