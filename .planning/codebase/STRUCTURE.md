# Codebase Structure

**Analysis Date:** 2026-04-25

## Directory Layout

```
openpos/
├── .agents/                    # Agent skills and configurations
├── .config/                    # Configuration for tools (opencode, shell strategy)
├── cmd/
│   └── server/
│       └── main.go             # Application entry point
├── internal/
│   └── {domain}/               # Domain modules (handler.go, service.go)
├── db/
│   ├── migrations/             # Database schema migrations
│   │   └── *.sql               # Forward and rollback migrations
│   ├── queries/                # sqlc query definitions
│   │   └── {domain}.sql        # SQL queries per domain
│   └── sqlc/                   # Generated Go code (DO NOT EDIT)
├── frontend/
│   └── src/
│       ├── api/                # API client functions
│       ├── components/         # Shared UI components
│       ├── pos/                # POS-specific pages and components
│       ├── erp/                # ERP-specific pages and components
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Utilities (formatting, constants)
│       └── routes/            # TanStack Router route definitions
├── .gitignore
├── AGENTS.md                   # Project conventions and stack
├── docker-compose.yml         # Local development services
├── Dockerfile                 # Multi-stage build for production
├── go.mod                      # Go module definition
├── package.json               # Frontend dependencies
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite build configuration
```

## Directory Purposes

**`cmd/server/`:**
- Purpose: Application entry point
- Contains: `main.go` - starts the server, sets up router, middleware
- Key files: `cmd/server/main.go`

**`internal/{domain}/`:**
- Purpose: Domain-specific business logic and HTTP handlers
- Contains: `handler.go` (chi HTTP handlers), `service.go` (business logic)
- Pattern: Create new directory per domain (e.g., `internal/product/`, `internal/order/`)

**`db/migrations/`:**
- Purpose: Schema evolution
- Contains: `.up.sql` (apply) and `.down.sql` (rollback) migration files
- Naming: Sequential prefix (e.g., `001_create_products.up.sql`)
- Key files: All `.sql` migration files

**`db/queries/`:**
- Purpose: SQL queries for sqlc code generation
- Contains: `{domain}.sql` files with query definitions
- Pattern: One file per domain, queries annotated with sqlc comments
- Key files: `db/queries/product.sql`, `db/queries/order.sql`

**`db/sqlc/`:**
- Purpose: Generated Go code from sqlc
- Contains: Generated type definitions and query methods
- Note: **DO NOT EDIT** - regenerate with `sqlc generate`

**`frontend/src/api/`:**
- Purpose: API client functions
- Contains: HTTP client wrappers, API function calls
- Pattern: Functions returning TanStack Query compatible results
- Key files: `frontend/src/api/products.ts`, `frontend/src/api/orders.ts`

**`frontend/src/components/`:**
- Purpose: Shared UI components
- Contains: Reusable components (buttons, inputs, dialogs)
- Notes: Uses shadcn/ui, import from here not @radix-ui directly

**`frontend/src/pos/`:**
- Purpose: Point-of-sale specific pages and components
- Contains: POS UI, order creation, checkout flow

**`frontend/src/erp/`:**
- Purpose: Enterprise resource planning pages
- Contains: Admin dashboard, inventory management, reports

**`frontend/src/hooks/`:**
- Purpose: Custom React hooks
- Contains: `useLocalStorage`, `useOffline`, etc.

**`frontend/src/lib/`:**
- Purpose: Utilities and constants
- Contains: Formatting helpers, constants, configuration
- Key files: Currency formatting, date utilities

**`frontend/src/routes/`:**
- Purpose: TanStack Router route definitions
- Contains: Route tree configuration, file-based routing

## Key File Locations

**Entry Points:**
- `cmd/server/main.go`: Backend server startup
- `frontend/src/main.tsx`: Frontend React app entry

**Configuration:**
- `docker-compose.yml`: Local dev services (PostgreSQL)
- `go.mod`: Go dependencies
- `package.json`: Node dependencies
- `tsconfig.json`: TypeScript configuration
- `vite.config.ts`: Vite build configuration

**Database:**
- `db/migrations/`: Schema migrations
- `db/queries/`: SQL queries

## Naming Conventions

**Files:**
- Go: `lowercase_with_underscores.go` (e.g., `user_service.go`)
- TypeScript: `camelCase.ts` (e.g., `apiClient.ts`)
- SQL: `lowercase_with_underscores.sql` (e.g., `create_products.sql`)

**Directories:**
- Go packages: lowercase, singular (e.g., `internal/product/`)
- Frontend directories: lowercase (e.g., `frontend/src/api/`)

**Domain Modules (Go):**
- Handler: `{domain}/handler.go`
- Service: `{domain}/service.go`

## Where to Add New Code

**New Backend Domain:**
- Create `internal/{domain}/handler.go` for HTTP handlers
- Create `internal/{domain}/service.go` for business logic
- Create `db/queries/{domain}.sql` for database queries
- Run `sqlc generate` after adding queries
- Create `db/migrations/` if schema changes needed

**New Frontend Feature:**
- API client: `frontend/src/api/{feature}.ts`
- Components (shared): `frontend/src/components/{feature}/`
- Components (POS-specific): `frontend/src/pos/{feature}/`
- Components (ERP-specific): `frontend/src/erp/{feature}/`
- Routes: Update `frontend/src/routes/` tree

**New Database Schema:**
- Create migration: `migrate create -ext sql -dir db/migrations -seq {name}`
- Create queries: `db/queries/{domain}.sql`
- Generate code: `sqlc generate`

## Special Directories

**`db/sqlc/`:**
- Purpose: Generated database code
- Generated: Yes (via sqlc)
- Committed: Yes (part of codebase)

**`frontend/src/components/`:**
- Purpose: shadcn/ui components
- Generated: Yes (via shadcn/ui CLI)
- Committed: Yes (part of codebase)

**`.agents/`:**
- Purpose: Agent skill definitions
- Generated: No (project conventions)
- Committed: Yes

---

*Structure analysis: 2026-04-25*