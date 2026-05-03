# Roadmap: OpenPOS v1

**Created:** 2026-03-22
**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.
**Milestone:** v1 — Complete sale loop: ring up → pay → stock deducts → owner sees reports
**Execution Order Note:** v1 scope is unchanged, but execution priority is POS-first: finish Phases 05 and 06, re-audit, then resume Phase 07.
**Stack Reset:** 2026-04-18 — migrated from Encore TypeScript to Go (chi + sqlc + pgx). All phases reset.

---

## Phase 01: Foundation & Backend Core

**Goal:** Go backend is operational with authentication, product catalog, and inventory data models — ready for frontend consumption.

**Status:** Complete

**Depends on:** Nothing

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, INV-01, INV-02, INV-03, INV-04, PLAT-02, PLAT-03

**Plans:** 4/4 plans executed
- [x] 01-01-PLAN.md — Foundation & Backend Infra
- [x] 01-02-PLAN.md — Authentication & Identity
- [x] 01-03-PLAN.md — Product Catalog Data Model
- [x] 01-04-PLAN.md — Inventory Ledger System

**Canonical refs:** `.planning/research/stack.md` (Go architecture), `.planning/research/SUMMARY.md` §Pitfalls (quantity column trap, flat product schema)

---

## Phase 02: POS Frontend & Offline

**Goal:** Cashiers can ring up sales using the mobile-first POS interface, including while offline.

**Depends on:** Phase 01

**Requirements:** POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, OFF-01, OFF-02, OFF-03, OFF-04, PLAT-01, PLAT-04

**Status:** Complete

**Plans:** 5/5 plans executed
- [x] 02-01-PLAN.md — Frontend Foundation (Vite+React, routing, auth session)
- [x] 02-02-PLAN.md — Sales & Sync Backend Contract
- [x] 02-03-PLAN.md — POS Catalog, Cart & Totals
- [x] 02-04-PLAN.md — Barcode Scanning
- [x] 02-05-PLAN.md — Offline Storage, Queue & Sync

**Wave Structure:**
- Wave 1: 02-01 + 02-02 (frontend foundation and backend contract in parallel)
- Wave 2: 02-03 + 02-04 (catalog/cart and scanning, both need frontend shell)
- Wave 3: 02-05 (offline sync, needs everything)

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

## Phase 03: Payments & Receipts

**Goal:** Cashiers can collect payment (cash or QR) and print a receipt to complete the sale.

**Depends on:** Phase 02

**Requirements:** PAY-01, PAY-02, PAY-03, REC-01, REC-02, REC-03

**Status:** Complete

**Success Criteria:**
1. Cashier can enter cash tendered and see change due calculated automatically
2. Cashier can generate a Thai QR PromptPay code for the customer to scan
3. Sale completes only when tendered amount ≥ order total
4. Receipt prints to thermal printer via WebUSB with ESC/POS commands
5. Receipt prints via AirPrint (system print dialog) on iOS devices
6. Receipt shows: store name, date/time, items with qty and prices, total, payment method, change due

**Canonical refs:** `.planning/research/SUMMARY.md` §Pitfalls (WebUSB iOS, tax rounding)

**Plans:** 1/1 plans executed
- [x] 03-01-PLAN.md — Payments & Receipts

---

## Phase 04: ERP Management & Reporting

**Goal:** Owners can manage products/inventory and view business performance through the desktop ERP interface.

**Depends on:** Phase 01 (backend APIs), Phase 03 (sales data exists for reports)

**Requirements:** PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, RPT-01, RPT-02, RPT-03, PLAT-05

**Status:** Complete

**Plans:** 9/9 plans complete
- [x] 04-01-PLAN.md — Order-item cost snapshots for stable gross profit
- [x] 04-02-PLAN.md — Reporting APIs for monthly sales and gross profit
- [x] 04-03-PLAN.md — Category sort order and reorder support
- [x] 04-04-PLAN.md — Vitest setup for ERP UI tests
- [x] 04-05-PLAN.md — ERP shell, owner guard, and tabbed layout
- [x] 04-06-PLAN.md — Product and category CRUD workflows
- [x] 04-07-PLAN.md — Barcode generation and spreadsheet import
- [x] 04-08-PLAN.md — Reporting dashboard and THB summary cards
- [x] 04-09-PLAN.md — PDF/XLSX export actions

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

## Phase 05: POS Frontend & Offline Gap Closure

**Goal:** Close the offline POS wiring gaps so queued sales, sync retries, and sync contracts are verified end-to-end.

**Depends on:** Phase 02

**Requirements:** POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, OFF-01, OFF-02, OFF-03, OFF-04, PLAT-01, PLAT-04

**Status:** Complete

**Gap Closure:** Closes audit blockers for the offline queue/sync loop and frontend/backend sync contract mismatch.

**Plans:** 2/2 plans complete
- [x] 05-01-PLAN.md — Repair the offline sync contract and queue state bookkeeping
- [x] 05-02-PLAN.md — Re-export the cashier route components and add POS shell smoke tests

---

## Phase 06: Payments, Receipts & Sale Finalization

**Goal:** Close the sale-finalization gaps so payment capture, inventory deduction, and receipt flows complete in a safe order.

**Depends on:** Phase 03, Phase 01

**Requirements:** PAY-01, PAY-02, PAY-03, REC-01, REC-02, REC-03, INV-01, INV-02, INV-03, INV-04

**Status:** Complete

**Gap Closure:** Closes audit blockers for atomic ordering across payment, stock deduction, reporting, and receipt re-fetch.

**Execution Priority:** This phase must be completed and verified before Phase 07 begins, because cashier-facing sale finalization is the current milestone gate.

**Plans:** 2/2 plans executed
- [x] 06-01-PLAN.md — Fail-fast bootstrap and transactional sales wiring
- [x] 06-02-PLAN.md — Payment, receipt, and inventory regressions

---

## Phase 07: ERP Management & Reporting Gap Closure

**Goal:** Close the ERP and reporting verification gaps so product management and reporting requirements are explicitly re-verified.

**Depends on:** Phase 04, Phase 01, Phase 03

**Requirements:** PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, RPT-01, RPT-02, RPT-03, PLAT-05

**Status:** Complete

**Gap Closure:** Closes the remaining orphaned ERP/reporting requirements from the audit.

**Plans:** 4/4 plans complete
- [x] 07-01-PLAN.md — Re-verify product and variant management contracts
- [x] 07-02-PLAN.md — Re-verify category management and catalog import
- [x] 07-03-PLAN.md — Re-verify reporting dashboard and monthly rollups
- [x] 07-04-PLAN.md — Re-verify report exports and THB formatting

**Execution Note:** Do not start this phase until Phase 06 verification passes. ERP verification stays in v1 scope, but follows POS sale-loop closure.

---

## Phase 08: Receipt Replay & Re-open Closure

**Goal:** Wire persisted receipt lookup into the POS flow so receipt replay and re-open behavior use the backend receipt endpoint instead of the payment snapshot alone.

**Depends on:** Phase 03, Phase 06

**Requirements:** REC-03

**Status:** Planned

**Gap Closure:** Closes the audit blocker where `GET /api/orders/{id}/receipt` had no frontend consumer.

**Plans:** 1/1 plans drafted
- [ ] 08-01-PLAN.md — Persisted receipt replay and latest Reprint receipt action

---

## Phase 09: Offline Shell Verification Cleanup

**Goal:** Turn the remaining offline retry and mobile-shell human verification items into explicit verification coverage so the gap is documented and testable.

**Depends on:** Phase 05

**Requirements:** None (tech debt verification only)

**Status:** Planned

**Gap Closure:** Tracks the remaining non-blocking audit debt for offline retry and mobile shell confirmation.

**Plans:** 0/1 plans drafted

---

## Coverage

**v1 Requirements: 40 total**

| Phase | Count | Requirements |
|-------|-------|-------------|
| 1 — Foundation & Backend Core | 11 | AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, INV-01, INV-02, INV-03, INV-04, PLAT-02, PLAT-03 |
| 2 — POS Frontend & Offline | 13 | POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, OFF-01, OFF-02, OFF-03, OFF-04, PLAT-01, PLAT-04 |
| 3 — Payments & Receipts | 6 | PAY-01, PAY-02, PAY-03, REC-01, REC-02, REC-03 |
| 4 — ERP Management & Reporting | 10 | PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, RPT-01, RPT-02, RPT-03, PLAT-05 |
| 8 — Receipt Replay & Re-open Closure | 1 | REC-03 |
| 9 — Offline Shell Verification Cleanup | 0 | Tech debt only |

- Mapped: 40 (some requirements span backend+frontend phases)
- Complete: 39/40
- Pending: REC-03
- No orphaned requirements

**Note:** Phase 01 creates backend APIs for product/inventory management. Phase 04 creates the ERP *UI* that consumes those APIs. The PROD-* requirements are user-facing ("Owner can...") so they're assigned to Phase 04 where the user actually performs the action. Phase 01's success criteria cover the underlying data model and API layer.

---

## Research Flags

| Phase | Needs Research | Skip Research |
|-------|----------------|---------------|
| 01 | sqlc + pgx patterns for POS domain | chi router (well-documented) |
| 02 | BarcodeDetector API performance | Dexie.js patterns |
| 03 | Thai QR PromptPay gateway API | ESC/POS standard |
| 04 | Report export formats (PDF/Excel libs) | PostgreSQL aggregation |

---
*Roadmap created: 2026-03-22*
*Last updated: 2026-05-02 — roadmap reconciled with the implemented v1 codebase*
