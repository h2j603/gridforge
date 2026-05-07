"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Document, Page } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import {
  DEFAULT_SVG_OPTIONS,
  exportPageSVG,
  type SVGExportOptions,
} from "@/lib/exporters/svg";
import {
  DEFAULT_PNG_OPTIONS,
  exportPagePNG,
  type PNGExportOptions,
} from "@/lib/exporters/png";
import {
  DEFAULT_CSS_OPTIONS,
  exportPageCSS,
  type CSSExportOptions,
} from "@/lib/exporters/css";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  document: Document;
  page: Page | null;
}

type Tab = "svg" | "png" | "css";

export function ExportDialog({ open, onOpenChange, document, page }: Props) {
  const [tab, setTab] = useState<Tab>("svg");
  const [svgOpts, setSvgOpts] = useState<SVGExportOptions>(DEFAULT_SVG_OPTIONS);
  const [pngOpts, setPngOpts] = useState<PNGExportOptions>(DEFAULT_PNG_OPTIONS);
  const [cssOpts, setCssOpts] = useState<CSSExportOptions>(DEFAULT_CSS_OPTIONS);
  const [pngBusy, setPngBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const previewSvg = useMemo(
    () => (page ? exportPageSVG(page, document, svgOpts) : ""),
    [page, document, svgOpts],
  );
  const cssOutput = useMemo(
    () => (page ? exportPageCSS(page, document, cssOpts) : null),
    [page, document, cssOpts],
  );

  const downloadSvg = () => {
    if (!page) return;
    const svg = exportPageSVG(page, document, svgOpts);
    download(`${slugify(document.name)}-page-${page.page_number}.svg`, svg, "image/svg+xml");
  };

  const downloadPng = async () => {
    if (!page) return;
    setError(null);
    setPngBusy(true);
    try {
      const blob = await exportPagePNG(page, document, pngOpts);
      const url = URL.createObjectURL(blob);
      triggerDownload(`${slugify(document.name)}-page-${page.page_number}.png`, url);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPngBusy(false);
    }
  };

  const downloadCss = () => {
    if (!cssOutput) return;
    download(`${slugify(document.name)}.css`, cssOutput.css, "text/css");
  };

  const downloadHtml = () => {
    if (!cssOutput) return;
    download(`${slugify(document.name)}.html`, cssOutput.html, "text/html");
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[min(96vw,960px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-rule bg-paper shadow-xl">
          <header className="flex items-center justify-between border-b border-rule px-5 py-3">
            <Dialog.Title className="text-sm font-semibold tracking-tight">
              Export — {document.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-sm text-ink-soft hover:text-ink">
                Close
              </button>
            </Dialog.Close>
          </header>

          <div className="flex border-b border-rule px-5 text-xs">
            {(["svg", "png", "css"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "px-4 py-3 uppercase tracking-wide " +
                  (tab === t
                    ? "border-b-2 border-ink text-ink"
                    : "text-ink-soft hover:text-ink")
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] gap-0 overflow-hidden">
            <aside className="overflow-y-auto border-r border-rule px-4 py-4">
              {tab === "svg" ? (
                <SvgOpts opts={svgOpts} setOpts={setSvgOpts} />
              ) : null}
              {tab === "png" ? (
                <PngOpts opts={pngOpts} setOpts={setPngOpts} />
              ) : null}
              {tab === "css" ? (
                <CssOpts opts={cssOpts} setOpts={setCssOpts} />
              ) : null}
            </aside>

            <main className="overflow-auto p-4">
              {!page ? (
                <p className="text-sm text-ink-soft">No page to export.</p>
              ) : tab === "svg" ? (
                <SvgPreview svg={previewSvg} />
              ) : tab === "png" ? (
                <PngPreview document={document} page={page} opts={pngOpts} />
              ) : (
                <CssPreview output={cssOutput} />
              )}
              {error ? (
                <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              ) : null}
            </main>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-rule px-5 py-3">
            {tab === "svg" ? (
              <Button onClick={downloadSvg} disabled={!page}>
                Download .svg
              </Button>
            ) : null}
            {tab === "png" ? (
              <Button onClick={downloadPng} disabled={!page || pngBusy}>
                {pngBusy ? "Rendering…" : "Download .png"}
              </Button>
            ) : null}
            {tab === "css" ? (
              <>
                <Button
                  variant="secondary"
                  onClick={downloadHtml}
                  disabled={!cssOutput}
                >
                  Download .html
                </Button>
                <Button onClick={downloadCss} disabled={!cssOutput}>
                  Download .css
                </Button>
              </>
            ) : null}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SvgOpts({
  opts,
  setOpts,
}: {
  opts: SVGExportOptions;
  setOpts: (o: SVGExportOptions) => void;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <Toggle
        label="Bleed"
        value={opts.include_bleed}
        onChange={(v) => setOpts({ ...opts, include_bleed: v })}
      />
      <Toggle
        label="Margins"
        value={opts.include_margins}
        onChange={(v) => setOpts({ ...opts, include_margins: v })}
      />
      <Toggle
        label="Grid"
        value={opts.include_grid}
        onChange={(v) => setOpts({ ...opts, include_grid: v })}
      />
      <Toggle
        label="Baseline"
        value={opts.include_baseline}
        onChange={(v) => setOpts({ ...opts, include_baseline: v })}
      />
      <Toggle
        label="Slots"
        value={opts.include_slots}
        onChange={(v) => setOpts({ ...opts, include_slots: v })}
      />
      <Toggle
        label="Slot labels"
        value={opts.include_slot_labels}
        onChange={(v) => setOpts({ ...opts, include_slot_labels: v })}
      />
      <Field label="Color">
        <Select
          value={opts.color_mode}
          onChange={(e) =>
            setOpts({
              ...opts,
              color_mode: e.target.value as SVGExportOptions["color_mode"],
            })
          }
        >
          <option value="color">Color</option>
          <option value="outline">Outline (single ink)</option>
        </Select>
      </Field>
    </div>
  );
}

function PngOpts({
  opts,
  setOpts,
}: {
  opts: PNGExportOptions;
  setOpts: (o: PNGExportOptions) => void;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <Field label="DPI">
        <Select
          value={String(opts.dpi)}
          onChange={(e) => setOpts({ ...opts, dpi: Number(e.target.value) })}
        >
          <option value="72">72</option>
          <option value="96">96</option>
          <option value="144">144</option>
          <option value="300">300</option>
          <option value="600">600</option>
        </Select>
      </Field>
      <Field label="Background">
        <Select
          value={opts.background}
          onChange={(e) =>
            setOpts({ ...opts, background: e.target.value })
          }
        >
          <option value="white">White</option>
          <option value="transparent">Transparent</option>
        </Select>
      </Field>
      <Toggle
        label="Bleed"
        value={opts.include_bleed}
        onChange={(v) => setOpts({ ...opts, include_bleed: v })}
      />
      <Toggle
        label="Grid"
        value={opts.include_grid}
        onChange={(v) => setOpts({ ...opts, include_grid: v })}
      />
      <Toggle
        label="Baseline"
        value={opts.include_baseline}
        onChange={(v) => setOpts({ ...opts, include_baseline: v })}
      />
      <Toggle
        label="Slots"
        value={opts.include_slots}
        onChange={(v) => setOpts({ ...opts, include_slots: v })}
      />
    </div>
  );
}

function CssOpts({
  opts,
  setOpts,
}: {
  opts: CSSExportOptions;
  setOpts: (o: CSSExportOptions) => void;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <Toggle
        label="Responsive breakpoints"
        value={opts.responsive}
        onChange={(v) => setOpts({ ...opts, responsive: v })}
      />
      <Toggle
        label="CSS Grid layout"
        value={opts.use_grid}
        onChange={(v) => setOpts({ ...opts, use_grid: v })}
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function SvgPreview({ svg }: { svg: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center justify-center rounded border border-rule bg-canvas p-4"
        style={{ minHeight: 320 }}
        dangerouslySetInnerHTML={{ __html: scaleSvg(svg, 280) }}
      />
      <details>
        <summary className="cursor-pointer text-xs text-ink-soft">
          View source
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto rounded border border-rule bg-canvas p-3 text-[11px] leading-tight">
          {svg}
        </pre>
      </details>
    </div>
  );
}

function PngPreview({
  document,
  page,
  opts,
}: {
  document: Document;
  page: Page;
  opts: PNGExportOptions;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    setBusy(true);
    setErr(null);
    exportPagePNG(page, document, opts)
      .then((blob) => {
        if (canceled) return;
        const url = URL.createObjectURL(blob);
        setSrc((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch((e) => !canceled && setErr(e.message))
      .finally(() => !canceled && setBusy(false));
    return () => {
      canceled = true;
    };
  }, [document, page, opts]);

  if (err) return <p className="text-sm text-red-700">{err}</p>;
  return (
    <div className="flex flex-col items-center gap-2">
      {busy ? (
        <p className="text-xs text-ink-soft">Rendering preview…</p>
      ) : null}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="PNG preview"
          className="max-h-[420px] max-w-full rounded border border-rule bg-paper"
        />
      ) : null}
    </div>
  );
}

function CssPreview({
  output,
}: {
  output: { css: string; html: string } | null;
}) {
  if (!output) return null;
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
          gridforge.css
        </h3>
        <pre className="max-h-[420px] overflow-auto rounded border border-rule bg-canvas p-3 text-[11px] leading-tight">
          {output.css}
        </pre>
      </div>
      <div>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
          gridforge.html (preview)
        </h3>
        <iframe
          title="HTML preview"
          srcDoc={output.html}
          className="h-[420px] w-full rounded border border-rule bg-paper"
        />
      </div>
    </div>
  );
}

function scaleSvg(svg: string, maxWidth: number): string {
  return svg.replace(
    /<svg([^>]*)>/,
    `<svg$1 style="max-width:${maxWidth}px; height:auto; display:block;">`,
  );
}

function download(filename: string, body: string, mime: string) {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  triggerDownload(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function triggerDownload(filename: string, url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "page";
}
