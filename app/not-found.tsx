import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-ink-soft">
          That document or page does not exist.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm underline-offset-4 hover:underline"
        >
          ← Home
        </Link>
      </div>
    </div>
  );
}
