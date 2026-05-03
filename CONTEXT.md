# OpenPOS Context

OpenPOS is a retail point-of-sale and ERP system. Its core product promise is that a salesperson can complete a sale end-to-end — scan items, take payment, and produce a receipt — even when internet connectivity is unavailable.

This document is the shared project context for agents and maintainers. Use it to preserve the project language, architectural boundaries, and non-negotiable data model rules.

## Product Shape

- **POS**: mobile-first cashier/salesperson flow for catalog browsing, barcode scanning, cart management, checkout, payment, receipt replay, offline operation, and sync status.
- **ERP**: desktop backoffice flow for owners/managers to manage products, variants, categories, import data, and view reports.
- **Backend API**: Go service exposing auth, catalog, inventory, sales, and reporting endpoints over JSON.
- **Database**: PostgreSQL schema with sqlc-generated access code and migration-managed evolution.
- **Offline layer**: IndexedDB/Dexie local state plus a handwritten service worker and sync queue.

## Stack

### Backend

- Go `1.26.2` in this repository (`go.mod`), with README compatibility target of Go `1.22+`.
- chi v5 router.
- pgx v5 PostgreSQL driver.
- sqlc for SQL-to-Go query generation.
- golang-migrate for schema migrations.
- JWT auth with owner/cashier roles.

### Frontend

- Vite SPA.
- React 19.
- TanStack Router for routes.
- TanStack Query for server state.
- Tailwind CSS v4.
- shadcn-style component primitives in `frontend/src/components/ui/`.
- Dexie.js for IndexedDB.
- Vitest and Testing Library for frontend tests.

### Infrastructure

- PostgreSQL 15+.
- Docker Compose for local app + database.
- Multi-stage Dockerfile for deployment.

## Core Domain Vocabulary

- **User**: authenticated operator. Has a `role`, currently owner/cashier-oriented.
- **Owner**: backoffice/ERP-oriented user who can manage store data and view reports.
- **Cashier**: POS-oriented user who sells products and takes payment.
- **Category**: hierarchical product grouping. Categories may have parent categories and sort order.
- **Product**: parent catalog record, not directly sold. Holds shared product metadata like name, description, category, image, and active state.
- **Variant**: sellable SKU/barcode item under a product. Holds SKU, barcode, display name, price, cost, and active state.
- **Inventory Ledger**: append-only stock movement table. Stock is derived from ledger deltas.
- **Stock Level / Current Stock**: derived quantity for a variant, computed by summing inventory ledger changes.
- **Order**: completed or in-progress sale record. Uses `client_uuid` so offline-created sales can be reconciled idempotently.
- **Order Item**: line item snapshot for a variant sold in an order. Captures price and cost at sale time.
- **Payment**: payment record for an order.
- **Receipt**: client-side representation/output of a completed sale; latest receipts can be replayed/reprinted in POS.
- **Reporting Read Model**: database view/query optimized for ERP reporting, such as monthly sales or gross profit.
- **Sync Operation**: offline-safe delta operation sent to the server, not a replacement state snapshot.

## Non-Negotiable Data Rules

1. **Never flat products**: model catalog as `Product -> Variant`. A product is a parent. A variant is the sellable SKU/barcode entity.
2. **Never use a mutable quantity column for stock**: inventory changes are ledger entries in `inventory_ledger`; current stock is derived from `SUM(quantity_change)`.
3. **Delta sync only**: offline sync sends operations such as “decrement 1”, never absolute state such as “set stock to 9”.
4. **Money as integers**: store monetary values as integer satang/cents (`BIGINT`) in backend, database, and frontend state. Format only at presentation boundaries.
5. **Snapshot sale economics**: order items preserve sale-time price/cost so later catalog cost changes do not rewrite historical reports.
6. **Offline-created orders need stable client identity**: use client-generated UUIDs for offline sales and idempotent reconciliation.

## Main Code Map

### Backend

- `cmd/server/main.go`: process entrypoint, environment loading, HTTP server lifecycle, graceful shutdown.
- `cmd/server/*`: bootstrap/router wiring for handlers, services, database pool, migrations, and middleware.
- `internal/auth/`: registration/login/PIN login, password/PIN hashing, JWT/session semantics.
- `internal/catalog/`: categories, products, variants, import/export-oriented catalog operations.
- `internal/inventory/`: stock ledger writes and stock level reads.
- `internal/sales/`: order creation, order items, payment handling, inventory deductions, price/cost snapshots.
- `internal/reporting/`: monthly sales and gross profit reporting services/handlers.
- `internal/middleware/`: auth, CORS, logging/request concerns.
- `internal/database/`: PostgreSQL connection management.
- `db/migrations/`: canonical schema history.
- `db/queries/`: handwritten SQL contracts consumed by sqlc.
- `db/sqlc/`: generated code; do not edit by hand.

### Frontend

- `frontend/src/routes/`: TanStack Router route definitions and route-level loaders/guards.
- `frontend/src/routes/__root.tsx`: root route shell and auth-aware routing context.
- `frontend/src/routes/index.tsx`: role-aware landing redirect.
- `frontend/src/routes/login.tsx`: email/password and PIN login UI.
- `frontend/src/routes/pos.tsx`: main POS shell route.
- `frontend/src/routes/pos.catalog.tsx`: POS catalog/cart entry flow.
- `frontend/src/routes/pos.scan.tsx`: barcode/camera/keyboard scan flow.
- `frontend/src/routes/erp.tsx`: ERP shell route.
- `frontend/src/routes/erp.index.tsx`: ERP management dashboard.
- `frontend/src/routes/erp.reports.tsx`: ERP reports route.
- `frontend/src/pos/`: POS layouts, components, hooks, offline order handling, scanner support, receipt replay.
- `frontend/src/erp/`: ERP layouts, navigation, product/category drawers and tables, reporting charts/cards/export.
- `frontend/src/hooks/`: shared auth/RBAC hooks.
- `frontend/src/lib/`: API clients, auth/session helpers, Dexie DB, currency formatting, PromptPay/receipt/reporting utilities.
- `frontend/src/components/ui/`: shared UI primitives.

## Core Runtime Flows

### Authentication and Role Routing

1. User signs in via email/password or PIN login.
2. Frontend stores session/auth state via `frontend/src/lib/auth.ts` and auth hooks.
3. Root and index routes check authenticated state and role.
4. Owners are routed toward ERP; cashiers toward POS.
5. API requests include JWT bearer auth; backend middleware validates and attaches user context.

### POS Sale Flow

1. Cashier opens POS catalog or scan route.
2. Product variants are found via catalog browsing, favorites, barcode scanning, or keyboard wedge input.
3. Cart state lives in POS hooks/components.
4. Checkout creates an order with items and payment data.
5. Sales service records the order, snapshots price/cost, records payment, and writes inventory ledger deductions.
6. Receipt output/replay is handled on the frontend.

### Inventory Flow

1. Any stock-changing event writes an inventory ledger row with a signed `quantity_change`.
2. Reasons and reference IDs connect ledger entries back to business events.
3. Current stock is read as a derived sum per variant.
4. Offline sales must sync as deltas to avoid overwriting concurrent state.

### ERP Reporting Flow

1. Backend exposes reporting endpoints backed by SQL read models/views.
2. `monthly_sales_report` aggregates order count, revenue, and average order value by month.
3. `gross_profit_report` joins orders and order items to compute revenue, cost of goods sold, and gross profit.
4. Frontend reporting UI renders cards/charts and supports export.

### Offline Flow

1. POS keeps local data/orders in IndexedDB via Dexie.
2. Offline-created orders use client UUIDs.
3. Sync queue sends operation deltas when network is available.
4. UI components communicate offline/sync state to the cashier.

## Architectural Boundaries

- Backend domains live under `internal/{domain}` and communicate through direct Go function calls, not HTTP between internal packages.
- Handlers translate HTTP/JSON to service calls; services own business rules; sqlc queries own persistence contracts.
- Frontend route files define navigable pages; reusable behavior belongs in `frontend/src/{pos,erp,hooks,lib}`.
- Server state should use TanStack Query; avoid manual `fetch + useState` server-state duplication.
- UI should use project UI primitives/shadcn-style components; do not import Radix directly unless introducing/updating a primitive intentionally.
- Database schema changes go through paired `.up.sql` and `.down.sql` migrations.
- sqlc generated files in `db/sqlc/` are build artifacts, not edit targets.

## Development Commands

- Backend tests: `go test ./...`
- Backend build: `go build -o openpos ./cmd/server`
- Regenerate sqlc after query/schema contract changes: `sqlc generate`
- Frontend dev: `npm run dev` from `frontend/`
- Frontend tests: `npm run test` from `frontend/`
- Frontend build: `npm run build` from `frontend/`
- Docker local stack: `docker compose up -d`

## Coding Conventions

### Go

- Pass `context.Context` as the first parameter for service/database work.
- Return errors; do not panic for normal application errors.
- Wrap errors with operation context using `%w`.
- Keep package names lowercase and singular.
- Use table-driven tests where practical.

### SQL/sqlc

- Put handwritten queries in `db/queries/{domain}.sql`.
- Use sqlc annotations such as `-- name: FunctionName :one`.
- Keep generated output in `db/sqlc/` untouched by hand.
- Monetary columns should remain integer `BIGINT` unless an explicit architecture decision changes that rule.

### React/TypeScript

- Functional components only.
- Use TanStack Query for server state.
- Use TanStack Router for navigation and route guards.
- Keep API response types aligned with Go API contracts.
- Represent money as integer satang/cents internally.
- Format Thai baht using `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })` or the project formatter.

## Key Files to Read Before Changing Behavior

- Product/data model: `db/migrations/000001_init.up.sql`, `db/queries/catalog.sql`, `internal/catalog/service.go`.
- Inventory semantics: `db/queries/inventory.sql`, `internal/inventory/service.go`.
- Sales/order semantics: `db/migrations/005_create_orders.up.sql`, `db/migrations/006_create_order_items.up.sql`, `db/migrations/007_create_payments.up.sql`, `db/migrations/008_add_order_item_cost_snapshot.up.sql`, `db/migrations/011_add_order_discount.up.sql`, `db/queries/sales.sql`, `internal/sales/service.go`.
- Reporting semantics: `db/migrations/009_add_reporting_read_models.up.sql`, `db/queries/reporting.sql`, `internal/reporting/service.go`, `frontend/src/routes/erp.reports.tsx`.
- Auth/routing: `internal/auth/`, `internal/middleware/auth.go`, `frontend/src/routes/__root.tsx`, `frontend/src/routes/index.tsx`, `frontend/src/routes/login.tsx`, `frontend/src/hooks/useAuth.ts`, `frontend/src/hooks/useRbac.ts`.
- POS flow: `frontend/src/routes/pos.tsx`, `frontend/src/routes/pos.catalog.tsx`, `frontend/src/routes/pos.scan.tsx`, `frontend/src/pos/hooks/`, `frontend/src/pos/components/`.
- Offline/sync: `frontend/src/lib/db.ts`, `frontend/src/pos/hooks/useOfflineOrders.ts`, `frontend/src/pos/hooks/useSync.ts`, `frontend/src/pos/hooks/syncContract.ts`.

## Current High-Level Graph Communities

The code knowledge graph currently clusters the project around these areas:

- Frontend route/rendering code.
- Shared frontend library and hooks.
- sqlc parameter/result generated types.
- Catalog/category/product management.
- Sales/order/payment flow.
- Auth/login flow.
- Reporting service/UI.
- Inventory/stock flow.
- Middleware/user context.
- Server/database bootstrap.

## Change Safety Checklist

Before making a change, ask:

1. Does it preserve `Product -> Variant`?
2. Does it preserve ledger-derived inventory?
3. Does it preserve integer money semantics?
4. Does it preserve offline delta sync/idempotency?
5. If it changes SQL, are migrations and sqlc queries updated together?
6. If it changes sales, are inventory and reporting side effects considered?
7. If it changes auth, are route guards and backend middleware both considered?
8. If it changes UI routes, are tests and generated router artifacts considered?
