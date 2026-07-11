import Dexie, { type Table } from 'dexie'
import type { PaymentMethod, ReceiptSnapshot } from '@/lib/api'

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
  discountAmount: number
  paymentMethod: PaymentMethod
  tenderedAmount: number
  localReceipt: ReceiptSnapshot
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

export interface QueuedAdjustment {
  id: string
  variantId: string
  variantName: string
  sku: string
  quantity: number
  reason: 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOST'
  status: 'pending' | 'syncing' | 'failed'
  createdAt: number
  retryCount: number
  lastError?: string
}

class OpenPOSDatabase extends Dexie {
  categories!: Table<CachedCategory, string>
  variants!: Table<CachedVariant, string>
  queuedOrders!: Table<QueuedOrder, string>
  syncState!: Table<SyncState, string>
  queuedAdjustments!: Table<QueuedAdjustment, string>

  constructor() {
    super('OpenPOS')
    this.version(2).stores({
      categories: 'id, updatedAt',
      variants: 'id, sku, barcode, categoryId, updatedAt',
      queuedOrders: 'id, status, createdAt',
      syncState: 'id',
      queuedAdjustments: 'id, status, createdAt',
    })
  }
}

export const db = new OpenPOSDatabase()
