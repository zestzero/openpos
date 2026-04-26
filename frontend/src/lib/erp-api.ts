import { requestJSON, type ApiSuccess, type Category, type Product, type Variant } from '@/lib/api'

export interface ProductWithVariants {
  product: Product
  category: Category | null
  variants: Variant[]
}

export interface ImportVariantInput {
  sku: string
  barcode: string | null
  name: string
  price: number
  cost: number | null
  is_active?: boolean
}

export interface ImportProductInput {
  name: string
  description: string
  category_id: string | null
  image_url: string | null
  is_active?: boolean
  variants: ImportVariantInput[]
}

export interface ImportProductsRequest {
  products: ImportProductInput[]
}

export function importProducts(body: ImportProductsRequest) {
  return requestJSON<ApiSuccess<ProductWithVariants[]>>('/api/catalog/import', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
