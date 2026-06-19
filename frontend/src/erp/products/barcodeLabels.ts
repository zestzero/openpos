import { formatTHB } from '@/lib/formatCurrency'
import type { CatalogProductRecord, CatalogVariant } from '@/lib/erp-api'

import { generateVariantBarcode } from './variantBarcode'

export type BarcodeLabel = {
  id: string
  productName: string
  variantName: string
  sku: string
  price: string
  payload: string
  humanReadable: string
}

export function buildBarcodeLabels(products: CatalogProductRecord[], selectedVariantIds: Set<string>): BarcodeLabel[] {
  const existingBarcodes = products.flatMap((record) => record.variants.map((variant) => variant.barcode).filter(Boolean)) as string[]
  const labels: BarcodeLabel[] = []
  const seenPayloads = new Set<string>()

  for (const record of products) {
    for (const variant of record.variants) {
      if (!variant.is_active || !selectedVariantIds.has(variant.id)) {
        continue
      }

      const payload = barcodePayload(record.product.name, variant, existingBarcodes)
      if (seenPayloads.has(payload)) {
        continue
      }
      seenPayloads.add(payload)

      labels.push({
        id: variant.id,
        productName: record.product.name,
        variantName: variant.name,
        sku: variant.sku || 'No SKU',
        price: formatTHB(variant.price),
        payload,
        humanReadable: payload,
      })
    }
  }

  return labels
}

export function activeVariantIds(record: CatalogProductRecord) {
  return record.variants.filter((variant) => variant.is_active).map((variant) => variant.id)
}

export function productSelectionState(record: CatalogProductRecord, selectedVariantIds: Set<string>) {
  const activeIds = activeVariantIds(record)
  const selectedCount = activeIds.filter((id) => selectedVariantIds.has(id)).length

  return {
    activeIds,
    checked: activeIds.length > 0 && selectedCount === activeIds.length,
    indeterminate: selectedCount > 0 && selectedCount < activeIds.length,
    selectedCount,
  }
}

function barcodePayload(productName: string, variant: CatalogVariant, existingBarcodes: string[]) {
  return variant.barcode?.trim() || generateVariantBarcode({
    productName,
    variantName: variant.name || variant.sku || variant.id,
    existingBarcodes,
  })
}
