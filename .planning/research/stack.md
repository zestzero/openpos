# Technology Stack

**Project:** POS/ERP System (Go + sqlc + React)
**Researched:** April 18, 2026 (updated from Encore TypeScript stack)

## Recommended Stack

### Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Go** | 1.22+ | Language | Fast compilation, single binary deployment, strong concurrency, excellent for API servers |
| **chi** | v5 | HTTP Router | Lightweight, idiomatic net/http compatible, middleware composable, widely adopted |
| **sqlc** | Latest | SQL → Go Codegen | Write SQL queries, get type-safe Go code. No runtime reflection, compile-time safety |
| **pgx** | v5 | PostgreSQL Driver | High-performance pure Go driver, connection pooling, COPY support, used by sqlc |
| **PostgreSQL** | 15+ | Primary Database | Relational model required for ERP/POS integrity, JSONB for flexibility |
| **golang-migrate** | Latest | Schema Migrations | Forward-only SQL migrations, CLI + library, Docker-friendly |
| **golang-jwt** | v5 | Authentication | JWT token creation and validation for API auth |

### Frontend (SPA & PWA)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vite** | Latest | Build Tool | Fast HMR, optimized production builds for React |
| **React** | 18/19 | UI Library | Component-based UI for complex POS/ERP interfaces |
| **TanStack Query** | Latest | Data Fetching & Caching | Manages server state, handles loading/error states |
| **TanStack Router** | Latest | Routing | Type-safe file-based routing |
| **Dexie.js** | Latest | Offline Database (IndexedDB) | Simple wrapper for IndexedDB to store products/orders offline in the POS |
| **Workbox** | Latest | PWA / Service Worker | Handles asset caching and offline routing for the POS |

### Infrastructure

| Technology | Purpose | Why |
|------------|---------|-----|
| **Docker** | Containerization | Single container for Go binary, multi-stage build for small images |
| **Docker Compose** | Local Development | Go app + PostgreSQL + any future services |
| **nginx** (optional) | Reverse Proxy | TLS termination, static file serving in production |

## Architecture & Integration Strategy

### 1. Go Backend Architecture (Monolithic with Clean Boundaries)

Structure the backend as a **monolithic Go binary** with clean package boundaries per domain. Services communicate in-process via function calls — no HTTP between services.

**Package Boundaries:**
- `internal/auth/` — User identity, JWT/session, role verification, PIN auth
- `internal/catalog/` — Product templates, Variants, Categories, Prices
- `internal/inventory/` — Stock movements (Ledger), CurrentStock snapshot
- `internal/sales/` — Orders, Carts, Payments
- `internal/reporting/` — Analytics, aggregation queries
- `internal/middleware/` — Auth middleware, CORS, logging, recovery

**Project Structure:**
```
/openpos
├── cmd/
│   └── server/
│       └── main.go              # Entry point — wires router, DB, starts server
├── internal/
│   ├── auth/
│   │   ├── handler.go           # HTTP handlers (chi)
│   │   ├── service.go           # Business logic
│   │   ├── queries.sql          # sqlc SQL queries
│   │   └── models.go            # sqlc-generated (in db/sqlc/)
│   ├── catalog/
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── queries.sql
│   ├── inventory/
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── queries.sql
│   ├── sales/
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── queries.sql
│   ├── reporting/
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── queries.sql
│   └── middleware/
│       ├── auth.go              # JWT validation middleware
│       ├── cors.go
│       └── logging.go
├── db/
│   ├── migrations/              # golang-migrate SQL files
│   │   ├── 000001_init.up.sql
│   │   └── 000001_init.down.sql
│   ├── queries/                 # sqlc SQL query files
│   │   ├── auth.sql
│   │   ├── catalog.sql
│   │   ├── inventory.sql
│   │   ├── sales.sql
│   │   └── reporting.sql
│   └── sqlc/                    # sqlc-generated Go code
│       ├── db.go
│       ├── models.go
│       └── querier.go
├── frontend/                    # Vite React SPA
│   ├── src/
│   │   ├── api/                 # API client (fetch-based)
│   │   ├── pos/                 # POS-specific UI
│   │   └── erp/                 # ERP-specific UI
│   ├── public/
│   └── vite.config.ts
├── sqlc.yaml                    # sqlc configuration
├── docker-compose.yml           # Local dev: Go + PostgreSQL
├── Dockerfile                   # Multi-stage build
├── go.mod
└── go.sum
```

### 2. sqlc Integration Pattern

**Workflow:**
1. Write SQL migrations in `db/migrations/` — this is the schema source of truth
2. Write SQL queries in `db/queries/*.sql` with sqlc annotations
3. Run `sqlc generate` to produce type-safe Go code in `db/sqlc/`
4. Import generated code in service layers

**Example query file (`db/queries/catalog.sql`):**
```sql
-- name: GetProduct :one
SELECT id, name, description, category_id, created_at, updated_at
FROM products
WHERE id = $1 AND archived_at IS NULL;

-- name: ListProductsByCategory :many
SELECT id, name, description, category_id, created_at
FROM products
WHERE category_id = $1 AND archived_at IS NULL
ORDER BY name;

-- name: CreateProduct :one
INSERT INTO products (name, description, category_id)
VALUES ($1, $2, $3)
RETURNING *;
```

**sqlc.yaml configuration:**
```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "db/queries/"
    schema: "db/migrations/"
    gen:
      go:
        package: "sqlc"
        out: "db/sqlc"
        sql_package: "pgx/v5"
        emit_json_tags: true
        emit_prepared_queries: false
        emit_interface: true
```

### 3. Database Connection Pattern

```go
// cmd/server/main.go
package main

import (
    "context"
    "log"
    "net/http"
    "os"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/jackc/pgx/v5/pgxpool"
)

func main() {
    ctx := context.Background()

    // Connection pool
    pool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatal(err)
    }
    defer pool.Close()

    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    // Mount domain routes
    r.Mount("/api/auth", authRouter(pool))
    r.Mount("/api/catalog", catalogRouter(pool))
    r.Mount("/api/inventory", inventoryRouter(pool))
    r.Mount("/api/sales", salesRouter(pool))
    r.Mount("/api/reports", reportingRouter(pool))

    log.Println("Starting server on :8080")
    http.ListenAndServe(":8080", r)
}
```

### 4. Frontend Integration

**API Client:** Hand-written fetch-based client (no code generation from Go).

The React frontend calls the Go backend via REST JSON APIs. Since Go doesn't auto-generate TypeScript clients like Encore did, we'll write a thin fetch wrapper with TypeScript types matching the API contracts.

**CORS:** chi/cors middleware allows the Vite dev server (localhost:5173) to call the Go API (localhost:8080).

**Production:** The Go binary serves the built frontend static files from `frontend/dist/` via chi's `FileServer`, or nginx reverse proxies both.

### 5. PWA & Offline Architecture

Same approach as before — the offline architecture is frontend-only:

1. **Service Worker (Workbox):** Caches index.html, JS bundles, static assets
2. **Local Database (Dexie.js):** Product catalog cached in IndexedDB, offline orders in "Outbox" table
3. **Sync Strategy:** Background sync on reconnect, delta operations (decrement 1, not set to 9), exponential backoff

## Alternatives Considered

| Category | Chosen | Alternative | Why Not |
|----------|--------|-------------|---------|
| **Router** | chi | Fiber / Echo | chi is net/http compatible, no custom context, easier middleware composition |
| **DB Access** | sqlc | GORM | sqlc is SQL-first and idiomatic Go; GORM adds runtime reflection and implicit behavior |
| **DB Access** | sqlc | raw pgx | sqlc adds type safety without runtime overhead; raw pgx requires manual scanning |
| **Migrations** | golang-migrate | goose | golang-migrate has broader adoption, supports both CLI and library usage |
| **Architecture** | Monolith | Microservices | Single binary is simpler to deploy, debug, and operate for a POS system |
| **Deployment** | Docker | Encore Cloud | Self-hosted gives full control, no vendor lock-in |

## Installation & Setup

```bash
# 1. Install Go tools
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 2. Initialize Go module
go mod init github.com/youruser/openpos

# 3. Add dependencies
go get github.com/go-chi/chi/v5
go get github.com/go-chi/cors
go get github.com/jackc/pgx/v5
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto  # for bcrypt

# 4. Create React frontend
npm create vite@latest frontend -- --template react-ts

# 5. Start local dev
docker compose up -d  # PostgreSQL
migrate -path db/migrations -database "$DATABASE_URL" up
go run cmd/server/main.go
```

## Sources

- **Go chi docs:** `go-chi.io` — Router patterns, middleware
- **sqlc docs:** `docs.sqlc.dev` — Query annotation, configuration, pgx integration
- **pgx docs:** `github.com/jackc/pgx` — Connection pooling, type mapping
- **golang-migrate docs:** `github.com/golang-migrate/migrate` — Migration CLI and library

---
*Stack researched: April 18, 2026*
