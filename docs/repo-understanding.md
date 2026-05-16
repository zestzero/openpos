# OpenPOS Repo Understanding Map

## Goal

Build a working mental model of the OpenPOS repository: domain concepts, runtime flows, architectural boundaries, and where to start for future changes.

## High-Level Product Shape

OpenPOS is a retail POS plus ERP system. The main promise is that a cashier can complete a sale end-to-end, including scanning, payment, receipt output, offline operation, and later sync.

Core surfaces:

- POS: mobile-first cashier flow for catalog browsing, barcode scanning, cart, checkout, payment, receipt replay, offline status, and sync.
- ERP: desktop backoffice flow for owners/managers to manage products, variants, categories, inventory, import data, and reports.
- Backend API: Go HTTP JSON API for auth, catalog, inventory, sales, and reporting.
- Database: PostgreSQL schema managed by migrations, with sqlc-generated Go accessors.
- Offline layer: Dexie/IndexedDB, local order storage, sync queue, service-worker-oriented offline posture.

## Non-Negotiable Domain Rules

These rules should guide every change:

1. Product is always parent data; Variant is the sellable SKU/barcode item.
2. Stock is never a mutable `quantity` column; Inventory Ledger entries are append-only and current stock is derived from `SUM(quantity_change)`.
3. Offline sync must send delta operations, not absolute replacement state.
4. Money is integer satang/cents in database, backend, and frontend state.
5. Order Items snapshot sale-time price/cost so reporting history survives catalog changes.
6. Offline-created Orders use stable client UUIDs for idempotent reconciliation.

## Backend Map

Primary entry and wiring:

- `cmd/server/main.go`: process entrypoint and HTTP server lifecycle.
- `cmd/server/bootstrap.go`: migrations, DB pool, chi router, CORS, auth middleware, and domain route mounting.
- Protected API routes are mounted under `/api` after JWT middleware.
- Public auth routes live under `/api/auth`.

Backend domains:

- `internal/auth/`: register/login/PIN login, password/PIN hash verification, JWT creation.
- `internal/catalog/`: Category, Product, Variant management and import-oriented catalog behavior.
- `internal/inventory/`: Inventory Ledger writes and derived Stock Level reads.
- `internal/sales/`: Order creation, Order Items, Payments, inventory deduction, receipt snapshots, sync results.
- `internal/reporting/`: monthly sales and gross profit reports.
- `internal/middleware/`: JWT auth and CORS.
- `internal/database/`: PostgreSQL connection support.

Persistence contracts:

- `db/migrations/`: canonical schema history.
- `db/queries/`: handwritten SQL for sqlc.
- `db/sqlc/`: generated code; do not edit manually.

Important backend dependency flow:

- Router builds services in `cmd/server/bootstrap.go`.
- Catalog and Inventory services use `sqlc.New(pool)` directly.
- Sales service is explicitly composed with an `OrderStore` and `InventoryGateway`.
- Sales uses Inventory directly for stock checks and sale deductions, not HTTP.
- Sales can run order creation and inventory deduction inside one database transaction when the pool is set.

## Frontend Map

Top-level frontend stack:

- Vite SPA.
- React 19.
- TanStack Router.
- TanStack Query.
- Tailwind CSS v4.
- shadcn-style primitives in `frontend/src/components/ui/`.
- Dexie for IndexedDB.
- Vitest and Testing Library.

Primary route files:

- `frontend/src/routes/__root.tsx`: root auth guard and login redirect behavior.
- `frontend/src/routes/index.tsx`: role-aware landing redirect.
- `frontend/src/routes/login.tsx`: email/password and PIN login.
- `frontend/src/routes/pos.tsx`: POS shell route.
- `frontend/src/routes/pos.catalog.tsx`: POS catalog/cart route.
- `frontend/src/routes/pos.scan.tsx`: scanner route.
- `frontend/src/routes/erp.tsx`: ERP shell route.
- `frontend/src/routes/erp.index.tsx`: ERP dashboard.
- `frontend/src/routes/erp.products.tsx`: Product Management page.
- `frontend/src/routes/erp.inventory.tsx`: Inventory page.
- `frontend/src/routes/erp.reports.tsx`: Reporting page.

Frontend feature areas:

- `frontend/src/pos/`: cashier layout, catalog grid, barcode scanner, cart panel, receipt replay, offline/sync hooks.
- `frontend/src/erp/`: owner/manager layout, navigation, products, categories, inventory, reports, import/export.
- `frontend/src/hooks/`: shared auth and RBAC hooks.
- `frontend/src/lib/`: API clients, auth storage, Dexie DB, currency formatting, PromptPay, receipt, reporting utilities.
- `frontend/src/components/ui/`: shared UI primitives.

## Critical Runtime Flows

Authentication and role routing:

1. User signs in via email/password or PIN.
2. Frontend stores token/user/session data in `frontend/src/lib/auth.ts`.
3. `__root.tsx` redirects unauthenticated users to `/login`.
4. Logged-in users hitting `/login` are redirected by role.
5. Backend JWT middleware validates protected `/api/*` requests.

POS catalog and checkout:

1. `pos.catalog.tsx` renders `PosLayout`, `CatalogCategoryNav`, and `CatalogGrid`.
2. `PosLayout` pulls in auth, network status, cart, header, offline banner, POS nav, and cart panel.
3. Product cards add Variants to cart.
4. Checkout creates an Order with Order Items and Payment data.
5. Sales service validates stock, creates Order/Items, snapshots price/cost, records Payment, and writes Inventory Ledger deductions.
6. Receipt text/printing and latest receipt replay are handled client-side.

Inventory:

1. Manual adjustments call Inventory service with a reason code.
2. Sales deductions call Inventory service directly with `ReasonSale`.
3. Negative stock is blocked before ledger insert.
4. Current stock is read from the ledger-derived Stock Level query.

Offline/sync:

1. POS stores local/offline Orders via Dexie-backed hooks.
2. `useSync` observes network state and offline orders.
3. `syncContract.ts` builds the sync request and derives sync snapshots.
4. Sync results determine which client UUIDs remain failed/pending.

Reporting:

1. Reporting service reads SQL reporting read models/views.
2. ERP report UI renders report cards/charts and supports export.
3. Sale-time cost snapshots are important for gross profit correctness.

## Code Graph Observations

The repository graph currently has 1326 nodes and 10051 edges across 158 files.

Largest communities:

- `scripts-render`: mostly local skill/tooling render scripts, not app runtime.
- `lib-use`: shared frontend library/hook usage.
- `sqlc-params`: generated sqlc model/params/result types.
- `sales-order`: Order, Order Item, Payment, and checkout semantics.
- `catalog-category`: Product, Variant, Category, and ERP/POS catalog flows.
- `inventory-stock`: Inventory Ledger and Stock Level logic.
- `auth-login`: login/session/JWT flow.
- `reporting-service`: reports backend/frontend flow.

Important app flows by graph criticality:

- `ErpRoute`: ERP shell and auth/session dependencies.
- `ScanPage`: barcode scanning flow.
- `PosCatalogRoute`: catalog, cart, receipt, PromptPay, sync status, and POS shell.
- `useRbac`: role-gated UI behavior.
- `ErpReportsRoute`: reporting dashboard/export flow.
- `useSync`: offline order sync state and request contract.

## Testing And Verification Commands

Backend:

- `go test ./...`
- `go build -o openpos ./cmd/server`
- `sqlc generate` after SQL/query/schema contract changes.

Frontend, from `frontend/`:

- `npm run test`
- `npm run build`
- `npm run lint`

## Where To Start For Common Changes

Catalog/Product/Variant behavior:

- Read `db/migrations/000001_init.up.sql`, `db/queries/catalog.sql`, `internal/catalog/service.go`, `internal/catalog/handler.go`, `frontend/src/erp/products/`, and POS catalog components.

Inventory/stock correctness:

- Read `db/queries/inventory.sql`, `internal/inventory/service.go`, `internal/inventory/handler.go`, `frontend/src/erp/inventory/InventoryPage.tsx`.

Checkout/sales/order behavior:

- Read sales migrations, `db/queries/sales.sql`, `internal/sales/service.go`, `internal/sales/handler.go`, `frontend/src/pos/components/CartPanel.tsx`, and POS checkout hooks.

Offline sync:

- Read `frontend/src/lib/db.ts`, `frontend/src/pos/hooks/useOfflineOrders.ts`, `frontend/src/pos/hooks/useSync.ts`, `frontend/src/pos/hooks/syncContract.ts`, plus sales sync endpoints.

Auth/RBAC:

- Read `internal/auth/`, `internal/middleware/auth.go`, `frontend/src/lib/auth.ts`, `frontend/src/hooks/useAuth.ts`, `frontend/src/hooks/useRbac.ts`, and route guards.

Reporting:

- Read `db/migrations/009_add_reporting_read_models.up.sql`, `db/queries/reporting.sql`, `internal/reporting/service.go`, `internal/reporting/handler.go`, and `frontend/src/erp/reports/`.

## Recommended Next Deep Dives

1. Inventory/Sales transaction correctness: verify ledger-derived stock, negative stock prevention, and sale deduction atomicity.
2. Offline sync contract: trace client UUID handling from Dexie to backend sync result.
3. Product/Inventory split polish: inspect current branch changes against `CONTEXT.md` status.
4. Role/RBAC coverage: verify owner/cashier UI and API protections are aligned.
5. Reporting correctness: validate cost snapshots and gross profit queries against sales/order item schema.
