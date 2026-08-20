# Business Requirements Document (BRD)
## Miki — Internal Ops Admin Portal

**Version:** 1.1 (Draft)  
**Prepared by:** Fakhrul  
**Date:** July 2026  
**Status:** Draft for team review (Haziq, Helmi)  
**Changelog (1.1):** Aligned with Designer IA Brief — Support + platform Accounting in scope; Marketing deferred; Org→Brand→Branch / Brand billable unit; Finance ≠ Accounting; timeline flexible.  
**Changelog (1.1a):** Schema gap close documented — see [`Miki Admin Portal — Schema Gaps.md`](./Miki%20Admin%20Portal%20%E2%80%94%20Schema%20Gaps.md); BRD §13 #6 marked done in `docs/db-schema.json`.

**IA / nav / module map:** not maintained in this BRD — sole SSOT is [`Miki Admin Portal — Designer IA Brief.md`](./Miki%20Admin%20Portal%20%E2%80%94%20Designer%20IA%20Brief.md).

---

## 1. Purpose

This document defines the business requirements for Miki's **internal operations admin portal** — the tool used by the founding team (and future support/ops hires) to manage merchants, subscriptions, transactions, refunds, settlement operations, customer-support submissions, and platform accounting visibility.

This is distinct from the **merchant-facing portal**, which is out of scope for this document.

---

## 2. Background

Miki is a counter management and POS SaaS targeting Malaysian brick-and-mortar SMEs. The platform owns the HitPay payment account on behalf of merchants, charges a customer-facing surcharge, and settles funds to merchants via DuitNow on a T+2 basis. This settlement model is currently manual for MVP, with automation planned at scale.

As merchant count grows toward the initial target of ~100, the founding team needs a centralized internal tool to manage the operational, financial, and support workflows that are currently untracked or handled ad hoc.

---

## 3. Goals & Success Criteria

- Give the founding team a single place to manage merchant accounts, Brand-level subscriptions, refunds, settlement visibility, support inbox, and platform books.
- Replace informal/manual tracking with a logged, auditable system — particularly for money-related actions.
- Land admins on an **ops + growth + support attention queue** (money decisions, signup/trial follow-ups, open support submissions) — not an analytics dashboard.
- Support a lean 3-person team today while being architected to onboard support/ops hires and additional roles later without a rebuild.
- Ship a working v1 frontend on a **flexible timeline**, prioritized per Designer IA Brief §9 (merchants + money first).

### Dashboard landing (v1)

The Admin Dashboard is an **attention queue**, not BI:

| Block | Surfaces | Deep-links to |
| :--- | :--- | :--- |
| **Ops / money** | Pending refunds, dual approvals, flagged txs, suspension pending | Finance modules · Brand / Merchant detail |
| **Growth / signup** | Recent signups, trials ending soon, silent merchants (no recent activity) | Merchants / Merchant detail |
| **Support** | Open / high-priority submissions | Support inbox / submission detail |

Explicitly **not** on the dashboard in v1: MRR/GMV charts, funnel analytics, paid-ad performance, conversion attribution, marketing experiment check-ins.

---

## 4. Users & Roles

### v1 (this release)
- **Super Admin** — Fakhrul, Haziq, Helmi. Full access to all modules.
- Single role only for v1. No merchant ever has admin access, under any circumstance.

### Future (explicitly out of scope for v1, but must inform architecture)
- Support/Ops role(s) — the team plans to hire support/ops staff and expects to introduce additional roles with restricted (e.g. view-only, or module-limited) access.
- **Architectural requirement:** the permission system should be designed to accommodate future roles without requiring a schema rebuild, even though only one role ships in v1. Module groupings in the IA Brief should allow future hide/limit without a nav redesign.

---

## 5. Core Business Processes in Scope

### 5.1 Merchant Onboarding
- Merchants sign up via the website and can use Miki immediately (self-serve, informal onboarding — no manual approval gate in v1).
- Admin portal needs visibility into merchant accounts once created, not a role in the signup flow itself.
- Data model for admin: **Organization → Brand → Branch (outlet)**. “Merchant” in UI copy may refer to the Organization umbrella.

### 5.2 Refunds
- Merchants submit a refund request stating: receipt ID, reason, and other relevant transaction details (exact field list to be finalized in FSD).
- Admins review and approve/reject refund requests.
- **Refund approval requires dual approval** (see Section 7).

### 5.3 Suspicious Transaction Handling
- Fraud/anomaly detection itself is handled by HitPay, not built in-house.
- Miki's admin portal is responsible for **visibility and follow-up action**, not detection.
- Approach for v1:
  - Review HitPay's API capabilities to determine what transaction status/flag data is available (**action item — to be confirmed before FSD finalization**).
  - Prepare a webhook/socket listener in the architecture now, even if v1 ships with periodic manual log review rather than real-time alerting.
  - **Periodic pull/log review is acceptable for v1** — no real-time requirement.
  - When a transaction is flagged by HitPay, admin sees it in a review queue and manually decides whether to take action (e.g. suspend merchant). No automated suspension tied to HitPay flags in v1.

### 5.4 Merchant Suspension
- Suspension is triggered by either:
  - **System-raised flag**: **Brand** fails to pay monthly subscription (billable unit = Brand).
  - **Manual admin action**: for other business reasons (may apply at Organization or Brand level — exact scope in FSD).
- Admins can manually override/extend a **Brand** subscription before suspension triggers (e.g. legitimate late payment cases).

### 5.5 Support inbox
- Admins review customer-service **submissions** (inbox): list, filter (status, priority, type), open detail, update status / priority / resolution notes.
- Attachments on a submission may be viewed if present.
- **Out of scope for admin v1:** form builder, question/answer configuration, complaint-type administration (deferred or merchant-side as applicable).

---

## 6. Financial Requirements

Finance (ops money) and Accounting (platform books) are **different subjects** and must not be conflated in product requirements or UI.

### 6.1 Finance (ops)
- **Subscription billing visibility**: Admins must view each **Brand's** subscription status and payment history.
- **Manual subscription override**: Admins can manually extend or waive a Brand subscription payment to prevent/delay suspension.
- **Settlement handling**: Settlement processing itself remains outside the system for v1, handled via HitPay/manual DuitNow transfer as per existing process.
- **Surcharge/settlement visibility**: Admins can see surcharge revenue captured per transaction and settlement amounts.
- **Reconciliation view**: Required for v1 — admin needs a view reconciling HitPay balance against amounts owed to merchants (period × merchant/Brand table).
- **Manual payout/refund overrides** must be logged with a reason code. Reason code list (fixed set, not free text, to support future audit/reporting):
  - Merchant dispute resolved in their favor
  - Platform error
  - Goodwill / retention
  - Duplicate charge
  - Other (mandatory free-text note required)

### 6.2 Accounting (platform books)
- Admins can work with **Miki platform** general-ledger data: chart of accounts, journal entries, ledger / period balances, fiscal years and periods.
- **Merchant books** (merchant-side accounting) live in the merchant portal — not as a primary admin surface in v1. Optional future support drill-down is out of scope for this BRD revision.
- Integration approach with existing financial database infrastructure to be confirmed with the technical team (Haziq) before FSD finalization.

---

## 7. Approval & Audit Requirements

- **Dual approval is required for money-related actions only** — specifically, manual payout overrides and refund approvals. Dual approval is not required for non-financial admin actions (e.g. merchant status changes, viewing records, support inbox updates).
- **Audit logging is required from day one** for all admin actions, particularly financial ones (who did what, when, and why — via reason codes where applicable). Product audit log is distinct from platform/Mendix internals.

---

## 8. Merchant Data & Lifecycle

- Canonical structure: **Organization → Brand → Branch**. Subscriptions and billing attach to **Brand**.
- Lifecycle states follow a standard flow including at least: `active`, `suspension_pending`, `suspended`, `churned` — detailed state map and which entity (Org vs Brand) owns each status to be defined in FSD.
- Onboarding remains informal; no KYC-style document management required in v1.
- Sensitive data handling (e.g. owner payout bank details) to be addressed in FSD with masking rules.

---

## 9. Marketing Module (Organic / Guerrilla Tracking) — Deferred

**Status:** Deferred for v1. Do not wireframe or prioritize in the current design pass. Requirements below are retained as backlog only.

### Purpose (backlog)
Track organic (non-paid) social posts across Facebook, Threads, X, and Reddit to evaluate which marketing angles and platforms work. Explicitly excludes paid marketing / ad tracking.

### Core Concept (backlog)
Experiment log (not a social dashboard): posts grouped under experiments / hypotheses.

### Data Model (backlog)

**Experiment** — name / hypothesis, date range, status (`active` / `concluded`), learnings.

**Post** — platform, URL, date, posted by, content type, hook/angle, manual metrics (likes, comments, shares, saves, views); architecture should allow future API fill of the same shape.

### Out of Scope (when revived)
- Paid marketing / ad tracking
- Automated metric pulling via platform APIs (v1 of marketing module may still be manual)
- Conversion / signup attribution per post
- Analytics / reporting dashboards

---

## 10. Scale & Technical Assumptions

- Target scale: **~100 merchants** for the relevant planning horizon.
- **Platform: website/desktop only** — no mobile/tablet optimization required for v1.
- Target production schema: [`docs/db-schema.json`](../db-schema.json) (hybrid with this BRD — see Designer IA Brief).
- No additional backend constraints flagged at this stage; to be confirmed with Haziq during FSD.
- Schema gaps known for v1 money/governance modules (refund workflow, recon/settlement store, admin audit log, explicit lifecycle enums) — eng must close; design may proceed against agreed field lists in FSD.

---

## 11. Out of Scope (v1)

Explicitly excluded from this release:
- Automated settlement processing
- Automated fraud/anomaly detection (remains with HitPay)
- Multi-role permission system (only Super Admin ships; architecture should anticipate future roles)
- Merchant self-service admin access (merchants never get admin access)
- Reporting/analytics dashboards
- **Marketing experiment log** (deferred — see §9)
- Paid marketing / ad tracking; automated social metric pulls and conversion attribution
- **CS form / question builder** (Support is inbox-only)
- **Merchant-ops ERP in admin** — employee, shift, payroll, product, service, POS write (merchant portal only)
- **Merchant accounting books** as a primary admin surface (merchant portal)

---

## 12. Timeline

- Frontend delivery timeline is **flexible**.
- Design and build priority follow Designer IA Brief §9: Merchants hub → Finance (Refunds, Reconciliation, Transactions) → Subscriptions → Support → Audit Log → Accounting → Dashboard polish.

---

## 13. Open Items Requiring Follow-Up Before FSD Finalization

| # | Item | Owner |
|---|------|-------|
| 1 | Confirm HitPay API capabilities for transaction flag/status data | Fakhrul / Haziq |
| 2 | Confirm integration approach with existing financial DB; clarify platform vs merchant accounting ownership in data | Haziq / other developer |
| 3 | Finalize refund request field list (beyond receipt ID + reason) | Fakhrul |
| 4 | Define detailed lifecycle state map (Org vs Brand; include `suspension_pending`) | Fakhrul |
| 5 | Define sensitive data masking rules (owner bank details, etc.) | Fakhrul / Haziq |
| 6 | ~~Schema additions: refund + dual-approval + reason codes; recon/settlement (or HitPay sync); admin audit log~~ **Done in `docs/db-schema.json`** — see [`Miki Admin Portal — Schema Gaps.md`](./Miki%20Admin%20Portal%20%E2%80%94%20Schema%20Gaps.md); remaining = Mendix migration + HitPay field confirm | Haziq |
| 7 | Support inbox: confirm submission fields / statuses used in v1 UI | Fakhrul |
| 8 | Note for eng: `rubish$*` vs `shiftmanagement$*` overlap — cleanup; not product IA | Haziq |

---

## 14. Next Step

1. Team sign-off on this BRD (v1.1).  
2. **Wireframes / design** against [`Miki Admin Portal — Designer IA Brief.md`](./Miki%20Admin%20Portal%20%E2%80%94%20Designer%20IA%20Brief.md) and [`Miki admin portal user flow.md`](./Miki%20admin%20portal%20user%20flow.md).  
3. Then FSD: screen-by-screen flows, field-level validation, permission matrix, state transitions, and edge cases for each **in-scope** module.
