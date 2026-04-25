import { formatTHB } from '@/lib/formatCurrency'
import type { ReceiptSnapshot } from '@/lib/api'

function escposText(text: string) {
  return new TextEncoder().encode(`${text}\n`)
}

export function buildReceiptText(receipt: ReceiptSnapshot) {
  const lines = [
    receipt.store_name,
    receipt.paid_at,
    `Order ${receipt.order_id}`,
    ...receipt.items.map((item) => `${item.quantity} x ${item.name} ${formatTHB(item.subtotal)}`),
    `Total ${formatTHB(receipt.total_amount)}`,
    `Paid ${receipt.payment_method}`,
    `Tendered ${formatTHB(receipt.tendered_amount)}`,
    `Change ${formatTHB(receipt.change_due)}`,
  ]
  return lines.join('\n')
}

export async function printReceiptViaWebUSB(receipt: ReceiptSnapshot) {
  if (!('usb' in navigator)) {
    throw new Error('WebUSB unavailable')
  }
  const device = await (navigator as Navigator & { usb: { requestDevice: (options: { filters: Array<Record<string, unknown>> }) => Promise<any> } }).usb.requestDevice({ filters: [] })
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
