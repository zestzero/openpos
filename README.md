# OpenPOS

A POS + ERP system for retail stores. Two distinct interfaces:

- **Mobile-first POS** — for salespersons to ring up orders cashier-style
- **Desktop ERP backoffice** — for shop owners to manage products, inventory, and sales reports

**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│   Vite + React SPA (PWA)                                    │
│   ├── /pos/*  — Mobile POS interface                        │
│   └── /erp/*  — Desktop ERP interface (future)              │
│                                                              │
│   Offline: Dexie.js (IndexedDB) + Service Worker + Sync Queue│
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP API
┌──────────────────────────▼──────────────────────────────────┐
│                    Encore Backend                            │
│   ├── auth/        — JWT authentication                      │
│   ├── catalog/     — Products, categories, variants          │
│   ├── inventory/   — Stock levels, ledger entries            │
│   └── sales/       — Orders, order items (Phase 2)          │
│                                                              │
│   PostgreSQL (auto-provisioned by Encore)                    │
└─────────────────────────────────────────────────────────────┘
```

### Backend Services

| Service | Purpose |
|---------|---------|
| `auth/` | JWT authentication, user management |
| `catalog/` | Products, categories, variants (SKU/barcode/price) |
| `inventory/` | Stock levels, ledger entries, delta tracking |
| `sales/` | Orders, order items, offline sync support |

---

## Prerequisites

- **Node.js** 18+ (for Encore CLI and frontend)
- **npm** 9+ or **pnpm** 8+
- **Encore** CLI (`npm install -g encore`)
- **PostgreSQL** 15+ (auto-provisioned in Encore Cloud; local dev uses Encore's built-in database)

---

## Setup

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Encore App ID

Edit `encore.app`:

```json
{
  "id": "your-app-id"
}
```

Get your app ID at [encore.dev](https://encore.dev) (free account).

### 3. Set Up Environment Variables (optional)

```bash
# Root .env (backend secrets)
cp .env.example .env

# Frontend .env
cp frontend/.env.example frontend/.env
```

### 4. Run Migrations

```bash
# Run all service migrations
encore migrate
```

---

## Running Locally

### Backend Only

```bash
encore dev
```

- Backend runs at `http://localhost:4000`
- Encore automatically provisions local PostgreSQL database
- Auto-reloads on file changes

### Frontend Only (requires running backend)

```bash
cd frontend
npm run dev
```

- Frontend dev server at `http://localhost:5173`
- Vite HMR enabled

### Both Concurrently

```bash
# Terminal 1 — backend
encore dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
openpos/
├── auth/                    # Auth service
│   ├── api.ts               # Auth endpoints
│   ├── datasource.ts        # TypeORM DataSource
│   ├── entities.ts          # User entity
│   └── migrations/          # SQL migrations
├── catalog/                 # Product catalog service
│   ├── api.ts               # Product/category endpoints
│   ├── datasource.ts
│   ├── entities.ts          # Category, Product, Variant
│   └── migrations/
├── inventory/               # Inventory management service
│   ├── api.ts               # Stock/ledger endpoints
│   ├── datasource.ts
│   ├── entities.ts          # InventoryLedger, InventorySnapshot
│   └── migrations/
├── sales/                  # Sales & order service (Phase 2)
│   ├── api.ts              # Order endpoints
│   ├── datasource.ts
│   ├── entities.ts         # Order, OrderItem
│   └── migrations/
├── frontend/               # Vite + React SPA
│   ├── src/
│   │   ├── lib/            # API client, auth, DB, sync queue
│   │   ├── hooks/         # React hooks (useCatalog, etc.)
│   │   ├── stores/        # Zustand stores (cart, favorites)
│   │   ├── components/     # UI components
│   │   └── routes/        # TanStack Router routes
│   ├── public/
│   │   └── sw.js          # Service worker (PWA)
│   └── package.json
├── encore.app              # Encore app config
├── package.json            # Root backend dependencies
└── tsconfig.json           # TypeScript config (root)
```

---

## Key Technologies

### Backend

| Technology | Purpose |
|------------|---------|
| **Encore.ts** | Backend framework, HTTP routing, service communication, auto-provisioned DB/PubSub |
| **TypeORM** | ORM with SQL migration files ( Encore-managed) |
| **PostgreSQL** | Primary database |
| **JWT** | Stateless authentication |

### Frontend

| Technology | Purpose |
|------------|---------|
| **Vite** | Build tool, fast HMR |
| **React 19** | UI library |
| **TanStack Router** | Type-safe routing with code generation |
| **TanStack Query** | Server state, caching, offline refetch |
| **Zustand** | Client state (cart, favorites) |
| **shadcn/ui** | Accessible component library (Radix UI + Tailwind) |
| **Dexie.js** | IndexedDB wrapper for offline storage |
| **Tailwind CSS v4** | Utility-first styling |

---

## Offline Capability

The POS works without internet:

1. **Service Worker** (`frontend/public/sw.js`) — caches app shell and static assets
2. **IndexedDB** (Dexie.js) — stores products, categories, variants locally
3. **Sync Queue** — queues orders created offline, syncs when back online

When online again:
- Sync queue processes with exponential backoff (1s → 2s → 4s → 8s → 16s, max 5 attempts)
- Orders use client-generated UUIDs for idempotency

---

## API Endpoints

### Auth Service (`auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email + password, returns JWT |
| POST | `/auth/register` | Register new user |
| GET | `/auth/me` | Get current user |

### Catalog Service (`catalog/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/catalog/categories` | List all categories |
| GET | `/catalog/products` | List products (optional `?categoryId=`) |
| GET | `/catalog/products/:id` | Get product with variants |
| GET | `/catalog/variants/:id` | Get single variant |

### Inventory Service (`inventory/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory/stock/:variantId` | Get current stock level |
| GET | `/inventory/ledger/:variantId` | Get ledger history |
| POST | `/inventory/ledger` | Create ledger entry (internal) |

### Sales Service (`sales/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sales/orders` | Create order (idempotent, client-generated UUID) |
| GET | `/sales/orders` | List orders |

---

## Development Workflow

This project uses the **GSD (Get Shit Done)** workflow for phased development.

See `.planning/ROADMAP.md` for current milestone and phase status.

### Key Commands

```bash
# Run tests
npm test

# Build frontend
cd frontend && npm run build

# Type check backend
npx tsc --noEmit

# Run backend type check
encore doctor

# View Encore API docs
encore api docs
```

---

## Deployment

### Encore Cloud (recommended)

```bash
encore cloud deploy
```

Encore provisions PostgreSQL, sets up CI/CD, and deploys to your AWS/GCP account.

### Docker (self-host)

```bash
encore docker build
docker run -p 8000:8000 openpos
```

---

## Troubleshooting

### Frontend build fails with TypeScript errors
Run `npm install` in the frontend directory first — dependencies may not be fully installed.

### `import.meta.env` TypeScript errors
Ensure `frontend/src/vite-env.d.ts` exists with Vite type augmentation.

### Backend service won't start
Run `encore doctor` to verify your Encore CLI and project configuration.

### Offline mode not working
Clear browser cache and service worker, then reload. Ensure `sw.js` is registered in `main.tsx`.

---

## License

Private — All rights reserved
