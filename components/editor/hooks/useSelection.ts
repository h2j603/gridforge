"use client";

import { useCallback, useState } from "react";

export interface Selection {
  spreadIndex: number;
  pageId: string | null;
  slotId: string | null;
}

export function useSelection(initial: Selection): {
  selection: Selection;
  setSpread: (i: number) => void;
  setPage: (pageId: string | null) => void;
  setSlot: (slotId: string | null) => void;
  clearSlot: () => void;
} {
  const [selection, setSelection] = useState<Selection>(initial);
  return {
    selection,
    setSpread: useCallback(
      (i: number) =>
        setSelection((s) => ({ ...s, spreadIndex: i, slotId: null })),
      [],
    ),
    setPage: useCallback(
      (pageId: string | null) =>
        setSelection((s) => ({ ...s, pageId, slotId: null })),
      [],
    ),
    setSlot: useCallback(
      (slotId: string | null) => setSelection((s) => ({ ...s, slotId })),
      [],
    ),
    clearSlot: useCallback(() => setSelection((s) => ({ ...s, slotId: null })), []),
  };
}
