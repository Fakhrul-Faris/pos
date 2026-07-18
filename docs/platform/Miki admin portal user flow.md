# User Flow Document
## Miki — Internal Ops Admin Portal

**Version:** 1.0 (Draft)
**Purpose:** Map out step-by-step user flows for each core module to inform screen design and wireframing.
**Reference:** Based on `miki-admin-portal-brd.md`

**Actors used throughout:**
- **Admin** — Fakhrul / Haziq / Helmi (Super Admin, v1 single role)
- **System** — automated logic (flags, calculations, logs)
- **HitPay** — external payment processor
- **Merchant** — receives outcomes but has no portal access

---

## 1. Global Navigation Flow

```
Login
  │
  ▼
Admin Dashboard (landing)
  │
  ├── Merchants
  ├── Refunds
  ├── Subscriptions & Suspensions
  ├── Transactions (incl. flagged/suspicious)
  ├── Reconciliation
  ├── Marketing (organic experiments)
  └── Audit Log
```

**Design note:** Dashboard landing is an **ops + growth attention queue**, not a summary/analytics page. Surface: pending refund approvals, dual-approval items, flagged transactions, merchants approaching suspension, **recent signups / trials ending / silent merchants**, and **marketing check-ins** (empty experiments, stale metrics). Counts deep-link into the relevant module — no chart wall.

---

## 2. Merchant Management Flow

```
Merchants List
  │
  ├── Search / filter (by name, status, signup date)
  │
  ▼
Select Merchant → Merchant Detail View
  │
  ├── Profile info (business name, contact, signup date)
  ├── Subscription status (see Flow 4)
  ├── Transaction history (see Flow 5)
  ├── Refund history (see Flow 3)
  └── Admin actions:
        ├── Manually suspend
        ├── Manually reactivate
        └── Add internal note
```

**Design note:** Merchant Detail should be the hub — every other module (refunds, subscriptions, transactions) is reachable from here in context, not just from separate top-level lists.

---

## 3. Refund Approval Flow (Dual Approval Required)

```
Merchant submits refund request (outside portal — e.g. email/form)
Admin A logs the request into the portal:
  │
  ▼
New Refund Request Screen
  │  Fields: Receipt ID, Reason, Amount, Merchant, [supporting notes]
  │
  ▼
Status: PENDING APPROVAL
  │
  ▼
Refund Queue (visible to all Admins)
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
System checks subscription payment status (recurring check)
  │
  ├── Payment successful ──────► No action, status stays Active
  │
  └── Payment failed/missed
        │
        ▼
  System raises suspension flag
        │
        ▼
  Merchant Detail shows "Suspension Pending" state
        │
        ▼
  Admin reviews (manual step before suspension is finalized)
        │
        ├── Manually extend/waive ──► Status: Active, logged with note
        │
        └── No action taken ──────► Status: Suspended (system-enforced
                                      after grace period — grace period
                                      length TBD in FSD)
        │
        ▼
  Admin can also manually suspend/reactivate independent of
  the subscription trigger (e.g. other business reasons)
```

**Design note:** "Suspension Pending" needs to be visually distinct from "Suspended" — it's the window where an admin can intervene, and it should show up prominently on the dashboard action queue (Flow 1).

---

## 5. Transaction Review / Suspicious Transaction Flow

```
Transaction occurs (via HitPay)
  │
  ▼
System pulls transaction log from HitPay (periodic pull, v1)
  │
  ├── Normal transaction ──────► Appears in standard transaction list
  │
  └── Flagged by HitPay ───────► Appears in Flagged/Review queue
        │
        ▼
  Admin reviews flagged transaction
        │  (sees: amount, merchant, timestamp, HitPay's reason if given)
        │
        ├── No action needed ──► Marked reviewed, logged
        │
        └── Action needed ─────► Admin manually suspends merchant
                                  (goes to Flow 4, manual suspend path)
```

**Design note:** Since detection logic lives with HitPay, this screen is a review/triage tool, not an investigation tool — don't over-design it with analytics. A clean list + drill-into-detail is enough for v1.

---

## 6. Reconciliation / Settlement Flow

```
Reconciliation View
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

**Design note:** This is inherently a numbers-heavy screen. Prioritize a clear per-merchant or per-period table over dashboards/charts — reporting/analytics is explicitly out of scope for v1.

---

## 7. Audit Log Flow (Cross-cutting)

```
Every financial action (refund approval/rejection, payout override,
manual subscription change, manual suspend/reactivate) writes to
Audit Log automatically.
  │
  ▼
Audit Log Screen
  │
  ├── Filter by: admin, action type, merchant, date range
  │
  ▼
Entry detail shows: who, what, when, reason code (if applicable),
before/after state where relevant
```

**Design note:** This doesn't need its own polished UI investment in v1 beyond a searchable table — but every other flow above needs to actually write to it, so it should be designed early enough that Haziq can build the logging hooks alongside each feature, not bolted on after.

---

## 8. Marketing Experiment Flow (Organic)

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

**Design note:** This is an experiment log, not a social dashboard. Group by hypothesis; keep metrics entry boring and fast. No charts in v1.

---

## 9. Cross-Flow Dependencies Summary

| Flow | Depends on / Feeds into |
|------|--------------------------|
| Refund Approval | Writes to Audit Log; visible from Merchant Detail |
| Subscription & Suspension | Feeds Dashboard action queue; visible from Merchant Detail |
| Transaction Review | Can trigger Subscription & Suspension (manual path) |
| Reconciliation | Can trigger Refund/Payout dual approval |
| Marketing | Independent; optional light audit on create/edit post |
| Audit Log | Receives writes from all financial-action flows |

---

## 10. Open Questions for FSD (carried over from BRD)

- Grace period length before system-enforced suspension after a missed payment (Flow 4)
- Exact fields returned by HitPay for flagged transactions (Flow 5) — pending API review
- Whether dual approval needs a "pending too long" escalation/reminder, given only 3 admins in v1
- Which engagement metrics are realistic to ask for per platform (Facebook / Threads / X / Reddit)

---

## 11. Suggested Build Priority (for wireframing)

Given the 1-month timeline, suggested order based on what's most operationally urgent (money-related, currently fully manual):

1. Merchant Detail + List (hub for everything else)
2. Subscription & Suspension (directly tied to revenue continuity)
3. Refund Approval (dual approval, currently informal)
4. Reconciliation (currently manual/error-prone)
5. Transaction Review (lower urgency — HitPay already handles detection)
6. Audit Log (build incrementally alongside 2–5, not standalone)
7. Marketing experiment log (parallel / after money paths stabilize)
