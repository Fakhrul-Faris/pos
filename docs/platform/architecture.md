# Platform Architecture — Miki · Universal Core vs Local Adapters

**Purpose:** How we scale worldwide without rebuilding POS for every country’s tax and labour rules.  
**Platform hub:** [`README.md`](README.md)  
**Related:** [`../modules/barbershop/features-and-pricing.md`](../modules/barbershop/features-and-pricing.md) · [`../modules/barbershop/spec.md`](../modules/barbershop/spec.md)

---

## Principle

| Build once (universal) | Build per country (adapter) | Never build |
| :--- | :--- | :--- |
| Receipt, transactions, staff attribution | Government tax filing APIs | Global “one e-invoice API” |
| Shift sessions on POS, commission math | Country-specific tax field mapping | Payroll / KWSP / SOCSO / CPF |
| Customer profile from bookings (phone) | Local compliance copy on documents | Statutory payslips |
| Export CSV / JSON for accountants | MyInvois (MY), InvoiceNow (SG), … later | — |
| Stamps on paid visit | HitPay / payment adapters per market | Separate clock-in app |

**Positioning:** *One POS + booking OS for service shops everywhere. Receipts and chair economics built in. Tax filing plugs in where we operate — payroll stays with local HR tools.*

---

## 1. Tax & invoicing

### Universal layer (every market, every tier with payments)

```
Transaction → Digital receipt (customer-facing URL/QR)
           → TaxDocument record (optional)
           → Export for accountant (CSV/JSON)
```

| Entity | Fields (conceptual) |
| :--- | :--- |
| `TaxDocument` | `transaction_id`, `status`, `buyer_name`, `buyer_tax_id`, `submitted_at`, `authority_ref`, `country_code` |

**Checkout UX (universal):** “Need tax invoice?” → collect buyer fields only when yes.

### Country adapters (add-on, not in base tiers)

| SKU | Market | Authority | Phase |
| :--- | :--- | :--- | :--- |
| **Tax Compliance — Malaysia** | MY | LHDN MyInvois | Phase 2 / add-on |
| **Tax Compliance — Singapore** | SG | InvoiceNow | When we enter SG |
| *(future)* | EU, etc. | PEPPOL access point | Enterprise / Arsenal |

Each adapter: map internal `TaxDocument` → local API · handle auth · retries · validated UUID on receipt.

**Not included in Ocelot/Mantis base:** live submission to LHDN. **Included in base:** receipt + export.

### Packaging

| | Ocelot / Mantis | Patriot | Add-on |
| :--- | :--- | :--- | :--- |
| Digital receipt | ✓ | ✓ | — |
| Tax export (CSV/JSON) | ✓ | ✓ | — |
| **MyInvois live submit** | — | ✓ included | **RM49/mo** on Ocelot/Mantis |

*Patriot includes Malaysia tax pack for multi-branch shops; single-shop can buy add-on.*

---

## 2. Workforce (not HR)

### Universal layer

| Capability | How | Surface |
| :--- | :--- | :--- |
| **People** | Barber/staff profile | Owner web |
| **Attribution** | `staff_id` on every booking & payment | POS barber switcher |
| **Shift session** | Tap barber → “Start shift” on **shared POS** | POS only — no extra app |
| **Shift end** | Switch barber / manual end / auto at shop close | POS |
| **Activity** | Cuts, revenue, duration per shift | Reports |
| **Commission rules** | % of service, fixed chair rent, hybrid per barber | Owner web |
| **Commission statement** | Period: gross, shop share, barber share | Owner web + CSV |
| **Payroll export** | Static worksheet: base + commission + adjustments | Owner web + CSV |

```
Shift
  id, staff_id, shop_id
  started_at, ended_at
  source: POS_START | POS_SWITCH | MANUAL_END | AUTO_EOD
```

### Explicitly excluded (all countries)

Payroll · payslips · statutory contributions · leave law · biometric clock · GPS attendance · separate staff clock-in app.

**Pitch:** *“Tak payah Excel — nampak siapa dapat berapa, terus dari POS.”*

### Packaging

| Feature | Ocelot | Mantis | Patriot |
| :--- | :---: | :---: | :---: |
| Per-barber revenue reports | ✓ | ✓ | ✓ |
| POS shift (clock-in via switcher) | — | ✓ | ✓ |
| Commission rules + statements | — | ✓ | ✓ |

---

## 3. Organization & outlets

### Data model (day 1)

```
Company
  └── Outlet (1..n)
        └── Barbers, bookings, POS, payments
```

| Onboarding path | UX | Result |
| :--- | :--- | :--- |
| **Solo** | “Just me” | Auto **1 company + 1 outlet** — complexity hidden |
| **Multi** | “Multiple shops” | Create **organization**, then add outlets |

**Tier gates (UI):** 1 outlet (Ocelot) · 2 (Mantis) · 5+ (Patriot). Model always supports multi-outlet; limits enforced by plan.

---

## 4. Payments (HitPay)

### Universal checkout paths

| Path | Who pays fee | Auto-reconcile |
| :--- | :--- | :--- |
| **HitPay QR** | Customer (+2% on subtotal) | ✓ |
| **HitPay card tap** | Customer (+2% on subtotal) | ✓ |
| **Cash** | RM0 | Manual confirm |
| **Merchant own DuitNow** | RM0 | Manual confirm |

**Mantis+ only** for **reconciliation dashboard**. **Lite** = capped rail (RM5k/mo). **Ocelot+** = unlimited rail. Cash + own DuitNow on all tiers.

Full flow, automation, and scale: [`payment-rails.md`](payment-rails.md).

### Fee display (example)

```
Services     RM40.00
Service fee  RM 0.80  (2%)
─────────────────────
Total        RM40.80   ← customer pays
```

Merchant books **RM40.00** revenue. Platform target ~**0.8%** of base; HitPay ~**1.2%** — confirm with partner.

### Packaging

| Feature | Ocelot | Mantis | Patriot |
| :--- | :---: | :---: | :---: |
| Cash + own DuitNow | ✓ | ✓ | ✓ |
| HitPay QR + card | ✓ | ✓ | ✓ |
| Reconciliation dashboard | — | ✓ | ✓ |

---

## 5. Customers & loyalty

### Universal layer (Ocelot+)

- Profile auto-created/updated from **phone + name** on each booking (no customer signup).
- Visit history, last service, lifetime spend — **merchant-facing CRM**.
- PDPA consent at booking.
- **Stamps:** book via web with phone → bind to card → grant on **paid** visit (not booking alone).
- Merchant sees progress (“3 more visits”); manual remind v1.
- **1 active stamp campaign** on Ocelot+; **Lite = no stamps**.

### Phase 3 & add-ons

| SKU | Includes | When |
| :--- | :--- | :--- |
| **Regulars & Rewards** add-on | Multi-campaign, SMS nudges for loyalty | Optional ~RM49/mo |
| **Vouchers** | Redeemable discounts | Phase 3 |

### Deferred

**Customer feedback / ratings** — not until post-PMF and system stable. When built: **private, owner-only** first (avoid barbers blamed for beta issues).

---

## 6. Phasing summary

| Phase | Tax | Workforce | Customers | Payments |
| :--- | :--- | :--- | :--- | :--- |
| **1A Ocelot** | Digital receipt | Barber profiles + revenue reports | Profiles + stamps | Cash + own DuitNow |
| **1B** | Receipt + tax export (Mantis) | POS shift + commission (Mantis) | Same | **HitPay** — Lite cap · **Ocelot+ unlimited** · Mantis **reconcile** |
| **2** | MY MyInvois **add-on**; Patriot bundles MY | Commission statements mature | Regulars & Rewards add-on | Reconcile mature |
| **3** | New country adapters | Same universal core | Vouchers | — |
| **New country** | New tax adapter SKU | Same universal core | Same | Payment adapter TBD |

---

## Decision log

| Date | Decision |
| :--- | :--- |
| 2026-06-27 | Universal receipt + `TaxDocument`; country adapters per market |
| 2026-06-27 | MyInvois = **add-on** (RM49/mo); **included on Patriot** |
| 2026-06-27 | No global e-invoice API — adapter pattern only |
| 2026-06-27 | Workforce = shift on POS + commission + **static payroll export**; **no payroll APIs** |
| 2026-06-27 | No separate clock-in app — shift tied to barber switcher |
| 2026-06-25 | **Company → Outlet** model; solo vs multi onboarding |
| 2026-07-02 | **Option C′** — Lite cap; **Ocelot+ unlimited** rail; Mantis+ reconcile |
| 2026-06-25 | **HitPay** — 2% customer surcharge; cash/own QR RM0 |
| 2026-06-25 | **Stamps on Ocelot+**; paid visit triggers; Lite excluded |
| 2026-06-25 | **Feedback deferred** post-PMF; private owner-only when built |
| 2026-06-25 | **Referral:** 1 month free after referee pays 1 month |
| 2026-06-25 | **Vouchers** Phase 3 |
