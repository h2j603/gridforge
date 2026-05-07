"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Side from which the sheet slides. Defaults to "bottom". */
  side?: "bottom" | "right" | "left";
  children: React.ReactNode;
  /** Maximum height for bottom sheets. */
  maxHeight?: string;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  side = "bottom",
  children,
  maxHeight = "80vh",
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex flex-col border-rule bg-paper shadow-2xl outline-none",
            side === "bottom" &&
              "inset-x-0 bottom-0 rounded-t-2xl border-t",
            side === "right" &&
              "inset-y-0 right-0 w-[min(92vw,360px)] border-l",
            side === "left" &&
              "inset-y-0 left-0 w-[min(92vw,300px)] border-r",
          )}
          style={
            side === "bottom"
              ? { maxHeight }
              : undefined
          }
        >
          {side === "bottom" ? (
            <div className="flex shrink-0 justify-center pt-2">
              <span aria-hidden className="h-1 w-10 rounded-full bg-rule" />
            </div>
          ) : null}
          {title ? (
            <header className="flex shrink-0 items-center justify-between border-b border-rule px-4 py-2.5">
              <Dialog.Title className="text-sm font-semibold tracking-tight">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="-mr-2 rounded px-2 py-1 text-sm text-ink-soft hover:bg-canvas hover:text-ink"
                  aria-label="Close"
                >
                  Done
                </button>
              </Dialog.Close>
            </header>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
