import Link from "next/link";
import { ConfigBanner } from "@/components/ConfigBanner";
import { isConfigured } from "@/lib/supabase/server";
import { NewDocumentForm } from "./NewDocumentForm";

export const dynamic = "force-dynamic";

export default function NewDocumentPage() {
  return (
    <div className="min-h-dvh">
      <ConfigBanner configured={isConfigured()} />
      <div className="mx-auto max-w-xl px-5 py-8 sm:px-8 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
        >
          ← Home
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          New document
        </h1>
        <p className="mt-2 mb-8 text-sm text-ink-soft">
          Set page dimensions and orientation. Margins, grid, slots, and
          baseline can all be tuned in the editor afterwards.
        </p>
        <div className="rounded-2xl border border-rule bg-paper p-5 sm:p-6">
          <NewDocumentForm />
        </div>
      </div>
    </div>
  );
}
