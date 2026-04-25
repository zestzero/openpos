# AGENTS.md

Coding conventions and guidelines for AI agents working on OpenPOS.

## Stack

- **Backend**: Go 1.22+ with chi v5 router, sqlc for SQL→Go codegen, pgx v5 for PostgreSQL
- **Frontend**: Vite + React 18/19, TanStack Query, TanStack Router, Tailwind CSS v4, shadcn/ui
- **Database**: PostgreSQL 15+, golang-migrate for schema migrations
- **Offline**: Dexie.js (IndexedDB), hand-written service worker
- **Deployment**: Docker multi-stage build

## Backend Conventions

### Project Layout

```
cmd/server/main.go           # Entry point
internal/{domain}/handler.go  # HTTP handlers (chi)
internal/{domain}/service.go  # Business logic
db/migrations/*.sql           # Schema migrations
db/queries/{domain}.sql       # sqlc query files
db/sqlc/                      # Generated code (do NOT edit)
```

### Go Style

- Follow standard Go conventions (`gofmt`, `go vet`)
- Use `internal/` for all application code — nothing exported outside the module
- Error handling: return errors, don't panic. Wrap with `fmt.Errorf("doing X: %w", err)`
- Context: pass `context.Context` as first parameter to all service and DB functions
- Naming: `camelCase` for unexported, `PascalCase` for exported. Package names are lowercase, singular

### sqlc Queries

- Write SQL in `db/queries/{domain}.sql`
- Use sqlc annotations: `-- name: FunctionName :one`, `:many`, `:exec`, `:execresult`
- After adding/changing queries: run `sqlc generate`
- Never edit files in `db/sqlc/` — they are generated

### Database Migrations

- Create new migrations with: `migrate create -ext sql -dir db/migrations -seq {name}`
- Always create both `.up.sql` and `.down.sql`
- Migrations are forward-only in production
- All monetary values stored as `BIGINT` (cents/satang) or `NUMERIC(12,2)`

### HTTP Handlers

- Use chi router groups and middleware
- JSON request/response with `encoding/json`
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
- Auth via JWT in `Authorization: Bearer <token>` header

### Inter-Domain Communication

- Direct function calls between domain services (same process)
- No HTTP or message queues between internal packages
- Inject dependencies via constructor: `NewSalesService(queries, inventoryService)`

## Frontend Conventions

### Project Layout

```
frontend/src/
├── api/          # API client functions
├── components/   # Shared UI components
├── pos/          # POS-specific pages and components
├── erp/          # ERP-specific pages and components
├── hooks/        # Custom React hooks
├── lib/          # Utilities (formatting, constants)
└── routes/       # TanStack Router route definitions
```

### React Style

- Functional components only
- TanStack Query for all server state (no manual fetch + useState)
- TanStack Router for routing (file-based)
- shadcn/ui for UI components (do not import from @radix-ui directly)
- Tailwind CSS v4 (`@theme` in CSS, not JS config)

### TypeScript

- Strict mode enabled
- Define API response types matching Go API contracts
- Use `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })` for all monetary display
- Store amounts as integers (satang) in frontend too

### Offline / PWA

- Dexie.js for IndexedDB (products, orders, sync queue)
- Client-generated UUIDs for offline-created orders
- Delta sync: sync operations (`decrement 1`), not state (`set to 9`)
- Service worker: cache-first for static assets, network-first for API calls

## Data Model Rules

1. **Never flat products** — always Product (parent) → Variant (child)
2. **Never quantity column** — always inventory ledger with derived snapshot
3. **Delta sync only** — offline sync sends operations, not absolute values
4. **Monetary values as integers** — store in cents/satang, format on display

## Testing

- Go: `go test ./...` with table-driven tests
- Frontend: Vitest for unit tests
- API: httptest package for handler tests in Go

## Git

- Atomic commits per logical change
- Commit messages: imperative mood, concise ("add auth middleware", "fix stock deduction race condition")
- Keep temporary files and scratch artifacts inside the repository workspace; do not write them outside the repo unless there is a concrete, unavoidable reason.
