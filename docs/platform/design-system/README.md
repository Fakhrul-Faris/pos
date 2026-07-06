# Miki Design System — Universal

**Token SSOT:** [`tokens.json`](tokens.json)  
**Full Spec:** [`specification.md`](specification.md)  
**HeroUI Theme:** [`themes/miki.css`](themes/miki.css)

**Scope:** Primitives, semantic tokens, and component-level tokens shared across **all surfaces and verticals** — POS counter, merchant portal, admin portal, customer web, marketing site.

---

## Architecture

```
tokens.json (W3C Design Tokens — SSOT)
     │
     ├──► themes/miki.css          HeroUI v3 CSS theme (web surfaces)
     ├──► tokens.rn.ts             React Native styles (POS counter)
     └──► penpot-sync-tokens.js    Penpot library (design)
```

## Structure

Three layers (primitive → semantic → component), per [W3C design tokens](https://design-tokens.org):

| Layer | Example | Use |
| :--- | :--- | :--- |
| **Primitive** | `color.green.500`, `space.4` | Raw values |
| **Semantic** | `color.text.primary`, `color.surface.default` | Meaning in UI |
| **Component** | `button.primary.background` | Component recipes |

---

## Implementation

| Surface | Tech | Component library | Density |
| :--- | :--- | :--- | :--- |
| **Merchant Portal** | React + Vite | HeroUI v3 | Compact |
| **Admin Portal** | React + Vite | HeroUI v3 | Compact |
| **Customer Web** | React + Vite | HeroUI v3 | Loose |
| **Counter POS** | React Native + Expo | Custom (same tokens) | Medium |
| **Marketing Site** | React + Vite | HeroUI v3 | — |

### HeroUI v3 theme usage

```css
/* globals.css */
@layer theme, base, components, utilities;

@import "tailwindcss";
@import "@heroui/styles";
@import "@miki/tokens/themes/miki.css" layer(theme);
```

```html
<html data-theme="miki">           <!-- light -->
<html data-theme="miki-dark">      <!-- dark -->
```

---

## Tooling

| Tool | Doc |
| :--- | :--- |
| **HeroUI v3** | [`themes/miki.css`](themes/miki.css) — theme override |
| **Penpot** | [`../../design/penpot-setup.md`](../../design/penpot-setup.md) |
| **Sync script** | `docs/design/penpot-sync-tokens.js` |
| **Notion reference** | [`../../design/references/notion-design-tokens.json`](../../design/references/notion-design-tokens.json) *(inspiration only)* |

---

## Key Documents

| Document | Purpose |
| :--- | :--- |
| [`specification.md`](specification.md) | Full design system spec — density rules, color usage, typography, motion, accessibility, component guide |
| [`tokens.json`](tokens.json) | W3C Design Tokens — single source of truth |
| [`themes/miki.css`](themes/miki.css) | HeroUI v3 theme mapping (light + dark) |

---

## Module-specific UI

Vertical screen specs reference these tokens but document **flows and layouts** in the module pack:

- Barbershop: [`../../modules/barbershop/ui.md`](../../modules/barbershop/ui.md)

**Web routing & marketing structure** (not tokens): [`../../design/web-structure.md`](../../design/web-structure.md)
