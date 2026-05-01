import { formatTHB } from '@/lib/formatCurrency'
import type { ReceiptSnapshot } from '@/lib/api'

interface WebUSBDevice {
  configuration: { value?: number } | null
  open(): Promise<void>
  selectConfiguration(configurationValue: number): Promise<void>
  claimInterface(interfaceNumber: number): Promise<void>
  transferOut(endpointNumber: number, data: BufferSource): Promise<unknown>
}

interface WebUSBNavigator extends Navigator {
  usb: {
    requestDevice(options: { filters: Array<Record<string, unknown>> }): Promise<WebUSBDevice>
  }
}

function escposText(text: string) {
  return new TextEncoder().encode(`${text}\n`)
}

export function buildReceiptText(receipt: ReceiptSnapshot) {
  const paidAt = new Date(receipt.paid_at)
  const paidAtText = Number.isNaN(paidAt.getTime())
    ? receipt.paid_at
    : paidAt.toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })

  const lines = [
    receipt.store_name,
    paidAtText,
    `Order ${receipt.order_id}`,
    ...receipt.items.map((item) => `${item.quantity} x ${item.name} ${formatTHB(item.subtotal)}`),
    receipt.discount_amount > 0 ? `Discount ${formatTHB(receipt.discount_amount)}` : null,
    `Total ${formatTHB(receipt.total_amount)}`,
    `Paid ${receipt.payment_method}`,
    `Tendered ${formatTHB(receipt.tendered_amount)}`,
    `Change ${formatTHB(receipt.change_due)}`,
  ].filter((line): line is string => line !== null)
  return lines.join('\n')
}

function shouldUseDialogPrint() {
  if (typeof navigator === 'undefined') {
    return true
  }
  const userAgent = navigator.userAgent.toLowerCase()
  const isAppleMobile = /iphone|ipad|ipod/.test(userAgent) || (userAgent.includes('macintosh') && navigator.maxTouchPoints > 1)
  return isAppleMobile || !('usb' in navigator)
}

export async function printReceiptViaWebUSB(receipt: ReceiptSnapshot) {
  if (!('usb' in navigator)) {
    throw new Error('WebUSB unavailable')
  }
  const device = await (navigator as WebUSBNavigator).usb.requestDevice({ filters: [] })
  await device.open()
  if (!device.configuration) {
    await device.selectConfiguration(1)
  }
  await device.claimInterface(0)
  const data = [
    new Uint8Array([0x1b, 0x40]),
    escposText(buildReceiptText(receipt)),
    new Uint8Array([0x1d, 0x56, 0x00]),
  ]
  for (const chunk of data) {
    await device.transferOut(1, chunk)
  }
}

export function printReceiptViaDialog(receipt: ReceiptSnapshot) {
  const win = window.open('', '_blank', 'width=380,height=640')
  if (!win) return
  win.document.write(`<pre style="font: 12px monospace; white-space: pre-wrap;">${buildReceiptText(receipt)}</pre>`)
  win.document.close()
  win.focus()
  win.print()
}

export async function printReceipt(receipt: ReceiptSnapshot) {
  if (shouldUseDialogPrint()) {
    printReceiptViaDialog(receipt)
    return
  }

  try {
    await printReceiptViaWebUSB(receipt)
  } catch {
    printReceiptViaDialog(receipt)
  }
}
