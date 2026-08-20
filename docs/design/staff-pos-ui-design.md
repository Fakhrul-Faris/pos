# Staff POS — UI Design Document

**Status:** v1.0 — Design authority for P-xx  
**Surface:** Shared counter tablet (`apps/staff-pos`)  
**Audience:** Barber / owner-operator on one shared machine  
**Theme in prototype:** Visitors language ([`themes/visitors-design.md`](themes/visitors-design.md))  
**Token SSOT (platform):** [`../platform/design-system/`](../platform/design-system/)  
**Screen IDs:** [`../modules/barbershop/ui.md`](../modules/barbershop/ui.md) · Part 2  
**IA (screen-by-screen):** [`staff-pos-ia.md`](staff-pos-ia.md)  
**Product rules:** [`../modules/barbershop/spec.md`](../modules/barbershop/spec.md)  
**Prototype capabilities:** [`../../apps/staff-pos/README.md`](../../apps/staff-pos/README.md)

This document turns the **Staff POS UX requirements** into concrete UI direction: personality, layout, components, states, motion, and screen composition rules. It does not replace product rules in `spec.md` or screen inventory in `ui.md` — it tells design and frontend **how those screens must look and behave**.

---

## 1. Direction sentence

> **A floor instrument, not a dashboard — glanceable lanes, one next verb, money-clear at checkout.**

**Short form (Penpot cover / mood board):**  
*Counter-first. Chair-speed. Attribution always visible.*

---

## 2. Personality

| Adjective | What it means in UI |
| :--- | :--- |
| **Instrumental** | Every pixel earns its place in a 10-second decision. No marketing chrome on the floor. |
| **Glanceable** | Queue #, status, and who’s in chair readable at arm’s length (~1–1.5 m). |
| **Decisive** | Exactly one dominant primary action per booking state. Secondary actions recede. |
| **Honest** | Offline, late, payment timeout, and conflicts are first-class — never silent. |
| **Attributed** | Acting barber is always visible; money and actions never feel anonymous. |

### Anti-personality (avoid)

| Avoid | Why |
| :--- | :--- |
| Portal density | Tables, sidebars, and settings depth belong in Merchant Portal. |
| Salon kitsch | Scissors motifs, pink “beauty” palettes, cute empty states. |
| Dashboard sprawl | KPI strips, charts, and “insights” on the floor compete with who’s next. |
| Hover-only UX | Shared tablet; wet/dirty hands; no mouse assumed. |
| Clever multi-step wizards | Walk-in and checkout must feel like counters, not onboarding. |

---

## 3. Design filter

Use this on every POS screen, component, or copy decision:

```
Is the user mid-service or mid-queue?
  YES → instrument mode (lanes, one verb, large targets)
  NO  → still instrument mode, just quieter (login, end session, My day)
```

| Moment | UI mode | Density | Primary job |
| :--- | :--- | :--- | :--- |
| Floor board | Instrument | Medium | See who’s next |
| Booking detail | Instrument | Medium | Execute next verb |
| Walk-in / party | Instrument | Medium | Create / split fast |
| Checkout | Precise | Medium-tight | Pay without dispute |
| Receipt | Precise + delight | Medium | Confirm + hand off |
| My day / search | Quiet ops | Medium | Glance / find |
| Offline / timeout | Honest | Medium | Keep shop moving |

Money moments (checkout, receipt, fee line) tighten number alignment and label precision — same light canvas, no dark theme switch.

---

## 4. Device & layout system

### 4.1 Target devices

| Class | Viewport | Layout |
| :--- | :--- | :--- |
| **Primary** | Tablet landscape ≥1024px | Split: **board left · detail right** |
| **Secondary** | Tablet / large phone portrait | Board full bleed → **detail as drawer / sheet** |
| **Fallback** | Desktop browser | Same as landscape split |

### 4.2 Shell anatomy

```
┌─────────────────────────────────────────────────────────────┐
│ Offline banner (conditional, full width)                    │
├─────────────────────────────────────────────────────────────┤
│ Shop · Today          [Barber switcher]   [My day][Search]  │
│ End session                                 [Walk-in ★]     │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│   TODAY BOARD                │   BOOKING DETAIL (lg+)       │
│   Lanes or Timeline          │   or empty “Select a booking”│
│                              │                              │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
│ Drawers / modals overlay shell (walk-in, pay, party, …)     │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Layout rules

| Rule | Spec |
| :--- | :--- |
| Board : detail split | ~58% / 42% on `lg+`; detail min-width ~360px |
| Header height | Compact; controls `min-h-12` (48px) |
| Safe margins | 16–20px page padding; 12–16px card gaps |
| FAB / primary create | **Walk-in** lives in header as filled primary — always visible |
| Prod chrome | Demo time slider / offline toggle → **staff tools** only; never primary header in production |
| No left sidebar | POS is not the portal |

### 4.4 Traceability (UX → layout)

| UX req | UI expression |
| :--- | :--- |
| R-02 / R-04 Barber switch | Persistent avatar rail + active ring + toast “Now acting as …” |
| R-10–R-20 Floor | Lanes / timeline + status accents + shared waiting queue |
| R-17 Landscape/portrait | Split panel vs drawer |
| R-40 Walk-in always visible | Header primary CTA |
| R-85 No portal chrome | Shell contains only floor ops |

---

## 5. Colour & status language

### 5.1 Canvas (Visitors / POS prototype)

| Role | Token (prototype) | Use |
| :--- | :--- | :--- |
| Page | `linen` | App background |
| Surface | `paper-white` | Header, cards, drawers |
| Border | `fog` | Hairlines, lane dividers |
| Text primary | `carbon` | Titles, queue # |
| Text secondary | `graphite` | Body, meta |
| Text muted | `ash` | Labels, timestamps |
| Primary action | `lavender` | Filled CTAs, selected barber, in-chair accent |
| Danger / exit | `ember` | Destructive / end session hover |

Platform token migration may map these to Miki neutrals + accent; **status semantics below stay fixed** even if hex values shift.

### 5.2 Booking status accents (colour + label)

Never colour alone — always pair with badge text.

| Status | Accent | Badge label | Card treatment |
| :--- | :--- | :--- | :--- |
| Upcoming / confirmed | Sky | Upcoming | Cool left rail |
| Arrived / checked-in | Amber | Arrived | Warm left rail |
| In service | Lavender | In chair | Strong left rail + elevated presence |
| Completed / paid | Mint | Done / Paid | Soft success tint |
| Late (upcoming +15m) | Amber + late chip | Late | Late banner on board + card chip |
| No-show / cancelled | Ash / fog | No-show / Cancelled | Desaturated; reduced contrast |

### 5.3 Source tinting

| Source | UI cue |
| :--- | :--- |
| Online | Subtle cool tint or “Online” micro-label |
| Walk-in | Neutral / warm micro-label “Walk-in” |

### 5.4 Payment & system

| State | UI |
| :--- | :--- |
| Online | No banner |
| Offline | Persistent top banner: “Offline — saving locally (N pending)” |
| HitPay waiting | Spinner + amount locked |
| HitPay timeout | Full timeout panel: Retry · Other method · Record cash |
| Success | Receipt surface + optional confetti (short, once) |

---

## 6. Typography

| Role | Size | Weight | Use |
| :--- | :--- | :--- | :--- |
| Queue number | 20–28px | 600–700 | Cards + detail hero |
| Screen title | 18–20px | 500–600 | “Today”, drawer titles |
| Card primary | 15–16px | 500–600 | Customer name |
| Card meta | 12–13px | 400–500 | Service, time, barber |
| Badge | 11–12px | 500 | Status chips |
| Price / total | 18–28px | 600 | Checkout total (tabular nums) |
| Caption | 12px | 400–500 | Fee lines, helper text |

**Rules**

- Prefer **tabular figures** on money.
- Queue # must outrank service name in visual hierarchy.
- Avoid long paragraphs on floor UI — one short helper line max.

---

## 7. Spacing, targets, shapes

| Token | Value | POS use |
| :--- | :--- | :--- |
| Touch target | **≥48px** height | All primary/secondary buttons, barber avatars, Take |
| Card radius | 12–16px | Booking cards, panels |
| Drawer radius | 16–24px top (portrait sheets) | Walk-in, pay, party |
| Button radius | Full pill or 9999px | Matches Visitors; large hit area |
| Row height (lanes) | ≥56px tap row | Waiting list / Take rows |
| Icon + label | Prefer label; icon-only only if affordance is universal | Search may be icon+text |

---

## 8. Component inventory

### 8.1 Shell

| Component | Behaviour |
| :--- | :--- |
| **OfflineBanner** | Full-width; shows pending count; non-dismissible while offline |
| **BarberSwitcher** | Avatar rail + Manager chip; active state obvious; tap to switch |
| **Header actions** | Ghost: My day, Search · Primary: Walk-in · Session: End session (text, confirm) |
| **Toast** | Success / info / error; short; does not block primary path |

### 8.2 Floor

| Component | Behaviour |
| :--- | :--- |
| **Lane column** | Per barber: Now · Waiting · Upcoming |
| **BookingCard** | Queue #, name, services, time, status rail, source, late chip |
| **PartyCard** | “Party of N” treatment; distinct from solo |
| **SharedWaitingQueue** | Cross-lane list + **Take** bound to acting barber |
| **StaffFilter** | All \| individual barber |
| **ViewToggle** | Lanes ↔ Timeline |
| **LateSummary** | Board-level banner when late bookings exist |
| **EmptyBoard** | One sentence + Walk-in CTA |

### 8.3 Detail & lifecycle

| Component | Behaviour |
| :--- | :--- |
| **BookingDetail** | Panel (lg+) or drawer; shows #, name, phone (tap-to-call), services, barber, time, status |
| **PrimaryVerbButton** | Single filled CTA for next state (Arrive → Start → Complete → Pay) |
| **SecondaryActions** | Ghost/outline: Reassign, Add service, No-show, Cancel |
| **AddServiceDrawer** | Catalogue; yellow overlap warning if extends into next booking |
| **ReassignDrawer** | Barber list + availability; blocked when IN_SERVICE |
| **NoShowModal** | Confirm + escape “They just arrived” |

### 8.4 Party

| Component | Behaviour |
| :--- | :--- |
| **PartyCheckIn** | Per-member Here / No-show toggles; confirm → assign |
| **PartyAssign** | Chair columns; busy banner; per-member Start/Complete; **Start all ready** |
| **PartyPaymentLines** | name · service · barber · price; no-shows omitted |

### 8.5 Checkout & receipt

| Component | Behaviour |
| :--- | :--- |
| **CashierScreen** | Full-screen pay: bill, methods (Cash / QR / Card), keypad / customer handoff |
| **MethodTile** | Cash · Own DuitNow · HitPay QR · HitPay card |
| **HitPayQR** | Large QR, amount, waiting state |
| **HitPayCard** | Terminal guidance copy + waiting |
| **PaymentTimeout** | Retry / other method / record cash |
| **ReceiptSuccess** | Amount, method, receipt QR, Done · New walk-in |
| **ReceiptTicket** | Optional printer-slide motion on success |

### 8.6 Find & stats

| Component | Behaviour |
| :--- | :--- |
| **SearchModal** | Query name / phone / service / staff / queue #; results → open detail |
| **StatsDrawer (My day)** | Cuts + revenue for acting barber; Manager = shop totals; recent tx list |

### 8.7 Walk-in

| Component | Behaviour |
| :--- | :--- |
| **WalkInDrawer** | Name (req), phone (opt), services, barber or Anyone, walk-in slot picker |
| **SlotPicker** | Booked slots blocked; walk-in-only blocks allowed |

---

## 9. Screen compositions (UI specs)

Screen IDs align with [`ui.md`](../modules/barbershop/ui.md) Part 2.

### P-01-01 Shop login

| Element | Spec |
| :--- | :--- |
| Layout | Centered card on linen; max-width ~380px |
| Fields | Shop credentials (prototype: any) |
| CTA | Full-width primary “Start session” |
| Copy | Plain: shop name context, not marketing hero |

### P-01-02 Barber switcher (header)

| Element | Spec |
| :--- | :--- |
| Placement | Header center/left cluster — always visible after login |
| Active | Ring / fill contrast; name or initial clear |
| Manager | Distinct chip (not a fourth fake barber avatar style) |
| Feedback | Toast on change |

### P-06-01 Today board

| Zone | Content |
| :--- | :--- |
| Filters | All / barber · Lanes / Timeline |
| Columns | One per visible barber |
| Shared queue | Waiting pool + Take |
| Cards | Status rail + # + name + service + time |
| Late | Chip on card + optional board banner |
| Empty | CTA to Walk-in |

**Composition rule:** Metadata (phone, source) never outranks # and status.

### P-06-02 Walk-in

| Step | UI |
| :--- | :--- |
| Form | Single drawer; no multi-page wizard |
| Validation | Block submit without name + ≥1 service |
| Slot | Visual picker; illegal slots disabled, not hidden without reason |
| Success | Drawer closes; card appears in lane; toast optional |

### P-06-03 Booking detail

| State | Dominant CTA | Secondary |
| :--- | :--- | :--- |
| Confirmed / upcoming | **Mark arrived** | No-show, Cancel, Reassign |
| Arrived | **Start cut** | Add service, Reassign, Cancel |
| In service | **Complete** | Add service |
| Ready to pay | **Take payment** | — |
| Party booked | **Check in party** | — |

**Layout:** Hero block = # + name + status. Services list. Then action stack (primary full-width, secondaries below or overflow).

### P-06-04 Add service

| Element | Spec |
| :--- | :--- |
| List | Planned services + add from catalogue |
| Warning | Amber banner if overlap with next booking |
| Save | Updates actual services; returns to detail |

### P-06-05 Reassign

| Element | Spec |
| :--- | :--- |
| List | Barbers with availability / Full |
| Guard | Unavailable when IN_SERVICE — explain why |

### P-06-06 No-show confirm

| Element | Spec |
| :--- | :--- |
| Title | “Mark no-show?” |
| Escape | “They just arrived” (returns without marking) |
| Confirm | Destructive styling |

### P-06-07 Party check-in

| Element | Spec |
| :--- | :--- |
| Header | Queue # · Party of N · “Booked N · adjust before assigning” |
| Rows | Member name + services + Here / No-show control (≥48px) |
| CTA | Confirm arrival → Assign |

### P-06-08 Party assign

| Element | Spec |
| :--- | :--- |
| Columns | One per barber / chair |
| Busy | Banner when barber finishing another # |
| Actions | Start / Complete per member; Start all ready |
| Exit | When all arrived members done → Payment |

### P-07-01 Payment

| Element | Spec |
| :--- | :--- |
| Hierarchy | Line items → subtotal → fee (if any) → **Total** |
| Party | Grouped member lines |
| Methods | 2×2 or horizontal tiles; selected state strong |
| Phase 1A | Cash + Own DuitNow emphasized |
| Phase 1B | HitPay QR highlighted as recommended |

### P-07-02 HitPay

| Mode | Spec |
| :--- | :--- |
| QR | Large QR (≥200px), amount, “Waiting for payment…” |
| Card | Terminal illustration/copy, hold guidance |
| Timeout | Dedicated panel — not only a toast |

### P-08-01 Receipt success

| Element | Spec |
| :--- | :--- |
| Confirmation | Total + method |
| Handoff | Receipt QR (customer scans) |
| Motion | Short printer-slide / confetti (interruptible, once) |
| CTAs | **Done** (default) · **New walk-in** |

### P-09-01 My day

| Element | Spec |
| :--- | :--- |
| Stats | Cuts today · Revenue today |
| Scope | Acting barber; Manager = shop |
| List | Recent transactions (compact rows) |

### P-10-01 Offline

| Element | Spec |
| :--- | :--- |
| Banner | Always on while offline |
| Copy | “Offline — saving locally (N pending)” |
| Sync | Toast on reconnect with count |

---

## 10. Interaction & motion

Aligned with [`10 Principles for Fluid UI.md`](10%20Principles%20for%20Fluid%20UI.md) and [`motion-prototype.md`](motion-prototype.md).

| Principle | POS application |
| :--- | :--- |
| Interruptible | Closing a drawer mid-open reverses; don’t lock the floor |
| Direct manipulation | Portrait sheets dismissible by drag where implemented |
| Shared element (optional) | Card → detail expansion on landscape preferred over hard cut |
| Stagger | Board load: light cascade OK; never delay Take / Walk-in |
| Payment morph | Brief confirm feedback on method → pay |
| Receipt delight | 1–1.5s max celebration; then static QR |

**Motion budget**

- Micro (switch, toast): ≤200ms feel  
- Drawer enter/exit: spring, interruptible  
- Success celebration: once, skippable by tapping Done  

---

## 11. Content & microcopy

| Pattern | Do | Don’t |
| :--- | :--- | :--- |
| Verbs | Mark arrived, Start cut, Take payment | Process, Submit, Engage |
| Errors | “Payment issue — Retry or record cash” | “Error 504 gateway” |
| Offline | “Saving locally (3 pending)” | “Network unavailable” only |
| Attribution | “Now acting as Hafiz” | Silent switch |
| Fees | “Subtotal · Service fee 2% · Total” | Fee hidden until charge |
| Empty | “No bookings yet — add a walk-in” | Illustration essay |

Language: **EN primary**. BM customer-facing strings are Customer Web / Phase 1B — not required on staff chrome in v1.

---

## 12. States matrix

Every interactive surface must define:

| State | UI expectation |
| :--- | :--- |
| Default | Clear primary |
| Loading | Button pending / skeleton on board refresh — keep last known board visible |
| Empty | One CTA |
| Error | Actionable recovery |
| Disabled | Explain (e.g. Reassign disabled in chair) |
| Offline | Banner + queued mutations |
| Success | Toast or receipt screen; return path obvious |

---

## 13. Accessibility & inclusive design

| Requirement | Spec |
| :--- | :--- |
| Contrast | Status text + accent; WCAG AA for body and CTAs |
| Colour | Status never colour-only |
| Targets | ≥48×48px |
| Focus | Keyboard usable on desktop fallback |
| Motion | Respect reduced-motion: skip confetti / printer slide |
| Call | Phone presented as button with accessible name |

---

## 14. Do / Don’t (design QA)

### Do

- Keep **one** filled primary per detail state  
- Show acting barber at all times  
- Make queue # the loudest number on a card  
- Put Walk-in in the header as the create path  
- Design payment timeout as a full stop with exits  
- Hide prototype-only controls in production builds  

### Don’t

- Add portal modules (payroll, inventory, catalogue edit) to POS  
- Use equal-weight button rows for Arrive / Cancel / No-show  
- Hide fee until after QR is shown  
- Rely on hover tooltips for critical actions  
- Let offline fail silently  
- Treat party bookings as N solo cards without party chrome  

---

## 15. Design deliverables checklist

| Deliverable | Notes |
| :--- | :--- |
| Personality + this UI doc | Done (this file) |
| Penpot: shell + board (lanes + timeline) | Landscape + portrait |
| Penpot: booking detail states | Confirmed → Arrived → In chair → Pay |
| Penpot: walk-in | Single drawer |
| Penpot: party check-in + assign | Parallel chairs |
| Penpot: payment + HitPay + timeout + receipt | Precise mode |
| Penpot: offline banner + My day + search | Quiet ops |
| Motion refs | Link frames to `motion-prototype.md` components |
| Redlines | Touch 48px, split %, type roles, status accents |

**Frame count target:** ~26 Phase 1A POS frames (per `ui.md`) including party + HitPay variants.

---

## 16. UX requirement → UI mapping

| UX ID | UI home |
| :--- | :--- |
| R-01–R-07 Session | P-01 shell, login, end session modal |
| R-10–R-21 Floor | P-06-01 board components |
| R-30–R-38 Lifecycle | P-06-03–06 detail + drawers |
| R-40–R-45 Walk-in | P-06-02 |
| R-50–R-56 Party | P-06-07 / 08 + P-07 party lines |
| R-60–R-67 Checkout | P-07 / P-08 |
| R-70–R-74 Ops | P-09 / P-10 |
| R-80–R-88 Quality | Global rules §§5–14 |

---

## 17. Out of scope (this surface)

- Merchant Portal IA, reports depth, roster, payroll, inventory  
- Customer web booking / status page visuals  
- F&B Phase 2 POS  
- SMS / e-invoice  
- Per-barber personal phones as primary POS  

---

## 18. Revision

| Version | Date | Notes |
| :--- | :--- | :--- |
| 1.0 | 2026-07-27 | Initial UI design doc from Staff POS UX requirements |
