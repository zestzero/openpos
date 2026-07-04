/* eslint-disable react-refresh/only-export-components */

import { useCallback, useState, useEffect, useMemo } from 'react'
import { ArrowLeft, ScanBarcode, XCircle, RefreshCw, Trash2, CloudOff, AlertCircle, Search, Pencil, CheckCircle2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { createRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { api, type SearchVariantRow } from '@/lib/api'
import { PosLayout } from '@/pos/layout/PosLayout'
import { BarcodeScanner } from '@/pos/components/BarcodeScanner'
import { useKeyboardWedge } from '@/pos/hooks/useKeyboardWedge'
import { useOfflineAdjustments } from '@/pos/hooks/useOfflineAdjustments'
import { useSync } from '@/pos/hooks/useSync'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'
import { CatalogCategoryNav } from '@/pos/components/CatalogCategoryNav'
import { InventoryProductCard } from '@/pos/components/InventoryProductCard'
import { Route as rootRoute } from './__root'
import { type QueuedAdjustment } from '@/lib/db'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pos/inventory',
  component: PosInventoryRoute,
})

interface DraftAdjustment {
  variantId: string
  variantName: string
  sku: string
  barcode?: string
  quantity: number
  reason: 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOST'
}

export function PosInventoryRoute() {
  const navigate = useNavigate()
  const { isOnline } = useNetworkStatus()
  const { syncPendingAdjustments } = useSync()
  
  const {
    queueAdjustment,
    getAllQueuedAdjustments,
    clearAdjustment,
  } = useOfflineAdjustments()

  const [queuedAdjustments, setQueuedAdjustments] = useState<QueuedAdjustment[]>([])
  const [drafts, setDrafts] = useState<DraftAdjustment[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch full product catalog for manual search
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await api.getProducts()
      return res.data
    },
    staleTime: 60 * 1000,
  })

  // Fetch products for the grid, filtered by selected category
  const { data: gridProducts, isLoading: isGridLoading, error: gridError, refetch: refetchGrid } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      const result = await api.getProducts(selectedCategory ?? undefined)
      return result.data
    },
    staleTime: 30 * 1000,
  })

  const allVariants = useMemo(() => {
    if (!productsData) return []
    return productsData.flatMap((p) =>
      p.variants.map((v) => ({
        ...v,
        product_name: p.product.name,
      }))
    )
  }, [productsData])

  const filteredVariants = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return allVariants.filter(
      (v) =>
        v.product_name.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        (v.barcode && v.barcode.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [allVariants, searchQuery])

  // Load adjustments from Dexie
  const loadAdjustments = useCallback(async () => {
    const list = await getAllQueuedAdjustments()
    // Sort by newest first
    list.sort((a, b) => b.createdAt - a.createdAt)
    setQueuedAdjustments(list)
  }, [getAllQueuedAdjustments])

  useEffect(() => {
    loadAdjustments()
  }, [loadAdjustments])

  useEffect(() => {
    const handleDocumentClick = () => {
      setShowSuggestions(false)
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  const handleBarcodeScanned = useCallback((variant: SearchVariantRow) => {
    setDrafts((prev) => {
      const existingIndex = prev.findIndex((d) => d.variantId === variant.id)
      if (existingIndex > -1) {
        const updated = [...prev]
        const currentQty = updated[existingIndex].quantity
        const nextQty = currentQty + 1
        
        if (nextQty === 0) {
          toast.success(`Removed ${variant.product_name || variant.name} from drafts`)
          return prev.filter((d) => d.variantId !== variant.id)
        }

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: nextQty,
        }
        toast.success(`Incremented ${variant.product_name || variant.name} quantity to ${nextQty > 0 ? `+${nextQty}` : nextQty}`)
        return updated
      } else {
        const newDraft: DraftAdjustment = {
          variantId: variant.id,
          variantName: variant.product_name || variant.name,
          sku: variant.sku,
          barcode: variant.barcode || undefined,
          quantity: 1,
          reason: 'ADJUSTMENT',
        }
        toast.success(`Added ${variant.product_name || variant.name} to drafts (+1)`)
        return [...prev, newDraft]
      }
    })
  }, [])

  const handleAdjustmentChange = useCallback((variantId: string, quantity: number, reason: 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOST') => {
    const originalVariant = allVariants.find((v) => v.id === variantId)
    if (!originalVariant) return

    setDrafts((prev) => {
      if (quantity === 0) {
        return prev.filter((d) => d.variantId !== variantId)
      }

      const existingIndex = prev.findIndex((d) => d.variantId === variantId)
      const newDraft: DraftAdjustment = {
        variantId,
        variantName: originalVariant.product_name || originalVariant.name,
        sku: originalVariant.sku,
        barcode: originalVariant.barcode || undefined,
        quantity,
        reason,
      }

      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex] = newDraft
        return updated
      } else {
        return [...prev, newDraft]
      }
    })
  }, [allVariants])

  const handleVariantSearch = useCallback(async (code: string) => {
    try {
      const response = await api.searchVariant(code)
      handleBarcodeScanned(response.data)
      setLastError(null)
      setShowError(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Item not found'
      setLastError(errorMsg)
      setShowError(true)

      window.setTimeout(() => {
        setShowError(false)
        setLastError(null)
      }, 2500)
    }
  }, [handleBarcodeScanned])

  const handleManualSearch = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    await handleVariantSearch(trimmed)
    setSearchQuery('')
    setShowSuggestions(false)
  }, [searchQuery, handleVariantSearch])

  const handleScanSuccess = useCallback((variant: SearchVariantRow) => {
    handleBarcodeScanned(variant)
    setLastError(null)
    setShowError(false)
    setIsScannerOpen(false)
  }, [handleBarcodeScanned])

  const handleScanError = useCallback((_code: string, error: string) => {
    setLastError(error)
    setShowError(true)

    setTimeout(() => {
      setShowError(false)
      setLastError(null)
    }, 2500)
  }, [])

  const handleSelectVariant = useCallback((variant: SearchVariantRow) => {
    handleBarcodeScanned(variant)
    setSearchQuery('')
    setShowSuggestions(false)
  }, [handleBarcodeScanned])

  const handleDeleteDraft = (variantId: string) => {
    setDrafts((prev) => prev.filter((d) => d.variantId !== variantId))
  }

  const handleCommitAdjustments = async () => {
    if (drafts.length === 0) return

    for (const item of drafts) {
      const id = crypto.randomUUID()
      await queueAdjustment({
        id,
        variantId: item.variantId,
        variantName: item.variantName,
        sku: item.sku,
        quantity: item.quantity,
        reason: item.reason,
      })
    }

    const count = drafts.length
    setDrafts([])
    setIsConfirmOpen(false)
    loadAdjustments()
    
    toast.success(`Successfully queued ${count} adjustment${count > 1 ? 's' : ''}`)

    if (isOnline) {
      triggerSync()
    }
  }

  const triggerSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      await syncPendingAdjustments()
    } finally {
      setIsSyncing(false)
      loadAdjustments()
    }
  }

  const handleDiscard = async (id: string) => {
    await clearAdjustment(id)
    loadAdjustments()
  }

  const { isEnabled: isKeyboardWedgeEnabled, isScanning: isKeyboardScanning, toggle: toggleKeyboardWedge } = useKeyboardWedge({
    onScan: handleVariantSearch,
  })



  return (
    <PosLayout>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.85fr)] pb-20">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border/60 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Inventory Adjustments
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Scan and Adjust Stock Level.
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                    Use the camera, wedge scanner, or catalog to record manual counts.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-card">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  Inventory mode
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Wedge
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {isKeyboardWedgeEnabled ? (isKeyboardScanning ? 'Listening' : 'Armed') : 'Paused'}
                    </p>
                  </div>
                  <Button
                    variant={isKeyboardWedgeEnabled ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={toggleKeyboardWedge}
                  >
                    <ScanBarcode className="h-4 w-4" />
                  </Button>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Queue size
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{queuedAdjustments.length} items</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleManualSearch} className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Type product name, barcode, or SKU to adjust stock..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="h-11 rounded-pill border-border/70 bg-background pl-12 pr-4 text-sm focus-visible:ring-brand shadow-card"
                    aria-label="Search variant to adjust"
                  />
                  {showSuggestions && searchQuery.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border/80 bg-popover p-2 shadow-lg">
                      {filteredVariants.length === 0 ? (
                        <div className="px-4 py-2.5 text-sm text-muted-foreground">
                          No matching products found
                        </div>
                      ) : (
                        filteredVariants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVariant(v as SearchVariantRow)}
                            className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"
                          >
                            <div className="min-w-0 pr-4">
                              <p className="font-semibold text-foreground truncate">
                                {v.product_name} {v.name !== 'Default' ? `(${v.name})` : ''}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                SKU: {v.sku} {v.barcode ? `| Barcode: ${v.barcode}` : ''}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </form>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border-border/70 bg-background shadow-card text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => setIsScannerOpen(true)}
                  aria-label="Scan barcode with camera"
                >
                  <ScanBarcode className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {showError && lastError && (
              <div className="px-4 py-3 sm:px-5">
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-red-900 dark:border-red-400/20 dark:bg-red-950/60 dark:text-red-100">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />
                  <div>
                    <p className="text-sm font-semibold">Scan problem</p>
                    <p className="text-sm leading-6 text-red-800 dark:text-red-200">{lastError}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
            <CatalogCategoryNav
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {isGridLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[17rem] animate-pulse rounded-[1.75rem] border border-border bg-card shadow-card"
                />
              ))}
            </div>
          ) : gridError ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-border bg-card px-6 py-10 text-center shadow-card">
              <p className="text-sm font-medium text-foreground">Failed to load products</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">Try again.</p>
              <Button variant="outline" onClick={() => refetchGrid()}>
                Retry
              </Button>
            </div>
          ) : (gridProducts ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-card px-6 py-10 text-center text-muted-foreground shadow-card">
              <p className="font-medium text-foreground">No products in this category</p>
              <p className="max-w-sm text-sm leading-6">Pick a different category, or clear the filter to bring the full shelf back into view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {(gridProducts ?? []).map((item) => {
                const primaryVariant = item.variants[0]
                const draft = drafts.find((d) => d.variantId === primaryVariant?.id)
                return (
                  <InventoryProductCard
                    key={item.product.id}
                    product={item}
                    draftQuantity={draft?.quantity ?? 0}
                    draftReason={draft?.reason ?? 'RESTOCK'}
                    onChange={handleAdjustmentChange}
                  />
                )
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Current Session
                </p>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  Draft Adjustments
                  {drafts.length > 0 && (
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {drafts.length}
                    </Badge>
                  )}
                </h2>
              </div>
              {drafts.length > 0 && (
                <Button
                  onClick={() => setIsConfirmOpen(true)}
                  className="gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-4"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Commit
                </Button>
              )}
            </div>

            {drafts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
                No draft adjustments. Click a product or scan a barcode to add.
              </div>
            ) : (
              <div className="grid gap-3">
                {drafts.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex flex-col gap-2 bg-transparent py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground text-sm">{item.variantName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <Badge
                        variant={item.quantity > 0 ? 'default' : 'destructive'}
                        className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold"
                      >
                        {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>Reason:</span>
                        <span className="font-semibold text-foreground">{item.reason}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDraft(item.variantId)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-red-500"
                          title="Remove Adjustment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-sm sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Sync Queue
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">Pending</h2>
              </div>
              <Button
                variant={isOnline ? 'default' : 'outline'}
                size="sm"
                disabled={!isOnline || isSyncing || queuedAdjustments.length === 0}
                onClick={triggerSync}
                className="gap-2 rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            </div>

            {!isOnline && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <CloudOff className="h-4 w-4 shrink-0" />
                <span>Offline mode. Adjustments will sync when reconnected.</span>
              </div>
            )}

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
              {queuedAdjustments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
                  No adjustments pending.
                </div>
              ) : (
                queuedAdjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="flex flex-col gap-2 bg-transparent py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground text-sm">{adj.variantName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">SKU: {adj.sku}</p>
                      </div>
                      <Badge
                        variant={adj.quantity > 0 ? 'default' : 'destructive'}
                        className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold"
                      >
                        {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>Reason:</span>
                        <span className="font-semibold text-foreground">{adj.reason}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {adj.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <AlertCircle className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                        {adj.status === 'syncing' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-500">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Syncing
                          </span>
                        )}
                        {adj.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500" title={adj.lastError}>
                            <XCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDiscard(adj.id)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {adj.status === 'failed' && adj.lastError && (
                      <p className="rounded-lg bg-red-500/5 p-2 text-[10px] leading-relaxed text-red-600 dark:text-red-400 border border-red-500/10">
                        Error: {adj.lastError}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => navigate({ to: '/pos' })} className="gap-2 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              Back to selling floor
            </Button>
          </div>
        </aside>
      </div>



      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="max-w-md rounded-[1.75rem]">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
            <DialogDescription>
              Scan a product barcode using your device camera.
            </DialogDescription>
          </DialogHeader>
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Confirm Stock Adjustments
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Please review the summary of adjustments below before committing them to the system.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 max-h-[300px] overflow-y-auto pr-1 space-y-3">
            {drafts.map((item) => (
              <div key={item.variantId} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/50 bg-muted/10">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.variantName}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.sku} | Reason: <span className="font-semibold">{item.reason}</span></p>
                </div>
                <Badge
                  variant={item.quantity > 0 ? 'default' : 'destructive'}
                  className="shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-extrabold"
                >
                  {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-xl border-border px-5 py-4 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCommitAdjustments}
              className="rounded-xl px-6 py-4 font-semibold shadow-md shadow-primary/20 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Commit & Sync ({drafts.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PosLayout>
  )
}
