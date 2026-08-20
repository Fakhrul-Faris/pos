# Open HitPay questions (Round 24)

**Status:** Unanswered — do **not** implement a guess.  
**Closed through:** Round 26 in [`requirements.md`](requirements.md).  
**Official API:** [HitPay docs](https://docs.hitpayapp.com/) — do not rely on a local dump.

Round 26 closed billing, QR life (15 min), tablet NFC, settlement screens, and disputes. These 20 items are still open.

| # | Question | Why it blocks |
| :---: | :--- | :--- |
| 1 | How does the customer tap a card? Round 26 said POS-tablet NFC. Confirm HitPay’s Malaysia Tap-to-Pay / in-app NFC SDK before promising it. | PCI + device matrix |
| 2 | **DuitNow refunds are not supported by HitPay.** Cash/bank manual refund, hide DuitNow, or call API and fall back? | Every DuitNow refund will fail if we call HitPay |
| 3 | `platform_commission_amount` must be **> 0**. Round 22 allows 0% on some methods. Send RM0.01, skip the field, or hide the method? | Payment request can be rejected at the counter |
| 4 | Unified (platform) webhooks do **not** receive `payment_request.*`. Paid signal = `charge.*` on the platform webhook? | POS may never mark paid |
| 5 | Keep a **wallet reserve** so refunds/chargebacks don’t fail after full payout? | Empty wallet → refund retries all fail |
| 6 | Merchant “unlimited refund days” vs HitPay’s 30-day cap on many methods. Whose rule wins? | POS must not promise a refund HitPay will reject |
| 7 | Is the **tip** included in the HitPay amount? Commission on sale only, not tip. | Electronic tips otherwise never arrive |
| 8 | HitPay **minimum RM2.00**. Loyalty/zero bills and small splits. | API reject on RM0 / RM1.50 |
| 9 | After we give the shop their HitPay login, they can break webhooks/keys. Stop giving owner login? | Commission, refunds, POS calls |
| 10 | Who pays **sale + RM200** on a chargeback after we already settled the shop? | Wallet / next settlement |
| 11 | Customer pays the **old QR** at the same moment cashier taps Retry. Refresh-first? | Double charge or late SUCCESS on FAILED |
| 12 | KYB stuck/rejected — how long is cash-only, and what banner? | Shop looks broken |
| 13 | **Franchise:** one HitPay account per Brand vs per legal company / Outlet. | Wrong bank, wrong SSM |
| 14 | Subscription **card expired** — self-serve “Update card” in merchant billing? | Shop goes read-only |
| 15 | HitPay API down, shop internet fine. Hide QR after 2 failed creates? | Counter freeze vs hammering a dead gateway |
| 16 | Retry must not reuse the same `reference_number`. `{id}-A1`, `-A2`? | Webhook mix-up |
| 17 | HitPay **Locations** per Outlet (`business_location_id`)? | Z-report vs HitPay lump statement |
| 18 | Late SUCCESS after the owner **locked the month**. Post to arrival day, or write into the lock? | Tax / Z-report vs lock rule |
| 19 | Touch ’n Go in Phase 1? Round 20 = no eWallets; Round 21 listed `touch_n_go`. Round 26 left it out. | Method matrix |
| 20 | Cashier adds a service **after the QR is on screen**. Cancel QR and re-issue? | Amount on HitPay ≠ bill |

Until these are answered, implement only what Round 19–26 already closed, and treat DuitNow refunds and commission-of-zero as **must-ask** before coding those paths.
