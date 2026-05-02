import { getToken } from '@/lib/auth'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export interface ApiSuccess<T> {
  data: T
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    role: 'owner' | 'cashier'
    name: string
  }
  token: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  parent_id: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  category_id: string | null
  image_url: string | null
  is_active: boolean
}

export interface Variant {
  id: string
  product_id: string
  sku: string
  barcode: string | null
  name: string
  price: number
  cost: number | null
  is_active: boolean
}

export interface SearchVariantRow extends Variant {
  product_name: string
}

export interface ProductWithVariants {
  product: Product
  category?: Category
  variants: Variant[]
}

export type PaymentMethod = 'cash' | 'promptpay'

export interface CompletePaymentRequest {
  method: PaymentMethod
  tendered_amount: number
}

export interface ReceiptItem {
  name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface ReceiptSnapshot {
  store_name: string
  paid_at: string
  order_id: string
  items: ReceiptItem[]
  discount_amount: number
  total_amount: number
  payment_method: PaymentMethod
  tendered_amount: number
  change_due: number
}

export interface CreateOrderRequest {
  client_uuid: string
  discount_amount: number
  items: Array<{
    variant_id: string
    quantity: number
    unit_price: number
  }>
}

export interface OrderResponse {
  id: string
  client_uuid: string
  status: string
  total_amount: number
}

export class ApiError extends Error {
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export async function requestJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new ApiError(message, response.status)
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

export const api = {
  login(email: string, password: string) {
    return requestJSON<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  loginPIN(email: string, pin: string) {
    return requestJSON<AuthResponse>('/api/auth/login/pin', {
      method: 'POST',
      body: JSON.stringify({ email, pin }),
    })
  },
  getCategories() {
    return requestJSON<ApiSuccess<Category[]>>('/api/catalog/categories')
  },
  getProducts(categoryId?: string) {
    const params = new URLSearchParams()
    if (categoryId) params.set('category_id', categoryId)
    params.set('is_active', 'true')
    const query = params.toString()
    return requestJSON<ApiSuccess<ProductWithVariants[]>>(`/api/catalog/products${query ? `?${query}` : ''}`)
  },
  searchVariant(query: string) {
    return requestJSON<ApiSuccess<SearchVariantRow>>(`/api/catalog/variants/search?q=${encodeURIComponent(query)}`)
  },
  completePayment(orderId: string, body: CompletePaymentRequest) {
    return requestJSON<ApiSuccess<ReceiptSnapshot>>(`/api/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  getReceipt(orderId: string) {
    return requestJSON<ApiSuccess<ReceiptSnapshot>>(`/api/orders/${orderId}/receipt`)
  },
  createOrder(orderData: CreateOrderRequest) {
    return requestJSON<ApiSuccess<OrderResponse>>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  },
}
