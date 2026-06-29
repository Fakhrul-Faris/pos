# Documentation Index

**Phase 1 product:** Barbershop QR booking + shared POS (Path A). F&B is parked in [`archive/`](archive/).

## Quick start

| I need to… | Read |
| :--- | :--- |
| Understand product rules & state machine | [`product/barbershop-spec.md`](product/barbershop-spec.md) |
| Pick features for a package / pricing page | [`product/features-and-packages.md`](product/features-and-packages.md) |
| Design or build a screen | [`design/ui-specification.md`](design/ui-specification.md) |
| Build backend modules & APIs | [`product/engineering-modules.md`](product/engineering-modules.md) |
| Plan timeline & milestones | [`planning/phase1-plan.md`](planning/phase1-plan.md) |
| Business strategy & narrative | [`planning/initial-brd.md`](planning/initial-brd.md) |
| Financial forecasts & cashflow | [`financial/ssot.md`](financial/ssot.md) |

## Folder structure

```
docs/
├── README.md                 ← you are here
├── product/                  Product definition & engineering
│   ├── barbershop-spec.md    Authoritative rules, states, roles
│   ├── features-and-packages.md   Feature catalog + Ocelot/Mantis/Patriot pricing
│   ├── platform-architecture.md   Universal core vs country adapters
│   └── engineering-modules.md     Backend modules & APIs
├── design/
│   └── ui-specification.md   IA + Customer / POS / Owner screens
├── financial/
│   └── ssot.md               Costing, forecasts, SaaS metrics (SSOT)
├── planning/
│   ├── phase1-plan.md        Execution contract & PMF gate
│   └── initial-brd.md        Business strategy
└── archive/
    └── fb-pos-brd-phase2.md  F&B Phase 2 (parked)
```

## Surfaces

| Surface | Screen IDs | Section in UI spec |
| :--- | :--- | :--- |
| Customer web | C-xx | Part 1 |
| Shared POS | P-xx | Part 2 |
| Owner web | O-xx | Part 3 |
