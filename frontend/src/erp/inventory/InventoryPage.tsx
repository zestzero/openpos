import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdjustStockMutation, useInventoryLedgerQuery, useInventoryStockLevelQuery, useProductsQuery, type InventoryReasonCode } from '@/lib/erp-api'

const reasonOptions: { value: InventoryReasonCode; label: string }[] = [
  { value: 'RESTOCK', label: 'Restock' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RETURN', label: 'Return' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'LOST', label: 'Lost' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function InventoryPage() {
  const { data: products = [] } = useProductsQuery()
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState<InventoryReasonCode>('ADJUSTMENT')
  const [note, setNote] = useState('')

  const variants = useMemo(() => products.flatMap((record) => record.variants.map((variant) => ({
    ...variant,
    productName: record.product.name,
    categoryName: record.category?.name ?? 'Uncategorized',
  }))), [products])

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null
  const stockQuery = useInventoryStockLevelQuery(selectedVariantId)
  const ledgerQuery = useInventoryLedgerQuery(selectedVariantId)
  const adjustStockMutation = useAdjustStockMutation()

  const submitAdjustment = async () => {
    if (!selectedVariantId) return
    const parsed = Number(quantity)
    if (!Number.isInteger(parsed) || parsed === 0) {
      toast.error('Enter a whole number quantity.')
      return
    }
    if (!note.trim()) {
      toast.error('Add a reason note before saving.')
      return
    }
    await adjustStockMutation.mutateAsync({ variantId: selectedVariantId, quantity: parsed, reason })
    toast.success('Inventory adjustment saved')
    setQuantity('1')
    setNote('')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-border bg-background p-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Inventory</p>
          <h1 className="text-2xl font-semibold text-foreground">Stock levels and ledger</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">Review stock by variant, inspect movement history, and record manual adjustments with a required reason code.</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-card border border-border bg-background p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Variant stock</h2>
            <p className="text-sm text-muted-foreground">{variants.length} variants</p>
          </div>
          <div className="space-y-3">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition ${selectedVariantId === variant.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{variant.name}</p>
                    <p className="text-sm text-muted-foreground">{variant.productName} · {variant.categoryName} · {variant.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Stock</p>
                    <p className={`text-lg font-semibold ${(variant.stockLevel ?? 0) === 0 ? 'text-destructive' : (variant.stockLevel ?? 0) < 10 ? 'text-amber-600' : 'text-foreground'}`}>
                      {variant.stockLevel ?? '—'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-card border border-border bg-background p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Selected variant</h2>
            {selectedVariant ? (
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p className="text-foreground">{selectedVariant.name}</p>
                <p>{selectedVariant.productName}</p>
                <p>{selectedVariant.sku}</p>
                <p>Current stock: {stockQuery.data?.stock_level ?? selectedVariant.stockLevel ?? '—'}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Choose a variant to view its ledger and adjust stock.</p>
            )}
          </section>

          <section className="rounded-card border border-border bg-background p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Manual adjustment</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="inventory-quantity" className="text-sm font-medium">Quantity</label>
                <Input id="inventory-quantity" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={!selectedVariantId || adjustStockMutation.isPending} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Reason code</span>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value as InventoryReasonCode)} disabled={!selectedVariantId || adjustStockMutation.isPending}>
                  {reasonOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="inventory-note" className="text-sm font-medium">Reason note</label>
                <textarea id="inventory-note" className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain the adjustment" disabled={!selectedVariantId || adjustStockMutation.isPending} />
              </div>
              <Button onClick={submitAdjustment} disabled={!selectedVariantId || adjustStockMutation.isPending}>Save adjustment</Button>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-card border border-border bg-background p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Ledger history</h2>
        {selectedVariant ? (
          <div className="mt-4 space-y-3">
            {(ledgerQuery.data ?? []).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{entry.reason}</p>
                  <p className="text-muted-foreground">{formatDate(entry.created_at)}</p>
                </div>
                <p className="text-muted-foreground">Change: {entry.quantity_change}</p>
              </div>
            ))}
            {ledgerQuery.data?.length === 0 ? <p className="text-sm text-muted-foreground">No ledger entries yet.</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Select a variant to view its ledger.</p>
        )}
      </section>
    </div>
  )
}
