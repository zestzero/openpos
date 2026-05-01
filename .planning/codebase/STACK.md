# Technology Stack

**Analysis Date:** 2026-05-02

## Languages

**Primary:**
- Go 1.26.2 - backend services, HTTP handlers, database access in `cmd/server/main.go` and `internal/*`
- TypeScript 6.x - frontend app, hooks, API clients, and utilities in `frontend/src/*`

**Secondary:**
- SQL - schema, migrations, and sqlc query files in `db/migrations/*.sql` and `db/queries/*.sql`
- CSS - app styling via `frontend/src/app.css` and Tailwind v4 in the Vite build

## Runtime

**Environment:**
- Go toolchain via `go.mod` (`go 1.26.2`)
- Node.js for frontend tooling (version not pinned in-repo)
- Alpine Linux in `Dockerfile`

**Package Manager:**
- Go modules for backend dependencies (`go.mod`, `go.sum`)
- pnpm lockfile present for frontend (`frontend/pnpm-lock.yaml`)
- Lockfile: present

## Frameworks

**Core:**
- chi v5 - backend router and middleware in `cmd/server/main.go`, `internal/auth/handler.go`, `internal/middleware/*.go`
- React 19 - SPA UI in `frontend/src/main.tsx`, routes in `frontend/src/routes/*`
- TanStack Query - server-state/cache layer in `frontend/src/main.tsx`, `frontend/src/hooks/useAuth.ts`, `frontend/src/lib/erp-api.ts`
- TanStack Router - client routing in `frontend/src/main.tsx`, `frontend/src/routes/*`
- PostgreSQL 15+ - primary datastore in `db/migrations/*.sql`, `internal/database/db.go`

**Testing:**
- Vitest - frontend unit tests (`frontend/package.json`, `frontend/src/erp/__tests__/*`)
- Testing Library - React component testing in `frontend/src/test/setup.ts`
- Go `testing` + `httptest` - backend tests in `internal/*/*_test.go`

**Build/Dev:**
- Vite 8 - frontend dev/build pipeline in `frontend/package.json` and `frontend/vite.config.ts`
- Tailwind CSS v4 - styling pipeline via `@tailwindcss/vite` in `frontend/vite.config.ts`
- sqlc - SQL-to-Go codegen configured in `sqlc.yaml`
- golang-migrate - schema migrations from `cmd/server/main.go` and `README.md`
- Docker / Docker Compose - local and production container workflow in `Dockerfile` and `docker-compose.yml`

## Key Dependencies

**Critical:**
- `github.com/jackc/pgx/v5` - PostgreSQL connection pool and queries in `internal/database/db.go`, `internal/auth/service.go`, `internal/catalog/service.go`
- `github.com/golang-jwt/jwt/v5` - JWT token creation and validation in `internal/auth/service.go` and `internal/middleware/auth.go`
- `golang.org/x/crypto/bcrypt` - password and PIN hashing in `internal/auth/service.go`
- `dexie` - offline IndexedDB store for POS cache/queue in `frontend/src/lib/db.ts`
- `@tanstack/react-query` / `@tanstack/react-router` - core frontend state and navigation in `frontend/src/main.tsx`

**Infrastructure:**
- `github.com/go-chi/chi/v5` - HTTP route composition in `cmd/server/main.go`
- `github.com/golang-migrate/migrate/v4` - migration execution on startup in `cmd/server/main.go`
- `@vitejs/plugin-react` - React transform in `frontend/vite.config.ts`
- `@tailwindcss/vite` / `tailwindcss` - utility-first styling pipeline in `frontend/vite.config.ts`
- `sonner` - toast notifications mounted in `frontend/src/main.tsx`
- `html5-qrcode`, `qrcode` - barcode scanning and QR generation in `frontend/src/pos/hooks/useBarcodeDetector.ts` and `frontend/src/lib/promptpay.ts`
- `jspdf`, `jspdf-autotable`, `xlsx`, `recharts` - receipt/export/reporting features in `frontend/src/lib/*` and `frontend/src/erp/*`

## Configuration

**Environment:**
- Backend reads `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, and `PORT` in `cmd/server/main.go` and `internal/database/db.go`
- Frontend reads `VITE_API_URL` in `frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`, and `frontend/src/lib/constants.ts`
- Session state is stored locally in `frontend/src/lib/auth.ts` via `localStorage`

**Build:**
- Go module definition: `go.mod`
- SQL codegen: `sqlc.yaml`
- Frontend Vite config and path alias: `frontend/vite.config.ts`, `frontend/tsconfig.json`
- Container build/runtime: `Dockerfile`, `docker-compose.yml`

## Platform Requirements

**Development:**
- PostgreSQL database reachable by `DATABASE_URL` (`docker-compose.yml` provides a local instance)
- Node-based frontend tooling for Vite/Vitest in `frontend/package.json`
- Service worker/browser support for offline POS features in `frontend/public/sw.js`

**Production:**
- Docker-compatible host for the Go API and PostgreSQL (`Dockerfile`, `docker-compose.yml`, `DEPLOYMENT.md`)
- HTTPS-capable reverse proxy is assumed in `DEPLOYMENT.md`

---

*Stack analysis: 2026-05-02*
