# Miki Motion Prototype

Interactive motion gallery for the Miki design system polish phase. Validates patterns from motion reference clips before applying across Penpot frames and production apps.

**Full developer reference:** [`docs/design/motion-prototype.md`](../../docs/design/motion-prototype.md) — demo catalog, screen ID mapping, party booking rules, motion tokens, production handoff.

## Run

```bash
cd prototype/motion
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demos

| Demo | Pattern | Miki surface |
|------|---------|--------------|
| **Customer booking** | Full C-05/C-06 flow · party tabs · slot blocking | Customer web |
| **Party assign** | Check-in · partial arrival · parallel cuts · pay | POS P-06 / P-07 |
| **Number flow** | Barrel-roll digits · static RM/# prefix | POS P-07 payment total |
| **Button morph** | Idle → loading → success · anticipation | All primary CTAs |
| **Receipt + confetti** | Printer slot + stagger lines + confetti | P-08 / C-08 |
| **Card → detail** | Expand-in-place · shared layoutId | POS today board |
| **Glass FAB** | Blur overlay, +→× rotate, stagger menu | POS walk-in FAB |
| **Floating input** | Label lift on focus | Login, forms |

## Stack

- Vite + React 19 + TypeScript
- [Motion](https://motion.dev) — springs, layout, AnimatePresence
- HeroUI v3 + Miki theme (`docs/platform/design-system/themes/miki.css`)
- `@daformat/react-number-flow-input` — Wise-style rolling numbers

## Motion tokens

See `src/motion/springs.ts` — natural spring default `{ stiffness: 280, damping: 28, mass: 0.9 }`.

Respects `prefers-reduced-motion` via CSS in `index.css`.
