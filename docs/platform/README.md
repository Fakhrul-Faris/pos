# Miki Platform — Universal SSOT

**Scope:** Everything that applies to **all verticals** (barbershop, clinic, salon, …) and **all markets** (with country adapters where noted).

**Vertical-specific docs** live under [`../modules/`](../modules/). Phase 1: [`../modules/barbershop/`](../modules/barbershop/).

---

## Documents

| Document | Purpose |
| :--- | :--- |
| [**architecture.md**](architecture.md) | Universal core vs country adapters — tax, workforce, org model, loyalty patterns |
| [**pricing-model.md**](pricing-model.md) | Trial → Lite → paid **mechanics** (no vertical RM prices) |
| [**payment-rails.md**](payment-rails.md) | HitPay aggregator model, C′ rail philosophy, ledger, payouts *(internal)* |
| [**design-system/**](design-system/) | Design tokens SSOT — primitives, semantic tokens, Tailwind/Penpot |

---

## What belongs here vs in a module

| Platform (here) | Module (e.g. barbershop) |
| :--- | :--- |
| Tier ladder concept (Ocelot, Mantis, Patriot) | Tier **prices** and **limits** (RM109, 4 barbers, …) |
| Trial → Lite → paid funnel pattern | Lite caps for that vertical (25 bookings/mo, …) |
| Payment rail philosophy (C′) | Feature matrix per tier for that shop type |
| Company → Outlet data model | Barber, chair, hybrid queue rules |
| Design tokens & component primitives | Surface screens (C-xx / P-xx / O-xx) |
| Receipt + `TaxDocument` pattern | State machine, arrival policy |

**Rule:** If a second vertical would copy it unchanged → **platform**. If it mentions barber, chair, or vertical-specific packaging → **module**.

---

## Related (not platform)

| Path | Purpose |
| :--- | :--- |
| [`../modules/barbershop/`](../modules/barbershop/) | Phase 1 vertical — full SSOT |
| [`../product/engineering-modules.md`](../product/engineering-modules.md) | Engineering build spec *(dev-owned)* |
| [`../planning/`](../planning/) | Timeline & BRD |
| [`../financial/ssot.md`](../financial/ssot.md) | Company-wide forecasts & assumptions |
