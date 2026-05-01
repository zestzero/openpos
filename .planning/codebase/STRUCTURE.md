# Codebase Structure

**Analysis Date:** 2026-05-02

## Directory Layout

```text
openpos/
├── cmd/
│   └── server/                # Go application entry point
├── db/
│   ├── migrations/            # PostgreSQL schema migrations
│   ├── queries/               # sqlc source SQL per domain
│   └── sqlc/                  # Generated Go database code
├── frontend/
│   ├── public/                # PWA shell assets and service worker
│   └── src/                   # React app, routes, features, utilities
├── internal/                  # Backend domain packages
│   ├── auth/
│   ├── catalog/
│   ├── inventory/
│   ├── sales/
│   ├── reporting/
│   ├── middleware/
│   └── database/
├── .planning/codebase/        # Architecture and mapping docs
├── Dockerfile                 # Production container build
├── docker-compose.yml         # Local app + PostgreSQL runtime
├── go.mod                     # Go module definition
├── go.sum                     # Go dependency lockfile
├── sqlc.yaml                  # sqlc generator config
├── README.md                  # Setup and run instructions
└── DEPLOYMENT.md              # Deployment notes
```

## Directory Purposes

**`cmd/server/`:**
- Purpose: process startup and dependency wiring.
- Contains: `cmd/server/main.go`.
- Key files: `cmd/server/main.go`.

**`internal/auth/`:**
- Purpose: login, user creation, JWT issuance, cashier management.
- Contains: `internal/auth/handler.go`, `internal/auth/service.go`.

**`internal/catalog/`:**
- Purpose: category, product, and variant CRUD plus variant search.
- Contains: `internal/catalog/handler.go`, `internal/catalog/service.go`.

**`internal/inventory/`:**
- Purpose: stock ledger, current stock lookup, and manual adjustments.
- Contains: `internal/inventory/handler.go`, `internal/inventory/service.go`.

**`internal/sales/`:**
- Purpose: order creation, offline sync replay, and receipt generation.
- Contains: `internal/sales/handler.go`, `internal/sales/service.go`.

**`internal/reporting/`:**
- Purpose: reporting read models and API endpoints.
- Contains: `internal/reporting/handler.go`, `internal/reporting/service.go`.

**`internal/middleware/`:**
- Purpose: cross-cutting HTTP middleware.
- Contains: `internal/middleware/auth.go`, `internal/middleware/cors.go`.

**`internal/database/`:**
- Purpose: create and close the PostgreSQL connection pool.
- Contains: `internal/database/db.go`.

**`db/migrations/`:**
- Purpose: schema source of truth.
- Contains: paired `.up.sql` and `.down.sql` files such as `db/migrations/000001_init.up.sql` and `db/migrations/011_add_order_discount.up.sql`.

**`db/queries/`:**
- Purpose: SQL definitions consumed by sqlc.
- Contains: `db/queries/auth.sql`, `db/queries/catalog.sql`, `db/queries/inventory.sql`, `db/queries/sales.sql`, `db/queries/reporting.sql`.

**`db/sqlc/`:**
- Purpose: generated query types and model structs.
- Contains: `db/sqlc/db.go`, `db/sqlc/models.go`, `db/sqlc/*.sql.go`.
- Generated: yes.

**`frontend/src/routes/`:**
- Purpose: file-based TanStack Router routes.
- Contains: `frontend/src/routes/__root.tsx`, `frontend/src/routes/login.tsx`, `frontend/src/routes/pos.tsx`, `frontend/src/routes/erp.tsx`, and child routes.

**`frontend/src/lib/`:**
- Purpose: API clients, auth/session helpers, IndexedDB, formatting, and reporting utilities.
- Contains: `frontend/src/lib/api.ts`, `frontend/src/lib/auth.ts`, `frontend/src/lib/db.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`.

**`frontend/src/pos/`:**
- Purpose: cashier workspace.
- Contains: `frontend/src/pos/components/`, `frontend/src/pos/hooks/`, `frontend/src/pos/layout/PosLayout.tsx`.

**`frontend/src/erp/`:**
- Purpose: owner/admin workspace.
- Contains: `frontend/src/erp/layout/ErpLayout.tsx`, `frontend/src/erp/tables/`, `frontend/src/erp/products/`, `frontend/src/erp/reports/`, `frontend/src/erp/categories/`, `frontend/src/erp/import/`.

**`frontend/src/components/ui/`:**
- Purpose: shared design-system primitives.
- Contains: shadcn-style building blocks such as `frontend/src/components/ui/button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`.

**`frontend/public/`:**
- Purpose: PWA shell assets.
- Contains: `frontend/public/sw.js`, `frontend/public/manifest.webmanifest`, `frontend/public/favicon.svg`, `frontend/public/icons.svg`.

## Key File Locations

**Entry Points:**
- `cmd/server/main.go`: backend bootstrap.
- `frontend/src/main.tsx`: frontend bootstrap.
- `frontend/src/routeTree.gen.ts`: generated router tree.

**Configuration:**
- `go.mod`: backend dependencies and Go version.
- `sqlc.yaml`: sqlc generation settings.
- `frontend/package.json`: frontend scripts and dependencies.
- `frontend/vite.config.ts`: Vite build config and `@` alias.
- `docker-compose.yml`: local PostgreSQL and app services.
- `Dockerfile`: production container build.

**Core Logic:**
- `internal/auth/service.go`: JWT and login rules.
- `internal/catalog/service.go`: catalog CRUD and uniqueness checks.
- `internal/inventory/service.go`: stock ledger and deductions.
- `internal/sales/service.go`: order creation, payment, and sync.
- `internal/reporting/service.go`: reporting read models.
- `frontend/src/lib/api.ts`: POS API client.
- `frontend/src/lib/erp-api.ts`: ERP API client and query hooks.
- `frontend/src/lib/reporting-api.ts`: reporting API client and row transforms.

**Testing:**
- `internal/*/*_test.go`: backend unit and handler tests.
- `db/migrations/orders_migrations_test.go`: migration checks.
- `frontend/src/erp/__tests__/*.test.tsx`: ERP UI tests.
- `frontend/vitest.config.ts`: Vitest config.

## Naming Conventions

**Go files:**
- `handler.go` for HTTP transport, `service.go` for domain rules, `*_test.go` for tests.
- Package names are lowercase singular, such as `auth`, `catalog`, `sales`, `reporting`.

**Frontend files:**
- Feature folders are lowercase, such as `frontend/src/pos/` and `frontend/src/erp/`.
- Route files use TanStack Router file names like `pos.scan.tsx` and `erp.reports.tsx`.
- Shared primitives live in `frontend/src/components/ui/`.

**SQL and migrations:**
- SQL query files stay lowercase with domain names, such as `db/queries/catalog.sql`.
- Migration files use sequential prefixes, such as `db/migrations/005_create_orders.up.sql`.
- Every migration change ships with `.up.sql` and `.down.sql` pairs.

## Where to Add New Code

**New backend domain:**
- Add HTTP transport in `internal/{domain}/handler.go`.
- Add business logic in `internal/{domain}/service.go`.
- Add queries in `db/queries/{domain}.sql`.
- Add schema changes in `db/migrations/`.

**New backend middleware:**
- Add shared request behavior in `internal/middleware/{name}.go`.

**New POS feature:**
- Add components in `frontend/src/pos/components/`.
- Add state/hooks in `frontend/src/pos/hooks/`.
- Add route pages in `frontend/src/routes/pos*.tsx`.

**New ERP feature:**
- Add components in `frontend/src/erp/{feature}/`.
- Add route pages in `frontend/src/routes/erp*.tsx`.
- Add API helpers in `frontend/src/lib/erp-api.ts` or split into a new file under `frontend/src/lib/`.

**New shared UI primitive:**
- Add reusable control in `frontend/src/components/ui/`.

**New offline state:**
- Add Dexie tables in `frontend/src/lib/db.ts` and behavior in `frontend/src/pos/hooks/`.

## Special Directories

**`db/sqlc/`:**
- Purpose: generated PostgreSQL access layer.
- Generated: yes.
- Committed: yes.

**`frontend/src/routeTree.gen.ts`:**
- Purpose: generated route registration for TanStack Router.
- Generated: yes.
- Committed: yes.

**`frontend/public/sw.js`:**
- Purpose: offline shell caching and navigation fallback.
- Generated: no.
- Committed: yes.

**`frontend/src/components/ui/`:**
- Purpose: shared shadcn-style primitives.
- Generated: partially, then customized.
- Committed: yes.

---

*Structure analysis: 2026-05-02*
