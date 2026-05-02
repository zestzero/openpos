import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api, type PaymentMethod, type ReceiptSnapshot } from '@/lib/api'
import { formatTHB } from '@/lib/formatCurrency'
import { buildPromptPayQrDataUrl } from '@/lib/promptpay'
import { buildReceiptText, printReceipt } from '@/lib/receipt'

type CheckoutPanelProps = {
  order: ReceiptSnapshot
}

export function CheckoutPanel({ order }: CheckoutPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [tendered, setTendered] = useState(String(order.total_amount))
  const [qr, setQr] = useState<string | null>(null)
  const tenderedAmount = Number(tendered || 0)
  const changeDue = Math.max(tenderedAmount - order.total_amount, 0)
  const canComplete = method === 'promptpay' ? tenderedAmount === order.total_amount : tenderedAmount >= order.total_amount

  const receiptPreview = useMemo(() => buildReceiptText({ ...order, payment_method: method, tendered_amount: tenderedAmount, change_due: changeDue }), [order, method, tenderedAmount, changeDue])

  async function handlePromptPayPreview() {
    setQr(await buildPromptPayQrDataUrl(import.meta.env.VITE_PROMPTPAY_MERCHANT_ID ?? '0000000000000', order.total_amount))
  }

  async function handleComplete() {
    const result = await api.completePayment(order.order_id, {
      method,
      tendered_amount: tenderedAmount,
    })
    if (result.data) {
      await printReceipt(result.data)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>Take cash or PromptPay, then print the receipt.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant={method === 'cash' ? 'default' : 'outline'} onClick={() => setMethod('cash')}>Cash</Button>
          <Button variant={method === 'promptpay' ? 'default' : 'outline'} onClick={() => setMethod('promptpay')}>PromptPay</Button>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Tendered amount</label>
          <Input inputMode="numeric" value={tendered} onChange={(event) => setTendered(event.target.value)} />
          <p className="text-sm text-muted-foreground">Change due: {formatTHB(changeDue)}</p>
        </div>
        <div className="grid gap-2">
          <Button onClick={handlePromptPayPreview}>Generate PromptPay QR</Button>
          {qr ? <img alt="PromptPay QR" src={qr} className="mx-auto h-48 w-48 rounded-lg border" /> : null}
        </div>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{receiptPreview}</pre>
        <div className="flex gap-2">
          <Button disabled={!canComplete} onClick={handleComplete}>Complete sale</Button>
          <Button variant="outline" onClick={() => printReceipt(order)}>Print receipt</Button>
        </div>
      </CardContent>
    </Card>
  )
}
