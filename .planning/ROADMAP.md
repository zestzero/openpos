# Roadmap: OpenPOS v1

**Created:** 2026-03-22
**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.
**Milestone:** v1 — Complete sale loop: ring up → pay → stock deducts → owner sees reports
**Stack Reset:** 2026-04-18 — migrated from Encore TypeScript to Go (chi + sqlc + pgx). All phases reset.

---

## Phase 1: Foundation & Backend Core

**Goal:** Go backend is operational with authentication, product catalog, and inventory data models — ready for frontend consumption.

**Status:** In progress

**Depends on:** Nothing

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, INV-01, INV-02, INV-03, INV-04, PLAT-02, PLAT-03

**Plans:** 1/4 plans executed
- [x] 01-01-PLAN.md — Foundation & Backend Infra
- [x] 01-02-PLAN.md — Authentication & Identity
- [ ] 01-03-PLAN.md — Product Catalog Data Model
- [ ] 01-04-PLAN.md — Inventory Ledger System

**Canonical refs:** `.planning/research/stack.md` (Go architecture), `.planning/research/SUMMARY.md` §Pitfalls (quantity column trap, flat product schema)

---

## Phase 2: POS Frontend & Offline

**Goal:** Cashiers can ring up sales using the mobile-first POS interface, including while offline.

**Depends on:** Phase 1

**Requirements:** POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, OFF-01, OFF-02, OFF-03, OFF-04, PLAT-01, PLAT-04

**Status:** Not started

**Success Criteria:**
1. Cashier can scan a product barcode via device camera and it adds to cart
2. Cashier can scan barcode via USB keyboard-wedge scanner and it adds to cart
3. Cashier can browse products in a touch catalog grid organized by category
4. Cashier can search products by name or SKU and add results to cart
5. Cashier can adjust quantities and remove items from cart
6. Cashier sees a favorites/quick-keys bar and can one-tap add items
7. Cart displays running total, item count, and per-line subtotals in THB
8. Cashier can complete a sale while offline — order is queued locally
9. Queued offline orders automatically sync when connectivity returns with exponential backoff retry
10. Stock changes sync as delta operations (decrement by qty sold), not absolute values

**Canonical refs:** `.planning/research/SUMMARY.md` §Pitfalls (Last Write Wins)

---

## Phase 3: Payments & Receipts

**Goal:** Cashiers can collect payment (cash or QR) and print a receipt to complete the sale.

**Depends on:** Phase 2

**Requirements:** PAY-01, PAY-02, PAY-03, REC-01, REC-02, REC-03

**Status:** Not started

**Success Criteria:**
1. Cashier can enter cash tendered and see change due calculated automatically
2. Cashier can generate a Thai QR PromptPay code for the customer to scan
3. Sale completes only when tendered amount ≥ order total
4. Receipt prints to thermal printer via WebUSB with ESC/POS commands
5. Receipt prints via AirPrint (system print dialog) on iOS devices
6. Receipt shows: store name, date/time, items with qty and prices, total, payment method, change due

**Canonical refs:** `.planning/research/SUMMARY.md` §Pitfalls (WebUSB iOS, tax rounding)

---

## Phase 4: ERP Management & Reporting

**Goal:** Owners can manage products/inventory and view business performance through the desktop ERP interface.

**Depends on:** Phase 1 (backend APIs), Phase 3 (sales data exists for reports)

**Requirements:** PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, RPT-01, RPT-02, RPT-03, PLAT-05

**Status:** Not started

**Success Criteria:**
1. Owner can create products with name, description, category, and images via ERP UI
2. Owner can define variants per product (size/color) each with own SKU, barcode, price, and cost
3. Owner can edit and archive products and variants
4. Owner can manage categories (create, edit, reorder)
5. Owner can assign or generate barcodes per variant
6. Owner can bulk import products and variants via CSV or Excel file
7. Owner can view monthly sales summary (total revenue, order count, average order value)
8. Owner can view gross profit report (revenue minus cost of goods sold)
9. Owner can export reports to PDF or Excel
10. All monetary values display in Thai Baht (THB) using Intl.NumberFormat

---

## Coverage

**v1 Requirements: 32 total**

| Phase | Count | Requirements |
|-------|-------|-------------|
| 1 — Foundation & Backend Core | 11 | AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, INV-01, INV-02, INV-03, INV-04, PLAT-02, PLAT-03 |
| 2 — POS Frontend & Offline | 13 | POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, OFF-01, OFF-02, OFF-03, OFF-04, PLAT-01, PLAT-04 |
| 3 — Payments & Receipts | 6 | PAY-01, PAY-02, PAY-03, REC-01, REC-02, REC-03 |
| 4 — ERP Management & Reporting | 10 | PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, RPT-01, RPT-02, RPT-03, PLAT-05 |

- Mapped: 40 (some requirements span backend+frontend phases)
- All 32 v1 requirements covered
- No orphaned requirements

**Note:** Phase 1 creates backend APIs for product/inventory management. Phase 4 creates the ERP *UI* that consumes those APIs. The PROD-* requirements are user-facing ("Owner can...") so they're assigned to Phase 4 where the user actually performs the action. Phase 1's success criteria cover the underlying data model and API layer.

---

## Research Flags

| Phase | Needs Research | Skip Research |
|-------|----------------|---------------|
| 1 | sqlc + pgx patterns for POS domain | chi router (well-documented) |
| 2 | BarcodeDetector API performance | Dexie.js patterns |
| 3 | Thai QR PromptPay gateway API | ESC/POS standard |
| 4 | Report export formats (PDF/Excel libs) | PostgreSQL aggregation |

---
*Roadmap created: 2026-03-22*
*Last updated: 2026-04-18 — full reset for Go stack migration*
