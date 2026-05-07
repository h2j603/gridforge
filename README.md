# GridForge

Web ↔ Print bidirectional grid design tool. See [`GRIDFORGE_SPEC.md`](./GRIDFORGE_SPEC.md) for the full v1 specification.

## Status: v0.1 — skeleton

This milestone covers the project scaffold per spec §10:

- Next.js 16 + Tailwind 4 + Radix primitives
- `lib/types.ts` exactly as in spec §1.1
- `db/schema.sql` exactly as in spec §2.1
- Supabase server/client wiring
- Routes: `/`, `/new`, `/d/[id]`, `/gallery`, `/gallery/grids`
- `/new` creates a Document + initial Spread + Page, then redirects to the editor
- Editor shell with placeholder panels and stubbed layer files (real implementations land in v0.2+)

## Setup

```bash
pnpm install
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# apply db/schema.sql in your Supabase project
pnpm dev
```

## Build

```bash
pnpm build
```

## Roadmap

See spec §7 for the v0.1 → v1.0 → v1.5 → v2 ladder. Each milestone is meant to be merged independently.
