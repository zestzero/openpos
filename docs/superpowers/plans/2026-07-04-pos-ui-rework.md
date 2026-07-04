# POS & Stock Adjustment UI Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the POS Selling Floor and Stock Level Adjustment layout to display side-by-side catalog/cart on tablets, simplify checkout, and allow inline stock adjustments.

**Architecture:** 
1. Breakpoint matching in POS shell and main layout will change from `xl` to `md` to make it side-by-side on tablet sizes.
2. Restructure `CartPanel.tsx` to combine Cart, Review, and Payment stages into a single scrollable panel layout.
3. Introduce a custom `InventoryProductCard` component in `pos.inventory.tsx` containing stepper buttons and reason selects that write directly to the page's drafts state.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Radix/shadcn-style primitives.

## Global Constraints
- Preserve `Product -> Variant` data model (products are parents, variants are sellable entities).
- Keep integer money semantics (cents/satang stored as integers, formatted only at presentation).
- All component designs must follow the clean, flattened cards style with no redundant border/shadow nesting.

---

### Task 1: Rework POS Selling Floor Split Breakpoint

**Files:**
- Modify: `frontend/src/routes/pos.tsx`
- Modify: `frontend/src/pos/layout/PosLayout.tsx`

**Interfaces:**
- Consumes: None
- Produces: Sidebar split-view rendering at width >= 768px (`md`), bottom cart bar rendering at width < 768px (`md`).

- [ ] **Step 1: Modify pos.tsx grid columns**
  Change the layout wrapper from `xl` grid to `md` grid.
  Replace:
  ```tsx
  <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.85fr)]">
    <div className="space-y-3">
      <CatalogGrid categoryId={selectedCategory} />
    </div>

    <aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
      <CartPanel />
    </aside>
  </section>
  ```
  With:
  ```tsx
  <section className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
    <div className="space-y-3">
      <CatalogGrid categoryId={selectedCategory} />
    </div>

    <aside className="hidden md:block md:sticky md:top-24 md:self-start">
      <CartPanel />
    </aside>
  </section>
  ```

- [ ] **Step 2: Modify PosLayout.tsx breakpoints**
  In `frontend/src/pos/layout/PosLayout.tsx`, update the bottom cart bar container and sheet wrapper.
  Replace:
  ```tsx
  <div className="safe-area-bottom fixed bottom-24 left-1/2 z-40 w-full max-w-[500px] -translate-x-1/2 px-6 xl:hidden">
  ```
  With:
  ```tsx
  <div className="safe-area-bottom fixed bottom-24 left-1/2 z-40 w-full max-w-[500px] -translate-x-1/2 px-6 md:hidden">
  ```

- [ ] **Step 3: Run verify command**
  Run: `pnpm --dir frontend test -- --run`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/routes/pos.tsx frontend/src/pos/layout/PosLayout.tsx
  git commit -m "feat: adjust POS split view breakpoint to md (768px)"
  ```

---

### Task 2: Simplify Cart & Checkout Panel to Single Screen

**Files:**
- Modify: `frontend/src/pos/components/CartPanel.tsx`

**Interfaces:**
- Consumes: `useCart`, `usePosCheckoutSession`
- Produces: A unified single-pane checkout flow showing list, discount input, payment method selection, and complete order button.

- [ ] **Step 1: Restructure CartPanel.tsx render method**
  Change the step rendering logic so that all controls are rendered on a single screen instead of matching `step === 'cart' | 'review' | 'payment'`.
  Provide state for rendering payment QR / input if checkout is initiated.
  Ensure the cart list stays visible above the checkout options.
  
  ```tsx
  // Merge the render output to a single form layout
  return (
    <div className={compact ? 'relative flex h-full min-h-0 flex-col' : 'rounded-3xl border-none bg-white p-6 shadow-sm'}>
      {/* Title block */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
        ...
      </div>

      <div className="flex flex-col min-h-0 flex-1">
        {/* Cart items list */}
        <div className="max-h-[16rem] overflow-y-auto p-2 border-b border-gray-100">
          {items.map((item) => (
            <CartItemRow key={item.variantId} item={item} onUpdateQuantity={updateQuantity} onRemove={removeItem} compact={compact} />
          ))}
        </div>

        {/* Unified checkout block */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Discount (THB)</span>
            <Input
              type="number"
              inputMode="numeric"
              aria-label="Discount (THB)"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="h-9 w-24 text-right"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              className="h-10 text-xs"
              onClick={() => selectPaymentMethod('cash')}
            >
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'promptpay' ? 'default' : 'outline'}
              className="h-10 text-xs"
              onClick={() => selectPaymentMethod('promptpay')}
            >
              QR Payment
            </Button>
          </div>

          {paymentMethod === 'cash' ? (
            <div className="space-y-1">
              <label className="text-xs font-medium">Tendered amount</label>
              <Input
                type="number"
                value={tenderedInput}
                onChange={(e) => setTenderedInput(e.target.value)}
                className="h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                Change due: {formatCurrency(Math.max(tenderedAmount - grandTotal, 0))}
              </p>
            </div>
          ) : (
            <div className="text-center">
              {promptPayQr && <img src={promptPayQr} alt="QR" className="mx-auto h-32 w-32" />}
            </div>
          )}

          <Button
            className="w-full h-12 bg-brand text-white font-bold rounded-full mt-2"
            onClick={finalizeOrder}
            disabled={!canCompletePayment || isSubmitting}
          >
            {isSubmitting ? 'Completing...' : 'Confirm & Complete'}
          </Button>
        </div>
      </div>
    </div>
  )
  ```

- [ ] **Step 2: Run and verify**
  Run: `pnpm --dir frontend test -- --run`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/pos/components/CartPanel.tsx
  git commit -m "feat: unify CartPanel layout into a single checkout screen"
  ```

---

### Task 3: Implement Inline Stock Adjustment Card

**Files:**
- Create: `frontend/src/pos/components/InventoryProductCard.tsx`
- Modify: `frontend/src/routes/pos.inventory.tsx`

**Interfaces:**
- Consumes: `ProductWithVariants`, `onAdjustmentChange: (variantId: string, quantity: number, reason: string) => void`
- Produces: Custom card with product image/placeholder, name, SKU, current stock, reason select dropdown, and a +/- stepper input.

- [ ] **Step 1: Create InventoryProductCard.tsx**
  ```tsx
  import { useState } from 'react'
  import { Plus, Minus } from 'lucide-react'
  import { formatCurrency } from '@/lib/formatCurrency'
  import type { ProductWithVariants } from '@/lib/api'

  interface InventoryProductCardProps {
    product: ProductWithVariants
    draftQuantity: number
    draftReason: string
    onChange: (variantId: string, quantity: number, reason: any) => void
  }

  export function InventoryProductCard({ product, draftQuantity, draftReason, onChange }: InventoryProductCardProps) {
    const { product: p, variants } = product
    const primaryVariant = variants[0]
    if (!primaryVariant) return null

    const handleIncrement = () => {
      onChange(primaryVariant.id, draftQuantity + 1, draftReason)
    }

    const handleDecrement = () => {
      onChange(primaryVariant.id, draftQuantity - 1, draftReason)
    }

    const handleQuantityChange = (val: string) => {
      const parsed = Number(val)
      if (Number.isInteger(parsed)) {
        onChange(primaryVariant.id, parsed, draftReason)
      }
    }

    const hasActiveDraft = draftQuantity !== 0

    return (
      <div className={`group rounded-3xl border bg-white p-4 transition-all duration-300 ${hasActiveDraft ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-border/60 shadow-xs'}`}>
        <p className="line-clamp-2 text-sm font-bold text-gray-900 leading-tight">{p.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">SKU: {primaryVariant.sku}</p>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={handleDecrement} className="h-6 w-6 rounded border bg-gray-50 flex items-center justify-center text-sm font-bold">-</button>
            <input 
              type="text" 
              value={draftQuantity > 0 ? `+${draftQuantity}` : draftQuantity} 
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-10 text-center text-xs font-semibold border rounded py-0.5" 
            />
            <button type="button" onClick={handleIncrement} className="h-6 w-6 rounded border bg-gray-50 flex items-center justify-center text-sm font-bold">+</button>
          </div>
        </div>

        <select
          value={draftReason}
          onChange={(e) => onChange(primaryVariant.id, draftQuantity, e.target.value)}
          className="mt-2 w-full text-xs border rounded p-1 bg-white"
        >
          <option value="RESTOCK">RESTOCK (Add)</option>
          <option value="ADJUSTMENT">ADJUSTMENT (Count)</option>
          <option value="DAMAGE">DAMAGE (Write-off)</option>
          <option value="LOST">LOST (Missing)</option>
          <option value="RETURN">RETURN (Customer)</option>
        </select>
      </div>
    )
  }
  ```

- [ ] **Step 2: Update pos.inventory.tsx with inline inputs and confirm dialog**
  Replace usage of `CatalogGrid` with a mapped grid of `InventoryProductCard`s.
  Connect `onChange` callback to update the drafts state.
  Connect barcode scanner to automatically add +1 to draft and show a toast.
  Keep confirmation dialog open when clicking the main "Commit" button.

- [ ] **Step 3: Run verify command**
  Run: `pnpm --dir frontend test -- --run`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/pos/components/InventoryProductCard.tsx frontend/src/routes/pos.inventory.tsx
  git commit -m "feat: implement inline stock adjustment card and auto-queue scanning"
  ```

---

### Task 4: De-nest Nested Card Borders

**Files:**
- Modify: `frontend/src/pos/components/CartItemRow.tsx`
- Modify: `frontend/src/routes/pos.inventory.tsx`

**Interfaces:**
- Consumes: None
- Produces: Simple dividers instead of nested card outlines.

- [ ] **Step 1: Simplify CartItemRow styling**
  Remove `bg-gray-50` and `rounded-2xl` from the outer wrapper of `CartItemRow`.
  Use a simple divider border between list items.
  Replace:
  ```tsx
  <div className={`flex items-center gap-3 rounded-2xl border-none bg-gray-50 px-4 py-3 ${compact ? '' : 'shadow-sm'} mb-2 last:mb-0`}>
  ```
  With:
  ```tsx
  <div className="flex items-center gap-3 bg-transparent px-2 py-3 border-b border-gray-100 last:border-0">
  ```

- [ ] **Step 2: Remove sidebar nested cards in inventory.tsx**
  In the drafts and queue render sections in `frontend/src/routes/pos.inventory.tsx`, replace nested `bg-background border rounded-2xl` item containers with simple row structures separated by `border-b border-gray-100`.

- [ ] **Step 3: Run and verify**
  Run: `pnpm --dir frontend test -- --run`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/pos/components/CartItemRow.tsx frontend/src/routes/pos.inventory.tsx
  git commit -m "style: remove nested card borders in list rows"
  ```
