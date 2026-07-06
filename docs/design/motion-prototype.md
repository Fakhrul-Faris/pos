# Miki Motion Prototype — Developer Reference

**Location:** [`prototype/motion/`](../../prototype/motion/)  
**Penpot motion boards:** Penpot file → **Motion** page  
**Design tokens:** [`../platform/design-system/tokens.json`](../platform/design-system/tokens.json) · [`../platform/design-system/themes/miki.css`](../platform/design-system/themes/miki.css)  
**Fluid UI principles:** [`10 Principles for Fluid UI.md`](10%20Principles%20for%20Fluid%20UI.md)  
**Screen specs:** [`../modules/barbershop/ui.md`](../modules/barbershop/ui.md)

Interactive React gallery for validating motion, layout transitions, and party-booking UX **before** shipping to Penpot frames and production apps. This is the coded SSOT for *feel*; Penpot is the SSOT for *layout*.

---

## Quick start

```bash
cd prototype/motion
npm install
npm run dev    # http://localhost:5173
npm run build  # typecheck + production bundle
```

No backend, auth, or routing — each nav item is an isolated demo component.

---

## Demo catalog

| Nav label | Component | Screen IDs | What it validates |
| :--- | :--- | :--- | :--- |
| **Customer booking** | `BookingFlow.tsx` | C-05 → C-06 | Per-person service tabs, party stepper, slot blocking by total duration, morph confirm, queue # roll |
| **Number flow** | `NumberFlowPayment.tsx` | P-07-01 | Wise-style barrel-roll digits; static prefix (RM / #) outside rolling field |
| **Button morph** | `MorphButton.tsx` | All primary CTAs | Idle → loading → success; hover/press anticipation on single scale channel |
| **Receipt + confetti** | `ReceiptPrinter.tsx` | P-08-01, C-08 | Paper slide, staggered lines, confetti burst; parameterized `lines` prop |
| **Card → detail** | `CardToDetail.tsx` | P-06-01 | Expand-in-place via shared `layoutId` (approved — no route change) |
| **Party assign** | `PosPartyAssign.tsx` | P-06-03, P-07-01 | Partial check-in, chair split, parallel cuts, no-show exclusion, payment + receipt |
| **Glass FAB** | `GlassFab.tsx` | P-06-02 | Blur overlay, +→× rotation, stagger menu (lower priority) |
| **Floating input** | `FloatingInput.tsx` | P-01, O-01 | Label lift on focus; supports controlled `value` / `onChange` |

---

## Motion tokens

**File:** `prototype/motion/src/motion/springs.ts`

| Token | Config | Use |
| :--- | :--- | :--- |
| `natural` | stiffness 280 · damping 28 · mass 0.9 | Default — buttons, cards, layout |
| `snappy` | 320 / 30 / 0.8 | Quick feedback, toggles |
| `gentle` | 240 / 30 / 1.0 | Large surfaces, drawers |
| `playful` | 320 / 22 / 0.85 | Celebration only (confetti adjacency) |

Stagger: `delay 0.06s`, cap total at `0.6s`.

`prefers-reduced-motion` is handled in `src/index.css` — respect this in production.

---

## Shared components

| Component | Path | Notes |
| :--- | :--- | :--- |
| `NumberFlowField` | `components/NumberFlowField.tsx` | Sizes `md` / `lg` / `xl`; `tone="light"` on dark cards |
| `NumberFlowStepper` | `components/NumberFlowStepper.tsx` | Party size ± with barrel roll |
| `MorphButton` | `components/MorphButton.tsx` | Reuse for every primary action |
| `FloatingInput` | `components/FloatingInput.tsx` | HeroUI-compatible styling |
| `ReceiptPrinterView` | `components/ReceiptPrinter.tsx` | Embeddable receipt (used inside POS party demo) |

**External:** [`@daformat/react-number-flow-input`](https://hello-mat.com/design-engineering/component/number-flow-input) for digit barrel animation.

---

## Party booking (prototype behaviour)

Product rules exercised in **Customer booking** + **Party assign** demos (authoritative copy in [`spec.md`](../modules/barbershop/spec.md) §2a and [`ui.md`](../modules/barbershop/ui.md)):

| Rule | Customer web | POS |
| :--- | :--- | :--- |
| One booking, one bill, **one queue number** | Single confirm → #42 | #42 throughout check-in → pay |
| **Arrival time shared** | Date/time step blocks sum of durations | — |
| **Per-person services** | Tabs per guest; optional names | Line items per person at payment |
| **No per-person barber pick** | Single barber preference only | Manager assigns/splits chairs at counter |
| **Partial check-in** | — | Here / No-show toggles; total adjusts; Ben excluded from bill |
| **Parallel cuts** | Status shows multi-member progress | Start/Complete per member; barbers work in parallel |

Demo data: party of 3 booked, 2 arrive (Abu + Asif), Guest 3 no-show → **RM 90** subtotal (35 + 55).

---

## Customer booking flow (C-05 / C-06)

Steps in `BookingFlow.tsx`:

```
Services (per-person tabs + party stepper)
  → Barber
  → Date
  → Time (grey slots shorter than party duration)
  → Details (FloatingInput)
  → Review (MorphButton)
  → Confirmed (queue # barrel roll)
  → Status (party progress hint)
```

Progress labels: **Services · Schedule · Details · Review · Done**

---

## POS party flow (P-06 / P-07)

Steps in `PosPartyAssign.tsx`:

```
Today board → Check in party #42
  → Who arrived? (Here / No-show)
  → Assign chairs (Ali busy banner)
  → Parallel cuts (Start / Complete per member)
  → Collect payment (line items + MorphButton Cash/DuitNow)
  → Receipt + confetti
```

Chair status colours match `ui.md`: waiting blue · in chair purple · done green.

---

## Stack

| Layer | Choice |
| :--- | :--- |
| Build | Vite 6 + React 19 + TypeScript |
| Motion | [Motion](https://motion.dev) — springs, `layoutId`, `AnimatePresence` |
| UI | HeroUI v3 + Miki theme CSS |
| Numbers | `@daformat/react-number-flow-input` |

Theme import: copy or symlink from `docs/platform/design-system/themes/miki.css` (prototype uses local `@/index.css` overrides).

---

## Penpot cross-reference

| Prototype demo | Penpot page | Frame(s) |
| :--- | :--- | :--- |
| Customer booking | Customer Web App | CW — Services Per Person, Review Party, Party Status |
| Party assign | POS | POS — Party Check-in, Party Assign, Party Payment |
| Number / morph / receipt / card | Motion | Motion — Number Barrel, Morph Button, Receipt, Card Expand, Springs SSOT |
| HitPay checkout | POS | POS — HitPay (P-07-02), HitPay · Card, HitPay · Party |

When implementing production screens, **match Penpot layout** and **match prototype motion** — do not invent new timing without updating both.

---

## Production handoff checklist

- [ ] Import `spring` tokens from `springs.ts` (or extract to shared `@miki/motion` package)
- [ ] Replace demo hard-coded copy with i18n / API data
- [ ] Wire `MorphButton` to real async mutations (payment, booking confirm)
- [ ] `NumberFlowField`: ensure prefix never rolls (currency symbol, `#`)
- [ ] Card expand: only where list→detail stays on same route (today board pattern)
- [ ] Test `prefers-reduced-motion: reduce` on every animated surface
- [ ] Party flows: enforce rules in API per [`spec.md`](../modules/barbershop/spec.md) §2a (slot duration = sum of member durations)

---

## File map

```
prototype/motion/
├── src/
│   ├── App.tsx                 # Demo navigator
│   ├── motion/springs.ts       # Spring SSOT
│   ├── components/
│   │   ├── BookingFlow.tsx     # C-05/C-06 full flow
│   │   ├── PosPartyAssign.tsx  # P-06 party + P-07
│   │   ├── MorphButton.tsx
│   │   ├── NumberFlowField.tsx
│   │   ├── NumberFlowStepper.tsx
│   │   ├── NumberFlowPayment.tsx
│   │   ├── ReceiptPrinter.tsx
│   │   ├── CardToDetail.tsx
│   │   ├── GlassFab.tsx
│   │   └── FloatingInput.tsx
│   └── index.css               # Theme + reduced-motion
├── package.json
└── README.md                   # Short quick-start (links here)
```

---

## Related docs

| Doc | Purpose |
| :--- | :--- |
| [`penpot-setup.md`](penpot-setup.md) | MCP connection, token sync |
| [`../modules/barbershop/ui.md`](../modules/barbershop/ui.md) | All screen IDs (C/P/O) |
| [`../modules/barbershop/spec.md`](../modules/barbershop/spec.md) | Business rules — party §2a, HitPay §8 |
| [`../platform/payment-rails.md`](../platform/payment-rails.md) | HitPay 2% fee, Phase 1B |
