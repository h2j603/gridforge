"use client";

import { cn } from "@/lib/cn";

export type MobileTab =
  | "pages"
  | "page-setup"
  | "margins"
  | "grid"
  | "baseline"
  | "slot"
  | "type"
  | "view"
  | "reference";

interface Props {
  onOpen: (tab: MobileTab) => void;
  onExport: () => void;
}

export function MobileNav({ onOpen, onExport }: Props) {
  return (
    <nav className="flex h-14 shrink-0 items-stretch border-t border-rule bg-mint-soft text-[10px] font-medium uppercase tracking-wide text-ink-soft md:hidden">
      <Tab label="Pages" onClick={() => onOpen("pages")} icon={<IconPages />} />
      <Tab label="Grid" onClick={() => onOpen("grid")} icon={<IconGrid />} />
      <Tab label="Slots" onClick={() => onOpen("slot")} icon={<IconSlot />} />
      <Tab
        label="Ref"
        onClick={() => onOpen("reference")}
        icon={<IconImage />}
      />
      <Tab label="View" onClick={() => onOpen("view")} icon={<IconEye />} />
      <Tab label="Export" onClick={onExport} icon={<IconExport />} primary />
    </nav>
  );
}

function Tab({
  label,
  onClick,
  icon,
  primary,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 transition",
        "active:bg-paper-hover",
        primary
          ? "text-[var(--color-accent-strong)]"
          : "hover:text-ink",
      )}
    >
      <span className="grid h-5 w-5 place-items-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function IconPages() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="3" width="7" height="10" rx="0.5" stroke="currentColor" />
      <rect x="6.5" y="1" width="7" height="10" rx="0.5" stroke="currentColor" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="2.5" width="11" height="11" stroke="currentColor" />
      <line x1="2.5" y1="6" x2="13.5" y2="6" stroke="currentColor" />
      <line x1="2.5" y1="10" x2="13.5" y2="10" stroke="currentColor" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" />
      <line x1="10" y1="2.5" x2="10" y2="13.5" stroke="currentColor" />
    </svg>
  );
}
function IconSlot() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="3.5" width="11" height="9" rx="0.5" stroke="currentColor" strokeDasharray="2 1.5" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" stroke="currentColor" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" />
    </svg>
  );
}
function IconImage() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="0.5" stroke="currentColor" />
      <circle cx="6" cy="6.5" r="1.1" fill="currentColor" />
      <path
        d="M14 11.5l-3.5-3-3 2.5L5 9 2 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconMore() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="3.5" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="12.5" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
function IconExport() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v9M5 4l3-3 3 3" stroke="currentColor" strokeLinecap="round" />
      <path d="M2 11v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
