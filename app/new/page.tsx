import Link from "next/link";
import { ConfigBanner } from "@/components/ConfigBanner";
import { isConfigured } from "@/lib/supabase/server";
import { NewDocumentForm } from "./NewDocumentForm";

export const dynamic = "force-dynamic";

export default function NewDocumentPage() {
  return (
    <div className="min-h-screen">
      <ConfigBanner configured={isConfigured()} />
      <div className="mx-auto max-w-xl px-6 py-12">
        <Link
          href="/"
          className="text-xs text-ink-soft underline-offset-4 hover:underline"
        >
          ← Back
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          New document
        </h1>
        <p className="mt-1 mb-8 text-sm text-ink-soft">
          Define page dimensions and orientation. You can adjust margins,
          grids, and slots after creation.
        </p>
        <NewDocumentForm />
      </div>
    </div>
  );
}
