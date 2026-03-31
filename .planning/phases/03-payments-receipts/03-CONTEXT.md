# Phase 3: Payments & Receipts - Context

**Generated:** 2026-03-31  
**Status:** Context captured via `/gsd-discuss-phase 3`

This document captures design decisions for Phase 3 implementation.

---

## 1. Payment Flow UX

### Navigation Pattern
**Decision:** New bottom sheet on top of cart

When cashier taps "Checkout" from cart, a new payment sheet slides up on top of the cart sheet (which stays in background, dimmed). Consistent with Phase 2's layered bottom-sheet pattern. Natural on mobile.

**Implementation notes:**
- Cart sheet (`cart-bottom-sheet.tsx`) stays mounted in background
- Payment sheet rendered as separate `<Sheet>` component
- Z-index layering: payment sheet > cart sheet > catalog

---

### Payment Method Selection
**Decision:** Method picker first

Payment sheet opens with two large buttons: "Cash" and "QR PromptPay". Tap one to proceed to that payment type's input screen.

**Implementation notes:**
- Initial payment sheet content: method picker (2 buttons)
- After selection, sheet content transitions to payment input screen
- Clear visual separation between method types

---

### Back Button Behavior
**Decision:** Close payment, return to cart

When cashier taps back or closes payment sheet, it closes and returns to cart sheet (still open underneath). Allows corrections without losing cart context.

**Implementation notes:**
- Standard sheet dismiss behavior (swipe down or tap outside)
- Cart remains fully interactive after payment sheet closes
- No confirmation dialog needed for back action

---

### Payment Completion Flow
**Decision:** Show summary, then confirm

After entering payment details (cash tendered or QR confirmation), show summary screen with:
- Order total
- Payment method
- Tendered amount (cash) or "Payment received" (QR)
- Change due (cash only)

Cashier reviews, then taps "Complete Sale" to finalize.

**Implementation notes:**
- 3-step flow: Method picker → Payment input → Summary + confirm
- Summary is a distinct screen within payment sheet
- "Complete Sale" button only enabled when valid

---

### Error Handling During Payment
**Decision:** Inline error with retry

Show error message directly in payment sheet (red text below input). Input stays editable, cashier can correct and retry without closing sheet.

**Implementation notes:**
- Validation errors appear below input field
- No modal dialogs or toasts for validation failures
- Error clears when input changes

---

### Payment Sheet Visual Priority
**Decision:** Order total at top

Large, bold display of amount due (e.g., "Total: ฿250.00") at the top of payment sheet, always visible. Input fields below.

**Implementation notes:**
- Matches Phase 2 cart total display pattern
- Use `formatTHB()` helper for consistent formatting
- Total remains visible through all payment steps

---

### Multi-Step Flow Indicators
**Decision:** Step dots/progress bar

Show small dots or progress bar at top of payment sheet indicating "Step 2 of 3". Gives sense of progress through flow.

**Implementation notes:**
- 3 steps: Method selection → Payment input → Confirmation
- Progress indicator at top of sheet, below total
- Minimal visual weight (dots preferred over bar)

---

### Keyboard and Input Focus
**Decision:** Auto-focus with keyboard

When cash payment sheet opens, amount input field auto-focuses and mobile keyboard appears immediately. Fastest entry path.

**Implementation notes:**
- `autoFocus={true}` on cash input field
- Input type `number` or `tel` for numeric keyboard
- Handle keyboard covering content (ensure "Complete Sale" button visible)

---

## 2. Thai QR PromptPay Generation

### QR Code Library and Format
**Decision:** promptpay-qr npm package

Use `promptpay-qr` library (battle-tested, Thai community-maintained). Generates PromptPay-compliant EMVCo QR codes. Works offline (client-side generation).

**Implementation notes:**
```typescript
import generatePayload from 'promptpay-qr';
const payload = generatePayload(mobileNumber, { amount: totalInBaht });
// Render payload as QR code with `qrcode` library
```

**Dependencies:**
- `promptpay-qr` - QR payload generation
- `qrcode` or `qrcode.react` - QR code rendering

**Configuration needed:**
- Shop PromptPay ID (phone number or tax ID) in settings

---

### QR Code Display Location
**Decision:** Replace payment sheet content

When cashier selects "QR PromptPay", payment sheet content transitions to show large QR code (~250-300px). Sheet stays open, maintains payment context.

**Implementation notes:**
- Payment sheet content: Method picker → QR display (replaces content)
- QR code size: 250-300px (scannable from customer's phone)
- Include amount and "Scan to pay" instructions

---

### Payment Confirmation Flow for QR
**Decision:** Manual confirmation button

After showing QR, display "Customer Paid" button. Cashier verifies payment on their device/bank notification (or customer shows confirmation), then taps button to complete sale.

**Implementation notes:**
- Trust-based system (no webhook/polling in v1)
- Button appears below QR code
- Clicking button proceeds to summary screen (per completion flow decision)

**Future enhancement:** Async verification via payment gateway (Phase 4+)

---

### QR Code Error Handling
**Decision:** Block QR option preemptively

On payment sheet open, check if PromptPay ID is configured. If not, gray out/hide QR button entirely. Only show Cash option.

**Implementation notes:**
```typescript
const isQRAvailable = !!shopConfig.promptpayId;
// Render QR button only if isQRAvailable
```

**Fallback:** If QR generation fails despite config check, show error with "Retry" and "Cancel" buttons (return to method picker).

---

## 3. Receipt Printing Strategy

### Printer Detection and Setup
**Decision:** Auto-detect with fallback

Try to auto-connect to previously saved printer on app load. If not found (or first time), show setup prompt when first print is triggered.

**Implementation notes:**
- Save printer device ID to localStorage after first pairing
- On print attempt: try saved device → if fails, show WebUSB picker
- WebUSB `navigator.usb.requestDevice()` for pairing

**User flow:**
1. First sale: "Connect Printer" prompt → WebUSB picker → save device
2. Subsequent sales: auto-connect to saved printer
3. If printer disconnected: show reconnect prompt

---

### ESC/POS Library Selection
**Decision:** escpos-buffer

Use `escpos-buffer` npm package (pure JS, generates ESC/POS byte buffers). Pair with WebUSB for USB communication.

**Implementation notes:**
```typescript
import { Buffer } from 'escpos-buffer';
const buffer = new Buffer();
buffer.text('Store Name').align('center').size(2, 2).feed(2);
const bytes = buffer.encode();
// Send bytes via WebUSB to printer
```

**Dependencies:**
- `escpos-buffer` - ESC/POS command generation

---

### Thermal Printer Paper Width
**Decision:** 80mm only

Design receipt layout for 80mm (3.15") thermal paper. Most common retail format, simplifies implementation.

**Implementation notes:**
- Receipt width: 48 characters per line (80mm, 12pt font)
- ESC/POS commands for 80mm alignment and margins
- If user has 58mm printer, manual configuration in settings (future)

---

### AirPrint Fallback UX
**Decision:** Generate PDF, trigger print dialog

For iOS devices (no WebUSB support), generate receipt as PDF and open iOS native print dialog with AirPrint options.

**Implementation notes:**
- Detect platform: check `navigator.usb` availability
- If WebUSB unavailable (iOS Safari), use PDF generation
- PDF library: `jspdf` or `pdfmake`
- PDF format: A4/Letter with receipt content at top
- Trigger print: `window.print()` or share sheet

**Trade-off:** Uses full-page paper (not thermal paper), but functional on iOS.

---

## 4. Cash Tender Interface

### Input Method for Cash Amount
**Decision:** Preset denomination buttons + input

Show quick buttons for common Thai bills (฿20, ฿50, ฿100, ฿500, ฿1000) above input field. Tap button to set amount, or type custom amount in input.

**Implementation notes:**
- Button grid: 5 denomination buttons (฿20, ฿50, ฿100, ฿500, ฿1000)
- Clicking button fills input field with that amount
- Input field still editable (manual entry for other amounts)
- Layout: buttons above input, stacked or 2-row grid

---

### Change Calculation Display
**Decision:** Summary screen after input

After entering tendered amount, show dedicated summary screen with large "Change Due: ฿253.00" display, plus breakdown (Total, Tendered, Change).

**Implementation notes:**
- Summary screen is 3rd step in payment flow (per completion flow decision)
- Large typography for change amount (primary focus)
- Breakdown:
  - Total: ฿247.00
  - Tendered: ฿500.00
  - Change: ฿253.00
- "Complete Sale" button below breakdown

---

### Handling Insufficient Cash
**Decision:** Disable confirm button + inline error

If tendered < total, "Complete Sale" button stays disabled (grayed out). Red error text shows: "Amount must be at least ฿250.00".

**Implementation notes:**
```typescript
const isValid = tenderedCents >= totalCents;
<Button disabled={!isValid}>Complete Sale</Button>
{!isValid && <p className="text-destructive">Amount must be at least {formatTHB(totalCents)}</p>}
```

**Enforces:** Requirement PAY-03 (sale completes only when tendered ≥ total)

---

### "Exact Change" Shortcut
**Decision:** "Exact" button

Add quick button labeled "Exact" (or shows total amount "฿247") alongside denomination buttons. Tap to auto-fill tendered = order total.

**Implementation notes:**
- Button placement: alongside denomination buttons (or below)
- Label: "Exact" or dynamic "฿{total}"
- Action: `setTendered(orderTotal)` → proceeds to summary (change = ฿0)

---

## 5. Offline Payment Handling

### Offline Cash Payment Behavior
**Decision:** Full offline completion

Cash payment completes entirely offline. Order saved to IndexedDB with payment details (method: "cash", tendered, change). Receipt prints from local data. Syncs to backend when online.

**Implementation notes:**
- No backend dependency for cash payment completion
- Order entity includes:
  - `payment_method: "cash" | "qr"`
  - `tendered_cents: number`
  - `change_cents: number`
- Save to Dexie.js orders table with `synced: false` flag
- Receipt prints from IndexedDB order data

---

### Offline QR Payment Behavior
**Decision:** Generate QR offline, manual confirmation

QR code generated locally (promptpay-qr works offline). Cashier shows QR, customer pays via banking app, cashier confirms manually. Order saved offline, syncs later.

**Implementation notes:**
- QR generation: no API call needed (client-side via promptpay-qr)
- Customer's banking app handles payment (independent of shop's internet)
- Order saved same as cash: to IndexedDB, `synced: false`
- Same trust model as online mode (manual confirmation)

---

### Offline Receipt Printing Behavior
**Decision:** Save order, show error, allow retry

Order completes and saves to IndexedDB regardless of print success. If print fails, show error toast: "Receipt printing failed - saved to reprint later." Mark order "print pending".

**Implementation notes:**
- Order entity includes: `receipt_printed: boolean`
- Print failure flow:
  1. Save order to IndexedDB (`receipt_printed: false`)
  2. Clear cart, show success toast for sale
  3. Show separate error toast: "Receipt printing failed"
- Reprint from order history (future feature)

**Trade-off:** Sale is not blocked by printer issues (customer already paid).

---

### Sync Behavior When Connection Returns
**Decision:** Hybrid auto-sync + manual option

Auto-sync runs when connection detected (service worker). Also provide manual "Sync Now" button for immediate sync on demand.

**Implementation notes:**
- Service worker listens for `online` event
- Auto-sync: POST `/api/sales/sync` with queued orders (where `synced: false`)
- Manual sync: Button in header or settings (shows progress)
- Sync status: Toast on success/failure, show count (e.g., "Synced 12 orders")

**Backend endpoint:**
```
POST /api/sales/sync
Body: { orders: [...orders with payment details...] }
Response: { synced: 12, failed: 0, conflicts: [] }
```

**Conflict handling:** Backend validates (e.g., product still exists, price matches). If mismatch, flag order for review (Phase 4+).

---

## Summary: Key Integration Points

### Frontend (React SPA)
- **Payment sheet component:** New bottom sheet with 3-step flow (method → input → confirm)
- **Cash input:** Denomination buttons + input field, auto-focus
- **QR display:** promptpay-qr + qrcode.react
- **Receipt printing:** escpos-buffer + WebUSB (thermal), jspdf + window.print (iOS)
- **Offline storage:** Dexie.js orders table with payment fields
- **Sync:** Service worker auto-sync + manual button

### Backend (Encore TypeScript)
- **Order entity:** Add `payment_method`, `tendered_cents`, `change_cents`, `receipt_printed`
- **Sync endpoint:** `/api/sales/sync` (batch order upload)
- **Validation:** Enforce `tendered_cents >= total_cents` server-side

### Configuration
- **Shop settings:** PromptPay ID (phone or tax ID) for QR generation
- **Printer pairing:** localStorage saved device ID for WebUSB

---

## Design Tokens & Patterns

Inherited from Phase 2:
- **UI framework:** shadcn/ui + Tailwind
- **Data format:** All monetary values in `_cents` (integer)
- **Formatting:** `formatTHB(priceCents)` via Intl.NumberFormat
- **Sheets:** Bottom sheet pattern for layered UI
- **Toasts:** sonner for notifications
- **Offline:** Dexie.js + service worker delta sync

New for Phase 3:
- **Step indicators:** Dots/progress bar for multi-step flows
- **Denomination buttons:** Quick-tap buttons for Thai baht bills
- **Receipt layout:** 80mm thermal, 48 characters per line, ESC/POS formatted
