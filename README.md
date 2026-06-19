# OpenPOS

A POS + ERP system for retail stores. Mobile-first POS for salespersons, desktop ERP backoffice for shop owners.

## Core Value

A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go 1.22+, chi router, sqlc, pgx, PostgreSQL |
| **Frontend** | Vite, React 19, TanStack Query, TanStack Router, Tailwind CSS v4 |
| **Offline** | Dexie.js (IndexedDB), service worker |
| **Infrastructure** | Docker, golang-migrate |

## Prerequisites

Choose **ONE** of these setups:

### Option A: Docker (Recommended — Easiest)

**Requirements:**
- Docker Desktop or Docker Engine
- Docker Compose v2

**Install:**
- macOS: `brew install docker docker-compose`
- Or download [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Option B: Local PostgreSQL + Go

**Requirements:**
- Go 1.22+
- PostgreSQL 15+ (via Homebrew, apt, or installer)
- Node.js 20+ (for frontend development)
- sqlc 1.31.1+ (for regenerating `db/sqlc/` after SQL query changes)

**Install PostgreSQL:**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb openpos
createuser -P openpos  # Set password: openpos
```

**Install sqlc:**
```bash
# Go install, matches the generated-code version used in this repo
go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1

# If GOPATH/bin is not already on PATH
export PATH="$(go env GOPATH)/bin:$PATH"

# Verify
sqlc version
```

## Quick Start

### Option A: Docker Setup (Recommended)

```bash
# Start everything (PostgreSQL + Go app)
docker compose up -d

# Check logs
docker compose logs -f app

# Stop everything
docker compose down

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
```

The Go app automatically runs migrations on startup. No manual migration step needed!

### Option B: Local Development Setup

```bash
# 1. Set environment variables
export DATABASE_URL="postgres://openpos:openpos@localhost:5432/openpos?sslmode=disable"
export JWT_SECRET="dev-secret-change-in-production"
export PORT="8080"

# 2. Run migrations (requires golang-migrate)
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
migrate -path db/migrations -database "$DATABASE_URL" up

# 3. Generate sqlc code
sqlc generate

# 4. Start server
go run cmd/server/main.go
```

## Verify Setup

```bash
# Health check
curl http://localhost:8080/health
# Should return: {"status":"ok"}

# Test auth registration
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123","name":"Test Owner"}'
```

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
│   └── sqlc/             # Generated Go code
├── frontend/             # Vite + React SPA (coming soon)
├── docker-compose.yml    # PostgreSQL + Go app
├── Dockerfile            # Multi-stage build
├── sqlc.yaml             # sqlc configuration
└── go.mod                # Go module
```

## Development Commands

```bash
# Generate sqlc code (after editing db/queries/*.sql)
sqlc generate

# If sqlc is installed but not on PATH
"$(go env GOPATH)/bin/sqlc" generate

# Run tests
go test ./...

# Build binary
go build -o openpos ./cmd/server

# Run with hot reload (requires air)
air
```

## Architecture

- **Auth**: JWT tokens, PIN auth for cashiers, role-based access (Owner/Cashier)
- **Catalog**: Product → Variant hierarchy (never flat products!)
- **Inventory**: Transactional ledger pattern, derived current stock from SUM
- **Offline**: Delta sync (operations, not state) + IndexedDB

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `PORT` | No | `8080` | HTTP server port |

## Troubleshooting

### "unable to upgrade to tcp, received 500"

**Cause:** Docker daemon is not running.

**Fix:**
```bash
# macOS: Start Docker Desktop
open -a Docker

# Or restart Docker service
sudo launchctl start com.docker.docker

# Verify Docker is running
docker info
```

### "connection refused" to PostgreSQL

**Cause:** PostgreSQL is not running or wrong connection string.

**Fix:**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check Docker Compose logs
docker compose logs db

# Verify environment variables
echo $DATABASE_URL
```

### Migration errors

**Cause:** Database schema is out of sync.

**Fix (Docker):**
```bash
docker compose down -v  # Remove volume
docker compose up -d     # Start fresh
```

**Fix (Local):**
```bash
# Drop and recreate database
dropdb openpos
createdb openpos

# Re-run migrations
migrate -path db/migrations -database "$DATABASE_URL" up
```

### Port already in use

```bash
# Check what's using port 8080
lsof -i :8080

# Or change PORT in .env
export PORT=8081
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment strategy.

**Quick deploy to DigitalOcean:**
```bash
# Build Docker image
docker build -t openpos:latest .

# Push to registry (if using)
docker push your-registry/openpos:latest

# Deploy to VPS
scp docker-compose.yml root@your-vps:/opt/openpos/
ssh root@your-vps "cd /opt/openpos && docker compose up -d"
```
