# Barbershop Product Spec — Miki Phase 1 (Authoritative)

**Platform:** Miki  
**Module:** Barbershop (first vertical)  
**Context:** 3 barbers, 1 shared POS, hybrid online + walk-in.
**Module hub:** [`README.md`](README.md)  
**Supersedes:** Generic walk-in-only queue in early `engineering-modules.md` for barbershop vertical.  
**Features & pricing:** [`features-and-pricing.md`](features-and-pricing.md)

---

## 1. Roles & devices

### Reality (Malaysia)
The **owner is often a working barber**. One person may be manager in the morning and cutting hair all day. Design for **barber-operator**, not separate “manager class” only.

| Role | Typical person | Device | Capabilities |
| :--- | :--- | :--- | :--- |
| **OWNER** | Shop owner | Web (home) + POS | Everything: calendar, caps, menu, barbers, reports, billing |
| **BARBER** | Chair worker (may be owner) | **Shared POS** | Own queue, mark arrived, reassign (if not started), add services, payment, own day stats |
| **CUSTOMER** | Walk-in / online | **Phone browser** | Book, pick barber (if enabled), status, receipt link — **no account** |

### Shared POS (1 machine)
- One **shop terminal session** on tablet/PC at counter.
- **Quick barber switch:** tap barber avatar → actions attributed to that barber (revenue, audit).
- Optional **4-digit PIN** for void/refund (owner only).
- Not 3 separate device registrations for 3 barbers — **1 device, N barber profiles**.

---

## 2. Customer identity (no account)

| Field | Required | Notes |
| :--- | :--- | :--- |
| Display name | Yes | Nickname only — “not official”, for counter verify |
| Phone | Yes | Receipt link / counter QR; booking lookup — **no SMS v1** |
| Email | No | — |

**Group booking:** 1 booking bill, `party_size` (e.g. 3 haircuts). One queue number for the party; manager checks in whole party.

**No OTP in v1** (reduce friction). Phase 1B: optional SMS reminder only.

---

## 3. Barber calendar & capacity

### Per-barber timetable
- Manager sets **working hours** per barber per day.
- Each **service** has duration + optional **buffer** (manager configurable per service).
- Slots generated: `duration + buffer` blocks on that barber’s calendar.

### Daily customer cap (burnout prevention)
```
Barber.max_bookings_per_day  (e.g. Ali: 12, Siti: 10)
```
- When cap reached → barber shown **Full** on customer web; no new online slots.
- Owner can still **manual override** (walk-in, VIP) on POS.

### Walk-in slots on timetable
- Manager marks blocks as **Walk-in only** (e.g. 12:00–2:00 peak).
- Online booking cannot take those slots; POS can fill with walk-ins.
- Prevents online calendar eating peak capacity barbers want for random walk-ins.

### Pick-your-barber (toggle)
| `allow_customer_pick_barber` | Behaviour |
| :--- | :--- |
| **ON** | Customer sees each barber’s calendar + Full/Available |
| **OFF** | Customer picks time only; system assigns barber with free slot (round-robin or earliest) |

**Reassignment:** If chosen barber full or owner decides → reassign to another barber **before** `IN_SERVICE`. Customer web updates barber name on booking detail page (refresh/poll).

---

## 4. Booking types

| Type | Created by | Slot |
| :--- | :--- | :--- |
| **Online** | Customer web (QR) | Reserved on barber calendar |
| **Walk-in** | POS | May use walk-in slot block OR jump queue per rules below |

### Hybrid queue rules
- **Bookings** own a **time slot** on a barber’s calendar.
- **Walk-ins** do not steal booked slots.
- Walk-in may **jump ahead of other walk-ins** but not ahead of a **confirmed booking whose slot time has arrived** (within grace window).
- Walk-in during **walk-in-only block** → preferred path.

---

## 5. State machine

```
BOOKED ──(slot time window)──► waiting for arrival
         │
         │ manager: Arrived
         ▼
      ARRIVED ──(optional: add services)──► assign / confirm barber
         │
         │ Start cut
         ▼
     IN_SERVICE
         │
         │ Done
         ▼
     COMPLETED ──► Checkout (payment)
         │
         ▼
        PAID

Side transitions:
  ARRIVED / waiting ──► NO_SHOW  (15+ min late, auto — see §6)
  Any before IN_SERVICE ──► CANCELLED (manager)
  Before IN_SERVICE ──► barber REASSIGNED
```

**Accept / skip / no-show at arrival** — not at booking time. Online bookings are **auto-confirmed** when slot is free.

| State | Customer web shows |
| :--- | :--- |
| BOOKED | “#42 · Ali · Sat 2:00pm · Normal Cut” |
| ARRIVED | “Checked in — please wait” |
| IN_SERVICE | “In chair” |
| PAID | Receipt link |
| NO_SHOW | “Missed appointment” + rebook CTA |

---

## 6. Arrival policy

| Rule | Value |
| :--- | :--- |
| Early arrival | Up to **10 min early** → wait for turn; no early chair |
| On time | Manager marks **Arrived** (customer says name + phone last 4) |
| Late | **15 min** after slot end → auto **NO_SHOW** (see caveats) |
| Notifications | **None** to customer (web only). Customer refreshes status page |

### Auto no-show caveats (15 min late)
1. **Slot released** for walk-in or same-day rebook.
2. Booking status `NO_SHOW` — **not deleted** (reporting + repeat customer flag).
3. **Manager override:** “Mark arrived anyway” within same day if customer walks in late.
4. Customer web: “You missed your slot” + button **Book again** (if slots left).
5. **No penalty fee in v1** — optional Phase 1B deposit.
6. **Party booking:** if 2 of 3 arrive, manager partial check-in (adjust party_size or split).

---

## 7. Service changes at arrival (add-on problem)

**Problem:** Booked “Normal cut”, wants **beard trim** at chair.

**Solution: Planned vs actual services**

| Stage | What’s stored |
| :--- | :--- |
| At booking | `planned_services[]` — what customer selected online |
| At arrival / before payment | `actual_services[]` — barber adds/removes on POS |

**Flow:**
1. Customer booked Normal Cut RM25.
2. At arrival, barber opens booking → **Add service** → Beard trim RM15.
3. System shows **duration warning** if extension overlaps next booking (“Ali’s 2:30 slot may be tight”).
4. Manager can **bump** next booking or reassign — manual judgment.
5. Payment uses **actual_services** total.
6. Accounting links to `booking_id` + `barber_id` + line items.

**Customer web:** Shows planned services only until paid; receipt shows final list.

---

## 8. Payment

| Rule | Detail |
| :--- | :--- |
| Timing | **After cut** only |
| Who | **Barber or manager** on shared POS (whoever switched in) |
| Methods | Cash / Own DuitNow (1A) · **HitPay** QR + card (1B) — **Lite: RM5k/mo cap** · **Ocelot+: unlimited** · reconcile **Mantis+** |
| HitPay | Customer pays **subtotal + 2%**; merchant receives subtotal; cash/own QR = exact subtotal |
| E-invoice | **No** — receipt only |
| Receipt delivery | **Link + counter QR** (status page URL) — no SMS v1 |
| Booking link | `transaction.booking_id` required |
| Per-barber revenue | Report by `barber_id` on completed payment |

---

## 9. Offline (Notion-style)

| Actor | Offline behaviour |
| :--- | :--- |
| **POS** | All marks (arrived, no-show, start, complete, payment) write to **local outbox** |
| **POS** | UI works; banner “Offline — changes saved locally” |
| **Sync** | On reconnect: push outbox; server idempotent by `client_op_id` |
| **Customer web** | Read-only cache of “my booking” if previously loaded; new bookings need network |
| **Conflict** | Server wins on slot double-book; POS shows merge toast if booking already NO_SHOW on server |

---

## 10. Surfaces summary

| Surface | User | Phase |
| :--- | :--- | :--- |
| **Customer web** | Customer | 1A Must |
| **POS app** (web or RN on counter tablet) | Barber / owner | 1A Must |
| **Merchant web** | Owner (setup, calendar, caps) | 1A Must |
| **Queue / status** | Customer phone browser | Part of customer web |

---

## 11. Feature flags (owner settings)

| Flag | Default |
| :--- | :--- |
| `allow_customer_pick_barber` | ON |
| `auto_no_show_minutes` | 15 |
| `early_arrival_grace_minutes` | 10 |
| `show_now_serving_on_customer_page` | ON |

---

## 12. Open for Phase 1B

- OTP / SMS booking reminder
- Deposit for no-show reduction
- Customer “I’m here” self check-in button

---

*Feeds: [`ui.md`](ui.md), [`../../product/engineering-modules.md`](../../product/engineering-modules.md).*
