# Miki — Documentation Index

**Company & product:** **Miki**  
**Phase 1 module:** Barbershop — QR booking + shared POS (Path A). F&B parked in [`archive/`](archive/).

## Quick start

| I need to… | Read |
| :--- | :--- |
| Understand what Miki is | This page + [`planning/initial-brd.md`](planning/initial-brd.md) |
| **Barbershop (anything)** | **[`modules/barbershop/README.md`](modules/barbershop/README.md)** ← start here |
| Barbershop product rules & state machine | [`modules/barbershop/spec.md`](modules/barbershop/spec.md) |
| Trial → Lite → paid (barbershop) | [`modules/barbershop/pricing-funnel.md`](modules/barbershop/pricing-funnel.md) |
| Features, packages & pricing tiers | [`modules/barbershop/features-and-pricing.md`](modules/barbershop/features-and-pricing.md) |
| Marketing copy & landing page | [`modules/barbershop/marketing.md`](modules/barbershop/marketing.md) |
| Design or build a barbershop screen | [`modules/barbershop/ui.md`](modules/barbershop/ui.md) |
| Universal platform (all verticals) | [`platform/README.md`](platform/README.md) |
| Pricing model (no RM prices) | [`platform/pricing-model.md`](platform/pricing-model.md) |
| Design tokens | [`platform/design-system/tokens.json`](platform/design-system/tokens.json) |
| Backend modules & APIs | [`product/engineering-modules.md`](product/engineering-modules.md) |
| Plan timeline & milestones | [`planning/phase1-plan.md`](planning/phase1-plan.md) |
| Financial forecasts & cashflow | [`financial/ssot.md`](financial/ssot.md) |

## Folder structure

```
docs/
├── README.md                      ← you are here
├── platform/                      UNIVERSAL — all verticals
│   ├── README.md
│   ├── architecture.md            Core vs country adapters
│   ├── pricing-model.md           Trial → Lite → paid mechanics
│   ├── payment-rails.md           HitPay aggregator (internal)
│   └── design-system/
│       ├── README.md
│       └── tokens.json            Design token SSOT
├── modules/
│   └── barbershop/                BARBERSHOP SSOT
│       ├── README.md              Module hub — start here
│       ├── spec.md                Product rules
│       ├── pricing-funnel.md      Trial → Lite → paid (barbershop)
│       ├── features-and-pricing.md Feature catalog + tiers
│       ├── ui.md                  Customer / POS / Owner screens
│       ├── marketing.md           /barbershop landing copy
│       └── financial.md           Barbershop pricing assumptions
├── product/
│   └── engineering-modules.md     Backend modules (eng-owned)
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
