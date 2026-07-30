# Staff POS — Floor Prototype

Interactive prototype for **P-xx POS screens** (shared counter tablet). Matches the Visitors design language used in the merchant portal.

**Spec:** [`docs/modules/barbershop/ui.md`](../../docs/modules/barbershop/ui.md) · Part 2 — POS  
**Theme:** [`docs/design/themes/visitors-design.md`](../../docs/design/themes/visitors-design.md)  
**App:** [`apps/staff-pos`](../../apps/staff-pos)

## Run

> **Migrated to Next.js** — use `apps/staff-pos` (see [`apps/README.md`](../../apps/README.md)).

```bash
# From repo root
npm install
npm run dev:pos
# → http://localhost:3002
```

Or directly:

```bash
cd apps/staff-pos
npm run dev
```

Legacy Vite setup (deprecated):

```bash
cd prototype/staff-pos
npm install
npm run dev
```

---

## What this prototype can do

### P-01 Session
- **Shop login** — start terminal session (demo shop; any credentials)
- **Barber switcher** — avatar rail in header; tap to switch acting barber; **Manager** mode for owner actions
- **Floor tap-to-switch** — tap a lane header to set acting barber
- **Switch toast** — “Now acting as …” feedback on change
- **Bottom nav pill** — floating: **Today · Walk-in · Calendar · More**
- **More sheet** — Search, My day, End session, offline toggle (demo), staff tools
- **End session** — from More → confirm → login

### P-06 Today board
- **Per-barber lanes** — Now / Waiting / Upcoming with queue numbers
- **Lanes vs Timeline** — board toggle + **Calendar** pill switches to timeline
- **Landscape split** — on wide screens (`lg+`), board left + booking detail panel right; portrait uses full-screen drawer
- **Staff filter** — All barbers or single barber view
- **Shop-wide waiting queue** — cross-lane queue with **Take** to assign to acting barber
- **Party row** — party bookings surfaced separately
- **Status colour-coding** — left accent + badges (upcoming / arrived / in chair / done)
- **Source tinting** — Online vs walk-in card treatment
- **Late indicator** — 15+ min late on upcoming cards + summary banner
- **Auto no-show prompt** — late upcoming bookings open no-show confirm modal
- **Search** — via More → find booking by customer, service, staff, or queue #
- **Walk-in** — via pill → name, optional phone, service, **Anyone available** or specific barber + walk-in slot picker
- **Booking detail** — mark arrived, start cut, cancel, no-show, reassign, tap-to-call phone
- **Add service** — in-chair add-ons with overlap warning
- **Party check-in** — per-guest Here / No-show
- **Party assign** — split across barbers, parallel Start/Complete, Start all ready

### P-07 Checkout & payment
- **Payment drawer** — line items, subtotal, HitPay 2% service fee
- **Party payment layout** — grouped member lines (name · service · barber · price); arrived members only
- **Methods** — HitPay QR, HitPay card (simulated wait), Cash, Own DuitNow
- **HitPay QR screen** — scannable payment QR with amount + fee breakdown
- **HitPay card screen** — terminal mockup + “Hold card near terminal…”
- **HitPay timeout** — “Payment issue?” → timeout screen with Retry / other method / record cash
- **Pay button morph** — brief visual feedback on method selection
- **Nav pill hidden** — during payment / receipt / no-show / end-session confirms

### P-08 Receipt handoff
- **Animated receipt ticket** — confetti, checkmark, dashed dividers, payment row
- **Scannable receipt QR** — encodes digital receipt URL
- **Printer slide** — receipt drops from slot on success
- **Actions** — New walk-in · Done

### P-09 Quick stats
- **My day** — via More → cuts + revenue for acting barber (shop-wide totals when acting as Manager)
- **Recent transactions** — last payments for the session

### P-10 Offline
- **Offline banner** — “Offline — saving locally (N pending)”
- **Online / Offline toggle** — More sheet (demo); works with browser connectivity
- **Pending count** — mutations while offline increment queue
- **Sync toast** — “Synced N pending changes” when returning online

---

## Prototype controls

Accessible from **More → Staff tools** (Demo time slider):

- **Demo time slider** — shifts upcoming vs late on the floor (9am–8pm, 15-min steps)

More sheet also includes:

- **Online / Offline toggle** — simulates P-10 queue behaviour

---

## UX notes (implemented)

| Spec note | Implementation |
|-----------|----------------|
| Landscape first | Split board + detail panel on `lg+` |
| Portrait | Board list → drawer detail |
| Touch targets 48dp+ | Primary controls `min-h-12` |
| Status colours | Sky / amber / lavender / mint accents on cards |
| P-01-02 avatars | Avatar rail + Manager chip |
| Bottom pill | Today · Walk-in · Calendar · More; hidden on pay/receipt/confirms |

---

## Known limitations (intentional)

These are **out of scope** for the UI prototype — backend/production work:

- In-memory state only; reload resets
- No real HitPay API, webhooks, or terminal integration (QR/wait/timeout are simulated)
- No real auth or device registration beyond demo login screen
- No API persistence or customer status page sync
- Offline queue counts locally but does not replay to a server

---

## Component map (`apps/staff-pos`)

| Area | Components |
|------|------------|
| Shell | `PosApp`, `LoginScreen`, `OfflineBanner`, `BarberSwitcher`, `BottomNavPill`, `MoreSheet`, `PrototypeControls` |
| Floor | `FloorView` |
| Booking | `BookingDrawer` (drawer + panel modes), drawers for party/reassign/add-service |
| Payment | `PaymentDrawer`, `ReceiptSuccessDrawer`, `ReceiptTicket`, `QrCode` |
| Stats / search | `StatsDrawer`, `SearchModal`, `WalkInDrawer` |

---

## Migrated to Next.js

Staff POS lives at **`apps/staff-pos`**. Run with `npm run dev:pos` from the repo root.
