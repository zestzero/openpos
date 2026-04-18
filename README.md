# OpenPOS

A POS + ERP system for retail stores. Mobile-first POS for salespersons, desktop ERP backoffice for shop owners.

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go, chi router, sqlc, pgx, PostgreSQL |
| **Frontend** | Vite, React, TanStack Query, TanStack Router |
| **Offline** | Dexie.js (IndexedDB), Workbox (service worker) |
| **Infrastructure** | Docker, golang-migrate |

## Project Structure

```
openpos/
├── cmd/server/           # Go entry point
├── internal/
│   ├── auth/             # Authentication & authorization
│   ├── catalog/          # Products, variants, categories
│   ├── inventory/        # Stock ledger & current stock
│   ├── sales/            # Orders, payments
│   ├── reporting/        # Analytics & reports
│   └── middleware/       # Auth, CORS, logging
├── db/
│   ├── migrations/       # SQL migration files (golang-migrate)
│   ├── queries/          # SQL query files (sqlc)
│   └── sqlc/             # Generated Go code (sqlc)
├── frontend/             # Vite + React SPA
├── .planning/            # Project planning docs
├── sqlc.yaml
├── docker-compose.yml
├── Dockerfile
└── go.mod
```

## Development

### Prerequisites

- Go 1.22+
- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose

### Setup

```bash
# Start PostgreSQL
docker compose up -d

# Run migrations
migrate -path db/migrations -database "$DATABASE_URL" up

# Generate sqlc code
sqlc generate

# Run backend
go run cmd/server/main.go

# Run frontend (separate terminal)
cd frontend && npm install && npm run dev
```

### Tools

```bash
# Install Go tools
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

## Architecture

Monolithic Go binary with clean package boundaries per domain. Frontend is a separate Vite + React SPA that communicates with the backend via REST JSON APIs.

- **Auth**: JWT tokens, PIN auth for cashiers, role-based access (Owner/Cashier)
- **Catalog**: Product → Variant hierarchy, categories, barcode lookup
- **Inventory**: Transactional ledger pattern, derived current stock snapshot
- **Sales**: Order creation, payment processing, offline sync endpoints
- **Reporting**: SQL aggregation queries, export to PDF/Excel

The POS interface works offline via service workers + IndexedDB, syncing delta operations when connectivity returns.

## Planning

See `.planning/` for project roadmap, requirements, and research docs.
