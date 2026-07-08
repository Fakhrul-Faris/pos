# Miki Merchant Portal — Dashboard Prototype

Interactive prototype for **O-09-01 Dashboard** (warm ops mode). Iterate layout, density, and vertical label swaps before Penpot hi-fi.

**Direction:** [`docs/design/portal-personality-brief.md`](../../docs/design/portal-personality-brief.md)  
**Theme:** [`docs/design/themes/visitors-design.md`](../../docs/design/themes/visitors-design.md) — lavender accent, DM Sans, pill controls

## Run

> **Migrated to Next.js** — use `apps/merchant-portal` instead (see [`apps/README.md`](../../apps/README.md)).

```bash
cd apps/merchant-portal
npm install   # from repo root: npm install
npm run dev   # http://localhost:3001
```

Legacy Vite setup (deprecated):

```bash
cd prototype/merchant-portal
npm install
npm run dev
```

Open **http://localhost:5174** (landing prototype uses 5173).

## What this prototype can do

This is a **clickable merchant portal dashboard prototype** (warm ops mode) with live state shared across screens.

### Core flows

- **Bookings lifecycle**
  - Open booking detail from Dashboard / Calendar / Bookings / Queue
  - Status transitions: Confirmed → Checked-in → In-service → Completed
  - Queue ticket numbers are assigned on Check-in and persist through reassignment
- **New booking**
  - Create a booking from Dashboard / Calendar / Bookings
  - Scheduling constraints: detects staff/time overlap, suggests next slot, supports “Anyone”
  - “Anyone” auto-assigns to an available staff member at creation time
- **Reschedule**
  - Reschedule edits the existing booking (not a clone)

### Ops surfaces

- **Dashboard**
  - KPIs derived from live data (bookings, walk-ins, revenue, no-shows)
  - Queue panel opens Counter view
  - Staff panel opens Staff screen
- **Calendar**
  - Week navigator + daily views (by staff, agenda, floor when “today”)
- **Bookings list**
  - Filter popover (date/status/staff) + table
- **Queue (Counter view)**
  - Per-staff queue lanes: “Now serving” + “Next up”
  - Start action moves ticket to “Now serving” and shows a success toast

### Staff & plan gating

- **Staff screen**
  - Toggle staff availability (Available / Break / Off)
  - Add staff with plan quota gating
  - Manage staff (rename/remove) with guardrails
- **Paywall**
  - When adding staff over quota, show upgrade paywall (prototype upgrade action)

### Payments (precise mode)

- **Transactions ledger**
  - Completing a booking creates a transaction and highlights it
  - Filter + sort controls on the ledger
  - Clicking any row opens a receipt drawer
  - Refund action marks a transaction as refunded

### Prototype controls

- **Prototype bar**
  - Vertical labels switch: barbershop / salon / clinic
  - Demo time slider affects queue + staff timing logic

## Tokens

Uses **Visitors** design language from [`docs/design/themes/visitors-design.md`](../../docs/design/themes/visitors-design.md):

- White canvas + linen page bg · fog hairline borders
- Lavender `#918df6` primary CTA · iris hover
- Mint positive deltas · ember negative
- DM Sans (OpenRunde substitute) · tight -0.32px tracking
- Pill buttons/tags · 16px card radius · 24px table radius

## Known limitations (intentional)

- This is a **prototype**: data is in-memory only; reload resets state.
- “Receipt” is a detail drawer, not a full printable invoice.
- No authentication, permissions, or multi-location support.

## Next additions (suggested)

1. True staff assignment UI (drag/drop queue tickets between staff)
2. Booking edit for service/customer fields (not only schedule)
3. Payouts view + reconciliation export
