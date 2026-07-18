# Business Requirements Document (BRD)
## Miki — Internal Ops Admin Portal

**Version:** 1.0 (Draft)
**Prepared by:** Fakhrul
**Date:** July 2026
**Status:** Draft for team review (Haziq, Helmi)

---

## 1. Purpose

This document defines the business requirements for Miki's **internal operations admin portal** — the tool used by the founding team (and future support/ops hires) to manage merchants, transactions, refunds, subscriptions, settlement operations, and organic marketing experiments.

This is distinct from any future merchant-facing dashboard, which is out of scope for this document.

---

## 2. Background

Miki is a counter management and POS SaaS targeting Malaysian brick-and-mortar SMEs. The platform owns the HitPay payment account on behalf of merchants, charges a customer-facing surcharge, and settles funds to merchants via DuitNow on a T+2 basis. This settlement model is currently manual for MVP, with automation planned at scale.

As merchant count grows toward the initial target of ~100, the founding team needs a centralized internal tool to manage the operational, financial, and support workflows that are currently untracked or handled ad hoc.

---

## 3. Goals & Success Criteria

- Give the founding team a single place to manage merchant accounts, subscriptions, refunds, and settlement visibility.
- Replace informal/manual tracking with a logged, auditable system — particularly for money-related actions.
- Give the team a structured **experiment log** for organic (non-paid) social posts so messaging angles can be compared while strategy is still being tested.
- Land admins on an **ops + growth attention queue** (money decisions, signup/trial follow-ups, marketing check-ins) — not an analytics dashboard.
- Support a lean 3-person team today while being architected to onboard support/ops hires and additional roles later without a rebuild.
- Ship a working v1 within **1 month** (frontend).

### Dashboard landing (v1)

The Admin Dashboard is an **attention queue**, not BI:

| Block | Surfaces | Deep-links to |
| :--- | :--- | :--- |
| **Ops / money** | Pending refunds, dual approvals, flagged txs, suspension pending | Refunds · Reconciliation · Transactions · Subscriptions / Merchant detail |
| **Growth / signup** | Recent signups, trials ending soon, silent merchants (no recent activity) | Merchants / Merchant detail |
| **Marketing** | Active experiments, empty experiments (no posts), stale metric check-ins | Marketing / Experiment detail |

Explicitly **not** on the dashboard in v1: MRR/GMV charts, funnel analytics, paid-ad performance, conversion attribution.

---

## 4. Users & Roles

### v1 (this release)
- **Super Admin** — Fakhrul, Haziq, Helmi. Full access to all modules.
- Single role only for v1. No merchant ever has admin access, under any circumstance.

### Future (explicitly out of scope for v1, but must inform architecture)
- Support/Ops role(s) — the team plans to hire support/ops staff and expects to introduce additional roles with restricted (e.g. view-only, or module-limited) access.
- **Architectural requirement:** the permission system should be designed to accommodate future roles without requiring a schema rebuild, even though only one role ships in v1.

---

## 5. Core Business Processes in Scope

### 5.1 Merchant Onboarding
- Merchants sign up via the website and can use Miki immediately (self-serve, informal onboarding — no manual approval gate in v1).
- Admin portal needs visibility into merchant accounts once created, not a role in the signup flow itself.

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
  - **System-raised flag**: merchant fails to pay monthly subscription.
  - **Manual admin action**: for other business reasons.
- Admins can manually override/extend a subscription before suspension triggers (e.g. legitimate late payment cases).

---

## 6. Financial Requirements

- **Subscription billing visibility**: Admins must be able to view each merchant's subscription status and payment history within the portal.
- **Manual subscription override**: Admins can manually extend or waive a subscription payment to prevent/delay suspension.
- **Settlement handling**: Settlement processing itself remains outside the system for v1, handled via HitPay/manual DuitNow transfer as per existing process.
- **Surcharge/settlement visibility**: Admins can see surcharge revenue captured per transaction and settlement amounts.
- **Reconciliation view**: Required for v1 — admin needs a view reconciling HitPay balance against amounts owed to merchants.
- **Financial database infrastructure**: The team has existing financial database infrastructure; integration approach to be confirmed with the technical team (Haziq) before FSD finalization.
- **Manual payout/refund overrides** must be logged with a reason code. Reason code list (fixed set, not free text, to support future audit/reporting):
  - Merchant dispute resolved in their favor
  - Platform error
  - Goodwill / retention
  - Duplicate charge
  - Other (mandatory free-text note required)

---

## 7. Approval & Audit Requirements

- **Dual approval is required for money-related actions only** — specifically, manual payout overrides and refund approvals. Dual approval is not required for non-financial admin actions (e.g. merchant status changes, viewing records).
- **Audit logging is required from day one** for all admin actions, particularly financial ones (who did what, when, and why — via reason codes where applicable).

---

## 8. Merchant Data & Lifecycle

- Lifecycle states follow a general/standard flow (e.g. active, suspended, churned) — detailed state map to be defined in FSD.
- Onboarding remains informal; no KYC-style document management required in v1.
- Sensitive data handling (e.g. bank details) to be addressed in FSD with masking rules.

---

## 9. Marketing Module (Organic / Guerrilla Tracking)

### Purpose
Track organic (non-paid) social posts across Facebook, Threads, X, and Reddit to evaluate which marketing angles and platforms work, while the team is actively testing strategy. Explicitly excludes paid marketing / ad tracking for v1.

### Core Concept
This module functions as an **experiment log**, not a social media dashboard. Posts are grouped under experiments / hypotheses so the team can compare which messaging angles perform — not just track individual post vanity metrics.

### Data Model

**Experiment**
- Name / hypothesis (e.g. "Week 3: pain-point-driven hooks on barbershop audience")
- Date range
- Status (`active` / `concluded`)
- Notes / learnings (free text, filled in once concluded)

**Post** (belongs to one Experiment)
- Platform (Facebook / Threads / X / Reddit)
- Post URL
- Date posted
- Posted by (admin)
- Content type (e.g. meme, testimonial, feature demo, pain-point rant, behind-the-scenes)
- Hook / angle tested (short text tag)
- Metrics (manual entry, updated periodically):
  - Likes
  - Comments
  - Shares / Reposts
  - Saves (where platform supports it)
  - Views / Impressions (where platform supports it)

### Metrics Entry
- **Fully manual for v1** — admin logs in and updates numbers periodically (e.g. weekly check-in).
- **Architecture should anticipate API integration later** (per-platform pull for likes / comments / shares) without requiring a data model rewrite, even though v1 is manual-only.
- No conversion / signup tracking in v1 — engagement metrics only. Revisit once experiments mature.

### Views Needed
- **Experiment list** — all experiments with status and post count.
- **Experiment detail** — all posts under that experiment, with metrics, sortable / comparable.
- **Post log entry / edit** — add a post, update its metrics.
- **Cross-experiment comparison** (nice-to-have, not blocking v1) — compare engagement across hooks / platforms to spot patterns.

### Out of Scope (this module, v1)
- Paid marketing / ad tracking
- Automated metric pulling via platform APIs
- Conversion / signup attribution per post
- Analytics / reporting dashboards (consistent with rest of BRD)

---

## 10. Scale & Technical Assumptions

- Target scale: **~100 merchants** for the relevant planning horizon.
- **Platform: website/desktop only** — no mobile/tablet optimization required for v1.
- No additional backend constraints flagged at this stage; to be confirmed with Haziq during FSD.

---

## 11. Out of Scope (v1)

Explicitly excluded from this release:
- Automated settlement processing
- Automated fraud/anomaly detection (remains with HitPay)
- Multi-role permission system (only Super Admin ships; architecture should anticipate future roles)
- Merchant self-service admin access (merchants never get admin access)
- Reporting/analytics dashboards
- Paid marketing / ad tracking
- Automated social metric pulls (API) and conversion attribution per post

---

## 12. Timeline

- **Target: 1 month** for frontend delivery of v1.

---

## 13. Open Items Requiring Follow-Up Before FSD Finalization

| # | Item | Owner |
|---|------|-------|
| 1 | Confirm HitPay API capabilities for transaction flag/status data | Fakhrul / Haziq |
| 2 | Confirm integration approach with existing financial database infrastructure | Haziq / other developer |
| 3 | Finalize refund request field list (beyond receipt ID + reason) | Fakhrul |
| 4 | Define detailed merchant lifecycle state map | Fakhrul |
| 5 | Define sensitive data masking rules | Fakhrul / Haziq |
| 6 | Confirm which engagement metrics are retrievable per platform (e.g. Threads exposes fewer public metrics) — affects which fields admins are asked to fill manually | Fakhrul |

---

## 14. Next Step

Upon team sign-off on this BRD, proceed to Functional Specification Document (FSD) covering: screen-by-screen flows, field-level validation, permission matrix, state transitions, and edge case handling for each module listed above.
