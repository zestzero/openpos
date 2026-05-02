# Architecture

**Analysis Date:** 2026-05-02

## Pattern Overview

**Overall:** Monolithic Go API with a separate Vite + React SPA

**Key Characteristics:**
- Single backend binary in `cmd/server/main.go` wires all HTTP routes, middleware, and database access.
- Domain logic lives in `internal/{domain}/` packages with handler/service split per domain.
- Database access is SQL-first: `db/queries/*.sql` feeds generated code in `db/sqlc/`.
- Frontend state is split between TanStack Query server state and local/offline state in Dexie.js.
- POS and ERP are separate route trees in `frontend/src/routes/` and share the same backend API.

## Layers

### Bootstrap / Composition
- Purpose: Start the app, connect infrastructure, and mount routes.
- Location: `cmd/server/main.go`
- Contains: DB migration startup, `chi` router setup, middleware wiring, domain service construction.
- Depends on: `internal/database/db.go`, `internal/middleware/auth.go`, `internal/middleware/cors.go`, `internal/{auth,catalog,inventory,sales,reporting}/`.
- Used by: Docker runtime from `Dockerfile`, local `go run cmd/server/main.go`.

### HTTP Handlers
- Purpose: Translate HTTP requests into domain calls and status codes.
- Location: `internal/*/handler.go`
- Contains: JSON decode/encode, path/query validation, route registration.
- Depends on: Domain services and `github.com/go-chi/chi/v5`.
- Used by: `cmd/server/main.go` when mounting `/api`.

### Domain Services
- Purpose: Hold business rules and cross-package orchestration.
- Location: `internal/*/service.go`
- Contains: auth, catalog CRUD, inventory ledger, order completion, reporting read models.
- Depends on: `db/sqlc/`, `pgx`, and sibling services when needed.
- Used by: HTTP handlers and in-process service calls, especially `internal/sales/service.go` → `internal/inventory/service.go`.

### Middleware
- Purpose: Shared request concerns.
- Location: `internal/middleware/auth.go`, `internal/middleware/cors.go`
- Contains: Bearer-token validation, role checks, CORS headers, context helpers.
- Depends on: `internal/auth` for JWT claims.
- Used by: `cmd/server/main.go` and protected API routes.

### Persistence
- Purpose: Schema, migrations, and type-safe SQL access.
- Location: `db/migrations/`, `db/queries/`, `db/sqlc/`
- Contains: PostgreSQL schema evolution, query definitions, generated query structs.
- Depends on: PostgreSQL 16 in `docker-compose.yml`.
- Used by: All backend services through `sqlc.New(pool)`.

### Frontend Application
- Purpose: POS and ERP UX, offline cache, and API clients.
- Location: `frontend/src/`
- Contains: TanStack Router routes, React components, hooks, fetch clients, Dexie DB, PWA shell.
- Depends on: REST API at `VITE_API_URL` or `http://localhost:8080`.
- Used by: Browser runtime after `frontend/src/main.tsx` mounts the app.

## Data Flow

### Authentication Flow
1. Login form in `frontend/src/routes/login.tsx` posts to `frontend/src/lib/api.ts`.
2. `internal/auth/handler.go` decodes credentials and calls `internal/auth/service.go`.
3. JWT is signed in `internal/auth/service.go` and returned to the client.
4. `frontend/src/lib/auth.ts` persists the token, and `frontend/src/routes/__root.tsx` redirects by role.

### POS Sale Flow
1. POS UI in `frontend/src/routes/pos.tsx` and `frontend/src/pos/components/` reads catalog and cart state.
2. Order submission uses `frontend/src/lib/api.ts#createOrder`.
3. `internal/sales/handler.go` validates the request and calls `internal/sales/service.go`.
4. `internal/sales/service.go` creates the order, loads variant cost snapshots, and calls `internal/inventory/service.go#DeductStock` in-process.
5. Inventory changes are appended to `inventory_ledger` via `db/queries/inventory.sql`.

### Offline Sync Flow
1. POS cart and queued orders live in `frontend/src/lib/db.ts` via Dexie.js.
2. `frontend/src/pos/hooks/useOfflineOrders.ts` stores outbox rows with client UUIDs.
3. `frontend/src/pos/hooks/useSync.ts` posts batched orders to `POST /api/orders/sync`.
4. `internal/sales/handler.go#SyncOrders` replays each order through `internal/sales/service.go#CreateOrder`.
5. Failed rows stay in IndexedDB for retry with exponential backoff in `frontend/src/pos/hooks/useSync.ts`.

### ERP Reporting Flow
1. ERP routes in `frontend/src/routes/erp.reports.tsx` and `frontend/src/erp/reports/ReportDashboard.tsx` call `frontend/src/lib/reporting-api.ts`.
2. `internal/reporting/handler.go` exposes `/api/reports/monthly-sales` and `/api/reports/gross-profit`.
3. `internal/reporting/service.go` reads precomputed views backed by `db/migrations/009_add_reporting_read_models.up.sql`.
4. UI summaries and exports are built in `frontend/src/erp/reports/ReportDashboard.tsx` and `frontend/src/erp/reports/exportReport.ts`.

### Startup Flow
1. `cmd/server/main.go` reads `DATABASE_URL`, `JWT_SECRET`, and `PORT`.
2. `golang-migrate` applies `db/migrations/*.sql` on boot.
3. `internal/database/db.go` opens the `pgxpool` connection.
4. `chi` mounts `/health`, `/api/auth`, and `/api/*` subrouters.
5. `frontend/src/main.tsx` registers `frontend/public/sw.js` after browser load.

## Key Abstractions

### Domain service + handler pairs
- Purpose: Keep transport code thin and business rules isolated.
- Examples: `internal/auth/handler.go` + `internal/auth/service.go`, `internal/catalog/handler.go` + `internal/catalog/service.go`.
- Pattern: Handlers validate and map HTTP shapes; services enforce business rules.

### Product → Variant model
- Purpose: Support one product template with many sellable SKUs.
- Examples: `db/migrations/000001_init.up.sql`, `internal/catalog/service.go`, `db/queries/catalog.sql`.
- Pattern: `products` own metadata; `variants` own SKU, barcode, price, and cost.

### Inventory ledger
- Purpose: Track stock as movements rather than mutable quantity.
- Examples: `db/migrations/000001_init.up.sql`, `db/queries/inventory.sql`, `internal/inventory/service.go`.
- Pattern: `inventory_ledger` stores deltas; current stock is derived with `SUM(quantity_change)`.

### Read models
- Purpose: Make reporting cheap and predictable.
- Examples: `db/migrations/009_add_reporting_read_models.up.sql`, `db/queries/reporting.sql`, `internal/reporting/service.go`.
- Pattern: Views expose monthly rollups instead of recomputing on every request.

### Client-side session + offline state
- Purpose: Keep the POS usable without network access.
- Examples: `frontend/src/lib/auth.ts`, `frontend/src/lib/db.ts`, `frontend/src/pos/hooks/useSync.ts`.
- Pattern: Token/session state stays in `localStorage`; queued orders stay in IndexedDB.

## Entry Points

### Backend HTTP server
- Location: `cmd/server/main.go`
- Triggers: `go run cmd/server/main.go`, `docker compose up`, or `Dockerfile` runtime.
- Responsibilities: apply migrations, build services, mount routes, start/shutdown HTTP server.

### Frontend app bootstrap
- Location: `frontend/src/main.tsx`
- Triggers: Vite dev server or built SPA load.
- Responsibilities: create `QueryClient`, create TanStack router, register the service worker, render `<RouterProvider />`.

### Router tree generation
- Location: `frontend/src/routeTree.gen.ts`
- Triggers: TanStack Router codegen.
- Responsibilities: bind `frontend/src/routes/*` into the route tree used by `frontend/src/main.tsx`.

### Service worker shell
- Location: `frontend/public/sw.js`
- Triggers: Browser registration in `frontend/src/main.tsx`.
- Responsibilities: cache the app shell and provide offline navigation fallback.

## Error Handling

**Strategy:** Return errors from services; translate them at the handler boundary.

**Patterns:**
- `internal/catalog/handler.go` maps conflict/not-found cases to `409` and `404`.
- `internal/inventory/handler.go` maps stock and validation failures to `400`/`404`.
- `frontend/src/lib/api.ts` and `frontend/src/lib/reporting-api.ts` normalize API failures into typed errors.
- Domain services wrap lower-level failures with context using `fmt.Errorf("...: %w", err)`.

## Cross-Cutting Concerns

**Logging:** `log` in `cmd/server/main.go`; no central structured logger is present.

**Validation:** Handlers validate required fields before service calls; service layers re-check IDs and invariants.

**Authentication:** JWT Bearer tokens are validated in `internal/middleware/auth.go`; role checks use `RequireRole`.

**CORS:** `internal/middleware/cors.go` allows the Vite dev origin and preflight requests.

**Currency and stock units:** Backend and frontend store money as integer satang; inventory quantities stay numeric and ledger-based.

---

*Architecture analysis: 2026-05-02*
