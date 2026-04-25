# External Integrations

**Analysis Date:** 2026-04-25

## APIs & External Services

**None planned** - This is a self-contained POS/ERP system with no external API dependencies.

## Data Storage

**PostgreSQL:**
- Type: Relational database
- Version: 15+
- Connection: `DATABASE_URL` environment variable
- Client: `pgx/v5` (pure Go PostgreSQL driver)
- Purpose: All business data (users, products, inventory, orders, payments)
- Configuration: Connection pooling via `pgxpool`

**IndexedDB (Browser Local Storage):**
- Type: Browser local database
- Client: Dexie.js
- Purpose: Offline product catalog, pending orders sync queue
- Tables:
  - `products` - Cached product catalog
  - `variants` - Cached product variants with barcodes
  - `orders` - Offline-created orders with client-generated UUIDs
  - `syncQueue` - Pending operations waiting to sync

**File Storage:**
- Local filesystem only (no cloud storage service)
- Product images stored as file paths or base64 in database
- Future: Could add S3-compatible storage for product images

**Caching:**
- None (PostgreSQL handles all data)
- TanStack Query provides frontend request caching
- Redis not used (single-instance deployment)

## Authentication & Identity

**Custom JWT Implementation:**
- Provider: Self-hosted (no third-party)
- Implementation: `golang-jwt/jwt/v5` for token creation/validation
- Storage: User credentials (hashed passwords) in PostgreSQL
- Auth method: Email/password or PIN
- Token: Bearer token in `Authorization` header
- Roles: Owner, Manager, Cashier (stored in database)

## Monitoring & Observability

**None configured** - Greenfield project without observability stack.

**Future considerations:**
- Error tracking: Sentry or similar
- Logging: Structured logging with `slog` (Go 1.21+)
- Metrics: Prometheus endpoint for monitoring

## CI/CD & Deployment

**Hosting:**
- Self-hosted (Docker)
- Multi-stage Docker build for minimal image size

**CI Pipeline:**
- Not configured yet
- Future: GitHub Actions or similar for automated tests

**Development:**
- Docker Compose for local development
- Services: Go application, PostgreSQL

## Environment Configuration

**Required environment variables:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/openpos` |
| `JWT_SECRET` | Key for signing JWT tokens | (secure random string) |
| `PORT` | Server listen port | `8080` (default) |

**Secrets location:**
- Environment variables (not committed to version control)
- `.env` file for local development (gitignored)

## Webhooks & Callbacks

**Incoming:**
- None planned

**Outgoing:**
- None planned
- Future: Webhook notifications for low stock, daily sales summary

## Offline Architecture

The POS client operates offline-first:

1. **Product Catalog Sync:**
   - On connect: Fetch latest products/variants from API
   - Store in IndexedDB via Dexie.js
   - Display cached products when offline

2. **Order Creation (Offline):**
   - Client generates UUID for order
   - Order stored in IndexedDB with "pending" status
   - Delta operation stored: `{ variantID, quantity, operation: "decrement" }`

3. **Sync on Reconnect:**
   - Process sync queue in order
   - Send each operation to backend
   - Backend processes sequentially (transaction per operation)
   - Remove from queue on success

---

*Integration audit: 2026-04-25*