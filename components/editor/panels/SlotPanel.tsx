import { PanelSection } from "./PanelSection";

export function SlotPanel() {
  return (
    <PanelSection title="Slot">
      <p className="text-xs text-ink-soft">
        Select a slot to edit. Slots arrive in v0.3.
      </p>
    </PanelSection>
  );
}
