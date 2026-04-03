import Dexie, { type EntityTable } from 'dexie';

// Cached catalog data (synced from server on login/refresh)
export interface CachedCategory {
  id: string;
  name: string;
  sort_order: number;
  synced_at: number; // epoch ms
}

export interface CachedProduct {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  archived: boolean;
  synced_at: number;
}

export interface CachedVariant {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  price_cents: number;
  cost_cents: number;
  active: boolean;
  synced_at: number;
}

// Offline order (created locally, synced later)
export type OrderStatus = 'pending_sync' | 'syncing' | 'synced' | 'failed';
export type PaymentMethod = 'cash' | 'qr';

export interface OfflineOrder {
  id: string; // UUID generated client-side
  items: OrderItem[];
  total_cents: number;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  tendered_cents?: number;
  change_cents?: number;
  receipt_printed?: boolean;
  created_at: number; // epoch ms
  synced_at: number | null;
  error: string | null;
}

export interface OrderItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_sku: string;
  price_cents: number;
  quantity: number;
  line_total_cents: number;
}

// Sync queue entry
export type SyncOperation = 'CREATE_ORDER';

export interface SyncQueueEntry {
  id?: number; // auto-increment
  operation: SyncOperation;
  payload: string; // JSON stringified
  order_id: string;
  attempts: number;
  max_attempts: number;
  next_retry_at: number; // epoch ms
  created_at: number;
  last_error: string | null;
}

const db = new Dexie('OpenPOS') as Dexie & {
  categories: EntityTable<CachedCategory, 'id'>;
  products: EntityTable<CachedProduct, 'id'>;
  variants: EntityTable<CachedVariant, 'id'>;
  orders: EntityTable<OfflineOrder, 'id'>;
  syncQueue: EntityTable<SyncQueueEntry, 'id'>;
};

db.version(1).stores({
  categories: 'id, sort_order',
  products: 'id, category_id, name',
  variants: 'id, product_id, sku, barcode',
  orders: 'id, status, created_at, payment_method',
  syncQueue: '++id, order_id, next_retry_at',
});

export { db };
