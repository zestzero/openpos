# External Integrations

**Analysis Date:** 2026-06-27

## APIs & External Services

**Backend HTTP API (internal, consumed by frontend):**
- OpenPOS API - REST endpoints for auth, catalog, inventory, sales, reporting, and users.
  - Client: `frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`, `frontend/src/lib/users-api.ts`, `frontend/src/hooks/useImageUpload.ts`.
  - Auth: JWT Bearer token from `frontend/src/lib/auth.ts`; sent as `Authorization: Bearer ...` by `requestJSON()` helpers.
  - Base URL: `VITE_API_URL` or `http://localhost:8080` fallback in `frontend/src/lib/api.ts` and related clients.

**PromptPay QR generation:**
- PromptPay payload/QR generation - used for cashier payment display in POS flows.
  - SDK/Client: `qrcode` package through `frontend/src/lib/promptpay.ts`.
  - Auth: Not applicable.
  - Config: `VITE_PROMPTPAY_MERCHANT_ID` in `frontend/src/pos/components/CheckoutPanel.tsx` and `frontend/src/pos/components/CartPanel.tsx`.

**Fonts/CDN:**
- Google Fonts - Inter and Space Grotesk loaded from `https://fonts.googleapis.com` in `frontend/src/app.css`.
  - Auth: Not applicable.

**Browser platform services:**
- Service worker cache and IndexedDB offline support.
  - Service worker: `frontend/public/sw.js`.
  - IndexedDB wrapper: `frontend/src/lib/db.ts`.

## Data Storage

**Databases:**
- PostgreSQL 16 - primary application database.
  - Connection: `DATABASE_URL` in `cmd/server/main.go`, `internal/database/db.go`, `mise.toml`, and `docker-compose.yml`.
  - Client: `pgx/v5` pool and `sqlc` generated code in `db/sqlc/`.
  - Schema management: `db/migrations/*.sql` with `golang-migrate` in `cmd/server/bootstrap.go`.

**File Storage:**
- Local filesystem uploads only.
  - Backend upload path: `UPLOADS_DIR` in `internal/catalog/handler.go` and `cmd/server/bootstrap.go`.
  - Public serving: `/uploads/*` mounted in `cmd/server/bootstrap.go`.
  - Upload endpoint: `POST /api/catalog/images` in `internal/catalog/handler.go`.

**Caching:**
- Browser cache and IndexedDB.
  - Offline shell cache: `frontend/public/sw.js`.
  - Cached catalog/orders/adjustments: `frontend/src/lib/db.ts`.

## Authentication & Identity

**Auth Provider:**
- Custom JWT authentication, not a third-party identity provider.
  - Implementation: owner registration, email/password login, cashier PIN login, JWT issuance in `internal/auth/service.go` and request parsing in `internal/auth/handler.go`.
  - Middleware: `internal/middleware/auth.go` validates `Authorization: Bearer <token>` and enforces roles with `RequireRole()`.
  - Frontend session storage: `frontend/src/lib/auth.ts` stores token/user in `localStorage`.

## Monitoring & Observability

**Error Tracking:**
- Not detected.

**Logs:**
- Stdlib logging in `cmd/server/main.go`; chi logger and recoverer middleware in `cmd/server/bootstrap.go`.

## CI/CD & Deployment

**Hosting:**
- Docker-based deployment target from `Dockerfile` and `docker-compose.yml`.

**CI Pipeline:**
- Not detected.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (`cmd/server/main.go`, `internal/database/db.go`).
- `JWT_SECRET` - JWT signing key (`cmd/server/bootstrap.go`).
- `PORT` - backend listen port (`cmd/server/main.go`).
- `FRONTEND_ORIGIN` - allowed CORS origin (`cmd/server/bootstrap.go`).
- `UPLOADS_DIR` - upload directory override (`internal/catalog/handler.go`, `cmd/server/bootstrap.go`).
- `STORE_NAME` - receipt/store label (`internal/sales/handler.go`).
- `VITE_API_URL` - frontend API base URL (`frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`, `frontend/src/lib/constants.ts`, `frontend/src/hooks/useImageUpload.ts`).
- `VITE_PROMPTPAY_MERCHANT_ID` - PromptPay merchant ID in POS UI (`frontend/src/pos/components/CheckoutPanel.tsx`, `frontend/src/pos/components/CartPanel.tsx`).

**Secrets location:**
- Environment variables and local dev defaults in `mise.toml`; no dedicated secret manager detected.

## Webhooks & Callbacks

**Incoming:**
- Not detected.

**Outgoing:**
- Not detected.

## API Surface Reference

**Auth routes:**
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/login/pin`, `POST /api/auth/cashiers`, `GET /api/auth/cashiers` in `internal/auth/handler.go`.

**Catalog routes:**
- `/api/catalog/**` routes in `internal/catalog/handler.go`, including `POST /api/catalog/images` for uploads.

**Inventory routes:**
- `/api/inventory/**` routes served by `internal/inventory/handler.go` and consumed by `frontend/src/lib/erp-api.ts`.

**Sales routes:**
- `/api/orders/**` routes in `internal/sales/handler.go`; POS clients call them from `frontend/src/lib/api.ts`.

**Reporting routes:**
- `GET /api/reports/monthly-sales` and `GET /api/reports/gross-profit` in `internal/reporting/handler.go`.

**Users routes:**
- `GET/POST/PUT/PATCH /api/users/**` mounted in `cmd/server/bootstrap.go` and consumed by `frontend/src/lib/users-api.ts`.

---

*Integration audit: 2026-06-27*
