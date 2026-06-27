/* eslint-disable react-refresh/only-export-components */

import { useCallback, useState, useEffect } from 'react'
import { ArrowLeft, ScanBarcode, XCircle, RefreshCw, Trash2, CloudOff, AlertCircle, Search } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { createRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api, type SearchVariantRow } from '@/lib/api'
import { PosLayout } from '@/pos/layout/PosLayout'
import { BarcodeScanner } from '@/pos/components/BarcodeScanner'
import { useKeyboardWedge } from '@/pos/hooks/useKeyboardWedge'
import { useOfflineAdjustments } from '@/pos/hooks/useOfflineAdjustments'
import { useSync } from '@/pos/hooks/useSync'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'
import { AdjustmentDialog } from '@/pos/components/AdjustmentDialog'
import { Route as posRoute } from './pos'
import { type QueuedAdjustment } from '@/lib/db'

export const Route = createRoute({
  getParentRoute: () => posRoute,
  path: 'inventory',
  component: PosInventoryRoute,
})

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
  const [selectedVariant, setSelectedVariant] = useState<SearchVariantRow | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleVariantSearch = useCallback(async (code: string) => {
    try {
      const response = await api.searchVariant(code)
      setSelectedVariant(response.data)
      setIsDialogOpen(true)
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
  }, [])

  const handleManualSearch = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    await handleVariantSearch(trimmed)
    setSearchQuery('')
  }, [searchQuery, handleVariantSearch])

  const handleScanSuccess = useCallback((variant: SearchVariantRow) => {
    setSelectedVariant(variant)
    setIsDialogOpen(true)
    setLastError(null)
    setShowError(false)
  }, [])

  const handleScanError = useCallback((_code: string, error: string) => {
    setLastError(error)
    setShowError(true)

    setTimeout(() => {
      setShowError(false)
      setLastError(null)
    }, 2500)
  }, [])

  const handleAdjustmentSubmit = useCallback(async (quantity: number, reason: 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOST') => {
    if (!selectedVariant) return
    
    // Generate new client UUID
    const id = crypto.randomUUID()
    
    await queueAdjustment({
      id,
      variantId: selectedVariant.id,
      variantName: selectedVariant.product_name || selectedVariant.name,
      sku: selectedVariant.sku,
      quantity,
      reason,
    })
    
    setSelectedVariant(null)
    loadAdjustments()

    // If online, immediately try to sync
    if (isOnline) {
      triggerSync()
    }
  }, [selectedVariant, queueAdjustment, loadAdjustments, isOnline])

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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.8fr)]">
        <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
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
                  Use the camera or wedge scanner to record manual counts. Adjustments are queued offline and sync automatically.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-card">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                Inventory mode
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Camera
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">Ready to scan</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Wedge
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {isKeyboardWedgeEnabled ? (isKeyboardScanning ? 'Listening now' : 'Armed') : 'Paused'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Queue size
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{queuedAdjustments.length} items</p>
              </div>
            </div>

            <div className="mt-4">
              <form onSubmit={handleManualSearch} className="relative w-full">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Type barcode or SKU to adjust stock..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-pill border-border/70 bg-background pl-12 pr-4 text-sm focus-visible:ring-brand shadow-card"
                  aria-label="Search variant to adjust"
                />
              </form>
            </div>
          </div>

          <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(17.5rem,0.72fr)]">
            <BarcodeScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />

            <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Scanner control
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {isKeyboardWedgeEnabled ? 'Keyboard wedge active' : 'Keyboard wedge paused'}
                  </p>
                </div>
                <Button
                  variant={isKeyboardWedgeEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleKeyboardWedge}
                >
                  {isKeyboardWedgeEnabled ? 'Wedge on' : 'Wedge off'}
                </Button>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ScanBarcode className="h-4 w-4 text-muted-foreground" />
                  How it works
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>1. Scan barcode (Camera or wedge scanner).</li>
                  <li>2. Select quantity (+ to add, - to subtract).</li>
                  <li>3. Select reason code and click save.</li>
                  <li>4. View sync queue status in the sidebar.</li>
                </ul>
              </div>

              {showError && lastError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-red-900 dark:border-red-400/20 dark:bg-red-950/60 dark:text-red-100">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />
                  <div>
                    <p className="text-sm font-semibold">Scan problem</p>
                    <p className="text-sm leading-6 text-red-800 dark:text-red-200">{lastError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-sm sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Sync Queue
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">Pending adjustments</h2>
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

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 hide-scrollbar">
              {queuedAdjustments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
                  No adjustments pending. Scan items to record.
                </div>
              ) : (
                queuedAdjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background p-4 shadow-xs"
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

      <AdjustmentDialog
        variant={selectedVariant}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedVariant(null)
        }}
        onSubmit={handleAdjustmentSubmit}
      />
    </PosLayout>
  )
}
