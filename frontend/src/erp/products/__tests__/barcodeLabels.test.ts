import { describe, expect, it } from 'vitest'

import { activeVariantIds, buildBarcodeLabels, productSelectionState } from '../barcodeLabels'

const productRecord = {
  product: {
    id: 'prod-1',
    name: 'Jasmine Tea With A Very Long Product Name',
    description: '',
    category_id: null,
    image_url: null,
    is_active: true,
  },
  category: null,
  variants: [
    {
      id: 'var-1',
      product_id: 'prod-1',
      sku: 'TEA-001',
      barcode: '8850000000012',
      name: 'Large Cup',
      price: 12900,
      cost: null,
      is_active: true,
    },
    {
      id: 'var-2',
      product_id: 'prod-1',
      sku: '',
      barcode: null,
      name: 'No Barcode Variant',
      price: 9900,
      cost: null,
      is_active: true,
    },
  ],
}

describe('barcode label helpers', () => {
  it('builds deterministic labels and reuses saved barcode payloads', () => {
    const labels = buildBarcodeLabels([productRecord as any], new Set(['var-1', 'var-2']))

    expect(labels).toHaveLength(2)
    expect(labels[0]).toMatchObject({
      id: 'var-1',
      payload: '8850000000012',
      sku: 'TEA-001',
    })
    expect(labels[1].payload).toBe('ERP-JASMINE-TEA-WITH-A-VERY-LONG-PRODUCT-NAME-NO-BARCODE-VARIANT')
    expect(labels[1].sku).toBe('No SKU')
    const qrPayloads = labels.map((label) => label.payload)
    expect(qrPayloads).toEqual(['8850000000012', 'ERP-JASMINE-TEA-WITH-A-VERY-LONG-PRODUCT-NAME-NO-BARCODE-VARIANT'])
  })

  it('dedupes duplicate selected variants by payload', () => {
    const duplicate = {
      ...productRecord,
      variants: [
        productRecord.variants[0],
        { ...productRecord.variants[0], id: 'var-duplicate' },
      ],
    }

    const labels = buildBarcodeLabels([duplicate as any], new Set(['var-1', 'var-duplicate']))

    expect(labels).toHaveLength(1)
  })

  it('reports product-level selection state for active variants only', () => {
    const recordWithArchivedVariant = {
      ...productRecord,
      variants: [productRecord.variants[0], { ...productRecord.variants[1], is_active: false }],
    }

    expect(activeVariantIds(recordWithArchivedVariant as any)).toEqual(['var-1'])
    expect(productSelectionState(productRecord as any, new Set())).toMatchObject({ checked: false, indeterminate: false, selectedCount: 0 })
    expect(productSelectionState(recordWithArchivedVariant as any, new Set(['var-1']))).toMatchObject({ checked: true, indeterminate: false, selectedCount: 1 })
  })
})
