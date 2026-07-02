# Miki Pricing Model — Universal

**Scope:** How Miki packages and sells subscriptions **across verticals**.  
**Not here:** RM prices, barber counts, booking caps — those live in each module (e.g. [`../modules/barbershop/features-and-pricing.md`](../modules/barbershop/features-and-pricing.md)).

**Payment rail philosophy:** [`payment-rails.md`](payment-rails.md) · **Barbershop numbers:** [`../modules/barbershop/pricing-funnel.md`](../modules/barbershop/pricing-funnel.md)

---

## One sentence

Sign up → **free trial on the paid starter tier** → subscribe to a paid plan, or **automatically drop to Lite (free forever)**.

---

## Naming (platform-wide)

| Term | What it is | What it is *not* |
| :--- | :--- | :--- |
| **Miki** | Company + platform | A plan tier |
| **Ocelot** | Paid starter plan | The product name |
| **Ocelot Lite** | Free tier **after trial only** | A signup option you market |
| **Trial** | Temporary full starter tier | Lite with extra days |
| **Mantis / Patriot / Arsenal** | Higher paid plans | Required to start |

Each **module** sets Ocelot/Mantis prices and what “full starter” includes for that business type.

---

## Funnel pattern (all verticals)

```
Sign up
   ▼
TRIAL — full paid-starter equivalent (no card required)
   ▼ Day N (module defines duration + bonuses)
   ┌───┴───┐
   ▼       ▼
 SUBSCRIBE   LITE — RM0 forever (automatic if no pay)
   │           │
   ▼           ▼ hits limits
 Paid tiers   Upgrade to paid
```

### Trial (universal rules)

| Principle | Typical implementation |
| :--- | :--- |
| **Real shop, not demo** | Trial = full starter-tier ops for that vertical |
| **No card to start** | Reduces signup friction |
| **Integrated rail optional on trial** | Rail adds KYC/payout complexity; module may defer HitPay until post-trial |
| **Customer-facing links stay live** | QR / booking URL works even after downgrade to Lite |
| **One trial per identity** | Cooldown period (module defines) |
| **Reminder emails** | Before trial end; module defines copy |

### Lite (universal rules)

| Principle | Detail |
| :--- | :--- |
| **Not a signup tier** | Merchants land here only after trial if they don’t subscribe |
| **Shop keeps running** | POS and core flows work — upgrade walls on scale features |
| **Free SaaS, capped value** | Limits on seats, volume, or integrated payments (module defines) |
| **Cash + own bank QR** | RM0 platform fee on all tiers |

### Paid ladder (universal)

| Tier role | Typical upgrade trigger |
| :--- | :--- |
| **Ocelot** | Multi-seat / unlimited volume / unlimited payment rail |
| **Mantis** | Reconciliation, commission, more locations |
| **Patriot** | Multi-branch HQ, bundled compliance |
| **Arsenal** | Enterprise, custom |

---

## Payment rail pattern (Option C′)

**Locked platform principle:** *Paid starter always beats free Lite on integrated payment volume.*

| Tier | Integrated rail (HitPay) | Reconcile dashboard |
| :--- | :--- | :--- |
| **Trial** | Usually off | — |
| **Lite** | **Capped** GMV · customer +2% fee | No |
| **Ocelot** | **Unlimited** · customer +2% fee | No |
| **Mantis+** | Unlimited · customer +2% fee | **Yes** |

**Cash + merchant’s own DuitNow:** exact subtotal, **RM0** platform fee on every tier.

Module docs define cap amounts (e.g. barbershop Lite RM5k/mo HitPay GMV). Full rail architecture: [`payment-rails.md`](payment-rails.md).

---

## Engineering enforcement (pattern)

| Event | System action |
| :--- | :--- |
| Lite, integrated GMV over cap | Block new integrated checkouts; prompt Ocelot upgrade |
| Ocelot+ | Unlimited integrated rail; no reconcile UI |
| Mantis+ | Unlimited rail + reconciliation dashboard |

Exact counters and feature flags are module-specific.

---

## Related

| Doc | Use when |
| :--- | :--- |
| [`../modules/barbershop/pricing-funnel.md`](../modules/barbershop/pricing-funnel.md) | Barbershop RM prices, limits, funnel copy |
| [`../modules/barbershop/features-and-pricing.md`](../modules/barbershop/features-and-pricing.md) | Full barbershop feature × tier matrix |
| [`payment-rails.md`](payment-rails.md) | HitPay aggregator, ledger, payouts |
| [`../financial/ssot.md`](../financial/ssot.md) | Company financial assumptions |
