# UI Specification — Miki · Barbershop Phase 1

**Platform:** Miki · **Module:** Barbershop  
**Module hub:** [`README.md`](README.md)  
**Product spec:** [`spec.md`](spec.md)  
**Engineering modules:** [`../../product/engineering-modules.md`](../../product/engineering-modules.md)

This document combines information architecture and all screen specifications for the three surfaces: Customer web, Shared POS, and Owner web.

---

# Part 0 — Information Architecture

**Spec:** [`spec.md`](spec.md)

---

## Three surfaces

```mermaid
flowchart TB
    subgraph customer [Customer - phone browser]
        C1[Shop QR landing]
        C2[Book flow]
        C3[My booking status]
    end
    subgraph pos [POS - shared counter machine]
        P1[Barber switcher]
        P2[Today board]
        P3[Booking detail]
        P4[Checkout]
    end
    subgraph owner [Owner - merchant web]
        O1[Dashboard]
        O2[Calendar]
        O3[Services & barbers]
        O4[Reports]
    end
    C1 --> C2 --> C3
    P2 --> P3 --> P4
    O2 --> O3
```

| Code | Surface | Device | Login |
| :--- | :--- | :--- | :--- |
| **C-** | Customer web | Customer phone | None (booking token in URL) |
| **P-** | POS | 1 shop tablet/PC | Shop session + barber switch |
| **O-** | Owner web | Laptop | Owner account |

---

## Screen ID format

`{surface}-{module}-{seq}` — e.g. `C-06-03` = Customer, module booking, screen 3.

---

## Global navigation

### Customer web (no tab bar — linear + status page)
```
QR Landing → Book (multi-step) → Confirmation + bookmark URL
                                    ↓
                            Status page (poll/WebSocket)
```

### POS (single machine)
```
Login → Barber picker (persistent header)
     → Today | Walk-in | Calendar peek | More
Today → Booking card → Detail → [Add service] → Start → Complete → Pay
```

### Owner web (sidebar)
```
Dashboard
Calendar (all barbers)
Bookings list
Services
Barbers & caps
Walk-in slot rules
Devices & billing
Reports
Settings
```

---

## Module map → screens

| Module | Customer | POS | Owner |
| :--- | :--- | :--- | :--- |
| MOD-01 Auth | — | P-01 | O-01 |
| MOD-05 Menu | C-05 | P-05 | O-05 |
| MOD-06 Queue/Book | C-06 | P-06 | O-06 |
| MOD-07 Pay | C-07 | P-07 | — |
| MOD-08 Receipt | C-08 | P-08 | — |
| MOD-09 Reports | — | P-09 | O-09 |
| MOD-10 Offline | — | P-10 | — |

Detail: [`#part-1--customer-web`](#part-1--customer-web), [`#part-2--pos-shared-counter`](#part-2--pos-shared-counter), [`#part-3--owner-web`](#part-3--owner-web).

---

# Part 1 — Customer Web

**Audience:** Customer (no account)  
**Device:** Mobile browser  
**Labels:** EN primary · BM in parentheses where customer-facing

---

## C-01 Auth & entry

### C-01-01 Shop QR landing
| Field | Detail |
| :--- | :--- |
| **Entry** | Scan printed QR at shop |
| **Purpose** | Identify shop; start book or view board |
| **Components** | Shop name, logo, hours today, “Book now” CTA, “Now serving #N” ticker |
| **Actions** | Book now → C-06 flow · View my booking → C-01-02 |
| **States** | Shop closed (hours), offline (cached hours) |
| **BM** | *Tempah sekarang* · *Sedang layan #N* |

### C-01-02 Retrieve booking
| Field | Detail |
| :--- | :--- |
| **Entry** | Landing “I have a booking” |
| **Purpose** | No account — find by phone + date |
| **Components** | Phone input, date picker (default today), Submit |
| **Actions** | Match → C-06-08 Status page |
| **Errors** | Not found, multiple → pick one |
| **PDPA** | One-line consent under phone field |

---

## C-05 Services (booking step)

### C-05-01 Select services
| Field | Detail |
| :--- | :--- |
| **Entry** | From C-01-01 Book |
| **Purpose** | Pick planned services + party size |
| **Components** | Category list, service cards (name, price, duration), party size stepper (1–6) |
| **Actions** | Next → C-06 barber/time |
| **Rules** | Total duration hint: “~45 min for 2 people” |
| **States** | Empty menu (shop misconfigured) |

---

## C-06 Booking & calendar

### C-06-01 Pick barber (if enabled)
| Field | Detail |
| :--- | :--- |
| **Entry** | After services |
| **Purpose** | Choose barber or “Anyone available” |
| **Components** | Barber cards: photo, name, **Full** badge, next free slot time |
| **Skip** | If `allow_customer_pick_barber` OFF → auto C-06-02 |
| **BM** | *Penuh* |

### C-06-02 Pick date
| Field | Detail |
| :--- | :--- |
| **Components** | Horizontal date strip (7–14 days), disabled past days |
| **Actions** | Select day → C-06-03 |

### C-06-03 Pick time slot
| Field | Detail |
| :--- | :--- |
| **Components** | Grid of slots (respect duration+buffer), greyed = taken / walk-in-only |
| **Actions** | Select slot → C-06-04 |
| **Empty** | “Fully booked — try another barber or date” |

### C-06-04 Your details
| Field | Detail |
| :--- | :--- |
| **Components** | Nickname (required), phone (required), notes optional |
| **Validation** | Phone MY format; soft cap 1 active booking/phone/day |
| **Actions** | Confirm → C-06-05 |

### C-06-05 Review & confirm
| Field | Detail |
| :--- | :--- |
| **Components** | Summary: services, party size, barber, date/time, est. duration, total price |
| **Actions** | Confirm booking → C-06-06 |
| **Logic** | Server atomic slot lock; race → “Slot just taken” |

### C-06-06 Confirmation
| Field | Detail |
| :--- | :--- |
| **Components** | **Queue #42**, barber, datetime, “Save this page” prompt |
| **Components** | Copy link button, bookmark instruction |
| **No SMS v1** | URL contains `booking_token` |
| **Actions** | View status → C-06-08 |

### C-06-07 Now serving board (optional tab)
| Field | Detail |
| :--- | :--- |
| **Purpose** | Shop-wide + per-barber now serving |
| **Components** | Large # display, barber columns if 3 chairs |
| **Refresh** | Poll 10s or WebSocket |

### C-06-08 Booking status (living page)
| Field | Detail |
| :--- | :--- |
| **Entry** | Confirmation URL or retrieve flow |
| **Components** | Status chip, queue #, barber name, planned services, slot time |
| **Components** | “Now serving: #40” (shop), your #42 |
| **States** | BOOKED, ARRIVED, IN_SERVICE, PAID, NO_SHOW |
| **NO_SHOW** | Message + “Book again” → C-01-01 |
| **PAID** | Link to C-08 receipt |
| **Note** | No push — user refreshes or keeps page open |

---

## C-07 Payment (customer passive)

*Customer does not pay on web in v1 — payment at counter.*

### C-07-01 Payment pending (optional on status page)
| Field | Detail |
| :--- | :--- |
| **When** | IN_SERVICE → COMPLETED, before PAID |
| **Copy** | “Please pay at counter” |

---

## C-08 Receipt

### C-08-01 Digital receipt
| Field | Detail |
| :--- | :--- |
| **Entry** | Status page after PAID or counter receipt QR |
| **Components** | Shop name, date, services (actual), total, payment method, barber name |
| **No** | LHDN e-invoice |
| **Actions** | Share / screenshot |

---

## Customer flow diagram

```
C-01-01 Landing
    → C-05-01 Services (+ party size)
    → C-06-01 Barber? (flag)
    → C-06-02 Date
    → C-06-03 Time
    → C-06-04 Details
    → C-06-05 Review
    → C-06-06 Confirmed (# + URL)
    → C-06-08 Status (lifecycle)
    → C-08-01 Receipt (when paid)
```

**Phase 1A screen count:** 14 core + 4 state variants ≈ **18 frames**

---

## Design notes

- Thumb-zone CTAs bottom fixed  
- High contrast for queue # (elderly customers)  
- BM toggle on landing (Phase 1B) — English first OK for v1  
- Max width 430px centered

---

# Part 2 — POS (Shared Counter)

**Audience:** Barber / owner operating **one shared machine**  
**Device:** Tablet or PC at counter (web app or RN — designer choice; optimise landscape)

---

## P-01 Session

### P-01-01 Shop login
| Field | Detail |
| :--- | :--- |
| **Purpose** | Start terminal session (1 device registration) |
| **Components** | Email/password or stay logged in |
| **After** | P-01-02 Barber switcher |

### P-01-02 Barber switcher (persistent header)
| Field | Detail |
| :--- | :--- |
| **Purpose** | Attribute actions to Ali / Siti / Ben |
| **Components** | 3 avatars, active highlight, “Manager” if owner |
| **Behaviour** | Tap to switch — no full logout |
| **Audit** | All actions store `acting_barber_id` |

---

## P-06 Today board (core)

### P-06-01 Today timeline
| Field | Detail |
| :--- | :--- |
| **Purpose** | All bookings + walk-ins for selected day |
| **Components** | Time axis, cards colour-coded: Online / Walk-in / Arrived / In chair / Done |
| **Components** | Filter: All barbers | Ali | Siti | Ben |
| **Actions** | Tap card → P-06-03 · FAB → P-06-02 Walk-in |
| **Offline** | P-10 banner; data from cache |

### P-06-02 New walk-in
| Field | Detail |
| :--- | :--- |
| **Purpose** | Add walk-in without customer phone flow |
| **Components** | Name, phone optional, services, barber (or next free), walk-in slot picker |
| **Rules** | Cannot occupy booked slot; can use walk-in-only blocks |
| **Actions** | Create → appears on board |

### P-06-03 Booking detail
| Field | Detail |
| :--- | :--- |
| **Purpose** | Single booking control panel |
| **Shows** | #, nickname, phone (tap to call), planned services, barber, time, status |
| **Actions** | **Mark arrived** · **No-show** · **Cancel** · **Reassign barber** (if not IN_SERVICE) |
| **Actions** | **Add service** → P-06-04 · **Start cut** · **Complete** → P-07 |

### P-06-04 Add / change services (add-on)
| Field | Detail |
| :--- | :--- |
| **Purpose** | Beard trim etc. at chair |
| **Components** | Planned list + “Add service” catalogue search |
| **Warning** | Yellow banner if extends into next booking |
| **Actions** | Save → updates `actual_services` on booking |

### P-06-05 Reassign barber
| Field | Detail |
| :--- | :--- |
| **When** | Before IN_SERVICE |
| **Components** | Barber list with availability / Full |
| **Actions** | Confirm → updates customer status page on sync |

### P-06-06 No-show confirm
| Field | Detail |
| :--- | :--- |
| **Trigger** | Manual or auto 15 min late indicator on card |
| **Components** | “Mark no-show?” · Override “They just arrived” |
| **Effect** | Slot freed; status NO_SHOW on customer web |

---

## P-07 Checkout & payment

### P-07-01 Payment screen
| Field | Detail |
| :--- | :--- |
| **Entry** | After **Complete** on booking |
| **Shows** | Actual services, subtotal, linked booking # |
| **Methods** | **[HitPay QR]** (highlight) · **[HitPay card]** · Cash · Own DuitNow |
| **Phase 1A** | Cash + Own DuitNow only |
| **Phase 1B** | HitPay — show subtotal + 2% service fee + total |
| **Actions** | Complete payment → P-08 |

### P-07-02 HitPay (Phase 1B)
| Field | Detail |
| :--- | :--- |
| **Components** | Line items RM40.00 · Service fee (2%) RM0.80 · **Total RM40.80** |
| **QR mode** | Large QR, polling spinner |
| **Card mode** | Tap to pay on phone |
| **On paid** | Auto P-08 + show receipt link / counter QR |

---

## P-08 Receipt handoff

### P-08-01 Payment success
| Field | Detail |
| :--- | :--- |
| **Components** | Total paid, method, receipt link QR for customer to scan |
| **Actions** | Show receipt QR · New walk-in · Done |
| **Backend** | Link to C-08-01 (no SMS v1) |

---

## P-09 Quick stats (drawer)

### P-09-01 My day (barber)
| Field | Detail |
| :--- | :--- |
| **Shows** | Cuts today, revenue today (acting barber) |
| **Access** | Header menu |

---

## P-10 Offline

### P-10-01 Offline banner (global)
| Field | Detail |
| :--- | :--- |
| **Copy** | “Offline — saving locally (12 pending)” |
| **Behaviour** | All P-06 actions queue; sync icon when back |

---

## POS flow (happy path)

```
P-01-02 Switch barber (Ali)
  → P-06-01 See 2:00pm booking #42
  → P-06-03 Mark arrived
  → P-06-04 Add beard trim
  → Start cut → IN_SERVICE
  → Complete → P-07-01 Pay (HitPay)
  → P-08-01 Receipt link / counter QR shown
```

**Phase 1A POS frames:** ~16 + offline/error variants ≈ **20 frames**

---

## Design notes

- **Landscape first** — timeline left, detail right on wide screens  
- Portrait: board list → full-screen detail  
- Touch targets 48dp+ for wet/gloomy hands  
- Status colours: Waiting=blue, Arrived=amber, In chair=purple, Paid=green, No-show=grey

---

# Part 3 — Owner Web

**Audience:** Shop owner (often also a barber)  
**Device:** Desktop / laptop (responsive tablet OK)

---

## O-01 Auth & onboarding

### O-01-01 Sign up / Login
Standard merchant auth (see MOD-01).

### O-01-02 Onboarding wizard
| Step | Screen |
| :--- | :--- |
| 1 | Shop name, address, phone |
| 2 | Add barbers (Lite: 1 · Ocelot: up to 4 · Mantis: up to 8) |
| 3 | Add services + duration + buffer |
| 4 | Set hours + daily caps per barber |
| 5 | Plan picker (trial) |

---

## O-05 Services & catalogue

### O-05-01 Service list
CRUD services: name, price, duration min, buffer min, category.

### O-05-02 Service edit
Photo optional; active toggle.

---

## O-06 Calendar & capacity

### O-06-01 Master calendar
| Field | Detail |
| :--- | :--- |
| **View** | Week view, 3 barber columns (Ali | Siti | Ben) |
| **Shows** | Bookings, walk-in blocks, walk-ins |
| **Actions** | Click slot → booking detail · drag reassign (Phase 1B) |

### O-06-02 Barber settings
| Field | Detail |
| :--- | :--- |
| **Per barber** | Name, photo, working hours template |
| **Cap** | `max_bookings_per_day` (burnout) |
| **Toggle** | Active / on leave |

### O-06-03 Walk-in slot blocks
| Field | Detail |
| :--- | :--- |
| **Purpose** | Paint “walk-in only” on timetable |
| **UI** | Drag block on calendar · repeat weekly |
| **Example** | Sat 12–2pm peak walk-in only |

### O-06-04 Shop booking rules
| Field | Detail |
| :--- | :--- |
| **Flags** | Allow customer pick barber (ON/OFF) |
| **Flags** | Auto no-show minutes (default 15) |
| **Flags** | Early arrival grace (10) |

### O-06-05 QR codes
Print shop QR (customer landing), optional per-barber marketing QR.

---

## O-09 Reports

### O-09-01 Dashboard
Today: bookings, walk-ins, revenue, no-shows.

### O-09-02 Per-barber revenue
Table: barber, cuts, gross, avg ticket.

### O-09-03 Export
CSV date range.

---

## O-settings Billing & staff

### O-02-01 Billing
Plan, usage, upgrade (from [`../planning/initial-brd.md`](../planning/initial-brd.md)).

### O-04-01 Staff / barber accounts
Link login to barber profile for POS switcher (optional password per barber for switch PIN).

---

## Owner screen count

~**14 frames** for Phase 1A setup + calendar + reports.

---

## Design notes

- Calendar is the **hero** screen post-onboarding  
- Cap sliders with helper: “Ali usually takes 12 cuts/day”  
- Mobile web read-only calendar OK for owner on phone
