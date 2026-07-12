/* eslint-disable react-refresh/only-export-components */

import { useCallback, useMemo, useState } from 'react'
import { createRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, CheckCircle2, Minus, Plus, ScanBarcode, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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

export const Route = createRoute({ getParentRoute: () => rootRoute, path: 'pos/inventory', component: PosInventoryRoute })

type AdjustmentReason = QueuedAdjustment['reason']
type Direction = 'add' | 'remove'
type Screen = 'find' | 'edit' | 'saved'

const copy = posLocale === 'th' ? {
  title: 'ปรับสต็อก', find: 'สแกนสินค้าเพื่อเริ่ม', placeholder: 'ค้นหาด้วยชื่อ รหัส หรือบาร์โค้ด', scan: 'สแกนบาร์โค้ดด้วยกล้อง',
  searchFallback: 'หรือค้นหาด้วยชื่อสินค้า', noMatch: 'ไม่พบสินค้า', itemNotFound: 'ไม่พบสินค้านี้', cameraUnavailable: 'กล้องไม่พร้อมใช้งาน', retrying: 'กำลังลองส่งข้อมูล…', retryFailed: 'ยังส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง',
  quantity: 'จำนวน', reason: 'สาเหตุ', save: 'บันทึกการปรับสต็อก', saved: 'บันทึกแล้ว', savedOffline: 'บันทึกไว้ในโทรศัพท์นี้แล้ว',
  savedOnline: 'บันทึกแล้ว ระบบกำลังส่งข้อมูลอัตโนมัติ', another: 'ปรับสินค้าอีกชิ้น', done: 'เสร็จสิ้น', back: 'ย้อนกลับ', retry: 'ลองอีกครั้ง',
  needsAttention: 'มีรายการที่ต้องตรวจสอบ', increase: 'เพิ่ม', decrease: 'ลด', add: 'เพิ่มสินค้า', remove: 'ตัดสินค้า', current: 'สต็อกปัจจุบัน', after: 'หลังปรับ',
  other: 'จำนวนอื่น', notEnough: 'สต็อกไม่พอสำหรับการตัดจำนวนนี้', discardTitle: 'ยกเลิกการปรับสินค้า?', discard: 'ยกเลิก', keepEditing: 'แก้ไขต่อ', scanAgain: 'สแกนอีกครั้ง', search: 'ค้นหาสินค้า',
} : {
  title: 'Adjust stock', find: 'Scan an item to begin', placeholder: 'Search by name, SKU, or barcode', scan: 'Scan barcode with camera',
  searchFallback: 'Or search by product name', noMatch: 'No matching product', itemNotFound: 'Item not found', cameraUnavailable: 'Camera unavailable', retrying: 'Trying again…', retryFailed: 'Still unable to sync. Try again.',
  quantity: 'Quantity', reason: 'Reason', save: 'Save adjustment', saved: 'Adjustment saved', savedOffline: 'Saved on this phone',
  savedOnline: 'Saved. It is syncing automatically.', another: 'Adjust another item', done: 'Done', back: 'Back', retry: 'Try again',
  needsAttention: 'Some adjustments need attention', increase: 'Increase', decrease: 'Decrease', add: 'Add stock', remove: 'Remove stock', current: 'Current stock', after: 'After change',
  other: 'Other amount', notEnough: 'Not enough stock for this removal', discardTitle: 'Discard this adjustment?', discard: 'Discard', keepEditing: 'Keep editing', scanAgain: 'Scan again', search: 'Search by name',
}

const reasons: Array<{ value: AdjustmentReason; direction: Direction; th: string; en: string }> = [
  { value: 'RESTOCK', direction: 'add', th: 'รับสินค้าเข้า', en: 'Restock' },
  { value: 'RETURN', direction: 'add', th: 'ลูกค้าคืนสินค้า', en: 'Customer return' },
  { value: 'DAMAGE', direction: 'remove', th: 'สินค้าเสียหาย', en: 'Damaged' },
  { value: 'LOST', direction: 'remove', th: 'สินค้าสูญหาย', en: 'Missing' },
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
  const [direction, setDirection] = useState<Direction>('add')
  const [quantity, setQuantity] = useState(1)
  const [customAmount, setCustomAmount] = useState('')
  const [reason, setReason] = useState<AdjustmentReason>('RESTOCK')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products-all'], queryFn: async () => (await api.getProducts()).data, staleTime: 60_000 })
  const queuedQuery = useQuery({ queryKey: ['queued-adjustments'], queryFn: getAllQueuedAdjustments, staleTime: 0 })
  const queued = queuedQuery.data ?? []
  const variants = useMemo<SearchVariantRow[]>(() => products.flatMap((product) => product.variants.filter((variant) => variant.is_active).map((variant) => ({ ...variant, product_name: product.product.name }))), [products])
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (normalized.length < 2) return []
    return variants.filter((variant) => variant.product_name.toLocaleLowerCase().includes(normalized) || variant.name.toLocaleLowerCase().includes(normalized) || variant.sku.toLocaleLowerCase().includes(normalized) || variant.barcode?.toLocaleLowerCase().includes(normalized)).slice(0, 8)
  }, [query, variants])
  const currentStock = selected?.stockLevel ?? 0
  const stockDelta = direction === 'add' ? quantity : -quantity
  const resultingStock = currentStock + stockDelta
  const canSave = quantity > 0 && (direction === 'add' || resultingStock >= 0)
  const visibleReasons = reasons.filter((item) => item.direction === direction)

  const chooseVariant = useCallback((variant: SearchVariantRow) => {
    setSelected(variant); setQuantity(1); setCustomAmount(''); setDirection('add'); setReason('RESTOCK'); setQuery(''); setError(null); setScreen('edit'); setScannerOpen(false)
  }, [])
  const findBarcode = useCallback(async (code: string) => {
    try { chooseVariant((await api.searchVariant(code)).data) } catch { setError(copy.itemNotFound) }
  }, [chooseVariant])
  useKeyboardWedge({ onScan: findBarcode })

  const selectDirection = (next: Direction) => {
    setDirection(next)
    setReason(next === 'add' ? 'RESTOCK' : 'DAMAGE')
    setError(null)
  }
  const setAmount = (amount: number) => { setQuantity(Math.max(1, Math.floor(amount))); setCustomAmount('') }
  const saveAdjustment = async () => {
    if (!selected || !canSave || saving) return
    setSaving(true); setError(null)
    try {
      await queueAdjustment({ id: crypto.randomUUID(), variantId: selected.id, variantName: selected.product_name, sku: selected.sku, quantity: stockDelta, reason })
      await queuedQuery.refetch(); setScreen('saved')
      if (isOnline) void syncPendingAdjustments().then(() => queuedQuery.refetch())
    } catch { setError(copy.savedOffline + '. ' + copy.retry) } finally { setSaving(false) }
  }
  const reset = () => { setSelected(null); setQuantity(1); setCustomAmount(''); setDirection('add'); setReason('RESTOCK'); setError(null); setScreen('find') }
  const goBack = () => { if (quantity !== 1 || direction !== 'add' || reason !== 'RESTOCK') setDiscardOpen(true); else reset() }
  const failedCount = queued.filter((item) => item.status === 'failed').length
  const retryFailedAdjustments = async () => {
    if (retrying) return
    setRetrying(true); setRetryError(null)
    const synced = await syncPendingAdjustments()
    await queuedQuery.refetch()
    if (!synced) setRetryError(copy.retryFailed)
    setRetrying(false)
  }

  if (screen === 'saved') return <PosLayout><section className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-6 text-center"><CheckCircle2 aria-hidden="true" className="size-16 text-success" /><div className="flex flex-col gap-2"><h2 className="text-3xl font-bold">{copy.saved}</h2><p className="max-w-sm text-lg text-muted-foreground">{isOnline ? copy.savedOnline : copy.savedOffline}</p></div><div className="flex w-full flex-col gap-3"><Button className="h-16 w-full rounded-xl text-lg font-bold" onClick={reset}>{copy.another}</Button><Button variant="outline" className="h-14 w-full rounded-xl text-lg" onClick={reset}>{copy.done}</Button></div></section></PosLayout>

  if (screen === 'edit' && selected) return <PosLayout bottomAction={<Button className="h-16 w-full rounded-xl text-lg font-bold" disabled={!canSave || saving} onClick={() => void saveAdjustment()}>{copy.save}</Button>}>
    <div className="flex flex-col gap-6">
      <Button variant="ghost" className="min-h-12 w-fit px-2 text-base" onClick={goBack}><ArrowLeft data-icon="inline-start" />{copy.back}</Button>
      <div><h2 className="text-2xl font-bold">{selected.product_name}</h2>{selected.name !== 'Default' ? <p className="mt-1 text-lg text-muted-foreground">{selected.name}</p> : null}<p className="mt-2 text-lg"><span className="text-muted-foreground">{copy.current}: </span><strong>{currentStock}</strong></p></div>
      <div className="grid grid-cols-2 gap-3"><Button type="button" variant={direction === 'add' ? 'default' : 'outline'} className="h-16 rounded-xl text-lg font-bold" onClick={() => selectDirection('add')}><Plus data-icon="inline-start" />{copy.add}</Button><Button type="button" variant={direction === 'remove' ? 'default' : 'outline'} className="h-16 rounded-xl text-lg font-bold" onClick={() => selectDirection('remove')}><Minus data-icon="inline-start" />{copy.remove}</Button></div>
      <div className="flex flex-col gap-3 border-y border-border py-5"><p className="text-lg font-semibold">{copy.quantity}</p><div className="flex items-center justify-center gap-3"><Button variant="outline" className="size-14 rounded-xl" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label={copy.decrease}><Minus aria-hidden="true" /></Button><span aria-label={copy.quantity} className="min-w-16 text-center text-3xl font-black tabular-nums">{quantity}</span><Button variant="outline" className="size-14 rounded-xl" onClick={() => setQuantity((value) => value + 1)} aria-label={copy.increase}><Plus aria-hidden="true" /></Button></div><div className="grid grid-cols-3 gap-2">{[1, 5, 10].map((amount) => <Button key={amount} type="button" variant={quantity === amount && customAmount === '' ? 'secondary' : 'outline'} className="min-h-12 text-lg" onClick={() => setAmount(amount)}>{amount}</Button>)}</div><label className="flex flex-col gap-2 text-base font-semibold">{copy.other}<Input value={customAmount} inputMode="numeric" pattern="[0-9]*" onChange={(event) => { const value = event.target.value.replace(/[^0-9]/g, ''); setCustomAmount(value); if (value) setQuantity(Math.max(1, Number(value))) }} className="h-14 rounded-xl text-lg" /></label></div>
      <div className="flex flex-col gap-3"><p className="text-lg font-semibold">{copy.reason}</p><div className="grid gap-2">{visibleReasons.map((item) => <Button key={item.value} type="button" variant={reason === item.value ? 'default' : 'outline'} className="min-h-14 justify-start rounded-xl px-4 text-left text-lg" onClick={() => setReason(item.value)}>{posLocale === 'th' ? item.th : item.en}</Button>)}</div></div>
      <div className="border-y border-border py-4 text-lg"><div className="flex justify-between"><span>{copy.after}</span><strong className={resultingStock < 0 ? 'text-destructive' : ''}>{resultingStock}</strong></div><p className="mt-2 font-semibold">{direction === 'add' ? copy.add : copy.remove} {quantity} · {reasonLabel(reason)}</p></div>
      {resultingStock < 0 ? <p role="alert" className="rounded-xl bg-destructive-soft p-4 text-base font-semibold text-destructive-foreground">{copy.notEnough}</p> : null}{error ? <p role="alert" className="rounded-xl bg-destructive-soft p-4 text-base font-semibold text-destructive-foreground">{error}</p> : null}
    </div>
    <Dialog open={discardOpen} onOpenChange={setDiscardOpen}><DialogContent><DialogHeader><DialogTitle>{copy.discardTitle}</DialogTitle><DialogDescription>{copy.discardTitle}</DialogDescription></DialogHeader><div className="flex gap-3"><Button variant="outline" className="min-h-12 flex-1" onClick={() => setDiscardOpen(false)}>{copy.keepEditing}</Button><Button variant="destructive" className="min-h-12 flex-1" onClick={() => { setDiscardOpen(false); reset() }}>{copy.discard}</Button></div></DialogContent></Dialog>
  </PosLayout>

  return <PosLayout><div className="flex flex-col gap-6"><div><h2 className="text-2xl font-bold">{copy.title}</h2><p className="mt-1 text-lg text-muted-foreground">{copy.find}</p></div>{failedCount > 0 ? <div className="flex flex-col gap-3 rounded-xl bg-warning-soft p-4 text-warning-foreground"><p className="flex items-center gap-2 text-base font-semibold"><AlertCircle aria-hidden="true" className="size-5" />{copy.needsAttention}</p>{retryError ? <p role="alert" className="text-base font-semibold">{retryError}</p> : null}<Button variant="outline" className="min-h-12" disabled={retrying} onClick={() => void retryFailedAdjustments()}>{retrying ? copy.retrying : copy.retry}</Button></div> : null}<Button className="h-20 w-full rounded-xl text-xl font-bold" onClick={() => { setError(null); setScannerOpen(true) }}><ScanBarcode data-icon="inline-start" />{copy.scan}</Button><div className="flex flex-col gap-2"><p className="text-base font-semibold text-muted-foreground">{copy.searchFallback}</p><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setError(null) }} placeholder={copy.placeholder} className="h-14 rounded-xl pl-12 text-lg" /></div></div>{error ? <div role="alert" className="flex flex-col gap-3 rounded-xl bg-destructive-soft p-4 text-base font-semibold text-destructive-foreground"><p>{error}</p>{error === copy.itemNotFound ? <Button variant="outline" className="min-h-12" onClick={() => setScannerOpen(true)}>{copy.scanAgain}</Button> : null}</div> : null}{isLoading ? <p className="text-lg text-muted-foreground">Loading products…</p> : null}{query.trim().length >= 2 ? <div className="divide-y divide-border border-y border-border">{matches.map((variant) => <button key={variant.id} type="button" onClick={() => chooseVariant(variant)} className="flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"><span className="min-w-0"><span className="block truncate text-lg font-bold">{variant.product_name}</span>{variant.name !== 'Default' ? <span className="block truncate text-base text-muted-foreground">{variant.name}</span> : null}</span><span className="shrink-0 text-base text-muted-foreground">{variant.sku}</span></button>)}{matches.length === 0 && !isLoading ? <p className="py-8 text-center text-lg text-muted-foreground">{copy.noMatch}</p> : null}</div> : null}</div><Dialog open={scannerOpen} onOpenChange={setScannerOpen}><DialogContent className="inset-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-0 p-5 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border"><DialogHeader className="pr-10 text-left"><DialogTitle className="text-2xl">{copy.scan}</DialogTitle><DialogDescription className="text-base">{copy.find}</DialogDescription></DialogHeader><BarcodeScanner onScanSuccess={chooseVariant} onScanError={(_code, message) => setError(message || copy.cameraUnavailable)} /></DialogContent></Dialog></PosLayout>
}
