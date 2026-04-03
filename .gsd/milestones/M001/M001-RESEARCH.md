# Project Research Summary

**Project:** OpenPOS - Retail POS/ERP System
**Domain:** Retail Point of Sale + Enterprise Resource Planning
**Researched:** March 22, 2026
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a **web-based POS/ERP system** for retail stores requiring offline-capable point-of-sale transactions and full back-office inventory/reporting. Experts build such systems using a **Service-Based Architecture** with strict database-per-service isolation, **Variant-level product tracking** (not flat products), and a **Transactional Ledger** for inventory to prevent race conditions and provide audit trails.

The recommended approach combines **Encore.ts** (backend framework with automated PostgreSQL, Pub/Sub, and type-safe API generation) with **TypeORM** for entity management, **React/Vite** for the SPA frontend, and **Dexie.js + Workbox** for offline-first POS capability. The critical insight from all research sources is that **offline sync must use delta operations** (decrement 1, not set to 9) and **inventory must never be a simple quantity column**.

Key risks include: (1) iOS WebUSB printing incompatibility requiring AirPrint fallback, (2) TypeORM migration conflicts with Encore's read-only deployment model requiring the "Hybrid" approach, and (3) concurrent offline sales causing stock race conditions unless the server processes deltas sequentially.

## Key Findings

### Recommended Stack

**Summary from STACK.md**

The system uses **Encore.ts** as the backend framework because it automates PostgreSQL provisioning, Pub/Sub infrastructure, and generates type-safe TypeScript clients for the frontend. The **"Hybrid TypeORM" approach** is critical: TypeORM entities define the schema in code, but migrations are extracted to Encore's SQL migration files so Encore applies them ( Encore runs migrations, not TypeORM at runtime). This avoids the conflict where TypeORM's default migration runner requires a writable DB user.

The frontend is a **Vite + React SPA** with **TanStack Query** for server state management. **Dexie.js** wraps IndexedDB for offline POS data (product catalog, pending orders). **Workbox** handles service worker caching of assets. **Encore's `api.static`** serves the built SPA, keeping deployment atomic.

**Core technologies:**
- **Encore.ts (Latest):** Backend framework + cloud infra — automates PostgreSQL, Pub/Sub, API Gateway, and generates type-safe clients
- **PostgreSQL 15+:** Primary database — auto-provisioned by Encore, relational model required for ERP/POS integrity
- **TypeORM 0.3.x:** Data access ORM — used for entities and query building, but **not** for migration execution
- **Vite (Latest):** Build tool — fast HMR, optimized production builds for React
- **React 18/19:** UI library — component-based interfaces for complex POS/ERP screens
- **TanStack Query (Latest):** Server state — integrates with Encore-generated clients, handles loading/error states
- **Dexie.js (Latest):** Offline database — IndexedDB wrapper for POS offline storage
- **Workbox (Latest):** PWA service worker — asset caching and offline routing

### Expected Features

**Summary from FEATURES.md**

**Must have (table stakes):**
- **Barcode scanning** — BarcodeDetector API (hardware-accelerated) with html5-qrcode fallback for Firefox/Safari; keyboard wedge USB scanner support
- **Offline POS operation** — Local-first architecture with sync queue; POS must ring sales during internet outages
- **Product variants** — Template-Variant model (Product parent → Variant child with SKU/barcode/price); NOT flat products table
- **Inventory ledger** — Transactional ledger pattern with derived snapshot for fast lookups; never UPDATE qty = N
- **Mixed payments** — Multiple tenders per sale (Cash + Card + QR); remaining = total - sum(tenders)
- **Receipt printing** — WebUSB ESC/POS with esc-pos-encoder; **AirPrint fallback required for iOS**
- **Role-based access** — Cashier, Manager, Owner roles with different permissions

**Should have (competitive):**
- **Thai QR PromptPay** — EMVCo QR string generation for customer scanning
- **Tax-per-line-item** — Calculate rounding per line, then sum; avoids accounting discrepancies
- **Variant attributes** — Dynamic Color/Size attributes linked to variants

**Defer (v2+):**
- **Multi-warehouse** — Single warehouse sufficient for v1
- **Customer loyalty programs** — No CRM in v1
- **Supplier management** — Only outbound inventory (sales) in v1

### Architecture Approach

**Summary from ARCHITECTURE.md**

The system follows **Service-Based Architecture** with 5 core services sharing an Encore application but with database-per-service isolation:

| Service | Responsibility | Key Pattern |
|---------|---------------|-------------|
| **Auth** | User identity, JWT/Session, role verification | Encore `authHandler` |
| **Catalog** | Product templates, Variants, Categories, Prices | Read-heavy, optimized for POS |
| **Inventory** | Stock movements (Ledger), CurrentStock snapshot | Write-heavy, transactional |
| **Sales** | Orders, Carts, Payments | High-velocity "edge" service |
| **Reporting** | Analytics, Dashboard aggregation | Read-heavy, CQRS lite via events |

**Inter-service communication:** Direct API calls for reads (POS → Catalog: "get product for barcode X"), **Pub/Sub for writes** (Sales publishes `order.completed` → Inventory subscribes and writes `-1` to Ledger). This keeps POS fast and system resilient.

**Offline sync strategy:** Client generates **UUIDs** for offline-created orders (never let server assign). Sync **operations** (CREATE_ORDER, ADJUST_STOCK), not **state** (CurrentStock = 5). Server processes queue sequentially.

### Critical Pitfalls

**Top 5 from PITFALLS.md**

1. **The "Quantity Column" Trap** — Storing only `products.qty = 10` with no ledger. **Consequences:** No audit trail, race conditions on concurrent sales. **Prevention:** Always insert ledger rows; update `CurrentStock` as derived cache only.

2. **The "Flat Product" Schema** — `products` table with `size` and `color` columns. **Consequences:** Data duplication, reporting nightmare. **Prevention:** `Product` (parent) → `Variant` (child) with `VariantAttribute` linking table.

3. **WebUSB Browser Support** — Building printing exclusively around `navigator.usb`. **Consequences:** iOS (iPads in retail) doesn't support WebUSB. **Prevention:** Hybrid printing — WebUSB for Windows/Android, AirPrint fallback for iOS.

4. **"Last Write Wins" in Offline Sync** — Syncing `CurrentStock = 9` instead of `Delta: -1`. **Consequences:** Two offline devices both sync "set to 9" → stock ends at 9 instead of 8. **Prevention:** Sync operations (decrement 1), not state. Server processes sequentially.

5. **Tax Calculation on Total** — Tax computed on summed cart total. **Consequences:** Rounding errors with mixed tax rates. **Prevention:** Calculate tax per line item, round per line, then sum.

---

## Implications for Roadmap

Based on research, the **v1 scope** ("Complete sale loop: ring up → pay → stock deducts → owner sees reports") suggests a **4-phase structure**:

### Phase 1: Foundation & Backend Core
**Rationale:** All other phases depend on Auth and the Catalog/Inventory data model. Must establish the TypeORM hybrid pattern and database-per-service isolation before building features.

**Delivers:**
- Encore app with 4 services: Auth, Catalog, Inventory, Sales
- TypeORM entities with Hybrid migration approach (Encore applies SQL, TypeORM queries)
- Encore `authHandler` with JWT + PIN support
- Role-based access control (Cashier, Manager, Owner)
- Product + Variant + Attribute data model
- Inventory Ledger + CurrentStock snapshot pattern

**Avoids:** Pitfalls #1 (Quantity Column) and #2 (Flat Product) by building correct data model from start

**Research Flags:** None — TypeORM/Encore integration is well-documented in official docs

---

### Phase 2: POS Frontend & Offline
**Rationale:** This is the core value proposition. POS must work offline, requiring Dexie.js integration, sync queue, and barcode scanning. Depends on Phase 1 services being live.

**Delivers:**
- Vite + React SPA with route separation (POS view vs ERP view)
- TanStack Query integration with Encore-generated client
- Dexie.js offline storage (Products, Orders, SyncQueue tables)
- BarcodeDetector API + html5-qrcode fallback + keyboard wedge support
- Cart state with mixed tenders (Cash/Card/QR)
- Background sync processor with exponential backoff
- POS "initial load" aggregated endpoint (Categories + Products + Tax Rules in one call)

**Avoids:** Pitfall #4 (Last Write Wins) by implementing delta sync queue

**Research Flags:**
- **Phase 2:** BarcodeDetector API has limited public benchmarks — may need `/gsd-research-phase` for performance validation if scanning speed issues arise
- **Phase 2:** Dexie.js + TanStack Query integration patterns are community-documented but not official; plan for potential cache invalidation complexity

---

### Phase 3: Payments & Receipts
**Rationale:** Checkout completion requires payment processing and receipt generation. Depends on Phase 2 POS UI being functional.

**Delivers:**
- Payment processing with remaining calculation (total - tenders)
- Thai QR PromptPay QR string generation (EMVCo standard)
- Mixed payment completion (allow split tenders)
- Receipt printing: WebUSB ESC/POS for Windows/Android
- AirPrint fallback for iOS (system print dialog)
- `Intl.NumberFormat` for all currency display

**Avoids:** Pitfall #3 (WebUSB iOS failure) and Pitfall #5 (tax rounding) and Pitfall #6 (currency formatting)

**Research Flags:**
- **Phase 3:** Thai QR PromptPay integration — specific Thai payment gateway API research needed (not covered in general POS research)
- **Phase 3:** ESC/POS command encoding — well-documented standard, skip research

---

### Phase 4: ERP & Reporting
**Rationale:** Owner needs to see that sales happened and stock changed. Depends on Sales service having processed orders via Pub/Sub.

**Delivers:**
- ERP backoffice UI (product management, user management)
- Reporting service subscribed to `order.completed` events
- DailySales aggregation (nightly materialized view approach)
- Dashboard: Gross Sales, Net Sales, Gross Profit metrics
- Inventory valuation reports

**Research Flags:**
- **Phase 4:** Materialized view refresh strategy — standard PostgreSQL, skip research
- **Phase 4:** Report export formats (PDF/Excel) — not covered in research, may need research if users expect these

---

### Phase Ordering Rationale

1. **Foundation before POS UI** — Auth and correct data model (Variants, Ledger) are prerequisites. Building POS against a flat product schema would require rewrite.

2. **Offline before Payments** — Get the sale-while-offline flow working first. Payment processing (especially Thai QR) has external dependencies and regulatory considerations.

3. **POS before ERP** — v1 is POS-focused. ERP management UI and reporting are owner tools, not cashier tools. Separate concerns allow parallel development later.

4. **Pub/Sub decoupling from start** — The `order.completed` → inventory deduction pattern must be wired in Phase 1, not bolted on later. Retrofitting Pub/Sub is painful.

### Research Flags Summary

| Phase | Needs Research | Skip Research |
|-------|----------------|---------------|
| **1** | None | TypeORM/Encore hybrid, Encore authHandler |
| **2** | BarcodeDetector performance benchmarks | Dexie.js patterns (community docs sufficient) |
| **3** | Thai QR PromptPay gateway API | ESC/POS standard |
| **4** | Report export formats (if needed) | Materialized views, PostgreSQL aggregation |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Encore + TypeORM + React/Vite is verified with official docs. Hybrid migration approach explicitly documented by Encore. |
| Features | **HIGH** | POS patterns (scanning, offline, variants) are well-established across multiple sources. Thai QR and printing have solid external references. |
| Architecture | **HIGH** | 5-service decomposition, Pub/Sub pattern, database-per-service all have clear rationale and Encore-native patterns. |
| Pitfalls | **HIGH** | All 5 pitfalls are well-documented industry knowledge with clear prevention strategies. |

**Overall confidence:** **HIGH**

The research is grounded in official documentation (Encore docs, TypeORM docs) and well-established POS/ERP patterns. Medium uncertainty remains on:
- Thai QR PromptPay specific gateway requirements (external dependency)
- BarcodeDetector API real-world scanning speed (hardware-dependent)
- Dexie.js + TanStack Query cache invalidation edge cases (community patterns)

### Gaps to Address

1. **Thai QR Payment Gateway:** Research covered the EMVCo QR string generation pattern, but actual PromptPay certification/approval process with Thai banks or payment providers needs investigation before Phase 3. **Action:** Identify specific payment gateway partner early.

2. **Hardware Compatibility Matrix:** Barcode scanners and receipt printers vary by model. Research assumed standard USB HID and ESC/POS, but real retail may need specific driver support. **Action:** Define minimum hardware specs for v1.

3. **Offline Conflict Resolution UI:** The research covers delta sync and sequential server processing, but what happens when the server rejects an offline sale (e.g., credit card declines after-the-fact)? The "push a correction back to POS inbox" pattern needs more detail. **Action:** Design conflict resolution UX in Phase 2 planning.

---

## Sources

### Primary (HIGH confidence)

- **Encore.ts Official Docs** (`encore.dev/docs/ts/develop/orms`) — TypeORM integration, migration approach, `api.static`, `authHandler`, Pub/Sub patterns
- **Encore.ts Official Docs** (`encore.dev/docs/ts/primitives/static-assets`) — Frontend hosting via `api.static`
- **TypeORM Docs** — Entity definitions, DataSource configuration, migration generation
- **MDN Web API: BarcodeDetector** — Shape Detection API specification
- **MDN Web API: WebUSB** — Browser USB access specification

### Secondary (MEDIUM confidence)

- **FEATURES.md** — POS/ERP feature patterns synthesized from Ink & Switch "Local-First Software" concepts
- **ARCHITECTURE.md** — Service decomposition rationale based on Encore community examples and CQRS patterns
- **Wisdom Schema** — "Types of Fact Table (Transaction vs Snapshot)" — Inventory Ledger pattern

### Tertiary (LOW confidence)

- **Thai QR PromptPay** — EMVCo standard general guidance; specific Thai payment gateway requirements not verified
- **Dexie.js + TanStack Query** — Community-reported integration patterns; cache invalidation edge cases need validation

---

*Research completed: March 22, 2026*
*Ready for roadmap: yes*

# Feature Implementation Patterns

**Domain:** Retail POS/ERP (Web-based)
**Researched:** 2026-03-22

## 1. POS Sale Flow (The "Register")

The checkout experience must be fast (sub-2-second scans) and resilient.

### Barcode Scanning
*   **Pattern:** **Hybrid Scanning**
    *   **Primary:** Use **`BarcodeDetector` API** (Shape Detection API). It uses hardware acceleration (Android/Chrome) and is incredibly fast.
    *   **Fallback:** Use **`html5-qrcode`** (ZXing-js) for browsers without Shape Detection support (Firefox/Safari).
    *   **Hardware:** Support "Keyboard Wedge" mode (standard USB scanners act as keyboards). The UI should listen for rapid keystrokes ending in `Enter` to detect scans without a focused input field.

### Receipt Printing
*   **Pattern:** **Client-Side USB (WebUSB)**
    *   **Library:** `esc-pos-encoder` (to format ESC/POS commands) + `navigator.usb` (to send bytes).
    *   **Flow:**
        1.  User clicks "Connect Printer" (required user gesture).
        2.  App claims USB interface.
        3.  Sale completes -> Generate receipt binary -> `device.transferOut`.
    *   **Constraint:** Requires HTTPS. Windows may require specific driver settings (WinUSB) to release the device to the browser.

### Payment Processing
*   **Mixed Payments:** Cart state must support multiple "Tenders" per sale.
    *   *Schema:* `SaleTenders` table (Type: Cash, Card, QR; Amount: decimal).
    *   *Logic:* `remaining = total - sum(tenders)`. Allow checkout only when `remaining <= 0`.
*   **Thai QR:** Generate PromptPay QR strings (EMVCo standard) locally or via payment gateway API. Display on screen for customer to scan.

## 2. Offline POS Architecture

The POS must work during internet outages.

### Data Storage
*   **Pattern:** **Local-First (IndexedDB)**
    *   **Library:** **Dexie.js** (wrapper for IndexedDB) is the industry standard for ease of use and performance.
    *   **Store:** `Products` (full catalog), `Carts` (in-progress), `Orders` (completed but unsynced).

### Synchronization Strategy
*   **Pattern:** **Sync Queue with Optimistic UI**
    1.  **Action:** Cashier completes sale.
    2.  **Local:** Write to IndexedDB `Orders` (status: 'pending_sync') and decrement local `Product` stock (optimistic).
    3.  **Queue:** Add job to `SyncQueue` table in IndexedDB.
    4.  **Background Process:** `navigator.onLine` trigger or polling loop sends `SyncQueue` items to backend.
    5.  **Success:** Update local Order status to 'synced', update server-side Inventory.
    6.  **Failure:** Retry with exponential backoff. Alert user if queue > N items.

## 3. Product Management (Variants)

Avoiding the "Flat Product" trap is critical.

### Data Model
*   **Entity: Product (Parent)**
    *   *Role:* Marketing data, description, category, brand.
    *   *Fields:* `id`, `name`, `description`, `category_id`, `has_variants (bool)`.
*   **Entity: Variant / SKU (Sellable)**
    *   *Role:* The actual physical item tracked in inventory.
    *   *Fields:* `id`, `product_id`, `sku` (unique), `barcode`, `price`, `cost_price`.
    *   *Note:* Order Lines reference **Variant ID**, not Product ID.
*   **Entity: Attributes**
    *   *Role:* Dynamic characteristics (Color, Size).
    *   *Schema:* `ProductAttribute` (name: "Color"), `ProductAttributeValue` (value: "Red"), `VariantAttribute` (link table).

## 4. Inventory Management

Reliable stock tracking requires a double-entry approach.

### The "Ledger" Pattern (Audit Trail)
*   **Concept:** Never just `UPDATE products SET qty = 5`.
*   **Schema:** `InventoryLedger` table.
    *   `id`, `variant_id`, `type` (sale, restock, adjustment, return), `delta` (+5, -1), `reference_id` (order_id), `timestamp`.
*   **Logic:** Current stock = Sum of all deltas.

### The "Snapshot" Pattern (Performance)
*   **Concept:** Calculating sum of deltas is too slow for POS lookup.
*   **Schema:** `InventorySnapshot` table (or column on Variant).
    *   `variant_id`, `quantity_on_hand`, `last_updated`.
*   **Trigger:** Whenever a Ledger row is inserted, update the Snapshot.
*   **Rule:** Snapshot is a cache. Ledger is the truth.

## 5. Sales Reporting

### Aggregation Patterns
*   **V1 (Simple):** SQL Aggregation on `InventoryLedger` or `Orders`.
    *   `SELECT date_trunc('day', created_at), sum(total) FROM orders GROUP BY 1`.
*   **Optimization:** For V2, create a `DailySales` materialized view that refreshes nightly.
*   **Metrics:**
    *   **Gross Sales:** Sum of all order totals.
    *   **Net Sales:** Gross - Returns - Discounts.
    *   **Gross Profit:** Net Sales - (Sum of Variant Cost * Qty).

## Sources
*   **Scanning:** [Barcode Detection API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API)
*   **Printing:** [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/USB)
*   **Offline:** [Local-First Software (Ink & Switch)](https://www.inkandswitch.com/local-first/)
*   **Data Models:** "Database Design for Product Management" (Mojtaba Azad), "Types of Fact Table" (Wisdom Schema)

# Domain Pitfalls

**Domain:** Retail POS/ERP
**Researched:** 2026-03-22

## Critical Pitfalls

Mistakes that cause rewrites or major data integrity issues.

### Pitfall 1: The "Quantity Column" Trap
**What goes wrong:** Storing inventory *only* as a number on the product row (e.g., `products.quantity = 10`).
**Why it happens:** It's the simplest way to track stock.
**Consequences:**
*   **No Audit Trail:** You can't explain *why* stock is low (theft? sale? damage?).
*   **Race Conditions:** Two concurrent sales read `10`, both write `9`. Actual stock should be `8`.
**Prevention:**
*   **Transaction Ledger:** Always insert a row into `InventoryLedger` (variant_id, delta, reason).
*   **Derived Snapshot:** Update the `quantity` column only as a cached sum of the ledger.

### Pitfall 2: The "Flat Product" Schema
**What goes wrong:** Creating a `products` table with columns like `size` and `color`.
**Why it happens:** Attempting to avoid complexity of parent/child relationships.
**Consequences:**
*   **Data Duplication:** "Red Shirt" and "Blue Shirt" are separate products. Updating the description requires 2 updates.
*   **Reporting Nightmare:** Cannot easily report on "All Shirts" sales.
**Prevention:**
*   **Variant Model:** `Product` (Parent) -> `Variant` (Child). Attributes linked to Variant.

### Pitfall 3: WebUSB Browser Support
**What goes wrong:** Building the entire printing flow around `navigator.usb`.
**Why it happens:** It's the modern standard for web hardware.
**Consequences:**
*   **iOS Failure:** iPads (common in retail) do not support WebUSB.
*   **Windows Driver Hell:** Windows claims USB devices; getting Chrome to see them requires Zadig/WinUSB driver replacement.
**Prevention:**
*   **Hybrid Printing:** Detect OS. If Windows/Android -> WebUSB. If iOS -> Fallback to AirPrint (system dialog) or network printing (if applicable).

### Pitfall 4: "Last Write Wins" in Offline Sync
**What goes wrong:** Simple object sync overwrites inventory.
**Why it happens:** Default strategy for many sync libraries.
**Consequences:** Device A sells item (stock 10->9). Device B sells item (stock 10->9). Sync results in stock 9 (should be 8).
**Prevention:**
*   **Delta Sync:** Sync *operations* (decrement 1), not *state* (set to 9).
*   **Queue Pattern:** Process sync queue sequentially on the server.

## Moderate Pitfalls

### Pitfall 5: Tax Calculation on Total
**What goes wrong:** Calculating tax on the final cart total.
**Why it happens:** Simpler math.
**Consequences:** Rounding errors when selling multiple items with different tax rates or when summing individual line items for accounting.
**Prevention:** Calculate tax **per line item**, round, then sum.

### Pitfall 6: Hardcoded Currencies/Locales
**What goes wrong:** Assuming `$` or `.` for decimals.
**Prevention:** Use `Intl.NumberFormat` for all price displays. Store amounts as integers (cents/satang) or high-precision decimals.

## Sources
*   **Inventory:** "Types of Fact Table (Transaction vs Snapshot)" - Wisdom Schema
*   **Browser Support:** [Can I use: WebUSB](https://caniuse.com/webusb)

# Architecture & Data Modeling Research

**Project:** POS+ERP System (Encore.ts)
**Researched:** March 22, 2026
**Focus:** Service boundaries, Data modeling, Encore-specific patterns, Offline sync

## Executive Summary

The system follows a **Service-Based Architecture** leveraging Encore.ts's native isolation and event-driven capabilities. We recommend **5 core services** with strict database isolation, communicating via **Pub/Sub for writes** (side effects) and **Direct API calls for reads**.

The data model prioritizes **Variant-level tracking** for products and a **Transactional Ledger** for inventory to ensure accuracy. Offline sync relies on a **Local-First** approach with client-generated UUIDs and an operation queue.

---

## 1. Service Boundaries

We recommend splitting the application into domains based on "rate of change" and "business capability".

| Service | Responsibility | Key APIs | Dependencies |
|---------|---------------|----------|--------------|
| **Auth** | User identity, Role verification, Token issuance. | `login`, `verifyToken`, `listUsers` | None |
| **Catalog** | Product templates, Variants, Categories, Prices. | `getProduct`, `listVariants`, `updatePrice` | None |
| **Inventory** | Stock levels, Stock movements (ledger), Warehouses. | `getStock`, `adjustStock`, `transferStock` | Catalog (for SKU validation) |
| **Sales** (POS) | Orders, Carts, Payments, Customer linking. | `createOrder`, `processPayment`, `getDailyTotal` | Catalog, Inventory, Auth |
| **Reporting** | Analytics, Dashboard aggregation (Read-heavy). | `getSalesReports`, `getInventoryValuation` | All (via Pub/Sub events) |

### Rationale
- **Catalog** is read-heavy (POS needs it constantly).
- **Inventory** is write-heavy and high-conflict (needs transactional integrity).
- **Sales** is the high-velocity "edge" service for POS.
- **Reporting** is decoupled to prevent heavy analytical queries from slowing down the POS.

---

## 2. Data Model Design

### Products & Variants (Catalog Service)
We use a **Template-Variant** pattern to handle complexity (e.g., T-Shirt with sizes/colors).

*   **`Product` (Template):** Name, Description, Brand, Category, Base Price, Tax Rules.
*   **`Variant` (Sellable SKU):** SKU (PK), Barcode, Specific Price (override), Dimensions, Weight.
    *   *Relationship:* One Product has Many Variants.
    *   *Note:* Inventory is **not** stored here.

### Orders (Sales Service)
*   **`Order`:** ID (UUID), StoreID, Status (Pending, Paid, Void), Total, UserID, CreatedAt.
*   **`OrderLineItem`:** OrderID, VariantID, Quantity, UnitPrice (at time of sale), Discount.

### Inventory (Inventory Service)
Do **not** store a simple "Quantity" integer that gets overwritten. Use a **Transactional Ledger**.

*   **`StockLedger`:** ID, VariantID, WarehouseID, QuantityChange (+/-), Reason (Sale, Restock, Loss), ReferenceID (OrderID or PO #), Timestamp.
*   **`CurrentStock` (View/Cache):** A materialised view or cached table updated by the ledger for fast lookups of `sum(QuantityChange)`.

### Users (Auth Service)
*   **`User`:** ID, Email, PasswordHash, Role (Owner, Manager, Cashier), PIN (for quick POS access).

---

## 3. Inter-Service Communication

Encore.ts makes both patterns easy. We use **Sync** for information gathering and **Pub/Sub** for decoupled actions.

### Synchronous (Direct API Calls)
Use when the caller **needs** the answer immediately to proceed.
*   *POS -> Catalog:* "Get product details for barcode X" (Latency critical).
*   *POS -> Inventory:* "Is SKU Y in stock?" (Validation).

### Asynchronous (Pub/Sub)
Use for side effects to keep the POS fast and the system resilient.

**Scenario: Order Completed**
1.  **Sales Service:** Saves Order to DB. Returns "Success" to POS.
2.  **Sales Service:** Publishes `Topic<OrderCompletedEvent>('order.completed')`.
3.  **Inventory Service:** Subscribes `order.completed` -> Writes `-1` to Stock Ledger.
4.  **Reporting Service:** Subscribes `order.completed` -> Updates daily dashboard stats.

**Encore Implementation:**
```typescript
// sales/order.ts
import { Topic } from "encore.dev/pubsub";
export const orderCompleted = new Topic<OrderEvent>("order.completed", {
  deliveryGuarantee: "at-least-once",
});

// inventory/service.ts
import { Subscription } from "encore.dev/pubsub";
import { orderCompleted } from "../sales/order";

const _ = new Subscription(orderCompleted, "deduct-inventory", {
  handler: async (event) => {
    await deductStock(event.orderId, event.items);
  },
});
```

---

## 4. Database Architecture

**Strategy:** Database-per-Service (Logical Isolation).

Encore encourages `new SQLDatabase('service_name')`. We should strictly adhere to this.
*   **Pros:** Services can be deployed independently; schema changes in Catalog don't break Sales.
*   **Cons:** No `JOIN`s across domains.
*   **Solution:** The API Gateway (Encore) handles the composition, or the Frontend fetches from multiple endpoints. For Reports, the Reporting service listens to events to build its own optimized "Read Model" (CQRS lite).

---

## 5. Auth Architecture

Encore provides a native `authHandler`.

**Flow:**
1.  **Gateway Level:** Global `authHandler` intercepts all `{ auth: true }` requests.
2.  **Verification:** Decodes JWT/Session token.
3.  **Context:** Returns `UserData` (ID, Role) to the endpoint.
4.  **Service Level:** Each API endpoint checks the role.

```typescript
// auth/auth.ts
export const myAuth = authHandler(async (params) => {
  const token = params.authorization;
  const user = verifyToken(token); // logic here
  return { userID: user.id, role: user.role };
});

// sales/order.ts
export const createOrder = api(
  { auth: true, method: "POST", path: "/orders" },
  async (params) => {
    const user = getAuthData(); // typesafe access
    if (user.role !== 'CASHIER') throw APIError.permissionDenied("Only cashiers can sell");
    // ...
  }
);
```

---

## 6. Offline Sync Strategy (POS Client)

The POS client must work when the internet is dead.

**Architecture:** "Local-First"
1.  **Frontend DB:** POS runs on a local DB (e.g., RxDB, PouchDB, or SQLite).
2.  **Read Sync:** On startup/interval, fetch full Catalog (or deltas) from Backend -> Local DB.
3.  **Write Sync (Queue):**
    *   Offline: User creates order. Saved to Local DB with **UUID** (generated on client).
    *   Queue: Action `CREATE_ORDER` added to "Sync Queue".
    *   Online: Queue processor sends actions to Backend.

**Conflict Resolution:**
*   **IDs:** Never let the server assign IDs for offline-created items. Use UUIDs.
*   **Inventory:** Do not sync "Current Qty = 5". Sync "Decrement 1". If two offline devices sell the last item, the server processes both decrement events. Result: Stock = -1. This is better than one sale overwriting the other.
*   **Errors:** If sync fails (e.g., credit card declined by backend later), push a "Correction" or "Alert" back to the POS client's inbox.

---

## 7. API Design Patterns

### POS API (The "Edge" API)
*   **Goal:** Minimise round-trips for the frontend.
*   **Pattern:** "Backend for Frontend" (BFF) style or aggregated endpoints.
    *   `GET /pos/initial-load`: Returns Categories + Top 50 Products + Tax Rules in one go.
    *   **Slim Payloads:** Exclude heavy descriptions/HTML from POS responses.

### ERP API (The Management API)
*   **Goal:** Flexibility for admin dashboard.
*   **Pattern:** RESTful CRUD with filtering/pagination.
    *   `GET /products?page=1&category=shoes&sort=price_desc`
    *   **Rich Payloads:** Include full history, logs, and metadata.

### Encore Specifics
Encore allows defining multiple APIs in the same service.
*   `product/api_pos.ts` -> exposing `getLiteProduct`
*   `product/api_admin.ts` -> exposing `getFullProduct`

Both use the same DB logic but serve different masters.

# Technology Stack

**Project:** POS/ERP System (Encore + TypeORM + React)
**Researched:** March 22, 2026

## Recommended Stack

### Backend & Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Encore.ts** | Latest | Backend Framework & Cloud Infra | Automates infrastructure (PostgreSQL, Pub/Sub, API Gateway) via TypeScript code. Provides type-safe API clients. |
| **PostgreSQL** | 15+ | Primary Database | Auto-provisioned by Encore. Reliable, relational data model required for ERP/POS. |
| **TypeORM** | 0.3.x | Data Access & ORM | Requested by stack constraints. Powerful entity mapping, but requires specific integration with Encore's migration system. |

### Frontend (SPA & PWA)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vite** | Latest | Build Tool | Fast HMR, optimized production builds for React. |
| **React** | 18/19 | UI Library | Component-based UI for complex POS/ERP interfaces. |
| **TanStack Query** | Latest | Data Fetching & Caching | Manages server state, handles loading/error states, and integrates well with generated Encore clients. |
| **Dexie.js** | Latest | Offline Database (IndexedDB) | Simple wrapper for IndexedDB to store products/orders offline in the POS. |
| **Workbox** | Latest | PWA / Service Worker | Handles asset caching and offline routing for the POS. |

## Architecture & Integration Strategy

### 1. Encore Service Architecture (Modular Monolith)

Structure the backend as a **Modular Monolith** within a single Encore application. This allows shared code (types, utilities) while keeping domains distinct.

**Service Boundaries:**
-   `pos/`: High-availability endpoints for the cashier. Optimized for speed and offline sync.
-   `erp/`: Complex business logic for inventory, reporting, and backoffice management.
-   `auth/`: Centralized authentication (JWT/Session) shared by both.
-   `inventory/`: Source of truth for stock levels, updated by POS and ERP.

**Example Folder Structure:**
```
/my-pos-app
├── encore.app                       # Encore App Config
├── package.json
├── client/                          # Vite React Frontend
│   ├── index.html
│   ├── src/
│   │   ├── api/                     # Generated Encore Client
│   │   ├── pos/                     # POS specific UI
│   │   └── erp/                     # ERP specific UI
│   └── vite.config.ts
├── pos/                             # POS Backend Service
│   ├── encore.service.ts
│   ├── api.ts
│   └── service.ts
├── erp/                             # ERP Backend Service
│   ├── encore.service.ts
│   └── api.ts
└── database/                        # Shared DB setup
    ├── db.ts                        # Encore SQLDatabase definition
    ├── data-source.ts               # TypeORM DataSource config
    └── migrations/                  # SQL migrations for Encore
```

### 2. TypeORM Integration Pattern (The "Hybrid" Approach)

**Challenge:** Encore natively manages database migrations via raw SQL files in a `migrations/` folder and applies them automatically during deployment. TypeORM defaults to running migrations via its own CLI at runtime, which conflicts with Encore's production security model (read-only app users).

**Recommended Solution: "TypeORM for Code, Encore for Infra"**

1.  **Define Entities:** Use TypeORM `@Entity` classes as normal.
2.  **Generate Migrations (Dev):** Use `typeorm migration:generate` to create a migration file based on schema changes.
3.  **Bridge to Encore:**
    -   Extract the SQL from the generated migration's `up` method.
    -   Save this SQL into a `.up.sql` file in Encore's `migrations/` directory.
    -   Encore will apply this SQL automatically on the next `git push encore`.
4.  **Runtime Connection:** Initialize TypeORM using Encore's connection string, but **disable** `synchronize: true` and `migrationsRun: true` in production.

```typescript
// database/db.ts
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { DataSource } from "typeorm";

// 1. Define Encore DB infrastructure
export const DB = new SQLDatabase("pos_db", {
  migrations: "./migrations", // Encore runs these SQL files
});

// 2. Configure TypeORM to use Encore's connection
export const AppDataSource = new DataSource({
  type: "postgres",
  url: DB.connectionString, // Injected by Encore
  entities: [/* ... */],
  synchronize: false, // Critical: Let Encore manage schema
  migrationsRun: false, // Critical: Encore runs migrations, not TypeORM
});

export const getDb = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};
```

### 3. Frontend & Monorepo Structure

**Hosting:**
Use Encore's `api.static` capability to serve the built Vite app. This keeps the deployment atomic (backend + frontend deploy together) and simplifies the stack.

**Implementation:**
1.  **Build Step:** Configure `package.json` to build the Vite app into `client/dist/`.
2.  **Serve Static Assets:** Create a gateway service in Encore to serve `client/dist/`.

```typescript
// gateway/encore.service.ts
import { api } from "encore.dev/api";

// Serve the built frontend
export const assets = api.static({
  expose: true,
  path: "/!path", // Catch-all for SPA routing
  dir: "../client/dist",
});
```

**Type Sharing:**
Encore automatically generates a type-safe TypeScript client (`encore gen client`).
-   The frontend imports this client to call backend APIs.
-   **Benefit:** No manual API types or Swagger files needed. End-to-end type safety from DB (TypeORM) -> API (Encore) -> Frontend (React).

### 4. PWA & Offline Architecture

**POS Requirements:** Must work without internet.

1.  **Service Worker (Workbox):** Caches the `index.html`, JS bundles, and static assets.
2.  **Local Database (Dexie.js):**
    -   On login/startup, the POS fetches the "Product Catalog" and "Tax Rates" from Encore and stores them in IndexedDB.
    -   Orders created offline are stored in an "Outbox" table in IndexedDB.
3.  **Sync Strategy:**
    -   **Background Sync:** React Query or a custom hook monitors online status.
    -   **Push:** When online, the "Outbox" pushes orders to the `pos/sync` endpoint in Encore.
    -   **Pull:** After push, it pulls strict "delta" updates for products/inventory.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **ORM** | TypeORM | **Prisma / Drizzle** | TypeORM was requested. However, **Drizzle** has better native integration with Encore's serverless/infrastructure model if requirements were flexible. |
| **Frontend Hosting** | Encore `api.static` | **Vercel / Netlify** | Keep it simple (one deployment pipeline). Move to Vercel only if global edge CDN performance becomes a bottleneck for the static assets. |
| **Architecture** | Monolith | **Microservices** | Encore allows splitting later. Starting distributed adds unnecessary complexity for a POS/ERP MVP. |

## Installation & Setup

```bash
# 1. Create Encore App
encore app create my-pos-app --template=ts/empty

# 2. Add React Client
npm create vite@latest client -- --template react-ts

# 3. Add Dependencies
npm install typeorm pg reflect-metadata
npm install -D typeorm-extension # Helpers for migration bridging
```

## Sources

-   **Encore Docs:** `encore.dev/docs/ts/develop/orms` (ORM Integration)
-   **Encore Docs:** `encore.dev/docs/ts/primitives/static-assets` (Static Serving)
-   **Encore Blog:** "Building a File Sharing Service" (Frontend integration patterns)
-   **TypeORM Docs:** Migration generation and DataSource configuration.