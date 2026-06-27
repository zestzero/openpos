<!-- refreshed: 2026-06-27 -->
# Architecture

**Analysis Date:** 2026-06-27

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Browser SPA (`frontend/`)                │
├──────────────────┬──────────────────┬───────────────────────┤
│ Auth + routing   │ POS shell        │ ERP shell             │
│ `frontend/src/`  │ `frontend/src/pos`│ `frontend/src/erp`    │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│ HTTP API (`cmd/server`, `internal/*`)                        │
│ chi router + domain handlers + service layer                 │
└────────┬───────────────────────────────┬─────────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│ sqlc queries (`db/queries`)  │   │ Offline state (`Dexie`)   │
│ generated bindings (`db/sqlc`)│   │ `frontend/src/lib/db.ts`  │
└────────┬─────────────────────┘   └───────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL + migrations (`db/migrations`)                    │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Process entrypoint | Loads env, runs bootstrap, starts HTTP server, handles shutdown | `cmd/server/main.go` |
| Bootstrap/router | Runs migrations, opens DB pool, wires middleware and domain handlers | `cmd/server/bootstrap.go` |
| Auth domain | Registration, login, PIN login, cashier/user management | `internal/auth/handler.go`, `internal/auth/service.go` |
| Catalog domain | Category/product/variant CRUD, imports, image uploads, search | `internal/catalog/handler.go`, `internal/catalog/service.go` |
| Inventory domain | Ledger-based stock adjustments and derived stock reads | `internal/inventory/handler.go`, `internal/inventory/service.go` |
| Sales domain | Order creation, sync, payment completion, receipt replay | `internal/sales/handler.go`, `internal/sales/service.go` |
| Reporting domain | Monthly sales and gross profit read models | `internal/reporting/handler.go`, `internal/reporting/service.go` |
| Middleware | JWT auth, role gating, CORS, request logging/recovery | `internal/middleware/auth.go`, `internal/middleware/cors.go` |
| SPA root | Router provider, query client, service worker registration | `frontend/src/main.tsx`, `frontend/src/routes/__root.tsx` |
| POS shell | Mobile-first selling flow, scanner/cart/receipt state | `frontend/src/routes/pos.tsx`, `frontend/src/pos/*` |
| ERP shell | Desktop management flow, catalog/inventory/reports/settings | `frontend/src/routes/erp.tsx`, `frontend/src/erp/*` |
| Persistence contracts | SQL query definitions and generated Go bindings | `db/queries/*.sql`, `db/sqlc/*` |

## Pattern Overview

**Overall:** layered monolith with direct in-process domain calls.

**Key Characteristics:**
- HTTP handlers stay thin; services own business rules and persistence orchestration.
- Internal packages communicate by direct Go calls, not HTTP or queues.
- Frontend uses route shells plus feature modules for POS and ERP.
- Offline POS state lives in IndexedDB and syncs through delta requests.
- `sqlc` owns DB access; migrations own schema evolution.

## Layers

**Process/bootstrap:**
- Purpose: start the service and assemble dependencies.
- Location: `cmd/server/main.go`, `cmd/server/bootstrap.go`
- Contains: env defaults, migration startup, router composition, graceful shutdown.
- Depends on: `internal/auth`, `internal/catalog`, `internal/inventory`, `internal/reporting`, `internal/sales`, `internal/middleware`.
- Used by: deployment/runtime entry.

**HTTP API/domain layer:**
- Purpose: translate JSON/HTTP into domain calls.
- Location: `internal/auth`, `internal/catalog`, `internal/inventory`, `internal/reporting`, `internal/sales`
- Contains: handlers, request/response structs, service facades.
- Depends on: `db/sqlc`, `internal/middleware`, peer domain services for direct calls.
- Used by: `cmd/server/bootstrap.go`.

**Persistence layer:**
- Purpose: execute SQL and return typed rows.
- Location: `db/queries`, `db/sqlc`
- Contains: handwritten query files and generated query methods/types.
- Depends on: PostgreSQL via `pgx/v5`.
- Used by: all backend domain services.

**SPA shell layer:**
- Purpose: root routing, auth redirects, shared query client, global UI.
- Location: `frontend/src/main.tsx`, `frontend/src/routes/*`, `frontend/src/lib/auth.ts`, `frontend/src/hooks/*`
- Contains: TanStack Router routes, auth/session helpers, RBAC hooks.
- Depends on: browser storage, backend API, `routeTree.gen.ts`.
- Used by: POS and ERP pages.

**Feature layer:**
- Purpose: keep POS and ERP workflows isolated by domain.
- Location: `frontend/src/pos`, `frontend/src/erp`
- Contains: pages, layout shells, hooks, components, reporting helpers, offline sync code.
- Depends on: `frontend/src/lib/*`, `frontend/src/components/ui/*`, TanStack Query.
- Used by: routes under `frontend/src/routes`.

**Contract layer:**
- Purpose: keep API payload shapes aligned.
- Location: `frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`, `frontend/src/lib/users-api.ts`
- Contains: request builders, response interfaces, mutation/query helpers.
- Depends on: `fetch`, bearer token from `frontend/src/lib/auth.ts`.
- Used by: all UI features.

## Data Flow

### Authentication and Route Guarding

1. User signs in through `frontend/src/routes/login.tsx`.
2. `frontend/src/lib/api.ts` posts to `/api/auth/login`, `/api/auth/login/pin`, or `/api/auth/register`.
3. `frontend/src/hooks/useAuth.ts` stores the session in localStorage and query cache.
4. `frontend/src/routes/__root.tsx` and `frontend/src/routes/index.tsx` redirect by role.
5. Backend auth middleware in `internal/middleware/auth.go` validates JWTs for protected routes.

### POS Sale Flow

1. Cashier opens `frontend/src/routes/pos.tsx` or `frontend/src/routes/pos.catalog.tsx`.
2. POS hooks and components assemble cart, favorites, barcode scanning, and checkout state in `frontend/src/pos/*`.
3. `frontend/src/lib/api.ts` submits order and payment requests to `/api/orders/*`.
4. `internal/sales/handler.go` validates input and delegates to `internal/sales/service.go`.
5. `internal/sales/service.go` reads stock through `internal/inventory/service.go`, snapshots order economics, and writes order/payment rows.
6. Receipt data returns to the SPA for replay and printing via `frontend/src/lib/receipt.ts`.

### Inventory Flow

1. Catalog and ERP pages read current stock through `frontend/src/lib/erp-api.ts`.
2. `internal/inventory/service.go` derives stock from the ledger and rejects negative stock changes.
3. Manual adjustments and offline sync enter through `/api/inventory/adjust` and `/api/inventory/sync`.
4. Sales deductions call `internal/inventory.Service.DeductStock` directly from `internal/sales/service.go`.

### Reporting Flow

1. ERP reports page requests `frontend/src/lib/reporting-api.ts` endpoints.
2. `internal/reporting/service.go` reads `db/sqlc` reporting queries.
3. `frontend/src/lib/reporting-api.ts` merges monthly sales and gross profit rows into display-ready summaries.

### Offline Sync Flow

1. POS stores local order/adjustment state in `frontend/src/lib/db.ts`.
2. `frontend/src/pos/hooks/useSync.ts` coordinates network status and offline queues.
3. `frontend/src/pos/hooks/syncContract.ts` builds batch sync payloads.
4. Backend sync handlers accept delta operations, not absolute state replacement.

**State Management:**
- Browser session state lives in localStorage plus TanStack Query cache.
- POS operational state lives in React hooks and Dexie tables.
- Backend state is database-backed; services stay stateless except for injected pool/query handles.

## Key Abstractions

**AuthService:**
- Purpose: registration/login/PIN/auth user management.
- Examples: `internal/auth/service.go`, `internal/auth/handler.go`
- Pattern: service wraps sqlc queries and emits JWT claims.

**Domain Service:**
- Purpose: business rules for one bounded context.
- Examples: `internal/catalog/service.go`, `internal/inventory/service.go`, `internal/sales/service.go`, `internal/reporting/service.go`
- Pattern: constructor injection, direct calls, explicit input/output structs.

**Handler:**
- Purpose: HTTP adapter for one domain.
- Examples: `internal/catalog/handler.go`, `internal/sales/handler.go`
- Pattern: decode, validate, call service, encode response.

**Route shell:**
- Purpose: protect route groups and supply layout chrome.
- Examples: `frontend/src/routes/erp.tsx`, `frontend/src/routes/pos.tsx`, `frontend/src/routes/__root.tsx`
- Pattern: TanStack Router guards with RBAC and layout components.

**Shared API client:**
- Purpose: centralize fetch, auth headers, and typed responses.
- Examples: `frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`
- Pattern: token-aware JSON request helper plus small feature-specific wrappers.

## Entry Points

**Backend process:**
- Location: `cmd/server/main.go`
- Triggers: runtime start.
- Responsibilities: resolve env, bootstrap DB, run router, handle shutdown.

**Router composition:**
- Location: `cmd/server/bootstrap.go`
- Triggers: `main()`.
- Responsibilities: install middleware, mount auth/catalog/inventory/sales/reporting/users routes, serve uploads.

**Frontend bootstrap:**
- Location: `frontend/src/main.tsx`
- Triggers: browser load.
- Responsibilities: create `QueryClient`, create router, register service worker, render app.

**Route gating:**
- Location: `frontend/src/routes/__root.tsx`, `frontend/src/routes/index.tsx`, `frontend/src/routes/erp.tsx`, `frontend/src/routes/pos.tsx`
- Triggers: route navigation.
- Responsibilities: auth redirect, role gating, shell layout selection.

## Architectural Constraints

- **Threading:** Go HTTP server handles requests concurrently; transaction work stays inside service methods in `internal/*`.
- **Global state:** `cmd/server/bootstrap.go` uses package-level function variables for test seams around migration and pool setup.
- **Route generation:** `frontend/src/routeTree.gen.ts` is generated and treated as build output.
- **Generated data access:** `db/sqlc/*` is generated and not edited by hand.
- **Auth context keys:** `internal/middleware/auth.go` stores user values in request context with string keys.
- **Stock semantics:** `internal/inventory/service.go` treats stock as ledger-derived and rejects negative balances.

## Anti-Patterns

### HTTP between internal domains

**What happens:** one backend domain calls another through HTTP or a queue.
**Why it's wrong:** the repo uses direct in-process service calls, so HTTP adds latency and hides compile-time coupling.
**Do this instead:** call the other domain service directly, as `internal/sales/service.go` does with `internal/inventory.Service`.

### Mutable quantity column for stock

**What happens:** stock is stored as a single editable quantity field.
**Why it's wrong:** the inventory model is ledger-based and current stock is derived.
**Do this instead:** write ledger rows through `internal/inventory/service.go` and derive stock from `db/queries/inventory.sql`.

### Bypassing route guards

**What happens:** UI pages assume a session without checking role-based access.
**Why it's wrong:** ERP and POS routes are guarded centrally.
**Do this instead:** keep redirects in `frontend/src/routes/__root.tsx`, `frontend/src/routes/index.tsx`, `frontend/src/routes/erp.tsx`, and `frontend/src/routes/pos.tsx`.

### Editing generated artifacts

**What happens:** change `db/sqlc/*` or `frontend/src/routeTree.gen.ts` by hand.
**Why it's wrong:** those files are generated from SQL or route definitions.
**Do this instead:** edit `db/queries/*`, `frontend/src/routes/*`, or the relevant source file and regenerate.

## Error Handling

**Strategy:** fail fast at the edge, wrap in services, encode simple JSON errors in handlers.

**Patterns:**
- HTTP handlers use `http.Error` or small JSON error helpers in `internal/*/handler.go`.
- Services wrap lower-level failures with operation context using `fmt.Errorf(...: %w)`.
- Frontend request helpers throw typed errors (`ApiError`, `ErpApiError`, `ReportingApiError`) after parsing server responses.

## Cross-Cutting Concerns

**Logging:** backend startup and server lifecycle use the standard library `log` package in `cmd/server/main.go`.
**Validation:** handlers validate request shape; services validate domain rules and invariants.
**Authentication:** JWT bearer auth is enforced in `internal/middleware/auth.go`; frontend session helpers live in `frontend/src/lib/auth.ts`.
**Formatting:** money formatting stays in `frontend/src/lib/formatCurrency.ts`; POS/ERP views consume satang/integer amounts.

---

*Architecture analysis: 2026-06-27*
