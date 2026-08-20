# Miki Requirements Document

**Status:** Engineering PRD — founder decisions through **Round 26** (August 2026)  
**Product name:** **Miki**  
**Working name in this file:** Meikigo (historical). Quotes, Keycloak realm names, and app folder names below still say Meikigo — treat them as Miki.

**App mapping (this document → repo):**

| This document | Repo today |
| :--- | :--- |
| `meikigo-marketing-site` | `apps/landing` |
| `meikigo-merchant` | `apps/merchant-portal` |
| `meikigo-customer-webapp` | `apps/order-app` |
| `meikigo-pos-native` | `apps/staff-pos` (web prototype; native not started) |
| `meikigo-admin` | `apps/admin-portal` |
| `meikigo-api` | **not built** |
| `meikigo-employee-mobile` | **deprecated** — do not build |

**How to use with other docs:** this file is the **build spec** for backend, payments, billing, payroll, and operational rules. Screen IA and the current Next.js UI live in [`modules/barbershop/`](modules/barbershop/). If a UI prototype is simpler than a rule here, **this file wins for behaviour**; the prototype is not a reduction of scope.

**Still open:** [`open-hitpay.md`](open-hitpay.md) (Round 24 — unanswered). Schema dump: [`db-schema.json`](db-schema.json).

---

## System Overview
**Product Name:** Miki (this document may say Meikigo)
**Current Phase:** Barber Service (~3% of full backend data model implemented — most entities below are still to be built)
**Future Phases:** FnB, Services Business (Clinic, Counselor, Car Workshop, etc.)
**Resolved (Round 4) — F&B is expected to be a completely separate application, not a mode of this one**, and its requirements do not exist yet. Practical consequence for the current build: **do not pay a genericity tax up front** trying to make the barber data model serve F&B later — build barber-first and build it well. The shared assets across phases are likely to be the Organisation/Brand/Outlet hierarchy, subscription/billing, and auth, not the queue/service model.

Meikigo is a queue management and payment system for service-based businesses. It consists of:
- `meikigo-marketing-site` - Customer acquisition & subscription. Will expose **two** registration entry points: "Register as Merchant" and "Register as User" (customer). Merchant registration here is intentionally minimal (email + password only, for a fast signup) — Organisation/Brand/Outlet setup, subscription tier selection, and Employee/staff provisioning all happen afterward inside `meikigo-merchant`.
- `meikigo-merchant` - **Merchant back-office/portal**, used by the Brand owner/Admin from a desktop browser (not at the counter). This is where Organisation, Brand, and Outlet setup, subscription tier selection + HitPay checkout, Employee records, and Admin/Cashier account provisioning all happen. Authenticates against its own Keycloak client, separate from `meikigo-pos-native`. **✅ The dashboard and reports are mobile-responsive (Round 18)** — the one screen an owner actually opens from his phone on a Sunday night; the rest of the back office (payroll, settings, staff, catalogue) stays laptop-sized, deliberately not built for a phone screen. See The Dashboard → On the owner's phone.
- `meikigo-customer-webapp` - Client interface to view merchants, join queues, pay
- `meikigo-pos-native` - POS app used at the counter by merchant staff (Admin/Cashier). Runs as a native app downloaded onto an iPad or Android tablet — this is where employee/cashier login and queue/payment operations actually happen. Strictly a counter/queue/payment app — no back-office screens (those live in `meikigo-merchant`). Authenticates against its own Keycloak client, separate from `meikigo-merchant`.
- `meikigo-api` - Backend services. **Resolved (Round 5) — the accounting module lives here, as a module inside `meikigo-api` rather than a separate service** (see Accounting Integration). The Payroll module (PLUS/PRO) sits alongside it, with its merchant-facing screens in `meikigo-merchant`.
- `meikigo-employee-mobile` - **Deprecated.** Not part of the active roadmap. (Reconfirmed in Round 3: barbers still get no device — the cashier's POS tablet drives everything, since cashier and barber are usually the same person. **⭐ Re-asked and reconfirmed in Round 18** — a real React Native app sits in this folder and nothing in this document named it, which was worth checking rather than assuming. **Recorded as given:** *"That folder deprecated, we will not have the barber app."* Nothing about the deprecation changes; this line exists so a future reader does not mistake the folder's presence for an open decision.)
- `meikigo-admin` - **Meikigo's own internal back-office**, for company staff only — never merchant- or customer-facing. **Resolved (Round 3), its scope is deliberately broad:** full **CRUD across all tables**, the ability to **run special/administrative functions**, and **control of API configuration such as HitPay**. It is the operational tool behind everything the product does manually — e.g. fulfilling enterprise-cap requests, creating merchant HitPay accounts and holding their API keys, and support investigations.
  - **Resolved (Round 4) — `meikigo-admin` is role-based, not a flat all-staff tool.** Access is split by function — e.g. **support can view, only engineering can edit**. Not every Meikigo employee gets write access to every table.
  - **✅ Resolved (Round 26) — a FINANCE role completes HitPay payouts.** Support may **create** a payout ticket. Only Finance (or a two-person request + confirm) may **press Pay Out** (log into the Brand's HitPay account and send money to the merchant's bank). Log who paid, the amount, and HitPay's payout id. See Payment Gateway → Settlement.
  - **Resolved (Round 4) — every action in `meikigo-admin` is written to an audit log** (who changed what, when). This is what keeps the immutability guarantee on financial records and the anonymity guarantee on ratings meaningful, given the tool can technically override both.
  - **✅ Resolved (Round 8) — a STATED REASON is required before any customer personal data is opened, for every user of the tool including the highest-privileged admin.** The merchant's instruction, recorded as given: *"To ensure data privacy compliance practice, the system should record the reason. We should not allow any users including admin to open and check customer data without any relevant reasons."* See Meikigo Staff Access to Customer Data (Round 8) for the full rule.
  - Also configured here: the **minimum ratings threshold** before a public score is displayed (see Reviews & Ratings).
- Authentication: Integrated with `meiki-go-keycloak` — `meikigo-merchant` and `meikigo-pos-native` each register as a distinct Keycloak client.

---

## Organisation → Brand → Outlet Hierarchy

Meikigo's merchant data model has three levels:

- **Organisation** — the legal company (one SSM registration number).
- **Brand** — a customer-facing shop name owned by an Organisation. Subscription happens at this level.
- **Outlet** — a physical branch of a Brand. This is the "merchant" the queue, POS, and staff are scoped to.

### Concrete example
```
Styling Maju Sdn Bhd (Organisation)
├── Modern Barbershop (Brand)
│   ├── Modern Barbershop Kepong Branch (Outlet)
│   └── Modern Barbershop Damansara Utama Branch (Outlet)
└── Afira Saloon (Brand)
    ├── Afira Saloon Ipoh (Outlet)
    └── Afira Saloon Johor Bharu (Outlet)
```

### Rules
- One Outlet belongs to exactly one Brand — outlets are never shared/co-located across brands.
- One Organisation can own multiple Brands, and those Brands **can span different business verticals** (e.g., one Organisation running both "Restoran Megah" (F&B) and "Barbershop Cantik" (barber) as separate Brands). There is no vertical/business-type restriction at the Organisation level.
- **Subscription is per Brand, not per Organisation and not per Outlet.** Each Brand subscribes to its own plan independently — an Organisation with 3 brands needs 3 active subscriptions. `SubscriptionLine` correctly links to `Brand`.
- **Max outlet cap is enforced at Brand level**, driven by the Brand's active subscription plan (see Subscription Tiers below). **Max brand cap is enforced at Organisation level as a fixed global limit (default 10, configurable in `applicationsetting`)** — it is not tied to any Brand's subscription tier. There is no Organisation-level subscription; each Brand under an Organisation subscribes to its own plan independently.
- Free trial state (`isfreetrialactivated`, `freetrialended`) correctly lives on `Brand` — each Brand gets its own independent trial, since subscription itself is a Brand-level concept.
- The trial is **strictly one-time per Brand for its lifetime** — once `freetrialended`, a Brand can never re-enter `FREETRIAL` again (no re-trial after a period of inactivity).
- Queue, product catalog source-of-truth ownership, and loyalty program configuration are scoped as described in their respective sections below (queue = per Outlet; catalog = per Brand with Outlet overrides; loyalty = per merchant/Outlet).
- **Resolved — merchant account to Organisation cardinality:** the 1:1 constraint is specifically between the **creator** (`iscreator`) and the Organisation — the account that creates an Organisation can only ever create/own that one Organisation, and there is no Organisation-switcher UI need for that creator. This is distinct from how many *staff accounts* the Organisation itself can have — once created, the Organisation can have many staff accounts attached to it (see Staff Invitation Flow below); the 1:1 rule constrains Organisation creation, not Organisation membership. Once the creator's Organisation exists, it can own multiple Brands as above; creating a second/third Brand attaches directly to that same existing Organisation and does **not** repeat Organisation/SSM data entry.
- **Resolved — no SSM registry validation:** the SSM number collected during Organisation setup is **not** validated against any external SSM registry/API — there is no live lookup or integration. It is stored as merchant-attested data (format-checked at most, no third-party verification).

---

## User Roles & Authentication

### Client User Types (meikigo-customer-webapp)

> **⚠️ Resolved (Round 2) — the Guest User type is DROPPED entirely.** There is now exactly **one** client type: a registered Account User. This **supersedes both** the original "Guest has email + password, points burned" model *and* the Round 1 "Guest is phone-number-only, loyalty keyed on phone" model. Every transactional feature — taking a queue number, booking a slot, earning/redeeming loyalty, leaving a review — requires a registered account.

**1. Account User — the only client type**
   - Email (unique)
   - Password (via Keycloak) — **or** Google/Gmail sign-up, configured as a social identity provider in Keycloak, to keep the signup step as low-friction as possible
   - Full name
   - Phone number
   - Loyalty points tracked against the account
   - History views: transaction history, point history, redemption history
   - **Resolved (Round 4) — the four required signup fields are: email, phone number, full name, password.**
   - **✅ Resolved (Round 12) — the PHONE NUMBER IS UNIQUE. One phone number, one account.** A second person cannot register with a number already in use; they must supply a different one.
     - **Why it was asked:** families sharing one number are common in Malaysia — a couple, or a parent and teenager. The alternative was to allow duplicates and let the cashier pick the right name from a list.
     - **What uniqueness buys:** the phone number is the cashier's lookup key (Round 2) and the "I have a booking" recovery key, so a unique number means a lookup returns exactly one person, with no chance of a cashier attaching a sale, loyalty points or a ticket to the wrong family member.
     - ⚠️ **What it costs, stated plainly so it is not discovered at the counter:** a household with one phone genuinely cannot hold two accounts. The second person needs their own number, or the household shares one account and one loyalty balance. **The Round 7 family design already absorbs most of this** — a parent adds a second haircut line to their own ticket rather than the child holding an account — so the common case is covered. The case that is not is two adults sharing a number who each want their own history and points.
     - **Build consequences:** a unique constraint on the phone number; a clear signup error that says the number is already registered (and offers password recovery rather than leaving them stuck); and the same check on the **staff-created minimal account** path (Round 7), which matches on phone and must not create a duplicate.
     - **Recommended:** store and compare numbers in a **normalised form** (country code, no spaces or dashes), or `012-345 6789` and `0123456789` will both be accepted as different numbers and the uniqueness rule quietly does nothing.
   - **Resolved (Round 4) — OTP is delivered by EMAIL, not SMS.** This is an explicit change of direction from Round 3's assumption. Consequences: no per-message SMS cost on the signup path, no telco dependency — but email deliverability (spam folders, delays) becomes the risk on the most conversion-sensitive step in the product, since signup sits at the end of the booking flow.
   - **Resolved (Round 4) — OTP is used ONCE, at account creation only.** Returning clients log in normally (password / SSO); they are never re-OTP'd on subsequent visits.
   - There is no unverified self-signup path. Verified signup is the system's primary anti-abuse control — it is what makes bulk fake accounts (and therefore fake ratings) expensive, now that review moderation has been designed out of the product.
   - **Resolved (Round 5) — Google/Gmail sign-up STAYS in scope, alongside the four-field email form.** There are therefore two signup paths, and they collect different things:
     - **Email form path:** email + phone + full name + password, verified by **email OTP**.
     - **Google SSO path:** **name and email are taken from Google** (the client does not retype them, and the Google-supplied name is used as the account's name), **no password is set at all** (the account exists with only the linked Google identity), and the **phone number is asked for afterward** — a post-SSO completion step, since Google does not supply it.
     - Consequence: SSO substitutes for the email OTP (Google has already verified the address), so the OTP step is skipped on that path — consistent with the Round 3 rule that account creation requires "OTP verification **or** SSO".
     - Implementation note: the phone-number completion step sits between the Google callback and the booking submit, so it joins slot/service/barber selections as state that must survive the SSO round-trip (see Registration Gate Placement). A Google account with no phone number yet is not usable for a booking, because the phone number is the counter's lookup key.

**2. Anonymous visitor (not a user type — an unauthenticated browsing state)**
   - Anyone who scans the QR can **browse without entering anything**: the Outlet's live queue, operating hours, address/map, contact info, and **who the barbers are**.
   - They hold no queue ticket, no booking, no points, and cannot review. The moment they want to transact, they must register.

### Client Account Management (Round 5)

How a client account is recovered, edited, and deleted. All of this was previously unspecified.

**Forgotten password**
- **Resolved (Round 5) — standard "reset password by email" link.** The client enters their email, receives a reset link, and sets a new password. No SMS path, no support-mediated reset.
- Google-SSO accounts have no local password, so this flow does not apply to them — they recover by signing in with Google again.
- **✅ Resolved (Round 6) — in Phase 1 the account is genuinely lost if the client loses their email.** Meikigo relies **solely on email** for recovery; there is no support-mediated recovery, and a client who can no longer reach their signup mailbox cannot get back in — their loyalty balance included.
- **Planned for later (Round 6):** once Meikigo is generating revenue, an **SMS provider** will be added and **two-step verification** enabled, which is what will make phone-based account recovery possible. Explicitly a post-launch, cost-justified addition.
- Practical mitigations worth building now, since they cost little and prevent the worst version of this: show the client their **registered email on screen** (masked) wherever they might need it, and make the login screen's "wrong email?" path explain plainly that the account cannot be recovered without it — better than a dead end the client discovers only after losing points.

**Changing phone number**
- ~~**Resolved (Round 5)** — the new number is verified by an OTP sent to that new number (SMS)~~ — **⚠️ SUPERSEDED (Round 7).**
- **✅ Resolved (Round 7) — a client can change their phone number, and the change is verified by an OTP sent BY EMAIL. There is no SMS provider in Phase 1 at all.**
  - **The mechanic is explicit:** the client receives a **6-digit code by email**, and copies/pastes it into the app to confirm the new number.
  - Note what this does and does not prove: an email OTP confirms the **account owner authorised the change**, but it does **not** prove the new number belongs to them (a typo'd number still verifies). That is an accepted trade-off in Phase 1 — the control that matters is stopping someone else changing the number, and email does that. Verification *of the number itself* arrives with SMS in Phase 2.
  - Recommended small safeguard, since the number is the counter's lookup key: **notify the old number's owner is impossible without SMS, so notify the email instead** — the change confirmation email should state the old and new numbers so a mistake is visible.
- **The account keeps everything through the change — loyalty balances, transaction history, point history, redemption history.** Changing the number is an edit, not a new identity; nothing is reset or re-earned.
- ⚠️ **This reintroduces SMS into the product.** Round 4 deliberately moved signup OTP off SMS and onto email specifically to avoid a telco dependency and per-message cost. A phone-change OTP puts that dependency back — for a much lower-volume, non-conversion-critical action, but it still means an SMS provider must be procured, configured, and paid for. Worth deciding explicitly whether that cost is accepted for this one flow (see To Be Determined).
- Operational consequence: because the phone number is the cashier's lookup key and the "I have a booking" recovery key, a change must propagate to the client's **active** queue ticket / booking (the ticket denormalises the phone number — see Queue Data), not just to the account row.

**Changing email**
- **✅ Resolved (Round 6) — a client can change their email, and the change is verified by OTP to the NEW address**, per standard industry practice.
- Implementation notes that matter because email is the account's root of trust in Phase 1:
  - The **new address must be verified before it becomes the login** — hold the change pending until the OTP is confirmed, otherwise a typo locks the client out permanently (there is no recovery path in Phase 1).
  - **Notify the OLD address** that the email was changed. This is the only warning a client gets if someone else has taken over their session, and it costs one email.
  - Uniqueness still applies — the new address cannot already belong to another account.
  - Google-SSO accounts: the email comes from Google, so changing it in Meikigo alone would break the SSO link. Recommend blocking the edit for SSO-only accounts, or requiring a password to be set first.

**Deleting an account**
- **Resolved (Round 5) — a "delete my account" option DOES exist for customers.** This is the client-side counterpart to the merchant-side "never purge" policy, and it is what gives Meikigo a PDPA deletion-on-request path.
- **Resolved (Round 5) — past transactions are KEPT, and they keep the customer's name, email and phone number.** Personal data is **not** stripped or anonymised on the transaction record; the financial record survives intact as a financial record.
- Practical reading of the two rules together: deleting an account removes the client's ability to log in, hold a balance, and be looked up as a customer — it does **not** erase the personal data already embedded in completed sales.
- ⚠️ **Flagged, not blocking:** "delete my account, but we keep your name, email and phone on every past sale" is a partial deletion, and a customer who asks for erasure under PDPA will not have been fully erased. The usual reconciliation is that tax/accounting law requires the transaction record to be retained (LHDN generally expects 7 years), which *does* justify keeping it — but that justification needs to be stated in the privacy notice, and it should be time-bounded rather than indefinite. See Language & Legal Text for how Round 6 constrained that wording.

**Unspent loyalty points on deletion — ✅ CONFIRMED (Round 13)**

**Recorded as given: *"The points are forfeited. Loyalty is tied to an account, and there is no account left to hold it."*** The Round 6 recommendation is now a decision, and the "pending your OK" qualifier is removed. **Forfeit the points at deletion, but record the forfeiture rather than silently zeroing it.** Specifically:
- **The balance is forfeited.** There is no account left to hold it, loyalty is account-based by design (Round 2), and the alternative — parking an orphaned balance keyed to a phone number — would quietly reintroduce the guest-loyalty model that was deliberately removed.
- **Write a forfeiture record to the loyalty ledger** (client, scope/Brand, points forfeited, timestamp, reason = account deleted). Three reasons this matters: the merchant's outstanding point liability is being written off, so it should be visible rather than vanishing from the books; support needs to be able to explain what happened months later; and it keeps the ledger's balance history internally consistent.
- **Warn the client before they confirm.** The deletion dialog should state the actual number — *"You have 240 points. Deleting your account will permanently lose them."* This is standard practice and it is the difference between an informed choice and a complaint. A client who is close to a free cut will often choose to redeem first, which is the better outcome for both sides.
- **Report forfeited points separately from redeemed points** in merchant reporting, so redemption-rate figures aren't polluted by write-offs.
- Deliberately *not* recommended: restoring points if the same person registers again later. Once forfeited, they are gone — anything else means keeping a shadow balance against a deleted person, which is exactly what deletion is supposed to stop.

### Registration Gate Placement (client side)
- **Resolved — registration is deliberately asked LAST, not first.** The signup prompt must sit at the **end** of the booking flow, not at its entrance. The client browses freely, taps "Book", **selects their time slot, selects their service(s), picks a barber** — and only at the point of **final submit** is registration required.
- Rationale (merchant's, recorded as-is): the client has already invested effort in the flow by that point, which is the industry-standard pattern for maximising signup conversion. Front-loading the signup wall loses people who would otherwise have booked.
- Implication for implementation: the entire pre-submit selection state (slot, services, barber) must survive the registration/social-login round-trip and be replayed into the submit — the client must not have to re-pick anything after signing up.

### Merchant-Side Staff (`UserAccount` entity, backs meikigo-pos-native)
- Fields: **email, fullname only.** No phone number, no password field — password lives entirely in Keycloak.
- `UserAccount` in Postgres is a mirror for foreign-key relationships; Keycloak is the single source of truth for credentials.
- Add `iscreator` (boolean) to `UserAccount` to flag which account originally created the Brand.
- Relationship: **Brand (One) → UserAccount (Many)**.
- **Resolved (Round 5) — the account-login cap is effectively a DEVICE cap, because one account may only be signed in on one device at a time.** *(This closes the item left blank in Rounds 3 and 4.)*
  - **One account = one device, for security reasons.** An account cannot be signed in on three tablets simultaneously. A shop that wants 3 tablets on the counter needs 3 account logins, which means STARTER (2 logins) supports 2 concurrent tablets and PLUS (4 logins) supports 4 — before add-ons.
  - Implementation: the API/Keycloak session must be **single-session per account** — signing in on a second device invalidates (or refuses) the first. Which of the two behaviours applies is a UX call worth settling early: *evict the old session* is friendlier for a shop swapping tablets, *refuse the new one* is safer but strands staff on a dead tablet. Recommended: evict, and show the displaced device a clear "signed in elsewhere" screen.
  - Because there is **no auto-lock** (see POS Device Session below), the single-session rule is doing real security work here — it is what stops one shared credential from being spread across devices.
- **Resolved (Round 5) — a Cashier account is scoped to one BRAND, not to one Outlet.** The same Cashier account may therefore work at two Outlets of the same Brand on different days, but never across Brands. This matches the existing schema (`UserAccount` has a Brand FK, and Brand → UserAccount is 1:Many).
  - ⚠️ **Implementation consequence for `getOutletFromJWT()`:** Outlet context can no longer be derived purely from a Brand-scoped `UserAccount`, since a Brand-scoped account may legitimately be at any of its Brand's Outlets. Outlet must be resolved from the **device's session/login context** — i.e. the Outlet is selected at (or bound to) login, and carried in the session — rather than inferred from the account alone. The `Employee` → Outlet linkage still holds for staff who *have* an Employee record, but it cannot be the only resolution path.
- **⚠️ Revised (Round 7) — there are now THREE merchant-side roles per Outlet: Admin, Cashier, and READ-ONLY.** The read-only account exists to drive the **in-shop queue display** on a screen in the premises (see In-Shop Queue Display). It is a display credential, not a person: it can view the running-number screen and nothing else — no sales, no customer data, no refunds.
  - This supersedes "only two merchant-side roles exist". Round 7 also **reconfirmed that barbers still have no account of any kind** — the roles are Admin, Cashier and read-only display, and that is the complete list.
  - **✅ Resolved (Round 8) — the read-only display account does NOT count against the plan's account-login cap, and it is NOT available on FREE.** STARTER's 2 logins stay 2 real staff logins plus a display; FREE gets no display at all. The merchant's reasoning for the FREE exclusion, recorded as given: *"free is meant for solo or hypersmall (1 person) barber with no physical shop"* — a merchant with no premises has no wall to hang a screen on, so the feature has no meaning there.
  - Implementation consequence: the display credential is a **separate object from the paid login quota** — one read-only display account per Outlet, provisioned automatically for STARTER and above, never counted, never purchasable as an add-on. It is a screen, not a member of staff.
  - **⛔ A fourth role — outlet-scoped MANAGER — was proposed in Round 18 and DECLINED.** The shape offered: approves refunds and stock, sees only their own outlet's sales, handles the queue and staff hours, but never sees payroll, salaries, profit or brand-wide figures. **Recorded as given:** *"B"* — Admin and Cashier stay the only two staffing roles (plus the read-only display credential above). ⚠️ **The consequence is named plainly because it is the reason a Manager role was offered in the first place:** on a multi-outlet Brand, the only way to let someone on-site approve a refund or a stock adjustment is to make them a full Admin — and a full Admin sees every other outlet's payroll, every barber's salary, and the Brand's profit, not just their own outlet's. The alternative, until the owner is reachable for every override, is that a Cashier at a branch genuinely cannot get a refund approved. That tension is accepted rather than solved.
- ~~**Only two merchant-side roles exist: Admin and Cashier.**~~ The `BARBER` role is deprecated — barbers/stylists do not get their own login or account; they are represented purely as an `Employee` record (see Employee section) that staff (Admin/Cashier) manage, not a role that logs in.
- `UserRoleConstant.BARBER` should be removed/deprecated from the codebase.

### Registration Flow
- `meikigo-marketing-site` will present **two register buttons**: "Register as Merchant" and "Register as User".
  - Register as Merchant → existing `/account/register` flow, creates `merchant-admin`. This step collects **only email + password** for a fast signup — no Organisation/Brand/Outlet/subscription details are collected here.
  - Register as User (customer) → **new endpoint**, separate from the merchant flow, creates a customer account for `meikigo-customer-webapp`.
- **Resolved:** after a successful merchant registration, the merchant is redirected to the `meikigo-merchant` **login** page — not auto-logged-in. They authenticate there (via Keycloak) and then configure Organisation, Brand, Outlet(s), subscription/billing, and Employees entirely inside `meikigo-merchant`.
- Employees (Admin/Cashier) are never self-registered from the marketing site — they log in directly on `meikigo-pos-native`, provisioned by the merchant. **Resolved — provisioning flow is invitation-link based, same mechanism as Organisation Members:** the Brand/Outlet admin uses that Brand's own "Add Staff" setup inside `meikigo-merchant` to select a role and generate a shareable invitation link; the invitee accepts it, which triggers `meikigo-merchant` → `meikigo-api` → Keycloak provisioning (creates the Keycloak user, mirrored into `UserAccount`). This is a separate, Brand/Outlet-scoped invite flow, distinct from the Organisation-level Organisation Member invite (see Staff Invitation Flow below).
- **Resolved — Cashier cannot log into `meikigo-merchant`.** The `Cashier` `UserAccount` role is strictly a `meikigo-pos-native` login — it has no access to the merchant back-office. Only `Admin`-role `UserAccount`s (and the Brand-owner/`iscreator` account from marketing-site registration) can authenticate into `meikigo-merchant`.
- **Resolved — `meikigo-marketing-site` needs no Keycloak client of its own.** Its registration endpoints (both "Register as Merchant" and "Register as User") are public, unauthenticated signups — no Keycloak token is involved at this step. This is why `meikigo-marketing-site/.env.example` has no `AUTH_KEYCLOAK_*` vars; that's intentional, not a gap.
- **Resolved — no abandoned-setup nudges:** if a merchant registers on `meikigo-marketing-site` but never finishes Organisation/Brand/Outlet setup inside `meikigo-merchant`, no reminder (email or in-app) is sent — the account simply sits dormant until the merchant returns on their own.
- **Resolved — onboarding checklist is skippable:** `meikigo-merchant` presents an onboarding checklist/tutorial guiding the merchant through setup, but the merchant can skip it and navigate freely — it is guidance, not a forced wizard gate. Skipping lands the merchant on the main `meikigo-merchant` **dashboard** (not a blank page and not a specific setup section flagged for later).
- **Resolved — correcting a mistaken Brand:** there is no Brand-delete flow for onboarding mistakes (e.g. a typo'd Brand name); the merchant corrects it by editing the Brand record, not deleting/recreating it.

### Staff Invitation Flow
- Only the `iscreator` account creates the Organisation itself — Organisation creation is not delegable.
- **Naming decision (resolves Q15 — "staff" used for two different populations):** this document now uses **"Organisation Member"** for the Organisation-scoped population invited via the link below, and reserves **"Employee"** / **"Outlet staff"** for the Brand/Outlet-scoped `Employee` + Admin/Cashier `UserAccount` records. Product UI and codebase naming should follow the same split (e.g. "Organisation Member" vs. "Employee") so the two differently-capped populations are never confused with each other.
- **Resolved — invitation link is Organisation-scoped only, not a Brand/Outlet mechanism:** the invitation link only provisions **Organisation Members**. It is a different setup entirely from Brand/Outlet staffing — each Brand/Outlet has its own, separate **"Add Staff"** flow for creating `Employee` records and Admin/Cashier `UserAccount` logins (see Business Flow step 7 below), which (see Round 3 below) is itself also an invitation-link-based flow, just scoped to that one Brand/Outlet instead of the whole Organisation.
- **Resolved — invitation flow mechanics:** inside `meikigo-merchant`, the `iscreator` clicks **"Create Staff"**, **selects the role/privilege level** for that invite, then generates a **shareable invitation link**. The role and access level are entirely **pre-determined by the `iscreator`** at generation time — the invitee does not choose or request their own role, they simply accept the link as-is.
- **Resolved — privilege levels are freeform, not a fixed list:** the `iscreator` is not choosing from a small fixed set of preset tiers — they can define **custom, named roles with a configurable permission checklist** per invite. "Organisation-level admin" (able to change any Brand's plan) is simply one example of a privilege level an `iscreator` can construct this way — not a further, separate tier layered on top of "Organisation Member."
- **Resolved — one-time use, with configurable expiry:** each invitation link is **single-use** (not a general reusable link) **and time-limited** — it expires after a duration configured in hours (`applicationsetting`-driven) if left unaccepted. The `iscreator` generates a new link per invitee, up to the 10-Organisation-Member cap.
- **Resolved — pending invites are revocable:** the `iscreator` can cancel/revoke an invitation link that has been generated but not yet accepted (e.g. sent to the wrong email).
- **Resolved (Round 4) — a pending (unaccepted) invitation DOES consume one of the 10 Organisation Member slots.** The slot is held from the moment the link is generated, and is only freed by the invite being revoked or by the member later being removed. This is why revocation matters operationally: a batch of unaccepted invites will exhaust the cap.
- **Resolved — Organisation Member management delegation:** an Organisation Member holding "Organisation-level admin" (or equivalent) privilege can also invite and remove **other** Organisation Members — this is not permanently restricted to the `iscreator` account. The one exception: **no Organisation Member, regardless of privilege, can remove the `iscreator`.**
- **Resolved — "Organisation Member" is a distinct population from "Outlet staff," so the caps do not conflict:**
  - **Outlet staff** = the `Employee` records (`BARBER` + `STAFF` types) and Brand-scoped `UserAccount` Admin/Cashier logins already documented in the Subscription Tiers table — these are operational roles scoped to a specific Outlet/Brand, and their headcount is **subscription-plan-driven** (e.g. PRO allows 15 barbers + 9 staff + unlimited logins).
  - **Organisation Member** = accounts invited via this Organisation-level invitation link. This population is **hardcoded to a flat cap of 10 total, independent of subscription plan** — it does not scale with STARTER/PLUS/PRO.
  - **Resolved — the `iscreator` is not counted against the cap:** the 10-slot limit applies only to invited Organisation Members, separate from/on top of the creator.
- **Resolved — removal frees the cap:** removing/offboarding an Organisation Member immediately frees a slot against the 10-member cap.
- **Resolved — enterprise quote is submitted self-service, fulfilled manually:** once a merchant hits the 10-Organisation-Member cap, `meikigo-merchant` exposes an in-app "Contact Us for enterprise pricing" trigger for *submitting* the request — but after submission, the merchant stays hard-capped at 10 and must **wait for Meikigo to complete the custom enterprise setup manually** (raising the cap is not instant/automatic on submission).
- **Resolved — Organisation Members get Organisation-wide administrative access, same as the owner:** once accepted, an Organisation Member is expected to have the **same administrative reach as the Organisation owner (`iscreator`)** — i.e. they can view/manage **all** Brands and Outlets under the Organisation (e.g. create new Brands, create new Outlets), not just a single Brand. This is granted automatically on acceptance — there is no separate per-Brand assignment step for this administrative capacity. (This refines, and does not contradict, the "no cross-Brand reuse" rule below — that rule is about the separate *operational/Outlet-login* layer, not this administrative layer.)
- **Resolved — administrative access ≠ operational Outlet login (no cross-Brand reuse at the operational layer):** the Organisation-wide administrative access above does **not** include an operational, Outlet-level POS login. To actually work a specific Outlet (e.g. as an Employee/Cashier taking payments, or to be tied to a specific Outlet's `Employee` record), a **separate account** must still be provisioned via that Brand's own "Add Staff" flow — every Brand needs its own separate operational staff assignment, even for someone who is already an Organisation Member.
- **Resolved — same person needs separate accounts for separate access levels:** even for one individual, Organisation-level administrative access and Brand/Outlet-level operational access are always **distinct accounts/logins**, never merged into one. Example: if the Organisation owner also wants to personally work an Outlet as Cashier, they need **two accounts** — one for Organisation administration (add Brands/Outlets, manage Organisation Members, etc.) and a separate one for Outlet-level operation (via that Brand's Add Staff flow).
- **Resolved (Round 4) — email addresses must be unique per account.** The same email cannot back two different logins, so a person holding both an Organisation-admin account and an Outlet-operational account needs **two distinct email addresses**. This aligns with Keycloak's default expectation of unique emails per realm.
  - Practical note for onboarding docs/UI: this needs to be stated plainly at invite time, since an owner trying to add themselves as Cashier with their existing email will otherwise hit a confusing rejection. Sub-addressing (`name+pos@domain.com`) is the usual workaround and is worth suggesting explicitly in the UI copy.
- **Resolved — `iscreator` is automatically Admin on every Brand:** unlike other Organisation Members, the `iscreator` does not need any explicit per-Brand Admin assignment — their single account is automatically granted Admin access on every Brand under their Organisation.
- **Resolved — Organisation Member ≠ `UserAccount`/`Employee`:** accepting an Organisation-level invitation does **not** itself create a `UserAccount` or `Employee` row. It is a distinct, Organisation-scoped entity (see Data Storage Requirements below); Brand/Outlet-level `Employee`/`UserAccount` records are provisioned separately, per-Brand/Outlet, through that Brand's own "Add Staff" setup.

### JWT / Session Context
- The JWT should carry **only the user's id** — nothing else.
- `getBrandFromJWTToken()`: takes the user id from the token, looks up the `UserAccount`, and resolves its Brand (via the Brand 1—Many UserAccount relationship).
- `getOutletFromJWT()`: new helper (mirrors `getBrandFromJWTToken`) needed so a logged-in cashier/admin session on `meikigo-pos-native` knows which Outlet's queue/products it's operating against. **Revised (Round 5):** since a Cashier account is Brand-scoped and may work at more than one Outlet of that Brand, the Outlet cannot be resolved from the account alone — it must come from the **session/device context established at login** (Outlet selected or bound at sign-in), with the `Employee` → Outlet linkage as the fallback for staff who hold an Employee record. The JWT itself still carries only the user id; the Outlet binding lives in the server-side session, not in the token.

### Merchant Back-Office Authentication (Round 7)
- **✅ Resolved (Round 7) — authentication is delegated to Keycloak.** Two-factor authentication and password policy are **Keycloak realm configuration**, not product features to be specified or built in application code.
- **✅ Resolved (Round 9) — 2FA policy differs by account type.** Recorded as given: *"Enforce 2FA."* In practice, `meikigo-admin` and the POS cashier flow keep enforcement, while **Merchant Admin 2FA is optional at launch (Round 23)** and can be made mandatory later.
- What that means concretely, per account type:
  - **Merchant Admin (`meikigo-merchant`) — optional at launch (Round 23).** It is available but not forced at signup. Merchants can enable it; for those who enable it, enforce OTP enrolment at first login (required-action in Keycloak).
  - **Meikigo staff (`meikigo-admin`) — enforced, without question.** This tool has full CRUD across every table and reason-gated access to every customer's personal data. It should have been the first account on the list.
  - **⚠️ Cashier on the POS tablet — this is where enforcement needs a deliberate decision rather than a blanket yes.** A cashier signs in on a shared counter tablet, potentially several times a shift after a force-sign-out or device switch. Requiring a phone-based code on every one of those sign-ins is real friction at the counter with a queue waiting, and the predictable outcome is one authenticator app on one phone kept behind the till — which is worse than no 2FA, because it *looks* like a control while being a shared credential.
    - **Recommended way to honour "enforce 2FA" without that outcome: enforce it at ENROLMENT and on NEW DEVICES, not on every sign-in.** The cashier account has 2FA mandatory and cannot exist without it; the tablet is then a **trusted device** with a long-lived session, so the code is demanded when a new device is bound, when the session is force-signed-out by an Admin, and periodically — not between customers. Keycloak supports this shape.
    - The existing counter controls remain and are the ones doing the day-to-day work: the **acting Admin's approval password** for discounts, refunds and stock approvals (Round 12), single-device sessions, and Admin force-sign-out.
  - **Read-only display account — exempt, and it must be.** It drives a screen on a wall that nobody logs into, sees no personal data, and can perform no action. A 2FA prompt on a queue display is an unattended screen that stops working the first time its session expires. Bind it to the device with a long-lived token instead.
  - *These three refinements are recommendations under a clear instruction, not a reopening of it — say the word if you want literal per-login 2FA on the POS too.*
- **Password policy:** a sane minimum length with common-password rejection, and **no forced expiry** — rotation mandates mostly produce passwords written on the counter, which is the opposite of the goal on a shared-tablet shop floor. (Unchanged from Round 7; Round 9 answered 2FA, not expiry.)
- **Practical note: account recovery matters more once a merchant enables 2FA.** A merchant who loses the phone holding their authenticator is locked out of their own revenue data, and there is no SMS channel in Phase 1. Keycloak recovery codes should be issued at enrolment and the merchant told to keep them, with `meikigo-admin` able to reset a locked-out merchant's 2FA as the backstop — itself an audited, reason-gated action.
- Note this is a **realm-configuration decision, not a code change** — worth capturing in the Keycloak setup runbook so it survives the local→prod database promotion (see Environment & Deployment Mapping).

### ⭐⭐ Meikigo support access — a HIDDEN BUILT-IN ACCOUNT per Brand and per Outlet (Round 17)
**Recorded as given:** *"Every brand and outlet created, system will automatically create an account for meiki-go admin to login. For example, new outlet of brand Abu Barber created. It will have 1 hidden account that invisible to merchant. So meikigo-admin can login with that account to help to configure. All the password when the account been created is a same. But we can change to password as we login."*

**The problem it solves is real and nothing in the document covered it.** A merchant says *"my payroll total looks wrong"*. Support cannot see what the merchant sees — `meikigo-admin` shows database tables, not the merchant's screens — so the answer today is screenshots or a Google Meet. This gives support the merchant's own screens, and the ability to fix the setting rather than describe the fix down a phone line.

**What is built**
- **On Brand creation and on Outlet creation, the system provisions one extra `UserAccount`** with Admin-equivalent rights scoped to that Brand or Outlet.
- **It is invisible to the merchant** — absent from the staff list, the login count, the audit-log actor filter, and every screen the merchant can reach.
- **⭐ It does NOT consume a login seat and is never billed.** Logins are capped per plan and sold as an add-on; a hidden account eating one would charge a merchant for Meikigo's own support tool and would make the count on their billing page wrong.
- **The merchant cannot delete or disable it**, since they cannot see it.
- **Write access, deliberately** — *"to help to configure"* is the stated purpose, and a read-only account would not serve it.
- **Existing Brands and Outlets get theirs by a one-off backfill**, not only new ones.

**✅ CONFIRMED AS LITERALLY STATED (Round 18) — one shared password across every hidden support account, platform-wide.**
> *"B" — "Keep one shared password, exactly as you said. Everyone who needs it knows it."*

This was put back to the merchant plainly, with the mechanism-only alternative (a unique generated credential per account, revealed by a reason-gated, time-limited action in `meikigo-admin`) offered at no cost to the one-click convenience the merchant wanted. **The answer is B, not the recommended (a).** It is being built as specified: one password, set at account creation, shared across every hidden Brand and Outlet account on the platform, changeable only by whoever is logged in at the time.

**The risk stays exactly as recorded, because the decision does not remove it — it accepts it.** A single shared password is one leaked credential away from every merchant's data at once. It ends up in a WhatsApp message, in a handover document, and with the next person who leaves; it cannot be rotated shop-by-shop; and no session can be attributed to a specific staff member from the password alone — only from whatever the session itself logs (see Attribution below, which is unaffected by this and still names the acting agent). **This is recorded as an accepted risk, not an oversight**, in the same way the doc records every other declined recommendation.

**⚠️ The second thing this creates, and it needs a deliberate answer: it is a route AROUND the PDPA reason-gate.** Round 8 requires a recorded reason before any Meikigo staff member sees a customer's personal data in `meikigo-admin` — *no exceptions, no role exempt*. `meikigo-merchant` requires no reason, and correctly so, because there the shop is looking at its own customers (Round 9). **A Meikigo agent signed in as the shop is therefore inside the app where the gate does not apply**, and can read every customer's name, phone and history with nothing recorded but a login.
- **The control that closes it: the SESSION is the gated act.** Requesting support access requires the reason, the reason is logged, the session is time-limited, and **the whole session appears on the monthly access report (Rounds 10 and 11)** beside the PII-unmask rows. The gate moves from the record to the door, which is the right place when the door opens onto everything.
- **⚠️ Round 18's shared-password decision means this gate is now a PROCESS control, not a technical one, and that has to be said plainly rather than left implicit.** The gated "get support access" action was written assuming the credential itself only exists once requested and logged. With one standing shared password, an agent who already knows it can sign in directly without ever touching that action — nothing technical stops them. **The reason-logging requirement therefore has to be enforced as a rule Meikigo staff are trained and required to follow** (log the reason before opening a session, every time), backed by whatever the session itself can still record automatically (timestamp, which Brand/Outlet, duration) — but the reason field itself is only as reliable as the discipline of the person using a password everyone already has. Worth a line in the internal support runbook, not a build item.
- **Recommended on top: customer PII stays masked inside a support session** unless the agent unmasks it, which is a second logged act. A payroll total or a set of opening hours can be fixed without ever seeing a customer's phone number, and most tickets need nothing more.

**Attribution — ✅ CONFIRMED (Round 18): the merchant IS told what Meikigo changed**
**Recorded as given:** *"A"* — every change made by Meikigo support is stamped **"Meikigo Support"**, visible to the owner in their own PRO audit log, plus a short email: *"Meikigo support helped with your account on 3 March."*

- **Every action in a support session is stamped as Meikigo Support in the audit trail**, never as the merchant's own Admin. An owner who finds their commission rate changed on Tuesday can now learn that support did it, rather than concluding their cashier did.
- **On PRO, where a merchant-visible audit log exists (Round 13), those rows are shown to the merchant.** This is a **confirmed departure from Round 15**, which kept Meikigo's access log internal — Round 18 draws the line at **reading** versus **changing**: an agent reading a record stays an internal control matter (Round 15's internal-only stance is unchanged for that), while an agent **editing the merchant's configuration** is now something the merchant is entitled to see, on PRO's audit log.
- **A short email to the Brand admin is sent for every support session that makes a change** — *"Meikigo support helped with your account on 3 March"* — regardless of tier, since the audit-log visibility is PRO-only but the notice email is not. One email, and it is the difference between a support tool and a back door.
- **⛔ The account must never take a payment, process a refund, or finalise a payroll run.** Support fixes configuration; it does not move a merchant's money. A hidden account that can refund is a hidden account that can steal.
- **The merchant terms must disclose that Meikigo support can access the account for support purposes.** Undisclosed access to a customer's system is a PDPA and a contractual problem however well it is logged — one sentence in the terms (see *Owed by me*).

**Practical detail**
- **One hidden account per Outlet, plus one per Brand.** The Brand-level one reaches brand-scoped settings (subscription, catalogue, statutory rates on a `BRANCH` brand); the Outlet-level ones reach outlet settings. That mirrors exactly where settings actually live (Round 11).
- **2FA:** `meikigo-admin` is already behind enforced 2FA (Round 9), so the gate is at the point the credential is issued. A short-lived, reason-gated credential issued from that session does not need a second factor on the merchant app; a long-lived one would.

### Terms of Service Acceptance
- `AccountResponse.acceptTermsOfService` is currently captured but never persisted — **this needs to be fixed.** Persist a ToS acceptance record (timestamp + version accepted) for audit/compliance purposes.

### Open Question
- Whether `MERCHANT_EMPLOYEE` and `BARBER` were meant to be the same role is now moot — `BARBER` as a login-bearing role is deprecated entirely (see above).

---

## Business Flow

### Merchant Onboarding
1. Merchant goes to `meikigo-marketing-site`, clicks "Register as Merchant", and registers with **email + password only**
2. On success, merchant is redirected to the `meikigo-merchant` login page and authenticates (Keycloak)
3. Inside `meikigo-merchant`, merchant provides Organisation (SSM) details (self-attested, no external SSM validation) and creates a Brand — this Organisation is 1:1 with the merchant account (see Hierarchy Rules above); any further Brand created later attaches to this same Organisation, skipping Organisation/SSM entry again
4. Brand is automatically subscribed to `FREETRIAL` on creation — 2-week free trial (configurable in `applicationsetting` table), same length for all Brands
5. **Resolved — no hard checkout gate before Outlet setup:** the merchant can set up Outlet(s) immediately under `FREETRIAL` without first selecting a paid tier/completing HitPay checkout. The subscription tier (Free / Starter / Plus / Pro) + HitPay checkout step is only forced as a blocking paywall once the FREETRIAL period ends — at that point the merchant must actively choose a plan (including re-choosing PLUS, which mirrors FREETRIAL's caps) to keep operating read-write — see Subscription Tiers below
6. Merchant sets up Outlet(s) under the Brand, up to the plan's outlet cap — inside `meikigo-merchant`. **Resolved — sequencing is not strict:** Brand creation does not need to be fully finalized/saved before Outlet setup can begin — the merchant is not forced through a rigid "Brand complete → then Outlet" gate; partial Outlet info can be entered while the Brand record is still being completed. **Resolved — minimum viable Brand:** the Brand's QR code / `meikigo-customer-webapp` entry point is considered "live" once the merchant has set up **at least 1 Outlet, 1 Employee, and 1 Admin/Cashier login** — the 1 Employee can be either `BARBER` or `STAFF` type (whichever the Brand/Outlet admin chooses to set up first; it is not hard-restricted to `BARBER`). **Resolved — enforcement is advisory, not blocking:** this minimum is not hard-enforced — the QR code/customer-webapp entry point exists regardless; a Brand with zero Outlets/Employees/logins still has a live QR, it just shows an empty queue / no staff available until the merchant finishes setup. **Resolved — Outlet field scope:** only core fields (code, address, business hours) are required to create an Outlet; timezone, country, transaction tax rules, and queue grace/expiration overrides can be configured later in Outlet settings since they don't block day-to-day operation. **Resolved — default tax/timezone before configuration:** there is no Meikigo-imposed default — tax rules are entirely country-/merchant-specific, so an Outlet has no tax applied until the admin explicitly configures it (Meikigo intentionally does not prescribe a default, since tax regimes differ by country); timezone likewise has no Organisation-level or system-wide default, and it is governed by **browser/device local time** at setup, while the Outlet's own configured business hours (not timezone) govern its actual operating window. **⭐ ✅ CONFIRMED, NOT A FALLBACK (Round 18) — this was checked plainly (a merchant setting up while on holiday could set their queue to reset at 8am London time) and kept deliberately rather than fixed to Malaysia.** **Recorded as given:** *"keep it simple. local internet time. because meikigo will not only avail in Malaysia. it will be worldwide."* A single hardcoded `UTC+8` would need undoing the day the first non-Malaysian shop signs up, so browser/device local time at setup stays the mechanism — a real per-Outlet setting rather than an inferred platform constant, editable afterward in Outlet settings. ⚠️ **The accepted quirk stays exactly as flagged:** a merchant setting up while travelling gets whatever clock their device was on at that moment, and lives with it (or corrects it in settings) rather than the system silently getting it "right" for them
7. Merchant configures employees (barbers) as `Employee` records per Outlet, and creates Admin/Cashier `UserAccount` logins for staff who need `meikigo-pos-native` access — inside `meikigo-merchant`, via that Brand/Outlet's own **"Add Staff"** setup. **Resolved — this is also an invitation-link flow:** the Brand/Outlet admin selects a role and generates a single-use invitation link (same mechanism as the Organisation invite, just scoped to that Brand/Outlet); accepting it triggers `meikigo-merchant` → `meikigo-api` → Keycloak provisioning. This Brand/Outlet-level provisioning is separate from Organisation Member invitations. **Resolved — Organisation-level provisioning mechanism:** separately, the `iscreator` (or an Organisation Member with delegated privilege) can invite **Organisation Members** (Org-scoped, capped at 10 excluding the creator, self-service-submitted but manually-fulfilled enterprise quote beyond that) via a one-time, expiring invitation link with a role pre-selected by the inviter — see Staff Invitation Flow above. An Organisation Member automatically gets Organisation-wide administrative visibility across all Brands/Outlets, but still needs a **separate** account via a Brand's own Add Staff flow to hold any operational Outlet-level login

### ⭐⭐ First-run setup WIZARD — ✅ NEW REQUIREMENT (Round 16)
**Recorded as given:** *"A, with a step by step wizard. The wizard must present what meikigo are capable of and what the merchant can do with it. It's like an introduction to the system but the wizard must be engaging and fun, not corporate boring tutorial."*

**The problem it solves.** A brand-new merchant logs into `meikigo-merchant` and finds nothing: no services, no barbers, no products, an empty queue and a QR code that leads to an empty shop. Nothing tells them what to do first, and nothing shows them what the product can even do. That first screen is where a trial is won or lost, and until Round 16 the answer was a Google Meet for PRO merchants and silence for everyone else.

**What it is: a step-by-step wizard, on every plan, that both SETS THE SHOP UP and INTRODUCES THE PRODUCT.** Those are two jobs and the merchant asked for both — *"present what meikigo are capable of and what the merchant can do with it"*. A checklist alone does the first job only.

**The steps, in the order that gets a shop trading fastest**

| Step | What the merchant does | Why it is in this position |
|---|---|---|
| 1 | **Outlet details** — name, address, business hours | Everything downstream needs an Outlet; hours drive the queue and bookings |
| 2 | **Services and prices** — with four typical barbershop suggestions ready to accept | The single biggest drop-off point. **✅ The suggested defaults are confirmed (Round 17: *"A"*): Haircut RM25, Beard trim RM15, Hair wash RM10, Kids cut RM18** — editable, and they turn a blank form into two taps |
| 3 | **Barbers** — name, photo optional | Choosing a barber is compulsory for customers (Round 6), so a shop with no barber has no bookable anything |
| 4 | **One staff login** — the cashier who will use the POS | The minimum viable Brand needs one login (see Merchant Onboarding above) |
| 5 | **Print the QR code** | The moment the shop becomes real to its customers |
| 6 | **Take a practice sale** — ⭐ **marked as practice and excluded from everything (Round 17)** | Confidence, and it proves the POS works before a live customer is standing there |

- **The existing "minimum viable Brand" rule is what the wizard is really driving at** — 1 Outlet, 1 Employee, 1 login (Merchant Onboarding, step 6). The wizard makes that rule visible instead of implicit.
- **Bulk import (Round 14) belongs at step 2 and 3** as an alternative to typing — *"already have a list? upload it"* — which is also the tool a PRO onboarding call now guides them through.

**⭐ The practice sale must never touch a money report — ✅ Resolved (Round 17)**
**Recorded as given: *"A"*.** A practice sale is a real sale in the database, so without this rule the shop's very first "sale" on day one would be fake — appearing in the day close, the tax export, the barber's commission and the accountant's file.

- **It is flagged `is_practice` at creation**, and **excluded from every figure without exception**: sales totals and the dashboard, the day close and expected cash, the tax document export, e-Invoice, commission, tips, loyalty points, stock movements, and the customer's history.
- **⭐ It must NOT consume a receipt number.** Receipt numbers are gapless and never reused (Round 11B) — a practice sale burning `000001` puts a hole in the series on the shop's first day, which is exactly the thing an auditor asks about. Practice sales get their own display reference, clearly marked.
- **It cannot take a real payment.** No card is charged, HitPay is never called, and the drawer is untouched.
- **✅ Resolved (Round 26) — practice sale is CASH ONLY.** The POS must not offer DuitNow or card on a practice ticket. It is never sent to HitPay, and it never appears in the Z-report, tips, loyalty, or commission (same exclusions as Round 17).
- **The POS shows plainly that it is practice** — a banner on the screen and the word *PRACTICE* on the printed receipt, so nobody hands one to a customer.
- **⚠️ It is deleted after 24 hours, and this is the ONE deliberate hard delete in the product.** Everything else soft-deletes with an audit trail, and this exception is recorded as such rather than left to look like an inconsistency: a practice sale is not a financial record, it never was one, and leaving it in the database is how it eventually leaks into a report somebody writes later. A scheduled job removes them.
- **A merchant can run the practice sale more than once** without consequence, which is the point of it existing.

**"Engaging and fun, not corporate boring" — what that means in practice, since it was asked for explicitly**

- **Show, don't lecture.** Each step opens with one line about what it unlocks — *"Add your services and customers can book online tonight"* — not a paragraph of instructions.
- **Progress that feels like progress:** a visible 1-of-6, a tick that lands, and a short closing screen when the shop goes live. Small and satisfying beats a percentage bar.
- **Real numbers, not lorem ipsum.** Pre-filled suggestions the merchant edits are faster and friendlier than empty fields, and they teach the format at the same time.
- **Plain shop language, no product jargon.** *"Your team"*, not *"Employee entities"*. **No Meikigo internal vocabulary anywhere in it** — a barber does not care what a Brand is.
- **Short.** Six steps, each finishable in under a minute. **Recommended: nothing in the wizard that is not needed to trade** — tax settings, loyalty rules, commission rates and payroll all wait for the settings screens.
- ⚠️ **Somebody has to write this copy, and it is not developer work.** Six screens of friendly, confident Malaysian-English microcopy is a small writing job that decides whether the tone lands. It also gets translated first when Bahasa Malaysia arrives.

**Rules that keep it from becoming annoying**

- **Skippable and resumable.** A merchant may dismiss it and come back; progress is remembered, and an unfinished wizard reappears as a small banner rather than a blocking modal. **Never a wall between the merchant and the product they have paid for.**
- **It disappears for good once the shop has taken its first real sale** — that is the honest definition of "set up", better than counting completed steps.
- **One wizard per Brand, not per Outlet.** A second Outlet gets the ordinary "add outlet" flow, not the introduction again.
- **Every plan gets it, including `FREE`** — a solo barber needs it most, and gating the thing that gets people started would be self-defeating.
- **PRO's guided session (Round 13) runs alongside it**, not instead of it: the named contact walks them through this same wizard on a screen-share, which is exactly what Round 13's answer described.
- **Recommended: measure completion.** Step-by-step drop-off is the most useful product metric Meikigo will have in its first year, and it costs one event per step. If everyone stops at step 2, the services screen is the problem — and you would otherwise never know.

### ⭐ In-app HELP PAGES — ✅ NEW REQUIREMENT (Round 17)
**Recorded as given:** *"Build a small help page inside meikigo-merchant: 15–20 short articles with pictures, covering the things people actually get stuck on"*

**The problem.** Support is Monday to Saturday, 9am to 6pm (Round 15). At 9pm on a Sunday a merchant with a question has nowhere to go — and they are standing in a shop with customers in it.

- **Where it lives:** inside `meikigo-merchant`, reachable from every screen, not a separate website. **Searchable**, and grouped into a handful of sections.
- **15–20 short articles with pictures.** Short is the requirement, not a style preference: a merchant reads these standing at a counter.
- **The articles, drawn from what people actually get stuck on** — this list is a recommendation and the right people to correct it are whoever answers the first month of tickets:
  1. Add a service and set its price · 2. Add a barber, their hours and their off-days · 3. Add a staff login, and what each role can do · 4. Print and place your QR code · 5. Take your first sale · 6. Refund or void a sale · 7. Apply a discount · 8. Close the day and count the cash · 9. ⭐ Record an expense, and take cash out of the till · 10. Receive stock and fix a wrong count · 11. Set up loyalty points · 12. Import your customer list · 13. Send an email blast, and what the allowance means · 14. Run payroll and send payslips (PRO) · 15. Read your dashboard · 16. Change your plan, add an outlet, add a barber · 17. Set your tax details · 18. What happens when a customer does not turn up · 19. Change your opening hours without breaking bookings · 20. Contact support, and what the response times mean
- **Every article carries pictures of the actual screen**, which is what makes them usable and also what makes them go stale. ⚠️ **Recommended: name an owner for the help content and re-shoot the screenshots each time a screen changes materially.** Wrong screenshots are worse than none — they make a merchant think they are on the wrong page.
- **Contextual entry beats a help centre.** A *"how does this work?"* link on the day-close screen that opens the day-close article is worth more than a well-organised index nobody opens.
- **It also cuts the tickets the one support person receives during the week**, which is the second reason it was asked for.
- **English only at launch** (Round 15), and it is one of the first things translated when Bahasa Malaysia arrives.
- **⚠️ This is a writing job, not developer work** — the same point as the wizard copy, and the same person should do both so the voice matches.
- **Recommended: put the support hours and the ticket route at the top of the help home page.** A merchant who cannot find the answer should not also have to hunt for how to ask.
- **Recommended: log which articles are searched for and found nothing.** It is a free list of what to write next, and of which screens are confusing.

### Client Barber Service Flow
1. Client opens `meikigo-customer-webapp` by scanning that **Outlet's own QR code** — **this is not a discovery marketplace**; the customer already knows which shop they're visiting, there is no "find nearby merchant" search
2. Client lands **directly on that Outlet's booking page** — no Outlet picker, no Brand-level landing hop (every Outlet has its own distinct QR, so a mis-picked branch is structurally impossible)
3. Client browses **without logging in or entering anything**: live running queue, operating hours, address/map, contact info, and the Outlet's barbers
4. Client taps **"Book Now"** (or **"I have a booking"** to recover an existing ticket's live status)
5. Select time slot (for a booking) — bookings are offered only after the walk-in queue's projected clear time, and only where the barber's daily capacity allows
6. Select product/service(s) — **mandatory**; a single queue ticket can carry multiple services
7. Select which barber they want — **mandatory as of Round 6; "no preference" no longer exists** (and with per-barber pricing, the barber choice is what fixes the price). Where several services are chosen, a barber is selected **per service line**
8. **Register / log in — this is where the signup gate sits, at the very end of the flow, immediately before submit.** Email + password, or Google/Gmail via Keycloak. All selections made in steps 5–7 carry through the signup and into the submit
9. Submit → client receives their queue number / confirmed booking
10. When queue number approaches, client goes to the outlet — client watches for this by **pull-to-refresh on the queue page**; no push/SMS/email alert is sent
11. Service delivery at barber
12. Client goes to cashier
13. **Cashier pulls up the ticket by phone number, username, or email**, and **confirms/amends the final service list** (clients frequently add on services mid-cut, so the ticket's selection is provisional until this point)
14. Cashier processes payment via `meikigo-pos-native` (tablet POS at the counter), applying any loyalty redemption
15. Client pays using preferred method
16. Transaction auto-reflects in merchant accounting module
17. Client reviews **the Outlet and, separately, their barber** immediately after payment, from the still-open booking tab in their browser (see Reviews & Ratings)

---

## Customer Webapp (`meikigo-customer-webapp`)

All items in this section were resolved in Round 1 of the queue-flow follow-ups.

### Platform & Delivery
- **Plain mobile web app, opened in the phone's browser.** Not an installable PWA for launch, and not a native app — a standard mobile-responsive website is sufficient for this phase.
- **Single language is sufficient for the current phase** — no multi-language (BM / English / Chinese) support required at launch.
- **No on-device notification capability** — no push notifications, no SMS alerts. The customer-facing surface is web-app-only, and the client is expected to keep the queue page open and **pull-to-refresh** to see their position.

### Outbound Email (revised in Round 3)
> **⚠️ The blanket "no outbound alerts at all" rule from Round 1 is narrowed.** Transactional **email** does exist. What does not exist is push, SMS, and any queue-position/"you're next"/expiry alerting.

- **Email IS sent for:**
  1. **Signup OTP** — account creation is verified by an emailed one-time code (Round 4 changed this from SMS to email). Used once, at creation only. Not sent on the Google-SSO path.
  2. **Receipts** — the client may send their transaction receipt to their email (receipt only; it carries no review link, see Reviews).
  3. **Barber-unavailable disruption** — when a barber with existing bookings is marked unavailable, affected clients are emailed automatically, with a link to cancel the booking (see Barber Scheduling & Availability).
  4. **Password reset (Round 5)** — the standard reset link, the only account-recovery channel (see Client Account Management).
  5. **Booking cancelled by the merchant (Round 5)** — when an Admin cancels a booking (e.g. the barber resigned), the client is notified with the Admin's **compulsory cancellation reason** (see Employee Offboarding).
  6. **Outlet closing (Round 5)** — when an Outlet is closed/deactivated, every client holding a booking or live ticket there is emailed that the Outlet is closing and their booking has been cancelled (see Outlet Closure & Deactivation).
- **Email is NOT sent for:** queue position/approaching-turn alerts, queue expiry warnings, no-shows, or anything else. Queue status remains pull-to-refresh only.
- **⚠️ Revised (Round 6) — "no marketing" is superseded.** Merchants can now send **marketing blasts** to their own consenting customers, sold as a paid add-on (see Customer Management & Marketing). Two things follow: **marketing consent must be captured at signup**, and marketing mail should be sent on a **separate sending domain/provider from transactional mail**, so a promo blast's spam complaints cannot damage OTP deliverability on the critical signup path.
  7. **Booking reminder (Round 7)** — an email reminder before a booked slot. This is the **first proactive, scheduled email in the product** (everything else is triggered by an action), so it needs a scheduler. See Booking Reminders.
- ~~**Resolved (Round 5) — SMS now exists, for exactly one purpose: the OTP verifying a client's NEW phone number**~~ — **⚠️ SUPERSEDED (Round 7): there is NO SMS anywhere in Phase 1.** The phone-change OTP is delivered **by email** instead (see Client Account Management). The "no SMS" rule therefore stands unbroken for the whole of Phase 1; an SMS provider is a post-revenue addition (which is also what will later enable phone-based account recovery and two-step verification).
- **Resolved (Round 5) — clients also get IN-APP notifications, which is a new surface.** The Round 5 answers on merchant-cancelled bookings and Outlet closure both specify informing the client "through email **and** notification". Since the customer webapp has no push capability, this means an **in-app notification list/inbox** inside `meikigo-customer-webapp`, visible to a logged-in client — not an OS-level push. It carries merchant-initiated disruptions (booking cancelled, Outlet closing) only; queue status is still pull-to-refresh and still never notified.
- **Resolved (Round 4) — the disruption email's link requires login.** Clicking it opens the app and asks the client to authenticate before they can cancel (Round 5 removed reschedule — see Client Self-Service on Bookings); it is **not** a token that acts directly without login. The extra friction was chosen deliberately over the risk of anyone with access to the mailbox cancelling a booking.
- Operational consequence: email is now on the **critical path of account creation**, not just a convenience. Deliverability (spam placement, delay) directly costs signups at the last step of the booking flow, so transactional email needs a real sending setup (authenticated domain, SPF/DKIM/DMARC, a reputable provider) rather than best-effort sending.

### Email Sending Infrastructure (Round 9) — specified under delegation

**Round 9 delegated this to me.** Recorded as given: *"we do not have any provider in mind, and need your recommendation. ultimately the goal is to use a good reliable and cheap option"*. What follows is therefore a specification, not a question — with the single exception of the **domain name**, which only Meikigo can supply.

#### ✅ Round 10 — sending is over SMTP, configured in the application
**Recorded as given:** *"We will setup email configuration SMTP on the app."*

- **What this settles:** Meikigo sends over **SMTP with the connection details held as application configuration**, rather than being wired to one provider's proprietary API. Sensible, and consistent with Round 9's position that numbers and settings belong in admin configuration rather than in code — the provider can be swapped by editing settings instead of shipping a release.
- **What this does NOT change, and this is the important part:** SMTP is a *transport*, not a provider. Something still has to run the mail server on the other end of that SMTP connection. So every recommendation below still applies — the provider choice, the two separated streams, the authenticated domain, SPF/DKIM/DMARC. **SMTP is how Meikigo connects; it is not a substitute for deciding who sends.** Both providers recommended below offer SMTP endpoints alongside their APIs, so this decision costs nothing.
- **What it does cost, stated once:** an API integration gives per-message delivery status back immediately; plain SMTP gives you an accepted-or-rejected handshake and little else. That matters here because **"did the customer's OTP actually arrive?"** is the support question this product will get most, and there is no SMS fallback. **Recommended mitigation: still consume the provider's bounce/complaint webhooks** even though sending goes over SMTP. Both providers offer them independently of how mail is submitted, and without them there is no suppression list and no way to answer that question.
- ✅ **RESOLVED (Round 11) — ONE platform-wide SMTP account, owned by Meikigo.** Not per-merchant. Every email the product sends — every shop's OTP, receipt, booking reminder and payslip — goes out through Meikigo's own account. Merchants configure nothing and hold no credentials.
  - The per-merchant alternative was put with its failure modes and declined: a merchant who mistypes a password silently kills their own customers' OTPs and then calls Meikigo, who cannot fix it because they do not hold the credential; and most small shops would supply a consumer Gmail account, which throttles bulk sending and would stop booking reminders within a few dozen messages.
  - **⚠️ Consequence to keep in view, and it got sharper in Rounds 14–15:** sending reputation is shared platform-wide, there is no content review (Round 10 removed templates), and **three of the four mechanical protections are now gone or weakened** — the weekly cap was removed (Round 14), automatic complaint-based suspension was declined and a daily send limit was declined (Round 15), and consent may now be *declared* by the merchant for imported customers (Round 14). What remains: **separate sending subdomains** (kept, and now the strongest control), the **paid monthly allowance** as the volume throttle, and **a warning in `meikigo-admin` that a human acts on**. See Marketing blasts → What is protecting deliverability now — and note that the effective backstop has become **Brevo's own abuse enforcement**, which acts on Meikigo's whole account rather than on one Brand.
  - **If a merchant ever asks to send from their own domain**, that is a Phase 2 feature and it is done by verifying *their* domain (DKIM CNAMEs on their DNS) under Meikigo's provider account — **not** by asking them to type an SMTP username and password into a settings box.
- ✅ **RESOLVED (Round 11) — the sending domain is `meikigo.com`, already owned by Meikigo.** This unblocks everything downstream: provider account, DNS records, subdomains and Keycloak's SMTP settings. See Domain and DNS setup below.

#### ⭐⭐ ✅ Round 15 — THE PROVIDER IS BREVO
**Recorded in passing while answering the marketing price — *"Because we will be using brevo. The brevo pricing based on month"* — but it is a first-time decision, and it closes the item open since Round 9** (*"we do not have any provider in mind, and need your recommendation"*). It also explains the shape of the marketing packages: Brevo charges by monthly volume, so Meikigo sells monthly volume.

- **Why it is a defensible choice:** monthly volume pricing, **both marketing campaigns and transactional sending in one account**, an **SMTP relay as well as an API** (so the Round 10 "SMTP configured in the app" decision still holds unchanged), bounce and complaint webhooks, and a free tier for development.
- **✅ BOTH STREAMS GO THROUGH BREVO — Resolved (Round 16).** Recorded as given: *"A"*. Marketing **and** transactional mail both send through Brevo, kept **strictly separate**: marketing from **`news.meikigo.com`**, transactional (OTP, receipts, reminders, payslips, reports) from **`mail.meikigo.com`**, with **separate sending identities and separate API keys**.
  - **What the separation must actually deliver:** independent domain authentication (SPF/DKIM/DMARC per subdomain), independent reputation, and no shared suppression behaviour — a customer who unsubscribes from a shop's promos must still receive their OTP.
  - **The keys must be separate, not just the domains.** One leaked or misused key should not be able to send from the other stream, and revoking the marketing key in a hurry must not stop OTPs.
  - ⚠️ **The risk this accepts, recorded once:** one vendor now carries **everything**. A Brevo outage or account-level suspension stops marketing *and* signup OTPs, receipts and payslips at the same time. That was the trade made knowingly for one bill and one integration.
    - **Recommended, and cheap: keep a second SMTP configuration ready but unused** for the transactional stream only — the Round 11 settings screen already stores SMTP credentials, so a fallback is a settings change rather than a build. Given there is no SMS fallback anywhere in Phase 1, OTP delivery has no other safety net at all.
- **⚠️ Check the resale margin against Brevo's current price list before publishing the packages.** Meikigo's cost is Brevo's plan for the **total** monthly volume of every merchant **plus all transactional mail**; the revenue is the sum of the packages sold. Provider prices change often enough that I will not quote them from memory — the check to run is *(all sold allowances + expected transactional volume) → required Brevo plan → its cost → margin*. The **RM170-for-50K** tier is the one to scrutinise: per email it is roughly a third of the RM90-for-10K tier, which is a steep discount to commit to before any real volume exists.
- **⚠️ Meikigo now carries an aggregate commitment.** One 500K package plus five 100K packages commits a million emails a month. **Recommended: a figure in `meikigo-admin` showing total allowance sold against the current Brevo plan ceiling**, because the failure mode is Meikigo's own account hitting its cap and stopping *everything*, transactional included.
- **⚠️ Brevo's own abuse policy is now the real backstop.** Round 15 declined automatic per-Brand suspension, so the first hard stop on a merchant sending bad mail is Brevo acting against **Meikigo's** account — which is blunt, immediate, and would take every shop's OTPs down with it. That is the strongest argument for the pushed warning and the one-click manual suspend described under Marketing blasts.
- **Practical setup notes:** authenticate both subdomains (SPF, DKIM, DMARC), keep the **suppression list** fed from Brevo's bounce/complaint webhooks, and consider a **dedicated IP** only once volume justifies it — a dedicated IP with low volume has worse deliverability than a well-run shared pool, not better.

#### ✅ Round 11 — the SMTP settings screen (Mendix Email Connector pattern)
**Recorded as given:** *"we will be having email configuration where we need to login our smtp email account inside our app. You can refer Mendix email connector module."*

So the SMTP credentials are **entered and stored through a screen in the product**, the way Mendix's Email Connector works — not baked into a deployment file. What this means concretely:

- **Where it lives: `meikigo-admin` platform settings**, not merchant settings. There is exactly one account (see above), so it is a Meikigo-staff screen. Only the highest-privileged Meikigo admin role may open or edit it.
- **What the screen holds**, per stream (transactional and marketing are configured **separately**, because they are two accounts on two subdomains): host, port, encryption (TLS/STARTTLS), username, password, `From` name, `From` address, `Reply-To`.
- **⚠️ The password is a stored secret and must be treated as one:** encrypted at rest with a key that does not live in the database, **write-only in the UI** (masked, never rendered back to the screen, never returned by any API response), and **every change written to the audit log** with who did it and when. A plaintext SMTP password readable from an admin screen is a mailbox takeover waiting to happen.
- **A "send test email" button** on the screen, writing its result to the email log. Without it, a wrong password is discovered by a customer failing to sign up.
- **Config change must take effect without a redeploy** — that is the entire point of putting it in the app — so the sending interface reads the current settings rather than caching them at boot.
- **⚠️ Keycloak is the exception and it must not be forgotten.** Keycloak holds its own SMTP configuration in its own realm settings and cannot read this screen. It has to be pointed at the same account and the same subdomain **by hand**, and it will not update itself when this screen changes. Worth writing into the runbook next to the screen itself.
- Everything else below still applies unchanged. **SMTP is a transport, not a provider** — a provider account, an authenticated domain and SPF/DKIM/DMARC are all still required behind it.

Framing worth stating once, because it drives every choice below: with **no SMS anywhere in Phase 1**, email is not a notification channel — it is an **authentication dependency**. A signup OTP that lands in spam does not degrade the experience, it ends the booking flow at its final step. So "cheap" is the second requirement and deliverability is the first; fortunately at this volume the reliable options are also inexpensive.

#### Two streams, always separated
This is the highest-value decision and it is non-negotiable regardless of provider:

| | **Transactional stream** | **Marketing stream** |
|---|---|---|
| **Carries** | Signup OTP, phone/email-change OTP, password reset, receipts, booking reminders, disruption notices | Merchant marketing blasts (Round 6/7 paid add-on) |
| **Sending subdomain** | e.g. `mail.<domain>` | e.g. `news.<domain>` — **a different subdomain** |
| **Consent needed** | No — the user asked for it or transacted | Yes — the unticked signup checkbox (Round 6) |
| **Unsubscribe link** | **Never** (an OTP with an unsubscribe link is how people opt out of being able to log in) | **Always**, and honoured immediately |
| **Reputation risk** | Must be protected at all costs | Generates complaints by nature |

The reason for the split, in one sentence: **spam complaints attach to the sending domain's reputation**, so if a merchant's promo blast earns complaints on the same domain that sends OTPs, signups break platform-wide. Round 7 approved *unmoderated* blasts, which makes this structural rather than precautionary.

#### Recommended providers
Two providers, one per stream. Prices below are indicative and change — **verify current rates before committing**, and note that non-USD billing plus FX is a real (small) cost line.

- **Transactional — recommended: Resend.** Free tier around 3,000 emails/month (~100/day) which covers the entire pilot, then roughly USD $20/month for ~50,000. It is built on Amazon SES underneath, so deliverability is SES-grade, but with a modern API, straightforward domain verification, and per-message logs a developer can actually read. For a team this size that last point matters more than it sounds: when a merchant says "my customer never got the code", somebody has to answer that in minutes.
  - **Alternative if OTP deliverability is judged paramount: Postmark** (~USD $15/month for 10,000). It is the strongest transactional-only reputation in the market and enforces separate message streams by design. It costs more per message and refuses bulk marketing outright — which is a feature here, not a limitation.
  - **Not recommended as the starting point: raw Amazon SES.** It is by far the cheapest (about USD $0.10 per 1,000) and is the right destination once volume is real, but it hands you reputation management, sandbox exit, bounce/complaint plumbing and no usable log UI. Resend gets SES economics without that operational load; migrating later is a contained change if sending is kept behind one internal interface (see below).
- **Marketing — recommended: Brevo (formerly Sendinblue).** Free tier around 300 emails/day, paid tiers from roughly USD $9/month. The reason to use a marketing platform rather than the transactional API is that blasts need things the transactional stream must never have: a campaign composer, list management, unsubscribe handling, bounce suppression and complaint-rate reporting. Round 7's per-Brand complaint monitoring and auto-suspension are far cheaper to implement on top of a platform that already measures complaints than on raw SMTP.

**Indicative volume, to show the cost is not a concern:** at 50 active outlets averaging 30 tickets/day, with receipts requested on roughly a third of sales, plus signup OTPs and booking reminders, transactional volume lands in the region of **20,000–25,000 emails/month**. That sits inside a single ~$20/month plan. Email is not going to be a meaningful line item until Meikigo is many hundreds of outlets — so **do not optimise this for price at the expense of deliverability.**

#### Domain and DNS setup
- ✅ **RESOLVED (Round 11) — the domain is `meikigo.com`, and Meikigo already owns it.** Recorded as given: *"meikigo.com, yes we own it."* Nothing here is blocked any longer.
  - **Transactional subdomain: `mail.meikigo.com`.** Carries OTP, password reset, receipts, booking reminders, disruption notices and payslips.
  - **Marketing subdomain: `news.meikigo.com`.** Carries merchant blasts only.
  - Both must be created and verified with the provider before the first real signup, and the DMARC rollout below starts the day they are created — not the week before launch.
- **Never send bulk or automated mail from the root domain.** Keep the root for human/corporate mail so that a reputation problem in either automated stream cannot contaminate it.
- **Required DNS on each sending subdomain:** SPF, **DKIM at 2048-bit**, and a DMARC record. Set DMARC to `p=none` with aggregate reporting (`rua=`) first, read the reports for a couple of weeks to confirm nothing legitimate is failing alignment, then tighten to `p=quarantine` and finally `p=reject`. Going straight to `p=reject` before the reports are clean is the classic way to silently kill your own OTPs.
- **Keep the `From` name stable and recognisable** per stream (e.g. *Meikigo* for transactional; the **Brand's own name** for marketing, since the customer's relationship is with the barbershop, not the platform).
- **Warm up gradually.** Both providers handle shared-IP warmup for you at this volume; the thing to avoid is a first-day marketing blast to an entire imported list, which looks exactly like spam to every receiver.

#### What the application must build around it
- **One internal sending interface in `meikigo-api`** — every email goes through it, SMTP connection details behind it as configuration (Round 10). This is what makes a later provider change an admin edit rather than a hunt through the codebase.
- **An email log table**, queryable by support: recipient, template, stream, provider message ID, status (queued/sent/delivered/bounced/complained), timestamp. **With no SMS fallback, "did the code actually send?" is the single most likely support question in the product** and it must be answerable without reading provider dashboards.
- **Bounce and complaint webhooks consumed**, feeding a **suppression list** — never keep sending to a hard-bounced address, and treat a complaint as an immediate marketing opt-out.
- **⚠️ Keycloak sends mail too.** Authentication is delegated to Keycloak (Round 7), which means password-reset and any verification mail originates there, not from `meikigo-api`. **Keycloak's SMTP settings must point at the same transactional provider and the same sending subdomain**, or those messages will fail alignment and land in spam while the rest of the product's mail arrives fine. This is an easy thing to miss until a merchant cannot reset their password.
- **OTP hygiene, since it is the critical path:** short code TTL (5–10 minutes), a resend cooldown, a cap on attempts per address and per IP, and a clear on-screen "check spam, or resend in Ns" state. Round 9's fallback for a customer whose inbox is genuinely broken remains the **staff-created minimal account** at the counter (Round 7).
- **Per-Brand complaint-rate monitoring with auto-suspension** on the marketing stream (Round 7) — the mitigation that substitutes for content moderation, which the merchant explicitly declined.

### What the Webapp Does and Does Not Do
- **Scope: queue-joining, queue-viewing, browsing the shop's products, and reviewing only.** No payment ever happens inside the customer webapp — *all* payment happens on `meikigo-pos-native` at the cashier.
- Consequently, **group/split payment is driven entirely from the cashier's POS tablet**, with zero customer-webapp involvement — group members do not each open the webapp on their own device to pay their share.
- **Loyalty redemption is not client-initiated in the webapp.** The cashier applies redemption at the POS by entering the client's phone number.
- **⭐ ✅ Product browsing added, look-only (Round 18).** **Recorded as given:** *"A"* — the shop's products (pomade, wax, shampoo) are shown on the Outlet's page with price and a photo, so a customer waiting for a cut can see the shop sells them and ask at the counter. **Explicitly NOT built: adding a product to a booking, a cart, or any online purchase path** — that was offered as option (c) and not taken. The data already exists (stock is tracked and priced for the counter), so this is a read-only view onto it, not a new commerce surface.

### QR Code → Entry Point
- **Resolved (Round 2) — every Outlet has its own distinct QR code**, and scanning it lands the customer **straight on that Outlet's booking page**. There is no Brand-level landing page with an Outlet picker, so the "customer in Kepong accidentally joins the Damansara queue" failure mode cannot occur.

### Public (Unauthenticated) Browsing
- **Resolved — a visitor can see the following with no login and without entering anything at all:**
  - The live queue
  - Operating hours
  - Contact info
  - Address / map
  - **The Outlet's barbers** (who is working there)
  - **⭐ The Outlet's products, with price and photo (Round 18)** — see What the Webapp Does and Does Not Do. Browse-only, no login needed, same as the rest of this list
- **Resolved — the public queue display shows the queue NUMBER ONLY.** No customer name, no partial phone number, no selected barber, no selected service. Anything beyond the number and its status is not exposed to an unauthenticated viewer.
- The service catalog is encountered inside the booking flow (where service selection is mandatory) rather than being required as standalone landing-page content. **The product catalogue is the exception (Round 18) — it is standalone landing-page content**, since a customer only browses it, never selects from it as part of a flow.

### Where the Login Wall Sits
- **Everything transactional is behind registration** (queue number, booking, loyalty, review) — but the wall itself is placed at the **end** of the flow, immediately before submit. See Registration Gate Placement under Client User Types.

### Session Recovery ("I have a booking")
- The queue page presents two entry points: **"Book Now"** and **"I have a booking"**.
- **Resolved (Round 4) — both recovery paths exist, deliberately.** If a client kills the browser / clears cookies and cache:
  - They can tap **"I have a booking"** and enter their **phone number** to see their live ticket — no login required; **or**
  - They can simply **log in** and see the same thing.
- The lightweight phone lookup is kept because it is the fast path for someone standing in the shop who has lost their session. Accepted trade-off: anyone who knows a client's phone number can look up that client's live ticket. Exposure is bounded by the fact that the public queue shows numbers only — no names — so what leaks is "this phone number holds queue number N here".

### Contactability
- The phone number captured on the client's account is the **merchant's only channel to reach a waiting client** (e.g. to chase a late or expiring ticket) — the merchant calls/messages the client directly, outside the system.

---

## Environment & Deployment Mapping (Merchant Onboarding)

Resolutions to the environment-mapping questions raised while tracing the onboarding flow (`meikigo-marketing-site` → `meikigo-merchant` → `meikigo-api` → Keycloak) across local dev and OCI prod (see `deployment-doc.md`):

- **Resolved — canonical Keycloak realm name is `meikigo`.** `meikigo-merchant/.env.example`'s `KEYCLOAK_ISSUER=http://localhost:8080/realms/barber` is a stale value (pre-rename leftover) and needs to be corrected to `.../realms/meikigo`, matching the prod issuer (`https://${AUTH_DOMAIN}/realms/meikigo`).
- **Resolved — `meikigo-marketing-site` needs no Keycloak client.** See Registration Flow above — registration is a public endpoint, not an authenticated one.
- **Resolved — Keycloak client secrets are per-environment.** The `merchant-portal` client secret (and any admin/service-account client secret used by `meikigo-api`) is a distinct value in each environment's own Keycloak instance — local dev and OCI prod are never expected to share a secret. Each is stored only in that environment's own `.env` (never committed) via its own runbook/setup step.
- **Resolved — Keycloak redirect URIs / web origins are env-driven, not hardcoded.** The `merchant-portal` client's callback base URL should be sourced from an environment variable so that promoting to a new environment (or a custom-domain cutover on Netlify) only requires an env var change, not a manual Keycloak admin-console edit.
- **Resolved — CORS is not a blocker for the onboarding flow.** Because all onboarding calls (marketing-site registration, and every `meikigo-merchant` → `meikigo-api` call) are server-to-server (see BFF pattern below), the browser never calls `meikigo-api` cross-origin during onboarding. `CORS_ALLOWED_ORIGINS` remains relevant only for any endpoints called directly from browser JS elsewhere in the system, not for this flow.
- **Resolved — server-to-server is a BFF (Backend-for-Frontend) pattern.** Every Netlify-hosted frontend (`meikigo-merchant`, `meikigo-marketing-site`, etc.) reaches `meikigo-api` from its own Next.js server side, over the public `${API_DOMAIN}` (through Caddy) — never via the internal Docker network, since Netlify runs outside the OCI VM. This is the same mechanism for HitPay's payment-webhook callback: it calls `meikigo-api` directly at `${API_DOMAIN}`, it does not round-trip through `meikigo-merchant` first. (Resolves the open question previously listed under To Be Determined re: deployment topology for server-to-server calls.)
- **Resolved — local→prod Keycloak promotion mechanism.** Realm/client/role configuration prepared and validated in local dev Keycloak is carried over to the OCI prod Keycloak instance by restoring a Postgres dump of the locally-prepared `meikigo-keycloak` database onto prod — not via realm JSON export/import (which `deployment-doc.md` §9 confirms isn't built) and not via manual re-entry through the admin console.
- **✅ Resolved (Round 22) — `meikigo-pos-native` environment config: template the `.env.example` NOW.** Variables: `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `API_BASE_URL`, and `ENVIRONMENT` (sandbox/production). Values are filled when Keycloak and API are deployed. This unblocks developer setup before the POS app development starts in earnest.
- **✅ Resolved (Round 19) — repo placement:** `HITPAY_*` vars are not yet templated, but the destination is settled: **everything lives in `meikigo-api`, nothing in `meikigo-merchant`.** Platform-level credentials (Meikigo's own master account) are env vars; each Brand's connected-account credentials are encrypted database rows, not env vars, since they're created per-merchant rather than provisioned once. See Payment Gateway → `HITPAY_*` Environment Variables. The exact variable names still need a final check against HitPay's live API reference.

### ⭐ Backups & Data Recovery — ✅ Resolved (Round 17)
**Recorded as given:** *"We as a meikigo, will have daily backup on our managed database. Tell it in the tnc"*

Nothing in this document mentioned backups before Round 17. It is the one gap that could end the business rather than annoy a merchant.

- **✅ A daily automatic backup of the managed database.** Meikigo relies on the managed database provider's own backup facility rather than building one — which is the right call at this size.
- **✅ It is stated in the terms.** The merchant terms carry a plain sentence about daily backups (see *Owed by me*). ⚠️ **Word it as what is done, not as a guarantee.** *"Meikigo takes a daily backup of its database"* is true and safe. *"Your data cannot be lost"* is a promise nobody can keep, and a promise in the terms is enforceable.
- **✅ CLOSED (Round 22) — backup configuration numbers:** **30-day retention**, **PITR enabled**, **monthly test restore**. Round 18 only restated “we backup everyday”; Round 22 set the three numbers. The monthly restore is a recurring human task (see Launch checklist).
- **Configuration (locked):**
  - **Retention:** **30 days**.
  - **Point-in-time recovery:** **enabled**.
  - **Restore test:** restore one backup into a scratch environment **once a month**. ⚠️ An untested backup is not a backup.
- **⚠️ Single-merchant restore is NOT solved by a database backup, and it is the case that will actually happen.** A server dying is rare; *"I deleted my whole price list"* and *"the import went in twice"* are ordinary Tuesdays. Restoring the whole database to fix one shop would throw away every other shop's day.
  - **What already helps, and it is most of the answer:** nothing is hard-deleted. Products, services, employees and outlets deactivate rather than disappear; transactions void; the audit log records who changed what. **Most single-shop mistakes are therefore recoverable inside the app.**
  - **What is left over is the bulk import (Round 14)**, which creates thousands of rows in one action. **✅ CONFIRMED (Round 18) — an import batch is REVERSIBLE: one action undoes everything that batch created.** See Bulk Import for the confirmed shape and the new filename-uniqueness rule that goes with it. Without this, the only fix would have stayed a hand-written SQL script against production, written under pressure, on a live shop's data.
  - **Beyond that it is a manual restore into a scratch copy and a hand-crafted extract by an engineer.** Acceptable at this scale, provided it is a known procedure rather than an improvisation — and it is far more likely to be needed than a full disaster restore.

---

## Queue Management System

### Scope
- Queue is scoped to **Outlet** (the physical location, which is effectively "the merchant" in queue/backend terms) — not Brand, not Organisation. Brand/Organisation are only used for reporting rollups across outlets.
- `{merchantcode}` in the backend queue ID format refers to the **Outlet's** code/ID.

### Queue Number Assignment
- **Display Format:** Sequential number starting at 1000, then +1 (e.g., 1000, 1001, 1002...)
- **Backend Format:** `{outletcode}{date}{sequentialnumber}`
- **Ordering:** Based on app timestamp (first-come-first-served)
- **Scope:** Per Outlet (not per barber)
- **Reset:** Resets daily (midnight) by default. **Resolved — ties to Outlet business hours:** queuing is expected to be active only during the Outlet's configured business hours (not a full 24-hour window); this business-hours-bound behavior is merchant/Outlet configurable, and the default daily reset point is midnight.
- **✅ Reconfirmed (Round 11B) — the daily reset and the per-Outlet scope are both correct.** Yesterday's last ticket being 1050 does not make today's first ticket 1051; today starts again at 1000. Note the existing spec starts each day at **1000 rather than 1**, which is the better choice — a three-digit-plus number looks like a ticket, reads clearly on the wall display, and avoids the awkward first customer of the day holding "number 1". Each Outlet runs its own sequence.
- **Not to be confused with the receipt number**, which is sequential, never resets daily, never repeats, and is an accounting document reference (see Receipt Numbering).

### Queue State
- Model as a formal enum on the Queue entity (consistent with the existing `EnumState`/`EnumSubscriptionStatus` pattern): e.g. `WAITING`, `CALLED`, `IN_SERVICE`, `COMPLETED`, `EXPIRED`, `REQUEUED`, `CANCELLED`.
- **Resolved — `CANCELLED` is a distinct state from `EXPIRED`:** a client voluntarily leaving the queue is not the same event as a no-show (see Cancellation vs. No-Show below), so the two need separate states for penalty/reporting purposes.

### Who Drives the Queue State (Round 3)
- **Resolved — state transitions are driven by staff tapping the POS tablet, not inferred.** The **cashier taps "start" and "done"** on `meikigo-pos-native` for each client, which is what moves a ticket into `IN_SERVICE` and then `COMPLETED`.
- Context that makes this workable: **in practice the cashier and the barber are usually the same person** in a shop of this size, so the person cutting hair is the person holding the tablet. This is why no separate barber device/login is needed and why `meikigo-employee-mobile` stays deprecated.
- Consequence: `BarberStatistic`'s **average processing time is real measured service time** (start-tap → done-tap), not a proxy like called-until-paid.
- Design caution to carry into implementation: since these taps are manual and made by a busy operator, timing data will be imperfect (late taps, forgotten taps). Reports built on average processing time should tolerate missing/implausible durations rather than assume every ticket has clean timestamps.

### Joining the Queue
- **Resolved — a registered account is required to take a queue number or make a booking** (Round 2). Browsing is anonymous; transacting is not. The signup prompt appears at the end of the selection flow, immediately before submit.
- **Resolved — service selection is mandatory to join.** A client cannot take a queue number and decide later; they must pick at least one product/service up front. The selection is **provisional**, though — it is confirmed (and amended) with the cashier at the counter after service, because clients frequently request add-on services mid-cut.
- **Resolved — one ticket can carry multiple services.** A client may select several services (e.g. haircut + shave) in a single queue entry; it is not one ticket per service.
- **⚠️ Resolved (Round 3) — effectively one active ticket, enforced by a swap prompt rather than a hard block.** Because every client is now logged in, the system knows their existing tickets. When a client holding an active queue number tries to take a number at **another Outlet**, they are shown a **popup offering to cancel the previous queue number** — taking the new number means giving up the old one.
  - This settles the churn across rounds: Round 1 said "hard block", Round 2 said "allow unless times collide", Round 3 lands on **"allow, but make the client explicitly release the old ticket first."** No drifting-estimate overlap maths is required.
  - The cancellation is a **voluntary cancellation**, not a no-show — no loyalty penalty applies (see Cancellation vs. No-Show).
  - *(✅ Answered in Round 7: a client holding a walk-in number may ALSO book a future slot — no swap prompt, no cancellation. The swap prompt exists only for two live walk-in tickets at different Outlets. See Booking vs. Online Queue.)*

### Joining Remotely (Round 5)
- **Resolved (Round 5) — joining the walk-in queue from anywhere is intended and fine.** A client may take a queue number while sitting at home 30 minutes away, watch the queue, and time their drive over. This is treated as a **convenience feature, not an abuse vector**.
- **There is no on-site requirement**: no geofence/location check, and no QR-freshness/rotating-token check. Scanning the QR is an entry point, not a proof of presence — and the booking page is reachable by plain URL anyway.
- The controls that already exist are considered sufficient for the failure mode (someone takes number 1005 and never turns up): the **5-minute late grace period**, the **2-hour queue expiry**, and the barber's ability to **manually mark a no-show** (see Queue Late/Absence Handling). Note that an expired walk-in ticket carries **no loyalty penalty**, so a remote joiner who forgets entirely costs the shop a slot at zero cost to themselves — accepted, and consistent with the no-penalty stance on cancellations.

### Estimated Duration (Round 5)
- **Duration is set per service by the merchant** when creating the product (e.g. Haircut = 20 min) — already modelled as `Product.Estimated duration (minutes)`.
- **Resolved (Round 5) — a ticket's estimate is the simple SUM of its selected services.** A ticket carrying haircut + shave + colouring is estimated at haircut + shave + colouring, with no overlap logic, no discount for combined services, and no per-barber adjustment.
- **The merchant's typed number is always the number used** — the system does **not** learn from actual start/done tap timings and does not auto-adjust the estimate. Measured service time is still captured (it feeds `BarberStatistic` average processing time and the dashboards), but it is **reporting only**; it never feeds back into the queue estimate or booking availability.
  - Consequence worth accepting deliberately: if a merchant's typed durations are optimistic, the projected clear time (and therefore the earliest bookable slot) stays optimistic forever, and the shop will keep running late against its own booked slots. The fix is a merchant-facing report — "your average haircut takes 27 min, you have it set to 20" — rather than silent auto-correction. Not built in this phase.
  - *(The merchant selected the "sum" answer and did not select the learning option; if auto-adjustment is wanted later it is an additive change, since the measured data is already being collected.)*
- **✅ Resolved (Round 7) — duration is NOT settable per barber.** One duration per service, for everyone. The merchant's reasoning, recorded as given: the difference between a senior and a junior is *experience*, not a fixed time penalty — and some styles are quick for a junior anyway, so a per-barber duration would be a fiction. (Note this is deliberately asymmetric with **price**, which *is* per-barber — the merchant is pricing experience, not time.)
- **✅ Resolved (Round 7) — a barber who finishes early moves to the next ticket manually, which frees their next slot sooner.** This is the answer to estimate drift: rather than the system predicting per-barber speed, the queue simply **recalculates from reality as each "done" tap lands**.
  - So estimates are **dynamic**: every completion re-projects that barber's line (and therefore their earliest bookable slot) forward or backward. A fast barber's queue visibly speeds up; a slow one's slips.
  - Implementation consequence: the projected clear time must be **computed on read from the current state**, not stored and left stale — and the client's own ticket view should reflect the shift when they refresh.
  - This keeps the Round 5 rule intact (the merchant's typed durations are always the inputs; the system never learns or rewrites them) while still tracking the real day.

### Counter-Created Tickets — the walk-in with no smartphone (Round 6)

> **⚠️ This changes a core data-model rule.** Until Round 6, every queue ticket required a registered client account (`Client ID` non-nullable, "there are no guest tickets"). That made a customer with no smartphone — or a dead battery — impossible to serve through the system at all.

- **✅ Resolved (Round 6) — the barber or cashier can create a ticket at the counter using a MANUAL BOOKING FORM.** A walk-in with no smartphone can still request a service; staff key it in on the POS.
- **The form's fields are deliberately loose: staff may enter whatever is useful for the barber to call the customer out.** A name, a nickname, a description — whatever works in a small shop. There is **no requirement for email, password or even a phone number** on this path.
  - Data-model consequence: **`Queue.Client ID` becomes nullable**, and the ticket carries a **free-text customer label** instead. This does *not* reintroduce the Guest *account* type (dropped in Round 2) — there is still exactly one client account type. What is being added is a ticket that has **no account behind it at all**.
  - Recommended minimum: require *something* in the label field, since a queue of unnamed tickets cannot be called out. One free-text field, mandatory, no format rules.
- **✅ Loyalty: yes, these tickets can earn points (Round 6)** — but only where there is somewhere to put them. Points require an account, so:
  - If the customer gives a **phone number that matches an existing client account**, staff attach the ticket to that account and points accrue normally.
  - If there is **no matching account**, the sale completes with no points — the same position as an unattached manual/outage sale. Nothing to hold a balance.
  - This mirrors the existing manual-entry rule, where attaching the sale to a customer is a deliberate manual step by the Admin.
- **✅ Reviews: lost, and deliberately so (Round 6, recommendation accepted, subject to later review).** The review prompt lives in the *client's own browser tab* after payment, which never exists for a counter-created ticket. **This also closes the Round 4 question about manually-entered outage sales** — same answer, same reason: no alternative review path is built for either case.
  - Worth knowing the consequence for ratings: shops serving a lot of walk-ins this way will collect ratings only from their app-using customers, which skews the public score toward the more digitally-comfortable half of their clientele.
- **✅ Resolved (Round 7) — "highest priority" means PATH priority, not queue position.** The app is the primary way in and the manual form is the fallback, but **a ticket is a ticket: service order stays first-come-first-served** (subject to the per-barber ordering below). A counter-created ticket is never served behind an app ticket that arrived later.

### Staff-Created Bookings — the client who phones the shop (Round 6)
- **✅ Resolved (Round 6) — staff CAN create a booking on behalf of a caller.** Phone bookings are how many regulars actually book, and they were previously impossible (bookings could only be created by the client in the webapp).
- **The caller must have an existing account, identified by their user ID or email**, which staff look up. This is the clean distinction from the walk-in form above:
  - **Counter walk-in ticket** → no account needed, free-text label, immediate/live queue.
  - **Phone booking** → existing account required (user ID or email), future slot.
- Rationale that makes the asymmetry sensible: a booking holds a future slot and needs a way to reach the person if the barber becomes unavailable, so it needs an account behind it; a walk-in is standing in front of you.
- **✅ Resolved (Round 7) — staff CAN create a minimal customer account** at the counter or over the phone (name + phone, no password), which closes the first-time-caller gap. The customer can later claim/complete that account by registering properly with the same details.
  - Implementation notes: such an account is **unverified** (no email OTP has happened), so it should be flagged as staff-created and should not be able to log in until the customer completes registration. It can hold a loyalty balance and be looked up at the counter — which is the point.
  - **✅ Resolved (Round 22) — staff-created accounts carry the `staff_provisioned` flag and have three baseline controls:** (1) they **cannot receive marketing blasts** until claimed; (2) they **cannot be referrers or referees** in the referral program until claimed; (3) creations are **rate-limited to 20 per Outlet per day** to prevent bulk fake-account creation. Claiming = the customer registers with a matching phone number + email OTP.
  - **✅ Resolved (Round 23, marketing consent on claim):** when a staff-provisioned account is claimed, marketing consent is automatically enabled for that customer. They can still withdraw it using the standard unsubscribe link.
  - Recommend matching on **phone number** when the customer later registers, so they inherit their existing visit history and points rather than starting a second account.
- Everything else follows the normal booking rules: slot availability, the barber's daily capacity, the (barber, slot) uniqueness constraint, and the booking horizon all apply exactly as for a self-service booking.

### Barber Assignment

> **⚠️ Rewritten in Round 6 — "no preference" is REMOVED. Choosing a barber is now mandatory.**

- **✅ Resolved (Round 6) — "no preference" should not be available.** Every ticket names a barber. The merchant's rationale, recorded as given: if a customer genuinely has no preference, **the barber or cashier advises them in person** — that is an offline selling conversation and does not need a system feature.
- **This supersedes** the Round 1/Round 2 decisions that "no preference = served by whoever frees up first" with **round-robin auto-assign**.
- Consequences, all of which simplify things:
  - **`Queue.Selected barber` becomes non-nullable** — and, per Round 6's per-line barber decision, is recorded **per service line** (see One Ticket, Multiple Barbers).
  - **Round-robin survives in one place only: disruption reassignment.** When a barber goes unavailable mid-shift, their waiting clients are still redistributed across the remaining available barbers by round-robin (see Staff Rotation & Leave Handling). It is no longer an *assignment mode at join time*.
  - **It resolves the per-barber pricing problem for free.** Because barber choice now always happens before submit, the client always knows their price up front — which is exactly why per-barber pricing (Round 6) is safe to introduce.
  - A barber who is off, on break, or at their daily capacity is simply **not selectable**, so the client picks someone else or does not join. There is no longer any hidden auto-assignment that could push work to a barber the client did not choose.
- Implementation note: a barber becoming unavailable *between* selection and submit is now a real race — the submit must re-validate the chosen barber and return the client cleanly to barber selection, the same way the (barber, slot) race is handled for bookings.

### Cashier ↔ Employee default mapping (Round 23)
- **✅ Resolved (Round 23) — optional link:** a Cashier `UserAccount` may be optionally linked to an `Employee` (barber/staff) record.
- **If linked:** when the cashier creates/opens a ticket, the POS can pre-fill the selected barber to that linked `Employee` for the relevant service line(s).
- **If not linked:** the cashier selects barbers manually per service line (mandatory barber selection rule from Round 6).

### ⭐ Queue Structure — One Line Per BARBER (Round 7)

> **⚠️ This is the structural consequence of removing "no preference". The running number is still issued per Outlet, but SERVICE ORDER is now per barber.**

- **✅ Resolved (Round 7) — a ticket is served in its chosen barber's own line.** Worked example: at 9:00am ticket **1005** chose Ali and **1006** chose Ben; Ali is mid-cut on a long job and Ben is free → **1006 is served before 1005**. A client waiting specifically for Ali is not served by Ben, and does not hold Ben's customers up.
  - So the **display number remains a shop-wide running number** (still `1000, 1001, 1002…` per Outlet, still issued first-come-first-served, still reset daily) — but it **no longer indicates service order**. Two separate concepts: the number identifies the ticket; the barber's line determines when it is served.
  - First-come-first-served still holds **within each barber's line** — Round 7 confirmed the app gives no queue-position advantage over a counter-created ticket.
- **✅ The public display shows each barber's line, but ONLY the "now serving" number for that barber (Round 7).** Not the waiting list. The merchant's explicit reason: customers should not be confronted with a long queue.
  - So the public view is roughly: `Ali — now serving 1005 · Ben — now serving 1006`.
  - Sensible consequence to note: a customer cannot see how many people are ahead of them from the public display alone. Their own **ticket view** (they are logged in, it is their ticket) is where their position and estimated wait belong. Recommend showing the client their own estimate there and nothing about anyone else — which also keeps the existing rule that the public display exposes numbers only, no names.
- **✅ Wait estimates are per barber (Round 7).** A client waiting for Ali is quoted **Ali's** line, not the shop's total. This replaces the earlier whole-queue calculation, which assumed anyone could serve anyone.
  - Same change applies to the **earliest bookable slot**: it is computed from **that barber's** projected clear time, not the whole Outlet's.
- **✅ Booking UI shows AVAILABLE times only (Round 7).** Times when the chosen barber is already booked are **not displayed at all** — not shown greyed out, not shown as "unavailable". The client sees a list of times they can actually take.
  - This is a good default (it removes the "why can't I have 2pm?" question entirely) and it pairs with the per-barber slot generation already specified: business hours − booked slots − breaks/off-days/holidays, bounded by daily capacity.
- **✅ On the POS, a barber sees their own waiting list (Round 7).** Round 5 established that a barber checks the screen between clients; with named tickets they only care about their own line.
  - **Important mechanical note:** Round 7 also confirmed **barbers have no login of their own** (see Merchant-Side Staff — the roles are Admin, Cashier, and read-only display). So "the barber sees their own list" is a **view/filter on the shared POS**, not a per-barber account. The barber walks up to the counter tablet and looks at their own column. Nothing about this requires a barber account.
- **✅ Resolved (Round 7) — holding a walk-in number does NOT block making a future booking.** No swap prompt, no cancellation: a client can hold today's walk-in ticket *and* book a future slot at the same time.
  - This closes the item carried since Round 3, and it is consistent: the Round 3 swap prompt exists to stop a client holding **two live walk-in tickets at different Outlets**, where they cannot physically be in both places. A walk-in today plus a booking next Tuesday is not a conflict.
- **Implementation consequences worth planning for:**
  - The queue must be **queryable per barber** (their line, their now-serving, their projected clear time) as the primary access pattern — the shop-wide list becomes secondary.
  - **Daily capacity** binds per barber's own line, which is now the natural shape rather than an extra rule.
  - A **multi-barber ticket sits in more than one barber's line** at once (see below), so "position in line" is per line, not per ticket.

### One Ticket, Multiple Barbers (Round 6)
- **✅ Resolved (Round 6) — a ticket records a DIFFERENT BARBER PER SERVICE LINE.** A ticket carrying haircut + colouring can have Ali on the haircut and Ben on the colouring, which is how the work is actually split in a real shop.
- **Commission follows each line to the barber who performed it** — not to a single "ticket owner".
- **The receipt shows the performing barber per line**, and **the review/rating goes to the barber who performed that service.**
- **⚠️ This changes the review model, which was 1:1 with one barber.** Until now a review carried one Outlet rating plus one barber rating, and `Review` held a single `Employee ID`. With two barbers on a ticket:
  - The **Outlet rating stays one per Transaction** (1:1, unchanged).
  - The **barber rating becomes one per barber who served on that ticket** — so a two-barber ticket collects two barber ratings, each feeding that barber's own `BarberStatistic`.
  - Rating a barber for work they did not do would be worse than useless — it would corrupt the per-barber averages the customer-facing barber picker depends on.
  - See Reviews & Ratings → Review Target & Cardinality for the revised model.
- Other knock-ons to handle:
  - **Queue state** (`start`/`done` taps) — **⚠️ UPDATED (Round 9): this must now be tracked PER LINE, not per ticket.** The earlier recommendation assumed the work was sequential and one combined start→done would do. Round 9 established that lines run **in parallel and start independently** (the parent goes in while the child still waits), so a single ticket-level state cannot represent it: the ticket would have to be simultaneously "in service" and "waiting". Each service line therefore carries its own `waiting → in service → done` state and its own barber, and the ticket is complete when all its lines are.
    - This also fixes per-barber average service time, which the old ticket-level tap made approximate on any split ticket.
    - The cashier UI should still feel like one ticket — the taps just land on the line whose barber is starting.
  - **Daily capacity** should count against **each** barber who has a line on the ticket, not just one of them — otherwise a shop can quietly exceed a barber's cap by adding them as a second-line barber.
  - **Tips** need an allocation rule when two barbers served — see Tips.

### Booking (fixed time slot) vs. Online Queue (running number)
- **Resolved — bookings are offered only *after* the walk-in queue's projected clear time.** The earliest bookable slot is computed from the current queue: (now) + (sum of estimated durations of everyone still queued).
  - *Example:* it is 9:00am, 4 people are queueing, each estimated at ~20 minutes → the first bookable slot offered is **10:20am**.
- This means booked slots never get inserted *into* the middle of the live walk-in sequence — the booking layer sits behind the walk-in queue rather than competing with it for position.
- **Resolved (Round 2) — a booking never cuts in front of the waiting queue, even when the shop runs late.** If the walk-in queue overruns past a booked slot time (e.g. a 10:20am booking on a shop running 40 minutes behind), the Outlet **finishes the waiting queue first**; the booking is served after, not ahead of, the people already waiting. A booked slot is therefore an "not before this time" guarantee, not a "served at exactly this time" guarantee.

### Booking Horizon
- **Resolved (Round 3) — how far ahead clients can book is merchant-configurable** (per Outlet/Brand setting — e.g. same-day only, 7 days, 30 days). Meikigo does not impose a fixed horizon.
- **Resolved (Round 4) — future-day slot generation confirmed.** The "earliest slot = walk-in queue's projected clear time" rule applies to **today only**. Any future date is derived from **business hours, minus slots already booked, limited by each barber's daily capacity**, and additionally respecting **barber lunch breaks, off-days, and public holidays**.

### Client Self-Service on Bookings
- **Resolved (Round 4) — a logged-in client can cancel their own booking at any time from the app**, provided the cancellation happens **before their booked slot time**.
- **Such a cancellation counts as a voluntary cancellation — no loyalty penalty**, regardless of how close to the slot it is. A client cancelling 20 minutes before their appointment is treated the same as one cancelling three days ahead. (Only *turning up late past the booked slot* is a penalised no-show.)
  - **✅ ⭐ RE-ASKED AND CONFIRMED (Round 17) — there is NO minimum cancellation notice.** Recorded as given: *"Leave it. Any cancellation is free, at any time."* A customer may cancel at 2:50pm for a 3:00pm slot and it is treated exactly like one cancelled three days earlier. A **cancellation notice window** — where cancelling later than a merchant-set number of hours counts as a no-show for penalty purposes — was offered and declined.
  - Worth flagging as a business risk rather than a spec gap: with no late-cancellation penalty, a booked slot can be given up minutes beforehand at zero cost to the client, and that slot is very unlikely to be refilled at that notice. The barber has lost the chair either way, which is the argument for treating it as a no-show — and it was heard and rejected. **This now sits alongside the accepted zero-points no-show gap (Round 16): two known holes in booking discipline, both accepted, and the lever if either becomes a real problem is the same one.**
  - **Recommended, and nearly free: count late cancellations on the customer record**, exactly as Round 16 recommended counting no-shows. Nothing acts on the number; it means a future decision starts from evidence rather than from nothing.
- **⚠️ Resolved (Round 5) — there is NO reschedule feature. A client who wants to move a booking cancels it and books again.** This is the same outcome with more taps, and it was chosen deliberately over building a distinct reschedule action.
  - **This supersedes Round 3's "reschedule becomes a first-class client-facing capability".** Reschedule does not exist anywhere in the product — not in-app, and not via the barber-unavailable email (see Barber Unavailable — Future Bookings, updated).
  - Simplification this buys: no move-a-booking path means no re-validation of barber capacity/slot contention on an existing ticket, and no partial state where a booking is mid-move. Cancel-then-book reuses the ordinary booking path, which already handles the (barber, slot) race safely.
  - Trade-off accepted: the client releases their old slot **before** securing a new one, so a client rescheduling into a busy day can end up with nothing — the old slot may be gone by the time they discover the new one is unavailable. The UI should not pretend otherwise; the cancel confirmation should say plainly that the slot is released immediately.

### Booking Reminders (Round 7)
- **✅ Resolved (Round 7) — a reminder email IS sent before a booked slot.** This is a deliberate, narrow addition to the outbound-email list and does **not** reopen queue notifications: it reminds a client about a booking made possibly weeks earlier, which is a different thing from a "you're next" alert.
- Rationale it serves: a client can book as far ahead as the merchant's booking horizon allows (potentially 30 days) and previously heard nothing in between — while a missed booking is the one event that costs the shop a slot it cannot refill, and the one event that carries a **loyalty penalty**. Reminding people before penalising them is both cheaper and fairer.
- **✅ Resolved (Round 9) — the OUTLET ADMIN configures the lead time, entered in WHOLE HOURS.** Recorded as given: *"Outlet admin can configure this. The value entered must be in hour. For example 48 hour means 2 days before, 24 hours, 1 day before"*
  - Setting lives in **Outlet configuration** (not Brand) — a mall outlet and a neighbourhood shop can reasonably want different lead times. Field: `booking_reminder_lead_hours`, integer.
  - **Hours rather than days is the right unit** and worth keeping even though most merchants will type 24 or 48: it lets a shop send at 4 hours for same-day bookings without a second concept.
  - **Recommended default: 24.** Far enough ahead that the client can still cancel and release the slot, which is the entire point of sending it.
 - **First reminder:** sent at `booking_reminder_lead_hours` whole hours before the slot (configured per Outlet; recommended default 24).
 - **Optional second reminder:** an additional email can be sent **2 hours before** the slot. It is enabled/disabled per Outlet, while the second reminder lead-time is fixed at 2 hours.
  - *Recommended, needs no answer unless you disagree:* treat **0 or empty as "reminders off"** for that Outlet, so a shop can decline the feature without Meikigo needing a separate toggle. Cap the value at the Outlet's booking horizon — a 720-hour lead time on a 7-day horizon can never fire.
- **Email only** — there is no SMS in Phase 1 (Round 7), and the client-facing app has no push. The in-app notification inbox (Round 5) is a sensible second surface for it at no extra cost.
- Implementation note: this is the **first scheduled/proactive email in the product** — everything else is triggered by a user or merchant action. It needs a scheduler (a job that wakes up and sends), plus the obvious guard that a **cancelled booking must not still send its reminder**.

### Children & Family Bookings (Round 7)
- **✅ Resolved (Round 7) — a child does not get an account. A parent books under their own account and simply adds a second service line.** A parent bringing a child adds **2 haircuts** to one ticket.
- This works cleanly with the Round 6 model: a ticket carries multiple services, and each line names its own barber — so "me with Ali, my son with Ben" is expressible without any new concept.
- **PDPA benefit worth noting:** because minors never hold accounts, the parental-consent problem around a minor's personal data does not arise. Recommend the signup terms state a **minimum age of 18** for account holders, which is the operational expression of this decision.
- **✅ Resolved (Round 9) — a multi-barber ticket IS served in parallel, and it STARTS as soon as any one of its lines can start.** Recorded as given: *"if the parents line is free, start anyway. while ben finishing his customer, the child can wait or can be reassign to another barber (on parents discretion)"*
  - **The ticket does not wait for all its barbers to be free.** The parent goes into Ali's chair the moment Ali is free; the child's line sits pending until Ben is free. A chair standing empty while a family waits for perfect synchronisation helps nobody.
  - **⭐ This introduces a genuinely new capability: LINE-LEVEL BARBER REASSIGNMENT on a live ticket, at the customer's discretion.** While waiting for Ben, the parent may say "just put him with whoever's free" — and the cashier moves that one line to another barber without touching the parent's line or reissuing the ticket.
    - It is **the customer's call, not the shop's** — the cashier offers, the customer decides. The system must not silently rebalance lines to optimise the queue.
    - Reassignment must **recompute both barbers' queues** (the old barber's projection shortens, the new one's lengthens), and must re-check the new barber's **skills** (Round 7) and **daily capacity** (they may be full).
    - **Price follows the new barber.** Pricing is per-barber (Round 6), so moving a line from a senior to a junior changes the amount owed. This has to be shown and accepted before the move, not discovered at payment — recommend the confirm dialog states the new price plainly.
    - **Commission follows the barber who actually performed the line**, which the existing per-line model already handles.
    - Log the reassignment on the ticket (who moved it, when, from whom, to whom) — it changes both money and service attribution.
- **✅ Duration estimate (Round 9) — a ticket estimates as its LONGEST line where its lines have different barbers, and as the SUM where they share one barber.** This follows directly from the parallel-service answer above: two chairs at once take as long as the slower chair, not the two added together. The old sum-always rule roughly doubled a family ticket's elapsed time and inflated both barbers' projections.
  - **Per-barber queues each see only their own line's duration** — which is what makes the per-barber estimates from Round 7 actually correct. Ali's queue is lengthened by the parent's 30 minutes; Ben's by the child's 20; neither sees 50.
  - *One-line confirmation still welcome, since Round 9 answered the operational question rather than the arithmetic one — but the arithmetic follows from it, and this is the version being built.*

### Party Booking
- **Resolved (Round 4) — a party/group booking exists at the BOOKING layer only.** One account holder can book for a group (e.g. five friends coming together), and the group is tracked as a party while it is a booking.
- **The party concept stops at payment.** At checkout the party dissolves into individual orders: each person's services form their own Transaction and their own receipt (see Group Split Payment). The party is not carried onto the receipt, the Transaction, or reporting.
- Only the booker holds the account; only the booker earns loyalty points for the visit.

### Slot Contention During Signup
- **Resolved (Round 4) — slots are NOT held while a client registers.** There is no reservation window between choosing a slot and completing signup/OTP.
- Two clients can therefore race for the same slot; whoever submits first wins, and the loser is told to pick another time. This is accepted by design — the alternative (holding slots for abandoners) was explicitly not wanted.
- Implementation notes this forces: the booking write needs a **race-safe uniqueness constraint** on (barber, slot), and the UI needs a clean "that slot just went — pick another" path that returns the client to slot selection **without losing their service/barber selections or making them sign up again**.

### Daily Capacity & End-of-Day Cutoff
- **Resolved (Round 2) — each barber has a configurable daily capacity**, set by the merchant/manager (e.g. max N clients per day per barber).
- **Resolved (Round 3) — the daily cap binds walk-ins too, not just bookings.** Once a barber hits their cap for the day, they stop being assignable entirely — no further bookings *and* no further walk-in assignments (including via round-robin auto-assign). Walk-ins cannot push a barber past their configured cap.
- **Resolved — the queue stops accepting new joins ahead of closing time**, and **each Outlet configures its own "last queue number receiving time"** — an explicit cutoff clock time set per Outlet, after which no new numbers are issued for that day.
- **Resolved (Round 3) — tickets already issued are always honoured: the Outlet must finish its remaining queue.** Unserved tickets at closing time are **not** auto-expired and **not** rolled to the next day — the shop works through whoever is already holding a number. This is precisely why the last-receiving-time cutoff exists: it is the control that stops the tail from growing, since the queue itself cannot be truncated.

### ⭐ A fully booked day — what the customer is offered instead (Round 17)
**Recorded as given: *"A"*.** Every barber is full on Saturday, the customer opens the app, sees nothing available, and today they simply go away.

- **The empty state offers the walk-in queue** — *"Saturday is fully booked. You can still join the walk-in line on the day."* — with the shop's opening time, the last-queue-number cutoff, and a link to the queue page.
- **Nothing new is being built.** The queue exists and the empty slot list is already rendered; this is wording on a screen that currently says nothing useful.
- **⛔ NO WAITLIST (Round 17).** A customer is not queued for a cancellation, and nobody is emailed when a slot frees up. A waitlist needs its own list, its own email, an acceptance window and rules about who gets first refusal — all offered and declined.
- **Recommended, and free: name the next day that HAS availability** on the same screen — *"the next free slot is Sunday, 10:30am"*. The slot generator already knows, and it turns a dead end into a booking.
- **Show it per barber as well as per day.** A customer whose chosen barber is full will often take another barber the same day, and the per-barber queue structure (Round 7) already makes that visible.

### Queue Late/Absence Handling
- **Grace Period:** If client is late by 5 minutes (configurable per merchant/Outlet), they must requeue.
- **Resolved (Round 2) — requeue mechanics:**
  1. **The barber has the option to mark the late customer as a no-show** — this is a manual barber/staff action, not a purely automatic timer-driven state change.
  2. The client **gets a brand-new sequential queue number** (i.e. the display sequence keeps incrementing — they go to the back of the line at the next number, and the next new walk-in takes the number after that).
  3. Their **original number disappears from the public queue display immediately** — it is not left visible marked "expired/skipped".
- **Queue Expiration:** If client doesn't arrive within 2 hours (configurable per merchant/Outlet):
  - Queue number is automatically destroyed
  - Client must rejoin
- **Resolved — expiry is silent from the system's side.** No notification of any kind (banner, push, SMS, email) is sent before or at the moment of expiry — the client only discovers it by checking the web app themselves. The merchant's only recourse is to **phone the client directly** using the number on the client's account.

### Cancellation vs. No-Show
- **Resolved — a client can voluntarily cancel/leave the queue before being called**, and this is tracked **differently from a no-show**.
- **No-show is specifically defined as: the client surpassing their booked slot time**, and is **flagged manually by the barber** (see requeue mechanics above). A voluntary cancellation before being called is not a no-show.

### No-Show Penalties
- Merchant can configure a loyalty point penalty for no-shows.
- **Resolved (Round 2) — the penalty applies ONLY to missed bookings.** A walk-in running number that simply expires after the 2-hour window is **not** penalised, and neither is a voluntary cancellation. Only a client who blows past a **booked slot** loses points.
- **⚠️ ✅ THE ZERO-POINTS GAP IS ACKNOWLEDGED AND ACCEPTED (Round 16).** Recorded as given: *"Points only. Accept the gap."*
  - **What the gap is, stated plainly so it is a decision and not an oversight:** the penalty is loyalty points, and a **new customer has none**. Deducting points from a zero balance does nothing, so someone can book a slot every day, never appear, and face no consequence at all. The barber's chair sits empty and the shop loses the money.
  - **A booking-block after repeated no-shows was offered and declined.** Nothing is built: no no-show counter driving a restriction, no temporary booking ban, no blacklist.
  - **Recommended anyway, because it costs almost nothing and it is what makes the decision reviewable later: COUNT no-shows on the customer record even though nothing acts on the count.** The cashier can then see *"4 no-shows"* when the customer next appears at the counter, and if this ever becomes a real problem the data to justify a rule already exists. Without the count, a future decision starts from zero evidence.
  - **What a shop can do today:** the merchant sets the point penalty for customers who have points, phones the customer, and — for a persistent offender — declines to take their booking by hand. There is no system lever, and the merchant has accepted that.

### Real-Time Display
- **Resolved — the live queue display is public**: anyone with the Outlet's link/QR can view it without joining or logging in (see Customer Webapp section).
- **⚠️ Revised (Round 7) — the public display is now organised PER BARBER and shows only each barber's "now serving" number.** Not a full waiting list, deliberately (the merchant does not want customers seeing a long queue). See Queue Structure. A client's own position and estimated wait belong on their own ticket view, not the public display.
- **✅ Resolved (Round 7) — there is also an IN-SHOP DISPLAY, driven by a dedicated read-only account.** See In-Shop Queue Display.
- **Resolved — refresh is client-driven.** There is no server-push alert to the client; the customer webapp relies on the client opening the Outlet's queue page and **pulling to refresh**. Mechanism for the display itself (polling vs. WebSocket vs. SSE) is still an implementation-time choice based on Next.js infra fit — no hard constraint from the business side.

---

## Products & Services Configuration

### Catalog Ownership
- The catalog (Products/Services) lives at the **Brand** level and is shared across all Outlets of that Brand — this is the source of truth. When a Brand launches a new service, all Outlets get it automatically.
- The schema must also support **Outlet-level price overrides** (delta only, not full duplication) so a Brand can price differently per branch (e.g., city-center premium vs. suburban pricing) without maintaining separate catalogs.
- "Fixed at merchant level" in earlier notes maps to **Brand** in the actual schema.

### Categories & Variants
- No self-referencing Product table for variants. Introduce a **Category** entity instead.
- Where a product has meaningfully distinct variants (e.g., "Standard Cut - Normal" vs. "- With Shave"), each variant is its **own Product row** under the shared Category, with its own price/duration — not a parent/child self-reference.

### Inventory / Stock (Round 6)
- **✅ Resolved (Round 6) — retail stock IS tracked, following standard retail practice: any sale of a product automatically updates the inventory record.** This did not exist before — the data model had no stock quantity at all.
- Scope and shape:
  - **Stock applies to retail Products only, never to services.** A haircut has no quantity.
  - **Stock is held per OUTLET**, even though the catalog is Brand-level — each branch has its own shelf. So stock is an Outlet-scoped quantity against a Brand-level Product, the same shape as the existing Outlet price override.
  - **Every sale decrements** the sold quantity, at the point the sale completes.
- What "standard retail practice" additionally requires, and should be built with it:
  - **Stock receiving / stock-in** — a way to add quantity when the merchant buys new stock, otherwise the count only ever goes down.
  - **Manual stock adjustment with a reason** (stock take correction, damage, theft, personal use) — every adjustment logged with who and why. This is the inventory equivalent of the discount log, and it is where shrinkage becomes visible.
  - **Stock movement history per product** — so a discrepancy can be traced rather than argued about.
  - **Low-stock and zero-stock visibility** on the POS and in the back-office.
  - **⭐ ✅ HOW THE MERCHANT FINDS OUT — BOTH A SCREEN WARNING AND AN EMAIL (Round 17).** Recorded as given: *"C"*. The on-screen number was never enough on its own — it only works if somebody happens to be looking at that screen, and most shops discover they are out of pomade when a customer asks for it.
    - **The screen warning stays** in `meikigo-merchant` and on the POS — a badge on the product and a list in the back office. It cannot be switched off; it costs nothing and is never noise.
    - **⭐ And a daily email lists everything below its low-stock level**, sent alongside the day-close summary the owner already receives. One more section on a scheduled email that exists, not a new mechanism.
    - **The email can be switched off** — `low_stock_email_enabled`, per Outlet, default **on**.
    - **Transactional stream: never counted against a marketing allowance and never blocked by one** (Round 15).
    - **Recommended: send nothing when nothing is low.** A daily email that says *"all good"* is trained-to-ignore inside a fortnight.
  - **⛔ NO SUPPLIER RECORD (Round 17).** Recorded as given: *"C"* — the cost per unit is enough. Stock-in records **what came in, how many, and at what cost**, and **not who sold it**. So *"how much did we spend with that supplier this year?"* and *"which supplier gave the cheaper price?"* cannot be answered, by decision — neither a supplier name on the stock-in nor a supplier record with terms and contact details is built. ⭐ The **expense ledger (Round 17)** is where that money now shows up instead, by category rather than by supplier, which answers the *"how much did we spend on stock"* half without a supplier table.
  - **⛔ NO BARCODE SCANNING (Round 17).** Recorded as given: *"Not now. Tapping from a list is enough for a barbershop."* There is no barcode field on the product and the POS does not accept scanner input. Recorded as a deliberate decision rather than an omission: with a 30-SKU ceiling on PRO, tapping from a list is workable. ⚠️ The cost of deferring is retro-fitting barcodes onto stock a busy shop has already shelved, which is the reason it was asked now.
  - **✅ Refunds/voids do NOT restock (Round 7).** The merchant's position, recorded as given: on a **product exchange** there is no restock, and on a **money refund for a damaged product** restocking must not be allowed at all. So the rule is: **a refund never automatically returns stock to the shelf**, and damaged goods must never be restocked.
    - A genuinely resellable return (unopened, undamaged) can still go back on the shelf — but **only through the explicit, logged manual stock adjustment path**, never silently as a side effect of the refund. That keeps every stock increase attributable to a person and a reason, which is the whole point of the adjustment log.
    - This keeps the Round 3 rule fully intact: **a refund reverses money only.** Not points, not commission, and not stock.
    - **✅ Resolved (Round 23 Q16) — in Phase 1, exchange follows standard practice:** the refund **does not** restock. If the returned item is genuinely resellable (unopened/undamaged), it is added back only via the **manual inventory adjustment request** path (same approval mechanism as other manual adjustments).
  - **Selling below zero:** decide whether the POS blocks a sale when stock reads zero or allows it and goes negative. Recommend **allow with a warning** — a wrong count must never stop the shop taking money from a customer holding the product in their hand.
- Plan interaction: `FREE` has **0 product SKUs**, so inventory is effectively a STARTER-and-above concern.

### Product Exchange (Round 9)
**⛔ SUPERSEDED by Round 23 Q16 (Phase 1):** Phase 1 has no dedicated exchange transaction type. The cashier implements exchange as a **refund (no restock) + a new sale**.

- **Phase 1 implementation:** exchange is a **refund + new sale** — the refund handles the original line (**no restock**), and the new sale handles the replacement line.
- **Standard practice (Round 23 Q16):** reuse the existing refund + sale correctness instead of introducing a special exchange settlement type in Phase 1.
- **Linking:** the original transaction is referenced (never edited). Optionally store an `ExchangeGroup ID` to tie the refund + new sale together for reporting/audit.
- **Stock:** refunds never restock. If the returned item is resellable, it is added back only via the **manual inventory adjustment request** path (reason = resellable return), using the normal approval mechanism for manual adjustments.
- **Commission/loyalty impact:** comes from the underlying refund and the underlying new sale (no separate exchange settlement rule in Phase 1).
- **⛔ SUPERSEDED in Phase 1 (Round 23 Q16):** exchange is refund + new sale; any resellable-return stock is handled via the manual inventory adjustment request (approval rules follow manual adjustments).
  - **(Phase 2 only):** exchange_requires_approval and pending-exchange behavior are deferred; Phase 1 uses refund + new sale.
  - **(Phase 2 only):** stock handling for resellable returns happens via manual inventory adjustment requests (not an EXCHANGE-specific approval flow).
  - **(Phase 2 only):** pending visibility is handled by the existing pending refund / pending manual-adjustment queues.
  - **(Phase 2 only):** any “wait until admin approves” UX is built on top of the refund + manual-adjustment mechanisms.
  - **(Phase 2 only):** no standalone EXCHANGE transaction completion in Phase 1.
  - **(Phase 2 only):** the cashier sequence in Phase 1 is refund first, sale second.
  - **(Phase 2 only):** resellable return stock is added only after manual adjustment approval per manual-adjustment rules.
  - **(Phase 2 only):** earlier Round 14/15 exchange approval setting is not part of Phase 1.
  - **(Phase 2 only):** treat “exchange waiting” as “pending refund / pending manual adjustment” in Phase 1.

### Inventory Adjustment Requests & Approval (Round 9)
**✅ Resolved (Round 9) — a manual stock adjustment is a REQUEST that must be APPROVED, not an immediate edit.** Recorded as given: *"we have to maintain honest record especially integrity and audit compliance. Approval flow is needed."*

This is a new requirement and it upgrades the Round 6 adjustment log from "logged" to "controlled". The distinction matters: a log tells you afterward who wrote off ten bottles of pomade; an approval stops it happening on one person's word.

- **Applies to every manual adjustment**, not just exchanges — stock take corrections, damage, theft, personal use, and resellable returns all take the same path.
- **It does NOT apply to automatic movements**: a sale decrementing stock and a stock-in receipt against a purchase are ordinary recorded movements, not adjustment requests. Requiring approval for every sale would stop the shop.
- **States:** `PENDING → APPROVED` or `REJECTED`. Stock only moves **on approval**. A pending request is visible on the product's stock view as a pending delta so the merchant isn't confused by a count that hasn't changed yet.
- **Every request carries:** product, Outlet, direction and quantity, a **required reason** (the Round 6 reason list — stock take, damage, theft, personal use, resellable return, exchange), the requester, the timestamp, and any related Transaction (the exchange or refund it came from).
- **Every approval carries:** approver, timestamp, and an optional note. **The approver must be a different person from the requester** where the Outlet has more than one Admin — self-approval defeats the control. Where a solo owner is the only Admin (very common on STARTER, and universal on FREE), self-approval has to be permitted, and the honest way to handle that is to **record it as self-approved** rather than pretend a second party existed.
- **Who approves:** Outlet/Brand **Admin**. A Cashier can request; a Cashier cannot approve. This is the same shape as the existing Admin-password gate on discounts.
- **Rejection is a first-class outcome**, kept on the record — a rejected write-off is exactly the evidence the control exists to produce.
- **✅ Resolved (Round 10), REVISED (Round 11) — THREE ways to get an approval, and the requester picks.** Round 10 proposed *Notify Admin via System*, *Notify Admin via Email* and *Generate Approval QR Code*. **Round 11 dropped the QR and replaced it with an Admin Approval Password.** Recorded as given: *"Replace QR with Admin Approval Password. Context: Notify Admin via System / Notify Admin via Email / Enter Admin Password. Admin Approval Password should be different Admin login password."*

  The request screen shows three buttons: **Notify Admin via System**, **Notify Admin via Email**, **Enter Admin Password**.

  - **1. Notify via System** — a badge/red dot in `meikigo-merchant` and on the POS, with a pending-approvals list behind it. This is the baseline and should always be on; the other two are ways of chasing it.
  - **2. Notify via Email** — for the owner who is not in the shop. Sent on the transactional stream. Recommended: include what is being adjusted and why, but **make the email a prompt to go and approve, not an approve-by-clicking link** — a one-click approval link in an inbox is a credential sitting in a mailbox.
  - **3. ⭐ Enter Admin Password** — the Admin is standing at the counter. They type their **approval password** on the POS and the request is approved on the spot, without the cashier logging out or the Admin signing in. This is the route that keeps the counter moving.

**⛔ The Approval QR code is dropped.** Everything specified for it in Round 10 — request-scoped tokens, single use, short expiry, scanning-is-not-approving — is removed with it. Nothing else in the design depended on it.

#### ⭐ The Admin Approval Password — ✅ Resolved (Round 11)
**It is a second, separate secret on an Admin account, used only to authorise things. It is never the login password.**

- **Distinct from the login password by requirement**, and the system must enforce that: setting an approval password identical to the account's login password is rejected. Recorded as given: *"Admin Approval Password should be different Admin login passwornd."* The reason this matters is the one the merchant is buying — an approval password gets typed in front of a cashier, so if it were the login password, every cashier would end up holding an Admin login.
- **✅ RESOLVED (Round 12) — it belongs to the ADMIN ACCOUNT, not to the Outlet.** Each Admin has their own approval password. When Ali approves, the approval row says Ali. A shared Outlet-level password could only ever record *that someone with the password* approved, which is precisely the audit hole the Round 9 answer set out to close (*"we have to maintain honest record especially integrity and audit compliance"*).
- **✅ RESOLVED (Round 12) — ⛔ THE ROUND 6 OUTLET OVERRIDE PASSWORD IS RETIRED. There is now ONE authorisation secret in the product.** The per-Admin approval password authorises **everything**: stock adjustment approvals, ad-hoc discounts, voids and refunds. The shared Outlet-level password introduced in Round 6 no longer exists.
  - **Why this is the better outcome, not just the tidier one:** the Round 6 password was shared by design, so every counter override in the product's history would have been attributable only to "the shop". Consolidating means **every override in the system now names a person** — the discount, the void, the refund and the stock write-off all carry an Admin's identity, using one prompt the staff learn once.
  - **Migration note for the build:** anywhere the spec previously said *"the Outlet override password"* now means *"the acting Admin's approval password"*. The Outlet configuration field is removed. The audit rows gain an approving-Admin reference where they previously had only the acting cashier.
  - **One consequence to design for:** with a shared password, any cashier could complete an override alone once they knew it. With per-Admin passwords, **an Admin must be reachable** to authorise a refund. In a solo shop the owner *is* the Admin and nothing changes; in a shop where the owner is off-site, a cashier now genuinely cannot refund without them. That is the control working as intended, and the notification routes already built for stock approvals apply equally here.
  - **✅ ⭐ RESOLVED (Round 13) — A REFUND WITH NO ADMIN PRESENT BECOMES A PENDING REFUND REQUEST.** Recorded as given: *"A"*. The cashier raises the request, the customer is told it will be processed once approved, and it sits in the same pending-approvals queue as a stock adjustment — with the same three routes to reach an Admin (**Notify via System / Notify via Email / Enter Admin Password**). See Refunds & Voids for what the queue does to the money and the till.
- **Storage:** hashed, never recoverable, rotatable by the Admin themselves. **Rate-limited** — a handful of failed attempts locks the prompt for a few minutes, because an unlimited prompt on a tablet is a PIN oracle.
- **✅ ⭐ RESOLVED (Round 13) — A FORGOTTEN APPROVAL PASSWORD IS RESET TWO WAYS, AND BOTH ARE LOGGED.** Recorded as given: *"A"*.
  - **1. A reset link emailed to that Admin's own email address.** Self-service, and the mailbox is the second factor. The link is single-use and short-lived, and it lets the Admin *set* a new approval password — it never reveals or approves anything by itself.
  - **2. Any other Admin in the Brand can force a reset**, which is the route for an Admin who has lost access to their mailbox as well. The forced reset does **not** let the resetting Admin choose the new secret — it clears it and triggers the email flow, so one Admin can never end up knowing another's approval password.
  - **⚠️ The reset must not be reachable from the approval prompt on the POS.** This is the part that matters and it is easy to get wrong: if the "forgot it?" link sits next to the password box on the counter tablet, a cashier standing there can start a reset, and the control the whole design exists for is gone. The reset lives in `meikigo-merchant` under the Admin's own profile, or in the email; the POS prompt offers only *"notify Admin"*.
  - **Both routes are audited** — who reset, whose password, when, by which route — and the rows appear in the merchant-visible audit log on PRO.
  - **Setting the new password re-applies the must-differ-from-login-password rule.** A reset is the most likely moment for someone to type their login password out of habit.
  - **Meikigo support is not in this path.** They can still act in `meikigo-admin` if a Brand locks itself out entirely, as an audited last resort with a stated reason.
- **The approval row records which Admin's password was used, on which device, at what time** — the same audit row as any other route.
- ✅ **Round 11 also settled the counter-override question with the same answer:** *"Just password, we not responsibility the password leak."* So discounts, voids and refunds continue to be authorised by password rather than by any new mechanism. See Discounts & Promotions and Refunds.
- ⚠️ **The residual risk, stated once and then left alone, since the merchant has accepted it explicitly.** A password typed on a shared tablet in front of a cashier will be learned by that cashier — it is shoulder-surfing, and no amount of hashing prevents it. The merchant has weighed this and chosen convenience. Three cheap things reduce the blast radius without changing the decision, and all three are recommended: **make it per-Admin** (a leak implicates one person's secret, not the shop's), **prompt for rotation periodically**, and **make the pending-approvals list and its history readable by the Brand admin** so an unusual pattern of approvals is visible even when the password is known. If write-offs ever start appearing at odd hours, that list is the evidence, and it exists regardless of who typed the password.
- **All three routes end in the same place:** one `PENDING` request, one approval record, one audit trail. They differ only in how the Admin is reached.
- ⚠️ **Worth stating plainly:** this is the first approval workflow anywhere in the product. Everything else is either immediate or password-gated. It is the right call for stock — shrinkage is the classic small-retail loss — and the password route is what stops it becoming a queue that blocks the counter.

**✅ Cost price, COGS and stock valuation (Round 7)**
- **Cost price IS recorded, for products** — so the merchant can see margin, and the accounting module can produce a real cost-of-goods-sold figure rather than only revenue.
- **✅ Cost is NOT a single editable number — it is tracked per stock purchase.** The merchant's example: product A bought in January at RM4 and in February at RM8 is *the same item but different stock*. A single fixed cost price is explicitly rejected.
  - So each **stock-in records its own unit cost**, and the item carries cost *layers* rather than one figure.
  - **Recommendation for how to value it: weighted average cost.** It is the standard choice for a shop this size, it is permitted under Malaysian accounting standards (as is FIFO — LIFO is not), and it avoids the merchant having to think about which physical bottle was sold. Keep the individual purchase records regardless, so FIFO remains possible later without re-entering history.
  - The cost used on a sale must be **snapshotted onto the transaction line** at time of sale, exactly as price already is — otherwise a later stock purchase silently rewrites the margin on past sales.
- **✅ Stock valuation is shown to the merchant** — what is on the shelf is worth RM X. This is what an accountant asks for at year end, and it falls out of the cost layers above.
- Reporting that follows naturally: **gross margin per product**, margin by period, and COGS for the accountant export.

### Product Status
- Products have an **active/inactive** status flag so merchants can temporarily disable a service/product (seasonal packages, out-of-stock retail items) without deleting historical transaction references. **Round 6 note:** with stock now tracked, "out of stock" is a **quantity** condition rather than a reason to flip the status flag by hand — keep the manual flag for genuine withdrawals (a discontinued product, a seasonal service), and let zero stock be handled by the inventory rules above.
- Hard deletion is forbidden for anything tied to a financial record.
- Inactive products are hidden from the POS catalog but remain queryable in reports and past transactions.
- **⭐ Deactivating a SERVICE that has future bookings does not cancel them (Round 16)** — the bookings stand and are served, the service is hidden from new bookings only, and the owner is warned with the count before the change. If they do not want to honour them, an Admin cancels each booking by hand with the compulsory reason. See Queue Management → Settings changed after a booking exists.

### Price Changes Mid-Wait (Round 5)
- **Resolved (Round 5) — the client pays the price that was shown when they joined.** A client who joins the queue for a RM30 haircut pays RM30 at the counter, even if the manager raised the service to RM35 while they were waiting.
- **This means the price is snapshotted TWICE, at two different moments, for two different reasons:**
  1. **At join/booking time**, onto the queue ticket — this is the price the client agreed to and the price the cashier must be shown at checkout (new in Round 5).
  2. **At time of sale**, onto the Transaction line item — the existing immutability/audit snapshot (see Price/Product Snapshotting).
- **Services added at the counter are priced at the counter** — a snapshot only protects what the client actually saw. An add-on service requested mid-cut is picked up at its current price, since the client never saw an earlier one. The cashier's confirm/amend step should make the mixed pricing visible on the ticket rather than silently blending it.
- Practical bound on the merchant's exposure: because a walk-in ticket expires after 2 hours and bookings run only as far as the merchant's configured booking horizon, a snapshotted price can be honoured for as long as that horizon — a 30-day horizon means a price rise does not reach already-booked clients for up to 30 days. Worth surfacing in the merchant UI when they change a price ("N upcoming bookings keep the old price"), so a price rise is not silently ineffective.

### Per-Barber Pricing (Round 6)
- **✅ Resolved (Round 6) — a service can be priced PER BARBER**, and this is a configurable feature rather than a fixed rule. Senior/junior pricing (haircut RM30 with a junior, RM45 with the senior stylist) is directly supported.
- The catalog therefore now carries price at up to three levels of specificity. Recommended precedence, **most specific wins**:
  1. **Brand** price (the catalog source of truth)
  2. **Outlet** override (existing — delta only, e.g. city-centre premium)
  3. **Barber** override (new in Round 6)
- **This is only safe because Round 6 also made barber selection mandatory** (see Barber Assignment). With "no preference" removed, the client always picks their barber before submit, so the price is always known up front — which was the merchant's explicit reason for dropping "no preference". The two decisions depend on each other and should not be implemented apart.
- Implementation notes:
  - The client-facing barber picker should **show each barber's price for the selected service(s)**, otherwise the customer discovers the difference at the counter — which is exactly the complaint per-barber pricing usually generates.
  - Price is still **snapshotted onto the ticket at join time** (Round 5), so a barber's rate changing mid-wait does not affect someone already queued.
  - Reporting needs to keep the barber's price on the line item, since two identical haircuts can now legitimately have different revenue.

### Product Availability
- **Barber Restriction:** No - products available to all barbers
- **Time Slot Restriction:** No
- **Day Restriction:** No
- Products are available brand-wide (subject to Outlet overrides above)

### Commission
- **Retail products**: support a commission configuration (percentage or fixed amount), tied to whichever barber/staff performs the sale. **The merchant can enable/disable commission per product — ✅ reconfirmed as a per-item flag in Round 13** (the *rate* remains Outlet-level; only the on/off switch is per item — see the product-only-sale resolution below).
- ~~**Services**: hold off on commission in Phase 1…~~ — **⚠️ SUPERSEDED (Round 6).**
- **✅ Resolved (Round 6) — the requirement is changed: a barber earns commission on BOTH products AND services**, configured in **Outlet configuration**. Service commission is no longer deferred.
  - This closes the Round 5 flag that a barber's payslip would otherwise show commission on shampoo sales and nothing for the haircuts they performed.
  - The earlier worry (that service pricing gets complicated with packages and chair-rental splits) is set aside in favour of the simple model: a percentage or fixed amount, same as retail.
- ~~**Resolved (Round 6) — the commission RATE can differ per barber**~~ — **⚠️ SUPERSEDED (Round 7).**
- **✅ Resolved (Round 7) — commission is configured in OUTLET CONFIGURATION ONLY. One rate, applying to every barber.** If the Outlet is set to 4%, all barbers are on 4%. There are **no per-barber rates and no per-item overrides** — the three-dimensional model floated in Round 6 is dropped in favour of a single Outlet-level setting.
  - This is a genuine simplification and worth taking: one number per Outlet is trivial to explain, trivial to audit, and removes the precedence question entirely.
  - Note it is deliberately asymmetric with **pricing**, which *is* per-barber (Round 6). A senior charges more, so the same percentage already pays them more — which achieves most of what a per-barber rate would, without a second dimension of configuration.
- **✅ Resolved (Round 9) — Outlet configuration holds TWO rates: a service-commission % and a product-commission %.** Recorded as given: *"meikigo do not determine the margin or profit outlet made for either service or product sell. This is purely merchant side of calculation. We just prepare the tools, meaning merchant can set % on barber commission on selling physical product, % on barber service."*
  - **The framing matters and should shape the UI copy.** Meikigo is not modelling the shop's margin, and must not present these as profit-share settings or offer margin advice. They are two empty percentage fields the merchant fills in. Whether 4% on a pomade is generous or ruinous is the shop's arithmetic, not the platform's.
  - So the Outlet holds: `service_commission_pct`, `product_commission_pct`, each independently enable-able. Still **one pair of rates per Outlet applying to every barber** — Round 7's "no per-barber rates" is untouched, since Round 9 was answering *what is configurable*, not *at what level*.
 - **✅ Resolved (Round 23) — commission precedence clarification:** there are no per-item/per-barber commission *rate* overrides in this Phase. The only item-specific decision is whether `commission_enabled` is ON for that product/service. The commission rate comes from the Outlet-level fields (and follows the `BRANCH` vs `FRANCHISE` storage scope rule), while the credited employee is determined by the service line's assigned barber.
  - **✅ ⭐ RESOLVED (Round 13) — A PRODUCT-ONLY SALE STILL EARNS NO AUTOMATIC COMMISSION, BUT AN ADMIN CAN ADD COMMISSION BY HAND AT CHECKOUT.** Recorded as given: *"As an admin, you can configure the product or service is commision enable or not. In this scenario, should be no commision. But as an admin, at the checkout page, admin can manually add commision at the check out page. This is because maybe the customer come because of one of the employee/barber promote at outside."*
    - **Two separate things were answered, and both are needed:**
    - **1. A per-item commission-eligible flag.** Each product and each service carries **`commission_enabled`** (yes/no). The Outlet's `service_commission_pct` / `product_commission_pct` apply only to items flagged eligible. ⚠️ **This is not a return to per-item commission *rates*** — Round 7's "one pair of rates per Outlet, no per-item overrides" stands. An on/off switch is a different thing from a rate override, and it is what lets a shop exclude, say, gift vouchers or a cost-price item from commission entirely.
    - **2. ⭐ A manual commission line at checkout — new, and genuinely useful.** The default for a counter sale with no barber stays **no commission**, and the Admin may add one deliberately, **attributed to a named employee**, because the reason the customer walked in may be a barber promoting the product outside the shop. This is a real thing in this trade and no automatic rule could infer it.
    - **What a manual commission line must carry:** the employee it is credited to, the amount (fixed ringgit or a percentage of the line, both worth supporting), the transaction and line it relates to, a **reason**, and the **acting Admin's approval password** — it is money being assigned to a person at the counter, which is exactly the class of action that single secret exists to authorise.
    - **It accrues like any other commission**, so it reaches the payslip on PRO, the reports below PRO, and the barber's daily summary email that same night — which is a useful side effect: the barber sees the credit the day it was given rather than a month later.
    - **A cashier cannot add one**, and **a manual line must not be silently reversible.** Removing one before the sale completes is fine; after that it is an adjustment, per the no-editing-financial-records rule.
    - **✅ NO CEILING ON THE AMOUNT — Resolved (Round 14).** Recorded as given: *"No limit. The approval password and the log are enough."* An Admin may add any amount. No percentage cap, no per-line maximum, no setting.
    - ⚠️ **That makes the two remaining controls the whole control, so neither can be dropped later:** the **approval password** (which names the Admin who authorised it) and the **audit row**. There is no arithmetic anywhere that can flag a manual commission line as wrong, because by design it has no rule behind it.
    - **Recommended, and now more important than before: surface manual commission separately in the per-barber commission report** rather than blending it into earned commission, so an owner can see how much of a barber's month was discretionary. This is the only place an unusual pattern becomes visible.
    - **Recommended: include manual commission lines in the PRO merchant-visible audit log view** with the amount shown, since that log is exactly what a multi-outlet owner bought it for.
    - **The settings screen must still say plainly that a walk-in product sale pays no one by default**, so a merchant who sets a product rate is not surprised. That was the original recommendation and it stands.
- **✅ Resolved (Round 7) — when an Admin discounts a bill, a POPUP asks whether to drop the barber's commission or not.** It is a per-transaction decision made at the counter — and the popup **only appears if the Outlet has commission enabled**.
  - This is better than either fixed rule: the manager who chose to discount decides on the spot whether the barber absorbs it, and the answer is recorded per transaction.
  - Implementation: store the choice on the transaction (commission calculated on gross vs. discounted), so a later audit can see who decided what.
- **✅ ⭐ RESOLVED (Round 13) — THE DISCOUNT/COMMISSION BASIS IS A CONFIGURED DEFAULT, set by each brand or outlet.** Recorded as given: *"Each brand/outlet can configure it"*. So the question *"does a discount reduce the barber's commission?"* is no longer answered platform-wide, and it is no longer answered fresh at every counter either.
  - **New setting: `commission_on_discounted_amount`** (true = commission on what the shop actually took, false = commission on the original price). It follows the **brand-type rule** — Outlet-level on a `FRANCHISE` brand, Brand-level on a `BRANCH` brand — like commission rates themselves.
  - **Recommended default: TRUE (commission on the discounted amount).** The shop only earned that, and the alternative can pay a barber more commission than the line generated in margin. But it is now the merchant's call, which is the right place for it: some owners deliberately protect the barber from a manager's discount because the barber did the same work.
  - **⭐ How this fits with the Round 7 popup, which is NOT removed:** the setting supplies the **default**, and the popup still appears at the counter **pre-filled from it**, so an Admin can override for one transaction. That keeps both answers intact — a shop that has decided its policy stops thinking about it, and the manager who wants to make an exception still can.
  - **Recommended: allow the popup to be switched off** where a merchant has settled their policy. A confirmation dialog that always answers itself the same way is a click that teaches staff to click without reading.
  - **The transaction still stores the basis actually used**, as Round 7 required, so no report or payslip depends on reading a setting that may have changed since.
- **✅ Resolved (Round 7), reaffirmed (Round 11) — discounting is allowed by default, but requires the Admin password** (see POS Device Session). Round 11 declined to move counter overrides onto any new mechanism: *"Just password, we not responsibility the password leak."* The shoulder-surfing risk is understood and accepted by the merchant.
- **Commission follows the SERVICE LINE to the barber who performed it** (Round 6), not the ticket as a whole — so a two-barber ticket splits commission between them automatically. See One Ticket, Multiple Barbers.
- **Plan gating is unchanged:** commission is not available on `FREE`, regardless of headcount.
- **Where commission goes — ✅ UPDATED (Round 9).** Round 6 deferred Payroll and Round 7 removed it from the pricing table; **Round 9 reinstates it as a PRO feature** whose scope is *generating the numbers* (see Payroll). So:
  - **On PRO:** commission accrues per sale and is **picked up by the monthly payroll run onto the barber's payslip** — the Round 5 path, restored.
  - **On STARTER and PLUS:** commission accrues per sale and is **reported only** (per-barber dashboard, daily Z-report, accountant export); the owner pays it outside the app.
  - **On FREE:** commission is not available at all.
- **Plan gating:** commission is not an available feature on the `FREE` tier, regardless of barber headcount — commission config is only exposed from STARTER and above.
- **Resolved (Round 5) — commission calculates AUTOMATICALLY on manually-entered (outage) sales**, exactly as on a normal gateway-processed sale. The Admin does not add it by hand.
  - Note the deliberate asymmetry with loyalty on the same record: on a manual entry, **loyalty points are manual** (granted by hand and logged) but **commission is automatic** (see Manual Transaction Entry). The reason they differ is that commission is derived purely from the sale's line items and the assigned barber — both of which the Admin has already keyed in — whereas loyalty depends on correctly attaching the sale to a customer account, which is the step that may be missing or wrong.
  - Consequence: the Admin keying in an outage sale **must assign a barber** to it, otherwise the automatic commission has no payee. Barber assignment should therefore be a required field on the manual-entry form, not optional.
- **Resolved (Round 5), deferred in Round 6, ✅ RESTORED IN ROUND 9 (PRO only) — commission does not stop at a report; it flows into Payroll and onto a payslip.** See the Payroll section for the full path.
  - ~~⚠️ Flag: a barber's Phase-1 payslip carries commission on retail sales only, nothing for the haircuts they performed~~ — **resolved.** Round 6 made service commission real and Round 9 gave both service and product their own rate, so a payslip now reflects the work actually done.

---

## Barber & Employee Management

### ⭐ Barber Daily Work Summary Email — ✅ Resolved (Round 12)
**A barber cannot see their own numbers anywhere in the product, and Round 12 confirmed that stays true — but added a way to tell them anyway.** Recorded as given: *"A. Additionally, system can generate daily work summary for each barber which will be sent to barber's email for each close day. So, we can ensure integrity and fairness for barber."*

**Why this matters, said plainly:** barbers have no login (settled across many rounds, not reopened). Commission is most of a barber's pay. Until now the only person who could see a barber's commission, tips and ratings was the owner — the same person who pays them. That is an integrity problem the merchant spotted and closed without giving barbers an account.

- **Sent at DAY CLOSE**, one email per barber who worked that day. Day close is the right trigger: the day's figures are final at that point, and nothing sends for a day that was never closed.
- **Each barber receives only their own numbers.** Never a colleague's, never a shop total, never a leaderboard.
- **Contents:** clients served, services performed, **commission earned today**, **tips received today**, hours or days recorded (per their pay type), and their **rating activity** — as an aggregate only, never an individual review, since review anonymity is absolute.
- **This is the third scheduled/proactive email in the product**, after the booking reminder and the payslip, and it uses the `Employee.email` field payslips already made mandatory. It goes on the **transactional stream**, and is not subject to marketing consent.
- **It is a report, not a payslip.** No statutory figures, no net pay, no deductions — those belong on the monthly payslip. Confusing the two would have a barber reading a daily commission figure as take-home.
- **✅ ALL THREE SETTLED IN ROUND 13** — the recommendations were accepted, and the awkward case was answered too:
  - **✅ A merchant toggle per Outlet, DEFAULT ON.** Recorded as given: *"A"*. The feature arrives switched on, and an owner who does not want daily figures leaving the shop can turn it off. A feature that cannot be turned off gets resisted rather than adopted, and an integrity measure nobody can disable is also one nobody consented to.
    - **Where the toggle lives:** with the other brand-type-driven settings — Outlet-level on a `FRANCHISE` brand, Brand-level on a `BRANCH` brand — stored on the Outlet like everything else.
    - **Switching it off is worth logging.** It is the one setting whose purpose is to let barbers check the owner's numbers, so the audit row (*who turned it off, when*) costs nothing and means the merchant-visible audit log on PRO tells the whole story.
  - **✅ NOTHING SENDS ON A DAY A BARBER DID NOT WORK.** Recorded as given: *"A"*. No zero-everything email on an off-day, on leave, or on a day the barber was simply not rostered. The trigger is *served at least one client, or has attendance marked as worked* — not *exists*.
  - **✅ ⭐ IF THE DAY IS NEVER CLOSED, THE EMAIL STILL GOES OUT AT MIDNIGHT, MARKED PROVISIONAL.** Recorded as given: *"A"*. This was the gap in the original design: the email hangs off day close, and a busy shop that forgets to close would silently send nothing — which to a barber looks exactly like figures being withheld.
    - The email carries a visible line — ***"day not closed — figures may change"*** — and is generated from the day's recorded sales as they stand at midnight.
    - **It sends once. There is no corrected re-send** the next morning when the day is finally closed. Two emails with different numbers for one day is worse than one email that says it is provisional, and the monthly payslip is the authoritative figure either way.
    - This dovetails with the existing day-close recommendation that the system **auto-closes at the daily reset and flags the day as unclosed** — the same midnight job can do both, and the "provisional" wording is honest precisely because nobody counted the drawer.
    - ⚠️ **Consequence worth naming:** a day closed late (the morning after) will have already had its provisional email sent. If the closing count changes anything the barber can see — a voided ticket, a mis-attributed service — that difference surfaces as a question rather than a correction. That is the same accountability the feature exists for, but the owner should know it happens.
  - **A monthly version alongside the payslip** remains available as a fallback if daily proves too noisy — worth keeping in mind, not built now.
- ⚠️ **One consequence worth naming:** this makes commission disputes visible daily rather than monthly, which is the point — but it also means an incorrectly-attributed ticket surfaces within hours. That is a feature. It does mean the reassignment and manual-entry paths need to attribute barbers correctly, because somebody is now checking.

### Barber Public Profile — ✅ Resolved (Round 11B), specified under delegation
**Round 11B delegated the design to me.** Recorded as given: *"Name, rating, photo, description, specialities and many more. You decide."*

**Why this matters more than it looks.** Since Round 6, choosing a barber is **compulsory** — a customer cannot join the queue or book without naming one. But the system holds a name and a star rating, so the customer picks from *"Ali, Ben, Chandra"* with nothing to go on. Every other decision in the booking flow has information behind it; this one, the most personal choice a customer makes, has almost none. It is also the screen that carries the Round 6 per-barber pricing and the Round 7 per-barber skills, both of which are invisible to the customer today.

**What the profile holds**

| Field | Shown to customer | Notes |
|---|---|---|
| **Display name** | Yes | The name customers use, which is often not the legal name on the `Employee` record. Keep them separate — payroll needs "Muhammad Ali bin Hassan", the booking screen needs "Ali" |
| **Photo** | Yes | The single biggest one. People choose a barber by face, and it doubles as a way to find them in the shop |
| **Short description** | Yes | One or two sentences in the barber's own voice — *"10 years experience. Fades and beard work."* Cap it (recommend 200 characters) or it becomes an essay |
| **Specialities** | Yes | **Taken from the Round 7 skills already recorded** — no second list to maintain, and it stays true automatically. Show the 3–4 most relevant, not all of them |
| **Years of experience** | Yes | A single number, self-declared. Cheap signal, and the one customers actually ask about |
| **Rating + review count** | Yes | Already exists in `BarberStatistic`. **Show the count alongside the score** — 4.9 from 3 reviews and 4.9 from 300 are not the same claim. Respect the platform-wide minimum-ratings threshold before showing any score at all |
| **Price from** | Yes | **Necessary, not optional.** Pricing is per barber (Round 6), so a customer who picks a senior without seeing the price gets a surprise at the counter — which is the exact friction removing "no preference" was meant to avoid. Show the price for the service they have selected, not a generic "from" figure, wherever the flow allows |
| **Next available** | Yes | Fed by the per-barber queue and booking projections that already exist (Round 7). Turns the picker from a list into a decision — *"Ali: ~40 min · Ben: ~10 min"* |
| **Languages spoken** | Optional | Genuinely useful in Malaysia. Recommend it as an optional tag list, not a required field |

**What must never appear on the profile**
- **Individual reviews or anything traceable to a customer.** Ratings are anonymous in both directions and that is absolute (Round 6). The profile shows an aggregate score and a count, never who rated.
- **Personal contact details, IC, salary, or anything from the payroll fields.** The public profile and the employment record share a row and must not share a view.
- **Real-time "currently serving" identity of a named customer.**

**Who maintains it, and the moderation question**
- **The merchant Admin uploads and edits everything**, in `meikigo-merchant`, alongside the existing barber setup. Barbers have no login (settled repeatedly) and therefore cannot maintain their own profiles.
- **Meikigo does not review photos before they appear.** This is consistent with the Round 7 position on marketing content, and pre-moderating every barber photo across every merchant is not a workload this team should take on.
  - **✅ Resolved (Round 12) — removal works BOTH ways.** *"A and B are relevants."* The **merchant** can remove their own photos at any time, and **Meikigo staff can remove any photo** from `meikigo-admin` as an audited action. Customers can report a photo from the app, which raises it to Meikigo. The merchant-side route handles the ordinary case (wrong photo, staff left); the Meikigo-side route exists for the case where the merchant is the problem or is unreachable.
  - **Also required:** image-format and size validation on upload. Reactive moderation, not gatekeeping.
  - Worth stating plainly so the risk is not a surprise: an unmoderated image field on a public page can carry something inappropriate. The exposure is small — the merchant is uploading photos of their own staff, and their own shopfront is at stake — but the removal path must exist before launch, not after the first incident.
- **✅ Resolved (Round 12) — a CONSENT CHECKBOX is required at upload.** *"I confirm this employee agreed to their photo being shown publicly."* It is stored with the image, along with who ticked it and when. A photograph of an employee is personal data and the employee is not the one uploading it, so under PDPA the merchant needs their staff's agreement before publishing a face and a name. One click, recorded, and the obligation sits where it belongs — with the merchant, who is the data user for their own staff.
  - Upload is **blocked** without it, not merely warned. An unticked box that still uploads records nothing useful.
  - **A departing barber's photo must come down.** Deactivating an `Employee` already removes them from the picker; confirm it also removes the image from public URLs, or the photo outlives the employment.

**Practical requirements**
- **Photos need processing on upload** — resize, compress, strip EXIF (phone photos carry GPS coordinates of the shop and sometimes the home), and generate a square crop. Do not serve a 6MB phone original to a customer on mobile data. **⭐ Stored in OCI Object Storage, behind a signed link (Round 18)** — see Data Storage Requirements → File & Photo Storage for the shared upload pipeline this and every other file upload goes through.
- **A fallback avatar** — initials on a coloured background — for every barber without a photo. Most merchants will not upload photos on day one, and the picker must look deliberate rather than broken when they have not.
- **The profile is Outlet-scoped in practice**, since a barber belongs to one Outlet (Round 11B).
- **Nothing here is tier-gated.** A FREE solo barber gets a profile too; it is the shopfront, and gating it would make the free tier look abandoned.

### Employee Entity
- Introduce a dedicated **`Employee`** entity, linked to `UserAccount` (so employees can log in via `meikigo-pos-native`) and to **Outlet**, plus role (only Admin/Cashier are login roles — "barber" is a job description on the Employee record, not a login role) and status (available/unavailable).
- **✅ Confirmed (Round 11B) — ONE barber belongs to ONE Outlet.** A barber splitting their week across two branches is not a situation these merchants have, so the `Employee` → Outlet link stays single-valued and nothing downstream needs to change. This keeps the queue, the schedule, commission, headcount caps and payroll all Outlet-scoped, each of which would have needed rework under a many-outlets model. A shop that ever needs it can create two Employee records, accepting that reporting treats them as two people.
- This is separate from the customer-facing `UserAccount`/client account.
- `Employee` needs a **`type`** field distinguishing **`BARBER`** (performs services, commission-eligible from STARTER up) from **`STAFF`/`EMPLOYEE`** (non-barber support staff — e.g. receptionist/helper, not commission-eligible). These two types are counted against **separate per-plan headcount caps** (see Subscription Tiers table): FREE = 1 barber / 0 staff, STARTER = 5 barbers / 1 staff, PLUS = 8 barbers / 3 staff, PRO = 15 barbers / 9 staff. Commission is not an available feature on FREE regardless of headcount.
- **✅ New `Employee` fields required by Payroll (Round 10):**
  - **`pay_type`** — `BASIC_PLUS_COMMISSION` / `COMMISSION_ONLY` / `DAILY_WAGE` (Round 10) / **`HOURLY`** (Round 12), chosen per employee. Both `BARBER` and `STAFF` can hold any of the four.
  - **`basic_salary`**, **`daily_rate`** and **`hourly_rate`** — only the one matching `pay_type` is used. Store rate changes with an **effective date**, so a past payslip is not silently rewritten by a raise.
  - **⭐ `HOURLY` (Round 12) — pay = hours worked × hourly rate.** This was added deliberately after the gap was raised: attendance was capturing hours that no pay type consumed. It changes the weight of the attendance table considerably — see below.
  - **`email` — now REQUIRED**, because Round 10 delivers payslips by email. This is a change from the current model: an employee record can be created today without one. Existing records need it back-filled before the first payroll run, and `meikigo-merchant` should warn before the run rather than fail during it. An employee genuinely without an email address falls back to the merchant downloading their payslip PDF.
  - Statutory identifiers the payslip and EPF/SOCSO calculations need (IC number, EPF and SOCSO membership numbers, and a bank account if the merchant wants it printed) — none of which Meikigo transmits anywhere, but all of which belong on a compliant payslip.
  - ⚠️ **These fields make `Employee` a personal-data record in a way it was not before** — salary, IC and bank details are more sensitive than a name and a phone number. It stays inside `meikigo-merchant` under the existing Admin-only role split, and it is worth being deliberate that Cashiers never see it.
  - **✅ THE FULL IC NUMBER IS SHOWN, NOT MASKED (Round 15).** Recorded as given: *"Show the full IC. It is the owner's own staff."* So no masking, no reveal button, no extra log. The reasoning holds within its own frame — the merchant is the employer, the data is their own staff's, and they typed it in.
    - **What this means for the build:** one less control to write, and one more reason the existing boundaries must actually be enforced. **Admin-only visibility is now the whole protection**, so it has to be real: the Cashier role must not reach the payroll tab, and the API must reject the request rather than merely hiding the field in the UI.
    - **This does not extend to Meikigo staff.** `meikigo-admin` access to employee records stays under the Round 8 reason-gate and the audit log; "the owner's own staff" is an argument about the *merchant*, not about the platform's support team.
- This headcount cap is distinct from the **account login cap** (`UserAccount` rows for Admin/Cashier) — an Employee record does not need a login to exist, and the login cap governs who can actually authenticate into `meikigo-pos-native`, not how many barbers/staff a Brand can register.

### One Outlet Per Employee
- An employee (barber) belongs to **exactly one Outlet** — strictly, not a technical limitation but an intentional product boundary (Meikigo is barbershop-first, not a freelancer/multi-branch floating platform). This also underpins the "up to X barbers per outlet" pricing tiers.
- If a barber moves branches, create a **new** Employee record at the new Outlet rather than reassigning.
- **✅ ⭐ RE-ASKED AND CONFIRMED (Round 17): the barber STARTS FRESH at the new branch.** Recorded as given: *"Leave it. He starts fresh at the new branch."* Linking the new record to the old one so that ratings and review count carry over was offered and declined, as was allowing the Employee record itself to move between Outlets of the same Brand (which would have reversed Round 11B).
- **What that costs, stated so it is a decision and not a surprise:** a senior barber with 300 reviews and 4.8 stars arrives at the new branch as a new barber — no score, no review count, and **hidden from the public rating until he collects 5 fresh ratings** (Round 15). He will notice, and the shop will hear about it. The counter-argument — that the ratings belong to the barber rather than to the building — was put and rejected.
- **Everything else was always separate and remains so:** commission, payroll, attendance and transaction history belong to the Outlet's record and do not follow him either.
- **Recommended, and it changes nothing structurally: keep the old Employee record deactivated rather than deleted** (which the offboarding rules already require), so the old branch's history stays intact and a future decision to link the two records is still possible.

### Barber Scheduling & Availability
- **Managed by:** Merchant admin
- **Barber involvement:** None - barbers don't interact with scheduling in the app
- Barbers can take breaks (managed by merchant admin)

**✅ Resolved (Round 6) — all four scheduling inputs are configured by the MERCHANT.** Booking availability for future dates was defined as "business hours, minus booked slots, limited by daily capacity, respecting lunch breaks, off-days and public holidays" with no source for any of it. The answer is: the merchant configures all of it.

- **Working hours: per barber.** Ali can work 10–6 while Ben works 12–8, within the Outlet's business hours. (Per-barber hours are the only reading consistent with "all of this configured by merchant" plus per-barber capacity and per-barber pricing.)
- **Lunch breaks:** merchant-configured per barber.
- **Off-days:** merchant-configured. **Recommend supporting both shapes**, since shops use both: a **repeating weekly pattern** (every Monday off) *and* **specific dates** (a wedding on the 14th). Weekly-only forces the merchant to enter recurring days by hand forever; date-only cannot express a normal roster.
- **Public holidays: entered by the merchant.** Meikigo ships **no** holiday calendar.
  - **✅ ⭐ RE-ASKED AND CONFIRMED (Round 17): *"B"* — every Outlet types its own.** Shipping a Malaysian holiday list by state, copied into each outlet as an editable starting point — the same pattern the EPF and SOCSO tables use — was offered and declined.
  - ⚠️ **The consequence, recorded because attendance and payroll both depend on this list:** roughly 15 dates typed by hand, per Outlet, every year, forever. It is the kind of job that does not get done, and when it is not done the slot generator offers bookings on days the shop is shut and the attendance roster marks a holiday as an absence.
  - **So the two recommendations below are load-bearing rather than nice-to-have:** make bulk entry easy, and **remind the merchant each December** that next year's list is empty. The reminder is one scheduled email and it is the cheapest available mitigation.
  - This neatly sidesteps the state-specific problem: Malaysian public holidays differ by state, so a single national list would have been wrong for some Outlets anyway. Letting each merchant enter their own is both simpler and more correct.
  - Recommend the holiday list is held **per Outlet** (not per Brand), since a Brand with branches in Johor and Kepong genuinely closes on different days.
  - Recommend the UI makes bulk entry easy (a year's dates at once) — a merchant asked to enter holidays one at a time will not do it, and the slot generator will then offer bookings on days the shop is shut.
- **Interaction to respect:** an Outlet's **business hours** remain the outer bound — a barber's configured hours cannot extend past the Outlet's, and the queue is only active during business hours (Round 3). Barber hours narrow the window; they never widen it.
- **Ad-hoc unavailability is separate and already specified:** a barber going unavailable mid-shift (sick, missing) is the existing available/unavailable status change, which triggers round-robin redistribution of today's live queue and cancel-and-notify for future bookings. Scheduling config is the planned picture; the status flag is the exception.

### Barber Performance Metrics
- Add a dedicated **`BarberStatistic`** table (aggregated fields, not computed live on every read) — this is the more industry-standard approach for this scale vs. live-querying Transaction/Review records on demand.
- **Customer-facing use:** exposed so customers can choose which barber they want; Organisation can also use these metrics to differentiate pricing per barber.
- **Internal use:** performance/KPI tracking and success rate to determine bonuses.
- Metrics include: customer count, ratings, avg processing time.
- **Resolved (Round 2) — the rating metric is kept, and fed by a dedicated barber rating.** The Round 1 conflict (reviews being Outlet-level left `BarberStatistic.rating` with no source) is settled by **adding a second, separate 1-5 barber rating to the post-payment review submission**, alongside the Outlet review — rather than dropping barber ratings. This preserves both documented use cases: customers choosing a barber by rating, and the Organisation differentiating pricing per barber.
- Barber ratings inherit the same **two-way anonymity** rule as Outlet reviews — the barber must not be able to see which client rated them.

### Barber Specialization / Skills
- ~~**Supported:** No - all barbers can perform all services~~ — **⚠️ SUPERSEDED (Round 7).**
- **✅ Resolved (Round 7) — the merchant assigns SKILLS to each barber (which services they can perform), and that is reflected to the customer.**
- Why this became necessary: it was safe to say "everyone does everything" while the system auto-assigned barbers. Now that Round 6 made barber selection **mandatory**, a customer can otherwise pick a junior for a colouring the junior cannot do — and the shop has to correct them at the counter, which is exactly the friction that removing "no preference" was meant to avoid.
- Behaviour: **the barber picker only offers barbers who can perform the selected service(s).** With a barber chosen per service line (Round 6), the filter applies **per line** — so a haircut + colouring ticket may legitimately offer a different set of barbers for each line.
- Implementation notes:
  - Model as a **many-to-many between `Employee` and `Product`/service**, merchant-editable per barber.
  - **Default a new barber to "can do everything"** rather than nothing — otherwise a merchant who skips this screen ends up with a barber nobody can book, and the failure is silent.
  - Combined with Round 7's per-barber queue, the availability rule at selection time is: *can perform this service* **and** *not off/on break* **and** *under daily capacity*.

### Staff Rotation & Leave Handling
- If barber becomes unavailable during work (sick, leave, missing):
  - Merchant admin sets barber to unavailable
  - **Clients waiting in today's live queue** assigned to that barber are **redistributed across the remaining available barbers by round-robin** — "fairly" is resolved to mean round-robin, not load-balancing by each barber's current queue length
  - No manual intervention needed from clients

### Barber Unavailable — Future Bookings (Round 3)
Future bookings are handled differently from the live queue: those clients chose that specific barber and are not in the shop, so they are **not** silently reassigned. When a barber with existing bookings is marked unavailable:

1. **An email is sent automatically to every affected client** (see Customer Webapp → Outbound Email for the full list).
2. **The email contains a link letting the client cancel the booking themselves.** *(Revised in Round 5 — see below.)*
3. **The manager may also contact affected clients manually** (phone) on top of the email.

- **⚠️ Revised (Round 5) — the link offers CANCEL only, not reschedule.** Round 5 removed reschedule from the product entirely (see Client Self-Service on Bookings): a client who wants a different time cancels and books again through the normal flow. This supersedes Round 3's framing of this email as introducing reschedule as a first-class capability.
- The link still **requires login** (Round 4) — it is not a direct-acting token.
- **Temporary unavailability vs. resignation are two different flows.** This section covers a barber who is temporarily unavailable (sick, leave, missing) and whose bookings the *client* is asked to deal with. A barber who **leaves the shop permanently** is handled by the merchant instead — the Admin cancels the affected bookings with a compulsory reason (see Employee Offboarding below).

### ⭐⭐ Settings changed AFTER a booking already exists — ✅ Resolved (Round 16)
**Two new rules, and they share one principle: a booking is a promise the shop already made, so a settings change never breaks it silently.** This completes a family of rules that previously covered only the barber leaving.

#### A service is withdrawn while people have booked it
**Recorded as given:** *"The bookings stay and are honoured. The service is hidden from new bookings only. The owner sees a warning first: '3 customers have booked this service.' But the outlet can manually call the customer and cancel the booking manually."*

- **Existing bookings stand and are served.** Deactivating a service (or a product) removes it from the **booking flow and the POS catalogue for new sales only**. Nothing already booked is cancelled, and nothing is cancelled automatically.
- **The owner is warned before the change**, with the count and the ability to see who: *"3 customers have booked Hair Colour. They will still be served. New bookings will not be offered."* A silent deactivation is how a shop discovers on Saturday that it has three customers booked for something it no longer offers.
- **⭐ If the shop does not want to honour them, an Admin cancels each booking by hand** — using the existing cancellation path with its **compulsory reason**, which emails the customer (Round 5). The merchant's own words: *"the outlet can manually call the customer and cancel the booking manually."* So the phone call is the courtesy and the cancellation is the system record.
- **The price is unaffected** — a booking already snapshots its price (Round 12), so a withdrawn service is still served at the price agreed when it was booked.
- **The service record is never deleted**, only deactivated, exactly as Product Status already requires: past transactions and live bookings both still reference it.
- **A barber's skill list works the same way.** Removing a service from a barber's skills stops new bookings being offered against them, and does not touch bookings already held.

#### Business hours are shortened past an existing booking
**Recorded as given: *"A"*.** The shop used to close at 9pm, a customer holds an 8:30pm booking next Friday, and the owner changes closing time to 7pm.

- **Nothing is cancelled automatically.** The system **shows the owner exactly which bookings now fall outside the new hours** — customer, date, time, barber, service — and asks them to choose, booking by booking: **keep it**, or **cancel it with a message to the customer**.
- **Keeping it is a legitimate outcome and often the right one.** An owner shortening their hours from next month may well intend to stay late for three people who booked before the change. Cancelling for them would be the system overruling a decision the owner never made.
- **Cancelling uses the same path as always** — compulsory reason, email to the customer (Round 5) — so there is one cancellation mechanism in the product, not a special one for this case.
- **New bookings immediately respect the new hours**, from the moment the change is saved.
- **The same check applies to any change that can orphan a booking:** an added public holiday, a barber's off-day pattern changed, a barber's working hours narrowed, or an Outlet's last-queue-number cutoff moved earlier.

#### ⭐⭐ ONE SHARED "AFFECTED BOOKINGS" SCREEN — ✅ Resolved (Round 17)
**Recorded as given:** *"Build one shared screen that every one of those settings uses."* Round 16 recommended it; Round 17 makes it the requirement. Handling each setting separately is how one of them quietly ships without the check and a customer turns up to a closed shop.

- **It is one shared component with one contract:** a settings screen hands it *the change about to be made*; it returns *the bookings that would be orphaned* and *the owner's decision for each one*.
- **Every setting that can orphan a booking routes through it, and the list is closed rather than illustrative:**
  - withdrawing a service, or deactivating a product
  - removing a service from a barber's skill list
  - shortening the Outlet's business hours
  - adding a public holiday
  - changing a barber's off-day pattern, or adding a specific off-date
  - narrowing a barber's working hours, or moving their lunch break
  - moving the last-queue-number cutoff earlier
  - reducing a barber's daily capacity
  - deactivating an Outlet
  - a barber's permanent offboarding (Round 5), which today has its own bespoke path and should use this one
- **What it shows, every time:** customer name and contact, date and time, barber, services, the booking's snapshot price, and one line saying how the change affects it. Sorted soonest-first, because those are the ones that matter today.
- **What the owner can do, every time:** **keep** each booking, or **cancel** it with the compulsory reason that emails the customer (Round 5). **Keep all / cancel all** for a long list, and the default is **keep**.
- **⚠️ It runs BEFORE the change is saved, never after.** This is the requirement that makes it worth building at all — a warning that appears once the hours are already changed leaves the owner to remember what they just did. The setting change and the per-booking decisions are committed together, as one action.
- **Nothing is ever cancelled automatically, in any of those cases.** That single principle is why there is one screen and not ten behaviours.
- **When nothing is affected, the screen does not appear** and the change simply saves. Most changes affect nothing, and a confirmation step that is usually empty gets clicked through on the day it finally is not.
- **Recommended: it is also the natural home for the count-only warning** Round 16 specified for service withdrawal — *"3 customers have booked this service"* — so there is one warning shape in the product rather than two.
- ⚠️ **This must run BEFORE the change is saved, not after.** A warning that appears once the hours are already changed leaves the owner to remember what they just did.

### Employee Offboarding / Resignation (Round 5)

When a barber or staff member leaves the shop, three separate concerns apply, and the merchant set a hard rule on the first of them.

**1. Records, pay and commission — governed by law, not by product convenience**
- **⚠️ Merchant's strict instruction (Round 5), recorded verbatim in substance: anything touching payment, the employee record, or salary must comply with accounting standards and Malaysia's Employment Law, especially for audit purposes. This is a rule to respect and follow, not a preference to trade off.**
- Consequences that follow directly from it:
  - The `Employee` record is **deactivated, never deleted.** Hard deletion of an employee who has appeared on a payslip, earned commission, or been attached to a transaction is not permissible — it would break both the audit trail and the statutory record-keeping obligation. This is consistent with the existing "hard deletion is forbidden for anything tied to a financial record" rule.
  - **Retention is statutory, not indefinite-by-default:** employee registers/records must be retained under the Employment Act 1955, and tax-relevant records are generally expected to be kept for **7 years** under the Income Tax Act 1967. The retention period should be recorded as a policy value rather than left implicit.
  - **Outstanding commission stays visible until it is paid**, and remains attached to the deactivated employee. Deactivation must not hide or zero an unpaid liability — the payroll module must still be able to produce that person's final payslip after they have left.
  - Historical `BarberStatistic` data and past transactions naming the employee remain intact and remain reportable.
  - Implementation note: this means **deactivation is a status change plus an end-date**, and every downstream query needs to distinguish "not currently assignable" from "did not exist" — a deactivated barber must still resolve for historical reporting, payroll, and audit, while being excluded from queue assignment, booking availability, and the customer-facing barber list.

**2. Their future bookings — cancelled by the Admin, with a mandatory reason**
- **Resolved (Round 5) — the system allows the Admin to cancel the booking, and the cancellation reason is COMPULSORY.** The Admin cannot cancel without typing one.
- **The client is informed by email AND in-app notification**, carrying that reason (see Outbound Email).
- Bookings are **not** silently reassigned to another barber — the client chose that specific person. Cancel-and-inform is the flow; the client re-books if they want to (there is no reschedule).
- The compulsory reason is a genuine product requirement, not a nicety: it is the only explanation the client ever receives, and it is what makes a merchant-initiated cancellation auditable and distinguishable from a client-initiated one.

**3. Headcount against the plan cap**
- **Resolved (Round 5) — a resigned employee frees one slot against the plan's headcount cap: the number of active employees that can be added increases by 1.**
- **Strictly conditional on deactivation actually happening in the system.** The slot is freed **only after** the `Employee` record is deactivated — a barber who has left in real life but is still marked active continues to consume their slot. Enforcement counts **active** Employee records, per type (`BARBER` / `STAFF`), against the plan cap.
- This mirrors the Organisation Member rule (removal immediately frees a slot) and is the counterpart to the downgrade rule (excess must be manually deactivated before a downgrade proceeds).
- Note the interaction with the existing **"one Outlet per Employee"** rule: a barber moving between branches of the same Brand is already modelled as *deactivate at the old Outlet, create a new record at the new one*. The Round 5 rule makes that clean — the old record's deactivation frees the slot that the new record consumes.

---

## Outlet Closure & Deactivation (Round 5)

Covers both cases the merchant treated identically: a branch that shuts down for good, and an Outlet deactivated because the Brand downgraded to a plan with a lower outlet cap.

### Live tickets and future bookings
- **Resolved (Round 5) — everything at that Outlet is closed out. Queue tickets and future bookings are CANCELLED**, and **every affected client is emailed** that the Outlet is closing and their booking has been cancelled (plus an in-app notification — see Outbound Email).
- ⚠️ **This is the one deliberate exception to "tickets already issued are always honoured."** That rule (Round 3) exists to stop the shop truncating its own queue at closing time; it cannot apply to an Outlet that no longer exists. Worth stating explicitly in the merchant UI, since the merchant is being asked to break a promise the product otherwise keeps.
- **Resolved (Round 6) — no effective-dating mechanism is required; notification is the mitigation.** The merchant's rationale, recorded as given: **a booking carries no payment**, so a cancelled booking costs the customer nothing but a wasted plan. When the merchant cancels their subscription or stops using Meikigo, affected booked customers are simply **notified**. There is no deposit to refund and no money to unwind, which is what makes cancel-and-notify acceptable here.
- Consequence accepted: closure/stop takes effect when the merchant triggers it, and every affected booking is cancelled and notified at that moment.
- **Recommended implementation courtesy (mine, not a merchant decision):** even without a formal closing date, let **services already in progress and today's live queue finish** where the Outlet is still physically operating — cancel forward-dated bookings, not the person in the chair. This costs nothing to build (it is a filter on which tickets get cancelled) and avoids the one genuinely bad outcome.

### The QR code
- **Resolved (Round 5) — the QR code stops working.** Booking is no longer possible through it.
- **✅ Resolved (Round 6) — the wording is softened and UNIFIED with the lapsed-subscription message.** The Round 5 phrasing ("the customer will see that the outlet will close") is superseded: the customer is **not** told the Outlet is closed. Approved wording is either of:
  > **"This outlet isn't taking online bookings at the moment."**
  >
  > **"Online booking isn't open for this outlet at the moment. Please contact the shop directly to book."**
- **Recommendation: use the second string everywhere**, since it is already the approved lapsed-subscription copy and it gives the customer a way through (shown with the Outlet's name and phone number). That collapses **one string for every "this Outlet can't take online bookings" state** — closed, deactivated by downgrade, or subscription lapsed — which is simpler to build, simpler to translate, and removes the risk of the wrong message appearing in the wrong state.
- This is what fixes the Round 5 flag: because a downgrade-driven deactivation reuses the closure path, a still-trading shop's customers would have been told their branch was "closed". Neutral shared copy is true in all three states.

### Reporting and history
- **Resolved (Round 5) — the closed Outlet's transaction history stays visible in reporting.** Nothing is hidden or purged; the Outlet's past sales continue to appear in Brand-level and HQ/cross-outlet reporting.
- Consistent with the platform-wide rules: financial records are never hard-deleted, and historical data survives a downgrade read-only.
- Implementation note: reporting must therefore handle an Outlet that is closed but historically present — the same "not currently active, but must still resolve historically" requirement as a deactivated Employee.

### Interaction with the downgrade flow
- The existing downgrade rule (the merchant manually selects which excess Outlets to deactivate before a downgrade proceeds) now carries **customer-facing consequences**: selecting an Outlet for deactivation cancels its live tickets and future bookings and emails those clients.
- The merchant must be shown this before confirming — i.e. the deactivation picker should state how many bookings and live tickets each candidate Outlet is holding, so the choice is made with the cost visible. A downgrade should not silently mass-cancel customer bookings.

---

## Loyalty Program

### Loyalty Models (Merchant Configurable)
Merchants can use one or multiple of these models:

1. **Purchase-based:** X cuts = Y free cut
2. **Referral-based:** Refer X people = Get X free cut
3. **Spend-based:** Spend X value = Get X free cut

### What a "Free Cut" Actually Is (Round 6)

The three models are written as *"5 cuts = 1 free cut"* while the rest of the system talks about **points**. Round 6 settles the mechanics.

- **✅ Both mechanisms exist (Round 6): punch card AND points balance.** This follows from merchants being able to enable more than one model at once:
  - **Punch card** — count qualifying visits; the Nth is free. Backs the purchase-based model ("5 cuts = 1 free cut").
  - **Points balance** — earn points per RM spent, redeem against a reward. Backs the spend-based model.
  - Both must therefore be modelled, and a client can hold **a punch count and a point balance with the same merchant simultaneously**. The client's "point history"/"redemption history" views need to show both intelligibly.
- **✅ Redemption is presented as FULL PRICE PLUS A MATCHING DISCOUNT LINE (Round 6)** — not as a RM0 line item. So a redeemed RM30 haircut shows as `Haircut RM30` and `Loyalty redemption −RM30`.
  - This is the correct choice and worth explaining: it keeps the **service's real value visible** in revenue reporting (the shop can see it delivered RM30 of work), it makes the **cost of the loyalty programme measurable** as a discount total, and it keeps the **tax base explicit** rather than hiding a zero-rated line. A RM0 line would make all three invisible.
  - It also lines up with how ad-hoc discounts are presented (Round 6), so the receipt has one consistent pattern for "price reduced".
- **✅ Commission on a free cut: configurable by the merchant (Round 6).** The shop took no money but the barber did the work, so this is genuinely a business-model choice — some shops pay it, some don't. Note the interaction with the discount-line presentation: whether commission is computed on the **gross** line (RM30, barber paid in full) or the **net after redemption** (RM0, barber paid nothing) is exactly what this setting decides. Make that the wording of the setting, rather than an abstract toggle.
- **✅ Which service the free cut applies to: configurable by the merchant (Round 6).** A merchant can nominate the eligible service rather than the system always picking the most expensive line.
  - Recommend the setting offers both shapes, since merchants think in both: *"applies to a nominated service"* (e.g. only a standard haircut) and *"applies to the highest-value eligible line on the ticket"*. Without the second, staff will hand-pick the line and the rule becomes meaningless.
  - **Partial redemption** (already merchant-configurable) interacts here: if the free cut is worth less than the line it is applied to, the client pays the difference; if it is worth more, the excess is not refundable in cash.

### Referral Programme (Round 6)

Previously listed as one of three loyalty models with no mechanism behind it at all. Now defined, and **in scope for Phase 1**.

- **✅ Every customer gets their own referral code (Round 6)**, which they can share with friends. Code-based, not "type in your friend's phone number at signup".
- **✅ The referrer is credited when the friend registers AND completes a spend with successful payment (Round 6).** Both conditions — registration alone earns nothing, which is what stops the obvious abuse of farming signups.
- **✅ The referred friend also gets something, and the amount is configurable by the Brand/Outlet (Round 6)** — the merchant sets how many points a referral-joined client starts with. So the programme is two-sided, with the merchant controlling the joining bonus.
- Mechanics that follow and should be built explicitly:
  - The code needs capturing **at signup** (a "referral code" field on the registration form, optional), and the pending referral held until the friend's first successful payment triggers the credit to both sides.
  - **Referral scope follows loyalty scope** — points never cross Brands, so a referral code is a *merchant's* code, and a friend referred to Brand A cannot be credited at Brand B.
  - **Self-referral and obvious abuse need blocking**: same account, same phone number, and same-device/same-email-alias patterns. Given signup requires email OTP (or Google SSO), the cost of a fake referral is already non-trivial — but a one-per-new-account limit and a cap on referral credits per period are cheap insurance.
  - **Anti-gaming note worth stating:** because the credit only fires on a *paid* visit, the cheapest attack is a referrer bringing in fake accounts and paying for tiny transactions to unlock rewards. If the reward is a free cut, set a **minimum qualifying spend** on the friend's first visit — otherwise a RM5 purchase can unlock a RM30 cut.
  - Referral credits and joining bonuses should be **visible in the client's point history** with their source, so support can explain where points came from.

### Loyalty Points Management
- **Expiry:** Merchant configurable
- **Accumulation Cap:** Merchant configurable
- **Partial Usage:** Merchant can allow or disallow partial redemption
- **Cross-Service Loyalty:** Yes - loyalty points from hair cut can be used on other products

### Loyalty Identity — account-based
- **Resolved (Round 2) — loyalty belongs to a registered account.** Since guests no longer exist (see Client User Types), every client with points is a registered account holder. This settles the churn across rounds: the original "guest points are burned" rule and the Round 1 "loyalty keyed on a bare phone number" rule are both **superseded** — there is only one client type, and it always has an account.
- The **phone number remains the practical lookup key at the counter** (it is a field on the account), but it is no longer an identity of its own.

### Loyalty Scope — merchant-configurable, capped at Brand level
- **Resolved (Round 2) — the merchant decides how far their points travel**, choosing between a **single Outlet** and **all Outlets of their own Brand**.
- **Resolved (Round 3) — loyalty NEVER crosses Brands.** "All Outlets of my own Brand" is the widest possible setting. Points earned at one Brand can never be spent at another, so **no inter-merchant settlement or reimbursement model is needed** — this was chosen explicitly as the simpler option.
- Practical consequence: a loyalty balance is modelled per **client × (Brand or Outlet, per that merchant's setting)** — never as one global per-client number, and never as a cross-merchant liability.

### Points vs. a Plan Downgrade (Round 5)
- **✅ Fully closed in Round 6:** the one remaining route to a FREE Brand holding outstanding points — merchant cancellation — was removed. A cancelling Brand now stops/soft-deletes rather than reverting to FREE (see Cancellation & Data Retention). There is therefore **no path** by which a Brand's customers hold points the Brand cannot honour.
- **Resolved (Round 5) — the question is designed out: a Brand can never downgrade to FREE.** Once a Brand has subscribed to a paid plan, **STARTER is the downgrade floor** (see Upgrade / Downgrade). Because Loyalty is available from STARTER up, a subscribed Brand can never end up on a plan that cannot honour the point balances its customers are holding.
- So there are **no frozen points, no wiped points, and no settle-before-downgrade step** — the scenario cannot arise through a downgrade.
- ~~⚠️ One route to a FREE Brand with outstanding points does still exist…~~ — **closed (Round 6): cancellation no longer reverts a Brand to FREE.**

### Prepaid Packages & Gift Vouchers — deferred (Round 7)
- **✅ Resolved (Round 7) — prepaid service packages ("10 cuts for RM250") and gift vouchers are both wanted, but NOT in this phase.** Recorded so the intent is not lost.
- **One design constraint to carry forward, because it is the expensive part:** money taken upfront for services not yet delivered is **deferred revenue** — a liability, not revenue on the day it is received. It is recognised as revenue progressively, as each cut is used.
  - Practical implication for the accounting module being built now: its ledger model should be able to hold a **liability balance per customer** later, rather than assuming every payment is immediately revenue. Designing that in now is cheap; retro-fitting it into a live ledger is not.
  - The same applies to a gift voucher: the shop holds the customer's money until the voucher is redeemed.
- Also worth noting for when this lands: a package interacts with loyalty (does a prepaid cut earn points, or was the point-earning already banked at purchase?) and with commission (does the barber earn on the day the cut is delivered, or when the package was sold?). Neither needs answering now.

### Loyalty Redemption Timing & Mechanics
- **When:** After payment success — not at queue time and not before service.
- **Resolved — the cashier applies redemption, not the client.** The client does not select or apply point redemption inside `meikigo-customer-webapp` before checkout. At the POS, the **cashier looks the client up (phone number, username, or email)** and applies the redemption on the client's behalf.

---

## Subscription & Billing

### `SubscriptionLine`
- `SubscriptionLine` is the join/information entity between **Brand** and **SubscriptionPlan** — it exists specifically to avoid a many-to-many relationship between Brand and Plan.
- A new `SubscriptionLine` row is created **every month per Brand** for tracking. At the start of each cycle it's created with status `PENDING`.
- The dead-code path (`SubscriptionImplementation.subscribePlan()`) that properly persists a `SubscriptionLine` reflects the **intended** behavior — the live `/newsubscription` endpoint (which ignores `brandid` and never writes a `SubscriptionLine`) needs to be fixed to always persist a `SubscriptionLine`, regardless of which payment gateway path is used.

### Subscription Status Lifecycle (`EnumSubscriptionStatus`)
- `PENDING` → created automatically at the start of each monthly cycle **for paid tiers** (STARTER/PLUS/PRO).
- `PENDING` → `ACTIVE`: automatic once the merchant pays.
- `PENDING` → `EXPIRED`: if the merchant hasn't paid by the 10th day of the month (configurable in `applicationsetting`).
- → `CANCELLED`: if the merchant clicks cancel subscription.
- When a Brand's subscription is `EXPIRED`, the Brand/Outlets go **read-only** — merchant staff can view data in `meikigo-pos-native`/back-office but cannot write anything (no new queue entries, product edits, etc.) until payment resumes.

#### What Read-Only Actually Means in Practice (Resolved, Round 3)
Renewal is attempted at **midnight**. If it fails, the lockout is deliberately *not* total — the shop must still be able to honour commitments already made to customers:

- **Payment is exempt from read-only — but scoped.** **Resolved (Round 4): payment is enabled only for bookings made *before* the lapse.** The exemption exists purely so the shop can close out commitments already made to customers; it switches off once those are served. It cannot be used to keep trading indefinitely without renewing.
- **Bookings made before the lapse are still honoured.** The client can still see their booking details and turn up and be served as normal.
- **New bookings are blocked.** A customer scanning the QR after the lapse cannot book.

##### Customer-facing messaging on a lapsed Brand's QR (Resolved, Round 4)
The wording matters and is constrained on **both** sides:
- **Do not say "not available" / show an error state** — that reads as though Meikigo is broken, and the fault is not Meikigo's.
- **Do not disclose or imply non-payment** — the merchant must not be shamed to their own customers for an unpaid subscription.
- So the message must be **neutral**: it should indicate that online booking is not open for this Outlet right now and point the customer to contact the shop directly, without attributing the cause to either party.
- **✅ Resolved (Round 5) — copy APPROVED as proposed. Final wording is:**

  > **"Online booking isn't open for this outlet at the moment. Please contact the shop directly to book."**

  Displayed together with the **Outlet's name and phone number**, so the customer always has a way through to the shop.
- This is now the canonical string for a lapsed Brand's booking page — it satisfies both constraints (no error state implying Meikigo is broken; no disclosure or implication of non-payment) and is not to be re-worded during implementation without a fresh decision.
- Note the deliberate difference from the **Outlet closure** message (see Outlet Closure & Deactivation): a lapsed Brand is still trading and must not be described as closed.

**Worked example (from the merchant):** Abu Barbershop's subscription ends 30 July.
- Ali books on 29 July for **31 July** → Ali keeps full visibility of the booking and gets his haircut normally on the 31st.
- Amin tries on 1 August to book for 5 August → Amin sees a blank/contact-the-shop state; he cannot book.
- Renewal runs at midnight on the 30th and fails. From 1 August, Abu can still log in, but the system is **read-only except the payment function** — so he can close out the customers who already booked, and nothing else, until he renews.
- `FREE` is not a billed cycle — it doesn't generate monthly `PENDING` rows requiring payment; a Brand on `FREE` simply stays `ACTIVE` indefinitely at that plan's (reduced) limits, no charge involved.
- **Resolved — no non-payment-related suspension:** Meikigo is a third-party platform, not connected to or acting on behalf of any regulatory/authority body (e.g. SSM). Read-only/lockout is triggered **only** by a payment issue (unpaid `EXPIRED` `SubscriptionLine`) — Meikigo will never suspend an Organisation or cascade a lockout across its Brands due to an external issue like an SSM registration problem.
- **Resolved:** a Brand that stays `EXPIRED` on a paid tier long-term does **not** auto-fall-back to `FREE`. It remains read-only indefinitely until the merchant settles the outstanding unpaid invoice. The merchant only needs to settle the invoice for the cycle they stopped paying (not every intervening month) — e.g. if payment lapsed in June and the merchant only returns in December, they settle June's invoice and resume from December; no `SubscriptionLine` records are generated for the gap months (July–November). Once settled, the Brand reactivates read-write immediately, and the merchant may switch to any other plan right away — settling the outstanding bill is a hard prerequisite, but there is no additional "wait until next cycle" delay imposed on top of it.

### Cancellation & Data Retention
- ~~**Resolved:** when a merchant explicitly cancels (`CANCELLED`) … the Brand **reverts to the `FREE` plan** (read-write, at FREE's caps)~~ — **⚠️ SUPERSEDED (Round 6). A cancelling Brand does NOT revert to `FREE`.**
- **✅ Resolved (Round 6) — the contradiction is closed: once a Brand has upgraded to any paid plan, it can never return to `FREE` by any route.** In the merchant's own framing there was never a conflict — `FREE` is a plan a merchant may sit on **as long as they like before paying**, but after any paid subscription the only two end states are:
  1. **Unsubscribed/stopped** (`CANCELLED`) — the merchant has chosen to stop using Meikigo. The Brand's data is soft-deleted (never hard-deleted, never purged) and the Brand does **not** land on a usable FREE plan.
  2. **Not paid** (`EXPIRED`) — read-only until the outstanding invoice is settled, exactly as already specified.
- What this cleans up:
  - The loyalty hole is closed. A Brand can never end up operating on a plan without the Loyalty feature while its customers hold point balances, so no freezing, wiping or settlement step is needed (see Loyalty → Points vs. a Plan Downgrade).
  - `FREE` is confirmed as a **never-paid entry tier only** — reachable at Brand creation and at the end-of-`FREETRIAL` paywall, and never again afterwards. Both routes back to it (downgrade and cancellation) are closed.
  - Cancellation is now genuinely an exit, not a cheap downgrade. The commercial consequence is deliberate: a merchant who cannot afford STARTER has no reduced-tier landing spot — they stop.
- **✅ Resolved (Round 9) — reactivation is SELF-SERVICE.** Recorded as given: *"A, but by LHDN law, the time limit is up to 7 years. so we need to maintain the data within that time period"*.
  - The owner signs in to their cancelled Brand, sees a **reactivate** prompt, picks a paid plan, pays, and **everything is restored exactly as they left it** — outlets, staff, catalog, customers, loyalty balances, history. No support ticket, no fresh signup, no re-entry of Organisation/SSM data.
  - This is the cheapest sale in the product: a shop that already knows how to use it, whose data is already there.
  - **No time limit on reactivation.** The 7 years in the answer is the *retention floor* imposed by LHDN, not an expiry on the merchant's ability to return — and since the retention policy is "never purge" (below), the data outlives any window that could have been imposed. A Brand cancelled in 2026 can reactivate in 2036 and find its records intact.
  - Implementation notes: reactivation **restores from soft-delete rather than creating anything new**, so IDs, historical transactions and customer links all survive.
  - **✅ Resolved (Round 22) — subscription downgrade enforcement: the downgrade takes effect at the end of the current billing period.** Before the new plan activates, the merchant must reduce their barbers/staff/logins to fit the new plan's caps. If they don't, the system goes **read-only** until they do — consistent with the existing `EXPIRED` read-only behaviour. Nothing is silently deactivated or deleted.
- **✅ Resolved (Round 22) — resubscription after cancellation is SELF-SERVICE (reconfirmed).** The owner picks a new plan and everything is restored.
- **✅ Resolved (Round 10) — when the restored data exceeds the new plan's caps, the Brand comes back READ-ONLY.** A shop that had 8 outlets on PLUS and reactivates on STARTER (4 outlets) can see everything but cannot trade until they either **upgrade** or **deactivate outlets down to the cap**. Nothing is deleted and nothing is silently switched off; the choice stays with the merchant.
    - This reuses the `EXPIRED` read-only behaviour that already exists for unpaid invoices, so it is a state the product understands rather than a new one.
    - The reactivation screen should say plainly what is over the limit — *"You have 8 outlets. STARTER allows 4."* — with both routes offered side by side.
    - The same rule applies to every capped resource, not just outlets: barbers, staff, logins and SKUs.
  - Any add-ons still billing separately (see Add-ons) must be reconciled at reactivation rather than silently resumed.
- **✅ Resolved (Round 4, reconfirmed Round 9) — cancelled-merchant data is retained indefinitely: it is NEVER purged.** Round 9 chose this explicitly over the alternative of anonymising dormant personal data after a fixed period. There is no retention window and no scheduled deletion job; soft-deleted Brand data simply persists.
  - **The statutory floor and the policy are two different things, and it is worth keeping them separate in anyone's head:** LHDN expects financial records to be kept for **7 years** — that is the minimum Meikigo *must* hold. "Never purge" is Meikigo's own policy of holding them longer. The first is an obligation; the second is a choice, and only the second needs justifying to anyone.
  - **What this means in practice:** storage grows monotonically (entirely fine at this scale), and a cancelled Brand's customers — people who never had a relationship with Meikigo, only with a barbershop that closed — keep their names, phone numbers and visit history in the database indefinitely.
  - ⚠️ **The exposure, stated once and then left as decided.** PDPA expects personal data not to be kept longer than necessary for the purpose it was collected for, and "in case the merchant returns" is a purpose that weakens with time. The choice was made knowingly, so this is not a re-litigation — but three things follow that should be *done* rather than debated:
    1. **The position must be stated plainly in the merchant terms-of-purchase** (Round 9's Q1 outcome) and in the client privacy notice. Retention that is disclosed is a far better position than retention that is discovered.
    2. **The customer's own deletion path still works and must keep working** (Round 5). An individual can have their personal data removed on request regardless of what their barbershop did — that path is the pressure valve that makes indefinite merchant-side retention survivable.
    3. **Reason-gated staff access (Round 8) is what makes it defensible.** Retention plus unrestricted staff read access is the combination a regulator would object to; retention plus logged, justified access is a much narrower target.
  - **Revisit trigger, so this does not silently age:** any launch outside Malaysia. GDPR-style regimes do not accommodate indefinite retention of a third party's personal data on this reasoning, and the anonymise-after-dormancy design (keep the financials, drop the identifiers) is the ready-made answer if it is ever needed.
- **✅ Resolved (Round 22) — a concrete retention schedule replaces the blanket "never purge" for non-financial data.** The "never purge" commitment continues to apply to financial/transaction data (7-year statutory minimum, held indefinitely). For other categories: **marketing consent + blast lists: deleted on cancel or after 12 months post-cancellation**; **support tickets: 3 years**. This schedule must be stated in the Merchant Agreement and privacy notice. Financial data is the only category that survives indefinitely by design.

### FREETRIAL → FREE Transition
- Every new Brand is automatically subscribed to `FREETRIAL` on creation (see Business Flow) for **14 days** (configurable in `applicationsetting`). **✅ Reconsidered and kept at 14 (Round 18).** Round 18 asked directly whether two weeks — one payroll cycle short, only two Saturdays — is long enough to show a barbershop owner a real month-end. **Recorded as given:** *"B"* — 14 days stands. Extending to 30 was offered and not taken.
- `FREETRIAL` grants **PLUS-equivalent feature access** during that window.
- **Resolved:** when the 14-day trial ends, the Brand is **not** silently auto-converted to anything. The merchant is shown a **required paywall** and must actively select one of the four real plans — `FREE`, `STARTER`, `PLUS`, or `PRO` — before continuing; this is a blocking selection step inside **`meikigo-merchant`** (the merchant back-office), not a background transition or something shown on the marketing site/`meikigo-admin`. `FREETRIAL`'s purpose is purely to let the merchant "taste" the full PLUS-equivalent product before committing to a tier.
- Once the merchant selects a plan (including `FREE`), the Brand moves onto that plan read-write. Selecting `FREE` specifically lands on an active `FREE` plan (read-write, not `EXPIRED`/read-only) — a real, permanent, indefinitely-usable plan, just with a reduced feature/quota set (see table below).
- **Resolved (Round 4) — while the paywall sits unresolved, the Brand is READ-ONLY.** A merchant whose trial has ended and who has not yet picked a plan can view their data but cannot operate, exactly as with an unpaid `EXPIRED` Brand.
- A Brand cannot re-enter `FREETRIAL` after it has ended (see Organisation → Brand → Outlet rules above).
- **✅ ⭐ A `FREETRIAL` BRAND CANNOT BUY ADD-ONS OR AN EMAIL PACKAGE (Round 16).** Recorded as given: *"A"*. No extra outlets, barbers, staff, logins, catalog packs or marketing volume during the trial — the merchant picks a paid plan first, and then buys.
  - **Why this is the right restriction:** a trial exists to let someone taste the product before committing, and a trial that quietly accumulates charges is a billing argument rather than a trial. It also removes an awkward case entirely — what happens to a paid add-on when the trial ends and the merchant chooses `FREE`, which can hold no add-ons at all.
  - **What the merchant sees:** the add-on and marketing screens are visible but the buy button is disabled, with one line saying a plan must be chosen first. Hiding the screens would hide half of what they are trialling.
  - **`FREETRIAL` still grants PLUS-equivalent *feature* access** — this restricts *purchases*, not features. A trialling merchant can send blasts only if they have a package, and they cannot buy one, so **blasts are effectively unavailable during the trial**; that is the honest consequence and worth stating on the blast screen rather than leaving them to discover it.

### Upgrade / Downgrade
- **Upgrades** can take effect two ways, merchant's choice:
  1. **Wait for next cycle** — new plan takes effect on renewal, no proration.
  2. **Instant upgrade** — takes effect immediately; cost of the new plan is prorated by dividing by the remaining days in the current cycle.
- **⚠️ Resolved (Round 5) — STARTER is the downgrade floor. A Brand that has subscribed to a paid plan can NEVER downgrade to `FREE`.** Permitted downgrades are PRO→PLUS, PRO→STARTER, PLUS→STARTER. `FREE` is not a selectable downgrade target at any point after a paid subscription begins.
  - `FREE` therefore remains reachable in only two ways: as an **initial choice at the end-of-`FREETRIAL` paywall** (a Brand that has never paid may still pick FREE), and via the **cancellation** path below — which is why that path now needs revisiting.
  - Product consequence: `FREE` is best understood as a *starter/never-paid* tier, not a fallback tier. A merchant who cannot afford STARTER has no downgrade route — their only options are to keep paying STARTER or to cancel. That is a deliberate commercial choice (it protects the paid floor), but it is worth knowing it makes cancellation the churn path rather than a graceful step down.
  - Enforcement: the plan-selection UI must hide/disable `FREE` for any Brand with a paid `SubscriptionLine` in its history, and the API must reject a FREE downgrade rather than relying on the UI.
- **Downgrades only ever take effect at the next billing cycle** — there is no instant/prorated downgrade path, since it would require immediately kicking outlets/logins out mid-cycle.
- If the downgrade target's outlet cap is lower than the Brand's current active outlet count (e.g., PLUS→STARTER going from 8 active outlets to a 4-outlet cap), **the merchant must manually select which excess outlets to deactivate before the downgrade is allowed to proceed** — the system does not auto-select.
- The same manual-deactivation rule applies to account logins and Barber/Employee headcount: if the downgrade target's cap is lower than the Brand's current count of any of these, the merchant must manually disable the excess before the downgrade proceeds.
- **Resolved:** the same manual-selection rule also applies to the Product SKU / Service SKU catalog caps — if downgrading drops the Brand below its current SKU count, the merchant must manually pick which SKUs to deactivate before the downgrade proceeds. Excess SKUs are never auto-archived by the system.
- **Add-on cancellation** follows the same timing as a plan downgrade — dropping a purchased add-on (extra outlet/barber/employee/login/catalog slot) takes effect at the **next billing cycle**, not immediately.
- **Yearly commitments (base plan or add-on) cannot be downgraded mid-term.** Upgrading mid-term is allowed — the merchant pays the price difference between the old and new plan/add-on for the remaining months left in the committed term (not just the current cycle), **prorated by day** (confirmed — not rounded to full months). Example (illustrative figures only): a Brand on STARTER (RM100/mo) upgrades to PRO (RM200/mo) partway through a term already billed through December — the merchant pays the RM100/mo difference for each remaining committed month (e.g. October–November = RM200 additional), on top of continuing to pay PRO's rate going forward.
- **Resolved:** the same day-based proration also applies to the standard (non-yearly-commitment) **instant upgrade** path within a single monthly cycle — cost of the new plan is prorated by day across the remaining days of the current cycle, not rounded.
- **Resolved:** an instant/prorated mid-cycle upgrade also **resets the billing anniversary** — the next renewal date becomes the upgrade date going forward, it does not stay anchored to the Brand's original signup day.
- **✅ Resolved (Round 26) — HitPay sequencing for an instant upgrade:** take a **one-off** HitPay charge now for the prorated difference; **cancel** the old Recurring Billing subscription; **create a new** subscription on the new plan starting today (new anniversary). This is what makes the anniversary-reset rule true on the gateway, not only in Meikigo's database.
- **Resolved:** add-ons are **not** tied to the base plan's lifecycle. If a Brand downgrades or cancels its base plan, previously purchased add-ons stay active and continue billing on their own cycle — they are never auto-cancelled or auto-downgraded alongside the base plan. The merchant must cancel each add-on separately if they no longer want it.
- **✅ Resolved (Round 26) — one HitPay Recurring Billing subscription per Brand, whose amount = base plan (if still a paid plan) + all active add-ons.** Cancelling the base plan sets the base portion to RM0 (or the Brand moves to `FREE` with **no** Recurring Billing subscription — see below) but **keeps add-on lines** until the owner cancels each one. Do not create a separate HitPay subscription per add-on.
- **Resolved — plan-change authorization:** upgrading, downgrading, or cancelling a Brand's subscription is not restricted to the `iscreator` account — any Admin-role `UserAccount` on the Brand (or an Organisation-level admin) is authorized to change the plan.

### Subscription Tiers

`EnumPlanType` needs a **`FREE`** value added (currently only `FREETRIAL`, `STARTER`, `PLUS`, `PRO` exist in the codebase).

| Feature | FREE | STARTER | PLUS | PRO | FREETRIAL |
|---|---|---|---|---|---|
| Outlets | 1 | up to 4 | 8 | 20 | 8 (follows PLUS) |
| Account logins (Admin/Cashier `UserAccount`) | 1 (Admin only — handles POS, accounting, everything) | 2 (1 Admin + 1 any role); more purchasable as an add-on | 4; more purchasable as an add-on | Unlimited | Unlimited |
| Barbers (commission-eligible from STARTER up — see Commission note) | 1 (commission feature not available on FREE) | 5 | 8 | 15 | 8 (follows PLUS) |
| Employees / staff (non-barber, no commission) | 0 | 1 | 3 | 9 | 3 (follows PLUS) |
| Product SKUs (retail) | 0 | 3, can add on more | 10, can add on more | 30, can add on more | 10 (follows PLUS) |
| Service SKUs | 2 | 5, can add on more | 10, can add on more | 30, can add on more | 10 (follows PLUS) |
| Payment | Cash + Card (HitPay NFC tap) + DuitNow QR — **✅ Round 20: the same on every tier, no eWallet upsell** | Same as FREE | Same as FREE | Same as FREE | Same as FREE |
| Online queue (running number) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Booking (fixed time slot, e.g. 2:00PM/2:30PM) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Loyalty Program | ✗ | ✓ | ✓ | ✓ | ✓ |
| Accounting module (bookkeeping/ledger only) | ✓ | ✓ | ✓ | ✓ | ✓ |
| **⭐ Expenses — money going out, with categories and receipt photos (Round 17)**; sales − expenses = profit | ✗ | ✓ | ✓ | ✓ | ✓ |
| Add product | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dashboard — **⭐ both versions specified in Round 17** (Simple: today, month, profit, top services, what needs attention. Advanced: trends, by-barber, by-category expense breakdown, margins, busiest hours, outlet comparison) | Simple | Simple | Advanced analytics | Advanced analytics | Advanced analytics |
| Payroll — **✅ REINSTATED on PRO (Round 9)**; monthly payslip generation for all active employees, numbers only, no filing or disbursement | ✗ | ✗ | ✗ | ✓ | ✗ |
| Attendance table (manual marking; feeds Payroll on PRO) — **all paid tiers (Round 11)** | ✗ | ✓ | ✓ | ✓ | ✓ |
| Tax document export (accountant) — **⚠️ PLUS AND PRO ONLY (Round 13)**, reversing the earlier all-tiers reading | ✗ | ✗ | ✓ | ✓ | ✓ (follows PLUS) |
| In-shop queue display (read-only account, **does not consume a login** — Round 8) | ✗ (no premises assumed) | ✓ | ✓ | ✓ | ✓ |
| HQ Dashboard / cross-outlet reporting | | | | ✓ | |
| e-Invoice field capture on every sale (Round 5) | ✓ | ✓ | ✓ | ✓ | ✓ |
| MyInvoice tax pack — **✅ PRO ONLY (Round 9)**; generates the e-Invoice documents. **MyInvois transmission to LHDN is Phase 2, in no tier's build today** | ✗ | ✗ | ✗ | ✓ | ✗ |
| Dedicated onboarding — **defined in Round 12, delivery settled Round 13**: named contact for 30 days, one guided online screen-share setup session, assisted import, go-live check, day-30 follow-up | ✗ | ✗ | ✗ | ✓ | ✗ |
| SLA support — **defined Round 12; hours FINAL in Round 15**: P1 2 hours / P2 1 working day / P3 3 working days, **Monday–Saturday 9am–6pm** (Sunday and public holidays best-effort) | Best effort | Best effort | Best effort | ✓ | Best effort |
| **Merchant-visible audit log** (Round 13) | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Scheduled emailed reports** — weekly + monthly summary to the owner (Round 13) | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Data export / read-only API** (Round 13) — ⏸️ **on the PRO list but NOT at launch (Round 16)**; must not be advertised until built | ✗ | ✗ | ✗ | later | ✗ |
| ~~Included add-on allowance~~ ⛔ **REJECTED (Round 15)** — no free add-on units on any plan | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Scheduled marketing blasts** — daily / weekly / monthly / one-off (Round 13). **Sold as a MONTHLY EMAIL ALLOWANCE (Round 15)**: 1 recipient = 1 email, resets monthly, no frequency limit. **Five tiers: 1K / 5K / 10K / 50K / 100K (Round 16)**, priced in `meikigo-admin` | ✗ | ✓ (with a package) | ✓ (with a package) | ✓ (with a package) | ✓ (cannot purchase — see FREETRIAL) |
| **Bulk import** (customers, services, products, staff — with a downloadable Meikigo template) — **all paid plans (Round 14)** | ✗ | ✓ | ✓ | ✓ | ✓ |
| **First-run setup wizard** — 6 steps, introduces the product as it configures it (Round 16) | ✓ | ✓ | ✓ | ✓ | ✓ |
| **⭐ In-app help pages** — 15–20 short illustrated articles, searchable (Round 17) | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Monthly statutory summary sheet** (EPF / SOCSO / EIS / PCB totals to type into the portals) — **Round 14** | ✗ | ✗ | ✗ | ✓ | ✗ |

**Resolved — Base plan pricing:**

| Plan | Monthly | Yearly (2 months free) |
|---|---|---|
| STARTER | RM109 | RM1,090 |
| PLUS | RM199 | RM1,990 |
| PRO | RM329 | RM3,290 |

**✅ Resolved (Round 9) — add-on unit prices are ADMIN-CONFIGURABLE, not hardcoded in the product.** Recorded as given: *"to be easy to scale, we are not hardcode it, admin can configure all this number. The only hard code is in meiki-marketing-site. So example when we want to change the value of extra outlet, we go to admin settings, change the value from 149 to 249, save. Then we change the hardcoded value in meikigo-marketing-site and redeploy"*

- **Every add-on unit price lives in `meikigo-admin` settings** (see Configuration Settings) and is read at billing time by `meikigo-api`. No add-on price is compiled into the application.
- ~~**The stated exception is `meikigo-marketing-site`**, where prices stay hardcoded in the page and are changed by editing and redeploying.~~ — **⛔ SUPERSEDED (Round 13): the marketing site now reads a public pricing endpoint and holds no price literals.** The Round 9 workflow's second step is gone. See the resolution below.
- ~~**The actual RM figures are still not set.**~~ — **✅ CLOSED (Round 11): the six figures are confirmed below.** The 149→249 in the Round 9 answer was an illustration of the mechanism, not a decision; Round 10 asked me to propose the numbers and Round 11 accepted them. This is no longer a launch blocker.
- ⚠️ **The one risk in this design, worth naming: the marketing site and the billing engine can now disagree.** Two places hold the same price, kept in step by remembering to do the second step. A merchant who signs up from a stale marketing page is quoted one figure and charged another, which is the kind of discrepancy that produces a chargeback rather than a support ticket.
  - **✅ RESOLVED (Round 13) — `meikigo-api` EXPOSES A PUBLIC PRICING ENDPOINT AND THE MARKETING SITE READS IT. The hardcoded literals are retired.** This closes the drift risk rather than managing it: prices are edited once in `meikigo-admin` and every surface — the marketing page, the in-app checkout, the billing engine — reads the same source.
    - **The endpoint is unauthenticated and cacheable**, since plan prices are public information. It returns base plan prices and the full add-on rule matrix (plan × add-on × quantity), with a version or `updated_at` stamp.
    - **`meikigo-marketing-site` reads it at build time and revalidates** (Next.js ISR or a scheduled rebuild), so a price change reaches the public page without a developer. This removes the Round 9 workflow's second manual step — *"then we change the hardcoded value in meikigo-marketing-site and redeploy"* — which was the step most likely to be forgotten.
    - **Fall back to the last known-good values, never to an empty grid.** A pricing page that renders blank because an API call failed is worse than one showing yesterday's figures; cache the last successful response at build time.
    - **The in-app checkout must still quote the merchant's own plan price** from the same endpoint. That is what makes the number the merchant agrees to identical to the number they are charged.
    - ⚠️ **One thing this does not do:** it does not stop somebody editing the wrong cell in `meikigo-admin`. It removes duplication, not typos. **Recommend a confirmation step on the price editor** showing old → new for each changed cell, since these rules now feed a public page directly.
- **Yearly add-on rates:** apply the same "2 months free" rule as base plans — a monthly add-on price × 10 for the yearly rate.

#### ⭐ Add-on prices are a PER-PLAN RULE TABLE — ✅ Resolved (Round 12)
**Round 12 settled the two-tables contradiction by changing the shape of the answer rather than picking a side.** Recorded as given: *"All pricing for add-on can be configure in admin meiki. So Admin can adjust the value by [Select package] (Starter) — Plus (cannot change) — [1] outlet — Equal to RM[xx]. All the adds on package can be exist together."*

**What this means:** an add-on price is not one number per unit. It is a **rule** keyed to a plan, read as a sentence:

> **[STARTER] plus [1] [outlet] = RM[45]**

- **`meikigo-admin` holds a table of these rules**, and Meikigo staff edit them. The plan, the add-on type and the quantity are the key; the price is the value.
- **The price of the same add-on may differ by plan.** An extra outlet can cost RM45 on STARTER and RM39 on PRO. This is what makes the earlier contradiction moot — both tables become rows in one matrix rather than rival answers.
- **Quantity is part of the rule**, which allows volume pricing (1 outlet at RM45, 2 outlets at RM80) without any new concept. *Recommended: keep quantity tiers unused at launch and price everything per single unit — the mechanism exists the day it is wanted.*
- **"All the add-on packages can exist together"** — a merchant may hold several add-ons at once (outlets *and* barbers *and* logins). Each is billed on its own rule; they do not conflict.
- **`FREE` remains unable to buy any add-on**, unchanged.

**⚠️ Two consequences worth building for deliberately**

1. **The marketing site problem got harder, and Round 13 solved it.** With one price per add-on there was one number to keep in step; with a per-plan matrix it is a grid, and a **partially** updated grid is worse than a stale single price because nobody notices. **✅ Resolved (Round 13): the marketing site reads the public pricing endpoint and holds no literals at all**, so the grid cannot drift out of step with billing.
2. **The checkout must quote the merchant's own plan price**, never a generic one. A PLUS merchant seeing a STARTER figure and being charged differently is a chargeback, not a support ticket.

#### ⭐⭐ THE PRICE MATRIX — ✅ CONFIRMED (Round 13). THE LAST LAUNCH BLOCKER IS CLEARED
**Recorded as given: *"A"*** — the proposed matrix is adopted exactly as written. Every add-on now has a price on every plan, and the pricing page can be published.

| Add-on | STARTER | PLUS | PRO | Yearly (× 10) |
|---|---:|---:|---:|---|
| **Extra outlet** | **RM45** | **RM45** | **RM39** | RM450 / RM450 / RM390 |
| **Extra barber** | RM15 | RM15 | RM12 | RM150 / RM150 / RM120 |
| **Extra staff** (non-barber) | RM10 | RM10 | RM8 | RM100 / RM100 / RM80 |
| **Extra login** | RM15 | RM15 | RM12 | RM150 / RM150 / RM120 |
| **Catalog pack** (+10 SKUs) | RM9 | RM9 | RM9 | RM90 |
| **Marketing — monthly email allowance (Rounds 15–16)** ⛔ *replaces the old flat RM49* | Five tiers — **1K / 5K / 10K / 50K / 100K emails a month**. **Prices are set in `meikigo-admin` and are not fixed in this document (Round 16)**; same price on every plan | ← | ← | monthly, no yearly ×10 |

- **These are seed values for the `meikigo-admin` rule table, not constants in code.** Each cell is one rule keyed to plan + add-on + quantity, per Round 12. Changing one later is an admin edit plus a marketing-site revalidation, which the new pricing endpoint now handles on its own.
- **`FREE` buys no add-ons**, unchanged. **`FREETRIAL` should not be able to buy one either** — recommended, and worth enforcing: a trial that silently accrues add-on charges is a billing dispute waiting to happen.
- **Quantity tiers stay unused at launch.** Everything prices per single unit; the volume mechanism exists the day it is wanted.
- **Yearly is monthly × 10** on add-ons exactly as on base plans, so the "2 months free" promise holds whether a merchant buys a plan, an add-on, or both.
- **✅ The marketing row works differently (Round 15) and its tiers were finalised in Round 16.** It is a **monthly email allowance** rather than a flat fee, sold in **five sizes — 1K / 5K / 10K / 50K / 100K emails a month** — where **1 recipient = 1 email**. The same price applies on every plan, there is no yearly ×10 variant (the allowance is inherently monthly), and **the allowance does not roll over**. `FREE` cannot buy one, and neither can `FREETRIAL` (Round 16). ⚠️ **The prices themselves are deliberately not recorded here** — *"The pricing is dynamic we can configure it meikigo-admin"* — so they must be typed in before the pricing page publishes. See Marketing blasts → Email volume packages.

**The upgrade boundaries this produces** — this is what the RM45 column is buying:

- **STARTER RM109 + 2 outlets (RM90) = RM199 = exactly PLUS.** At the second outlet the merchant moves up and gets more barbers, more logins and advanced analytics for the same money.
- **PLUS RM199 + 3 outlets (RM135) = RM334, just past PRO at RM329.** The same boundary repeats at the top of the ladder.
- **PRO is cheaper across the board because there is nothing above it.** An add-on there rewards expansion instead of nudging a move that does not exist, and it is where a multi-outlet Brand actually buys volume.
- ⚠️ **This deliberately reverses the Round 11 reasoning, and the reversal is the decision.** Round 11's RM39 was chosen to keep a two-outlet shop comfortable on STARTER at RM187. Round 13 chose the opposite intent: the second outlet is an upgrade conversation, not an add-on purchase. Both were defensible; the Round 11 figures below are now provenance only.

**Previously proposed figures, retained for reference:** Round 10 proposed outlet RM45 / barber RM12 / staff RM8 / login RM15 / catalog dropped / marketing RM39. Round 11 recorded outlet RM39 / barber RM15 / staff RM10 / login RM15 / catalog pack RM9 / marketing RM49. Both are now rows in the matrix above rather than competing tables.

**⛔ SUPERSEDED BY THE ROUND 13 MATRIX ABOVE — the Round 11 single-price table, retained for provenance and for the reasoning behind each figure (which still explains *why* each add-on is priced where it is; only the outlet and PRO-column numbers changed)**

| Add-on | Monthly (Round 11) | Yearly (×10) | Note |
|---|---:|---:|---|
| **Extra outlet** | **RM39** | RM390 | The load-bearing number — see the upgrade maths below |
| **Extra barber** | **RM15** | RM150 | Deliberately trivial against what a barber bills, so no shop ever deletes a departing barber's record to save money and destroys its own commission history |
| **Extra staff** (non-barber) | **RM10** | RM100 | A receptionist earns no direct revenue and no commission, so it costs less than a barber |
| **Extra login** | **RM15** | RM150 | Same as a barber — a login is a person too. STARTER's 2-login cap is the one merchants hit first, so expect this to be the most common purchase |
| **Extra catalog pack (+10 SKUs)** | **RM9** | RM90 | ⚠️ **Sold in packs of 10, never as single slots.** Billing one SKU at a time is too small to be worth invoicing, and charging a barbershop per line on its own menu invites resentment |
| **Marketing blast** | **RM49** | RM490 | Flat monthly, no per-email counting |

**⛔ The Round 11 upgrade boundaries, superseded by Round 13** *(kept because the principle still holds — an add-on must never cost more than upgrading — only the arithmetic moved)*

- ~~**STARTER RM109 + 2 extra outlets (RM78) = RM187**, still under PLUS at RM199 — so a two-outlet merchant is genuinely better off on add-ons, and is not being pushed.~~ **At RM45 this becomes RM199, exactly PLUS.**
- **STARTER + 3 extra outlets (RM117) = RM226**, past PLUS. At the third outlet the upgrade is both cheaper and larger in every other dimension. That is where the merchant should move, and they will see it themselves.
- **PLUS RM199 + 3 extra outlets (RM117) = RM316**, just under PRO at RM329; **+4 outlets = RM355**, past it. The same boundary repeats at the top of the ladder.
- Net effect: **one or two units of anything is the easy repeat purchase the brief asked for; three or more is an upgrade conversation.** No merchant ever ends up paying more for less.

**On the catalog pack** — priced at RM9 per 10 SKUs specifically so it never reads as nickel-and-diming. A merchant who trims their service menu to dodge a charge gives their own customers a worse booking screen, which is the failure mode this price is set to avoid. If it ever generates complaints rather than revenue, raise the base SKU caps and stop selling it — nothing else depends on it.

**On the marketing add-on** — **flat monthly, not per blast or per recipient.** Per-recipient pricing makes a merchant calculate the cost of emailing their own customers before every send, which suppresses exactly the usage the add-on exists to encourage. RM49 is roughly one and a half haircuts. A shop with 800 customers sending four blasts a month is ~3,200 emails, costing Meikigo a few ringgit — comfortable margin without being greedy. **Suggest a fair-use ceiling** (e.g. 5,000 emails/month) written into the add-on description rather than enforced aggressively.

**✅ `FREE` cannot purchase any add-on — confirmed (Round 11).** Recorded as given: *"free cannot buy add ons."* This was already the written position (see the Add-ons note under Subscription & Billing) and is now explicit: FREE's caps are strictly fixed at 1 outlet / 1 barber / 0 staff / 1 admin login / 0 product SKUs / 2 service SKUs, and a FREE merchant who needs more must subscribe to STARTER. Enforcement belongs in the API, not only in the purchase UI.

**Two things to build alongside the prices, both of which serve the "not greedy" intent**

- **⭐ An upgrade advisor — ✅ CONFIRMED (Round 11B).** When a merchant's add-ons total more than the gap to the next tier, show it plainly: *"You're paying RM117 in add-ons. PLUS costs RM90 more than STARTER and includes all of this plus more outlets, barbers and logins. Switch?"* This is the single clearest way to demonstrate the pricing is honest, it prevents the resentment that kills renewals, and merchants tell each other about products that do this.
  - Show it where the decision is made — on the subscription/add-on screen and on the invoice — not as a nag on every login.
  - It should also work in reverse over time: a merchant on PLUS using far less than they pay for is a churn risk, and telling them costs a little revenue and buys a lot of trust.
- **Prorate fairly — ✅ CONFIRMED (Round 11B), HitPay sequencing ✅ Round 26.** An add-on bought mid-cycle is charged for the remaining days, not the full month. **On HitPay:** take a **one-off** charge now for that prorated amount; change the Recurring Billing amount to base + add-ons from the **next** cycle. Removing an add-on takes effect at the next renewal with no refund — standard, and it is stated at the point of purchase.

**These six numbers are the launch set.** They are configuration (Round 9), so changing them later is an admin edit plus a marketing-site redeploy. `meikigo-marketing-site` can now publish its pricing page.

**Resolved — FREETRIAL caps:** `FREETRIAL` is a PLUS-equivalent plan in every respect, including outlet cap — the earlier "20 (PRO-level)" figure was a documentation error. FREETRIAL's Outlet, Barber, Employee, and Product/Service SKU caps all follow PLUS's numbers (8 outlets, 8 barbers, 3 staff, 10 product SKUs, 10 service SKUs).

**Resolved — FREE-tier Barber/Employee headcount cap:** FREE is capped at 1 barber, 0 additional staff, and a single admin account login — that one admin account handles POS, accounting, and everything else on FREE. Commission is not an available feature on FREE regardless of headcount (see Commission section).

**✅ Resolved (Round 7) — two pricing-table corrections:**
- ~~**Payroll is removed from PLUS and PRO entirely.**~~ **⛔ REVERSED IN ROUND 9 — Payroll is reinstated, on PRO only**, with its scope narrowed to generating monthly payslips for active employees. The commercial flag it closed is closed a different way now: the feature is being built, so selling it is honest, and it is sold only on the tier that gets it.
- ~~**Tax document export moves to ALL tiers, including FREE**~~ — **⛔ SUPERSEDED (Round 13): PLUS AND PRO ONLY.** *"Plus & Pro ONLY"*. The Round 6 phrasing meant there is no separate PLUS and PRO *variant*, not that the feature is universal. FREE and STARTER keep the on-screen reports, the Z-report and the all-tier e-Invoice field capture, but not the packaged accountant export. See Tax Document Export → Tier availability

**✅ Resolved (Round 9) — what PRO sells, settled.** Rounds 7 and 8 had between them stripped both of PRO's differentiators (Payroll removed, MyInvoice de-gated), leaving RM329 resting on the HQ Dashboard alone. Round 9 restores both: **PRO = HQ Dashboard + Payroll + the MyInvoice pack.** The RM329 price stands as published, and no repricing is needed.

**Resolved (Round 5) — what an "account login" buys:** because **one account may only be signed in on one device at a time**, the login cap is effectively a **concurrent-device cap**. FREE = 1 tablet, STARTER = 2, PLUS = 4, PRO/FREETRIAL = unlimited — before add-ons. A shop wanting a third tablet on STARTER buys a third login as an add-on. Cashier accounts are **Brand-scoped**, so one login can work any Outlet of its Brand (see Merchant-Side Staff).

**Resolved (Round 5) — `FREE` is a never-paid tier, not a fallback tier:** it is selectable at the end-of-`FREETRIAL` paywall, but once a Brand has been on any paid plan, **STARTER is the downgrade floor** and FREE can never be returned to by downgrading (see Upgrade / Downgrade).

**Payment note:** FREE tier is not a manual-cash-only, gateway-free flow — HitPay is still the processor under the hood even on FREE. **✅ Resolved (Round 19), narrowed further in Round 20 — the electronic method matrix is now IDENTICAL on every tier:** every tier including FREE gets **card and DuitNow QR**. **⛔ SUPERSEDED BY ROUND 20: the "other eWallets from STARTER up" differentiator is gone.** Recorded as given: *"For all plan, the electronic payment is for card and qr duitnow only."* There is no longer a tier-gated eWallet slice (ShopeePay, Touch 'n Go, GrabPay, etc.) — see Payment Methods below.
- **✅ Card tap at the counter — updated (Round 26):** if the POS tablet has a built-in NFC reader, the customer **taps their card on that tablet**. Recorded as given: *"if POS customer wants to pay by card, they can tap their card on the POS tablet. Hitpay support in device NFC. meaning the tablet used for POS can accept card as long as it has NFC reader built in."* This **supersedes** Round 21's "no physical card reader / key the card / HitPay's own mobile app" for NFC-capable tablets. Tablets **without** NFC cannot take a tap — they still have **DuitNow QR and cash**. Do not key card numbers into Meikigo (PCI). Bluetooth HitPay terminals (WisePad, WisePOS E) stay out of Phase 1.

**✅ CASH IS A FIRST-CLASS PAYMENT METHOD ON EVERY TIER, INCLUDING FREE (Round 11).** The cashier presses a **Cash** button and the sale is recorded as cash — it is a stored payment method on the Transaction, not an absence of one.
- **This is what makes day close possible at all.** Expected cash is `opening float + cash sales − cash refunds + cash tips taken` (Round 10); if a cash sale is not recorded *as cash*, none of those terms can be computed and the drawer count has nothing to compare against.
- **It does not touch HitPay**, and nothing about it is blocked by the parked HitPay decisions — cash never reaches a gateway. This item is therefore lifted out of the payments KIV list.
- **A FREE solo barber takes mostly cash**, which is precisely why it cannot be a paid-tier feature.
- **✅ Resolved (Round 19), then narrowed by Round 20, then NFC path updated (Round 26) — the electronic method matrix, lifted out of KIV:** *"All package will include card payment and qr pay (duitnow)."* So **every tier gets card and DuitNow QR** — not just cash. **⛔ SUPERSEDED BY ROUND 26: "HitPay's own mobile app" is not the POS card path.** Card tap is on the **POS tablet's built-in NFC** when the tablet has it (see Payment note above). Tablets without NFC: DuitNow QR + cash.
  - **⛔ SUPERSEDED BY ROUND 20 — no other eWallets, on any tier.** The earlier draft gated ShopeePay/Touch 'n Go/GrabPay/etc. to STARTER and up as an upsell slice; Round 20 closed that off directly: *"For all plan, the electronic payment is for card and qr duitnow only."* The tier table (Subscription Tiers, above) no longer differentiates on payment method at all — **card + DuitNow QR is the entire electronic method set, FREE through PRO.** The full HitPay rate card recorded in Meikigo/Merchant Account Model & Commission (below) still lists fees for the other eWallets — that table is retained for completeness/future reference, but only the DuitNow and card rows are currently reachable from the product.
  - **No tender split — confirmed again (Round 19):** *"Cannot mix method"*, matching the existing Round 11B rule. One Transaction, one payment method, unchanged.
  - **✅ Unsupported-method handling — my recommendation, delegated (Round 19: *"you decide"*): HIDE, don't show-then-fail.** If a specific merchant's HitPay account can't take a method for some reason, the POS should not offer it at all rather than let the cashier pick it and watch it fail at the gateway with a customer waiting. This means the POS needs to read the merchant's *actual* enabled-methods list from HitPay (or from `meikigo-admin`'s record of what was provisioned for that Brand), not just the tier's nominal list.

**Booking vs. Online queue:** these are two distinct features, both available from FREE up — Online queue issues a running/sequential number (walk-in, first-come-first-served); Booking lets the client reserve a fixed future time slot (e.g. 2:00PM, 2:30PM).

**Dashboard content (decided in Round 4 — merchant delegated this to product judgment):**

*Simple* — FREE / STARTER. A single-Outlet, open-it-each-morning snapshot of **today**:
- Revenue today, and transaction count
- Currently waiting in queue, and current estimated wait
- Served today vs. each barber's daily capacity (so the manager can see who has headroom)
- No-shows and cancellations today
- Top services sold today

*Advanced analytics* — PLUS / PRO / FREETRIAL. Everything above, plus:
- Historical trends and period-over-period comparison (this week vs. last, this month vs. last)
- Busiest hours/days heatmap — the single most actionable number for a barbershop, since it drives staffing and shift planning
- Per-barber breakdown: clients served, average service time (from the POS start/done taps), star rating, commission earned
- Service mix and revenue by service over time
- Repeat-customer rate and loyalty redemption volume

*HQ Dashboard / cross-outlet reporting* — PRO only, on top of the above: the same figures rolled up across all of a Brand's Outlets, with Outlet-vs-Outlet comparison.

Note the dependency: per-barber average service time is only as good as the discipline of the start/done taps at the counter (see Who Drives the Queue State), so that metric should be presented with a sample count and tolerate missing timings rather than assume complete data.

**Add-ons:** account logins, product/service catalog slots, outlets, and Barber/Employee headcount can all be purchased as add-ons beyond a plan's base cap. Add-ons are **recurring** — billed monthly or yearly, merchant's choice — with pricing configured per add-on unit at both a monthly and a yearly rate. **Add-ons are only available from STARTER and above — the `FREE` tier cannot purchase any add-ons** (**✅ reconfirmed explicitly in Round 11**); its caps (1 outlet / 1 barber / 0 staff / 1 admin login / 0 product SKU / 2 service SKUs) are strictly fixed.

**Resolved — mixed billing cycles:** a Brand's base plan and its add-ons do **not** need to share the same billing cycle — e.g. a monthly base plan with a yearly-billed add-on (or vice versa) is allowed. The itemized `SubscriptionLine` invoice simply labels the yearly-billed line item(s) as **"Paid on Yearly Plan"** to distinguish them from the monthly-cycle items on the same invoice.

**Invoicing:** each Brand's `SubscriptionLine` invoice is **itemized for display** — the base plan and each add-on appear as separate line items on the one bill — but it is charged/paid as a **single combined payment**, not as separately-chargeable line items. **Resolved:** there is no partial-payment-failure scenario across line items — the base plan rate and its add-ons are billed together in one `SubscriptionLine`/invoice, so gateway failure/retry (see Payment Failure Handling below) applies to the whole invoice at once, never to an individual add-on line item in isolation. Each Brand is billed and pays independently; an Organisation with multiple Brands additionally receives a consolidated "main invoice" that rolls up all of its Brands' individual invoices for org-level visibility. **Resolved — consolidated invoice payability:** this consolidated invoice is not merely a read-only rollup — the merchant can choose to pay each Brand's invoice individually, or pay all of an Organisation's outstanding Brand invoices simultaneously from the one consolidated invoice. Pricing (base tiers and add-ons) is fixed and shown directly on the marketing site for all tiers, including PRO — no sales-assisted/case-by-case quoting.

**Resolved — currency:** subscription billing **localizes currency** rather than always billing in MYR — an Organisation/Brand operating outside Malaysia is billed in its local currency. **Resolved (Round 4): this is explicitly Phase 2 work and is out of scope for Phase 1.** Phase 1 supports **MYR only, end-to-end** (registration + recurring billing); the localized price list / FX conversion mechanism is not designed or built now.

**Resolved (Round 4) — PRO's "Dedicated onboarding" and "SLA support" DO need product surface**, not just human/operational commitments. Specifically required: a **priority support flag** on the account, a **ticket/support request form**, and an **onboarding checklist**. (Note the onboarding checklist already exists as a skippable guide for all merchants — see Merchant Onboarding; the PRO version is the dedicated/assisted variant of it.)

### ⭐ What PRO Actually Includes — specified under delegation (Round 12)
**Round 12 asked me to define these.** Recorded as given: *"Need your recommendation as we have not yet specify what SLA and dedicated support consist of. With your business knowledge, what should be in PRO plan that we didn't include?"*

The problem being solved: PRO has been sold at RM329 with two ticks — *SLA support* and *Dedicated onboarding* — that mean nothing yet. **Selling an undefined promise is how a product collects refund requests**, and the first PRO merchant to ask *"what support did I pay for?"* needs an answer that already existed.

#### SLA support — a RESPONSE-TIME promise, and nothing more
The single most important rule: **promise response times, never resolution times, and never uptime.** A resolution promise cannot be kept for a bug of unknown depth, and an uptime promise cannot be honestly made until Meikigo measures uptime and is prepared to pay credits against it. Response time is entirely within Meikigo's control, which is why every sensible small SaaS promises exactly that.

**Recommended tiers, by what is actually broken:**

| Severity | What it means | PRO response | Everyone else |
|---|---|---|---|
| **P1 — shop is down** | Cannot take payment, cannot run the queue, cannot log in | **Within 2 hours**, during support hours | Best effort |
| **P2 — something is broken but there is a way round it** | A report is wrong, a screen errors, payroll will not confirm | **1 working day** | 2–3 working days |
| **P3 — question, request, or "how do I"** | Everything else | **3 working days** | Best effort |

- **✅ RESOLVED (Round 13) — SUPPORT HOURS ARE EVERY DAY, 9am–6pm.** Recorded as given: *"d. Everyday 9am-6pm"*. This is neither of the options offered and it is the better answer: it covers **all seven days**, which matters because a barbershop's worst day to be down is a weekend day, and it trades a shorter daily window (9 hours instead of 10) for never having a dead day.
  - **63 hours of cover a week cannot come from one person.** Seven days at 9am–6pm needs a **rota of at least two people**, plus a plan for annual leave and illness. This is the one part of PRO that is a staffing commitment rather than a build task, and the promise breaks in its first week if the rota does not exist. **Recommend writing the rota before the pricing page goes live.**
  - **⚠️ ⭐ FINAL HOURS — ✅ SETTLED IN ROUND 15: MONDAY TO SATURDAY, 9am–6pm. Sunday and public holidays are best-effort.** Recorded as given: *"B"* — *"One person only for now. Then I suggest we promise Monday to Saturday first and add the rest later."*
    - **This supersedes both earlier answers**: Round 13's *"every day 9am–6pm"* and Round 14's *"public holidays too, same hours"*. Round 15 asked the staffing question plainly and the honest answer was **one support person**, so the promise was cut to fit the people rather than the reverse.
    - **This is the right call and worth recording as such.** 54 hours across six days is still a real commitment from one person, and it covers **Saturday**, which is the day a barbershop most cannot afford to be down. A promise that is kept every Saturday is worth more than a 365-day promise that fails on the first public holiday.
    - **What the SLA text must now say:** *"Support hours: Monday to Saturday, 9am–6pm. Sunday and public holidays: best effort."* P1 within 2 hours, P2 one working day, P3 three working days, **all measured inside those hours** — so a P1 raised at 4pm on Sunday is answered by 11am Monday, and the ticket record must show that calculation or every weekend ticket looks like a breach.
    - **Revisit when a second person exists.** Extending to seven days later is a pricing-page edit and a happy announcement; retracting a promise is neither. **Recommended: do not advertise the extension until the rota exists.**
    - ⚠️ **One person is still a single point of failure Monday to Saturday.** Leave, illness and a dentist appointment all exist. **Recommended: name a fallback — even an engineer who only triages P1 — and say nothing publicly about it.** The customer-facing promise stays as written.
  - **The clock only runs inside support hours.** A P1 raised at 7pm is answered by 11am the next morning (2 hours from the 9am open), and the ticket record must show the calculation, or every out-of-hours ticket looks like a breach.
  - **Below PRO nothing is promised** — best effort, same as before. The difference PRO buys is a stated number, a priority flag, and a measurement.
- **Channel: a support form inside `meikigo-merchant`**, which is the one that works. It automatically carries the Brand, Outlet, plan and the acting account, so the merchant does not have to explain who they are — and it creates a ticket with a reference the SLA can actually be measured against. Email as the secondary channel.
  - ⚠️ **Recommend against promising WhatsApp.** It is what merchants will ask for, and it is unmanageable without a helpdesk behind it — messages arrive on somebody's personal phone, nothing is tracked, and the SLA becomes unmeasurable. Revisit when there is a support tool to receive it.
- **✅ ⭐ WHO SETS THE SEVERITY — the MERCHANT picks, MEIKIGO may change it with a reason (Round 16).** Recorded as given: *"A"*.
  - **The merchant chooses from three plain descriptions, not from letters:** *"I cannot take payment / cannot run the shop"* (P1), *"something is wrong but I can still work"* (P2), *"a question or a request"* (P3). Nobody should have to learn what P2 means to file a ticket.
  - **Meikigo can re-grade a ticket, must give a reason, and the merchant is told** — in the ticket thread, not silently. This is the part that keeps the SLA honest: without it, every ticket is a P1 and the 2-hour promise means nothing; with a silent re-grade, a merchant discovers on Wednesday that their "urgent" ticket was quietly demoted on Monday.
  - **The clock re-starts from the re-graded level, from the time of the change**, and the ticket keeps both grades on its record. A promotion (P3 → P1) therefore never punishes Meikigo for the merchant having under-stated it.
  - **Recommended: a re-grade pattern is worth reading.** If one merchant's P1s are re-graded every week, either they misunderstand the labels or something in the product genuinely keeps breaking. Both are worth knowing.
- **✅ AN AUTOMATIC ACKNOWLEDGEMENT IS SENT IMMEDIATELY, INCLUDING OUTSIDE HOURS (Round 16).** Recorded as given: *"A"*.
  - **It carries the ticket reference, the support hours, and the time by which a reply is due** — *"Ticket #482 received. Support hours are Mon–Sat 9am–6pm. We will reply by Monday 11am."* Computing that date from the severity and the support calendar is what turns a generic auto-reply into something useful.
  - **Why it matters more here than usual:** support is one person, Monday to Saturday (Round 15). A ticket filed at 8pm on Saturday would otherwise sit in silence for 37 hours, and the merchant's reasonable conclusion is that nobody is there. The acknowledgement costs nothing and removes the most common complaint about small support teams.
  - **It is transactional mail** on `mail.meikigo.com`, never counted against anybody's marketing allowance.
- **The priority flag on the account is what makes it real** — PRO tickets sort to the top of the queue, visible in `meikigo-admin`.
- **Measure it.** An SLA nobody measures is marketing copy. Ticket created-at and first-response-at are two columns, and they are what lets Meikigo say the promise was kept.

#### Dedicated onboarding — a named person and a scheduled session
- **A named onboarding contact** for the first 30 days, not a shared inbox.
- **One scheduled setup session** (recommended 60 minutes, video or phone) covering Organisation/Brand/Outlet setup, the service and product catalogue, staff and barber records, and the payroll template verification (which PRO merchants now must do before running payroll).
- **✅ Assisted data import — DELIVERED AS A GUIDED ONLINE SESSION (Round 13).** Recorded as given: *"We will assist using online tool like google meet. So merchant can share the screen and we will guide there."* So Meikigo does **not** key the data in on the merchant's behalf, and **no import screen is built in `meikigo-admin`** for this purpose. The merchant drives their own screen; Meikigo watches and guides.
  - ⚠️ **One consequence that decides whether this is worth anything: the merchant needs a tool to be guided through.** If there is no bulk import in `meikigo-merchant`, a guided session is two people typing a customer list in one at a time over a video call. **Recommended, and small: a CSV/XLSX import in `meikigo-merchant` for customers, services and staff** — upload, map columns, preview, commit, with a row-level error report. Available on **every paid tier** (it is the cure for the blank-product problem that kills trials), with PRO's difference being that somebody sits on the call with them.
  - **Practical benefits of the screen-share choice, worth keeping:** the merchant ends the session knowing how to do it again, Meikigo never holds a merchant's customer spreadsheet, and there is no data-processing step to explain in the privacy notice.
  - **Recommended: record consent to the recording, or do not record.** A screen-share of a customer list is personal data on somebody's laptop.
- **A go-live check** before the first real trading day, and **a follow-up at day 30** — the point at which a merchant knows what they actually need help with.
- The standard onboarding checklist already exists for every tier; the PRO version is the assisted variant of it, with the contact's progress visible.

#### ⭐ What else PRO includes — ✅ FOUR OF THE FIVE ADOPTED (Round 13)
**Recorded as given: *"add all except option C"*** — so the audit log, scheduled emailed reports, data export / read-only API and the included add-on allowance are all **in PRO**. **Custom branding is the one rejected**, and it is the right one to drop: it was the only purely cosmetic item on the list and the only one that touches every customer-facing template.

**The same answer also added a feature for every plan, not just PRO:** *"i would like to add scheduled email blast feature to all plan (daily, weekly, monthly, one off)"* — see Marketing blasts → Scheduled blasts (Round 13). **Round 14 removed the weekly cap and charged per email instead; Round 15 priced it as a monthly allowance and named Brevo as the provider.**

**What each adopted item now commits to:**

- **✅ Merchant-visible audit log (PRO)** — a read-only view for the Brand admin over the audit trail that already exists: who changed a price, who approved a write-off, who authorised a discount, who confirmed a payroll run, who reset a payslip password. Filterable by Outlet, by person and by date.
  - **✅ THE SCREEN SHOWS THE LAST 12 MONTHS — Resolved (Round 14).** Recorded as given: *"A"*. Older rows are **not deleted** — the underlying audit trail keeps its full retention, and Meikigo support can retrieve anything older on request. Only the merchant-facing view is windowed.
  - **Why a window at all:** an unbounded log view over a four-outlet Brand's history is slow to load and impossible to read, and 12 months is the period an owner actually asks about (*"who changed this price last year?"*). It also matches the natural reporting year.
  - **Recommended: say the window out loud on the screen** — *"showing the last 12 months; contact support for older records"* — so a merchant looking for something from two years ago knows it exists rather than concluding it was deleted.
  - **Recommended: export what is on screen** (CSV) with the filters applied, and log the export. An owner investigating something wants to send it to someone. **It shows merchant actions only** — never Meikigo staff actions, and never another Brand's rows. This pairs directly with the per-Admin approval password (Round 12): every override now names a person, and PRO is where the owner can actually read those names.
- **✅ Scheduled emailed reports (PRO)** — a weekly and a monthly summary: sales, top services, per-barber commission and tips, discounts and voids, stock alerts. Transactional stream, on the existing scheduler, and configurable per Brand (which reports, which day).
  - **✅ NO SEPARATE ACCOUNTANT LOGIN (Round 15).** Recorded as given: *"A"*. An external accountant gets **files and emails**, never an account: the tax export, the payroll figures the owner sends them, and a place on the report "to" list below. This keeps the role model at Admin / Cashier / read-only display — unchanged since Round 7 — and avoids a fourth permission set to design, test and support. If it is ever wanted, the shape to build is read-only over payroll and exports only.
- **✅ RECIPIENTS: THE BRAND ADMIN MAINTAINS A "TO" LIST — Resolved (Round 14).** Recorded as given: *"As a brand who is pay, admin of the brand can add the 'to' list."* So it is not one fixed address: the paying Brand admin adds whoever should receive the reports — a business partner, an accountant, an outlet manager.
    - **Recommended guardrails, because this mails business figures to arbitrary addresses:** cap the list (5–10 is plenty), **log additions and removals** (it appears in the merchant-visible audit log), and show the full list on the report email itself so everyone can see who else receives it.
    - **⚠️ Recommend a one-click confirmation for addresses outside the Brand's own accounts.** An added address is a standing subscription to a shop's revenue figures; a single mistyped address quietly mails a stranger every week. A confirm-link before the first send fixes it and costs nothing.
    - **Every recipient gets an unsubscribe** that removes only them, and it must not require a login — the accountant on the list has no Meikigo account.
    - **The list is Brand-level**, like the subscription that pays for it. A `BRANCH` brand can still choose to send per-Outlet reports to the relevant outlet's admin. **This is the fifth scheduled email in the product** — after the booking reminder, the payslip, the barber daily summary, and the scheduled blasts added below.
- **⏸️ Data export / read-only API (PRO) — ADOPTED, BUT NOT BUILT AT LAUNCH (Round 16).** Recorded as given: *"Later, not at launch. We keep it on the PRO list but build it when a PRO merchant actually asks."* Sensible: a public API needs keys, rate limits, documentation, versioning and support, and the first PRO merchants are far more likely to want the XLSX export they already have.
  - **⚠️ It must therefore come OFF the published PRO feature list until it exists.** This is the same rule Round 12 applied to SLA support and dedicated onboarding: **do not sell a tick that has nothing behind it.** The pricing page and the in-app plan comparison should not show it, and the marketing-site correction list below includes it.
  - **The shape when it is built:** a **read-only, Brand-scoped API key** issued in `meikigo-merchant`, rate-limited, revocable, with its own audit rows. Read-only is not a limitation to relax later — a write API is a different product with a different support burden.
  - **What it should expose when the first merchant asks:** the same figures the existing exports carry (sales, transactions and lines, per-barber commission and tips, stock levels) — nothing that is not already in an export today, so no new privacy decision is needed to ship it.
- **⛔ Included add-on allowance (PRO) — REJECTED IN ROUND 15. Not built.** Recorded as given: *"A"* — no free outlets; PRO allows 20 outlets and the 21st costs RM39 like any other. **This is the simpler product and it removes a billing complication entirely** (no granted-units concept, no "is it 20 or 22?" support question). The explanation below is kept only as provenance for why it was considered. ⚠️ *Superseded — the quantity question is closed, and Round 14 had asked what this even meant* — *"i dont understand what you mean. can you explain more detail?"*. Fair question, and my wording was too compressed. **Here it is in plain terms, so it can be decided next round:**

  **The situation today.** PRO allows **20 outlets** for RM329/month. A merchant who grows to 22 outlets buys 2 extra-outlet add-ons at the PRO price of RM39 each, so they pay **RM329 + RM78 = RM407/month**.

  **What "included allowance" would change.** PRO would come with, say, **2 extra outlets already included**. The same merchant with 22 outlets would pay **RM329 flat**, and only start paying RM39 each from the **23rd** outlet onward.

  | Outlets | Today | With 2 included |
  |---:|---:|---:|
  | 20 | RM329 | RM329 |
  | 21 | RM368 | **RM329** |
  | 22 | RM407 | **RM329** |
  | 23 | RM446 | **RM368** |

  **Why it is worth considering:** it is a sales line, not a feature. *"PRO covers you up to 22 outlets"* is easier to sell than a cap that starts charging the moment they open one more shop, and it costs Meikigo nothing unless the merchant actually grows.

  **Why you might not want it:** it gives away RM78/month from the merchants most able to pay, and it makes the outlet cap fuzzy — *"20, or 22?"* — which is one more thing for support to explain. **Doing nothing is a perfectly good answer**, and it is the simpler product.

  **If you do want it**, it must be built as **granted free units on the subscription, not as a discount** — billing has to charge for the 23rd outlet while charging nothing for the 21st and 22nd. **Re-asked next round with this explanation attached.**
- **⛔ Custom branding — REJECTED (Round 13).** Not built. Nothing else depended on it, and the booking page, receipt and queue display keep one Meikigo-styled template.

**The original recommendations, retained for the reasoning:**

- **⭐ Merchant-visible audit log.** The audit trail already exists for every action. Exposing a read-only view to a Brand admin — who changed a price, who approved a write-off, who discounted what — is close to free and is exactly what an owner running four outlets they cannot personally watch is paying for. **This is my strongest recommendation of the group.**
- **⭐ Scheduled emailed reports.** A weekly and monthly summary landing in the owner's inbox automatically. The scheduler exists (booking reminders, payslips, the barber daily summary), the figures exist, and it is the feature that keeps an owner engaged with the product between logins.
- **Custom branding on customer-facing pages** — the Brand's logo and colour on the booking page, the receipt and the queue display. Highly visible, entirely cosmetic, and a common reason merchants upgrade.
- **Data export / read-only API.** A Brand large enough for PRO may want its figures in its own spreadsheet or BI tool. The tax and accountant exports already exist; a scheduled or programmatic version is a modest extension.
- **Included add-on allowance** — e.g. PRO includes two extra outlets at no charge. Simple, tangible, and it makes the RM329 arithmetic obviously favourable at the point of sale.
- **Deliberately NOT recommended:** an uptime SLA with service credits (Meikigo cannot yet measure or fund it), a phone hotline (no capacity to staff it), and anything requiring a person to be available outside the stated support hours.

~~**⚠️ If none of this can be staffed before launch, remove both ticks from the pricing table rather than shipping them undefined.**~~ — **✅ ANSWERED (Round 13): both ticks STAY, with support every day 9am–6pm.** PRO is therefore sold on HQ Dashboard + Payroll + MyInvoice pack + the four adopted features above + a support promise that now has hours, severities and a measurement behind it.

**Resolved — subscription refund policy:** subscription/add-on charges are **non-refundable** by default once processed (distinct from the manual-refund policy that applies to POS/client transactions — see Refunds & Voids below). The only exception is a merchant contacting Meikigo support directly to resolve a billing mistake (e.g. accidentally subscribing to the wrong plan) — this is handled case-by-case as an SLA/support matter, not a self-service refund flow.

**⭐ ✅ The yearly-specific case is now spelled out (Round 18): a merchant who pays for a year and cancels early keeps full access until the paid term ends, then it stops — no partial refund of unused months.** Worked example from the question this answers: a merchant pays RM1,090 for a year of STARTER, closes the shop in month 3, and cancels — nine months are unused. **Recorded as given:** *"A"* — no refund, access continues at STARTER until the twelve months are up, then the Brand follows the ordinary cancellation path (Cancellation & Data Retention, above). This is the same non-refundable stance already settled for subscriptions generally, made explicit for the yearly-commitment case specifically, since "2 months free" only makes sense as a trade for committing to the full term. **This must be stated clearly at yearly checkout, before payment is taken** — the same standard the doc already holds every other charge to.

**Resolved — subscription payment methods — ✅ SUPERSEDED (Round 26):** Brand → Meikigo **recurring billing / subscribe is DOMESTIC CARD ONLY** (Visa, Mastercard). DuitNow is **not** used for the first subscribe or for renewals. Recorded as given: *"recurring billing such as subscribe : domestic card only"* and *"DuitNow + Card for other than that"* — meaning **POS / customer payments** stay DuitNow + card; **Meikigo's own subscription** does not. FPX and manual bank transfer remain out of scope for launch. This reconfirms Round 21 (cards only for Recurring Billing) and kills the older "DuitNow at first subscribe" line.

**Resolved — tax scope:** standard Malaysian SST (tax-inclusive by default) applies **only** to what the merchant pays Meikigo — i.e. the Brand's subscription + add-on `SubscriptionLine` charges. It does **not** extend to the merchant's own POS/Transaction-level tax. Outlet-level sales tax is entirely merchant-configured: **each Outlet configures its own transaction tax independently**, including following the applicable local tax rules if that Outlet operates in a country other than Malaysia. Meikigo does not impose or auto-apply SST (or any other tax regime) on POS transactions on the merchant's behalf.
- **✅ Resolved (Round 26) — the amount sent to HitPay for a subscription/add-on charge is the GROSS (tax-inclusive) figure.** `meikigo-admin` stores plan prices tax-inclusive, or Meikigo computes SST and sends the gross. The merchant's receipt/invoice shows **net, SST, and gross** — and the gross is the same number HitPay charged. Do not send net and collect SST as a second charge.

**Catalog caps note:** the Product SKU / Service SKU caps above are separate from the general "no transaction volume cap" rule — there is **no cap on transaction volume or GMV** on any tier; only catalog size, outlets, account logins, and barber/employee headcount are capped.

These limits should be enforced at the **API level**, driven by the Brand's current `SubscriptionLine`/plan (see Enforcement Mechanics below) — `meikigo-admin` has no UI for this yet and it isn't required to; static plan metadata + API enforcement is sufficient for now.

### Recurring Billing
- **✅ Resolved (Round 26) — there is NO merchant setting for auto-charge vs pay-each-month.** Every paid Brand is auto-charge on a saved card. Manual pay is only a **support fallback** when the card fails (Meikigo staff send a payment link). The old "merchant-configurable auto-vs-manual" line is **superseded**.
- **✅ Resolved (Round 22 + 26) — HitPay Recurring Billing API, AUTO-CHARGE, HitPay stores the card token.** Meikigo never handles PCI-sensitive card data. **Brand billing checkout uses HitPay's hosted save-card / checkout page (or HitPay embed), then returns to Meikigo** (Round 26) — this is a deliberate exception to "own checkout UI" and exists so we never see card numbers.
- **✅ Resolved (Round 26) — a `FREE` Brand does NOT get a Recurring Billing subscription and no card is collected.** Keep/create the Brand's **POS** HitPay connected account (so they can take DuitNow/card at the counter). Recurring Billing is created only when they pick a paid plan.

### Payment Failure Handling (Subscription)
- **✅ SUPERSEDED (Round 26):** Meikigo does **not** run its own 3× / 2-days-apart charge job. **HitPay owns retries.** Meikigo only listens to webhooks (`charge.created`, `recurring_billing.subscription_updated`, failures). Confirm HitPay's actual retry schedule with HitPay before launch and match the merchant-facing copy to it. After HitPay's final failure, mark the `SubscriptionLine` as `FAILED` / lead into the `EXPIRED` flow (Brand goes read-only). Do not also retry from Meikigo — that is how a shop gets charged twice.

### Enforcement Mechanics
- On a blocked write (e.g. adding a 5th outlet on STARTER, a 3rd account login beyond the purchased cap), the **backend returns a structured response indicating the plan limit was hit**; the frontend uses that response to show a plan/paywall page rather than a generic error.
- For feature flags entirely absent below a tier (e.g. Payroll on FREE/STARTER, HQ Dashboard below PRO), the endpoint should still exist but respond with an **"upgrade to unlock" response** — not a bare 403 — so the frontend can render an upsell paywall prompt instead of a plain error state.
- **Resolved — historical data after losing a feature via downgrade:** if a Brand downgrades below a tier that generated feature-specific data (e.g. PRO→PLUS losing the HQ Dashboard), that previously generated data is **not deleted or hidden** — it remains accessible **read-only**. The merchant can view historical payroll records/e-Invoice submissions/etc., but cannot create new ones until re-upgrading to a tier that includes the feature.

---

## Payment Gateway

- **Chosen provider: HitPay** (Malaysian market), and **HitPay only** — no secondary/alternate gateway is planned alongside it for any market at this time. Install/reference the HitPay agent skill (`npx skills add hit-pay/agent-skills`) when implementing.
- `ProductionPaymentGatewaysImplementation` (currently `TODO`) should be built against HitPay.
- **Resolved — platform/commission model:** Meikigo acts as a HitPay **business platform partner**, not a single flat merchant. Each Brand ultimately needs its own HitPay account, but the merchant does **not** self-register with HitPay — **Meikigo creates that HitPay account manually** on the merchant's behalf once the merchant has finished setting up their Organisation. The merchant's HitPay account is then connected to **Meikigo's own master HitPay account** via the merchant's API key, which is the mechanism Meikigo uses to collect its platform commission on each transaction. This requires Meikigo to hold (or obtain) HitPay's business platform partner status — **✅ confirmed already agreed, Round 19** (see Meikigo/Merchant Account Model below).
- **Resolved — no HitPay account/keys yet:** sandbox and production API keys have not been obtained — account setup with HitPay is still to be done before implementation can begin (see `HITPAY_*` Environment Variables below).
- **✅ Resolved (Round 21) — sandbox testing uses TWO sandbox accounts** — one for Meikigo's platform account and one to simulate a merchant's connected account. Both subscription billing and POS payment flows are tested end-to-end in sandbox before any production deployment. This matches the production two-account model.
- **✅ Resolved (Round 26) — sandbox never becomes live.** `meikigo-api` has an environment flag (sandbox vs live). Production **never** stores sandbox keys. Each live Brand gets a **new live** HitPay account + KYB in production. Staging Brands are not copied across as live payers.
- **Resolved — own checkout UI, not HitPay-hosted — narrowed (Round 26):** **POS customer checkout stays Meikigo-branded** (embedded DuitNow QR; card tap on the tablet — see Payment Methods). **Brand → Meikigo subscription billing is the exception:** the owner is sent to **HitPay's hosted save-card / checkout** (or HitPay embed) to enter the card, then returned to `meikigo-merchant`. Meikigo never hosts card PAN fields.
- **✅ Resolved (Round 19) — two integrations, not one, tied together by the partner relationship:** subscription billing (Brand → Meikigo) settles into **Meikigo's own master HitPay account**; POS payment (client → Outlet) settles into **that Brand's own connected HitPay account**. They are not the same account and not the same credential — see Meikigo/Merchant Account Model below. This closes the "one integration or two" KIV item.
- **✅ Resolved (Round 21) — integration path is DIRECT API KEY, not OAuth.** Meikigo creates each Brand's HitPay account, stores the API key in the database, and uses `X-BUSINESS-API-KEY` on every call. Since Meikigo controls account creation and the merchant never touches their own HitPay dashboard, the key-sharing risk that normally makes Direct API Key dangerous does not apply here. OAuth is not needed in Phase 1.

### Meikigo/Merchant Account Model & Commission — ✅ Resolved (Round 19)

Recorded as given: *"Meikigo have its own hitpay account (receive subscription and commission). Client have their own hitpay account but we manage for them (including setup). We will integrate Hitpay with meikigo as main and sole payment gateway. Each transaction made from client's customer, we will receive a fixed rate commission. Client have the authority to access their hitpay account (upon request through meiki-support)."*

- **Meikigo's own HitPay account** receives **two** kinds of money: the Brand → Meikigo subscription/add-on charges, and Meikigo's platform commission skimmed off every POS transaction. This is the account whose credentials become the platform-level `HITPAY_*` env vars.
- **Each Brand gets its own connected HitPay account**, created by Meikigo (not self-registered by the merchant), which is where that Outlet's POS sales actually land. This is what the merchant's own HitPay account statement will show — their gross takings, net of Meikigo's commission per the Business Platform Partner fee-split mechanism.
- **The merchant does not get standing self-service access to their own HitPay account.** They can request it — *"upon request through meiki-support"* — which routes through the same Meikigo-support access pattern already built for the platform generally (see Meikigo support access → the hidden support account, Round 17/18). This is new: nothing in the document previously said whether the merchant themselves ever sees inside their own connected account, and now it does — support-mediated, not self-service.
- **What this means for build:** a Brand record needs to store which connected HitPay account/API key belongs to it (held server-side in `meikigo-api`, per the existing `meikigo-admin` CRUD/API-configuration scope — see App Inventory), and `meikigo-admin` needs an action for support staff to grant/relay account access on request, logged like any other support action.
- **✅ Resolved (Round 21) — merchant HitPay access: support-mediated by default, credentials available on written request.** Meikigo support logs into the merchant's HitPay account on their behalf and shares the requested information (payout details, transaction history) via email or screen share — the merchant never gets direct login access as a standing arrangement. **However, if a merchant emails Meikigo customer support requesting their HitPay login credentials, support may provide them.** This is a deliberate, logged, support-mediated handover — not self-service, and not automatic.
- **✅ Resolved (Round 21) — ONE HitPay account per BRAND, regardless of outlet count, even for FRANCHISE brands.** All Outlets under a single Brand settle through the same connected HitPay account. This applies equally to `BRANCH`-type and `FRANCHISE`-type Brands — a franchise Brand with 5 Outlets does not get 5 HitPay accounts; it gets one.
- **✅ Resolved (Round 21) — settlement is MERCHANT-INITIATED, not automatic payout.** The Brand requests settlement from Meikigo; a Meikigo **finance** employee processes it by logging into the Brand's HitPay account and initiating the payout to the merchant's bank. HitPay's own automatic payout scheduling is not used — Meikigo controls the timing.
- **✅ Resolved (Round 22) — settlement rules: no minimum balance, no frequency cap, processed within 2 business days.** Brands can request settlement anytime. Meikigo processes the request within 2 business days of receiving it.
- **✅ Resolved (Round 26) — Request payout screen in `meikigo-merchant`.** The owner sees last known HitPay available balance (or "we will confirm"), types an optional note, and submits. A ticket appears in `meikigo-admin`. Support may **create** the ticket; only the **finance** role may **complete** payout. Staff marks done; the owner gets an email. There is **no** self-serve button that calls HitPay payout from the merchant app. Log who paid, amount, and HitPay payout id.
- **✅ Resolved (Round 26) — bank account change after KYB.** The owner requests a bank change in `meikigo-merchant` (new account number + bank + proof). Meikigo staff update it in HitPay after a check. **Electronic pay stays on.** **Payouts pause** until HitPay accepts the new bank. They do not have to redo full KYB from scratch.
- **✅ Reconfirmed (Round 20) — every HitPay call, for both flows, is proxied through `meikigo-api`.** Recorded as given: *"in addition all these request must go through meikigo's API."* No app calls HitPay directly — this restates, rather than changes, what the "own checkout UI, not HitPay-hosted" and `HITPAY_*` env-var-placement decisions already implied (see above): `meikigo-merchant`, `meikigo-pos-native` and `meikigo-customer-webapp` all reach HitPay-backed behaviour exclusively through `meikigo-api` endpoints.

### HitPay Account Creation & Verification — ✅ Resolved (Round 21)

- **✅ Timing: Meikigo creates the Brand's HitPay account right after the Brand finishes Organisation setup in `meikigo-merchant`.** The Brand can only accept **cash payments** until HitPay's business verification (KYB) is approved — which can take days. Electronic payment methods appear on the POS only once the HitPay account is verified and live. This is not a blocking gate — the Brand can trade, take queue tickets, and operate normally on cash while verification is pending.
- **✅ KYB documents are collected BY MEIKIGO during Organisation setup and submitted to HitPay on the merchant's behalf.** The merchant never interacts with HitPay's verification page directly. Meikigo collects the required documents as part of the Organisation setup flow, and submits them through HitPay's API or dashboard. If HitPay rejects or requests additional information, Meikigo relays that to the merchant and resubmits — the merchant's only touchpoint is Meikigo, never HitPay.
- **✅ Resolved (Round 22) — KYB document list for Malaysia, collected during Organisation setup:** SSM certificate (Form 9/13/49), owner's IC (front + back), a selfie of the owner, business bank account details (account number + bank name), and business address proof. These match HitPay's published Malaysia document requirements. All uploads happen inside the Organisation setup flow — one-time collection.
- **✅ Every Brand gets a HitPay account regardless of tier, INCLUDING FREE.** The spec says FREE uses the same gateway and the same payment methods as paid tiers (card + DuitNow). Creating and verifying a HitPay account for every free merchant is accepted as operational work — it is the cost of "FREE has real electronic payments."
- **✅ Resolved (Round 26) — FREE does not get HitPay Recurring Billing and no card is collected.** The connected POS HitPay account still exists so the shop can take DuitNow/card at the counter.

### Platform Key — ✅ Resolved (Round 21)

- **✅ Meikigo NEEDS a Platform Key (`X-PLATFORM-KEY` header), and it must be obtained from HitPay before Phase 1 goes live.** This is the mechanism that enables commission collection and unified webhooks. Without it, the entire commission model does not work. Obtaining the Platform Key is a manual request to `support@hit-pay.com` — it is not self-service.
- **✅ Commission collection uses HitPay's per-transaction `platform_commission_amount` parameter.** Meikigo calculates the correct commission for each transaction based on the payment method's configured rates (the two-field `meikigo-admin` config from Round 20) and passes the exact amount to HitPay on each payment request. This matches the variable-rate commission model (2% ceiling minus HitPay's own fee per method).
- **✅ Unified webhooks through the Platform Key** — all sub-merchant charge events come to ONE Meikigo webhook endpoint. Meikigo routes them internally by the merchant/Brand identifier in the payload. This is simpler to manage (one endpoint to monitor) and consistent with the Platform Key being the foundation of the integration.

**Commission rate — ✅ Resolved (Round 19), a 2% CEILING on the total fee charged to the merchant, not a flat Meikigo cut:**

> Worked example given: *"If Ali use duitnow to pay RM10 which is 1.2% (RM0.12, taken by hitpay), meikigo will add 0.8% (RM0.08) to make it 2% as total on fee. 0.8% is meikigo's commission."*

So the mechanic is: **Meikigo's commission = 2% − HitPay's own percentage fee for that payment method**, applied on top, up to the 2% ceiling. HitPay's flat per-transaction charges (the `+ RM1` on card methods) are **not** touched by the cap — they pass through unchanged; the 2% figure applies to the percentage component only.

**✅ Resolved (Round 20) — how the rate is set: two independently configurable fields in `meikigo-admin`, not a hardcoded ceiling formula in code.** Recorded as given: *"A. So system will calculate the fixed percentage from hitpay, but we need to configure in meikigo-admin + our commission, also configurable in meikigo-admin. Example, we set the hitpay fees 1.5% percent in meikigo-admin and our commission 1%. The total deduction from the outlet hitpay account is 2.5%."*
- **Per payment method, `meikigo-admin` holds two separately-editable percentages: HitPay's own fee, and Meikigo's commission.** The total deducted from the Brand's connected HitPay account is the sum of the two. This is what lets Meikigo update either number later (HitPay changing its own rates, or Meikigo changing its cut) without a code deploy.
- **✅ Resolved (Round 21) — the 2% is a GUIDELINE, not a hard system cap.** `meikigo-admin` allows any combination of HitPay fee + Meikigo commission without validation — the operator sets what they want. There is no system-enforced ceiling. The 2% figure from Round 19's worked example was a pricing decision for launch, not an invariant the tooling should enforce. This closes the arithmetic tension from Round 20: the 2.5% example was a legitimate illustration of the two-field UI, not a contradiction of a hard cap, because no hard cap exists.

| In-person method (POS) | HitPay's own fee | Meikigo's commission (2% − HitPay's %) | Total charged to merchant |
|---|---:|---:|---:|
| DuitNow | 1.2% | 0.8% | **2.0%** |
| Domestic card | 1.2% + RM1 | 0.8% | **2.0% + RM1** |
| Touch 'n Go | 1.6% | 0.4% | **2.0%** |
| GrabPay | 2.0% | 0.0% | 2.0% (at the ceiling already) |
| ShopeePay | 2.0% | 0.0% | 2.0% (at the ceiling already) |
| ShopeePay Later | 1.8% | 0.2% | **2.0%** |
| WeChat Pay | 1.5% | 0.5% | **2.0%** |
| International card | 3.0% + RM1 (+2% on FX) | **0.0%** | 3.0% + RM1 — already over the ceiling |
| Paylater by Grab | 5.5% | **0.0%** | 5.5% — already over the ceiling |
| Atome | 5.5% + RM1 | **0.0%** | 5.5% + RM1 — already over the ceiling |

- **⚠️ Flag worth confirming, not assumed silently:** for the last three rows, HitPay's own fee already exceeds the 2% ceiling, so this formula gives **Meikigo RM0 commission** on those methods rather than a negative number or a higher merchant charge. That is the literal reading of *"the cap we set is 2%, that's the ceiling"* combined with the worked example, and it is a reasonable, safe interpretation — but it does mean Meikigo earns nothing on international-card, Grab-Paylater or Atome transactions. Worth a one-line confirmation before build, since it is a real revenue consequence and the answer didn't address it directly.
- **This table is for in-person (POS) payments.** The Online Payments and Recurring Payments rate cards given apply to the **subscription billing flow** (first subscribe = Online rates; renewal = Recurring rates) — see Recurring Billing below for a rate-card gap worth flagging there.
- **Subscription billing itself carries no "commission" concept** — Meikigo is both platform and merchant on that flow, so HitPay's fee on a subscription charge is simply Meikigo's own processing cost, not something split with anyone.
- **Basis:** per the worked example, commission is computed on the amount actually charged through HitPay for that transaction — i.e. the snapshotted, post-discount line total sent to HitPay (see Amount Source of Truth below), not the pre-discount catalogue price.
- **Excluded from commission, by the existing rules already in this document:** tips (never part of the sales subtotal — see Tips), and cash (never touches the gateway at all — see Cash).
- **✅ Resolved (Round 21) — commission IS RETURNED on refund.** When a transaction is refunded, Meikigo's commission is returned to the merchant. HitPay's platform commission handles this automatically when using the `platform_commission_amount` parameter — HitPay reverses its own fee and the platform commission together. For partial refunds, the commission is returned proportionally. This closes the previously-open refund/commission question.

### `HITPAY_*` Environment Variables — ✅ Resolved (Round 19)

Recorded as given: *"everything is in meikigo-api"* — this closes the repo-placement half of the KIV item. The exact variable names still need a final check against HitPay's live API reference at build time (*"please refer hitpay doc"*), but the shape is now clear from the account model above:

- **Platform-level vars (Meikigo's own master account) live as real env vars in `meikigo-api`:** an API key (`X-BUSINESS-API-KEY` header per HitPay's API), a webhook signing salt, and an environment flag selecting `https://api.sandbox.hit-pay.com` vs `https://api.hit-pay.com`. **Nothing HitPay-related is templated in `meikigo-merchant`** — every frontend reaches HitPay-dependent logic through `meikigo-api`, consistent with the existing BFF pattern.
- **Per-Brand credentials are NOT env vars at all — they're data.** Each Brand's own connected-account API key and webhook salt are created dynamically per merchant (Meikigo creates the HitPay account, not the merchant), so they belong in the database against the Brand record, held encrypted, and managed through `meikigo-admin`'s existing HitPay-configuration scope — matching what App Inventory already says about `meikigo-admin` "creating merchant HitPay accounts and holding their API keys."
- **One webhook signing salt per HitPay account, not one platform-wide secret** — Meikigo's own master account has its own salt for subscription-billing webhooks; each Brand's connected account has its own salt for that Brand's POS webhooks. The webhook handler must look up the right salt by which account the callback identifies itself against, not assume a single global secret.

### Webhook Mechanics — signature, idempotency, event handling — ✅ Resolved (Round 19)

Signature/idempotency detail was delegated (*"you decide the best... refer HitPay documentation"*). Grounded against HitPay's documented webhook behaviour rather than guessed:

- **Header:** `Hitpay-Signature` — an HMAC-SHA256 hash of the raw JSON request body, keyed with the account's **salt** (the same salt configured in that HitPay account's dashboard, or supplied when the payment request was created). **✅ Reconfirmed (Round 20): validate against the raw request bytes, never a parsed-then-re-serialized JSON object** (re-serialization can reorder keys or change whitespace and silently break the hash), and compare with a constant-time/timing-safe function, rejecting the webhook outright on any mismatch.
- **`Hitpay-Event-Type`** (`created`/`updated`) and **`Hitpay-Event-Object`** (`payment_request`, `charge`, `payout`, `transfer`, etc.) headers identify what happened.
- **✅ Subscribed events, confirmed explicitly (Round 20): `payment_request.completed` and `payment_request.failed`** for POS payment completion — *"A"*, subscribe to both rather than inferring failure from the absence of a completed event. **Plus `charge.updated`** for refund confirmation (see Refunds & Voids below). **✅ Round 26: also subscribe to chargeback / dispute events** (or `charge.updated` statuses that mean dispute) — see Disputes below.
- **No separate timestamp header is documented**, so there is no "reject if too old" check to build — **verify the signature and process idempotently**, exactly as option (c) suggested. A replayed old webhook is harmless if processing is idempotent; a forged one is caught by signature verification regardless of age.
- **Idempotency key — ✅ resolved as (c), store both, since HitPay's payload does not expose a separate event/delivery id distinct from the resource:**
  - **`reference_number`** (Meikigo's own Transaction ID, sent as `reference_number` when the payment request was created) is the state-machine correctness key — it's how the webhook is matched back to *which* Transaction to update.
  - **A dedup key = hash of (HitPay's `id` + `status` + `updated_at`)** suppresses exact repeat deliveries of the same event while still allowing a legitimate later transition (e.g. `pending` → `completed`) to process. Log every webhook received, keyed this way, before acting on it.
- **Out-of-order tolerance and the pending state that the counter can see** are already specified above (Round 9) and unchanged.
- **✅ Resolved (Round 20) — identifiers stored per POS payment, three fields:** the payment **request** `id` (the UUID HitPay assigns when the request is created), the **`payments[0].id`** (the actual payment `id` inside the webhook payload — this is the id the refund endpoint needs, see Refunds & Voids below), and Meikigo's own **`reference_number`** sent when the request was created. Recorded as given: *"A"*, storing both HitPay ids rather than looking one up from the other on demand.

### Payment Request Creation Settings — ✅ Resolved (Round 20)

New this round — not previously specified at this level of detail. Recorded as given: *"A"*, the recommended defaults, for every POS payment request Meikigo creates against HitPay:

- **`allow_repeated_payments = false`, always.** Each Transaction gets exactly one payment request; a customer cannot pay the same request twice.
- **✅ `expires_after` = 15 minutes (Round 26).** A stale QR sitting on a counter screen must not still be payable an hour later. Cashier taps Retry after expiry (or sooner if the pay failed).
- **✅ `generate_qr = true` for DuitNow (Round 26).** Draw the QR on the POS from HitPay's embedded QR data. Do **not** open HitPay's web checkout for QR pay. (Touch 'n Go remains out of the Phase 1 method set unless a later round puts it back — Round 20 is still card + DuitNow only.)
- **`send_email = false` and `send_sms = false`.** HitPay does not email or SMS the customer — Meikigo's own receipt flow (Receipt Timing, above) is the only notification the customer gets.
- **`add_admin_fee = false`**, unless a specific Brand genuinely wants HitPay's own admin-fee pass-through added on top — not the default.
- **`reference_number` is always set** to Meikigo's own Transaction ID (this is also the state-machine correctness key from Webhook Mechanics, above).

### Payment Request Expiry & Retry — ✅ Resolved (Round 21)

- **✅ When a QR code expires, the POS shows "Payment expired" and the cashier taps "Retry".** This creates a brand new payment request with a new QR code. The old payment request's Transaction stays in `FAILED` status. The ticket itself is not voided — only the payment request is replaced.
- **✅ Only ONE active payment request per Transaction at any time.** If a first attempt fails (insufficient funds, bank error, timeout), the cashier can create a new payment request for the same Transaction. The old request is cancelled first (if still in `PENDING`). This prevents double-pay while keeping the retry simple — no need to void and re-ring the entire ticket.
- **✅ Refund on a closed HitPay account: handled manually.** If a Brand's Meikigo subscription is cancelled (and their connected HitPay account is deactivated), a refund for a past transaction cannot be processed through HitPay. Meikigo support handles it manually — the merchant refunds the customer outside the system (cash or bank transfer), and the refund is recorded in Meikigo as a **manual refund** with the method noted.

### Payment State Machine & Reconciliation — ✅ Resolved (Round 19)

States, reconciliation cadence, and correction behaviour were all delegated (*"you decide the best... industry standard... refer hitpay doc"*). Recommended, consistent with the state names this document already uses elsewhere (the refund-request `PENDING`/`APPROVED`/`REJECTED` pattern from Round 13, and the existing `EnumPaymentStatus`):

- **Transaction payment states: `PENDING`, `SUCCESS`, `FAILED`.** Refunds keep their own already-settled states — `PENDING_REFUND_REQUEST` / `REFUND_APPROVED` / `REFUND_REJECTED` — unchanged from Round 13. No new states are introduced.
- **✅ A late webhook always corrects forward to `SUCCESS`, even after the POS already showed a timeout or `FAILED`.** The webhook is the source of truth (Round 9); nothing about that changes because the counter guessed wrong first. If the day is already closed when the correction lands, it posts against **today's** figures — the same mechanic already specified for a late-approved refund (Round 13) and for reopening a closed day.
- **✅ Reconciliation cadence — updated (Round 26):** start a status query (`GET /v1/payment-requests/{id}`) **3 minutes** after a `PENDING` transaction is created, then retry every **5 minutes**, and mark `FAILED` at **20 minutes** if still unpaid. The QR itself expires at **15 minutes**, so it dies before we give up. If still unresolved at 20 minutes, surface it to Meikigo staff (see Operational Logging & Alerts below) rather than leaving it silently pending forever. Cashier may tap Retry any time after expiry.
- **✅ If reconciliation (or a late webhook) turns a `FAILED` into `SUCCESS` after the fact, the system auto-corrects the Transaction and the day-close figures update** — same forward-correction rule as above, not a manual fix.
- **✅ A `FAILED` transaction never triggers the receipt/review prompt.** Only `SUCCESS` does (see Receipt Timing below) — so a webhook that never arrives, followed by a reconciliation `FAILED`, correctly never shows the customer a receipt or a review prompt for a sale that (as far as the system can tell) didn't happen. If it's corrected forward later, the receipt/review prompt fires **then**, on the correction.

### Receipt Timing — ✅ Resolved (Round 19)

**✅ Receipt and the customer review prompt happen only after webhook `SUCCESS`** — option (a), chosen as given (*"you decide the best"* pointed at the recommended option). No pending/interim receipt is shown; nothing is generated or unlocked while a Transaction sits in `PENDING`.

### Customer Closes the Browser After Paying — ✅ Resolved (Round 19)

Delegated (*"you decide the best... industry standard... refer hitpay doc"*). Recommended, combining the two complementary options rather than picking one:

- **The POS stays in `PENDING` and does not block the cashier from moving on to the next customer.** Blocking the tablet on one unresolved payment while a queue is waiting is the wrong trade at a barbershop counter; the reconciliation safety net above exists precisely so nobody has to babysit a `PENDING` screen.
- **A manual "Refresh payment status" button** on the ticket triggers the same status-query logic reconciliation uses, so a cashier who's curious (or who has an impatient customer on the phone) isn't stuck waiting for the next scheduled poll.
- Either path — the scheduled reconciliation or a manual refresh — lands on the same webhook-is-truth state machine above, so there's no special-case logic for the browser-closed case specifically.

### Disputes & Chargebacks — ✅ Resolved (Round 19: *"B"*)

**Meikigo handles disputes, not the merchant.** Recorded as given: *"B"*. This means:

- **Evidence must be stored/attached inside the platform** — the receipt, the Transaction record, and whatever the merchant can supply (a note, a photo) need a place to live against the disputed Transaction, retrievable when HitPay or the customer's bank asks for it.
- **Recommended, since the exact UI wasn't specified:** this stays **`meikigo-admin`-only for now**, not a merchant-facing screen — support pulls the evidence from the existing Transaction record and logs, consistent with how `meikigo-admin` already handles support investigations generally (App Inventory). A merchant-facing dispute screen can be added later if volume ever justifies it; nothing here blocks that.
- **✅ Resolved (Round 26) — subscribe to HitPay chargeback / dispute events** (or `charge.updated` statuses that mean dispute). Create a **`DISPUTE` record**, **freeze related settlement** for that Brand until staff clear it, and **alert Meikigo staff**. Do not wait for the shop to shout — HitPay can take the sale + RM200 from the wallet with no other signal.

### Subscription Recurring Charge Mechanics — ✅ Resolved (Round 19), **retry owner superseded (Round 26)**

Sub-parts (b) and (c) of the original question were delegated (*"you decide the best and secure"*). **⛔ SUPERSEDED (Round 26): Meikigo does not run a 3-retry / 2-days-apart charge job.** HitPay Recurring Billing owns retries; Meikigo only listens to webhooks. Confirm HitPay's actual retry schedule in writing before launch and match merchant-facing copy to it.

- **✅ While HitPay is still retrying, the `SubscriptionLine` keeps its last known status (`ACTIVE`)** rather than flipping to a visible `PENDING` state. A merchant should not lose write access speculatively while a retry might still succeed — only HitPay's **final** failure transitions the line to `FAILED`/`EXPIRED`.
- **✅ Webhook → state mapping (Round 26):** a successful `charge.created` / Recurring Billing success webhook (including after HitPay's own retry) moves the line to `ACTIVE`. Intermediate HitPay failures are logged and do **not** expire the subscription. Only HitPay's **final** failure / subscription-expired event moves the line to `EXPIRED`. Do not also fire Meikigo-initiated charges on day 0 / 2 / 4.
- **✅ Idempotent healing, yes:** if HitPay confirms a successful renewal but Meikigo's own DB write fails transiently, webhook reprocessing (HitPay retries webhooks) heals it via the same idempotency mechanism specified above — the dedup key means reprocessing the same event is safe, and a `reference_number` lookup means it still finds and updates the right `SubscriptionLine` on retry.
- **✅ Resolved (Round 21) — subscription billing uses HitPay's Recurring Billing API.** Meikigo creates a plan per tier (STARTER/PLUS/PRO), creates a subscription per Brand, and lets HitPay handle the auto-charge cycle. Meikigo listens to `charge.created` and `recurring_billing.subscription_updated` webhooks. This replaces the need to build an entire billing state machine — HitPay's proven recurring billing logic handles card-on-file storage, auto-charge, and retry scheduling.
- **✅ Resolved (Round 22) — HitPay's AUTO-CHARGE mode is used for subscription renewals.** HitPay charges the saved card automatically each cycle. **HitPay stores the card token — Meikigo does not handle PCI-sensitive token storage.** Meikigo listens to webhooks for success/failure.
- **✅ Resolved (Round 26) — HitPay owns retries; Meikigo does not also retry.** The Round 19 "3 attempts / 2 days apart" job is **not** run by Meikigo. Keep the `SubscriptionLine` `ACTIVE` while HitPay is still retrying; only HitPay's **final** failure moves it to `FAILED`/`EXPIRED`. Confirm HitPay's schedule in writing before launch and match the copy.
- **✅ Resolved (Round 21 + 26) — subscription billing is DOMESTIC CARD ONLY (Visa, Mastercard).** DuitNow is **not** used for first subscribe or for renewals. POS remains DuitNow + card. Recorded as given (Round 26): *"recurring billing such as subscribe : domestic card only"* / *"DuitNow + Card for other than that"*.
- **✅ Resolved (Round 26) — card capture for billing:** send the owner to HitPay hosted save-card / checkout (or embed), then return to Meikigo. No card PAN on Meikigo forms.

### Refund Idempotency — ✅ Resolved (Round 19: *"Use refund request reference idempotency key from HitPay"*)

- **⚠️ One thing worth flagging before build:** HitPay's documented refund endpoint (`POST /v1/payment-requests/{id}/refund`) does not appear to accept a client-supplied idempotency key — there's no header or parameter for it in the reference material available. Calling it twice for the same logical refund would create two refund objects (up to the original amount), not get deduplicated on HitPay's side.
- **So the idempotency guard has to live on Meikigo's side:** lock the refund-request row (the existing `PENDING → APPROVED/REJECTED` record from Round 13) before calling HitPay's refund endpoint, and treat "already has an `APPROVED` refund with a stored HitPay refund `id`" as the block against calling it again — a double-click or a retried request checks this row first rather than hitting HitPay a second time.
- **The refund `id` HitPay returns in its response** (`refunds[].id`) is then the reference stored against Meikigo's own refund record, satisfying the spirit of "use HitPay's reference as the key" even though the guard against duplication is enforced by Meikigo, not HitPay.
- **This needs a final check against HitPay's live API docs before build** — if a real idempotency mechanism exists on their refund endpoint that isn't reflected in the reference material used here, prefer it over the row-lock approach.

### Amount Source of Truth — ✅ Resolved (Round 19), completed (Round 22)

**✅ For electronic payments, the amount sent to HitPay is the snapshotted line total after discounts, with no extra rounding changes** — confirmed as given, matching part (a) of the question exactly. This is consistent with the cash-rounding rule already in this document (Round 11B): **only cash rounds to the nearest 5 sen; card/e-wallet amounts are charged exact**, so there's nothing further to reconcile here — the snapshotted post-discount total *is* the exact electronic amount.

- **✅ Resolved (Round 22) — HitPay API format: decimal string in ringgit with 2 decimal places** (e.g. `'10.50'` for RM10.50). No cent/minor-unit conversion needed — HitPay's MYR API expects this format. The receipt displays the same amount Meikigo computed internally — the two are always identical for electronic payments.

### Operational Logging & Alerts — ✅ Resolved (Round 19)

- **✅ Must-log fields, on every payment event (a):** internal Transaction ID, the queue/booking reference it's attached to, `reference_number` sent to HitPay, HitPay's own payment/resource `id`, the webhook event type/object, signature verification result (pass/fail), and the status transition applied. *"Please add log for each important activity"* — recorded as given, applied broadly rather than to a narrow list.
- **✅ Must-alert conditions (b) — delegated, recommended:** a webhook signature verification failure (a forged-callback attempt, or a misconfigured salt); repeated idempotency-suppressed duplicates beyond a normal retry count (a possible replay or a webhook storm); a reconciliation mismatch (Meikigo shows `PENDING`/`FAILED` but HitPay's own status query says `SUCCESS`, or vice versa); and any `PENDING` transaction that survives the full **20-minute** reconciliation window without resolving.
- **✅ Recipients (c): Meikigo staff only**, not the merchant dashboard. Recorded as given: *"C"*.
- **✅ Resolved (Round 20) — API-limit safety:** *"A"*. Internal throttling on **payment-request creation** (the write path most likely to be hammered by a retried tap at the counter), webhooks as the primary source of truth (not polling), and the reconciliation status-query above is the **only** sanctioned polling path — it runs on its own fixed, capped schedule (3 min → every 5 min → **20 min TTL**, Round 26) rather than tightening into an aggressive poll loop under load.

### Payment completion — ✅ Resolved (Round 9), lifted out of KIV
This one was answered early (Round 9) because it is a build decision rather than a commercial one, and getting it wrong loses money silently. **The rest of HitPay is now resolved too — see Round 19** in Key Decisions Made and the subsections below (account model, commission, env vars, webhook mechanics, state machine, disputes, logging).

- **✅ The WEBHOOK is the source of truth. A payment is complete when HitPay's webhook says so, and only then.**
- **The browser redirect is a UI convenience only.** It moves the customer to a "thank you" screen; it never marks a ticket paid, never fulfils an order, and never triggers a receipt on its own.
- **Why this matters more than it sounds:** if the redirect were authoritative, every customer who closes their browser, loses signal, or switches apps immediately after paying would have their payment silently lost — money taken by HitPay, ticket still showing unpaid at the counter. That failure is invisible until a customer complains, and by then the sale is hours old.
- **What this requires in the build:**
  - **Webhook signature verification** on every callback — an unverified "payment succeeded" endpoint is a way to get free haircuts.
  - **Idempotency.** Gateways retry; the same webhook will arrive more than once and must not create two payments or two receipts.
  - **Out-of-order tolerance.** The webhook can land *before* the customer's browser returns. The redirect handler must therefore read current state rather than assume it is the one completing the payment.
  - **A pending state that the counter can see**, so a cashier looking at a ticket that has not yet been confirmed knows it is awaiting confirmation rather than unpaid.
  - **A reconciliation path** for the case where no webhook ever arrives — a scheduled status query against HitPay for payments left pending beyond a few minutes. Webhooks are reliable, not infallible, and this is the safety net that stops a lost callback becoming a lost sale.
- This also settles the deployment question already recorded: the webhook calls `meikigo-api` directly at `${API_DOMAIN}` through Caddy, not via `meikigo-merchant` (see Environment & Deployment Mapping).

---

## Payment & Transaction System

**Note: This entire data layer is largely unbuilt (~3% complete) and needs to be implemented — Transaction/Order, refund/void, and accounting-sync entities described below do not exist yet in the codebase.**

### POS Location
- POS operations (queue handling, payment) happen in **`meikigo-pos-native`**, the tablet app downloaded at the counter — not a web POS.
- The POS is also what drives queue state — the cashier taps "start"/"done" per client (see Who Drives the Queue State).

### POS Device Session & Locking (Round 5)
- **Resolved (Round 5) — there is NO auto-lock.** The tablet is not required to lock itself after a period of inactivity, and staff are not re-prompted for a PIN or password during the day. The rationale is physical: the tablet lives behind the counter.
- **Resolved (Round 5) — one account may only be signed in on one device at a time** (see Merchant-Side Staff). This is the security control that *is* in place, and it does the work of stopping one credential being shared across a shop's devices.
- Residual risk, stated so it is a decision rather than an oversight: a counter tablet sits signed in all day with access to **sales, refunds/voids, and customer phone numbers**. With no auto-lock, anyone who picks up that tablet inherits the session. Round 6 settled the mitigations:

**✅ Resolved (Round 6) — destructive actions are gated by an OUTLET OVERRIDE PASSWORD, not by switching accounts**
- **Refunds and voids require the Outlet's admin password**, configured in **Outlet configuration**. The cashier stays signed in as themselves and enters that password to authorise the action — **they do not have to sign out and switch to an Admin account.**
- This is the right ergonomics for a counter: swapping sessions mid-transaction with a customer waiting is exactly the friction that gets security controls disabled in practice. A manager typing an override on the cashier's screen is the standard retail pattern.
- **The same override should gate the ad-hoc discount** (Round 6, Admin-only — see Discounts & Promotions), so the counter has one consistent "get a manager" gesture rather than two different mechanisms.
- ⚠️ **Known weakness of a shared secret, and how to blunt it:** an Outlet-level password identifies *the Outlet*, not *a person* — so on its own it cannot tell you which manager authorised a refund, and it leaks permanently once shared or shoulder-surfed. Mitigations to build alongside it:
  - **Log both facts:** the acting account (the signed-in cashier) **and** that the override was used. `voided_by` should record the cashier plus an `authorised_by_override` marker — never silently attribute the void to "Admin".
  - **Make the password rotatable from Outlet configuration**, and prompt the merchant to rotate it whenever staff leave (it is the one credential that does not die with an offboarded account).
  - **Rate-limit and log failed override attempts** — repeated failures on a counter tablet are the clearest signal of someone probing it.
  - Worth considering later, not now: a per-Admin PIN instead of one shared Outlet password would restore attribution at the same counter ergonomics.

**✅ Resolved (Round 6) — an Admin CAN force-sign-out a device.** This closes the lost/stolen tablet hole created by having no session expiry: the Admin can kill a session remotely from `meikigo-merchant`, which is also the mechanism for a staff member who leaves mid-shift.

**✅ Resolved (Round 6) — signing in on a second device KICKS the old device off**, and the displaced tablet shows a clear **"signed in elsewhere"** screen. Chosen over refusing the new login, so swapping tablets never strands staff on a dead device.
- Implementation note: because eviction is silent from the new device's point of view, the "signed in elsewhere" screen must be unmistakable and must offer a sign-in button — otherwise a staff member picking up the old tablet mid-shift will read it as the app being broken.

### In-Shop Queue Display (Round 7)
- **✅ Resolved (Round 7) — the shop can run a queue display on a screen in the premises, and it is driven by a DEDICATED READ-ONLY ACCOUNT.**
- The merchant's own example, recorded as given: Ali has two tablets — one runs the POS, the other shows the running number. He **signs into the read-only display account** on the second tablet.
- **✅ What it shows — CONFIRMED (Round 16): NUMBERS ONLY. No names of any kind.** Recorded as given: *"C"*. The per-barber *"now serving"* numbers, and nothing else — not a full name, not a first name, not initials.
  - **This is the strongest privacy position of the three offered, and it matches what the public queue already exposes.** A screen in a shop window is readable by anyone walking past, and a first name plus a service plus a time is more than a passer-by needs to know about a stranger.
  - **What must exist because there are no names**, or the choice becomes a counter problem instead of a privacy one:
    - **Show a short run of upcoming numbers**, not only the current one — *"Now serving A-14 · Next: A-15, A-16"* — so a waiting customer can judge their own position without asking.
    - **The customer's own app is where their position lives** (pull-to-refresh, Round 1), and the ticket they hold carries their number. A customer who cannot remember their number has the app, the SMS-less email receipt of joining, or the counter.
    - **The counter POS still shows names**, unchanged — the cashier needs to call the right person. Only the wall screen is anonymous.
  - ⚠️ **The one case this makes harder, recorded honestly:** a customer who steps out and misses their number has nothing on the wall to check against, and the grace/expiry rules (Round 5) keep running. **Recommended: the display shows recently-passed numbers too** — *"Passed: A-11, A-12"* — which costs nothing and answers *"have they called me yet?"* without naming anybody.
- Why the separate account matters: the display tablet sits in view of customers all day. Signing it in as a Cashier would leave sales, refunds and customer phone numbers one tap away on an unattended screen — and there is **no auto-lock** (Round 5). A read-only credential removes that exposure entirely, which makes this the right design rather than just a convenience.
- Implementation notes:
  - The display account is subject to the same **one-account-one-device** rule, so its single session is the display tablet.
  - It should be a **genuinely read-only role at the API level**, not a UI that merely hides buttons.
  - Works on any screen with a browser (tablet, TV, old laptop) — no dedicated hardware.
  - **✅ Resolved (Round 8) — it does NOT consume a plan login**, and it is **not offered on FREE** (*"free is meant for solo or hypersmall (1 person) barber with no physical shop"*). One display account per Outlet on STARTER and above, provisioned outside the login quota and never sold as an add-on.

### Inbound Booking Notifications at the Counter (Round 5)
- **Resolved (Round 5) — a notification with sound IS available on the POS, as a per-user/merchant OPTION.** It is not forced on, and it is not the only intended way of noticing new arrivals.
- The merchant's framing, recorded as given: it depends on how the Brand structures its team. A shop can either switch the notification sound on, or assign a staff member to watch the screen. **Usually, once a barber finishes a job, the barber checks the screen and sees who is waiting in the queue** — the tablet is checked at natural breaks in work rather than monitored continuously.
- Implementation implications:
  - An **audible alert plus an unread badge/count** when a remote booking or queue join arrives, both driven by the same mechanism that keeps the queue display current (polling vs. WebSocket/SSE remains an implementation choice).
  - A **merchant/Outlet-level setting to enable or disable the sound** (see Configuration Settings). Sound-off must remain fully workable, because the barber-checks-the-screen-between-clients pattern is the expected default in a small shop.
  - The "who is waiting" view is the screen a barber lands on between jobs, so it should be the POS's default/home state rather than something to navigate to.
- Consistent with the client side staying notification-free: this alert is for **staff on the POS only**. Clients still get no queue notifications of any kind (see Outbound Email).

### Connectivity / Offline Behaviour
- **Resolved (Round 3) — there is no offline mode.** `meikigo-pos-native` is **not** required to keep operating, queue, or take payments while the internet is down, and does **not** need a local database or a sync engine. This is a deliberate scope reduction.
- **When connectivity drops, the shop falls back to operating manually, outside the system** — payments are taken by hand (cash / direct transfer), and the **manager keys the transactions into the app later**, once the connection is back.
- This makes a **manual/backdated transaction entry** capability a real requirement, not an edge case.

#### Manual Transaction Entry — rules (Resolved, Round 4)
- **Admin role only.** Cashiers cannot key in after-the-fact sales.
- **The recorded timestamp is the actual time of sale**, typed in by the manager — not the time the record was keyed in. (Both are worth persisting: sale time drives reporting/tax, entry time drives audit.)
- **Backdating to a previous day is allowed, at the manager's discretion** — there is no system-imposed cutoff on how far back a sale can be entered.
- **Loyalty points are not automatic on these sales — the manager adds them manually, and every such grant is logged.** Attaching the sale to a customer is likewise a manual step by the Admin.
- **Resolved (Round 5) — barber commission IS automatic on these sales**, calculated exactly as on a normal sale (see Commission). This makes barber assignment a **required field** on the manual-entry form, since automatic commission needs a payee.
- **Manually-entered transactions are explicitly flagged as manual**, so they remain distinguishable from gateway-processed sales in reports and audits.
- Because this is the one path where a person can freely write financial and loyalty records, the manual-entry log should capture **who entered it, when, for what sale date, against which customer, and what points were granted**.
- **✅ ⭐ RESOLVED (Round 14) — A MANUALLY-ENTERED (OUTAGE) SALE CAN BE REVIEWED.** Recorded as given: *"A. the client still have their mobile data after all"* — which is the right observation: the *shop's* internet was down, not the customer's phone.
  - **The haircut happened, so the review is as valid as any other.** Refusing it would also mean a barber quietly loses ratings for every hour the shop's connection was down, through no fault of their own.
  - ⚠️ **But the delivery mechanism has to change for this case, and that is the part worth noting.** The normal review prompt lives in the browser tab immediately after payment (Round 2), and an outage sale has no such moment — the sale is keyed in later, sometimes the next day. So this is the **first review that is not prompted by the checkout tab**.
    - **Recommended: the prompt appears in the customer's app the next time they open it**, using the in-app notification list that already exists (Round 5), and it applies **only** to manually-entered sales.
    - **It must be attached to a customer account to work at all** — an outage sale keyed in without a customer attached has nobody to ask, and that is simply a review that never happens.
    - **✅ THE WINDOW IS 7 DAYS (Round 15).** Recorded as given: *"A"*. After 7 days from the sale date the prompt disappears and the review opportunity is gone. This is a deliberate, narrow exception to the "the tab is the window" rule (Round 2) — narrow enough that it does not become a general "review your past visits" feature, which Round 2 rejected on anti-abuse grounds.

### Payment Methods
- **Decision:** Gateway is HitPay (see above), used on **every tier including FREE** — FREE is not a manual/gateway-free flow. **✅ Round 20: methods are NOT tier-gated at all** — card + DuitNow QR is the full electronic set on every tier (see Subscription Tiers table; ⛔ supersedes Round 19's "other eWallets from STARTER up" line).
- **✅ CASH IS A FIRST-CLASS RECORDED PAYMENT METHOD, ON EVERY TIER INCLUDING FREE (Round 11).** The cashier presses **Cash** and the method is stored on the Transaction — it is a recorded method, not the absence of one, and it never touches the gateway.
  - **Day close depends on it entirely:** expected cash is `opening float + cash sales − cash refunds + cash tips taken` (Round 10), and every one of those terms requires cash sales to be identifiable as cash.
  - It is also what makes the **sales-by-payment-method** line on the Z-report and the accountant export meaningful.
  - Not blocked by anything in the HitPay KIV list, and lifted out of it.
- Payment method options are configured via a generic `PaymentService` abstraction.
- **✅ Resolved (Round 21 + 26) — POS embedded QR codes use HitPay's specific method codes for Malaysia:** `duitnow` for DuitNow QR, with **`generate_qr = true`** (Round 26) so the QR is drawn on Meikigo's POS, not HitPay's hosted page. **⛔ Touch 'n Go is not in the Phase 1 method set** (Round 20: card + DuitNow only) — the Round 21 `touch_n_go` code is not used unless a later round adds it.
- **✅ SUPERSEDED (Round 26) — POS card = tap on the POS tablet's built-in NFC (HitPay), when the tablet has NFC.** Not a separate HitPay app, not a Bluetooth reader, and **not** typing card numbers into Meikigo. Tablets without NFC: DuitNow QR + cash only for that device.
  - ⚠️ **Implementation risk, recorded not assumed:** this almost certainly means HitPay's **in-app Tap to Pay / NFC SDK on the POS tablet**, not a second HitPay mobile app and not WisePad. Confirm with HitPay which Malaysia product actually supports reading a card on *our* Android/iPad app before the NFC path is promised in merchant copy. Tablets without NFC stay QR + cash regardless.
- **✅ Resolved (Round 26) — international cards are allowed** if HitPay accepts them. Show the shop the **actual fee** on the Z-report. Meikigo commission 0% on international cards remains (Round 22).
- **✅ Resolved (Round 21) — admin fee / surcharge is NOT available in Phase 1.** The merchant absorbs the processing fee. `add_admin_fee` stays `false` for all merchants. A surcharge pass-through feature may be considered later.

### Payment Model
- **Brand → Meikigo (subscription):** Full payment only — no partial/split payments; the entire invoice amount is settled in one payment (see Subscription & Billing above).
- **Client → Outlet (POS/checkout):** Full payment by a single payer is the default, but **group split payment is supported** — e.g. a group of 5 customers who booked together can each pay their own share instead of one person covering the full amount.
- **⚠️ Resolved (Round 11B) — NO TENDER SPLIT. One Transaction is settled by exactly ONE payment method.** A customer cannot pay RM50 in cash and RM30 by card against the same bill.
  - **These are two different things and the distinction matters, because the words are almost identical.** What Round 11B declined is **tender split** — one bill, two payment methods. What Round 3 approved and what survives untouched is **group split payment** — five customers each paying their own share, which produces **five separate Transactions each with one payment method**. Nothing about the group feature is affected. Anyone reading "no split payment" in isolation would delete the wrong feature.
  - **What this simplifies:** a Transaction carries a single `payment_method`, not a collection of payment records. Day close, the Z-report, the accountant export and the e-Invoice all read one method per sale. Refund-to-original-method (below) is unambiguous because there is only one original method.
  - **What it costs at the counter:** a customer short on cash cannot top up with a card, so the cashier voids and re-rings the sale on one method. Acceptable at this scale, and worth knowing it is a deliberate simplification rather than an oversight.

#### Group Split Payment — mechanics (Resolved, Round 3)
- **Split is itemised, not even.** Each person pays for the services they actually received; the bill is not divided equally across heads.
- **Each share becomes its own separate Transaction** — a 5-way split produces **5 Transactions**, not one Transaction with 5 payment records.
- **Payment methods can be mixed freely** (e.g. 2 pay cash, 3 pay DuitNow) — this falls out naturally, since each share is an independent Transaction.
- **A failed payment is isolated to that one Transaction.** There is no all-or-nothing group bill to unwind; the other four stand, and only the failed share is retried/settled.
- **Only the person who booked needs an account.** The other members of the group do not have to register to be served or to pay their share.
- **Resolved (Round 4) — only the booker earns loyalty points**, because the booking was made under their account. The other members earn **nothing**: points require an account, and they don't have one.
- **Resolved (Round 4) — "party" is a BOOKING concept only, never a payment concept.** Even though the group booked together, the receipt and the Transaction fall on each **individual order**. There is deliberately **no shared group reference at the transaction/receipt level** — the party grouping exists on the booking side and does not carry through to payment or reporting.
  - Reporting consequence to accept: a party of five appears as five independent sales. Nothing links them back together after payment, so "average spend per visit/party" is not derivable — only per-transaction figures are.
- **✅ Confirmed and enriched with the HitPay mechanics (Round 20).** The merchant's own worked example: *"Ali with 2 of his friends make a party booking. When all the cut service is completed, Ali requests to do split payment. This is treated as singular payment for each — 3 separate bills, requiring 3 different dynamic QR and 3 different receipts. The processing fee/related fee will be applied on every single receipt. If Ali wants to pay for all of them (not split), it will be treated as 1 bill."* This is not a new rule — it is Round 3's "each share becomes its own separate Transaction" restated with the electronic-payment detail filled in: **a split of N ways means N separate HitPay payment requests (N separate dynamic QR codes shown one at a time or in sequence at the counter), N separate receipts, and HitPay's fee + Meikigo's commission calculated independently on each of the N amounts** — never once on the pre-split total. A group that pays together (no split requested) stays exactly one bill, one payment request, one QR, one receipt, fees on the one total — the existing default.
  - **This is also why Round 3's "a failed payment is isolated to that one Transaction" already answers the completion-rule question this round re-asked:** each split share is its own HitPay payment request with its own webhook lifecycle: one share can sit `PENDING`, fail, or succeed independently of the other two — there is no group-level "all shares must succeed" gate, consistent with everything already in Group Split Payment mechanics.
  - **✅ Resolved (Round 26) — one QR at a time.** The cashier picks whose share is paying. That QR must **succeed, fail, or be skipped to cash** before the next share's QR is shown. Do not put three QRs on one screen (wrong person pays the wrong amount).

### Product-Only Sales (Round 7)

> Previously impossible: every sale hung off a queue ticket, so a customer buying only a pomade had nowhere to exist in the system.

- **✅ Resolved (Round 7) — the cashier can ring up a product-only sale with NO queue ticket at all.** No barber, no queue number, no wait.
- **✅ Resolved (Round 7) — nobody earns commission on a product-only sale.** This narrows the original rule ("retail commission is tied to whichever barber/staff performs the sale"), which had assumed a barber was always involved. So:
  - Product sold **as a line on a service ticket** → commission at the Outlet rate, to that line's barber.
  - Product sold **on its own** → no commission to anyone, including the cashier who sold it.
- **Loyalty on product-only sales — you asked for my advice. Recommendation, adopted pending your OK:**
  - **Yes for POINTS/spend-based models: a product-only purchase earns points**, attached to the customer by phone lookup at the counter (unattached sales earn nothing, as there is no account to hold a balance). This is consistent with the existing rule that loyalty is cross-service — points earned on a haircut can already be spent on products, so the reverse should also hold. Refusing to accrue on retail would also be odd for the customer: the same RM50 earns points on one visit and not the other.
  - **No for PUNCH-CARD/visit-count models: a product-only purchase must NOT count as a "cut".** Otherwise a customer buys five pomades and claims a free haircut, which is not what "5 cuts = 1 free cut" means and would be a genuine liability leak.
  - So the rule is mechanism-specific: **spend accrues, visits don't.** Worth stating in the merchant-facing loyalty settings so the distinction is visible rather than surprising.
  - If a minimum applies, a **minimum spend to earn points** is the cleaner lever than excluding retail altogether.

### Tips (Round 6)
- **✅ Resolved (Round 6) — the POS supports tipping, added by the customer at CHECKOUT.**
- **The tip goes to the barber who served them**, and is treated **like commission**: it accrues against that barber and is recorded for their pay. **On PRO** it can reach a payslip through the reinstated Payroll module (Round 9); **below PRO** it accrues, is reported, and is paid out by the owner — for cash tips, through the tracked day-close payout (Round 9, below).
- **The tip amount is shown on the receipt**, as its own line.
- **✅ Resolved (Round 7) — where a ticket has more than one barber, the CUSTOMER NOMINATES which barber receives the tip.** If the customer does not nominate any barber, the system splits the tip equally across all barbers on the ticket.
  - Implementation: on a multi-barber ticket the tip step must present the barbers by name (and ideally by the service each performed) so the customer can choose. On a single-barber ticket, no choice is needed — it goes to them.
  - Worth allowing **more than one nomination** if a customer wants to tip both, since the natural reading of "the customer decides" is that they may split it themselves. Recommend supporting per-barber tip amounts rather than one amount plus a picker.
- Points that need settling before build:
  - **✅ Resolved (Round 9) — cash tips are RECORDED AT THE COUNTER and counted into the expected-cash figure.** The money is physically in the drawer, so the drawer figure has to know about it; without this, every till that takes tips shows a permanent variance and the variance figure stops meaning anything.
  - **✅ Resolved (Round 10) — the barber is paid their tips through the MONTHLY PAYROLL RUN, not at day close.** This settles the timing question Round 9 left open, and it went the opposite way to my recommendation, which changes two things:
    - **The cash tip stays in the shop's money.** It goes into the drawer, gets banked with the day's takings, and the barber receives it a month later as a line on their payslip. There is **no cash-out movement at day close** — so the expected-cash formula is simply `float + cash sales − cash refunds + cash tips taken`, with no payout term to subtract. Simpler than the Round 9 version.
    - **The accrued tip balance becomes a liability the shop carries**, potentially for a full month. That is the merchant's call and it is how many salons operate, but it is worth the owner understanding it: the money in the drawer at close includes staff money, and it must not be treated as available cash.
    - **Card and e-wallet tips work the same way** — they were never in the drawer, and they now settle on the same monthly cycle as cash tips, which at least makes all tips behave identically.
    - **The payout is still a first-class record**, now created by the payroll run: barber, amount, period, and the payslip it appeared on. It reconciles against the accrued balance, which is what keeps the per-barber tip total honest.
    - **✅ RESOLVED (Round 11) — every tier gets a "MARK TIPS PAID" action**, so the gap below PRO is closed. The owner picks the barber, the amount and the date, and the payout is recorded against the accrued balance exactly as a payroll-settled payout is: **barber, amount, period, date, and the account that authorised it.** On PRO the payroll run creates this record automatically; on STARTER and PLUS a human creates it after handing over the money. Without it the accrued tip figure below PRO would grow forever and be worthless within two months.
      - It is one small screen and it belongs next to the per-barber tip report, not buried in settings.
      - **Recommended: `FREE` gets it too if tipping is enabled there at all** — a solo barber's tips are their own money, but the balance still has to be clearable.
    - **Tips are still not revenue** (see below) — at no point in this cycle do they touch sales totals, commission-able amounts, or the tax base.
  - **Tips are not revenue.** A tip passes through the shop to the barber, so it must be excluded from sales totals, from commission-able amounts, and from tax — otherwise it inflates the shop's takings and its tax base. Keep it as a separate field on the Transaction, never as a line item in the sales subtotal.
  - **✅ Do tips attract EPF/SOCSO? — MERCHANT-CONFIGURABLE (Round 11).** Recorded as given: *"Each outlet/brand can configure this."* So it is a setting, held at the level the brand type dictates (Outlet on a `FRANCHISE` brand, Brand on a `BRANCH` brand — see Configuration Settings).
    - **Recommended default: OFF** — tips treated as pass-through money rather than wages, shown as their own payslip line with no statutory deduction applied. That is the common treatment and it is the safer default, since switching it on later only ever increases contributions rather than clawing them back.
    - ⚠️ **The setting text must not read as advice.** Whether a gratuity forms part of "wages" for EPF/SOCSO purposes is the merchant's and their accountant's call, not Meikigo's, and the screen should say so in one line. Meikigo provides the switch, exactly as it provides empty commission-rate fields.
    - Whichever way it is set, the payslip must **show the tip line separately** from basic pay and commission, and the payslip record must store which treatment was applied — otherwise no one can later explain how a figure was reached.
  - **Cash tips**: a tip on a cash sale affects the drawer count at day close, so it must be included in the expected-cash figure (see Day Close).

### Discounts & Promotions (Round 6)
- **✅ Resolved (Round 6) — staff can apply an ad-hoc/instant discount at the counter.** This did not exist at all before; the only price reduction in the system was loyalty redemption.
- **Admin-only, and always logged.** Every discount is recorded — who applied it, on which transaction, how much.
  - **✅ Resolved (Round 12) — a discount is authorised by the acting Admin's own approval password**, the same single secret used for refunds, voids and stock approvals. One consistent "get a manager" gesture at the counter, and the log captures **which Admin** authorised it alongside the acting cashier.
  - **Recommendation: require a reason.** A discount without a reason is the classic POS leak (a cashier discounting a friend's cut), and the reason is what makes the log worth reading. A short free-text or a pick-list of merchant-defined reasons both work.
- **✅ Confirmed (Round 7) — discounting is allowed by default and gated by the Admin password**, and applying one raises a **popup asking whether the barber's commission drops with it** (shown only where the Outlet has commission enabled). The answer is recorded per transaction. See Commission.
- **Fixed amount or percentage** both supported.
- **Promotions and vouchers (promo codes, campaign discounts) are PHASE 2** — not in this build.
- Interactions to get right:
  - A discount reduces the taxable amount, so it must apply **before tax** and appear as its own line on the receipt (consistent with how a redeemed free cut is presented — see Loyalty).
  - **✅ Does a discount reduce the barber's commission? — SETTLED (Round 13): each brand/outlet configures it**, with the Round 7 per-transaction popup kept as an override pre-filled from that setting. Recommended default is commission on the **discounted** amount. See Commission for the full rule.
  - Discounts must be visible in the Z-report/day close and in the accountant export, since they are the main non-refund route by which recorded revenue drops.

### Day Close & Cash Handling (Round 6)
- **✅ Resolved (Round 6) — the POS gets a day/shift close, and the owner gets a daily summary report.** Neither existed before, despite cash being a payment method.
- **Day close:** staff **count the cash**, the system shows **expected vs. actual**, and the **variance is recorded**.
- **✅ Expected cash formula, settled in Round 10, ⭐ EXTENDED IN ROUND 17:** `opening float + cash sales − cash refunds + cash tips taken − cash paid out`. A cash tip goes into the drawer and **stays** there — Round 10 pays tips through the monthly payroll run, not out of the till — so there is no payout term to subtract at close. (This is simpler than the Round 9 draft, which assumed a same-day payout.)
  - **⭐ The final term is NEW (Round 17): money the owner takes OUT of the drawer during the day.** See *Cash out of the drawer* below. Without it, every RM50 taken to buy shampoo appears at close as a RM50 variance — which is to say it appears as theft.
- **Daily summary ("Z report")** for the owner at close, containing: **sales by payment method, voids, discounts, and cash expected** — plus, sensibly alongside them: gross/net sales, tax collected, transaction count, tips by barber (taken and paid out), and commission accrued by barber.
  - **✅ Resolved (Round 26) — show the actual HitPay / processing fee on the Z-report**, including when an international card was used (higher HitPay fee, Meikigo commission 0%). The shop must be able to see what was taken, not only "card".
- **One close per Outlet per day** — not per staff member and not per shift, since the tablet is shared anyway. Multiple staff working the same day share the one close.
  - **✅ RE-ASKED AND CONFIRMED (Round 17): *"A"* — there is NO shift close.** An optional per-shift count, where a cashier counts the drawer at handover and the day close adds the shifts together, was offered and declined.
  - **The trade-off, stated so it is a decision and not an oversight:** a shortage has no name against it. A shop with a morning person and an evening person that comes up RM80 short cannot tell which shift it went missing in, and never will. That is accepted — a shift close means every cashier counts cash at handover, which is real work for a two-person shop, and most shops here have one or two people anyway.
  - **What partly answers it anyway, at no cost:** every discount, void, refund and ⭐ **cash-out (Round 17)** already records the acting account and the time, so a variance can at least be read against who was on. The cash count itself is the only thing that is not attributable.
- Implementation notes:
  - An **opening float** has to be recordable at the start of the day, otherwise "expected cash" is meaningless.
  - The close should be **immutable once submitted** (a variance that can be edited afterward is not a control), with a correction made as a new adjusting record rather than an edit — consistent with the platform's no-hard-delete/audit stance.
  - What happens if nobody closes the day? Recommend the system **auto-closes at the daily reset** and flags it as unclosed rather than leaving the day open indefinitely — otherwise the report silently rolls two days together.
  - The close is the natural place to catch the manual/backdated entries from an outage, since those affect cash but were keyed in later.

#### ⭐ Cash OUT of the drawer (petty cash) — ✅ NEW REQUIREMENT (Round 17)
**Recorded as given: *"A"*.** The owner takes RM50 out of the till to buy shampoo. This happens in every shop, every week, and until Round 17 the system had no way to say so — the day close reported a RM50 variance, which is exactly what it would report if somebody had stolen it. The owner then had to remember why, a week later, when the accountant asked.

- **A `CASH_OUT` entry at the POS**, recorded the moment the money leaves the drawer: **amount, reason, who took it, who authorised it, and the time**. A short pick-list of reasons (buy stock, buy supplies, petty cash, pay a bill, bank-in, owner's draw) with free text, so the common cases are one tap.
- **It is part of the expected-cash sum** — that is the whole point. The drawer balances, and the variance line goes back to meaning what it says.
- **⭐ It also becomes an EXPENSE (see Expenses & Profit), and this join is what makes both features worth having.** A cash-out categorised as *buy supplies* posts straight into the expense ledger with its category, note and receipt photo — so the shampoo is recorded once, at the counter, by the person who bought it.
  - **⚠️ Two of the reasons are NOT expenses and must not post as one:** **bank-in** (cash moving from the drawer to the bank is not a cost) and **owner's draw** (drawings reduce the owner's equity; they are not a business expense). Both still reduce expected cash. Getting this wrong overstates costs and understates profit — which is the one number the expense feature exists to produce.
  - So each pick-list reason carries two flags: does it create an expense, and in which category.
- **An Admin's approval password authorises it** — the same secret used for discounts, refunds and stock adjustments (Round 12) — because this is money leaving the till. A cashier raises it; an Admin authorises. **✅ CONFIRMED (Round 18): a merchant-configurable threshold, default RM20, below which no approval is asked.** **Recorded as given:** *"A"* — so buying a bag of ice does not need the owner's thumb, while 0 remains available to a merchant who wants every cash-out approved.
- **The receipt photo is optional at the counter and can be added later.** The person buying shampoo has the receipt in their hand, but making it compulsory at the till is how a feature stops being used.
- **Immutable once submitted**, like every other money record. A mistake is corrected with a reversing entry, never an edit.
- **It appears on the day-close screen as its own line** — *"Paid out: RM50 (2 entries)"* — so the person counting sees why the drawer is light **before** they count it rather than after.
- **Cash-out is cash only.** Stock bought on the owner's own card is an expense typed in the back office, not a drawer movement.
- **Cash IN, the mirror case, uses the same record with a positive direction** — the owner putting float or change into the till mid-day. It is not income and never posts to sales; it only moves expected cash. Cheap to include, and without it the same variance problem exists in the other direction.

### Cash Rounding — ✅ Resolved (Round 11B)
**✅ Cash payments round to the nearest 5 sen. Card and e-wallet payments are charged exact.** Malaysia withdrew the 1 sen coin, so a cash total of RM38.42 cannot physically be paid — the smallest cash increment is 5 sen.

Without this rule the drawer is wrong by a few sen on **every** cash sale, and day close reports a variance every single day. A variance that always appears is a variance nobody reads.

- **The rule (Bank Negara's rounding mechanism):** round the **bill total**, after tax and discounts, to the nearest 5 sen. Totals ending in 1, 2, 6 or 7 sen round **down**; 3, 4, 8 or 9 sen round **up**. So RM38.42 → RM38.40, and RM38.43 → RM38.45.
- **Round the TOTAL, never the line items.** Rounding each line and summing produces a different figure and breaks the tax calculation. The lines and the tax stay exact; only the amount tendered moves.
- **The difference is stored as its own amount on the Transaction** — a `rounding_adjustment` of at most ±2 sen, positive or negative. This is what keeps everything downstream balanced:
  - **Day close:** expected cash uses the rounded figure, so the drawer reconciles exactly.
  - **Accounting:** the rounding differences accumulate into a small gain/loss account, which is exactly how a bookkeeper expects to see it. Over a year they roughly cancel out.
  - **Tax and e-Invoice:** the tax base is unaffected, because rounding happens after tax is computed on the exact amount.
- **Only cash rounds.** A card or e-wallet charge of RM38.42 is charged as RM38.42 — there is no coin involved. This means the same haircut can cost 2 sen more or less depending on tender, which is correct and is what every Malaysian POS does.
- **The receipt shows the rounding line** when it is non-zero. Customers notice a total that does not match the sum of the lines, and an explicit "Rounding: −0.02" line answers it before anyone asks.
- **Refunds round the same way** — a cash refund of an exact amount rounds to the nearest 5 sen and records its own adjustment.

### Receipt Numbering — ✅ Resolved (Round 11B)
**✅ Every sale gets a sequential receipt number. The series restarts each year, and each Outlet has its own series.**

Until now a sale had a database ID and nothing else. An accountant needs a number that runs in order and never repeats, and LHDN's e-Invoice regime expects a document number it can reference.

- **Format:** an Outlet-scoped prefix, the year, and a zero-padded running number — e.g. `KEPONG-2026-000148`. The Outlet code is already in the queue-ticket backend format, so the same code is reused.
- **Per Outlet, not per Brand.** Two branches selling simultaneously must never contend for the same next number. Separate series also means an outlet's books can be read on their own, which is what a multi-outlet owner and their accountant actually want.
- **Restarts each January** at `000001`. Normal practice, and it keeps the number short and human-readable for years.
- **⚠️ The number must be gapless and never reused.** This is the part that is easy to get wrong:
  - Allocate the number **when the sale completes**, not when the cart is created — otherwise every abandoned cart burns a number and the series is full of holes an auditor will ask about.
  - A **voided** sale keeps its number. The number is not recycled and the void is recorded against it. A missing number in a sequence looks like a deleted sale, which is precisely the suspicion an audit trail exists to avoid.
  - Allocation must be safe under concurrency — two cashiers on two tablets closing sales in the same second must not both get `000149`.
- **Exchanges and refunds get their own numbers** in the same series, referencing the original receipt. They are documents in their own right.
- **This is separate from the queue number**, which resets daily, starts at 1000, is per Outlet, and is for calling customers — not an accounting document.

### SST Registration — ✅ Resolved (Round 11B)
**✅ Each Outlet records whether it is SST-registered, and its registration number. An Outlet that is not registered shows NO tax line on any receipt.**

This was a genuine hole. The system had per-Outlet tax configuration but no way to express *"this shop does not charge tax at all"* — so the default behaviour would have had small barbershops displaying service tax they have no right to charge.

- **In Malaysia a business charges service tax only if its turnover passes the registration threshold and it is actually registered.** Most single-outlet barbershops are below it. **Charging tax without being registered is an offence**, so this is not a cosmetic setting.
- **New Outlet fields:** `sst_registered` (boolean) and `sst_registration_number`. The registration number is printed on receipts and is required by the e-Invoice field set.
- **When `sst_registered` is false:** no tax line on the receipt, no tax in the total, no tax in the e-Invoice tax breakdown, and no tax figure in the tax document export. Not a zero — **absent**. A receipt reading "SST: RM0.00" still asserts the shop is in the tax system.
- **When true:** the existing per-Outlet tax configuration applies exactly as already specified.
- **⚠️ Registration status changes over time, and the system must handle it by DATE rather than by rewriting history.** A shop that grows past the threshold and registers in June has receipts without tax from January to May and receipts with tax from June onward. Both are correct.
  - So `sst_registered` needs an **effective date**, and every Transaction stores the tax treatment that applied **at the time of sale** — which the existing price/tax snapshotting already provides.
  - Never recompute tax on a historical receipt. A reprinted receipt from March must look exactly as it did in March.
- **Recommended, and cheap:** validate the registration number's format on entry, and require it when `sst_registered` is set to true. A registered shop with a blank number produces non-compliant receipts and nobody notices until an audit.
- **This is the merchant's declaration, not Meikigo's assessment.** Meikigo does not check turnover, does not advise on whether they should register, and the settings copy must not read as tax advice.

### Transaction Entity
- Build a dedicated **Transaction/Order** entity for POS sales. It is a **separate table from `SubscriptionLine`**, but the two are conceptually related (both represent a payment, just at different scopes — Brand-subscription vs. Outlet-sale). No need for a shared abstract "Payment" base entity.
- POS transactions will likely need a richer payment status model than the existing `EnumPaymentStatus` (PENDING/SUCCESS/FAILED) — e.g. accommodating void, in addition to pending/success/failed.

### Price/Product Snapshotting
- Transaction line items must **always denormalize and snapshot** product name, price, and any applicable tax **at time of sale** — do not rely solely on a foreign key to the current Product row.
- Rationale: merchant-editable catalogs change over time, but historical transactions must stay immutable for audit and LHDN (Malaysian tax authority) compliance. A transaction line item must show exactly what was sold and for how much, regardless of the current state of the product master.

#### ⭐ The price is fixed when the customer COMMITS, not when they pay — ✅ Resolved (Round 12)
**The customer pays the price they were shown when they joined the queue or made the booking.** A customer who takes a ticket at 10am for a RM30 haircut pays RM30, even if the owner raises the price to RM35 before they are served at 11:30. The same rule applies to a booking made three weeks earlier.

- **This extends snapshotting one step earlier in the flow than it previously reached.** Until now the snapshot happened at *sale*; a queue ticket and a booking carried only a reference to the current price. So the customer-facing figure could move underneath them between committing and paying — which is the argument at the counter this rule removes.
- **What to store:** the ticket and the booking each snapshot **the price, the barber, and the tax treatment** at the moment they are created, exactly as a transaction line does. The sale then inherits from the ticket rather than re-reading the catalogue.
- **⚠️ It interacts with two decisions already made, and both are handled the same way — the price is fixed at the moment of commitment, whenever that is:**
  - **Services added mid-cut.** The Round 2 rule is that a ticket's selection is provisional and is confirmed with the cashier afterwards, because customers request extras in the chair. **An extra added at the counter is priced at the counter** — it was never shown to the customer earlier, so there is nothing to honour. Only the lines chosen at join time are protected.
  - **Line reassigned to another barber (Round 9).** Pricing is per barber, so moving a line changes the price legitimately. The reassignment already requires showing and accepting the new price, which is the same principle: the customer sees the number before agreeing to it.
- **What this is not:** it is not an indefinite price guarantee. A ticket that expires, or a booking that is cancelled and re-made, gets today's price. The protection lasts as long as the commitment does.
- **Recommended, small:** where a booking's price has since changed, show the merchant the snapshot price on the POS with a quiet indicator, so a cashier is not confused by a figure that does not match the current menu.

### Refunds & Voids
- **Policy:** Manual refund only — verbal request to merchant → merchant voids manually in POS. No automated (self-service/customer-triggered) refund system.
- **Resolved — refund handling is in scope for the current phase, not deferred:** actual money-back refunds via HitPay's refund API are to be built now, layered on top of the manual-trigger policy above — the merchant still manually decides to initiate a refund (no customer-initiated refunds), but the system calls HitPay's refund endpoint to reverse the charge, rather than only marking the transaction `VOIDED` with no real money movement.
- **✅ Resolved (Round 20) — FULL and PARTIAL refunds are both allowed, merchant's choice, on services and on products.** Recorded as given: *"Allow full and partial refund. Merchant have the option upon this. This can be applied on services or products."* HitPay's refund endpoint accepts a partial `amount`, so this is a UI choice (let the Admin type an amount up to the original total) rather than a gateway limitation.
- **✅ Reconfirmed (Round 20) — the refund call uses the stored `payment_id`** (the `payments[0].id` captured off the completion webhook — see Webhook Mechanics above), never the payment **request** id. Recorded as given: *"A."*
- **Implementation:** **Soft-delete via status flag** — never hard-delete financial records.
  - Transaction row stays immutable; add a status field (e.g. `COMPLETED`, `VOIDED`) plus `voided_at`, `voided_by`, `void_reason` metadata columns.
  - POS/reporting queries filter out `VOIDED` transactions from daily revenue totals while preserving the full audit trail.
- **✅ Resolved (Round 7) — the refund window is MERCHANT-CONFIGURABLE.** There is no platform-imposed time limit; each merchant sets their own (7 days, 30 days, or unlimited at their discretion). Held in Outlet/merchant settings.
- **✅ Resolved (Round 11B) — a refund ALWAYS goes back the way the customer paid.** A card sale refunds to that card; a cash sale refunds from the drawer. The cashier does not choose.
  - **Why this is the only safe rule:** cash-refunding a card sale is one of the oldest ways a shop loses money — a customer (or a cashier) pays by card, requests a cash refund, and the card charge is either never reversed or is later disputed as well. Tying the refund to the original tender closes it without any staff training.
  - **A card refund is not instant.** HitPay reverses the charge and the customer's bank takes its own time — typically a few working days. The receipt and the POS confirmation must **say so**, or the shop will get a phone call the same afternoon. The refund is recorded when it is initiated; the customer sees it when their bank posts it.
  - **A cash refund reduces expected cash at day close**, and is already in the formula.
  - **Consequence for the drawer:** a large cash refund on a quiet morning can empty the till. That is the merchant's operational problem rather than a system one, but the day-close variance report is where it will show up.
  - **Refunds follow the original method even after an exchange**, so a product swapped and then refunded traces back to how the original was paid.
- **✅ ⭐ RESOLVED (Round 13) — A REFUND CAN BE RAISED AS A PENDING REQUEST WHEN NO ADMIN IS THERE TO AUTHORISE IT.** Recorded as given: *"A"*. This closes the gap Round 12 created when it retired the shared Outlet password: a cashier can no longer refund alone, and before this answer the customer simply got a shrug.
  - **Same machinery as the stock-adjustment approval (Round 9/11):** states `PENDING → APPROVED` or `REJECTED`, the three routes to reach an Admin (**Notify via System / Notify via Email / Enter Admin Password**), a required reason, and an audit row naming both the requesting cashier and the approving Admin.
  - **⭐ No money moves and no status changes while the request is `PENDING`.** The original sale stays `COMPLETED`, the drawer is untouched, and nothing is reversed at HitPay. The request is a **promise to refund**, not a refund — and the sale must not be double-counted as refunded when the approval finally lands.
  - **What the customer is told, and it must be printed rather than spoken:** the counter produces a slip (or emails one) carrying the request reference, the amount and *"awaiting approval"*. A verbal promise from a cashier is exactly the thing that becomes a dispute a week later.
  - **On approval the refund executes then, at today's date**, following the existing rules unchanged: back to the original tender, and landing on today's figures if the original day is already closed. **A cash refund approved after the drawer was counted therefore hits today's expected cash**, which is correct and already how a late refund behaves.
  - **✅ Resolved (Round 20) — the exact sequencing for an electronic refund, since "on approval" is two separate moments, not one.** Recorded as given: *"A. So system will calculate... on admin approval, call HitPay refund endpoint immediately; then update our Transaction to REVERSED/REFUNDED ONLY after webhook updates (like charge.updated)."*
    1. Admin approves → the refund-request row flips `PENDING → APPROVED` and Meikigo calls HitPay's refund endpoint **immediately**, synchronously with the approval action.
    2. **The Transaction is NOT marked `REFUNDED`/`REVERSED` at that moment.** It only flips once the **`charge.updated`** webhook confirms the refund actually landed on HitPay's side — consistent with the "webhook is the source of truth" rule that already governs the payment side (Round 9).
    3. Between step 1 and step 2, the refund-request row is `APPROVED` but the Transaction itself is still `COMPLETED` — a visible in-between state, not an instant flip, and the day-close/expected-cash figures should read off the Transaction's confirmed state, not the request row.
    - **This is new detail on top of Round 13's "the refund executes then" line**, not a contradiction of it — "executes" was always the trigger-the-refund moment; Round 20 clarifies that *confirmed* still waits on the webhook, same discipline as the original payment.
    - **✅ Resolved (Round 22) — the FAILURE PATH for step 1:** if the HitPay refund API call fails or times out, Meikigo retries automatically up to 3 times with increasing delay (1 min, 5 min, 30 min). If all 3 retries fail, the refund is marked `REFUND_FAILED` and Meikigo staff are alerted. The admin can re-approve to trigger a fresh retry cycle. The Transaction stays `COMPLETED` throughout (same as the happy path — only `charge.updated` flips it).
    - **✅ Resolved (Round 26) — if HitPay says the charge is not yet confirmed / not refundable yet:** keep **"Refund approved — processing"** and retry on the **same 1 / 5 / 30 min** schedule until the charge is refundable or the 3 retries fail. POS copy: *"Waiting for the payment to settle, then we send the money back."* Do not force the Admin to re-approve just because the wallet was still pending. ⚠️ **This wait/retry applies to methods HitPay can refund (cards).** Whether **DuitNow refunds are supported at all** is still an open Round 24 question — do not assume they work.
    - **✅ Resolved (Round 22) — POS shows an intermediate refund status.** Between approval and `charge.updated` confirmation, the POS displays **"Refund approved — processing"** so a cashier (or a calling customer) can see that the refund has been approved but is awaiting bank processing. The customer should be told it will arrive in their account within 5–10 business days.
  - **✅ ⭐ Resolved (Round 22) — PENDING REFUND REQUESTS AUTO-REJECT AFTER 14 DAYS if no admin action, and the customer is notified.** However, a **Meikigo admin can override** this and keep a request open past 14 days if the circumstances warrant it. This supersedes the Round 14 "never cancels itself" rule — the daily nag continues during the 14 days, but if nobody acts, the system closes it rather than nagging forever.
  - **✅ ⭐ ~~A PENDING REFUND NEVER CANCELS ITSELF, AND IT NAGS DAILY~~ — Originally Resolved (Round 14), SUPERSEDED (Round 22).** The daily nag remains, but an expiry now exists: 14 days, with Meikigo-admin override capability. Recorded as given: *"A"*. It appears on the **day-close screen** and on the **owner's dashboard**, and the Admin is **emailed every day** until it is approved or rejected. There is no auto-expiry: a customer is waiting for their money, so the system should keep making noise rather than quietly tidying the request away.
    - **Recommended: show the age in days** on both screens (*"pending 4 days"*), and count pending refunds in the day-close summary so an owner cannot close a day without seeing them.
    - **Rejection is what closes it, not time.** If the merchant decides not to refund, they reject it with a reason — that is a real outcome and a real record. Silence is not.
  - **Rejection must be visible and reasoned**, and the merchant — not the system — tells the customer. A rejected refund request is a legitimate outcome (the goods came back damaged, the claim was wrong) and it is exactly the record the control exists to produce.
  - **The card-refund timing warning still applies** on approval: HitPay reverses the charge and the bank takes its own days, so the customer's wait is the approval delay *plus* the bank's.
- **✅ Resolved (Round 7) — a refund or void NEVER edits a transaction record, and never edits an already-closed day.** The merchant's instruction: *"maintain the source of truth practice — never edit any transaction record."*
  - So refunding a sale from a day that has already been closed and cash-counted lands as a **refund on today's figures**, referencing the original transaction. The closed day's numbers are immutable and its cash variance stays as signed off.
  - This is consistent with everything already specified: soft-delete via status flag, no hard deletes on financial records, and the day close being immutable once submitted with corrections made as new adjusting records.
- **Resolved (Round 3) — a refund/void reverses the money only. Nothing else unwinds.**
  - Loyalty points **earned** on that transaction are **not clawed back**.
  - Loyalty points **redeemed** on that transaction are **not returned** to the client's balance.
  - The barber's **commission is not reversed** — **✅ reaffirmed (Round 11B) now that commission reaches a real payslip.** The question was put deliberately: with Payroll live on PRO, a refunded haircut can be paid out as commission on a payslip, and clawing it back afterwards is far harder than adjusting a report figure. The merchant chose to leave the rule as it is. Recorded as a decision rather than an oversight — the amounts are small and refunds are rare, and the lever if that ever changes is to reverse commission on refunds rather than to unwind a processed payslip.
  - The same holds for partial refunds — no proportional adjustment of points or commission.
  - This is a deliberate simplification, and it is worth knowing the trade-off it accepts: a client who pays, earns points, then requests a refund keeps the points; and commission stays payable on revenue that was returned. Acceptable at current scale, but it is an abuse path if refunds ever become high-volume or self-service.

### Accounting Integration
- **System:** Custom-built internal accounting software (not third-party)
- **Auto-Sync:** Transaction details auto-reflect in merchant accounting module
- **⭐ ✅ IT NOW RECORDS BOTH SIDES (Round 17).** Until Round 17 this module recorded money **in** only. Expenses, cash-outs and posted payroll cost make it a two-sided ledger, which is what the merchant asked for — *"put every transaction in our app like normal accounting software module."* See **Expenses & Profit**
- **Resolved (Round 5) — the accounting module lives INSIDE `meikigo-api`.** It is a module of the existing backend, not a separate service. No separate deployment, no inter-service contract, no separate database — it shares the API's datastore and transaction boundary.
- **Freshness:** the merchant answered the location question only. Taken together with the existing "transaction details **auto-reflect**" rule and the fact that the module is now in-process, the working assumption is **real-time/synchronous** — a sale is visible in accounting as soon as it is committed, since the accounting entry can be written in the same database transaction as the sale. **There is no nightly batch job.**
  - Recorded as an assumption rather than a stated decision, because only part (a) was answered. It is the low-risk reading: real-time in-process posting is simpler than a batch, and it removes a whole class of "accounting is a day behind" support questions. If a batch is ever wanted, it is an additive change.
  - Implementation caution that follows from being in-process: an accounting-posting failure must **not** be allowed to fail the sale at the counter. Post the ledger entry in the same transaction where it is safe to do so, but the checkout path must degrade to a retryable queued posting rather than blocking a paying customer.

---

## ⭐⭐ Expenses & Profit — ✅ NEW REQUIREMENT (Round 17)

> **Recorded as given:** *"Add expenses, for all paid tier. So our objective is to allow the brand(merchant) can put every transaction in our app like normal accounting software module. So my final word is please add the expenses too. And the differences starter vs plus/pro is the dashboard. Starter dashboard is simpler and plus/pro is more details. I dont know what to display, you will decide."*

**What was wrong until now.** The accounting module recorded money coming **in** — sales, refunds, tips, tax — and nothing at all going **out**. Not rent, not electricity, not the shampoo the shop buys, and not wages: payroll worked the numbers out and posted them nowhere. So the owner could see **sales** but never **profit**, and *"how much did I actually make last month?"* — the one question every shop owner asks — was answered in Excel.

**What Round 17 decides.** Expenses are built, on **every paid tier**, and the objective is stated explicitly: the merchant should be able to *"put every transaction in our app like normal accounting software module."* This turns a sales report into a business report, and it is what makes the accountant export (Round 6) carry **both sides** of the book instead of one.

### Tier availability
- **STARTER, PLUS, PRO and FREETRIAL — every paid tier.** ⛔ **Not `FREE`**, which keeps the sales-only ledger it has today.
- **The tiers do not differ in what can be RECORDED. They differ in the DASHBOARD** — *"Starter dashboard is simpler and plus/pro is more details."* A STARTER shop records every expense it likes; it sees a smaller set of numbers back. See **The Dashboard** below, where both versions are specified, since the merchant delegated that choice.

### What an expense record holds
| Field | Notes |
|---|---|
| **Date** | The date the cost was incurred, not the date it was typed. Backdating is normal and must be allowed |
| **Amount** | Gross. Tax handling below |
| **Category** | From the Brand's own list, seeded by Meikigo (below) |
| **Note** | Free text — *"shampoo × 6, Kedai Ah Meng"* |
| **Receipt photo** | Optional; one or more images, or a PDF |
| **Outlet** | Which shop the cost belongs to — **compulsory**, because profit is only meaningful per shop |
| **Paid by** | Cash / bank transfer / card / e-wallet / other. A **cash** expense taken from the till is a `CASH_OUT` at the POS instead (see Day Close) and must never be typed twice |
| **Recorded by** | The `UserAccount` that entered it, and when |
| **Source** | `MANUAL`, `CASH_OUT` (raised at the POS), or `PAYROLL` (posted by a finalised run). System-posted rows are not hand-editable |
| **Status** | `ACTIVE` / `VOIDED`, with void reason, who and when — never hard-deleted |

### The seeded category list
Meikigo ships a starting list the merchant edits and extends — the same pattern as the wizard's suggested services and the statutory rate tables. A blank category box on day one produces fifty spellings of *"utilities"* and a report nobody can read.

**Rent · Utilities (electricity, water, internet) · Stock purchase · Salon supplies · Wages & staff cost · Equipment · Repairs & maintenance · Marketing · Transport · Licences & fees · Bank & payment charges · Other**

- **Categories are Brand-level**, following the catalogue pattern, so an owner's reports are comparable across branches. Which level *edits* them follows the brand-type rule (Round 11): the Brand admin on a `BRANCH` brand, each Outlet admin on a `FRANCHISE` brand.
- **A category is deactivated, never deleted** — past expenses still reference it, exactly as products and services do.
- **`Other` cannot be removed**, so an expense can never exist without a category.

### Where expenses come from — three sources, and the double-counting risk is the thing to get right
1. **Typed by hand in `meikigo-merchant`** — the ordinary case: rent, the electricity bill, a new pair of clippers.
2. **⭐ From a POS cash-out (Round 17).** Money taken out of the drawer for shampoo is recorded once, at the counter, and lands in the expense ledger with its category. See *Cash out of the drawer*.
3. **⭐ From a finalised payroll run (PRO).** *"Not staff wages — payroll works out the numbers, but nothing posts them as a cost"* was named in the question, so it is answered here: **finalising a payroll run posts one expense per Outlet in `Wages & staff cost`**, for the run's total employer cost — gross pay plus the employer's EPF/SOCSO/EIS — marked `source = PAYROLL` and not hand-editable.
   - **It posts on FINALISE, not on draft**, and reverses if a run is ever unfinalised. The payroll run's three states already exist (Round 11).
   - **On STARTER and PLUS, where payroll does not exist, wages are typed by hand** like any other expense. That is the honest consequence of payroll being PRO-only, and it must be said in the help article rather than discovered.

**⚠️ The one hazard in this design, and it needs building for rather than documenting around: the same cost can be entered three times.** The owner takes RM200 from the till to buy stock (cash-out → expense), records the stock-in against the products, then types *"stock purchase RM200"* in the back office on Friday. One cost, three entries, and profit is understated by RM400.
- **A cash-out that has already posted an expense cannot be typed again.** The back-office expense list shows POS-sourced rows in place, clearly marked, so nobody re-enters them.
- **Stock-in does NOT post an expense automatically.** Stock-in records cost per unit for margin (Round 6), which is a different purpose. **✅ CONFIRMED (Round 18): when a stock-in is saved, the merchant is offered *"record this as an expense too?"* with the amount pre-filled.** **Recorded as given:** *"A"* — a prompt at the moment of the decision, never a silent double entry and never a silent gap.
- **Recommended: a duplicate warning on save** — same Outlet, same category, same amount, inside seven days. One query, and it catches the Friday re-typing.

### Rules that follow from the rest of the document
- **Never hard-deleted.** An expense is voided with a reason, leaving the row and its audit trail, exactly as a transaction is. A correction is a new entry, not an edit.
- **A closed day is never reopened.** An expense backdated into a day already closed is dated then and recorded now; it does **not** alter that day's close or its cash variance — the same rule refunds already follow (Round 7).
- **⚠️ Not part of the SST return.** Meikigo records what the merchant spent; it does **not** compute input tax, claim it, or net it against output tax. An expense may carry an optional tax amount for the accountant's benefit, and the copy must not read as tax advice — the same stance the SST registration setting already takes.
- **The merchant-visible audit log (PRO)** covers expense creation, edit and void. It is a money record.
- **⛔ Recurring expenses — DECLINED (Round 18).** **Recorded as given:** *"B"* — no repeating-expense template. The owner types rent, internet and insurance by hand, every month, same as any other expense. ⚠️ **The risk stays recorded, because declining it does not remove it:** a feature needing twelve manual entries a year is exactly the kind used in January and abandoned by March, and a lapsed entry quietly understates costs and overstates profit from the month it stops being typed. Accepted as the cost of not building a template-and-confirm flow.
- **Receipt photos are stored files** and need the same treatment as any upload: a size cap (recommended 10MB), images and PDF only. **⭐ Stored in OCI Object Storage, behind a signed link (Round 18)** — see Data Storage Requirements → File & Photo Storage.
- **Access follows the existing role split.** Expenses are Admin-only; a Cashier raises a cash-out at the counter but does not see the shop's cost base, and the API enforces it rather than the UI hiding it.

### What it unlocks
- **Profit = sales − expenses**, per Outlet and per Brand, for any period. That is the headline number on the dashboard and the reason the feature exists.
- **The accountant export (Round 6) now carries both sides**, which materially raises what a PLUS or PRO merchant is buying — a sales listing becomes something a bookkeeper can actually work from.
- **Expense by category as a percentage of sales** is the single most useful management figure a small shop can hold, and it is now computable.

---

## ⭐ The Dashboard — Simple vs Advanced, ✅ SPECIFIED (Round 17)

The tier table has read *"Dashboard: Simple / Simple / Advanced analytics"* since the beginning, and nothing anywhere said what either one contained. Round 17 made it the difference between STARTER and PLUS/PRO — *"I dont know what to display, you will decide"* — so it is specified here, and it is a recommendation open to correction rather than a discovered requirement.

**One principle decides both lists: Simple answers *"how is the shop doing?"*, Advanced answers *"why?"*.** Anything needing a comparison, a breakdown or a trend belongs to Advanced. Anything the owner wants before lifting the shutter belongs to Simple.

### Simple — `FREE` and `STARTER`
One screen. No tabs, and no date picker beyond *today* and *this month*.

1. **Today** — sales, number of transactions, cash expected in the drawer, and how many people are in the queue right now
2. **⭐ This month — sales, expenses, PROFIT.** Three figures, the third in the largest type on the screen. On `FREE`, which has no expenses, this is sales only
3. **Top 5 services this month**, by revenue
4. **Needs attention** — products below their low-stock level, pending refund requests, pending stock adjustments, and an unclosed day. Each one a link, not just a count
5. **This month against last month, as a single line** — *"Sales RM12,400 · up 8% on last month"*. One comparison is not analytics; it is the minimum that makes a number mean anything

### Advanced — `PLUS`, `PRO` and `FREETRIAL`
Everything above, plus a date-range picker, and:

6. **Sales trend** across the range, by day, with the previous period behind it
7. **⭐ Profit by month**, and **expenses by category with each as a percentage of sales**. This is the screen the whole expense feature exists to produce
8. **Sales by payment method**, and cash as a share of takings — the figure a shop with a shrinkage problem needs
9. **By barber** — revenue, cuts, average bill, commission accrued, rating, and no-shows against them
10. **By service and by product** — revenue, quantity, and **gross margin on products**, which the cost-per-unit from stock-in already supports
11. **Busiest hours and busiest days**, as a plain heat grid. It is what a merchant uses to set a roster, and the queue data already holds it
12. **Customers** — new against returning in the period, and how many have not visited in 60 days, which is precisely the audience the win-back blast targets (Round 16)
13. **Queue and bookings** — average wait, no-show rate, cancellation rate
14. **Stock on hand, valued at cost**
15. **Loyalty liability** — points outstanding, and what they would cost if every one were redeemed
16. **Outlet comparison**, where the Brand has more than one Outlet — the same figures side by side. On **PRO** this is the HQ dashboard the tier table already promises

### Rules for both
- **Every figure respects the reader's scope.** An Outlet admin sees their Outlet; a Brand admin sees the Brand with an Outlet filter. Nothing crosses a Brand, ever.
- **Voided transactions are excluded, and practice sales do not exist here at all** (see the wizard).
- **Money not yet paid out is not deducted.** A pending refund request is shown as pending; it has not left the shop.
- **⚠️ Recommended: the Simple dashboard must look finished, not disabled.** A screen of greyed-out charts saying *"upgrade to see"* is the most reliable way to make a STARTER merchant feel cheated. Put the upsell in one honest line at the bottom.
- **Recommended: everything on the dashboard exports** to the same XLSX/CSV the rest of the product uses. It costs little and removes a standing support request.

### ⭐ On the owner's phone — ✅ Resolved (Round 18)
`meikigo-merchant` is built for a laptop, but the owner is not always at his laptop — he is at home on a Sunday night, or at his second outlet, and he wants to know one thing: *"how much did we take today?"*

**Recorded as given:** *"A"* — **the dashboard and reports work properly on a phone browser; the rest of the back office stays laptop-sized.**

- **Both the Simple and Advanced dashboard screens (above), and their exports, must render properly in a phone browser.** This is the screen an owner actually opens away from his desk, so it is the one screen worth making responsive rather than forty.
- **Everything else — payroll, settings, staff, catalogue, day close reconciliation — stays desktop-oriented and is not built for a phone screen.** Payroll on a phone in particular was explicitly ruled out as unpleasant to use and not worth the build. A merchant who needs those screens waits until they are at a laptop.
- **This is a rendering scope, not a new feature.** Nothing about what the dashboard shows changes; only that the Simple/Advanced screens and their exports must be usable on a phone's browser, same as the rest of `meikigo-merchant` is usable on a desktop browser.

---

## Payroll — ✅ REINSTATED, PRO ONLY, NUMBERS-ONLY SCOPE (Round 9)

> **✅ Resolved (Round 9) — Payroll IS in this build, on PRO.** This reverses Round 6's deferral and Round 7's removal from the pricing table. Recorded as given: *"After reviewing again all the requirements, we confirm to maintain payroll and myinvois for PRO as we include previously. However, the feature that handle payroll and myinvoice are only focusing on generating the number. Example payroll, every month, user can generate payroll slips for all active employees."*
>
> **The scope sentence is the important one: "only focusing on generating the number."** Payroll calculates and produces documents. It does not file, does not pay, and does not integrate with anything. That boundary was already written into the Round 5 target design below and it now becomes the actual specification.

### What Payroll is, in one line
**Every month, a PRO merchant runs payroll and gets a payslip for each active employee.** That is the feature.

### Scope — in
- **A monthly payroll run**, initiated by the merchant, covering **all active employees** at the Brand/Outlet — both `BARBER` and `STAFF` types (Round 10).
- **Pay calculation per employee**, driven by that employee's `pay_type` (Round 10): basic + commission, commission-only, or daily wage × days worked.
- **Commission accrued from POS sales** in the period (see Commission), and **tips accrued in the period**, which Round 10 routes through payroll rather than the cash drawer.
- **Statutory figures — calculated and shown, not filed:** **EPF, SOCSO and EIS computed** from effective-dated rate tables (EIS confirmed Round 11); **PCB entered by the merchant** (Round 10). **The rate tables are configured by the merchant, not by Meikigo** (Round 11). **Employer-side contributions shown alongside employee deductions** (Round 11).
- **Manual adjustment lines** (Round 11) — deduction or addition, with a mandatory note. Nothing is pro-rated automatically; every exception is a human's line.
- **Attendance** for the period, from the attendance table (Round 10, monthly **or weekly** per Round 11) — required for daily-wage employees, informative for everyone else.
- **A three-state run: `DRAFT` → `CONFIRMED` → `LOCKED`** (Round 11). Nothing is emailed and nothing is frozen until the merchant — or their accountant — has verified the draft.
- **Payslip generation, retention and email delivery** — one payslip per employee per period, stored and reproducible, never regenerated on the fly from mutable data, and **emailed to the employee as a password-protected PDF** (Round 10/11).
- **A payroll register** for the period (all employees, all figures) for the owner and their accountant.

### Scope — explicitly out
Unchanged from the Round 5 boundary, and this is what *"only generating the number"* means in practice:
- **No submission to any government portal** — not LHDN, not EPF i-Akaun, not SOCSO ASSIST. The figures are produced; a human files them.
- **No bank disbursement file, no payment rails.** Meikigo does not move salary money.
- **No sync to third-party accounting software.**
- **No leave management, and — ⚠️ until Round 13 — no overtime engine.** Attendance *is* in scope (Round 10) and **overtime IS now calculated (Round 13, to the Employment Act rules)**. What remains out is **leave entitlement**: balances, accrual, carry-forward and a request/approve flow. Leave *types* are recorded (Round 11B); leave *remaining* is not.

### Tier availability
- **PRO only.** With Round 9 also keeping the MyInvoice pack on PRO, this restores PRO's two differentiators against PLUS and settles the "what does PRO sell now" question that Rounds 7–8 had opened. The pricing table is updated accordingly.
- **One module, no PLUS-vs-PRO variant** — it is present on PRO and absent below, not bigger on PRO.
- ⚠️ **Attendance is the exception, and deliberately so (Round 11): it runs on ALL PAID TIERS**, not only PRO. Payroll consumes it on PRO; a STARTER or PLUS shop still gets a working attendance record on its own. So "attendance" and "payroll" are not the same feature gate.

### What this changes elsewhere in the spec
- **Commission and tips now have a payslip to land on** (on PRO). The Round 5 path is restored end to end: *POS sale → commission and tip calculated automatically per sale, including manually-entered outage sales → accrued against the barber who performed that service line → picked up by the monthly payroll run → appears as a line on that barber's payslip.*
- **On STARTER and PLUS, nothing changes** — commission and tips accrue and are **reported** (per-barber dashboard, Z-report, accountant export), and the owner pays outside the app. That is the same behaviour the whole product had under the Round 6 deferral, so no work is lost.
- **✅ The gap this created is closed (Round 11).** Round 10 routed tip payouts through the monthly payroll run, but payroll is **PRO only**, leaving STARTER and PLUS with an accrued tip balance and no way to clear it. **Every tier now gets a "mark tips paid" action** (barber, amount, date, authorising account) — automatic on PRO through the payroll run, manual below it. See Tips.
- **The `Payroll Data` block under Data Storage Requirements is back in scope** for PRO, and needs building: pay periods, payslip records, per-employee pay lines, versioned deduction rates.
- **⚠️ The refund interaction now has teeth.** A refund does not reverse commission (Round 3), and commission now reaches a **processed payslip** — so commission can be paid out on revenue that was returned, and clawing it back off a payslip is far harder than adjusting a report figure. Acceptable at low refund volume; the lever if it ever matters is to reverse commission on refunds rather than to unwind a payslip.
- **Offboarding already accounts for this** — a resigned barber's unpaid commission stays visible and their final payslip must be producible after deactivation (see Employee Offboarding).

### How an employee is paid — ✅ Resolved (Round 10)
**✅ All three pay models are supported, chosen per employee.** The merchant decides for each person whether they are on basic + commission, commission-only, or a daily wage.

- `Employee` gains a **`pay_type`** field with three values:
  - **`BASIC_PLUS_COMMISSION`** — a fixed monthly `basic_salary`, plus commission earned in the period.
  - **`COMMISSION_ONLY`** — no fixed pay; the payslip is commission (and tips) alone. Common for chair-renting or freelance barbers.
  - **`DAILY_WAGE`** — a `daily_rate` multiplied by **days actually worked**, plus commission if the Outlet has it enabled.
- New `Employee` fields: `pay_type`, `basic_salary`, `daily_rate`. Only the field relevant to the chosen `pay_type` is used, and the UI should show only that one.
- **⚠️ This is what makes attendance a Phase 1 requirement rather than a nice-to-have.** A `DAILY_WAGE` payslip cannot be produced without knowing how many days the person worked. See Attendance below — the two answers depend on each other.
- **Effective-dating matters here too:** a pay rate that changes mid-year must not silently rewrite an earlier payslip. Store rate changes with an effective date, the same way statutory rates are handled.

#### ⭐ Meikigo never adjusts pay by itself — ✅ Resolved (Round 11)
**Two Round 11 answers say the same thing, and together they form a principle worth stating once: the system computes the standard figure, and a human makes every judgement call by hand.**

- **A mid-month joiner or leaver is NOT pro-rated.** Recorded as given: *"In the payroll will appear his full barber, but admin can add deduction RM1000 manually."* A barber on RM2,000 who starts on the 15th appears on the payroll at the full RM2,000, and the admin adds a **manual deduction line of RM1,000** with a note. My recommendation had been automatic day-count proration; the merchant's answer is the more conservative one and it is coherent with the next point.
- **An absence never reduces pay automatically** (see Attendance). The absence is recorded and visible; if the owner wants to deduct for it, they add a deduction line by hand.
- **So the payslip needs manual adjustment lines**, and they are not an afterthought — with no proration engine, they are how every real-world exception gets handled. Each line carries: **type (deduction or addition), amount, and a mandatory note.** Examples the merchant will actually use: part-month joiner, unpaid absence, advance repayment, damaged-stock deduction, bonus, festive allowance.
- **Adjustment lines are part of the draft**, so they are entered and checked before the run is confirmed, and they appear on the payslip as their own labelled lines — never silently folded into basic pay, where nobody could later explain the number.
- ⚠️ **One consequence to be aware of, since it is a real risk in the other direction:** the full-salary default means a barber who left on the 3rd is on the payroll for a full month unless someone remembers to deduct. **Recommended, and cheap: the draft flags anyone whose `start_date` or deactivation date falls inside the period** — *"Ahmad started on 15 June. Full month shown. Add an adjustment?"* — with the suggested figure calculated but never applied. That keeps the merchant's rule exactly as stated and makes the omission hard rather than easy.

### Statutory deductions — ✅ Resolved (Round 10), rate ownership settled (Round 11)
**✅ Meikigo calculates EPF and SOCSO. The merchant types in PCB.** This is the mixed option, and it is the right split.

- **EPF and SOCSO are computed** from rate tables held as configuration with **effective dates**, so a payslip for an earlier month recalculates with the rates that applied then. Both are published, rule-based and stable enough to automate safely.
- **PCB is a merchant-entered figure.** PCB depends on the employee's personal reliefs, marital status and dependants — information Meikigo does not hold and should not start collecting. The field can be left blank.
  - **✅ RESOLVED (Round 13) — PCB IS A STANDING MONTHLY AMOUNT ON THE EMPLOYEE RECORD, overridable on any single payroll draft.** Recorded as given: *"A"*. Nobody wants to retype fifteen numbers every month, and for most employees the figure is stable for a year at a time.
  - **New `Employee` field: `pcb_monthly_amount`** — nullable, defaulting to nothing rather than to zero, so "not set" and "set to nil" are distinguishable. Store changes with an **effective date**, exactly like a pay rate, so a past payslip is not rewritten when the figure is updated.
  - **The draft pre-fills from the standing amount and remains editable per run.** An override applies to that run only and is stored on the payslip; it does not quietly rewrite the employee's standing figure. A one-off bonus month is the case this serves.
  - **The payslip records the amount actually used**, per the existing snapshot rule.
  - ⚠️ **A standing amount is a figure that silently goes stale** — reliefs change, salaries change, and PCB should not. **Recommended: show the date the PCB figure was last changed next to it on the payroll draft**, so an owner reviewing the draft can see that a number is two years old. No warning, no block, just the date.
- **✅ EIS IS CALCULATED (Round 11)** — alongside EPF and SOCSO, the same rule-based way. It sits on every real Malaysian payslip, and leaving it out would have left a visible gap.
- **✅ EMPLOYER CONTRIBUTIONS ARE SHOWN (Round 11)**, clearly separated from employee deductions. The employee's share is cut from their pay; the employer's share is a cost the shop carries on top. A payslip showing only the first half understates what an employee actually costs the shop — the owner should see both. Applies to EPF, SOCSO and EIS.

#### ⭐ Who owns the rate tables — ✅ FULLY SETTLED (Round 12): a Meikigo DEFAULT TEMPLATE the merchant must VERIFY
**Round 11 put ownership with the merchant. Round 12 kept that and added the missing half.** Recorded as given: *"We refers to Merchant Admin. (A). By default, System is expected to generate payroll template with default deduction amount which configure by Meikigo Admin. So, when merchant admin start the business in Meikigo, the payroll structure will follow default template created by Admin. Merchant Admin must to review and verify the structure."*

This is the best available answer and it resolves the practical objection raised in Round 11 without weakening the liability position:

- **Meikigo Admin maintains a DEFAULT PAYROLL TEMPLATE** — the master deduction data: EPF percentages, and the full SOCSO and EIS wage-band tables, employee and employer sides. One authoritative copy, kept current by Meikigo.
- **A new merchant's payroll structure is COPIED from that template** at onboarding. They start from working numbers, not a blank 30-row form. This is what makes payroll usable at all for a barbershop owner.
- **✅ RESOLVED (Round 13) — THERE IS ONE COPY PER BRAND, NOT ONE PER OUTLET.** Recorded as given: *"A"*. The Brand admin verifies the statutory structure once and every Outlet of that Brand runs payroll against it.
  - **Why this is right even on a `FRANCHISE` brand, and why it is a deliberate exception to the brand-type rule:** SOCSO does not change between Kepong and Ipoh. These are national statutory rates, not commercial settings, so replicating them per Outlet would create four chances to hold a wrong table and four verifications to chase instead of one.
  - ⚠️ **This overrides the Round 11 line that put "statutory payroll rates" in the brand-type-driven list.** That list is corrected below (see Configuration Settings): statutory rates and the overtime rules move to **always Brand-level, whatever the brand type**.
  - **Consequence for a `FRANCHISE` brand, stated plainly:** each outlet is a separate business with its own owner-operator, and they will now share one statutory table verified by whoever holds the Brand admin account. That is the correct trade — the alternative is one outlet quietly running an out-of-date EPF rate — but the verification screen should name **which account verified it and when**, so a franchisee can see whose numbers they are relying on.
  - **Payroll still runs per Outlet**, and the payslip still snapshots the rates it used. Only the place the numbers are typed and verified has moved.
- **⭐ The copy belongs to the merchant, and the Merchant Admin MUST REVIEW AND VERIFY IT.** Ownership and responsibility land with them, exactly as Round 11 intended — the template is a starting point, not an instruction.
  - **Build this as an explicit state, not a suggestion.** The merchant's payroll configuration carries a `verified_by` / `verified_at` stamp, and **payroll cannot be run until it is verified**. A "please check with your accountant" banner nobody clicks is not the same control as a gate.
  - **The verification screen shows the figures plainly** with the effective date, and says whose numbers they are: these are the published rates as Meikigo understands them, you are responsible for confirming them, Meikigo warrants nothing.
  - **Re-verification is required when Meikigo updates the template** *and* when the merchant edits a value themselves.
- **The merchant may edit any value.** Their copy diverges from the template the moment they touch it, and Meikigo must never silently overwrite an edited value.
- **When Meikigo updates the master template** (a statutory rate changes), merchants are **notified with a diff** — *"EPF employee rate changes from 11% to 11.5% effective 1 March"* — and choose to accept it into their copy. Pushing it silently would put Meikigo back in the liability seat the merchant deliberately stepped out of.
  - **✅ RESOLVED (Round 13) — HOW THE DIFF IS DELIVERED: an in-app banner in `meikigo-merchant` PLUS an email to the Brand admin, and it does NOT block payroll.** Recorded as given: *"A"*.
    - **The banner persists until the diff is accepted or dismissed** — a one-time toast is not a notification for something that changes people's pay. It sits on the payroll screens, where the person who cares is already standing.
    - **Payroll keeps running on the merchant's currently verified rates.** This is the correct default: an unaccepted diff must never stop a shop paying its staff, and effective-dating means an accepted change still applies from its own effective date rather than retroactively.
    - **Dismissing is recorded, not silent.** Who dismissed it and when, so a merchant who later says "nobody told us" can be shown that they were told. Accepting requires **re-verification** of the affected figures, per the rule above.
    - ⚠️ **The one risk this leaves, and it should be visible in the UI rather than solved by blocking:** a merchant can run payroll for March on February's rates by ignoring the banner. **Recommended: once a diff's effective date has passed, the payroll draft carries an explicit line — *"a statutory rate change effective 1 March has not been accepted"* — next to the figures it affects.** Informational, unmissable, still not blocking.
    - Email goes on the **transactional stream** to the Brand admin, not to every Outlet account — one owner reads it, and the banner covers everyone else.
- **Effective-dating is unchanged**, so a re-issued payslip for an earlier month still computes with that month's rates.
- **Why this is the right shape:** Meikigo carries the *effort* of keeping the tables current, which is where the practical difficulty was; the merchant carries the *responsibility* for the figures on their own payslips, which is where the liability belongs. Neither party is asked to do the thing they cannot.
- **Where they live:** merchant-level settings, effective-dated exactly as before, so a re-issued payslip for an earlier month still uses that month's rates.
- ⚠️ **One thing this answer does not survive contact with, and it needs saying plainly.** EPF is a percentage and a merchant can type it. **SOCSO and EIS are not percentages — they are wage-band contribution tables**, several dozen rows each, with a fixed ringgit-and-sen amount per band for employee and employer. No barbershop owner is going to key in a 30-row table, and one typed wrong is a wrong payslip nobody notices.
  - **Recommended, and it keeps the merchant's decision intact:** Meikigo **ships the published tables as pre-filled starting values** with an effective date and a visible *"these are provided for convenience — verify with your accountant"* notice, plus a `last_reviewed_at` stamp on the screen. The merchant still owns the values, can edit any of them, and Meikigo makes no warranty. That is the same allocation of risk the answer asked for, without asking a barber to transcribe a SOCSO schedule.
  - **If the tables are genuinely to start empty**, then payroll must refuse to run with an explicit *"statutory rates not configured"* block rather than quietly computing zero deductions. A payslip showing RM0 EPF looks correct and is not.
- **A payslip records the rates it used**, not just a pointer to them. If a merchant edits a rate afterwards, previously issued payslips must not change.

### ⭐ Monthly statutory summary sheet — ✅ NEW (Round 14)
**Recorded as given: *"Yes, add this page"*.** Payroll produces fifteen payslips; the owner then has to pay EPF, SOCSO, EIS and PCB **as one total each** through the government portals. Until now they added the payslips up by hand.

- **One page per Outlet per period**, generated from the confirmed payroll run — never from live data, so it always matches the payslips that were actually issued.
- **What it shows:**

| Line | Detail |
|---|---|
| **EPF** | employee total, employer total, combined total |
| **SOCSO** | employee total, employer total, combined total |
| **EIS** | employee total, employer total, combined total |
| **PCB** | total deducted |
| **Headcount** | how many employees are in each total |
| **Per-employee breakdown** | name, IC, EPF/SOCSO membership numbers, wage, and each contribution — because the portals ask per person, not only for a total |

- **⚠️ Meikigo still submits nothing.** This is a sheet to read from and type into the portal. Nothing about it changes the Round 9 "numbers only, no filing, no disbursement" scope, and the page must say so on its face so nobody believes a contribution has been filed.
- **Available on PRO**, because it is produced by payroll and payroll is PRO.
- **Exportable as PDF and XLSX**, the same pair as the accountant export — the PDF for the file, the spreadsheet for the person doing the typing.
- **It is a report of a `CONFIRMED` or `LOCKED` run only.** A draft's totals will change, and a summary printed from a draft is the kind of number that gets paid to the government and then has to be corrected.
- **Recommended: show the payment deadlines as static text** — EPF, SOCSO/EIS and PCB are due by the 15th of the following month — **as a reminder, not as advice**, and without Meikigo tracking whether anything was paid. It is the one line that turns the page from a report into something useful on the 14th.
- **Recommended: a brand-level version** that adds the outlets together, for a `BRANCH` brand paying contributions centrally. Same figures, one page.

### Payroll cadence and coverage — ✅ Resolved (Round 10)
- **✅ Once a month, and nothing else.** No mid-month advance, no off-cycle run in this build. This closes Round 6's "to be revisited".
- **✅ Payroll covers BOTH employee types** — `BARBER` and `STAFF`. A receptionist gets a payslip with salary and statutory deductions and no commission line. A shop pays everyone, not only the people holding scissors.

### Payslip delivery — ✅ Resolved (Round 10)
**✅ Meikigo emails the payslip to the employee.** This makes an email address a **required field on the `Employee` record**, which it is not today.

- **What this changes:** `Employee.email` becomes mandatory at creation, and every existing employee record needs one back-filled before the first payroll run. Worth surfacing in `meikigo-merchant` as a pre-payroll check ("3 employees have no email address") rather than failing halfway through a run.
- **✅ THE PDF IS PASSWORD-PROTECTED (Round 11).** A payslip carries salary, deductions and identifiers, and it is the most sensitive email this product sends. The attachment is encrypted with a **per-employee password set once** — recommended default, the **last 4 digits of their IC**, since it is a secret the employee already knows and never has to be told.
- **✅ The password is RESETTABLE by the merchant Admin (Round 12)**, who can then re-send the payslip. An employee who cannot open their own payslip is otherwise stuck with no route back in — barbers have no login, so there is no self-service reset to fall back on. The reset is an audited action, and the new password is never printed in the covering email.
  - The password is **derived, not stored in clear**, and is never printed in the covering email — an email containing both the file and its password protects nothing.
  - **Recommended: the merchant can reset an employee's payslip password** (an employee who changes IC, or simply cannot open the file, is otherwise stuck).
  - Sent on the **transactional stream**, never the marketing one, and never subject to marketing consent.
- **✅ The payroll run is NOT blocked by a missing email address (Round 11).** The run completes, and the merchant **downloads that person's payslip** to print or hand over. The merchant's note is recorded — *"It is impossible for barbers have no email address"* — and the fallback stays in place anyway, because a payroll run must never be stopped by one bad record.
  - A pre-run check still lists anyone missing an address (*"3 employees have no email address"*) so it is a deliberate choice rather than a surprise.
- **Employees still get no login.** Emailing a payslip does not create an account, and this does not reopen the settled position that barbers have no access to the system.

### ⭐ The payroll run has three states — ✅ Resolved (Round 11)
**Recorded as given:** *"In our previous experiences, we will always have draft for payroll to get approval from accounting to verify the numbers."*

**`DRAFT` → `CONFIRMED` → `LOCKED`.** Once a payslip has been emailed it cannot be recalled, so the check has to happen before the send, not after.

- **`DRAFT`** — the run is generated and every figure is on screen: basic, commission, tips, statutory deductions, manual adjustment lines, net pay, per employee and as a register total. **Nothing is emailed. Nothing is final.** The merchant (or their accountant) verifies here, and this is where manual adjustment lines are added. The draft can be **recalculated or discarded freely** — it is working paper.
- **`CONFIRMED`** — the merchant presses Confirm. At that moment: payslips are generated as documents, emailed, and the figures are **frozen**. The rates used, the pay rates in force, the attendance counts and the adjustment lines are all **copied onto the payslip record**, never referenced live, so a later settings edit cannot rewrite history.
- **`LOCKED`** — the period is closed. **The attendance table for that period locks with it** (Round 10), and the accrued commission and tips it consumed are marked settled so no later run can pay them twice.
- **A mistake found after Confirm is corrected in the NEXT run**, as a manual adjustment line with a note — not by editing or deleting a finished run. **No re-run, no re-send, no delete.** This is the standard payroll discipline and it exists for a specific reason: a shop that can silently re-issue last month's payslip has no defensible payroll record at all.
- **Recommended, since the merchant mentioned accounting verification explicitly:** record **who confirmed the run and when** on the run itself. If the accountant is a separate person from the owner, that is the only trace of who signed off the numbers.
- ⚠️ **Recommended guard: one confirmed run per Outlet per period.** Attempting a second run for a period that is already `LOCKED` must be refused outright, or commission and tips get paid twice.
- **✅ ⭐ RESOLVED (Round 13) — CONFIRM IS BLOCKED WHERE ATTENDANCE IS MISSING, and only there.** Recorded as given: *"A"*. The draft still generates for everybody; the **Confirm button refuses** while any employee on **`DAILY_WAGE`** or **`HOURLY`** has no attendance recorded for the period.
  - **Why the block is scoped rather than global:** for those two pay types the attendance figure *is* the pay — `daily_rate × days` and `hours × hourly_rate` — so a blank table produces a payslip that is confidently wrong. A `BASIC_PLUS_COMMISSION` employee's pay does not depend on the count, so blocking their run would be theatre.
  - **The block must name the people, not the problem:** *"Ravi and Siti have no attendance recorded for March — enter their days before confirming"*, with a link straight to the roster. A disabled button with no explanation is the most common way a control gets worked around.
  - **Zero is a valid entry, and it must be enterable deliberately.** An employee who genuinely worked no days that period is marked as such and passes the gate. What the gate catches is **nothing entered at all**, which is a different state from zero — the two must be distinguishable in the data.
  - **Overtime (Round 13) rides on the same gate:** if a day is marked worked with no hours split, the draft warns; it does not block, because normal hours are already sufficient to pay.
  - This complements the dashboard flag already specified: the roster warns *before* month-end, and the Confirm gate is the last catch.

### Attendance — ✅ Resolved (Round 10), and it IS Phase 1
**✅ The digital punch card is Phase 2. Phase 1 is a manually-marked attendance table — monthly or weekly (Round 11).** Recorded as given: *"Yes, but the digital card only phase 2. But for phase 1, HR manually need to click attend. But in system wise, 1 day before new month, system should create working days/time table for each employee. So system can read Employee X for day 3 is attend, employee for day 4 is absent."*

- **This reverses the Round 9 note that attendance could wait.** It cannot, for one reason: Round 10 also made **daily wage** a pay type, and a daily-wage payslip is `daily_rate × days worked`. Without attendance there is no second number. The two answers are locked together.
- **A scheduled job generates the coming period's attendance rows** — one row per employee per working day.
  - The rows are generated from what the system already knows: the **Outlet's business hours**, the employee's **working hours, off-days and lunch breaks** (Round 6), and the **Outlet's public holiday list** (Round 6, merchant-entered). A day the person was never scheduled to work should not appear as an absence.
  - **Employees who join mid-month** need their rows generated on creation, not left until the following month.
  - **Regeneration is allowed for a period that has not yet been paid**, so a changed off-day pattern can be picked up. Never regenerate a period whose payroll has been finalised.
- **✅ ⭐ THE ROSTER IS MONTHLY *OR* WEEKLY, AND OFF-DAYS ARE FLEXIBLE (Round 11).** Recorded as given: *"System should allow generate working schedule by monthly or weekly and set off days flexible. Reason: In retail, it is very hard to maintain fixed off days for employee by month."* This is the answer that shapes the feature, and it is a correction worth taking seriously — a fixed weekly off-day is a shop-floor fiction.
  - **Generation cadence is a setting, per employee:** monthly (runs one day before the new month, as Round 10 described) or **weekly** (runs one day before the new week). A shop that rosters week by week is not forced into a month-ahead commitment it will only have to redo.
  - **The stored off-day pattern is a seed, not a rule.** It pre-fills the generated rows and nothing more. Any generated day can be changed — `OFF_DAY` to `PRESENT`, `PRESENT` to `OFF_DAY` — right up until the period is paid, with no need to edit the underlying pattern.
  - **An employee with no fixed pattern is fully supported:** generate every open day as a working day and let the roster be edited down. That is option (b) of the question, and it costs nothing extra once the pattern is only a seed.
  - **Recommended UI: a grid, employee down the side, days across the top**, clickable cells. This is a roster, and rosters are edited by looking at the whole week at once. A per-employee form makes a manager open fifteen screens to move one rest day.
- **HR marks each day.** Status set: **`PRESENT` / `ABSENT` / `OFF_DAY` / `PUBLIC_HOLIDAY`**, plus the leave types added below. `OFF_DAY` and `PUBLIC_HOLIDAY` are pre-filled by the generator; a human normally only touches the rest.

#### ✅ Bulk entry by period, and hours (Round 11B)
**Recorded as given:** *"Both options are not reasonable to manage attendance data daily for each employee. Merchant may have manual punch card system and admin can enter total hours by daily, weekly and monthly."*

- **Day-by-day clicking is not the primary way attendance is entered.** The generated table remains the underlying record, but the Admin enters totals at whichever granularity suits them: **per day, per week, or per month.** Many shops already run a physical punch card or a paper book — Meikigo captures the totals from it rather than asking anyone to re-key a month of individual days.
- **Entering a weekly or monthly total writes to the underlying daily rows**, so payroll, reporting and the Phase 2 punch card all keep reading one structure. Distribute across that employee's non-off, non-holiday days in the period; a human can then correct individual days where it matters.
- **✅ RESOLVED (Round 12) — an `HOURLY` pay type was ADDED, so recorded hours now drive pay.** The gap raised in Round 11B was that attendance captured hours no pay type consumed; the answer was to add the pay type rather than drop the hours.
  - **Both figures are captured and both matter now.** `days_worked` drives `DAILY_WAGE`; `hours_worked` drives `HOURLY`. Neither is decorative.
  - **⚠️ This raises the stakes on bulk entry considerably.** A monthly total typed from a paper punch card is now **somebody's actual pay**, not a record for the merchant's own reference. Two things follow:
    - **The entry screen must show the resulting pay** as the figure is typed — *"172 hours × RM8.50 = RM1,462"* — so a mistyped digit is caught by the person entering it rather than by the employee on payday.
    - **Locking on payroll confirmation matters more than before.** Editing hours after a payslip is issued would change history for a paid period; the existing lock already prevents it.
  - **⚠️ ⭐ OVERTIME IS NOW MODELLED — REVERSED IN ROUND 13.** Recorded as given: *"B, follow Malaysia law rule"*. Meikigo **calculates** overtime to the Employment Act rules rather than leaving it to a manual adjustment line. This is the largest single addition Round 13 makes to payroll — see **Overtime — ✅ IN SCOPE (Round 13)** below for the full rule set, the fields it needs, and the one pay type it does not work for.
- **The dashboard should flag unmarked periods** before payroll runs, since bulk entry makes it easy to reach month-end having entered nothing at all.

#### ⭐ Overtime — ✅ IN SCOPE, TO MALAYSIAN LAW (Round 13)
**Recorded as given: *"B, follow Malaysia law rule"*.** Round 12 had left overtime as a manual adjustment line; Round 13 reverses that and asks Meikigo to compute it. So the system now needs the statutory hours rules, not just the statutory deduction rules.

**⚠️ Read this first, because it changes where the liability sits.** Every other statutory figure in this product follows the Round 12 shape: **Meikigo ships a default template, the Merchant Admin verifies it, and Meikigo warrants nothing.** Overtime must follow exactly the same shape — the multipliers and the normal-hours limits are **seed values in the same verified payroll template**, effective-dated, editable by the merchant, and gated behind the same "verify with your accountant" confirmation. Meikigo must not present them as legal advice, because an underpaid overtime claim is a Labour Department matter, not a support ticket.

**✅ Round 14 — MEIKIGO WILL HAVE THESE CHECKED BY AN ACCOUNTANT OR HR PERSON BEFORE LAUNCH.** Recorded as given: *"A"*. That is the right call and it is the single highest-consequence unverified figure set in this document. Until that check is done, treat every number below as **provisional**, and record the check itself: **who verified the overtime rules, on what date, against which published source** — the same `verified_by` / `verified_at` treatment the statutory deduction tables already carry.

**The rules Meikigo seeds, from the Employment Act 1955 (as amended 2022)** — provisional until the Round 14 verification is done:

| Situation | Multiplier on the hourly rate | Note |
|---|---|---|
| Hours beyond normal hours on a **normal working day** | **1.5×** | The ordinary overtime case |
| Hours beyond normal hours on a **rest day** (`OFF_DAY` that was worked) | **2.0×** | On top of the rest-day pay rules below |
| Hours beyond normal hours on a **public holiday** | **3.0×** | `PUBLIC_HOLIDAY` that was worked |

- **Normal hours: 8 per day and 45 per week**, both seeded and both editable. The 45-hour week is the post-2022 figure (it was 48 before), which is exactly the kind of number that changes and therefore must be configuration.
- **Working on a rest day, within normal hours**, is its own rule and not an overtime multiplier: for a daily- or hourly-rated employee, work of **half the normal hours or less pays half a day's wages**, and **more than half up to normal hours pays one day's wages**. A monthly-rated employee gets the equivalent addition. Only the hours **beyond** normal hours attract the 2.0×.
- **Working on a public holiday** carries the holiday pay **plus two days' wages at the ordinary rate**, with 3.0× applying only to hours beyond normal hours that day.
- **The monthly overtime ceiling is 104 hours** (Employment (Limitation of Overtime Work) Regulations 1980). Meikigo should **warn, not block**, when a period exceeds it — the hours were worked and the payslip must reflect what is owed; the warning is what makes an owner notice they have a scheduling problem.
- **The hourly rate for a monthly-rated employee is derived, not typed:** ordinary rate of pay = **monthly wage ÷ 26**, and the hourly rate = ordinary rate ÷ normal hours per day. Store the divisor (26) as configuration too.
- **⚠️ Who is legally entitled matters and should be a field, not an assumption.** Since 1 January 2023 the Act covers all employees, but the hours-and-overtime provisions apply to those earning **RM4,000 a month or less**. So `Employee` needs an **`overtime_eligible`** flag — defaulted from the wage but **explicitly settable**, because a merchant may choose to pay overtime to someone the Act does not require it for, and that is their right.

**What this requires that does not exist yet**

- **⭐ Attendance must capture overtime hours, not just total hours.** A single `hours_worked` figure cannot be split into normal and overtime after the fact once bulk entry is involved. **Recommended: `hours_worked` plus a separate `overtime_hours` per day**, with the daily 8-hour threshold used to pre-fill the split and the Admin able to correct it. The day's **status already tells the system which multiplier applies** — `PRESENT` → 1.5×, a worked `OFF_DAY` → 2.0×, a worked `PUBLIC_HOLIDAY` → 3.0× — which is why the leave/day-type work from Round 11B is what makes this feasible at all.
- **✅ A WORKED REST DAY IS A TICK BOX, NOT A NEW STATUS — Resolved (Round 14).** Recorded as given: *"A"*. `OFF_DAY` and `PUBLIC_HOLIDAY` keep their meaning, and each attendance row gains a **`worked` flag** plus its hours. This is the smaller change of the two offered and the safer one: every report, every payroll rule and every screen that already reads the status set keeps working untouched, and the Phase 2 punch card writes into the same shape.
  - **The flag is what selects the multiplier** — a ticked `OFF_DAY` pays 2.0× beyond normal hours, a ticked `PUBLIC_HOLIDAY` pays 3.0×.
  - **Ticking it must require hours.** A day marked as worked with no hours is a row that pays nothing and looks like a bug; the entry screen should ask for the hours in the same action.
  - **A ticked off-day still counts as a worked day for `DAILY_WAGE`**, which is the other place this flag changes money.
- **The bulk-entry screen must show the resulting money as it is typed**, extended to overtime: *"172 normal + 12 OT hours → RM1,462 + RM153 = RM1,615"*. Round 12 already required this for hours; overtime makes it more important, not less, because a mistyped OT figure is paid at 1.5× the error.
- **The payslip shows overtime as its own labelled lines, by multiplier** — never folded into basic pay or into one "overtime" lump. An employee querying their pay needs to see *12 hours at 1.5× = RM153*, and the payslip must snapshot the rates and multipliers used, exactly as it already snapshots statutory rates.
- **Overtime is not commissionable and not a tip.** It is wages: it forms part of the EPF/SOCSO/EIS wage base, and it must not touch the commission calculation.

#### ⭐ Overtime for a `COMMISSION_ONLY` barber — ✅ Resolved (Round 14): the merchant sets an overtime rate PER PAY TYPE
**Recorded as given:** *"Yes, outlet can configure barber type, for example like you said, only commision. For this type of barber, admin of outlet/brand can configure overtime value for this type."*

The problem this solves: a commission-only barber has no basic wage, so there is no ordinary rate of pay to derive an hourly rate from, and therefore nothing for a 1.5× multiplier to multiply. The answer is neither "require a salary" nor "no overtime" — it is a **configured overtime basis, held per pay type rather than per person**.

- **New setting: an `overtime_basis_hourly_rate` per `pay_type`**, configured by the Outlet or Brand admin (following the brand-type rule — Outlet-level on a `FRANCHISE` brand, Brand-level on a `BRANCH` brand). So a shop types one figure for *all* its commission-only barbers rather than fifteen figures on fifteen records.
- **The multipliers are unchanged** — 1.5× / 2.0× / 3.0× apply to this configured rate exactly as they apply to a derived rate. Only the base number comes from a different place.
- **Where each pay type gets its hourly rate:**

| Pay type | Overtime base rate |
|---|---|
| `HOURLY` | the employee's own `hourly_rate` |
| `BASIC_PLUS_COMMISSION` | derived: monthly salary ÷ 26 ÷ normal hours per day |
| `DAILY_WAGE` | derived: daily rate ÷ normal hours per day |
| **`COMMISSION_ONLY`** | **the configured `overtime_basis_hourly_rate` for that pay type (Round 14)** |

- **Recommended: allow a per-employee override on top.** The setting removes the typing; a senior commission-only barber may still warrant a different figure, and one nullable field on `Employee` covers it without anyone having to use it.
- **If the figure is not configured, overtime simply is not calculated for those employees**, and the payroll draft says so plainly — *"3 commission-only staff have overtime hours but no overtime rate is set"*. It must not silently pay zero for hours that were recorded, and it must not block the run either: the owner can add a manual line and fix the setting afterwards.
- ⚠️ **Worth saying once, and it belongs on the settings screen rather than in a warning:** a commission-only arrangement with recorded overtime hours is an unusual employment shape, and whether it complies with the Employment Act is the merchant's question for their adviser, not Meikigo's to answer. Meikigo provides the field, as it does for every other statutory figure.

#### ✅ Leave types (Round 11B)
**Leave types are added now**, rather than deferred to the Phase 2 punch card as recommended. `ABSENT` is no longer one undifferentiated bucket.

- **Statuses become:** `PRESENT` / `OFF_DAY` / `PUBLIC_HOLIDAY` / **`ANNUAL_LEAVE`** / **`SICK_LEAVE`** / **`UNPAID_LEAVE`** / `ABSENT`.
  - `ABSENT` is kept deliberately, and means **absent without leave** — a no-show. Merging it into unpaid leave would lose the distinction that actually matters to an owner.
- **What each does to pay**, which is the only reason payroll cares:
  - `ANNUAL_LEAVE` and `SICK_LEAVE` are **paid** — the employee's salary is unaffected, and for a daily-wage employee the day still counts.
  - `UNPAID_LEAVE` and `ABSENT` are **unpaid** — the day does not count toward a daily wage.
  - **Nothing is deducted automatically from a monthly salary.** The Round 11 principle stands: the system counts the days and shows them, and the Admin adds a manual deduction line if they choose to dock pay. Payroll surfaces *"3 unpaid days this period"* on the draft as a prompt, never as an applied deduction.
- **⚠️ What this does NOT include, and the difference is worth being clear about.** Recording *leave taken* is not the same as *leave entitlement*. There is no balance ("Ali has 8 of 14 days left"), no accrual, no carry-forward and no approval workflow for a leave request. Those are what the Employment Act actually turns on, and they are a substantially larger feature.
  - What is built answers *"why was Ali not in on the 14th?"* and *"how many days does he get paid for?"*.
  - What is not built answers *"has Ali exceeded his annual leave?"* — the merchant still tracks entitlement outside Meikigo.
  - **Recommended sequencing:** leave balances belong with the Phase 2 punch card, where clock-in data makes them meaningful. Flagged in To Be Determined so the limit is visible rather than assumed away.
- **✅ AN ABSENCE NEVER REDUCES PAY AUTOMATICALLY (Round 11).** The absence is recorded and visible on the payslip's attendance summary; if the owner wants to deduct for it, they add a **manual deduction line** (see *Meikigo never adjusts pay by itself*). The reason for an absence — sick, emergency, agreed unpaid leave, or simply not turning up — is a human matter that no attendance table can tell apart.
  - **The exception is `DAILY_WAGE`, and it is not really an exception:** that payslip is `daily_rate × days worked`, so an absent day is simply not a paid day. Nothing is deducted; it was never added.
- **✅ Available on ALL PAID PLANS — STARTER, PLUS and PRO (Round 11)**, not PRO-only. Payroll consumes the table on PRO; below PRO the shop still gets a working attendance record, which is useful on its own and is what Phase 2's punch card will write into. **`FREE` does not get it** — one solo barber has nobody to mark.
- **✅ Marked by the Admin role only (Round 11).** Not the Cashier. This is an owner/HR task, and attendance drives pay — a cashier who can mark their own colleagues present is a payroll control failure. **Where marking happens:** in `meikigo-merchant` (the back-office), not on the POS. The POS gets it in Phase 2 when barbers clock themselves in.
- **Payroll reads the table**, and it must be **locked once a payroll run is finalised** for that period, so attendance cannot be edited after the payslip is issued.
- **Leave (annual, sick, unpaid) is NOT tracked in Phase 1** — it was not asked for and it is a much larger feature than a punch card. `ABSENT` currently covers everything from leave to a no-show, which is fine for producing a payslip and insufficient for Employment Act leave entitlements. Worth knowing that limit exists; see To Be Determined.
- **Phase 2 replaces the marking, not the table.** The digital punch card writes `PRESENT` with real clock-in/clock-out times into the same structure, so nothing built now is thrown away.

---

## Payroll — full design detail

*(Written in Round 5, retained through the Round 6 deferral, and **now current scope on PRO** per Round 9. The boundaries below are what the merchant's "only generating the number" instruction points at, so they stand unchanged.)*

### What it does
- **Calculates staff salaries** — the full pay calculation, not just a commission tally.
- **Tracks commission owed**, fed automatically from POS sales (see Commission). Commission is not a standalone report; it is an input to pay.
- **Generates payslips.**
- **Handles statutory deductions** — EPF, SOCSO, and PCB are calculated and shown.

### What it explicitly does NOT do
- **No integration with any other application.** This is an explicit boundary, and it is the most important thing to get right in scoping:
  - No submission to LHDN, EPF (i-Akaun), SOCSO (ASSIST), or any government portal — the figures are calculated and presented, but filing stays a manual, off-platform task for the merchant.
  - No bank payment file / payroll disbursement file export, and no payment rails — Meikigo does not move salary money.
  - No sync to third-party accounting software (consistent with the accounting module being custom-built and internal).
- Practical framing for the merchant: Payroll produces **the numbers and the payslip**, and a human takes it from there.

### How commission reaches a payslip *(✅ current scope on PRO — Round 9)*
- **Round 5 intent — commission feeds into the Payroll module and becomes part of a payslip**, rather than being reported as a total the owner pays outside the app. Deferred in Round 6, **restored in Round 9 for PRO**; on STARTER and PLUS commission and tips continue to accrue and be reported only.
- The intended path is: **POS sale → commission (and tip) calculated automatically per sale, including manually-entered outage sales → accrued against the barber who performed that service line → picked up by the payroll run → appears as a line on that barber's payslip.**
- **Payout cadence: monthly (Round 9)** — *"every month, user can generate payroll slips for all active employees"*, which matches payslips and EPF/SOCSO/PCB being monthly instruments.
- **Interaction with the refund rule, worth stating plainly:** a refund/void **does not reverse commission** (Round 3). Now that commission lands on a payslip, that means commission can be **paid out on revenue that was returned to the customer**, and once it is on a processed payslip it is far harder to claw back than a report figure. Acceptable at low refund volume; it becomes a real leak if refunds rise. The lever, if ever needed, is to reverse commission on refunds rather than to unwind a payslip.
- **Interaction with offboarding:** a barber who resigns must still be payable — their unpaid commission stays visible and their final payslip must be producible after deactivation (see Employee Offboarding).

### Statutory compliance stance
- Payroll is squarely inside the merchant's Round 5 rule that **anything touching payment, employee records or salary must follow accounting standards and Malaysia's Employment Law, for audit purposes.** Concretely, that means: payslips must be retained and reproducible (not regenerated on the fly from mutable data), pay calculations must be auditable back to their inputs, deduction rates must be versioned so a historical payslip can be re-explained, and payroll records fall under the same statutory retention as employee records.
- Deduction rates (EPF/SOCSO/EIS) change by statute, so they must be **configuration with effective dates**, never hardcoded — a payslip for a past period must recalculate with the rates that applied then. **From Round 11 those rates are the merchant's own, held per Brand or per Outlet according to brand type**, and a payslip stores the rates it actually used rather than pointing at a value the merchant may later edit. PCB is not a rate — it is typed per employee per run.
- ⚠️ **Worth stating once, since Round 11 moved rate ownership to the merchant:** the statutory *obligation* was always the merchant's — Meikigo files nothing and pays nothing. What changed is only who maintains the numbers. The product should say so plainly on the payroll screens (*"figures for your records; Meikigo does not file or pay on your behalf"*), because a shop owner looking at a generated payslip with EPF on it may reasonably assume otherwise.

---

## Receipts & e-Invoicing (LHDN) — Round 5

**Merchant instruction (Round 5):** *"You decide, but must follow e-invoice. For now we don't have physical receipt."* The content below is therefore a product decision made under that delegation, with LHDN e-Invoice compliance as the binding constraint.

### Delivery channel
- **Resolved (Round 5) — there is NO physical receipt printer.** Receipts are **on-screen at the POS** and **emailed to the client on request** (the existing "send receipt to my email" path). No thermal printer, no printed slip.
- Consequence for the review flow: the on-screen receipt in the client's own browser tab remains the only place a review can be left (the emailed receipt carries no review link, and closing the tab forfeits the review — unchanged).
- Design constraint, not a build item: keep receipt rendering **channel-agnostic** (a receipt document model rendered to screen/email) so a Bluetooth or network thermal printer can be added later without reshaping the data. The POS is an iPad/Android tablet, so any future printer is a paired peripheral, not a wired one.

### What a receipt contains
Two things drive the field list: what a customer needs to see, and what LHDN's e-Invoice regime requires the merchant to hold. The receipt is designed to satisfy both, so nothing has to be back-filled later.

**Merchant/supplier identity**
- Brand (shop) name and Outlet name
- Organisation legal name and **SSM/business registration number**
- **TIN** (tax identification number)
- **SST registration number** — printed only if the merchant is SST-registered
- **MSIC code and business activity description** (required by e-Invoice; captured on the Organisation/Brand record, not necessarily printed on the customer-facing view)
- Outlet address and contact phone number

**Transaction identity**
- Receipt / transaction number (unique, sequential per Outlet)
- **Date and time of sale** — for a manually-entered outage sale, this is the actual sale time keyed in by the Admin, not the entry time
- Currency — **MYR only in Phase 1**
- Cashier name and **barber name** (the barber is included deliberately: it is what the customer remembers, and it matches the per-barber review/rating model)

**Line items** — one row per service/product, each carrying:
- Description (the **snapshotted** product name — see Price/Product Snapshotting)
- Quantity and unit price (the **price snapshotted at join time**, per the Round 5 price rule)
- Line total
- **Tax type, tax rate and tax amount** per line, plus **e-Invoice classification code**

**Totals**
- Subtotal (total excluding tax)
- Discounts, and any **loyalty redemption applied** (shown as its own line so the customer can see their points were used)
- Tax breakdown by rate — or nothing at all where the Outlet has not configured any tax, which is the default (Meikigo imposes no default tax; see Subscription & Billing → tax scope)
- **Total including tax / total payable**
- Payment method(s) — and for a split-payment party, only that individual's own share, since each share is its own Transaction

**Where an e-Invoice has actually been issued and validated, additionally:**
- Buyer details as captured (name, TIN — or NRIC where an individual has no TIN, address, contact, email)
- **IRBM Unique Identifier Number (UUID)**, validation date/time, and the **validation link rendered as a QR code**
- Supplier digital signature reference and e-Invoice type/version

**Deliberately NOT on the customer-facing receipt:** the internal `is_manual_entry` flag, `entered_by`, and audit timestamps. Those are audit fields and stay in the Transaction record.

### How e-Invoice compliance is split across tiers
- **Every sale on every tier captures the full e-Invoice field set at time of sale.** This is the important decision: compliance data capture is **not** tier-gated, because a merchant who upgrades later (or is audited later) cannot retroactively reconstruct buyer details, classification codes, or tax breakdowns that were never recorded.
- **A normal POS sale does not automatically become a submitted e-Invoice.** Barbershop sales are overwhelmingly B2C, and LHDN's regime allows a supplier to issue an ordinary receipt to a consumer and then submit a **consolidated e-Invoice** covering those receipts after month-end. So:
  - **Every sale:** ordinary receipt on screen/email. The sale rolls into the merchant's consolidated e-Invoice for that month.
  - **⚠️ SUPERSEDED (Round 18) — there is no per-sale, at-the-counter buyer-detail capture path.** The ad-hoc "customer requests an e-Invoice, cashier captures four fields at the till" flow this section previously described is **not built**. **Recorded as given:** *"doesn't make sense. nobody will use haircut as tax exemption. its personal things."* A haircut is not a business expense a customer is likely to claim, and the merchant judged the counter-side complexity (four fields typed with people waiting, maybe once a week) not worth building for a case that will rarely if ever occur. The consolidated-monthly path above is unaffected and remains the whole answer for every sale, on every tier.
    - **⚠️ Accepted consequence, stated plainly rather than hidden:** the rare customer who genuinely wants a proper individual e-Invoice — a company booking corporate grooming, say — has **no self-serve path at the POS**. That request becomes a manual back-office exception (the merchant or Meikigo support handling it outside the ordinary flow), not a product feature. This is a deliberate gap, not an oversight.
- **✅ Resolved (Round 8, amended Round 9) — actual submission to MyInvois is NOT in this build, and the MyInvoice pack stays a PRO feature.**
  - **Round 8** established the phasing: submission (the API call, the UUID/QR that comes back, the consolidated monthly submission) is **Phase 2**, not this build.
  - **Round 9 amended the tier question**, restoring the PRO gate: *"we confirm to maintain payroll and myinvois for PRO as we include previously. However, the feature that handle payroll and myinvoice are only focusing on generating the number."*
  - **What PRO's MyInvoice pack therefore IS in this build: e-Invoice DOCUMENT GENERATION.** It produces the compliant e-Invoice document and the consolidated monthly set from data every tier already captures — the numbers, in the merchant's words — ready for a human to file. It does not transmit anything to LHDN.
  - **Phase 1 (this build):** all tiers capture the full field set. **PLUS and PRO** get the tax document export (Round 6, tier settled in Round 13 — it is *not* on FREE or STARTER). **PRO additionally** gets the MyInvoice pack that generates the e-Invoice documents themselves.
  - **Phase 2:** MyInvois transmission is added, on PRO, unless revisited.
  - **⚠️ The commercial-vs-legal tension flagged in Round 5 is now genuinely dissolved — but by a different route than Round 8 took.** It is not that submission became available on every tier; it is that **submission is in nobody's build**, and the thing every tier does get (full data capture plus the accountant export) is enough for a STARTER merchant to file manually through LHDN's own portal. No merchant is locked out of complying; PRO buys them the document generation, not the right to comply.

### Meikigo's own invoices to merchants
- Note the second, separate direction: on subscription billing **Meikigo is the supplier and the merchant is the buyer**, so Meikigo's own `SubscriptionLine` invoices fall under the same e-Invoice regime for Meikigo as a company. The merchant-facing invoice must therefore carry Meikigo's supplier details, the Brand's buyer details (including TIN, which needs collecting at Organisation setup — it is not currently in the Organisation field list), and the SST treatment already specified.
- This is a Meikigo-side compliance obligation independent of which tier the merchant is on.

### Integration scope — ✅ RESOLVED (Round 8, tier amended Round 9)
**Round 7 asked for a recommendation** — *"should we go for no integration or only important integration?"* — and deferred the decision. **Round 8 adopted the recommendation below in full.** Round 8 also moved submission off PRO to "any paid tier"; **Round 9 reversed that and returned the MyInvoice pack to PRO**, with its scope narrowed to *generating* the e-Invoice documents rather than transmitting them. The phasing below is unaffected — Phase 1 still integrates with nothing.

**Adopted: "only the important integration" — and there is exactly one that qualifies.**

- **Rank integrations by consequence, not convenience.** Of everything on the table, only one carries a **legal** consequence if absent:
  - **MyInvois / LHDN e-Invoice submission — the one that matters.** If a merchant is within the phased mandate and no compliant e-Invoice is issued, that is a compliance failure, not an inconvenience.
  - **Everything else is convenience** and is correctly excluded: payroll statutory filing (EPF/SOCSO/PCB portals), bank disbursement files, third-party accounting sync. A human can do each of these from an export. *(Round 9 note: Payroll is now being built on PRO, and this exclusion is exactly what its "only generating the number" scope means — the figures are produced, the filing stays manual.)*
- **Recommended phasing, which lets you say "no integration" for Phase 1 without taking on risk:**
  - **Phase 1 — capture and export, submit nothing.** Every sale already captures the full e-Invoice field set on every tier (Round 5), and the accountant export (Round 6/7) gets the data out. The merchant or their accountant files through LHDN's own portal. **This is a defensible, common position for a small-merchant product**, and none of the work is wasted.
  - **Phase 2 — add MyInvois submission**, ideally **through an accredited middleware/service provider rather than building it in-house.** Direct integration means implementing LHDN's API, digital signing, UUID/validation handling, consolidated monthly submissions, and cancellation/rejection windows — a substantial and legally-sensitive build. A provider absorbs the spec churn, which matters because the regime is still phasing in.
- **What to verify before committing either way:** whether your target merchants are actually **in scope yet**. The mandate phases in by annual turnover, and the smallest businesses have been given the latest dates (with the lowest turnover band exempted under the revised timeline). Most single-outlet barbershops are likely below the threshold today — but a multi-outlet Brand may not be. **This is worth confirming with LHDN or an accountant against the current thresholds rather than taking my word for it**, since the dates and bands have been revised more than once.
- **The one thing not to defer:** keep **capturing** the full field set on every tier, as already decided. Capture is what makes both paths possible; a merchant cannot retroactively reconstruct buyer details or classification codes for sales already made.

**Still to verify (the one part Round 8 did not answer):** whether your target merchants are actually **inside the current LHDN turnover thresholds** yet. This does not change the build — capture-and-export is correct either way — but it determines how urgent Phase 2 is. Worth confirming with an accountant rather than taking my word for it, since the bands and dates have been revised more than once. See To Be Determined.

---

## Tax Document Export (Accountant) — Round 6

Previously a pricing-table line with no specification. **Round 6:** *"No PLUS and PRO for Tax Document Export. For now, the system only supports simple recording and no integration."* Formats were specified; period and contents were delegated to me *("please suggest relevant option but must consider standard tax practice")*.

### Tier availability — ⚠️ ✅ SETTLED (Round 13): PLUS AND PRO ONLY
**Recorded as given: *"Plus & Pro ONLY"*.** This resolves the ambiguity in the Round 6 answer and it goes **against** my recommendation of all-tiers, so the reasoning is recorded rather than argued:

- **No PLUS-vs-PRO variant** — one export feature, identical on both tiers. That part of Round 6 stands.
- **FREE and STARTER do not get it.** The Round 6 phrasing *"No PLUS and PRO for Tax Document Export"* meant *no separate PLUS and PRO versions*, not *available to everyone*, and the pricing table's PLUS+ gating was right all along.
- ⚠️ **The consequence, stated once so it is a choice and not a surprise:** a **STARTER** shop pays RM109/month and cannot produce an accountant pack, even though every figure in it already exists in their data. That is the tier boundary doing its job — it gives STARTER a concrete reason to move to PLUS — but it is also the most likely support question from a paying merchant, and the pricing page must be unambiguous about it.
- **What STARTER still has, and what support should point at:** the day-close Z-report, the on-screen sales reports, and the e-Invoice field capture that runs on every tier (Round 5). Their accountant can work from those; they just do not get the packaged XLSX/PDF.
- ⚠️ **Two places must be corrected to match:** the Subscription Tiers table (done — the row now reads PLUS/PRO only) and any marketing-site copy that repeats "all tiers". **`FREETRIAL` follows PLUS**, so a trialling merchant sees the export and loses it if they land on STARTER — worth a line in the trial-ending email rather than a silent disappearance.

### Formats
- **✅ Excel (XLSX) and PDF, both (Round 6).** The split is the right one and worth building deliberately: **Excel is for the accountant** (sortable, pivotable, importable into their own software), **PDF is for filing and for the owner** (fixed, signed-off-looking, attachable to a submission).
- **No integration** — this is a file the merchant downloads and hands over. No push to accounting software, no submission anywhere.

### Suggested period options (my recommendation)
Built around how Malaysian merchants actually file, rather than arbitrary ranges:
- **Monthly** — the default, and what most small businesses reconcile on.
- **Bi-monthly (2-month taxable period)** — this is the one that matters and is easy to miss: **SST returns are filed for two-month taxable periods**, so an SST-registered merchant needs their figures on that boundary, not a calendar month.
- **Quarterly** — common for internal review and for merchants whose accountant works quarterly.
- **Annual / financial year** — for the income-tax return, with the **financial year-end configurable per Organisation** (not every business runs to 31 December).
- **Custom date range** — for audits, disputes, and part-periods (e.g. an Outlet that opened mid-month).

### Suggested contents (my recommendation)
Two layers, because an accountant needs both the summary and the ability to drill into it:

**Summary sheet**
- Gross sales, total discounts (ad-hoc **and** loyalty redemptions, shown separately), net sales
- **Tax collected, broken down by tax rate** — the figure that actually goes on a return
- Refunds and voids, **as their own totals** (never netted silently into sales, or the audit trail disappears)
- Payment-method breakdown, reconciled against the day-close cash counts and variances
- Tips collected — **excluded from revenue**, shown separately, since they are not the shop's income
- Transaction count, and a manual/backdated-entry count so an unusual number of keyed-in sales is visible
- Sales by day, for the period

**Transaction listing sheet** (one row per sale)
- Date/time of sale, receipt number, Outlet
- Line items with quantity, unit price, discount, tax rate, tax amount, line total
- Barber(s) who performed the work — per line, now that a ticket can carry more than one
- Gross, discount, tax, net
- Payment method
- Status (completed / voided / refunded) with void reason and who authorised it
- **e-Invoice status per transaction** — individually issued (with UUID) vs. rolled into the consolidated submission. This is what lets an accountant reconcile the shop's records against what LHDN holds.
- The **manual-entry flag** and, where set, the entry timestamp and who keyed it in

**⭐ Expense sheet — NEW (Round 17)**
Now that the shop records what it spends, the accountant's file carries **both sides of the book**, which is a considerably more useful thing to hand over than a sales listing.
- One row per expense: date, Outlet, category, amount, optional tax amount, paid-by method, note, source (typed / POS cash-out / payroll), who recorded it
- **A summary by category**, with each as a percentage of net sales
- **Voided expenses listed separately**, never netted away — the same treatment refunds already get
- ⚠️ **It is a record of what was spent, not a tax computation.** No input tax is claimed, computed or netted against output tax, and the sheet must be labelled so no accountant mistakes it for one

### How this differs from the PRO MyInvoice (LHDN e-Invoice) pack
> *Tier restored to PRO in Round 9. The right-hand column below is split, because Round 9 narrowed what the pack does in **this** build: it generates the e-Invoice documents; it does not transmit them until Phase 2.*

You asked me to explain the difference. They are not versions of each other — they point in opposite directions:

| | **Tax document export** (**PLUS + PRO** — Round 13) | **MyInvoice pack — Phase 1** (PRO) | **MyInvoice pack — Phase 2** (PRO) |
|---|---|---|---|
| **Purpose** | Reporting — hand your figures to a human | Produce the compliant document | Compliance — transact with LHDN's system |
| **Audience** | The merchant's accountant | The merchant, to file themselves | LHDN (MyInvois), per invoice |
| **Direction** | Data **out** of Meikigo, as a file | Data **out**, as a compliant e-Invoice document | Data **submitted** to a government system, with a response |
| **Timing** | On demand, per period | Per sale, and consolidated monthly | Per sale (or consolidated monthly) |
| **Output** | XLSX / PDF | A formatted e-Invoice document set | A validated e-Invoice: UUID, validation timestamp, QR code |
| **Failure mode** | Wrong numbers in a spreadsheet | A document the merchant must still file by hand | A **non-compliant invoice** — a legal problem, not a reporting one |

- **Why the middle column is worth having at all**, given the export exists on PLUS as well: the export is a *report* shaped for an accountant, while the Phase 1 pack produces the *e-Invoice document itself*, field-for-field as LHDN specifies it. A merchant who has to file can upload or transcribe that directly instead of assembling it from a spreadsheet. That is a real saving, and it is a defensible thing to charge PRO for — which is exactly what Round 9 decided to do.

- They **overlap only in the underlying data** — both read the same captured fields (which is exactly why Round 5's "capture the full e-Invoice field set on every sale, on every tier" matters).
- Practical way to think about the split: the **export is a report you can always produce**; the **MyInvoice pack is document generation now and a filing integration later**. **Round 8 settled that no filing integration is in this build; Round 9 settled that the document-generation half belongs to PRO.**
- **Build order is unchanged and still matters:** the export first (PLUS and PRO, low-risk, no third party, and it is what lets an accountant file manually), then the PRO document generation, then Phase 2 transmission. Nothing in that sequence is wasted if the LHDN timeline shifts again.

---

## Customer Management & Marketing (Round 6)

Never specified before. The merchant has always held their customers' names, phone numbers and full visit history through transactions, but there was no screen for it and no rules about what they could do with it.

### Customer list
- **✅ Resolved (Round 6) — build a searchable customer list in `meikigo-merchant`.**
- Contents (as proposed and accepted): **visit count, last visit, total spend, loyalty balance**, plus the name/phone/email needed to find and contact someone.
- Scope: a merchant sees the customers of **their own Brand** only. Customer accounts are platform-wide, but a Brand must never see a customer's activity at another Brand — the same boundary loyalty already respects.
- **✅ Reviews stay invisible here (Round 6, confirmed).** The customer detail screen must **never** show that customer's ratings, in any form. Two-way anonymity is absolute (Round 3), and a per-customer screen is the single most likely place to accidentally break it — a "this customer rated you 2 stars" field would undo the whole guarantee. Any internal FK linking a client to a review must be unreachable from this screen.

### Export
- **✅ Resolved (Round 6) — the merchant can export the customer list (CSV).**
- Worth handling deliberately, since this is personal data leaving the platform: **log every export** (who, when, how many records). Under PDPA the merchant is the data user for their own customer list, but an unlogged bulk export is the one action that makes a later "how did our customers' details get out?" question unanswerable.

### ⭐⭐ Bulk Import (Round 14) — the merchant brings their old data in
**Recorded as given: *"A, with download template button so they can download meikigo's sheet template as well if they want to"*.** Round 13 said onboarding help is delivered over a screen-share; Round 14 builds the thing the merchant is guided *through*.

**Where it lives and who gets it**
- **In `meikigo-merchant`**, self-service, on **every paid plan** (`STARTER`, `PLUS`, `PRO`, `FREETRIAL`). PRO's difference is that somebody sits on the call with them — not that they get a different screen.
- **What can be imported: customers, services, products and staff.** These are the four lists that make a new account look alive instead of empty.
- **⭐ ✅ WHAT A CUSTOMER ROW MAY CONTAIN — settled in Round 15, and it is deliberately narrow:** **name, phone number, optional email, and an OPENING LOYALTY POINTS BALANCE.** Nothing else.
  - **✅ Opening loyalty points ARE allowed (Round 15: *"A"*).** This is the answer that makes the whole feature worth building: a shop moving from a paper card or another app has customers with real balances, and *"everybody starts at zero"* would make Meikigo the reason a loyal customer lost their free cut. Ali arrives with 240 points and keeps them.
    - **It is written to the loyalty ledger as an explicit `OPENING_BALANCE_IMPORT` entry**, never as earned points — so redemption-rate reports, points-earned figures and the merchant's own liability view can always separate *"points we gave them on day one"* from *"points earned here"*.
    - **The import batch, the row and who uploaded it are on that ledger entry.** An opening balance is the merchant handing out value with no transaction behind it, so it must be as traceable as a manual points adjustment.
    - ⚠️ **Worth telling the merchant plainly on the screen:** these points are a **liability they are taking on** — every imported point is a future discount they will honour. A shop that imports a decade of unredeemed points may owe a great deal of free haircuts.
    - **✅ THE COLUMN IS SANITY-CHECKED (Round 16: *"A"*).** **Negative balances are rejected outright** as failed rows. **An outlier warns but does not block** — the merchant is shown the rows and can continue if the figures are genuine.
      - **What counts as an outlier: a value far above the rest of the same file.** The check is against the file's own distribution rather than a fixed number, because 4,500 points is absurd in one shop's scheme and ordinary in another's.
      - **The failure this prevents is specific and common:** ringgit-spent typed into the points column, which would commit the shop to free haircuts it never agreed to. Since points are a liability the merchant honours in real service, a warning here is worth more than one almost anywhere else in the import.
  - **⛔ NO transaction or visit history at all (Round 15: *"Nothing at all. Only name and phone."*)** — not full sales, and **not** the visit-count and last-visit fields I had recommended as a middle path. So an imported customer shows **no visits, no spend and no last-visit date** until they transact in Meikigo.
    - **Why this is a sound instinct:** sales records are money records. A spreadsheet that can write them means day-close figures, tax reports, commission and the accountant export all contain sales that never happened here. **Meikigo's financial history stays untouched by imports, full stop.**
    - ⚠️ **The consequence to expect at the counter:** on day one the customer list shows *"0 visits, no last visit"* for a customer the shop has served for five years, and a "last visit" filter is useless until Meikigo has its own history. That is a cosmetic oddity, not a wrong number, and the merchant should be told to expect it.
    - **The opening points balance is the one exception**, and it is not a financial record — it is a loyalty liability the merchant is choosing to honour.
- **`FREE` is excluded** — its caps are 1 barber, 2 services and no products, which is a typing job, not an import job.

**The flow, and it must be exactly this order**
1. **⭐ Download the Meikigo template** — a button that gives them a ready-made spreadsheet with the correct column headings and one example row. Recorded as an explicit requirement. It is also the cheapest support saving in the whole feature: a merchant who starts from our template hits almost no mapping errors.
2. **Upload** their file (XLSX or CSV, both).
3. **Match the columns** — their heading names to our fields. A file made from our template maps itself; anything else is matched by hand once.
4. **Preview**, showing the first rows as the system understood them, plus a count of rows that will succeed and rows that will fail.
5. **Save**, then a **result report** listing every failed row with its line number and the actual reason — *"row 47: phone number already belongs to another customer"*. Downloadable, so they can fix that file and re-upload only the failures.

**Rules that make it safe**
- **An import never overwrites an existing record.** A clash is a **failed row**, always. Silent overwriting of a customer, a price or a staff record by a spreadsheet is the one behaviour that would make this feature dangerous.
- **All-or-nothing is wrong here; row-by-row is right.** 380 good rows should not be rejected because 20 were bad. Import what is valid, report what is not.
- **Phone numbers must be normalised before comparison** (Round 12) — `012-3456789`, `+60123456789` and `0123456789` are one number, and a spreadsheet will contain all three forms.
- **Duplicates inside the file itself must fail too**, not just clashes with existing data.
- **Every import is logged** — who, when, which list, how many rows in, how many succeeded — for the same reason customer *exports* are logged.
- **✅ NO ROW LIMIT (Round 15: *"C"*).** A merchant may upload a file of any length; the system must cope rather than refuse.
  - **⚠️ This makes the import a background job, not a web request, and that is a real build consequence.** A 40,000-row file cannot be processed inside an HTTP request — it will time out, and a half-finished import is the worst possible outcome. **The import must run as a queued job**, processing in chunks, with progress visible (*"12,400 of 40,000 rows"*) and the merchant free to close the tab.
  - **The merchant is told when it finishes** — in-app and, recommended, by email — with the failure report attached to the batch record.
  - **✅ THE FILE SIZE LIMIT IS 25MB (Round 16)** — comfortably more than 100,000 customer rows. It is a technical guard, and the message must be about **file size**, never about row count, since the row count is deliberately unlimited.
  - **Recommended: still show the preview from the first ~100 rows only.** Previewing 40,000 rows helps nobody and makes the screen unusable.

#### ⭐ What an imported customer IS — ✅ Resolved (Round 14): a LIGHT RECORD, not an account
**Recorded as given:** *"A light record — name, phone, maybe email. No password, no login. The cashier can find them at the counter and give them points. If that person later signs up properly with the same phone number, the two are joined."*

This is the right answer and it needs **nothing new built** — it is the **counter-created customer** from Round 7, arriving by spreadsheet instead of by cashier.

- **What it holds:** name, phone number, optionally email. **No password. No login. No OTP.** It is a record the shop can find and attach a sale to, not an account.
- **It can earn and hold loyalty points**, and it can be looked up at the counter by phone number. That is the whole point of importing it.
- **⭐ When that person later signs up themselves with the same phone number, the two are joined** — they inherit their visit history and their points balance. The phone number is the join key, which is exactly what the Round 12 uniqueness rule was for.
- **Uniqueness still bites, and it must fail loudly:** a number that already belongs to a Meikigo customer, or appears twice in the file, is a **failed row** in the report. It must never silently overwrite or merge into a stranger's account.
- **A light record cannot log in, book online, or use the customer app**, and the merchant should be told that plainly on the import screen — otherwise the first support question is *"why can't my customer see her points in the app?"*. The answer is that she signs up once with the same number and everything is there.

#### ⚠️ Marketing to imported customers — ✅ Resolved (Round 14): the MERCHANT DECLARES the consent
**Recorded as given: *"B"*** — the merchant ticks a box confirming these customers agreed to receive marketing, and that declaration is stored. This is the middle option, and it puts the duty on the merchant rather than blocking the use case.

- **The tick is a stored record, not a checkbox that disappears:** who ticked it, when, which import batch it covers, and the exact wording they agreed to. Same treatment as the barber-photo consent box (Round 12) — one click, recorded, obligation where it belongs.
- **⭐ Store the consent SOURCE, and keep the two kinds apart in the data.** `SELF_GIVEN` (the customer ticked the box at signup, with timestamp and version) versus **`MERCHANT_DECLARED`** (the merchant said so at import). They are not the same evidence and a future audit will need to tell them apart. It is one extra column now and impossible to reconstruct later.
- **Unsubscribe works identically** and is honoured immediately and permanently. An imported customer who unsubscribes is gone for good, per Brand (Round 10).
- **Blasts still only reach customers of that Brand**, unchanged.
- ⚠️ **The risk this accepts, recorded once so it is a decision and not a surprise.** A declaration is the merchant's word, and Meikigo's sending domain carries the consequence if the word is wrong — spam complaints land on the shared reputation, and the first thing that suffers is **signup OTP delivery for every shop on the platform**. Round 14 also **removed the weekly frequency cap**, so this is the second protection loosened in one round.
  - ⚠️ **What was meant to make it survivable was declined in Round 15:** automatic complaint-based suspension (*"No automatic stop… let a person decide"*) and the per-Brand daily send limit (*"B"* — no limit). So the mitigation is now **a warning in `meikigo-admin` plus a human decision**, which means the alert has to be pushed to a person rather than shown on a page. See Marketing blasts → What is protecting deliverability now.
  - **Recommended, and cheap: watch imported cohorts specifically.** If a Brand's first blast after a large import produces a complaint rate several times the platform average, suspend that Brand's sending and have a human look. That is the case where a declaration was untrue, and it is detectable within one send.
  - **Recommended: warm up rather than blast on day one.** A brand-new sending relationship with 2,000 never-mailed addresses is the classic pattern that gets a domain blocked. Suggest it in the UI; do not force it.

### Meikigo Staff Access to Customer Data (Round 8)
> This closes the third of Helmi's three tagged inquiries.

- **✅ Resolved (Round 8) — opening a customer's personal data in `meikigo-admin` requires a RECORDED REASON. No exceptions, no role exempt — including the highest-privileged Meikigo admin.** Recorded as given: *"To ensure data privacy compliance practice, the system should record the reason. We should not allow any users including admin to open and check customer data without any relevant reasons."*
- **What this changes:** the Round 4 audit log records *who* opened *what* and *when*. It does not record *why*. A reason field is what separates a legitimate support investigation from idle browsing — and browsing is the access that cannot be defended under PDPA, precisely because the log looks identical either way.
- **The rule to build:**
  - Before a customer's PII (name, phone, email, visit history, loyalty balance) is rendered, the staff member must supply a **reason** — a ticket reference and/or a short free-text justification. A pick-list of common reasons (e.g. *login issue*, *missing points*, *refund dispute*, *data-deletion request*, *fraud investigation*) with a free-text field is the practical form; an empty reason is not accepted.
  - The reason is stored **on the audit row** alongside the actor, timestamp, customer ID and the fields viewed — so the log answers "why" without anyone having to reconstruct it later.
  - **The gate is at the API, not the UI.** A hidden button is not a control; the endpoint that returns customer PII must reject a request that carries no access-reason token.
  - **⛔ THE MERCHANT IS NOT SHOWN THESE RECORDS (Round 15).** Recorded as given: *"B"* — the access log stays **internal to Meikigo**. So the reason-gate remains an internal control with internal review (support's own report is read monthly by one person above support, per Round 12), and it is **not** surfaced to the Brand admin or in the PRO audit log.
    - **What this means in practice:** the merchant-visible audit log (PRO) shows **merchant actions only** — their own staff's changes, approvals and overrides. It shows nothing about Meikigo staff, which is exactly how it was scoped in Round 13, and Round 15 confirms it stays that way.
    - ⚠️ **The control is unchanged; only its visibility is.** Every access still requires a stated reason, is still logged, and is still reviewable — a merchant who asks *"has anyone at Meikigo looked at my customers?"* can be answered by support from that log. It is simply not a self-service screen.
  - **Recommended, consistent with the instruction:** default the customer list/search to **masked** identifiers (e.g. `01x-xxx 4821`, `a****@gmail.com`) so support can *find* a record without unmasking it, and require the reason only at the point of unmasking. This keeps ordinary work friction-free while making full-PII access a deliberate, logged act.
  - **Recommended:** the unlock is **time-limited and scoped to that one customer** (e.g. 30 minutes, one record) rather than a session-wide switch, so one reason cannot cover an afternoon of browsing.
  - **✅ Resolved (Round 10) — there IS a monthly access report, and the SUPPORT FUNCTION owns it, behind RBAC.** Recorded as given: *"whoever handles support, (with RBAC access)"* and *"get logged for further investigation if anything happened"*.
    - **What it contains:** for the month, each staff member, how many customer records they unmasked, and the reasons they gave. The point of the report is the outlier — the person who opened 87 records and wrote "checking" — not the totals.
    - **Access to the report is itself role-gated**, consistent with Round 4's role split. It is a list of who looked at what, which is sensitive in its own right.
    - **When something looks wrong, it is logged for investigation** rather than triggering any formal disciplinary process. That matches the size of the team and is what the spec should say — no more.
    - **✅ RESOLVED (Round 11) — TWO LEVELS OF REVIEW, and the self-review hole is closed.** The weakness was put plainly (support is both the main *user* of the reason-gate and its *reviewer*, and the scenario the control exists for is the one a support-owned review is least likely to escalate) and the merchant took the fix:
      - **Support reads the monthly report for the whole team** — the day-to-day review, as Round 10 established.
      - **⭐ One person ABOVE support reads the support team's own access, once a month.** A director, or Helmi himself. Five minutes of reading, and it is the difference between a control that is real and one that is nominal.
      - **Build consequence, and it is the only one:** the report needs a **filter by staff member and by role**, so the second reviewer can look at *just* the support team's rows rather than the whole platform's. Two views of one report, not two reports.
      - **The second reviewer's own access is also logged** — the report includes everybody, and no role is exempt (Round 8, no exceptions). Reading the report is itself a logged act.
- **Scope note:** this rule is about *personal data*. Non-PII administrative work in `meikigo-admin` — plan metadata, application settings, HitPay configuration, ratings thresholds — is unaffected and stays governed by the existing role split and audit log.
- **This is also what makes "never purge" defensible.** Merchant data (and their customers' personal data) is retained indefinitely today; retention plus unrestricted staff read access is the combination a regulator would object to. Reason-gated access is the cheap control that fixes the second half.

#### Scope of the reason-gate — ✅ Resolved (Round 9), with the detail requested
**✅ Round 9: the reason-gate applies to MEIKIGO's staff in `meikigo-admin` only. A merchant's own staff can see their own customers in `meikigo-merchant` without supplying a reason.** The merchant asked for the reasoning in full before treating this as settled, so it is written out below rather than asserted.

**1. Why the same data gets two different rules — the PDPA roles are not the same.**

Malaysia's PDPA distinguishes the **data user** (who determines how personal data is processed, and carries the legal duties) from the **data processor** (who processes it on the data user's behalf).

- For a barbershop's customer list, **the barbershop is the data user.** They collected it, they have the customer relationship, and the customer handed over their phone number specifically so that shop could contact them about haircuts.
- **Meikigo is the data processor** for that same list — holding and processing it on the merchant's instructions, under the merchant agreement terms (see the Q1 outcome).
- Meikigo *is* a data user in its own right, but for a different set of data: **merchant accounts**, subscriptions and billing.

That split is the whole justification. A shop looking at its own customer's visit history is a data user using its own data for the purpose it was collected for. A Meikigo support agent looking at that same record is a **third party** reaching into someone else's data — lawful only when there is an instruction or a legitimate operational reason. The gate exists to record that reason, so it belongs precisely where the third-party access happens.

**2. What "no legitimate purpose" looks like in each app — the concrete asymmetry.**

- **Meikigo side:** a support agent opens the record of a customer who never contacted support, at a shop that never raised a ticket. There is **no innocent reading** of that action. It is either curiosity or something worse, and the audit log cannot tell the difference without a reason field — which is exactly the scenario Round 8 was answering.
- **Merchant side:** a shop's Admin opens their own customer's record. The innocent readings are the overwhelming majority — checking a loyalty balance, calling about a booking, confirming a phone number before a marketing blast. Requiring a typed justification for each one would generate hundreds of reasons a month that all say "looking at my customer", which trains people to type anything to get past the box. **A control that is always satisfied stops being a control** — and worse, it dilutes the Meikigo-side log where the same field genuinely means something.

**3. What is therefore built, in each place.**

| | `meikigo-admin` (Meikigo staff) | `meikigo-merchant` (shop's own staff) |
|---|---|---|
| **Reason required to view PII** | ✅ Yes — pick-list + free text, enforced at the API | ❌ No |
| **PII masked by default in lists** | ✅ Yes, unmask is the gated act | ❌ No — full list is the working screen |
| **Every view audit-logged** | ✅ Yes, with the reason on the row | Not per-view |
| **Bulk export logged** | ✅ Yes | ✅ **Yes — kept (Round 6)**: who, when, how many records |
| **Role split limits who can see it at all** | ✅ Yes (support reads, engineering writes — Round 4) | ✅ Yes — Cashier vs Admin; **read-only display account sees nothing** |
| **Customer's ratings visible** | Never | **Never** — anonymity is absolute (Round 6) |
| **Periodic access review** | ✅ Yes | ❌ No |

**4. What protects the merchant side instead, since it is not unprotected.** Four controls already decided elsewhere carry the load:
- **The export log.** A bulk CSV of every customer is the action that actually causes harm — it is how a list walks out of the building when someone leaves for a competitor. That is logged (who, when, how many records) and it is the merchant-side control that matters most.
- **The role split.** A Cashier does not get the back-office customer list; the read-only display account gets nothing at all. Fewer people can look in the first place.
- **Ratings stay invisible, always.** The one piece of data a merchant must never join to a named customer is their review, and that holds in both apps with no exceptions.
- **The merchant's own accountability.** As data user, a shop that misuses its customer list answers for it themselves. Meikigo's job is to give them controls, not to police their internal conduct — and the platform genuinely should not be arbitrating whether a shop had a good reason to phone its own customer.

**5. What this decision costs, stated honestly.** Choosing (a) accepts one real thing: a merchant Admin with bad intent can browse their own customer list freely, and Meikigo will hold no per-view record of it. If that shop later has a data incident, the platform can show *what was exported* but not *what was read*. The judgement is that this is the right trade — the alternative buys a log nobody would ever read, at the cost of friction on the most common screen in the product.

**6. When to revisit — the trigger, so this isn't a decision that quietly ages.** Reopen the merchant-side gate if any of these become true:
- A Brand routinely has **many staff with Admin rights** (a chain where head-office staff can see every outlet's customers is much closer to the third-party situation than a two-person shop is).
- Meikigo starts operating outside Malaysia, where the equivalent regime may not accept the data-user/processor distinction as cleanly.
- A merchant asks for it — some will, and per-outlet masking is a reasonable paid or optional control later.
- **Option (c) remains available as the middle path**: mask by default in `meikigo-merchant` and log the unmask, without demanding a typed reason. It costs one click and gives a shop owner visibility into which of their staff opened which customer records. If (a) ever looks too loose, this is the upgrade — and it is worth knowing it exists rather than treating the choice as binary.

### Marketing blasts
> **⚠️ This reverses a standing rule.** Until Round 6 the system sent **no marketing of any kind** — "Email is NOT sent for: … marketing, or anything else". That is now superseded.

- **✅ Resolved (Round 6) — merchants CAN send marketing blasts (promo email) to their customers through Meikigo, sold as a paid ADD-ON package.**
- **Add-on pricing is configured in `meikigo-admin` (Round 9)** like every other add-on unit. **✅ The figure is now set (Round 13): RM49/month on STARTER and PLUS, RM39 on PRO**, flat monthly with no per-email counting.
- **⚠️ This has a consequence for a screen already specified, and it needs handling now, not later: marketing consent must be captured at SIGNUP.** Under PDPA, consent for marketing has to be obtained, recorded, and withdrawable. Concretely:
  - **For normal signups:** a **separate, unticked marketing-consent checkbox** on the client signup form (and on the post-Google-SSO completion step) — separate from ToS acceptance, because bundling consent into "I accept the terms" is not valid consent.
  - **For staff-provisioned accounts:** when the account is claimed, marketing consent is auto-enabled from the claim action (customers can still withdraw via unsubscribe).
  - The consent state, its **timestamp and version**, stored on the client record alongside the existing ToS acceptance.
  - **Every blast carries a working unsubscribe**, and unsubscribing is honoured immediately and permanently.
  - Blasts go **only** to customers who consented **and** who have transacted with that Brand. A merchant must not be able to mail the whole platform.
  - Retro-fitting consent later is genuinely painful: a client base signed up without a consent record cannot be legitimately mailed, which would make the add-on unsellable to exactly the merchants who have been on the platform longest. Cheap now, expensive later.
- **⚠️ Deliverability risk that must be designed around:** marketing blasts and the **signup OTP** would otherwise share a sending domain and reputation. Marketing mail attracts spam complaints; OTP delivery sits on the critical path of the booking flow (Round 4). If they share reputation, a merchant's promo blast can push OTPs into spam folders and cost signups platform-wide.
  - **Recommendation: separate the streams** — transactional mail (OTP, receipts, disruption notices, password reset) on one authenticated subdomain/provider, marketing blasts on another. This is standard practice and much easier to set up at the start than to untangle after a reputation problem.
- **✅ Resolved (Round 7) — the merchant composes freely OR picks from a Meikigo template, and there is NO review before sending.** Meikigo does not moderate blast content. *(⛔ The template half is dropped in Round 10 — see below. Compose-freely and no-review both stand.)*
  - ⚠️ **Flagged once, because it is a real operational risk rather than a preference:** sending reputation is **shared across every merchant on the platform**. Unmoderated blasts mean one merchant's bad mail (misleading subject lines, a purchased list, high complaint rates) degrades deliverability for everyone — and the thing that breaks first is the **signup OTP**, which sits on the critical path of the booking flow with **no SMS fallback** in Phase 1.
  - Mitigations that do not require reviewing content, and that I would build in regardless: **separate sending domains** for marketing vs. transactional (the single most effective control), **per-Brand complaint/bounce-rate monitoring with automatic suspension** of a merchant whose rates spike, mandatory **unsubscribe** honoured platform-wide, and sending only to customers who both consented and have transacted with that Brand.
  - ~~Templates are worth making genuinely good, since they are the only content quality control left.~~ — **⛔ Resolved (Round 10): NO Meikigo templates in this build.** *"No need for now."*
    - So the Round 7 offer of *"compose freely **or** pick from a Meikigo template"* collapses to **compose freely, full stop**. There is no template library to build, and the pricing/marketing copy for the add-on must not promise one.
    - ⚠️ **The consequence, worth recording once:** with no review and now no templates, **there is no content quality control on marketing blasts at all.** Everything that protects deliverability is now mechanical rather than editorial — separate sending domains, per-Brand complaint-rate monitoring with auto-suspension, the one-blast-per-week cap, and consent-plus-transacted targeting. Those four are load-bearing, and none of them can be dropped as "nice to have" later.
    - Cheap partial substitute if you ever want one without building a template system: a couple of **example emails in the help text** next to the composer. No code, no library, and it still shows a merchant what good looks like.
- ~~**✅ Resolved (Round 9) — there is a FREQUENCY CAP of one blast per Brand per week.**~~ — **⛔ REMOVED IN ROUND 14. Replaced by EMAIL TOKENS.**
  - *Kept for provenance:* the cap was enforced per Brand, not per Outlet, and it existed to protect the shared sending reputation in place of content moderation.

#### ⭐⭐ EMAIL VOLUME PACKAGES — how blasts are sold (Round 14 introduced tokens; ✅ Round 15 SETTLED IT AS A MONTHLY QUOTA)
**Round 14 said *"they buy a token, 1 token = 1 email"*. Round 15 priced it, and in doing so changed its shape from a pre-paid balance into a MONTHLY ALLOWANCE.** Recorded as given:

> *"This is default value, but meikigo admin still configure it — 1. RM90 - 10k email per month, 2. RM170 - 50k email per month, 3. RM400 - 100k email per month, 4. RM2200 - 500k email per month. \*1 "to" consider 1 email"*

And on expiry: *"Each month. Because we will be using brevo. The brevo pricing based on month."*

**⭐ THE TIERS — ✅ FIVE OF THEM (Round 16). THE PRICES ARE DELIBERATELY NOT SET YET**
Recorded as given: *"Actually we dont have the final price yet. So we will configure it later. So basically we will be having 1k tier, 5k tier, 10k tier, 50k tier, 100k tier. The pricing is dynamic we can configure it meikigo-admin. So dont worry about the pricing."*

| Package | Emails included / month | Price |
|---|---:|---|
| **Marketing 1K** | 1,000 | set in `meikigo-admin` |
| **Marketing 5K** | 5,000 | set in `meikigo-admin` |
| **Marketing 10K** | 10,000 | set in `meikigo-admin` |
| **Marketing 50K** | 50,000 | set in `meikigo-admin` |
| **Marketing 100K** | 100,000 | set in `meikigo-admin` |

- **What changed in Round 16:** the tier *list* is now five sizes starting at **1,000**, and the **500K tier is dropped**. The Round 15 figures (RM90 / RM170 / RM400 / RM2,200) are **withdrawn — they were illustrative, not committed**, and no price is recorded in this document any more.
- **Starting at 1K is the better shape for this market.** A shop with 300 customers sending twice a month needs 600 emails; under the old 10K floor they were paying for sixteen times what they use. The small tier is what makes the feature buyable by an ordinary barbershop.
- **Dropping 500K costs nothing today** — 100,000 emails a month is a 12,000-customer brand mailing weekly, which is far beyond any merchant Meikigo will have at launch. A bigger tier is a new row in a table on the day somebody needs it.
- **Nothing is hardcoded.** The tiers and their prices are rows in `meikigo-admin`, read at checkout and published through the public pricing endpoint (Round 13), so the marketing site picks them up without a release.
- ⚠️ **One thing still has to happen before the pricing page goes live: somebody must type the numbers in.** That is now a configuration task rather than a specification gap — but a published page reading an empty table shows nothing, so it belongs on the launch checklist.
- **⭐ Guidance for whoever sets them, because the Round 15 draft got this backwards and it is easy to repeat:** the **price per email must fall as the tier grows**. In the withdrawn draft, 50K worked out cheaper per email than both 100K and 500K, which meant a large brand was better off buying ten small packages, and a shop needing 12,000 emails paid *less* for 50K than for two 10K packages. **Recommended: the price editor warns when a larger tier has a higher per-email price than a smaller one.** It is a two-line check that prevents a pricing mistake nobody notices until a merchant does the arithmetic for you.

- **⭐ It is a MONTHLY SUBSCRIPTION, not a pre-paid balance.** This is the important consequence of the Round 15 answer and it simplifies the billing work considerably: the marketing package is an ordinary recurring `SubscriptionLine` on the Brand, exactly like an extra outlet. **The product does not need a pre-paid credit system after all.**
- **⭐ The allowance RESETS EVERY MONTH AND DOES NOT ROLL OVER.** Recorded as given — *"Each month"*. A Brand on the 10K package that sends 3,000 emails does not start next month with 17,000. Unused volume is simply gone.
  - **Why the merchant chose this, and it is a sound reason:** *"we will be using brevo, the brevo pricing based on month"* — Meikigo's own cost is a monthly volume commitment, so selling a monthly volume allowance means the cost and the revenue have the same shape. Rollover would mean Meikigo carrying a liability against a plan it already paid for.
  - ⚠️ **It must be visible, or it becomes the top support complaint.** Show *"7,300 of 10,000 emails left — resets on 1 August"* on the blast screen, and **do not** call it a balance or a wallet anywhere in the UI. The word to use is **allowance** or **quota**.
- **"1 `to` = 1 email"** — the count is **per recipient**, not per blast. One send to 800 customers uses 800 of the allowance. A customer who appears twice in the audience is one email.
- **A send that would exceed the remaining allowance is refused whole, never partially sent.** Mailing 300 of 800 customers and stopping is worse than not sending, because nobody knows who received it. The screen says *"this blast needs 800 emails, you have 300 left this month"* and offers the next package up.
  - **Checked twice — at schedule time and again immediately before sending** — because the audience grows and the allowance shrinks between the two.
- **A hard bounce still counts against the allowance** (the send was attempted) and the address is then suppressed so it is never counted again.
- **`FREE` gets no package and no blasts**, unchanged (Round 14).
- **✅ System email NEVER touches the allowance (Round 15).** Recorded as given: *"A"*. Signup OTPs, receipts, booking reminders, payslips, the barber daily summary, disruption notices and the PRO report emails are **transactional** — always sent, never counted, never blocked by a marketing quota. A shop that has used up its marketing allowance must still be able to take bookings and pay staff.
- **✅ Unused allowance is LOST on cancellation or downgrade (Round 15)** — *"They lose them. Since its get expired each month."* Which is consistent: there is no balance to preserve, only a month that has been paid for. A Brand that cancels mid-month keeps sending until the period ends, then stops.
- **✅ A MID-MONTH UPGRADE TAKES EFFECT IMMEDIATELY, PRORATED (Round 16).** Recorded as given: *"A"*. The merchant pays the difference for the remainder of the month and can send at once — which is the whole reason they upgraded.
  - **The larger allowance replaces the smaller one for the current period**, and emails already sent count against it. A shop that used all 1,000 of the 1K tier and upgrades to 5K has 4,000 left, not 5,000. Show that arithmetic on the upgrade screen or it becomes a support question.
  - **A DOWNGRADE takes effect at the next cycle**, not immediately — recommended, and the standard treatment: they have paid for this month's volume, and cutting it mid-month would strand a scheduled campaign.
  - **Upgrading twice in one month is allowed** and prorates the same way; there is no cooling-off period to design.

**⛔ What this replaces**
- **The flat RM49/month marketing add-on is GONE (confirmed Round 15: *"A"* — packages replace it, they do not sit on top of it).** There is no base fee for having the feature: a Brand either holds a marketing package or cannot send blasts.
- **The Round 14 pre-paid token design is superseded.** No token purchases, no non-expiring balance, no credit ledger. The **usage counter and its ledger remain** — see Data Storage → Email Allowance Data — because a merchant asking *"what used up my 10,000?"* needs an answer.

**⭐ NEW DECISION, and it reaches beyond marketing: the email provider is BREVO**
Recorded in passing — *"we will be using brevo"* — but it is a first-time decision and it closes an item open since Round 9, when the merchant said *"we do not have any provider in mind, and need your recommendation"*.

- **Brevo is a reasonable choice for this product:** monthly volume pricing (which is where the package shape came from), both marketing campaigns and transactional sending in one account, an SMTP relay *and* an API, and a free tier for development.
- ⚠️ **Check the margin against Brevo's current price list before publishing these numbers.** The packages above are resale, and Meikigo's cost is Brevo's monthly plan for the **total** volume of every merchant plus all transactional mail. I am not going to quote Brevo's prices from memory — they change — but the arithmetic to do is: *(sum of all sold allowances + expected transactional volume) → which Brevo plan → what it costs → is it comfortably under what we charge?* The RM170-for-50K row is the one to check hardest; it is priced **below** the RM90-for-10K row per email by a factor of three, which is a steep discount to give away early.
- ⚠️ **Meikigo carries an aggregate commitment it must watch.** Selling one 500K package and five 100K packages commits Meikigo to a million emails a month. **Recommended: a dashboard figure in `meikigo-admin` — total allowance sold versus the current Brevo plan's ceiling** — because the failure mode is Meikigo's own account hitting its limit and *every* merchant's mail stopping, transactional included.
- **Keep the two streams separate inside Brevo** — the Round 9 decision stands. Marketing from `news.meikigo.com`, transactional from `mail.meikigo.com`, separate sending identities, so a promo blast's complaints cannot push signup OTPs into spam folders. ⚠️ **Confirm whether transactional mail also moves to Brevo** or stays on the current SMTP: both work, but the answer decides whether one provider outage stops *everything* or only marketing. **Recommended: both on Brevo for simplicity, with separate subdomains and separate API keys** — one vendor to manage, and a well-configured subdomain split is the protection that actually matters. See To Be Determined.
- ⚠️ **Brevo has its own anti-abuse rules, and they now matter more than anything Meikigo builds** — see below.

**⚠️ What is protecting deliverability now, after Rounds 14 and 15 removed three of the four controls**

Round 10 recorded four mechanical protections as load-bearing, precisely because Meikigo never reviews blast content: separate sending domains, per-Brand complaint monitoring **with automatic suspension**, the **weekly frequency cap**, and consent-plus-transacted targeting.

**Where they now stand:**

| Protection | Status |
|---|---|
| Separate sending domains | ✅ **Kept** — the strongest one, and unaffected |
| Weekly frequency cap | ⛔ **Removed (Round 14)** — replaced by the paid allowance |
| A per-Brand daily send limit as a backstop | ⛔ **Declined (Round 15: *"B"* — no limit at all)** |
| Automatic suspension on a complaint spike | ⛔ **Declined (Round 15: *"No automatic stop. Show us a warning in admin and let a person decide."*)** |
| Consent-plus-transacted targeting | ⚠️ **Weakened (Round 14)** — a merchant may now *declare* consent for imported customers |

- **✅ What Round 15 asked for instead: a WARNING in `meikigo-admin`, and a human decides.** Recorded as given. That is a legitimate choice — a person can tell an unlucky send from an abusive one, and an automatic suspension can take an honest shop offline on a bad Monday. **But it only works if somebody is actually looking**, and Round 15 also confirmed there is **one support person** covering **Monday to Saturday**. A complaint spike on a Sunday morning has nobody watching it.
- **So the warning must be built as a push, not a page.** Recommended, and it is the thing that makes the merchant's answer workable:
  - **✅ THE THRESHOLDS ARE SET (Round 16): complaints above 0.5%, or bounces above 5%, of a single send.** Recorded as given: *"A"*. These are the conventional warning lines — the same order of magnitude Google and the major senders use themselves — and both are **configurable in `meikigo-admin`** rather than compiled in.
    - **Measured per send, and also per Brand over a rolling 30 days**, so one unlucky blast and a steady bad pattern both surface.
    - **✅ ⭐ THE SMALL-SEND FLOOR IS SET (Round 17): the PERCENTAGE applies only to sends of 200 recipients or more. Below that, complaints are counted PER BRAND OVER A ROLLING MONTH.** Recorded as given: *"A but add measure it by month. if in span of 1 month only 1 people clicked as spam, this shouldn't be a big deal."*
      - **Why it was needed:** a 20-recipient blast with one complaint reads as 5% — ten times the limit. Every small shop would have tripped a warning on its first blast, and warnings that are always wrong stop being read.
      - **The rule, stated so it can be built:** a send of **200 or more** recipients is evaluated against the 0.5% complaint and 5% bounce rates. A send of **fewer than 200** is not rate-evaluated at all; instead that Brand's complaints are counted across a **rolling 30 days** and a warning is raised only when the count crosses a threshold. **✅ THE NUMBER IS CONFIRMED (Round 18): 3 complaints in 30 days.** **Recorded as given:** *"A"* — one is noise, as the answer said plainly the first time; three from one small shop is a pattern.
      - **The 200-recipient floor and the monthly count are both configurable in `meikigo-admin`**, like the rates themselves.
      - **The rolling-30-day Brand check still runs for large senders too**, unchanged — a shop can pass every individual send and still be accumulating complaints.
  - **✅ THE ALERT IS EMAIL ONLY (Round 16).** Recorded as given: *"Email only"* — no WhatsApp. It goes out the moment a threshold is crossed and **repeats daily until someone acts**.
    - **✅ ⭐ THE RECIPIENT ADDRESS IS A SETTING IN `meikigo-admin` (Round 17).** Recorded as given: *"The email can be configure in meikigo admin"*. So it is configuration rather than a compiled-in address, and it changes without a deploy when the team changes.
      - **It should be pointed at a monitored, shared address** — support@ or similar — rather than one person's inbox, so it survives leave and staff changes. With a single support person (Round 15), an alert sitting in a personal mailbox during their leave is an alert nobody reads. The setting makes that a choice; **somebody still has to make it**, which is why it stays on the launch checklist.
      - **Recommended: allow more than one address, and use the same setting for every platform alert** — deliverability warnings, failed subscription payments, and whatever is added next. One list, one place, one thing to keep current.
      - **Recommended: refuse to save it empty.** An alert with no recipient is an alert that does not exist, and it fails silently.
    - ⚠️ **Consequence of email-only, stated once and accepted:** support is **Monday to Saturday** (Round 15), so a complaint spike after a Sunday-morning blast is not seen until Monday. Brevo may act on it before Meikigo does. That is the accepted position; the manual suspend switch below is what makes Monday's response fast.
    - **The same channel and cadence suits every other alert we have added** — pending refunds, pending exchanges, unaccepted statutory diffs — and one consistent alert mechanism is worth more than three bespoke ones.
  - **A one-click manual suspend** on the Brand — since a human is making the decision, make the decision take one second. Their allowance is not lost; sending is paused and they are told why.
  - **Show the numbers per send, not just per Brand**, so the person deciding can see whether it was one bad blast or a pattern.
- ⚠️ **The real backstop is now Brevo, not Meikigo, and that is worth understanding clearly.** Brevo enforces its own complaint and bounce policies, and it can throttle or suspend **the whole Meikigo account** — which would stop every merchant's marketing *and* every transactional email, OTPs included, at once. Declining automatic per-Brand suspension does not remove the risk; it moves the decision to a vendor whose response will be blunt and immediate rather than to code Meikigo controls. **This is the strongest argument for building the one-click suspend and the push alert, and for the subdomain split that keeps transactional mail out of the blast reputation.**
- **A suspended Brand keeps its allowance** for the month it paid for; sending resumes when the suspension is lifted.

#### ⭐⭐ The composer, the audience and the sender — ✅ Resolved (Round 16)

**⭐ Meikigo builds its OWN composer. The merchant never sees Brevo.** Recorded as given: *"Build our own simple composer inside meikigo-merchant. The merchant never sees Brevo. We control the customer list, the unsubscribe link and the email counting."*

This is the right call and it decides a fair amount of architecture:

- **Brevo is a sending pipe, not a product surface.** Meikigo composes, Meikigo chooses the audience, Meikigo counts the usage, Meikigo owns the unsubscribe link. Brevo receives finished messages and reports what happened to them.
- **⭐ No customer lists are uploaded into Brevo.** The audience is resolved inside `meikigo-api` at send time and messages are submitted individually (batched for throughput) through Brevo's transactional-style sending, **not** as a Brevo contact list plus a campaign. Three reasons, and the first is the important one:
  - **Privacy:** a merchant's customer list stays in one place. Copying it into a second system means a second copy of personal data to protect, to keep in step, and to delete on request. Round 5's account-deletion path would otherwise have to reach into Brevo too.
  - **Counting:** the monthly allowance is Meikigo's number. If Brevo sent to its own stored list, Meikigo could not reliably say what was used.
  - **Consent and unsubscribe stay correct at the moment of sending** (Round 13's rule), which a pre-uploaded list cannot guarantee.
- **The composer itself stays simple**, because Round 10 removed templates deliberately: a subject line, a body with basic formatting, an optional image, and a preview. **No template library, no drag-and-drop builder, no HTML editing.**
- **Meikigo controls the unsubscribe link**, one per Brand per customer (Round 10's per-Brand unsubscribe), honoured immediately and permanently.
- **Bounce and complaint webhooks come back from Brevo** into `meikigo-api`, feeding the suppression list and the complaint-rate warning below. Without them there is no way to answer *"did it arrive?"*.
- ⚠️ **What Meikigo now owns that Brevo would otherwise have done:** the composer UI, the preview, the audience builder, the unsubscribe page, and the reporting screen (sent / delivered / opened / bounced / complained per blast). That is a real amount of work, and it is the price of the merchant only ever seeing one system.

**⭐ Who a blast can be sent to — ✅ FILTERS (Round 16)**
Recorded as given: *"A"*. Until now a blast went to the Brand's entire consenting customer list, every time.

- **Three audiences at launch:** **all customers**, **has not visited in the last X days**, and **has visited in the last X days**. `X` is typed by the merchant.
- **Why this matters commercially:** *"has not visited in 60 days"* is the win-back email, and it is the one blast that reliably brings money into a barbershop. It is also cheap to build — the customer list already holds last-visit dates.
- **The consent rule sits on top of every filter and is never optional:** a recipient must have marketing consent (self-given, or merchant-declared per Round 14) **and** have transacted with that Brand. A filter narrows that set; it can never widen it.
- **⚠️ Show the recipient count before sending**, next to the remaining monthly allowance — *"this will send to 412 customers; you have 588 emails left this month"*. That one line prevents most support questions about the allowance.
- ⚠️ **A filter counts customers, and a filter that returns 4,000 people quietly costs 4,000 emails.** The count must be shown *before* the send button, not after.
- **Deliberately not built:** hand-picking individual names from the customer list (offered as option (c) and not chosen), plus anything resembling segments, tags or scoring. A one-to-one message to one customer is a phone call, and this product has a phone number for that.

**⭐ Who the blast comes FROM, and what happens on reply — ✅ NO-REPLY (Round 16)**
Recorded as given: *"From: the shop's name and its no reply"*.

- **The `From` name is the SHOP's name** — *"Modern Barbershop"* — because it is the shop's message and the shop's relationship. The sending address remains Meikigo's (`news.meikigo.com`), which is what keeps domain authentication valid.
- **`Reply-To` is a no-reply address.** Replies are not delivered to the shop or to Meikigo.
- ⚠️ **This creates one real problem that must be solved in the template, not left to chance: a customer with a question has nowhere to go.** A no-reply promotional email is normal practice, but a barbershop customer *will* reply to ask about a price or an appointment, and that message will vanish.
  - **Required in every blast footer:** the **outlet's own phone number and address**, a link to the shop's booking page, and one plain line — *"This mailbox is not monitored. Please call the shop or book online."*
  - **The unsubscribe link must be prominent**, because a customer who cannot reply and cannot find the unsubscribe link presses "spam" instead — and that is the number Round 16 now warns on.
  - **✅ RE-ASKED AND CONFIRMED (Round 17): no-reply for everyone, and no per-Brand reply-to field is built.** Recorded as given: *"Keep no-reply for everyone. Simple, nothing to build."* An optional reply-to field per Brand was offered and declined for launch.
  - **This is a safe place to stop**, and worth saying why: the field can be added later without changing anything else — an empty value behaves exactly as today. So nothing is being foreclosed, and the mandatory footer is doing the work in the meantime. ⚠️ **Which makes the footer non-negotiable rather than decorative:** with no reply path at all, a footer missing the shop's phone number leaves a customer with only the spam button.

#### ⭐ Scheduled blasts — NEW REQUIREMENT (Round 13), on every plan
**Recorded as given:** *"i would like to add scheduled email blast feature to all plan (daily, weekly, monthly, one off)"*. Until now a blast was composed and sent immediately. It can now be **scheduled**.

- **Four modes:** **one-off** at a chosen date and time, and **recurring daily / weekly / monthly**. A schedule can be paused, edited and cancelled, and it shows its **next send date** and a history of past occurrences.
- **✅ THE CAP CLASH IS GONE — removed in Round 14, priced in Round 15.** `DAILY` is fully available and needs no permission: a daily schedule simply eats into that month's email allowance.
  - **Each occurrence checks the remaining allowance at send time.** If it is short, that occurrence is **skipped with a reason on the schedule's history and the merchant is emailed** — never partially sent, never queued to send later at a time nobody chose.
  - **⚠️ A daily schedule and a monthly allowance interact in a way the merchant will not expect.** A daily blast to 800 customers is 24,000 emails a month — more than double the 10K package. **Recommended: show the projected monthly usage as the schedule is created** (*"daily × 800 recipients ≈ 24,000 emails a month; your package covers 10,000"*), because the alternative is a campaign that works for twelve days and then dies silently every month.
  - **Recommended: warn before the allowance runs out**, not after — *"about 6 days of sending left this month"*.
  - **There is no frequency limit at all (Round 15: *"B"*)** — the allowance is the only throttle.
- **"All plans" needs one qualification, recorded as an assumption:** scheduling is not tier-gated in itself, but **sending a blast still requires the marketing add-on**, and `FREE` cannot buy add-ons. So in practice scheduled blasts exist on **STARTER, PLUS, PRO and FREETRIAL** — everywhere blasts exist at all. Say if FREE was meant to get blasts too, because that is a different decision (it would put unmoderated mail in the hands of accounts that have paid nothing, which is the classic abuse vector).
- **Consent and unsubscribe are evaluated at SEND time, not at schedule time.** A customer who unsubscribes on Tuesday must not receive Wednesday's already-scheduled occurrence. This is the single most important implementation detail here — a scheduler that snapshots its recipient list at creation will mail people who have since opted out, which is a PDPA problem rather than a bug.
- **A recurring schedule must stop when the entitlement stops.** If the marketing add-on is cancelled, the subscription lapses, or the Outlet/Brand is deactivated, the schedule **suspends** and says so. It must not keep sending on an entitlement nobody is paying for, and it must not be silently deleted either — the merchant should find it paused when they come back.
- **Recurring sends reuse the composed content.** There is no template library (Round 10) and there is no personalisation engine, so a monthly recurrence sends the same email to whoever qualifies that month. ⚠️ **Worth telling the merchant plainly in the UI:** a recurring blast with static content will hit the same customers with the same message repeatedly, which is how a shop trains its customers to unsubscribe. **Recommended, cheap, and it makes the feature actually useful: let a recurring schedule target a simple dynamic audience** — e.g. *customers who have not visited in 60 days* — evaluated at each send. The customer list and last-visit date already exist.
- **New storage (see Data Storage):** a `BlastSchedule` record — Brand, composed content reference, mode, next-send-at, timezone, audience rule, created-by, status (`ACTIVE` / `PAUSED` / `SUSPENDED` / `CANCELLED`) — plus one occurrence row per send attempt with its outcome (sent / skipped-by-cap / suspended), which is also what the frequency cap reads.
- **Timezone is Malaysia time and should be stored explicitly**, not inferred from the server, or a "9am Monday" blast eventually goes out at 5pm.

- **✅ Confirmed (Round 9) — blasts are EMAIL ONLY.** There is no SMS provider anywhere in Phase 1, so no SMS marketing may be promised on the pricing page or in the add-on description.
- **✅ Resolved (Round 10) — unsubscribe is PER BRAND.** *"Only for the shop only."* A customer who unsubscribes from Modern Barbershop still receives promos from any other Meikigo shop they use, because those are separate relationships. **Transactional mail — OTPs, receipts, booking reminders, disruption notices, payslips — always continues regardless of marketing consent**, and is built that way.
  - Implementation note: the consent record is therefore **per client per Brand**, not a single flag on the client account. Worth getting right at the schema level now, since retro-fitting per-Brand consent onto a global flag means every existing consent becomes ambiguous.
- **Provider and domain setup: ✅ specified in Round 9** — see Email Sending Infrastructure under the Customer Webapp section. Marketing goes out through a separate provider on a separate subdomain from transactional mail, which is what makes the unmoderated-blast decision survivable.

---

## Language & Legal Text (Round 6)

### Language
- **✅ Resolved (Round 6), reconfirmed (Round 15) — the first language is ENGLISH, and it is the ONLY language at launch.** Recorded as given in Round 15: *"A"*. Bahasa Malaysia comes later, when there is time and someone to translate properly.
- **Requirement, not a recommendation, now that BM is explicitly a later phase: keep every user-facing string in externalised string files from day one** — screens, emails, receipts, error messages and validation text alike. Retro-extracting strings from a finished product is several times the work of starting that way, and this decision only defers the second language rather than declining it.
- ⚠️ **The strings that will hurt most to retro-fit are the ones outside the app screens:** email templates (OTP, receipts, reminders, payslips), the printed receipt, and validation messages. Those tend to get hardcoded first and found last.
- **Recommended when BM does arrive: translate the customer-facing surfaces first** — the booking flow, the queue screen, the receipt and the OTP email — and leave `meikigo-merchant` and `meikigo-admin` in English longer. A customer choosing a barber needs their own language far more than an owner using a back office every day.

### Client-facing legal text
- **✅ Resolved (Round 6) — the deletion/retention wording must NOT tell the customer that data is soft-deleted.** The internal mechanics (soft-delete flags, retained rows) are not to be exposed in customer-facing copy.
- **How to honour that instruction without creating a legal problem — my recommendation:** there is a real difference between *not exposing internal mechanics* and *stating that data is erased when it is not*. The first is normal; the second is a misrepresentation, and PDPA expects a data user to be transparent about what is retained and why.
  - **Do not** say "soft delete", "flagged as deleted", or anything about how the database works. Nobody wants that and it helps no one.
  - **Do** say, plainly and briefly, that **transaction records are kept for accounting and tax purposes** for a stated period (LHDN generally expects 7 years) even after an account is closed. That is true, it is the actual legal basis, it is what every payment-handling business says, and it protects Meikigo if a customer later complains that "delete" did not delete.
  - **Avoid** wording that promises complete erasure ("all your data will be permanently deleted"), because Round 5 established that name/email/phone stay on past sales. That specific sentence is the exposure — not the retention itself.
- **✅ Resolved (Round 7) — Meikigo has asked me to draft the first version of both documents**, for a lawyer to review before publication. Approved deliverable, to be produced as its own document rather than inside this requirements file.
  - Scope of the drafts: **client-facing Terms of Service** and **privacy notice**, covering at minimum — what data is collected at signup (including the Google-SSO path), the account deletion path and what is retained afterwards and why (accounting/tax basis, worded per the constraint above), loyalty points and their forfeiture on deletion, marketing consent and withdrawal (Round 6), the no-recovery-without-email position in Phase 1, review anonymity, and the merchant-vs-Meikigo split of responsibility for customer data.

### Merchant-facing legal text — ✅ Resolved (Round 9)
**✅ Round 9: there is NO separate merchant agreement document. The merchant terms are folded into the subscription checkout as short terms-of-purchase.** This closes the last of Helmi's three tagged inquiries; all three are now settled.

- **What this means in the product:** the subscription checkout in `meikigo-merchant` presents a short terms-of-purchase block that the Brand owner accepts before payment. It is a checkout step, not a document library.
- **Acceptance is still recorded with a version identifier**, exactly as the client ToS is — a merchant who accepted v1 must be distinguishable from one who accepted v2, since the terms govern money already taken. The existing versioned-acceptance mechanism covers both.
- **The content still has to exist, even though the document does not.** Short does not mean silent; these are the points the checkout terms must actually cover, because each of them answers a question a merchant will eventually ask:
  - **Payment, renewal and cancellation** — that the plan auto-renews, what a cancellation does and when it takes effect, and that a cancelled Brand can reactivate (see Subscription & Billing).
  - **Data retention on cancellation** — that the merchant's data and their customers' data are **retained** rather than deleted, with the accounting/tax basis stated. This is the *"delete everything you hold on us"* email answered in advance, and it has to say the same thing as the client-facing privacy notice.
  - **Who owns the customer list** — that the **merchant** is the owner and data user for their own customers, and Meikigo processes it on their behalf. This one sentence is what makes the whole Round 8/9 access model coherent, and it is the sentence a regulator would look for.
  - **Marketing responsibility** — that a merchant sending blasts is responsible for their content and for holding valid consent, which is what makes Round 7's no-review position defensible.
  - **Service expectations** — plainly and without over-promising; no uptime figure should be committed to that Meikigo has not designed to meet.
- ⚠️ **The trade-off this accepts, stated once and then left alone:** short checkout terms are read by roughly nobody, and they are a weaker instrument than a signed agreement if a dispute ever turns serious — with an enterprise or franchise merchant in particular, whose lawyer will ask for a real contract. That is a reasonable position for a self-serve product selling RM109–329 plans, and it can be upgraded later without disturbing anything: a separate agreement can be introduced for larger merchants while self-serve keeps the checkout terms. **Recommended: keep the terms-of-purchase text in a versioned file of its own** even though it is displayed inline, so upgrading later is an editorial change rather than an excavation.
- **Consequence for the drafting deliverable:** I am producing **two documents, not three** — the client ToS and privacy notice as approved in Round 7, plus this shorter merchant terms-of-purchase block. Both must state the retention position identically.
  - They must stay consistent with the **versioned acceptance record** already specified — every published revision needs a version identifier, since acceptance is stored against it.
  - **Not legal advice, and not a substitute for review.** These are drafts to give a Malaysian lawyer something concrete to correct rather than a blank page.

---

## Reviews & Ratings

### Review Target & Cardinality
- **Resolved (Round 2) — a review carries TWO separate ratings: the Outlet, and the barber who served the client.** The Round 1 "Outlet only" answer is refined, not reversed: the Outlet review remains the primary/public review, and a **second, separate barber rating (1-5)** is collected at the same time so that `BarberStatistic` has a real data source (this was chosen explicitly over dropping barber ratings altogether).
- **Resolved — one review per Transaction (1:1), not one per client per Outlet.** A client with 5 separate visits to the same Outlet can leave up to 5 separate reviews. The canonical flow is: queue number → haircut → pay → review.
- **⚠️ Revised (Round 6) — the barber rating is now ONE PER BARBER WHO SERVED, not one per review.** Because a ticket can carry a different barber per service line (Round 6), a review submission is:
  - **One Outlet rating (1-5)** per Transaction — unchanged, still 1:1.
  - **One barber rating (1-5) per distinct barber on that ticket** — a two-barber ticket asks the client for two barber ratings, each feeding only that barber's `BarberStatistic`.
  - The client is shown **which service each barber performed** when rating, otherwise they cannot tell the two apart.
  - Data-model consequence: `Review` can no longer hold a single `Employee ID` — the barber ratings become a child collection (Review → 1..N barber ratings). See Review Data.
- Everything else about reviews is unchanged: rating-only (no text), two-way anonymous, immutable, and reachable only from the open browser tab straight after payment — which means counter-created tickets and manual outage sales still produce no review at all (Round 6).

### Review Eligibility & Timing
- **Resolved (Round 2) — only registered account holders can review.** Since the Guest type is dropped entirely, every paying client qualifies — the review prompt is reachable by everyone who transacts. The stated rationale is **anti-abuse: requiring an account is what makes spam-voting/bot-voting hard**, so review submission must never be opened to an unauthenticated path.
- **Resolved — reviewing happens immediately after payment, inside `meikigo-customer-webapp`**, as a post-checkout prompt on the transaction receipt. It is not something the client comes back to later from a "past visits" section.
- **Resolved (Round 2) — the review window is the browser tab, full stop.** The transaction receipt is reviewable only for as long as the client keeps the booking tab open. **Once the tab closes, the review opportunity is genuinely lost** — the emailed receipt does **not** carry a working review link back into the flow, and there is no "review this past visit" entry point in the client's transaction history.
- The client may still **send the receipt to their email**, but as a receipt only, not as a second chance to review.

### Review Content
> **⚠️ Resolved (Round 3) — written review comments are REMOVED entirely. Reviews are star/rating-only.** There is no free-text comment field anywhere in the review flow. This **supersedes** the earlier "star mandatory, comment optional, comments shown publicly" rules.

- A review submission consists of exactly two numeric ratings: the **Outlet rating (1-5)** and the **barber rating (1-5)**.
- No text is captured, so nothing needs masking, filtering, or moderating (see Review Moderation below).
- Abuse control is handled at the **identity** layer instead of the content layer: leaving a review requires an account, and **account creation requires OTP verification or SSO** (see Client User Types), which is what makes bot/spam voting expensive.

### Review Visibility & Anonymity
- **Anonymous:** All reviews are completely anonymous.
- **Resolved — anonymity is two-way and absolute.** It is not merely hidden from other customers/public view: the **merchant and barber also cannot see internally** which client rated them. There is no privileged/admin view that de-anonymises a reviewer.
- **Resolved (Round 3) — no additional aggregate-only restriction is imposed on barber-facing rating views.** The re-identification concern (a barber matching a low rating to whoever sat in their chair at that time) is considered not to hold in practice, because **clients frequently rate hours after the visit** — a morning cut may be rated at night — so rating order does not track service order.
- ~~Individual review comments are shown publicly~~ — **moot as of Round 3:** there are no comments.

### What Is Shown Publicly (Resolved, Round 4)
- The public Outlet page shows **all of it**: the Outlet's overall star average, the **number of ratings** behind it, and **per-barber star averages** (so a customer can choose a barber by rating).
- **A minimum-ratings threshold gates display**, so a single early rating cannot define a shop — and that **minimum is configurable by the Meikigo super admin** (platform-level, in `meikigo-admin`), not by the merchant. Below the threshold, no score is shown.
  - **✅ THE NUMBER IS 5 (Round 15).** Recorded as given: *"5 ratings."* Below 5 ratings, no score appears anywhere — not on the outlet page, not on the barber profile, not in search.
  - **What to show instead of a score**, because a blank space reads as broken: *"New — not enough ratings yet"*, with the rating count. **Recommended**, and it is also honest.
  - **The threshold applies per rated thing**, not per shop: a new barber at an established outlet has their own count to reach. That is deliberate — the point is that no individual is defined by two reviews.

### ⭐ Google Review Prompt — ✅ NEW REQUIREMENT (Round 18)
Meikigo's own ratings are anonymous and work well, but they live inside Meikigo — nobody searching *"barber near me"* on Google ever sees them, and for a barbershop, Google reviews are the single biggest thing that brings new customers through the door. The customer has just paid, they are happy, and their phone is already open on the review screen — the best moment there is to ask.

**Recorded as given:** *"A"* — after a customer leaves a **4 or 5 star** rating in Meikigo, one extra button appears: *"Loved it? Tell Google too"*, going straight to the shop's Google review page.

- **A customer who rates 1–3 stars is never shown the button.** A quiet Meikigo rating stays quiet; only a happy customer is pointed at a public platform.
- **The merchant pastes their Google review link into settings once.** No verification of the link's validity is required beyond it being a URL — if the merchant gets it wrong, the button simply goes nowhere, which is a support ticket rather than a design problem.
- **Outlet-level, regardless of `brand_type`.** A Google Business Profile belongs to a physical premises, not a brand concept, so — unlike most settings, which follow the franchise/branch rule (Round 11) — the Google review link is configured per Outlet on every Brand type, the same way address and business hours are. See Configuration Settings.
- **This sits after the Meikigo rating is submitted, never instead of it.** Meikigo's own star/count data (What Is Shown Publicly, above) is unaffected — the button is an addition to the post-rating screen, not a replacement for anything.

### What the Merchant Sees (Resolved, Round 4)
- The merchant sees **the aggregate number only** — e.g. *"4.2 from 38 ratings"*. No dated list of individual scores, no per-visit breakdown.
- This is stronger than the anonymity rule strictly required and closes the re-identification path entirely: with no timestamps exposed, there is no way to correlate a rating back to a particular client or sitting.
- Trade-off accepted: a merchant cannot see *when* their score moved, so they cannot isolate a bad day, a bad shift, or a specific barber's decline from the review data alone. Operational diagnosis has to come from the dashboard metrics instead.

### Merchant Response
- **Resolved — reviews are strictly one-directional.** There is no merchant-facing reply/response feature; the merchant cannot respond to a review publicly or privately.

### Review Editing & Deletion
- **Resolved — clients cannot edit or delete their reviews.** This **supersedes** the earlier "clients can edit/delete their reviews" rule. Once submitted, a review is immutable from the client's side. *(This also removes the question of retroactively recalculating aggregates on edit/delete.)*

### Reviews vs. Voided/Refunded Transactions
- **Resolved — the review stays.** If a Transaction is later voided/refunded after its review was submitted, the review is **not** automatically hidden or removed.

### Review Moderation
> **Resolved (Round 3) — moderation is designed out of the product rather than solved.** With written comments removed, there is no user-generated text to moderate: no profanity, no spam links, no phone numbers, nothing to mask or approve.

- ~~Blocked-word list maintained by the Meikigo super admin, masking matched words as `****`~~ — **superseded/moot (Round 3):** it exists to police review text, and there is no review text. Drop it from scope unless free-text is reintroduced later.
- **Moderation Process:** None, and none needed — no approval workflow, and no merchant ability to have a rating taken down.
- The remaining abuse vector is **rating manipulation** (bulk fake accounts inflating or tanking a score), which is countered by the **OTP/SSO requirement at account creation**, not by content moderation.

---

## Location / Discovery

- `EnumState` (Malaysian states) is confirmed **not needed** for the current phase. Meikigo is **not** a discovery marketplace — customers don't browse for nearby merchants; each QR code/entry point maps directly to one Brand and its branches, and the customer already knows which shop they're visiting before opening the app. Keep the model simple; revisit only if the product pivots to a discovery-marketplace model.

---

## Data Storage Requirements

### ⭐ File & Photo Storage — ✅ Resolved (Round 18)
The system holds two kinds of uploaded file — barber photos (Round 11B) and, new since Round 17, a photo of every expense receipt. Neither had an infrastructure answer until now. A shop recording 30 expenses a month with a photo each is 360 photos a year; fifty shops is 18,000 — these cannot sit as blobs in the database.

**Recorded as given:** *"A"* — **OCI Object Storage**, since Meikigo already runs on Oracle Cloud Infrastructure (`deployment-doc.md` already uses an OCI Object Storage bucket for the daily database backup dump, so this is the same provider, not a new one). Served through a link that expires, with a size limit per file and a shrink step for big phone photos on upload.

- **Every uploaded file — barber photo, receipt photo/PDF — goes through one shared upload pipeline**, not per-feature handling: resize, compress, and **strip EXIF** (a phone photo carries the GPS coordinates of the shop and sometimes the uploader's home) before it lands in the bucket. This generalises the processing step already specified for barber photos (see Barber Public Profile) to every upload type, including receipt photos (see Expenses & Profit).
- **A size cap per file** (barber photos: image only; receipt uploads: image or PDF, recommended 10MB — see Expenses & Profit).
- **Never a permanent public URL.** Files are served through a **time-limited signed link**, consistent with the reason-gated posture the rest of the document takes toward anything that could expose more than intended — a barber photo needs to render on a public page (so its signed link is long-lived and safe to be public-facing), while a receipt photo is a financial record and its link should only ever be handed to someone already authorised to see the expense it belongs to.
- **Counted as part of the Brand's data** for export and deletion purposes, same as every other Brand-owned record.

### Organisation
- Organisation ID
- SSM number
- Business/legal name
- **TIN (tax identification number)** — required both for the merchant's own e-Invoices and for Meikigo's subscription invoices to the merchant (Round 5)
- **SST registration number** (nullable — only if registered)
- **MSIC code + business activity description** — e-Invoice mandatory fields (Round 5)
- Max brand cap (fixed global limit, default 10 — configurable in `applicationsetting`, not tied to any Brand's subscription)

### Brand
- Brand ID
- Organisation ID (FK)
- Brand/shop name
- **⭐ `brand_type` — `FRANCHISE` or `BRANCH` (Round 11).** Decides **where settings are configured**: outlet-level for a franchise (each outlet is its own business), brand-level for a branch operation (one owner, configure once, applies to all). Set at Brand creation; changing `FRANCHISE`→`BRANCH` overwrites every outlet's independently-set values and must be confirmed explicitly. See Configuration Settings → Where a setting is configured
- `isfreetrialactivated`, `freetrialended`
- Max outlet cap (subscription-driven)
- Active subscription tier (via current `SubscriptionLine`)

### Outlet
- Outlet ID / code (used as `{merchantcode}` in queue IDs)
- Brand ID (FK)
- Address / business information
- Business hours
- **Last queue number receiving time** (per-Outlet cutoff after which no new numbers are issued for the day)
- **Booking horizon** (how far ahead clients may book — merchant-configured)
- **Loyalty redemption scope** (this Outlet only vs. Brand-wide — never wider)
- Number of barbers (tier-dependent, enforced via Brand's plan)
- **Status (active / closed-deactivated) + closure effective date + closure reason** (Round 5) — a closed Outlet stops issuing QR entry, cancels its tickets/bookings, and must still resolve for historical reporting
- **POS notification sound enabled (boolean)** — per-Outlet option for the counter alert on new remote bookings/queue joins (Round 5)
- ~~**Admin override password (Round 6)** — an Outlet-level shared secret~~ — **⛔ RETIRED (Round 12). Consolidated into the per-Admin approval password**, which is now the single authorisation secret for stock approvals, discounts, voids and refunds alike. See Inventory Adjustment Requests & Approval → The Admin Approval Password
- **Commission configuration (Round 6)** — the Outlet's default commission settings for products **and** services; overridable per product/service and per barber
- **Loyalty settings (Round 6)** — whether commission is paid on a redeemed free cut, and which service a free cut applies to (nominated service vs. highest-value eligible line)
- **Referral joining bonus (Round 6)** — how many points a client referred to this Brand/Outlet starts with
- **Public holiday list + opening float (Round 6)** — merchant-entered holidays per Outlet (Meikigo ships no calendar), and the day's opening cash float for the day-close reconciliation
- **Per-Outlet stock quantities** (Round 6) — held against Brand-level Products; see Product

### Merchant Staff Account (`UserAccount`)
- Email
- Full name
- `iscreator` (boolean — flags the account that created the Brand)
- Brand ID (FK) — **Brand-scoped, not Outlet-scoped: the same Cashier account may work any Outlet of its Brand, never another Brand** (Round 5)
- Role: **Admin, Cashier, or READ-ONLY (Round 7)** — the read-only account drives the in-shop queue display and can see nothing else. Barbers still have no account of any kind. **A READ-ONLY display account does not count against the plan login cap and does not exist on FREE (Round 8)** — flag it on the row (e.g. `is_display_account`) so quota enforcement can exclude it
- (No phone, no login password — the login password lives in Keycloak)
- **⭐ Admin approval password (Round 11)** — Admin-role accounts only. A **second secret, separate from the login password** and enforced to be different from it, typed to approve a stock adjustment or authorise a counter override. Hashed, rotatable by the holder, resettable by the Brand admin, rate-limited on failed attempts, and its every use written to the audit row alongside the acting cashier. See Inventory Adjustment Requests & Approval
- **Active device session** (Round 5) — one account may be signed in on **one device only**; signing in elsewhere invalidates the existing session. Needs enough session state to support an Admin **force-sign-out** (lost tablet, departed staff). The Outlet the session is operating against is bound here, not derived from the account.

### Organisation Member
- Organisation Member ID
- Organisation ID (FK)
- Email
- Role / privilege level — freeform, a custom named role with a configurable permission checklist defined by the inviter at invite generation time (not picked from a small fixed list); e.g. "Organisation-level admin" is one example of such a role
- Invitation status (invited / accepted / removed / revoked)
- Invitation link token (single-use, expires after a configurable duration in hours)
- Grants Organisation-wide administrative access (all Brands/Outlets under the Organisation) automatically on acceptance, same reach as the `iscreator` — but does **not** itself grant an operational Outlet-level login; that requires a separate `UserAccount`/`Employee` provisioned per-Brand via that Brand's own "Add Staff" flow (see Staff Invitation Flow)
- Members with sufficiently-privileged roles can invite/remove other Organisation Members, but no Organisation Member can remove the `iscreator`
- Counted against the flat 10-member Organisation cap; `iscreator` is excluded from this count

### Employee
- Employee ID
- UserAccount ID (FK, for `meikigo-pos-native` login) — nullable if the employee doesn't need login access
- Outlet ID (FK) — exactly one, non-nullable
- Type (`BARBER` / `STAFF`) — determines commission eligibility and which per-plan headcount quota it counts against
- Full name
- Status (available/unavailable)
- **Active/deactivated flag + deactivation date + deactivation reason** (Round 5) — deactivation is what frees a headcount slot against the plan cap; the record is **never deleted**, and must remain resolvable for payroll, commission settlement, audit, and historical reporting under Malaysia's Employment Law / accounting-standard requirements
- **Employment/pay fields required by Payroll** (Round 5) — base salary, pay cycle, and the statutory identifiers needed for EPF/SOCSO/PCB calculation. Retained per statutory record-keeping periods (Employment Act 1955; tax records generally 7 years), not indefinitely by default
- **Pay model (Round 10, extended Rounds 12–13)** — `pay_type` (`BASIC_PLUS_COMMISSION` / `COMMISSION_ONLY` / `DAILY_WAGE` / **`HOURLY`** — Round 12), `basic_salary`, `daily_rate`, **`hourly_rate`**. **Effective-dated**, so a raise never rewrites an issued payslip
- **⭐ New fields (Round 13):**
  - **`pcb_monthly_amount`** — the standing monthly PCB figure, **nullable** (so "not set" is distinguishable from "set to nil"), **effective-dated**, and overridable on a single payroll draft without rewriting the standing value
  - **`overtime_eligible`** — whether Meikigo calculates overtime for this person. Defaulted from the wage (the Employment Act's hours-and-overtime provisions reach employees earning **RM4,000/month or less**) but explicitly settable, since a merchant may choose to pay overtime beyond what the Act requires
  - ⚠️ **`COMMISSION_ONLY` has no ordinary rate of pay**, so overtime cannot be computed for it without a basic wage or an explicitly typed overtime basis — see Payroll → Overtime and To Be Determined
- **⭐ Payroll identity fields — ✅ CONFIRMED (Round 11)**, *"collect all of the above"*:
  - **`ic_number` — REQUIRED.** It identifies the person on the payslip and is the basis of the payslip PDF password (last 4 digits)
  - **`start_date` — REQUIRED.** Drives the mid-month-joiner flag on the payroll draft
  - **`epf_number`, `socso_number`, `income_tax_number`** — optional; printed on the payslip when present
  - **`bank_name`, `bank_account_number`** — optional. Meikigo moves no money (payroll is numbers-only), but shops keep this on file and it is normal for it to appear on a payslip
  - **`email` — REQUIRED for payroll delivery (Round 10)**, back-filled on existing records before the first run. The run is **not blocked** by a missing address (Round 11); the merchant downloads and hands over that payslip instead
  - ⚠️ **All of this is sensitive personal data about an employee**, held by a merchant, sitting in Meikigo's database. It belongs behind the same masking and role rules as customer PII, and the merchant's own staff should not all be able to read every colleague's IC number and salary. **Recommended: Admin-only visibility on the employee payroll tab**, separate from the ordinary employee record a manager uses for rostering
- **Skills / services this barber can perform (Round 7)** — many-to-many against Products/services, merchant-editable; drives which barbers the customer is offered per service line. Default a new barber to "can do everything" so a skipped setup screen doesn't hide them
- **Daily capacity** (max clients per day, set by the merchant/manager) — bookings stop being offered against a barber once this cap is reached for the day
- Commission config (percentage or fixed) — `BARBER` type only
- **Accrued/unpaid commission balance** (Round 5) — stays visible after deactivation until settled, and feeds the payroll run
- Performance rollups via `BarberStatistic` (see below) — `BARBER` type only

### BarberStatistic
- Employee ID (FK)
- Aggregated customer count
- Aggregated rating
- Avg processing time
- Period/date bucket (for KPI/bonus calculation)

### Client Data (meikigo-customer-webapp)

**Resolved (Round 2) — there is only ONE client type: a registered account.** No guest record type exists; an unauthenticated visitor has no row at all, only a browsing session.

- Client ID
- Email (unique)
- Full name
- Password (hashed, via Keycloak) — **or** a linked Google/Gmail social identity (Keycloak identity provider); the account may exist with no local password at all
- Phone number (not the identity key any more, but the primary lookup handle used by the cashier at the counter — alongside username and email)
- Auth method / linked identity provider (local password vs. Google SSO)
- Verification record — every account is created via **email OTP** (or SSO); OTP is issued **once, at creation only**, never on subsequent logins
- **Required signup fields: email, phone number, full name, password** — email must be **unique**. **On the Google-SSO path (Round 5): name and email come from Google, no password exists at all, and the phone number is collected in a post-SSO completion step** — so a Client row can legitimately exist with a null phone number until that step completes (and cannot book until it does)
- **Phone-change verification record (Round 5, revised Round 7)** — a phone number change is verified by a **6-digit OTP sent BY EMAIL** to the account's verified address (no SMS exists in Phase 1); the account keeps all loyalty balances and history through the change, and the new number must propagate to any active queue ticket/booking (which denormalises it)
- **Account deletion state (Round 5)** — a client may delete their account. Deletion removes login/lookup/loyalty-holding capability; it does **not** strip name/email/phone from past Transactions, which are retained as financial records. Deletion timestamp should be recorded, and the fate of any remaining loyalty balance needs confirming (see To Be Determined)
- **In-app notification inbox (Round 5)** — merchant-initiated disruption notices only (booking cancelled by Admin with its compulsory reason; Outlet closing). Never queue status
- **Marketing consent + timestamp + version (Round 6)** — captured at signup as a **separate, unticked checkbox**, distinct from ToS acceptance; withdrawable, and honoured immediately on unsubscribe. Required before a merchant may include the client in a marketing blast
- **⭐ `consent_source` (Round 14)** — **`SELF_GIVEN`** (the customer ticked the box themselves, with timestamp and version) or **`MERCHANT_DECLARED`** (the merchant declared it at bulk import, with the batch, the wording and who ticked it). These are different kinds of evidence and an audit will need to tell them apart; it is one column now and impossible to reconstruct later
- **⭐ Imported light records (Round 14)** — a customer created by bulk import is the **same shape as the Round 7 staff-created minimal account**: name, phone, optional email, **no password, no login, unverified**. It can hold loyalty and be found at the counter, and it is **joined to a real account on phone-number match** when that person registers themselves. It carries its `import_batch_id`
- **⭐ No-show count (Round 16, recommended)** — a running count of missed **bookings** per client. **Nothing acts on it**: the penalty stays loyalty points only, and the zero-points gap is accepted (see No-Show Penalties). It exists so the counter can see *"4 no-shows"* when that customer next appears, and so a future decision about repeat offenders starts from evidence rather than from nothing
- **Referral code (Round 6)** — every client has one to share; see Referral Data
- **Staff-created minimal account flag (Round 7)** — an account created at the counter or by phone (name + phone, no password) is **unverified** and cannot log in until the customer completes registration; it can still hold loyalty and be looked up. Match on phone number when they later register, so history and points carry over
- **Phone-change verification is by EMAIL OTP in Phase 1 (Round 7)** — a 6-digit code emailed to the account's verified address; no SMS exists in Phase 1
- **Minimum age 18 (Round 7, recommended)** — minors hold no accounts; a child's haircut is a service line on the parent's ticket
- **Email change verification (Round 6)** — a new address is verified by OTP **before** it becomes the login, with a notice sent to the old address. Blocked for Google-SSO-only accounts unless a password is set first
- Loyalty point balances — **one balance per merchant-configured scope**, not a single global number (see Loyalty Scope)
- ToS acceptance record (timestamp, version accepted)
- History views: transaction history, point history, redemption history
- **No "list of reviews written" link may be exposed** — reviews are anonymous to *both* parties, so no client↔review association can be surfaced to the merchant, the barber, or the public. (Any internal FK kept for integrity must never be readable through a merchant- or public-facing path.)

### SubscriptionLine
- SubscriptionLine ID
- Brand ID (FK)
- Plan type (FREE / FREETRIAL / STARTER / PLUS / PRO)
- Billing cycle month
- Status (PENDING / ACTIVE / EXPIRED / CANCELLED)
- Payment reference (HitPay)

### Category
- Category ID
- Brand ID (FK)
- Name

### Product
- **⭐ `commission_enabled` (Round 13)** — a per-item on/off flag for commission, on products **and** services. The *rate* stays Outlet-level with no per-item overrides (Round 7/9); this flag only decides whether an item participates at all
- Product ID
- Brand ID (FK) — source of truth
- Category ID (FK)
- Name
- Description
- Price
- Estimated duration (minutes)
- Status (active/inactive)
- Commission config (percentage or fixed) — **products AND services as of Round 6**; defaults live in Outlet configuration, overridable per product/service and per barber
- Outlet-level price override (delta table, keyed by Outlet ID + Product ID)
- **Barber-level price override (Round 6)** — delta keyed by Employee ID + Product ID; senior/junior pricing. Precedence: Brand → Outlet → Barber (most specific wins)
- **Stock quantity per Outlet (Round 6)** — retail products only, never services. Decremented automatically on sale; supports stock-in, logged manual adjustments with reasons, movement history, and low/zero-stock visibility. **A refund never restocks automatically (Round 7)** — a resellable return goes back only via a logged manual adjustment, and damaged goods never at all
- **Cost price, tracked per stock purchase (Round 7)** — not one editable figure: each stock-in carries its own unit cost, so the same product holds cost layers (bought at RM4 in January, RM8 in February). Recommended valuation is **weighted average cost**, with purchase records retained so FIFO stays possible later. The cost used on a sale is **snapshotted onto the transaction line**, like price, so later purchases can't rewrite historical margin
- Derived reporting: gross margin per product, COGS for the accountant export, and **stock valuation** for year end (Round 7)

### Queue Data
- Queue ID: `{outletcode}{date}{sequentialnumber}`
- Display number (1000+)
- Outlet ID (FK)
- Client ID (FK) — **⚠️ NULLABLE as of Round 6.** A **counter-created ticket** (walk-in with no smartphone, keyed in by staff) has no account behind it. Self-service tickets and staff-created *bookings* still always carry an account
- **Customer label (Round 6)** — free-text, used on counter-created tickets so the barber can call the customer out; staff may enter whatever is useful (name, nickname, description). Recommended mandatory when Client ID is null
- **Created-by / source (Round 6)** — self-service (app) vs. staff-created at the counter vs. staff-created booking (phone), plus the staff account that created it
- Client phone number (denormalised for counter lookup / merchant contact / "I have a booking" recovery)
- Selected barber (Employee ID) — **⚠️ NON-NULLABLE and PER SERVICE LINE as of Round 6.** "No preference" is removed, so every service line names the barber who will perform it; a ticket may therefore carry several different barbers. Round-robin survives only as the disruption-reassignment mechanism, not as a join-time assignment mode
- Selected product(s) — **many-to-one with the ticket** (multiple services allowed per queue entry); provisional until confirmed by the cashier at the counter
- **Price snapshot per selected service, taken at join/booking time (Round 5)** — the client pays the price shown when they joined, so the ticket must carry it; services added at the counter are priced at counter time instead
- **Estimated duration = the SUM of the selected services' merchant-configured durations (Round 5)** — never auto-adjusted from measured times
- Entry type (walk-in running number / booked time slot)
- Booked slot time (nullable — only for bookings; for *today* must be ≥ the walk-in queue's projected clear time, for future dates derived from business hours/capacity/breaks/off-days/holidays)
- **Party/group reference (nullable)** — links bookings made together as one party; **exists at the booking layer only and is never carried onto the Transaction**
- **Unique constraint on (barber, slot)** — slots are not held during signup, so concurrent bookers race and the loser must pick another time
- Join timestamp
- Status enum (WAITING / CALLED / IN_SERVICE / COMPLETED / EXPIRED / REQUEUED / CANCELLED)
- Cancellation timestamp + source (nullable — distinguishes a voluntary client cancellation from a no-show/expiry for penalty purposes). **Round 5 adds merchant-initiated cancellation as a source, with a COMPULSORY reason** (barber resigned, Outlet closed) — the reason is sent to the client by email + in-app notification
- No-show flag + who marked it (nullable — no-show is a **manual barber action**, not purely timer-driven)
- Requeued-from ticket reference (nullable — a requeued client takes a brand-new sequential number; the original ticket is removed from the public display)
- Service start/end time
- **Constraint (revised again in Round 3):** taking a queue number at another Outlet while holding an active one triggers a **cancel-the-previous prompt** — the client ends up with one active ticket, by explicit choice rather than a hard block. The released ticket is recorded as a voluntary `CANCELLED`, not a no-show.
- **Constraint:** neither a booking **nor a walk-in assignment** may be made against a barber who has reached their configured **daily capacity**; new numbers are refused after the Outlet's configured **last queue number receiving time**. Tickets already issued are always served — never auto-expired at closing.

### Transaction Data
- Transaction ID
- Outlet ID (FK)
- Client email/ID
- Barber/Employee ID
- Line items: product name, price, tax — **snapshotted at time of sale**
- Amount
- Payment method
- Status (PENDING / SUCCESS / FAILED / VOIDED)
- `voided_at`, `voided_by`, `void_reason` (nullable)
- **Sale timestamp** (for a manual entry, the actual sale time typed in by the Admin — may be backdated to a previous day)
- **Entry timestamp + entered_by** (nullable — set for manually-keyed sales; distinct from sale time, for audit)
- **`is_manual_entry` flag** — manually-entered outage sales must remain distinguishable from gateway-processed sales
- Loyalty points applied — on manual entries these are **granted by hand by the Admin and logged**, not calculated automatically
- **Commission accrued — PER SERVICE LINE, against the barber who performed it (Round 6)** — calculated automatically on every sale including manual/backdated entries, on **both products and services**. Not reversed by a refund/void. Reported (dashboard, Z-report, accountant export) on every tier, and **additionally carried onto a payslip by the monthly payroll run on PRO** (Round 9). **Two rates apply — service and product — set at Outlet level (Round 9)**
- **Tip amount + tip recipient (Round 6/7)** — added by the customer at checkout and shown on the receipt; on a multi-barber ticket the **customer nominates** which barber receives it (Round 7), with per-barber amounts supported if they want to split. Accrued like commission. **Excluded from sales revenue, from commissionable amounts and from tax** — never a line item in the subtotal
- **Discount applied + type + reason + authorised-by (Round 6)** — ad-hoc discounts are Admin-authorised via **that Admin's own approval password (Round 12)** and always logged, so the row names the authorising Admin as well as the acting cashier; applied **before tax**, shown as its own receipt line
- **⭐ The commission basis actually used on a discounted line (Round 7, defaulted by setting in Round 13)** — gross or discounted — stored on the transaction, so no report or payslip depends on reading a setting that may have changed since
- **⭐ Manual commission lines (Round 13)** — zero or more per transaction: credited employee, amount (fixed or percentage of the line), the line it relates to, a reason, and the authorising Admin. Accrues like earned commission but is **reported separately**, since it is discretionary by design
- **⭐ Pending refund requests (Round 13)** — a refund raised at the counter with no Admin present is a `PENDING` request against this transaction, not a status change on it: request reference, amount, reason, requesting cashier, and — once resolved — the approving Admin, the outcome, and the date the money actually moved
- **Commission-on-discount decision (Round 7)** — when a discount is applied, a popup asks whether the barber's commission drops with it (shown only where the Outlet has commission enabled). The per-transaction answer is stored, so an audit can see who decided what
- **Cost of goods snapshot (Round 7)** — the unit cost applied to each retail line at time of sale, for margin/COGS reporting
- **No queue ticket, for a product-only sale (Round 7)** — Client ID and barber are both absent, and no commission accrues
- **Loyalty redemption presented as a discount line (Round 6)** — the service keeps its full price and a matching redemption line offsets it, so delivered value, programme cost and the tax base all stay visible
- **Day-close reference (Round 6)** — which Outlet day-close the transaction falls into, for cash reconciliation
- **e-Invoice field set (Round 5)** — captured on **every sale, on every tier**, so nothing needs back-filling: supplier identity (TIN, SSM/BRN, SST no., MSIC), per-line classification code and tax type/rate/amount, totals excluding/including tax, currency, payment mode. Plus, where an e-Invoice was actually issued: buyer details (name, TIN or NRIC, address, contact, email), **IRBM UUID**, validation timestamp, and the validation-link QR
- **e-Invoice status** — not requested (rolls into the merchant's monthly consolidated submission) / individually requested and submitted / validated
- **No group/party reference** — a split-payment party produces independent Transactions by design (see Group Split Payment)

### Day Close Data (Round 6)
- Day-close ID + Outlet ID (FK) + business date — **one close per Outlet per day**
- Opening float; counted cash; **expected cash** (float + cash sales − cash refunds **+ cash tips taken**, Round 10 — no payout term, tips are paid monthly through payroll); **variance**
- Sales by payment method, voids, discounts, **tips taken by barber**, commission accrued by barber, tax collected, transaction count
- Closed-by (account) + closed-at; **immutable once submitted** — corrections are new adjusting records, never edits
- Auto-close marker, for a day nobody closed manually

### Inventory Data (Round 6, extended Round 9)
- Product ID (FK) + Outlet ID (FK) + quantity on hand — retail products only
- Movement records: type (sale / stock-in / **approved manual adjustment** / exchange), quantity delta, reason (required on adjustments), who, when, and the related Transaction where applicable
- Low-stock threshold per product/Outlet
- **Cost layers per stock purchase** (Round 7) — the same product holds cost at different purchase prices; weighted-average valuation, with purchase records kept so FIFO stays possible. Cost is snapshotted onto the sale line
- **Adjustment request records (Round 9)** — the approval flow, which is what turns the movement log into a control:
  - Request ID + Product ID (FK) + Outlet ID (FK) + direction and quantity
  - **Reason (required)** from the fixed list — stock take / damage / theft / personal use / resellable return / exchange — plus optional free text
  - Requested-by (account) + requested-at
  - **Status: `PENDING` / `APPROVED` / `REJECTED`** — stock moves **only** on approval
  - Approved-or-rejected-by (account) + at + optional note; **flag when requester and approver are the same account** (permitted only where the Outlet has a single Admin, and recorded as self-approved rather than hidden)
  - Related Transaction where the request originated from an exchange or refund
  - The resulting movement record links back to the request that authorised it

### ⭐⭐ Expense Data (Round 17)
The other half of the accounting module, and until Round 17 it did not exist at all.
- **Expense row:** Outlet (FK), date incurred, amount, tax amount (optional, for the accountant only — never used in the SST return), category (FK), note, paid-by method, `source` (`MANUAL` / `CASH_OUT` / `PAYROLL`), recorded-by account, recorded-at
- **Status `ACTIVE` / `VOIDED`** with void reason, who and when. **Never hard-deleted**, like every other money record; a correction is a new row
- **Receipt attachments** — one or more files per expense (images or PDF), with a size cap (recommended 10MB each), part of the Brand's data for export and deletion
- **Expense category:** Brand (FK), name, active flag, and whether it is a Meikigo-seeded default. `Other` is undeletable
- **Links out:** the `CASH_OUT` record that created it, or the payroll run that posted it — so a system-sourced expense can always be traced to the event that produced it, and so it cannot be entered twice
- **Recurring expense template (recommended):** Outlet, category, amount, day of month, active flag, and the date it last generated a draft. It creates drafts for confirmation, never posts silently

### ⭐ Cash-Out / Petty Cash Data (Round 17)
- One row per drawer movement that is not a sale: Outlet (FK), business date, direction (**out** for a payout, **in** for float or change added), amount, reason (from the pick-list) plus free text
- **Taken-by** and **authorised-by** accounts, and the timestamp
- **Whether it posted an expense**, and the expense row it created (null for `bank-in` and `owner's draw`)
- Optional receipt attachment, addable after the fact
- **Immutable once submitted**; a mistake is corrected by a reversing row. It feeds the day close's expected-cash figure and appears there as its own line

### Product Exchange Data (Round 23)
- Phase 1 has **no dedicated `EXCHANGE` transaction type**. Exchange is represented as an optional **`ExchangeGroup`** that links:
  - the original Transaction (referenced, never edited)
  - the created Refund Transaction (returned line; no restock)
  - the created Sale Transaction (replacement line)
- Optional metadata for UI/reporting: outgoing returned line and incoming issued line, each with its price snapshot.
- Link to the **manual inventory adjustment request** for resellable-return stock (which may still be `PENDING` when handled at the counter).
- Commission/loyalty deltas are derived from the underlying refund + underlying new sale using the existing refund and sale rules (no special exchange settlement computation in Phase 1).

### Tip Data (Round 9, settled Round 10)
- Tip amount **per barber per Transaction** (Round 7 lets a customer nominate, and split across barbers)
- **Payment method of the tip** — cash tips raise the expected-cash figure at day close; card/e-wallet tips do not
- **Tip payout records:** barber, amount, period, paid-by (account), and the **payroll run** it was settled through (Round 10). Below PRO, where no payroll run exists, a manual "mark tips paid" record fills the same role
- Accrued (unpaid) tip balance per barber, reconciling against the payout records — this is a **liability the shop carries between paydays**, not available cash
- Tips are held **outside** sales totals, commission-able amounts and the tax base — a separate field on the Transaction, never a line item in the subtotal

### ⭐ Support Ticket Data (Round 16)
The SLA (Round 12) and its hours (Round 15) cannot be measured without these, and Round 16 added a severity that two parties can set.

- **`SupportTicket`** — Brand, Outlet, the acting account, plan at time of raising (so a PRO ticket is provably a PRO ticket), subject and body, attachments, and a **reference number** shown to the merchant
- **Severity, held as two values:** the **merchant's chosen level** (from three plain descriptions, not letters) and the **current level**. A Meikigo re-grade stores **who changed it, when, the reason, and both levels** — and the merchant is told in the thread (Round 16)
- **The SLA clock:** created-at, first-response-at, and the **due-by** computed from the current severity and the support calendar (**Mon–Sat 9am–6pm**, Round 15). A re-grade re-computes due-by **from the time of the change**, and the ticket keeps the earlier value so nothing looks like a breach that was not one
- **The automatic acknowledgement (Round 16)** — sent immediately on creation, including outside hours, carrying the reference, the support hours and the due-by date. Transactional stream; never counted against any marketing allowance
- **Recommended: a re-grade report.** A merchant whose P1s are re-graded every week either misreads the labels or has a product that keeps breaking, and both are worth knowing

### ⭐ Bulk Import Data (Round 14, undo + filename rule confirmed Round 18)
- **`ImportBatch`** — Brand and Outlet, list type (`CUSTOMER` / `SERVICE` / `PRODUCT` / `STAFF`), file name, uploaded-by, uploaded-at, rows submitted, rows succeeded, rows failed, and the stored **result report** (downloadable, listing each failed row with its line number and reason)
- **⭐ ✅ CONFIRMED (Round 18) — the file name must be UNIQUE PER BRAND.** **Recorded as given:** *"make undo. but by default, they cannot import the same file (based on file name) twice. the file name must be unique."* Re-uploading a file whose name matches an earlier `ImportBatch` on that Brand is **rejected before processing** — *"this file was already imported on [date]"* — not silently deduplicated row by row. This is the cheap first line of defence against the exact accident that motivated undo in the first place (Q14's own example: a merchant uploads their list twice and now has 800 customers who shouldn't be there).
- **⭐ ✅ CONFIRMED (Round 18) — an import batch is REVERSIBLE.** One action removes every record that batch created, provided nothing has transacted against it yet (a customer who has since booked or paid is not silently unwound — see below). **Recorded as given** as part of the same answer above: *"make undo."* This is the fix for a mistake a database backup cannot solve on its own — restoring the whole database to undo one shop's bad import would wipe every other shop's day (see Backups & Data Recovery).
- **Imported records carry their `import_batch_id`**, so a bad import can be identified — and, where nothing has transacted against it yet, reversed. Without this link an import that went wrong can only be cleaned up by hand
- **⭐ Marketing consent declaration (Round 14)** — where the merchant ticked *"I confirm these customers agreed to receive marketing"*, the batch stores **who ticked it, when, and the exact wording**, and every customer created by that batch is stamped `consent_source = MERCHANT_DECLARED`
- **⭐ Customer rows carry NAME, PHONE, optional EMAIL and an OPENING LOYALTY POINTS BALANCE only (Round 15).** No visit count, no spend, no last-visit date, and **no transaction history in any form** — *"Nothing at all. Only name and phone."* Meikigo's financial history is never written by an import
- **⭐ Imports run as a QUEUED BACKGROUND JOB, with no row limit (Round 15)** — chunked, with visible progress and a completion notification, because a file of any size must succeed rather than time out. A file-size guard (recommended 25MB) remains, and the preview reads only the first ~100 rows
- **Every import is logged for the same reason exports are** (Round 6): bulk personal-data movements must be answerable later

### ⭐⭐ Email Allowance Data (Round 14 as tokens, ✅ RESHAPED IN ROUND 15 as a monthly quota)
**No pre-paid credit system is needed after all.** The marketing package is an ordinary recurring `SubscriptionLine` on the Brand, and what has to be stored is a **usage counter per billing month** plus the ledger that explains it.

- **`EmailAllowancePeriod`** — one row per **Brand** per **billing month**: the package held, the included volume, emails used, period start and end, and the reset date. **The allowance does not roll over (Round 15)** — a new period starts at zero used, and last month's unused volume is simply gone
- **`EmailUsageLedger`** — one row per send: the blast or schedule occurrence, recipient count, emails counted, and the running total for the period. **A merchant asking "what used up my 10,000?" must get an itemised answer**, which a bare counter cannot give
- **What counts:** one email attempted to one recipient — *"1 `to` = 1 email"* (Round 15). A recipient skipped for unsubscribe or missing consent costs nothing; **a hard bounce still counts** (the send was attempted) and the address is then suppressed so it is never counted twice
- **⛔ Transactional email is never counted (Round 15)** — OTPs, receipts, reminders, payslips, the barber daily summary and PRO reports are outside this entirely, and must not be blocked by a marketing quota. *(Note that Meikigo still pays Brevo for them, so they belong in the platform's own capacity planning even though no merchant is charged.)*
- **The remaining allowance is checked twice** — when a blast is composed or scheduled, and again immediately before sending — and a send that would exceed it is **refused whole, never partially sent**
- **On cancellation or downgrade the unused volume is lost (Round 15)**; the Brand keeps sending until the paid period ends
- **Recommended: a low-allowance notification** to the Brand admin, and a projected-usage figure for recurring schedules (*"about 6 days of sending left this month"*)
- **Recommended, for Meikigo rather than the merchant: an aggregate view in `meikigo-admin`** — total allowance sold across all Brands versus the current Brevo plan ceiling, plus actual platform-wide volume including transactional. The failure this prevents is Meikigo's own provider account hitting its limit and stopping *everyone's* mail

### ⭐ Blast Schedule Data (Round 13)
- **`BlastSchedule`** — Brand ID (FK), the composed blast content it sends, **mode** (`ONE_OFF` / `DAILY` / `WEEKLY` / `MONTHLY`), next-send-at, **explicit timezone** (Malaysia time — never inferred from the server, or a 9am Monday blast eventually goes out at 5pm), the audience rule, created-by, and **status** (`ACTIVE` / `PAUSED` / `SUSPENDED` / `CANCELLED`)
- **One occurrence row per send attempt** — scheduled-for, actually-sent-at, recipient count, **emails counted against the month's allowance (Round 15)**, and outcome (`SENT` / **`SKIPPED_ALLOWANCE_EXHAUSTED`** / `SUSPENDED_NO_PACKAGE` / `SUSPENDED_BY_MEIKIGO` / `FAILED`). ⛔ `SKIPPED_FREQUENCY_CAP` is retired with the weekly cap (Round 14), and **no daily send limit exists (Round 15)** — the monthly allowance is the only throttle
- **Recipients are resolved at SEND time, never snapshotted at creation** — consent and unsubscribe state must be evaluated the moment the mail goes out, or the schedule will mail people who have since opted out
- **`SUSPENDED` is entered automatically** when the marketing add-on is cancelled, the subscription lapses, or the Brand/Outlet is deactivated — the schedule is neither deleted nor left sending on an entitlement nobody is paying for

### Referral Data (Round 6)
- Referral code per client account (shareable)
- Referral record: referrer, referred client, code used, status (pending / qualified / credited), qualifying transaction
- Credit rule: the referrer is credited only when the referred client **registers AND completes a spend with successful payment**
- Joining bonus granted to the referred client (amount configured per Brand/Outlet)
- Abuse controls: self-referral blocked, one-per-new-account, optional minimum qualifying spend and per-period credit cap
- Scope follows loyalty scope — a referral code belongs to a merchant and never crosses Brands

### Payroll Data (Round 5) — ✅ IN SCOPE on PRO (Round 9, detailed Round 10)
- Payroll run ID + Brand/Outlet ID (FK) + pay period — **one run per month** (Round 10)
- Employee ID (FK) — **including deactivated employees**, so a final payslip is producible after someone resigns
- **Pay type applied** (`BASIC_PLUS_COMMISSION` / `COMMISSION_ONLY` / `DAILY_WAGE` / `HOURLY` — Round 12) and the rate used, snapshotted onto the payslip so a later raise cannot rewrite history (Round 10)
- Gross pay components:
  - **Base salary**, or **daily rate × days marked `PRESENT`** in the attendance table for that period (Round 10)
  - **Commission accrued from POS sales in the period** (automatic, including manual-entry sales), at the Outlet's service and product rates
  - **Tips accrued in the period** (Round 10) — this is where a barber's tips are actually paid, having sat in the shop's money since they were given
  - **⭐ Overtime pay (Round 13)** — stored as **its own lines by multiplier band** (1.5× normal day / 2.0× rest day / 3.0× public holiday), each with the hours, the multiplier, the derived hourly rate and the amount. Plus the rest-day and public-holiday **within-normal-hours** entitlements, which are separate amounts and not multiplier lines. The **normal-hours limits, the multipliers and the ÷26 divisor in force are snapshotted onto the payslip**, exactly as statutory rates are — an overtime figure that cannot be re-explained a year later is a dispute nobody can settle
  - **⭐ Manual commission lines (Round 13)** — commission assigned by an Admin at checkout rather than derived from a rate: credited employee, amount, source transaction and line, reason, and the authorising Admin. Carried into the payslip's commission total but **reported separately** from earned commission
- **⭐ Manual adjustment lines (Round 11)** — zero or more per employee per run: **type (deduction / addition), amount, and a mandatory note.** With no proration engine (Round 11), this is how a part-month joiner, an unpaid absence, an advance repayment or a bonus is handled. Entered on the draft; shown as their own labelled lines on the payslip, never folded into basic pay
- Statutory figures: **EPF, SOCSO and EIS computed** (EIS confirmed Round 11); **PCB from the employee's standing `pcb_monthly_amount`, overridable per run (Round 13)**. Each stored as an amount *and* against the **effective-dated rate version** used, so a historical payslip can be re-explained after a rate change — noting that from Round 11 those rates are the **merchant's own configured values**, not a platform table. **Employer-side contributions stored separately from employee deductions** and shown on the payslip (Round 11) — they are a cost to the shop, not a deduction from the barber
- **Whether tips were treated as EPF/SOCSO-able** for this run (Round 11 setting), stored on the payslip so the figure can be explained later
- Net pay
- Payslip document — **retained and reproducible as issued**, not regenerated from mutable current data. **Emailed to the employee as a password-protected PDF** (Round 10/11), with the send recorded in the email log; downloadable by the merchant as the fallback for an employee with no email
- **⭐ Run status: `DRAFT` / `CONFIRMED` / `LOCKED` (Round 11)** + who generated it, **who confirmed it** and when. Nothing is emailed and no figure is frozen until Confirm; after Confirm there is **no re-run, no re-send and no delete** — a later correction is an adjustment line on the next run. **One confirmed run per Outlet per period**, enforced
- **Confirming a run LOCKS that period's attendance rows** (Round 10) and marks the commission and tips it consumed as settled, so nothing can be paid twice
- **⭐ Confirm is BLOCKED where a `DAILY_WAGE` or `HOURLY` employee has no attendance recorded for the period (Round 13)** — a draft still generates for everyone, but the run cannot be finalised while the figure that *is* somebody's pay is absent. Zero days entered deliberately passes; nothing entered does not, so the two states must be distinguishable in the data
- **⭐ Which statutory template version and which overtime rule set the run used (Round 13)**, and whether an **unaccepted rate diff** was outstanding at the time — so a payslip computed on superseded rates can be explained rather than argued about
- **No external integration** — no LHDN/EPF/SOCSO portal submission, no bank disbursement file, no third-party accounting export
- Retention per statutory record-keeping requirements (Employment Act 1955; tax-relevant records generally 7 years), not indefinite-by-default

### Attendance Data (Round 10, extended Round 11)
- Attendance row per **employee per day**, generated by a scheduled job **one day before each new period**
- **⭐ Generation cadence is per employee: MONTHLY or WEEKLY (Round 11)** — *"System should allow generate working schedule by monthly or weekly and set off days flexible"*. A shop that rosters week by week is not forced to commit a month ahead
- Fields: Employee ID (FK), Outlet ID (FK), date, **status** (`PRESENT` / `OFF_DAY` / `PUBLIC_HOLIDAY` / `ANNUAL_LEAVE` / `SICK_LEAVE` / `UNPAID_LEAVE` / `ABSENT` — leave types added Round 11B), **`hours_worked`** (⭐ **now pay-bearing for the `HOURLY` pay type — Round 12**), marked-by (account), marked-at, and the **entry granularity** the value came from (day / week / month), so a bulk-entered figure is distinguishable from a day someone actually confirmed
- **⭐ Overtime fields (Round 13), required now that Meikigo computes overtime:**
  - **`overtime_hours`** per day, separate from `hours_worked` — pre-filled by splitting anything past the configured daily normal hours, and correctable by the Admin. A single total cannot be split after the fact once weekly or monthly bulk entry is involved
  - **✅ A `worked` FLAG on `OFF_DAY` and `PUBLIC_HOLIDAY` rows — decided in Round 14**, in preference to new status values. The status set is unchanged, so nothing that already reads it breaks; the flag plus the day's hours is what selects the 2.0× or 3.0× multiplier. Ticking it requires hours to be entered in the same action, and a ticked off-day also counts as a worked day for `DAILY_WAGE`
  - The **day's status is what selects the multiplier** — `PRESENT` → 1.5×, worked `OFF_DAY` → 2.0×, worked `PUBLIC_HOLIDAY` → 3.0× — which is why the Round 11B leave/day-type work is what makes overtime computable at all
  - **A period total over the 104-hour monthly overtime ceiling warns and does not block** — the hours were worked and must be paid; the warning is what makes the owner notice a rostering problem
- **Derived per period:** `days_worked` (the count payroll consumes for `DAILY_WAGE`), paid-leave days, and unpaid days — the last surfaced on the payroll draft as a prompt, never as an automatic deduction
- `OFF_DAY` and `PUBLIC_HOLIDAY` are **pre-filled by the generator** from the employee's working pattern (Round 6) and the Outlet's public holiday list (Round 6) — but the pattern is only a **seed (Round 11)**: any generated day can be flipped, including `OFF_DAY`↔`PRESENT`, without editing the underlying pattern
- **Marked by the Admin role only (Round 11)**, in `meikigo-merchant`. Not the Cashier, and not on the POS — attendance drives pay
- **Available on all paid tiers — STARTER, PLUS, PRO (Round 11)**; not on FREE. Payroll consumes it on PRO; below PRO it stands on its own as a record
- Rows are also generated **on employee creation** for the remainder of the current period, so a mid-period joiner is not missing from payroll
- **Locked once the period's payroll run is confirmed**; regeneration is permitted only for an unpaid period
- **An `ABSENT` day never reduces pay by itself (Round 11)** — it is a record, and any deduction is a manual adjustment line on the payroll run. The exception is `DAILY_WAGE`, where an unworked day is simply not paid
- **No leave types, no balances, no clock-in/clock-out times in Phase 1** — the digital punch card (Phase 2) writes real times into this same structure, so nothing here is discarded

### Loyalty Data
- Outlet or Brand ID (loyalty configured per merchant)
- Loyalty program type (purchase/referral/spend)
- Ratio/threshold (e.g., 5 cuts = 1 free)
- Expiry period (days)
- Partial usage allowed (boolean)
- **Redemption scope setting (merchant-configurable)** — whether a balance is spendable at the earning Outlet only, across all Outlets of the Brand, or wider
- Client loyalty point balances — held **per client account, per configured scope** (a client can hold separate balances with different merchants)
- **Punch-card visit counts, alongside point balances (Round 6)** — both mechanisms exist and a client can hold a punch count *and* a point balance with the same merchant simultaneously
- **Product-only sales accrue SPEND but never a VISIT (Round 7, recommended)** — points/spend-based models earn on a retail-only purchase (attached to a customer by phone lookup); punch-card/visit-count models must not count it, or five pomades would buy a free haircut
- **Free-cut settings (Round 6)** — whether commission is paid on a redeemed free cut, and which service it applies to (merchant-nominated service vs. highest-value eligible line); interacts with the existing partial-redemption setting
- **⭐ Opening-balance entries from a bulk import (Round 15)** — an `OPENING_BALANCE_IMPORT` ledger entry carrying the points a merchant brought over from their old system, with the import batch, the source row and who uploaded it. **Never recorded as earned points**, so points-earned figures, redemption rates and the merchant's own liability view can always separate *"given on day one"* from *"earned here"*. Subject to the same sanity checks as any manual adjustment (no negatives; warn on an implausibly large figure, which is almost always RM typed into a points column)
- **Forfeiture records (Round 6)** — points written off when a client deletes their account: client, scope, points forfeited, timestamp, reason. Reported separately from redemptions so redemption-rate figures stay clean
- Redemption records (applied by cashier at POS after looking the client up by phone/username/email) — surfaced to the client as "redemption history"
- No-show penalty deductions — applied **only for missed bookings**, never for expired walk-in tickets or voluntary cancellations

### Review Data
- Review ID
- Transaction ID (**1:1** — one review per Transaction; a repeat client can therefore leave multiple reviews for the same Outlet over time)
- Outlet ID (FK) — the primary review target
- ~~Employee ID (FK) — the barber who served the client~~ — **⚠️ revised (Round 6): barber ratings become a CHILD COLLECTION (Review → 1..N barber ratings), one per distinct barber who served on that ticket**, since a ticket can carry a different barber per service line. Each rating feeds only that barber's `BarberStatistic`, and the client is shown which service each barber performed when rating
- Client ID (FK) — required to enforce account-only reviewing/anti-spam, but **never exposed** through any merchant-, barber-, or public-facing path (two-way anonymity)
- Outlet rating (1-5 stars) — **mandatory**
- Barber rating (1-5 stars) — collected on the same submission, feeds `BarberStatistic.rating`
- ~~Comment~~ / ~~masked comment / moderation flag~~ — **removed (Round 3): reviews are rating-only, there is no free-text field and therefore no moderation state to store**
- Timestamp
- Anonymous flag (always true for current phase) — anonymity is enforced against the **merchant/barber as well as the public**; no de-anonymising view exists
- **Immutable once submitted** — no client edit/delete path, and not auto-hidden if the underlying Transaction is later voided/refunded
- No merchant reply/response field — reviews are one-directional

---

## Configuration Settings (applicationsetting table)

Configurable per Brand/Outlet or Global:

### ⭐ Where a setting is configured — BRAND TYPE decides (Round 11)

**This is a structural rule, introduced in Round 11, and it applies across the whole product.** Recorded as given, answering the narrower question of who maintains the EPF/SOCSO rates: *"I think we dont want to take the risk to change the rates, let each outlet/brand configure themselve. Outlet admin or brand admin. So if the brand type is franchise, meaning all setup must be done in outlet level. If the brand is branch type, the setup must be done at brand level. This apply to all feature that you can think it make sense."*

**A new field: `Brand.brand_type`, with two values.**

| Brand type | What it means | Where settings are configured |
|---|---|---|
| **`FRANCHISE`** | Each outlet is a separate business run by a separate owner-operator under a shared name | **Outlet level.** Every outlet configures its own values; the Brand configures nothing operational |
| **`BRANCH`** | All outlets are branches of one business, one owner | **Brand level.** The Brand admin configures once and it applies to every outlet |

**How it is built — one storage level, two editing levels.** Everything downstream in this document (commission, tax, day close, payroll) already reads settings **from the Outlet**, and that stays true. The brand type changes only *who may edit them and where*:

- Values continue to live on the **Outlet row**. Nothing that consumes a setting has to know the brand type — no calculation, no report, no receipt changes.
- On a **`BRANCH`** brand, the Brand admin edits the value once and it is **written down to every Outlet** of that Brand; the per-Outlet fields become **read-only** in `meikigo-merchant`. A newly created Outlet **inherits the Brand's current values at creation**.
- On a **`FRANCHISE`** brand, the per-Outlet fields are editable by each Outlet admin, and the Brand-level screen simply does not offer them.
- ⚠️ **The alternative — resolving at read time (use the Brand's value if it exists, else the Outlet's) — is deliberately not chosen.** It reads more elegantly and it is the version that produces "why is this outlet charging 6% when the Brand says 4%" support tickets forever. One value, one place, written down.

**Which settings this covers.** The instruction was *"all feature that you can think it make sense"*, so here is the split as I have applied it, with the ones that are **not** brand-type-driven called out — because those are the ones worth disagreeing with:

- **Brand-type-driven** (Outlet-level on FRANCHISE, Brand-level on BRANCH): commission rates, **whether commission is calculated on the discounted or the original amount (Round 13)**, whether tips attract EPF/SOCSO, **the barber daily summary email on/off toggle (Round 13)**, loyalty settings and free-cut behaviour, referral joining bonus, queue grace and expiry, no-show penalty, booking horizon, booking reminder lead time, refund window, low-stock thresholds, POS notification sound.
  - ⚠️ **Two corrections to this list, both made in later rounds:** **statutory payroll rates moved OUT** — they are Brand-level for both brand types (Round 13, see below) — and the **admin approval password moved out** entirely, because since Round 12 it belongs to an Admin account rather than to any Outlet or Brand.
- **Always per-Outlet regardless of brand type**, because they describe a physical place and cannot be shared: address, business hours, public holiday list (Malaysian holidays are state-specific), tax registration and tax configuration, opening cash float, last-queue-number cutoff, per-barber working hours and off-days, per-Outlet stock quantities, **⭐ the Google review link (Round 18)** — a Google Business Profile belongs to a physical premises, not a Brand.
- **Always Brand-level regardless of brand type**, because they are one commercial relationship: the subscription and plan, add-on purchases, the customer list and marketing consent, marketing blasts, **their schedules (Round 13)**, the **monthly email allowance and its usage (Round 15)**, the scheduled-report recipient list, the product/service catalogue.
  - **⭐ Plus, added in Round 13: the statutory payroll template — EPF/SOCSO/EIS rate tables, the overtime multipliers and normal-hours limits, and the ÷26 ordinary-rate divisor.** One copy per Brand, verified once by the Brand admin, used by every Outlet. Recorded as given: *"A"*. These are national statutory figures rather than commercial settings, so replicating them per Outlet would only create more chances to hold a wrong table. This is a deliberate exception to the brand-type rule and it overrides the Round 11 placement above.
  - **⭐ And: `commission_enabled` per product/service (Round 13)**, since the catalogue itself is Brand-level. The rate stays where it was; only the participation flag rides with the item.
- **Always Meikigo-level:** anything under Meikigo Platform Settings below.

**Two consequences to be aware of:**

- **`brand_type` must be set at Brand creation** and is not a casual toggle afterwards. Switching `BRANCH`→`FRANCHISE` is harmless (outlets keep the values they have and become editable); switching `FRANCHISE`→`BRANCH` **overwrites every outlet's independently-set values** with the Brand's, which is destructive.

#### ⭐ Switching brand type — ✅ RESOLVED (Round 13), the Round 12 re-ask
**Round 12 asked for this to come back with an example:** *"Does this means downgrading? give example. circle back this question on next round."* **Recorded as given in Round 13: *"A"*** — the change is allowed, with a preview and a confirmation.

**First, the thing that caused the confusion: this is NOT a plan downgrade.** The plan, the price, the outlet cap, the barber cap and the login cap are all untouched. Nobody loses an outlet and nothing is billed differently. The only thing that changes is **where a setting is typed**.

**The worked example.** A Brand has three outlets and is `FRANCHISE`, so each sets its own commission rate:

| Outlet | Before the switch | After switching to `BRANCH` (Brand types 5%) |
|---|---:|---:|
| Kepong | 5% | 5% — unchanged by coincidence |
| Ipoh | 4% | **5%** — overwritten |
| JB | 6% | **5%** — overwritten |

Two of the three rates are gone, and the same happens to every setting on the brand-type-driven list: service and product prices, loyalty and free-cut behaviour, tips settings, refund window, booking horizon, reminder lead time, low-stock thresholds, referral bonus.

**What the build must do:**

- **Show a preview before anything changes** — outlet by outlet, setting by setting, **old value → new value**, with the rows that will actually change highlighted. A count is not enough (*"12 settings will change"* tells an owner nothing about which).
- **Require the Brand name to be typed to confirm.** This is the strongest cheap confirmation and it is proportionate: the action rewrites operational settings across every outlet in one click.
- **Log it as a first-class audit event** — who switched, when, and **the full before/after set**, not just the fact of the switch. That log is the only way to answer *"why is Ipoh suddenly charging 5%?"* a week later, and it appears in the merchant-visible audit log on PRO.
- **✅ ⭐ AN UNDO BUTTON FOR 24 HOURS — Resolved (Round 14).** Recorded as given: *"A"*. Within 24 hours of the switch, one button restores every outlet's previous values from the audit row that already holds them. After 24 hours the change is permanent and the only route back is retyping.
  - **The undo is itself an audited action**, and it restores the previous values rather than "reversing" anything — the brand type goes back too.
  - **⚠️ It must not silently overwrite work done in the meantime.** If an outlet's setting was edited after the switch, the undo shows that row and asks: keep the new value or restore the old one. Twenty-four hours is long enough for someone to have started using the new settings.
  - **Recommended: show a countdown on the settings screen** — *"you can undo this change for another 19 hours"* — because an undo nobody knows about is not a safety net.
- **Statutory payroll rates and overtime rules are NOT affected by a switch**, because Round 13 made them Brand-level for both brand types (see Payroll → Who owns the rate tables). One less thing to overwrite.
- **`BRANCH`→`FRANCHISE` needs no preview and no confirmation ceremony.** Each outlet keeps the value it already had and the fields simply become editable. Worth logging, nothing more.
- **Not restricted to Meikigo support.** The merchant can do it themselves in `meikigo-merchant`, which was the alternative offered and rejected — a support-gated toggle would mean a ticket and a wait for something the owner is entitled to do to their own business.
- **Round 7's "commission is Outlet level ONLY" is not reversed by this** — it is refined. There is still exactly one pair of rates in effect per Outlet, applying to every barber. On a `BRANCH` brand, those rates are simply typed once at Brand level instead of four times.

### Global Settings
- Trial period duration (days) - currently 2 weeks for all Brands
- Subscription expiry grace day (currently day 10 of the billing cycle)
- ~~Payment retry count/interval (currently 3 retries, 2 days apart)~~ — **⛔ SUPERSEDED (Round 26):** not a Meikigo setting. **HitPay owns subscription retries.** Merchant copy must match HitPay's documented schedule once confirmed in writing. Manual pay is support-fallback only.
- Max brand cap per Organisation (default 10) — fixed global limit, not subscription-driven
- **Minimum ratings before a public score is displayed** — set by the Meikigo super admin in `meikigo-admin`, platform-wide
- ~~Review blocked-word list~~ — **dropped in Round 3**: reviews are rating-only, so there is no text to moderate
- **⭐ Statutory payroll MASTER TEMPLATE, effective-dated (Round 12, scoped in Round 13)** — Meikigo Admin maintains one authoritative set: EPF percentages, the SOCSO and EIS wage-band tables (employee and employer sides), and **the overtime multipliers, normal-hours limits and ordinary-rate divisor added in Round 13**. This is **not** the value any payslip reads. Each **Brand** holds a copy it must verify, may edit, and owns; Meikigo warrants nothing. A template update reaches merchants as a **diff to accept** — in-app banner plus an email to the Brand admin, non-blocking (Round 13). See Payroll → Statutory deductions and Overtime
- ~~**⭐ Marketing blast frequency cap (Round 9)**~~ — **⛔ REMOVED (Round 14).** Replaced by:
  - **✅ ⭐ Marketing email packages (Round 15)** — the monthly allowance tiers on sale and their prices. Launch defaults: **RM90 / 10K, RM170 / 50K, RM400 / 100K, RM2,200 / 500K per month**, editable by Meikigo admin (*"This is default value, but meikigo admin still configure it"*)
  - ⛔ **Per-Brand daily send limit — DECLINED (Round 15)**. There is no frequency limit; the monthly allowance is the only throttle
  - **✅ ⭐ Complaint-rate and bounce-rate WARNING thresholds — SET IN ROUND 16: complaints > 0.5%, bounces > 5% of a single send.** They raise an alert for a human to act on, **not** an automatic suspension (Round 15: *"let a person decide"*). Both configurable; evaluated per send and per Brand over a rolling 30 days
  - **✅ ⭐ Small-send floor and monthly complaint count (Round 17, number confirmed Round 18)** — the **recipient count below which rates are not evaluated (200)** and the **number of complaints from one Brand in a rolling 30 days that raises a warning (3, confirmed)**. Both configurable. Below the floor, absolute counts replace rates entirely
  - **✅ ⭐ Platform alert recipient — CONFIGURABLE IN `meikigo-admin` (Round 17)**, superseding Round 16's hardcoded monitored address. The email address (recommended: a list of addresses, at a shared mailbox) that every platform warning goes to — deliverability, failed subscription payments, and anything added later. **Email only**, repeating daily until acted on; no WhatsApp. Must not be saveable empty
  - **✅ Marketing email tiers (Round 16)** — the five allowance sizes on sale (**1K / 5K / 10K / 50K / 100K emails a month**) and the price of each. ⚠️ **Prices are deliberately unset in this document and must be typed in before the pricing page publishes.** Recommended: the editor warns if a larger tier has a higher per-email price than a smaller one
  - **⭐ Manual per-Brand sending suspension** — the switch the human uses once the warning is acted on
- **⭐ Merchant audit-log visible window (Round 14)** — 12 months on screen for PRO; the underlying trail keeps full retention
- **Employee/payroll record retention period** (Round 5) — the statutory retention value, held as configuration rather than implied in code
- **Lapsed-Brand booking-page copy** (Round 5) — the approved string, held centrally so it is not re-worded ad hoc: *"Online booking isn't open for this outlet at the moment. Please contact the shop directly to book."*

### Merchant-Level Settings
- Queue late grace period (minutes) - default 5
- Queue expiration time (hours) - default 2
- No-show penalty (loyalty points) — applies to missed **bookings** only
- Loyalty program type(s)
- Loyalty program expiry (days)
- Allow partial loyalty usage (boolean)
- **Loyalty redemption scope** (Outlet-only / Brand-wide) — merchant's choice; never crosses Brands
- Business hours
- **Per-barber daily capacity** (max clients per day) — set by the merchant/manager; blocks bookings *and* walk-in assignment
- **Last queue number receiving time** — per-Outlet cutoff after which no new numbers are issued for the day
- **Booking horizon** — how far in advance clients may book
- Number of barbers (tier-dependent, via Brand subscription)
- **POS notification sound on/off** (Round 5) — whether the counter tablet plays an audible alert on a new remote booking/queue join; sound-off must remain fully workable, since the expected default is a barber checking the screen between clients
- **⭐ Google review link (Round 18)** — the Outlet's Google review page URL, pasted in once by the merchant. Powers the post-rating "Tell Google too" button on a 4–5 star Meikigo rating. Left blank, the button does not appear
- **Outlet transaction tax configuration** — unchanged, but now also the source of the per-line tax type/rate that every receipt and e-Invoice record must carry (Round 5)
- ~~Outlet admin override password (Round 6)~~ — **⛔ REMOVED (Round 12).** The setting no longer exists at Outlet level; authorisation is the acting Admin's own approval password, held on their account
- ~~**Commission configuration** (Round 6) — overrides per product/service and per barber (precedence: Outlet → item → barber)~~ — **⛔ SUPERSEDED (Round 7/9): Outlet level only, two rates, no overrides. See below**
- **Per-barber service prices** (Round 6) — senior/junior pricing, layered on top of the Brand price and Outlet override
- **Free-cut behaviour** (Round 6) — commission payable on a redeemed free cut (yes/no), and which service the free cut applies to
- **Referral joining bonus** (Round 6) — points a referral-joined client starts with; plus any minimum qualifying spend and per-period credit cap
- **Barber working hours, lunch breaks and off-days** (Round 6) — per barber, within the Outlet's business hours; off-days support both repeating weekly patterns and specific dates
- **Public holiday list, per Outlet** (Round 6) — merchant-entered; Meikigo ships no holiday calendar (Malaysian holidays are state-specific)
- **Opening cash float** (Round 6) — per Outlet per day, for the day-close expected-cash calculation
- **Low-stock thresholds** (Round 6) — per retail product per Outlet
- **⭐ `low_stock_email_enabled`** (Round 17) — per Outlet, default **on**. Whether the daily low-stock list rides along with the day-close summary email. The on-screen warning is not switchable
- **⭐ Expense categories** (Round 17) — Brand-level list, seeded by Meikigo and merchant-editable; edited at the level the brand type dictates (Round 11). Deactivated rather than deleted; `Other` cannot be removed
- **⭐ Cash-out reasons and their expense mapping** (Round 17) — the POS pick-list, and for each reason whether it posts an expense and in which category. **`bank-in` and `owner's draw` post none**
- **⭐ `cash_out_approval_threshold`** (Round 17, ✅ default confirmed Round 18) — the amount below which a cash-out needs no Admin approval password. Default **RM20**, merchant-configurable; 0 means always require approval
- **⭐ Commission basis on a discounted line (Round 13)** — `commission_on_discounted_amount`, recommended default **true**. Supplies the default for the Round 7 counter popup, which stays as a per-transaction override; the transaction records the basis actually used
- **⭐ Barber daily summary email on/off (Round 13)** — default **on**. Switching it off is an audited action, since its purpose is to let barbers see the figures the owner is paying them from
- **⭐ Whether the discount/commission popup is shown at all (Round 13, recommended)** — for a merchant who has settled their policy and does not want a dialog that always answers itself the same way
- **⛔ `exchange_requires_approval` (Phase 2 / legacy):** superseded for Phase 1 by Round 23 Q16. Phase 1 uses refund + new sale; any approvals happen through the existing **pending refund** rules and the existing **manual inventory adjustment request** approval flow.
- **⭐ Blast sender identity (Round 16)** — the **shop name** shown in the `From` line, and the outlet phone number and address that every blast footer must carry. The sending address is Meikigo's (`news.meikigo.com`) and **replies go to a no-reply address**, so the footer is the only route back to the shop
- **Commission rate — Outlet level ONLY** (Round 7), and **TWO rates (Round 9)**: `service_commission_pct` and `product_commission_pct`, each independently enable-able. One pair per Outlet, applying to every barber — no per-barber and no per-item overrides
- **Refund window** (Round 7) — merchant-configurable; no platform-imposed limit
- **Barber skills** (Round 7) — which services each barber may perform
- **Booking reminder lead time** (Round 9) — `booking_reminder_lead_hours`, an integer in **whole hours**, set by the Outlet admin (48 = two days before, 24 = one day). Recommended default 24; 0/empty = reminders off; capped at the Outlet's booking horizon
- **Read-only display account** (Round 7) — the credential the in-shop queue screen signs in with
- **⭐ Statutory payroll rates, effective-dated** (Round 11, moved here from platform settings) — EPF, SOCSO and EIS employee **and** employer rates. Set by the Brand admin on a `BRANCH` brand, by each Outlet admin on a `FRANCHISE` brand. Meikigo ships the published tables as a starting point marked *"verify with your accountant"*, and the merchant is responsible for keeping them current. PCB is not a rate — it is typed per employee per run
- **⭐ Do tips attract EPF/SOCSO?** (Round 11) — a boolean, merchant-configured at the brand-type level. Default **off** (tips treated as pass-through, not wages)
- **⭐ Admin approval password** (Round 11) — the secret typed to approve a stock adjustment or authorise a counter override. Distinct from any login password. See Approval Flow
- **⭐ Attendance schedule settings** (Round 11) — per employee: whether the roster is generated **monthly or weekly**, and the working/off-day pattern used to seed it. Off-days are freely editable after generation

### Meikigo Platform Settings — `meikigo-admin` (Round 9)
Set by Meikigo staff, not merchants. Round 9 established the principle: *"to be easy to scale, we are not hardcode it, admin can configure all this number."*
- **⭐ Add-on price RULES** (Round 9, per-plan matrix Round 12, **figures confirmed Round 13**) — one rule per **plan × add-on × quantity**, not one price per add-on. Launch values: extra outlet **RM45 / RM45 / RM39**, extra barber **RM15 / RM15 / RM12**, extra staff **RM10 / RM10 / RM8**, extra login **RM15 / RM15 / RM12**, catalog pack of 10 SKUs **RM9** flat, marketing blast **RM49 / RM49 / RM39** (STARTER / PLUS / PRO); yearly = monthly × 10; `FREE` buys none. Read at billing time by `meikigo-api`, **never compiled into the application**, and **published through the public pricing endpoint that `meikigo-marketing-site` now reads (Round 13)** instead of holding its own literals
- ⛔ ~~**Included add-on allowance on PRO (Round 13)**~~ — **REJECTED (Round 15).** No plan includes free add-on units; every unit beyond a plan's cap is charged at the matrix price
- ~~**Marketing blast frequency cap** (Round 9)~~ — **⛔ REMOVED (Round 14)**; blasts are limited only by the Brand's **monthly email allowance** (Round 15). No daily or weekly frequency limit exists
- **⭐ Overtime basis hourly rate, per pay type (Round 14)** — the figure used for overtime where none can be derived, needed for `COMMISSION_ONLY`. Follows the brand-type rule; a nullable per-employee override is recommended on top
- **⭐ Scheduled-report recipient list (Round 14, PRO)** — the Brand admin's "to" list for weekly/monthly report emails; additions and removals are logged, and each recipient has an unsubscribe that needs no login
- **⭐ SMTP configuration, per stream** (Round 11) — host, port, encryption, username, password, From name/address, Reply-To, for the transactional and marketing streams separately. **One platform-wide account; merchants configure nothing.** The password is write-only in the UI, encrypted at rest, and every change is audited. A "send test email" action sits beside it. See Email Sending Infrastructure
- **⭐ Support-access controls (Round 17)** — the reason pick-list for opening a hidden support account, the **session length** (recommended 4 hours), and whether customer PII is masked by default inside a support session. The credentials themselves are not a setting: they are generated per account and revealed through a reason-gated, logged action
- **⭐ Wizard suggested services (Round 17)** — the starting service list and prices offered in step 2 (**Haircut RM25, Beard trim RM15, Hair wash RM10, Kids cut RM18**), held as configuration so the market can be re-read without a deploy
- **⭐ Seeded expense categories (Round 17)** — the default list copied into each new Brand
- Existing platform settings (ratings threshold, HitPay configuration, plan metadata) are unchanged and already live here

---

## Key Decisions Made

✅ Organisation → Brand → Outlet hierarchy; subscription lives at Brand level
✅ Outlet belongs to exactly one Brand; Organisation can span multiple verticals via its Brands
✅ Queue, employees, and POS are scoped to Outlet (the "merchant")
✅ Product/Service catalog source-of-truth is Brand-level, with Outlet-level price overrides
✅ Categories replace self-referencing Product for variants; each variant is its own Product row
✅ Products have active/inactive status; hard delete forbidden on anything tied to financial records
~~✅ Retail product commission (percent/fixed) in Phase 1; service commission deferred~~ — **superseded (Round 6): commission applies to BOTH products and services, configured in Outlet configuration, with per-barber rates**
✅ `BARBER` is a deprecated, non-login role — only Admin/Cashier log in, via `meikigo-pos-native`
✅ `UserAccount` (merchant staff) has no phone, no password field (Keycloak owns credentials); add `iscreator`
✅ JWT carries only user id; `getBrandFromJWTToken()`/`getOutletFromJWT()` resolve context server-side
✅ Marketing site splits registration into "Register as Merchant" vs. "Register as User" (new customer endpoint)
✅ ToS acceptance must be persisted (timestamp + version)
✅ Employee entity introduced, linked to UserAccount + Outlet; one Outlet per employee, strictly
✅ Barber performance stored in a dedicated `BarberStatistic` table (not live-computed)
✅ SubscriptionLine created monthly per Brand; Pending→Active/Expired(day 10)/Cancelled lifecycle
✅ Expired subscription = Brand/Outlet goes read-only, not fully locked out
✅ `FREE` added as a real `EnumPlanType` value; when `FREETRIAL` ends, the Brand does **not** silently auto-convert to anything — merchant hits a required paywall and must actively pick one of FREE/STARTER/PLUS/PRO (FREETRIAL exists purely to "taste" the full product); trial is one-time per Brand, never repeatable
✅ Plan upgrade: wait-for-next-cycle OR instant upgrade prorated **by day** (and resets the billing anniversary to the upgrade date); downgrade is always wait-for-next-cycle, and merchant must manually pick which excess outlets/logins/Barbers/Staff/**catalog SKUs** to deactivate first (no auto-archiving)
✅ Add-ons are never tied to the base plan's lifecycle — downgrading/cancelling the base plan does not auto-cancel purchased add-ons; they keep billing on their own cycle until separately cancelled
✅ Plan changes (upgrade/downgrade/cancel) are authorized for any Admin-role `UserAccount` on the Brand or an Organisation-level admin — not restricted to `iscreator`
✅ Barber vs. Staff are separate Employee sub-types with separate per-plan headcount caps; only Barber is commission-eligible
✅ Product/Service catalog size, account logins, outlets, and Barber/Staff headcount are all plan-capped; transaction volume/GMV is never capped
✅ FREE tier still uses HitPay under the hood; only selectable payment methods are tier-gated, not the gateway itself
✅ Loyalty Program is gated to STARTER and above (not on FREE)
✅ Plan-limit enforcement: backend returns a structured limit-hit response → frontend renders a paywall; feature flags below a tier return an "upgrade to unlock" response, not a bare 403
✅ Payment gateway: HitPay; ~~subscription payment failure auto-retries 3x then fails~~ — **⛔ SUPERSEDED (Round 26): HitPay owns retries; Meikigo only listens to webhooks**
✅ Transaction entity separate from SubscriptionLine but related; snapshots product/price/tax at sale time
✅ Voids are soft-deletes via status flag + voided_at/voided_by/void_reason, never hard-deleted
✅ No location/state-based merchant discovery — Meikigo is brand-specific entry (QR), not a marketplace
✅ Pricing fixed at Brand level (not per barber)
✅ Email-based account system with Keycloak integration
~~✅ Guest loyalty points NOT convertible to account~~ — **moot as of Round 2:** the Guest type no longer exists at all, so there are no guest points to convert or burn; loyalty is account-based with merchant-configurable scope
✅ All reviews anonymous — to the merchant/barber as well as to the public
✅ Custom accounting system (not third-party)
✅ Manual refunds only
✅ Fair reassignment of queues when barber unavailable
✅ Multiple loyalty program models supported
✅ Loyalty redeemed after payment, not before
✅ EXPIRED long-term (unpaid) Brands do not auto-fallback to FREE; stay read-only until the merchant settles the outstanding invoice for the lapsed cycle — intervening gap months have no `SubscriptionLine` records. Once settled, reactivation is immediate and the merchant may switch plans right away (no additional next-cycle wait)
✅ FREETRIAL caps fully mirror PLUS (8 outlets / 8 barbers / 3 staff / 10 product SKUs / 10 service SKUs) — the earlier "20 outlets" figure was a documentation error
✅ FREE tier caps: 1 barber, 0 staff, 1 admin account login (handles POS, accounting, everything); commission feature excluded on FREE
✅ Add-ons (account logins, catalog slots, outlets, Barber/Employee headcount) are all purchasable, billed recurring monthly or yearly per merchant choice
✅ Downgrade excess account logins / Barbers / Staff follow the same manual-deactivation rule as outlet downgrade
~~✅ Explicit `CANCELLED` … the Brand reverts to `FREE`~~ — **superseded (Round 6): a cancelling Brand does NOT revert to FREE. After any paid subscription the only end states are unsubscribed/stopped (soft-deleted) or unpaid/read-only — FREE is a never-paid entry tier only**
✅ Organisation max-brand cap is a fixed global limit (default 10, configurable in `applicationsetting`) — not driven by subscription; there is no Organisation-level plan, only per-Brand subscriptions
✅ Add-ons are only purchasable from STARTER and above — FREE tier cannot buy any add-ons
✅ Add-on cancellation takes effect at the next billing cycle, same timing as a plan downgrade
✅ Yearly commitments (base plan or add-on) cannot be downgraded mid-term; mid-term upgrades require paying the price difference for the remaining committed months
~~✅ Subscription payment retry interval is 2 days apart (3 retries total)~~ — **⛔ SUPERSEDED (Round 26): HitPay owns retries; confirm HitPay's schedule in writing before launch**
✅ SubscriptionLine invoices are itemized (base plan + each add-on as separate line items); each Brand is billed/pays independently, with an Organisation-level consolidated "main invoice" rolling up all its Brands for visibility
✅ Subscription pricing is tax-inclusive of standard Malaysian SST by default, with support for an additional configurable custom tax
✅ Subscription pricing (all tiers incl. PRO) is fixed and shown directly on the marketing site — no sales-assisted quoting
✅ Base plan pricing confirmed: STARTER RM109/mo (RM1,090/yr), PLUS RM199/mo (RM1,990/yr), PRO RM329/mo (RM3,290/yr) — yearly = 2 months free vs. monthly; add-on unit pricing still KIV
✅ Add-ons can be billed on a different cycle than the Brand's base plan (e.g. monthly base + yearly add-on); the itemized invoice labels yearly line items "Paid on Yearly Plan"
✅ Organisation-level consolidated invoice is payable, not just a rollup view — merchant can pay each Brand's invoice individually or pay all of them at once from the consolidated invoice
✅ SST applies only to what the merchant pays Meikigo (subscription/add-ons), never to the merchant's own POS transactions — each Outlet configures its own transaction-level tax independently, per local rules if operating outside Malaysia
✅ Each Brand's itemized invoice (base plan + add-ons) is charged as a single combined payment, not separately-chargeable line items — gateway retry/failure applies to the whole invoice, never to one add-on line in isolation
✅ Subscription billing localizes currency for Organisations/Brands operating outside Malaysia, rather than always billing in MYR
✅ Subscription/add-on charges are non-refundable by default; exceptions (e.g. accidental subscribe) are handled case-by-case via contacting Meikigo support, not a self-service refund
✅ Meikigo never suspends an Organisation/Brand for non-payment reasons (e.g. an SSM/regulatory issue) — read-only lockout is triggered only by an unpaid `SubscriptionLine`
✅ Historical feature-specific data (e.g. HQ Dashboard history, and later Payroll records or e-Invoice submissions once those exist) generated before a downgrade remains accessible read-only after the downgrade, rather than being hidden or deleted
✅ `meikigo-merchant` vs `meikigo-pos-native` split is resolved: `meikigo-merchant` is the merchant back-office/portal (Brand owner/Admin) — Organisation/Brand/Outlet setup, subscription tier selection + HitPay checkout, Employee records, Admin/Cashier account provisioning, and the FREETRIAL-end paywall all live here. `meikigo-pos-native` is strictly the counter app (queue handling + payment) with no back-office screens. Each app authenticates against its own separate Keycloak client
✅ Merchant registration on `meikigo-marketing-site` collects only email + password; on success the merchant is redirected to `meikigo-merchant`'s login page (not auto-logged-in) to authenticate and then complete Organisation/Brand/Outlet/subscription/Employee setup
✅ Employee/Admin/Cashier account provisioning flow: merchant adds the account inside `meikigo-merchant` → `meikigo-api` → Keycloak
✅ End-to-end onboarding testing requires running `meikigo-marketing-site`, `meikigo-merchant`, `meikigo-api`, and local Keycloak (`start-dev`) together — there is no partial-stack shortcut for this flow
✅ Cashier `UserAccount`s cannot log into `meikigo-merchant` — only Admin-role/Brand-owner accounts can access the merchant back-office; Cashier is strictly a `meikigo-pos-native` login
✅ `meikigo-marketing-site` needs no Keycloak client — its registration endpoints are public/unauthenticated
✅ Canonical Keycloak realm name is `meikigo` across all environments — `barber` in `meikigo-merchant/.env.example` is a stale leftover to be corrected
✅ Keycloak client secrets and redirect URIs/web origins are per-environment and env-driven (not shared across environments, not hardcoded) — promoting to a new environment/custom domain is an env var change, not a manual admin-console edit
✅ All frontend↔`meikigo-api` traffic (onboarding included) is server-to-server via a BFF pattern — each Netlify-hosted Next.js app calls `meikigo-api` from its own server side over the public `${API_DOMAIN}`/Caddy, never over an internal/private path; this is also how HitPay's payment-webhook callback reaches `meikigo-api` (direct, not round-tripped through `meikigo-merchant`)
✅ Local-to-prod Keycloak realm/client promotion is done via a Postgres dump/restore of the `meikigo-keycloak` database, not realm JSON export/import or manual re-entry
✅ The 1:1 constraint is between the `iscreator` and the Organisation (a creator can only ever create one Organisation) — not a cap on how many staff accounts that Organisation can have; that Organisation can own many Brands, and creating additional Brands never repeats Organisation/SSM entry
✅ "Organisation Member" (invited via the Organisation-level invitation link, hardcoded cap of 10 excluding the `iscreator`, enterprise quote request beyond that submitted self-service but fulfilled manually by Meikigo) is a distinct population from "Outlet staff" (`Employee` Barber/Staff headcount + Brand-scoped `UserAccount` logins, both subscription-plan-driven per the Subscription Tiers table) — the two caps govern different things and do not conflict; naming deliberately split to avoid confusing the two "staff" populations
✅ SSM number is self-attested with no external SSM registry/API validation
✅ Outlet setup is never gated behind subscription checkout — a paid-tier/HitPay decision is only forced as a blocking paywall once FREETRIAL ends
✅ A Brand's QR/customer-webapp entry point requires a minimum of 1 Outlet + 1 Employee + 1 Admin/Cashier login before it goes live
✅ Only code/address/business hours are required to create an Outlet; timezone, country, tax rules, and queue grace/expiration overrides are configurable later, not at creation
✅ No reminder/nudge flow exists for merchants who abandon setup partway; the onboarding checklist/tutorial in `meikigo-merchant` is skippable, not a forced wizard
✅ A mistakenly-created Brand is corrected via edit, not delete/recreate
✅ Organisation Members are provisioned via a single-use invitation link generated by the `iscreator`, who pre-selects the role/privilege level ("Create Staff" → select role → generate link); Brand/Outlet staff (`Employee`/`UserAccount`) are provisioned separately, one-by-one, via each Brand's own "Add Staff" setup — these are two different flows. Organisation creation itself is restricted to the `iscreator` only
✅ Removing an Organisation Member immediately frees their slot against the 10-member cap; the `iscreator` is excluded from that cap
✅ An Organisation Member automatically gets Organisation-wide administrative access (all Brands/Outlets, same reach as the `iscreator`) on acceptance — but that is a distinct layer from operational Outlet-level logins, which still require a separate account per-Brand via that Brand's own "Add Staff" flow, even for an existing Organisation Member
✅ "Organisation-level admin" is not a separate tier above "Organisation Member" — it's one example of a freeform, custom privilege level (with a configurable permission checklist) an inviter can define for any invited Organisation Member
✅ Minimum-viable-Brand go-live is advisory, not hard-enforced — the QR/customer-webapp entry point exists even before 1 Outlet + 1 Employee + 1 Admin/Cashier login is met, showing an empty queue/no staff instead of blocking; the 1-Employee minimum can be satisfied by either `BARBER` or `STAFF` type, at the Brand/Outlet admin's discretion
✅ Brand creation does not have to fully complete before Outlet setup begins — no strict step-ordering gate between the two
✅ Skipping the onboarding checklist lands the merchant on the `meikigo-merchant` dashboard
✅ No system-imposed default tax rate/timezone before Outlet configuration — tax defaults to unconfigured/no-tax until the admin sets it (tax regimes are country-specific, Meikigo does not prescribe one); timezone falls back to browser local time in the interim, while the Outlet's own configured business hours (independent of timezone) govern its operating window
✅ Organisation invitation links are single-use AND time-limited — expiry duration is configurable in hours (`applicationsetting`); the `iscreator` (or a privileged Organisation Member) can revoke a pending/unaccepted invite
✅ Organisation Members with sufficient privilege can invite/remove other Organisation Members (delegated from the `iscreator`) — the sole exception being that no Organisation Member can remove the `iscreator`
✅ Brand/Outlet "Add Staff" provisioning (Employee/Admin/Cashier `UserAccount`) uses the same invitation-link mechanism as the Organisation Member invite — role selected by the Brand/Outlet admin, single-use shareable link generated, invitee accepts to trigger Keycloak provisioning — just scoped to one Brand/Outlet instead of the whole Organisation
✅ Organisation-level administrative access (Organisation Member or `iscreator`) and Brand/Outlet-level operational access (Employee/`UserAccount` login) are always separate accounts, even for the same individual — e.g. an owner who also wants to work an Outlet as Cashier needs two distinct accounts, one per access layer
✅ The `iscreator` is automatically granted Admin access on every Brand under their Organisation with no separate per-Brand assignment step, unlike operational Outlet logins which always require explicit per-Brand provisioning
✅ Enterprise-quote requests (beyond the 10-Organisation-Member cap) are submitted self-service in-app, but fulfillment (actually raising the cap) is manual — the merchant stays hard-capped at 10 until Meikigo completes the custom setup
✅ Daily queue reset defaults to midnight, but queuing is expected to be active only during the Outlet's configured business hours (not a full 24-hour window) — both the reset point and the business-hours binding are merchant/Outlet configurable
✅ HitPay is the sole payment gateway — no secondary/alternate provider planned for any market
✅ Meikigo is a HitPay business platform partner: merchant HitPay accounts are created manually by Meikigo (not self-registered by the merchant) and connected to Meikigo's own master HitPay account via the merchant's API key, which is how Meikigo collects platform commission
✅ Meikigo builds its own checkout UI rather than redirecting out to HitPay's hosted checkout page, calling HitPay API-first from behind that UI — **narrowed (Round 26): POS stays Meikigo-branded; Brand → Meikigo billing uses HitPay hosted save-card / checkout (or embed) so Meikigo never hosts PAN**
~~✅ Subscription payment methods resolved for launch: Domestic card + DuitNow at registration/first subscribe; DuitNow + Domestic card for recurring monthly/yearly billing~~ — **⛔ SUPERSEDED (Round 26): Brand → Meikigo subscribe/renew = domestic card only. POS = DuitNow + card.** FPX and manual bank transfer remain out of scope for launch
✅ Current build phase supports MYR only end-to-end for subscription billing — multi-currency localization is deferred until a non-Malaysia market is onboarded
✅ Client→Outlet POS payment supports group/split payment (each person in a group booking pays their own share of a shared bill/receipt); Brand→Meikigo subscription payment remains strictly full-payment-only
✅ Real money-back refunds via HitPay's refund API are in scope for the current build phase, not deferred — layered on top of the existing manual-trigger-only refund policy

### Round 1 — Queue Flow, Customer Webapp, Loyalty & Reviews

~~✅ **Client identity is the phone number, not the account.** A Guest is phone-number-only…~~ — **superseded (Round 2):** the Guest type is dropped entirely; every client is a registered account
~~✅ **Loyalty points are keyed on phone number**…~~ — **superseded (Round 2):** loyalty is account-based, with merchant-configurable scope; phone number is only a lookup handle
✅ Loyalty redemption is applied **by the cashier at the POS via phone-number lookup**, never selected by the client in the webapp
✅ `meikigo-customer-webapp` is **queue-join / queue-view / review only — no payment ever happens in it**; all payment is on `meikigo-pos-native` at the counter
✅ Group/split payment is driven **entirely from the cashier's POS tablet** — group members do not each pay their share from their own phone
✅ The live queue display is **public** — viewable by anyone with the Outlet link/QR, no join and no login required
✅ **No queue-status notifications** (push/SMS/email/banner) — including at queue expiry. The client discovers status by opening the queue page and pulling to refresh *(narrowed in Round 3: transactional email does exist for receipts and barber-unavailable notices — but never for queue status)*
✅ Session recovery is via **"I have a booking" → enter phone number** → queue status re-displayed. No magic link, no emailed token, no cookie dependence
✅ Launch is a **plain mobile browser web app** — not an installable PWA, not native — and **single-language** is sufficient for this phase
✅ Brand/Outlet landing page surfaces: live queue, operating hours, contact info, address/map
✅ **Service selection is mandatory to join the queue**, but is provisional — the cashier confirms/amends the final service list at the counter after service, since clients add on services mid-cut
✅ **Multiple services can share one queue ticket** — it is not one ticket per service
~~✅ **One active queue ticket per client at a time**…~~ — **superseded (Round 2):** multiple concurrent tickets are allowed across Outlets and Brands; only *time/slot collisions* are rejected
~~✅ **"No preference" barber = served by whoever frees up first** (no permanent binding at join time); **auto-assign is round-robin**~~ — **superseded (Round 6): "no preference" is removed entirely, choosing a barber is mandatory, and round-robin survives only as the disruption-reassignment mechanism**
✅ **"Reassign fairly" = round-robin** across remaining available barbers when a barber goes unavailable mid-queue (not load-balanced by current queue length)
✅ **Bookings are only offered after the walk-in queue's projected clear time** (now + sum of queued estimated durations) — e.g. 9:00am with 4 people at ~20 min each → earliest bookable slot 10:20am. Booked slots are never inserted into the middle of the live walk-in sequence
✅ **Voluntary cancellation ≠ no-show.** A client may leave the queue before being called; a no-show is specifically defined as surpassing the booked slot time, and only that attracts the no-show loyalty penalty
✅ **Reviews target the Outlet** — the client does not choose the target *(refined in Round 2: a separate barber rating is collected on the same submission to feed `BarberStatistic`)*
✅ **One review per Transaction (1:1)** — a repeat client can leave a separate review per visit
✅ Review is prompted **immediately after payment** in the webapp; the review window is **the open browser tab**, not a fixed time limit. The receipt can optionally be emailed
~~✅ **Star rating mandatory, comment optional**; individual comments displayed publicly~~ — **superseded (Round 3):** comments are removed entirely; reviews are rating-only
✅ **Anonymity is two-way** — the merchant/barber cannot internally see who wrote a review either; no de-anonymising view exists
✅ **Reviews are immutable** — clients cannot edit or delete them (supersedes the earlier "clients can edit/delete their reviews" rule), and a review survives a later void/refund of its Transaction
✅ **No merchant reply feature** — reviews are strictly one-directional

### Round 2 — Accounts, Queue Mechanics, Capacity & Moderation

✅ **⚠️ The Guest User type is dropped entirely.** There is one client type: a registered account. Queue numbers, bookings, loyalty, and reviews all require registration. This supersedes both the original guest model and the Round 1 phone-number-first model
✅ **The signup wall sits at the END of the booking flow** — browse → tap Book → pick slot → pick service → pick barber → **then** register → submit. Deliberate conversion tactic: make the client invest effort first. All pre-signup selections must survive the registration round-trip
✅ **Google/Gmail sign-up is supported** as a Keycloak social identity provider, to reduce signup friction; an account may therefore have no local password
✅ **Anonymous browsing covers:** live queue, operating hours, contact info, address/map, and **who the barbers are** — with nothing entered at all
✅ **The public queue display shows the queue number only** — no name, no partial phone, no barber, no service
✅ **Every Outlet has its own QR code**, landing straight on that Outlet's booking page — no Brand page, no Outlet picker, so wrong-branch joins are structurally impossible
~~✅ **Multiple concurrent tickets are allowed** provided they don't collide in time/slot~~ — **superseded (Round 3):** taking a number elsewhere prompts the client to cancel their previous one, so one active ticket stands — by explicit choice, not a hard block
✅ **Requeue mechanics:** the barber can manually **mark a late client as a no-show**; the client takes a **brand-new sequential number** (display sequence keeps incrementing); the **old number vanishes from the public display immediately**
✅ **Bookings never cut in front of the waiting queue.** If the shop runs late, the walk-in queue is finished first — a booked slot is a "not before" guarantee, not a "served at exactly" guarantee
✅ **No-show loyalty penalty applies to missed BOOKINGS only** — an expired walk-in ticket and a voluntary cancellation both go unpenalised
✅ **Each barber has a merchant-set daily capacity**; a barber at cap stops being bookable for that day
✅ **New queue joins are cut off ahead of closing time** once the projected wait would run past it — threshold is manager-configurable
✅ **Loyalty redemption scope is merchant-configurable** (Outlet-only / Brand-wide / wider) — so a balance cannot be modelled as one global per-client number
✅ **Only account holders can review** — stated rationale is anti-spam/anti-bot-voting, so review submission must never be reachable unauthenticated
✅ **Barber ratings are kept**, fed by a **separate 1-5 barber rating** collected alongside the Outlet review — chosen over dropping the metric. Same two-way anonymity applies
✅ **Closing the browser tab permanently forfeits the review** — the emailed receipt carries no review link, and there is no review-a-past-visit path in history
~~✅ **Review moderation = blocked-word masking** maintained by the Meikigo super admin~~ — **superseded (Round 3):** no review text exists, so moderation is dropped entirely
✅ **Cashier looks the client up by phone number, username, or email** at the counter; when a service is added at the counter, **everything downstream updates** — the bill, the barber's commission, and the service duration feeding queue/booking estimates

### Round 3 — Reviews Simplified, Email Reintroduced, POS & Lockout Semantics

✅ **⚠️ Written review comments are removed entirely — reviews are star/rating-only** (Outlet rating + barber rating). No free-text field anywhere
✅ **Consequently all review moderation is dropped** — no blocked-word list, no masking, nothing to filter. Abuse is countered at the identity layer instead
✅ **Account creation requires OTP verification or SSO** — no unverified signup path. This is the anti-fake-rating control
✅ **⚠️ Transactional email exists** (narrowing Round 1's blanket "no alerts"): receipts, and barber-unavailable notices. Still no push, no SMS, and no queue-position/expiry alerts
✅ **Barber marked unavailable → affected future bookings trigger an automatic email** carrying a **cancel-or-reschedule link** *(narrowed in Round 5: cancel only — reschedule was removed from the product)*; the manager may also phone clients. Today's live queue is still silently round-robin reassigned
~~✅ **Reschedule becomes a real client-facing capability** (first introduced here, via that emailed link)~~ — **superseded (Round 5): there is no reschedule feature anywhere in the product; a client cancels and books again**
✅ **Multi-queue is resolved by a swap prompt** — taking a number at another Outlet pops up an offer to **cancel the previous queue number**. Counts as a voluntary cancellation, no penalty. (Supersedes both Round 1's hard block and Round 2's time-collision rule)
✅ **The cashier taps "start"/"done" on the POS to drive `IN_SERVICE`/`COMPLETED`** — workable because cashier and barber are usually the same person. `BarberStatistic` average processing time is therefore real measured service time
✅ **The barber daily cap blocks walk-in assignment too**, not just bookings — walk-ins cannot push a barber past their cap
✅ **Tickets already issued are always served** — never auto-expired at closing, never rolled to tomorrow. The control is a per-Outlet **"last queue number receiving time"** cutoff
✅ **Booking horizon is merchant-configurable** — bookings are not restricted to same-day
✅ **Refund/void reverses money only** — earned points are not clawed back, redeemed points are not restored, commission is not reversed, and partial refunds change none of that
✅ **Split payment is itemised and produces N separate Transactions** (not one bill with N payments); methods can be mixed; a failure is isolated to that one share; **only the booker needs an account**
✅ **No POS offline mode** — no local DB, no sync engine. Connectivity loss means the shop transacts manually and the **manager keys the sales in afterward**, which makes manual/backdated transaction entry a real requirement
✅ **Read-only lockout is not total: the payment function stays enabled** *(scoped in Round 4 to pre-lapse bookings only)*. Bookings made before the lapse are honoured and attendable; new bookings are blocked; renewal is attempted at midnight
✅ **`meikigo-admin` is Meikigo's internal tool** with full CRUD on all tables, special/administrative functions, and API configuration control (e.g. HitPay)
✅ **Loyalty never crosses Brands** — widest scope is all Outlets of the merchant's own Brand, so no inter-merchant settlement model is needed
✅ **Barber-facing ratings need no aggregate-only restriction** — clients often rate hours after the visit, so rating order does not track service order

### Round 4 — Signup Mechanics, Manual Entry, Lockout Messaging & Reporting

✅ **Signup collects four fields: email, phone, name, password** — email unique
✅ **⚠️ OTP is delivered by EMAIL, not SMS** (direction changed) — no per-signup telco cost, but email deliverability now sits on the critical path of the booking flow
✅ **OTP is used once at account creation only** — returning clients never re-OTP
✅ **"I have a booking" keeps the phone-number lookup**, alongside logging in — both paths recover a live ticket
✅ **The disruption email's cancel/reschedule link requires login** — it is not a direct-acting token *(the link is cancel-only as of Round 5)*
✅ **A logged-in client can cancel their own booking any time before the slot**, and it always counts as a voluntary cancellation with **no penalty**
✅ **Slots are NOT held during signup** — two clients can race for the same slot; the loser picks another time
✅ **Future-day slots** = business hours − booked slots, bounded by barber daily capacity, breaks, off-days and holidays
✅ **Manual/backdated entry is Admin-only**, records the **actual sale time** (backdatable at the manager's discretion), is **flagged as manual**, and **loyalty points on it are granted by hand and logged**
✅ **"Party" is a booking-layer concept only** — it never reaches the receipt or Transaction; a party of five is five independent sales, and only the booker earns points
✅ **Lockout payment is scoped to pre-lapse bookings only** — it cannot be used to trade on indefinitely without renewing
✅ **Lapsed-Brand QR messaging must be neutral** — never an error/"not available" state (implies Meikigo is broken), never any disclosure of non-payment (shames the merchant). Point the customer to contact the shop
✅ **Public Outlet page shows the full picture** — Outlet average, rating count, and per-barber averages — but only above a **minimum-ratings threshold set by Meikigo super admin**
✅ **The merchant sees the aggregate rating only** ("4.2 from 38 ratings") — no dated list, which closes the re-identification path entirely
✅ **Dashboard content decided** (delegated to product judgment) — see Subscription Tiers → Dashboard content for the Simple / Advanced / HQ breakdown
✅ **`meikigo-admin` is role-split** (support views, engineering edits) and **every action is audit-logged**
✅ **Cancelled-merchant data is never purged** — indefinite soft-delete retention, no deletion job
✅ **A Brand sitting at the end-of-trial paywall is read-only**
✅ **A pending, unaccepted Organisation Member invite consumes one of the 10 slots**
✅ **Email addresses are unique per account** — a person needing both Org-admin and Outlet-operational access needs two distinct emails
✅ **PRO's "Dedicated onboarding" and "SLA support" need real product surface** — priority support flag, ticket form, onboarding checklist
✅ **Multi-currency is explicitly Phase 2** — Phase 1 is MYR-only end to end
✅ **F&B is expected to be a separate application** with requirements not yet written — so build barber-first rather than paying a genericity tax now

### Round 5 — Money Mechanics, Client Accounts, Offboarding & Untouched Areas

✅ **The account-login cap is effectively a DEVICE cap — one account may be signed in on one device only** (security decision). STARTER's 2 logins = 2 concurrent tablets, PLUS's 4 = 4. Requires single-session-per-account enforcement, and an Admin force-sign-out for a lost tablet *(closes the item left blank in Rounds 3 and 4)*
✅ **A Cashier account is scoped to one BRAND, not one Outlet** — usable at any Outlet of that Brand, never across Brands. So `getOutletFromJWT()` must resolve Outlet from the **session/login context**, not from the account alone
✅ **The accounting module lives inside `meikigo-api`**, not as a separate service — with real-time in-process posting assumed (no nightly batch), since only the location half of the question was answered
✅ **Google/Gmail sign-up STAYS**, alongside the four-field email form: **name and email come from Google, no password is set at all, and the phone number is collected in a post-SSO step.** SSO substitutes for the email OTP
✅ **⚠️ There is NO reschedule feature — a client cancels and books again.** This **supersedes Round 3's "reschedule becomes a first-class client-facing capability"**; the barber-unavailable email now offers cancel only
✅ **Barber commission calculates AUTOMATICALLY on manually-entered (outage) sales** — unlike loyalty points on the same record, which stay manual. Barber assignment therefore becomes a required field on the manual-entry form
✅ **Lapsed-Brand booking-page copy APPROVED as proposed** — *"Online booking isn't open for this outlet at the moment. Please contact the shop directly to book."*, shown with the shop's name and phone number
✅ **Customers CAN delete their account** — but past transactions are **kept with name, email and phone intact** (financial record), not anonymised. This gives PDPA a deletion path while flagging that erasure is partial and needs stating in the privacy notice
✅ **Forgotten password = standard reset-by-email link.** No SMS path and no support-mediated recovery, so a client who loses their email access currently has no route back to their account
✅ **A client can change their phone number, verified by SMS OTP to the NEW number**, keeping all loyalty and history. ⚠️ This reintroduces SMS — the one and only SMS in the product — after Round 4 deliberately moved OTP to email
✅ **⚠️ STARTER is the downgrade floor — a Brand that has subscribed can NEVER downgrade to FREE.** So orphaned loyalty balances cannot arise via downgrade: no freezing, no wiping, no settle-before-downgrade. ⚠️ But the existing "cancellation reverts the Brand to FREE" rule is a backdoor to the same state and now needs resolving
✅ **A client pays the price shown when they joined the queue** — price is snapshotted onto the ticket at join, in addition to the existing snapshot onto the Transaction at sale. Services added at the counter are priced at counter time
✅ **A ticket's estimated duration uses MAX vs SUM based on barber overlap:** when a ticket has lines with **different barbers**, estimated duration is the **MAX** (slower chair); when multiple lines share **the same barber**, estimated duration is the **SUM** (those services are sequential in that chair). Using the merchant's typed per-service durations, with measured start/done times feeding reporting only — the system never learns from them or auto-adjusts the estimate
✅ **Payroll is ONE module with no PLUS-vs-PRO variant.** It calculates staff salaries, tracks commission owed, generates payslips, and handles EPF/SOCSO/PCB deductions — **with no integration to any other application** (no government-portal filing, no bank disbursement file, no third-party accounting sync)
✅ **Commission feeds into Payroll and becomes part of a payslip** — not just a report the owner pays outside the app. *(Deferred in Round 6, **✅ restored in Round 9 on PRO**. The "service commission is deferred" caveat is long gone — Round 6 made service commission real and Round 9 gave it its own rate. The refund caveat stands and now matters more: commission is not reversed by refunds, so it can be paid out on returned revenue, and clawing it off a processed payslip is hard.)*
✅ **Receipts follow LHDN e-Invoice, delivered on-screen and by email — there is NO physical printer.** Product decision under the merchant's delegation: the **full e-Invoice field set is captured on every sale on every tier** (so nothing needs back-filling), B2C sales default to an ordinary receipt rolling into a monthly consolidated e-Invoice, and **MyInvois submission itself stays the PRO tax pack**. ⚠️ Flagged at the time: e-Invoicing is a statutory obligation, so gating submission behind PRO leaves an in-scope STARTER/PLUS merchant unable to comply through Meikigo. **⛔ SUPERSEDED BY ROUND 8, AMENDED BY ROUND 9 — submission is not in this build at all (Phase 2). Round 8 also de-gated it from PRO; Round 9 put the MyInvoice pack back on PRO, with its scope narrowed to generating the e-Invoice documents rather than transmitting them. The capture decision stands unchanged on every tier.**
✅ **⚠️ Employee records, pay and commission must follow accounting standards and Malaysia's Employment Law for audit — stated by the merchant as a strict rule.** So: `Employee` records are **deactivated, never deleted**; outstanding commission stays visible until paid and a final payslip stays producible after departure; retention follows statutory periods rather than being indefinite-by-default
✅ **A resigned employee's bookings are cancelled by the Admin with a COMPULSORY reason**, and the client is informed by **email and in-app notification** — not silently reassigned to another barber
✅ **A resigned employee frees one headcount slot (+1 active employee) — but strictly only after they are actually deactivated in the system.** Enforcement counts active Employee records per type
✅ **Closing/deactivating an Outlet cancels its queue tickets and future bookings, emails every affected client, and switches its QR off** (scanning shows a closed message). Its transaction history stays visible in reporting. ⚠️ This is the one deliberate exception to "tickets already issued are always honoured", and it also fires on a **downgrade-driven** deactivation — so the downgrade picker must show what each Outlet is holding before the merchant confirms
✅ **The POS tablet does NOT auto-lock** — it stays signed in all day, on the basis that it lives behind the counter. The single-device-per-account rule is the security control instead; restricting refund/void to Admin is recommended as the next one
✅ **A POS notification with sound is available as an OPTION** for new remote bookings/queue joins — per-Outlet setting. Sound-off must stay fully workable, because the expected pattern is a barber checking the screen after finishing each client
✅ **Joining the walk-in queue remotely is intended and fine** — no geofence, no QR-freshness check. The 5-minute grace, 2-hour expiry, and manual no-show marking are considered sufficient
✅ **Clients now have an in-app notification inbox** (a new surface) for merchant-initiated disruptions only — booking cancelled, Outlet closing. Still no push, and still no queue-status notifications of any kind

### Round 6 — The Counter, Money Mechanics, Loyalty Internals & Deferrals

✅ **⚠️ The FREE contradiction is closed: a cancelling Brand does NOT revert to FREE.** `FREE` is a **never-paid entry tier only**. After any paid subscription the only two end states are **unsubscribed/stopped** (soft-deleted, data retained) or **unpaid/read-only**. Both routes back to FREE — downgrade and cancellation — are now shut, which also permanently closes the orphaned-loyalty-points hole
✅ **Outlet closure needs no effective-dating — notification is the mitigation**, because a booking carries no payment and so cancelling one costs the customer nothing but a wasted plan *(my recommendation on top: still let today's in-progress services and live queue finish)*
✅ **The closed-Outlet message is softened and UNIFIED with the lapsed-subscription copy** — the customer is never told the Outlet is "closed". One neutral string covers closed, downgrade-deactivated and lapsed states: *"Online booking isn't open for this outlet at the moment. Please contact the shop directly to book."*
✅ ~~**⛔ Payroll is NOT being built yet.**~~ — **⛔ REVERSED IN ROUND 9: Payroll IS built, on PRO**, scoped to generating monthly payslips for all active employees. On STARTER and PLUS the Round 6 behaviour continues unchanged — commission and tips accrue per sale and are **reported** (dashboard, Z-report, accountant export), and the owner pays outside the app. The pricing-table flag is closed by building the feature rather than by removing the row
✅ **A "digital punch card" clock-in/clock-out is planned but unconfirmed** — **✅ SETTLED IN ROUND 10: the punch card is Phase 2, but a manually-marked monthly attendance table IS Phase 1**, because daily-wage pay needs one. Payroll cadence is confirmed monthly
✅ **Refunds and voids are authorised by an OUTLET OVERRIDE PASSWORD** set in Outlet configuration — the cashier stays signed in as themselves and types the password rather than switching to an Admin account. ⚠️ A shared secret can't attribute an action to a person, so log the acting cashier **plus** that the override was used, and make the password rotatable
✅ **An Admin can force-sign-out a device**, and a second sign-in **kicks the old device off** with a clear "signed in elsewhere" screen
✅ **A client can change their email, verified by OTP to the new address** — held pending until verified, with a notice to the old address
✅ **Phase 1 has NO account recovery: lose your signup email and the account is gone**, loyalty balance included. SMS + two-step verification for recovery comes after Meikigo starts generating revenue. ⚠️ This contradicts Round 5's SMS-verified phone-number change — with no SMS provider in Phase 1, recommend verifying a phone change by **email OTP** in the interim
✅ **Unspent points are forfeited when a client deletes their account** *(my recommendation, adopted)* — but recorded as a forfeiture in the loyalty ledger, warned about in the deletion dialog with the actual point count, and reported separately from redemptions
✅ **⚠️ Staff can create a queue ticket at the counter for a walk-in with no smartphone** — a manual booking form where staff enter whatever helps the barber call the customer. **`Queue.Client ID` becomes nullable** and the ticket carries a free-text customer label. Points still need an account, so they only accrue if the ticket is attached to an existing one by phone lookup; the review is simply lost — which also closes Round 4's question about manual outage sales
✅ **Staff can create a BOOKING for a caller**, who must have an existing account identified by user ID or email. Clean split: walk-in ticket = no account needed; phone booking = account required
✅ **⚠️ "No preference" barber is REMOVED — choosing a barber is mandatory.** If a customer has no preference, the barber or cashier advises them in person. Round-robin survives only as the disruption-reassignment mechanism. This is also what makes per-barber pricing safe, since the price is always known before submit
✅ **A ticket records a DIFFERENT BARBER PER SERVICE LINE** — commission follows each line to the performer, and the receipt shows who did what. ⚠️ Knock-on: **barber ratings become one per barber on the ticket** (a child collection under Review), not one per review
✅ **Tips exist, added at checkout**, shown on the receipt and accrued to the barber like commission. Must be excluded from revenue, commissionable amounts and tax. ⚠️ Open: who gets the tip when two barbers served one ticket
✅ **Ad-hoc discounts exist — Admin-only and always logged**, authorised by the acting Admin's own approval password since Round 12, with a required reason. Promo codes and vouchers are **Phase 2**
✅ **Day close and a daily Z-report exist** — staff count the cash, the system shows expected vs. actual and records the variance; **one close per Outlet per day**. The report covers sales by payment method, voids, discounts, cash expected, plus tips and commission by barber
✅ **Retail stock IS tracked**, standard retail practice: sales auto-update inventory. Stock is held **per Outlet** against Brand-level products, with stock-in, logged manual adjustments, movement history and low-stock visibility
✅ **⚠️ Commission now applies to BOTH products and services**, configured in Outlet configuration — superseding the Phase-1 deferral of service commission. **Rates can differ per barber.** Three configurable dimensions, so precedence needs confirming (recommended: Outlet → item → barber)
✅ **Services can be priced PER BARBER** (senior/junior pricing), layered on Brand price → Outlet override → barber override
✅ **Loyalty runs BOTH mechanisms: punch card AND points balance** — a client can hold both with the same merchant
✅ **A redeemed free cut shows as full price PLUS a matching discount line**, never a RM0 line — keeping delivered value, programme cost and the tax base all visible. Whether commission is paid on it, and which service it applies to, are **merchant-configurable**
✅ **Referral programme defined and in Phase 1:** every client gets a shareable **referral code**; the referrer is credited only when the friend **registers AND completes a paid visit**; the friend also gets a **joining bonus configured per Brand/Outlet**. Recommend a minimum qualifying spend, since otherwise a RM5 purchase can unlock a RM30 cut
✅ **Tax document export: Excel AND PDF, no PLUS/PRO variant, no integration.** Period and contents delegated to me — specified as monthly / **bi-monthly (SST taxable period)** / quarterly / annual / custom, with a summary sheet plus a per-transaction listing. ⚠️ It is **not** the same thing as the MyInvoice pack: one is a report for a human accountant, the other is a filing integration with LHDN
✅ **⚠️ Round 6's "no integration" raised a doubt over whether MyInvois SUBMISSION is in this build at all.** The e-Invoice data capture (all tiers) was decided and is not wasted either way. **✅ ANSWERED IN ROUND 8 — it is not in this build: Phase 1 captures and exports, Phase 2 submits, on any paid tier**
✅ **A searchable customer list is built in `meikigo-merchant`** (visit count, last visit, total spend, loyalty balance), **exportable to CSV** — and it must **never** show that customer's ratings, since review anonymity is absolute
✅ **⚠️ Merchants CAN send marketing blasts, sold as a paid add-on** — superseding the standing "no marketing, ever" rule. Two consequences to handle now: **marketing consent must be captured at signup** as a separate unticked checkbox (retro-fitting valid consent later is not really possible), and marketing mail needs a **separate sending domain from transactional mail** so promo complaints can't push signup OTPs into spam
✅ **First language is ENGLISH** *(recommend externalised string files from day one — BM is the obvious second)*
✅ **Customer-facing copy must not mention soft-deletion.** ⚠️ My recommendation for honouring that safely: never expose internal mechanics, but do state plainly that **transaction records are retained for accounting/tax purposes** (LHDN generally expects 7 years) — and avoid promising complete erasure, which is the actual legal exposure. Who writes the ToS/privacy text is still open
✅ **The merchant configures ALL scheduling inputs** — per-barber working hours, lunch breaks, off-days, and a **per-Outlet public holiday list entered by hand**. Meikigo ships no holiday calendar, which conveniently sidesteps Malaysia's state-specific holidays

### Round 7 — Queue Structure, Counter Mechanics & Scope Corrections

✅ **⚠️ There is NO SMS anywhere in Phase 1 — the phone-change OTP goes by EMAIL.** The client receives a 6-digit code by email and pastes it in. This supersedes Round 5's SMS-verified phone change and restores the "no SMS" rule unbroken. *(Note it proves the account owner authorised the change, not that the new number is theirs — accepted until SMS lands in Phase 2)*
✅ **"Smartphone gets highest priority" means PATH priority, not queue position.** A ticket is a ticket; a counter-created ticket is never served behind a later app ticket
✅ **⭐ SERVICE ORDER IS NOW PER BARBER.** Ticket 1006 (Ben, free) is served before 1005 (Ali, busy). The running number still identifies the ticket and is still issued shop-wide first-come-first-served, but **it no longer indicates service order**
✅ **The public display shows each barber's "NOW SERVING" number only** — never the waiting list, deliberately, so customers aren't confronted with a long queue. A client's own position and estimate live on their own ticket view
✅ **Wait estimates and earliest-bookable-slot are computed PER BARBER**, not across the whole queue — the old whole-queue maths assumed anyone could serve anyone
✅ **The booking UI shows AVAILABLE times only** — times when the chosen barber is booked are not displayed at all, not greyed out
✅ **A barber sees their own waiting list on the POS** — as a **view/filter on the shared counter tablet**, not a login, since barbers still have no account of any kind
✅ **Holding a walk-in number does NOT block booking a future slot** — no swap prompt, no cancellation. *(Closes the item carried since Round 3; the swap prompt exists only for two live walk-in tickets at different Outlets)*
✅ **⚠️ The merchant assigns SKILLS per barber, reflected to the customer** — superseding "all barbers can perform all services". Necessary now that barber selection is mandatory, or a customer can pick a junior for a colouring they can't do. Filter applies **per service line**
✅ **Duration is NOT per barber** — one duration per service for everyone. The merchant's reasoning: the senior/junior difference is experience, not a fixed time penalty, and some styles are quick for a junior anyway
✅ **A barber who finishes early advances to the next ticket manually, which frees their slot sooner** — so estimates track reality by **recalculating on each "done" tap** rather than by predicting per-barber speed. Projections must be computed on read, not stored stale
✅ **⚠️ Commission is OUTLET-LEVEL ONLY — one rate for every barber.** 4% at the Outlet means 4% for all. Per-barber rates and per-item overrides are both dropped, superseding Round 6. *(Per-barber **pricing** survives — a senior charges more, so the same percentage already pays them more)*
✅ **Discounting raises a popup asking whether the barber's commission drops with it** — a per-transaction decision at the counter, shown only where commission is enabled, and recorded against the transaction. Discounts are allowed by default but need the Admin password
✅ **On a multi-barber ticket, the CUSTOMER NOMINATES which barber gets the tip** — if the customer does not nominate any barber, the system splits the tip equally across all barbers on the ticket
✅ **A refund NEVER restocks automatically**, and damaged goods must never be restocked. A resellable return goes back only through the logged manual adjustment path — so Round 3's "a refund reverses money only" stands fully intact. ⚠️ "Product exchange" surfaced as a transaction type the system doesn't have — **✅ ANSWERED IN ROUND 9: it becomes its own transaction type, and manual stock adjustments now require approval**
✅ **The refund window is merchant-configurable** — no platform-imposed limit
✅ **A refund NEVER edits a transaction record or an already-closed day** — *"maintain the source of truth practice"*. A refund of a closed-day sale lands on today's figures, referencing the original
✅ **Cost price IS tracked, per stock purchase — not as one editable figure.** The same product holds cost layers (RM4 in January, RM8 in February). Recommended valuation: **weighted average**, with purchase records kept so FIFO stays possible. Cost is snapshotted onto the sale line. **Stock valuation is shown to the merchant**
✅ **A product-only sale needs no queue ticket at all**, and **nobody earns commission on it** — narrowing "retail commission goes to whoever performs the sale", which had assumed a barber was involved
✅ **Loyalty on product-only sales** *(my recommendation, adopted)* — **spend/points models accrue; punch-card/visit models do not.** Otherwise five pomades buy a free haircut
✅ **Prepaid packages and gift vouchers are wanted but NOT this phase.** One thing to carry forward now: upfront money for undelivered cuts is **deferred revenue**, so the ledger should be able to hold a customer liability balance later — cheap to design in, expensive to retro-fit
✅ **A booking reminder email IS sent** — the first proactive/scheduled email in the product, so it needs a scheduler (and a guard so cancelled bookings don't still remind). *Recommended: 24h before for the first reminder, with an optional second reminder at 2h before enabled per Outlet*
✅ **⚠️ A THIRD merchant role exists: READ-ONLY**, used to drive an **in-shop queue display** on a second screen. Barbers still have no account — the roles are Admin, Cashier and read-only, and that is the complete list. ⚠️ Whether the display account consumes a plan login was left unresolved here — **✅ ANSWERED IN ROUND 8: it does not, and it is not offered on FREE**
✅ **Authentication is delegated to Keycloak** — 2FA and password policy are realm configuration, not product features. **2FA is enforced for `meikigo-admin` staff and the POS cashier flow; Merchant Admin 2FA is optional at launch (Round 23).** The password-policy half stands (sane minimum, no forced expiry)
✅ **Staff can create a minimal customer account** (name + phone, no password) at the counter or by phone, closing the first-time-caller gap. It is unverified and cannot log in until the customer completes registration; match on phone so history carries over
✅ **Children get no accounts — a parent adds a second haircut line to their own ticket.** PDPA's parental-consent problem is avoided entirely; recommend stating a minimum age of 18. ⚠️ But a parent+child ticket is served in PARALLEL while duration is summed — **✅ ANSWERED IN ROUND 9: parallel confirmed, the ticket starts as soon as any line can start, a waiting line can be reassigned at the customer's discretion, queue state moves to per-line, and duration estimates as the longest line**
✅ **Marketing blasts: compose freely or use a Meikigo template, with NO review.** *(⛔ Templates dropped in Round 10 — compose freely only. Unsubscribe is per-Brand, not platform-wide, per Round 10.)* ⚠️ Sending reputation is shared platform-wide and the thing that breaks first is the **signup OTP** — so separate sending domains and per-Brand complaint-rate monitoring with auto-suspension are the mitigations that don't require moderating content
✅ **Payroll is REMOVED from the pricing table entirely** — not built, not sold. This closes the commercial flag; PLUS's price now stands against what actually ships
✅ ~~**Tax document export moves to ALL tiers including FREE**~~ — **⛔ SUPERSEDED (Round 13): PLUS and PRO only**
✅ **Meikigo has asked me to draft the client ToS and privacy notice** for a lawyer to review — as its own document, versioned to match the acceptance record already being stored

### Round 8 — Helmi's Three Tagged Inquiries, Re-asked with Examples

> Round 7 tagged three inquiries to be **re-asked with concrete examples** rather than answered on the spot. Round 8 was that re-ask. **Two of the three are now closed; the merchant agreement is still open.**

✅ **⭐ A STATED REASON is required before any customer's personal data is opened in `meikigo-admin` — no exceptions, no role exempt, including the highest-privileged Meikigo admin.** Recorded as given: *"To ensure data privacy compliance practice, the system should record the reason. We should not allow any users including admin to open and check customer data without any relevant reasons."* This is the strongest form of the answer — stronger than the recommendation, which had allowed for role-based exemptions. **The gate is at the API, not the UI**, the reason is stored on the audit row, and the recommended shape (masked-by-default lists, a time-limited single-record unlock, a periodic access report) is specified in full under Meikigo Staff Access to Customer Data. *This closes Helmi's inquiry #3.*
✅ **The read-only display account does NOT consume a plan login, and is NOT available on FREE.** STARTER's 2 logins stay 2 real staff logins **plus** a display. The FREE exclusion has a stated reason, recorded as given: *"free is meant for solo or hypersmall (1 person) barber with no physical shop"* — no premises, no wall, no screen. One display account per Outlet on STARTER and above, provisioned outside the quota and never sold as an add-on. Flag it on the account row (e.g. `is_display_account`) so quota enforcement can exclude it
✅ **⚠️ e-Invoice integration scope: "only the important integration" — adopted, with MyInvois submission moved OFF the PRO tier.** Phase 1 (this build) **captures the full e-Invoice field set on every tier and exports it; Meikigo submits nothing** — the merchant or their accountant files through LHDN's own portal. Phase 2 adds MyInvois submission, and when it lands it is available to **any paid tier**, not PRO-gated. This supersedes the pricing table's original PRO "MyInvoice tax pack" line and removes the commercial-vs-legal tension previously flagged: a STARTER or PLUS merchant who falls inside the mandate is no longer locked out of complying through Meikigo. *This closes Helmi's inquiry #1.* Recommendation still standing for Phase 2: integrate **via an accredited middleware provider rather than in-house**, and confirm with an accountant whether your target merchants are inside the current turnover thresholds at all
🔖 **Still open — the separate merchant agreement (Helmi's inquiry #2).** Re-asked but not yet answered. **✅ ANSWERED IN ROUND 9: no separate document — merchant terms are folded into the subscription checkout.**

### Round 9 — Reversals on PRO, Counter Mechanics & the Email Specification

> The round that put two features back. Rounds 7 and 8 had between them stripped Payroll and MyInvoice off PRO; Round 9 restored both after a full review of the requirements, with their scope narrowed to *"only focusing on generating the number"*.

**Reversals and commercial**
✅ **⭐ PAYROLL IS BACK, on PRO.** Recorded as given: *"we confirm to maintain payroll and myinvois for PRO as we include previously. However, the feature that handle payroll and myinvoice are only focusing on generating the number. Example payroll, every month, user can generate payroll slips for all active employees."* So: a monthly run producing a payslip per active employee, with base pay, commission, tips and calculated EPF/SOCSO/PCB figures — and **no filing, no disbursement, no integration** with any portal or bank. This reverses Round 6's deferral and Round 7's removal from the pricing table
✅ **⭐ The MyInvoice pack is PRO-only again**, reversing Round 8's move to any-paid-tier. Its Phase 1 scope is **generating the e-Invoice documents**, not transmitting them — MyInvois submission remains Phase 2 and is in nobody's build today. The statutory tension flagged since Round 5 is genuinely dissolved by this: no merchant is locked out of complying, because **every tier captures the full e-Invoice field set**, so a STARTER shop can still file manually — though after Round 13 it does so from its on-screen reports rather than from the packaged accountant export, which is now PLUS and PRO only. PRO buys the document generation, not the right to comply
✅ **PRO's price stands at RM329.** With both features restored, PRO = HQ Dashboard + Payroll + MyInvoice pack, and the "what does PRO sell now" question closes without repricing
✅ **Add-on unit prices are ADMIN-CONFIGURABLE, not hardcoded** — *"to be easy to scale, we are not hardcode it, admin can configure all this number. The only hard code is in meiki-marketing-site."* Changing a price means editing admin settings, then editing and redeploying the marketing site. ⚠️ Two places now hold the same number; recommended mitigation is a public pricing endpoint the marketing site reads at build time, so it cannot drift. **The actual RM figures are still unset** — no longer a build blocker, still a launch blocker

**Money mechanics**
✅ **⚠️ TWO commission rates at Outlet level — one for services, one for products.** The framing matters and should shape the UI: *"meikigo do not determine the margin or profit outlet made… We just prepare the tools."* Meikigo provides two empty percentage fields and offers no margin advice. Round 7's "no per-barber rates" is untouched
✅ **Cash tips are recorded at the counter, counted into expected cash, and paid out as a tracked payout.** Three movements, all recorded — taken, held, paid — so the drawer reconciles and a till taking tips no longer shows a permanent variance. *(Open: whether the payout happens at day close or through the now-restored payroll run)*
✅ **The webhook is the source of truth for POS payments**, redirect is UI only — lifted out of the HitPay KIV because it is a build decision, and treating the redirect as authoritative silently loses every payment where the customer closes their browser

**Counter operations**
⛔ SUPERSEDED by Round 23 Q16 (Phase 1): product exchange uses **refund + new sale** (no dedicated exchange money-flow transaction type). The “manual inventory adjustment needs APPROVAL” requirement still applies for any resellable-return stock adjustment: *"we have to maintain honest record especially integrity and audit compliance. Approval flow is needed."* Pending → approved/rejected, stock moves only on approval, requester and approver recorded separately. **This is the first approval workflow anywhere in the product**
✅ **⭐ A multi-barber ticket is served in PARALLEL and STARTS as soon as any one line can start** — *"if the parents line is free, start anyway."* Two structural consequences: **queue state must be tracked per LINE, not per ticket** (a ticket can be simultaneously in-service and waiting), and **ticket duration estimates as the longest line across different barbers**, not the sum
✅ **⭐ A waiting line can be REASSIGNED to another barber mid-ticket, at the CUSTOMER's discretion** — *"the child can wait or can be reassign to another barber (on parents discretion)"*. New capability: it re-checks skills and capacity, recomputes both barbers' queues, and — because pricing is per-barber — **changes the amount owed**, which must be shown and accepted before the move
✅ **The booking reminder lead time is set per Outlet in WHOLE HOURS** — *"48 hour means 2 days before, 24 hours, 1 day before"*. First reminder uses `booking_reminder_lead_hours` (recommended default 24) and an **optional second reminder** can be enabled **2 hours before** the slot.

**Access, email and lifecycle**
✅ **⚠️ 2FA is enforced for `meikigo-admin` staff and the POS cashier flow; Merchant Admin 2FA is optional at launch (Round 23)**. ⚠️ Recommended refinements rather than a reopening: enforce at **enrolment and new-device binding** on the POS cashier rather than every counter sign-in (or one authenticator phone lives behind the till, which is worse than no 2FA), and **exempt the read-only display account** — a wall screen cannot answer a prompt. Account recovery now matters more: recovery codes at enrolment, with `meikigo-admin` as the audited backstop
✅ **The reason-gate applies to MEIKIGO's staff only**, not to a merchant's own staff looking at their own customers. The merchant asked for the reasoning in full before accepting it; it is written out under Meikigo Staff Access to Customer Data → Scope of the reason-gate, with the PDPA data-user/processor split as the basis, the four merchant-side controls that carry the load instead, an honest statement of what the choice costs, and the trigger for revisiting it
✅ **Email infrastructure specified under delegation** — *"we do not have any provider in mind, and need your recommendation… reliable and cheap"*. Two separated streams on two subdomains, **both on Brevo**: transactional from `mail.meikigo.com` (OTP, receipts, reminders, payslips) and marketing from `news.meikigo.com` (blasts), with separate sending identities and API keys. Full spec includes DMARC rollout, an email log table support can query, bounce/complaint suppression, and the easily-missed detail that **Keycloak's own SMTP must point at the same provider and subdomain** or password-reset mail lands in spam. ❓ **The sending domain itself is still needed from Meikigo**
✅ **Marketing blasts are limited by the monthly email allowance (no weekly frequency cap)**, email only, with per-Brand unsubscribe and transactional mail always continuing regardless
✅ **A cancelled Brand reactivates SELF-SERVICE**, restored exactly as left, with **no time limit** — the LHDN 7 years is a retention floor, not an expiry on returning
✅ **"Never purge" is reaffirmed** over the alternative of anonymising dormant personal data. The position must now be stated plainly in the checkout terms and the privacy notice, the customer's own deletion path stays the pressure valve, and reason-gated staff access is what keeps it defensible. Revisit trigger: any launch outside Malaysia
✅ **Merchant Agreement is the terms-of-purchase block shown at subscription checkout** (no separate document library), versioned like the client ToS and accepted at subscribe/trial start. Closes the last of Helmi's three inquiries.

**Carried to Round 10 at the merchant's request**
🔖 **"What is an access report?"** — *"Please ask in next session. Im not understand"*. **✅ Re-asked and ANSWERED in Round 10**
🔖 **The LHDN e-Invoice threshold question** — *"Not understand, please ask into next session"*. **Re-asked in Round 10; answer is "don't know yet, keep it as planned"**

### Round 10 — Payroll Detail, Attendance & the Pricing Brief

> A round of mostly-confirmations that nonetheless added two real features: a **monthly attendance table** (because daily-wage pay needs one) and a **QR approval flow** for stock. It also moved tip payouts from the till to payroll, which simplified day close. *(Round 11 later made the attendance table monthly **or weekly**, and replaced the QR with an Admin Approval Password.)*

**Payroll — now fully specified**
✅ **⭐ All three pay models, chosen per employee** — basic + commission, commission-only, or daily wage. New `Employee` fields: `pay_type`, `basic_salary`, `daily_rate`, all effective-dated so a raise cannot rewrite an old payslip
✅ **Meikigo computes EPF and SOCSO; the merchant types PCB.** The right split — the first two are public rule-based tables, while PCB depends on personal reliefs Meikigo neither holds nor should collect. ✅ **BOTH ADOPTED IN ROUND 11 — EIS is computed and employer-side contributions are shown.** ⛔ **But rate OWNERSHIP is superseded by Round 11: the tables are configured by each Brand/Outlet, not maintained platform-wide by Meikigo**
✅ **Payroll runs once a month, and covers BOTH barbers and non-barber staff.** No mid-month advance in this build. This finally closes Round 6's "cadence to be revisited"
✅ **⚠️ Payslips are EMAILED to the employee** — which makes **`Employee.email` a required field**, a change from the current model. Existing records need back-filling before the first run. ✅ **ALL THREE ADOPTED IN ROUND 11: password-protected PDF, transactional stream only, and a merchant download as the fallback — the run is never blocked by a missing address.** Employees still get **no login**
✅ **⭐ ATTENDANCE IS PHASE 1 AFTER ALL** — *"the digital card only phase 2. But for phase 1, HR manually need to click attend… 1 day before new month, system should create working days/time table for each employee."* A scheduled job generates a row per employee per day, pre-filled with off-days and public holidays from data the system already holds; HR marks `PRESENT`/`ABSENT` in `meikigo-merchant`; the table locks when payroll is finalised. **This became unavoidable the moment daily wage became a pay type** — the two answers depend on each other. Phase 2's punch card writes real times into the same structure, so nothing is wasted. **No leave tracking**

**Money**
✅ **⚠️ Tips are paid through the MONTHLY PAYROLL RUN, not at day close** — the opposite of my recommendation. Consequences: the cash tip stays in the drawer and is banked with the takings, so **day close gets simpler** (`float + cash sales − cash refunds + cash tips`, no payout term); the shop carries the accrued tips as a liability for up to a month; and card tips now behave identically to cash. ⚠️ **Gap flagged: payroll is PRO-only, so STARTER/PLUS shops have no run to pay tips through** — recommended a simple "mark tips paid" action on every tier, or the accrued balance grows forever. ✅ **ADOPTED IN ROUND 11**
✅ **Nobody earns commission on a counter-only product sale** — confirmed. The product-commission rate applies only where a product is sold on a service ticket
✅ **⭐ Add-on prices: I was asked to propose them** — *"we do not seek to make a stupid amount of money from add ons, we want to make it attractive so merchant want to subscribe… on monthly basis and repeat purchase."* Proposed: **outlet RM45, barber RM12, staff RM8, login RM15, catalog slot dropped, marketing RM39 flat.** The outlet price is the load-bearing one: STARTER + 2 outlets lands exactly on PLUS's RM199, and PLUS + 3 outlets lands just past PRO's RM329, so the upgrade becomes obviously better at precisely the right point and no merchant is ever trapped paying more for less. Also recommended an **upgrade advisor** that tells a merchant when switching tiers would be cheaper — the clearest way to demonstrate the pricing is honest. ⛔ **SUPERSEDED BY ROUND 11** — the confirmed table is outlet RM39, barber RM15, staff RM10, login RM15, catalog pack of 10 SKUs RM9, marketing RM49

**Counter and stock**
✅ **⭐ THREE approval routes, and the requester picks:** Notify Admin via System (badge), Notify Admin via Email, or **Generate Approval QR Code** — the retail receiving-department pattern. ⚠️ **Specified carefully, because a QR is just a link:** it encodes the *request* and never a static admin badge, it is single-use and short-lived, and **scanning is not approving** — it opens the request on the Admin's own authenticated device. A reusable or personal QR would become a way for a cashier to approve their own write-offs. ⛔ **SUPERSEDED BY ROUND 11 — the QR route is dropped entirely and replaced by an Admin Approval Password, distinct from the login password**
✅ **Self-approval is allowed and recorded as such** where a shop has only one Admin — honest, and it keeps FREE and single-admin STARTER shops working
⛔ SUPERSEDED in Phase 1 by Round 23 Q16: exchange is implemented as **refund + new sale** (no dedicated exchange money-flow). If the returned item is resellable, the returned-stock add-back uses the **manual inventory adjustment request** flow, which follows the existing approval rules.

**Confirmations**
✅ **2FA on the POS is enforced at enrolment and new-device binding, not on every sign-in**, and the wall display is exempt — both confirmed, which avoids the shared-authenticator-phone outcome
✅ **A parent+child ticket counts as its longest line** (30 minutes, not 50) — the parallel-service arithmetic confirmed
✅ **A booking reminder of 0 hours means reminders are off** for that Outlet
✅ **A reactivating Brand whose data exceeds its new plan comes back READ-ONLY** until they upgrade or trim down to the cap — reusing the existing `EXPIRED` behaviour rather than inventing a state
✅ **The monthly access report is owned by the SUPPORT function, behind RBAC**, with anomalies *"logged for further investigation"* rather than any formal process. ⚠️ Flagged: support is both the main user of the reason-gate and now its reviewer, so *recommended that the report is also visible to one person outside support* — self-review is the weakest form of oversight. ✅ **ADOPTED IN ROUND 11: one person above support reads the support team's own access monthly**
✅ **Unsubscribe is per BRAND, not platform-wide** — so consent must be stored **per client per Brand**, not as one flag on the account
✅ **⚠️ NO Meikigo email templates** — *"No need for now."* So Round 7's "compose freely **or** use a template" becomes compose freely, full stop. **There is now no content quality control on marketing blasts at all**, which made the four mechanical protections load-bearing. ⚠️ **Three have since gone:** the weekly cap was removed (Round 14), and both automatic complaint-suspension and a daily send limit were declined (Round 15). What is left is the separate sending domain, the paid monthly allowance, and a human acting on an admin warning — with Brevo's own abuse enforcement as the real backstop
✅ **LHDN e-Invoice timing: unknown, and that is fine** — the build is unaffected, only the urgency of Phase 2

**Answered with a decision that raises a new question**
✅ **Email sends over SMTP, configured in the app** — *"We will setup email configuration SMTP on the app."* Sensible and provider-agnostic, and it changes nothing about the recommendation: SMTP is a transport, not a provider, so a provider, an authenticated domain and SPF/DKIM/DMARC are all still required. *Recommended: still consume bounce/complaint webhooks, or there is no suppression list and no way to answer "did the OTP arrive?"* ❓ **New question: one platform-wide SMTP, or each merchant configuring their own?** — **✅ ANSWERED IN ROUND 11: one platform-wide Meikigo account.**
❓ **The sending domain is still not stated**, and nothing can be configured without it — **✅ ANSWERED IN ROUND 11: `meikigo.com`, already owned.**

### Round 11 — Both Launch Blockers Cleared, and a Structural Rule Nobody Saw Coming

> The round that unblocked launch — the six add-on prices and the sending domain both landed — and then introduced something larger than either: **brand type now decides where every setting is configured.** Two of my recommendations were also overruled, both in the same direction: **Meikigo computes, humans decide.**

**Launch blockers — both closed**
✅ **⭐ ADD-ON PRICES CONFIRMED** — *"go with answer A."* **Outlet RM39, barber RM15, staff RM10, login RM15, catalog pack of 10 SKUs RM9, marketing blast RM49**; yearly = monthly × 10. The Round 10 draft table (RM45/RM12/RM8/drop the slot/RM39) is superseded. `meikigo-marketing-site` can publish a pricing page. ✅ **`FREE` cannot buy add-ons** — confirmed explicitly, enforced at the API
✅ **⭐ THE SENDING DOMAIN IS `meikigo.com`**, already owned. `mail.meikigo.com` for transactional, `news.meikigo.com` for marketing. SPF/DKIM/DMARC, the provider account and Keycloak's SMTP can all now be set up — nothing about email is blocked any more
✅ **ONE platform-wide SMTP account, owned by Meikigo** — not per-merchant. Configured through an in-app settings screen (*"you can refer Mendix email connector module"*), so credentials are entered and rotated without a redeploy. ⚠️ Specified with the obvious protections: password write-only and encrypted at rest, every change audited, a send-test action, and the reminder that **Keycloak holds its own SMTP config and must be pointed at the same account by hand**. A merchant wanting mail from their own domain is a Phase 2 domain-verification feature, never a password box

**⭐ The structural one — brand type decides configuration level**
✅ **⭐⭐ `Brand.brand_type` = `FRANCHISE` or `BRANCH`, and it decides WHERE settings are configured.** Recorded as given: *"if the brand type is franchise, meaning all setup must be done in outlet level. If the brand is branch type, the setup must be done at brand level. This apply to all feature that you can think it make sense."* This arrived as an aside inside a question about EPF rates and is the widest-reaching decision of the round. **Built as one storage level with two editing levels** — values still live on the Outlet and every calculation still reads them there; a `BRANCH` brand edits once at Brand level and it writes down to every Outlet, whose fields go read-only. Read-time resolution was deliberately rejected as the version that generates "why is this outlet on 6%" tickets forever. The settings it covers, the ones that stay per-Outlet regardless (address, hours, tax, holidays, float) and the ones that stay Brand-level regardless (subscription, catalogue, customer list, marketing) are all listed under Configuration Settings. **Round 7's "commission is Outlet level only" is refined, not reversed** — still one pair of rates in effect per Outlet, just typed once on a branch operation

**⚠️ Two reversals of my recommendations, both saying "Meikigo computes, humans decide"**
✅ **⚠️ STATUTORY RATES ARE THE MERCHANT'S, NOT MEIKIGO'S** — *"we dont want to take the risk to change the rates, let each outlet/brand configure themselve."* Commercially sound: a wrong rate maintained centrally would be Meikigo's liability across every merchant at once. ⚠️ **But one part of this does not survive contact with reality, and it is flagged rather than silently implemented: EPF is a percentage a merchant can type; SOCSO and EIS are wage-band tables of several dozen rows each.** Nobody is transcribing a SOCSO schedule. **Recommended, preserving the merchant's decision intact: Meikigo ships the published tables as pre-filled starting values marked "verify with your accountant", the merchant owns and may edit every value, and Meikigo warrants nothing.** If the tables are genuinely to start empty, payroll must **refuse to run** rather than compute zero deductions — a payslip showing RM0 EPF looks correct and is not
✅ **⚠️ NO AUTOMATIC PRORATION AND NO AUTOMATIC ABSENCE DEDUCTION.** A barber who joins on the 15th appears at **full salary**, and the admin adds a **manual deduction line** — *"admin can add deduction RM1000 manually"*. Absences are recorded and never deducted automatically. Both reverse my recommendations, and together they form a coherent principle: the system computes the standard figure, a human makes every judgement call. **Consequence: manual adjustment lines (type, amount, mandatory note) are core payroll functionality, not a convenience** — they are how every real exception is handled. ⚠️ **Recommended guard, since the risk now runs the other way:** the draft flags anyone whose start or deactivation date falls inside the period, with the suggested figure calculated but never applied

**Payroll, now fully specified**
✅ **EIS is computed** alongside EPF and SOCSO, and **employer-side contributions are shown** separately from employee deductions — the owner sees what an employee actually costs
✅ **⭐ The run is `DRAFT` → `CONFIRMED` → `LOCKED`** — *"we will always have draft for payroll to get approval from accounting to verify the numbers."* Nothing is emailed and no figure is frozen until Confirm; after Confirm there is **no re-run, no re-send, no delete**, and a mistake is corrected as an adjustment line next month. Rates, pay rates, attendance counts and adjustments are **copied onto the payslip** at Confirm, so no later settings edit can rewrite history. One confirmed run per Outlet per period
✅ **The payslip PDF is password-protected**, recommended as the employee's last 4 IC digits — the password is never printed in the covering email
✅ **A missing email address does not block the run** — the merchant downloads and hands over that payslip. Merchant's note recorded: *"It is impossible for barbers have no email address"*; the fallback stays anyway, because one bad record must never stop a payroll month
✅ **Employee payroll fields confirmed in full** — IC number and start date **required**, EPF/SOCSO/income-tax numbers and bank details optional. ⚠️ Flagged: this is sensitive personal data about employees, and *recommended Admin-only visibility* rather than exposing salaries and IC numbers to every manager
✅ **Whether tips attract EPF/SOCSO is a merchant setting** — *"Each outlet/brand can configure this"*, at the brand-type level. Default off (pass-through, not wages). ⚠️ The setting text must not read as tax advice; the payslip must show tips as their own line and store which treatment was applied
✅ **"Mark tips paid" exists on every tier** — closing the gap Round 10 created by routing tip payouts through a PRO-only payroll run. Automatic on PRO, a small manual screen below it

**Attendance — a correction worth taking seriously**
✅ **⭐ The roster generates MONTHLY *or* WEEKLY, and off-days are flexible** — *"In retail, it is very hard to maintain fixed off days for employee by month."* So the stored off-day pattern is **a seed, not a rule**: it pre-fills generated rows and any day can be flipped up until the period is paid. An employee with no fixed pattern is fully supported. *Recommended UI: a grid, employees down, days across — a roster is edited by looking at the whole week at once*
✅ **Attendance runs on ALL PAID TIERS, not PRO-only** — payroll consumes it on PRO, everyone else gets the record. Not on FREE
✅ **Marked by the Admin role only**, in `meikigo-merchant`, not on the POS — a cashier who can mark colleagues present is a payroll control failure

**Approvals — the QR is dropped**
✅ **⭐ THE APPROVAL QR IS REPLACED BY AN ADMIN APPROVAL PASSWORD.** The three buttons become **Notify Admin via System / Notify Admin via Email / Enter Admin Password**, and the new secret **must differ from the Admin's login password** — *"Admin Approval Password should be different Admin login passwornd."* That distinction is the point: an approval password gets typed in front of a cashier, and if it were the login password every cashier would end up holding an Admin login. ⭐ **Recommended firmly: make it per-ADMIN-ACCOUNT, not per-Outlet** — an approval flow exists to record *who* approved, and a shared outlet secret can only record *that someone with the password* did. ⚠️ Also recommended: consolidate with the Round 6 Outlet-level override password — **✅ ADOPTED IN ROUND 12: the Outlet password is retired and the per-Admin approval password is now the single authorisation secret in the product**
✅ **Counter overrides stay on a password** — *"Just password, we not responsibility the password leak."* The shoulder-surfing risk is stated once, accepted by the merchant, and mitigated cheaply by making the secret per-Admin, prompting rotation, and keeping the approvals history visible to the Brand admin

**Governance and the counter**
✅ **⭐ The access report gets a second reviewer** — support reads the whole team's report, and **one person above support reads the support team's own access monthly**. The self-review hole flagged in Round 10 is closed. Build consequence is small: the report needs a filter by staff member and role, so it is two views of one report
✅ **CASH IS A FIRST-CLASS PAYMENT METHOD ON EVERY TIER, INCLUDING FREE** — the day-close formula is arithmetically impossible without it, and a FREE solo barber takes mostly cash. Lifted out of the HitPay KIV list, since cash never touches a gateway

### Round 11B — Counter Money, Malaysian Tax Compliance & the Barber Profile

> **⚠️ Provenance note, so this is not confusing later.** A **second, parallel Round 11 question set** was written and answered alongside the one above. Most of it covers ground the first set never touched — cash rounding, receipt numbering, refund method, SST registration, the barber profile — and all of that is folded in below. **Four answers, however, contradict decisions already recorded in Round 11.** Those are listed at the end of this section and need one line from the merchant to settle; nothing has been silently overwritten.

**⭐ Three Malaysian compliance gaps that were not in the spec at all**
✅ **⭐ CASH ROUNDS TO THE NEAREST 5 SEN; card and e-wallet are charged exact.** Malaysia has no 1 sen coin, so a RM38.42 cash total cannot physically be paid. Without this rule the drawer is wrong on **every** cash sale and day close reports a variance every single day — and a variance that always appears is one nobody reads. Round the **total** after tax, never the line items; store the ±2 sen as its own `rounding_adjustment` so day close reconciles, the accounts carry a rounding gain/loss, and the tax base is untouched
✅ **⭐ EVERY SALE GETS A SEQUENTIAL RECEIPT NUMBER** — `KEPONG-2026-000148`. Per Outlet, restarting each January. There was previously only a database ID, which no accountant and no e-Invoice reference can use. ⚠️ **The number must be gapless**: allocate on completion rather than on cart creation, keep a voided sale's number rather than recycling it, and make allocation concurrency-safe — a hole in the sequence looks like a deleted sale, which is exactly the suspicion an audit trail exists to prevent
✅ **⭐ SST REGISTRATION IS PER OUTLET, AND AN UNREGISTERED SHOP SHOWS NO TAX LINE AT ALL.** The system had per-Outlet tax settings but no way to say *"this shop is not in the tax system"* — so the default behaviour would have had small barbershops displaying service tax they have no right to charge, **which is an offence**. New fields: `sst_registered` and `sst_registration_number`, effective-dated, because a shop that registers in June has untaxed receipts from January to May and both are correct. Not a zero tax line — **absent**

**Money at the counter**
✅ **A refund ALWAYS goes back the way the customer paid** — card to card, cash from the drawer, cashier does not choose. Cash-refunding a card sale is one of the oldest ways a shop loses money. ⚠️ A card refund is not instant; the receipt must say so or the shop gets a phone call the same afternoon
✅ **⚠️ NO TENDER SPLIT — one Transaction, one payment method.** A customer cannot pay part cash and part card on one bill. **This is NOT the same as Round 3's group split payment, which survives untouched** — five customers each paying their own share produces five separate Transactions, each with one method. The words are nearly identical and someone reading "no split payment" in isolation would delete the wrong feature
✅ **Commission is still NOT clawed back on a refund** — reaffirmed deliberately now that commission reaches a real payslip, so it is a decision rather than an oversight
✅ **The upgrade advisor is confirmed**, along with mid-cycle proration and no refund on removal

**The customer-facing gap**
✅ **⭐ THE BARBER PROFILE — designed under delegation** (*"Name, rating, photo, description, specialities and many more. You decide."*). Choosing a barber has been **compulsory since Round 6**, yet the system held a name and a star rating, so customers were picking from a list of names with nothing to go on. Specified: display name (separate from the payroll legal name), **photo**, short description, **specialities drawn from the Round 7 skills already recorded**, years of experience, rating **with review count**, **price-from** — necessary, not optional, since pricing is per barber and a customer who cannot see it gets a surprise at the counter — and **next available**, fed by the per-barber projections that already exist. ⚠️ Three things flagged: **no moderation before publication** (consistent with the marketing-content position, with reactive removal from `meikigo-admin` instead), **an employee's photo is personal data they did not upload themselves** so a consent acknowledgement belongs at upload, and **a departing barber's photo must come down** with their deactivation
✅ **Queue numbers reset daily, per Outlet** — reconfirmed, and the existing start-at-1000 is the better choice than starting at 1. Explicitly *not* the same thing as the receipt number

**Attendance and payroll refinements**
✅ **⭐ ATTENDANCE IS ENTERED IN BULK — by day, week or month — not clicked day by day.** *"Both options are not reasonable to manage attendance data daily for each employee. Merchant may have manual punch card system."* The generated table stays as the underlying record; bulk entry writes into it. ⚠️ **Flagged: the answer asks for total HOURS, but no pay type uses hours** — daily wage is priced per *day*. Specified as capturing **both**, with `days_worked` as the figure payroll consumes. If an hourly pay type is genuinely wanted, that is a fourth `pay_type` and is cheap now, expensive later
✅ **⚠️ LEAVE TYPES ARE ADDED NOW** — annual, sick and unpaid, overruling the recommendation to defer them. `ABSENT` is kept and now means absent *without* leave. Paid leave does not reduce pay; unpaid leave and absence are surfaced on the payroll draft as a prompt and **never deducted automatically**, consistent with the Round 11 principle. ⚠️ **This records leave TAKEN, not leave ENTITLEMENT** — no balances, no accrual, no carry-forward, no approval workflow. It answers *"why was Ali out on the 14th?"*, not *"has Ali used up his annual leave?"*
✅ **Payroll needs approval before it is final, with self-approval recorded as such where a shop has one Admin** — the same shape as the stock approval, and compatible with the `DRAFT → CONFIRMED → LOCKED` flow already recorded
✅ **EIS computed; employer-side contributions shown separately; payslip PDF password-protected; one platform-wide SMTP on `meikigo.com`** — all four match what Round 11 already recorded, so they are confirmations rather than changes

**✅ ALL FOUR CONTRADICTIONS WERE SETTLED IN ROUND 12 — kept here for provenance**
✅ ~~Add-on prices~~ — **settled by changing the shape of the answer: prices become a PER-PLAN RULE TABLE in `meikigo-admin`.** Both tables become rows in one matrix rather than rival answers. See Subscription & Billing
✅ ~~Tips below PRO~~ — **settled: the "mark tips paid" action exists on every tier**, including FREE. Round 12 delegated the choice back to me and it goes to the version that keeps the number true
✅ ~~Who owns the statutory rate tables~~ — **settled: a Meikigo-maintained DEFAULT TEMPLATE that the Merchant Admin must review and VERIFY before payroll can run.** Meikigo carries the effort, the merchant carries the responsibility
✅ ~~The access report's second reviewer~~ — **settled: one person above support reads the support team's own report each month.** The self-review hole is closed

### Round 12 — The Contradictions Closed, and PRO Given a Definition

> The round that cleared the wreckage of two parallel question sets. All four disagreements are settled, and three of them landed on a better answer than either original option. It also added a **fourth pay type**, retired a password, and finally defined what PRO actually sells.

**The four contradictions, all resolved**
✅ **⭐ ADD-ON PRICES BECOME A PER-PLAN RULE TABLE** — *"All pricing for add-on can be configure in admin meiki… [Select package] Plus [1] outlet Equal to RM[xx]. All the adds on package can be exist together."* An add-on price is now a rule keyed to plan, add-on type and quantity, so the same outlet can cost one price on STARTER and another on PRO. Neither earlier table wins; both become rows. ⚠️ **The numbers are still not set, and this makes the marketing-site duplication worse — a grid is harder to keep in step than a single figure**, which strengthens the case for the public pricing endpoint. **Recommended matrix proposed: RM45 outlet on STARTER and PLUS** (both upgrade boundaries land correctly on it) **and RM39 on PRO** (nothing left to upgrade to, so reward expansion)
✅ **"Mark tips paid" exists on every tier, FREE included** — delegated back to me, and this is the version that keeps the figure honest. A balance that can never be cleared is worthless within two months
✅ **⭐ STATUTORY RATES: A MEIKIGO DEFAULT TEMPLATE, VERIFIED BY THE MERCHANT.** *"System is expected to generate payroll template with default deduction amount which configure by Meikigo Admin… Merchant Admin must to review and verify the structure."* This is a better answer than either original option: Meikigo maintains the master tables so nobody keys in a 30-row SOCSO schedule, the merchant's copy is theirs and they must **verify it before payroll will run**, and template updates arrive as a **diff to accept** rather than a silent overwrite. Effort sits with Meikigo, liability sits with the merchant
✅ **SOCSO and EIS tables ship PRE-FILLED**, marked as published rates to confirm with an accountant — the same answer arriving from the other direction
✅ **One person above support reads support's own access report monthly** — the self-review weakness flagged in Round 10 and again in Round 11B is now closed

**⭐ A fourth pay type**
✅ **⚠️ HOURLY PAY IS ADDED** — `pay = hours × hourly_rate`. The gap raised was that attendance captured hours no pay type consumed; the answer was to add the pay type rather than drop the hours. ⚠️ **This changes the weight of the attendance table: a bulk-typed monthly hours figure is now somebody's actual pay**, so the entry screen must show the resulting amount as it is typed. ~~**Overtime is NOT modelled**~~ — **⛔ REVERSED IN ROUND 13: overtime IS calculated, to the Employment Act rules** (1.5× / 2.0× rest day / 3.0× public holiday, 8-hour day and 45-hour week, 104-hour monthly ceiling). See Payroll → Overtime

**⭐ One password for everything**
✅ **⭐ THE APPROVAL PASSWORD IS PER-ADMIN, AND IT REPLACES THE ROUND 6 OUTLET OVERRIDE PASSWORD ENTIRELY.** There is now **one authorisation secret in the product**, belonging to an Admin account, covering stock approvals, discounts, voids and refunds alike. The shared Outlet-level password is retired. **Every override in the system now names a person** — which the shared password could never do. ⚠️ One consequence to design for: a cashier can no longer complete a refund alone once they have learned a shared secret; an Admin must actually be reachable

**Payroll finished off**
✅ **The payslip PDF password is resettable by the merchant Admin**, who can then re-send — barbers have no login, so there is no self-service route back in
✅ **A one-person shop may self-confirm its own payroll**, recorded as self-confirmed, exactly as stock approvals already work
✅ **Leave balances stay out of Phase 1** — leave *types* are recorded, entitlement is not, and it arrives with the Phase 2 punch card

**⭐ Two new features these answers created**
✅ **⭐ A DAILY WORK SUMMARY EMAIL TO EACH BARBER at day close** — *"So, we can ensure integrity and fairness for barber."* Barbers still get no login, but the merchant closed the integrity gap another way: until now the only person who could see a barber's commission and tips was the person paying them. Each barber gets their own figures only — clients served, commission, tips, aggregate rating activity — on the transactional stream, using the email address payslips already made mandatory. **The third scheduled email in the product.** ⚠️ It also means an incorrectly-attributed ticket now surfaces within hours rather than at month end, which is the point
✅ **⭐ THE PRICE IS FIXED WHEN THE CUSTOMER COMMITS, not when they pay.** A ticket taken at 10am for a RM30 cut pays RM30 even if the price rises before service; a booking honours the price when it was made. This **extends snapshotting one step earlier in the flow** than it previously reached — tickets and bookings now snapshot price, barber and tax treatment, and the sale inherits from the ticket. Services added mid-cut are priced at the counter, since they were never quoted earlier

**PRO finally has a definition**
✅ **⭐ SLA SUPPORT AND DEDICATED ONBOARDING — specified under delegation.** Both had been sold at RM329 with no meaning behind them. Defined as: **response-time promises only** (P1 shop-down 2 hours, P2 1 working day, P3 3 working days), **support hours matching barbershop hours — proposed Mon–Sat 9am–7pm; ⚠️ AMENDED IN ROUND 13 TO EVERY DAY 9am–6pm**, an in-app ticket form that carries Brand/Outlet/plan context automatically, and a priority flag that sorts PRO to the top. Onboarding: a named contact for 30 days, one scheduled 60-minute setup session, **assisted data import**, a go-live check and a day-30 follow-up. ⚠️ **Deliberately refused: uptime SLAs, resolution-time promises, and a WhatsApp channel** — none can be honestly kept or measured yet. **Recommended additions to PRO, all cheap because the data exists:** a merchant-visible audit log (strongest), scheduled emailed reports, custom branding on customer-facing pages, data export/read-only API, and an included add-on allowance — **✅ four of the five adopted in Round 13; custom branding rejected**
✅ **A barber never sees their own numbers in the product, and that stands** — the daily email carries them instead. No barber login, again

**Confirmations**
✅ **The franchise/branch settings list is correct as drafted** — all three buckets confirmed without changes
✅ **Barber photos: both the merchant AND Meikigo can remove one**, with customer reporting raising it to Meikigo. Merchant-side handles the ordinary case; Meikigo-side exists for when the merchant *is* the problem
✅ **A consent checkbox is required at photo upload** — *"I confirm this employee agreed to their photo being shown publicly"* — stored with the image, and **upload is blocked without it**
✅ **⚠️ ONE PHONE NUMBER, ONE ACCOUNT.** Duplicates are blocked. This keeps the cashier's lookup unambiguous, at the cost that a household sharing one phone cannot hold two accounts — mostly absorbed by the Round 7 family design, where a parent adds a line to their own ticket. **Numbers must be normalised before comparison**, or the constraint quietly does nothing

**Deferred to Round 13 at the merchant's request — ✅ NOW ANSWERED**
✅ ~~**What happens when a Brand switches from FRANCHISE to BRANCH**~~ — *"Does this means downgrading? give example. circle back this question on next round"*. **Answered in Round 13: it is not a downgrade, and the switch is allowed with a full before/after preview, a typed confirmation and an audit row.** See Configuration Settings → Switching brand type

### Round 13 — Launch Unblocked, Overtime Reversed In, and PRO Made Real

> The round that cleared the last launch blocker. Every add-on now has a price on every plan, the marketing site stops holding its own copy of them, and PRO gained four features and a support promise with hours behind it. It also **reversed a Round 12 decision** — overtime is now calculated, not left to a manual line — which is the largest single addition to payroll since payroll came back.

**⭐ Launch is unblocked**
✅ **⭐ THE ADD-ON PRICE MATRIX IS CONFIRMED — outlet RM45/RM45/RM39, barber RM15/RM15/RM12, staff RM10/RM10/RM8, login RM15/RM15/RM12, catalog pack RM9 flat, marketing blast RM49/RM49/RM39** (STARTER/PLUS/PRO), yearly = monthly × 10, `FREE` buys none. **RM45 is the load-bearing figure**: STARTER + 2 outlets = RM199 = exactly PLUS, and PLUS + 3 outlets = RM334, just past PRO. ⚠️ **This deliberately reverses the Round 11 reasoning** that priced the outlet at RM39 to keep two-outlet shops on STARTER — the intent is now that the second outlet is an upgrade conversation
✅ **⭐ THE MARKETING SITE STOPS HARDCODING PRICES.** `meikigo-api` exposes a public pricing endpoint and `meikigo-marketing-site` reads it at build time with revalidation. This retires the Round 9 two-step workflow whose second step ("then change the hardcoded value and redeploy") was the one guaranteed to be forgotten — and it mattered more once prices became an eighteen-cell grid, because a **partially** updated grid is harder to notice than a stale single number

**⭐ The Round 12 re-ask, answered**
✅ **⭐ FRANCHISE → BRANCH IS ALLOWED, WITH A FULL BEFORE/AFTER PREVIEW AND A TYPE-THE-BRAND-NAME CONFIRMATION, LOGGED.** It is **not** a plan downgrade — the plan, price and caps are untouched; only *where a setting is typed* changes. The worked example that made it land: Kepong 5%, Ipoh 4%, JB 6% become one Brand rate, so two of the three are overwritten and unrecoverable. **Recommended addition: a 24-hour undo**, since the audit row already holds the old values

**⭐ PRO finally has substance, not just ticks**
✅ **⭐ SUPPORT IS EVERY DAY, 9am–6pm** — *"d. Everyday 9am-6pm"*, which was neither option offered and is better than both: no dead day, at the cost of one hour. ⚠️ **63 hours of cover a week is a rota, not a person** — at least two people, plus a holiday and sickness plan, or the promise breaks in its first week. **Recommended: public holidays are covered**, because a public holiday is a barbershop's trading day
✅ **⭐ FOUR OF THE FIVE PRO EXTRAS ADOPTED — merchant-visible audit log, scheduled emailed reports, data export / read-only API, and an included add-on allowance. Custom branding is rejected**, which was the only cosmetic item and the only one touching every customer-facing template. ⚠️ **The allowance quantity is unset** — recommended 2 extra outlets, modelled as granted units rather than a discount
✅ **ASSISTED ONBOARDING IS A GUIDED SCREEN-SHARE, not data entry by Meikigo** — *"assist using online tool like google meet… merchant can share the screen and we will guide there"*. So **no import screen in `meikigo-admin`**, Meikigo never holds a merchant's customer spreadsheet, and the merchant leaves knowing how to do it again. ⚠️ **But it needs something to guide them through**: recommended a CSV/XLSX import in `meikigo-merchant` for customers, services and staff, on every paid tier
✅ **⭐ A NEW FEATURE FOR EVERY PLAN: SCHEDULED MARKETING BLASTS** — daily, weekly, monthly, one-off. ⚠️ **This collides head-on with the Round 9 one-blast-per-week cap and the collision must be resolved before build.** Recommended: the cap wins, `DAILY` is only selectable where Meikigo has raised that Brand's cap. **Consent and unsubscribe must be evaluated at send time, never snapshotted at schedule time**, or the scheduler mails people who have opted out — a PDPA problem rather than a bug

**⭐ Payroll — a reversal and four closures**
✅ **⚠️ ⭐ OVERTIME IS CALCULATED AFTER ALL — *"B, follow Malaysia law rule"*.** Round 12 left it as a manual line; Round 13 puts the Employment Act rules in the product: **1.5×** beyond normal hours, **2.0×** beyond normal hours on a worked rest day, **3.0×** on a worked public holiday, normal hours **8/day and 45/week**, the **104-hour monthly ceiling** (warn, never block), and the monthly **÷26** ordinary-rate divisor. The multipliers live in the **same merchant-verified template** as EPF/SOCSO/EIS, so the liability split is unchanged — Meikigo carries the effort, the merchant carries the responsibility. ⚠️ **What it costs: attendance must now record `overtime_hours` separately and must be able to say a rest day was *worked***, and **`COMMISSION_ONLY` has no ordinary rate of pay**, so overtime has no arithmetic on that pay type until a basic wage or an explicit overtime basis exists
✅ **PCB IS A STANDING MONTHLY AMOUNT** on the employee record, effective-dated, overridable per draft. ⚠️ It is also a figure that silently goes stale, so the draft should show when it was last changed
✅ **⭐ ONE STATUTORY TEMPLATE PER BRAND, NOT PER OUTLET** — SOCSO does not change between Kepong and Ipoh. This is a **deliberate exception to the brand-type rule** and it corrects the Round 11 list, which had put statutory rates in the per-outlet-on-franchise bucket. On a franchise brand, franchisees now share one table verified by the Brand admin, so the screen must name who verified it and when
✅ **CONFIRM IS BLOCKED WHERE ATTENDANCE IS MISSING — but only for `DAILY_WAGE` and `HOURLY`**, where the attendance figure *is* the pay. The draft still generates for everyone. **Zero days entered deliberately passes; nothing entered does not** — the two states must be distinguishable in the data, and the block must name the people rather than the problem
✅ **A STATUTORY RATE CHANGE ARRIVES AS A PERSISTENT IN-APP BANNER PLUS AN EMAIL TO THE BRAND ADMIN, AND DOES NOT BLOCK PAYROLL.** Dismissal is recorded. ⚠️ Once a diff's effective date has passed, the payroll draft should say so next to the figures it affects — informational, unmissable, still not blocking

**⭐ The barber daily email, finished**
✅ **ON BY DEFAULT, WITH A PER-OUTLET TOGGLE** — and switching it off is an audited action, since the feature exists so barbers can check the figures the person paying them produced
✅ **NOTHING SENDS ON A DAY A BARBER DID NOT WORK**
✅ **⭐ IF THE DAY IS NEVER CLOSED, IT STILL SENDS AT MIDNIGHT, MARKED *"day not closed — figures may change"*.** Sends **once**, with no corrected re-send. A missing email looks like hidden money, and two emails with different numbers is worse than one honest provisional figure

**⭐ The one approval password, finished**
✅ **A FORGOTTEN APPROVAL PASSWORD RESETS TWO WAYS — a single-use link to the Admin's own email, or a force-reset by another Brand Admin that clears it and triggers that same email flow** (so no Admin ever learns another's secret). Both audited. ⚠️ **The reset must not be reachable from the POS approval prompt**, or a cashier standing at the counter can start one, and the whole control is gone
✅ **⭐ A REFUND WITH NO ADMIN PRESENT BECOMES A PENDING REFUND REQUEST** — same machinery as the stock approval. **No money moves and no status changes while it is pending**; the sale stays `COMPLETED` and nothing is reversed at HitPay until approval. The customer leaves with a **printed reference**, not a verbal promise. ⚠️ Pending refunds need chasing — on the day-close screen, on the dashboard, and by daily email — because an open one is a customer expecting money and a liability nobody recorded

**⭐ Commission, two answers that both add configuration**
✅ **⭐ THE DISCOUNT/COMMISSION BASIS IS NOW A SETTING PER BRAND/OUTLET** — *"Each brand/outlet can configure it"* — with the Round 7 counter popup **kept as a per-transaction override, pre-filled from it**. Recommended default: commission on the **discounted** amount. Both earlier answers survive: a shop with a settled policy stops thinking about it, a manager who wants an exception still has one
✅ **⭐ A PRODUCT-ONLY SALE STILL PAYS NOBODY AUTOMATICALLY, BUT AN ADMIN CAN ADD COMMISSION BY HAND AT CHECKOUT** — *"maybe the customer come because of one of the employee/barber promote at outside"*, which no automatic rule could infer. It needs the acting Admin's approval password, a named employee, a reason, and — because it is the one commission path with no arithmetic behind it — **separate reporting from earned commission**. Also confirmed: **`commission_enabled` is a per-item flag** on products and services, which is not a return to per-item *rates*

**Confirmations and one tier reversal**
✅ **LOYALTY POINTS ARE FORFEITED ON ACCOUNT DELETION** — confirmed, with the forfeiture written to the ledger rather than silently zeroed, and the client warned with the actual number before they confirm
✅ **⚠️ TAX DOCUMENT EXPORT IS PLUS AND PRO ONLY** — *"Plus & Pro ONLY"*, reversing the Round 7 reading that put it on every tier including FREE. The Round 6 phrasing meant *no separate PLUS/PRO variant*, not *available to everyone*. ⚠️ **Consequence, stated once:** a STARTER shop pays RM109 and cannot produce an accountant pack from data it already owns. That is the tier boundary working, and it is also the most likely support question from a paying merchant — the pricing page and the trial-ending email must both be unambiguous about it

### Round 14 — Blasts Repriced, Data Import Built, and the Counter Slowed Down

> The round that changed how marketing is sold. The one-blast-per-week rule is gone and merchants now buy **email tokens** instead — which unblocked the daily-schedule conflict but reopened the pricing page, since a token has no price yet. It also built the data-import feature the Round 13 onboarding answer needed, and overruled me twice: exchanges now wait for approval, and manual commission has no ceiling.

**⭐ Marketing is sold a completely different way now**
✅ **⭐⭐ THE WEEKLY BLAST CAP IS REMOVED. MERCHANTS BUY EMAIL TOKENS — 1 token = 1 email.** *"remove one blast per brand per week rule… they buy a token, 1 token = 1 email. They can blast anytime they want."* A blast to 800 customers costs 800 tokens. Send as often as you like, for as long as you have paid. This dissolves the Round 13 daily-vs-weekly conflict completely — `DAILY` needs no special permission any more
✅ **A send is refused whole if the balance is short — never partially sent.** Mailing 300 of 800 customers and stopping is worse than not sending, because nobody knows who got it. The balance is checked at schedule time and again at send time
⚠️ **This reopened the pricing page.** The flat RM49/month marketing add-on was confirmed in Round 13 and is the exact opposite of a per-email token, so it is **replaced**. **The token price is not set — it is now the only empty figure left before launch.** For reference: a shop with 800 customers sending twice a month is 1,600 emails, so ~RM0.03 a token lands near the old RM49. **Recommended: sell in packs (1,000 / 5,000 / 20,000), no expiry, non-refundable, non-transferable**
⚠️ **One of the four deliberate anti-spam protections is now gone.** Round 10 recorded them as load-bearing precisely because Meikigo never reviews blast content. The token price is a **better** volume throttle than a rule — a merchant paying per email has a real reason not to spam — but money does not prevent a bad send, so **per-Brand complaint/bounce auto-suspension and a per-Brand daily send limit become mandatory rather than recommended**. If our domain gets flagged, the first casualty is signup OTP delivery for every shop on the platform
✅ **FREE gets no blasts**, so it buys no tokens. Confirmed

**⭐ Bringing old data in — three answers that add up to a real feature**
✅ **⭐ BUILD THE BULK IMPORT, ON ALL PAID PLANS — with a "download our template" button.** *"A, with download template button so they can download meikigo's sheet template as well if they want to."* Customers, services, products and staff. Pick file → match columns → preview → save → **a failure report naming each bad row and why**. The template button is the cheapest support saving in the feature: a file built from our sheet barely needs mapping at all. This is also what the Round 13 Google Meet onboarding session now guides a merchant *through* — without it, that session was two people typing 400 customers one at a time
✅ **⭐ AN IMPORTED CUSTOMER IS A LIGHT RECORD, NOT AN ACCOUNT** — name, phone, maybe email; no password, no login, no OTP. It holds loyalty and is findable at the counter, and **it joins to a real account by phone number** when that person signs up themselves. Nothing new needed: it is the Round 7 counter-created customer arriving by spreadsheet. **An import never overwrites** — a duplicate phone number is a failed row in the report, always
✅ **⚠️ THE MERCHANT DECLARES MARKETING CONSENT FOR IMPORTED CUSTOMERS** — option (b): a tick box, *"I confirm these customers agreed to receive marketing"*, stored with who ticked it and when. ⚠️ **This is the second protection loosened in one round**, and a declaration is only the merchant's word while the consequence lands on the shared sending domain. **Store the consent SOURCE — `SELF_GIVEN` versus `MERCHANT_DECLARED`** — because they are different evidence and it cannot be reconstructed later. **Recommended: watch a Brand's first blast after a large import specifically**; a complaint rate several times the average is exactly the signal that a declaration was untrue, and it is detectable within one send

**⭐ Payroll, finished off properly**
✅ **AN ACCOUNTANT WILL CHECK THE OVERTIME RULES BEFORE LAUNCH.** Until that happens every figure — 1.5× / 2.0× / 3.0×, 8-hour day, 45-hour week, 104-hour ceiling, ÷26 divisor — is **provisional**, and the check itself gets a `verified_by` / `verified_at` stamp like the deduction tables
✅ **⭐ OVERTIME FOR A COMMISSION-ONLY BARBER: THE MERCHANT SETS AN OVERTIME RATE PER PAY TYPE** — *"admin of outlet/brand can configure overtime value for this type"*. One figure for all commission-only staff instead of fifteen records, following the brand-type rule, with a per-employee override recommended on top. If it is not set, overtime is **not** calculated and the draft says so — it must never silently pay zero for hours that were recorded
✅ **A WORKED OFF DAY IS A TICK BOX, NOT A NEW STATUS.** The status set stays exactly as it is, so nothing that reads it breaks; the flag plus hours selects the 2.0× or 3.0× multiplier, and a ticked off-day also counts as a paid day for `DAILY_WAGE`
✅ **⭐ NEW: A MONTHLY EPF / SOCSO / EIS / PCB TOTAL SHEET (PRO)** — *"Yes, add this page"*. The owner has to pay the government one total per contribution, and until now added fifteen payslips by hand. Generated from a **confirmed** run only, with a per-employee breakdown because the portals ask per person, exportable as PDF and XLSX. ⚠️ **Meikigo still submits nothing** — the page must say so on its face

**⭐ PRO gets its details**
✅ **SUPPORT IS OPEN ON PUBLIC HOLIDAYS, SAME HOURS** — so the promise is genuinely **365 days, 9am–6pm**. Strongest version of the commitment, and it means the rota must cover Raya, CNY and Deepavali, which is when a barbershop is busiest and staff most want to be off
✅ **THE BRAND ADMIN MAINTAINS A "TO" LIST FOR REPORT EMAILS** — *"As a brand who is pay, admin of the brand can add the 'to' list"* — so an accountant or partner can receive them. **Recommended: cap the list, log changes, confirm outside addresses once, and give every recipient a login-free unsubscribe** — an added address is a standing subscription to a shop's revenue figures
✅ **THE AUDIT LOG SHOWS 12 MONTHS ON SCREEN.** Nothing is deleted; support can retrieve older rows. Say the window out loud on the screen so nobody thinks history was thrown away

**⭐ The counter — two places I was overruled**
⛔ SUPERSEDED in Phase 1 (Round 23 Q16): exchange is implemented as **refund + new sale** (no dedicated exchange money-flow). If the returned item is resellable, its stock add-back uses the **manual inventory adjustment request** flow; any “wait until admin approves” behavior follows the existing pending-refund / manual-adjustment approval mechanisms.
✅ **⚠️ NO CEILING ON MANUAL COMMISSION.** *"No limit. The approval password and the log are enough."* So the approval password and the audit row **are** the entire control, and neither can be dropped later — there is no arithmetic anywhere that could flag a manual commission line as wrong, because by design it has no rule behind it. **Separate reporting from earned commission is now the only way an unusual pattern becomes visible**
✅ **A PENDING REFUND NEVER CANCELS ITSELF AND NAGS DAILY** — day-close screen, dashboard, and an email every day until it is approved or rejected. Rejection closes it, not time
✅ **A SALE KEYED IN DURING AN OUTAGE CAN BE REVIEWED** — *"the client still have their mobile data after all"*, which is the right observation: the shop's internet was down, not the customer's phone. ⚠️ **This is the first review not prompted by the checkout tab**, so it needs the in-app notification route and a short window (recommended 7 days), and it only works where a customer was attached to the sale
✅ **A 24-HOUR UNDO ON A BRAND-TYPE SWITCH** — the audit row already holds every overwritten value. ⚠️ **It must not silently overwrite work done in the meantime**: a setting edited after the switch should be shown and chosen, not clobbered
✅ ~~**Meikigo's cut on POS payments stays parked**~~ with the rest of the HitPay items, by instruction — **⛔ SUPERSEDED BY ROUND 19: the rate is now set, a 2% ceiling with Meikigo taking (2% − HitPay's own %) per method.** See Round 19

**Not answered, carried forward**
⚠️ **Who is on the support rota** — the answer given (*"this is entirely up to merchant, they can configure this"*) does not fit the question. A merchant can configure their own shop's hours; they cannot configure who at Meikigo answers a PRO ticket at 3pm on a Sunday. **Re-asked next round**
⚠️ **PRO's included add-on allowance** — *"i dont understand what you mean"*. Fair: my wording was too compressed. **A plain-language explanation with a worked table is now written into the PRO section**, and the question is re-asked with it attached

### Round 15 — Email Priced and Provider Chosen, the SLA Cut to Fit, Three Controls Declined

> The round that finished the pricing page. Marketing became a **monthly email allowance** instead of a pre-paid token balance, **Brevo** was named as the provider, and the PRO support promise was honestly cut from seven days to six because there is one person to keep it. Three protections I recommended were declined — a daily send limit, automatic complaint suspension, and IC masking — and each is recorded with what it costs.

**⭐ The last launch blocker is closed, and the model changed shape**
✅ **⭐⭐ MARKETING IS A MONTHLY EMAIL ALLOWANCE: RM90 / 10K, RM170 / 50K, RM400 / 100K, RM2,200 / 500K per month**, admin-configurable defaults, **1 recipient = 1 email**. **The pricing page now has no empty figures**
✅ **⭐ IT RESETS MONTHLY AND DOES NOT ROLL OVER** — *"Each month. Because we will be using brevo. The brevo pricing based on month."* Which is sound: Meikigo's cost is a monthly volume commitment, so the revenue has the same shape. **This also means the product does NOT need a pre-paid credit system** — the package is an ordinary recurring subscription line, and only a usage counter and its ledger are new. ⚠️ **Never call it a balance or a wallet in the UI** — it is an allowance, and it must show *"7,300 of 10,000 left, resets 1 August"*
✅ **The packages REPLACE the flat RM49/month fee** — no base fee for having the feature. `FREE` gets none. Unused volume is lost on cancellation, which follows from monthly expiry
✅ **System email never counts against the allowance** — OTPs, receipts, reminders, payslips, the barber daily summary and PRO reports are always sent. A shop out of marketing volume can still take bookings and pay staff
✅ **⭐ THE EMAIL PROVIDER IS BREVO** — said in passing, but it closes an item open since Round 9 (*"we do not have any provider in mind"*). It also explains the package shape. ⚠️ **Three things to do before publishing those prices:** check the resale margin against Brevo's current price list (**the RM170-for-50K tier is priced per email at about a third of the RM90-for-10K tier** — a steep discount to commit to early), decide whether transactional mail also moves to Brevo or stays separate, and put **total allowance sold vs. the Brevo plan ceiling** on an admin screen — because the failure mode is Meikigo's own account hitting its cap and stopping *everyone's* mail, OTPs included

**⚠️ Three protections declined — recorded with their cost, not argued again**
⛔ **No per-Brand daily send limit** (*"B"* — no limit at all). The monthly allowance is the only throttle
⛔ **No automatic suspension on a complaint spike** — *"No automatic stop. Show us a warning in admin and let a person decide."* A legitimate choice: a human tells an unlucky send from an abusive one. ⚠️ **But it only works if somebody is looking, and Round 15 also confirmed one support person, Monday to Saturday** — a complaint spike on Sunday morning has nobody watching. So the warning must be **pushed to a named person and repeat daily**, with a **one-click manual suspend**. **✅ Thresholds SET (Rounds 16 + 18): complaints > 0.5% or bounces > 5% of a send (≥200 recipients); small sends: 3 complaints in 30 days.** Both configurable in `meikigo-admin`.
⛔ **No IC masking** — *"Show the full IC. It is the owner's own staff."* Fair within its frame. ⚠️ **It makes Admin-only visibility the entire protection**, so the Cashier boundary must be enforced at the API rather than by hiding a field. It does not extend to Meikigo staff, who stay under the Round 8 reason-gate
⚠️ **Taken together with Round 14, three of the four deliberate anti-spam controls are now gone or weakened.** What is left: the separate sending subdomain, the paid allowance, and a human acting on a warning. **The effective backstop is now Brevo's own abuse enforcement — which acts on Meikigo's whole account, not on one Brand.** That is the strongest argument for building the pushed alert and the manual suspend switch

**⭐ The SLA is smaller and honest**
✅ **⚠️ SUPPORT IS MONDAY TO SATURDAY, 9am–6pm. Sunday and public holidays are best-effort.** *"One person only for now."* **This supersedes Round 13's every-day and Round 14's public-holidays-too** — the promise was cut to fit the people rather than the reverse, which is the right way round. **54 hours across six days still covers Saturday**, the day a barbershop least affords to be down. Extend it when a second person exists; **do not advertise the extension before the rota exists**. ⚠️ One person is still a single point of failure — name an internal P1 fallback and say nothing about it publicly

**⭐ Import finished, and narrowed**
✅ **⭐ OPENING LOYALTY POINT BALANCES CAN BE IMPORTED** — the answer that makes the whole feature worth building. A shop arriving from a paper card keeps its loyal customers' balances instead of resetting everyone to zero. Written as an explicit `OPENING_BALANCE_IMPORT` ledger entry, **never as earned points**, with the batch and uploader on it. ⚠️ **Tell the merchant plainly that every imported point is a free haircut they have agreed to honour** — a decade of unredeemed points is a real liability
✅ **⛔ NO HISTORY OF ANY KIND** — *"Nothing at all. Only name and phone."* Not sales, and not even the visit-count and last-visit fields I proposed as a middle path. **Meikigo's financial history is never written by a spreadsheet**, which is the right instinct. ⚠️ Expect the cosmetic consequence at the counter: a five-year customer shows *"0 visits"* until they transact here
✅ **NO ROW LIMIT** — *"C"*. ⚠️ **Which makes the import a queued background job rather than a web request**: chunked, with progress, a completion notification, and a file-size guard instead of a row count. A half-finished 40,000-row import is the worst possible outcome
✅ **No accountant login** — the accountant gets files and a place on the report "to" list. The role model stays Admin / Cashier / read-only display, unchanged since Round 7

**Confirmations and closures**
✅ **⛔ NO FREE ADD-ON UNITS ON PRO** — *"A"*. 20 outlets, then RM39 each. Simpler product, and it deletes a whole billing concept (granted units) plus the *"is it 20 or 22?"* support question
⛔ SUPERSEDED in Phase 1 (Round 23 Q16): exchange “approval setting” is deferred. Cashier implements exchange as **refund + new sale**, and any resellable-return stock add-back is handled via **manual inventory adjustment requests** (using the existing manual-adjustment approval rules).
✅ **A review of an outage sale is open for 7 days**, then gone
✅ **A public score appears at 5 ratings** — below that, show *"New — not enough ratings yet"* rather than a blank space, and the threshold applies per rated thing, so a new barber at an old outlet has their own count to reach
✅ **English only at launch** — Bahasa Malaysia later. **Externalised strings therefore become a requirement rather than a suggestion**, and the ones that hurt most to retro-fit are the email templates, the printed receipt and validation messages
✅ **⛔ MEIKIGO STAFF ACCESS RECORDS STAY INTERNAL** — *"B"*. The reason-gate and its log are unchanged; they are simply not shown to the merchant. The PRO audit log remains merchant actions only
⏸️ **The Terms of Service and privacy notice are ON HOLD by instruction** — *"Not now. Wait for my command. do remind me again when the document completed."* Recorded as a reminder I owe, to be raised when this requirements document is finished. ⚠️ Worth knowing while they wait: both apps collect personal data from day one, and a lawyer takes time to reply

### Round 16 — Blasts Built In-House, the Desk Made Real, and a Wizard for Day One

> A round of consequences rather than reversals. The email tiers were re-cut to start at 1,000 and the prices deliberately left to admin configuration. Brevo became the pipe rather than the product — Meikigo builds its own composer. The support desk got the two things that make an SLA measurable. And the emptiest screen in the product finally got an answer.

**⭐ Email — the shape settled, the prices left open on purpose**
✅ **⭐ FIVE TIERS: 1K / 5K / 10K / 50K / 100K emails a month. 500K is dropped. No prices are recorded in this document** — *"The pricing is dynamic we can configure it meikigo-admin. So dont worry about the pricing."* The Round 15 figures are **withdrawn as illustrative**. ⚠️ **Somebody must still type the numbers in before the pricing page publishes** — that is now a configuration task on the launch checklist, not a spec gap
✅ **Starting at 1K is the better shape for this market** — a 300-customer shop sending twice a month needs 600 emails, and the old 10K floor charged them for sixteen times what they use. ⚠️ **One piece of guidance for whoever prices them:** in the withdrawn draft the 50K tier worked out **cheaper per email than both 100K and 500K**, so a large brand was better off buying ten small packages. **The per-email price must fall as the tier grows, and the price editor should warn when it does not**
✅ **⭐ MEIKIGO BUILDS ITS OWN COMPOSER — the merchant never sees Brevo.** Brevo becomes a sending pipe, not a product surface. **No customer lists are ever uploaded into Brevo**: the audience is resolved in `meikigo-api` at send time and messages go out individually. Three reasons, and the first is the real one — a merchant's customer list stays in one place, so there is no second copy of personal data to protect, keep in step, and delete on request. It also keeps the allowance count truthful and consent correct at the moment of sending. ⚠️ **The price: Meikigo now owns the composer, preview, audience builder, unsubscribe page and per-blast reporting**
✅ **BOTH email streams go through Brevo**, strictly split — marketing from `news.meikigo.com`, transactional from `mail.meikigo.com`, **separate identities and separate API keys**. ⚠️ **One vendor now carries everything**, so a Brevo outage stops OTPs, receipts and payslips as well as promos. **Recommended: keep a second SMTP configuration ready for the transactional stream** — the settings screen already stores credentials, and with no SMS anywhere in Phase 1, OTP delivery has no other safety net
✅ **⭐ BLAST AUDIENCE FILTERS: all customers / has not visited in X days / visited in the last X days.** The win-back email is the one blast that reliably brings money into a barbershop, and the last-visit date already exists. Consent-plus-transacted still sits on top of every filter and can never be widened. ⚠️ **Show the recipient count and the remaining allowance before the send button** — a filter returning 4,000 people quietly costs 4,000 emails
✅ **⚠️ BLASTS COME FROM THE SHOP'S NAME, WITH A NO-REPLY ADDRESS.** Normal practice, but it creates one real problem: a barbershop customer *will* reply to ask about a price, and that message vanishes. **So the footer is mandatory, not decorative** — outlet phone number, address, booking link, and one line saying the mailbox is not monitored. **The unsubscribe link must be prominent**, because a customer who can neither reply nor unsubscribe presses "spam" instead, which is the number we now warn on. *Recommended for later: one optional reply-to field per Brand*

**⭐ The support desk finally has the two things an SLA needs**
✅ **THRESHOLDS SET: complaints above 0.5%, bounces above 5% of a send** — configurable, measured per send and per Brand over 30 days, with rates only meaningful above ~200 recipients
✅ **THE ALERT IS EMAIL ONLY**, repeating daily until acted on. **Recommended firmly: send it to a monitored address, not one person's inbox** — with a single support person, an alert in a personal mailbox during their leave is an alert nobody reads. ⚠️ Support is Mon–Sat, so a Sunday-morning complaint spike is seen on Monday, and Brevo may act first
✅ **⭐ THE MERCHANT PICKS THE SEVERITY FROM PLAIN DESCRIPTIONS; MEIKIGO MAY RE-GRADE WITH A REASON AND MUST TELL THEM.** Both halves matter: without re-grading, every ticket is a P1 and the 2-hour promise is meaningless; with a *silent* re-grade, a merchant finds out on Wednesday that Monday's urgent ticket was quietly demoted. The clock re-computes from the change, and both grades stay on the record
✅ **EVERY TICKET GETS AN INSTANT ACKNOWLEDGEMENT, INCLUDING OUTSIDE HOURS** — reference, support hours, and the **date the reply is due**, computed from severity and the support calendar. A ticket filed at 8pm Saturday would otherwise sit in silence for 37 hours

**⭐ A booking is a promise — two new rules that say so**
✅ **⭐ WITHDRAWING A SERVICE DOES NOT CANCEL BOOKINGS ALREADY MADE.** They stand and are served; the service is hidden from new bookings only; the owner is warned with the count first. If they will not honour them, **an Admin cancels each one by hand with the compulsory reason** and phones the customer — *"the outlet can manually call the customer and cancel the booking manually"*
✅ **SHORTENING BUSINESS HOURS DOES NOT CANCEL BOOKINGS EITHER** — the owner is shown exactly which bookings now fall outside hours and chooses, one by one, to keep or cancel each. **Keeping them is often right**: an owner may well intend to stay late for three people who booked before the change. **Recommended: one shared "affected bookings" review screen** for every setting that can orphan a booking — added holidays, changed off-days, narrowed barber hours, an earlier queue cutoff. Build it once and each of those settings becomes safe to edit

**⭐ Day one, and a gap accepted**
✅ **⭐⭐ A SIX-STEP FIRST-RUN WIZARD ON EVERY PLAN, AND IT MUST BE FUN** — *"the wizard must present what meikigo are capable of and what the merchant can do with it… engaging and fun, not corporate boring tutorial."* Outlet → services (with ready-made suggestions) → barbers → one login → print the QR → practice sale. Skippable, resumable, one per Brand, gone for good after the first real sale, **never a wall between a merchant and the product they paid for**. It also makes the existing "minimum viable Brand" rule visible instead of implicit. ⚠️ **Six screens of friendly microcopy is a writing job, not developer work** — and **recommended: measure step-by-step drop-off**, which will be the most useful product metric Meikigo has in its first year
✅ **⚠️ THE ZERO-POINTS NO-SHOW GAP IS ACCEPTED** — *"Points only. Accept the gap."* A customer with no points loses nothing by not turning up, so they can book daily and never appear. No counter-driven booking block, no blacklist. **Recommended anyway, and nearly free: count no-shows without acting on them**, so the counter can see *"4 no-shows"* and a future decision starts from evidence rather than from zero

**Confirmations and one deferral**
✅ **THE QUEUE SCREEN SHOWS NUMBERS ONLY** — no full names, no first names, no initials. Strongest of the three options, and it matches what the public queue already exposes. ⚠️ **Because there are no names, show a short run of upcoming *and* recently-passed numbers** — *"Now serving A-14 · Next A-15, A-16 · Passed A-11, A-12"* — which answers "have they called me?" without naming anybody. The counter POS still shows names
✅ **A `FREETRIAL` BRAND CANNOT BUY ADD-ONS OR AN EMAIL PACKAGE** — features yes, purchases no. It also removes an awkward case: a paid add-on stranded when the trial ends on `FREE`, which can hold none. ⚠️ Consequence worth stating on the blast screen: **blasts are effectively unavailable during the trial**
✅ **A MID-MONTH EMAIL UPGRADE IS IMMEDIATE AND PRORATED**; a downgrade waits for the next cycle. Emails already sent count against the larger allowance — show that arithmetic
✅ **PRODUCT SWAPS REQUIRE APPROVAL BY DEFAULT**; imported points are checked (negatives rejected, outliers warned); the import file limit is **25MB** and is expressed as file size, never rows
⏸️ **THE PRO DATA EXPORT / API IS DEFERRED — build it when a PRO merchant asks.** ⚠️ **So it must come off the published PRO feature list until it exists** — the same rule Round 12 applied to SLA support: do not sell a tick with nothing behind it

### Round 17 — The Other Half of the Ledger, and a Way In for Support

> The biggest single addition since payroll. The accounting module recorded money coming in and nothing going out, so the owner could see sales and never profit — Round 17 closed that, and in doing so gave the dashboard something worth showing. Support got a way into a merchant's account. Seven things were declined outright, which is its own kind of progress.

**⭐⭐ Money going out — the gap that mattered most**
✅ **⭐⭐ EXPENSES ARE BUILT, ON EVERY PAID TIER** — *"Add expenses, for all paid tier… our objective is to allow the brand(merchant) can put every transaction in our app like normal accounting software module."* Date, amount, category, note, receipt photo, per Outlet, with a seeded category list the merchant edits. **`FREE` keeps the sales-only ledger.** This turns a sales report into a business report, gives the dashboard a **profit** figure, and makes the accountant export carry both sides of the book
✅ **⭐ WAGES POST THEMSELVES ON PRO** — finalising a payroll run writes one `Wages & staff cost` expense per Outlet for the total employer cost. On STARTER and PLUS, wages are typed by hand, which is the honest consequence of payroll being PRO-only. ⚠️ **The real risk in the whole feature is double entry** — cash-out, then stock-in, then a typed expense for the same RM200 — so POS-sourced rows are not re-typable, stock-in *offers* to post an expense rather than doing it silently, and a same-amount duplicate warning fires on save
✅ **⭐ CASH OUT OF THE TILL IS A POS ENTRY** — amount, reason, who took it, who authorised it. It joins the expected-cash sum, so the RM50 taken for shampoo stops appearing at day close as a RM50 variance, which is to say it stops looking like theft. **Two reasons must not post an expense — bank-in and owner's draw** — because a drawing is not a cost, and getting that wrong overstates costs and understates profit
✅ **⭐ THE DASHBOARD IS THE TIER DIFFERENCE, AND I WAS ASKED TO DECIDE WHAT IT SHOWS** — *"Starter dashboard is simpler and plus/pro is more details. I dont know what to display, you will decide."* Both lists are now written: **Simple** answers *"how is the shop doing?"* (today, this month, profit, top services, what needs attention, one month-on-month line); **Advanced** answers *"why?"* (trends, expenses by category as a share of sales, by barber, product margin, busiest hours, win-back audience size, loyalty liability, outlet comparison). ⚠️ **The Simple screen must look finished, not disabled** — greyed-out charts saying "upgrade to see" is how a STARTER merchant is made to feel cheated

**⭐⭐ Support can finally see what the merchant sees**
✅ **⭐⭐ A HIDDEN ADMIN ACCOUNT IS AUTO-CREATED FOR EVERY BRAND AND EVERY OUTLET** — *"1 hidden account that invisible to merchant. So meikigo-admin can login with that account to help to configure."* Invisible to the merchant, cannot be deleted by them, **does not consume a login seat and is never billed**, and cannot take a payment, refund or finalise payroll
⚠️ **One part should not be built literally, and it is written up as a recommendation rather than an objection:** *"all the password… is a same."* **A single shared password across every merchant's hidden admin account is one leak away from everything.** The same convenience is available safely — a unique generated credential per account, revealed by a **reason-gated, logged, time-limited** action in `meikigo-admin`. Still one click for the agent
⚠️ **It is also a route around the PDPA reason-gate**, and that needed naming: Round 8 requires a reason before Meikigo staff see customer PII, but `meikigo-merchant` requires none — so an agent signed in as the shop reads everything with only a login recorded. **The fix is to make the SESSION the gated act**: reason required, session logged and time-limited, and every session on the monthly access report. **And every change made in a support session is stamped as Meikigo Support and shown in the merchant's own audit log on PRO** — a deliberate departure from Round 15, because *reading* a record and *changing a merchant's configuration* are not the same thing

**Two things that could have ended the business, answered plainly**
✅ **DAILY BACKUP ON THE MANAGED DATABASE, AND IT GOES IN THE T&C** — *"We as a meikigo, will have daily backup on our managed database. Tell it in the tnc"*. ⚠️ **Word it as what is done, not as a guarantee** — a promise in the terms is enforceable. Three configuration choices still need one line each: retention (recommended 30 days), point-in-time recovery, and **whether a restore is ever tested — the part everyone skips, and an untested backup is not a backup**. ⚠️ **Single-merchant restore is the case that will actually happen** and a database backup does not solve it; most of the answer is that nothing hard-deletes, and the gap left over is a bad bulk import — **so make an import batch reversible**
✅ **P1 COVER DURING LEAVE IS HANDLED INTERNALLY** — *"you don't have to worry about this. We will handle internally."* Recorded and closed; the public promise stays Mon–Sat 9am–6pm

**Small email corrections, both of which stop a warning from crying wolf**
✅ **⭐ THE SMALL-SEND FLOOR IS SET: rates apply only at 200+ recipients; below that, complaints are counted per Brand over a rolling month** — *"if in span of 1 month only 1 people clicked as spam, this shouldn't be a big deal."* Recommended threshold: 3 complaints in 30 days. Without this, a 20-person blast with one complaint reads as 5% and every small shop trips a warning on its first send
✅ **THE ALERT ADDRESS IS CONFIGURED IN `meikigo-admin`** — *"The email can be configure in meikigo admin"*. It should point at a shared monitored mailbox rather than one person's inbox; **the setting makes that a choice, and somebody still has to make it**
✅ **NO-REPLY STAYS, AND NO REPLY-TO FIELD IS BUILT** — *"Keep no-reply for everyone. Simple, nothing to build."* Which makes the blast footer non-negotiable: with no reply path at all, a footer missing the shop's phone number leaves a customer with only the spam button

**Day one — the wizard finished, and a help page for 9pm on a Sunday**
✅ **THE SUGGESTED SERVICE PRICES ARE CONFIRMED** — Haircut RM25, Beard trim RM15, Hair wash RM10, Kids cut RM18, editable
✅ **⭐ THE PRACTICE SALE NEVER TOUCHES A MONEY REPORT** — flagged, excluded from every figure, no real payment, printed *PRACTICE*, **and it must not consume a receipt number** (the series is gapless by decision, and a hole on day one is exactly what an auditor asks about). ⚠️ **Deleted after 24 hours — the one deliberate hard delete in the product**, recorded as an exception rather than left looking like an inconsistency
✅ **⭐ IN-APP HELP PAGES: 15–20 short illustrated articles, searchable, inside `meikigo-merchant`.** Support is Mon–Sat; at 9pm on a Sunday a merchant standing in a shop full of customers has nowhere else to go. It also cuts the weekday tickets the one support person receives. ⚠️ **A writing job, not developer work — the same person who writes the wizard copy**, and **screenshots need an owner** or they go stale and actively mislead

**⭐ One shared screen instead of ten quiet bugs**
✅ **⭐⭐ THE "AFFECTED BOOKINGS" SCREEN IS BUILT ONCE AND USED BY EVERY SETTING THAT CAN ORPHAN A BOOKING** — *"Build one shared screen that every one of those settings uses."* The list is now closed rather than illustrative: withdrawn services, deactivated products, removed barber skills, shortened hours, added holidays, changed off-days, narrowed barber hours, an earlier queue cutoff, reduced capacity, a deactivated outlet, and barber offboarding. **It runs before the change is saved, nothing is ever cancelled automatically, and it does not appear when nothing is affected**

**Five declined, and each one is a decision rather than an omission**
⛔ **NO SUPPLIER RECORD** — *"C"*. Stock-in keeps cost per unit and never records who sold it, so *"how much did we spend with that supplier?"* cannot be answered. The expense ledger answers the money half by category instead
⛔ **NO BARCODE SCANNING** — *"Not now. Tapping from a list is enough for a barbershop."* No barcode field, no scanner input. ⚠️ The cost of waiting is retro-fitting barcodes onto stock a busy shop has already shelved
⛔ **NO SHIFT CLOSE** — *"A"*. One close per Outlet per day stands. ⚠️ **A shortage therefore has no name against it**: a shop that is RM80 short cannot tell which shift it went missing in, and never will. Accepted, because a handover count is real work for a two-person shop
⛔ **NO CANCELLATION NOTICE WINDOW** — *"Leave it. Any cancellation is free, at any time."* A customer may cancel at 2:50pm for a 3:00pm slot at no cost. This now sits beside the accepted zero-points no-show gap: two known holes in booking discipline, both accepted deliberately
⛔ **NO WAITLIST for a fully booked day** — *"A"*. The empty screen offers the walk-in queue instead, which is wording rather than a feature. **Recommended and free: also name the next day that has a free slot**
⛔ **NO MEIKIGO HOLIDAY CALENDAR** — *"B"*. Every Outlet still types its own ~15 dates, every year, forever. ⚠️ **Attendance and payroll both depend on that list**, so **a December reminder email that next year is empty** is the cheapest available mitigation and is worth building
⛔ **A BARBER WHO MOVES BRANCH STARTS FRESH** — *"Leave it."* A senior barber with 300 reviews arrives with no score and stays **hidden from the public rating until he collects 5 fresh ones**. He will notice

---

### Round 18 — Two Loose Ends Closed, a Barber App Killed, and Several Recommendations Turned Down

> Twenty small questions rather than one big feature. The two open items Round 17 left behind both got answered — one exactly as recommended, one exactly against the recommendation, both now closed either way. A real app sitting in a folder for months turned out to be nothing anyone plans to ship. And this round has more declines than any before it: recurring expenses, a Manager role, and the ad-hoc counter e-Invoice path were all offered and all turned down — each recorded with its accepted consequence rather than quietly dropped.

**⭐⭐ The two Round 17 loose ends — one kept as-is, one confirmed as recommended**
✅ **THE SHARED SUPPORT PASSWORD STAYS SHARED** — *"B" — "Keep one shared password, exactly as you said."* The reason-gated unique-credential mechanism was offered again and declined a second time. It is being built literally: one password, set at creation, known to everyone who needs it. ⚠️ **The risk is unchanged and accepted, not removed** — one leak still reaches every merchant's data at once, with no per-shop rotation and no password-level attribution. ⚠️ **A second consequence follows that Round 17 did not anticipate:** the PDPA reason-gate control ("the session is the gated act") was designed around a credential that only exists once requested through a logged action. With a standing shared password, an agent who already knows it can sign in directly without touching that action — so the reason-logging requirement is now a **process rule staff are trained to follow**, not something the system can enforce technically
✅ **SUPPORT SESSIONS ARE VISIBLE TO THE MERCHANT — exactly as recommended** — *"A"*. Every change made in a support session is stamped Meikigo Support, shown on the merchant's own PRO audit log, and followed by a short email to the Brand admin. This closes the Round 17 question about whether Round 15's internal-only access log still holds — it does, for **reading**; it does not, for **changing**, which is now the merchant's to see

**⭐⭐ A folder that was never a product**
✅ **`meikigo-employee-mobile` IS FORMALLY DEAD** — *"That folder deprecated, we will not have the barber app."* The folder had already been marked deprecated since Round 3, but a real React Native app sitting unmentioned in the requirements was worth checking rather than assuming, and it was checked. Nothing changes; a future reader now has no reason to reopen it

**Small reversals — recommendations turned down, each with its accepted cost named**
⛔ **NO RECURRING-EXPENSE TEMPLATE** — *"B"*. Rent, internet and insurance are typed by hand every month, same as any other expense. ⚠️ **The risk stays exactly as flagged the first time**: a feature needing twelve manual entries a year is the kind that gets used in January and abandoned by March, quietly understating cost and overstating profit from the month it lapses
⛔ **NO OUTLET-SCOPED MANAGER ROLE** — *"B"*. Admin and Cashier stay the only two staffing roles. ⚠️ **The consequence this reopens:** the only way to let someone on-site at a branch approve a refund is to make them a full Admin, who then also sees every other outlet's payroll and the Brand's profit — or the owner must be reachable for every override
⛔ **NO AD-HOC E-INVOICE CAPTURE AT THE POS** — *"doesn't make sense. nobody will use haircut as tax exemption. its personal things."* Partially supersedes Round 5: the "customer asks, cashier types four fields" path is not built; every sale rolls into the consolidated monthly e-Invoice regardless. ⚠️ **The rare genuine request — a company booking corporate grooming — has no self-serve path** and becomes a manual back-office exception instead

**Small confirmations — recommendations taken exactly as offered**
✅ **STOCK-IN OFFERS TO POST AN EXPENSE** — *"A"*. A prompt at the moment of the decision, amount pre-filled, never silent
✅ **CASH-OUT APPROVAL THRESHOLD IS RM20, MERCHANT-CONFIGURABLE** — *"A"*. 0 remains available for a merchant who wants every cash-out approved
✅ **THE SMALL-SEND COMPLAINT THRESHOLD IS 3 IN 30 DAYS** — *"A"*, closing the number Round 17 left open
✅ **BULK IMPORT IS REVERSIBLE, AND A FILE NAME CANNOT BE REUSED** — *"make undo. but by default, they cannot import the same file (based on file name) twice."* Undo removes everything a batch created; re-uploading an identically-named file is rejected before processing rather than silently deduplicated
✅ **PRODUCTS ARE VISIBLE IN THE CUSTOMER APP** — *"A"*. Price and photo, browse-only, no ordering — so a waiting customer learns the shop sells the RM45 pomade and asks at the counter
✅ **THE DASHBOARD WORKS ON THE OWNER'S PHONE, NOTHING ELSE DOES** — *"A"*. The Simple and Advanced dashboard screens and their exports render on a phone browser; payroll, settings, staff and catalogue stay laptop-sized
✅ **FILE STORAGE IS OCI OBJECT STORAGE, SIGNED LINKS, SHRUNK ON UPLOAD** — *"A"*, matching the provider already used for the daily database backup dump

**⭐ A new revenue idea, taken in full**
✅ **THE GOOGLE REVIEW PROMPT IS BUILT** — *"A"*. A 4–5 star Meikigo rating gets one extra button, *"Loved it? Tell Google too"*, straight to the shop's own Google review link, pasted into Outlet settings once. A 1–3 star rating never sees it

**Kept deliberately as they were**
✅ **TIMEZONE STAYS BROWSER/LOCAL TIME AT SETUP** — *"keep it simple. local internet time. because meikigo will not only avail in Malaysia. it will be worldwide."* A platform-wide Malaysia-fixed clock was offered and turned down for exactly the reason it looked attractive — it would need undoing the day the first non-Malaysian shop signs up
✅ **THE TRIAL STAYS 14 DAYS** — *"B"*. Extending to 30 was offered and not taken
✅ **NO REFUND ON AN UNUSED YEARLY TERM, STATED PLAINLY** — *"A"*, made explicit for the annual-commitment case: access continues to term end, then stops, with no partial refund for months unused

**One reconfirmed commitment without the numbers behind it, and one deferred to the merchant directly**
⚠️ **DAILY BACKUP IS RESTATED, THE THREE SETTINGS ARE NOT** — *"we backup everyday for real."* This reinforces the commitment Round 17 already made; it does not supply retention days, point-in-time recovery, or a monthly test-restore commitment. The recommended defaults (30 days / PITR on / monthly test restore) remain unconfirmed assumptions, not decisions
✅ **AN ACCOUNTANT CAN LOCK A CLOSED MONTH — RESOLVED (Round 22).** The owner can lock a month; nothing new can be dated inside it once locked. Only the owner can lock or unlock, and unlocking is logged. This closes the Round 18 deferral

---

### Round 19 — The HitPay KIV List, Closed Almost Entirely

> Twenty questions, all HitPay, answered in one sitting — this closes nearly every item that has sat parked under "KIV — HitPay & payments" since the payments section was first written. One answer (Q15) was a same-conversation false alarm: *"Im sorry, my mistake, the split payment still have"* — Group Split Payment (Round 3/11B/17) is untouched, and the completion-rule question it was meant to ask is now moot. Three questions (manual-vs-auto recurring token storage, the refund-pending-request aging rules, and EXCHANGE settlement routing) went unanswered rather than declined and stay open. Where a rate card was given without a decision attached, it was applied literally and the arithmetic consequences were surfaced rather than smoothed over — including one case where the merchant's own 2% ceiling produces zero commission for Meikigo.

**⭐⭐ The account model and the commission rate — the two biggest numbers in this round**
✅ **MEIKIGO'S OWN HITPAY ACCOUNT AND EACH BRAND'S CONNECTED HITPAY ACCOUNT ARE SEPARATE, TIED TOGETHER BY THE PARTNER RELATIONSHIP.** Recorded as given: Meikigo's account receives subscription revenue *and* platform commission; each Brand gets its own account, created and managed by Meikigo, where that Outlet's POS sales actually land. **New: the merchant can request access to their own account through meiki-support** — support-mediated, not self-service, which is the same shape as the Round 17/18 hidden-support-account pattern rather than a new one. This closes "one HitPay integration or two" — it's two, by design, not an implementation detail to sort out later
✅ **⭐ COMMISSION IS A 2% CEILING ON TOTAL FEE, NOT A FLAT MEIKIGO CUT — Meikigo takes (2% − HitPay's own %) per payment method, up to that ceiling.** Worked example recorded as given: a RM10 DuitNow payment costs HitPay 1.2% (RM0.12); Meikigo adds 0.8% (RM0.08) to reach the 2% total. See Payment Gateway → Meikigo/Merchant Account Model & Commission for the full per-method table. ⚠️ **The consequence worth flagging rather than assuming past silently: on methods where HitPay's own fee already exceeds 2%** (international cards, Paylater by Grab, Atome) **the formula gives Meikigo RM0 commission**, not a smaller positive number. That's the literal reading of "2% is the ceiling," but it's a real revenue consequence that wasn't addressed directly in the answer and is worth one line of confirmation

**⭐ The electronic payment-method matrix widens on FREE**
✅ **CARD (NFC TAP VIA HITPAY'S OWN APP) AND DUITNOW QR ARE NOW ON EVERY TIER INCLUDING FREE** — *"All package will include card payment and qr pay (duitnow)."* This is wider than the previous draft, which gated DuitNow to STARTER and up. Only the other eWallets (ShopeePay, Touch 'n Go, GrabPay, etc.) stay tier-gated to STARTER+. Tender split stays banned, reconfirmed: *"Cannot mix method."* **Recommendation, adopted pending no objection: hide an unsupported method rather than show it and let it fail at the gateway with a customer waiting.** **⛔ SUPERSEDED IN PART (Round 20):** no eWallet upsell. **⛔ SUPERSEDED IN PART (Round 26):** card tap is on the **POS tablet NFC**, not HitPay's own mobile app.

**Disputes, evidence, and who's responsible**
✅ **MEIKIGO HANDLES DISPUTES, NOT THE MERCHANT** — *"B"*. Evidence must be stored/attached inside the platform against the disputed Transaction. **Recommendation, since the UI question wasn't answered directly: support-only inside `meikigo-admin` for now**, not a merchant-facing screen — can be added later if volume ever justifies it

**The build mechanics — mostly delegated, resolved against HitPay's documented behaviour rather than guessed**
✅ **Webhook signature: `Hitpay-Signature` header, HMAC-SHA256 of the raw body, keyed by the account's salt.** No timestamp header exists to check freshness against, so the rule is exactly what option (c) suggested: verify the signature, process idempotently, don't reject on age
✅ **Idempotency key: BOTH, as recommended** — `reference_number` (Meikigo's Transaction ID) for state-machine correctness, plus a hash of (HitPay's own `id` + `status` + `updated_at`) to suppress exact repeat deliveries, since HitPay's payload doesn't expose a separate event/delivery id
✅ **Payment states stay `PENDING`/`SUCCESS`/`FAILED`, refund states stay the existing `PENDING_REFUND_REQUEST`/`REFUND_APPROVED`/`REFUND_REJECTED` (Round 13) — no new states.** A late webhook always corrects forward to `SUCCESS`, even after the POS already showed `FAILED`, and lands on today's figures if the day is already closed — same mechanic as a late-approved refund
✅ **Reconciliation: first check at 3 minutes, then every 5 minutes to a 30-minute TTL, then `FAILED` and an internal alert.** A reconciled `SUCCESS` after a shown `FAILED` auto-corrects the Transaction and the day-close figures — **⛔ SUPERSEDED (Round 26): QR `expires_after` = 15 min; mark `FAILED` at 20 min**
✅ **Receipt and the review prompt fire only after webhook `SUCCESS`** — option (a), no pending/interim receipt
✅ **A customer closing their browser after paying: POS stays `PENDING` but doesn't block the cashier, plus a manual "Refresh payment status" button that runs the same status-query logic reconciliation uses** — the two complementary options, combined rather than picked between
✅ **Subscription retry mechanics: the `SubscriptionLine` keeps its last known `ACTIVE` status through the 2 retries, only flipping to `EXPIRED` after the third and final failure.** `payment_request.completed` on any attempt heals it to `ACTIVE`; failed-webhook reprocessing is safe via the same idempotency key. ⚠️ **A gap surfaced, not resolved: the given rate card lists DuitNow under Online and In-person payments but not under Recurring Payments**, while the existing text says renewal charges use "DuitNow + Domestic card" — needs a check against whether HitPay's recurring product actually supports DuitNow before build — **⛔ BOTH CLOSED (Rounds 21 + 26): domestic card only for subscribe; HitPay owns retries (no Meikigo 3× job)**
✅ **Refund idempotency: HitPay's reference is the key, as instructed** — *"Use refund request reference idempotency key from HitPay."* ⚠️ **But the documented refund endpoint doesn't appear to take a client-supplied idempotency key**, so the actual duplicate-guard has to be Meikigo's own refund-request row lock (Round 13's `PENDING`/`APPROVED` record), checked before ever calling HitPay a second time — needs a final check against HitPay's live docs in case a real mechanism exists that isn't reflected in what was available here
✅ **Amount source of truth: electronic payments send the snapshotted post-discount line total, no extra rounding.** Consistent with cash-rounds-only (Round 11B). **✅ CLOSED (Round 22) — HitPay amount format:** decimal string in ringgit with 2 decimal places (e.g. `'10.50'`). No cent/minor-unit conversion. The receipt displays the same amount Miki computed internally.
✅ **Logging: log every important payment activity, broadly** — *"Please add log for each important activity."* Recommended must-alert list (signature failures, duplicate storms, reconciliation mismatches, timed-out pending payments) delegated and adopted. **Recipients: Meikigo staff only** — *"C"*

**Environment variables and the repo split**
✅ **Everything HitPay-related lives in `meikigo-api`, nothing in `meikigo-merchant`** — *"everything is in meikigo-api."* Platform-level credentials (Meikigo's own master account) are real env vars there; each Brand's connected-account credentials are data in the database, not env vars, since they're created per-merchant by Meikigo rather than provisioned once. **The exact `HITPAY_*` variable names still need a final check against HitPay's current API reference before build** — the answer pointed at the docs rather than listing them

**Answered, then withdrawn in the same conversation**
✅ **Group Split Payment is UNCHANGED.** Q15 was answered "No split," which read as a major reversal of a feature three prior rounds (3, 11B, 17) went out of their way to preserve and explicitly distinguish from the already-banned tender-split — so it was checked before being folded in. **Confirmed as a mistake: *"Im sorry, my mistake, the split payment still have."*** Nothing in Group Split Payment mechanics changes; the underlying completion-rule question (when is a split booking "paid"?) is therefore moot and not carried forward

**Left unanswered in Round 19, not declined — ALL NOW CLOSED (Rounds 21–22)**
✅ ~~Manual-vs-auto recurring repayment mechanics~~ — **CLOSED (Round 22): auto-charge, HitPay stores card token**
✅ ~~Refund-pending-request aging rules~~ — **CLOSED (Round 22): 3 auto-retries on API failure; 14-day auto-reject with Meikigo override; POS shows "Refund approved — processing"**
⛔ SUPERSEDED in Phase 1 by Round 23 Q16: exchange is implemented as **refund + new sale**, so EXCHANGE settlement routing is **not used in Phase 1** (Phase 2 only, if a dedicated exchange money-flow is reintroduced).

---

### Round 20 — HitPay, One Level Deeper: Config Mechanics, Payment Request Settings & Refund Sequencing

> Twenty more HitPay questions, arriving as a second `answers.md` pass rather than through `question.md`, same as Round 19. Where Round 19 settled the shape of each mechanism, Round 20 mostly settles the exact field-level and sequencing detail underneath it — grounded, again, against the installed `hitpay` skill's documented API rather than guessed. Two answers land as real changes rather than confirmations: the electronic payment matrix is narrower than Round 19 recorded (card + DuitNow only, on every tier — no eWallet upsell), and the commission rate is not a hardcoded ceiling formula but two independently configurable percentages in `meikigo-admin`, whose own worked example arithmetic doesn't respect the stated 2% ceiling. Both are flagged rather than smoothed over. Most of the rest reconfirms Round 19 one layer more precisely: which webhook events are subscribed, what identifiers are stored, the payment-request creation defaults, and — the most substantive addition — the exact two-step sequencing of an approved refund (call HitPay immediately; only mark `REFUNDED` once `charge.updated` confirms it).

**⛔ The one real reversal: no eWallet tier upsell**
✅ **CARD + DUITNOW QR IS NOW THE ENTIRE ELECTRONIC METHOD SET, ON EVERY TIER.** *"For all plan, the electronic payment is for card and qr duitnow only."* This supersedes the "STARTER and up additionally get the other eWallets (ShopeePay, Touch 'n Go, GrabPay, etc.)" line Round 19 recorded — that differentiator is gone. The Subscription Tiers payment row and Payment Methods section have been updated to match; the full HitPay eWallet rate card stays in the document for reference but nothing currently routes a customer to those methods.

**⚠️ Commission: how it's configured, and an arithmetic tension worth a straight answer**
✅ **THE RATE IS TWO SEPARATE PERCENTAGES IN `meikigo-admin`, NOT ONE HARDCODED FORMULA** — HitPay's own fee per method, and Meikigo's commission per method, both independently editable, summed for the total deducted from the Brand's HitPay account. *"We set the hitpay fees 1.5% percent in meikigo-admin and our commission 1%. The total deduction from the outlet hitpay account is 2.5%."* ⚠️ **That example totals 2.5%, exceeding the 2% ceiling stated earlier in the very same answer** (the DuitNow example there was 1.2% + 0.8% = 2.0%, respecting the cap). Recorded as a real tension rather than resolved by picking one reading — carried to To Be Determined: is 2% a hard validation ceiling `meikigo-admin` should enforce on the sum, or was 2.5% just an arbitrary illustration of the two-field UI?

**The build mechanics — filled in one layer deeper than Round 19**
✅ **Payment-request creation defaults, new this round:** `allow_repeated_payments=false` always, `expires_after` 10–30 minutes, `send_email=false`/`send_sms=false` (Meikigo's own receipt flow is the only notification), `add_admin_fee=false` unless a Brand specifically wants it — **⛔ SUPERSEDED (Round 26): `expires_after` = 15 minutes; also `generate_qr = true` for DuitNow**
✅ **Identifiers stored per POS payment, three fields:** the payment request `id`, the webhook's `payments[0].id` (what the refund endpoint actually needs), and Meikigo's own `reference_number`
✅ **Subscribed webhook events, explicit: `payment_request.completed`, `payment_request.failed`, and `charge.updated`** — the last one specifically for refund confirmation, new this round — **extended (Round 26): also chargeback/dispute events**
✅ **Refund sequencing, the most substantive new mechanic this round: on admin approval, HitPay's refund endpoint is called immediately — but the Transaction only flips to `REFUNDED`/`REVERSED` once `charge.updated` confirms it**, not at the moment of the API call. The approved-but-not-yet-confirmed state sits visibly in between, same "webhook is truth" discipline the payment side already has
✅ **Full AND partial refunds, merchant's choice, on services or products** — closes a gap the document only implied in passing before (Round 3's "the same holds for partial refunds" assumed the policy without ever stating it as a decision)
✅ **API rate-limit safety: internal throttling on payment-request creation, webhooks as the primary channel, and the existing fixed reconciliation schedule as the only sanctioned polling path** — no aggressive poll-loop under load

**Reconfirmed, not changed — same decision, more explicit wording**
✅ Partner-tier status, the two-separate-HitPay-accounts model, and **every HitPay call routing through `meikigo-api`** (new phrase, same architecture the BFF pattern already implied)
✅ Webhook signature validation on raw request bytes (never a re-serialized JSON object), constant-time compare, reject on mismatch
✅ The refund call uses the stored `payment_id`, never the payment request id
✅ Webhook-is-truth state machine, the manual refresh button, the redirect-is-UI-only rule, and Meikigo-handles-disputes — all restated as given, nothing new underneath

**Enriched, not changed — Round 3's rule with the HitPay detail filled in**
✅ **Group Split Payment now has its HitPay mechanics on record: an N-way split is N separate HitPay payment requests, N dynamic QR codes, N receipts, with HitPay's fee and Meikigo's commission calculated independently per share** — never once on the pre-split total. This is Round 3's "each share becomes its own separate Transaction" restated with the gateway detail underneath it, not a new rule. It also closes the original completion-rule question this round re-asked: each share's webhook lifecycle is already independent, so there is no group-level all-or-nothing gate to design

**Not addressed this round — ALL NOW CLOSED (Rounds 21–22)**
✅ ~~Recurring-charge token mechanics~~ — **CLOSED (Round 22): auto-charge, HitPay stores card token**
✅ ~~Refund-pending aging/HitPay-API-failure rules~~ — **CLOSED (Round 22): 3 auto-retries, then REFUND_FAILED; 14-day auto-reject with Meikigo override**
⛔ SUPERSEDED in Phase 1 by Round 23 Q16: exchange is implemented as **refund + new sale**, so EXCHANGE settlement routing is **not used in Phase 1** (Phase 2 only, if a dedicated exchange money-flow is reintroduced).
✅ ~~Whether a refund also refunds Meikigo's own commission~~ — **CLOSED (Round 21): yes, commission is returned on refund**

---

## To Be Determined

*(Rebuilt after **Round 22**. Items resolved in Rounds 1–22 have been removed and now live in Key Decisions Made above. **Round 26 closed the billing / QR / NFC / settlement / dispute items listed in that round's Key Decisions block.** **Round 24 HitPay questions are still unanswered** — do not treat DuitNow refunds, `platform_commission_amount` > 0, webhook routing, wallet reserve, Touch 'n Go, tips-in-HitPay-amount, or related items as closed.)*

### 📌 Launch checklist — not questions, but nothing publishes until they are done

📌 **⭐ Type the email package prices into `meikigo-admin` after deployment (Round 22).** Five tiers exist (1K / 5K / 10K / 50K / 100K). **All prices launch at RM0 and will be configured post-deployment.** All email tier pricing is `meikigo-admin`-configurable — no code change needed to set or change prices later. **Make the per-email price fall as the tier grows** — the withdrawn Round 15 draft had the 50K tier cheaper per email than 100K and 500K, which rewards buying ten small packages
✅ **⭐ Set the platform alert address (Round 17, per Round 23 Q6).** It is a `meikigo-admin` setting now rather than a hardcoded value, which means it ships **empty**. Point it at a shared monitored mailbox, not one person's inbox, and make it un-saveable blank (alerts are still sent via the Brevo transactional stream).
📌 **Marketing-site copy — six corrections:** wire in the pricing endpoint (or update the grid); **remove tax document export from the FREE and STARTER columns**; **replace the RM49 marketing line with the five email tiers**; update PRO (audit log, scheduled reports, statutory summary sheet — **no custom branding, no free add-on units, and NOT the data API**) with **Mon–Sat 9am–6pm** support hours; **⭐ add expenses and profit to STARTER and above (Round 17)**, which is the most sellable thing added in months
📌 **Write the wizard copy AND the 15–20 help articles (Round 17).** One writing job, one voice, one person. The help articles need screenshots of real screens, which means they are written last and re-shot whenever a screen changes materially
📌 **Set up Brevo properly:** both subdomains authenticated (SPF/DKIM/DMARC), separate API keys per stream, bounce/complaint webhooks wired into `meikigo-api`, and the suppression list fed from them
✅ ~~Confirm the database backup configuration~~ — **CLOSED (Round 22): 30-day retention, PITR enabled, monthly test restore scheduled.** All three configuration numbers are now set. The monthly test restore is a recurring human task (see Launch checklist → backup restore test person)
📌 **⭐ Confirm the exact `HITPAY_*` variable names against HitPay's current API reference (Round 19).** The repo placement is settled (`meikigo-api` only) and the shape is settled (platform-level env vars for Meikigo's own account, per-Brand credentials as encrypted DB data) — what's left is typing the literal names in before the account is provisioned
📌 **Build the `meikigo-admin` action that grants a merchant support-mediated access to their own HitPay account on request (Round 19)** — new in this round, not previously specified anywhere, and needed before "the client can request access through meiki-support" is anything more than a sentence
✅ ~~Get the RM0-commission-on-high-fee-methods consequence explicitly confirmed~~ — **CLOSED (Round 22): accepted.** 0% commission on methods where HitPay's own fee exceeds 2% is accepted. These methods (international cards, Paylater by Grab, Atome) are uncommon at barbershops
~~📌 ⭐ Resolve the commission-ceiling arithmetic tension~~ — **CLOSED (Round 21): the 2% is a guideline, not a hard cap. `meikigo-admin` allows any combination without validation.**

### ⚠️ Needs a person, not a build

📌 **⭐ The overtime rules STILL need the accountant's sign-off — confirmed will happen before launch (Round 22).** Until it does, 1.5× / 2.0× / 3.0×, the 8-hour day, the 45-hour week, the 104-hour ceiling, the ÷26 divisor and the RM4,000 threshold remain **provisional**. Effective-dated configuration, so a fix is an edit — but an underpaid overtime claim is a Labour Department matter. **Moved from open question to launch checklist: the commitment to verify exists, the verification itself does not**
❓ **⭐ Check the email tier prices against what Brevo actually charges** once they are chosen. Meikigo's cost is Brevo's plan for **every merchant's volume plus all transactional mail**; the revenue is the sum of the tiers sold. I will not quote Brevo's prices from memory
✅ **⭐ Watch total allowance sold against the Brevo plan ceiling (dashboard + alert) — Round 23.** In `meikigo-admin`, show total allowance sold vs the current Brevo plan ceiling, and raise an alert when usage reaches **80%** so operational action happens before OTPs stop (failure mode: provider cap hits and stops *everyone's* mail).
❓ **⭐ The backup restore test needs a person who actually does it (Round 17).** Configuration can be set once; the monthly restore is a recurring human task, and it is the only thing that proves the backup works

### Open — gaps surfaced by Round 18

✅ ~~Can an accountant lock a closed month against later edits?~~ — **CLOSED (Round 22): yes.** The owner can lock a month; nothing new can be dated inside it once locked. Only the owner can lock or unlock, and unlocking is logged

### Open — gaps surfaced by Round 19

✅ ~~Manual-vs-auto recurring repayment mechanics~~ — **CLOSED (Round 22): auto-charge mode.** HitPay charges the saved card automatically each cycle. HitPay stores the card token — Meikigo does not handle PCI-sensitive token storage. Meikigo listens to webhooks for success/failure. This closes the build-blocking question for the recurring-billing path
✅ ~~Refund-pending-request aging rules~~ — **CLOSED (Round 22).** Failure path: retry automatically up to 3 times with increasing delay (1 min, 5 min, 30 min); if all fail, mark as `REFUND_FAILED` and alert Meikigo staff; admin can re-approve to retry. Aging: auto-reject after 14 days if no admin action, notify the customer — but Meikigo admin can override and keep a request open past 14 days. POS shows "Refund approved — processing" as an intermediate status for approved-but-not-yet-confirmed refunds
⛔ SUPERSEDED in Phase 1 by Round 23 Q16: exchange is implemented as **refund + new sale**, so EXCHANGE settlement routing is Phase2 only (only relevant if a dedicated exchange money-flow is reintroduced).
✅ ~~Does a refund also refund Meikigo's own commission?~~ — **CLOSED (Round 21): yes, commission is returned on refund.** HitPay handles this automatically via the platform commission mechanism
✅ ~~The DuitNow-under-Recurring-Payments gap~~ — **CLOSED (Round 21): DuitNow is dropped from subscription billing.** Subscriptions are cards only (Visa, Mastercard). The previous text was wrong
✅ ~~Minor-unit (cents) conversion and rounding direction for the HitPay API call~~ — **CLOSED (Round 22): send as decimal string in ringgit with 2 decimal places (e.g. '10.50').** HitPay's API expects this format for MYR. No cent/minor-unit conversion needed. The receipt displays the same amount Meikigo computed internally
📌 **Check whether HitPay's refund endpoint has a real idempotency mechanism** during build — worth a direct check against HitPay's live API docs. If one exists, prefer it over Meikigo's own row-lock. If not, the row-lock approach from Round 19 stands

### Round 21 — HitPay Integration Mechanics: OAuth vs API Key, Account Lifecycle, Platform Key & Subscription Billing

> Twenty questions covering the practical integration layer that sits underneath the account model and commission mechanics settled in Rounds 19–20. Every answer was "A" (the recommended option) except Q11 (settlement) and Q20 (merchant HitPay access), which carried additional detail. The round closes every open HitPay operational question, including the DuitNow-under-Recurring gap, the commission-ceiling arithmetic tension, and the commission-on-refund question.

**⭐ Integration path and account lifecycle**
✅ **DIRECT API KEY, not OAuth.** Meikigo creates each Brand's HitPay account, stores the API key, uses `X-BUSINESS-API-KEY`. No OAuth needed — the managed-account model means key-sharing risk is low
✅ **HitPay account created immediately after Organisation setup; Brand is cash-only until KYB clears.** Documents collected by Meikigo during Organisation setup and submitted on the merchant's behalf — the merchant never sees HitPay's dashboard or verification page
✅ **Every Brand gets a HitPay account regardless of tier, including FREE.** The operational cost of creating and verifying accounts for free merchants is accepted
✅ **ONE HitPay account per Brand, regardless of outlet count, even for franchise-type Brands.** All Outlets settle through the same connected account

**⭐ Platform Key and commission mechanics**
✅ **Platform Key (`X-PLATFORM-KEY`) must be obtained before Phase 1 launch** — manual request to HitPay support, required for commission and unified webhooks
✅ **Commission via per-transaction `platform_commission_amount` parameter** — Meikigo calculates the correct amount per payment method and passes it to HitPay, matching the variable-rate model
✅ **Unified webhooks** — all sub-merchant charge events to one Meikigo endpoint, routed internally by Brand identifier
✅ **⭐ The 2% ceiling is a GUIDELINE, not a hard cap** — `meikigo-admin` allows any combination without validation. This closes the Round 20 arithmetic tension
✅ **Commission IS returned on refund** — HitPay handles this automatically via the platform commission mechanism. This closes the previously-open refund/commission question

**Subscription billing**
✅ **Uses HitPay's Recurring Billing API** — plans per tier, subscriptions per Brand, HitPay handles auto-charge. Meikigo listens to `charge.created` and `recurring_billing.subscription_updated` webhooks
✅ **Subscription billing is CARDS ONLY (Visa, Mastercard)** — DuitNow is not supported for recurring auto-charge. This closes the DuitNow-under-Recurring gap

**POS mechanics**
✅ **Embedded QR codes use HitPay's method codes:** `duitnow`, `touch_n_go`. Cards via manual entry or QR payment link — **⛔ SUPERSEDED (Round 26):** POS DuitNow uses `duitnow` + `generate_qr = true`. Touch 'n Go is **not** in Phase 1 (Round 20). Card = tap on POS tablet NFC when the tablet has it
✅ **No physical card reader in Phase 1** — no Bluetooth terminal SDK integration — **⛔ SUPERSEDED (Round 26) for NFC-capable tablets:** tap on the POS tablet. Bluetooth WisePad / WisePOS E still out of Phase 1. Tablets without NFC: DuitNow QR + cash
✅ **Expired QR → "Retry" button creates new payment request** — old one stays FAILED, ticket is not voided
✅ **One active payment request per Transaction** — old is cancelled before new is created, prevents double-pay
✅ **No admin fee / surcharge in Phase 1** — merchant absorbs processing fee

**Settlement and merchant access**
✅ **Settlement is MERCHANT-INITIATED** — Brand requests, Meikigo employee processes via the Brand's HitPay account. Automatic HitPay payout scheduling is not used
✅ **Merchant HitPay access: support-mediated by default.** Support logs in on their behalf. Credentials available on written email request to Meikigo support — deliberate, logged handover
✅ **Refund on closed account: manual** — merchant refunds outside the system, recorded as manual refund in Meikigo

**Testing**
✅ **Two sandbox accounts** for testing (platform + simulated merchant), matching the production model

---

### Round 22 — Closing the Remaining Gaps: Refund Failure Path, EXCHANGE Routing (Phase 2 only), Retention, Settlement, Month-Locking & More

> Twenty questions targeting every remaining open item in the document. All answers were "A" (the recommended option) except Q9 (refund aging: B with Meikigo-admin override), Q10 (overtime: B, will verify before launch), Q11 (email pricing: launch at RM0, configure after deployment), and Q12 (add-on pricing: already exists in the document — confirmed Round 11/13). This round closes the last HitPay integration gaps (recurring auto-charge, refund failure path, EXCHANGE routing, minor-unit format), the long-deferred month-locking question from Round 18, the PDPA retention schedule, the backup config, and the subscription downgrade enforcement.

**⭐ HitPay integration — final gaps closed**
✅ **Recurring billing uses auto-charge mode** — HitPay stores the card token (no PCI-sensitive storage on Meikigo's side). This closes the manual-vs-auto question open since Round 19
✅ **Refund failure path: 3 auto-retries (1 min, 5 min, 30 min), then REFUND_FAILED + alert, admin re-approves to retry.** POS shows "Refund approved — processing" as intermediate status
⛔ SUPERSEDED in Phase 1 by Round 23 Q16: exchange is implemented as **refund + new sale**, so EXCHANGE routing is not used in Phase 1 (Phase 2 only, if a dedicated exchange money-flow is reintroduced).
✅ **HitPay API format: decimal string in ringgit with 2 decimal places** (e.g. '10.50'). Receipt displays the same amount computed internally
✅ **RM0 commission on high-fee methods: accepted** — international cards, Paylater by Grab, Atome are uncommon at barbershops

**Accounting & compliance**
✅ **Month-locking: YES** — owner can lock a month, only owner can unlock, unlocking is logged. Closes Round 18 deferral
✅ **PDPA retention schedule:** financial/transaction data = 7 years (held indefinitely); marketing consent + blast lists = deleted on cancel or after 12 months; support tickets = 3 years. Must be in the Merchant Agreement and privacy notice
✅ **Overtime rules: will be verified by an accountant before launch** — commitment exists, verification does not yet. Moved to launch checklist

**Settlement & subscription**
✅ **Settlement: no minimum balance, no frequency cap, processed within 2 business days**
✅ **Subscription downgrade: takes effect at end of billing period; merchant must reduce resources first; read-only until they do**
✅ **Resubscription after cancellation: self-service** (reconfirmed)

**Refund mechanics**
✅ **Pending refund requests: auto-reject after 14 days if no admin action** (supersedes Round 14's "never cancels"). Meikigo admin can override to keep open. Daily nag continues during 14 days
✅ **Staff-created accounts: flagged `staff_provisioned`, no marketing, no referrals until claimed, 20/day rate limit per Outlet**

**KYB & environment**
✅ **KYB documents for Malaysia: SSM cert, owner IC (front+back), selfie, bank account details, address proof** — all collected in Organisation setup
✅ **POS `.env.example` templated now:** KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, API_BASE_URL, ENVIRONMENT
✅ **Database backup: 30-day retention, PITR enabled, monthly test restore**
✅ **Email tier pricing: launch at RM0, configurable in meikigo-admin post-deployment**
✅ **Add-on pricing: already set** (Round 11/13) — outlet RM45/45/39, barber RM15/15/12, staff RM10/10/8, login RM15/15/12, catalog 10-pack RM9, marketing RM49/49/39 (STARTER/PLUS/PRO)

---

### Round 26 — HitPay billing, QR life, POS NFC, settlement screens, disputes

> Round 26 answers mapped to the Round 25 question text. Most answers are **(a)** as recommended. Two are not plain A: **Q1** (custom: subscribe = domestic card only; POS = DuitNow + card) and **Q4** (A plus POS card tap on the tablet's built-in NFC). **Round 24 HitPay questions remain unanswered** — see [`open-hitpay.md`](open-hitpay.md). Do **not** treat DuitNow refunds, `platform_commission_amount` > 0, unified vs payment-request webhooks, wallet reserve, Touch 'n Go, tips-in-HitPay-amount, etc. as closed.

**⭐ Brand → Meikigo billing**
✅ **Subscribe / Recurring Billing is DOMESTIC CARD ONLY.** DuitNow is dropped from first subscribe and from renewals. POS stays DuitNow + card. Recorded as given: *"recurring billing such as subscribe : domestic card only"* / *"DuitNow + Card for other than that"*
✅ **No merchant auto-charge vs pay-each-month setting.** Paid Brands = auto-charge. Manual pay = support fallback only
✅ **HitPay owns subscription retries.** Meikigo only listens to webhooks. Do **not** also run a 3× / 2-day Meikigo charge job
✅ **Card capture for billing:** HitPay hosted save-card / checkout (or embed), then return to Meikigo. Never host PAN
✅ **FREE:** keep the Brand POS HitPay account; **no** Recurring Billing; **no card** collected
✅ **Mid-cycle add-on:** one-off prorated HitPay charge now; raise Recurring Billing amount from the **next** cycle
✅ **Instant upgrade:** one-off gap now; **cancel** old HitPay subscription; **new** plan starting today (anniversary reset)
✅ **One HitPay Recurring Billing subscription per Brand** whose amount = base (if paid) + all active add-ons. Cancel base → base portion RM0 / FREE (no Recurring Billing on FREE) but **keep add-on lines** until cancelled one by one
✅ **Amount sent to HitPay for subscription = GROSS (tax-inclusive).** Invoice shows net / SST / gross matching HitPay

**⭐ POS checkout, QR, split, refunds**
✅ **POS card = tap on the POS tablet if it has built-in NFC (HitPay).** Supersedes Round 21 "no physical reader / key the card / HitPay's own app". Tablets without NFC: DuitNow QR + cash. Bluetooth terminals stay out of Phase 1. ⚠️ Confirm HitPay's in-app NFC / Tap to Pay SDK for Malaysia before promising it in copy
✅ **QR `expires_after` = 15 minutes.** Reconciliation: first check at 3 min, then every 5 min, mark `FAILED` at **20 minutes**. Retry after expiry
✅ **Always `generate_qr = true` for DuitNow.** Draw the QR on the POS. Do not open HitPay web checkout for QR pay
✅ **Group split: one QR at a time.** Cashier picks whose share. That share must succeed, fail, or skip to cash before the next
✅ **Refund if HitPay says charge not confirmed yet:** keep "Refund approved — processing" and retry 1 / 5 / 30 min until refundable or 3 retries fail. ⚠️ DuitNow refund support itself is still Round 24
✅ **Allow any card HitPay accepts** (including international). Show the **actual fee** on the Z-report. 0% Meikigo commission on international already accepted (Round 22)
✅ **Wizard practice sale is CASH ONLY** — never HitPay, never Z-report / tips / loyalty / commission

**⭐ Settlement, bank, disputes, sandbox**
✅ **`meikigo-merchant`: Request payout.** Last known available balance (or "we will confirm"), optional note → ticket in `meikigo-admin`. Staff payout in HitPay. **No** merchant self-serve HitPay payout API
✅ **Finance-only role completes payout.** Support can create the ticket, not complete it. Log who / amount / HitPay payout id
✅ **Bank change after KYB:** owner requests in merchant (new account + bank + proof). Staff update HitPay. Electronic pay stays on. **Payouts pause** until HitPay accepts the new bank
✅ **Subscribe to chargeback / dispute events.** Create a `DISPUTE` record, freeze related settlement, alert Meikigo staff
✅ **Sandbox never becomes live.** Env flag on `meikigo-api`. Production never stores sandbox keys. Each live Brand = new live HitPay account + KYB. Staging Brands are not copied as live payers

---

### Open — gaps surfaced by Round 20

✅ ~~The commission-ceiling arithmetic tension~~ — **CLOSED (Round 21): the 2% is a guideline, not a hard cap.** `meikigo-admin` allows any combination without validation — no system-enforced ceiling exists
✅ ~~What happens if the HitPay refund API call itself fails after admin approval~~ — **CLOSED (Round 22): auto-retry 3 times (1 min, 5 min, 30 min), then REFUND_FAILED + alert Meikigo staff, admin can re-approve to retry**

### ⏸️ Adopted but deliberately not built at launch

⏸️ **The PRO data export / read-only API (Round 13, deferred Round 16)** — built when a PRO merchant asks. **Must not appear on the published PRO feature list until it exists.** Shape when it comes: read-only, Brand-scoped key, rate-limited, revocable, audited, exposing only what today's exports already contain
⏸️ **Bahasa Malaysia** — after launch. Externalised strings are a requirement now so this stays cheap; the email templates, printed receipt, wizard copy and **the Round 17 help articles** are the ones that hurt most if hardcoded
⏸️ **Prepaid packages and gift vouchers** — Phase 2 by instruction (Round 7). Recorded so the deferred-revenue consequence stays visible: money taken for undelivered cuts is a customer liability
⏸️ **Client Terms of Service, privacy notice, and merchant terms** — **on hold by instruction (Round 15)**: *"Wait for my command. do remind me again when the document completed."* **This is the reminder I owe** — it will be raised when this requirements document is finished. ⚠️ Both apps collect personal data from day one, and a lawyer takes time to reply. **Round 17 added two things they must now carry: the daily-backup statement, and disclosure that Meikigo support can access a merchant's account**
⏸️ **⭐ A promo code for online bookings (Round 18)** — *"C" — later, after launch.* A simple code (amount or percentage off, start/end date, a usage limit), applied at booking and shown on the receipt. Not "no", just not now — it is the offer that fills a quiet Tuesday and gets people booking through the app instead of walking in

### ⛔ Declined, and recorded so they are not re-litigated by accident

*(Each of these was offered with a recommendation and turned down deliberately. They are listed together because the consequence of each is a known, accepted hole rather than an oversight.)*

⛔ **Supplier records on stock-in (Round 17)** — spend per supplier and price comparison between suppliers are unanswerable
⛔ **Barcode scanning (Round 17)** — ⚠️ the cost of adding it later is retro-fitting barcodes onto stock already on the shelf
⛔ **Shift close (Round 17)** — ⚠️ a cash shortage has no name against it, in a shop with a morning and an evening person
⛔ **A cancellation notice window (Round 17)** — a customer may cancel ten minutes before the slot at zero cost. Sits beside the accepted zero-points no-show gap (Round 16)
⛔ **A booking waitlist (Round 17)** — a fully booked day offers the walk-in queue instead
⛔ **A Meikigo public-holiday calendar (Round 17)** — ⚠️ ~15 dates typed per Outlet per year, forever, and **attendance and payroll both depend on the list being current**
⛔ **Carrying a barber's ratings to a new branch (Round 17)** — a senior barber restarts at zero and is hidden from the public score until 5 fresh ratings
⛔ **Automatic complaint-spike suspension and any send-frequency limit (Round 15)** — a human acts on a warning instead; Brevo is the real backstop
⛔ **Free add-on units on any plan (Round 15)**, and **a merchant-visible Meikigo access log for READS (Round 15)** — ✅ Round 18 confirmed the *changes* made in a support session ARE now shown to the merchant on PRO's audit log, which narrows this to reads only; see Meikigo support access → Attribution
⛔ **Recurring-expense templates (Round 18)** — *"B"*. Rent, internet and insurance are typed by hand every month. ⚠️ A feature needing twelve manual entries a year is used in January and abandoned by March, quietly understating cost from the month it lapses
⛔ **An outlet-scoped Manager role (Round 18)** — *"B"*. Admin and Cashier stay the only two staffing roles. ⚠️ On a multi-outlet Brand, the only way to let someone on-site approve a refund is to make them a full Admin, who then also sees every other outlet's payroll and the Brand's profit
⛔ **Ad-hoc buyer-detail capture for an individual e-Invoice at the POS (Round 18)** — *"doesn't make sense. nobody will use haircut as tax exemption. its personal things."* Partially supersedes Round 5. ⚠️ A genuine request (a company booking corporate grooming) has no self-serve path and becomes a manual back-office exception

### ⛔ KIV — HitPay & payments — CLOSED (Round 19)

*Kept briefly for provenance. Every item that sat parked here since the payments section was first written is now resolved — see Round 19 in Key Decisions Made, and Payment Gateway above, for the detail behind each.*

✅ ~~HitPay Business Platform Partner status~~ — **CLOSED (Round 19): confirmed already agreed — "A."** Meikigo holds the partner-tier account; each Brand gets its own connected account created by Meikigo
✅ ~~One HitPay integration or two~~ — **CLOSED (Round 19): two, tied together by the partner relationship** — Meikigo's own master account for subscriptions + commission; each Brand's own connected account for its POS sales
✅ ~~Order-fulfilment trigger for POS payments~~ — **RESOLVED (Round 9): the webhook is the source of truth, the redirect is UI only.** See Payment Gateway → Payment completion
✅ ~~POS-side payment method matrix per tier~~ — **CLOSED (Round 19), then narrowed (Round 20): card + DuitNow QR on every tier, no eWallet upsell on any tier.** **NFC path updated (Round 26): tap on POS tablet when it has NFC, not HitPay's own mobile app.**
✅ ~~Dispute/chargeback process~~ — **CLOSED (Round 19): Meikigo handles disputes, evidence stored in-platform, support-only screen (my recommendation, not explicitly asked) — "B."**
✅ ~~Meikigo's platform commission rate on POS transactions~~ — **CLOSED (Round 19): a 2% ceiling, Meikigo takes (2% − HitPay's own %) per method** — see the full rate table in Payment Gateway. ⚠️ Consequence still needs confirming: three high-fee methods yield Meikigo RM0 (see Launch checklist). ⚠️ **Round 20 added HOW it's configured (two independent percentages in `meikigo-admin`) but its own example contradicts the 2% ceiling** — see Launch checklist
✅ ~~`HITPAY_*` environment variables~~ — **CLOSED on placement (Round 19): everything lives in `meikigo-api`, nothing in `meikigo-merchant`.** Exact variable names still pending a check against HitPay's live docs (see Launch checklist)

### ✅ Closed since the last rebuild

*Kept briefly so nothing here is mistaken for still-open work.*

✅ ~~The hidden support account's password mechanism~~ — **CLOSED (Round 18): kept shared, exactly as first stated.** The risk stays recorded, not removed
✅ ~~Is a support session shown to the merchant?~~ — **CLOSED (Round 18): yes, for changes** — stamped Meikigo Support, shown on the PRO audit log, plus an email to the Brand admin
✅ ~~Does a stock-in offer to post an expense?~~ — **CLOSED (Round 18): yes**, a prompt with the amount pre-filled
✅ ~~The cash-out approval threshold~~ — **CLOSED (Round 18): RM20, merchant-configurable**, 0 means always require approval
✅ ~~The small-send complaint threshold~~ — **CLOSED (Round 18): 3 complaints in 30 days**
✅ ~~Is a bulk-import batch reversible?~~ — **CLOSED (Round 18): yes**, and a file name cannot be reused per Brand — a repeat upload is rejected before processing
✅ ~~Is `meikigo-employee-mobile` a real product?~~ — **CLOSED (Round 18): no, formally deprecated**, reconfirmed in the merchant's own words after standing unmentioned in this document
✅ ~~A P1 fallback for the single support person~~ — **CLOSED (Round 17): handled internally.** *"you don't have to worry about this. We will handle internally"*. The public promise stays Mon–Sat 9am–6pm
✅ ~~A monitored address for the deliverability alert~~ — **CLOSED (Round 17): it is a `meikigo-admin` setting.** Which turns it from a spec gap into a launch-checklist item — the setting ships empty
✅ ~~Should a Brand set a real reply-to address?~~ — **CLOSED (Round 17): no.** No-reply for everyone; the field can be added later without changing anything else
✅ ~~What the wizard's suggested services should be~~ — **CLOSED (Round 17): Haircut RM25, Beard trim RM15, Hair wash RM10, Kids cut RM18**
✅ ~~Does the "affected bookings" screen get built once or per setting?~~ — **CLOSED (Round 17): once, shared**, with a closed list of the settings that must route through it
✅ ~~Both launch blockers~~ — **CLOSED (Round 11): the six add-on prices, and the sending domain `meikigo.com`.** *Nothing blocks launch today; everything above is ordinary open detail or configuration*
✅ ~~Group Split Payment completion rule~~ — **MOOT (Round 19): the question assumed the feature was being removed. It wasn't** — *"Im sorry, my mistake, the split payment still have."* Nothing changes; see Round 19
✅ ~~Webhook signature algorithm/header~~ — **CLOSED (Round 19): `Hitpay-Signature`, HMAC-SHA256 of the raw body, keyed by the account salt** — no timestamp check, verify + process idempotently
✅ ~~Webhook idempotency key~~ — **CLOSED (Round 19): both `reference_number` and a hash of (id + status + updated_at)**
✅ ~~POS payment state machine~~ — **CLOSED (Round 19): `PENDING`/`SUCCESS`/`FAILED`, unchanged from what already existed; late webhooks always correct forward**
✅ ~~Reconciliation cadence~~ — **CLOSED (Round 19), then tightened (Round 26): 3 minutes, then every 5, mark `FAILED` at 20 minutes; QR `expires_after` = 15 minutes**
✅ ~~Receipt/review-prompt timing~~ — **CLOSED (Round 19): only after webhook `SUCCESS`, no interim receipt**
✅ ~~Customer closes browser mid-payment~~ — **CLOSED (Round 19): POS stays `PENDING` without blocking the cashier, plus a manual refresh button**
✅ ~~Subscription retry state during the 2 retries~~ — **CLOSED (Round 19): stays `ACTIVE` until the third and final failure** — **⛔ SUPERSEDED (Round 26): HitPay owns retries; Meikigo does not run the 3× job**
✅ ~~Refund idempotency mechanism~~ — **CLOSED (Round 19): HitPay's refund reference is the key, guarded by Meikigo's own refund-request row lock since HitPay's endpoint doesn't appear to take a client-supplied idempotency key**
✅ ~~Amount sent to HitPay for electronic payments~~ — **CLOSED (Round 19): the snapshotted post-discount line total, no extra rounding — consistent with cash-rounds-only (Round 11B)**
✅ ~~Must-log fields and must-alert conditions~~ — **CLOSED (Round 19): log broadly; alert on signature failures, duplicate storms, reconciliation mismatches, timed-out pending payments; Meikigo staff only**
✅ ~~Payment-request creation defaults (allow_repeated_payments, expires_after, send_email/send_sms, add_admin_fee)~~ — **CLOSED (Round 20), then `expires_after` set to 15 min + `generate_qr = true` (Round 26)**
✅ ~~Which identifiers are stored per POS payment~~ — **CLOSED (Round 20): payment request `id`, webhook `payments[0].id`, and `reference_number`, all three**
✅ ~~Which webhook events are subscribed~~ — **CLOSED (Round 20): `payment_request.completed`, `payment_request.failed`, and `charge.updated`** — **extended (Round 26): chargeback/dispute events too**
✅ ~~Full vs. partial refunds~~ — **CLOSED (Round 20): both allowed, merchant's choice, on services or products**
✅ ~~Exact refund-approval sequencing~~ — **CLOSED (Round 20): HitPay called immediately on approval; Transaction confirmed `REFUNDED` only on the `charge.updated` webhook.** **✅ Failure path CLOSED (Round 22): auto-retry 3 times (1 min, 5 min, 30 min), then `REFUND_FAILED` + alert; admin re-approves to retry.** **Round 26:** if HitPay says the charge is not confirmed yet, keep “Refund approved — processing” and use the same retry schedule. DuitNow *whether refunds are possible at all* is still [`open-hitpay.md`](open-hitpay.md) Q2.
✅ ~~API rate-limit safety~~ — **CLOSED (Round 20): internal throttling on payment-request creation, webhooks primary, reconciliation is the only sanctioned polling path**
✅ ~~Integration path (OAuth vs Direct API Key)~~ — **CLOSED (Round 21): Direct API Key** — Meikigo creates the account, stores the key, no OAuth needed
✅ ~~HitPay account creation timing~~ — **CLOSED (Round 21): immediately after Organisation setup; cash-only until KYB clears**
✅ ~~HitPay KYB document collection~~ — **CLOSED (Round 21): Meikigo collects and submits on the merchant's behalf** — merchant never touches HitPay
✅ ~~Platform Key required?~~ — **CLOSED (Round 21): yes, must be obtained before Phase 1 launch**
✅ ~~Commission collection method~~ — **CLOSED (Round 21): per-transaction `platform_commission_amount` parameter**
✅ ~~Unified vs per-merchant webhooks~~ — **CLOSED (Round 21): unified webhooks through Platform Key**
✅ ~~Subscription billing API~~ — **CLOSED (Round 21): HitPay's Recurring Billing API** — plans per tier, subscriptions per Brand
✅ ~~Subscription billing payment methods~~ — **CLOSED (Round 21): cards only (Visa, Mastercard)** — DuitNow dropped from recurring
✅ ~~POS QR method codes~~ — **CLOSED (Round 21): `duitnow`, `touch_n_go`** — **⛔ SUPERSEDED (Round 26): `duitnow` + `generate_qr = true`; Touch 'n Go not in Phase 1; cards via tablet NFC when present**
✅ ~~Physical card reader in Phase 1~~ — **CLOSED (Round 21): no** — **⛔ SUPERSEDED (Round 26): tap on POS tablet NFC if the tablet has it; no Bluetooth WisePad**
✅ ~~Payout/settlement model~~ — **CLOSED (Round 21): merchant-initiated** — Brand requests, Meikigo employee processes
✅ ~~HitPay account per Brand cardinality~~ — **CLOSED (Round 21): one per Brand regardless of outlet count**
✅ ~~Sandbox testing model~~ — **CLOSED (Round 21): two sandbox accounts** (platform + simulated merchant)
✅ ~~Payment request expiry handling~~ — **CLOSED (Round 21): Retry button creates new request, old stays FAILED**
✅ ~~Multiple payment requests per ticket~~ — **CLOSED (Round 21): one active at a time, old cancelled first**
✅ ~~Refund on closed HitPay account~~ — **CLOSED (Round 21): manual refund outside the system, recorded in Meikigo**
✅ ~~Commission on refunded transactions~~ — **CLOSED (Round 21): commission returned, HitPay handles automatically**
✅ ~~2% commission ceiling enforcement~~ — **CLOSED (Round 21): guideline only, no system validation cap**
✅ ~~FREE tier HitPay account~~ — **CLOSED (Round 21): yes, every Brand regardless of tier**
✅ ~~Admin fee / surcharge~~ — **CLOSED (Round 21): not in Phase 1**
✅ ~~Merchant HitPay access mechanics~~ — **CLOSED (Round 21): support-mediated by default, credentials available on email request**
✅ ~~Month-locking~~ — **CLOSED (Round 22): yes, owner can lock/unlock, logged**
✅ ~~Settlement rules~~ — **CLOSED (Round 22): no minimum, no cap, 2 business days**
✅ ~~Refund API failure path~~ — **CLOSED (Round 22): 3 auto-retries, then REFUND_FAILED + alert**
⛔ SUPERSEDED in Phase 1 by Round 23 Q16: exchange uses **refund + new sale**, so EXCHANGE settlement routing is Phase2 only (only relevant if a dedicated exchange money-flow is reintroduced).
✅ ~~Recurring billing auto-charge vs manual~~ — **CLOSED (Round 22): auto-charge, HitPay stores card token**
✅ ~~Minor-unit conversion~~ — **CLOSED (Round 22): decimal string in ringgit, 2 decimal places**
✅ ~~POS refund intermediate status~~ — **CLOSED (Round 22): "Refund approved — processing"**
✅ ~~Pending refund aging~~ — **CLOSED (Round 22): auto-reject after 14 days, Meikigo admin override available**
✅ ~~Staff-created account controls~~ — **CLOSED (Round 22): staff_provisioned flag, no marketing/referrals until claimed, 20/day rate limit**
✅ ~~RM0 commission on high-fee methods~~ — **CLOSED (Round 22): accepted**
✅ ~~KYB document list for Malaysia~~ — **CLOSED (Round 22): SSM cert, IC, selfie, bank details, address proof**
✅ ~~Subscription downgrade enforcement~~ — **CLOSED (Round 22): end-of-period, must reduce first, read-only until compliant**
✅ ~~Database backup configuration~~ — **CLOSED (Round 22): 30 days, PITR on, monthly test restore**
✅ ~~POS .env.example~~ — **CLOSED (Round 22): template now with Keycloak + API vars**
✅ ~~PDPA retention schedule~~ — **CLOSED (Round 22): financial 7yr+, marketing 12mo post-cancel, support tickets 3yr**
✅ ~~Brand → Meikigo payment methods~~ — **CLOSED (Round 26): domestic card only for subscribe/renew; POS = DuitNow + card**
✅ ~~Merchant auto vs manual recurring setting~~ — **CLOSED (Round 26): no setting; paid Brands auto-charge; manual = support fallback**
✅ ~~Who retries failed subscription charges~~ — **CLOSED (Round 26): HitPay owns retries; Meikigo listens only**
✅ ~~Where the owner types the subscription card~~ — **CLOSED (Round 26): HitPay hosted save-card/checkout, then return to Meikigo**
✅ ~~FREE Recurring Billing~~ — **CLOSED (Round 26): POS HitPay account yes; Recurring Billing no; no card**
✅ ~~Mid-cycle add-on HitPay charge~~ — **CLOSED (Round 26): one-off prorated now; Recurring amount next cycle**
✅ ~~Instant upgrade HitPay sequencing~~ — **CLOSED (Round 26): one-off gap now; cancel old subscription; new plan from today**
✅ ~~QR expiry vs reconciliation TTL~~ — **CLOSED (Round 26): 15 min QR; FAILED at 20 min**
✅ ~~Embedded QR vs HitPay page~~ — **CLOSED (Round 26): `generate_qr = true` for DuitNow**
✅ ~~Group split QR presentation~~ — **CLOSED (Round 26): one QR at a time**
✅ ~~Refund before wallet confirmed~~ — **CLOSED (Round 26): keep processing; retry 1/5/30 min** (DuitNow refund *possibility* still Round 24)
✅ ~~Settlement request UI~~ — **CLOSED (Round 26): Request payout in merchant; finance completes in admin**
✅ ~~Who may complete payout~~ — **CLOSED (Round 26): finance role only**
✅ ~~Bank change after KYB~~ — **CLOSED (Round 26): owner requests + proof; payouts pause; electronic pay stays on**
✅ ~~Practice sale vs HitPay~~ — **CLOSED (Round 26): cash only, never HitPay**
✅ ~~SST-inclusive amount to HitPay~~ — **CLOSED (Round 26): send GROSS; invoice shows net/SST/gross**
✅ ~~International cards at POS~~ — **CLOSED (Round 26): allow if HitPay accepts; show actual fee on Z-report**
✅ ~~Chargeback webhook~~ — **CLOSED (Round 26): subscribe; DISPUTE record; freeze settlement; alert staff**
✅ ~~Sandbox vs live Brand accounts~~ — **CLOSED (Round 26): env flag; never store sandbox keys in production; new live account + KYB per live Brand**
✅ ~~Add-ons after base cancel vs one Recurring subscription~~ — **CLOSED (Round 26): one subscription = base + add-ons; cancel base keeps add-on lines**

### Open — still outstanding from earlier rounds

❓ **Round 24 HitPay questions — unanswered.** See [`open-hitpay.md`](open-hitpay.md). Do **not** treat DuitNow refunds, `platform_commission_amount` > 0, unified vs payment-request webhooks, wallet reserve, Touch 'n Go, tips-in-HitPay-amount, NFC vs HitPay's own checkout leftovers, chargeback RM200, unique `reference_number` on retry, HitPay Locations, late SUCCESS vs month lock, or amount-change-after-QR as closed. Round 26 did not answer them.
❓ **Prepaid packages and gift vouchers** — wanted but explicitly not this phase (Round 7). Recorded here so the deferred-revenue consequence stays visible: money taken for undelivered cuts is a customer liability, and the ledger should be able to hold one later
❓ **LHDN e-Invoice timing** — Round 10 answered "don't know yet", which is fine. Worth asking an accountant eventually, since it only affects how urgent Phase 2 submission becomes
❓ **Leave ENTITLEMENT — still later**, with the Phase 2 punch card. The system records leave *taken*, never leave *remaining*

### Owed by me (not questions — work accepted and not yet delivered)

**⏸️ Both documents are DEFERRED BY INSTRUCTION (Round 15).** Recorded as given: *"Not now. Wait for my command. do remind me again when the document completed"*. So they are not being drafted yet, and **I will raise them again once this requirements document is finished** — that is the reminder, recorded here so it does not depend on anyone remembering.

📝 **Client Terms of Service + privacy notice** — accepted in Round 7, its own versioned document for a lawyer to review. Must cover the retention position (transaction records kept for accounting/tax, no promise of complete erasure), marketing consent **including the Round 14 merchant-declared consent for imported customers**, and the no-mention-of-soft-deletion rule. **Not yet written — on hold**
📝 **Merchant terms of purchase** — the Round 9 outcome: not a separate agreement, but a short versioned block shown at subscription checkout. Must state the retention position identically to the privacy notice, must say that the merchant owns their customer list, and should now also cover **the monthly email allowance not rolling over**, **who is responsible for the consent behind an imported customer list**, and **⭐ two additions from Round 17: that Meikigo takes a daily backup of its database (worded as what is done, never as a guarantee), and that Meikigo support staff can access a merchant's account for support purposes**. **Not yet written — on hold**
- ⚠️ **The one thing worth knowing while they wait:** both apps collect personal data from day one, so **launching without a published privacy notice is a PDPA exposure**, not a tidy-up task. A lawyer also takes time to respond. Neither is a reason to override the instruction — it is a reason to give the command early rather than in launch week.

### Open — future phases

❓ **F&B / Services phase requirements** — expected to be a separate application; no requirements written yet. Recorded here only so the assumption stays visible: the current build is barber-first by design and is not being generalised in advance
