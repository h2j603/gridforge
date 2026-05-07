import type { Document } from "@/lib/types";
import { Canvas } from "./Canvas";
import { SpreadStrip } from "./SpreadStrip";
import { Toolbar } from "./Toolbar";
import { PageSetupPanel } from "./panels/PageSetupPanel";
import { MarginsPanel } from "./panels/MarginsPanel";
import { GridPanel } from "./panels/GridPanel";
import { BaselinePanel } from "./panels/BaselinePanel";
import { SlotPanel } from "./panels/SlotPanel";
import { TypographyPanel } from "./panels/TypographyPanel";

export function EditorShell({ document }: { document: Document }) {
  const activeSpread = document.spreads[0];
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex h-12 items-center justify-between border-b border-rule bg-paper px-4">
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm font-semibold tracking-tight">
            GridForge
          </a>
          <span className="text-xs text-ink-soft">/</span>
          <span className="text-sm">{document.name}</span>
        </div>
        <Toolbar />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-rule bg-paper md:block">
          <nav className="flex flex-col p-2 text-sm">
            <SidebarItem label="Pages" />
            <SidebarItem label="Grids" />
            <SidebarItem label="Slots" />
            <SidebarItem label="References" />
          </nav>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Canvas document={document} spread={activeSpread} />
          <SpreadStrip document={document} />
        </main>

        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-rule bg-paper md:block">
          <PageSetupPanel document={document} />
          <MarginsPanel document={document} />
          <GridPanel />
          <BaselinePanel />
          <SlotPanel />
          <TypographyPanel />
        </aside>
      </div>
    </div>
  );
}

function SidebarItem({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded px-2 py-1.5 text-left text-sm text-ink-soft hover:bg-canvas hover:text-ink"
    >
      {label}
    </button>
  );
}
