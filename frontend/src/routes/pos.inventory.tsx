/* eslint-disable react-refresh/only-export-components */

import { useCallback, useMemo, useState } from 'react'
import { createRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, CheckCircle2, Minus, Plus, ScanBarcode, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, type SearchVariantRow } from '@/lib/api'
import type { QueuedAdjustment } from '@/lib/db'
import { BarcodeScanner } from '@/pos/components/BarcodeScanner'
import { useKeyboardWedge } from '@/pos/hooks/useKeyboardWedge'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'
import { useOfflineAdjustments } from '@/pos/hooks/useOfflineAdjustments'
import { useSync } from '@/pos/hooks/useSync'
import { PosLayout } from '@/pos/layout/PosLayout'
import { posLocale } from '@/pos/lib/copy'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pos/inventory',
  component: PosInventoryRoute,
})

type AdjustmentReason = QueuedAdjustment['reason']
type Screen = 'find' | 'edit' | 'review' | 'saved'

const copy = posLocale === 'th' ? {
  title: 'ปรับสต็อก', find: 'ค้นหาหรือสแกนสินค้า', placeholder: 'ชื่อสินค้า รหัส หรือบาร์โค้ด', scan: 'สแกนด้วยกล้อง',
  noMatch: 'ไม่พบสินค้า กรุณาตรวจชื่อหรือบาร์โค้ด', quantity: 'จำนวนที่เปลี่ยน', reason: 'สาเหตุ', review: 'ตรวจสอบก่อนบันทึก',
  save: 'บันทึกการปรับสต็อก', saved: 'บันทึกแล้ว', savedOffline: 'บันทึกไว้ในเครื่องนี้แล้ว ระบบจะส่งข้อมูลเมื่อออนไลน์',
  savedOnline: 'บันทึกแล้ว กำลังส่งข้อมูลอัตโนมัติ', another: 'ปรับสินค้าอีกชิ้น', back: 'ย้อนกลับ', retry: 'ลองส่งข้อมูลอีกครั้ง',
  needsAttention: 'มีรายการที่ยังส่งไม่ได้', increase: 'เพิ่มจำนวน', decrease: 'ลดจำนวน',
} : {
  title: 'Adjust stock', find: 'Find or scan an item', placeholder: 'Product name, SKU, or barcode', scan: 'Scan with camera',
  noMatch: 'No matching product. Check the name or barcode.', quantity: 'Quantity change', reason: 'Reason', review: 'Review before saving',
  save: 'Save stock adjustment', saved: 'Adjustment saved', savedOffline: 'Saved on this phone. It will sync when online.',
  savedOnline: 'Saved. It is syncing automatically.', another: 'Adjust another item', back: 'Back', retry: 'Try syncing again',
  needsAttention: 'Some adjustments need attention', increase: 'Increase quantity', decrease: 'Decrease quantity',
}

const reasons: Array<{ value: AdjustmentReason; th: string; en: string }> = [
  { value: 'RESTOCK', th: 'รับสินค้าเข้า', en: 'Restock' },
  { value: 'ADJUSTMENT', th: 'แก้จำนวนจากการนับ', en: 'Count correction' },
  { value: 'DAMAGE', th: 'สินค้าเสียหาย', en: 'Damaged' },
  { value: 'LOST', th: 'สินค้าสูญหาย', en: 'Missing' },
  { value: 'RETURN', th: 'ลูกค้าคืนสินค้า', en: 'Customer return' },
]

function reasonLabel(reason: AdjustmentReason) {
  const item = reasons.find((candidate) => candidate.value === reason)
  return posLocale === 'th' ? item?.th : item?.en
}

export function PosInventoryRoute() {
  const { isOnline } = useNetworkStatus()
  const { queueAdjustment, getAllQueuedAdjustments } = useOfflineAdjustments()
  const { syncPendingAdjustments } = useSync()
  const [screen, setScreen] = useState<Screen>('find')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SearchVariantRow | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState<AdjustmentReason>('RESTOCK')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => (await api.getProducts()).data,
    staleTime: 60_000,
  })
  const queuedQuery = useQuery({
    queryKey: ['queued-adjustments'],
    queryFn: getAllQueuedAdjustments,
    staleTime: 0,
  })
  const queued = queuedQuery.data ?? []

  const variants = useMemo<SearchVariantRow[]>(() => products.flatMap((product) => product.variants
    .filter((variant) => variant.is_active)
    .map((variant) => ({ ...variant, product_name: product.product.name }))), [products])

  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (normalized.length < 2) return []
    return variants.filter((variant) => variant.product_name.toLocaleLowerCase().includes(normalized)
      || variant.name.toLocaleLowerCase().includes(normalized)
      || variant.sku.toLocaleLowerCase().includes(normalized)
      || variant.barcode?.toLocaleLowerCase().includes(normalized)).slice(0, 8)
  }, [query, variants])

  const chooseVariant = useCallback((variant: SearchVariantRow) => {
    setSelected(variant)
    setQuantity(1)
    setReason('RESTOCK')
    setQuery('')
    setError(null)
    setScreen('edit')
    setScannerOpen(false)
  }, [])

  const findBarcode = useCallback(async (code: string) => {
    try {
      chooseVariant((await api.searchVariant(code)).data)
    } catch {
      setError(copy.noMatch)
    }
  }, [chooseVariant])

  useKeyboardWedge({ onScan: findBarcode })

  const saveAdjustment = async () => {
    if (!selected || quantity === 0 || saving) return
    setSaving(true)
    setError(null)
    try {
      await queueAdjustment({
        id: crypto.randomUUID(), variantId: selected.id, variantName: selected.product_name,
        sku: selected.sku, quantity, reason,
      })
      await queuedQuery.refetch()
      setScreen('saved')
      if (isOnline) void syncPendingAdjustments().then(() => queuedQuery.refetch())
    } catch {
      setError('The adjustment was not saved. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setSelected(null)
    setQuantity(1)
    setReason('RESTOCK')
    setError(null)
    setScreen('find')
  }

  const failedCount = queued.filter((item) => item.status === 'failed').length

  if (screen === 'saved') {
    return (
      <PosLayout>
        <section className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-6 text-center">
          <CheckCircle2 aria-hidden="true" className="size-16 text-success" />
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold">{copy.saved}</h2>
            <p className="max-w-sm text-lg text-muted-foreground">{isOnline ? copy.savedOnline : copy.savedOffline}</p>
          </div>
          <Button className="h-16 w-full rounded-xl text-lg font-bold" onClick={reset}>{copy.another}</Button>
        </section>
      </PosLayout>
    )
  }

  if (screen === 'review' && selected) {
    return (
      <PosLayout bottomAction={<Button className="h-16 w-full rounded-xl text-lg font-bold" disabled={saving} onClick={() => void saveAdjustment()}>{copy.save}</Button>}>
        <div className="flex flex-col gap-6">
          <Button variant="ghost" className="min-h-12 w-fit px-2 text-base" onClick={() => setScreen('edit')}><ArrowLeft data-icon="inline-start" />{copy.back}</Button>
          <h2 className="text-2xl font-bold">{copy.review}</h2>
          <div className="border-y border-border py-5">
            <p className="text-xl font-bold">{selected.product_name}</p>
            {selected.name !== 'Default' ? <p className="mt-1 text-lg text-muted-foreground">{selected.name}</p> : null}
          </div>
          <dl className="flex flex-col gap-5 text-lg">
            <div className="flex justify-between gap-4"><dt>{copy.quantity}</dt><dd className="text-3xl font-black tabular-nums">{quantity > 0 ? `+${quantity}` : quantity}</dd></div>
            <div className="flex justify-between gap-4"><dt>{copy.reason}</dt><dd className="font-bold">{reasonLabel(reason)}</dd></div>
          </dl>
          {error ? <p role="alert" className="rounded-xl bg-destructive-soft p-4 text-base font-semibold text-destructive-foreground">{error}</p> : null}
        </div>
      </PosLayout>
    )
  }

  if (screen === 'edit' && selected) {
    return (
      <PosLayout bottomAction={<Button className="h-16 w-full rounded-xl text-lg font-bold" disabled={quantity === 0} onClick={() => setScreen('review')}>{copy.review}</Button>}>
        <div className="flex flex-col gap-6">
          <Button variant="ghost" className="min-h-12 w-fit px-2 text-base" onClick={reset}><ArrowLeft data-icon="inline-start" />{copy.back}</Button>
          <div>
            <h2 className="text-2xl font-bold">{selected.product_name}</h2>
            {selected.name !== 'Default' ? <p className="mt-1 text-lg text-muted-foreground">{selected.name}</p> : null}
          </div>
          <div className="flex flex-col gap-3 border-y border-border py-5">
            <p className="text-lg font-semibold">{copy.quantity}</p>
            <div className="flex items-center justify-center gap-5">
              <Button variant="outline" className="size-16 rounded-xl" onClick={() => setQuantity((value) => value - 1)} aria-label={copy.decrease}><Minus aria-hidden="true" className="size-7" /></Button>
              <Input type="number" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 0)} className="h-16 w-28 text-center text-3xl font-black" aria-label={copy.quantity} />
              <Button variant="outline" className="size-16 rounded-xl" onClick={() => setQuantity((value) => value + 1)} aria-label={copy.increase}><Plus aria-hidden="true" className="size-7" /></Button>
            </div>
          </div>
          <label className="flex flex-col gap-2 text-lg font-semibold">
            {copy.reason}
            <Select value={reason} onValueChange={(value) => setReason(value as AdjustmentReason)}>
              <SelectTrigger className="h-14 rounded-xl text-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{reasons.map((item) => <SelectItem key={item.value} value={item.value} className="min-h-12 text-base">{posLocale === 'th' ? item.th : item.en}</SelectItem>)}</SelectContent>
            </Select>
          </label>
        </div>
      </PosLayout>
    )
  }

  return (
    <PosLayout>
      <div className="flex flex-col gap-6">
        <div><h2 className="text-2xl font-bold">{copy.title}</h2><p className="mt-1 text-lg text-muted-foreground">{copy.find}</p></div>
        {failedCount > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-warning-soft p-4 text-warning-foreground">
            <p className="flex items-center gap-2 text-base font-semibold"><AlertCircle aria-hidden="true" className="size-5" />{copy.needsAttention}</p>
            <Button variant="outline" className="min-h-12" onClick={() => void syncPendingAdjustments().then(() => queuedQuery.refetch())}>{copy.retry}</Button>
          </div>
        ) : null}
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setError(null) }} placeholder={copy.placeholder} className="h-14 rounded-xl pl-12 text-lg" />
          </div>
          <Button variant="outline" className="size-14 shrink-0 rounded-xl" onClick={() => setScannerOpen(true)} aria-label={copy.scan}><ScanBarcode aria-hidden="true" className="size-6" /></Button>
        </div>
        {error ? <p role="alert" className="rounded-xl bg-destructive-soft p-4 text-base font-semibold text-destructive-foreground">{error}</p> : null}
        {isLoading ? <p className="text-lg text-muted-foreground">Loading products…</p> : null}
        {query.trim().length >= 2 ? (
          <div className="divide-y divide-border border-y border-border">
            {matches.map((variant) => (
              <button key={variant.id} type="button" onClick={() => chooseVariant(variant)} className="flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
                <span className="min-w-0"><span className="block truncate text-lg font-bold">{variant.product_name}</span>{variant.name !== 'Default' ? <span className="block truncate text-base text-muted-foreground">{variant.name}</span> : null}</span>
                <span className="shrink-0 text-base text-muted-foreground">{variant.sku}</span>
              </button>
            ))}
            {matches.length === 0 && !isLoading ? <p className="py-8 text-center text-lg text-muted-foreground">{copy.noMatch}</p> : null}
          </div>
        ) : null}
      </div>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="inset-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-0 p-5 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border">
          <DialogHeader className="pr-10 text-left"><DialogTitle className="text-2xl">{copy.scan}</DialogTitle><DialogDescription className="text-base">{copy.find}</DialogDescription></DialogHeader>
          <BarcodeScanner onScanSuccess={chooseVariant} onScanError={(_code, message) => setError(message)} />
        </DialogContent>
      </Dialog>
    </PosLayout>
  )
}
