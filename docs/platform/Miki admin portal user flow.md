# User Flow Document
## Miki — Internal Ops Admin Portal

**Version:** 1.2 (Draft)  
**Purpose:** Step-by-step user flows for admin modules (process only — not navigation / IA).  
**Reference:** [`Miki Admin Portal BRD.md`](./Miki%20Admin%20Portal%20BRD.md)  
**Changelog (1.2):** Org→Brand→Branch hub; Brand billing; Support + Accounting flows; cross-flow table updated.

**IA / nav / module map SSOT (do not duplicate here):** [`Miki Admin Portal — Designer IA Brief.md`](./Miki%20Admin%20Portal%20%E2%80%94%20Designer%20IA%20Brief.md)

**Actors used throughout:**
- **Admin** — Fakhrul / Haziq / Helmi (Super Admin, v1 single role)
- **System** — automated logic (flags, calculations, logs)
- **HitPay** — external payment processor
- **Merchant** — receives outcomes but has no portal access (Organization / Brand / Branch in data)

---

## 1. Navigation

Sitemap, left rail, module list, groupings, and design priority live only in the **Designer IA Brief**. This document does not maintain a parallel nav tree.

---

## 2. Merchant Management Flow

```
Merchants List  (= Organizations)
  │
  ├── Search / filter (by name, status, signup date)
  │
  ▼
Select Organization → Merchant Detail (hub)
  │
  ├── Overview (org profile, primary contact, lifecycle status, notes)
  ├── Brands
  │     └── Brand detail → subscription / billing / payment history
  │                        (see Flow 4 — billable unit = Brand)
  ├── Branches (outlets) — read: address, hours, settings
  ├── Owners — contacts + masked payout bank
  ├── Activity shortcuts → Finance queues filtered to this org
  │     (refunds, transactions, reconciliation — Flows 3, 5, 6)
  └── Admin actions:
        ├── Manually suspend
        ├── Manually reactivate
        └── Add internal note
```

**Design note:** Merchant Detail is the hub — Finance and Subscriptions are reachable in context from Org/Brand, not only from top-level lists. Do not design a flat single-entity “merchant profile” that ignores Brand/Branch.

---

## 3. Refund Approval Flow (Dual Approval Required)

```
Merchant submits refund request (outside portal — e.g. email/form)
Admin A logs the request into the portal:
  │
  ▼
New Refund Request Screen
  │  Fields: Receipt ID, Reason, Amount, Merchant/Org (and Brand if needed), [supporting notes]
  │
  ▼
Status: PENDING APPROVAL
  │
  ▼
Refund Queue (visible to all Admins) — under Finance
  │
  ▼
Admin B reviews request
  │
  ├── Approve ──────────────► Status: APPROVED
  │                                │
  │                                ▼
  │                          Reason code required if this is
  │                          an override/exception case
  │                                │
  │                                ▼
  │                          Logged in Audit Log
  │                                │
  │                                ▼
  │                          Refund marked processed
  │                          (actual money movement handled
  │                          outside system, via HitPay)
  │
  └── Reject ──────────────► Status: REJECTED
                                   │
                                   ▼
                             Reason required, logged
```

**Key rule:** Admin A (who logs the request) cannot also be Admin B (who approves it) — same person can't dual-approve their own entry. Flag this as a validation rule for the FSD.

**Design note:** The queue view needs a clear visual distinction between "awaiting second approval" and "awaiting first review" so nobody double-approves or misses their turn.

---

## 4. Subscription & Suspension Flow

```
System checks Brand subscription payment status (recurring check)
  │
  ├── Payment successful ──────► No action, Brand stays Active
  │
  └── Payment failed/missed
        │
        ▼
  System raises suspension flag on Brand / related Org view
        │
        ▼
  Merchant Detail / Brand detail shows "Suspension Pending"
        │
        ▼
  Admin reviews (manual step before suspension is finalized)
        │
        ├── Manually extend/waive Brand sub ──► Active, logged with note
        │
        └── No action taken ──────► Suspended (system-enforced
                                      after grace period — grace period
                                      length TBD in FSD)
        │
        ▼
  Admin can also manually suspend/reactivate independent of
  the subscription trigger (e.g. other business reasons)
```

**Design note:** "Suspension Pending" needs to be visually distinct from "Suspended" — it's the window where an admin can intervene, and it should show up prominently on the dashboard action queue. Billing actions always attach to **Brand**.

---

## 5. Transaction Review / Suspicious Transaction Flow

```
Transaction occurs (via HitPay / POS)
  │
  ▼
System pulls transaction log from HitPay (periodic pull, v1)
  │
  ├── Normal transaction ──────► Appears in standard transaction list (Finance)
  │
  └── Flagged by HitPay ───────► Appears in Flagged/Review queue (default filter)
        │
        ▼
  Admin reviews flagged transaction
        │  (sees: amount, merchant/org, timestamp, HitPay's reason if given)
        │
        ├── No action needed ──► Marked reviewed, logged
        │
        └── Action needed ─────► Admin manually suspends
                                  (goes to Flow 4, manual suspend path)
```

**Design note:** Triage tool, not investigation/analytics. Admin does not edit POS line items here.

---

## 6. Reconciliation / Settlement Flow

```
Reconciliation View (Finance)
  │
  ▼
Shows, per period:
  ├── HitPay balance (funds collected)
  ├── Surcharge revenue captured (platform's cut)
  ├── Amount owed to merchants (settlement due)
  └── Amount actually settled (via manual DuitNow transfer)
  │
  ▼
Admin identifies discrepancies (manual review, v1)
  │
  └── If payout override needed ──► Goes through Dual Approval
                                     (same pattern as Flow 3),
                                     requires reason code,
                                     logged in Audit Log
```

**Design note:** Period × merchant/Brand table over dashboards/charts. This is Finance, not Accounting (GL).

---

## 7. Audit Log Flow (Cross-cutting)

```
Every financial action (refund approval/rejection, payout override,
manual Brand subscription change, manual suspend/reactivate) writes to
Audit Log automatically. Support status changes may log lightly (FSD).
  │
  ▼
Audit Log Screen
  │
  ├── Filter by: admin, action type, merchant/org, date range
  │
  ▼
Entry detail shows: who, what, when, reason code (if applicable),
before/after state where relevant
```

**Design note:** Searchable table is enough for v1 UI investment; logging hooks ship with each feature.

---

## 8. Support Inbox Flow

```
Support Inbox (list)
  │
  ├── Filter: status, priority, complaint type, date
  │
  ▼
Open Submission Detail
  │
  ├── Customer info, subject, channel, attachments (read)
  ├── Update status / priority
  ├── Add / edit resolution notes
  └── Mark resolved (resolved date)
```

**Design note:** Inbox only — no form or question builder in admin v1. Feeds the Dashboard Support queue block.

---

## 9. Accounting Flow (Platform Books)

```
Accounting (platform)
  │
  ├── Chart of accounts — list / view account
  ├── Journal entries — list / view entry (+ lines)
  ├── Ledger / period balances — by fiscal period
  └── Fiscal years / periods — list / closed flags
```

**Design note:** Utilitarian tables OK. This is **Miki platform** books only — not merchant books, and not Finance (refunds/recon). No analytics charts required in v1.

---

## 10. Marketing Experiment Flow (Organic) — Deferred

**Deferred for v1** per Designer IA Brief / BRD §9 — retained for backlog only; do not wireframe in current design pass.

```
Marketing → Experiment List
  │
  ├── Create experiment (name/hypothesis, date range)
  │
  ▼
Select Experiment → Experiment Detail
  │
  ├── Posts table (platform, hook, metrics) — sortable
  ├── Add / edit post (URL, type, hook, manual metrics)
  ├── Update metrics (periodic check-in)
  └── Conclude experiment → write learnings notes
```

---

## 11. Cross-Flow Dependencies Summary

| Flow | Depends on / Feeds into |
|------|--------------------------|
| Merchant hub | Entry to Brand billing, Finance shortcuts, Support context |
| Refund Approval | Writes to Audit Log; visible from Merchant Detail |
| Subscription & Suspension (Brand) | Feeds Dashboard ops queue; Brand detail |
| Transaction Review | Can trigger Suspension (manual path) |
| Reconciliation | Can trigger payout dual approval; Finance |
| Support Inbox | Feeds Dashboard Support queue |
| Accounting | Independent of Finance ops; platform GL only |
| Marketing | Deferred (v1) |
| Audit Log | Receives writes from financial (and agreed) admin actions |

---

## 12. Open Questions for FSD (carried over from BRD)

- Grace period length before system-enforced suspension after a missed Brand payment (Flow 4)
- Exact fields returned by HitPay for flagged transactions (Flow 5)
- Whether dual approval needs a "pending too long" escalation/reminder (3 admins in v1)
- Org vs Brand ownership of lifecycle statuses
- Support submission statuses / priorities for v1 UI
- Platform accounting: which GL screens are must-ship vs read-only first

---

## 13. Design / wireframe priority

**SSOT:** Designer IA Brief §9 (Design priority order). Do not maintain a parallel priority list here.
