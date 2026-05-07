"use client";

import { useEffect } from "react";

export interface KeyboardHandlers {
  onDelete?: () => void;
  onDuplicate?: () => void;
  onEscape?: () => void;
  onPrevSpread?: () => void;
  onNextSpread?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleGrid?: () => void;
  onToggleBaseline?: () => void;
  onToggleRulers?: () => void;
  onToggleMargins?: () => void;
}

export function useEditorKeyboard(h: KeyboardHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        h.onRedo?.();
        return;
      }
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        h.onUndo?.();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        h.onDuplicate?.();
        return;
      }
      if (e.key === "Escape") {
        h.onEscape?.();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        h.onDelete?.();
        return;
      }
      if (e.key === "ArrowLeft") {
        h.onPrevSpread?.();
        return;
      }
      if (e.key === "ArrowRight") {
        h.onNextSpread?.();
        return;
      }
      if (!meta) {
        switch (e.key.toLowerCase()) {
          case "g":
            h.onToggleGrid?.();
            break;
          case "b":
            h.onToggleBaseline?.();
            break;
          case "r":
            h.onToggleRulers?.();
            break;
          case "m":
            h.onToggleMargins?.();
            break;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [h]);
}
