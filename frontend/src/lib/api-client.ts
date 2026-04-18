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

export type LedgerEntryType = "sale" | "restock" | "adjustment" | "sync";

export interface LedgerEntryResponse {
  id: string;
  variant_id: string;
  delta: number;
  type: LedgerEntryType;
  reference_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface GetLedgerResponse {
  entries: LedgerEntryResponse[];
  total: number;
  hasMore: boolean;
}

export function fetchLedger(
  variantId: string,
  params?: {
    type?: LedgerEntryType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
) {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiFetch<GetLedgerResponse>(`/inventory/ledger/${variantId}${qs ? `?${qs}` : ""}`);
}
