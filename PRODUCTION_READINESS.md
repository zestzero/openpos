# OpenPOS production readiness

**Audit date:** 2026-09-06  
**Scope:** current `main` (verified; related PRs #38 merged, #39/#40 still open drafts)  
**This PR:** first low-regret P0 fixes only. It does not make the product production-ready by itself.

## Current state

OpenPOS is a single-tenant POS + ERP: Go/chi API over PostgreSQL, Vite SPA, Dexie offline queue. Local development works. A production go-live is still blocked by missing operational decisions and several remaining security/ops gaps.

What is already in place:

- JWT login for owners (password) and cashiers (PIN); bcrypt hashing
- `/api/users` owner-gated in middleware
- CORS allow-list (not `*`)
- Graceful shutdown, request timeouts
- Docker multi-stage image + compose healthchecks
- Frontend Vitest in CI; golang-migrate on API startup
- Dependabot noise exists (e.g. open `golang.org/x/crypto` bump #35)

What this PR changes (P0, implemented):

| Fix | Why |
|-----|-----|
| `internal/config` fail-fast | Production no longer silently uses local DB URL or a known JWT default |
| JWT HS256 pin | Reject `alg=none` / unexpected signing methods |
| Public `/api/auth/cashiers` closed | Unauthenticated cashier listing was a data leak; create path was effectively dead |
| `ALLOW_PUBLIC_REGISTRATION` | Production defaults to closed; login UI hides the register tab |
| Owner password min 8 chars | Empty/short owner passwords were accepted |
| `GET /ready` + HEALTHCHECK | `/health` stays a liveness probe; readiness pings PostgreSQL |
| Security headers | `nosniff`, `DENY` framing, `same-origin` referrer |
| Owner-only catalog writes + reports | API RBAC now matches the UI (cashiers can still read catalog and sell) |
| CI `go test ./...` | Backend tests were not in CI |
| Dockerfile `golang:1.26.2-alpine` + `CGO_ENABLED=0` | Image could not build against `go.mod` 1.26.2; CGO was unused |
| Bind `0.0.0.0:$PORT` | Matches typical PaaS/port-binding expectations |
| `.env` gitignore + `.env.example` + `docker-compose.prod.yml` | Secrets hygiene and an explicit prod compose contract |

Local `docker compose` now sets `APP_ENV=development` and an explicit dev JWT so the previous “compose omitted JWT_SECRET” footgun is visible.

## Prioritized gaps

### P0 — remaining after this PR (needs a human or more invasive work)

1. **Hosting, domain, TLS, secrets vault** — DigitalOcean + Caddy is sketched in `DEPLOYMENT.md` but not implemented. Choose host, domain, certificate path, and where `JWT_SECRET` / DB passwords live. Do not put secrets in git.
2. **First owner bootstrap** — public registration is off in production. An operator must either set `ALLOW_PUBLIC_REGISTRATION=true` for the first owner, then turn it off, or create the owner out of band. The migration seed `admin@openpos.local` is unreliable (placeholder hash; treat as unusable).
3. **Frontend production serving** — the Docker image is API-only. `DEPLOYMENT.md` still describes an embedded SPA that the Dockerfile does not build. Decide: reverse-proxy the Vite `dist/` separately, or add a frontend build stage later.
4. **Database backups** — no automated `pg_dump`, no restore drill, no off-host retention. Same-host Docker volume is a single point of failure.
5. **Payments / PromptPay** — POS records a method and amount. There is no payment-provider integration, reconciliation, or refund path. Confirm whether cash + manual PromptPay is acceptable for v1.

### P1 — should land before a real store go-live

- **Inventory check-then-write race** — ledger insert is not atomic with the availability check; concurrent sales can oversell.
- **httpOnly session cookie** — access token lives in `localStorage` (XSS = account take).
- **Rate limiting** on `/api/auth/login` and `/login/pin` (PIN space is small).
- **Structured JSON logs + request IDs** — chi text logger only; no log drain contract.
- **Uploads** — local disk, ephemeral on most hosts; no object storage. Content-type is extension-trusted.
- **Seed admin cleanup** — do not edit `000001_init` (checksums). A later migration can deactivate `admin@openpos.local` after a human confirms nobody uses it.
- **Cashier inventory writes** — POS cashiers can still `POST /api/inventory/adjust` and `/sync`. Confirm that is intended.
- **JWT lifetime** — 24h access token, no refresh/revoke.
- **Compose prod `sslmode=disable`** — fine behind a private network; use `require` for any networked Postgres.
- **README drift** — still says Go 1.22+ / “frontend coming soon”. Trust `AGENTS.md` / `mise.toml`.
- **Related open work** — PR #40 (cloud-agent env) and PR #39 (Laravel/MySQL plan) are not merged; this audit assumes the current Go/Postgres tree.

### P2 — after first production store

- Observability (metrics, error tracking, uptime)
- WAL / PITR backups
- Multi-store / multi-tenant (today: one DB, open-until-locked registration)
- Offline catalog cache (Dexie category/variant tables are largely unused)
- Barcode scanner restart bug
- Large ERP import main-thread parse
- Blue/green or documented rollback runbook beyond “redeploy previous image”

## Recommended next steps

1. Decide hosting + domain + TLS (or explicitly “LAN only, no public ingress”).
2. Put `JWT_SECRET` and `POSTGRES_PASSWORD` in the host secret store; deploy with `APP_ENV=production`.
3. Create the first owner (`ALLOW_PUBLIC_REGISTRATION=true` once, or SQL), then keep registration closed.
4. Point a reverse proxy at the API and a built SPA (`VITE_API_URL` baked at frontend build time).
5. Turn on daily encrypted `pg_dump` off-host; restore once on a scratch database.
6. Then tackle P1 inventory atomicity and login rate limits.

## Human decisions (do not block this PR)

| Decision | Options | Notes |
|----------|---------|--------|
| Hosting | DO droplet (doc default), Hetzner, Render, on-prem | Render: bind is already `0.0.0.0:$PORT`; filesystem is ephemeral — do not rely on `uploads/` |
| Secrets | Host env, Doppler, cloud secret manager | No vault in-repo |
| Domain / TLS | Caddy + Let’s Encrypt vs Cloudflare vs none | Required if the SPA and API are on different public origins |
| Payments | Cash + manual PromptPay vs provider | Product-level |
| Laravel/MySQL migration (PR #39) | Stay on Go/Postgres vs rewrite | Orthogonal to this hardening; do not mix with go-live hardening |
| Backup storage | S3-compatible vs volume snapshots | Need a bucket/credentials |

## Verification

```bash
go test ./...
pnpm --dir frontend test -- --run
go build -o /tmp/openpos ./cmd/server
```

Production smoke after deploy:

```bash
curl -sS "$API/health"    # {"status":"ok"}
curl -sS "$API/ready"     # {"status":"ok"} only if Postgres is up
curl -sS "$API/api/auth/config"  # {"publicRegistration":false}
```
