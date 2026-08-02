# Miki Order App

Customer-facing booking & queue webapp (working name: **order app**).

Phone QR flow: services → schedule → details → queue status. No account. Pay at counter.

## Run

```bash
# from repo root
npm run dev:order
# → http://localhost:3003
```

## Stack

Next.js 15 · React 19 · Motion · Tailwind via `@miki/ui`

Prototype source: `prototype/motion` booking flow (`BookingFlow`).
