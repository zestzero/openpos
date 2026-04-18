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

// Inventory types
export interface StockResponse {
  variant_id: string;
  balance: number;
  snapshot_at: string | null;
}

export interface BulkRestockRow {
  variant_id: string;
  quantity: number;
  reason?: string;
}

export interface BulkRestockResultRow {
  variant_id: string;
  success: boolean;
  error?: string;
  ledger_id?: string;
}

export interface BulkRestockResponse {
  success_count: number;
  failure_count: number;
  results: BulkRestockResultRow[];
}

export interface StockLevelExport {
  variant_id: string;
  sku: string | null;
  barcode: string | null;
  product_name: string | null;
  balance: number;
  last_updated: string | null;
}

export interface ExportStockResponse {
  levels: StockLevelExport[];
  exported_at: string;
}

export interface BulkStockCountRow {
  variant_id: string;
  counted_quantity: number;
  reason?: string;
}

export interface BulkStockCountResultRow {
  variant_id: string;
  success: boolean;
  previous_balance?: number;
  new_balance?: number;
  adjustment_delta?: number;
  error?: string;
}

export interface BulkStockCountResponse {
  success_count: number;
  failure_count: number;
  results: BulkStockCountResultRow[];
}

// Inventory endpoints
export function fetchStock(variantId: string) {
  return apiFetch<StockResponse>(`/inventory/variants/${variantId}/stock`);
}

export function bulkRestock(rows: BulkRestockRow[]) {
  return apiFetch<BulkRestockResponse>('/inventory/bulk-restock', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}

export function exportStockLevels() {
  return apiFetch<ExportStockResponse>('/inventory/export-stock');
}

export function bulkStockCount(rows: BulkStockCountRow[]) {
  return apiFetch<BulkStockCountResponse>('/inventory/bulk-stock-count', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}

export interface ValuationResponse {
  total_value_cents: number;
  variant_count: number;
}

export function fetchValuation() {
  return apiFetch<ValuationResponse>('/inventory/valuation');
}

export interface LowStockItem {
  variant_id: string;
  sku: string;
  barcode: string | null;
  balance: number;
}

export interface LowStockResponse {
  variants: LowStockItem[];
}

export function fetchLowStock(threshold: number = 10) {
  return apiFetch<LowStockResponse>(`/inventory/low-stock?threshold=${threshold}`);
}

export interface GlobalLedgerEntry {
  id: string;
  variant_id: string;
  delta: number;
  type: string;
  reference_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface RecentLedgerResponse {
  ledger: GlobalLedgerEntry[];
}

export function fetchRecentLedger(limit: number = 10) {
  return apiFetch<RecentLedgerResponse>(`/inventory/ledger?limit=${limit}`);
}

export interface VariantStockItem {
  variant_id: string;
  sku: string;
  barcode: string | null;
  cost_cents: number;
  balance: number;
}

export interface ListVariantsResponse {
  variants: VariantStockItem[];
}

export function fetchAllVariants() {
  return apiFetch<ListVariantsResponse>('/inventory/variants');
}

export interface VariantWithProductResponse {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  price_cents: number;
  cost_cents: number;
  active: boolean;
  product_name: string;
  current_stock: number;
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