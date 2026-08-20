# Staff POS

Counter tablet app for **P-xx POS screens** — floor board, booking detail, walk-in, payment, receipt.

**Spec:** [`docs/modules/barbershop/ui.md`](../../docs/modules/barbershop/ui.md) · Part 2  
**UI design:** [`docs/design/staff-pos-ui-design.md`](../../docs/design/staff-pos-ui-design.md)  
**IA:** [`docs/design/staff-pos-ia.md`](../../docs/design/staff-pos-ia.md)  
**Theme:** [`docs/design/themes/visitors-design.md`](../../docs/design/themes/visitors-design.md)  
**Build rules:** [`docs/requirements.md`](../../docs/requirements.md)

## Run

```bash
# From repo root
npm install
npm run dev:pos
# → http://localhost:3002
```

## Stack

Next.js 15 · React 19 · Tailwind v4 via `@miki/ui` · in-memory mock store (no backend).

**Shifts:** Tap off-shift barber → Start shift (clock-in). Attendance syncs to Merchant Portal Roster via `localStorage` (`miki.pos.shifts`).

## What this prototype can do

### P-01 Session
- Shop login (demo shop; any credentials)
- Barber switcher — avatar rail; Manager mode for owner actions
- Bottom nav: **Today · Walk-in · Calendar · More**
- More sheet: Search, My day, End session, offline toggle (demo)

### P-06 Today board
- Per-barber lanes (Now / Waiting / Upcoming)
- Walk-in, party check-in / assign, reassign, add service, auto no-show prompt
- Landscape: board + detail panel; portrait: full-screen drawer

### P-07 / P-08 Checkout
- Payment drawer (HitPay QR/card simulated, cash, own DuitNow)
- Receipt ticket + QR

### P-09 / P-10
- My day stats · offline banner + pending count (demo)

## Known limitations (intentional)

- In-memory only; reload resets
- No real HitPay API, webhooks, or NFC
- No real auth or server sync
