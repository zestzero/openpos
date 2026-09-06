# Start coding OpenPOS (agent workflow)

This is the boot playbook for an agent (or developer) joining the repo. Follow it in order; skip steps only when the environment is already warm.

## 0. What this repo is

OpenPOS is a retail **POS + ERP** system:

- **POS** (`frontend/src/pos/`, `/pos`): phone-first cashier flow — catalog, scan, cart, cash/PromptPay, receipt, offline queue
- **ERP** (`frontend/src/erp/`, `/erp`): owner backoffice — products, categories, inventory, reports, users
- **API** (`cmd/server`, `internal/*`): Go JSON API over PostgreSQL
- **Offline**: Dexie/IndexedDB + handwritten service worker; sync sends **deltas**, not absolute state

Core promise: a cashier can complete a paid sale without internet, then reconcile later.

## 1. Mandatory reading (≈10 minutes)

Read these before writing code. Prefer vocabulary from `CONTEXT.md` over synonyms.

| Order | File | Why |
|------:|------|-----|
| 1 | `CONTEXT.md` | Domain language + non-negotiable data rules |
| 2 | `AGENTS.md` | Stack, layout, sqlc/migration/frontend conventions |
| 3 | `PRODUCT.md` | Frontline UX principles (POS especially) |
| 4 | This file | Boot, change recipes, landmines |
| 5 | Area-specific paths in §5 | Only the slice you are changing |

Optional deeper context:

- `docs/repo-understanding.md` — flows and “where to start” by feature
- `.planning/codebase/*.md` — structured codebase map
- `DESIGN.md` — UI tokens/patterns when touching presentation

Domain/ADR consumption rules: `docs/agents/domain.md`.

## 2. Non-negotiable rules (fail the change if violated)

1. **Product → Variant** — never sell or stock a flat product; Variant is the SKU/barcode unit
2. **Ledger stock** — no mutable `quantity` column; stock = `SUM(quantity_change)` on `inventory_ledger`
3. **Delta sync** — offline sync sends operations, never “set stock to N”
4. **Integer money** — satang/cents as `BIGINT` / `number` end-to-end; format only at display
5. **Sale snapshots** — order items keep sale-time price/cost for reporting history
6. **Client UUIDs** — offline orders use stable client-generated IDs for idempotent sync

## 3. Environment bootstrap

Tool versions and tasks live in `mise.toml` (Go `1.26.2`, Node `20`, pnpm `10`). Prefer mise over ad-hoc installs.

### First-time local stack

```bash
# Install tool versions from mise.toml
mise install

# Start PostgreSQL (podman or docker compose — both work if compose is available)
mise run db
# equivalent: podman compose up -d db   OR   docker compose up -d db

# Apply migrations
mise run migrate

# Optional: regenerate sqlc after editing db/queries/*.sql
mise run sqlc

# Run API + Vite together
mise run dev
```

Separate processes:

```bash
mise run backend    # Go API on :8080
mise run frontend   # Vite on :5173 (host 0.0.0.0)
```

Default env (also set by mise):

| Variable | Typical local value |
|----------|---------------------|
| `DATABASE_URL` | `postgres://openpos:openpos@localhost:5432/openpos?sslmode=disable` |
| `JWT_SECRET` | `dev-secret-change-in-production` |
| `PORT` | `8080` |
| `FRONTEND_ORIGIN` | `http://localhost:5173` (CORS; also allows `:4173`) |
| `VITE_API_URL` | unset → frontend defaults to `http://localhost:8080` |

### Smoke checks

```bash
curl -s http://localhost:8080/health
# {"status":"ok"}

# Prefer registering a fresh owner — do not rely on the migration seed admin
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"test1234","name":"Owner"}'
```

Frontend: open `http://localhost:5173/login`.

### Full Docker (API + DB)

```bash
docker compose up -d
docker compose logs -f app
```

Migrations run on app startup in that path. Compose may omit `JWT_SECRET` (server falls back to an insecure default) — fine for local, not for shared environments.

## 4. Mental model

```text
Browser SPA (Vite + React 19 + TanStack Router/Query)
  POS shell ────────────── ERP shell
       │                      │
       └──────────┬───────────┘
                  ▼
         Go chi HTTP API (/api)
    auth | catalog | inventory | sales | reporting | users
                  │
                  ▼
         sqlc ← db/queries/*.sql
                  │
                  ▼
            PostgreSQL (db/migrations)
```

Wiring lives in `cmd/server/bootstrap.go`:

- Public: `GET /health`, `/api/auth/*`
- JWT-protected: `/api/catalog`, `/api/inventory`, `/api/orders`, `/api/reports`
- Owner-only middleware today: `/api/users`
- Static uploads: `/uploads/*`

Domains call each other **in-process** (e.g. sales → inventory). Do not add internal HTTP between packages.

Offline path (POS): Dexie queues (`frontend/src/lib/db.ts`) → `useOfflineOrders` / `useOfflineAdjustments` → sync contracts → `POST /api/orders/sync` and `POST /api/inventory/sync`.

## 5. Where to change what

| Change type | Start here |
|-------------|------------|
| Schema | `db/migrations/` (paired `.up.sql` + `.down.sql`) then `db/queries/` + `mise run sqlc` |
| API behavior | `internal/{domain}/service.go` then `handler.go`; mount only via `cmd/server/bootstrap.go` |
| POS UX / offline | `frontend/src/pos/`, `frontend/src/routes/pos*.tsx`, `frontend/src/lib/db.ts` |
| ERP UX | `frontend/src/erp/`, `frontend/src/routes/erp*.tsx`, `frontend/src/lib/erp-api.ts` |
| Auth / RBAC | `internal/auth/`, `internal/middleware/auth.go`, `frontend/src/lib/auth.ts`, `frontend/src/hooks/useRbac.ts`, route `beforeLoad` |
| Money display | `frontend/src/lib/formatCurrency.ts` — never invent a second formatter |
| UI primitives | `frontend/src/components/ui/` (shadcn); do not import `@radix-ui/*` from feature code |

Route tree is **hand-maintained** in `frontend/src/routeTree.gen.ts` (router plugin is not enabled in Vite). New route files under `frontend/src/routes/` must be wired into that tree or they will not load.

## 6. Standard change recipes

### A. Backend vertical slice (new or changed endpoint)

1. Decide domain package under `internal/{auth|catalog|inventory|sales|reporting}/`
2. If persistence changes: migration → `db/queries/{domain}.sql` → `mise run sqlc`
3. Implement service logic with `context.Context` first; wrap errors with `%w`
4. Expose handler JSON; use existing status conventions (400/401/403/404/500)
5. Mount route in the domain router; ensure bootstrap auth group is correct
6. Add/extend table-driven Go tests next to the package
7. Run `go test ./...` (or `mise run test`)

### B. Frontend feature (POS or ERP)

1. Prefer TanStack Query for server state; do not add `fetch + useState` duplicates
2. Put UI in `frontend/src/pos/` or `frontend/src/erp/`; keep `routes/*.tsx` thin
3. Align TypeScript types with Go JSON contracts
4. Store money as integers; format with project helpers
5. For POS copy, use `frontend/src/pos/lib/copy.ts` and keep Thai-default / plain language (`PRODUCT.md`)
6. Add Vitest coverage under `__tests__/` near the feature
7. Run `pnpm --dir frontend test -- --run` and `pnpm --dir frontend build` when touching types/routes

### C. Offline / sync change

1. Read `frontend/src/pos/hooks/syncContract.ts`, `useOfflineOrders.ts`, `useOfflineAdjustments.ts`, `useSync.ts`
2. Preserve client UUID idempotency and delta semantics
3. Mirror any new sync payload fields in `internal/sales` / `internal/inventory` sync handlers
4. Test both online success and queued offline paths

### D. sqlc / migration discipline

```bash
# After editing db/queries/*.sql or adding migrations that affect queries:
mise run migrate
mise run sqlc
go test ./...
```

Never hand-edit `db/sqlc/`.

## 7. Verification gate (before claiming done)

```bash
mise run test
# = go test ./... && pnpm --dir frontend test -- --run

go build -o /tmp/openpos ./cmd/server
pnpm --dir frontend build   # when TS/routes/UI contracts changed
```

Change-safety checklist (also in `CONTEXT.md`):

1. Product → Variant preserved?
2. Ledger-derived inventory preserved?
3. Integer money preserved?
4. Offline delta sync / client UUID idempotency preserved?
5. SQL changes include migration + sqlc together?
6. Sales changes consider inventory + reporting side effects?
7. Auth changes update both route guards and middleware?
8. New frontend routes registered in `routeTree.gen.ts`?

## 8. Exploration tools

Prefer the **code-review-graph** MCP (see `.mcp.json`, `AGENTS.md`, `CLAUDE.md`) before broad Grep:

- `semantic_search_nodes` / `query_graph` — find symbols and callers
- `get_impact_radius` / `get_affected_flows` — blast radius before edits
- `detect_changes` / `get_review_context` — review your diff
- `query_graph` pattern `tests_for` — locate coverage

If the graph MCP is unavailable, fall back to targeted Reads using the paths in §5 and `docs/repo-understanding.md`.

Codebase map refresh: GSD skill `gsd-map-codebase` writes `.planning/codebase/`.

## 9. Issues and agentic task intake

Issues/PRDs are **local markdown**, not GitHub Issues by default:

- PRD: `.scratch/<feature-slug>/PRD.md`
- Issues: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- Status line uses labels from `docs/agents/triage-labels.md` (`ready-for-agent`, etc.)

Details: `docs/agents/issue-tracker.md`.

Suggested AFK loop for a `ready-for-agent` issue:

1. Read PRD + issue + `CONTEXT.md` vocabulary
2. Map touch points (§5) and impact (graph or manual)
3. Implement smallest vertical slice that satisfies the issue
4. Run verification (§7)
5. Update issue `Status:` and append a short note under `## Comments`
6. Commit with imperative message; keep planning/scratch artifacts intentional

GSD skills under `.agents/skills/` (discuss → plan → execute → verify) are available for larger multi-phase work. For a single clear issue, prefer a direct implement + test loop.

## 10. Current landmines (repo evaluation)

Facts agents should not rediscover the hard way:

| Area | Reality |
|------|---------|
| README drift | Root `README.md` still mentions older Go and “frontend coming soon”; trust `AGENTS.md` / `mise.toml` / this doc for tooling |
| Migration seed admin | `000001_init` inserts `admin@openpos.local` — treat as unreliable; use `POST /api/auth/register` |
| Open registration | Owner register endpoint is public (local/dev friendly; tighten before multi-tenant prod) |
| RBAC holes | Only `/api/users` is owner-gated in middleware; other `/api/*` accept any valid JWT. UI RBAC is stricter than API |
| Public cashiers routes | `/api/auth/cashiers` lives on the public auth router — do not assume it is protected |
| Route tree | `erp.settings*.tsx` exist but may be missing from `routeTree.gen.ts`; always check the generated tree when adding ERP pages |
| Order auto-sync | `useSync()` is mounted from POS inventory paths; do not assume sales shell always drains the order queue |
| Dexie catalog tables | `categories` / `variants` tables exist in Dexie schema but are largely unused — no offline catalog cache yet |
| `internal/database` | Helper package exists; live server uses pool wiring in `bootstrap.go` instead |
| Money/API clients | Several frontend clients re-read `VITE_API_URL` independently (`api.ts`, `erp-api.ts`, `reporting-api.ts`) — keep defaults consistent |
| JWT secret defaults | mise vs Go fallback strings differ if env is unset — always set `JWT_SECRET` explicitly in shared envs |

Broader debt notes: `.planning/codebase/CONCERNS.md`.

## 11. Quick command cheat sheet

```bash
mise install
mise run db
mise run migrate
mise run sqlc
mise run backend
mise run frontend
mise run dev
mise run test

go test ./internal/sales/...
pnpm --dir frontend test -- --run
pnpm --dir frontend lint
pnpm --dir frontend build
```

## 12. Definition of ready to code

You are ready when:

- [ ] `CONTEXT.md` rules are clear
- [ ] Local DB is up and `/health` returns ok
- [ ] You know which domain folder and frontend surface you will touch
- [ ] You know how you will verify (package tests at minimum)
- [ ] You will not violate the six non-negotiable rules in §2
