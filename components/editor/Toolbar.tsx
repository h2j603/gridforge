"use client";

import { Button } from "@/components/ui/Button";

export function Toolbar() {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-soft">
      <span>v0.1</span>
      <span aria-hidden>·</span>
      <Button size="sm" variant="ghost" disabled>
        Grid
      </Button>
      <Button size="sm" variant="ghost" disabled>
        Baseline
      </Button>
      <Button size="sm" variant="ghost" disabled>
        Rulers
      </Button>
      <Button size="sm" variant="secondary" disabled>
        Export
      </Button>
    </div>
  );
}
