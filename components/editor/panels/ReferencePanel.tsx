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
  onTransform: (
    pageId: string,
    refId: string,
    patch: { tx?: number; ty?: number; scale?: number; rotation?: number },
  ) => void;
  onRemove: (pageId: string, refId: string) => void;
}

export function ReferencePanel({
  page,
  onUpload,
  onOpacity,
  onVisible,
  onTransform,
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
        onTransform={onTransform}
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
  onTransform,
  onRemove,
}: {
  page: Page;
  onUpload: Props["onUpload"];
  onOpacity: Props["onOpacity"];
  onVisible: Props["onVisible"];
  onTransform: Props["onTransform"];
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
        Upload a layout photo. It sits behind the page so you can trace its
        grid by adjusting cols / rows / gutter to match.
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
        <ul className="flex flex-col gap-3">
          {refs.map((r) => (
            <RefCard
              key={r.id}
              ref_={r}
              onVisible={(v) => onVisible(page.id, r.id, v)}
              onOpacity={(v) => onOpacity(page.id, r.id, v)}
              onTransform={(p) => onTransform(page.id, r.id, p)}
              onRemove={() => onRemove(page.id, r.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-ink-faint">No reference uploaded.</p>
      )}
    </>
  );
}

function RefCard({
  ref_,
  onVisible,
  onOpacity,
  onTransform,
  onRemove,
}: {
  ref_: Reference;
  onVisible: (v: boolean) => void;
  onOpacity: (v: number) => void;
  onTransform: (patch: {
    tx?: number;
    ty?: number;
    scale?: number;
    rotation?: number;
  }) => void;
  onRemove: () => void;
}) {
  const reset = () =>
    onTransform({ tx: 0, ty: 0, scale: 1, rotation: 0 });

  return (
    <li className="rounded-lg border border-rule bg-paper p-2.5">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ref_.image_url}
          alt=""
          className="h-14 w-20 shrink-0 rounded border border-rule object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label className="flex items-center gap-2 text-[11px] text-ink-soft">
            <input
              type="checkbox"
              checked={ref_.visible}
              onChange={(e) => onVisible(e.target.checked)}
            />
            <span>Visible</span>
          </label>
          <SliderRow
            label="Opacity"
            value={ref_.opacity}
            min={0}
            max={1}
            step={0.01}
            display={(v) => `${Math.round(v * 100)}%`}
            onChange={onOpacity}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove reference"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-rule text-ink-soft transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        >
          ×
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-1 border-t border-rule pt-2">
        <SliderRow
          label="Scale"
          value={ref_.scale ?? 1}
          min={0.1}
          max={5}
          step={0.01}
          display={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onTransform({ scale: v })}
        />
        <SliderRow
          label="Rotate"
          value={ref_.rotation ?? 0}
          min={-180}
          max={180}
          step={1}
          display={(v) => `${Math.round(v)}°`}
          onChange={(v) => onTransform({ rotation: v })}
        />
        <SliderRow
          label="Move X"
          value={ref_.tx ?? 0}
          min={-1}
          max={1}
          step={0.005}
          display={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onTransform({ tx: v })}
        />
        <SliderRow
          label="Move Y"
          value={ref_.ty ?? 0}
          min={-1}
          max={1}
          step={0.005}
          display={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onTransform({ ty: v })}
        />
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={reset}
          className="text-[11px] text-ink-soft underline-offset-2 hover:text-[var(--color-accent-strong)] hover:underline"
        >
          Reset transform
        </button>
      </div>
    </li>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-ink-soft">
      <span className="w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--color-accent)]"
      />
      <span className="w-12 text-right tabular-nums">{display(value)}</span>
    </label>
  );
}
