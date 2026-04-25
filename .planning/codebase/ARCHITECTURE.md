# Architecture

**Analysis Date:** 2026-04-25

## Pattern Overview

**Overall:** Monolithic Go binary with clean package boundaries per domain

**Key Characteristics:**
- Single Go binary deployment with domain-based package separation
- In-process communication between domains via direct function calls (no HTTP, no message queues)
- REST JSON API consumed by separate Vite + React SPA frontend
- JWT-based authentication with chi router middleware
- Local-first offline architecture for POS client with delta sync

## Layers

### Domain Packages (Backend)
Located in `internal/{domain}/`

**auth:**
- Purpose: User identity, role verification, JWT issuance
- Location: `internal/auth/`
- Contains: Handler, service, middleware for authentication
- Depends on: None (foundational)
- Used by: All other domains

**catalog:**
- Purpose: Product templates, variants, categories, prices
- Location: `internal/catalog/`
- Contains: Product and variant CRUD, barcode lookup
- Depends on: None
- Used by: Sales, Inventory

**inventory:**
- Purpose: Stock levels, transactional stock movements
- Location: `internal/inventory/`
- Contains: Stock ledger operations, current stock queries
- Depends on: Catalog (for SKU validation)
- Used by: Sales

**sales:**
- Purpose: Orders, carts, payments
- Location: `internal/sales/`
- Contains: Order creation, payment processing
- Depends on: Catalog, Inventory, Auth
- Used by: Reporting, Frontend

**reporting:**
- Purpose: Analytics, dashboard aggregation (read-heavy)
- Location: `internal/reporting/`
- Contains: Sales reports, profit calculations
- Depends on: Sales, Inventory (read-only)
- Used by: Frontend (ERP dashboard)

### Middleware Layer
- Purpose: Cross-cutting concerns (auth, CORS, logging)
- Location: `internal/middleware/`
- Contains: Auth middleware, CORS configuration, request logging
- Used by: All handlers

### Database Layer
- Purpose: Data persistence via sqlc-generated Go code
- Location: `db/sqlc/` (generated), `db/queries/` (source SQL)
- Contains: Type-safe query functions, PostgreSQL interactions
- Used by: All services

### Frontend Layer
- Purpose: POS (mobile) and ERP (desktop) interfaces
- Location: `frontend/src/`
- Contains: React components, TanStack Query hooks, TanStack Router routes
- Depends on: Backend REST API
- Provides: Offline capability via Dexie.js and service workers

## Data Flow

**POS Sale Flow:**
1. User authenticates via PIN or email/password → `auth` service issues JWT
2. POS loads catalog (categories, products, variants) → stored in IndexedDB via Dexie.js
3. User scans barcode or searches product → `catalog` returns variant info
4. User completes sale → `sales` creates order with client-generated UUID
5. If online: Order sent immediately to backend → `sales` deducts inventory via `inventory` service
6. If offline: Order queued in IndexedDB sync queue → delta operation stored
7. When online: Sync queue processor sends operations to backend → server processes sequentially
8. Inventory deduction uses ledger pattern: `StockLedger` records `-1` movement, `CurrentStock` is derived

**Order Completion + Inventory Deduction:**
```
Frontend → POST /api/orders → sales.Handler
  → sales.Service.CreateOrder() (stores order, returns ID)
  → For each line item:
    → inventory.Service.DeductStock(ctx, {variantID, quantity, reason: "sale"})
      → inventory queries deduct stock, create ledger entry
  → Return order confirmation to frontend
```

**ERP Reporting Flow:**
1. User loads dashboard → authenticated request to `reporting` endpoints
2. `reporting` aggregates data from `sales` and `inventory` (read-only queries)
3. Returns JSON with sales totals, top items, profit calculations

## Key Abstractions

**Product-Variant Pattern:**
- Purpose: Handle products with multiple sellable options (size, color)
- Examples: `internal/catalog/product.go`, `internal/catalog/variant.go`
- Pattern: Product (template) → Variant (sellable SKU with barcode)

**Transactional Ledger for Inventory:**
- Purpose: Accurate stock tracking without lost updates
- Examples: `internal/inventory/ledger.go`, `internal/inventory/stock.go`
- Pattern: `StockLedger` table records all movements (+/-), `CurrentStock` is materialized view/cache

**JWT Authentication:**
- Purpose: Stateless auth with role-based access
- Examples: `internal/auth/middleware.go`, `internal/middleware/auth.go`
- Pattern: Bearer token in Authorization header, middleware validates and injects user context

**Offline Sync Queue:**
- Purpose: Enable POS operation without internet
- Examples: `frontend/src/lib/sync.ts`, Dexie.js models
- Pattern: Client-generated UUIDs, delta operations (decrement 1, not set to 9)

## Entry Points

**Backend:**
- Location: `cmd/server/main.go`
- Triggers: `go run cmd/server/main.go` or Docker container start
- Responsibilities: Initialize router, database connection, register all domain routes, start HTTP server

**Frontend:**
- Location: `frontend/src/main.tsx` (or `index.tsx`)
- Triggers: `npm run dev` (Vite dev server) or browser load in production
- Responsibilities: Mount React app, register service worker, initialize TanStack Query

**Database Migrations:**
- Location: `db/migrations/*.sql`
- Trigger: Manual run via `migrate` CLI or Docker entrypoint
- Responsibilities: Apply schema changes, create tables, indexes

## Error Handling

**Strategy:** Go error returns with wrapped context

**Patterns:**
- Return errors, don't panic: `return fmt.Errorf("creating order: %w", err)`
- HTTP handlers convert to appropriate status codes: 400 for bad input, 401 for unauthorized, 404 for not found, 500 for server errors
- Frontend uses TanStack Query error boundaries for graceful failure

## Cross-Cutting Concerns

**Logging:** Standard library `log` package or `slog` in Go; console logging in frontend dev

**Validation:** Manual validation in handlers (check required fields, types); frontend uses React Hook Form + Zod for form validation

**Authentication:** JWT via chi middleware; role checking middleware (`RequireRole("owner")`, `RequireRole("cashier")`)

## Deployment Architecture

### Production Stack (Option A - Selected)

**Infrastructure:**
- **Hosting**: DigitalOcean Droplet ($6-12/month)
- **Containerization**: Docker Compose (single host)
- **Reverse Proxy**: Caddy (automatic HTTPS via Let's Encrypt)
- **Database**: PostgreSQL 15+ (same host, Docker container)
- **Backups**: Daily pg_dump to S3-compatible storage

### Deployment Diagram

```
Internet
    │
    ▼
┌─────────────────────┐
│   Caddy (443/80)    │  ← Automatic HTTPS, reverse proxy
│   Let's Encrypt     │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │  OpenPOS    │  ← Go binary + built SPA (port 8080)
    │  Container  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │ PostgreSQL  │  ← Database (port 5432, internal)
    │  Container  │
    └─────────────┘
```

### Container Architecture

**Single Container Design:**
- Multi-stage Dockerfile builds Go binary + embeds frontend
- Alpine Linux base (~20-30MB total image size)
- Non-root user execution
- Health check endpoint at `/health`
- Serves both API and static frontend files

**Docker Compose Services:**
```yaml
services:
  app:     # Go + React SPA
  db:      # PostgreSQL with named volume
```

### Configuration

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - HTTP port (default: 8080)
- `ENV` - Environment name (production)

**Data Persistence:**
- PostgreSQL data: Named Docker volume
- Backups: Daily automated dumps to external storage
- No local file uploads in v1 (future: S3-compatible object storage)

### Security Model

**Network:**
- External: Only HTTPS (443) and SSH (22) exposed
- Internal: App container → DB container only
- Firewall (ufw) blocks all other ports

**Application:**
- TLS 1.3 via Caddy
- JWT authentication with role-based access
- Database: Dedicated user with minimal privileges

### Update Strategy

**Rolling Updates:**
1. Build new image locally or in CI
2. `docker-compose pull && docker-compose up -d`
3. Brief downtime (~5-10 seconds) acceptable for v1
4. Database migrations run automatically on startup

### Cost Estimate

| Component | Monthly Cost |
|-----------|--------------|
| DigitalOcean Droplet (1GB RAM) | $6 |
| Backups (S3/Wasabi) | ~$1 |
| **Total** | **~$7-10** |

---

*Architecture analysis: 2026-04-25*