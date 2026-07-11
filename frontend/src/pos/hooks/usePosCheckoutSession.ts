import { useCallback, useSyncExternalStore } from 'react'

import type { PaymentMethod, ReceiptSnapshot } from '@/lib/api'
import { STORAGE_KEY_POS_CHECKOUT } from '@/lib/constants'

export type CheckoutStage = 'selling' | 'reviewing' | 'payment' | 'complete'

export interface PosCheckoutSession {
  version: 2
  orderId: string
  stage: CheckoutStage
  discountAmount: number
  paymentMethod: PaymentMethod
  tenderedAmount: number
  receipt: ReceiptSnapshot | null
  savedOffline: boolean
  updatedAt: number
}

type LegacyCheckoutSession = {
  orderId?: string
  stage?: 'building' | 'review' | 'payment'
  discountAmount?: number
  paymentMethod?: PaymentMethod
  tenderedAmount?: number
  updatedAt?: number
}

function createSellingSession(): PosCheckoutSession {
  return {
    version: 2,
    orderId: crypto.randomUUID(),
    stage: 'selling',
    discountAmount: 0,
    paymentMethod: 'cash',
    tenderedAmount: 0,
    receipt: null,
    savedOffline: false,
    updatedAt: Date.now(),
  }
}

function migrateSession(value: unknown): PosCheckoutSession {
  if (!value || typeof value !== 'object') return createSellingSession()

  const stored = value as Partial<PosCheckoutSession> & LegacyCheckoutSession
  if (stored.version === 2 && stored.orderId) {
    return {
      version: 2,
      orderId: stored.orderId,
      stage: stored.stage ?? 'selling',
      discountAmount: stored.discountAmount ?? 0,
      paymentMethod: stored.paymentMethod ?? 'cash',
      tenderedAmount: stored.tenderedAmount ?? 0,
      receipt: stored.receipt ?? null,
      savedOffline: stored.savedOffline ?? false,
      updatedAt: stored.updatedAt ?? Date.now(),
    }
  }

  const legacyStage = stored.stage
  return {
    ...createSellingSession(),
    orderId: stored.orderId ?? crypto.randomUUID(),
    stage: legacyStage === 'payment' ? 'payment' : legacyStage === 'review' ? 'reviewing' : 'selling',
    discountAmount: stored.discountAmount ?? 0,
    paymentMethod: stored.paymentMethod ?? 'cash',
    tenderedAmount: stored.tenderedAmount ?? 0,
    updatedAt: stored.updatedAt ?? Date.now(),
  }
}

function loadSession(): PosCheckoutSession {
  if (typeof window === 'undefined') return createSellingSession()
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_POS_CHECKOUT)
    return stored ? migrateSession(JSON.parse(stored)) : createSellingSession()
  } catch {
    return createSellingSession()
  }
}

let checkoutSession = loadSession()
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) listener()
}

function persistSession() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY_POS_CHECKOUT, JSON.stringify(checkoutSession))
  } catch {
    // Checkout remains usable in memory when storage is unavailable.
  }
}

function updateCheckoutSession(updater: (current: PosCheckoutSession) => PosCheckoutSession) {
  checkoutSession = updater(checkoutSession)
  persistSession()
  emitChange()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function __resetCheckoutSessionForTests() {
  checkoutSession = loadSession()
  emitChange()
}

export function usePosCheckoutSession() {
  const session = useSyncExternalStore(subscribe, () => checkoutSession, () => checkoutSession)

  const startReview = useCallback((orderId = checkoutSession.orderId) => {
    updateCheckoutSession((current) => ({
      ...current,
      orderId,
      stage: 'reviewing',
      receipt: null,
      savedOffline: false,
      updatedAt: Date.now(),
    }))
  }, [])

  const updateSession = useCallback((patch: Partial<Omit<PosCheckoutSession, 'version'>>) => {
    updateCheckoutSession((current) => ({ ...current, ...patch, version: 2, updatedAt: Date.now() }))
  }, [])

  const resetSale = useCallback(() => {
    updateCheckoutSession(() => createSellingSession())
  }, [])

  const clearSession = resetSale

  return {
    session,
    hasSession: session.stage !== 'selling',
    startReview,
    updateSession,
    resetSale,
    clearSession,
  }
}
