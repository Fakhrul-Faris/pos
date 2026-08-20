# Miki

**Queue, booking, and checkout for Malaysian service shops.**

Phase 1 is the **barbershop module**: customer QR booking, shared counter POS, owner web — BYOD, no hardware bundle.

## Developer start

1. Read **[`HANDOFF.md`](HANDOFF.md)** — run the apps.
2. Read **[`docs/README.md`](docs/README.md)** — which spec to trust.
3. Build behaviour from **[`docs/requirements.md`](docs/requirements.md)** (founder PRD, through Round 26).
4. Build screens from **[`docs/modules/barbershop/`](docs/modules/barbershop/)** + the Next.js apps.

```bash
npm install          # always at repo root
npm run dev:landing  # :3000  marketing
npm run dev:portal   # :3001  owner web
npm run dev:pos      # :3002  counter POS
npm run dev:order    # :3003  customer booking
```

Node.js 20+. Do not `npm install` inside a single `apps/*` folder.

## What lives where

| Path | What it is |
| :--- | :--- |
| `apps/` | Current UI prototypes (Next.js 15) — in-memory, no API yet |
| `packages/ui/` | Shared design tokens (`@miki/ui`) |
| `docs/requirements.md` | **Engineering PRD** — backend, HitPay, billing, payroll |
| `docs/open-hitpay.md` | HitPay questions still unanswered (Round 24) |
| `docs/modules/barbershop/` | Barbershop product + screen specs (C/P/O) |
| `docs/platform/` | Universal platform (tokens, pricing model) |
| `docs/db-schema.json` | Schema dump (reference; not all of it is built) |
| `prototype/motion/` | Motion gallery only (`npm run dev` → :5173) |
| `.agents/` / `.cursor/` / `skills-lock.json` | Internal AI tooling — ignore for product work |

## Surfaces

| Surface | Who | App | Spec |
| :--- | :--- | :--- | :--- |
| Customer web | Customer phone | `apps/order-app` | [`ui.md`](docs/modules/barbershop/ui.md) Part 1 |
| Counter POS | Barber / manager | `apps/staff-pos` | [`ui.md`](docs/modules/barbershop/ui.md) Part 2 |
| Owner web | Owner | `apps/merchant-portal` | [`ui.md`](docs/modules/barbershop/ui.md) Part 3 |

## Plan tiers (not the product name)

**Ocelot · Mantis · Patriot · Arsenal** are subscription packages. **Miki** is the company and platform. The engineering PRD also uses older tier names (FREE / STARTER / PLUS / PRO) — map them using [`docs/requirements.md`](docs/requirements.md) and [`docs/modules/barbershop/features-and-pricing.md`](docs/modules/barbershop/features-and-pricing.md).
