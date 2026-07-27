# Designer Brief — Miki Merchant Portal (IA)

**Version:** 1.0  
**Date:** July 2026  
**Audience:** Product design (wireframes / sitemap / nav)  
**Status:** Approved for design (Phases 0–4 alignment)  
**Authority:** This file is the **sole SSOT** for Merchant Portal information architecture, navigation, module list, groupings, and design priority. Do not maintain parallel Owner/Merchant nav trees elsewhere.

**Related SSOT (other concerns — not IA)**
- Barbershop product rules: [`../modules/barbershop/spec.md`](../modules/barbershop/spec.md)
- Screen specs (C/P/O frames): [`../modules/barbershop/ui.md`](../modules/barbershop/ui.md) — **screen detail only**; Owner nav points here
- Features & pricing: [`../modules/barbershop/features-and-pricing.md`](../modules/barbershop/features-and-pricing.md)
- Personality: [`../design/portal-personality-brief.md`](../design/portal-personality-brief.md)
- Admin Portal IA (boundary): [`Miki Admin Portal — Designer IA Brief.md`](./Miki%20Admin%20Portal%20%E2%80%94%20Designer%20IA%20Brief.md)
- Data bible: repo root `DBschema.json` (target production schema)
- Current prototype: `apps/merchant-portal/`

---

## 1. What you are designing

The **Merchant Portal** — laptop web app for shop **Owners** to run the business (schedule, catalogue, people, payments oversight, merchant books).

**Not** this brief:
- **Shared POS** — counter tablet operate (check-in, cut flow, **checkout / take payment**)
- **Customer web** — phone booking / status
- **Admin Portal** — Miki internal ops

**Hybrid rule (locked)**
- Product docs + this brief = Merchant Portal product boundary
- `DBschema.json` = production ontology
- Where they conflict, this brief states the resolve

---

## 2. Naming (locked — avoid confusion)

| Term | Meaning | Use |
| :--- | :--- | :--- |
| **Merchant Portal** | This product | Product name, repo, IA |
| **Owner** | Role — person who owns/manages the shop | Login, permissions, copy |
| **Staff / Barber** | Workers (vertical skin: Barber, Stylist, …) | People module labels |
| **Admin / Admin Portal** | Miki internal operators | Never mixed with Owner |
| **Merchant** (admin sense) | The business (Organization) as Miki’s customer | Admin “Merchants” module only |

Do **not** call this product “Owner web” or “Owner portal” in new docs. O-xx IDs may remain as eng screen codes.

---

## 3. Locked product decisions

| Decision | Implication for design |
| :--- | :--- |
| Surface = Owner web only (this pass) | No POS/Customer nav in this IA |
| Vertical = Hybrid | Platform module names; barbershop vocabulary as skin |
| Schema = target production | Domains map to tables |
| Merchant accounting | **Yes** — merchant books in this portal |
| People ops | **Full local HR/payroll** — no LHDN / KWSP / SOCSO / gov filing APIs |
| Inventory | **Included** (with Services under Catalogue) |
| Help / Support | **Merchant → Miki** (docs + contact) — not customer CS inbox |
| POS checkout operate | Stays on **POS**; portal has Payments **read/oversight** |
| Org → Brand → Branch | Owner writes setup; **Billing on Brand** |

---

## 4. Information architecture

### 4.1 Sitemap (L0 → L2)

```
Login / Sign up
 └── Onboarding                         shop → staff → services → hours → plan

 └── Dashboard                          L0 — today ops (not BI wall)

 └── Calendar                           L1 — master schedule
 │     └── Booking / block detail

 └── Bookings                           L1 — list + detail (party-aware)

 └── Customers                          L1 — profiles from bookings

 └── Catalogue                          L1 — group
 │     ├── Services
 │     └── Inventory                    products, stock, PO, vendors

 └── People                             L1 — group
 │     ├── Staff                        employees + vertical role + caps
 │     ├── Roster                       shifts, attendance, OT
 │     ├── Leave                        local tracking only
 │     └── Payroll                      local runs; no gov APIs

 └── Payments                           L1 — txs, payouts, shop recon (tier-gated)

 └── Reports                            L1 — KPIs, per-staff revenue, commission + CSV

 └── Accounting                         L1 — MERCHANT books only
 │     ├── Chart of accounts
 │     ├── Journals / ledger
 │     └── Fiscal periods

 └── Settings                           L1 — group
 │     ├── Shop & locations             Org / Brand / Branch, hours, holidays
 │     ├── Booking rules                pick-staff, party, no-show, walk-in blocks
 │     ├── QR & devices
 │     ├── Billing                      Brand plan / upgrade (Miki subscription)
 │     └── Account                      Owner profile, masked payout bank

 └── Help                               docs + contact Miki
```

### 4.2 Primary nav (left rail)

```
Dashboard
────────────
Calendar
Bookings
Customers
────────────
Catalogue
  Services
  Inventory
────────────
People
  Staff
  Roster
  Leave
  Payroll
────────────
Payments
Reports
Accounting
────────────
Settings
Help
```

Flat-rail alternative: non-clickable section headers (Catalogue / People) — same IA.

**Barbershop skin:** Staff → **Barbers** (label only).

### 4.3 Dashboard blocks

| Block | Surfaces | Deep-links |
| :--- | :--- | :--- |
| Today ops | Bookings, walk-ins, no-shows | Calendar / Bookings |
| Money | Today revenue, payout issues | Payments |
| People | On shift / on leave | Roster / Staff |
| Setup gaps | Missing hours/services, trial ending | Settings / Billing |

**Not on dashboard:** platform MRR, full GL wall, admin marketing, live POS checkout UI.

---

## 5. Module grouping

| Group | Modules | Job |
| :--- | :--- | :--- |
| Today | Dashboard | Attention now |
| Schedule | Calendar, Bookings, Customers | Demand & relationships |
| Catalogue | Services, Inventory | What you sell |
| People | Staff, Roster, Leave, Payroll | Local workforce (no gov APIs) |
| Money | Payments, Billing (Settings), Accounting | Txs ≠ Miki plan ≠ books |
| Insights | Reports | Ops KPIs / commission — not GL |
| Setup | Settings | Configuration |
| Help | Help | Merchant → Miki |

**Commission:** Under **Reports** (statement + CSV); link from Payroll if needed.  
**Queue:** Dashboard widget / Calendar context — **operate** on POS, not primary L1.

---

## 6. Suggested modules

| Module | Design in IA? | Ship wave | Notes |
| :--- | :---: | :---: | :--- |
| Dashboard | Yes | W1 | |
| Calendar | Yes | W1 | |
| Bookings | Yes | W1 | |
| Customers | Yes | W1 | |
| Services | Yes | W1 | |
| Inventory | Yes | W2 | |
| Staff | Yes | W1–W2 | |
| Roster | Yes | W2 | |
| Leave | Yes | W2 | Local only |
| Payroll | Yes | W2–W3 | No LHDN API |
| Payments | Yes | W1 | Read/recon; checkout on POS |
| Reports | Yes | W1–W2 | Incl. commission |
| Accounting | Yes | W3 | Merchant books only |
| Settings (shop/rules/QR/account) | Yes | W1 | |
| Billing | Yes | W1 | Brand-scoped |
| Help | Yes | W1 | Light |
| POS checkout / live queue operate | **No** | — | Shared POS surface |
| Platform Accounting | **No** | — | Admin Portal |
| Customer CS inbox / form builder | **No** | — | Admin Portal |

---

## 7. Contradictions → how to solve (designer-facing)

| Conflict | Severity | How to solve in design |
| :--- | :---: | :--- |
| Docs said “no payroll”; schema + product want local HR | P0 | People group with Payroll; banner/copy: no gov filing APIs |
| `ui.md` thin Owner nav vs full schema | P0 | This brief wins; `ui.md` nav replaced by pointer |
| “Owner web” product naming | P1 | Product = Merchant Portal; Owner = role |
| Payments / Billing / Accounting / Reports mixed | P0 | Four distinct jobs (see §5) |
| Inventory missing from Phase 1A story | P1 | Catalogue includes Inventory; ship W2 |
| Queue in portal vs POS | P1 | Monitor optional; operate on POS |
| Billing on flat “shop” | P0 | Billing on **Brand**; locations = Branch |
| Same GL as Admin | P0 | Merchant books only; never platform books |
| Help vs `customerservices` | P1 | Help = contact Miki only |

---

## 8. Boundary vs Admin Portal

| Concern | Merchant Portal | Admin Portal |
| :--- | :--- | :--- |
| Org / Brand / Branch | Write (setup & operate) | Read + suspend / lifecycle |
| Subscription | Pay / upgrade own Brand | Override / waive / suspend |
| Transactions | Shop txs / payouts / shop recon | Platform surcharge, flags, multi-merchant recon |
| Accounting | **Merchant** GL | **Platform** GL |
| Support | Help → Miki | End-customer CS submissions |
| HR / Payroll / Inventory | Full (local) | No |

---

## 9. Settings & data hierarchy

```
Organization
  └── Brand          ← Billing / subscription
        └── Branch   ← Hours, QR, queue flags, devices
              └── Staff, services, inventory, bookings, txs…
Owner account ──owns──► Organization
```

---

## 10. What not to design (this IA)

- POS checkout / payment take / barber switcher operate flows  
- Customer booking funnel (C-xx)  
- Admin CS inbox, platform GL, marketing experiments  
- LHDN / KWSP / SOCSO or any statutory filing automation  
- Nav label “rubish” or Mendix internals  

---

## 11. Design / ship priority

**Wave 1 — Ops core**  
Dashboard → Calendar → Bookings → Customers → Services → Payments → Settings (shop, rules, QR) → Billing → Help  

**Wave 2 — Workforce + retail**  
Staff (full) → Roster → Leave → Inventory → Reports (incl. commission)  

**Wave 3 — Books + payroll depth**  
Payroll (local) → Accounting (merchant GL)  

---

## 12. Eng notes (non-blocking for IA)

- Book tenancy: merchant vs platform GL must not mix  
- Capacity / party / walk-in rules may need schema beyond `organization$setting`  
- `rubish$*` merge into shift/time — no product module  
- Product-doc patch: `features-and-pricing` / `architecture` workforce wording → local HR yes, gov APIs no  

---

## 13. Success check for design review

- [ ] Product called **Merchant Portal**; Owner used as role only  
- [ ] Nav matches §4.2 (Catalogue includes Inventory; People includes Roster/Leave/Payroll)  
- [ ] Payments ≠ Billing ≠ Accounting ≠ Reports  
- [ ] No POS checkout operate screens in this portal sitemap  
- [ ] Billing on Brand; locations as Branch  
- [ ] Help = Merchant → Miki only  
- [ ] Accounting = merchant books only  
- [ ] No LHDN/statutory API flows  

---

*End of designer brief. Next: wireframes against this IA; O-xx screen specs in `ui.md` Part 3 updated incrementally to match modules.*
