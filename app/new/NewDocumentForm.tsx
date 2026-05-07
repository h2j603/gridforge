"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { createDocumentAction, type NewDocumentResult } from "./actions";

const initial: NewDocumentResult = { ok: false };

export function NewDocumentForm() {
  const [state, action, pending] = useActionState(
    createDocumentAction,
    initial,
  );
  const [preset, setPreset] = useState("a4");

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          placeholder="Workbook cover"
          autoFocus
        />
      </Field>

      <Field label="Preset" htmlFor="preset">
        <Select
          id="preset"
          name="preset"
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
        >
          <option value="a4">A4 (210 × 297 mm)</option>
          <option value="a5">A5 (148 × 210 mm)</option>
          <option value="letter">US Letter (8.5 × 11 in)</option>
          <option value="square">Square (200 × 200 mm)</option>
          <option value="custom">Custom</option>
        </Select>
      </Field>

      {preset === "custom" ? (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Width" htmlFor="width">
            <Input
              id="width"
              name="width"
              type="number"
              step="any"
              min="0"
              defaultValue={210}
              required
            />
          </Field>
          <Field label="Height" htmlFor="height">
            <Input
              id="height"
              name="height"
              type="number"
              step="any"
              min="0"
              defaultValue={297}
              required
            />
          </Field>
          <Field label="Unit" htmlFor="unit">
            <Select id="unit" name="unit" defaultValue="mm">
              <option value="mm">mm</option>
              <option value="in">in</option>
              <option value="pt">pt</option>
              <option value="px">px</option>
            </Select>
          </Field>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Orientation" htmlFor="orientation">
          <Select id="orientation" name="orientation" defaultValue="portrait">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </Select>
        </Field>
        <Field label="DPI" htmlFor="dpi">
          <Input
            id="dpi"
            name="dpi"
            type="number"
            min="1"
            step="1"
            defaultValue={300}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="facing_pages" className="h-4 w-4" />
        <span>Facing pages</span>
      </label>

      {state?.error ? (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="mt-2 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-ink-soft underline-offset-4 hover:underline"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create document"}
        </Button>
      </div>
    </form>
  );
}
