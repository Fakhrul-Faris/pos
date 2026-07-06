# Platform Admin Portal — Spec

**Audience:** Miki internal ops (founders, support, finance) — **not** shop owners  
**App path (proposed):** `apps/admin-web/`  
**Penpot draft:** `‎ ‎ ‎ Admin Portal` · **Hi-fi:** `Admin · Hi-Fi`  
**Design:** Same tokens as Merchant Portal — compact desktop density ([`design-system/specification.md`](design-system/specification.md) §3.3)

---

## vs Merchant Portal

| | **Merchant Portal** (Owner web) | **Admin Portal** (Platform) |
| :--- | :--- | :--- |
| **User** | Shop owner / manager | Miki staff only |
| **Scope** | One tenant (their shop) | All merchants, billing, devices |
| **Screen IDs** | O-xx · Penpot `MP — *` | **A-xx** · Penpot `AP — *` |
| **Auth** | MOD-01 merchant signup | Separate allowlist / SSO (internal) |
| **Phase** | 1A — launch blocker | 1A **minimal** · expand post-launch |

**Rule:** Owner setup, calendar, and barber rules live in **Merchant Portal** — never duplicate here.

---

## Phase 1A scope (MVP admin)

Enough to operate 10–50 pilot merchants without SQL:

| Priority | Capability |
| :--- | :--- |
| **Must** | Platform dashboard (MRR, active merchants, trial expiring) |
| **Must** | Merchant list + search + status (trial / Lite / Ocelot / suspended) |
| **Must** | Merchant detail (plan, usage, outlets, last active, support notes) |
| **Must** | Subscriptions view (plan changes, trial end dates, MRR roll-up) |
| **Should** | Device registry (POS tablets linked to shop) |
| **Should** | Internal user list (who has admin access) |
| **Later** | Support tickets, feature flags, impersonation audit log |

---

## Screen index (A-xx)

### A-01 Auth

| ID | Screen | Detail |
| :--- | :--- | :--- |
| A-01-01 | Login | Google Workspace or email allowlist; no public signup |
| A-01-02 | Access denied | User authenticated but not on admin allowlist |

### A-02 Dashboard

| ID | Screen | Detail |
| :--- | :--- | :--- |
| A-02-01 | Platform dashboard | **KPIs:** Active merchants · On trial · MRR · GMV (HitPay) · Churn this month |
| | | **Lists:** Trials expiring in 7 days · Recently signed up · Suspended |
| | | **Penpot:** `AP — Dashboard` · `AP-Hi — Dashboard` |

### A-03 Merchants

| ID | Screen | Detail |
| :--- | :--- | :--- |
| A-03-01 | Merchant list | Table: name, vertical, plan, status, created, last active |
| | | Filters: plan · status · vertical · trial ending |
| | | Actions: Open detail · Suspend · Extend trial (role-gated) |
| | | **Penpot:** `AP-Hi — Merchants` |
| A-03-02 | Merchant detail | Header: shop name, owner email, plan chip, trial countdown |
| | | Tabs/sections: Outlets · Usage (bookings/mo) · Billing history · Devices · Notes |
| | | Actions: Change plan · Reset trial · Suspend · View as owner (audit, Phase 1B) |
| | | **Penpot:** `AP — Merchant Detail` · `AP-Hi — Merchant Detail` |

### A-04 Subscriptions & revenue

| ID | Screen | Detail |
| :--- | :--- | :--- |
| A-04-01 | Subscriptions | MRR by plan (Lite / Ocelot / Mantis / Patriot) · new vs churned |
| | | Table: merchant, plan, MRR, trial end, payment status |
| | | **Penpot:** `AP — Subscriptions` · `AP-Hi — Subscriptions` |
| A-04-02 | Revenue (HitPay) | Platform net from 2% rail · optional Phase 1B |

### A-05 Users (internal)

| ID | Screen | Detail |
| :--- | :--- | :--- |
| A-05-01 | Admin users | Miki staff with admin roles: Support · Finance · Super |
| | | **Penpot:** `AP-Hi — Users` |

### A-06 Devices

| ID | Screen | Detail |
| :--- | :--- | :--- |
| A-06-01 | Device registry | POS devices: shop, device name, last sync, app version, offline queue depth |
| | | Actions: Revoke device · Force logout |
| | | **Penpot:** `AP-Hi — Devices` |

### A-07 Support (Phase 1B)

| ID | Screen | Detail |
| :--- | :--- | :--- |
| A-07-01 | Support inbox | Merchant-reported issues · link to merchant detail |

---

## Shell layout

Same pattern as Merchant · Hi-Fi:

```
┌─────────────┬──────────────────────────────────────┐
│ Sidebar     │  Page header (title + actions)       │
│ 240px fix   │  ─────────────────────────────────── │
│ Miki Admin  │  Content cards (flex column, fill)   │
│ nav items   │                                      │
└─────────────┴──────────────────────────────────────┘
```

**Nav (Phase 1A):** Dashboard · Merchants · Subscriptions · Revenue · Users · Devices · Settings

**Frame size:** 1440 × 900

---

## Data sources (engineering)

| Screen | Primary modules |
| :--- | :--- |
| Dashboard | MOD-02 Subscription, aggregate metrics |
| Merchants | MOD-03 Store, MOD-01 Auth (owner) |
| Subscriptions | MOD-02 Billing |
| Devices | MOD-11 Device Registry |
| Usage | MOD-06 bookings count, MOD-07 GMV |

---

## Roles (internal RBAC)

| Role | Dashboard | Merchants | Change plan | Suspend | Devices |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Support** | Read | Read + notes | — | — | Read |
| **Finance** | Read | Read | Read | — | — |
| **Super** | Full | Full | Full | Full | Full |

---

## Penpot frame index

**Draft page:** `‎ ‎ ‎ Admin Portal` — frozen  
**Hi-fi page:** `Admin · Hi-Fi`

| Row | y | Frames |
| :--- | :--- | :--- |
| Auth | 0 | Login |
| Core | 0 | Dashboard · Merchants · Merchant Detail |
| Billing · ops | 960 | Subscriptions · Users · Devices |

Draft: `AP — Dashboard`, `AP — Merchant Detail`, `AP — Subscriptions`

---

## Related

| Doc | Purpose |
| :--- | :--- |
| [`pricing-model.md`](pricing-model.md) | Trial → Lite → paid ladder |
| [`payment-rails.md`](payment-rails.md) | HitPay 2% · platform net |
| [`../modules/barbershop/ui.md`](../modules/barbershop/ui.md) | Owner web (O-xx) · Penpot cross-links |
| [`../product/engineering-modules.md`](../product/engineering-modules.md) | MOD-* build order |
