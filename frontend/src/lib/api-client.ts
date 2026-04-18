const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }
  return res.json();
}

// Auth
export function pinLogin(pin: string) {
  return apiFetch<{ token: string }>('/auth/pin-login', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}

export function emailLogin(email: string, password: string) {
  return apiFetch<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Catalog types (matching backend response shapes exactly)
export interface CategoryResponse {
  id: string;
  name: string;
  sort_order: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  archived: boolean;
}

export interface VariantResponse {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  price_cents: number;
  cost_cents: number;
  active: boolean;
}

// Catalog endpoints
export function fetchCategories() {
  return apiFetch<{ categories: CategoryResponse[] }>('/catalog/categories');
}

export function fetchProducts(params?: { category_id?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.category_id) query.set('category_id', params.category_id);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return apiFetch<{ products: ProductResponse[] }>(`/catalog/products${qs ? `?${qs}` : ''}`);
}

export function fetchVariants(productId: string) {
  return apiFetch<{ variants: VariantResponse[] }>(`/catalog/products/${productId}/variants`);
}

export interface VariantWithProductResponse extends VariantResponse {
  product_name: string;
  current_stock: number;
}

export function fetchAllVariants() {
  return apiFetch<{ variants: VariantWithProductResponse[] }>('/catalog/variants');
}

export function searchVariants(query: string) {
  const qs = new URLSearchParams({ search: query }).toString();
  return apiFetch<{ variants: VariantWithProductResponse[] }>(`/catalog/variants/search?${qs}`);
}

export interface InventoryAdjustmentRequest {
  variant_id: string;
  adjustment_type: 'restock' | 'correction';
  quantity: number;
  reason: string;
  reference_id?: string;
}

export interface InventoryAdjustmentResponse {
  id: string;
  variant_id: string;
  adjustment_type: string;
  quantity: number;
  reason: string;
  reference_id: string | null;
  new_balance: number;
  created_at: string;
}

export function createInventoryAdjustment(data: InventoryAdjustmentRequest) {
  return apiFetch<InventoryAdjustmentResponse>('/inventory/ledger', {
    method: 'POST',
    body: JSON.stringify({ ...data, type: 'adjustment' }),
  });
}
