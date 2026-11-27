import { useCallback, useEffect, useState } from 'react'

import { api, ApiError } from '@/lib/api'
import { STORAGE_KEY_LATEST_RECEIPT } from '@/lib/constants'
import { printReceipt } from '@/lib/receipt'
import { useI18n, type TranslationKey, type TranslationVariables } from '@/lib/i18n'

import { useNetworkStatus } from './useNetworkStatus'

const LATEST_RECEIPT_UPDATE_EVENT = 'openpos:latest-receipt-updated'

function loadLatestReceiptId() {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY_LATEST_RECEIPT)
    return stored && stored.trim() ? stored : null
  } catch {
    return null
  }
}

function saveLatestReceiptId(latestReceiptId: string | null) {
  if (typeof window === 'undefined') return

  try {
    if (latestReceiptId) {
      localStorage.setItem(STORAGE_KEY_LATEST_RECEIPT, latestReceiptId)
      return
    }

    localStorage.removeItem(STORAGE_KEY_LATEST_RECEIPT)
  } catch {
    // Ignore storage errors.
  }
}

function publishLatestReceiptUpdate() {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new Event(LATEST_RECEIPT_UPDATE_EVENT))
}

function getReplayErrorMessage(error: unknown, translate: (key: TranslationKey, variables?: TranslationVariables) => string) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return translate('pos.receiptUnavailableMissing')
    }

    return translate('pos.receiptUnavailable')
  }

  if (error instanceof Error && /not found|missing/i.test(error.message)) {
    return translate('pos.receiptUnavailableMissing')
  }

  return translate('pos.receiptUnavailable')
}

export function useLatestReceipt() {
  const { isOnline } = useNetworkStatus()
  const { t } = useI18n()
  const [latestReceiptId, setLatestReceiptId] = useState<string | null>(() => loadLatestReceiptId())
  const [replayError, setReplayError] = useState<string | null>(null)
  const [isReprinting, setIsReprinting] = useState(false)

  useEffect(() => {
    saveLatestReceiptId(latestReceiptId)
  }, [latestReceiptId])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncFromStorage = () => {
      setLatestReceiptId(loadLatestReceiptId())
    }

    window.addEventListener('storage', syncFromStorage)
    window.addEventListener(LATEST_RECEIPT_UPDATE_EVENT, syncFromStorage)

    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener(LATEST_RECEIPT_UPDATE_EVENT, syncFromStorage)
    }
  }, [])

  const rememberLatestReceipt = useCallback((orderId: string) => {
    setLatestReceiptId(orderId)
    setReplayError(null)
    publishLatestReceiptUpdate()
  }, [])

  const clearLatestReceipt = useCallback(() => {
    setLatestReceiptId(null)
    setReplayError(null)
    publishLatestReceiptUpdate()
  }, [])

  const reprintLatestReceipt = useCallback(async () => {
    if (!isOnline) {
      setReplayError(t('pos.reprintOffline'))
      return false
    }

    if (!latestReceiptId) {
      setReplayError(t('pos.noSavedReceipt'))
      return false
    }

    try {
      setIsReprinting(true)
      setReplayError(null)

      const result = await api.getReceipt(latestReceiptId)
      await printReceipt(result.data)

      return true
    } catch (error) {
      setReplayError(getReplayErrorMessage(error, t))
      return false
    } finally {
      setIsReprinting(false)
    }
  }, [isOnline, latestReceiptId, t])

  return {
    latestReceiptId,
    isOnline,
    isReprinting,
    replayError,
    canReprintReceipt: Boolean(isOnline && latestReceiptId && !isReprinting),
    rememberLatestReceipt,
    clearLatestReceipt,
    reprintLatestReceipt,
  }
}
