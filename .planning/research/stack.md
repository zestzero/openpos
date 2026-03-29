# Technology Stack

**Project:** POS/ERP System (Encore + TypeORM + React)
**Researched:** March 22, 2026

## Recommended Stack

### Backend & Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Encore.ts** | Latest | Backend Framework & Cloud Infra | Automates infrastructure (PostgreSQL, Pub/Sub, API Gateway) via TypeScript code. Provides type-safe API clients. |
| **PostgreSQL** | 15+ | Primary Database | Auto-provisioned by Encore. Reliable, relational data model required for ERP/POS. |
| **TypeORM** | 0.3.x | Data Access & ORM | Requested by stack constraints. Powerful entity mapping, but requires specific integration with Encore's migration system. |

### Frontend (SPA & PWA)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vite** | Latest | Build Tool | Fast HMR, optimized production builds for React. |
| **React** | 18/19 | UI Library | Component-based UI for complex POS/ERP interfaces. |
| **TanStack Query** | Latest | Data Fetching & Caching | Manages server state, handles loading/error states, and integrates well with generated Encore clients. |
| **Dexie.js** | Latest | Offline Database (IndexedDB) | Simple wrapper for IndexedDB to store products/orders offline in the POS. |
| **Workbox** | Latest | PWA / Service Worker | Handles asset caching and offline routing for the POS. |

## Architecture & Integration Strategy

### 1. Encore Service Architecture (Modular Monolith)

Structure the backend as a **Modular Monolith** within a single Encore application. This allows shared code (types, utilities) while keeping domains distinct.

**Service Boundaries:**
-   `pos/`: High-availability endpoints for the cashier. Optimized for speed and offline sync.
-   `erp/`: Complex business logic for inventory, reporting, and backoffice management.
-   `auth/`: Centralized authentication (JWT/Session) shared by both.
-   `inventory/`: Source of truth for stock levels, updated by POS and ERP.

**Example Folder Structure:**
```
/my-pos-app
├── encore.app                       # Encore App Config
├── package.json
├── client/                          # Vite React Frontend
│   ├── index.html
│   ├── src/
│   │   ├── api/                     # Generated Encore Client
│   │   ├── pos/                     # POS specific UI
│   │   └── erp/                     # ERP specific UI
│   └── vite.config.ts
├── pos/                             # POS Backend Service
│   ├── encore.service.ts
│   ├── api.ts
│   └── service.ts
├── erp/                             # ERP Backend Service
│   ├── encore.service.ts
│   └── api.ts
└── database/                        # Shared DB setup
    ├── db.ts                        # Encore SQLDatabase definition
    ├── data-source.ts               # TypeORM DataSource config
    └── migrations/                  # SQL migrations for Encore
```

### 2. TypeORM Integration Pattern (The "Hybrid" Approach)

**Challenge:** Encore natively manages database migrations via raw SQL files in a `migrations/` folder and applies them automatically during deployment. TypeORM defaults to running migrations via its own CLI at runtime, which conflicts with Encore's production security model (read-only app users).

**Recommended Solution: "TypeORM for Code, Encore for Infra"**

1.  **Define Entities:** Use TypeORM `@Entity` classes as normal.
2.  **Generate Migrations (Dev):** Use `typeorm migration:generate` to create a migration file based on schema changes.
3.  **Bridge to Encore:**
    -   Extract the SQL from the generated migration's `up` method.
    -   Save this SQL into a `.up.sql` file in Encore's `migrations/` directory.
    -   Encore will apply this SQL automatically on the next `git push encore`.
4.  **Runtime Connection:** Initialize TypeORM using Encore's connection string, but **disable** `synchronize: true` and `migrationsRun: true` in production.

```typescript
// database/db.ts
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { DataSource } from "typeorm";

// 1. Define Encore DB infrastructure
export const DB = new SQLDatabase("pos_db", {
  migrations: "./migrations", // Encore runs these SQL files
});

// 2. Configure TypeORM to use Encore's connection
export const AppDataSource = new DataSource({
  type: "postgres",
  url: DB.connectionString, // Injected by Encore
  entities: [/* ... */],
  synchronize: false, // Critical: Let Encore manage schema
  migrationsRun: false, // Critical: Encore runs migrations, not TypeORM
});

export const getDb = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};
```

### 3. Frontend & Monorepo Structure

**Hosting:**
Use Encore's `api.static` capability to serve the built Vite app. This keeps the deployment atomic (backend + frontend deploy together) and simplifies the stack.

**Implementation:**
1.  **Build Step:** Configure `package.json` to build the Vite app into `client/dist/`.
2.  **Serve Static Assets:** Create a gateway service in Encore to serve `client/dist/`.

```typescript
// gateway/encore.service.ts
import { api } from "encore.dev/api";

// Serve the built frontend
export const assets = api.static({
  expose: true,
  path: "/!path", // Catch-all for SPA routing
  dir: "../client/dist",
});
```

**Type Sharing:**
Encore automatically generates a type-safe TypeScript client (`encore gen client`).
-   The frontend imports this client to call backend APIs.
-   **Benefit:** No manual API types or Swagger files needed. End-to-end type safety from DB (TypeORM) -> API (Encore) -> Frontend (React).

### 4. PWA & Offline Architecture

**POS Requirements:** Must work without internet.

1.  **Service Worker (Workbox):** Caches the `index.html`, JS bundles, and static assets.
2.  **Local Database (Dexie.js):**
    -   On login/startup, the POS fetches the "Product Catalog" and "Tax Rates" from Encore and stores them in IndexedDB.
    -   Orders created offline are stored in an "Outbox" table in IndexedDB.
3.  **Sync Strategy:**
    -   **Background Sync:** React Query or a custom hook monitors online status.
    -   **Push:** When online, the "Outbox" pushes orders to the `pos/sync` endpoint in Encore.
    -   **Pull:** After push, it pulls strict "delta" updates for products/inventory.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **ORM** | TypeORM | **Prisma / Drizzle** | TypeORM was requested. However, **Drizzle** has better native integration with Encore's serverless/infrastructure model if requirements were flexible. |
| **Frontend Hosting** | Encore `api.static` | **Vercel / Netlify** | Keep it simple (one deployment pipeline). Move to Vercel only if global edge CDN performance becomes a bottleneck for the static assets. |
| **Architecture** | Monolith | **Microservices** | Encore allows splitting later. Starting distributed adds unnecessary complexity for a POS/ERP MVP. |

## Installation & Setup

```bash
# 1. Create Encore App
encore app create my-pos-app --template=ts/empty

# 2. Add React Client
npm create vite@latest client -- --template react-ts

# 3. Add Dependencies
npm install typeorm pg reflect-metadata
npm install -D typeorm-extension # Helpers for migration bridging
```

## Sources

-   **Encore Docs:** `encore.dev/docs/ts/develop/orms` (ORM Integration)
-   **Encore Docs:** `encore.dev/docs/ts/primitives/static-assets` (Static Serving)
-   **Encore Blog:** "Building a File Sharing Service" (Frontend integration patterns)
-   **TypeORM Docs:** Migration generation and DataSource configuration.
