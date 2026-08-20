# Miki — Documentation Index

**Company & product:** **Miki**  
**Phase 1 module:** Barbershop — QR booking + shared POS (Path A). F&B parked in [`archive/`](archive/).

## Quick start

| I need to… | Read |
| :--- | :--- |
| **Build the product (backend, HitPay, billing)** | **[`requirements.md`](requirements.md)** ← engineering PRD (Round 26) |
| **HitPay questions still open** | [`open-hitpay.md`](open-hitpay.md) |
| **Give an AI full Miki context** | [`for-ai.md`](for-ai.md) |
| Understand what Miki is | This page + [`planning/initial-brd.md`](planning/initial-brd.md) |
| **Barbershop screens / UX** | **[`modules/barbershop/README.md`](modules/barbershop/README.md)** |
| Barbershop product rules & state machine | [`modules/barbershop/spec.md`](modules/barbershop/spec.md) |
| Trial → Lite → paid (barbershop) | [`modules/barbershop/pricing-funnel.md`](modules/barbershop/pricing-funnel.md) |
| Features, packages & pricing tiers | [`modules/barbershop/features-and-pricing.md`](modules/barbershop/features-and-pricing.md) |
| Marketing copy & landing page | [`modules/barbershop/marketing.md`](modules/barbershop/marketing.md) |
| Comparison page (vs Fresha) | [`modules/barbershop/compare.md`](modules/barbershop/compare.md) |
| Design or build a barbershop screen | [`modules/barbershop/ui.md`](modules/barbershop/ui.md) |
| Universal platform (all verticals) | [`platform/README.md`](platform/README.md) |
| Pricing model (no RM prices) | [`platform/pricing-model.md`](platform/pricing-model.md) |
| Design tokens | [`platform/design-system/tokens.json`](platform/design-system/tokens.json) |
| Schema dump | [`db-schema.json`](db-schema.json) |
| Backend module IDs | [`product/engineering-modules.md`](product/engineering-modules.md) |
| Plan timeline & milestones | [`planning/phase1-plan.md`](planning/phase1-plan.md) |
| GTM strategy (bootstrapped, viral loop) | [`planning/gtm-strategy.md`](planning/gtm-strategy.md) |
| AI / AEO marketing strategy | [`planning/aeo-strategy.md`](planning/aeo-strategy.md) |
| Financial forecasts & cashflow | [`financial/ssot.md`](financial/ssot.md) |

## Folder structure

```
docs/
├── README.md                      ← you are here
├── for-ai.md                      ← compiled context for LLMs
├── requirements.md                ENGINEERING PRD (Round 26)
├── open-hitpay.md                 HitPay questions still unanswered
├── db-schema.json                 Schema dump (not all built)
├── platform/                      UNIVERSAL — all verticals
│   ├── README.md
│   ├── architecture.md            Core vs country adapters
│   ├── pricing-model.md           Trial → Lite → paid mechanics
│   ├── payment-rails.md           HitPay notes (see requirements.md for build rules)
│   └── design-system/
│       ├── README.md
│       └── tokens.json            Design token SSOT
├── modules/
│   └── barbershop/                BARBERSHOP UI / PRODUCT
│       ├── README.md              Module hub — start here for screens
│       ├── spec.md                Product rules (UX)
│       ├── pricing-funnel.md      Trial → Lite → paid (barbershop)
│       ├── features-and-pricing.md Feature catalog + tiers
│       ├── ui.md                  Customer / POS / Owner screens
│       ├── marketing.md           /barbershop landing copy
│       └── financial.md           Barbershop pricing assumptions
├── product/
│   └── engineering-modules.md     Backend module IDs
├── design/
│   ├── copy-style.md              Copy voice & replication guide
│   ├── marketing-copy.md          Hub + all verticals marketing
│   ├── web-structure.md           Sitemap, routing
│   ├── penpot-setup.md            Penpot MCP + library
│   └── references/                Design research
├── financial/
│   └── ssot.md                    Company forecasts & assumptions
├── planning/
│   ├── phase1-plan.md             Execution contract & PMF gate
│   └── initial-brd.md             Business strategy
└── archive/
    └── fb-pos-brd-phase2.md       F&B Phase 2 (parked)
```

**Moved docs:** Old paths under `product/` and `design/` redirect to `platform/` or `modules/barbershop/`.

## Naming

| Term | Meaning |
| :--- | :--- |
| **Miki** | Company name and platform / product name |
| **Ocelot / Mantis / Patriot / Arsenal** | Subscription plan tiers (not the product name) |
| **Ocelot Lite** | Free post-trial tier — not a signup plan |
| **Barbershop module** | Phase 1 vertical on Miki |

## Surfaces

| Surface | Screen IDs | Document |
| :--- | :--- | :--- |
| Customer web | C-xx | [`modules/barbershop/ui.md`](modules/barbershop/ui.md) Part 1 |
| Shared POS | P-xx | [`modules/barbershop/ui.md`](modules/barbershop/ui.md) Part 2 |
| Owner web | O-xx | [`modules/barbershop/ui.md`](modules/barbershop/ui.md) Part 3 |
