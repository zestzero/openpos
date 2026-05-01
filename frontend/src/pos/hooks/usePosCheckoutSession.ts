import { useCallback, useEffect, useState } from 'react'

import { STORAGE_KEY_POS_CHECKOUT } from '@/lib/constants'
import type { PaymentMethod } from '@/lib/api'

export type CheckoutStage = 'building' | 'review' | 'payment'

export interface PosCheckoutSession {
  orderId: string
  stage: CheckoutStage
  discountAmount: number
  paymentMethod: PaymentMethod
  tenderedAmount: number
  updatedAt: number
}

function loadSession(): PosCheckoutSession | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY_POS_CHECKOUT)
    return stored ? JSON.parse(stored) as PosCheckoutSession : null
  } catch {
    return null
  }
}

function saveSession(session: PosCheckoutSession | null) {
  if (typeof window === 'undefined') return

  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY_POS_CHECKOUT, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY_POS_CHECKOUT)
    }
  } catch {
    // Ignore storage errors
  }
}

export function usePosCheckoutSession() {
  const [session, setSession] = useState<PosCheckoutSession | null>(() => loadSession())

  useEffect(() => {
    saveSession(session)
  }, [session])

  const startReview = useCallback((orderId: string) => {
    setSession({
      orderId,
      stage: 'review',
      discountAmount: 0,
      paymentMethod: 'cash',
      tenderedAmount: 0,
      updatedAt: Date.now(),
    })
  }, [])

  const updateSession = useCallback((patch: Partial<PosCheckoutSession>) => {
    setSession((current) => {
      if (!current) return null
      return {
        ...current,
        ...patch,
        updatedAt: Date.now(),
      }
    })
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
  }, [])

  return {
    session,
    hasSession: session !== null,
    startReview,
    updateSession,
    clearSession,
  }
}
