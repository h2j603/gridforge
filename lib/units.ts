import type { Unit } from "./types";

const MM_PER_IN = 25.4;
const PT_PER_IN = 72;
const CSS_DPI = 96;

export function toPx(value: number, unit: Unit, dpi: number = CSS_DPI): number {
  switch (unit) {
    case "px":
      return value;
    case "in":
      return value * dpi;
    case "mm":
      return (value * dpi) / MM_PER_IN;
    case "pt":
      return (value * dpi) / PT_PER_IN;
  }
}

export function toRem(value: number, unit: Unit): number {
  return toPx(value, unit) / 16;
}

export function unitLabel(unit: Unit): string {
  return unit;
}
