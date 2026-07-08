# Miki Apps — Next.js Monorepo

Production-oriented home for **merchant portal** and **staff POS** prototypes, migrated from `prototype/`.

## Structure

```
apps/
  merchant-portal/   Owner web (O-xx) — port 3001
  staff-pos/         Counter POS (P-xx) — port 3002
packages/
  ui/                Shared Visitors design tokens (@miki/ui)
```

Legacy Vite prototypes remain in `prototype/` for reference until removed.

## Run

From repo root:

```bash
npm install

# Merchant portal
npm run dev:portal
# → http://localhost:3001

# Staff POS
npm run dev:pos
# → http://localhost:3002
```

## Build

```bash
npm run build          # both apps
npm run build:portal   # portal only
npm run build:pos      # POS only
```

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** via `@miki/ui` shared tokens

## Notes

- All interactive UI is client-side (`'use client'`) with in-memory state — same as Vite prototypes.
- **Staff POS prototype capabilities:** [`prototype/staff-pos/README.md`](../prototype/staff-pos/README.md)
- Next steps: auth, API routes, real persistence, customer web app (`apps/customer-web`).
