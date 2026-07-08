# Miki · Design theme exploration

**Purpose:** Pick a visual direction before polishing Penpot hi-fi and generating prototype screenshot references.  
**Penpot frames:** [`ui.md`](../../modules/barbershop/ui.md) · **Tokens SSOT:** [`tokens.json`](../../platform/design-system/tokens.json)  
**Motion / feel SSOT:** [`motion-prototype.md`](../motion-prototype.md)

---

## Theme spec documents

| Theme | File | Status |
| :--- | :--- | :--- |
| **Visitors** | [`visitors-design.md`](visitors-design.md) | **Active** — POS + merchant portal (`apps/`) |
| **Mercury** | [`mercury-design.md`](mercury-design.md) | Reference — precise money surfaces |
| **Jeton** | [`jeton-design.md`](jeton-design.md) | Reference — landing / fintech editorial |

**Brand assets:** [`../assets/brand/`](../assets/brand/) · **Motion clips:** [`../references/motion/`](../references/motion/)

---

## Your references → what to borrow

| Reference | File | Borrow for Miki |
| :--- | :--- | :--- |
| **Enfso** (Create Item dashboard) | `reference-screenshots/image-74deced9-*.png` | Merchant + Admin web: sidebar shell, breadcrumbs, section blocks, live preview panel, soft purple (or remap to green) |
| **Trip invoice / Payment Status** | `reference-screenshots/image-b3c4e103-*.png` | Customer status + POS receipt: paper-from-slot, monospace receipt lines, paid/unpaid chips, step progress |
| **IN-001 Invoice** | `reference-screenshots/image-67c8d95e-*.png` | Review + payment screens: dog-ear card, bottom sheet summary, orange **Pending** badge, pill primary CTA |
| **Payment method picker** | `reference-screenshots/image-5d44a642-*.png` | Customer booking steps: large selectable rows, blue/green selected state, clear title + helper copy |
| **Crypto credit payment** | `reference-screenshots/image-5a2aec57-*.png` | POS payment modal + Admin dark sidebar: two-column confirm layout, glowing selection, high-contrast summary rail |

---

## Four theme directions (generated concepts)

Same product, different skin. Review PNGs in this folder.

| ID | File | Best for | Accent | Risk |
| :--- | :--- | :--- | :--- | :--- |
| **A · Miki Warm** | `theme-a-miki-warm.png` | Customer web, default brand | `#38CE87` on `#F9F9F8` | Safe; closest to current tokens + motion prototype |
| **B · Receipt Fluid** | `theme-b-receipt-fluid.png` | Status, receipt, party pay, POS celebrate | Ink + paper + status green/orange | Strong character; use sparingly on admin tables |
| **C · Studio Dashboard** | `theme-c-studio-dashboard.png` | Merchant + Admin web | Purple SaaS *or* keep green nav | Familiar B2B pattern; needs barbershop warmth to avoid generic |
| **D · Fintech Crisp** | `theme-d-fintech-crisp.png` | Customer booking flow | Blue selection + pill CTA | Very clear UX; may feel less “neighbourhood barbershop” |

### Recommended hybrid (if you want a single system)

| Surface | Theme |
| :--- | :--- |
| **Customer web** | **A** structure + **D** selection cards (large tappable rows) |
| **POS** | **B** receipt moment on pay/confirm; **A** elsewhere |
| **Merchant web** | **C** layout (sidebar, calendar grid, page header) + **A** tokens |
| **Admin** | **C** layout + **crypto** summary rail for merchant detail / subscriptions |

---

## Decision checklist

Before Penpot polish, pick:

1. **Primary accent** — keep green only · green + purple admin · green + blue customer selection  
2. **Receipt metaphor** — full (B) · confirm/pay only · none  
3. **Web shell** — white sidebar (Merchant) · dark sidebar (Admin only) · both white  
4. **Typography** — Instrument + IBM only · add monospace for queue # / receipt lines  
5. **Corner radius** — 12px (current) · 16px cards / 20px chips (D) · mixed  

Reply with e.g. `A + D customer, C merchant, B receipt on POS pay` and we lock tokens + Penpot skin.

---

## Next step (after theme lock)

**Prototype screenshot pack** for Penpot traceability:

```
docs/design/penpot-reference/
├── customer-web/
│   ├── CW-Hi — Shop Landing.png
│   ├── CW-Hi — Services Per Person.png
│   └── …
├── pos/
├── merchant/
└── admin/
```

Screens captured from `prototype/motion/` where demos exist; stub frames built where missing. Names match Penpot `*-Hi — *` frames exactly.
