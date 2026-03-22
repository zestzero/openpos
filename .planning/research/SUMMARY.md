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
