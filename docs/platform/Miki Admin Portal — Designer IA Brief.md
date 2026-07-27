# Designer Brief — Miki Internal Ops Admin Portal (IA)

**Version:** 1.0  
**Date:** July 2026  
**Audience:** Product design (wireframes / sitemap / nav)  
**Status:** Approved for design (Phases 0–4 alignment)  
**Authority:** This file is the **sole SSOT** for admin portal information architecture, navigation, module list, groupings, and design priority. Do not maintain parallel nav trees or module maps elsewhere.

**Related SSOT (other concerns — not IA)**
- Business requirements: [`Miki Admin Portal BRD.md`](./Miki%20Admin%20Portal%20BRD.md) (v1.1 — aligned with this brief)
- User flows: [`Miki admin portal user flow.md`](./Miki%20admin%20portal%20user%20flow.md) (v1.2 — aligned with this brief)
- Data bible: repo root `DBschema.json` (target production schema)
- Current prototype: `apps/admin-portal/`

---

## 1. What you are designing

An **internal ops admin portal** for Miki founders (Super Admin). Not the merchant portal. Not BI.

Admins land on an **attention queue**, then work money decisions, merchant lifecycle, support inbox, and platform accounting.

**Hybrid rule (locked)**
- **BRD + this brief** = what the admin product is
- **`DBschema.json`** = production data ontology
- Where they conflict, this brief states the resolve — do not invent a third model

---

## 2. Locked product decisions

| Decision | Implication for design |
| :--- | :--- |
| Strategy = Hybrid | Design admin boundary; don’t dump full ERP into admin nav |
| Org → Brand → Branch | Merchant hub must show this hierarchy |
| **Brand** = billable unit | Subscriptions, plan badges, billing actions attach to Brand |
| Finance ≠ Accounting | Separate nav groups / subjects |
| Support = **inbox only** | Submissions queue + detail; no form/question builder |
| Marketing | **Deferred** — out of v1 design scope |
| Employee / Shift / Payroll / Product / Service / POS write | **Merchant portal only** — never primary admin nav |
| Accounting in admin | **Platform (Miki) books only**; merchant books stay in merchant portal |
| Timeline | Flexible; prioritize money + merchants first |

---

## 3. Information architecture

### 3.1 Sitemap (L0 → L2)

```
Login
 └── Dashboard                         L0 — attention queue (not analytics)

 └── Merchants                         L1 — Organization list
 │     └── Merchant detail             L2 — Organization hub
 │           ├── Overview
 │           ├── Brands
 │           │     └── Brand detail    subscription / billing / overrides
 │           ├── Branches (outlets)    read: address, hours, settings
 │           ├── Owners                contacts + masked payout bank
 │           └── Activity shortcuts    deep-links into Finance (filtered)

 └── Subscriptions                     L1 — cross-Brand billing list

 └── Finance                           L1 — group
 │     ├── Refunds
 │     ├── Transactions                default filter: Flagged
 │     └── Reconciliation

 └── Support                           L1 — inbox
 │     └── Submission detail

 └── Accounting                        L1 — platform books
 │     ├── Chart of accounts
 │     ├── Journal entries
 │     ├── Ledger / period balances
 │     └── Fiscal years / periods

 └── Audit Log                         L1

 └── Settings (optional / light)       Admin users
```

### 3.2 Primary nav (left rail)

```
Dashboard
────────────
Merchants
Subscriptions
────────────
Finance
  Refunds
  Transactions
  Reconciliation
────────────
Support
Accounting
────────────
Audit Log
```

Flat rail alternative: same order with a non-clickable **Finance** section label above Refunds / Transactions / Reconciliation.

Settings may live under avatar / footer — not required in primary rail for v1.

### 3.3 Dashboard queue blocks

| Block | Surfaces | Deep-links to |
| :--- | :--- | :--- |
| Ops / money | Pending refunds, dual approvals, flagged txs, suspension pending | Finance · Merchant / Brand detail |
| Growth / signup | Recent signups, trials ending, silent merchants | Merchants |
| Support | Open / high-priority submissions | Support |

**Do not put on dashboard:** MRR/GMV charts, funnels, paid ads, marketing experiments.

---

## 4. Suggested modules

| Module | Design in v1? | Notes |
| :--- | :---: | :--- |
| Dashboard | Yes | Attention queue |
| Merchants | Yes | Org → Brand → Branch hub |
| Subscriptions | Yes | Brand-scoped |
| Refunds | Yes | Dual approval; reason codes |
| Transactions | Yes | Read / triage only (not POS editor) |
| Reconciliation | Yes | Period × merchant/brand table; payout overrides |
| Support | Yes | Inbox only |
| Accounting | Yes | Platform GL only |
| Audit Log | Yes | Searchable table |
| Settings · Admins | Nice-to-have | Thin |
| Marketing | **No** | Deferred |
| CS form builder | **No** | Out of admin v1 |
| HR / Shifts / Payroll / Catalog / POS write | **No** | Merchant portal |

---

## 5. Module grouping

| Group | Modules | Job |
| :--- | :--- | :--- |
| Attention | Dashboard | What needs a human today |
| Merchants | Merchants, Subscriptions | Lifecycle & billing |
| Finance | Refunds, Transactions, Reconciliation | Money movement / HitPay ops |
| Support | Support inbox | Customer submissions |
| Accounting | Platform GL screens | Miki’s books (separate subject) |
| Governance | Audit Log, Settings | Traceability & access |

---

## 6. Contradictions → how to solve (designer-facing)

| Conflict | Severity | How to solve in design |
| :--- | :---: | :--- |
| UI was flat “Merchant”; schema is Org → Brand → Branch | P0 | Merchant detail = hub with Brands + Branches; billing on Brand |
| UI billed “merchant”; schema bills Brand | P0 | Plan / subscription / waive-extend on Brand |
| Finance ops vs full GL mixed | P0 | Separate **Finance** and **Accounting** groups |
| Refunds / Recon / Audit in product; weak/missing in schema | P0 | Still design modules; note “schema catch-up” for eng — don’t invent fake analytics |
| Support in schema; missing from BRD/nav | P1 | Add Support inbox to v1 |
| Marketing in BRD + prototype | P1 | Remove from v1 nav and dashboard |
| ERP domains in schema | P1 | Exclude from admin sitemap |
| `rubish$*` vs shiftmanagement overlap | P2 | Ignore for UI; eng to clean (noted) |
| `mendixsystem$*` | P2 | Never show |
| `subcriptionplan` typo | P2 | Label UI **Subscriptions** |

---

## 7. Merchant detail — must-have structure

1. **Header:** Organization name · lifecycle status · primary contact  
2. **Brands:** list with plan + subscription status  
3. **Brand drill-in:** payment history · extend / waive · suspension signals  
4. **Branches:** outlets (read)  
5. **Owners / payout:** masked bank details  
6. **Linked activity:** refunds / transactions / recon for this org  
7. **Admin actions:** suspend · reactivate · internal note  

**Copy**
- **Merchant** = umbrella for Organization (OK in nav)
- **Brand** = where billing happens
- **Branch / outlet** = physical location

---

## 8. What not to design (v1)

- Marketing experiment log / social metrics  
- CS form or question builder  
- Employee, leave, payroll, shifts, products, services, POS checkout  
- Merchant-side accounting books inside admin  
- Analytics dashboards, chart walls, paid-ad performance  
- Mobile / tablet-first layouts (desktop ops tool)  
- Multi-role permission UI (single Super Admin; keep groups so roles can hide later)

---

## 9. Design priority order

1. Merchants hub (Org → Brand → Branch)  
2. Finance: Refunds → Reconciliation → Transactions  
3. Subscriptions (Brand)  
4. Support inbox  
5. Audit Log  
6. Accounting (utilitarian tables OK)  
7. Dashboard queue polish (after deep-link targets exist)

---

## 10. Schema gaps eng must close (design anyway)

**Status (July 2026):** Structural gaps closed in `DBschema.json`. Field/ownership map: [`Miki Admin Portal — Schema Gaps.md`](./Miki%20Admin%20Portal%20%E2%80%94%20Schema%20Gaps.md).

Designers can proceed; eng implements Mendix/DB migration from that handoff:

1. ~~Refund request + dual-approval workflow + reason codes~~ → `adminfinance$refundrequest` + `reasoncode`
2. ~~Settlement / reconciliation / surcharge snapshots (or HitPay sync store)~~ → `reconciliationperiod` + `transactionsnapshot` + `payoutoverride`
3. ~~Admin audit log (who / what / when / reason / before-after)~~ → `adminops$auditlog`
4. ~~Explicit lifecycle states (e.g. `suspension_pending`)~~ → Org `lifecyclestatus`; Brand `billingstatus`

Support and Accounting continue to use `customerservices$*` (submission patched with Org FK + body) and `generalaccounting$*`.

---

## 11. Open note for eng (non-blocking for design)

- **`rubish$*`** timesheet/OT tables likely overlap **`shiftmanagement$*`** — cleanup / merge; do not surface in product IA.

---

## 12. Success check for design review

- [ ] Nav matches §3.2 (Marketing absent; Support + Accounting present; Finance grouped)  
- [ ] Merchant detail shows Org → Brand → Branch; billing on Brand  
- [ ] Finance and Accounting are visually/separately distinct  
- [ ] Support is submission inbox only  
- [ ] Dashboard is a queue, not a chart dashboard  
- [ ] No merchant-ops ERP modules in admin sitemap  
- [ ] Dual-approval refunds and recon remain first-class Finance screens  

---

*End of designer brief. BRD v1.1 and user-flow v1.2 are aligned with this IA. Next: wireframes / Figma against this brief.*
