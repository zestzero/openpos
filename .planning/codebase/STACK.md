# Technology Stack

**Analysis Date:** 2026-04-25

## Languages

**Primary:**
- **Go** 1.22+ - Backend API server, business logic, database operations
- **TypeScript** - Frontend React application, type-safe API client

**Secondary:**
- **SQL** - Database queries via sqlc, migrations via golang-migrate

## Runtime

**Environment:**
- Go runtime (built binary)
- Node.js 18+ (for frontend development/build)

**Package Managers:**
- **Go modules** - Backend dependencies (`go.mod`, `go.sum`)
- **npm** - Frontend dependencies (`package.json`, `package-lock.json`)

## Frameworks

**Backend:**
- **chi** v5 - HTTP router, middleware composition
- **pgx** v5 - PostgreSQL driver with connection pooling

**Frontend:**
- **React** 18/19 - UI component library
- **Vite** - Build tool with hot module replacement
- **TanStack Query** - Server state management, data fetching
- **TanStack Router** - Type-safe file-based routing
- **Tailwind CSS** v4 - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI primitives

**Testing:**
- **Go testing** - `go test ./...` with table-driven tests
- **Vitest** - Frontend unit testing
- **httptest** - Go handler testing

**Database:**
- **PostgreSQL** 15+ - Primary relational database
- **sqlc** - SQL to Go code generation (type-safe queries)
- **golang-migrate** - Schema migration management

**Offline/PWA:**
- **Dexie.js** - IndexedDB wrapper for offline storage
- **Service Worker** (hand-written) - Asset caching, offline support

## Key Dependencies

**Backend (Go):**
| Package | Purpose |
|---------|---------|
| `github.com/go-chi/chi/v5` | HTTP router and middleware |
| `github.com/jackc/pgx/v5` | PostgreSQL driver and connection pool |
| `github.com/golang-jwt/jwt/v5` | JWT token creation and validation |
| `github.com/sqlc-dev/sqlc` | SQL → Go code generation (CLI) |
| `github.com/golang-migrate/migrate` | Database migrations (CLI) |
| `golang.org/x/crypto` | Password hashing (bcrypt) |

**Frontend (React):**
| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state, caching, mutations |
| `@tanstack/react-router` | File-based routing with type safety |
| `dexie` | IndexedDB wrapper for offline storage |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod integration for form validation |
| `zod` | Schema validation |
| `clsx`, `tailwind-merge` | CSS class composition |

**UI Components (shadcn/ui):**
- Button, Card, Dialog, Dropdown Menu, Table, Form components
- Installed via CLI, code lives in `frontend/src/components/ui/`

## Configuration

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Signing key for JWT tokens
- `PORT` - Server listen port (default 8080)

**Build Configuration:**
- `sqlc.yaml` - sqlc configuration (queries path, schema path, output)
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration (strict mode)
- `tailwind.config.js` - Tailwind CSS v4 theme

**Docker:**
- `Dockerfile` - Multi-stage build (Go build → minimal runtime image)
- `docker-compose.yml` - Local development (Go + PostgreSQL)

## Platform Requirements

**Development:**
- Go 1.22+
- Node.js 18+
- PostgreSQL 15+ (via Docker)
- npm or yarn

**Production:**
- Go binary (single executable)
- PostgreSQL 15+
- Docker container (multi-stage build)
- Optional: nginx for reverse proxy and TLS termination

## Project Structure

```
/openpos
├── cmd/server/main.go           # Backend entry point
├── internal/{domain}/           # Backend domain packages
│   ├── auth/
│   ├── catalog/
│   ├── inventory/
│   ├── sales/
│   ├── reporting/
│   └── middleware/
├── db/
│   ├── migrations/              # Schema migrations
│   ├── queries/                 # sqlc query files
│   └── sqlc/                    # Generated Go code
├── frontend/
│   ├── src/
│   │   ├── api/                # API client functions
│   │   ├── components/          # Shared UI components
│   │   ├── pos/                 # POS-specific components
│   │   ├── erp/                 # ERP-specific components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities
│   │   └── routes/              # TanStack Router routes
│   └── vite.config.ts
├── sqlc.yaml
├── docker-compose.yml
├── Dockerfile
├── go.mod / go.sum
└── package.json / package-lock.json
```

---

*Stack analysis: 2026-04-25*