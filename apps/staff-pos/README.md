# Staff POS

Counter tablet app for **P-xx POS screens** — floor board, booking detail, walk-in, payment, receipt.

**Spec:** [`docs/modules/barbershop/ui.md`](../../docs/modules/barbershop/ui.md) · Part 2  
**Capabilities:** [`prototype/staff-pos/README.md`](../../prototype/staff-pos/README.md)  
**Theme:** [`docs/design/themes/visitors-design.md`](../../docs/design/themes/visitors-design.md)

## Run

```bash
# From repo root
npm install
npm run dev:pos
# → http://localhost:3002
```

## Stack

Next.js 15 · React 19 · Tailwind v4 via `@miki/ui` · in-memory mock store (no backend).
