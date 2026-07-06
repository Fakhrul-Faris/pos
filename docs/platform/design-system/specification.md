# Miki Design System — Specification

**Status:** v1.0 — Initial  
**Token SSOT:** [`tokens.json`](tokens.json)  
**HeroUI Theme:** [`themes/miki.css`](themes/miki.css)  
**Applies to:** POS Counter · Merchant Portal · Admin Portal · Customer Web · Marketing Site

---

## 1. Architecture

```
tokens.json (W3C Design Tokens)
     │
     ├──► themes/miki.css        → HeroUI v3 CSS variables (web surfaces)
     ├──► tokens.rn.ts           → React Native StyleSheet (POS counter)
     └──► penpot-sync-tokens.js  → Penpot library (design)
```

**Rule:** `tokens.json` is the single source of truth. Every implementation (HeroUI theme, RN styles, Penpot) derives from it. Never define a color, spacing value, or type scale directly in application code.

---

## 2. Token → HeroUI Variable Map

### Colors

| tokens.json path | Hex | HeroUI variable | oklch |
|:---|:---|:---|:---|
| `green.500` | `#38CE87` | `--accent` | `oklch(0.76 0.155 160)` |
| `green.600` | `#2FB876` | `--accent` hover (calc) | `oklch(0.69 0.14 160)` |
| `green.700` | `#1A7A4C` | `--accent-soft-foreground` | `oklch(0.49 0.10 160)` |
| `neutral.ink` | `#1C1C1C` | `--foreground` / `--eclipse` | `oklch(0.20 0 0)` |
| `neutral.surface` | `#F9F9F8` | `--background` | `oklch(0.98 0.002 90)` |
| `neutral.white` | `#FFFFFF` | `--surface` | `oklch(100% 0 0)` |
| `neutral.100` | `#F6F5F4` | `--default` / `--surface-secondary` | `oklch(0.97 0.003 85)` |
| `neutral.200` | `#DFDCD9` | `--surface-tertiary` | `oklch(0.89 0.006 80)` |
| `neutral.muted` | `#6B6B6B` | `--muted` | `oklch(0.50 0 0)` |
| `neutral.border` | `#0000001A` | `--border` | `oklch(0.90 0.004 85 / 26%)` |
| `status.success` | `#14832B` | `--success` | `oklch(0.49 0.14 150)` |
| `status.warning` | `#FF6D00` | `--warning` | `oklch(0.72 0.18 55)` |
| `status.error` | `#F64932` | `--danger` | `oklch(0.60 0.22 25)` |

### Typography

| tokens.json | HeroUI / CSS |
|:---|:---|
| `fontFamily.headline`: Instrument Sans | `--font-heading` (custom) — used for hero, section titles |
| `fontFamily.body`: IBM Plex Sans | `--font-sans` — default body font via `font-family` |

### Spacing

tokens.json uses a 4px base grid: `spacing.1` = 4px, `spacing.2` = 8px, ... `spacing.24` = 96px.  
HeroUI uses `--spacing: 0.25rem` (4px at default font-size). **These align naturally.**

### Radius

| tokens.json | Value | HeroUI variable |
|:---|:---|:---|
| `radius.sm` | 4px | `--radius-sm` (calc from `--radius`) |
| `radius.md` | 8px | `--radius` base = 0.5rem |
| `radius.lg` | 12px | `--radius-xl` |
| `radius.xl` | 16px | `--radius-2xl` |

### Shadows

Miki uses a Notion-flat aesthetic. Shadows are minimal by default:

| tokens.json | HeroUI variable | Value |
|:---|:---|:---|
| `shadow.none` | (cards default) | `none` |
| `shadow.sm` | `--surface-shadow` | `0 1px 2px 0 rgb(0 0 0 / 0.03)` |
| `shadow.md` | `--overlay-shadow` | `0 4px 18px 0 rgb(0 0 0 / 0.04)` |

---

## 3. Surfaces & Density

Miki serves three distinct user contexts. The design system provides the same visual language but different density presets.

### 3.1 Customer Web (phone browser)

**Context:** Customer scanning QR at the shop. Standing, distracted, might be holding a coffee.  
**Device:** Phone (portrait, 375–430px wide)  
**Density:** Loose  
**Touch targets:** 48px minimum  
**Typography bias:** Large, clear, minimal text  

| Pattern | Guideline |
|:---|:---|
| Buttons | `lg` size variant, full-width on mobile |
| Inputs | `lg` size, large hit area |
| Spacing | Generous — `spacing.6` (24px) between sections minimum |
| Cards | Full-bleed on mobile, 16px padding |
| Navigation | Minimal — back arrow + page title |

**HeroUI component sizing:** Prefer `size="lg"` for all interactive elements.

### 3.2 Counter POS (tablet, React Native)

**Context:** Barber between cuts, shared device on counter. One hand might be busy.  
**Device:** Tablet (landscape, 1024–1366px) or large phone  
**Density:** Medium  
**Touch targets:** 44px minimum  
**Typography bias:** Scannable at arm's length  

| Pattern | Guideline |
|:---|:---|
| Buttons | `md`–`lg` size, icon + text |
| Lists | Tall rows (56px), large tap zones |
| Spacing | `spacing.4` (16px) between elements |
| Layout | Split panel — queue left, detail right |
| Status indicators | Color + icon, never color alone |

**Note:** POS uses React Native, not HeroUI. The RN component layer must consume the same tokens and replicate the same visual language. See [Section 7: React Native Token Consumption](#7-react-native-token-consumption).

### 3.3 Merchant Portal + Admin Portal (desktop web)

**Context:** Owner at home or manager at desk. Mouse/keyboard. Data-heavy.  
**Device:** Desktop/laptop (1280px+ typical)  
**Density:** Compact  
**Touch targets:** 32px minimum (pointer: fine)  
**Typography bias:** Information-dense, scannable tables  

| Pattern | Guideline |
|:---|:---|
| Buttons | `sm`–`md` size |
| Tables | Compact rows (40px), sortable headers |
| Spacing | `spacing.3` (12px) between form fields, `spacing.4` (16px) sections |
| Layout | Sidebar + content, collapsible nav |
| Forms | Labels above inputs, compact field groups |

**HeroUI component sizing:** Default (`md`) for most elements. `sm` for table actions and inline controls.

---

## 4. Color System

### 4.1 Brand green usage

The brand green (`#38CE87` / `oklch(0.76 0.155 160)`) has specific roles:

| Use | Allowed | Example |
|:---|:---|:---|
| Primary CTA buttons | Yes | "Start free trial" |
| Links | Yes | Navigation, inline links |
| Active/selected state | Yes | Active tab, selected radio |
| Logo dot accent | Yes | The "i" dot in Miki |
| Badges ("Available now") | Yes | Soft green bg + deep green text |
| Large surfaces | No | Never use brand green as a page or section background |
| Text on white | No | Green text on white fails WCAG AA at body sizes — use `green.700` instead |
| Status: success | No | Use `status.success` (#14832B), not brand green |

### 4.2 Warm neutrals

Miki's neutral palette is warm (influenced by Notion), not cool (no blue-gray). This gives the interface an approachable, editorial feel.

| Role | Token | Value |
|:---|:---|:---|
| Page background | `neutral.surface` | `#F9F9F8` — warm off-white |
| Card / elevated surface | `neutral.white` | `#FFFFFF` |
| Subtle surface | `neutral.100` | `#F6F5F4` |
| Hover / active fill | `neutral.200` | `#DFDCD9` |
| Icon fill | `neutral.300` | `#A39E98` |
| Body text | `alpha.text-normal` | `#000000E5` (90%) |
| Headlines | `alpha.text-strong` | `#000000F2` (95%) |
| Captions | `alpha.text-muted` | `#0000008A` (54%) |

### 4.3 Dark mode guidelines

- Background warm-dark, not pure black — `oklch(0.16 0.005 90)`
- Brand green stays the same hue and lightness in both modes
- Status colors shift slightly brighter for dark-bg readability
- Never invert brand green to a dark green in dark mode

---

## 5. Typography

### 5.1 Font stack

| Role | Primary | Fallback |
|:---|:---|:---|
| Headlines | Instrument Sans | Inter, system sans-serif |
| Body | IBM Plex Sans | Inter, system sans-serif |

### 5.2 Type scale

Derived from tokens.json. Used across all surfaces.

| Name | Size | Weight | Line-height | Letter-spacing | Use |
|:---|:---|:---|:---|:---|:---|
| Display XL | 76px | 600 | 1.06 | -3.4px | Marketing hero only |
| Display LG | 60px | 600 | 1.06 | — | Section hero |
| Heading H1 | 54px | 600 | 1.25 | — | Page titles |
| Heading H2 | 32px | 700 | 1.25 | -0.75px | Section titles |
| Heading H3 | 22px | 700 | 1.27 | -0.25px | Card titles, subsections |
| Body LG | 18px | 400 | 1.625 | — | Lead paragraphs |
| Body MD | 16px | 400 | 1.5 | — | Default body |
| Body SM | 14px | 400 | 1.5 | — | Captions, table cells |
| Label | 12px | 500 | 1.5 | — | Badges, metadata |

### 5.3 Surface-specific type overrides

| Surface | Max heading level | Body default |
|:---|:---|:---|
| Customer Web | H2 (32px) | Body LG (18px) |
| Counter POS | H3 (22px) | Body MD (16px) |
| Merchant Portal | H2 (32px) | Body SM (14px) for data, Body MD (16px) for forms |
| Marketing site | Display XL (76px) | Body LG (18px) |

---

## 6. Motion

Governed by `10 Principles for Fluid UI.md`. Key implementation tokens:

| Token | Value | Use |
|:---|:---|:---|
| `duration.fast` | 150ms | Hover states, toggles |
| `duration.normal` | 200ms | Transitions, tab switches |
| `duration.slow` | 300ms | Modals, page transitions |
| `easing.ease-out` | `cubic-bezier(0, 0, 0.58, 1)` | Enter animations |
| `easing.ease-in-out` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | Shared transitions |

**Spring defaults (POS & interactive web):**
- Stiffness: 300 (responsive, snappy)
- Damping: 25 (natural settle)
- Mass: 1.0 (standard elements), 0.8 (small elements like toggles)

**Reduced motion:** All animated elements must have a `prefers-reduced-motion` fallback that replaces spatial animation with opacity crossfade.

---

## 7. React Native Token Consumption

The Counter POS runs React Native (Expo). It cannot use HeroUI or CSS variables. Instead, it consumes the same tokens via a TypeScript module.

### 7.1 Token file structure

```
packages/tokens/
├── tokens.json           ← W3C SSOT (shared with web)
├── index.ts              ← Generated: typed token constants
├── colors.ts             ← Light/dark color maps
├── typography.ts          ← Font families, sizes, weights
├── spacing.ts            ← 4px grid values
└── generate.ts           ← Script: tokens.json → TS modules
```

### 7.2 Usage in React Native

```tsx
import { colors, spacing, typography } from '@miki/tokens';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.background.page,
    padding: spacing[4], // 16
  },
  heading: {
    fontFamily: typography.fontFamily.headline,
    fontSize: typography.fontSize['3xl'],  // 32
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text.primary,
  },
});
```

### 7.3 Visual parity rules

| Property | Web (HeroUI) | RN equivalent |
|:---|:---|:---|
| `--accent` | CSS variable | `colors.brand.primary` |
| `--radius` | `0.5rem` | `borderRadius: 8` |
| `shadow.sm` | CSS `box-shadow` | `elevation: 1` (Android) + `shadowOffset` (iOS) |
| `font-sans` | CSS `font-family` | Loaded via `expo-font` |
| `spacing.4` | Tailwind `p-4` | `padding: 16` |

---

## 8. Component Customization Guide

### 8.1 HeroUI BEM override pattern

HeroUI v3 uses BEM classes. Override globally in `miki.css`:

```css
@layer components {
  /* All buttons get Miki styling */
  .button { @apply font-medium; }
  .button--primary { /* inherits --accent automatically */ }

  /* Cards: flat, border-defined */
  .card { @apply shadow-none border border-border; }

  /* Inputs: visible border by default */
  .input { @apply border border-border; }
}
```

### 8.2 Per-surface overrides

Wrap surface-specific density in a data attribute:

```css
/* Compact density for merchant/admin portal */
[data-density="compact"] .button { @apply text-sm py-1.5 px-3; }
[data-density="compact"] .table__row { @apply h-10; }

/* Loose density for customer web */
[data-density="loose"] .button { @apply text-base py-3 px-6; }
[data-density="loose"] .input { @apply text-lg py-3; }
```

Apply to root:

```html
<!-- Merchant Portal -->
<html data-theme="miki" data-density="compact">

<!-- Customer Web -->
<html data-theme="miki" data-density="loose">
```

### 8.3 Miki-specific components (not in HeroUI)

These components are unique to Miki and will be built on top of HeroUI primitives:

| Component | Surface | Description |
|:---|:---|:---|
| `QueueCard` | POS, Customer | Shows queue number, barber, status |
| `BarberSwitcher` | POS | Quick-switch avatar bar at top of POS |
| `ServicePicker` | Customer, POS | Service selection with duration + price |
| `TimeSlotGrid` | Customer | Available time slots for booking |
| `StatusBadge` | All | BOOKED / ARRIVED / IN_SERVICE / PAID states |
| `PromoBar` | Marketing | Inverse bg promo banner (tokens: `component.promo-banner`) |
| `DailyReport` | Merchant | Per-barber revenue summary card |

---

## 9. Icon System

**Library:** Lucide React (web) / Lucide React Native (POS)  
**Size presets:**

| Context | Size | Stroke |
|:---|:---|:---|
| Inline (body text) | 16px | 1.5px |
| Button companion | 20px | 2px |
| Navigation | 24px | 2px |
| Empty state illustration | 48px | 1.5px |

**Color:** Icons inherit `currentColor` by default. Status icons use the corresponding status token (`--success`, `--warning`, `--danger`).

---

## 10. Accessibility

| Requirement | Standard |
|:---|:---|
| Color contrast (text) | WCAG 2.1 AA — 4.5:1 normal, 3:1 large |
| Color contrast (interactive) | 3:1 against adjacent colors |
| Focus indicator | 2px ring using `--focus` (brand green) |
| Reduced motion | `prefers-reduced-motion: reduce` → opacity-only transitions |
| Touch targets | 44px minimum on touch, 32px on pointer:fine |
| Color independence | Never use color alone to convey status — always pair with icon or text |

### Key contrast checks

| Pair | Ratio | Pass? |
|:---|:---|:---|
| `green.500` on white (#FFFFFF) | ~3.2:1 | Large text only |
| `green.700` on white (#FFFFFF) | ~5.8:1 | AA pass |
| `ink` on `surface` (#1C1C1C on #F9F9F8) | ~16:1 | AAA pass |
| `ink` on `green.500` (#1C1C1C on #38CE87) | ~7.5:1 | AAA pass |
| `white` on `green.500` (#FFF on #38CE87) | ~2.2:1 | Fail — use dark text |

---

## 11. File Organization (Target Monorepo)

```
miki/
├── packages/
│   ├── tokens/                  ← Shared tokens (JSON + generated TS)
│   ├── ui/                      ← Miki-specific HeroUI compositions (web)
│   └── ui-native/               ← Miki-specific RN components (POS)
├── apps/
│   ├── merchant-portal/         ← React + Vite + HeroUI (data-density="compact")
│   ├── admin-portal/            ← React + Vite + HeroUI (data-density="compact")
│   ├── customer-web/            ← React + Vite + HeroUI (data-density="loose")
│   ├── pos/                     ← React Native + Expo (tokens via @miki/tokens)
│   └── marketing/               ← React + Vite + HeroUI (marketing site)
└── docs/
    └── platform/design-system/  ← This specification + tokens + themes
```

---

## Revision Log

| Date | Change |
|:---|:---|
| 4 Jul 2026 | v1.0 — Initial specification. HeroUI v3 as web base. Token map. Density model. RN consumption guide. |
