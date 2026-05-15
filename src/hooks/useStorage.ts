/**
 * useStorage Hook
 * Manages storage information
 */

import { useCallback, useEffect, useState } from '@lynx-js/react'
import type { StorageInfo } from '../types/index.js'
import { storageService } from '../services/storageService.js'

export interface UseStorageResult {
  storage: StorageInfo | null
  isLoading: boolean
  error: string | null
  refresh(): Promise<void>
  formatBytes(bytes: number): string
}

export function useStorage(): UseStorageResult {
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    'background only'
    setIsLoading(true)
    setError(null)
    try {
      const info = await storageService.getStorageInfo()
      setStorage(info)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    'background only'
    refresh()
  }, [refresh])

  return {
    storage,
    isLoading,
    error,
    refresh,
    formatBytes: storageService.formatBytes,
  }
}
