# Miki

**Queue, booking, and checkout for Malaysian service shops.**

Phase 1 ships the **barbershop module**: customer QR booking, shared counter POS, owner web — BYOD, no hardware bundle.

## Start here

Full doc map: **[`docs/README.md`](docs/README.md)**

| Document | Use |
| :--- | :--- |
| [**docs/modules/barbershop/README.md**](docs/modules/barbershop/README.md) | **Barbershop module hub** — start here for Phase 1 |
| [**docs/modules/barbershop/spec.md**](docs/modules/barbershop/spec.md) | Product rules — states, policies, roles |
| [**docs/modules/barbershop/pricing-funnel.md**](docs/modules/barbershop/pricing-funnel.md) | Trial → Lite → paid explained |
| [**docs/modules/barbershop/features-and-pricing.md**](docs/modules/barbershop/features-and-pricing.md) | Feature catalog + Ocelot / Mantis / Patriot pricing |
| [**docs/modules/barbershop/marketing.md**](docs/modules/barbershop/marketing.md) | Barbershop marketing page copy |
| [**docs/modules/barbershop/ui.md**](docs/modules/barbershop/ui.md) | IA + all screen specs (Customer, POS, Owner) |
| [**docs/platform/README.md**](docs/platform/README.md) | Universal platform (tokens, pricing model, payment rails) |
| [**docs/product/engineering-modules.md**](docs/product/engineering-modules.md) | Backend modules & APIs |
| [**docs/planning/phase1-plan.md**](docs/planning/phase1-plan.md) | Timeline & milestones |
| [**docs/financial/ssot.md**](docs/financial/ssot.md) | Costing, forecasts, SaaS metrics |

## Surfaces

| Surface | Who | Document |
| :--- | :--- | :--- |
| Customer web | Customer phone | [`ui.md`](docs/modules/barbershop/ui.md) Part 1 (C-xx) |
| Counter POS | Barber / manager (shared device) | [`ui.md`](docs/modules/barbershop/ui.md) Part 2 (P-xx) |
| Owner web | Owner | [`ui.md`](docs/modules/barbershop/ui.md) Part 3 (O-xx) |

## Apps & prototypes

Interactive UI lives in the **Next.js monorepo** ([`apps/README.md`](apps/README.md)):

```bash
npm install
npm run dev:pos      # Staff POS → :3002
npm run dev:portal   # Merchant portal → :3001
```

Legacy Vite prototypes: [`prototype/README.md`](prototype/README.md)

## Plan tiers (not the product name)

**Ocelot** · **Mantis** · **Patriot** · **Arsenal** — subscription packages. **Miki** is the company and platform.
