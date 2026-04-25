# Coding Conventions

**Analysis Date:** 2026-04-25

## Naming Patterns

### Go (Backend)

**Files:**
- Lowercase, singular: `user.go`, `product.go`, `sales.go`
- Domain-specific grouping: `handler.go`, `service.go`, `middleware.go`
- Generated files in `db/sqlc/` are NOT edited manually

**Functions:**
- Exported (public): PascalCase - `GetUser`, `CreateOrder`
- Unexported (private): camelCase - `getUser`, `createOrder`
- Constructor pattern: `NewXxx()` for struct factories

**Variables:**
- camelCase: `userID`, `productName`, `totalAmount`
- Acronyms: `userID` (not `userId` or `userID`)

**Types:**
- PascalCase: `User`, `Product`, `OrderItem`
- Interfaces: `Storer`, `Reader`, `Writer` (noun-based)
- Errors: `ErrXxx` pattern - `ErrNotFound`, `ErrInvalidInput`

### TypeScript/React (Frontend)

**Files:**
- PascalCase for components: `UserCard.tsx`, `ProductGrid.tsx`
- camelCase for utilities: `formatCurrency.ts`, `useAuth.ts`
- Hooks: `useXxx.ts` pattern

**Components:**
- PascalCase: `ProductCard`, `OrderSummary`
- Functional components only (no class components)

## Code Style

### Go Formatting

**Tool:** `gofmt` (run on save)
**Linting:** `go vet`

**Key rules enforced by gofmt:**
- Indent with tabs
- Line length: no hard limit, but keep readable
- Blank imports: use `_` prefix, e.g., `_ "github.com/lib/pq"`

### TypeScript/React Formatting

**Tool:** Prettier (configured in project)
**Linting:** ESLint with TypeScript support

**Tailwind CSS v4:**
- Use `@theme` in CSS files for design tokens
- NOT JS config pattern

```css
/* frontend/src/app.css */
@theme {
  --color-primary: #2563eb;
  --color-primary-foreground: #ffffff;
}
```

## Import Organization

### Go

```go
// Standard library
import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
)

// External packages
import (
    "github.com/go-chi/chi/v5"
    "github.com/jackc/pgx/v5"
)

// Internal packages (relative to module root)
import (
    "openpos.internal/db/sqlc"
    "openpos.internal/user"
    "openpos.internal/product"
)
```

### TypeScript/React

```typescript
// React/router first
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

// UI components (shadcn/ui)
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// API client
import { api } from '@/lib/api';

// Local components
import { ProductCard } from '@/pos/components/ProductCard';
```

**Path Aliases:**
- `@/` maps to `frontend/src/`
- Use `@/` for all local imports

## Error Handling

### Go

**Pattern:** Return errors, don't panic.

```go
func (s *Service) GetUser(ctx context.Context, id int64) (*User, error) {
    user, err := s.queries.GetUser(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("getting user %d: %w", id, err)
    }
    return user, nil
}
```

**Error wrapping:**
- Use `fmt.Errorf("doing X: %w", err)` for context
- Wrap at call site, not in helper functions

**HTTP handlers:**
```go
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    user, err := h.service.GetUser(ctx, id)
    if err != nil {
        switch {
        case errors.Is(err, ErrNotFound):
            http.Error(w, "not found", http.StatusNotFound)
        default:
            http.Error(w, "internal error", http.StatusInternalServerError)
        }
        return
    }
    json.NewEncoder(w).Encode(user)
}
```

### TypeScript/React

**Pattern:** Use TanStack Query's error states.

```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => api.getUser(userId),
});

if (error) {
  return <div>Error: {error.message}</div>;
}
```

## Logging

### Go

**Framework:** `log/slog` (standard library, Go 1.21+)

```go
func (s *Service) ProcessOrder(ctx context.Context, order Order) error {
    slog.Info("processing order",
        slog.Int64("order_id", order.ID),
        slog.Int("item_count", len(order.Items)),
    )
    
    // Use structured logging for operations
    slog.Debug("inventory check",
        slog.Int64("product_id", productID),
        slog.Int("available", available),
    )
}
```

**Log levels:**
- `Error`: Failures that need attention
- `Warn`: Recoverable issues
- `Info`: Normal operations
- `Debug`: Detailed debugging info

### Frontend

**Console only for now** (logging to service not implemented).
Use sparingly in development only.

```typescript
// Development only
if (import.meta.env.DEV) {
  console.log('Order sync:', order);
}
```

## Comments

### Go

**Exported functions:** Required for public API
```go
// GetUser retrieves a user by ID from the database.
// Returns ErrNotFound if the user does not exist.
func (s *Service) GetUser(ctx context.Context, id int64) (*User, error) {
```

**Unexported:** Comment when behavior is non-obvious

### TypeScript/JSDoc

**Components:** Props should be documented
```typescript
interface ProductCardProps {
  /** Product to display */
  product: Product;
  /** Callback when add to cart is clicked */
  onAddToCart?: (variantId: string) => void;
}
```

## Function Design

### Go

**Parameters:**
- `context.Context` as FIRST parameter
- Keep under 4 parameters when possible
- Use options pattern for optional params

```go
// Good
func (s *Service) CreateOrder(ctx context.Context, items []OrderItem) (*Order, error)

// Consider options pattern for many optional params
type CreateProductOptions struct {
    SKU         string
    Name        string
    Price       int64 // in satang
    Description string
    Images      []string
}
```

**Return values:**
- Error as last return
- Named returns only when clarity requires

### TypeScript/React

**React Query mutations:**
```typescript
const createOrder = useMutation({
  mutationFn: (items: OrderItem[]) => api.createOrder(items),
  onSuccess: (order) => {
    queryClient.invalidateQueries({ key: ['orders'] });
  },
});
```

## Module Design

### Go

**Package structure:**
```
internal/
├── user/
│   ├── handler.go    # HTTP handlers (chi)
│   ├── service.go    # Business logic
│   └── repository.go # DB queries wrapper
├── product/
│   ├── handler.go
│   ├── service.go
│   └── repository.go
```

**Exports:** Only what other packages need
- Handler types for routing setup
- Service interfaces for testing
- Domain types shared across packages

**Barrel files:** Not used in Go (use explicit imports)

### TypeScript/React

**Barrel files (index.ts):**
```typescript
// components/ui/index.ts
export { Button } from './button';
export { Card } from './card';
export { Input } from './input';
```

## Database Conventions

### sqlc

**Query files:** `db/queries/{domain}.sql`
```sql
-- name: GetProduct :one
SELECT id, name, price, created_at
FROM products
WHERE id = $1;
```

**After changes:** Run `sqlc generate`

**Never edit:** Files in `db/sqlc/` (generated)

### Migrations

**Tool:** golang-migrate

**Naming:** Sequential with descriptive name
```
db/migrations/
├── 001_create_users.up.sql
├── 001_create_users.down.sql
├── 002_create_products.up.sql
└── 002_create_products.down.sql
```

**Create new migration:**
```bash
migrate create -ext sql -dir db/migrations -seq add_product_variants
```

**Rules:**
- Forward-only in production
- Always provide both `.up.sql` and `.down.sql`
- Test down migrations locally

### Monetary Values

**Storage:** BIGINT (cents/satang) or NUMERIC(12,2)
```sql
-- Good: BIGINT in satang
price BIGINT NOT NULL,  -- 100 = 1 THB

-- Also acceptable: NUMERIC for exact decimal
amount NUMERIC(12,2) NOT NULL,
```

**Frontend:** Store as integers, format on display
```typescript
const formatted = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
}).format(amount / 100);
```

## Data Model Rules

### Product → Variant Hierarchy

**Never flat products** — always:
```
Product (parent)
  └── Variant (child) -- has SKU, price, inventory
```

```go
type Product struct {
    ID   int64
    Name string
    // No price here
}

type ProductVariant struct {
    ID        int64
    ProductID int64
    SKU       string
    Price     int64 // satang
    Stock     int64
}
```

### Inventory: Ledger + Snapshot

**Never quantity column** — always:
```
InventoryLedger (source of truth)
  └── InventorySnapshot (derived, for fast queries)
```

```sql
-- Ledger: every change recorded
CREATE TABLE inventory_ledger (
    id BIGSERIAL PRIMARY KEY,
    variant_id BIGINT NOT NULL,
    quantity_change INT NOT NULL,  -- +5, -2, etc
    reason VARCHAR(50),            -- 'sale', 'restock', 'adjustment'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshot: current state (updated via trigger or app)
CREATE TABLE inventory_snapshots (
    variant_id BIGINT PRIMARY KEY,
    quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Delta Sync (Offline)

**Never sync absolute values** — always:
```
Sync: "decrement 1" (operation)
Not:  "set to 9" (state)
```

```typescript
// Correct: delta sync
const syncOp = {
  type: 'decrement_inventory',
  variantId: 'xxx',
  quantity: 1,
  timestamp: Date.now(),
};

// Wrong: state sync (don't do this)
const wrongSync = {
  variantId: 'xxx',
  newQuantity: 9,  // NO!
}
```

---

*Convention analysis: 2026-04-25*