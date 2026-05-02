import {
  buildSyncOrdersRequest,
  collectFailedClientUUIDs,
  deriveSyncSnapshot,
  getNextRetryDelayMs,
} from '../hooks/syncContract'

describe('syncContract', () => {
  it('serializes queued orders with the backend sync payload contract', () => {
    expect(
      buildSyncOrdersRequest([
        {
          id: 'client-a',
          userId: 'user-1',
          status: 'pending',
          items: [
            { variantId: 'variant-1', quantity: 2, priceSnapshot: 1500 },
            { variantId: 'variant-2', quantity: 1, priceSnapshot: 900 },
          ],
          total: 3900,
          createdAt: 123,
          retryCount: 0,
        },
      ]),
    ).toEqual({
      orders: [
        {
          client_uuid: 'client-a',
          discount_amount: 0,
          items: [
            { variant_id: 'variant-1', quantity: 2, unit_price: 1500 },
            { variant_id: 'variant-2', quantity: 1, unit_price: 900 },
          ],
        },
      ],
    })
  })

  it('indexes sync errors by client_uuid for fast lookup', () => {
    const failedByClientUUID = collectFailedClientUUIDs([
      { client_uuid: 'client-a', error: 'stock changed' },
      { client_uuid: 'client-b', error: 'validation failed' },
    ])

    expect(failedByClientUUID.get('client-a')).toBe('stock changed')
    expect(failedByClientUUID.get('client-b')).toBe('validation failed')
    expect(failedByClientUUID.has('missing')).toBe(false)
  })

  it('derives sync state from queued-order statuses', () => {
    expect(
      deriveSyncSnapshot(
        [
          { status: 'pending' },
          { status: 'syncing' },
          { status: 'failed' },
          { status: 'pending' },
        ],
        { id: 'default', lastSyncAt: 456, isSyncing: false, pendingCount: 0 },
      ),
    ).toEqual({
      id: 'default',
      lastSyncAt: 456,
      isSyncing: true,
      pendingCount: 2,
    })
  })

  it('caps retry delays at one minute', () => {
    expect(getNextRetryDelayMs(0)).toBe(2000)
    expect(getNextRetryDelayMs(1)).toBe(4000)
    expect(getNextRetryDelayMs(10)).toBe(60000)
  })
})
