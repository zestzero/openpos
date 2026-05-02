import Dexie, { type Table } from 'dexie'

export interface CachedCategory {
  id: string
  name: string
  description?: string
  updatedAt: number
}

export interface CachedVariant {
  id: string
  productId: string
  sku: string
  barcode?: string
  name: string
  price: number
  productName: string
  categoryId?: string
  updatedAt: number
}

export interface QueuedOrder {
  id: string
  userId: string
  status: 'pending' | 'syncing' | 'failed'
  items: Array<{
    variantId: string
    quantity: number
    priceSnapshot: number
  }>
  total: number
  createdAt: number
  retryCount: number
  lastError?: string
}

export interface SyncState {
  id: 'default'
  lastSyncAt?: number
  isSyncing: boolean
  pendingCount: number
}

class OpenPOSDatabase extends Dexie {
  categories!: Table<CachedCategory, string>
  variants!: Table<CachedVariant, string>
  queuedOrders!: Table<QueuedOrder, string>
  syncState!: Table<SyncState, string>

  constructor() {
    super('OpenPOS')
    this.version(1).stores({
      categories: 'id, updatedAt',
      variants: 'id, sku, barcode, categoryId, updatedAt',
      queuedOrders: 'id, status, createdAt',
      syncState: 'id',
    })
  }
}

export const db = new OpenPOSDatabase()