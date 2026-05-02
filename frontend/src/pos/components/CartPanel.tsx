'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Banknote, QrCode, ReceiptText, Sparkles, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, type PaymentMethod } from '@/lib/api'
import { formatCurrency } from '@/lib/formatCurrency'
import { buildPromptPayQrDataUrl } from '@/lib/promptpay'
import { printReceipt } from '@/lib/receipt'
import { useCart } from '@/pos/hooks/useCart'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'
import { usePosCheckoutSession } from '@/pos/hooks/usePosCheckoutSession'
import { CartItemRow } from './CartItemRow'
import { SyncStatus } from './SyncStatus'
import { toast } from 'sonner'

type CheckoutStep = 'cart' | 'review' | 'payment'

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

  const [step, setStep] = useState<CheckoutStep>(() => (session?.stage === 'building' ? 'cart' : session?.stage ?? 'cart'))
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
  const hasDraft = session !== null

  useEffect(() => {
    if (step === 'payment' && paymentMethod === 'promptpay') {
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
  }, [step, paymentMethod, grandTotal])

  const startCheckout = () => {
    const orderId = session?.orderId ?? crypto.randomUUID()
    startReview(orderId)
    setStep('review')
    setDiscountInput('0')
    setSubmitError(null)
  }

  const resumeCheckout = () => {
    if (!session) return
    setStep(session.stage === 'building' ? 'cart' : session.stage)
    setDiscountInput(satangToCurrencyInput(session.discountAmount))
    setPaymentMethod(session.paymentMethod)
    setTenderedInput(satangToCurrencyInput(session.tenderedAmount || grandTotal))
    setSubmitError(null)
  }

  const abandonCheckout = () => {
    clearSession()
    setStep('cart')
    setDiscountInput('0')
    setPaymentMethod('cash')
    setTenderedInput(satangToCurrencyInput(total))
    setPromptPayQr(null)
    setSubmitError(null)
  }

  const continueToPayment = () => {
    if (!session) return
    const nextMethod: PaymentMethod = 'cash'
    updateSession({ stage: 'payment', discountAmount, paymentMethod: nextMethod, tenderedAmount: grandTotal })
    setPaymentMethod(nextMethod)
    setTenderedInput(satangToCurrencyInput(grandTotal))
    setStep('payment')
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

      clearCart()
      clearSession()
      setStep('cart')
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

  if (isEmpty && !hasDraft) {
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
    <div className={compact ? 'relative flex h-full min-h-0 flex-col' : 'rounded-card border border-border/70 bg-card shadow-card'}>
      <div className={`flex items-start justify-between gap-3 ${compact ? '' : 'border-b border-border/70 p-4'}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {compact ? 'Cart' : 'Order workspace'}
          </p>
          <h2 className={`${compact ? 'mt-1 text-base' : 'mt-1 text-lg'} font-semibold text-foreground`}>
            {step === 'cart' ? 'Items ready' : step === 'review' ? 'Review and discount' : 'Choose payment'}
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

      {hasDraft && step === 'cart' && (
        <div className={`flex items-center justify-between gap-3 text-sm ${compact ? 'rounded-card bg-muted/30 px-3 py-2' : 'border-b border-border/70 bg-muted/25 px-4 py-3'}`}>
          <div>
            <p className="font-medium text-foreground">Saved checkout session</p>
            {!compact ? <p className="text-muted-foreground">Resume or abandon the held order.</p> : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resumeCheckout}>
              Resume
            </Button>
            <Button variant="ghost" size="sm" onClick={abandonCheckout}>
              Abandon
            </Button>
          </div>
        </div>
      )}

      {step === 'cart' && (
        <div className={compact ? 'flex min-h-0 flex-1 flex-col' : ''}>
          <div className={`${compact ? 'min-h-0 flex-1 overflow-y-auto space-y-2 px-0 py-3' : 'max-h-[24rem] overflow-y-auto p-2 sm:p-3'}`}>
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

          <div className={`${compact ? 'shrink-0 border-t border-border/70 bg-background/95 px-0 pt-3' : 'border-t border-border/70 p-4'}`}>
            <div className={`${compact ? 'rounded-card border border-border/70 bg-background p-3 shadow-card' : ''}`}>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Item count</span>
                <span className="font-medium">{itemCount}</span>
              </div>
              <div className="mb-4 flex items-center justify-between text-xl font-bold">
                <span>Subtotal</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              <Button className="h-14 w-full rounded-card text-lg font-semibold shadow-card" onClick={startCheckout} disabled={items.length === 0}>
                Complete order
              </Button>
              {!compact ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Adjust quantities now, then review discount and payment.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className={compact ? 'flex min-h-0 flex-1 flex-col' : 'space-y-4 p-4'}>
          <div className={`${compact ? 'min-h-0 flex-1 overflow-y-auto px-0 py-3' : ''}`}>
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
                    onChange={(event) => setDiscountInput(event.target.value)}
                    className="h-10 w-32 text-right"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-base font-semibold">
                  <span>Total due</span>
                  <span className="text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`${compact ? 'shrink-0 border-t border-border/70 bg-background/95 pt-3' : 'flex gap-2'}`}>
            <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('cart')} className="h-14 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button className="h-14 flex-1 rounded-card text-lg font-semibold shadow-card gap-2" onClick={continueToPayment}>
              <Sparkles className="h-4 w-4" />
              Confirm order
            </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className={compact ? 'flex min-h-0 flex-1 flex-col' : 'space-y-4 p-4'}>
          <div className="grid gap-2 sm:grid-cols-2">
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

          <div className={`${compact ? 'min-h-0 flex-1 overflow-y-auto px-0 py-3' : ''}`}>
            <div className={`${compact ? 'rounded-card border border-border/70 bg-background p-3 shadow-card' : 'rounded-card border border-border/70 bg-background p-4 shadow-card'}`}>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount due</span>
                  <span className="font-semibold">{formatCurrency(grandTotal)}</span>
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
                      onChange={(event) => setTenderedInput(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Change due: {formatCurrency(Math.max(tenderedAmount - grandTotal, 0))}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">PromptPay</p>
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
              </div>
            </div>
          </div>

          <div className={`${compact ? 'shrink-0 border-t border-border/70 bg-background/95 pt-3' : 'flex gap-2'}`}>
            <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('review')} className="h-14 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              className="h-14 flex-1 rounded-card bg-emerald-600 text-lg font-semibold text-white shadow-card hover:bg-emerald-700"
              onClick={finalizeOrder}
              disabled={!canCompletePayment || isSubmitting}
            >
              {isSubmitting ? 'Completing...' : isOnline ? 'Confirm payment' : 'Save locally'}
            </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
