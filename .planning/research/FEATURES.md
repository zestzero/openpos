# Feature Implementation Patterns

**Domain:** Retail POS/ERP (Web-based)
**Researched:** 2026-03-22

## 1. POS Sale Flow (The "Register")

The checkout experience must be fast (sub-2-second scans) and resilient.

### Barcode Scanning
*   **Pattern:** **Hybrid Scanning**
    *   **Primary:** Use **`BarcodeDetector` API** (Shape Detection API). It uses hardware acceleration (Android/Chrome) and is incredibly fast.
    *   **Fallback:** Use **`html5-qrcode`** (ZXing-js) for browsers without Shape Detection support (Firefox/Safari).
    *   **Hardware:** Support "Keyboard Wedge" mode (standard USB scanners act as keyboards). The UI should listen for rapid keystrokes ending in `Enter` to detect scans without a focused input field.

### Receipt Printing
*   **Pattern:** **Client-Side USB (WebUSB)**
    *   **Library:** `esc-pos-encoder` (to format ESC/POS commands) + `navigator.usb` (to send bytes).
    *   **Flow:**
        1.  User clicks "Connect Printer" (required user gesture).
        2.  App claims USB interface.
        3.  Sale completes -> Generate receipt binary -> `device.transferOut`.
    *   **Constraint:** Requires HTTPS. Windows may require specific driver settings (WinUSB) to release the device to the browser.

### Payment Processing
*   **Mixed Payments:** Cart state must support multiple "Tenders" per sale.
    *   *Schema:* `SaleTenders` table (Type: Cash, Card, QR; Amount: decimal).
    *   *Logic:* `remaining = total - sum(tenders)`. Allow checkout only when `remaining <= 0`.
*   **Thai QR:** Generate PromptPay QR strings (EMVCo standard) locally or via payment gateway API. Display on screen for customer to scan.

## 2. Offline POS Architecture

The POS must work during internet outages.

### Data Storage
*   **Pattern:** **Local-First (IndexedDB)**
    *   **Library:** **Dexie.js** (wrapper for IndexedDB) is the industry standard for ease of use and performance.
    *   **Store:** `Products` (full catalog), `Carts` (in-progress), `Orders` (completed but unsynced).

### Synchronization Strategy
*   **Pattern:** **Sync Queue with Optimistic UI**
    1.  **Action:** Cashier completes sale.
    2.  **Local:** Write to IndexedDB `Orders` (status: 'pending_sync') and decrement local `Product` stock (optimistic).
    3.  **Queue:** Add job to `SyncQueue` table in IndexedDB.
    4.  **Background Process:** `navigator.onLine` trigger or polling loop sends `SyncQueue` items to backend.
    5.  **Success:** Update local Order status to 'synced', update server-side Inventory.
    6.  **Failure:** Retry with exponential backoff. Alert user if queue > N items.

## 3. Product Management (Variants)

Avoiding the "Flat Product" trap is critical.

### Data Model
*   **Entity: Product (Parent)**
    *   *Role:* Marketing data, description, category, brand.
    *   *Fields:* `id`, `name`, `description`, `category_id`, `has_variants (bool)`.
*   **Entity: Variant / SKU (Sellable)**
    *   *Role:* The actual physical item tracked in inventory.
    *   *Fields:* `id`, `product_id`, `sku` (unique), `barcode`, `price`, `cost_price`.
    *   *Note:* Order Lines reference **Variant ID**, not Product ID.
*   **Entity: Attributes**
    *   *Role:* Dynamic characteristics (Color, Size).
    *   *Schema:* `ProductAttribute` (name: "Color"), `ProductAttributeValue` (value: "Red"), `VariantAttribute` (link table).

## 4. Inventory Management

Reliable stock tracking requires a double-entry approach.

### The "Ledger" Pattern (Audit Trail)
*   **Concept:** Never just `UPDATE products SET qty = 5`.
*   **Schema:** `InventoryLedger` table.
    *   `id`, `variant_id`, `type` (sale, restock, adjustment, return), `delta` (+5, -1), `reference_id` (order_id), `timestamp`.
*   **Logic:** Current stock = Sum of all deltas.

### The "Snapshot" Pattern (Performance)
*   **Concept:** Calculating sum of deltas is too slow for POS lookup.
*   **Schema:** `InventorySnapshot` table (or column on Variant).
    *   `variant_id`, `quantity_on_hand`, `last_updated`.
*   **Trigger:** Whenever a Ledger row is inserted, update the Snapshot.
*   **Rule:** Snapshot is a cache. Ledger is the truth.

## 5. Sales Reporting

### Aggregation Patterns
*   **V1 (Simple):** SQL Aggregation on `InventoryLedger` or `Orders`.
    *   `SELECT date_trunc('day', created_at), sum(total) FROM orders GROUP BY 1`.
*   **Optimization:** For V2, create a `DailySales` materialized view that refreshes nightly.
*   **Metrics:**
    *   **Gross Sales:** Sum of all order totals.
    *   **Net Sales:** Gross - Returns - Discounts.
    *   **Gross Profit:** Net Sales - (Sum of Variant Cost * Qty).

## Sources
*   **Scanning:** [Barcode Detection API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API)
*   **Printing:** [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/USB)
*   **Offline:** [Local-First Software (Ink & Switch)](https://www.inkandswitch.com/local-first/)
*   **Data Models:** "Database Design for Product Management" (Mojtaba Azad), "Types of Fact Table" (Wisdom Schema)
