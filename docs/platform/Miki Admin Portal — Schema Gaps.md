# Admin Portal — Schema Gaps Closed (Eng Handoff)

**Version:** 1.0  
**Date:** July 2026  
**Status:** Applied to `docs/db-schema.json` (target production ontology)  
**Authority:** Complements Designer IA Brief §10 and BRD §13 item 6. Product IA remains the Designer IA Brief.

**Prototype mapping:** `apps/admin-portal/src/data/types.ts` + store actions.

---

## 1. What was missing (and why it mattered)

| Gap | Product need | Before | After |
| :--- | :--- | :--- | :--- |
| Refund + dual approval + reason codes | Finance Refunds | No tables | `adminfinance$refundrequest` + `adminfinance$reasoncode` |
| Recon / surcharge / settlement | Finance Reconciliation | No tables | `adminfinance$reconciliationperiod` + `adminfinance$payoutoverride` |
| HitPay tx triage | Finance Transactions | No tables | `adminfinance$transactionsnapshot` |
| Product audit log | Audit Log | No product table | `adminops$auditlog` |
| Lifecycle states | Org suspend / suspension pending | Org `status` free text only | `lifecyclestatus` + `suspensionpendinguntil` on Org; Brand `billingstatus` |
| Brand billing history | Subscriptions / Brand drill-in | Line only | Brand billing cols + `subcriptionplan$subscriptionpayment` |
| Support org link | Support inbox | Submission had no Org FK / body | `body` + Org/Brand FKs on `customerservices$submission` |

---

## 2. Locked ownership (matches prototype Waves 1–2)

| Concern | Entity | Schema home |
| :--- | :--- | :--- |
| Lifecycle (`active` / `suspension_pending` / `suspended` / `churned`) | **Organization** | `organization$organization.lifecyclestatus` (prefer over overloaded `status` once migrated) |
| SaaS plan / waive / extend / past_due | **Brand** | `organization$brand.billingstatus` + `subcriptionplan$subscriptionline` + `subscriptionpayment` |
| Settlement, refunds, payout override, recon grain | **Organization** | `adminfinance$*` with optional Brand/Branch context FKs |
| Platform GL | Miki only | Existing `generalaccounting$*` (unchanged) |
| Support inbox | Submission (+ Org context) | Existing `customerservices$submission` (patched) |

**Do not** store Brand SaaS billing on refund/recon rows as the settlement key. Optional `brand` / `branch` FKs are **outlet context only**.

---

## 3. New tables (added to `docs/db-schema.json`)

### 3.1 `adminops$auditlog`

Who / what / when / why for product admin actions (not Mendix system logs).

Key columns: `occurredat`, `adminaccountid`, `action`, `organizationid`, `brandid`, `entitytype`, `entityid`, `reasoncode`, `reasonnote`, `beforevalue`, `aftervalue`, `detail`.

**Action values (v1):** align with prototype `AuditActionType` — money (`refund_*`, `payout_override_*`, `subscription_*`), lifecycle (`merchant_suspended`, `merchant_reactivated`), support (`support_*`), triage (`flagged_reviewed`), `note_added`, `login`. Marketing experiment actions may exist historically but Marketing is deferred in product IA.

### 3.2 `adminfinance$reasoncode`

Fixed set for money overrides:

| code | requiresnote |
| :--- | :---: |
| `merchant_dispute` | no |
| `platform_error` | no |
| `goodwill` | no |
| `duplicate_charge` | no |
| `other` | **yes** |

### 3.3 `adminfinance$refundrequest`

Dual-approval refund workflow. Status: `pending_first` | `pending_second` | `approved` | `rejected` | `processed`.

Required: Org FK. Optional: Brand, Branch, Transaction snapshot FKs.

**Rule:** same admin cannot be first and second approver (enforce in app / FSD).

### 3.4 `adminfinance$payoutoverride`

Dual-approval settlement top-up / adjustment. Links to Org + optional `reconciliationperiod`.

### 3.5 `adminfinance$transactionsnapshot`

HitPay (or POS) payment visibility for admin triage. Stores surcharge / settlement amounts, flag reason, review fields, optional `rawpayload` for sync.

Grain for settlement reporting remains Org; Brand/Branch optional context.

### 3.6 `adminfinance$reconciliationperiod`

Period × **Organization** snapshot: HitPay collected, surcharge revenue, owed, settled. `sourcenote`: `manual` | `hitpay_sync`.

### 3.7 `subcriptionplan$subscriptionpayment`

Payment history rows for a Brand subscription line (`paid` | `failed` | `waived` | `refunded`).

---

## 4. Patches to existing tables

| Table | Columns added |
| :--- | :--- |
| `organization$organization` | `lifecyclestatus`, `suspensionpendinguntil`, `lastactivedate` |
| `organization$brand` | `billingstatus`, `graceendsat`, `nextbillingdate`, `mrr` |
| `subcriptionplan$subscriptionline` | `graceendsat`, `nextbillingdate`, `lastpaymentdate`, `lastpaymentamount` |
| `customerservices$submission` | `body`, `…_organization`, `…_brand` |

**Lifecycle enum (Org):** `active` | `suspension_pending` | `suspended` | `churned`  
**Billing enum (Brand):** `active` | `past_due` | `waived` | `cancelled`

Until Mendix migration completes, apps may mirror `lifecyclestatus` ↔ legacy `status`. Prefer writing both during transition.

---

## 5. Prototype → table map

| Prototype type / action | Table |
| :--- | :--- |
| `RefundRequest` | `adminfinance$refundrequest` |
| `PayoutOverride` | `adminfinance$payoutoverride` |
| `Transaction` | `adminfinance$transactionsnapshot` |
| `ReconciliationRow` | `adminfinance$reconciliationperiod` |
| `AuditEntry` | `adminops$auditlog` |
| `SupportSubmission` | `customerservices$submission` |
| Brand `subscription.paymentHistory` | `subcriptionplan$subscriptionpayment` |
| `extendSubscription` / `waiveSubscription` | Brand + subscriptionline + payment row + auditlog |
| Platform Accounting screens | `generalaccounting$*` (already present) |

---

## 6. Still open (not schema — FSD / ops)

These remain BRD open items; schema no longer blocks them:

1. HitPay API flag field confirmation (map into `transactionsnapshot` / `rawpayload`)  
2. Platform vs merchant GL tenancy rules in runtime (tables already split)  
3. Exact refund field list polish (table already has receipt, amount, reason, notes, context FKs)  
4. Bank masking rules (presentation; owner bank already on contacts / employee bank patterns)  
5. `rubish$*` vs `shiftmanagement$*` cleanup (non-blocking)

---

## 7. Eng checklist

- [ ] Create Mendix entities / DB migration for new `adminops$*` and `adminfinance$*` tables  
- [ ] Seed `adminfinance$reasoncode` rows  
- [ ] Migrate Org `status` → `lifecyclestatus` values including `suspension_pending`  
- [ ] Wire dual-approval guards in service layer  
- [ ] Wire audit writes on all money + lifecycle + support status paths  
- [ ] Optional: HitPay sync job → `transactionsnapshot` + recon snapshots  

---

*End of eng handoff. Update this file if FSD renames enums; keep `docs/db-schema.json` as the structural SSOT.*
