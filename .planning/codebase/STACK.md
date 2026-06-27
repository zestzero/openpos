# Technology Stack

**Analysis Date:** 2026-06-27

## Languages

**Primary:**
- Go 1.26.2 - backend API, database access, HTTP middleware, server startup in `cmd/server/main.go`, `internal/**`, and generated SQL layer under `db/sqlc/`.

**Secondary:**
- TypeScript (ES2023) - frontend application, route handling, API clients, hooks, and tests in `frontend/src/**`.
- CSS - design tokens, Tailwind v4 theme, and layout styling in `frontend/src/app.css`.
- SQL - migrations and queries in `db/migrations/*.sql` and `db/queries/*.sql`.

## Runtime

**Environment:**
- Go runtime 1.26.2 (managed in `mise.toml`, declared in `go.mod`).
- Node.js 20 and pnpm 10 for frontend tooling in `mise.toml`.

**Package Manager:**
- pnpm 10 - frontend dependency installation and scripts in `frontend/package.json`.
- Lockfile: present at `frontend/pnpm-lock.yaml`.

## Frameworks

**Core:**
- chi v5 - HTTP router for backend endpoints in `cmd/server/bootstrap.go`, `internal/auth/handler.go`, `internal/catalog/handler.go`, `internal/inventory/handler.go`, `internal/reporting/handler.go`, and `internal/sales/handler.go`.
- pgx v5 - PostgreSQL connectivity and pool management in `internal/database/db.go`, `cmd/server/bootstrap.go`, and services under `internal/**`.
- sqlc - generated database access layer from `db/queries/*.sql` and `db/migrations/*` via `sqlc.yaml`.
- React 19 - frontend UI in `frontend/src/main.tsx` and `frontend/src/routes/**`.
- TanStack Query - frontend server-state cache in `frontend/src/main.tsx`, `frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, and `frontend/src/lib/users-api.ts`.
- TanStack Router - file-based routing in `frontend/src/main.tsx` and `frontend/src/routes/**`.
- Tailwind CSS v4 - styling pipeline in `frontend/src/app.css` and `frontend/vite.config.ts`.
- Dexie.js - IndexedDB persistence in `frontend/src/lib/db.ts`.

**Testing:**
- Go test - backend tests co-located under `cmd/server/*_test.go` and `internal/**/**/*_test.go`.
- Vitest - frontend tests configured in `frontend/package.json` and `frontend/src/**/__tests__`.
- Testing Library - component and route tests in `frontend/src/routes/__tests__` and `frontend/src/erp/__tests__`.

**Build/Dev:**
- Vite - frontend dev server and production build in `frontend/package.json` and `frontend/vite.config.ts`.
- TypeScript compiler - project references in `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, and `frontend/tsconfig.node.json`.
- ESLint - frontend linting in `frontend/eslint.config.js`.
- golang-migrate - schema migration runner in `cmd/server/bootstrap.go` and `mise.toml`.
- Docker multi-stage build - production image in `Dockerfile`.
- Docker Compose / podman compose - local PostgreSQL and app orchestration in `docker-compose.yml` and `mise.toml`.

## Key Dependencies

**Critical:**
- `github.com/go-chi/chi/v5` - routing and middleware composition.
- `github.com/jackc/pgx/v5` - PostgreSQL pool, transactions, and query execution.
- `github.com/golang-jwt/jwt/v5` - JWT parsing/claims in `internal/middleware/auth.go` and `internal/auth/service.go`.
- `golang.org/x/crypto/bcrypt` - password and PIN hashing in `internal/auth/service.go`.
- `dexie` - offline queue and cached catalog state in `frontend/src/lib/db.ts`.
- `@tanstack/react-query` - query invalidation and mutation workflows in `frontend/src/lib/*.ts`.
- `@tanstack/react-router` - route guards and navigation in `frontend/src/routes/__root.tsx`.

**Infrastructure:**
- `github.com/golang-migrate/migrate/v4` - PostgreSQL migration runner.
- `exceljs`, `jspdf`, `jspdf-autotable` - ERP export and import flows in `frontend/src/erp/reports/exportReport.ts` and `frontend/src/erp/import/ImportDrawer.tsx`.
- `qrcode` - QR generation for PromptPay and barcode/label features in `frontend/src/lib/promptpay.ts` and `frontend/src/erp/products/BarcodeBatchPrintDialog.tsx`.
- `html5-qrcode` - scanner support in POS flows under `frontend/src/pos/**`.
- `sonner` - toast notifications in `frontend/src/main.tsx`.
- `lucide-react` - icon set used across frontend UI.
- `shadcn` and `@base-ui/react` / `@radix-ui/*` - UI primitives in `frontend/src/components/ui/**`.

## Configuration

**Environment:**
- Backend configuration is env-driven via `DATABASE_URL`, `PORT`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `UPLOADS_DIR`, and `STORE_NAME` in `cmd/server/main.go`, `cmd/server/bootstrap.go`, `internal/catalog/handler.go`, and `internal/sales/handler.go`.
- Frontend API base URL comes from `VITE_API_URL` in `frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`, `frontend/src/lib/constants.ts`, and `frontend/src/hooks/useImageUpload.ts`.
- PromptPay merchant ID comes from `VITE_PROMPTPAY_MERCHANT_ID` in `frontend/src/pos/components/CheckoutPanel.tsx` and `frontend/src/pos/components/CartPanel.tsx`.
- Dev defaults are set in `mise.toml`; Docker defaults are set in `docker-compose.yml`.

**Build:**
- Backend build entry point: `cmd/server/main.go`.
- SQLC config: `sqlc.yaml`.
- Frontend build config: `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `frontend/eslint.config.js`.
- PWA assets: `frontend/public/sw.js` and `frontend/public/manifest.webmanifest`.
- Container build: `Dockerfile`.

## Platform Requirements

**Development:**
- Go 1.26.2, Node 20, pnpm 10, PostgreSQL 16+ or the `docker-compose.yml` database service.
- `sqlc` and `golang-migrate` are required for schema regeneration and migration workflows (`mise.toml`).
- Frontend expects a browser with service worker and IndexedDB support (`frontend/public/sw.js`, `frontend/src/lib/db.ts`).

**Production:**
- Docker image built from `Dockerfile`.
- PostgreSQL backend database reachable via `DATABASE_URL`.
- Static frontend assets served separately; API uses `/api/**` routes from `cmd/server/bootstrap.go`.

---

*Stack analysis: 2026-06-27*
