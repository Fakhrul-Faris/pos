# Miki Apps — Next.js Monorepo

Production-oriented home for **landing**, **merchant portal**, **staff POS**, **order-app**, and **admin portal**.

## Structure

```
apps/
  landing/           Marketing hub (/) — port 3000
  merchant-portal/   Owner web (O-xx) — port 3001
  staff-pos/         Counter POS (P-xx) — port 3002
  order-app/         Customer booking & queue (C-xx) — port 3003
  admin-portal/      Miki internal ops
packages/
  ui/                Shared Visitors design tokens (@miki/ui)
```

Motion demos only: `prototype/motion/`.

## Run

From repo root:

```bash
npm install

# Landing
npm run dev:landing
# → http://localhost:3000

# Merchant portal
npm run dev:portal
# → http://localhost:3001

# Staff POS
npm run dev:pos
# → http://localhost:3002

# Order app (customer booking)
npm run dev:order
# → http://localhost:3003
```

## Build

```bash
npm run build          # all apps
npm run build:landing  # landing only
npm run build:portal   # portal only
npm run build:pos      # POS only
npm run build:order   # order app only
```

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** via `@miki/ui` shared tokens (portal + POS); landing uses local tokens

## Notes

- All interactive UI is client-side (`'use client'`) with in-memory state.
- **Staff POS capabilities:** [`staff-pos/README.md`](staff-pos/README.md)
- Next steps: auth, API, real persistence. Customer surface: `apps/order-app`.
- Behaviour SSOT: [`docs/requirements.md`](../docs/requirements.md)
