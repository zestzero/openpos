'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Banknote, QrCode, ReceiptText, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, type PaymentMethod } from '@/lib/api'
import { formatCurrency } from '@/lib/formatCurrency'
import { buildPromptPayQrDataUrl } from '@/lib/promptpay'
import { printReceipt } from '@/lib/receipt'
import { useCart } from '@/pos/hooks/useCart'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'
import { useLatestReceipt } from '@/pos/hooks/useLatestReceipt'
import { usePosCheckoutSession } from '@/pos/hooks/usePosCheckoutSession'
import { CartItemRow } from './CartItemRow'
import { SyncStatus } from './SyncStatus'
import { toast } from 'sonner'

type CartPanelProps = {
  compact?: boolean
}

function parseCurrencyInputToSatang(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0
}

function satangToCurrencyInput(value: number) {
  return String(value / 100)
}

export function CartPanel({ compact = false }: CartPanelProps) {
  const { isOnline } = useNetworkStatus()
  const { items, itemCount, total, updateQuantity, removeItem, clearCart, isEmpty } = useCart()
  const { session, startReview, updateSession, clearSession } = usePosCheckoutSession()
  const { rememberLatestReceipt } = useLatestReceipt()

  const [discountInput, setDiscountInput] = useState(satangToCurrencyInput(session?.discountAmount ?? 0))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(session?.paymentMethod ?? 'cash')
  const [tenderedInput, setTenderedInput] = useState(satangToCurrencyInput(session?.tenderedAmount || total))
  const [promptPayQr, setPromptPayQr] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const discountAmount = useMemo(() => Math.min(parseCurrencyInputToSatang(discountInput), total), [discountInput, total])
  const grandTotal = useMemo(() => Math.max(total - discountAmount, 0), [total, discountAmount])
  const tenderedAmount = useMemo(() => parseCurrencyInputToSatang(tenderedInput), [tenderedInput])
  const paymentAmount = paymentMethod === 'promptpay' ? grandTotal : tenderedAmount
  const canCompletePayment = paymentMethod === 'promptpay' ? paymentAmount === grandTotal : paymentAmount >= grandTotal

  const isCheckoutInitiated = session !== null && session.stage !== 'building'

  useEffect(() => {
    if (isCheckoutInitiated && paymentMethod === 'promptpay') {
      let cancelled = false

      buildPromptPayQrDataUrl(import.meta.env.VITE_PROMPTPAY_MERCHANT_ID ?? '0000000000000', grandTotal)
        .then((dataUrl) => {
          if (!cancelled) {
            setPromptPayQr(dataUrl)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPromptPayQr(null)
          }
        })

      return () => {
        cancelled = true
      }
    }

    return undefined
  }, [isCheckoutInitiated, paymentMethod, grandTotal])

  const startCheckout = () => {
    const orderId = session?.orderId ?? crypto.randomUUID()
    startReview(orderId)
    setDiscountInput('0')
    setTenderedInput(satangToCurrencyInput(total))
    setSubmitError(null)
  }

  const abandonCheckout = () => {
    clearSession()
    setDiscountInput('0')
    setPaymentMethod('cash')
    setTenderedInput(satangToCurrencyInput(total))
    setPromptPayQr(null)
    setSubmitError(null)
  }

  const handleDiscountChange = (val: string) => {
    setDiscountInput(val)
    const amount = Math.min(parseCurrencyInputToSatang(val), total)
    const newGrandTotal = Math.max(total - amount, 0)
    setTenderedInput(satangToCurrencyInput(newGrandTotal))
    updateSession({ discountAmount: amount, tenderedAmount: newGrandTotal })
  }

  const handleTenderedChange = (val: string) => {
    setTenderedInput(val)
    const amount = parseCurrencyInputToSatang(val)
    updateSession({ tenderedAmount: amount })
  }

  const selectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method)
    setTenderedInput(satangToCurrencyInput(grandTotal))
    updateSession({ paymentMethod: method, tenderedAmount: grandTotal })
  }

  const finalizeOrder = async () => {
    if (!session) return

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const orderPayload = {
        client_uuid: session.orderId,
        discount_amount: discountAmount,
        items: items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      }

      const created = await api.createOrder(orderPayload)
      const paymentResult = await api.completePayment(created.data.id, {
        method: paymentMethod,
        tendered_amount: paymentMethod === 'promptpay' ? grandTotal : tenderedAmount,
      })

      rememberLatestReceipt(created.data.id)
      clearCart()
      clearSession()
      setDiscountInput('0')
      setPaymentMethod('cash')
      setTenderedInput('0')
      setPromptPayQr(null)
      toast.success('Order completed')
      await printReceipt(paymentResult.data)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Checkout failed')
      toast.error('Checkout saved locally. Retry when the service is back.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEmpty) {
    return (
      <div className={`text-center ${compact ? 'py-6' : 'rounded-card border border-dashed border-border bg-card p-8 shadow-card'}`}>
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground ${compact ? 'h-12 w-12' : ''}`}>
          <ReceiptText className="h-6 w-6" />
        </div>
        <p className={`${compact ? 'mt-3 text-base' : 'mt-4 text-lg'} font-semibold text-foreground`}>Cart is empty</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Add items from selling or catalog to start checkout.
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? 'relative flex h-full min-h-0 flex-col' : 'rounded-3xl border-none bg-white p-6 shadow-sm flex flex-col min-h-0'}>
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {compact ? 'Cart' : 'Order workspace'}
          </p>
          <h2 className={`${compact ? 'mt-1 text-base' : 'mt-1 text-lg'} font-semibold text-foreground`}>
            {isCheckoutInitiated ? 'Checkout' : 'Items ready'}
          </h2>
          {compact ? <p className="mt-1 text-sm text-muted-foreground">{itemCount} items, {formatCurrency(total)} total</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <SyncStatus />
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-col min-h-0 flex-1">
        {/* Cart items list */}
        <div className={`${compact ? 'min-h-0 flex-1 overflow-y-auto space-y-2 px-0 py-3' : 'max-h-[16rem] overflow-y-auto p-2 border-b border-gray-100'}`}>
          {items.map((item) => (
            <CartItemRow
              key={item.variantId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              compact={compact}
            />
          ))}
        </div>

        {!isCheckoutInitiated ? (
          <div className={`${compact ? 'shrink-0 bg-white px-0 pt-3' : 'border-t border-gray-100 pt-6'}`}>
            <div className={`${compact ? 'rounded-3xl bg-white p-3 shadow-sm' : ''}`}>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Item count</span>
                <span className="font-bold text-gray-900">{itemCount}</span>
              </div>
              <div className="mb-6 flex items-center justify-between text-xl font-bold">
                <span className="text-gray-900">Subtotal</span>
                <span className="text-brand">{formatCurrency(total)}</span>
              </div>
              <Button
                className="h-14 w-full rounded-full bg-brand text-lg font-bold text-white shadow-md transition-transform active:scale-95"
                onClick={startCheckout}
                disabled={items.length === 0}
              >
                Complete order
              </Button>
              {!compact ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Adjust quantities now, then review discount and payment.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className={`${compact ? 'rounded-card border border-border/70 bg-background p-3 shadow-card' : 'rounded-card border border-border/70 bg-background p-4 shadow-card'}`}>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Discount (THB)</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    aria-label="Discount (THB)"
                    min="0"
                    max={total / 100}
                    step="0.01"
                    value={discountInput}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    className="h-10 w-32 text-right"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-base font-semibold">
                  <span>Total due</span>
                  <span className="text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="h-12 gap-2"
                onClick={() => selectPaymentMethod('cash')}
              >
                <Banknote className="h-4 w-4" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'promptpay' ? 'default' : 'outline'}
                className="h-12 gap-2"
                onClick={() => selectPaymentMethod('promptpay')}
              >
                <QrCode className="h-4 w-4" />
                QR payment
              </Button>
            </div>

            {paymentMethod === 'cash' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tendered amount</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  aria-label="Tendered amount (THB)"
                  min={grandTotal / 100}
                  step="0.01"
                  value={tenderedInput}
                  onChange={(e) => handleTenderedChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Change due: {formatCurrency(Math.max(tenderedAmount - grandTotal, 0))}
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">PromptPay</p>
                {!compact ? <p className="text-sm text-muted-foreground">Customer scans the QR and pays the exact amount due.</p> : null}
                {promptPayQr && (
                  <img
                    alt="PromptPay QR"
                    src={promptPayQr}
                    className="mx-auto h-48 w-48 rounded-card border border-border/70 bg-background p-2"
                  />
                )}
              </div>
            )}

            {submitError && (
              <div className="rounded-card border border-red-500/20 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                {submitError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={abandonCheckout}
                className="h-14 gap-2 rounded-full border-gray-200 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                className="h-14 flex-1 rounded-full bg-emerald-600 text-lg font-semibold text-white shadow-card hover:bg-emerald-700 active:scale-95 transition-transform"
                onClick={finalizeOrder}
                disabled={!canCompletePayment || isSubmitting}
              >
                {isSubmitting ? 'Completing...' : isOnline ? 'Confirm payment' : 'Save locally'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
