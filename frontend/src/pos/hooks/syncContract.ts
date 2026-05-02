import { type QueuedOrder, type SyncState } from '@/lib/db'

export type SyncOrderItemPayload = {
  variant_id: string
  quantity: number
  unit_price: number
}

export type SyncOrderPayload = {
  client_uuid: string
  discount_amount: number
  items: SyncOrderItemPayload[]
}

export type SyncOrdersRequest = {
  orders: SyncOrderPayload[]
}

export type SyncErrorPayload = {
  client_uuid: string
  error: string
}

export type SyncOrdersResponse = {
  processed: number
  succeeded: number
  failed: number
  errors: SyncErrorPayload[]
}

const BASE_RETRY_DELAY_MS = 2000
const MAX_RETRY_DELAY_MS = 60000

export function buildSyncOrdersRequest(orders: QueuedOrder[]): SyncOrdersRequest {
  return {
    orders: orders.map(order => ({
      client_uuid: order.id,
      discount_amount: 0,
      items: order.items.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.priceSnapshot,
      })),
    })),
  }
}

export function collectFailedClientUUIDs(errors: SyncErrorPayload[]): Map<string, string> {
  return new Map(errors.map(error => [error.client_uuid, error.error]))
}

export function deriveSyncSnapshot(queuedOrders: Pick<QueuedOrder, 'status'>[], existing?: SyncState | null): SyncState {
  return {
    id: 'default',
    lastSyncAt: existing?.lastSyncAt,
    pendingCount: queuedOrders.filter(order => order.status === 'pending').length,
    isSyncing: queuedOrders.some(order => order.status === 'syncing'),
  }
}

export function getNextRetryDelayMs(retryCount: number): number {
  const delay = BASE_RETRY_DELAY_MS * (2 ** retryCount)
  return Math.min(delay, MAX_RETRY_DELAY_MS)
}
