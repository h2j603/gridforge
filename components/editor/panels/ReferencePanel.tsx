"use client";

import { useRef, useState } from "react";
import type { Page, Reference } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { PanelSection } from "./PanelSection";

interface Props {
  page: Page | null;
  onUpload: (pageId: string, file: File) => Promise<Reference | void>;
  onOpacity: (pageId: string, refId: string, opacity: number) => void;
  onVisible: (pageId: string, refId: string, visible: boolean) => void;
  onRemove: (pageId: string, refId: string) => void;
}

export function ReferencePanel({
  page,
  onUpload,
  onOpacity,
  onVisible,
  onRemove,
}: Props) {
  if (!page) {
    return (
      <PanelSection title="Reference">
        <p className="text-xs text-ink-soft">Select a page first.</p>
      </PanelSection>
    );
  }
  return (
    <PanelSection title="Reference">
      <ReferenceControls
        page={page}
        onUpload={onUpload}
        onOpacity={onOpacity}
        onVisible={onVisible}
        onRemove={onRemove}
      />
    </PanelSection>
  );
}

function ReferenceControls({
  page,
  onUpload,
  onOpacity,
  onVisible,
  onRemove,
}: {
  page: Page;
  onUpload: Props["onUpload"];
  onOpacity: Props["onOpacity"];
  onVisible: Props["onVisible"];
  onRemove: Props["onRemove"];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refs = page.references ?? [];

  const onPick = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      await onUpload(page.id, file);
      e.target.value = "";
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="text-[11px] leading-snug text-ink-soft">
        Upload a layout photo or scan. It sits behind the page so you can
        trace its grid by adjusting cols / rows / gutter to match what you
        see.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <Button onClick={onPick} disabled={busy} size="sm">
        {busy ? "Uploading…" : "Upload reference"}
      </Button>

      {err ? (
        <p className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] leading-snug text-red-700">
          {err}{" "}
          <span className="block text-ink-soft">
            Make sure the public <code>references</code> bucket exists in
            Supabase Storage.
          </span>
        </p>
      ) : null}

      {refs.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {refs.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-md border border-rule bg-paper-soft p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.image_url}
                alt=""
                className="h-12 w-16 rounded border border-rule object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label className="flex items-center gap-2 text-[11px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={r.visible}
                    onChange={(e) =>
                      onVisible(page.id, r.id, e.target.checked)
                    }
                  />
                  <span>Visible</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] text-ink-soft">
                  <span className="w-12 shrink-0">Opacity</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={r.opacity}
                    onChange={(e) =>
                      onOpacity(page.id, r.id, Number(e.target.value))
                    }
                    className="flex-1 accent-[var(--color-accent-strong)]"
                  />
                  <span className="w-8 text-right tabular-nums">
                    {Math.round(r.opacity * 100)}%
                  </span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => onRemove(page.id, r.id)}
                aria-label="Remove reference"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-rule text-ink-soft transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-ink-faint">No reference uploaded.</p>
      )}
    </>
  );
}
