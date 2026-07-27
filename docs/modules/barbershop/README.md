# Barbershop Module — SSOT

**Platform:** Miki · **Phase:** 1 (first vertical)  
**Start here** for anything barbershop — product, pricing, UI, marketing.

Universal platform rules: [`../../platform/README.md`](../../platform/README.md)

---

## One sentence

Hybrid **online booking + walk-in queue**, **one shared counter tablet**, **per-barber economics** — for Malaysian barbershops on BYOD.

---

## Mental model

```
PLATFORM (universal)
  trial · Lite · tiers · payment rails · design tokens
           │
           ▼
BARBERSHOP MODULE (this folder)
  barber · calendar · hybrid queue · pick-barber · state machine
           │
           ├── Customer web  (C-xx)  phone, no login
           ├── Shared POS    (P-xx)  one tablet, barber switcher
           └── Owner web     (O-xx)  Merchant Portal — setup, calendar, reports
```

**Merchant Portal IA:** [`../../platform/Miki Merchant Portal — Designer IA Brief.md`](../../platform/Miki%20Merchant%20Portal%20%E2%80%94%20Designer%20IA%20Brief.md)

---

## Document map

| Document | Read if you are… | Contents |
| :--- | :--- | :--- |
| [**spec.md**](spec.md) | Anyone building barbershop | **Authoritative rules** — roles, state machine, policies, offline |
| [**pricing-funnel.md**](pricing-funnel.md) | Product, marketing, finance | Trial → Lite → paid in plain language (barbershop numbers) |
| [**features-and-pricing.md**](features-and-pricing.md) | Product, design, eng | Feature catalog + Ocelot/Mantis/Patriot matrix + RM prices |
| [**ui.md**](ui.md) | Design, frontend | Screen specs (C-xx, P-xx, O-xx). **Merchant Portal nav IA:** [`../../platform/Miki Merchant Portal — Designer IA Brief.md`](../../platform/Miki%20Merchant%20Portal%20%E2%80%94%20Designer%20IA%20Brief.md) |
| [**motion-prototype.md**](../../design/motion-prototype.md) | Design, frontend | Coded motion demos + party flow reference |
| [**marketing.md**](marketing.md) | Marketing, Penpot | Canonical `/barbershop` landing copy |
| [**compare.md**](compare.md) | Marketing, Penpot, SEO | Canonical `/compare` — Miki vs Fresha (+ StoreHub footnote) |
| [**financial.md**](financial.md) | Finance, founders | Barbershop pricing assumptions (links to company SSOT) |

---

## Day-in-the-life (doc spine)

| Moment | Who | Document |
| :--- | :--- | :--- |
| Owner sets up shop | Owner | `spec.md` §3–4 · `ui.md` O-xx |
| Customer scans QR | Customer | `spec.md` §2–4 · `ui.md` C-xx |
| Walk-in at lunch peak | Barber | `spec.md` §4 · `ui.md` P-xx |
| Customer arrives | Barber | `spec.md` §6–7 |
| Cut finishes | Barber | `spec.md` §8 · [`../../platform/payment-rails.md`](../../platform/payment-rails.md) |
| Owner checks Saturday | Owner | `features-and-pricing.md` · `ui.md` O-xx |
| Day 15 after trial | Owner | `pricing-funnel.md` |

---

## Core vs barbershop

| Universal ([`../../platform/`](../../platform/)) | Barbershop (this module) |
| :--- | :--- |
| Merchant signup, plan tiers | `vertical = barbershop` |
| Staff + RBAC | **Barber** = staff + calendar + cap + POS avatar |
| Service catalog | Duration + buffer → slots |
| Transaction + receipt | `booking_id` + `barber_id` required |
| Customer by phone | Guest book + status URL token |
| C′ payment philosophy | Lite RM5k cap · Ocelot unlimited · Mantis reconcile |
| Design tokens | Barber switcher, master calendar, status page |

**Note:** Generic “walk-in queue only” does **not** describe barbershop. This module = **bookings + calendar + hybrid queue**.

---

## Reading paths

| Party | Order |
| :--- | :--- |
| **Product** | This README → `spec.md` → `pricing-funnel.md` |
| **Design** | This README → `spec.md` → `ui.md` → [`../../platform/design-system/`](../../platform/design-system/) |
| **Marketing** | `marketing.md` → `compare.md` → `pricing-funnel.md` |
| **Finance** | `financial.md` → `features-and-pricing.md` Part 2 |
| **Engineering** | `spec.md` → `ui.md` → [`../../product/engineering-modules.md`](../../product/engineering-modules.md) |

---

## Phase 1B (deferred)

OTP/SMS reminder · deposit for no-show · customer self check-in — see `spec.md` §12.

---

## Non-goals (v1)

Payroll · statutory HR · MyInvois live submit · customer accounts · SMS notifications · separate clock-in app.
