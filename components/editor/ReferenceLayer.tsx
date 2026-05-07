import type { Page } from "@/lib/types";

interface Props {
  page: Page;
  /** Page CSS px size (already scaled). */
  pagePx: { w: number; h: number };
}

/**
 * Renders all visible reference images centered on the page, sized to fit
 * (object-fit: contain) at 100% scale, then transformed by tx/ty/scale/
 * rotation. tx/ty are fractions of the page width/height.
 */
export function ReferenceLayer({ page, pagePx }: Props) {
  const refs = (page.references ?? []).filter((r) => r.visible);
  if (refs.length === 0) return null;
  return (
    <>
      {refs.map((ref) => {
        const tx = (ref.tx ?? 0) * pagePx.w;
        const ty = (ref.ty ?? 0) * pagePx.h;
        const sc = clampScale(ref.scale ?? 1);
        const rot = ref.rotation ?? 0;
        return (
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
              objectFit: "contain",
              transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc})`,
              transformOrigin: "center",
            }}
            draggable={false}
          />
        );
      })}
    </>
  );
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  return Math.max(0, Math.min(1, v));
}
function clampScale(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1;
  return Math.max(0.05, Math.min(20, v));
}
