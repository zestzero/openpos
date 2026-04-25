const thbFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
})

export function formatTHB(amount: number): string {
  return thbFormatter.format(amount / 100)
}
