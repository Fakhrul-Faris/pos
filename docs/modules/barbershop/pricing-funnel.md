# Miki Barbershop — Pricing Funnel Explained

**Module hub:** [`README.md`](README.md)  
**Read this first** if `features-and-pricing.md` feels dense.  
**Full feature matrix:** [`features-and-pricing.md`](features-and-pricing.md) Part 2  
**Universal pricing mechanics:** [`../../platform/pricing-model.md`](../../platform/pricing-model.md)  
**Locked price numbers:** [`financial.md`](financial.md) · [`../../financial/ssot.md`](../../financial/ssot.md) §1.1

**Last updated:** 2 July 2026 · **Payment rail:** Option **C′** — Lite cap · Ocelot+ unlimited · Mantis+ reconcile

---

## One sentence

Sign up → **14 days of full Ocelot (free)** → pay for a plan, or **automatically drop to Lite (free forever)**.

---

## Naming cheat sheet

| Term | What it is | What it is *not* |
| :--- | :--- | :--- |
| **Miki** | Company + platform | A plan tier |
| **Ocelot** | Paid starter plan (RM109/mo) | The product name |
| **Ocelot Lite** | Free tier **after trial only** | A signup option you market |
| **Trial** | Temporary full Ocelot | Lite with extra days |
| **Mantis / Patriot** | Higher paid plans | Required to start |

---

## Payment rail at a glance (C′)

| Tier | HitPay on Miki rail | Reconcile dashboard |
| :--- | :--- | :--- |
| **Trial** | No | — |
| **Lite** | **RM5k/mo cap** · 2% customer fee | No |
| **Ocelot** | **Unlimited** · 2% customer fee | No |
| **Mantis+** | Unlimited · 2% customer fee | **Yes** |

**Rule:** *Paid Ocelot always beats free Lite on payment volume.* Mantis sells **reconcile + scale**, not “turn on payments.”

Cash + own DuitNow: **RM0** on every tier.

---

## The funnel (visual)

```
┌─────────────┐
│  Sign up    │
└──────┬──────┘
       ▼
┌─────────────────────────────────────┐
│  TRIAL — 14 days (+7 if QR printed) │
│  Full Ocelot · No HitPay              │
└──────┬──────────────────────────────┘
       │
       ▼ Day 14
   ┌───┴───┐
   │       │
   ▼       ▼
┌──────┐  ┌──────────────────────────┐
│ PAY  │  │ LITE — RM0 forever       │
│Ocelot│  │ 1 barber · 25 bookings   │
│      │  │ HitPay cap RM5k/mo       │
│Mantis│  └──────────┬───────────────┘
└──────┘             │
                     │ hits wall
                     ▼
              Ocelot / Mantis
```

---

## Stage 1 — Free trial

**Goal:** Let the merchant run their **real shop** before paying.

| | |
| :--- | :--- |
| **Duration** | 14 days. **+7 days** if they print/post shop QR during trial. |
| **Plan equivalent** | **Full Ocelot** — not a watered-down demo. |
| **HitPay** | **No** during trial (same as pre–Phase 1B or trial without rail). |
| **Card** | Not required to start. |

### Trial rules

- **1 trial per phone** — 12-month cooldown.
- **Day 10 & 14 emails** — remind that barber 3 + calendar pause unless they subscribe.
- **Customer QR never stops** — even after downgrade to Lite.

### Day 15

- **Subscribed** → Ocelot / Mantis / Patriot.
- **Not subscribed** → **Ocelot Lite** automatically.

---

## Stage 2 — Ocelot Lite (RM0)

**Goal:** Keep the shop alive; make multi-chair operation and unlimited rail uncomfortable enough to upgrade.

### Critical rule

> **Lite is not a signup tier.** Merchants only land here after trial if they don’t pay.

### What Lite includes

| Included | Why it matters |
| :--- | :--- |
| **1 barber** | Solo operator |
| **25 online bookings / month** | Light QR volume |
| **Walk-ins on POS — unlimited** | Counter always works |
| **Shop QR + status page live** | Trust — links keep working |
| **Cash + own DuitNow** | RM0 platform fee |
| **HitPay (capped)** | **RM5k/mo** on rail · 2% customer fee · auto-close · **no reconcile** |
| **Basic offline + basic sales summary** | |

### What Lite gates (→ **Ocelot**)

| Gated | Why |
| :--- | :--- |
| **Barbers 2–4** | 3-chair shop can’t run |
| **Unlimited online bookings** | Cap at 25/mo |
| **Calendar, caps, pick barber, reports** | Real shop ops |
| **Unlimited HitPay on rail** | **RM5k cap** — upgrade to **Ocelot** |

### What Lite gates (→ **Mantis**)

| Gated | Why |
| :--- | :--- |
| **Reconciliation dashboard** | End-of-day payment board |

*Most merchants who hit the RM5k rail cap upgrade to **Ocelot** (RM109) for unlimited pay — not Mantis — unless they also need reconcile.*

### Grandfather rules

- **Bookings #26+** blocked until next month or Ocelot.
- **HitPay over RM5k** in month: in-flight complete; **new HitPay blocked** until next month or **Ocelot** upgrade. Cash/DuitNow OK.

---

## Stage 3 — Paid plans

| Plan | Monthly | For |
| :--- | :--- | :--- |
| **Ocelot** | RM109 | 2–4 chairs · **unlimited HitPay** · no reconcile |
| **Mantis** | RM199 | **Reconcile** · 8 barbers · 2 locations · commission |
| **Patriot** | RM349 | Multi-branch · HQ · MyInvois |

**Founding:** RM89/mo locked — first 50 barbershops per city on Ocelot.

### Upgrade ladder

| From → To | Merchant thought |
| :--- | :--- |
| **Lite → Ocelot** | *“3 barbers — or I hit RM5k on the rail.”* |
| **Ocelot → Mantis** | *“I need reconcile + more chairs.”* |
| **Lite → Mantis** | *Rare — wants reconcile without Ocelot first* |
| **Mantis → Patriot** | *“Branches — one dashboard.”* |

---

## Common confusions

### “Is paying Ocelot worse than free Lite on payments?”

**No (C′ fix).** Lite = **capped** rail. Ocelot = **unlimited** rail. Both lack reconcile until Mantis.

### “Where do integrated payments fit?”

See **Payment rail at a glance** above.

### “Why cap Lite but not Ocelot?”

Lite is free SaaS — cap limits rail subsidy. Ocelot pays RM109 — unlimited rail is part of the value.

### “Why not HitPay on trial?”

Trial = full **shop ops** demo. Rail adds payout/KYC complexity; unlock after trial on Lite or on subscribe.

---

## Engineering enforcement

| Event | System action |
| :--- | :--- |
| Lite, HitPay GMV &gt; RM5k/mo | Block new HitPay; prompt **Ocelot** |
| Ocelot+ | Unlimited HitPay; no reconcile UI |
| Mantis+ | Unlimited HitPay + reconcile dashboard |

---

## Related docs

| Doc | Use when |
| :--- | :--- |
| [`../../platform/payment-rails.md`](../../platform/payment-rails.md) | Rail model · C′ gates |
| [`features-and-pricing.md`](features-and-pricing.md) Part 2 | Full matrix · in-app copy |
