# Miki — context for AI

**Purpose:** Single handoff document for LLMs working on this repo.  
**Repo:** https://github.com/Fakhrul-Faris/pos.git  
**Last compiled:** 20 August 2026  

When this file conflicts with a linked SSOT below, **trust the SSOT path** and treat this as the index + summary.

---

## 1. What Miki is

**Miki** is a **queue, booking, and checkout platform** for **Malaysian service shops** (barbers, salons, clinics, pop-ups).

**Phase 1 vertical:** **Barbershop** — hybrid online booking + walk-in queue, one shared counter tablet, per-barber economics, **BYOD** (no hardware bundle).

**One sentence (barbershop):** Hybrid **online booking + walk-in queue**, **one shared counter tablet**, **per-barber economics** — for Malaysian barbershops on BYOD.

**Positioning (launch wedge):**
- Queue-first, not retail POS bolt-on
- BYOD — merchants use existing tablets/phones
- Self-onboarding for Ocelot+
- Optional HitPay payment rail (Phase 1B); cash / own DuitNow always allowed
- **Not** a full StoreHub replacement at launch
- **Not** blocking checkout unless customer pays through platform QR

**Founding context:** Bootstrapped, two-person team, Path A. F&B is **parked** until Phase 2 (50+ paying merchants gate). See `docs/archive/fb-pos-brd-phase2.md`.

---

## 2. Naming (do not confuse)

| Term | Meaning |
| :--- | :--- |
| **Miki** | Company name **and** platform / product name |
| **Barbershop module** | Phase 1 vertical on Miki |
| **Ocelot / Mantis / Patriot / Arsenal** | Subscription **plan tiers** — not the product name |
| **Ocelot Lite** | Free post-trial tier — **not** a signup plan |
| **Customer web / order-app** | C-xx screens — phone browser, no account |
| **Staff POS / shared POS** | P-xx screens — one counter tablet, barber switcher |
| **Merchant portal / Owner web** | O-xx screens — owner laptop |
| **Admin portal** | Miki internal ops (founders only) — separate from merchant portal |

---

## 3. Mental model

```
PLATFORM (universal)
  trial · Lite · tiers · payment rails · design tokens
           │
           ▼
BARBERSHOP MODULE (Phase 1)
  barber · calendar · hybrid queue · pick-barber · state machine
           │
           ├── Customer web  (C-xx)  phone, no login
           ├── Shared POS    (P-xx)  one tablet, barber switcher
           └── Owner web     (O-xx)  Merchant Portal
```

**Rule:** If a second vertical would copy it unchanged → **platform** (`docs/platform/`). If it mentions barber, chair, or barbershop packaging → **module** (`docs/modules/barbershop/`).

---

## 4. Three surfaces

| Code | Surface | Device | Login | Screen spec |
| :--- | :--- | :--- | :--- | :--- |
| **C-** | Customer web | Customer phone | None (booking token in URL) | `docs/modules/barbershop/ui.md` Part 1 |
| **P-** | POS | 1 shop tablet/PC | Shop session + barber switch | `docs/modules/barbershop/ui.md` Part 2 · `docs/design/staff-pos-ia.md` |
| **O-** | Merchant Portal | Owner laptop | Owner account | `docs/modules/barbershop/ui.md` Part 3 · `docs/platform/Miki Merchant Portal — Designer IA Brief.md` |

**Screen ID format:** `{surface}-{module}-{seq}` — e.g. `C-06-03` = Customer, booking module, screen 3.

**Module map (abbreviated):**

| Module | Customer | POS | Owner |
| :--- | :--- | :--- | :--- |
| MOD-05 Menu | C-05 | P-05 | O-05 |
| MOD-06 Queue/Book | C-06 | P-06 | O-06 |
| MOD-07 Pay | C-07 | P-07 | — |
| MOD-08 Receipt | C-08 | P-08 | — |
| MOD-09 Reports | — | P-09 | O-09 |

---

## 5. Customer flows (spec)

### New booking

```
C-01-01 Landing (QR)
  → C-05-01 Services (+ party size, per-person tabs if party > 1)
  → C-06-01 Barber? (flag — one barber for whole party)
  → C-06-02 Date
  → C-06-03 Time (party duration blocks slot)
  → C-06-04 Details (nickname + phone; optional per-guest names)
  → C-06-05 Review (per-person line items if party)
  → C-06-06 Confirmed (# + URL)
  → C-06-08 Status (lifecycle; party progress if party)
  → C-08-01 Receipt (when paid)
```

### Retrieve existing booking (C-01-02)

- Inputs: **phone + date** (default today)
- Success → **C-06-08** status
- Errors: not found · multiple matches → pick one
- PDPA line under phone
- No account, no SMS v1

### Customer self-service on status (prototype — order-app)

Implemented in `apps/order-app` (may extend SSOT over time):

| Action | When allowed | Notes |
| :--- | :--- | :--- |
| **Edit booking** | `BOOKED` or `ARRIVED` only | Re-enter book flow; phone locked |
| **Cancel booking** | `BOOKED` or `ARRIVED` only | Confirm sheet → `CANCELLED` → Book again |
| **Not allowed** | `IN_SERVICE`, `PAID`, `NO_SHOW` | In chair: ask barber |

**Edit queue rule (prototype):** If party size **increases** or total service **duration increases**, issue a **new queue number**; otherwise keep `#`.

---

## 6. Product spec (authoritative)

**Engineering / backend / HitPay / billing:** [`docs/requirements.md`](requirements.md) (founder PRD through Round 26). Still-open HitPay items: [`open-hitpay.md`](open-hitpay.md).

**Barbershop UX / screens:** `docs/modules/barbershop/spec.md` + `ui.md`.

If a UI prototype is simpler than `requirements.md`, **requirements.md wins for behaviour**.

> **§6.1–6.13 below is the current UI prototype** (guest book, no customer account). The engineering PRD still requires registered customers, Keycloak, payroll, and a connected HitPay account per Brand. Do not treat this summary as a cut of that scope.

### 6.1 Roles & devices

| Role | Device | Capabilities |
| :--- | :--- | :--- |
| **OWNER** | Web + POS | Calendar, caps, menu, barbers, reports, billing |
| **BARBER** | Shared POS | Own queue, arrived, reassign (if not started), add services, payment, day stats |
| **CUSTOMER** | Phone browser | Book, pick barber (if enabled), status, receipt — **no account** |

**Shared POS:** One shop terminal session. Tap barber avatar → actions attributed to that barber. Optional 4-digit PIN for void/refund (owner). **Not** 3 device registrations for 3 barbers.

### 6.2 Customer identity (no account)

| Field | Required | Notes |
| :--- | :--- | :--- |
| Display name | Yes | Nickname — counter verify |
| Phone | Yes | Receipt link / lookup — **no SMS v1** |
| Email | No | — |

No OTP in v1.

### 6.3 Party booking

One **booking record**, one **queue number**, one **bill**.

| Rule | Detail |
| :--- | :--- |
| Party size | 1–6 on web; each member picks own services |
| Queue # | Single # for whole party (e.g. #42) |
| Arrival | One shared slot |
| Calendar block | Sum of member durations (+ buffers) |
| Barber on web | **One** barber (or Anyone) for party — not per person |
| Chair assignment | Manager splits party at POS check-in (customer never sees) |
| Parallel cuts | After assign, barbers may cut in parallel |
| Partial check-in | Per-member Here / No-show; bill excludes no-shows |

### 6.4 Calendar & capacity

- Per-barber working hours, service duration + buffer → slots
- **Daily cap** per barber → **Full** on customer web when reached
- **Walk-in-only blocks** — online cannot book those slots
- **Pick-your-barber** toggle: ON = per-barber calendar; OFF = auto-assign
- Reassignment before `IN_SERVICE`; customer web updates barber name on refresh/poll

### 6.5 Booking types & hybrid queue

| Type | Created by | Slot |
| :--- | :--- | :--- |
| Online | Customer web (QR) | Reserved on barber calendar |
| Walk-in | POS | Walk-in block or queue rules |

- Bookings own a **time slot**
- Walk-ins do **not** steal booked slots
- Walk-in may pass other walk-ins, not confirmed bookings whose slot has arrived

### 6.6 State machine

```
BOOKED ──► waiting for arrival
     │ manager: Arrived
     ▼
  ARRIVED ──► assign / confirm barber
     │ Start cut
     ▼
  IN_SERVICE
     │ Done
     ▼
  COMPLETED ──► Checkout
     ▼
    PAID

Side transitions:
  → NO_SHOW (15+ min late, auto)
  → CANCELLED (before IN_SERVICE — manager or customer web in prototype)
  → barber REASSIGNED (before IN_SERVICE)
```

| State | Customer web (solo) | Customer web (party) |
| :--- | :--- | :--- |
| BOOKED | #42 · Ali · Sat 2pm · Haircut | #42 · Party of 3 · Sat 2pm |
| ARRIVED | Checked in — please wait | Checked in — please wait |
| IN_SERVICE | In chair | 2 of 3 in chair |
| PAID | Receipt link | Receipt link |
| NO_SHOW | Missed + Book again | Per-member or whole-party |
| CANCELLED | Booking cancelled + Book again (prototype) | Same |

Online bookings are **auto-confirmed** when slot is free. Accept/skip/no-show at **arrival**, not at booking time.

### 6.7 Arrival policy

| Rule | Value |
| :--- | :--- |
| Early | Up to 10 min — wait, no early chair |
| On time | Manager marks **Arrived** (name + phone last 4) |
| Late | **15 min** after slot → auto **NO_SHOW** |
| Notifications | **None** to customer v1 — refresh status page |

### 6.8 Service changes at chair

- **Planned services** at booking; **actual services** at arrival/POS before payment
- Barber can add/remove on POS; overlap warning if next booking tight
- Customer web shows planned until paid; receipt shows final

### 6.9 Payment

| Rule | Detail |
| :--- | :--- |
| Timing | **After cut** only |
| Who | Barber/manager on shared POS |
| Phase 1A | Cash + own DuitNow |
| Phase 1B | HitPay QR + card; customer +2% service fee on HitPay |
| Customer web | **Does not pay on web v1** — pay at counter |
| Receipt | Link + counter QR — no SMS v1 |
| E-invoice | **No** in barbershop v1 |

### 6.10 Offline

| Actor | Behaviour |
| :--- | :--- |
| POS | Local outbox; banner when offline; sync on reconnect |
| Customer web | Read-only cache if previously loaded; new bookings need network |

### 6.11 Feature flags (owner defaults)

| Flag | Default |
| :--- | :--- |
| `allow_customer_pick_barber` | ON |
| `allow_party_booking` | ON |
| `auto_no_show_minutes` | 15 |
| `early_arrival_grace_minutes` | 10 |
| `show_now_serving_on_customer_page` | ON |

### 6.12 Phase 1 non-goals

Payroll · statutory HR · MyInvois live submit · customer accounts · SMS notifications · separate clock-in app.

### 6.13 Phase 1B (deferred)

OTP/SMS reminder · deposit for no-show · customer self check-in.

---

## 7. Pricing & tiers (barbershop)

Source: `docs/modules/barbershop/features-and-pricing.md` · `docs/modules/barbershop/pricing-funnel.md`

### Plan prices (barbershop)

| Tier | Price | Target |
| :--- | :--- | :--- |
| **Ocelot Lite** | RM0 | Post-trial exit only — not signup |
| **Ocelot** | RM109/mo (RM1,090/yr) | 2–4 chairs, 3-barber shop |
| **Mantis** | RM199/mo | HitPay + 8 barbers, 2 locations |
| **Patriot** | RM349/mo | Multi-branch |
| **Founding barber** | RM89/mo locked | First 50 shops per city |

**Trial:** 14 days full Ocelot → subscribe or drop to **Lite** (1 barber, 25 bookings/mo, QR stays live).

### Lite vs Ocelot (limits)

| Limit | Lite | Ocelot |
| :--- | :--- | :--- |
| Barber profiles | 1 | 4 |
| POS terminals | 1 shared | 1 shared |
| Online bookings/mo | 25 | Unlimited |
| HitPay | Capped RM5k/mo | Unlimited |

---

## 8. Copy & voice

Source: `docs/design/copy-style.md`

**One-line spec:**

> Miki copy = short operational empathy. Name the shop's daily mess in plain words, promise relief in one line, kill the main objection beside it. Platform voice on the hub; vertical voice only on vertical pages. No feature paragraphs — headlines, tables, and fragments only. Calm, specific, Malaysian-practical. Never hype.

**Rules:**
- Pain before product
- One beat per block (headline + optional subhead/table)
- Hub (`/`) = platform; `/barbershop` = vertical language (chairs, barbers, haircuts)
- Objection in the same breath as claim
- Avoid em dashes in UI copy (use periods or commas)

Barbershop landing copy SSOT: `docs/modules/barbershop/marketing.md`

---

## 9. Codebase & prototypes

### Monorepo layout

```
apps/
  landing/           Marketing hub — :3000
  merchant-portal/   Owner web (O-xx) — :3001
  staff-pos/         Counter POS (P-xx) — :3002
  order-app/         Customer booking (C-xx) — :3003  ← working name for customer web
  admin-portal/      Miki internal ops — optional
packages/
  ui/                Shared design tokens (@miki/ui)
prototype/motion/    Motion gallery only
docs/                Product & engineering SSOT
```

### Run (from repo root)

```bash
npm install          # always at root — workspaces
npm run dev:landing  # :3000
npm run dev:portal   # :3001
npm run dev:pos      # :3002
npm run dev:order    # :3003 customer app
npm run dev:admin    # admin portal
```

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind v4 · `@miki/ui` tokens.

**Current prototype state:** Client-side only, in-memory state, no real API/auth/DB. Refresh resets demo data.

### Order-app demo phones

| Phone | Behaviour |
| :--- | :--- |
| `01161209203` | Returning guest (loyalty), one editable booking today |
| `0123456789` | Two bookings today; one **IN_SERVICE** (no edit/cancel), one editable |

Developer handoff: `HANDOFF.md` at repo root. Engineering PRD: `docs/requirements.md`.

---

## 10. Engineering modules (backend — planned)

Source: `docs/product/engineering-modules.md`

| ID | Module | Phase |
| :--- | :--- | :--- |
| MOD-01 | Auth & Session | 1A |
| MOD-02 | Subscription & Billing | 1A |
| MOD-03 | Store & Settings | 1A |
| MOD-04 | Staff & RBAC | 1A |
| MOD-05 | Service Menu | 1A |
| MOD-06 | Queue | 1A |
| MOD-07 | Checkout & Payments | 1A/1B |
| MOD-08 | Receipts | 1A |
| MOD-09 | Reporting | 1A |
| MOD-10 | Offline Sync | 1A |
| MOD-12 | Payment Rail (HitPay) | 1B |
| MOD-15 | Customers & Stamps | 1A |

**Build order:** M0 Auth → M1 Menu/Queue → M2 Checkout/Offline → M3 Billing/Reports → Launch → 1B Payments.

**Note:** Generic walk-in-only queue in early docs is **superseded** by barbershop hybrid booking + calendar spec.

---

## 11. Platform docs (universal)

Source: `docs/platform/README.md`

| Document | Purpose |
| :--- | :--- |
| `architecture.md` | Core vs country adapters |
| `pricing-model.md` | Trial → Lite → paid mechanics (no RM prices) |
| `payment-rails.md` | HitPay, C′ rail philosophy |
| `design-system/tokens.json` | Design token SSOT |
| `Miki Merchant Portal — Designer IA Brief.md` | Owner portal nav SSOT |
| `Miki Admin Portal — Designer IA Brief.md` | Internal admin IA SSOT |

---

## 12. Key customer screens (C-xx summary)

Source: `docs/modules/barbershop/ui.md` — full screen specs are longer; this is the index.

| ID | Name | Key points |
| :--- | :--- | :--- |
| C-01-01 | Shop QR landing | Book now · I have a booking · now serving |
| C-01-02 | Retrieve booking | Phone + date → status or pick list |
| C-05-01 | Select services | Party 1–6, per-person tabs, duration hint |
| C-06-01 | Pick barber | Skipped if flag off |
| C-06-02–03 | Date & time | Party duration blocks slot |
| C-06-04 | Your details | Nickname + phone required |
| C-06-05 | Review & confirm | Atomic slot lock; race → slot taken |
| C-06-06 | Confirmation | Queue #, save page, no SMS |
| C-06-08 | Booking status | Living page; poll/refresh; party progress |
| C-07-01 | Payment pending | Optional — pay at counter copy |
| C-08-01 | Digital receipt | After PAID; no LHDN e-invoice |

**Design notes:** Thumb-zone bottom CTAs · high contrast queue # · max width ~430px centered.

---

## 13. POS & owner (pointers)

**Staff POS UI:** `docs/design/staff-pos-ui-design.md` — personality, layout, status language.  
**Staff POS IA:** `docs/design/staff-pos-ia.md` — screen-by-screen.  
**Merchant portal IA:** `docs/platform/Miki Merchant Portal — Designer IA Brief.md` — do not duplicate nav elsewhere.

**POS nav (abbreviated):** Login → Barber picker → Today | Walk-in | Calendar | More → card → detail → add service → start → complete → pay.

---

## 14. What to read for specific tasks

| Task | Read first |
| :--- | :--- |
| Understand Miki | This file §1–3 |
| Build customer feature | §6 + `docs/modules/barbershop/ui.md` Part 1 + `apps/order-app/` |
| Build POS feature | `docs/requirements.md` + `docs/modules/barbershop/spec.md` + `docs/design/staff-pos-ia.md` |
| Build owner feature | `docs/platform/Miki Merchant Portal — Designer IA Brief.md` + `ui.md` Part 3 |
| Backend / HitPay / billing | **`docs/requirements.md`** + `docs/open-hitpay.md` |
| Pricing / packaging | `docs/modules/barbershop/features-and-pricing.md` |
| Marketing copy | `docs/modules/barbershop/marketing.md` + `docs/design/copy-style.md` |
| Backend module IDs | `docs/product/engineering-modules.md` |
| Business strategy | `docs/planning/initial-brd.md` |
| Timeline | `docs/planning/phase1-plan.md` |
| Finance | `docs/financial/ssot.md` |

---

## 15. Do not use as primary source

| Path | Why |
| :--- | :--- |
| `docs/archive/` | Parked (F&B Phase 2) |
| `prototype/motion/` | Motion feel only; prefer `apps/` for product UI |
| `docs/platform/payment-rails.md` | Early aggregator draft — **build HitPay from `docs/requirements.md`** |
| `.agents/` / `.cursor/` | Internal AI tooling, not product spec |

---

## 16. Full SSOT index

| Path | Role |
| :--- | :--- |
| `README.md` | Repo entry |
| `HANDOFF.md` | How to run the apps |
| `docs/README.md` | Doc router |
| `docs/for-ai.md` | **This file** — AI context bundle |
| `docs/requirements.md` | **Engineering PRD** (Round 26) |
| `docs/open-hitpay.md` | Unanswered HitPay questions |
| `docs/db-schema.json` | Schema dump |
| `docs/modules/barbershop/README.md` | Barbershop hub |
| `docs/modules/barbershop/spec.md` | Product rules (UX) |
| `docs/modules/barbershop/ui.md` | Screen specs |
| `docs/modules/barbershop/features-and-pricing.md` | Features + RM tiers |
| `docs/modules/barbershop/pricing-funnel.md` | Trial → Lite → paid |
| `docs/modules/barbershop/marketing.md` | `/barbershop` copy |
| `docs/platform/README.md` | Universal platform |
| `docs/product/engineering-modules.md` | Backend module IDs |
| `docs/planning/phase1-plan.md` | Execution timeline |
| `docs/planning/initial-brd.md` | Business strategy |
| `docs/financial/ssot.md` | Company financials |
| `apps/README.md` | Monorepo run commands |

---

*When updating product behaviour, edit the SSOT file first, then refresh this compiled summary if needed.*
