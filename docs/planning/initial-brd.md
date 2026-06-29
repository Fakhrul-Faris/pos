# Business Proposal & Strategic Roadmap: Payments-Native Queue OS for Malaysian Service SMEs

> **Active track:** Path A (bootstrap). Phase 1 execution: see [`phase1-plan.md`](phase1-plan.md).  
> F&B requirements in [`../archive/fb-pos-brd-phase2.md`](../archive/fb-pos-brd-phase2.md) are **parked until Phase 2** (50+ paying merchants gate).

## 1. Executive Summary

This document outlines the business strategy, product positioning, and financial projections for a bootstrapped Point of Sale (POS) platform built for the Malaysian market.

Built by a two-person founding team (Business/UI and Technical Development), the platform uses a **Bring Your Own Device (BYOD)** model to eliminate hardware lock-in and manual onboarding. Rather than competing head-on with incumbents like StoreHub on feature breadth, we launch as **the payments-native, LHDN-ready queue OS for service SMEs** — barbers, salons, clinics, and pop-ups — then expand into single-counter F&B and multi-branch franchises.

**Revenue model:** SaaS subscription (primary at launch) + optional payment processing margin + high-margin add-ons. Merchants may always complete orders via cash or their own bank DuitNow QR at zero variable fee. Platform fees apply **only** to transactions through our dynamic DuitNow QR — merchants adopt because it saves time, not because we block checkout.

---

## 2. Positioning & Competitive Advantage

### Target Wedge (Launch)
| Phase | Vertical | Why |
| :--- | :--- | :--- |
| **Phase 1 (MVP)** | Barbers, salons, clinics, pop-ups | Queue/waitlist is the daily pain; low inventory complexity; underserved by F&B-heavy incumbents |
| **Phase 2** | Single-counter cafés, small retail | Natural expansion once queue + payments + e-invoice are proven |
| **Phase 3** | Multi-branch F&B, franchises | HQ dashboard and per-branch pricing unlock enterprise ARPU |

### Core Differentiators
* **BYOD:** Merchants use existing iPads, Android tablets, or smartphones. No RM2,000+ hardware bundles required.
* **Self-Onboarding:** Download, create account, start operating in minutes. No setup fees or sales calls required for Ocelot+.
* **Queue-First Architecture:** Waitlists, appointment numbering, and walk-in queues — not a bolt-on to a retail POS.
* **LHDN-Ready from Day One:** MyInvois e-invoice sync included on Pro tier — compliance as acquisition hook, not a premium gate.
* **Smart DuitNow QR (optional):** Dynamic QR via licensed partner (Phase 1B) — amount pre-filled, payment auto-matches to order. Merchants keep their existing bank QR for cash/other; ours wins on reconciliation, not coercion.
* **Accountant & Franchise Channels:** Multi-outlet dashboard and read-only accountant access built for distribution, not just direct signup.

### What We Are Not (at Launch)
* Not a broad "POS for everyone" StoreHub replacement
* Not dependent on merchants honestly self-reporting sales volume
* Not blocking checkout unless the customer pays through our QR
* Not selling hardware bundles or field-installation services

---

## 3. Product & Pricing Strategy

> **Barbershop packages (Phase 1):** Full feature matrix in [`../product/features-and-packages.md`](../product/features-and-packages.md).

### Launch tiers — Ocelot / Mantis / Patriot

| | **Ocelot** | **Mantis** | **Patriot** |
| :--- | :--- | :--- | :--- |
| **Price** | **RM109/mo** | **RM199/mo** | **RM349/mo** |
| **Annual** | RM1,090/yr | RM1,990/yr | RM3,490/yr |
| **vs StoreHub** | Starter RM122 | Advanced RM235 | Pro RM471 |
| **Target** | 2–4 chairs (3-barber shop) | HitPay + 8 barbers · 2 locations | Multi-branch |
| **Trial** | 14-day full Ocelot → Lite or subscribe | — | — |

**Ocelot Lite (RM0):** post-trial exit only — 1 barber, 25 bookings/mo, QR stays live. Not a signup tier.

**Founding barber:** RM89/mo locked — first 50 shops per city.

### Limits summary

| Limit | Lite | Ocelot |
| :--- | :--- | :--- |
| Barber profiles | 1 | 4 (+RM19/mo extra from 9th on Mantis+) |
| POS terminals | 1 shared | 1 shared (+RM29 extra) |
| Online bookings/mo | 25 | Unlimited |
| Services in menu | 15 | Unlimited |

### Feature bundle summary

| Bundle | Included |
| :--- | :--- |
| **Ocelot Lite** | QR booking (25/mo), walk-in POS, 1 barber, receipt link, cash/own DuitNow — trial exit |
| **Ocelot** | + 4 barbers, unlimited bookings, calendar, caps, pick barber, reports, CSV, full offline |
| **Mantis** | + HitPay QR/card, auto-reconcile, 8 barbers, 2 locations, priority WhatsApp |
| **Patriot** | + multi-branch HQ, unlimited barbers, SLA |

**Not in v1:** SMS, e-invoice (except Patriot track later), loyalty.

See [`../product/features-and-packages.md`](../product/features-and-packages.md) for the full comparison table.

### Payment & Revenue Architecture

**Phase 1A (MVP launch):** SaaS-only. No variable GMV fee. Checkout supports cash and manual payment confirmation (merchant's own DuitNow QR or cash).

**Phase 1B (Months 4–8):** Optional **Mantis + HitPay** — partner-integrated QR + card tap on phone. **2% service fee paid by customer** on HitPay rails. Cash and merchant's own static bank QR remain **exact subtotal, RM0** platform fee.

| Revenue Stream | Rate | Notes |
| :--- | :--- | :--- |
| **HitPay platform net** | ~0.8% of service subtotal | Customer pays 2% surcharge; Mantis+ only |
| **SaaS subscription** | RM109–349/mo | Ocelot / Mantis / Patriot |
| **Mantis payment rail** | RM199/mo incl. HitPay | No merchant processing fee on our rail |
| **Per-branch fee** | RM49–79/branch/mo | Verifiable, scales with merchant growth |
| **Per-device fee** | RM29/device/mo | Beyond plan allowance |
| **Add-ons** | RM39–99/mo | SMS campaigns, loyalty, accountant pack, priority support |
| **Annual prepay** | 10 months for 12 | Target 40% annual adoption by Year 2 |

**Removed:** Prepaid credit wallet with 1% honor-system deduction. Replaced by opt-in payment rail with fee only on auditable transactions.

**Explicit design rule:** We never block order completion for non-platform payments. Merchants who use their own QR pay SaaS only — no evasion war, no POS lockouts.

---

### DuitNow QR Strategy: Why Merchants Use Ours

#### The Malaysian Reality

Most SMEs already have a **static DuitNow QR** from their bank (Maybank, CIMB, Touch 'n Go, etc.). Customers scan, manually enter the amount, and funds go 100% to the merchant. We cannot prevent this — and we do not try.

Our dynamic QR must **earn its place** by solving daily pain that a bank QR cannot.

#### Why Merchants Need (and Will Choose) Our QR

| Pain with static bank QR | What our dynamic QR does |
| :--- | :--- |
| Customer enters **wrong amount** (RM45 vs RM54) | Amount is **pre-filled** from the POS order — no typing |
| Staff checks phone **50×/day** to confirm payment | Payment received → order **auto-completes** — no bank app scrolling |
| No link between payment and order | Every ringgit **matched to a specific order** in the system |
| End-of-day reconciliation is manual | **Paid vs unpaid report** — close shop in minutes, not an hour |
| E-invoice is a separate manual step | E-invoice can **auto-issue on QR payment** (Pro tier) |
| Loyalty points / visit history breaks | Points and CRM update **only on matched payments** — incentive to use platform QR |
| Disputes ("I already paid") | Timestamped payment proof tied to order number |

**Merchant pitch (BM):** *"Guna QR kami — customer tak perlu taip amount, tak payah check phone setiap kali. Payment masuk, order siap automatik."*

We sell **time saved and fewer disputes**, not a tax on sales.

#### What We Deliberately Do Not Do

| Anti-pattern | Why we avoid it |
| :--- | :--- |
| Block "Complete" unless platform QR is used | Merchants mark everything as "Cash" and churn |
| Lock POS when wallet balance is low | Creates resentment; bank QR workaround is instant |
| Charge fee on cash or merchant's own QR | Undetectable; breeds distrust |
| Force payment rail at signup | Kills conversion; SaaS must work standalone |

#### Checkout Flow (Phase 1B — HitPay)

```
Order ready: RM40 haircut
┌─────────────────────────────────────────────────────────┐
│  [HitPay QR]  ← DEFAULT, highlighted                    │
│   Prefilled DuitNow · customer pays RM40.80 (RM40 + 2%) │
│   Auto-complete on webhook                              │
├─────────────────────────────────────────────────────────┤
│  [HitPay card tap]                                      │
│   Tap to pay on phone · same 2% on customer             │
├─────────────────────────────────────────────────────────┤
│  [Cash]                                                 │
│   Staff confirms · RM40.00 · no platform fee            │
├─────────────────────────────────────────────────────────┤
│  [Own DuitNow / Bank QR]                                │
│   Customer paid via merchant's own static QR            │
│   Staff manually confirms · RM40.00 · no platform fee   │
│   ⚠ "Not auto-reconciled" — shown in daily report       │
└─────────────────────────────────────────────────────────┘
```

All paths complete the order. HitPay is the **recommended default**; cash and own QR are first-class options. **Merchant never pays a processing fee** on our rail.

#### Incentives to Adopt HitPay (Carrot, Not Stick)

| Incentive | Detail |
| :--- | :--- |
| **Zero merchant fee** | Customer pays 2% service fee — shop keeps full subtotal |
| **Auto reconcile** | Payment received → order auto-completes |
| **Stamps on paid visit** | Loyalty updates on matched HitPay payments |
| **Reconciliation dashboard** | "RM1,840 unmatched orders this week" — visibility, not punishment |
| **Accountant view** | Discrepancies visible to invited accountant (soft social pressure) |

#### Realistic Payment Rail Adoption

We plan for **partial adoption**, not 100% GMV through our rail.

| Stage | Merchants on platform QR | Share of their GMV via our QR |
| :--- | :--- | :--- |
| Year 1 H1 (SaaS only) | 0% | — |
| Year 1 H2 (payments live) | 25–35% of paying merchants | ~40–50% of their GMV |
| Year 2 | 50–60% | ~50–60% of GMV |
| Year 3 | 60–70% | ~55–65% of GMV |

Organised salons and busy clinics adopt fastest. Solo barbers on low volume may stay on cash/manual — they still pay SaaS.

#### Soft Anti-Evasion (No Hard Locks)

| Signal | Action |
| :--- | :--- |
| High % of "Cash" / "Own DuitNow" vs peer benchmark | In-app nudge: "Salons like yours save ~45 min/day with HitPay" |
| Unmatched order report | Daily/weekly summary for merchant and accountant |
| Franchise HQ (Phase 3) | HQ dashboard flags outlets with low platform QR adoption |
| Onboarding | Day-3 and day-10 checklist showing reconciliation time saved |

### High-Margin Add-Ons (Year 1–2)

| Add-On | Price | Target Attach Rate |
| :--- | :--- | :--- |
| SMS reminders & campaigns | RM79/mo or RM0.10/SMS | 25–30% |
| Loyalty points engine | RM49/mo | 15–20% |
| Accountant read-only pack | RM49/mo | 10–15% |
| Priority WhatsApp support | RM99/mo | 10% |
| Extra e-invoices (>500/mo on Pro) | RM0.10/invoice | 5% |

### Free Tier Policy
* **No perpetual free signup.** 14-day **full Ocelot trial** → subscribe or **Ocelot Lite** (capped; QR stays live).
* **Lite is not marketed** — automatic trial exit ramp only.
* **Founding barber:** RM89/mo locked — first 50 shops per city.

---

### Pricing Narrative & Merchant-Facing Copy

> **Full feature matrix:** [`../product/features-and-packages.md`](../product/features-and-packages.md)

#### Internal Pricing Logic

| Line | What merchant pays | What it covers |
| :--- | :--- | :--- |
| **1. Ocelot** | RM109/mo | Booking, POS, calendar, 4 barbers |
| **2. Mantis** | RM199/mo | Ocelot + HitPay + reconcile + 8 barbers |
| **3. Patriot** | RM349/mo | Multi-branch HQ |
| **4. Add-ons** | RM15–99/mo | Extra barber, priority support |

Barbershop v1: **no SMS, no e-invoice** in Ocelot/Mantis.

#### Merchant-Facing Copy (English)

**Ocelot — RM109/month** — up to 4 barbers, full calendar, unlimited bookings. *Below StoreHub RM122.*  
**Mantis — RM199/month** — Ocelot + HitPay auto-reconcile. *Below StoreHub RM235.*  
**Patriot — RM349/month** — multi-branch command centre.

#### Merchant-Facing Copy (BM)

**Ocelot — RM109/bulan** — 4 barber, calendar penuh, booking tanpa had. Murah dari StoreHub.  
**Mantis — RM199/bulan** — HitPay auto rekod; customer bayar 2%, cash & QR bank sendiri RM0 untuk kedai.  
**Patriot — RM349/bulan** — untuk rangkaian cawangan.

#### FAQ (short)

**"Must I use HitPay?"** — No. Cash and your bank DuitNow QR are always free (exact subtotal).  
**"Fee on all sales?"** — No. **2% service fee on HitPay only** — paid by customer, not merchant.  
**"Receipt?"** — Link on phone + QR at counter. No SMS in v1.  
**"After trial?"** — Shop keeps running on Lite. Upgrade when you need barber 3+ or calendar.

#### Pricing Decision Tree

```
14-day full Ocelot trial
    → Day 14: subscribe or Ocelot Lite (1 barber, 25 bookings/mo)
    → 3+ barbers / calendar? → Ocelot RM109
    → Want HitPay reconcile? → Mantis RM199
    → Multi-branch? → Patriot RM349
```

---

## 4. Go-To-Market Strategy

### Phase 1 — Direct + Vertical (Months 0–12)
* App Store / Play Store listing optimized for "salon POS", "barber queue", "e-invoice POS Malaysia"
* TikTok / Instagram content targeting barbershop and salon owners
* Referral loop: referrer gets **1 month free** after referee pays **1 month** (bill credit)
* Target: **80–150 paying merchants** in one vertical

### Phase 2 — Channel GTM (Months 12–24)
| Channel | Model | Why It Scales |
| :--- | :--- | :--- |
| Accounting firms | RM20/mo rev-share per referred client | Every SME client needs e-invoice compliance |
| Franchise consultants | One deal = 10–50 outlets | Enterprise ARPU without enterprise sales team |
| Mall / pasar management | Bundle tenant onboarding | Batch acquisition |
| Barbershop suppliers & distributors | Co-marketing | Built-in audience in launch vertical |

### Phase 3 — Geographic Expansion (Year 3+)
Malaysia PMF → Singapore (higher ARPU, similar compliance) → Indonesia (volume, lower ARPU, large TAM).

---

## 5. Financial Projections

> **SSOT for all financial planning:** [`../financial/ssot.md`](../financial/ssot.md) — assumptions, revenue/expense forecasts, SaaS metrics dashboard, cashflow engine.  
> Figures below are **summary only**; update forecasts in the SSOT, not here.

### Summary (base scenario — Ocelot / Mantis / Patriot)

| | Year 1 | Year 2 | Year 3 |
| :--- | :--- | :--- | :--- |
| Paying merchants (EoY) | 45 | 130 | 360 |
| ARR run-rate (EoY) | ~RM83k | ~RM275k | ~RM851k |
| COGS % of subs | ~12% | ~9% | ~7% |
| 2-founder comfortable salary | No | Partial (M18+) | Yes (M24–28) |

See SSOT §5–§9 for downside/venture scenarios and monthly Year 1 cashflow.

---

## 6. Competitive Landscape

| | Us (Pro) | StoreHub (Advanced) |
| :--- | :--- | :--- |
| Monthly SaaS | RM129 | RM196–249 |
| Payment fee | 2% customer surcharge (HitPay); ~0.8% platform net | 0.5–2% (tiered, their rail) |
| Hardware required | BYOD | Optional bundles RM2,199+ |
| E-invoicing | Included on Pro | Included |
| Queue / waitlist | Core product | Secondary feature |
| Best for (launch) | Barbers, salons, clinics | Established F&B, multi-store retail |

**We win on:** vertical focus, queue UX, BYOD simplicity, lower entry price, self-serve onboarding.
**We lose on (today):** brand trust, feature depth, multi-location maturity, support scale.

---

## 7. Moat & Durability Roadmap

| Helmer Power | Today | Year 2–3 Target |
| :--- | :--- | :--- |
| Counter-positioning | WEAK | MODERATE — BYOD + vertical focus incumbents won't prioritize |
| Switching costs | WEAK | MODERATE — inventory, CRM, loyalty, e-invoice history |
| Process power | WEAK | MODERATE — salon/barber onboarding playbook, accountant channel |
| Scale economies | WEAK | MODERATE — payment volume reduces partner costs |
| Network effects | FANTASY | WEAK — franchise HQ network, accountant referral loop |
| Branding | FANTASY | WEAK — known in one vertical |
| Cornered resource | FANTASY | WEAK — payment data + vertical workflow depth |

**Venture-scale moat requires:** payment rail ownership, franchise logos, and compliance workflow lock-in — not features alone.

---

## 8. MVP Development Sprint

> **Detailed execution contract:** [`phase1-plan.md`](phase1-plan.md) · **Module spec:** [`../product/engineering-modules.md`](../product/engineering-modules.md)

**Scope:** Lite + Pro tiers only. Launch vertical: barbers, salons, clinics, pop-ups.

### Core MVP Deliverables (Phase 1A — Months 0–4)
1. **Queue System:** Walk-in numbering, waitlist display, estimated wait time, basic booking.
2. **Core POS:** Service menu, flat-price checkout, receipt generation (print + digital).
3. **LHDN E-Invoice:** MyInvois API integration — issue validated e-invoice on request at checkout.
4. **Offline Resilience:** Queue and transact locally when Wi-Fi drops; sync on reconnect.
5. **Self-Onboarding:** Account creation, business profile, plan selection, 14-day trial flow.
6. **Basic Reporting:** Daily sales summary, transaction export.

### Phase 1B Deliverables (Months 4–8)
7. **HitPay integration:** QR + card tap — amount pre-filled, 2% customer surcharge, auto-reconcile.
8. **Multi-path checkout:** HitPay (default) / Cash / Own DuitNow — all complete order; no forced rail.
9. **Reconciliation dashboard:** Paid vs unmatched orders; daily summary for merchant and accountant.
10. **SMS Reminders:** Appointment and queue notifications (add-on).
11. **Accountant Read-Only Access:** Invite accountant, multi-client view.
12. **Referral System:** **1 month free** for referrer after referee pays **1 month** (bill credit).

### Explicitly Out of MVP Scope
* Multi-branch / franchise HQ dashboard
* Composite ingredient inventory
* Table layout / F&B floor plan
* Loyalty points engine
* GrabFood / delivery integrations
* Embedded finance / merchant lending

---

## 9. Risk Register

| Risk | Severity | Mitigation |
| :--- | :--- | :--- |
| Merchants bypass platform QR to avoid fees | High | Never block checkout; sell reconciliation value; fee only on opt-in QR; SaaS sustains revenue |
| Payment partner dependency | High | Evaluate 2+ aggregators; SaaS revenue sustains if payments delayed |
| StoreHub copies queue UX | Medium | Move fast in vertical; build accountant + franchise channel |
| Support overload at scale | High | Scope to one vertical; limit channels; hire support at 100+ merchants |
| E-invoice API changes (LHDN) | Medium | Abstract integration layer; monitor Hasil announcements |
| Low trial → paid conversion | High | Onboarding checklist, day-3 / day-10 nudges, vertical-specific templates |
| Two-person bandwidth | High | Ruthless MVP scope; no Phase 2 features until 50 paying merchants |

---

## 10. Success Milestones

| Milestone | Target Date | Criteria |
| :--- | :--- | :--- |
| MVP launch | Month 4 | Lite + Pro live on App Store / Play Store |
| First 10 paying merchants | Month 5 | RM490+ MRR from SaaS |
| Payment rail live | Month 8 | Dynamic DuitNow QR live; multi-path checkout; first processing revenue |
| 50 paying merchants | Month 10 | RM5k+ MRR, <8% monthly churn |
| Accountant channel live | Month 12 | 3+ firm partnerships, 10+ referred merchants |
| 140 paying merchants (base Y2) | Month 24 | RM33k+ MRR, >50% of merchants opted into platform QR |
| First franchise deal | Month 18–24 | 5+ outlets on single HQ account |

---

*Document prepared for internal strategy and development alignment.*
*Last updated: June 2025 — Path A adopted; Phase 1 execution in `phase1-plan.md`.*
