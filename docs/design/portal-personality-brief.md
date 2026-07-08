# Merchant Portal — Personality Brief

**Status:** Locked direction · v1  
**Applies to:** Merchant Portal (Owner web) · O-xx screens  
**Token SSOT:** [`../platform/design-system/tokens.json`](../platform/design-system/tokens.json)  
**Full spec:** [`../platform/design-system/specification.md`](../platform/design-system/specification.md) §3.3

---

## Direction sentence

> **A calm operations desk for shop owners — warm and plain-spoken by default, precise wherever money moves.**

**Short form (mood boards, Penpot cover):**  
*Warm ops shell. Money-serious when it counts.*

---

## Personality

| Adjective | What it means in UI |
| :--- | :--- |
| **Calm** | No visual urgency on routine screens. Status is clear; nothing pulses unless action is required. |
| **Capable** | Dense when needed — tables, filters, bulk actions. Feels like a tool that scales with the business. |
| **Plain-spoken** | Labels say what they mean ("Today's bookings", not "Engagement pipeline"). No SaaS jargon. |
| **Warm** | Off-white surfaces, soft borders, human copy tone. Approachable to non-technical owners. |
| **Precise** | Money screens: aligned numbers, explicit statuses, no rounding ambiguity. Trust through clarity. |

### Anti-personality (avoid)

| Avoid | Why |
| :--- | :--- |
| Playful / cute | Undermines trust on payouts and compliance. |
| Industry-themed | Scissors, salon pink, café rustic — breaks universality. |
| Enterprise gray | Cold IBM-portal energy; wrong for SMB self-serve. |
| Fintech bro | Dark neon, crypto aesthetics; alienates mainstream shop owners. |
| Marketing-site spacious | Portal is a work surface, not a landing page. |

---

## Design filter

Use this for every screen, component, or copy decision:

```
Is this screen about money or compliance?
  YES → precise mode (Stripe/Mercury discipline)
  NO  → warm ops mode (Square/Notion approachability)
```

| Warm ops mode | Precise mode |
| :--- | :--- |
| Dashboard, calendar, bookings | Transactions, payouts, subscription |
| Staff, services, customers | Tax export, receipt settings |
| Reports (summary) | Ledger detail, reconciliation |
| Settings (general) | Payment rails, billing plan |

Both modes share the **same tokens** — precise mode tightens spacing, favors tables over cards, and restricts decoration. It does not switch to a dark theme.

---

## Reference board

Study these six; steal patterns, not pixels.

| Brand | Steal | Ignore |
| :--- | :--- | :--- |
| **Square** | Universal SMB tone, "today" as home | US-specific onboarding |
| **Shopify Admin** | Sidebar IA, settings depth, list + filter | E-commerce entities |
| **Stripe** | Ledger clarity, status semantics | Developer-first austerity everywhere |
| **Notion** | Warm neutrals, alpha text, soft borders | Block editor flexibility |
| **Linear** | Motion discipline, keyboard density | Issue-tracker metaphors |
| **Mercury** | Typographic confidence on money moments | Full dark theme as default |

**Competitors (differentiate, don't copy):** Fresha, Booksy — vertical-coded visuals and illustration-heavy empty states.

---

## Visual rules

### Color

- **Canvas:** warm off-white (`neutral.surface` #F9F9F8) — not cool gray, not pure white pages.
- **Text:** alpha black scale (`text-strong` / `text-normal` / `text-muted`).
- **Accent:** brand green (`green.500`) **only** for primary actions, links, selected states.
- **Status:** semantic tokens (`status.success` / `warning` / `error`) — never brand green for success.
- **Money surfaces:** no tinted green backgrounds; white cards on warm canvas.

### Typography

| Role | Face | Use |
| :--- | :--- | :--- |
| Headings | Instrument Sans | Page titles, section headers |
| UI + body | IBM Plex Sans | Tables, forms, labels, dense copy |
| Numbers | IBM Plex Sans (tabular lining) | Amounts, counts, payout figures |

Portal bias: **smaller scale, tighter line-height** than marketing site. See spec §3.3 compact density.

### Layout

- Collapsible sidebar + content area (1280px+ typical).
- **Lists → tables**; cards for summaries and empty states only.
- Labels above inputs; compact field groups (`spacing.3` between fields).
- Page title + primary action top-right; secondary actions in overflow or inline.

### Iconography & illustration

- **Line icons only** — operational metaphors (calendar, queue, receipt, person).
- **No vertical mascots** — no barber pole, stethoscope, coffee cup in system chrome.
- Empty states: short copy + single CTA; illustration optional and abstract only.

### Motion

- **150–200ms** functional transitions; ease-out.
- No delight animations in tables or data views.
- Loading: skeleton rows, not spinners on full page.

### Tenant theming

Universal shell is fixed Miki chrome. Tenant identity appears in:

| Allowed | Not allowed |
| :--- | :--- |
| Business name in header | Per-vertical layouts |
| Uploaded logo (sidebar/header) | Custom sidebar structure |
| Optional accent tint (future) | Industry icon sets |

Vertical difference is **copy and config**, not visual forks.

---

## Voice (portal copy)

Aligns with [`copy-style.md`](copy-style.md). Portal-specific bias:

| Do | Don't |
| :--- | :--- |
| "3 bookings today" | "3 scheduled engagements" |
| "Payout sent" | "Disbursement initiated" |
| "Trial ends 14 Jul" | "Your subscription lifecycle event" |
| "Export for accountant" | "Generate fiscal artifact" |

**Tone:** helpful colleague at the desk — not support bot, not bank letter.

---

## Hero screens (design first)

These three stress-test universality. A barbershop and a clinic should differ only in labels (barber → practitioner, chair → room).

| Priority | Screen | Mode | Proves |
| :--- | :--- | :--- | :--- |
| **1** | Today dashboard | Warm ops | Daily home, KPIs, queue snapshot |
| **2** | Calendar week view | Warm ops | Scheduling density, multi-staff |
| **3** | Transactions / payouts | Precise | Money trust, status, export |

Design all three in Penpot before expanding the O-xx screen list.

---

## Surface relationship

```
Marketing site     → expressive (hero type, more space)
Merchant Portal    → warm ops + precise money  ← this brief
Counter POS        → tactile, touch-first, same tokens
Customer web       → loose, phone, minimal chrome
```

Same family; different rooms. Portal is the **adult desk** in the house.

---

## Open decisions (resolve in Penpot)

| Question | Recommendation |
| :--- | :--- |
| Light-first portal? | **Yes.** Dark mode optional later. |
| Tablet at shop? | Design compact default; test 1024px sidebar collapse. |
| BM / EN label lengths? | Test hero screens with longest BM strings early. |
| Merchant accent color? | Defer to v2; logo + name sufficient for launch. |

---

## Related

| Doc | Purpose |
| :--- | :--- |
| [`../platform/design-system/specification.md`](../platform/design-system/specification.md) | Token map, density, component sizing |
| [`../modules/barbershop/ui.md`](../modules/barbershop/ui.md) | O-xx screen index (barbershop labels) |
| [`references/notion-design-library.md`](references/notion-design-library.md) | Warm neutral reference |
| [`themes/mercury-design.md`](themes/mercury-design.md) | Precise mode reference (money surfaces only) |
