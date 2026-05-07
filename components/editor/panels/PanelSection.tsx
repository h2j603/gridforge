import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PanelSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-rule px-4 py-4", className)}>
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
