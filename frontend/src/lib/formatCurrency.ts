const thbFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
})

/**
 * Format a satang amount as Thai Baht currency string.
 * @param amount - Amount in satang (100 = 1 THB)
 * @returns Formatted string e.g. "฿150.00"
 */
export function formatCurrency(amount: number): string {
  return thbFormatter.format(amount / 100)
}

/**
 * @deprecated Use formatCurrency instead
 */
export function formatTHB(amount: number): string {
  return formatCurrency(amount)
}
