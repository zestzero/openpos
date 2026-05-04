import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getToken } from '@/lib/auth'
import type { Category, Product, Variant } from '@/lib/api'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export interface CatalogCategory extends Category {
  sort_order: number
}

export interface CatalogProduct extends Product {}

export interface CatalogVariant extends Variant {
  stockLevel?: number
}

export interface CatalogProductRecord {
  product: CatalogProduct
  category: CatalogCategory | null
  variants: CatalogVariant[]
}

export interface CategoryFormValues {
  name: string
  description: string
  parentId: string | null
}

export interface VariantFormValues {
  id?: string
  sku: string
  barcode: string
  name: string
  price: number
  cost: number
  isActive: boolean
}

export interface AdjustStockValues {
  variantId: string
  quantity: number
  reason: 'RESTOCK'
}

export interface InventoryLedgerEntry {
  id: string
  variant_id: string
  quantity_change: number
  reason: string
  reference_id: string | null
  created_at: string
  created_by: string | null
}

export interface ProductFormValues {
  name: string
  description: string
  categoryId: string | null
  imageUrl: string
  isActive: boolean
  variants: VariantFormValues[]
}

export interface ImportVariantInput {
  sku: string
  barcode: string | null
  name: string
  price: number
  cost: number | null
  is_active: boolean
}

export interface ImportProductInput {
  name: string
  description: string
  category_id: string | null
  image_url: string | null
  is_active: boolean
  variants: ImportVariantInput[]
}

interface ApiSuccess<T> {
  data: T
}

export class ErpApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ErpApiError'
    this.status = status
  }
}

async function requestJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)

  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(new URL(path, apiBaseUrl).toString(), {
    ...init,
    headers,
  })

  const text = await response.text()
  const payload = text ? safeParseJSON(text) : null

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : response.statusText || 'Request failed'
    throw new ErpApiError(message, response.status)
  }

  return payload as T
}

function safeParseJSON(text: string) {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function buildCategoryPayload(values: CategoryFormValues) {
  return {
    name: values.name,
    description: values.description,
    parent_id: values.parentId,
  }
}

function buildProductPayload(values: ProductFormValues) {
  return {
    name: values.name,
    description: values.description,
    category_id: values.categoryId,
    image_url: values.imageUrl,
    is_active: values.isActive,
    variants: values.variants.map((variant) => ({
      sku: variant.sku,
      barcode: variant.barcode,
      name: variant.name,
      price: Math.round(variant.price * 100),
      cost: Math.round(variant.cost * 100),
      is_active: variant.isActive,
    })),
  }
}

async function fetchCategories() {
  const response = await requestJSON<ApiSuccess<CatalogCategory[]>>('/api/catalog/categories')
  return response.data
}

async function fetchProducts() {
  const response = await requestJSON<ApiSuccess<CatalogProductRecord[]>>('/api/catalog/products?is_active=true')
  return response.data
}

async function createCategory(values: CategoryFormValues) {
  const response = await requestJSON<ApiSuccess<CatalogCategory>>('/api/catalog/categories', {
    method: 'POST',
    body: JSON.stringify(buildCategoryPayload(values)),
  })
  return response.data
}

async function updateCategory(id: string, values: CategoryFormValues) {
  const response = await requestJSON<ApiSuccess<CatalogCategory>>(`/api/catalog/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(buildCategoryPayload(values)),
  })
  return response.data
}

async function reorderCategories(ids: string[]) {
  await requestJSON<ApiSuccess<null>>('/api/catalog/categories/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })
}

async function createProduct(values: ProductFormValues) {
  const response = await requestJSON<ApiSuccess<CatalogProductRecord>>('/api/catalog/products', {
    method: 'POST',
    body: JSON.stringify(buildProductPayload(values)),
  })
  return response.data
}

async function importProductsRequest(input: { products: ImportProductInput[] }) {
  const response = await requestJSON<ApiSuccess<CatalogProductRecord[]>>('/api/catalog/import', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  return response.data
}

async function updateProduct(id: string, values: ProductFormValues) {
  const response = await requestJSON<ApiSuccess<CatalogProductRecord>>(`/api/catalog/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(buildProductPayload(values)),
  })
  return response.data
}

async function createVariant(productId: string, variant: VariantFormValues) {
  const response = await requestJSON<ApiSuccess<CatalogVariant>>(`/api/catalog/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify({
      sku: variant.sku,
      barcode: variant.barcode,
      name: variant.name,
      price: Math.round(variant.price * 100),
      cost: Math.round(variant.cost * 100),
      is_active: variant.isActive,
    }),
  })
  return response.data
}

async function updateVariant(id: string, variant: VariantFormValues) {
  const response = await requestJSON<ApiSuccess<CatalogVariant>>(`/api/catalog/variants/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      sku: variant.sku,
      barcode: variant.barcode,
      name: variant.name,
      price: Math.round(variant.price * 100),
      cost: Math.round(variant.cost * 100),
      is_active: variant.isActive,
    }),
  })
  return response.data
}

async function adjustStock(values: AdjustStockValues) {
  const response = await requestJSON<ApiSuccess<InventoryLedgerEntry>>('/api/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify({
      variant_id: values.variantId,
      quantity: values.quantity,
      reason: values.reason,
    }),
  })

  return response.data
}

function buildQueryClientInvalidation(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['erp', 'categories'] }),
    queryClient.invalidateQueries({ queryKey: ['erp', 'products'] }),
  ])
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['erp', 'categories'],
    queryFn: fetchCategories,
  })
}

export function useProductsQuery() {
  return useQuery({
    queryKey: ['erp', 'products'],
    queryFn: fetchProducts,
  })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await buildQueryClientInvalidation(queryClient)
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) => updateCategory(id, values),
    onSuccess: async () => {
      await buildQueryClientInvalidation(queryClient)
    },
  })
}

export function useReorderCategoriesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reorderCategories,
    onSuccess: async () => {
      await buildQueryClientInvalidation(queryClient)
    },
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await buildQueryClientInvalidation(queryClient)
    },
  })
}

export function importProducts(input: { products: ImportProductInput[] }) {
  return importProductsRequest(input)
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProductFormValues }) => updateProduct(id, values),
    onSuccess: async () => {
      await buildQueryClientInvalidation(queryClient)
    },
  })
}

export function useCreateVariantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, variant }: { productId: string; variant: VariantFormValues }) => createVariant(productId, variant),
    onSuccess: async () => {
      await buildQueryClientInvalidation(queryClient)
    },
  })
}

export function useUpdateVariantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, variant }: { id: string; variant: VariantFormValues }) => updateVariant(id, variant),
    onSuccess: async () => {
      await buildQueryClientInvalidation(queryClient)
    },
  })
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adjustStock,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['erp', 'products'] })
    },
  })
}

export function useArchiveProductMutation() {
  const updateProductMutation = useUpdateProductMutation()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProductFormValues }) => updateProductMutation.mutateAsync({
      id,
      values: {
        ...values,
        isActive: false,
      },
    }),
  })
}

export function useArchiveVariantMutation() {
  const updateVariantMutation = useUpdateVariantMutation()

  return useMutation({
    mutationFn: async ({ id, variant }: { id: string; variant: VariantFormValues }) => updateVariantMutation.mutateAsync({
      id,
      variant: {
        ...variant,
        isActive: false,
      },
    }),
  })
}

export function normalizeProductDraft(record?: CatalogProductRecord | null): ProductFormValues {
  return {
    name: record?.product.name ?? '',
    description: record?.product.description ?? '',
    categoryId: record?.product.category_id ?? null,
    imageUrl: record?.product.image_url ?? '',
    isActive: record?.product.is_active ?? true,
    variants: record?.variants.length
      ? record.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          barcode: variant.barcode ?? '',
          name: variant.name,
          price: variant.price / 100,
          cost: (variant.cost ?? 0) / 100,
          isActive: variant.is_active,
        }))
      : [{ sku: '', barcode: '', name: '', price: 0, cost: 0, isActive: true }],
  }
}

export function normalizeCategoryDraft(category?: CatalogCategory | null): CategoryFormValues {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    parentId: category?.parent_id ?? null,
  }
}
