# Merchant Portal

Web app for shop **Owners** - schedule, catalogue, people, payments oversight, settings (**O-xx** screens).

**IA SSOT (sole):** [`docs/platform/Miki Merchant Portal - Designer IA Brief.md`](../../docs/platform/Miki%20Merchant%20Portal%20%E2%80%94%20Designer%20IA%20Brief.md)  
**Screen specs:** [`docs/modules/barbershop/ui.md`](../../docs/modules/barbershop/ui.md) · Part 3  
**Direction:** [`docs/design/portal-personality-brief.md`](../../docs/design/portal-personality-brief.md)  
**Theme:** [`docs/design/themes/visitors-design.md`](../../docs/design/themes/visitors-design.md)

## Run

```bash
# From repo root
npm install
npm run dev:portal
# → http://localhost:3001
```

## Stack

Next.js 15 · React 19 · Tailwind v4 via `@miki/ui` · in-memory mock state (no backend).
