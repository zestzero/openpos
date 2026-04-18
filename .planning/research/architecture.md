# Architecture & Data Modeling Research

**Project:** POS+ERP System (Go + chi + sqlc)
**Researched:** March 22, 2026 (updated April 18, 2026 for Go stack)
**Focus:** Package boundaries, Data modeling, Go-specific patterns, Offline sync

## Executive Summary

The system follows a **monolithic architecture** with clean package boundaries per domain. We recommend **5 domain packages** within a single Go binary, communicating via **direct function calls** in-process. No message queues or HTTP between domains for v1.

The data model prioritizes **Variant-level tracking** for products and a **Transactional Ledger** for inventory to ensure accuracy. Offline sync relies on a **Local-First** approach with client-generated UUIDs and an operation queue.

---

## 1. Domain Boundaries

We split the application into packages based on "rate of change" and "business capability".

| Package | Responsibility | Key Endpoints | Dependencies |
|---------|---------------|---------------|--------------|
| **auth** | User identity, Role verification, JWT issuance | `POST /login`, `POST /users`, `GET /me` | None |
| **catalog** | Product templates, Variants, Categories, Prices | `GET /products`, `GET /variants/:barcode` | None |
| **inventory** | Stock levels, Stock movements (ledger) | `GET /stock/:id`, `POST /stock/adjust` | Catalog (for SKU validation) |
| **sales** | Orders, Carts, Payments | `POST /orders`, `POST /orders/:id/pay` | Catalog, Inventory, Auth |
| **reporting** | Analytics, Dashboard aggregation (Read-heavy) | `GET /reports/sales`, `GET /reports/profit` | Sales, Inventory (read-only) |

### Rationale
- **Catalog** is read-heavy (POS needs it constantly).
- **Inventory** is write-heavy and high-conflict (needs transactional integrity).
- **Sales** is the high-velocity "edge" service for POS.
- **Reporting** is separated to prevent heavy analytical queries from slowing down the POS.

---

## 2. Data Model Design

### Products & Variants (Catalog)
We use a **Template-Variant** pattern to handle complexity (e.g., T-Shirt with sizes/colors).

*   **`Product` (Template):** Name, Description, Brand, Category, Base Price, Tax Rules.
*   **`Variant` (Sellable SKU):** SKU (PK), Barcode, Specific Price (override), Dimensions, Weight.
    *   *Relationship:* One Product has Many Variants.
    *   *Note:* Inventory is **not** stored here.

### Orders (Sales)
*   **`Order`:** ID (UUID), StoreID, Status (Pending, Paid, Void), Total, UserID, CreatedAt.
*   **`OrderLineItem`:** OrderID, VariantID, Quantity, UnitPrice (at time of sale), Discount.

### Inventory
Do **not** store a simple "Quantity" integer that gets overwritten. Use a **Transactional Ledger**.

*   **`StockLedger`:** ID, VariantID, QuantityChange (+/-), Reason (Sale, Restock, Loss), ReferenceID (OrderID or PO #), Timestamp.
*   **`CurrentStock` (View/Cache):** A materialised view or cached table updated by the ledger for fast lookups of `sum(QuantityChange)`.

### Users (Auth)
*   **`User`:** ID, Email, PasswordHash, Role (Owner, Cashier), PIN (for quick POS access).

---

## 3. Inter-Domain Communication

In the Go monolith, domains communicate via **direct function calls** — no HTTP, no message queues between packages.

### In-Process Calls

```go
// internal/sales/service.go
func (s *SalesService) CompleteOrder(ctx context.Context, orderID uuid.UUID) error {
    // 1. Mark order as paid in sales DB
    err := s.queries.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
        ID:     orderID,
        Status: "paid",
    })
    if err != nil {
        return err
    }

    // 2. Get order items
    items, err := s.queries.GetOrderItems(ctx, orderID)
    if err != nil {
        return err
    }

    // 3. Deduct inventory (direct function call, same process)
    for _, item := range items {
        err := s.inventoryService.DeductStock(ctx, inventory.DeductParams{
            VariantID:   item.VariantID,
            Quantity:    item.Quantity,
            ReferenceID: orderID,
            Reason:      "sale",
        })
        if err != nil {
            return err // Transaction rollback handled by caller
        }
    }

    return nil
}
```

### Why Not Pub/Sub for v1?
- Single binary — no network boundary between domains
- Direct function calls are simpler, faster, and easier to debug
- Transaction boundaries are clearer (can use a single DB transaction if needed)
- Can extract to message queues later if scaling requires it

---

## 4. Database Architecture

**Strategy:** Single PostgreSQL database with schema-level separation via table naming conventions.

Since this is a monolith (not microservices), all domains share one PostgreSQL database. Tables are prefixed or organized by domain:

```sql
-- Auth tables
CREATE TABLE users (...);

-- Catalog tables
CREATE TABLE categories (...);
CREATE TABLE products (...);
CREATE TABLE variants (...);
CREATE TABLE variant_attributes (...);

-- Inventory tables
CREATE TABLE stock_ledger (...);
CREATE TABLE current_stock (...);

-- Sales tables
CREATE TABLE orders (...);
CREATE TABLE order_line_items (...);
CREATE TABLE order_payments (...);
```

**Benefits of single DB:**
- Foreign keys across domains (e.g., `order_line_items.variant_id` → `variants.id`)
- JOIN queries for reporting
- Single transaction for order completion + stock deduction
- Simpler operations (one backup, one connection pool)

**Trade-off:** Domains are logically separated via Go packages, not physically separated by database. This is appropriate for v1 scale.

---

## 5. Auth Architecture

JWT-based authentication with chi middleware.

**Flow:**
1. **Login:** User sends email/password (or PIN) → server validates → returns JWT
2. **Middleware:** chi middleware extracts JWT from `Authorization` header, validates, injects user context
3. **Handlers:** Access user info from context, check roles

```go
// internal/middleware/auth.go
func AuthMiddleware(jwtSecret []byte) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            token := r.Header.Get("Authorization")
            // Parse and validate JWT
            claims, err := validateJWT(token, jwtSecret)
            if err != nil {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }
            ctx := context.WithValue(r.Context(), userContextKey, claims)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

// Role-checking middleware
func RequireRole(roles ...string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            user := GetUserFromContext(r.Context())
            for _, role := range roles {
                if user.Role == role {
                    next.ServeHTTP(w, r)
                    return
                }
            }
            http.Error(w, "Forbidden", http.StatusForbidden)
        })
    }
}
```

---

## 6. Offline Sync Strategy (POS Client)

The POS client must work when the internet is dead. This is entirely a frontend concern.

**Architecture:** "Local-First"
1.  **Frontend DB:** POS runs on IndexedDB via Dexie.js.
2.  **Read Sync:** On startup/interval, fetch full Catalog from Go backend → store in IndexedDB.
3.  **Write Sync (Queue):**
    *   Offline: User creates order. Saved to IndexedDB with **UUID** (generated on client).
    *   Queue: Action `CREATE_ORDER` added to "Sync Queue".
    *   Online: Queue processor sends actions to Go backend REST endpoints.

**Conflict Resolution:**
*   **IDs:** Never let the server assign IDs for offline-created items. Use UUIDs.
*   **Inventory:** Do not sync "Current Qty = 5". Sync "Decrement 1". If two offline devices sell the last item, the server processes both decrement events. Result: Stock = -1. This is better than one sale overwriting the other.
*   **Errors:** If sync fails (e.g., credit card declined by backend later), push a "Correction" or "Alert" back to the POS client's inbox.

---

## 7. API Design Patterns

### POS API (The "Edge" API)
*   **Goal:** Minimise round-trips for the frontend.
*   **Pattern:** "Backend for Frontend" (BFF) style or aggregated endpoints.
    *   `GET /api/pos/initial-load`: Returns Categories + Top 50 Products + Tax Rules in one go.
    *   **Slim Payloads:** Exclude heavy descriptions/HTML from POS responses.

### ERP API (The Management API)
*   **Goal:** Flexibility for admin dashboard.
*   **Pattern:** RESTful CRUD with filtering/pagination.
    *   `GET /api/catalog/products?page=1&category=shoes&sort=price_desc`
    *   **Rich Payloads:** Include full history, logs, and metadata.

### Go Implementation
Separate handler files per consumer within each domain package:

```go
// internal/catalog/handler.go
func (h *Handler) Routes() chi.Router {
    r := chi.NewRouter()

    // POS endpoints (slim, fast)
    r.Get("/pos/products", h.ListProductsForPOS)
    r.Get("/pos/products/barcode/{barcode}", h.GetProductByBarcode)

    // ERP endpoints (rich, paginated)
    r.Get("/products", h.ListProducts)
    r.Post("/products", h.CreateProduct)
    r.Put("/products/{id}", h.UpdateProduct)

    return r
}
```

---

*Updated: April 18, 2026 — Go stack migration*
