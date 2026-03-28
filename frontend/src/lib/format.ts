const thbFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
});

export function formatTHB(priceCents: number): string {
  return thbFormatter.format(priceCents / 100);
}
