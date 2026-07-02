# Barbershop — Financial Assumptions

**Scope:** Pricing and revenue inputs for **barbershop Phase 1** only.  
**Company-wide SSOT:** [`../../financial/ssot.md`](../../financial/ssot.md) — forecasts, COGS, OPEX, cashflow.

**Feature packaging:** [`features-and-pricing.md`](features-and-pricing.md) Part 2

---

## Barbershop pricing (locked inputs)

From [`../../financial/ssot.md`](../../financial/ssot.md) §1.1 — edit there first, then sync module docs.

| ID | Input | Value | Notes |
| :--- | :--- | :--- | :--- |
| P-01 | Ocelot monthly | RM109 | vs StoreHub Starter RM122 |
| P-02 | Mantis monthly | RM199 | vs StoreHub Advanced RM235 |
| P-03 | Patriot monthly | RM349 | vs StoreHub Pro RM471 |
| P-04 | Founding Ocelot (locked) | RM89/mo | First 50 shops/city |
| P-05 | Ocelot Lite | RM0 | Post-trial only |
| P-06 | HitPay platform take | 0.80% of service subtotal | C′ — Lite cap · Ocelot+ unlimited |
| P-13 | Lite HitPay GMV cap | RM5,000/mo | Barbershop Lite tier |
| P-08 | Annual prepay | 10 months = 12 months | 17% discount |
| P-09 | Extra barber add-on | RM19/mo | 9th+ chair |
| P-10 | Extra POS screen | RM29/mo | |
| P-11 | Priority WhatsApp | RM99/mo | Ocelot add-on; Mantis+ included |

---

## Barbershop tier limits (product)

| Tier | Barbers | Online bookings/mo | HitPay rail |
| :--- | :--- | :--- | :--- |
| **Trial** | 4 (full Ocelot) | Unlimited | Off |
| **Lite** | 1 | 25 | RM5k cap |
| **Ocelot** | 4 | Unlimited | Unlimited |
| **Mantis** | 8 | Unlimited | Unlimited + reconcile |

Full matrix: [`features-and-pricing.md`](features-and-pricing.md).

---

## Rule

One pricing change → update [`../../financial/ssot.md`](../../financial/ssot.md) §1 → then `features-and-pricing.md` and `pricing-funnel.md` if merchant-facing copy changes.
