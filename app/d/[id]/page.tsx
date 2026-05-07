import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigBanner } from "@/components/ConfigBanner";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { getDocument } from "@/lib/queries";
import { DocumentEditorClient } from "./DocumentEditorClient";

export const dynamic = "force-dynamic";

export default async function DocumentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const configured = isConfigured();

  if (!configured) {
    return (
      <div className="min-h-screen">
        <ConfigBanner configured={false} />
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-xl font-semibold">Editor unavailable</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Configure Supabase first.
          </p>
          <p className="mt-4 text-sm">
            <Link href="/" className="underline-offset-4 hover:underline">
              ← Home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const document = await getDocument(supabase, id);

  if (!document) notFound();

  return <DocumentEditorClient document={document} />;
}
