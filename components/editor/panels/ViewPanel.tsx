"use client";

import { cn } from "@/lib/cn";

interface Toggle {
  label: string;
  active: boolean;
  onToggle: () => void;
}

interface Props {
  showGrid: boolean;
  showRulers: boolean;
  showMargins: boolean;
  showBaseline: boolean;
  showSlots: boolean;
  snapToGrid: boolean;
  onToggleGrid: () => void;
  onToggleRulers: () => void;
  onToggleMargins: () => void;
  onToggleBaseline: () => void;
  onToggleSlots: () => void;
  onToggleSnap: () => void;
}

export function ViewPanel(p: Props) {
  const groups: Array<{ title: string; toggles: Toggle[] }> = [
    {
      title: "Overlays",
      toggles: [
        { label: "Grid", active: p.showGrid, onToggle: p.onToggleGrid },
        { label: "Baseline", active: p.showBaseline, onToggle: p.onToggleBaseline },
        { label: "Margins", active: p.showMargins, onToggle: p.onToggleMargins },
        { label: "Rulers", active: p.showRulers, onToggle: p.onToggleRulers },
        { label: "Slots", active: p.showSlots, onToggle: p.onToggleSlots },
      ],
    },
    {
      title: "Authoring",
      toggles: [
        { label: "Snap to grid", active: p.snapToGrid, onToggle: p.onToggleSnap },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {groups.map((g) => (
        <section key={g.title}>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
            {g.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            {g.toggles.map((t) => (
              <button
                key={t.label}
                onClick={t.onToggle}
                type="button"
                className={cn(
                  "h-9 rounded-full px-3.5 text-sm font-medium transition",
                  t.active
                    ? "bg-ink text-paper"
                    : "border border-rule bg-paper text-ink hover:border-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>
      ))}
      <p className="text-[11px] leading-snug text-ink-soft">
        Snap on: drawing into a page snaps slots to the grid cells. Off:
        every drag draws / moves freely. (Desktop: hold Alt for the
        opposite of the current snap setting.)
      </p>
    </div>
  );
}
