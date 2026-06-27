## **BUSINESS REQUIREMENTS DOCUMENT** 

## **Point-of-Sale (POS) System** 

for Small Food & Beverage (F&B) Businesses 

|**Document Title**|POS System – Business Requirements Document|
|---|---|
|**Version**|0.8 (Draft)|
|**Date**|25 June 2026|
|**Status**|**Parked — Phase 2.** Do not implement until Phase 1 PMF gate (see [`../planning/phase1-plan.md`](../planning/phase1-plan.md)).|
|**Phase 1 authority**|[`phase1-plan.md`](../planning/phase1-plan.md) + [`initial-brd.md`](../planning/initial-brd.md)|
|**Decision**|Path A adopted 25 June 2026 — see [`phase1-plan.md`](../planning/phase1-plan.md)|
|**Author**|_To be filled_|
|**Approver**|_To be filled_|



**CONFIDENTIAL — INTERNAL DRAFT FOR REVIEW** 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **Table of Contents** 

_(Right-click below and choose “Update Field” — or press Ctrl+A then F9 — to populate this table after opening in Word.)_ 

Version 0.8 (Draft)Page 2 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

_**Focus:** This document targets_ _**Food & Beverage (F&B)** outlets. **It is not Phase 1 work.** Phase 1 builds the service-SME wedge (barbers, salons, clinics) per [`initial-brd.md`](../planning/initial-brd.md) and [`phase1-plan.md`](../planning/phase1-plan.md). F&B delivery reuses Phase 1 platform modules when the PMF gate is met._

_**Previous note (v0.8):** Barbershop was listed as a separate track — priority is now **inverted**. Service SMEs are Phase 1; this F&B BRD is Phase 2._ 

## **1. Introduction** 

## **1.1 Purpose** 

This document defines the business requirements for a Point-of-Sale (POS) system designed for small Food & Beverage (F&B) outlets. It describes the business objectives, scope, user roles, functional and non-functional requirements, and the end-to-end process flows that the system must support. It serves as the agreed reference between business stakeholders and the development team before solution design begins. 

## **1.2 Intended Audience** 

Business owners, product owners, the development team, QA, and any third parties involved in delivering the system. 

## **1.3 Document Conventions** 

- **BR** = Business Requirement (high-level "what the business needs"). 

- **FR** = Functional Requirement (specific system behaviour). 

- **NFR** = Non-Functional Requirement (quality attribute). 

- Requirement priority: **M** = Must have, **S** = Should have, **C** = Could have. 

- **KIV** = Keep in view (noted, to be decided later). 

## **1.4 System Surfaces** 

The solution has three surfaces: 

- **Merchant Web Portal (Admin Dashboard)** – a web application where business owners register, select a package, create a business, set up stores, manage users, and configure menu/pricing/settings. 

- **Staff App (Native, React Native)** – kitchen, waiter, and cashier use a native mobile app built in React Native, which receives push notifications (e.g. the kitchen is notified of new orders). Each staff member logs into their own account on their own device. 

- **Customer Ordering (Web)** – customers scan a QR and order from a mobile web interface; no app install required. 

## **1.5 Technical Architecture (Confirmed Stack)** 

While this document is primarily a business requirements document, the technology stack has been confirmed and is recorded here for reference and to inform the constraints in Section 10. 

|**Layer**|**Choice**|
|---|---|
|Architecture style|Client-Side Rendering (CSR) for all web frontends|
|Admin Dashboard (web)|React + Vite|
|Customer Ordering (web)|React + Vite|
|Staff App (mobile)|React Native with Expo, targeting both iOS and Android|
|Backend|Kotlin + Spring Boot|
|API style|REST API + WebSocket (for real-time order/status updates)|



Version 0.8 (Draft)Page 3 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

|**Layer**|**Choice**|
|---|---|
|Database|PostgreSQL|
|Caching / queue layer|None for v1 (no Redis); polling/WebSocket via the database is sufficient at<br>current scale|
|Push notifications|Firebase Cloud Messaging (FCM)|
|Cloud provider|Oracle (OCI)|
|Hosting model|Self-managed (not using managed DB/Kubernetes services)|
|Media / image storage|Oracle Cloud (object storage / CDN)|
|Authentication|Built in-house (not using a managed auth provider)|
|Minimum device support|Devices launched in 2016 onward (iOS and Android)|



There are four separate codebases/applications: 

1. **Admin Dashboard** — React + Vite web app. 

2. **Mobile App** — React Native (Expo) app for kitchen, waiter, and cashier. 

3. **Customer Ordering Web** — React + Vite web app. 

4. **Backend** — Kotlin + Spring Boot, serving all three frontends via REST and WebSocket. 

Version 0.8 (Draft)Page 4 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **2. Business Overview** 

## **2.1 Background** 

Small F&B outlets often rely on manual ordering, paper tickets, and cash-drawer record keeping. This leads to order errors, slow service, lost sales records, and no reliable sales reporting. The proposed POS system digitises the order-to-payment journey, reduces staff workload, and produces accurate sales data for owners. The platform is also designed so a single owner can run one or many stores from one account. 

## **2.2 Business Objectives** 

|**ID**|**Objective**|
|---|---|
|OBJ-1|Let customers self-order and reduce dependency on floor staff.|
|OBJ-2|Route orders to the kitchen instantly and accurately.|
|OBJ-3|Automatically generate invoices from confirmed orders to eliminate manual billing errors.|
|OBJ-4|Centralise payment collection and record every transaction (with method) into sales.|
|OBJ-5|Provide owners with reliable sales reporting and visibility.|
|OBJ-6|Allow a business owner to manage one or multiple stores from a single account.|



Version 0.8 (Draft)Page 5 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **3. Project Scope** 

## **3.1 In Scope** 

- Merchant self-registration, subscription package selection, and login via the website. 

- Business creation with single-store or multi-store setup; per-store admin and user management. 

- Password reset / account recovery for merchants and staff. 

- Per-store configuration of menu, pricing, categories, order mode, tax, and QR-ordering on/off. 

- Menu items with variants (e.g. size) and add-ons (e.g. toppings) that affect price, item photos, and time-based availability. 

- Table and QR management, with table open/closed status and a separate takeaway QR. 

- QR-code based self-ordering, with special instructions, an order-ID confirmation, and a "Check Progress" status lookup. 

- Shared table ordering (multiple diners on one table QR form one order/bill) and additional rounds on the same open bill. 

- Configurable order mode per store (Pay First or Eat First). 

- Kitchen approval with item-level rejection (e.g. sold out), customer notification, and per-item or whole-order "ready". 

- Push notifications to the staff app. 

- Automatic invoice generation with configurable tax (added on top) and rounding rules. 

- Cashier payment with manual method selection (cash / QR / card), cash change calculation, and split payment. 

- Mark-as-unpaid handling for walk-outs. 

- Void and partial/whole refund handling. 

- Multiple cashiers per store (own account, one device per account). 

- Cashier shift open/close and end-of-day cash reconciliation. 

- Digital receipt via QR code. 

- Sales reporting/dashboard (including payment-method breakdown). 

- Role-based access control. 

## **3.2 Out of Scope (for this phase – to confirm)** 

- Barbershop and other business types (planned as a separate product/track). 

- Discounts, vouchers, and promo codes (planned for a later phase). 

- Tips / gratuity (not required). 

- Multiple prep stations / separate bar/kitchen displays (single kitchen display only). 

- Printed kitchen tickets (kitchen screen/app only). 

- Multi-language customer menu (single language only). 

- Allergen / dietary labels. 

- Estimated wait time. 

- Integration with external payment gateways/platforms (payment method is selected and recorded manually). 

- Delivery / third-party aggregator integration. 

- Inventory/stock management, loyalty, and accounting integration. 

Version 0.8 (Draft)Page 6 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **4. Stakeholders & User Roles** 

|**Role**|**Description**|**Surface**|
|---|---|---|
|Business Owner<br>(Merchant)|Registers, selects a package, creates the business, sets up stores,<br>manages users, configures menu/pricing/settings. Can also act as a<br>store admin.|Web Portal / Staff<br>App|
|Store Admin|Manages a single store: users, menu, pricing, settings, tables,<br>QR-ordering toggle.|Web Portal / Staff<br>App|
|Cashier|Collects payment, splits bills, calculates change, marks unpaid,<br>voids/refunds, manages shift.|Staff App|
|Kitchen Staff|Receives orders via push notification, approves, rejects sold-out<br>items, marks items/order ready.|Staff App|
|Waiter / Floor Staff<br>(optional)|Can place an order by scanning the table QR like a customer.|Customer Web|
|Customer|Scans QR, browses menu, orders, checks progress.|Customer Web|



_A single user account may hold more than one role and may manage more than one store. Each staff member logs in with their own account on their own device._ 

Version 0.8 (Draft)Page 7 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **5. Business Requirements (High-Level)** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|BR-001|The system shall allow business owners to self-register, select a package, and manage their<br>business online.|M|
|BR-002|The system shall support a single store or multiple stores under one business, with<br>independent menus.|M|
|BR-003|The system shall allow customers to place orders without staff intervention when QR<br>ordering is enabled.|M|
|BR-004|The system shall deliver confirmed orders to the kitchen in real time via push notification.|M|
|BR-005|The system shall allow kitchen staff to approve orders and reject individual sold-out items.|M|
|BR-006|The system shall convert confirmed orders into an invoice automatically, with configurable<br>tax and rounding.|M|
|BR-007|The system shall allow payment (cash/QR/card), split bills, unpaid handling, refunds, and<br>record method.|M|
|BR-008|The system shall maintain a complete record of all sales per store, with shifts and<br>reconciliation.|M|
|BR-009|The system shall restrict actions based on user role and store.|M|



Version 0.8 (Draft)Page 8 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **6. Functional Requirements** 

## **6.1 Shared / Core Modules** 

## _**Merchant, Business, Store & User Management**_ 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-101|A business owner can self-register a merchant account using an email and password (e.g.<br>biznesowner@gmail.com).|M|
|FR-102|During registration, the owner can view the available subscription packages and select one.|M|
|FR-103|The selected package determines the features and limits (e.g. number of stores/users) —<br>packages to be defined.|M|
|FR-104|A registered merchant can log in to the Merchant Web Portal.|M|
|FR-105|The merchant can create a business.|M|
|FR-106|The merchant can set up a single store or multiple stores under the business.|M|
|FR-107|Each store must have exactly one designated admin user.|M|
|FR-108|The store admin can be the merchant's own account or a separate account (e.g.<br>adminstore@gmail.com).|M|
|FR-109|A single user account can be the admin of, and manage, more than one store.|M|
|FR-110|A store admin can add users and assign roles; each user has their own account (e.g. one<br>kitchen, one waiter, one cashier each log into their own device).|M|
|FR-111|A store admin can configure the store's menu, categories, and pricing.|M|
|FR-112|Each store's data is isolated; menus are independent per store (not shared or cloned).|M|
|FR-113|The merchant/owner can view and manage all stores under the business from one account.|M|
|FR-114|Registration requires email verification before activation.|S|
|FR-115|An admin can deactivate or remove a user from a store.|S|
|FR-116|The owner can view, upgrade, or change their subscription package later.|S|
|FR-117|Merchants and staff can reset their password / recover their account.|M|



## _**Store Settings**_ 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-120|Admin can configure the store's order mode: "Pay First" or "Eat First".|M|
|FR-121|In "Eat First" mode, the order is sent to the kitchen immediately on submit; payment is<br>collected afterwards.|M|
|FR-122|In "Pay First" mode, the order is sent to the kitchen only after the cashier marks the payment<br>complete.|M|
|FR-123|Admin can configure tax / service charge as a percentage or fixed amount; menu prices are<br>tax-exclusive and tax is added on the invoice.|M|



Version 0.8 (Draft)Page 9 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-124|Configured tax / service charges are applied automatically to invoices.|M|
|FR-125|Rounding rules are applied to tax, totals, and cash change (exact increment to be<br>confirmed).|M|
|FR-126|Admin can enable or disable QR ordering for the store. When disabled, a customer scanning<br>the QR sees "We are not ready yet".|M|



## _**Menu / Catalogue Management**_ 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-130|Admin can create, edit, and deactivate menu items (per store).|M|
|FR-131|Each item has name, price, category, description, and active/inactive status.|M|
|FR-132|Admin can group items into categories (e.g. Drinks, Mains, Desserts).|M|
|FR-133|Admin can mark an item as temporarily unavailable (e.g. sold out).|S|
|FR-134|An item can have variants (e.g. size S/M/L) that adjust its price.|M|
|FR-135|An item can have add-ons (e.g. toppings) that adjust its price.|M|
|FR-136|Admin can define whether a variant/add-on group is required or optional, and single- or<br>multi-select.|S|
|FR-137|Admin can add a photo to a menu item (images served via CDN).|M|
|FR-138|Admin can set item availability to "all-time available" or "selected time only" (time window).|M|



## _**Table & QR Management**_ 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-140|Admin can define tables; each table has a permanent, fixed QR code.|M|
|FR-141|Admin can delete a table's QR and generate a new one.|M|
|FR-142|Admin can activate or deactivate a table QR.|M|
|FR-143|QR codes are printed manually and placed on the tables.|M|
|FR-144|A separate QR is provided for takeaway orders (not tied to a table).|M|
|FR-145|A table has a status (open / closed). The table closes when its payment is completed.|M|
|FR-146|Once a table is closed, the next QR scan starts a new order with a new order ID.|M|



## _**Order Management**_ 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-150|The system tracks each order through defined statuses.|M|
|FR-151|Each order is associated with a table or with takeaway.|M|



Version 0.8 (Draft)Page 10 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-152|Multiple diners scanning the same table QR contribute their items into one shared open<br>order/bill.|M|
|FR-153|While a table is open, additional submitted rounds add to the same order/bill and create a<br>new kitchen ticket.|M|
|FR-154|Staff can view a live queue of incoming and in-progress orders.|M|
|FR-155|A customer can add special instructions to an item (e.g. "no onion", "less spicy").|M|
|FR-156|On submit, a popup shows the order ID for the customer to copy (no estimated wait time).|M|
|FR-157|A customer can check the order status in a "Check Progress" section by entering/pasting the<br>order ID.|M|
|FR-158|A customer can modify or cancel before submitting; any change must be (re)submitted for<br>the kitchen to approve or reject.|M|
|FR-159|Order numbers are generated per store and reset daily. Format:`YYMMDD`(date) + outlet<br>number (2 digits) + sequence starting at 1000 — e.g. an order on 7 May 2026 at outlet 01 →<br>`260507011026`.|M|



## _**Invoicing**_ 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-160|The system auto-generates an invoice from a confirmed order.|M|
|FR-161|An invoice lists items (with variants/add-ons), quantities, unit price, subtotal, tax/charge<br>(added on top), and total.|M|
|FR-162|In Eat First mode, the invoice reflects only the items the kitchen accepts (rejected/sold-out<br>items excluded).|M|
|FR-163|An invoice can be adjusted before payment, with permission.|S|



## _**Payment, Cashier & Shift**_ 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-170|Cashier can retrieve an open invoice by table or order number.|M|
|FR-171|At payment, the cashier selects the method — Cash, QR Payment, or Card — then clicks<br>"Payment Complete". The method is recorded and the table is closed.|M|
|FR-172|The system does not integrate with external payment gateways; method selection is manual<br>and for record-keeping.|M|
|FR-173|For cash, the cashier enters the amount tendered and the system calculates the change<br>(with rounding).|M|
|FR-174|The cashier can split a bill by selecting individual items in the invoice to pay; tax/charges are<br>split automatically.|M|
|FR-175|The cashier can void/refund an order: find the order ID → void → refund whole order or<br>selected items (partial) → select refund method (cash or QR) → enter the refund amount.|M|



Version 0.8 (Draft)Page 11 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-176|On request, the cashier can display a QR code that the customer scans to download a digital<br>receipt.|M|
|FR-177|A cashier can open and close a shift (no starting cash float required at open).|M|
|FR-178|The system produces an end-of-day cash reconciliation / shift closing report.|M|
|FR-179|The cashier can mark an open order as unpaid (e.g. the customer left); this records it as<br>unpaid and reopens the table.|M|
|FR-180|Multiple cashiers can operate in the same store, each with their own account; one account is<br>limited to one device.|M|



## _**Sales & Reporting**_ 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-185|Every paid transaction is recorded into the store's sales ledger together with its payment<br>method.|M|
|FR-186|Owner/admin can view daily and period sales totals per store.|M|
|FR-187|Owner/admin can view sales broken down by payment method (cash / QR / card).|M|
|FR-188|Owner/admin can view sales by item and by category.|S|
|FR-189|Owner/admin can view number of transactions and average order value for a period.|S|
|FR-190|Owner/admin can view best-selling items for a period.|S|
|FR-191|Owner/admin can view total tax / service charge collected for a period.|S|
|FR-192|For multi-store businesses, the owner can compare sales across stores.|S|
|FR-193|Owner/admin can view shift / end-of-day reconciliation reports, including unpaid orders.|M|
|FR-194|Owner/admin can export sales data.|C|



## **6.2 F&B Ordering & Kitchen Module** 

The order flow depends on the store's configured order mode (see FR-120). QR ordering must be enabled for the store (FR-126). 

## **Eat First (pay after eating):** 

1. Customer scans the table QR, browses the menu, selects items (with variants/add-ons and any special instructions), and submits the order. A popup shows the order ID. 

2. The order is sent to the kitchen immediately; the kitchen receives a push notification. 

3. Kitchen reviews and approves; it may reject some or all items (e.g. sold out). The customer is notified and can order the rejected items again. 

4. Kitchen cooks the accepted items and marks them ready (per item or all). 

5. An invoice is generated for the accepted items. 

6. After eating, the customer pays at the cashier counter. 

7. The cashier selects the payment method and clicks "Payment Complete"; the transaction is recorded and the table closes. 

Version 0.8 (Draft)Page 12 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **Pay First (pay before cooking):** 

1. Customer scans the table QR, selects items, and submits the order. 

2. An invoice is generated; the customer goes to the cashier counter to pay. 

3. The cashier selects the payment method and clicks "Payment Complete". 

4. The order is then sent to the kitchen (push notification). 

5. Kitchen approves; if an item is sold out it is rejected, the customer is notified, and a refund/adjustment is processed (see FR-175). 

6. Kitchen cooks the accepted items; the transaction is already recorded. 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-201|When QR ordering is enabled, each table's permanent QR opens that table's ordering<br>session.|M|
|FR-202|Customer can browse the menu and add items with variants, add-ons, special instructions,<br>and quantity.|M|
|FR-203|Customer can submit the order; it is tied to the table (or to the takeaway QR).|M|
|FR-204|The order is routed per the store's order mode — to the kitchen first (Eat First) or to the<br>cashier first (Pay First).|M|
|FR-205|When sent to the kitchen, the order appears on the Kitchen view and triggers a push<br>notification.|M|
|FR-206|Kitchen can approve an order and can reject individual items or the whole order (e.g. sold<br>out).|M|
|FR-207|When an item is rejected, the customer is notified and can order the rejected items again.|M|
|FR-208|Kitchen can mark items as "Ready" individually or mark the whole order ready.|M|
|FR-209|A staff member can place an order by scanning the QR exactly as a customer would.|S|
|FR-210|If QR ordering is disabled for the store, a customer scanning the QR sees "We are not ready<br>yet".|M|



Version 0.8 (Draft)Page 13 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **7. Process Flow (Status Model)** 

The flow depends on the store's order mode. 

## **Eat First:** 

`Submitted` → `Sent to Kitchen` → `Approved (Cooking)` → `Ready` → `Paid` → `Table Closed` → `Recorded` 

## **Pay First:** 

`Submitted` → `Invoiced` → `Paid` → `Sent to Kitchen` → `Approved (Cooking)` → `Ready` → `Recorded` 

## Notes: 

- In both modes, the kitchen may reject some or all items at approval (e.g. sold out); the customer is notified and may reorder. 

- In Pay First, rejection after payment triggers a void/refund (FR-175). 

- If a customer leaves without paying (Eat First), the cashier marks the order unpaid and the table reopens (FR-179). 

- A table closes on payment; the next scan starts a new order (FR-145, FR-146). 

Version 0.8 (Draft)Page 14 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **8. Non-Functional Requirements** 

|**ID**|**Category**|**Requirement**|**Priorit**<br>**y**|
|---|---|---|---|
|NFR-<br>01|Performanc<br>e|An order reaches the kitchen (push notification) within a few seconds of being<br>sent.|M|
|NFR-<br>02|Usability|The customer ordering flow is mobile-friendly and requires no app install.|M|
|NFR-<br>03|Platform|Staff use a native app capable of receiving push notifications; one account is<br>limited to one device.|M|
|NFR-<br>04|Availability|The system is available during operating hours with minimal downtime.|M|
|NFR-<br>05|Reliability|No sales transaction is lost once payment is recorded.|M|
|NFR-<br>06|Security|Access to portal/admin/cashier/kitchen functions requires authentication.|M|
|NFR-<br>07|Scalability|Supports multiple concurrent tables/diners per store, and multiple stores per<br>business.|M|
|NFR-<br>08|Offline<br>tolerance|Behaviour during internet outage is defined (see Open Questions).|S|
|NFR-<br>09|Maintainabil<br>ity|Menu, pricing, and settings can be updated by the owner/admin without<br>developer help.|M|
|NFR-<br>10|Auditability|Voids, refunds, unpaid marks, and cancellations are logged with user, amount,<br>method, and reason.|M|
|NFR-<br>11|Data<br>isolation|One store cannot access another store's data unless explicitly granted.|M|
|NFR-<br>12|Media|Item images are stored and served via a CDN.|S|



Version 0.8 (Draft)Page 15 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **9. Assumptions** 

- Each table can be uniquely identified within a store; its QR sticker is permanent until the admin regenerates it. 

- A table has an open/closed status; it closes on payment and reopens if marked unpaid. 

- Customers can only order when the admin has enabled QR ordering for the store. 

- Customers have a smartphone with a camera and internet to scan the QR and order via web; they keep the browser open to check progress by order ID. 

- Staff have a device running the native staff app with push notifications, and each logs into their own account (one device per account). 

- Payment is collected at a physical cashier counter; no external gateway integration. 

- Menu is in a single language; prices are tax-exclusive with tax added on the invoice. 

- Each store configures its own menu, pricing, and settings independently. 

Version 0.8 (Draft)Page 16 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **10. Constraints** 

- Target users are small businesses; the solution must be simple and low-cost to operate. 

- Technology stack is confirmed (see Section 1.5): React + Vite (web), React Native/Expo (mobile), Kotlin/Spring Boot (backend), PostgreSQL (database), Oracle Cloud (self-managed hosting). 

- Staff devices (for the React Native app) must support devices from 2016 onward on both iOS and Android. 

- One staff account is limited to one device (for now). 

- No managed/third-party auth provider; authentication is built in-house. 

- No Redis or separate caching/queue layer in v1; real-time updates rely on REST + WebSocket against PostgreSQL directly. This should be monitored as a scaling risk (see Section 11). 

- _To be confirmed:_ budget and timeline. 

Version 0.8 (Draft)Page 17 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **11. Risks & Mitigations** 

|**Risk**|**Impact**|**Mitigation**|
|---|---|---|
|Internet outage<br>disrupts<br>ordering/payment/notifi<br>cations|Service stops|Define offline mode or manual fallback.|
|QR scanned when the<br>store is not ready|Confused customers / stray orders|QR ordering enable/disable toggle; "We are not<br>ready yet" message; kitchen approval.|
|Pay First sold-out item<br>after payment|Refund needed|Defined void/refund flow, incl. partial (FR-175).|
|Customer walks out<br>without paying (Eat<br>First)|Lost revenue / stuck table|Cashier "mark unpaid" reopens the table and<br>logs it.|
|Push notification<br>missed by kitchen|Delayed order|On-screen live queue as backup to notifications.|
|One-device-per-accou<br>nt limit|Staff friction with multiple devices|Documented as a current constraint; revisit later.|
|No caching/queue<br>layer (Redis) in v1|Possible latency/load issues as order<br>volume grows|Monitor performance; add caching layer later if<br>needed.|
|Multi-store data<br>leakage|Trust/security issue|Enforce strict per-store data isolation.|
|Scope creep<br>(discounts, delivery,<br>gateways, barbershop)|Delays|Hold extra features and other verticals for later<br>phases.|



Version 0.8 (Draft)Page 18 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **12. Dependencies** 

- Devices running the native staff app for kitchen and cashier. 

- A push-notification service and a CDN for item images. 

- Network/Wi-Fi at the outlet. 

Version 0.8 (Draft)Page 19 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **13. Glossary** 

|**Term**|**Definition**|
|---|---|
|POS|Point of Sale – the system used to process orders and payments.|
|Merchant|A registered business owner account on the platform.|
|Subscription Package|A plan the owner selects during registration that defines available features and limits.|
|Business|The top-level entity a merchant creates; can contain one or many stores.|
|Store / Outlet|A single physical location with its own menu, users, and sales.|
|Store Admin|The single designated admin user responsible for a store.|
|Order Mode|A store setting: "Pay First" (pay before the kitchen) or "Eat First" (kitchen on submit, pay<br>after).|
|Variant|An item option that changes price (e.g. size S/M/L).|
|Add-on|An optional extra added to an item that changes price (e.g. a topping).|
|Takeaway QR|A separate QR for takeaway orders, not tied to a table.|
|Table Status|Whether a table is open (accepting orders into one bill) or closed (after payment).|
|Check Progress|A customer-facing lookup where the order ID is entered to view order status.|
|Shift|A cashier work period that is opened and closed, used for cash reconciliation.|
|Invoice|Itemised bill generated from a confirmed order.|
|Sales Ledger|The record of all completed (paid) transactions.|



Version 0.8 (Draft)Page 20 of 21 

POS System — Business Requirements Document **CONFIDENTIAL** 

## **14. Open Questions / To Be Confirmed** 

1. **Offline mode:** What should happen if the internet goes down mid-service? 

2. **Subscription packages:** To be decided later — packages, limits (stores/users), pricing, billing, and how the subscription is paid. **Package limit reached behaviour is KIV** (e.g. block the action and prompt to upgrade). 

3. **Discounts/vouchers:** Confirmed as a later phase — when to schedule, and what types (percentage, fixed, voucher codes)? 

4. **Rounding rule:** Confirm the exact rounding increment (e.g. nearest 0.05) and what it applies to (tax, total, cash change). 

5. **Multi-store locale:** Can different stores use different currency or time zone, or is a single currency/locale assumed for now? (Menu language is single.) 

6. **Receipt content:** What must the digital receipt include (business details, tax breakdown, order items, etc.)? 

_Resolved in this version: notification via order-ID "Check Progress" (no browser push, no estimated wait), item photos (CDN), single-language menu, no allergen labels, additional rounds on an open table, table close on payment + new order on next scan, walk-out "mark unpaid" reopens table, time-based item availability, Pay First payment at counter, tax added on invoice, rounding applied, multiple cashiers (own account, one device), no starting float, partial refunds, kitchen per-item or whole-order ready, no printed kitchen ticket, staff email/password login per device, password reset/recovery, and manual QR-ordering enable toggle._ 

Version 0.8 (Draft)Page 21 of 21 

