---
id: S02-UAT
parent: S02
milestone: M001
written: 2026-04-03T18:06:40Z
---

# S02: POS Frontend Offline — UAT

**Milestone:** M001
**Written:** 2026-04-03T18:06:40Z

## UAT Type

- **UAT mode:** live-runtime + artifact-driven
- **Why this mode is sufficient:** S02 is a greenfield slice with no existing baseline. The POS is a live React app that must be tested in the browser (real barcode scanning, cart interactions, offline behavior). Component-level artifact verification (code review of Dexie.js schema, sync queue logic) supplements live UAT. No human user acceptance needed at MVP stage — technical UAT is sufficient.

## Preconditions

1. **Backend is running:** Encore dev server started (`cd backend && npm run dev` or `encore run`), listening on http://localhost:3000
2. **Frontend is running:** Vite dev server started (`cd frontend && npm run dev`), listening on http://localhost:5173
3. **Auth token obtained:** Log in via cashier PIN (e.g., PIN 1234 or similar per S01 auth service) to get JWT token
4. **Catalog populated:** S01 created products, variants, categories. Query `GET /catalog/products` to confirm data exists
5. **DevTools open:** Browser DevTools (F12) with Application tab for IndexedDB, Network, Console inspection
6. **Network throttling ready:** DevTools → Network tab → set to "Offline" to simulate no connectivity

## Smoke Test

1. Navigate to http://localhost:5173 → see POS login screen
2. Log in with PIN (e.g., 1234) → JWT token appears in localStorage
3. See product catalog (categories, search bar, product grid)
4. Tap a product → item appears in cart summary bar at bottom
5. Tap cart summary bar → bottom sheet slides up showing cart with quantity controls
6. Go offline (DevTools → Network → Offline) → amber "offline" banner appears at top
7. Come back online → banner disappears, sync status indicator shows "synced"

**Expected outcome:** All visible, no console errors, app is responsive.

## Test Cases

### 1. Product Browsing & Search

**Purpose:** Verify POS-03 (category browsing) and POS-04 (search by name/SKU)

1. Navigate to http://localhost:5173 → login with PIN
2. Observe category tabs (All, Category1, Category2, ...) at the top
3. Tap "Category1" → product grid updates to show only products in that category
4. Tap "All" → all products reappear
5. Tap search bar, type "shirt" (or partial product name)
6. **Expected:** Product grid filters to matching items; typing triggers `searchProducts` API call visible in Network tab

### 2. Barcode Scanning (Camera)

**Purpose:** Verify POS-01 (camera barcode scanning)

1. Ensure a product has a barcode assigned (e.g., variant SKU "TEST123")
2. Tap the "Scan" button (next to search bar, camera icon)
3. A camera scan dialog opens
4. **On desktop without camera:** html5-qrcode fallback opens — you can paste a barcode code or open from image
5. **On mobile with camera:** Camera preview opens, point at a barcode
6. When barcode is detected (or manual entry confirmed):
   - Dialog closes automatically
   - Item appears in cart summary bar
   - Cart count badge increments
7. **Expected:** Barcode lookup finds variant by SKU or barcode code, adds to cart with correct product name and price

### 3. Keyboard-Wedge Scanner Simulation

**Purpose:** Verify POS-02 (USB keyboard-wedge scanner detection)

1. Open browser Console (DevTools → Console tab)
2. Paste JavaScript to simulate rapid keystrokes (keyboard wedge scan):
   ```javascript
   const scanCode = 'TEST123';
   for (let char of scanCode) {
     const event = new KeyboardEvent('keydown', { key: char, bubbles: true });
     document.dispatchEvent(event);
   }
   // Then send Enter
   const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
   document.dispatchEvent(enterEvent);
   ```
3. **Expected:** Cart item appears (same product as barcode scan test). Keystrokes invisible to UI (no text input focus required).

### 4. Cart Add/Remove/Quantity Adjust

**Purpose:** Verify POS-05 (cart management)

1. Add 2+ different products (via tap or scan)
2. Observe cart summary bar: count shows 2, total is formatted in THB (฿X.XX)
3. Tap cart summary bar → bottom sheet slides up
4. For each line item, observe:
   - Product name and price visible
   - Minus button, quantity input, Plus button
5. Tap Plus → quantity increments, total recalculates
6. Tap Minus → quantity decrements, total recalculates
7. Tap Minus when qty=1 → item is removed from cart
8. Tap Clear (destructive button) → all items removed, cart empty state shows ("No items in cart")
9. **Expected:** All calculations correct, cart state persists (refresh page → items still there due to localStorage + Zustand)

### 5. Favorites Bar & One-Tap Add

**Purpose:** Verify POS-06 (favorites)

1. Add a product to cart normally (via tap or search)
2. Cart bottom sheet is open; look for a pin/heart/star icon on the product or a "favorite" button
   - (Implementation detail: check T06 code for exact UI)
3. Tap to add to favorites → item appears in favorites bar (horizontal scroll strip at top of product grid)
4. Tap the favorited item in the favorites bar → item is added to cart immediately (no sheet open needed)
5. Scroll favorites bar horizontally → more favorited items visible
6. Refresh page → favorites bar still shows pinned items (persisted via localStorage)
7. **Expected:** Favorites are one-tap add, persisted across sessions, distinct from cart

### 6. Online Sale Completion

**Purpose:** Verify direct POST /sales/orders when online (OFF-01 partial, online path)

1. Ensure online (DevTools → Network tab, not set to Offline)
2. Add 2-3 items to cart
3. Open cart bottom sheet
4. Tap "Complete Sale" button
5. Observe Network tab → POST request to http://localhost:3000/sales/orders
6. **Expected:** 
   - Request body contains `{order_id: UUID, items: [{variant_id, quantity, price_cents}]}`
   - Response is 200 OK with order object
   - Cart clears after success
   - Toast shows "Sale completed" or similar (per T06 implementation)

### 7. Offline Sale Completion & Sync

**Purpose:** Verify OFF-01, OFF-02, OFF-03, OFF-04 (offline order creation, queuing, exponential backoff retry, delta sync)

1. Open cart with 2-3 items
2. Go offline: DevTools → Network tab → set to "Offline"
3. Amber offline banner appears at top
4. Tap "Complete Sale" button
5. **Expected behavior:**
   - POST to /sales/orders fails (network error)
   - `enqueueOrder` called instead
   - Order is stored in IndexedDB `syncQueue` table (verify: DevTools → Application → IndexedDB → openpos_frontend → syncQueue)
   - Cart clears (order accepted locally)
   - Sync status indicator shows "1 pending" or similar (count of queued orders)
6. Verify order stored in offline database:
   - DevTools → Application → IndexedDB → openpos_frontend → orders
   - Order has `order_id` UUID, items with `variant_id` + `quantity` (delta format, not absolute stock)
7. Come back online: DevTools → Network → set to "Online"
8. **Expected:**
   - Sync status indicator automatically triggers `processSyncQueue`
   - Network tab shows POST to /sales/orders
   - Response is 200 OK
   - Sync status indicator returns to "synced" or "0 pending"
   - Order is removed from `syncQueue` table (IndexedDB) after successful sync
9. Verify stock was deducted correctly:
   - Query `GET /inventory/variants/:variant_id/stock` → verify current stock is lower by `quantity` (delta operation, not absolute value)
10. **Expected:** All OFF-01 through OFF-04 requirements verified

### 8. Exponential Backoff Retry

**Purpose:** Verify OFF-03 (sync retries with exponential backoff)

1. Add item to cart, go offline, complete sale → order is queued
2. Come online, but before sync completes, simulate a network error:
   - DevTools → Network tab → Mock `/sales/orders` endpoint to respond with 500 (Server Error)
   - Trigger sync manually via Console: `processSyncQueue(apiClient)`
3. **Expected:**
   - First retry after 1s (no console sleep; backoff is async)
   - Next retry after 2s (if still failing)
   - Pattern continues: 4s, 8s, 16s
   - After 5 failed attempts, retry stops
   - Order remains in `syncQueue` as "failed"
4. Clear the mock error (set Network back to normal), manually trigger sync again
5. **Expected:** Order syncs successfully on next attempt

### 9. PWA & Service Worker Caching

**Purpose:** Verify PLAT-04 (PWA with service worker)

1. Load http://localhost:5173 in a fresh tab
2. DevTools → Application → Service Workers → verify `sw.js` is registered and active (green "activated")
3. DevTools → Cache Storage → should see cache(s) for static assets
4. Navigate to a few pages (product grid, search, etc.) to warm up caches
5. Open DevTools → Network tab, set to "Offline"
6. **Expected:**
   - Main page still loads (navigation fetched from cache with SPA fallback)
   - Static assets (CSS, JS, fonts) load from cache
   - Product catalog API calls fail (Network tab shows error), but UI renders cached products
7. Set Network back to "Online"
8. **Expected:** Normal operation resumes

### 10. THB Currency Formatting

**Purpose:** Verify PLAT-05 (all monetary values in THB)

1. Navigate to product grid
2. Observe product prices: should display as "฿25.00" (Thai Baht symbol, 2 decimal places)
3. Add items to cart, observe:
   - Line item subtotal: "฿25.00 × 2 = ฿50.00"
   - Cart summary bar: "฿X.XX"
   - Cart bottom sheet total: "฿X.XX"
4. **Expected:** Consistent THB formatting everywhere (no USD, no unformatted numbers)

### 11. Auth Token & JWT Persistence

**Purpose:** Verify AUTH-02 (stay logged in across sessions)

1. Log in with PIN → JWT token appears in localStorage
2. DevTools → Application → Local Storage → {origin} → see "auth_token"
3. Parse the token: Copy the token, go to jwt.io, paste to verify:
   - Payload contains `user_id`, `role`, `exp` (expiry)
   - Token is valid (not expired)
4. Refresh page (Cmd+R) → POS screen is still visible (no redirect to login)
5. Close and reopen browser tab → still logged in
6. Check localStorage again → auth_token still present
7. **Expected:** Session persists across page reloads and browser restarts (until token expiry)

### 12. Route-Based Separation

**Purpose:** Verify PLAT-01 (single SPA with route-based POS/ERP separation)

1. Navigate to http://localhost:5173 → redirected to http://localhost:5173/pos
2. In browser Console, check `window.location.pathname` → should be `/pos`
3. Verify TanStack Router is active (no full page reloads between POS pages)
4. **Expected:** Single app, not two separate applications; route-based navigation is instant (SPA)

## Edge Cases

### Offline Barcode Scan (Catalog Not Cached)

1. Go offline, tap scan button
2. html5-qrcode loads but has no camera (offline)
3. Barcode lookup hits API → fails (no network)
4. **Expected:** Toast error "Barcode not found" or "Network error"
5. **Note:** This is a known limitation (catalog not cached on login). See S02-SUMMARY.md Known Limitations #1.

### Duplicate Order Idempotency

1. Complete a sale online, observe order_id in Network tab request (e.g., "550e8400-...")
2. Immediately retry the same POST with same order_id by re-triggering the request:
   - DevTools → Network → right-click POST /sales/orders → "Copy as cURL"
   - Paste in terminal/Postman
3. **Expected:** 200 OK response with existing order (no duplicate created)
4. Verify: `GET /sales/orders` shows only 1 order with that ID (not 2)

### Stock Insufficient on Sync

1. Add 100 units of a product to cart (assuming stock < 100)
2. Go offline, complete sale → order queued with qty=100
3. Come online, other cashier sells the same product (stock now exhausted)
4. Your offline order syncs → POST /sales/orders with qty=100
5. Backend `createLedgerEntry` called with delta=-100 → insufficient stock check fails
6. **Expected:** 
   - POST responds with error (e.g., 400 Bad Request)
   - Sync queue retries with exponential backoff
   - Order remains in `syncQueue` as "failed"
   - **Note:** Frontend shows no warning during checkout. This is a known limitation; S03 will add pre-checkout stock validation.

### Multi-Tab Offline Sync (Advanced)

1. Open POS in two browser tabs
2. In Tab 1, add item + complete sale (online) → order syncs immediately
3. In Tab 2, add item + go offline + complete sale → order queued
4. In Tab 1, check sync status indicator → should show 0 pending (Tab 1's sale is synced)
5. In Tab 2, come online → should show "1 pending", then "synced"
6. Verify both orders exist: `GET /sales/orders` should list 2 orders
7. **Expected:** Each tab manages its own cart + sync state (no cross-tab synchronization yet; this is acceptable for MVP)

## Failure Signals

- **Backend not running:** /sales/orders POST fails with connection refused → offline fallback works, but online sales fail
- **Auth token invalid/expired:** API calls return 401 Unauthorized → re-login required
- **Service worker not registered:** DevTools → Application → Service Workers shows "No active service workers" → offline caching doesn't work
- **Dexie.js IndexedDB broken:** IndexedDB quota exceeded or quota unavailable (Safari private mode) → offline order creation fails, sync queue doesn't queue
- **Barcode scanner not working:** Scan button doesn't open dialog or camera permission denied → fallback doesn't work
- **Cart doesn't persist:** Refresh page → cart is empty (localStorage/Zustand not persisting) → critical bug
- **THB formatting broken:** Prices show as "25.00" instead of "฿25.00" → PLAT-05 requirement not met
- **Offline banner doesn't appear:** Go offline, no amber banner shown → useOnlineStatus hook not working
- **Sync status indicator doesn't update:** pendingCount always 0 even with queued orders → polling or getPendingSyncCount broken

## Requirements Proved By This UAT

- **POS-01** — Test case #2 (Barcode scanning via camera + fallback)
- **POS-02** — Test case #3 (Keyboard-wedge scanner simulation)
- **POS-03** — Test case #1 (Category browsing)
- **POS-04** — Test case #1 (Search by name)
- **POS-05** — Test case #4 (Cart add/remove/quantity)
- **POS-06** — Test case #5 (Favorites bar)
- **POS-07** — Test case #4 (Cart totals in THB)
- **OFF-01** — Test case #7 (Offline sale completion)
- **OFF-02** — Test case #7 (Sync when reconnected)
- **OFF-03** — Test case #8 (Exponential backoff retry)
- **OFF-04** — Test case #7 (Delta-based stock deduction)
- **PLAT-01** — Test case #12 (Route-based SPA)
- **PLAT-04** — Test case #9 (Service worker caching)
- **PLAT-05** — Test case #10 (THB currency)
- **AUTH-02** — Test case #11 (Session persistence)

## Not Proved By This UAT

- **Payment flows** (PAY-01, PAY-02, PAY-03, REC-01/02/03) — S02 does not include payment UI. S03 will test these.
- **ERP backoffice** — S02 is POS only. ERP (products, inventory mgmt) was in S01; S03+ will extend.
- **Performance/load testing** — UAT covers correctness, not scalability. 100s of items, 1000s of orders, concurrent users not tested.
- **Cross-browser compatibility** — UAT assumes Chrome/Firefox/Safari. Mobile browser quirks (e.g., camera permission, iOS AirPrint) not fully tested in UAT; manual testing on target devices needed.
- **Accessibility (a11y)** — UAT does not verify WCAG compliance. Code review of shadcn/ui components suggests good defaults, but focus management, keyboard navigation not fully tested.
- **Multi-device sync** — UAT assumes single device. Two registers syncing the same order, inventory conflicts, not tested.

## Notes for Tester

1. **Offline simulation is manual in UAT.** DevTools → Network → "Offline" toggles connectivity. This is realistic for testing; actual offline scenario (no WiFi/LTE) is harder to replicate in dev environment.

2. **Barcode scanner depends on browser API.** BarcodeDetector API is available on Chrome/Edge (Chromium) but not Safari or Firefox. html5-qrcode fallback is tested, but native barcode detection only works on Chromium. This is expected per POS-01 spec.

3. **Service worker requires HTTPS or localhost.** Dev server on localhost:5173 works; deployed HTTPS will require valid HTTPS. Browser will block sw.js registration on HTTP.

4. **localStorage is per-origin.** If testing across multiple ports or domains, auth tokens and cart data are isolated. Not a real issue in production, but confusing in multi-tab dev testing.

5. **IndexedDB quota is 50MB-100MB depending on browser.** For MVP catalog + order storage, well within limits. Not a blocker but worth noting if future slices add large media storage.

6. **Favorites/cart are stored in localStorage + IndexedDB.** If testing with DevTools → Application → Clear Storage, all app state is wiped. This is intentional (testing full reset), not a bug.

7. **Sync queue is sequential (not parallel).** Orders sync one at a time, not all at once. This is intentional (preserves ordering), but makes testing multiple simultaneous offline orders slower (each retries 5 times max, up to 16s backoff).

8. **Keyboard-wedge test is artificial.** Real USB scanner sends raw keystrokes so fast (<50ms) that a human can't perceive them. The test case simulates this; if you type manually, the wedge detector won't trigger (good — prevents accidental data entry).

9. **No pre-made test data.** If S01 didn't create sample products/categories, catalog will be empty. Ensure S01 is complete and products are visible before testing POS browsing.

10. **THB formatting assumes `Intl.NumberFormat` support.** All modern browsers support it; IE 11 does not (but IE is EOL). Not a concern for production POS tablets/phones.

---

*UAT: S02 — POS Frontend Offline*
*Written: 2026-04-03T18:06:40Z*
*12 test cases covering all 14 requirements*
*Edge cases include offline catalog gap, idempotency, stock insufficiency*
