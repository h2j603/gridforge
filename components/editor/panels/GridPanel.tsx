"use client";

import { useEffect, useState } from "react";
import type { Grid, GridType, Page } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PanelSection } from "./PanelSection";

interface Props {
  page: Page | null;
  onChange: (
    pageId: string,
    spec: {
      type: GridType;
      cols: number;
      rows: number;
      gutter_x: number;
      gutter_y: number;
      color: "dark" | "light";
    },
  ) => void;
}

export function GridPanel({ page, onChange }: Props) {
  if (!page) {
    return (
      <PanelSection title="Grid">
        <p className="text-xs text-ink-soft">Select a page first.</p>
      </PanelSection>
    );
  }
  return (
    <PanelSection title="Grid">
      <GridControls key={page.id} page={page} onChange={onChange} />
    </PanelSection>
  );
}

function GridControls({
  page,
  onChange,
}: {
  page: Page;
  onChange: Props["onChange"];
}) {
  const grid = page.grid;
  const [type, setType] = useState<GridType>(grid?.type ?? "columnar");
  const [cols, setCols] = useState<number>(grid?.cols ?? 12);
  const [rows, setRows] = useState<number>(grid?.rows ?? 6);
  const [gutterX, setGutterX] = useState<number>(grid?.gutter_x ?? 0.012);
  const [gutterY, setGutterY] = useState<number>(grid?.gutter_y ?? 0.012);
  const [color, setColor] = useState<Grid["color"]>(grid?.color ?? "dark");

  useEffect(() => {
    if (!grid) return;
    setType(grid.type);
    setCols(grid.cols);
    setRows(grid.rows);
    setGutterX(grid.gutter_x);
    setGutterY(grid.gutter_y);
    setColor(grid.color);
  }, [grid]);

  const apply = () => {
    onChange(page.id, {
      type,
      cols: clamp(cols, 1, 32),
      rows: clamp(rows, 1, 32),
      gutter_x: clamp01(gutterX),
      gutter_y: clamp01(gutterY),
      color,
    });
  };

  return (
    <>
      <Field label="Type" htmlFor="grid-type">
        <Select
          id="grid-type"
          value={type}
          onChange={(e) => setType(e.target.value as GridType)}
        >
          <option value="columnar">Columnar</option>
          <option value="modular">Modular</option>
          <option value="manuscript">Manuscript</option>
          <option value="custom" disabled>
            Custom (v0.4)
          </option>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Cols" htmlFor="grid-cols">
          <Input
            id="grid-cols"
            type="number"
            min={1}
            max={32}
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            disabled={type === "manuscript"}
          />
        </Field>
        <Field label="Rows" htmlFor="grid-rows">
          <Input
            id="grid-rows"
            type="number"
            min={1}
            max={32}
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            disabled={type !== "modular"}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Gutter X" htmlFor="grid-gx" hint="0–1 fraction">
          <Input
            id="grid-gx"
            type="number"
            min={0}
            max={1}
            step={0.001}
            value={gutterX}
            onChange={(e) => setGutterX(Number(e.target.value))}
          />
        </Field>
        <Field label="Gutter Y" htmlFor="grid-gy" hint="0–1 fraction">
          <Input
            id="grid-gy"
            type="number"
            min={0}
            max={1}
            step={0.001}
            value={gutterY}
            onChange={(e) => setGutterY(Number(e.target.value))}
            disabled={type !== "modular"}
          />
        </Field>
      </div>

      <Field label="Color" htmlFor="grid-color">
        <Select
          id="grid-color"
          value={color}
          onChange={(e) => setColor(e.target.value as Grid["color"])}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </Select>
      </Field>

      <Button onClick={apply} variant="primary" size="sm">
        {grid ? "Update grid" : "Create grid"}
      </Button>
    </>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
