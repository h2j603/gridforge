"use client";

import { useCallback, useMemo, useState } from "react";
import type { Document, Page, SlotRole } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { useDocument } from "./hooks/useDocument";
import { useSelection } from "./hooks/useSelection";
import { useEditorKeyboard } from "./hooks/useKeyboard";
import { Canvas } from "./Canvas";
import { SpreadStrip } from "./SpreadStrip";
import { Toolbar } from "./Toolbar";
import { PageSetupPanel } from "./panels/PageSetupPanel";
import { MarginsPanel } from "./panels/MarginsPanel";
import { GridPanel } from "./panels/GridPanel";
import { BaselinePanel } from "./panels/BaselinePanel";
import { SlotPanel } from "./panels/SlotPanel";
import { TypographyPanel } from "./panels/TypographyPanel";
import { ViewPanel } from "./panels/ViewPanel";
import { PagesPanel } from "./panels/PagesPanel";
import { ReferencePanel } from "./panels/ReferencePanel";
import { ExportDialog } from "./dialogs/ExportDialog";
import { MobileNav, type MobileTab } from "./MobileNav";

export function EditorShell({ document: initial }: { document: Document }) {
  const {
    document,
    status,
    patchPageMargins,
    setGridSpec,
    setBaselineSpec,
    createSlot,
    patchSlot,
    removeSlot,
    addSpread,
    uploadReference,
    setReferenceOpacity,
    setReferenceVisible,
    removeReference,
    applyGridFromGallery,
  } = useDocument(initial);

  const firstPage = document.spreads[0]?.pages[0]?.id ?? null;
  const { selection, setSpread, setPage, setSlot } = useSelection({
    spreadIndex: 0,
    pageId: firstPage,
    slotId: null,
  });

  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showMargins, setShowMargins] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showSlots, setShowSlots] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [defaultRole, setDefaultRole] = useState<SlotRole>("body");
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab | null>(null);

  const activeSpread = document.spreads[selection.spreadIndex];
  const activePage: Page | null = useMemo(() => {
    if (!activeSpread) return null;
    if (selection.pageId) {
      return (
        activeSpread.pages.find((p) => p.id === selection.pageId) ??
        activeSpread.pages[0] ??
        null
      );
    }
    return activeSpread.pages[0] ?? null;
  }, [activeSpread, selection.pageId]);

  const handleCreateSlot = useCallback(
    (
      pageId: string,
      draft: Parameters<typeof createSlot>[1],
    ) => {
      void createSlot(pageId, draft).then((slot) => {
        setSlot(slot.id);
        setMobileTab("slot");
      }).catch(() => {});
    },
    [createSlot, setSlot],
  );

  const handleDuplicateSelected = useCallback(() => {
    if (!activePage || !selection.slotId) return;
    const slot = activePage.slots?.find((s) => s.id === selection.slotId);
    if (!slot) return;
    const offset = 0.02;
    if (slot.mode === "free") {
      void createSlot(activePage.id, {
        name: `${slot.name} copy`,
        role: slot.role,
        mode: "free",
        x: clamp01((slot.x ?? 0) + offset),
        y: clamp01((slot.y ?? 0) + offset),
        w: slot.w,
        h: slot.h,
        z_index: slot.z_index,
      }).catch(() => {});
    } else {
      void createSlot(activePage.id, {
        name: `${slot.name} copy`,
        role: slot.role,
        mode: "cell",
        col_start: slot.col_start,
        col_end: slot.col_end,
        row_start: slot.row_start,
        row_end: slot.row_end,
        z_index: slot.z_index,
      }).catch(() => {});
    }
  }, [activePage, selection.slotId, createSlot]);

  useEditorKeyboard({
    onDelete: () => {
      if (activePage && selection.slotId) {
        removeSlot(activePage.id, selection.slotId);
        setSlot(null);
      }
    },
    onDuplicate: handleDuplicateSelected,
    onEscape: () => setSlot(null),
    onPrevSpread: () => {
      if (selection.spreadIndex > 0) setSpread(selection.spreadIndex - 1);
    },
    onNextSpread: () => {
      if (selection.spreadIndex < document.spreads.length - 1)
        setSpread(selection.spreadIndex + 1);
    },
    onToggleGrid: () => setShowGrid((v) => !v),
    onToggleBaseline: () => setShowBaseline((v) => !v),
    onToggleRulers: () => setShowRulers((v) => !v),
    onToggleMargins: () => setShowMargins((v) => !v),
  });

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-rule bg-paper px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <a
            href="/"
            className="text-sm font-semibold tracking-tight"
            aria-label="GridForge home"
          >
            GridForge
          </a>
          <span className="hidden text-xs text-ink-soft sm:inline">/</span>
          <span className="truncate text-sm">{document.name}</span>
          <SyncIndicator pending={status.pending} error={status.error} />
        </div>
        {/* Desktop toolbar */}
        <div className="hidden md:block">
          <Toolbar
            showGrid={showGrid}
            showRulers={showRulers}
            showMargins={showMargins}
            showBaseline={showBaseline}
            showSlots={showSlots}
            onToggleGrid={() => setShowGrid((v) => !v)}
            onToggleRulers={() => setShowRulers((v) => !v)}
            onToggleMargins={() => setShowMargins((v) => !v)}
            onToggleBaseline={() => setShowBaseline((v) => !v)}
            onToggleSlots={() => setShowSlots((v) => !v)}
            onExport={() => setExportOpen(true)}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Desktop left sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-rule bg-paper md:flex md:flex-col">
          <div className="border-b border-rule px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
            Pages
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {document.spreads.map((s) =>
              s.pages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSpread(s.index);
                    setPage(p.id);
                  }}
                  className={
                    "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm" +
                    (p.id === activePage?.id
                      ? " bg-canvas font-medium text-ink"
                      : " text-ink-soft hover:bg-canvas hover:text-ink")
                  }
                >
                  <span>Page {p.page_number}</span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {p.side === "single" ? "" : p.side}
                  </span>
                </button>
              )),
            )}
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Canvas
            document={document}
            spread={activeSpread}
            showGrid={showGrid}
            showRulers={showRulers}
            showMargins={showMargins}
            showBaseline={showBaseline}
            showSlots={showSlots}
            selectedSlotId={selection.slotId}
            defaultRole={defaultRole}
            snapToGrid={snapToGrid}
            onSelectSlot={setSlot}
            onCreateSlot={handleCreateSlot}
            onPatchSlot={patchSlot}
            onRemoveSlot={(pageId, slotId) => {
              removeSlot(pageId, slotId);
              setSlot(null);
            }}
          />
          {/* Spread strip is hidden on small screens — Pages sheet covers it */}
          <div className="hidden md:block">
            <SpreadStrip
              document={document}
              activeIndex={selection.spreadIndex}
              onSelect={(i) => setSpread(i)}
              onAdd={() => void addSpread()}
            />
          </div>
        </main>

        {/* Desktop right panel */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-rule bg-paper md:block">
          <PageSetupPanel document={document} />
          <MarginsPanel
            document={document}
            page={activePage}
            onApply={patchPageMargins}
          />
          <GridPanel
            page={activePage}
            onChange={setGridSpec}
            onLoadFromGallery={applyGridFromGallery}
          />
          <BaselinePanel page={activePage} onApply={setBaselineSpec} />
          <ReferencePanel
            page={activePage}
            onUpload={uploadReference}
            onOpacity={setReferenceOpacity}
            onVisible={setReferenceVisible}
            onRemove={removeReference}
          />
          <SlotPanel
            page={activePage}
            selectedSlotId={selection.slotId}
            defaultRole={defaultRole}
            onDefaultRoleChange={setDefaultRole}
            onPatch={patchSlot}
            onRemove={(pageId, slotId) => {
              removeSlot(pageId, slotId);
              setSlot(null);
            }}
          />
          <TypographyPanel
            page={activePage}
            selectedSlotId={selection.slotId}
            onPatch={patchSlot}
          />
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav
        onOpen={(t) => setMobileTab(t)}
        onExport={() => setExportOpen(true)}
      />

      {/* Mobile sheets */}
      <Sheet
        open={mobileTab === "pages"}
        onOpenChange={(o) => setMobileTab(o ? "pages" : null)}
        title="Pages"
      >
        <PagesPanel
          document={document}
          activePageId={activePage?.id ?? null}
          onPick={(idx, pageId) => {
            setSpread(idx);
            setPage(pageId);
            setMobileTab(null);
          }}
          onAddSpread={() => {
            setMobileTab(null);
            void addSpread();
          }}
        />
      </Sheet>
      <Sheet
        open={mobileTab === "grid"}
        onOpenChange={(o) => setMobileTab(o ? "grid" : null)}
        title="Grid"
      >
        <div className="px-1 py-1">
          <GridPanel
            page={activePage}
            onChange={setGridSpec}
            onLoadFromGallery={applyGridFromGallery}
          />
          <BaselinePanel page={activePage} onApply={setBaselineSpec} />
        </div>
      </Sheet>
      <Sheet
        open={mobileTab === "page-setup"}
        onOpenChange={(o) => setMobileTab(o ? "page-setup" : null)}
        title="Document"
      >
        <div className="px-1 py-1">
          <PageSetupPanel document={document} />
          <MarginsPanel
            document={document}
            page={activePage}
            onApply={patchPageMargins}
          />
        </div>
      </Sheet>
      <Sheet
        open={mobileTab === "slot"}
        onOpenChange={(o) => setMobileTab(o ? "slot" : null)}
        title="Slot"
      >
        <div className="px-1 py-1">
          <SlotPanel
            page={activePage}
            selectedSlotId={selection.slotId}
            defaultRole={defaultRole}
            onDefaultRoleChange={setDefaultRole}
            onPatch={patchSlot}
            onRemove={(pageId, slotId) => {
              removeSlot(pageId, slotId);
              setSlot(null);
            }}
          />
          <TypographyPanel
            page={activePage}
            selectedSlotId={selection.slotId}
            onPatch={patchSlot}
          />
        </div>
      </Sheet>
      <Sheet
        open={mobileTab === "reference"}
        onOpenChange={(o) => setMobileTab(o ? "reference" : null)}
        title="Reference"
      >
        <div className="px-1 py-1">
          <ReferencePanel
            page={activePage}
            onUpload={uploadReference}
            onOpacity={setReferenceOpacity}
            onVisible={setReferenceVisible}
            onRemove={removeReference}
          />
        </div>
      </Sheet>
      <Sheet
        open={mobileTab === "view"}
        onOpenChange={(o) => setMobileTab(o ? "view" : null)}
        title="View"
        maxHeight="60vh"
      >
        <ViewPanel
          showGrid={showGrid}
          showRulers={showRulers}
          showMargins={showMargins}
          showBaseline={showBaseline}
          showSlots={showSlots}
          snapToGrid={snapToGrid}
          onToggleGrid={() => setShowGrid((v) => !v)}
          onToggleRulers={() => setShowRulers((v) => !v)}
          onToggleMargins={() => setShowMargins((v) => !v)}
          onToggleBaseline={() => setShowBaseline((v) => !v)}
          onToggleSlots={() => setShowSlots((v) => !v)}
          onToggleSnap={() => setSnapToGrid((v) => !v)}
        />
      </Sheet>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        document={document}
        page={activePage}
      />
    </div>
  );
}

function SyncIndicator({
  pending,
  error,
}: {
  pending: number;
  error: string | null;
}) {
  if (error) {
    return (
      <span
        className="text-[10px] uppercase tracking-wide text-red-700"
        title={error}
      >
        sync error
      </span>
    );
  }
  if (pending > 0) {
    return (
      <span className="text-[10px] uppercase tracking-wide text-ink-soft">
        saving…
      </span>
    );
  }
  return null;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
