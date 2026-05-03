# Requirements: OpenPOS

**Defined:** 2026-03-22
**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.
**Stack Reset:** 2026-04-18 — migrated from Encore TypeScript to Go (chi + sqlc + pgx). All requirements reset to pending.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: Owner can create account with email and password
- [x] **AUTH-02**: Owner can log in with email/password and stay logged in across sessions
- [x] **AUTH-03**: Owner can create cashier accounts and assign roles (Cashier, Owner)
- [x] **AUTH-04**: Cashier can log in at the register using a numeric PIN
- [x] **AUTH-05**: System enforces role-based access — cashiers see POS only, owners see POS + ERP

### POS — Sale Flow

- [x] **POS-01**: Cashier can scan barcode via device camera (BarcodeDetector API with html5-qrcode fallback)
- [x] **POS-02**: Cashier can scan barcode via USB keyboard-wedge scanner (rapid keystroke detection)
- [x] **POS-03**: Cashier can browse products via touch catalog grid organized by category
- [x] **POS-04**: Cashier can search products by name or SKU
- [x] **POS-05**: Cashier can add, remove, and adjust item quantities in the cart
- [x] **POS-06**: Cashier can see a favorites/quick-keys bar with most-sold items for one-tap add
- [x] **POS-07**: Cart displays running total, item count, and per-line subtotals in THB

### POS — Payments

- [x] **PAY-01**: Cashier can accept cash payment with automatic change calculation displayed
- [x] **PAY-02**: Cashier can generate Thai QR PromptPay code for customer to scan and pay
- [x] **PAY-03**: Sale completes only when tendered amount ≥ order total

### POS — Receipts

- [x] **REC-01**: System prints receipt to thermal printer via WebUSB (ESC/POS commands)
- [x] **REC-02**: System falls back to AirPrint (system print dialog) on iOS devices
- [x] **REC-03**: Receipt includes: store name, date/time, items with quantities and prices, total, payment method, change due

### POS — Offline

- [x] **OFF-01**: Cashier can complete sales while device has no internet connection
- [x] **OFF-02**: Completed offline sales are queued and automatically synced when connectivity returns
- [x] **OFF-03**: Sync retries with exponential backoff on failure
- [x] **OFF-04**: Stock changes sync as delta operations (decrement by quantity sold), not absolute values

### Product Management

- [x] **PROD-01**: Owner can create products with name, description, category, and images
- [x] **PROD-02**: Owner can define variants per product (e.g., Size: S/M/L, Color: Red/Blue) each with own SKU, barcode, price, and cost
- [x] **PROD-03**: Owner can edit and archive products and variants
- [x] **PROD-04**: Owner can organize products into categories (create, edit, reorder categories)
- [x] **PROD-05**: Owner can assign or generate barcodes for each variant
- [x] **PROD-06**: Owner can bulk import products and variants via CSV or Excel file

### Inventory

- [x] **INV-01**: Every stock change is recorded in an inventory ledger with type (sale, restock, adjustment), quantity delta, and reference
- [x] **INV-02**: Stock automatically deducts when a sale completes (via ledger entry)
- [x] **INV-03**: Owner can manually adjust stock with a reason code (damaged, count correction, received)
- [x] **INV-04**: Owner can view current stock levels per variant (derived from ledger)

### Reporting

- [x] **RPT-01**: Owner can view monthly sales summary (total revenue, total orders, average order value)
- [x] **RPT-02**: Owner can view gross profit report (revenue minus cost of goods sold)
- [x] **RPT-03**: Owner can export reports to PDF or Excel

### Platform

- [x] **PLAT-01**: Single Vite + React SPA with route-based separation (POS = mobile-optimized, ERP = desktop-optimized)
- [x] **PLAT-02**: Go backend with chi router, sqlc for type-safe SQL, pgx for PostgreSQL driver
- [x] **PLAT-03**: PostgreSQL database with golang-migrate for schema migrations
- [x] **PLAT-04**: PWA with service worker for offline POS capability
- [x] **PLAT-05**: All monetary values displayed in Thai Baht (THB) using Intl.NumberFormat

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-V2-01**: User can reset password via email link
- **AUTH-V2-02**: OAuth login (Google)

### POS — Sale Flow

- **POS-V2-01**: Cashier can apply simple discounts (manual % or fixed amount per item or per order)
- **POS-V2-02**: Cashier can hold current cart and recall it later (park a sale)

### POS — Payments

- **PAY-V2-01**: Cashier can record card payments
- **PAY-V2-02**: Cashier can split payment across multiple methods on one sale (mixed tenders)
- **PAY-V2-03**: LINE Pay integration

### POS — Offline

- **OFF-V2-01**: Offline catalog cache (browse products without internet, not just queue orders)
- **OFF-V2-02**: Conflict resolution UI when server rejects offline-synced sales

### Product Management

- **PROD-V2-01**: Supplier info tracking per product
- **PROD-V2-02**: Product duplication / templating
- **PROD-V2-03**: Image gallery per product

### Inventory

- **INV-V2-01**: Low-stock alerts with configurable thresholds
- **INV-V2-02**: Current stock snapshot table (performance optimization for large catalogs)
- **INV-V2-03**: Inventory count / reconciliation workflow

### Reporting

- **RPT-V2-01**: Daily sales summary
- **RPT-V2-02**: Top-selling items ranking
- **RPT-V2-03**: Dashboard with charts

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-location / multi-warehouse | Premature complexity — single shop for v1 |
| Promo engine (buy-X-get-Y, time-based) | Simple discounts deferred to v2; promos are v3+ |
| Financial analytics / P&L | Gross profit in v1; deeper analytics deferred |
| Batch tracking / expiry / serial numbers | Basic inventory sufficient for retail |
| Customer loyalty / membership | Not needed for core sale loop |
| Multi-currency | THB only for v1 |
| Payment terminal (EDC) integration | Manual recording sufficient for v1 |
| Customer-facing second screen | Nice-to-have, not core |
| Digital receipts (email/SMS) | Thermal printing covers v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| POS-01 | Phase 5 | Complete |
| POS-02 | Phase 5 | Complete |
| POS-03 | Phase 5 | Complete |
| POS-04 | Phase 5 | Complete |
| POS-05 | Phase 5 | Complete |
| POS-06 | Phase 5 | Complete |
| POS-07 | Phase 5 | Complete |
| PAY-01 | Phase 6 | Pending |
| PAY-02 | Phase 6 | Pending |
| PAY-03 | Phase 6 | Complete |
| REC-01 | Phase 6 | Pending |
| REC-02 | Phase 6 | Pending |
| REC-03 | Phase 08 | Pending |
| OFF-01 | Phase 5 | Complete |
| OFF-02 | Phase 5 | Complete |
| OFF-03 | Phase 5 | Complete |
| OFF-04 | Phase 5 | Complete |
| PROD-01 | Phase 7 | Complete |
| PROD-02 | Phase 7 | Complete |
| PROD-03 | Phase 7 | Complete |
| PROD-04 | Phase 7 | Complete |
| PROD-05 | Phase 7 | Complete |
| PROD-06 | Phase 7 | Complete |
| INV-01 | Phase 6 | Complete |
| INV-02 | Phase 6 | Complete |
| INV-03 | Phase 6 | Pending |
| INV-04 | Phase 6 | Pending |
| RPT-01 | Phase 7 | Complete |
| RPT-02 | Phase 7 | Complete |
| RPT-03 | Phase 7 | Complete |
| PLAT-01 | Phase 5 | Complete |
| PLAT-02 | Phase 1 | Complete |
| PLAT-03 | Phase 1 | Complete |
| PLAT-04 | Phase 5 | Complete |
| PLAT-05 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Complete: 39
- Pending: 1
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-05-02 — synchronized with the implemented checkout and receipt flow*
