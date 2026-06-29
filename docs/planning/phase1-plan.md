# Phase 1 Execution Plan — Path A (Bootstrap)

**Decision date:** 25 June 2026  
**Status:** Approved — active development track  
**Authority:** This document is the **execution contract** for Phase 1. When in conflict with [`../archive/fb-pos-brd-phase2.md`](../archive/fb-pos-brd-phase2.md), this plan wins until Phase 2 begins.

---

## 1. Strategic Decision

After stress-testing the F&B BRD (see [`../archive/`](../archive/)), we chose **Path A**:

| | Phase 1 (now) | Phase 2 (later) |
| :--- | :--- | :--- |
| **Product** | Queue + POS for **barbers, salons, clinics, pop-ups** | F&B QR ordering (see [`../archive/fb-pos-brd-phase2.md`](../archive/fb-pos-brd-phase2.md)) |
| **Business doc** | [`initial-brd.md`](initial-brd.md) | [`../archive/fb-pos-brd-phase2.md`](../archive/fb-pos-brd-phase2.md) |
| **Team** | 2 founders (Business/UI + Technical) | Revisit when Phase 1 hits 50+ paying merchants |
| **Timeline** | MVP ~4 months; payments ~month 8 | No start before Phase 1 PMF gate |

**Why Path A:** Lower build complexity, weaker incumbent competition in the vertical, LHDN e-invoice as acquisition hook, SaaS revenue from day one without waiting for payment rail.

---

## 2. Phase 1 Product Definition

### One-liner
**Barbershop booking & queue** — customer books via QR (no account), shared POS for barbers, pay after cut.

> **Full rules:** [`../product/barbershop-spec.md`](../product/barbershop-spec.md)

### Primary user journey (barbershop — 3 barbers, 1 POS)

```
Customer scans shop QR → nickname + phone → services + party size
  → pick barber (if enabled) + date/time → booking #42 + status URL
  → arrives (≤10 min early waits) → manager marks Arrived on POS
  → barber adds extras if needed (beard trim) → cut → pay at counter
  → receipt SMS · per-barber revenue recorded

Walk-in: POS adds walk-in (walk-in slots or queue rules)
Offline: POS caches arrived/no-show/payment → syncs when online
```

**Customer web is in scope for Phase 1** (barbershop booking, not F&B table order).

### Target merchants (first 50)
| Segment | Example | Why first |
| :--- | :--- | :--- |
| Barbers | Solo / 2-chair | Simple menu, queue is daily pain |
| Salons | Hair, nails | Bookings + walk-in mix |
| Clinics | Dental, aesthetic | Waitlist + compliance |
| Pop-ups | Weekend market stall | Lite tier, BYOD |

**Not targeting in Phase 1:** Full-service restaurants, multi-branch F&B, franchises.

---

## 3. System Surfaces (Phase 1 only)

| Surface | Purpose | Priority |
| :--- | :--- | :--- |
| **Customer Web** (React + Vite) | QR book, status, receipt link — no account | Must |
| **POS** (React + Vite or RN on counter) | Shared machine: arrived, assign, add-on, pay | Must |
| **Owner Web** (React + Vite) | Calendar, caps, services, barbers, reports | Must |
| **Backend API** (Kotlin + Spring Boot) | Booking, calendar, sync, SMS receipt | Must |
| ~~F&B customer table order~~ | — | Phase 2 |

---

## 4. Technical Principles (lessons from F&B BRD fight)

| Topic | Phase 1 choice | Avoid (from F&B BRD) |
| :--- | :--- | :--- |
| Authentication | **Managed provider** (e.g. Clerk, Supabase Auth, Firebase Auth) | Built-in auth |
| Database | **Managed PostgreSQL** (RDS, Supabase, Neon, OCI managed) | Self-managed DB on raw VMs |
| Real-time queue | WebSocket or SSE; add Redis only if load requires | PostgreSQL-only fan-out at scale |
| Caching | None v1 unless queue latency proves need | Premature Redis |
| Cloud | Managed services preferred; minimise 2am ops | Self-managed K8s/VMs |
| Offline | Local queue + checkout queue; sync on reconnect | Undefined offline (F&B open question) |

Stack record (aligned with team preference where noted):

| Layer | Choice |
| :--- | :--- |
| Admin web | React + Vite |
| Staff app | React Native + Expo (iOS + Android) |
| Backend | Kotlin + Spring Boot |
| API | REST + WebSocket (queue updates) |
| Database | PostgreSQL (managed) |
| Push (optional v1.1) | FCM — appointment reminders Phase 1B |
| Media | Object storage + CDN for service photos |
| E-invoice | MyInvois add-on / Patriot (not MVP launch gate) |

---

## 5. Phase 1A — MVP (Months 0–4)

**Goal:** 10 paying merchants on Ocelot+. SaaS MRR ≥ RM1,090.

### 5.1 Must-have features

#### Queue
| ID | Feature |
| :--- | :--- |
| Q-01 | Walk-in queue: take number, display "now serving" |
| Q-02 | Add customer to queue manually (name optional, phone optional) |
| Q-03 | Call next / skip / mark no-show |
| Q-04 | Queue board view (staff tablet or TV browser) |
| Q-05 | Basic estimated wait (optional: avg service time × queue length) |

#### POS / Checkout
| ID | Feature |
| :--- | :--- |
| P-01 | Service menu (name, price, category) — max aligns with tier limits |
| P-02 | Flat-price checkout (no variants v1) |
| P-03 | Payment path: **Cash** / **Other DuitNow** (manual confirm) |
| P-04 | Receipt (digital; print via system share if needed) |
| P-05 | Daily sales summary |

#### Compliance (Pro)
| ID | Feature |
| :--- | :--- |
| C-01 | MyInvois e-Invoice on request at checkout |
| C-02 | 500 e-invoices/mo included on Pro |
| C-03 | Standard receipt on Lite (no MyInvois) |

#### Platform
| ID | Feature |
| :--- | :--- |
| PL-01 | Merchant self-registration + 14-day Pro trial |
| PL-02 | Ocelot / Mantis / Patriot plan selection + Lite limits + trial funnel enforcement |
| PL-03 | 1 store only in Phase 1A |
| PL-04 | Staff accounts per tier (Lite: 2, Pro: 8) |
| PL-05 | Device limits per tier (Lite: 1, Pro: 3) |
| PL-06 | Offline: queue + checkout queued locally; sync when online |
| PL-07 | Role: Owner, Staff (simplified vs F&B kitchen/cashier split) |

### 5.2 Should-have (if time permits in Month 4)
| ID | Feature |
| :--- | :--- |
| S-01 | Simple appointment list (name, time — not full booking engine) |
| S-02 | Customer list (name, phone, visit count) |
| S-03 | Export daily sales CSV |

### 5.3 Explicitly out of Phase 1A
| Item | Deferred to |
| :--- | :--- |
| Dynamic DuitNow QR / payment rail | Phase 1B |
| SMS reminders | Phase 1B |
| Accountant portal | Phase 1B |
| Loyalty points | Post-50 merchants |
| Multi-store | Phase 2 |
| Inventory | Phase 2 |
| F&B table QR ordering | Phase 2 ([`../archive/fb-pos-brd-phase2.md`](../archive/fb-pos-brd-phase2.md)) |
| Shared table / kitchen / Pay First–Eat First | Phase 2 |
| Discounts / vouchers | Phase 2 |
| Franchise HQ dashboard | Phase 3 |

---

## 6. Phase 1B — Payments & Growth (Months 4–8)

**Goal:** Payment rail live; 50 paying merchants; payment opt-in ≥25%.

| ID | Feature |
| :--- | :--- |
| B-01 | Mantis + HitPay (RM199/mo; customer pays 2% on QR/card) |
| B-02 | HitPay QR + card tap — prefilled amount, auto-complete order |
| B-03 | Multi-path checkout: HitPay / Cash / Own DuitNow (no forced rail) |
| B-04 | Reconciliation dashboard — paid vs unmatched |
| B-05 | SMS appointment/queue reminders (add-on) |
| B-06 | Accountant read-only multi-client view (add-on) |
| B-07 | Merchant referral — 1 month free after referee pays 1 month |

---

## 7. Subscription Enforcement

From [`../product/features-and-packages.md`](../product/features-and-packages.md):

| Limit | Ocelot Lite | Ocelot RM109 |
| :--- | :--- | :--- |
| Barber profiles | 1 | 4 |
| POS terminals | 1 | 1 |
| Online bookings/mo | 25 | Unlimited |
| Services | 15 | Unlimited |
| Trial | 14-day full Ocelot → Lite or subscribe | — |

**Limit reached:** Block action + in-app upgrade prompt (not KIV). Customer QR **never** stops on Lite.

---

## 8. Milestones & PMF Gate

| Milestone | Target | Gate |
| :--- | :--- | :--- |
| M0: Stack + auth + tenant skeleton | Month 1 | — |
| M1: Queue + menu CRUD (web) + staff queue app | Month 2 | — |
| M2: Checkout + receipts + offline sync | Month 3 | — |
| M3: Billing + trial flow + org/outlet model | Month 4 | **MVP launch** |
| M4: 10 paying merchants | Month 5 | — |
| M5: HitPay integrated | Month 8 | Phase 1B |
| M6: 50 paying merchants, <8% monthly churn | Month 10 | **Phase 2 discussion gate** |

**Phase 2 gate (F&B):** Do not start [`../archive/fb-pos-brd-phase2.md`](../archive/fb-pos-brd-phase2.md) work until **all** are true:
- [ ] 50+ paying merchants on service vertical
- [ ] Monthly churn <8% for 3 consecutive months
- [ ] HitPay integration stable in production (Phase 1B)
- [ ] Founders agree bandwidth exists beyond support load

---

## 9. Revenue Expectations (Phase 1)

From [`initial-brd.md`](initial-brd.md) base case — Phase 1 only:

| | Target |
| :--- | :--- |
| Month 5 | 10 merchants → ~RM1k+ MRR |
| Month 10 | 50 merchants → ~RM6.8k MRR (mostly SaaS) |
| Year 1 ARR | ~RM82k (SaaS-heavy; payments ramp H2) |

Primary revenue in Phase 1A is **SaaS**, not payment fees.

---

## 10. GTM (Phase 1)

| Channel | Action |
| :--- | :--- |
| Direct | TikTok/IG — barber/salon content; App Store ASO |
| Referral | 1 month free after referee pays 1 month (bill credit) |
| Pilot | 3–5 salons in one city; hands-on onboarding |
| **Not in Phase 1** | Accountant channel, franchise BD, mall bundles |

**Pitch:** *"Booking QR + POS barbershop — dari RM109/bulan. Murah dari StoreHub. Tak perlu beli mesin."*

---

## 11. Document Map

| Document | Role |
| :--- | :--- |
| **[`../financial/ssot.md`](../financial/ssot.md)** | **Financial SSOT** — forecasts, metrics, cashflow |
| **[`../product/features-and-packages.md`](../product/features-and-packages.md)** | Feature catalog, pricing & feature gates |
| **[`../product/barbershop-spec.md`](../product/barbershop-spec.md)** | Product rules — states, policies, roles |
| **[`../product/engineering-modules.md`](../product/engineering-modules.md)** | Backend modules & APIs |
| **[`../design/ui-specification.md`](../design/ui-specification.md)** | IA + all screen specs |
| **`phase1-plan.md`** | Execution contract — timeline & gates |
| **`initial-brd.md`** | Business strategy & pricing narrative |
| **[`../archive/fb-pos-brd-phase2.md`](../archive/fb-pos-brd-phase2.md)** | Phase 2 F&B — **parked**, do not implement |

---

## 12. Phase 2 Preview (not scheduled)

When PMF gate passes, [`../archive/fb-pos-brd-phase2.md`](../archive/fb-pos-brd-phase2.md) v0.9 will require:
- MVP cut (no shared table v1, single store, managed auth, e-invoice, payment rail)
- Reuse Phase 1 backend: auth, billing, MyInvois, payment rail, reporting
- New modules: customer web, kitchen, table QR, F&B order modes

Estimated additional effort: 6–10 months on top of Phase 1 platform — not a greenfield rewrite.

---

*Approved: Path A. Build the salon wedge. Park F&B.*
