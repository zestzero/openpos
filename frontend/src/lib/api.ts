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
  getProducts() {
    return requestJSON<ApiSuccess<Product[]>>('/api/catalog/products')
  },
  searchVariant(query: string) {
    return requestJSON<ApiSuccess<Variant[]>>(`/api/catalog/variants/search?q=${encodeURIComponent(query)}`)
  },
}
