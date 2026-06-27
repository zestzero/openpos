# Codebase Structure

**Analysis Date:** 2026-06-27

## Directory Layout

```text
openpos/
├── cmd/                     # Go entrypoints and process bootstrap
│   └── server/
├── internal/                # Backend domains and middleware
│   ├── auth/
│   ├── catalog/
│   ├── database/
│   ├── inventory/
│   ├── middleware/
│   ├── reporting/
│   └── sales/
├── db/                      # SQL migrations, handwritten queries, generated sqlc
│   ├── migrations/
│   ├── queries/
│   └── sqlc/
├── frontend/                # Vite + React SPA
│   └── src/
├── docs/                    # Product/spec/planning references
├── .planning/               # GSD planning artifacts and codebase map
├── uploads/                 # Local/public image uploads served by the API
├── .github/workflows/       # CI jobs
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # Local app + database stack
├── go.mod                   # Go module
└── mise.toml                # Tooling and task definitions
```

## Directory Purposes

**`cmd/`:**
- Purpose: process entrypoints and wiring.
- Contains: server bootstrap, runtime startup.
- Key files: `cmd/server/main.go`, `cmd/server/bootstrap.go`, `cmd/server/bootstrap_test.go`.

**`internal/`:**
- Purpose: application code organized by domain.
- Contains: auth, catalog, inventory, reporting, sales, middleware, database.
- Key files: `internal/auth/service.go`, `internal/catalog/service.go`, `internal/inventory/service.go`, `internal/sales/service.go`, `internal/reporting/service.go`, `internal/middleware/auth.go`.

**`db/`:**
- Purpose: schema history and query contracts.
- Contains: migrations, handwritten SQL, generated bindings.
- Key files: `db/migrations/*.sql`, `db/queries/*.sql`, `db/sqlc/*.go`, `sqlc.yaml`.

**`frontend/`:**
- Purpose: browser application.
- Contains: routes, feature modules, shared UI primitives, hooks, API clients, tests.
- Key files: `frontend/src/main.tsx`, `frontend/src/routes/__root.tsx`, `frontend/src/routes/pos.tsx`, `frontend/src/routes/erp.tsx`, `frontend/src/lib/api.ts`, `frontend/src/lib/auth.ts`.

**`docs/`:**
- Purpose: product/spec/reference material.
- Contains: design notes, plans, issue-tracker guidance, domain context.
- Key files: `docs/specs/*`, `docs/superpowers/*`, `docs/agents/*`, `CONTEXT.md`, `DESIGN.md`.

**`.planning/`:**
- Purpose: generated planning and mapping artifacts.
- Contains: phase docs, codebase maps, graphs, and working state.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

**`uploads/`:**
- Purpose: public image upload target served under `/uploads/*`.
- Contains: catalog images stored by `internal/catalog/handler.go`.
- Key files: filesystem only.

**`.github/workflows/`:**
- Purpose: CI automation.
- Contains: pipeline definitions.
- Key files: `.github/workflows/ci.yml`, `.github/workflows/local-issue-progress.yml`.

## Key File Locations

**Entry Points:**
- `cmd/server/main.go`: backend runtime entry.
- `frontend/src/main.tsx`: SPA entry and router bootstrap.
- `frontend/src/routes/__root.tsx`: root route guard and router outlet.
- `frontend/src/routes/index.tsx`: landing redirect.

**Configuration:**
- `go.mod`: backend dependencies and Go version.
- `frontend/package.json`: frontend scripts and dependencies.
- `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`: TypeScript path aliases and strictness.
- `frontend/vite.config.ts`: Vite aliases and plugins.
- `frontend/vitest.config.ts`: test runner configuration.
- `mise.toml`: task aliases, environment defaults, tool versions.
- `sqlc.yaml`: sqlc generation config.
- `docker-compose.yml`, `Dockerfile`: local/runtime container setup.

**Core Logic:**
- `internal/auth/*`: authentication, JWT claims, owner/cashier management.
- `internal/catalog/*`: product/category/variant domain.
- `internal/inventory/*`: ledger-based stock.
- `internal/sales/*`: order/payment/receipt flow.
- `internal/reporting/*`: reporting read models.
- `frontend/src/pos/*`: cashier workflow.
- `frontend/src/erp/*`: backoffice workflow.
- `frontend/src/lib/*`: shared API, auth, formatting, receipt, promptpay, Dexie.

**Testing:**
- `cmd/server/bootstrap_test.go`: bootstrap/router wiring tests.
- `internal/*/*_test.go`: domain service and handler tests.
- `frontend/src/**/__tests__/*`: frontend unit/integration tests.
- `frontend/src/test/setup.ts`: Vitest setup.

## Naming Conventions

**Files:**
- Go files use lowercase, domain-based names: `service.go`, `handler.go`, `auth.go`.
- Frontend route files use TanStack Router dot notation: `erp.inventory.tsx`, `erp.settings.users.tsx`, `pos.inventory.tsx`.
- Tests use `*_test.go` in Go and `*.test.ts(x)` or `__tests__` in frontend.

**Directories:**
- Backend domains are singular and lowercase: `internal/auth`, `internal/catalog`, `internal/inventory`, `internal/reporting`, `internal/sales`.
- Frontend features are domain-oriented: `frontend/src/pos`, `frontend/src/erp`, `frontend/src/lib`, `frontend/src/hooks`.
- Test-only folders use `__tests__`.

## Where to Add New Code

**New Backend Feature:**
- Primary code: `internal/<domain>/service.go` and `internal/<domain>/handler.go`.
- Router wiring: `cmd/server/bootstrap.go`.
- Tests: `internal/<domain>/*_test.go`.

**New SQL Query or Read Model:**
- Query file: `db/queries/<domain>.sql`.
- Generated output: `db/sqlc/` (regenerate, do not edit by hand).
- Schema change: paired migration files in `db/migrations/`.

**New POS UI:**
- Route: `frontend/src/routes/pos.<feature>.tsx`.
- Feature code: `frontend/src/pos/<components|hooks|layout>/`.
- Shared API helpers: `frontend/src/lib/api.ts` or a domain-specific module under `frontend/src/lib/`.

**New ERP UI:**
- Route: `frontend/src/routes/erp.<feature>.tsx`.
- Feature code: `frontend/src/erp/<feature>/`.
- Shared shell/layout: `frontend/src/erp/layout/ErpLayout.tsx`, `frontend/src/erp/navigation/ErpNav.tsx`.

**Shared Utilities:**
- Browser-wide helpers: `frontend/src/lib/`.
- Reusable React hooks: `frontend/src/hooks/`.
- Shared UI primitives: `frontend/src/components/ui/`.

## Special Directories

**`db/sqlc/`:**
- Purpose: generated query bindings and models.
- Generated: Yes.
- Committed: Yes, but not edited manually.

**`frontend/src/routeTree.gen.ts`:**
- Purpose: generated TanStack Router tree.
- Generated: Yes.
- Committed: Yes, but not edited manually.

**`frontend/dist/`:**
- Purpose: Vite build output.
- Generated: Yes.
- Committed: No.

**`uploads/`:**
- Purpose: runtime image storage for catalog uploads.
- Generated: Runtime files.
- Committed: No.

**`.planning/codebase/`:**
- Purpose: codebase map and planning docs.
- Generated: Yes.
- Committed: Yes.

**`frontend/src/components/ui/`:**
- Purpose: shared UI primitives and shadcn-style building blocks.
- Generated: mixed, but treated as source.
- Committed: Yes.

---

*Structure analysis: 2026-06-27*
