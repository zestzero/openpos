import { useEffect, useMemo, useState } from 'react'
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
  const productsQuery = useProductsQuery()
  const { data: products = [], isLoading: productsLoading, isError: productsError, error: productsQueryError } = productsQuery
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [variantSearch, setVariantSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'zero'>('all')
  const [ledgerReasonFilter, setLedgerReasonFilter] = useState<'all' | InventoryReasonCode>('all')
  const [ledgerTimeRange, setLedgerTimeRange] = useState<'all' | '24h' | '7d' | '30d'>('all')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState<InventoryReasonCode>('ADJUSTMENT')

  const variants = useMemo(() => products.flatMap((record) => record.variants.map((variant) => ({
    ...variant,
    productName: record.product.name,
    categoryName: record.category?.name ?? 'Uncategorized',
  }))), [products])

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null
  const stockQuery = useInventoryStockLevelQuery(selectedVariantId)
  const ledgerQuery = useInventoryLedgerQuery(selectedVariantId)
  const adjustStockMutation = useAdjustStockMutation()
  const currentStockLevel = selectedVariant?.stockLevel ?? stockQuery.data?.stock_level

  useEffect(() => {
    if (variants.length === 0) {
      if (selectedVariantId) {
        setSelectedVariantId(null)
      }
      return
    }

    if (!selectedVariantId || !variants.some((variant) => variant.id === selectedVariantId)) {
      setSelectedVariantId(variants[0].id)
    }
  }, [selectedVariantId, variants])

  const filteredVariants = variants.filter((variant) => {
    const stockLevel = variant.stockLevel ?? 0
    const matchesSearch = !variantSearch.trim() || [variant.name, variant.productName, variant.categoryName, variant.sku].join(' ').toLowerCase().includes(variantSearch.trim().toLowerCase())
    const matchesStock = stockFilter === 'all' || (stockFilter === 'low' && stockLevel > 0 && stockLevel < 10) || (stockFilter === 'zero' && stockLevel === 0)
    return matchesSearch && matchesStock
  })

  const visibleLedgerEntries = (ledgerQuery.data ?? []).filter((entry) => {
    const matchesReason = ledgerReasonFilter === 'all' || entry.reason === ledgerReasonFilter
    const createdAt = new Date(entry.created_at).getTime()
    const now = Date.now()
    const rangeMs = ledgerTimeRange === '24h' ? 24 * 60 * 60 * 1000 : ledgerTimeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : ledgerTimeRange === '30d' ? 30 * 24 * 60 * 60 * 1000 : null
    const matchesTime = rangeMs === null || (Number.isFinite(createdAt) && createdAt >= now - rangeMs)
    return matchesReason && matchesTime
  })

  const lowStockCount = variants.filter((variant) => (variant.stockLevel ?? 0) > 0 && (variant.stockLevel ?? 0) < 10).length
  const zeroStockCount = variants.filter((variant) => (variant.stockLevel ?? 0) === 0).length

  const submitAdjustment = async () => {
    if (!selectedVariantId) return
    const parsed = Number(quantity)
    if (!Number.isInteger(parsed) || parsed === 0) {
      toast.error('Enter a whole number quantity.')
      return
    }
    await adjustStockMutation.mutateAsync({ variantId: selectedVariantId, quantity: parsed, reason })
    toast.success('Inventory adjustment saved')
    setQuantity('1')
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

      {productsLoading ? (
        <section className="rounded-card border border-border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Loading inventory…</p>
        </section>
      ) : productsError ? (
        <section className="rounded-card border border-border bg-background p-5 shadow-sm">
          <p className="text-sm text-destructive">Failed to load inventory. {(productsQueryError as Error | null)?.message ?? 'Please try again.'}</p>
        </section>
      ) : variants.length === 0 ? (
        <section className="rounded-card border border-border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">No stocked variants are available yet.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-card border border-border bg-background p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Variant stock</h2>
                <p className="text-sm text-muted-foreground">{filteredVariants.length} of {variants.length} variants</p>
              </div>
              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <Input aria-label="Search variants" value={variantSearch} onChange={(event) => setVariantSearch(event.target.value)} placeholder="Search variant, SKU, category" />
                <select aria-label="Stock state filter" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={stockFilter} onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)}>
                  <option value="all">All stock states</option>
                  <option value="low">Low stock</option>
                  <option value="zero">Zero stock</option>
                </select>
                <div className="flex gap-2 text-sm">
                  <Button type="button" variant="outline" onClick={() => setStockFilter('low')}>Low stock ({lowStockCount})</Button>
                  <Button type="button" variant="outline" onClick={() => setStockFilter('zero')}>Zero stock ({zeroStockCount})</Button>
                </div>
              </div>
              <div className="space-y-3">
                {filteredVariants.map((variant) => (
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
                        {(variant.stockLevel ?? 0) === 0 ? <p className="text-xs font-medium text-destructive">Zero stock</p> : (variant.stockLevel ?? 0) < 10 ? <p className="text-xs font-medium text-amber-600">Low stock</p> : null}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredVariants.length === 0 ? <p className="text-sm text-muted-foreground">No variants match the current filters.</p> : null}
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
                    <p>Current stock: {currentStockLevel ?? '—'}</p>
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
                  <Button onClick={submitAdjustment} disabled={!selectedVariantId || adjustStockMutation.isPending}>Save adjustment</Button>
                </div>
              </section>
            </div>
          </section>

          <section className="rounded-card border border-border bg-background p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Ledger history</h2>
            {selectedVariant ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <select aria-label="Ledger reason filter" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={ledgerReasonFilter} onChange={(event) => setLedgerReasonFilter(event.target.value as typeof ledgerReasonFilter)}>
                    <option value="all">All reasons</option>
                    {reasonOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <select aria-label="Ledger time range" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={ledgerTimeRange} onChange={(event) => setLedgerTimeRange(event.target.value as typeof ledgerTimeRange)}>
                    <option value="all">All time</option>
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </select>
                  <Button type="button" variant="outline" onClick={() => { setLedgerReasonFilter('all'); setLedgerTimeRange('all') }}>Clear ledger filters</Button>
                </div>
                {(visibleLedgerEntries).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{entry.reason}</p>
                      <p className="text-muted-foreground">{formatDate(entry.created_at)}</p>
                    </div>
                    <p className="text-muted-foreground">Change: {entry.quantity_change}</p>
                  </div>
                ))}
                {visibleLedgerEntries.length === 0 ? <p className="text-sm text-muted-foreground">No ledger entries match the current filters.</p> : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Select a variant to view its ledger.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
