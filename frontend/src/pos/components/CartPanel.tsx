import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Banknote, CheckCircle2, QrCode, ReceiptText, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { api, type PaymentMethod, type ReceiptSnapshot } from '@/lib/api'
import { formatCurrency } from '@/lib/formatCurrency'
import { buildPromptPayQrDataUrl } from '@/lib/promptpay'
import { printReceipt } from '@/lib/receipt'
import { useCart } from '@/pos/hooks/useCart'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'
import { useOfflineOrders } from '@/pos/hooks/useOfflineOrders'
import { usePosCheckoutSession } from '@/pos/hooks/usePosCheckoutSession'
import { useLatestReceipt } from '@/pos/hooks/useLatestReceipt'
import { PosLayout } from '@/pos/layout/PosLayout'
import { posCopy } from '@/pos/lib/copy'
import { CartItemRow } from './CartItemRow'

function parseTHB(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0
}

function toTHBInput(value: number) {
  return String(value / 100)
}

function cashShortcuts(total: number) {
  const denominations = [2000, 5000, 10000, 50000, 100000]
  const values = [total]
  for (const denomination of denominations) {
    const rounded = Math.ceil(total / denomination) * denomination
    if (rounded >= total && !values.includes(rounded)) values.push(rounded)
    if (values.length === 4) break
  }
  return values
}

function localReceipt(
  orderId: string,
  items: ReturnType<typeof useCart>['items'],
  discountAmount: number,
  totalAmount: number,
  paymentMethod: PaymentMethod,
  tenderedAmount: number,
): ReceiptSnapshot {
  return {
    store_name: import.meta.env.VITE_STORE_NAME ?? 'OpenPOS',
    paid_at: new Date().toISOString(),
    order_id: orderId,
    items: items.map((item) => ({
      name: item.variantName === 'Default' ? item.productName : `${item.productName} · ${item.variantName}`,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.subtotal,
    })),
    discount_amount: discountAmount,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    tendered_amount: tenderedAmount,
    change_due: paymentMethod === 'cash' ? Math.max(tenderedAmount - totalAmount, 0) : 0,
  }
}

export function CartPanel() {
  const { user } = useAuth()
  const { isOnline } = useNetworkStatus()
  const { queueOrder } = useOfflineOrders()
  const { rememberLatestReceipt } = useLatestReceipt()
  const { items, itemCount, total, updateQuantity, removeItem, clearCart, isEmpty } = useCart()
  const { session, updateSession, resetSale } = usePosCheckoutSession()
  const [discountInput, setDiscountInput] = useState(toTHBInput(session.discountAmount))
  const [tenderedInput, setTenderedInput] = useState(toTHBInput(session.tenderedAmount || total))
  const [qrState, setQrState] = useState<{ key: string; url: string | null; error: boolean }>({ key: '', url: null, error: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const submissionLock = useRef(false)

  const discountAmount = Math.min(parseTHB(discountInput), total)
  const grandTotal = Math.max(total - discountAmount, 0)
  const tenderedAmount = parseTHB(tenderedInput)
  const canComplete = session.paymentMethod === 'promptpay' || tenderedAmount >= grandTotal
  const shortcuts = useMemo(() => cashShortcuts(grandTotal), [grandTotal])
  const qrKey = `${import.meta.env.VITE_PROMPTPAY_MERCHANT_ID ?? '0000000000000'}:${grandTotal}`
  const qrDataUrl = qrState.key === qrKey ? qrState.url : null
  const qrError = qrState.key === qrKey && qrState.error

  useEffect(() => {
    if (session.stage !== 'payment' || session.paymentMethod !== 'promptpay') return
    let cancelled = false
    void buildPromptPayQrDataUrl(import.meta.env.VITE_PROMPTPAY_MERCHANT_ID ?? '0000000000000', grandTotal)
      .then((url) => { if (!cancelled) setQrState({ key: qrKey, url, error: false }) })
      .catch(() => { if (!cancelled) setQrState({ key: qrKey, url: null, error: true }) })
    return () => { cancelled = true }
  }, [grandTotal, qrKey, session.paymentMethod, session.stage])

  const setPaymentMethod = (method: PaymentMethod) => {
    const amount = grandTotal
    setTenderedInput(toTHBInput(amount))
    updateSession({ paymentMethod: method, tenderedAmount: amount })
  }

  const changeDiscount = (value: string) => {
    setDiscountInput(value)
    const nextDiscount = Math.min(parseTHB(value), total)
    const nextTotal = Math.max(total - nextDiscount, 0)
    setTenderedInput(toTHBInput(nextTotal))
    updateSession({ discountAmount: nextDiscount, tenderedAmount: nextTotal })
  }

  const goToPayment = () => {
    const amount = grandTotal
    setTenderedInput(toTHBInput(amount))
    updateSession({ stage: 'payment', tenderedAmount: amount })
  }

  const completeSale = async () => {
    if (submissionLock.current || isEmpty || !canComplete) return
    submissionLock.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    const paidAmount = session.paymentMethod === 'promptpay' ? grandTotal : tenderedAmount
    const receiptFallback = localReceipt(session.orderId, items, discountAmount, grandTotal, session.paymentMethod, paidAmount)

    try {
      let receipt: ReceiptSnapshot
      let savedOffline = false
      if (isOnline) {
        const order = await api.createOrder({
          client_uuid: session.orderId,
          discount_amount: discountAmount,
          items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity, unit_price: item.price })),
        })
        const payment = await api.completePayment(order.data.id, {
          method: session.paymentMethod,
          tendered_amount: paidAmount,
        })
        receipt = payment.data
        rememberLatestReceipt(order.data.id)
      } else {
        if (!user?.id) throw new Error('Signed-in user is missing')
        await queueOrder({
          id: session.orderId,
          userId: user.id,
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity, priceSnapshot: item.price })),
          total: grandTotal,
          discountAmount,
          paymentMethod: session.paymentMethod,
          tenderedAmount: paidAmount,
          localReceipt: receiptFallback,
        })
        receipt = receiptFallback
        savedOffline = true
      }

      clearCart()
      updateSession({ stage: 'complete', receipt, savedOffline, tenderedAmount: paidAmount, discountAmount })
      await printReceipt(receipt)
    } catch {
      setSubmitError(posCopy.paymentError)
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }

  const startNextSale = () => {
    clearCart()
    resetSale()
  }

  if (session.stage === 'complete' && session.receipt) {
    return (
      <PosLayout>
        <section className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-6 text-center">
          <CheckCircle2 aria-hidden="true" className="size-16 text-success" />
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold">{posCopy.done}</h2>
            {session.savedOffline ? (
              <p className="max-w-sm text-lg text-muted-foreground">{posCopy.savedOnPhone}. {posCopy.savedOnPhoneHelp}</p>
            ) : null}
          </div>
          {session.receipt.payment_method === 'cash' ? (
            <div className="w-full border-y border-border py-6">
              <p className="text-lg font-semibold text-muted-foreground">{posCopy.changeDue}</p>
              <p className="mt-2 text-5xl font-black tabular-nums text-foreground">{formatCurrency(session.receipt.change_due)}</p>
            </div>
          ) : (
            <p className="text-4xl font-black tabular-nums">{formatCurrency(session.receipt.total_amount)}</p>
          )}
          <div className="flex w-full flex-col gap-3">
            <Button className="h-16 w-full rounded-xl text-lg font-bold" onClick={startNextSale}>{posCopy.nextSale}</Button>
            <Button variant="outline" className="h-14 w-full rounded-xl text-lg" onClick={() => void printReceipt(session.receipt!)}>
              <ReceiptText data-icon="inline-start" />
              {posCopy.printAgain}
            </Button>
          </div>
        </section>
      </PosLayout>
    )
  }

  if (session.stage === 'payment') {
    return (
      <PosLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="min-h-12 px-2 text-base" onClick={() => updateSession({ stage: 'reviewing' })}>
              <ArrowLeft data-icon="inline-start" />{posCopy.back}
            </Button>
            <h2 className="text-2xl font-bold">{posCopy.payment}</h2>
          </div>

          <div className="border-y border-border py-5 text-center">
            <p className="text-lg font-semibold text-muted-foreground">{posCopy.totalDue}</p>
            <p className="mt-2 text-5xl font-black tabular-nums">{formatCurrency(grandTotal)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3" aria-label={posCopy.payment}>
            <Button variant={session.paymentMethod === 'cash' ? 'default' : 'outline'} className="h-16 rounded-xl text-lg" onClick={() => setPaymentMethod('cash')}>
              <Banknote data-icon="inline-start" />{posCopy.cash}
            </Button>
            <Button variant={session.paymentMethod === 'promptpay' ? 'default' : 'outline'} className="h-16 rounded-xl text-lg" onClick={() => setPaymentMethod('promptpay')}>
              <QrCode data-icon="inline-start" />{posCopy.qr}
            </Button>
          </div>

          {session.paymentMethod === 'cash' ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                {shortcuts.map((amount, index) => (
                  <Button key={amount} variant="outline" className="h-14 rounded-xl text-lg font-bold" onClick={() => {
                    setTenderedInput(toTHBInput(amount))
                    updateSession({ tenderedAmount: amount })
                  }}>
                    {index === 0 ? posCopy.exact : formatCurrency(amount)}
                  </Button>
                ))}
              </div>
              <label className="flex flex-col gap-2 text-lg font-semibold">
                {posCopy.amountReceived}
                <Input
                  type="number"
                  inputMode="decimal"
                  min={grandTotal / 100}
                  step="0.01"
                  value={tenderedInput}
                  onChange={(event) => {
                    setTenderedInput(event.target.value)
                    updateSession({ tenderedAmount: parseTHB(event.target.value) })
                  }}
                  className="h-14 rounded-xl text-right text-xl font-bold"
                />
              </label>
              <div className="rounded-xl bg-success-soft p-4 text-success-foreground">
                <p className="text-lg font-semibold">{posCopy.changeDue}</p>
                <p className="mt-1 text-4xl font-black tabular-nums">{formatCurrency(Math.max(tenderedAmount - grandTotal, 0))}</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
              {qrDataUrl ? <img src={qrDataUrl} alt="PromptPay QR" className="size-64 border border-border bg-card p-3" /> : null}
              {!qrDataUrl && !qrError ? <p className="text-lg text-muted-foreground">Loading QR…</p> : null}
              {qrError ? <p className="text-lg text-destructive">QR could not be created. Choose cash or try again.</p> : null}
            </div>
          )}

          {submitError ? <p role="alert" className="rounded-xl bg-destructive-soft p-4 text-base font-semibold text-destructive-foreground">{submitError}</p> : null}
          <Button
            className="h-16 w-full rounded-xl text-lg font-bold"
            disabled={!canComplete || isSubmitting || (session.paymentMethod === 'promptpay' && !qrDataUrl)}
            onClick={() => void completeSale()}
          >
            {isSubmitting ? posCopy.completing : isOnline ? posCopy.confirmPayment : posCopy.saveOffline}
          </Button>
        </div>
      </PosLayout>
    )
  }

  return (
    <PosLayout bottomAction={!isEmpty ? (
      <Button className="h-16 w-full rounded-xl text-lg font-bold" onClick={goToPayment}>{posCopy.continuePayment}</Button>
    ) : null}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" className="min-h-12 px-2 text-base" onClick={() => updateSession({ stage: 'selling' })}>
            <ArrowLeft data-icon="inline-start" />{posCopy.back}
          </Button>
          <h2 className="text-2xl font-bold">{posCopy.order}</h2>
          <Button variant="ghost" className="min-h-12 px-2 text-base text-destructive" onClick={() => setClearDialogOpen(true)}>
            <Trash2 data-icon="inline-start" />{posCopy.clearOrder}
          </Button>
        </div>

        {isEmpty ? (
          <div className="py-16 text-center">
            <p className="text-xl font-bold">{posCopy.emptyOrder}</p>
            <p className="mt-2 text-base text-muted-foreground">{posCopy.emptyOrderHelp}</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <CartItemRow key={item.variantId} item={item} onUpdateQuantity={updateQuantity} onRemove={removeItem} compact />
            ))}
          </div>
        )}

        {!isEmpty ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-lg">
              <span>{posCopy.itemCount}</span><strong className="tabular-nums">{itemCount}</strong>
            </div>
            <div className="flex items-center justify-between text-xl font-bold">
              <span>{posCopy.subtotal}</span><span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
            <details className="border-y border-border py-3">
              <summary className="flex min-h-12 cursor-pointer items-center text-base font-semibold text-primary">{posCopy.addDiscount}</summary>
              <label className="mt-2 flex items-center justify-between gap-4 text-base">
                {posCopy.discount}
                <Input type="number" inputMode="decimal" min="0" max={total / 100} step="0.01" value={discountInput} onChange={(event) => changeDiscount(event.target.value)} className="h-12 w-36 text-right text-lg" />
              </label>
            </details>
            <div className="flex items-center justify-between border-b border-border pb-4 text-2xl font-black">
              <span>{posCopy.totalDue}</span><span className="tabular-nums text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{posCopy.clearOrderQuestion}</DialogTitle>
            <DialogDescription className="text-base">{posCopy.emptyOrderHelp}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-12 text-base" onClick={() => setClearDialogOpen(false)}>{posCopy.keepOrder}</Button>
            <Button variant="destructive" className="h-12 text-base" onClick={() => { clearCart(); resetSale(); setClearDialogOpen(false) }}>{posCopy.clearOrder}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PosLayout>
  )
}
