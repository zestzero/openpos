# Project Research Summary

**Project:** OpenPOS - Retail POS/ERP System
**Domain:** Retail Point of Sale + Enterprise Resource Planning
**Researched:** March 22, 2026 (updated April 18, 2026 for Go stack)
**Confidence:** HIGH

## Executive Summary

This is a **web-based POS/ERP system** for retail stores requiring offline-capable point-of-sale transactions and full back-office inventory/reporting. Experts build such systems using clean domain boundaries with strict data isolation, **Variant-level product tracking** (not flat products), and a **Transactional Ledger** for inventory to prevent race conditions and provide audit trails.

The recommended approach combines a **Go backend** (chi router + sqlc + pgx) with **PostgreSQL** for the database, **React/Vite** for the SPA frontend, and **Dexie.js + Workbox** for offline-first POS capability. The backend is a monolithic Go binary with clean package boundaries per domain — simpler to deploy and operate than microservices.

The critical insight from all research sources is that **offline sync must use delta operations** (decrement 1, not set to 9) and **inventory must never be a simple quantity column**.

Key risks include: (1) iOS WebUSB printing incompatibility requiring AirPrint fallback, (2) concurrent offline sales causing stock race conditions unless the server processes deltas sequentially, and (3) hand-written TypeScript API client needs to stay in sync with Go API contracts.

## Key Findings

### Recommended Stack

**Summary from stack.md**

The system uses a **Go monolith** with chi router because it produces a single binary that's trivial to deploy via Docker. **sqlc** generates type-safe Go code from SQL queries — write SQL, get Go functions with proper types. **pgx** is the PostgreSQL driver (high performance, pure Go, connection pooling). **golang-migrate** handles forward-only SQL migrations.

The frontend is a **Vite + React SPA** with **TanStack Query** for server state management. **Dexie.js** wraps IndexedDB for offline POS data. **Workbox** handles service worker caching. In production, the Go binary serves the built SPA static files, or nginx reverse proxies both.

**Core technologies:**
- **Go 1.22+ (chi v5):** Backend HTTP server — lightweight router, net/http compatible middleware, single binary deployment
- **sqlc (Latest):** SQL → Go codegen — write queries in SQL, get type-safe Go functions, no runtime reflection
- **pgx v5:** PostgreSQL driver — high performance, connection pooling, used by sqlc as backend
- **PostgreSQL 15+:** Primary database — relational model for ERP/POS integrity
- **golang-migrate:** Schema migrations — forward-only SQL files, CLI + library
- **Vite (Latest):** Build tool — fast HMR, optimized production builds for React
- **React 18/19:** UI library — component-based interfaces for complex POS/ERP screens
- **TanStack Query (Latest):** Server state — loading/error handling, cache invalidation
- **Dexie.js (Latest):** Offline database — IndexedDB wrapper for POS offline storage
- **Workbox (Latest):** PWA service worker — asset caching and offline routing
- **Docker:** Deployment — multi-stage build, self-hosted on VPS/VM/k8s

### Expected Features

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

The system follows a **monolithic architecture** with clean package boundaries per domain:

| Package | Responsibility | Key Pattern |
|---------|---------------|-------------|
| **internal/auth** | User identity, JWT, role verification | chi middleware for auth |
| **internal/catalog** | Product templates, Variants, Categories, Prices | Read-heavy, optimized for POS |
| **internal/inventory** | Stock movements (Ledger), CurrentStock snapshot | Write-heavy, transactional |
| **internal/sales** | Orders, Carts, Payments | High-velocity POS service |
| **internal/reporting** | Analytics, Dashboard aggregation | Read-heavy, SQL aggregations |

**Inter-domain communication:** Direct function calls within the Go process. Sales completion calls inventory.DeductStock() directly — no HTTP, no message queue for v1. If needed later, domains can be extracted to separate services.

**Offline sync strategy:** Client generates **UUIDs** for offline-created orders (never let server assign). Sync **operations** (CREATE_ORDER, ADJUST_STOCK), not **state** (CurrentStock = 5). Server processes queue sequentially.

### Critical Pitfalls

**Top 5:**

1. **The "Quantity Column" Trap** — Storing only `products.qty = 10` with no ledger. **Consequences:** No audit trail, race conditions on concurrent sales. **Prevention:** Always insert ledger rows; update `CurrentStock` as derived cache only.

2. **The "Flat Product" Schema** — `products` table with `size` and `color` columns. **Consequences:** Data duplication, reporting nightmare. **Prevention:** `Product` (parent) → `Variant` (child) with `VariantAttribute` linking table.

3. **WebUSB Browser Support** — Building printing exclusively around `navigator.usb`. **Consequences:** iOS (iPads in retail) doesn't support WebUSB. **Prevention:** Hybrid printing — WebUSB for Windows/Android, AirPrint fallback for iOS.

4. **"Last Write Wins" in Offline Sync** — Syncing `CurrentStock = 9` instead of `Delta: -1`. **Consequences:** Two offline devices both sync "set to 9" → stock ends at 9 instead of 8. **Prevention:** Sync operations (decrement 1), not state. Server processes sequentially.

5. **Tax Calculation on Total** — Tax computed on summed cart total. **Consequences:** Rounding errors with mixed tax rates. **Prevention:** Calculate tax per line item, round per line, then sum.

---

## Implications for Roadmap

Based on research, the **v1 scope** ("Complete sale loop: ring up → pay → stock deducts → owner sees reports") follows a **4-phase structure**:

### Phase 1: Foundation & Backend Core
**Rationale:** All other phases depend on Auth and the Catalog/Inventory data model. Must establish the sqlc query patterns and migration workflow before building features.

**Delivers:**
- Go binary with chi router and 5 domain packages (auth, catalog, inventory, sales, reporting)
- sqlc-generated type-safe queries for all domains
- golang-migrate managed PostgreSQL schema
- JWT auth with PIN support for cashiers
- Role-based access control (Cashier, Owner)
- Product + Variant + Attribute data model
- Inventory Ledger + CurrentStock snapshot pattern
- Docker Compose for local development

**Avoids:** Pitfalls #1 (Quantity Column) and #2 (Flat Product) by building correct data model from start

---

### Phase 2: POS Frontend & Offline
**Rationale:** This is the core value proposition. POS must work offline, requiring Dexie.js integration, sync queue, and barcode scanning. Depends on Phase 1 APIs being live.

**Delivers:**
- Vite + React SPA with route separation (POS view vs ERP view)
- TanStack Query for server state management
- Fetch-based API client calling Go backend
- Dexie.js offline storage (Products, Orders, SyncQueue tables)
- BarcodeDetector API + html5-qrcode fallback + keyboard wedge support
- Cart state management
- Background sync processor with exponential backoff

**Avoids:** Pitfall #4 (Last Write Wins) by implementing delta sync queue

---

### Phase 3: Payments & Receipts
**Rationale:** Checkout completion requires payment processing and receipt generation. Depends on Phase 2 POS UI being functional.

**Delivers:**
- Payment processing with change calculation
- Thai QR PromptPay QR string generation (EMVCo standard)
- Receipt printing: WebUSB ESC/POS for Windows/Android
- AirPrint fallback for iOS (system print dialog)
- `Intl.NumberFormat` for all currency display

**Avoids:** Pitfall #3 (WebUSB iOS failure) and Pitfall #5 (tax rounding)

---

### Phase 4: ERP & Reporting
**Rationale:** Owner needs to see that sales happened and stock changed.

**Delivers:**
- ERP backoffice UI (product management, user management)
- Reporting SQL aggregation queries
- Monthly sales summary, gross profit metrics
- Report export (PDF/Excel)

---

### Phase Ordering Rationale

1. **Foundation before POS UI** — Auth and correct data model (Variants, Ledger) are prerequisites. Building POS against a flat product schema would require rewrite.

2. **Offline before Payments** — Get the sale-while-offline flow working first. Payment processing (especially Thai QR) has external dependencies and regulatory considerations.

3. **POS before ERP** — v1 is POS-focused. ERP management UI and reporting are owner tools, not cashier tools.

### Research Flags Summary

| Phase | Needs Research | Skip Research |
|-------|----------------|---------------|
| **1** | sqlc + pgx patterns for POS domain | chi router (well-documented) |
| **2** | BarcodeDetector performance benchmarks | Dexie.js patterns (community docs sufficient) |
| **3** | Thai QR PromptPay gateway API | ESC/POS standard |
| **4** | Report export formats (if needed) | PostgreSQL aggregation |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Go + chi + sqlc + pgx is a proven, well-documented combination for API servers |
| Features | **HIGH** | POS patterns (scanning, offline, variants) are well-established |
| Architecture | **HIGH** | Monolith with clean packages is the simplest correct architecture for v1 |
| Pitfalls | **HIGH** | All 5 pitfalls are well-documented industry knowledge with clear prevention strategies |

**Overall confidence:** **HIGH**

The research is grounded in well-documented Go ecosystem tools and established POS/ERP patterns. Medium uncertainty remains on:
- Thai QR PromptPay specific gateway requirements (external dependency)
- BarcodeDetector API real-world scanning speed (hardware-dependent)
- TypeScript API client maintenance burden without auto-generation

### Gaps to Address

1. **Thai QR Payment Gateway:** Research covered EMVCo QR pattern, but actual PromptPay certification needs investigation before Phase 3.

2. **Hardware Compatibility Matrix:** Barcode scanners and receipt printers vary by model. Define minimum hardware specs for v1.

3. **API Contract Sync:** Without Encore's auto-generated TypeScript client, need a strategy to keep frontend types in sync with Go API (OpenAPI spec generation from Go, or manual TypeScript types).

---

## Sources

### Primary (HIGH confidence)

- **Go chi docs** (`go-chi.io`) — Router patterns, middleware composition
- **sqlc docs** (`docs.sqlc.dev`) — Query annotation, pgx integration, configuration
- **pgx docs** (`github.com/jackc/pgx`) — Connection pooling, type mapping
- **golang-migrate docs** (`github.com/golang-migrate/migrate`) — Migration CLI and patterns

### Secondary (MEDIUM confidence)

- **POS/ERP domain patterns** — Inventory ledger, variant model, offline sync from industry research
- **MDN Web API: BarcodeDetector** — Shape Detection API specification
- **MDN Web API: WebUSB** — Browser USB access specification

### Tertiary (LOW confidence)

- **Thai QR PromptPay** — EMVCo standard general guidance; specific Thai payment gateway requirements not verified
- **Dexie.js + TanStack Query** — Community-reported integration patterns

---

*Research completed: March 22, 2026*
*Updated: April 18, 2026 — Go stack migration*
*Ready for roadmap: yes*
