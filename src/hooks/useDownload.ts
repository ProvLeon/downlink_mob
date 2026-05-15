/**
 * useDownload Hook
 * Primary hook for managing download lifecycle
 */

import { useCallback, useEffect, useState } from '@lynx-js/react'
import type { Download, PresetId } from '../types/index.js'
import { downloadService } from '../services/downloadService.js'

export interface UseDownloadResult {
  downloads: Download[]
  isLoading: boolean
  error: string | null
  addDownload(url: string, preset: PresetId): Promise<void>
  startDownload(downloadId: string): Promise<void>
  pauseDownload(downloadId: string): Promise<void>
  resumeDownload(downloadId: string): Promise<void>
  cancelDownload(downloadId: string): Promise<void>
  clearCompleted(): Promise<void>
}

export function useDownload(): UseDownloadResult {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    'background only'
    setIsLoading(true)
    downloadService
      .initialize()
      .then(() => {
        setDownloads(downloadService.getDownloads())
        setIsLoading(false)
      })
      .catch(err => {
        setError(String(err))
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    'background only'
    const unsubscribe = downloadService.subscribe(newDownloads => {
      setDownloads(newDownloads)
    })
    return unsubscribe
  }, [])

  const addDownload = useCallback(
    async (url: string, preset: PresetId) => {
      'background only'
      setError(null)
      try {
        const result = await downloadService.addDownload(url, preset)
        if (!result.success) {
          setError(result.error?.message || 'Failed to add download')
        }
      } catch (err) {
        setError(String(err))
      }
    },
    [],
  )

  const startDownload = useCallback(async (downloadId: string) => {
    'background only'
    setError(null)
    try {
      const result = await downloadService.startDownload(downloadId)
      if (!result.success) {
        setError(result.error?.message || 'Failed to start download')
      }
    } catch (err) {
      setError(String(err))
    }
  }, [])

  const pauseDownload = useCallback(async (downloadId: string) => {
    'background only'
    setError(null)
    try {
      const result = await downloadService.pauseDownload(downloadId)
      if (!result.success) {
        setError(result.error?.message || 'Failed to pause download')
      }
    } catch (err) {
      setError(String(err))
    }
  }, [])

  const resumeDownload = useCallback(async (downloadId: string) => {
    'background only'
    setError(null)
    try {
      const result = await downloadService.resumeDownload(downloadId)
      if (!result.success) {
        setError(result.error?.message || 'Failed to resume download')
      }
    } catch (err) {
      setError(String(err))
    }
  }, [])

  const cancelDownload = useCallback(async (downloadId: string) => {
    'background only'
    setError(null)
    try {
      const result = await downloadService.cancelDownload(downloadId)
      if (!result.success) {
        setError(result.error?.message || 'Failed to cancel download')
      }
    } catch (err) {
      setError(String(err))
    }
  }, [])

  const clearCompleted = useCallback(async () => {
    'background only'
    setError(null)
    try {
      const result = await downloadService.clearCompleted()
      if (!result.success) {
        setError(result.error?.message || 'Failed to clear completed')
      }
    } catch (err) {
      setError(String(err))
    }
  }, [])

  return {
    downloads,
    isLoading,
    error,
    addDownload,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    clearCompleted,
  }
}
