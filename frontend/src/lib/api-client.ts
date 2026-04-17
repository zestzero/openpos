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

export interface InventoryItemResponse {
  variant_id: string;
  product_id: string;
  product_name: string;
  category_id: string | null;
  category_name: string | null;
  sku: string;
  barcode: string | null;
  stock: number;
  status: "in-stock" | "low" | "out";
}

export interface ListInventoryResponse {
  items: InventoryItemResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface ListInventoryParams {
  search?: string;
  category_id?: string;
  status?: "in-stock" | "low" | "out";
  sort_by?: "stock" | "product" | "sku";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export function fetchInventory(params?: ListInventoryParams) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category_id) query.set("category_id", params.category_id);
  if (params?.status) query.set("status", params.status);
  if (params?.sort_by) query.set("sort_by", params.sort_by);
  if (params?.sort_order) query.set("sort_order", params.sort_order);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  const qs = query.toString();
  return apiFetch<ListInventoryResponse>(`/inventory${qs ? `?${qs}` : ""}`);
}
