type VariantBarcodeInput = {
  productName: string
  variantName: string
  existingBarcodes?: string[]
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toUpperCase()
}

export function generateVariantBarcode({ productName, variantName, existingBarcodes = [] }: VariantBarcodeInput) {
  const base = ['ERP', slugify(productName), slugify(variantName)]
    .filter(Boolean)
    .join('-')

  if (!existingBarcodes.includes(base)) {
    return base
  }

  let suffix = 2
  while (existingBarcodes.includes(`${base}-${suffix}`)) {
    suffix += 1
  }

  return `${base}-${suffix}`
}
