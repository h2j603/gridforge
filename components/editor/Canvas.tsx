import type { Document, Spread } from "@/lib/types";
import { PageBoard } from "./PageBoard";

export function Canvas({
  document,
  spread,
}: {
  document: Document;
  spread: Spread | undefined;
}) {
  if (!spread) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink-soft">
        No spreads yet.
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-canvas px-8 py-10">
      <div className="flex items-start gap-4">
        {spread.pages.map((page) => (
          <PageBoard key={page.id} document={document} page={page} />
        ))}
      </div>
    </div>
  );
}
