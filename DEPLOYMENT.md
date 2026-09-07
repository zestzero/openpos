# OpenPOS Deployment Strategy

**Version:** 1.1  
**Last Updated:** 2026-09-06  
**Status:** Draft - see [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for the current go-live gap list

Use `docker-compose.prod.yml` plus `.env.example` for the concrete env contract. This document remains the longer hosting discussion.

---

## 1. Deployment Philosophy

### Self-Hosted First
- **No vendor lock-in**: Deploy anywhere Docker runs
- **Single binary simplicity**: Go compiles to one executable
- **Minimal dependencies**: Just PostgreSQL + the Go binary
- **Cost control**: No per-seat or usage-based SaaS fees

### Target Environments
| Environment | Infrastructure | Purpose |
|-------------|----------------|---------|
| Local Dev | Docker Compose | Development & testing |
| Staging | VPS/Cloud VM | Pre-production validation |
| Production | VPS/Cloud VM/K8s | Live retail operations |

---

## 2. Architecture

```
┌─────────────────────────────────────────┐
│           Reverse Proxy                 │
│    (nginx / Caddy / Traefik)            │
│  - TLS termination                      │
│  - Static file serving                  │
│  - Rate limiting                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         OpenPOS Container               │
│  ┌─────────────────────────────────┐    │
│  │  Go Binary (chi router)         │    │
│  │  - REST API                     │    │
│  │  - Serves built SPA static files│    │
│  │  - Embedded migrations          │    │
│  └─────────────────────────────────┘    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      PostgreSQL Container               │
│  - Product catalog                      │
│  - Inventory ledger                     │
│  - Orders & transactions                │
└─────────────────────────────────────────┘
```

---

## 3. Container Strategy

### Multi-Stage Dockerfile (Planned)

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server cmd/server/main.go

# Frontend build stage
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Runtime stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy Go binary
COPY --from=builder /app/server .

# Copy built frontend
COPY --from=frontend-builder /frontend/dist ./static

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run
CMD ["./server"]
```

### Image Characteristics
- **Size**: ~20-30MB (Alpine + static binary + frontend assets)
- **Base**: Alpine Linux (minimal attack surface)
- **Non-root**: Run as non-root user (security best practice)
- **Single process**: Go binary manages everything

---

## 4. Configuration Strategy

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes in production | local default in development | PostgreSQL connection string |
| `JWT_SECRET` | Yes in production | development default (rejected in production) | Secret for JWT signing; min 32 chars in production |
| `PORT` | No | 8080 | HTTP server port (process binds `0.0.0.0:$PORT`) |
| `APP_ENV` | No | development | `development`, `production`, or `test` |
| `FRONTEND_ORIGIN` | Yes in production | `http://localhost:5173` | CORS allow-list; comma-separate via `FRONTEND_ORIGINS` |
| `ALLOW_PUBLIC_REGISTRATION` | No | true in development, false in production | Owner self-registration |
| `UPLOADS_DIR` | No | uploads | Local image upload directory (ephemeral on most hosts) |
| `STORE_NAME` | No | OpenPOS | Receipt store name |

### Database Connection String Format
```
postgres://user:password@host:port/database?sslmode=require
```

---

## 5. Data Persistence

### PostgreSQL Data
- **Docker Volume**: Named volume for database files
- **Backups**: Daily automated dumps to S3-compatible storage
- **Retention**: 7 days local, 30 days remote

### Static Assets
- **Frontend**: Embedded in container (rebuild on update)
- **Receipt templates**: Embedded or mounted volume
- **Uploads** (future): S3-compatible object storage

---

## 6. Deployment Options

### Option A: Docker Compose (Simplest)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: openpos:latest
    ports:
      - "80:8080"
    environment:
      - DATABASE_URL=postgres://openpos:${DB_PASSWORD}@db:5432/openpos
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=openpos
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=openpos
    restart: unless-stopped

volumes:
  postgres_data:
```

**Pros**: Simple, single host, easy to understand  
**Cons**: Single point of failure, manual scaling

### Option B: VPS + systemd (Traditional)

1. Build binary locally or in CI
2. SCP binary + static files to VPS
3. Run as systemd service
4. PostgreSQL on same host or managed DB

**Pros**: No container overhead, direct process management  
**Cons**: Manual dependency management, harder to replicate

### Option C: Kubernetes (Future Scale)

- Deployment for Go app
- StatefulSet for PostgreSQL (or managed DB)
- Ingress for routing
- Secrets for credentials

**Pros**: Auto-scaling, self-healing, cloud-native  
**Cons**: Complexity, overkill for single-store deployments

---

## 7. Open Questions / Decisions Needed

### 7.1 Hosting Provider
- [x] **DigitalOcean Droplet** - Simple, predictable pricing ($6-12/month) **[SELECTED]**
- [ ] **Hetzner Cloud** - Cost-effective EU hosting (~€5/month)
- [ ] **AWS/GCP/Azure** - Managed services, higher complexity
- [ ] **On-premise** - Raspberry Pi or mini PC at store

### 7.2 Reverse Proxy / TLS
- [x] **Caddy** - Automatic HTTPS, simple config **[SELECTED]**
- [ ] **nginx** - Battle-tested, more manual setup
- [ ] **Traefik** - Cloud-native, Docker-aware

### 7.3 Database Hosting
- [x] **Same host** (Docker Compose) - Simplest, single backup **[SELECTED]**
- [ ] **Managed PostgreSQL** - DigitalOcean Managed DB, AWS RDS (higher cost)
- [ ] **Separate VPS** - Isolation, independent scaling

### 7.4 SSL Certificates
- [x] **Let's Encrypt (Caddy)** - Free, auto-renewing **[SELECTED]**
- [ ] **CloudFlare** - CDN + SSL termination
- [ ] **Self-signed** - Local network only

### 7.5 Backup Strategy
- [x] **pg_dump daily** - Simple SQL dumps **[SELECTED]**
- [ ] **WAL archiving** - Point-in-time recovery
- [ ] **Volume snapshots** - Filesystem-level (if supported)

### 7.6 Update Strategy
- [ ] **Blue-green** - Zero downtime, needs 2x resources
- [x] **Rolling** - Brief downtime acceptable **[SELECTED]**
- [ ] **Maintenance window** - Scheduled updates

---

## 8. Security Considerations

### Network
- Firewall: Only 443 (HTTPS) and 22 (SSH) open
- Internal: App container can reach DB, external cannot
- Fail2ban: Protect SSH and HTTP endpoints

### Application
- JWT secrets: 256-bit random, rotated periodically
- Database: Dedicated user, minimal privileges
- Static files: Served by Go (no directory traversal)

### Data
- Encryption at rest: PostgreSQL with encryption
- Encryption in transit: TLS 1.3 minimum
- Backups: Encrypted before upload

---

## 9. Monitoring & Logging (Future)

### Health Checks
- HTTP `/health` — process liveness (`{"status":"ok"}`)
- HTTP `/ready` — PostgreSQL ping; container HEALTHCHECK uses this
- Uptime monitoring (Pingdom/UptimeRobot)

### Logging
- Structured JSON logs from Go
- Centralized logging (future: Loki/ELK)
- Log rotation to prevent disk fill

### Metrics (Future)
- Prometheus endpoint
- Request latency, error rates
- Database connection pool stats

---

## 10. Cost Estimates (Monthly)

| Setup | Hosting | Database | Backup | Total |
|-------|---------|----------|--------|-------|
| **Minimal** (1 store) | $6 (DO Droplet) | Included | $0 | **$6** |
| **Standard** (1-3 stores) | $12 (DO Droplet) | Included | $5 | **$17** |
| **HA Setup** | $24 (2x Droplets) | $15 (Managed) | $10 | **$49** |

*Thailand hosting (e.g., TrueIDC) may have different pricing*

---

## 11. Action Items

Before Phase 1 execution, we need to decide:

1. **Primary deployment target** (Docker Compose vs VPS vs K8s)
2. **Hosting provider** preference
3. **Domain name** strategy (if any for v1)
4. **TLS certificate** approach
5. **Backup storage** location (S3-compatible bucket)

---

## 12. Migration Path

### Phase 1-2 (Development)
- Docker Compose locally
- SQLite could be option for ultra-simple deploy

### Phase 3-4 (Production Ready)
- Docker Compose on VPS
- Automated backups configured
- Health monitoring

### Future (Scale)
- Kubernetes if multi-store
- Managed PostgreSQL
- CDN for static assets

---

*This document should be updated as decisions are made and implementation progresses.*
