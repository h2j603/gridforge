export function ConfigBanner({ configured }: { configured: boolean }) {
  if (configured) return null;
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
      <strong className="font-semibold">Supabase not configured.</strong>{" "}
      Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
      and{" "}
      <code className="rounded bg-amber-100 px-1">
        NEXT_PUBLIC_SUPABASE_ANON_KEY
      </code>{" "}
      in <code>.env.local</code> and apply <code>db/schema.sql</code>.
    </div>
  );
}
