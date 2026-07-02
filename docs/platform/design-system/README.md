# Miki Design System — Universal

**Token SSOT:** [`tokens.json`](tokens.json)

**Scope:** Primitives, semantic tokens, and component-level tokens shared across **all surfaces and verticals** — marketing site, customer web, POS, owner web.

---

## Structure

Three layers (primitive → semantic → component), per [W3C design tokens](https://design-tokens.org):

| Layer | Example | Use |
| :--- | :--- | :--- |
| **Primitive** | `color.green.500`, `space.4` | Raw values |
| **Semantic** | `color.text.primary`, `color.surface.default` | Meaning in UI |
| **Component** | `button.primary.background` | Component recipes |

---

## Tooling

| Tool | Doc |
| :--- | :--- |
| **Penpot** | [`../../design/penpot-setup.md`](../../design/penpot-setup.md) |
| **Notion reference** | [`../../design/references/notion-design-tokens.json`](../../design/references/notion-design-tokens.json) *(inspiration only)* |
| **Sync script** | `docs/design/penpot-sync-tokens.js` |

---

## Module-specific UI

Vertical screen specs reference these tokens but document **flows and layouts** in the module pack:

- Barbershop: [`../../modules/barbershop/ui.md`](../../modules/barbershop/ui.md)

**Web routing & marketing structure** (not tokens): [`../../design/web-structure.md`](../../design/web-structure.md)
