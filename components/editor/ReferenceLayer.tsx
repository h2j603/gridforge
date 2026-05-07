import type { Page } from "@/lib/types";

interface Props {
  page: Page;
  /** Page CSS px size (already scaled). */
  pagePx: { w: number; h: number };
}

/**
 * Renders all visible reference images stretched to the page bounds, beneath
 * the grid / slot layers. Opacity comes from the row.
 */
export function ReferenceLayer({ page, pagePx }: Props) {
  const refs = (page.references ?? []).filter((r) => r.visible);
  if (refs.length === 0) return null;
  return (
    <>
      {refs.map((ref) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={ref.id}
          src={ref.image_url}
          alt=""
          className="pointer-events-none absolute inset-0 select-none"
          style={{
            width: pagePx.w,
            height: pagePx.h,
            opacity: clamp01(ref.opacity),
            objectFit: "fill",
          }}
          draggable={false}
        />
      ))}
    </>
  );
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  return Math.max(0, Math.min(1, v));
}
