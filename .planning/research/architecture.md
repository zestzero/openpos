# Architecture & Data Modeling Research

**Project:** POS+ERP System (Encore.ts)
**Researched:** March 22, 2026
**Focus:** Service boundaries, Data modeling, Encore-specific patterns, Offline sync

## Executive Summary

The system follows a **Service-Based Architecture** leveraging Encore.ts's native isolation and event-driven capabilities. We recommend **5 core services** with strict database isolation, communicating via **Pub/Sub for writes** (side effects) and **Direct API calls for reads**.

The data model prioritizes **Variant-level tracking** for products and a **Transactional Ledger** for inventory to ensure accuracy. Offline sync relies on a **Local-First** approach with client-generated UUIDs and an operation queue.

---

## 1. Service Boundaries

We recommend splitting the application into domains based on "rate of change" and "business capability".

| Service | Responsibility | Key APIs | Dependencies |
|---------|---------------|----------|--------------|
| **Auth** | User identity, Role verification, Token issuance. | `login`, `verifyToken`, `listUsers` | None |
| **Catalog** | Product templates, Variants, Categories, Prices. | `getProduct`, `listVariants`, `updatePrice` | None |
| **Inventory** | Stock levels, Stock movements (ledger), Warehouses. | `getStock`, `adjustStock`, `transferStock` | Catalog (for SKU validation) |
| **Sales** (POS) | Orders, Carts, Payments, Customer linking. | `createOrder`, `processPayment`, `getDailyTotal` | Catalog, Inventory, Auth |
| **Reporting** | Analytics, Dashboard aggregation (Read-heavy). | `getSalesReports`, `getInventoryValuation` | All (via Pub/Sub events) |

### Rationale
- **Catalog** is read-heavy (POS needs it constantly).
- **Inventory** is write-heavy and high-conflict (needs transactional integrity).
- **Sales** is the high-velocity "edge" service for POS.
- **Reporting** is decoupled to prevent heavy analytical queries from slowing down the POS.

---

## 2. Data Model Design

### Products & Variants (Catalog Service)
We use a **Template-Variant** pattern to handle complexity (e.g., T-Shirt with sizes/colors).

*   **`Product` (Template):** Name, Description, Brand, Category, Base Price, Tax Rules.
*   **`Variant` (Sellable SKU):** SKU (PK), Barcode, Specific Price (override), Dimensions, Weight.
    *   *Relationship:* One Product has Many Variants.
    *   *Note:* Inventory is **not** stored here.

### Orders (Sales Service)
*   **`Order`:** ID (UUID), StoreID, Status (Pending, Paid, Void), Total, UserID, CreatedAt.
*   **`OrderLineItem`:** OrderID, VariantID, Quantity, UnitPrice (at time of sale), Discount.

### Inventory (Inventory Service)
Do **not** store a simple "Quantity" integer that gets overwritten. Use a **Transactional Ledger**.

*   **`StockLedger`:** ID, VariantID, WarehouseID, QuantityChange (+/-), Reason (Sale, Restock, Loss), ReferenceID (OrderID or PO #), Timestamp.
*   **`CurrentStock` (View/Cache):** A materialised view or cached table updated by the ledger for fast lookups of `sum(QuantityChange)`.

### Users (Auth Service)
*   **`User`:** ID, Email, PasswordHash, Role (Owner, Manager, Cashier), PIN (for quick POS access).

---

## 3. Inter-Service Communication

Encore.ts makes both patterns easy. We use **Sync** for information gathering and **Pub/Sub** for decoupled actions.

### Synchronous (Direct API Calls)
Use when the caller **needs** the answer immediately to proceed.
*   *POS -> Catalog:* "Get product details for barcode X" (Latency critical).
*   *POS -> Inventory:* "Is SKU Y in stock?" (Validation).

### Asynchronous (Pub/Sub)
Use for side effects to keep the POS fast and the system resilient.

**Scenario: Order Completed**
1.  **Sales Service:** Saves Order to DB. Returns "Success" to POS.
2.  **Sales Service:** Publishes `Topic<OrderCompletedEvent>('order.completed')`.
3.  **Inventory Service:** Subscribes `order.completed` -> Writes `-1` to Stock Ledger.
4.  **Reporting Service:** Subscribes `order.completed` -> Updates daily dashboard stats.

**Encore Implementation:**
```typescript
// sales/order.ts
import { Topic } from "encore.dev/pubsub";
export const orderCompleted = new Topic<OrderEvent>("order.completed", {
  deliveryGuarantee: "at-least-once",
});

// inventory/service.ts
import { Subscription } from "encore.dev/pubsub";
import { orderCompleted } from "../sales/order";

const _ = new Subscription(orderCompleted, "deduct-inventory", {
  handler: async (event) => {
    await deductStock(event.orderId, event.items);
  },
});
```

---

## 4. Database Architecture

**Strategy:** Database-per-Service (Logical Isolation).

Encore encourages `new SQLDatabase('service_name')`. We should strictly adhere to this.
*   **Pros:** Services can be deployed independently; schema changes in Catalog don't break Sales.
*   **Cons:** No `JOIN`s across domains.
*   **Solution:** The API Gateway (Encore) handles the composition, or the Frontend fetches from multiple endpoints. For Reports, the Reporting service listens to events to build its own optimized "Read Model" (CQRS lite).

---

## 5. Auth Architecture

Encore provides a native `authHandler`.

**Flow:**
1.  **Gateway Level:** Global `authHandler` intercepts all `{ auth: true }` requests.
2.  **Verification:** Decodes JWT/Session token.
3.  **Context:** Returns `UserData` (ID, Role) to the endpoint.
4.  **Service Level:** Each API endpoint checks the role.

```typescript
// auth/auth.ts
export const myAuth = authHandler(async (params) => {
  const token = params.authorization;
  const user = verifyToken(token); // logic here
  return { userID: user.id, role: user.role };
});

// sales/order.ts
export const createOrder = api(
  { auth: true, method: "POST", path: "/orders" },
  async (params) => {
    const user = getAuthData(); // typesafe access
    if (user.role !== 'CASHIER') throw APIError.permissionDenied("Only cashiers can sell");
    // ...
  }
);
```

---

## 6. Offline Sync Strategy (POS Client)

The POS client must work when the internet is dead.

**Architecture:** "Local-First"
1.  **Frontend DB:** POS runs on a local DB (e.g., RxDB, PouchDB, or SQLite).
2.  **Read Sync:** On startup/interval, fetch full Catalog (or deltas) from Backend -> Local DB.
3.  **Write Sync (Queue):**
    *   Offline: User creates order. Saved to Local DB with **UUID** (generated on client).
    *   Queue: Action `CREATE_ORDER` added to "Sync Queue".
    *   Online: Queue processor sends actions to Backend.

**Conflict Resolution:**
*   **IDs:** Never let the server assign IDs for offline-created items. Use UUIDs.
*   **Inventory:** Do not sync "Current Qty = 5". Sync "Decrement 1". If two offline devices sell the last item, the server processes both decrement events. Result: Stock = -1. This is better than one sale overwriting the other.
*   **Errors:** If sync fails (e.g., credit card declined by backend later), push a "Correction" or "Alert" back to the POS client's inbox.

---

## 7. API Design Patterns

### POS API (The "Edge" API)
*   **Goal:** Minimise round-trips for the frontend.
*   **Pattern:** "Backend for Frontend" (BFF) style or aggregated endpoints.
    *   `GET /pos/initial-load`: Returns Categories + Top 50 Products + Tax Rules in one go.
    *   **Slim Payloads:** Exclude heavy descriptions/HTML from POS responses.

### ERP API (The Management API)
*   **Goal:** Flexibility for admin dashboard.
*   **Pattern:** RESTful CRUD with filtering/pagination.
    *   `GET /products?page=1&category=shoes&sort=price_desc`
    *   **Rich Payloads:** Include full history, logs, and metadata.

### Encore Specifics
Encore allows defining multiple APIs in the same service.
*   `product/api_pos.ts` -> exposing `getLiteProduct`
*   `product/api_admin.ts` -> exposing `getFullProduct`

Both use the same DB logic but serve different masters.
