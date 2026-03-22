# Domain Pitfalls

**Domain:** Retail POS/ERP
**Researched:** 2026-03-22

## Critical Pitfalls

Mistakes that cause rewrites or major data integrity issues.

### Pitfall 1: The "Quantity Column" Trap
**What goes wrong:** Storing inventory *only* as a number on the product row (e.g., `products.quantity = 10`).
**Why it happens:** It's the simplest way to track stock.
**Consequences:**
*   **No Audit Trail:** You can't explain *why* stock is low (theft? sale? damage?).
*   **Race Conditions:** Two concurrent sales read `10`, both write `9`. Actual stock should be `8`.
**Prevention:**
*   **Transaction Ledger:** Always insert a row into `InventoryLedger` (variant_id, delta, reason).
*   **Derived Snapshot:** Update the `quantity` column only as a cached sum of the ledger.

### Pitfall 2: The "Flat Product" Schema
**What goes wrong:** Creating a `products` table with columns like `size` and `color`.
**Why it happens:** Attempting to avoid complexity of parent/child relationships.
**Consequences:**
*   **Data Duplication:** "Red Shirt" and "Blue Shirt" are separate products. Updating the description requires 2 updates.
*   **Reporting Nightmare:** Cannot easily report on "All Shirts" sales.
**Prevention:**
*   **Variant Model:** `Product` (Parent) -> `Variant` (Child). Attributes linked to Variant.

### Pitfall 3: WebUSB Browser Support
**What goes wrong:** Building the entire printing flow around `navigator.usb`.
**Why it happens:** It's the modern standard for web hardware.
**Consequences:**
*   **iOS Failure:** iPads (common in retail) do not support WebUSB.
*   **Windows Driver Hell:** Windows claims USB devices; getting Chrome to see them requires Zadig/WinUSB driver replacement.
**Prevention:**
*   **Hybrid Printing:** Detect OS. If Windows/Android -> WebUSB. If iOS -> Fallback to AirPrint (system dialog) or network printing (if applicable).

### Pitfall 4: "Last Write Wins" in Offline Sync
**What goes wrong:** Simple object sync overwrites inventory.
**Why it happens:** Default strategy for many sync libraries.
**Consequences:** Device A sells item (stock 10->9). Device B sells item (stock 10->9). Sync results in stock 9 (should be 8).
**Prevention:**
*   **Delta Sync:** Sync *operations* (decrement 1), not *state* (set to 9).
*   **Queue Pattern:** Process sync queue sequentially on the server.

## Moderate Pitfalls

### Pitfall 5: Tax Calculation on Total
**What goes wrong:** Calculating tax on the final cart total.
**Why it happens:** Simpler math.
**Consequences:** Rounding errors when selling multiple items with different tax rates or when summing individual line items for accounting.
**Prevention:** Calculate tax **per line item**, round, then sum.

### Pitfall 6: Hardcoded Currencies/Locales
**What goes wrong:** Assuming `$` or `.` for decimals.
**Prevention:** Use `Intl.NumberFormat` for all price displays. Store amounts as integers (cents/satang) or high-precision decimals.

## Sources
*   **Inventory:** "Types of Fact Table (Transaction vs Snapshot)" - Wisdom Schema
*   **Browser Support:** [Can I use: WebUSB](https://caniuse.com/webusb)
