import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { useAdjustStockMutation, useInventoryLedgerQuery, useInventoryStockLevelQuery, useProductsQuery, type InventoryReasonCode } from '@/lib/erp-api'
import { useI18n, type TranslationKey } from '@/lib/i18n'


function formatDate(value: string, locale: 'th' | 'en') {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function InventoryPage() {
  const { locale, t } = useI18n()
  const reasonKeys: Record<InventoryReasonCode, TranslationKey> = {
    RESTOCK: 'erp.reason.restock',
    ADJUSTMENT: 'erp.reason.adjustment',
    SALE: 'erp.reason.sale',
    RETURN: 'erp.reason.return',
    DAMAGE: 'erp.reason.damage',
    LOST: 'erp.reason.lost',
  }
  const editableReasons: InventoryReasonCode[] = ['RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'LOST']
  const reasonOptions: { value: InventoryReasonCode; label: string }[] = editableReasons.map((value) => ({ value, label: t(reasonKeys[value]) }))
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
    categoryName: record.category?.name ?? t('erp.uncategorized'),
  }))), [products, t])

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null
  const stockQuery = useInventoryStockLevelQuery(selectedVariantId)
  const ledgerQuery = useInventoryLedgerQuery(selectedVariantId)
  const adjustStockMutation = useAdjustStockMutation()
  const currentStockLevel = stockQuery.data?.stock_level ?? selectedVariant?.stockLevel

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
    const stockLevel = selectedVariantId === variant.id ? currentStockLevel : variant.stockLevel
    const matchesSearch = !variantSearch.trim() || [variant.name, variant.productName, variant.categoryName, variant.sku].join(' ').toLowerCase().includes(variantSearch.trim().toLowerCase())
    const matchesStock = stockFilter === 'all' || (stockFilter === 'low' && typeof stockLevel === 'number' && stockLevel > 0 && stockLevel < 10) || (stockFilter === 'zero' && stockLevel === 0)
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

  const lowStockCount = variants.filter((variant) => typeof variant.stockLevel === 'number' && variant.stockLevel > 0 && variant.stockLevel < 10).length
  const zeroStockCount = variants.filter((variant) => variant.stockLevel === 0).length

  const submitAdjustment = async () => {
    if (!selectedVariantId) return
    const parsed = Number(quantity)
    if (!Number.isInteger(parsed) || parsed === 0) {
      toast.error(t('erp.enterQuantity'))
      return
    }
    await adjustStockMutation.mutateAsync({ variantId: selectedVariantId, quantity: parsed, reason })
    toast.success(t('erp.adjustmentSaved'))
    setQuantity('1')
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">{t('erp.inventory')}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('erp.stockLevels')}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t('erp.inventoryDescription')}</p>
        </div>
      </section>

      {productsLoading ? (
        <section className="rounded-card border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t('erp.loadingInventory')}</p>
        </section>
      ) : productsError ? (
        <section className="rounded-card border border-border bg-card p-5">
          <p className="text-sm text-destructive">{t('erp.inventoryLoadFailed')} {(productsQueryError as Error | null)?.message ?? t('common.retry')}</p>
        </section>
      ) : variants.length === 0 ? (
        <section className="rounded-card border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t('erp.noStockedVariants')}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-card border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{t('erp.variantStock')}</h2>
                <p className="text-sm text-muted-foreground">{t('erp.variantsCount', { visible: filteredVariants.length, total: variants.length })}</p>
              </div>
              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <Input aria-label={t('erp.searchVariantsAria')} value={variantSearch} onChange={(event) => setVariantSearch(event.target.value)} placeholder={t('erp.searchVariants')} />
                <FormSelect
                  aria-label={t('erp.stockStateFilter')}
                  className="h-12 rounded-full bg-card px-4 text-base"
                  value={stockFilter}
                  onValueChange={(value) => value !== null && setStockFilter(value as typeof stockFilter)}
                  options={[
                    { value: 'all', label: t('erp.allStockStates') },
                    { value: 'low', label: t('erp.lowStock') },
                    { value: 'zero', label: t('erp.zeroStock') },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  <Chip type="button" active={stockFilter === 'low'} onClick={() => setStockFilter('low')}>{t('erp.lowStock')} ({lowStockCount})</Chip>
                  <Chip type="button" active={stockFilter === 'zero'} onClick={() => setStockFilter('zero')}>{t('erp.zeroStock')} ({zeroStockCount})</Chip>
                </div>
              </div>
              <div className="space-y-3">
                {filteredVariants.map((variant) => {
                  const displayStockLevel = selectedVariantId === variant.id ? currentStockLevel : variant.stockLevel

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      aria-pressed={selectedVariantId === variant.id}
                      className={`w-full rounded-2xl px-4 py-4 text-left transition-colors ${selectedVariantId === variant.id ? 'bg-accent/40 ring-2 ring-foreground' : 'hover:bg-muted'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-foreground">{variant.name}</p>
                          <p className="text-sm text-muted-foreground">{variant.productName} · {variant.categoryName} · {variant.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t('erp.stock')}</p>
                          <p className={`text-lg font-semibold ${stockTone(displayStockLevel)}`}>
                            {formatStockValue(displayStockLevel, t)}
                          </p>
                          {stockStatusLabel(displayStockLevel, t)}
                        </div>
                      </div>
                    </button>
                  )
                })}
                {filteredVariants.length === 0 ? <p className="text-sm text-muted-foreground">{t('erp.noVariantsMatch')}</p> : null}
              </div>
            </div>

            <div className="space-y-4">
              <section className="rounded-card border border-border bg-card p-5">
                <h2 className="text-lg font-semibold">{t('erp.selectedVariant')}</h2>
                {selectedVariant ? (
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p className="text-foreground">{selectedVariant.name}</p>
                    <p>{selectedVariant.productName}</p>
                    <p>{selectedVariant.sku}</p>
                    <p>
                      {t('erp.currentStock')}:{' '}
                      <span className={`font-semibold ${stockTone(currentStockLevel)}`}>{formatStockValue(currentStockLevel, t)}</span>
                    </p>
                    {stockQuery.isLoading ? <p className="text-xs text-muted-foreground">{t('erp.refreshingStock')}</p> : null}
                    {stockQuery.isError ? <p className="text-xs text-destructive">{t('erp.unableRefreshStock')}</p> : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">{t('erp.chooseVariant')}</p>
                )}
              </section>

              <section className="rounded-card border border-border bg-card p-5">
                <h2 className="text-lg font-semibold">{t('erp.manualAdjustment')}</h2>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="inventory-quantity" className="text-sm font-medium">{t('erp.quantity')}</label>
                    <Input id="inventory-quantity" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={!selectedVariantId || adjustStockMutation.isPending} />
                  </div>
                  <div className="space-y-2">
                    <label id="inventory-reason-label" htmlFor="inventory-reason" className="text-sm font-medium">{t('erp.reasonCode')}</label>
                    <FormSelect
                      id="inventory-reason"
                      aria-labelledby="inventory-reason-label"
                      className="h-12 rounded-full bg-card px-4 text-base"
                      value={reason}
                      onValueChange={(value) => value !== null && setReason(value as InventoryReasonCode)}
                      options={reasonOptions}
                      disabled={!selectedVariantId || adjustStockMutation.isPending}
                    />
                  </div>
                  <Button onClick={submitAdjustment} disabled={!selectedVariantId || adjustStockMutation.isPending}>{t('erp.saveAdjustment')}</Button>
                </div>
              </section>
            </div>
          </section>

          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">{t('erp.ledgerHistory')}</h2>
            {selectedVariant ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <FormSelect
                    aria-label={t('erp.ledgerReasonFilter')}
                    className="h-12 rounded-full bg-card px-4 text-base"
                    value={ledgerReasonFilter}
                    onValueChange={(value) => value !== null && setLedgerReasonFilter(value as typeof ledgerReasonFilter)}
                    options={[
                      { value: 'all', label: t('erp.allReasons') },
                      ...reasonOptions,
                    ]}
                  />
                  <FormSelect
                    aria-label={t('erp.ledgerTimeRange')}
                    className="h-12 rounded-full bg-card px-4 text-base"
                    value={ledgerTimeRange}
                    onValueChange={(value) => value !== null && setLedgerTimeRange(value as typeof ledgerTimeRange)}
                    options={[
                      { value: 'all', label: t('erp.allTime') },
                      { value: '24h', label: t('erp.last24Hours') },
                      { value: '7d', label: t('erp.last7Days') },
                      { value: '30d', label: t('erp.last30Days') },
                    ]}
                  />
                  <Button type="button" variant="outline" onClick={() => { setLedgerReasonFilter('all'); setLedgerTimeRange('all') }}>{t('erp.clearLedgerFilters')}</Button>
                </div>
                {(visibleLedgerEntries).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{entry.reason}</p>
                      <p className="text-muted-foreground">{formatDate(entry.created_at, locale)}</p>
                    </div>
                    <p className="text-muted-foreground">{t('erp.change')}: {entry.quantity_change}</p>
                  </div>
                ))}
                {visibleLedgerEntries.length === 0 ? <p className="text-sm text-muted-foreground">{t('erp.noLedgerEntries')}</p> : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t('erp.selectVariantLedger')}</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function formatStockValue(value: number | undefined, translate: (key: TranslationKey) => string) {
  return typeof value === 'number' ? value : translate('erp.unknown')
}

function stockTone(value: number | undefined) {
  if (value === undefined) return 'text-muted-foreground'
  if (value === 0) return 'text-destructive'
  if (value < 10) return 'text-amber-600'
  return 'text-foreground'
}

function stockStatusLabel(value: number | undefined, translate: (key: TranslationKey) => string) {
  if (value === undefined) return <p className="text-xs font-medium text-muted-foreground">{translate('erp.stockNotLoaded')}</p>
  if (value === 0) return <p className="text-xs font-medium text-destructive">{translate('erp.zeroStock')}</p>
  if (value < 10) return <p className="text-xs font-medium text-amber-600">{translate('erp.lowStock')}</p>
  return null
}
