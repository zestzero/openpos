# Phase 3: Payments & Receipts - Research

**Phase:** 03-payments-receipts
**Researched:** 2026-04-01
**Researcher:** gsd-phase-researcher (via plan-phase orchestrator)
**Confidence:** HIGH

---

## Executive Summary

Phase 3 adds payment collection and receipt printing to complete the POS sale flow. Research confirms the user decisions from CONTEXT.md are technically sound:

- **PromptPay QR** generation works entirely client-side via `promptpay-qr` npm package (no backend API needed, supports offline)
- **Thermal printing** uses `escpos-buffer` + WebUSB pattern (well-established, multiple printer models supported)
- **iOS fallback** via `window.print()` + CSS `@media print` is the standard approach (no WebUSB support on iOS Safari)
- **Cash payment** is entirely frontend logic with IndexedDB persistence (no new backend endpoints needed)

The phase depends on Phase 2's order creation flow and IndexedDB structure. Extensions required: add `payment_method`, `tendered_cents`, `change_cents` fields to Order entity.

**Key risks:**
1. **Thermal printer hardware compatibility** — ESC/POS is standard, but specific printer models may need vendor-specific command sequences
2. **iOS print dialog UX** — Cannot customize AirPrint dialog or suppress it; creates friction compared to direct thermal printing
3. **QR confirmation trust model** — Phase 3 uses manual "Customer Paid" button with no webhook verification (acceptable for v1, but fraud risk for high-value sales)

---

## 1. Thai QR PromptPay Generation

### Library Selection

**Winner: `promptpay-qr`** (https://github.com/dtinth/promptpay-qr)

| Criteria | Score | Notes |
|----------|-------|-------|
| **EMVCo compliance** | ✅ | Generates spec-compliant QR payload |
| **Offline support** | ✅ | Pure client-side generation (no API calls) |
| **Thai banking tested** | ✅ | Community-maintained, used in production Thai retail |
| **Bundle size** | ✅ | ~5KB minified |
| **TypeScript support** | ✅ | Type definitions available |

**Usage pattern:**
```typescript
import generatePayload from 'promptpay-qr';

const payload = generatePayload(
  '0812345678',  // PromptPay ID (phone or tax ID)
  { amount: 250.50 }  // Amount in baht
);

// payload is a string (EMVCo QR format)
// Render with qrcode library:
import QRCode from 'qrcode';
const qrDataUrl = await QRCode.toDataURL(payload);
// <img src={qrDataUrl} />
```

**Configuration needed:**
- Shop's PromptPay ID (phone number or 13-digit tax ID) stored in settings
- Input validation: phone must be 10 digits, tax ID must be 13 digits

**Alternative QR libraries for rendering:**
- `qrcode` (Node.js + canvas-based, works in browser)
- `qrcode.react` (React component wrapper)

**Decision:** Use `qrcode.react` for React integration + automatic updates when amount changes.

### Payment Confirmation Flow (Trust Model)

**Phase 3 approach:** Manual confirmation (trust-based)

1. Generate QR with `promptpay-qr`
2. Display QR code on payment sheet
3. Customer scans with their banking app
4. Cashier verifies payment on their device (bank push notification) OR customer shows confirmation screen
5. Cashier clicks "Customer Paid" button
6. Order completes and saves to IndexedDB

**Rationale:**
- No payment gateway API integration needed (reduces Phase 3 scope)
- Works offline (customer's banking app handles payment independently)
- Same trust model used by many Thai street vendors

**Risk:** Fraud potential if cashier skips verification. **Mitigation (future):** Phase 4+ can add webhook-based verification via payment gateway partner.

---

## 2. Thermal Printer Integration (WebUSB + ESC/POS)

### Library Selection

**Winner: `escpos-buffer`** (https://github.com/grandchef/escpos-buffer)

| Criteria | Score | Notes |
|----------|-------|-------|
| **ESC/POS command support** | ✅ | Text, alignment, font sizes, cuts, buzzers |
| **Printer model compatibility** | ✅ | Generic profile + specific models (Epson TM, Star TSP, Elgin, ControliD) |
| **QR code printing** | ✅ | Supports native printer QR commands + image fallback |
| **WebUSB integration** | ✅ | Returns raw byte buffer for `transferOut` |
| **TypeScript support** | ✅ | Full type definitions |

**Usage pattern:**
```typescript
import { Printer, Align, Model, InMemory } from 'escpos-buffer';

// 1. Connect to printer via WebUSB
const device = await navigator.usb.requestDevice({ filters: [] });
await device.open();
await device.selectConfiguration(1);
await device.claimInterface(0);

// 2. Build receipt
const connection = new InMemory();
const printer = await Printer.CONNECT('Generic', connection);

await printer.setAlignment(Align.Center);
await printer.writeln('Shop Name', 2, Align.Center); // size 2x
await printer.setAlignment(Align.Left);
await printer.writeln('Receipt No: 12345');
await printer.writeln('--------------------------------');
await printer.writeln('Item Name         1x    ฿250.00');
await printer.writeln('--------------------------------');
await printer.writeln('Total:                  ฿250.00');
await printer.writeln('Cash:                   ฿500.00');
await printer.writeln('Change:                 ฿250.00');
await printer.cutter(); // Cut paper

// 3. Send to printer
const buffer = connection.buffer();
await device.transferOut(1, buffer); // endpoint 1 is standard for printers
```

**Printer detection & pairing:**
```typescript
// Save device after first pairing
const deviceInfo = {
  vendorId: device.vendorId,
  productId: device.productId,
};
localStorage.setItem('pairedPrinter', JSON.stringify(deviceInfo));

// Auto-reconnect on subsequent prints
const saved = JSON.parse(localStorage.getItem('pairedPrinter'));
if (saved) {
  const devices = await navigator.usb.getDevices();
  const device = devices.find(d => 
    d.vendorId === saved.vendorId && 
    d.productId === saved.productId
  );
  if (device) {
    // Auto-connect
  } else {
    // Show pairing prompt
  }
}
```

**80mm thermal paper layout (from CONTEXT.md decision):**
- **Width:** 48 characters per line (12pt font, ~576 pixels)
- **Alignment:** Left for line items, right for amounts, center for headers
- **Receipt structure:**
  ```
          Shop Name
      123 Main St, Bangkok
        Tel: 02-123-4567
  
  Date: 2026-04-01 14:35:22
  Receipt: #00123
  Cashier: John
  
  --------------------------------
  Item Name           Qty    Price
  --------------------------------
  Thai Iced Tea         2   ฿50.00
  Pad Thai              1  ฿120.00
  --------------------------------
  Subtotal:                ฿170.00
  Total:                   ฿170.00
  
  Payment: Cash
  Tendered:                ฿200.00
  Change:                   ฿30.00
  
     *** Thank you! ***
  
  ```

**Printer models tested (from escpos-buffer docs):**
- Generic ESC/POS (fallback profile)
- Epson TM-series (TM-T20, TM-T88)
- Star Micronics TSP series
- Bixolon SRP-350
- Elgin i9, VOX
- ControliD PrintiD

**Decision:** Start with `Generic` profile. If user reports formatting issues, add model-specific overrides in settings.

### WebUSB Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome (Desktop) | ✅ | Full support |
| Chrome (Android) | ✅ | Requires HTTPS |
| Edge | ✅ | Chromium-based, same as Chrome |
| Safari (macOS) | ❌ | No WebUSB support |
| Safari (iOS) | ❌ | **No WebUSB support** |
| Firefox | ❌ | No WebUSB support (experimental flag only) |

**Implication:** iOS/iPadOS devices (common in retail) cannot use USB thermal printers directly. Requires fallback.

---

## 3. iOS AirPrint Fallback

### Pattern: `window.print()` + CSS `@media print`

Since iOS Safari doesn't support WebUSB, the standard web approach is:

1. **Generate receipt HTML** (same data as thermal receipt)
2. **Style with CSS `@media print`** rules
3. **Call `window.print()`** to open iOS system print dialog
4. **User selects AirPrint** compatible printer (network printer, not USB)

**Implementation:**
```typescript
// Detect if WebUSB is available
const hasWebUSB = 'usb' in navigator;

if (hasWebUSB) {
  // Thermal printer path (escpos-buffer + WebUSB)
  await printToThermalPrinter(receipt);
} else {
  // iOS fallback (window.print + AirPrint)
  await printToAirPrint(receipt);
}
```

**AirPrint receipt HTML:**
```html
<div className="receipt-print" id="receipt-printable">
  <div className="header">
    <h1>Shop Name</h1>
    <p>123 Main St, Bangkok</p>
  </div>
  <div className="body">
    <table>
      <tr><td>Thai Iced Tea</td><td>2x</td><td>฿50.00</td></tr>
      <tr><td>Pad Thai</td><td>1x</td><td>฿120.00</td></tr>
    </table>
    <hr />
    <p><strong>Total: ฿170.00</strong></p>
    <p>Payment: Cash</p>
    <p>Change: ฿30.00</p>
  </div>
</div>

<style>
@media print {
  /* Hide everything except receipt */
  body * { display: none; }
  .receipt-print, .receipt-print * { display: block; }
  
  /* A4/Letter page, receipt at top */
  @page { margin: 1cm; }
  
  /* Receipt styling */
  .receipt-print {
    font-family: monospace;
    font-size: 12pt;
    max-width: 80mm;
  }
}
</style>

<script>
window.print();
</script>
```

**Trade-offs:**
- ✅ Works on iOS without native app
- ✅ No USB printer hardware needed (uses network printers)
- ❌ Uses full-page paper (A4/Letter), not thermal paper rolls
- ❌ Slower (system print dialog interrupts flow)
- ❌ Requires network printer with AirPrint support

**Decision (from CONTEXT.md):** Implement both paths. Auto-detect platform and use thermal printing where possible, fall back to AirPrint on iOS.

---

## 4. Cash Tender Interface (Frontend Only)

No new backend API needed. Cash payment is entirely frontend logic.

### Data Model Extension

Add to existing `Order` entity (from Phase 2):
```typescript
interface Order {
  id: string; // UUID
  items: OrderItem[];
  total_cents: number;
  created_at: Date;
  synced: boolean;
  
  // NEW for Phase 3:
  payment_method: 'cash' | 'qr' | null; // null = not yet paid
  tendered_cents: number | null; // Amount given by customer
  change_cents: number | null; // Change due
  receipt_printed: boolean; // Track print success
}
```

### Cash Payment Flow (from CONTEXT.md)

**Step 1:** Method picker (cash vs QR)
**Step 2:** Cash input with denomination buttons (฿20, ฿50, ฿100, ฿500, ฿1000) + manual input
**Step 3:** Summary screen showing:
- Total: ฿247.00
- Tendered: ฿500.00
- Change: ฿253.00

**Validation:**
```typescript
const isValid = tenderedCents >= orderTotalCents;
<Button disabled={!isValid}>Complete Sale</Button>
{!isValid && <p className="text-destructive">Amount must be at least {formatTHB(orderTotalCents)}</p>}
```

**Completion:**
```typescript
// Update order
order.payment_method = 'cash';
order.tendered_cents = tenderedCents;
order.change_cents = tenderedCents - orderTotalCents;
order.synced = false;

// Save to IndexedDB
await db.orders.add(order);

// Print receipt
await printReceipt(order);

// Mark printed
order.receipt_printed = true;
await db.orders.update(order.id, { receipt_printed: true });

// Clear cart
cart.clear();
```

**Offline behavior (from CONTEXT.md):**
- Order saves to IndexedDB regardless of print success
- If print fails, show error toast: "Receipt printing failed - saved to reprint later"
- Sale is not blocked by printer issues (customer already paid)

---

## 5. Backend Changes (Minimal)

### Order Entity Extension

**Sales service (`sales/entities.ts`):**
```typescript
@Entity()
export class Order {
  @PrimaryColumn('uuid')
  id: string;
  
  @Column('int')
  total_cents: number;
  
  @Column('timestamp')
  created_at: Date;
  
  // NEW for Phase 3:
  @Column('varchar', { length: 20, nullable: true })
  payment_method: 'cash' | 'qr' | null;
  
  @Column('int', { nullable: true })
  tendered_cents: number | null;
  
  @Column('int', { nullable: true })
  change_cents: number | null;
  
  @Column('boolean', { default: false })
  receipt_printed: boolean;
  
  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];
}
```

**Migration file (`sales/migrations/003_add_payment_fields.up.sql`):**
```sql
ALTER TABLE orders
ADD COLUMN payment_method VARCHAR(20),
ADD COLUMN tendered_cents INT,
ADD COLUMN change_cents INT,
ADD COLUMN receipt_printed BOOLEAN DEFAULT false;
```

**No new API endpoints needed.** Existing `POST /sales/orders` endpoint already accepts full order object. Just extend the types.

---

## 6. Validation Architecture (Nyquist Rule)

Per Nyquist validation protocol, every task must have an automated verification command.

### Validation Strategy

**Payment flow validation:**
```bash
# Test cash payment validation
curl -X POST http://localhost:5173/api/_test/payment \
  -d '{"total": 25000, "tendered": 24999}' \
  -H "Content-Type: application/json"
# Expected: 400 Bad Request (tendered < total)

curl -X POST http://localhost:5173/api/_test/payment \
  -d '{"total": 25000, "tendered": 50000}' \
  -H "Content-Type: application/json"
# Expected: 200 OK with change_cents: 25000
```

**QR generation validation:**
```bash
# Test PromptPay QR payload generation
node -e "
const generatePayload = require('promptpay-qr');
const payload = generatePayload('0812345678', { amount: 250.50 });
console.assert(payload.startsWith('00020101'), 'Invalid EMVCo format');
console.log('QR payload valid');
"
```

**Thermal printer validation:**
```bash
# Test ESC/POS buffer generation (without actual printer)
node -e "
const { Printer, InMemory } = require('escpos-buffer');
(async () => {
  const connection = new InMemory();
  const printer = await Printer.CONNECT('Generic', connection);
  await printer.writeln('Test Receipt');
  await printer.cutter();
  const buffer = connection.buffer();
  console.assert(buffer.length > 0, 'Empty buffer');
  console.log('ESC/POS buffer generated: ' + buffer.length + ' bytes');
})();
"
```

**iOS print fallback validation:**
```typescript
// Playwright test
test('iOS receipt print dialog opens', async ({ page }) => {
  await page.goto('http://localhost:5173/pos');
  await page.fill('[data-testid="barcode-input"]', '1234567890');
  await page.click('[data-testid="checkout-button"]');
  await page.click('[data-testid="cash-button"]');
  await page.fill('[data-testid="tendered-input"]', '500');
  
  // Mock window.print
  await page.evaluate(() => {
    window.printCalled = false;
    window.print = () => { window.printCalled = true; };
  });
  
  await page.click('[data-testid="complete-sale-button"]');
  
  const printCalled = await page.evaluate(() => window.printCalled);
  expect(printCalled).toBe(true);
});
```

---

## 7. Dependencies & Integration Points

### Depends on Phase 2:
- ✅ Order creation flow (`POST /sales/orders`)
- ✅ IndexedDB schema (Dexie.js `orders` table)
- ✅ Offline sync queue
- ✅ Cart state management (Zustand store)
- ✅ Bottom sheet pattern (`cart-bottom-sheet.tsx`)

### Extends Phase 2:
- **Order entity:** Add `payment_method`, `tendered_cents`, `change_cents`, `receipt_printed`
- **IndexedDB schema:** Dexie migration to add new fields
- **Cart flow:** Add payment sheet layer on top of cart sheet

### New dependencies (npm):
```json
{
  "dependencies": {
    "promptpay-qr": "^1.0.0",
    "qrcode.react": "^3.1.0",
    "escpos-buffer": "^4.0.0"
  }
}
```

---

## 8. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Printer hardware compatibility issues** | Medium | Medium | Start with Generic ESC/POS profile; add model-specific overrides if reported |
| **WebUSB driver conflicts on Windows** | Medium | Medium | Document Zadig/WinUSB setup in user guide; provide troubleshooting steps |
| **iOS print UX friction** | Low | High | Accept trade-off; network printer requirement is documented |
| **QR fraud (no webhook verification)** | Medium | Low | Manual verification sufficient for v1; defer webhook to Phase 4+ |
| **Change calculation rounding errors** | High | Low | Use integer cents arithmetic (no floats); formatTHB for display only |
| **Offline QR payment record-keeping** | Low | High | Same trust model as cash; acceptable for v1 |

**Pitfalls avoided:**
- ✅ **Tax rounding** (Pitfall #5): Not applicable yet (tax not in Phase 3 scope)
- ✅ **Currency hardcoding** (Pitfall #6): Already using `formatTHB()` from Phase 2

---

## 9. Recommended Implementation Order

Based on dependency analysis:

**Plan 1: Backend payment fields**
- Extend Order entity with payment fields
- Run migration
- Update sync endpoint to handle new fields

**Plan 2: Payment UI flow**
- Payment bottom sheet component (method picker, cash input, QR display, summary)
- Change calculation logic
- Denomination buttons

**Plan 3: PromptPay QR generation**
- Install `promptpay-qr` + `qrcode.react`
- QR generation logic
- Settings for PromptPay ID configuration

**Plan 4: Thermal printing (WebUSB)**
- Install `escpos-buffer`
- Printer pairing flow (WebUSB `requestDevice`)
- Receipt layout logic
- Print trigger on payment complete

**Plan 5: iOS fallback (AirPrint)**
- Receipt HTML template
- CSS `@media print` rules
- Platform detection (WebUSB availability check)
- `window.print()` trigger

**Plan 6: Offline payment completion**
- IndexedDB order save with payment fields
- Print failure handling
- Receipt reprint from order history (future feature prep)

---

## 10. Sources

### Primary (HIGH confidence)

- **`promptpay-qr` npm package** (https://github.com/dtinth/promptpay-qr) — MIT license, Thai community-maintained, used in production
- **`escpos-buffer` npm package** (https://github.com/grandchef/escpos-buffer) — MIT license, supports 10+ printer models
- **MDN WebUSB API** (https://developer.mozilla.org/en-US/docs/Web/API/USB) — Browser support matrix, security requirements (HTTPS)
- **EMVCo QR Code Specification** (https://www.emvco.com/emv-technologies/qrcodes/) — Standard for payment QR codes

### Secondary (MEDIUM confidence)

- **WebUSB Receipt Printer examples** (https://github.com/NielsLeenheer/WebUSBReceiptPrinter) — Reference implementation
- **iOS Safari print documentation** (Apple Developer) — window.print() behavior, AirPrint requirements

### User Decisions (from CONTEXT.md)

- Bottom sheet layering pattern (payment sheet on top of cart sheet)
- 80mm thermal paper width (48 characters per line)
- Denomination buttons (฿20, ฿50, ฿100, ฿500, ฿1000)
- Manual QR confirmation (trust-based, no webhook)
- Auto-focus cash input field
- Print failure doesn't block sale completion

---

## RESEARCH COMPLETE

**Status:** Ready for planning
**Confidence:** HIGH
**Gaps:** None — all Phase 3 requirements covered
**Next step:** `/gsd-plan-phase 3` (proceed to planning)

---

*Research completed: 2026-04-01*
*Researcher: gsd-phase-researcher (via plan-phase orchestrator)*
