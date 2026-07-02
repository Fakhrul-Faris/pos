# Notion.com — Design Library Reference

**Source:** [notion.com](https://www.notion.com/) marketing site  
**Extracted:** 30 Jun 2026 (live CSS inspection)  
**Purpose:** Reference for layout, typography, and component patterns — not an official Notion design system export.

**Machine-readable tokens:** [`notion-design-tokens.json`](notion-design-tokens.json)

---

## Design philosophy (observed)

| Principle | How it shows up |
| :--- | :--- |
| **Warm minimal** | Off-white grays (`#F6F5F4`), not pure `#F5F5F5` cold gray |
| **Blue as action** | Single accent family (`#0075DE`) — CTAs, links, tinted cards |
| **Tight display type** | Large headlines with negative letter-spacing (-0.1em to -0.25em) |
| **Soft borders** | `rgba(0,0,0,0.05–0.10)` — never harsh `#CCC` dividers |
| **No drop shadows on cards** | Depth via tint fills and borders, not elevation |
| **813 CSS variables** | Full token system under `:root` — scales for color, type, spacing, motion |

---

## Color system

### Brand accent (blue)

| Token | Hex | Use |
| :--- | :--- | :--- |
| `blue-600` | `#0075DE` | Primary CTA, links |
| `blue-700` | `#005BAB` | Hover, secondary button text |
| `blue-200` | `#E6F3FE` | Secondary button bg, soft surfaces |
| `blue-100` | `#F2F9FF` | Card tints, badge light bg |

### Neutrals (warm gray)

| Token | Hex | Use |
| :--- | :--- | :--- |
| `gray-100` | `#F9F9F8` | Menu buttons |
| `gray-200` | `#F6F5F4` | Neutral surfaces, hover fills |
| `gray-300` | `#DFDCD9` | Active states |
| `gray-400` | `#A39E98` | Icons |
| `gray-500` | `#78736F` | Ghost button indicators |

### Text (alpha black scale)

| Token | Value | Use |
| :--- | :--- | :--- |
| `text-strong` | `rgba(0,0,0,0.95)` | Headlines, card titles |
| `text-normal` | `rgba(0,0,0,0.90)` | Body, nav |
| `text-muted` | `rgba(0,0,0,0.54)` | Card body, captions |
| `text-disabled` | `rgba(0,0,0,0.30)` | Disabled |

### Semantic status

| Role | Hex |
| :--- | :--- |
| Success | `#14832B` |
| Error | `#F64932` |
| Warning | `#FF6D00` |

### Full palette families (in CSS)

Blue, gray, green, red, orange, yellow, purple, pink, teal, brown — each with 100–900 steps. Plus alpha black/white overlays and campaign-specific colors.

---

## Typography

### Font stacks

| Role | Family |
| :--- | :--- |
| **Sans (primary)** | `NotionInter` → Inter → system-ui |
| **Serif (editorial)** | `Lyon Text` → Georgia |
| **Mono** | `iA Writer Mono` → Menlo |
| **Handwriting** | `Permanent Marker` (decorative) |

`NotionInter` is a custom Inter subset loaded on the marketing site.

### Size scale (rem / px at 16px base)

| Token | Size | Observed use |
| :--- | :--- | :--- |
| `50` | 12px | Small captions |
| `100` | 14px | Card body |
| `200` | 16px | Body, buttons, nav |
| `400` | 22px | Card title (H3) |
| `600` | 32px | Section heading (H2) |
| `800` | 54px | Large display |
| `1000` | 76px | Hero (H1, responsive) |
| `1100` | 96px | Max display |

### Weights

| Token | Value | Use |
| :--- | :--- | :--- |
| Regular | 400 | Body |
| Medium | 500 | Buttons, nav CTA |
| Semibold | 600 | Hero H1 |
| Bold | 700 | Section H2, card titles |

### Letter-spacing pattern

Tighter tracking as size increases:

- Body (16px): `0`
- H3 (22px): `-0.25px`
- H2 (32px): `-0.75px`
- H1 (~75px): `-3.4px`

### Live computed examples (homepage)

| Element | Size | Weight | Line-height | Letter-spacing |
| :--- | :--- | :--- | :--- | :--- |
| H1 hero | 74.7px | 600 | 79.5px | -3.38px |
| H2 section | 32px | 700 | 40px | -0.75px |
| H3 card | 22px | 700 | 28px | -0.25px |
| Body | 16px | 400 | 24px | normal |
| Card body | 14px | 400 | 20px | normal |

---

## Spacing & layout

### Spacing scale

4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 96, 100 (in px equivalents)

### Layout tokens

| Token | Value |
| :--- | :--- |
| Grid columns | 12 |
| Grid gutter | 28px |
| Nav height | 64px |
| Max content width | 1252px (`78.25rem`) |
| Base padding | 20px |

### Section spacing

| Token | Value |
| :--- | :--- |
| `spacing-m` | 40px |
| `spacing-l` | 60px |
| `spacing-block-s` | 20px |
| `spacing-block-m` | 24px |
| `spacing-block-l` | 32px |

---

## Border radius

| Token | Value | Use |
| :--- | :--- | :--- |
| `radius-200` | 4px | Nav text links |
| `radius-500` | 8px | Buttons, cards |
| `radius-700` | 12px | Larger containers |
| `radius-900` | 16px | Modals / panels |
| `radius-round` | 9999px | Pills, avatars |

---

## Shadows

Subtle, multi-layer — used sparingly (not on standard cards):

| Token | Character |
| :--- | :--- |
| `shadow-100` | Light lift — 2 layers, max 3% opacity |
| `shadow-200` | Medium — 4 layers |
| `shadow-300` | Heavy — 6 layers, modal-level |

---

## Motion

| Duration | Value |
| :--- | :--- |
| Fast | 100–150ms |
| Default | 200–250ms |
| Slow | 300ms |

Easing: `ease-out`, `ease-in-out-cubic`, `ease-in-out-quart` (for polished UI transitions).

---

## Component library

### Navigation (`globalNavigation`)

| Property | Value |
| :--- | :--- |
| Height | 64px |
| Background | White |
| Link style | 16px regular, `rgba(0,0,0,0.90)` |
| Link padding | 5px 10px |
| Link radius | 4px |
| CTA | Primary button right-aligned |

### Button — Primary

| Property | Value |
| :--- | :--- |
| Background | `#0075DE` |
| Hover | `#005BAB` |
| Text | White, 500 weight |
| Size | 16px / 24px line-height |
| Padding | 6px 15px (hero), 4px 14px (nav) |
| Radius | 8px |
| Border | 1px transparent |

**Labels:** "Get Notion free", "Start free trial"

### Button — Secondary

| Property | Value |
| :--- | :--- |
| Background | `#E6F3FE` |
| Text | `#005BAB` |
| Radius | 8px |

**Labels:** "Request a demo"

### Button — Tertiary / Ghost

| Property | Value |
| :--- | :--- |
| Background | White or transparent |
| Border | `rgba(0,0,0,0.10)` (tertiary) or none (ghost) |
| Hover fill | `#F6F5F4` |

### Card

| Property | Value |
| :--- | :--- |
| Background | White or tinted (`#F2F9FF` blue) |
| Border | 1px `rgba(0,0,0,0.05)` |
| Radius | 8px |
| Padding | 16px |
| Gap | 24px |
| Shadow | None |

**Structure:** Icon/visual → title (22px bold) → body (14px muted)

### Badge

| Variant | Background | Text |
| :--- | :--- | :--- |
| Bold | `#097FE8` | White |
| Light | `#F2F9FF` | `#097FE8` |
| Muted | `#F6F5F4` | `rgba(0,0,0,0.54)` |
| Outline | Transparent | `rgba(0,0,0,0.90)` |

### Section header

| Property | Value |
| :--- | :--- |
| H2 | 32px bold, -0.75px tracking |
| Gap below | 24px |
| Alignment | Start (left) |

### Logo strip (social proof)

Horizontal logo row — grayscale partner marks, centered below hero trust line.

### Footer

Multi-column link grid, 14px captions, language selector, social icons (Instagram, X, LinkedIn, Facebook, YouTube).

---

## Page patterns (homepage)

```
1. Global nav (64px) — logo · mega-menu · Get Notion free
2. Hero — display H1 + subhead + dual CTA + device mockup
3. Logo strip — "Trusted by 98% of the Forbes Cloud 100"
4. Feature section — H2 + tabbed carousel / agent cards
5. Product grid — "Ask your on-demand assistants" (3-up cards)
6. Product grid — "Bring all your work together" (3-up)
7. Testimonials — quote carousel with customer logos
8. Stats ticker — animated proof points (100M users, G2 badges)
9. Footer CTA — "Get started today"
10. Footer — 4-column links + legal
```

### Copy patterns

- **Hero:** Short verb-led headline ("Keep work moving 24/7", "Where teams and agents Create together")
- **Section H2:** Benefit statement, period at end
- **Card H3:** Feature noun ("Capture", "Q&A agents")
- **CTA:** "Get Notion free" (primary), "Request a demo" (secondary), "Try it" (tertiary inline)

---

## CSS architecture notes

- **CSS Modules** with hashed class names (`button_button__atjat`, `semanticTypography_variantGlobalTitle__D1p6b`)
- **Semantic typography** component maps variant names → token composites
- **813 `:root` variables** including full `typography-sans-{size}-{weight}` composites
- **Grid:** 12-column with 28px gutter
- **No dark mode** on marketing homepage (light only)

---

## Comparison to POS tokens

| Aspect | Notion | POS (current) |
| :--- | :--- | :--- |
| Primary | Blue `#0075DE` | Green `#38CE87` |
| Ink | `rgba(0,0,0,0.95)` | `#1C1C1C` |
| Surface | White + warm gray | `#FAFAFA` |
| Display font | NotionInter (Inter) | Instrument Sans |
| Body font | NotionInter | IBM Plex Sans |
| Card shadow | None | Subtle md shadow |
| Button radius | 8px | 8px ✓ |
| Hero scale | ~75px tight tracking | 60px planned |

---

## Usage notes

- Tokens are **reverse-engineered** from public CSS — may change without notice.
- `NotionInter` is proprietary; use **Inter** as fallback in your own projects.
- Campaign colors (`--color-campaigns-*`) are seasonal — excluded from core tokens.
- For official Notion brand assets, see Notion's press/brand guidelines (separate from this technical extraction).
