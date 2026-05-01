# External Integrations

**Analysis Date:** 2026-05-02

## APIs & External Services

**Application API (internal REST):**
- OpenPOS backend API - used by the SPA for auth, catalog, sales, reporting, and offline sync
  - SDK/Client: `fetch` wrappers in `frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`
  - Server entry: `cmd/server/main.go`
  - Auth: JWT bearer token in `Authorization: Bearer <token>` from `frontend/src/lib/auth.ts`

**Payment rail / QR workflow:**
- PromptPay QR payload generation - creates payment QR data for cashier checkout flows
  - SDK/Client: `qrcode` in `frontend/src/lib/promptpay.ts`
  - Auth: Not applicable
  - Network call: none; payload is generated locally

**Browser platform integrations:**
- Service Worker + Cache Storage - offline shell caching and network-first fetch fallback
  - Files: `frontend/public/sw.js`, `frontend/src/main.tsx`
- IndexedDB - offline catalog/order queue storage
  - Files: `frontend/src/lib/db.ts`, `frontend/src/pos/hooks/useOfflineOrders.ts`, `frontend/src/pos/hooks/useSync.ts`
- Local Storage - session, cart, favorites, checkout state
  - Files: `frontend/src/lib/auth.ts`, `frontend/src/pos/hooks/useCart.ts`, `frontend/src/pos/hooks/useFavorites.ts`, `frontend/src/pos/hooks/usePosCheckoutSession.ts`
- BarcodeDetector / camera-based scanning - POS barcode intake
  - Files: `frontend/src/pos/hooks/useBarcodeDetector.ts`, `frontend/src/pos/components/BarcodeScanner.tsx`

## Data Storage

**Databases:**
- PostgreSQL 16 in local compose, PostgreSQL-compatible in production
  - Connection: `DATABASE_URL` in `cmd/server/main.go`, `internal/database/db.go`, `docker-compose.yml`
  - Client: `pgx/v5` pool in `internal/database/db.go`; `sqlc` generated queries in `db/sqlc/*`
  - Schema/migrations: `db/migrations/*.sql`

**File Storage:**
- Local filesystem only for application assets and build artifacts
  - Frontend static assets and service worker assets: `frontend/public/*`
  - Docker image/runtime files: `Dockerfile`

**Caching:**
- Browser Cache Storage for service-worker-managed assets in `frontend/public/sw.js`
- TanStack Query client cache in `frontend/src/main.tsx`
- No Redis/Memcached detected

## Authentication & Identity

**Auth Provider:**
- Custom JWT authentication
  - Implementation: email/password owner login, cashier PIN login, and role checks in `internal/auth/service.go`, `internal/auth/handler.go`, `internal/middleware/auth.go`
  - Token storage: `localStorage` in `frontend/src/lib/auth.ts`
  - Signing secret: `JWT_SECRET` in `cmd/server/main.go`

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Standard Go logging and chi request logging in `cmd/server/main.go`
- Health endpoint at `/health` for container checks in `cmd/server/main.go` and `Dockerfile`

## CI/CD & Deployment

**Hosting:**
- Docker / Docker Compose on a self-hosted VM or container platform
  - Files: `Dockerfile`, `docker-compose.yml`, `DEPLOYMENT.md`

**CI Pipeline:**
- None detected in repository

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (`cmd/server/main.go`, `internal/database/db.go`, `docker-compose.yml`)
- `JWT_SECRET` - JWT signing secret (`cmd/server/main.go`)
- `PORT` - HTTP port (`cmd/server/main.go`, `docker-compose.yml`)
- `FRONTEND_ORIGIN` - allowed browser origin for CORS (`cmd/server/main.go`, `internal/middleware/cors.go`)
- `VITE_API_URL` - frontend API base URL (`frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`)

**Secrets location:**
- Environment variables at runtime; no secret manager integration detected

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

---

*Integration audit: 2026-05-02*
