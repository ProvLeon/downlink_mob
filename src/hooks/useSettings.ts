/**
 * useSettings Hook
 * Manages application settings state
 */

import { useCallback, useEffect, useState } from '@lynx-js/react'
import type { AppSettings } from '../types/index.js'
import { DEFAULT_SETTINGS } from '../types/index.js'
import { settingsService } from '../services/settingsService.js'

export interface UseSettingsResult {
  settings: AppSettings
  isLoading: boolean
  updateSettings(updates: Partial<AppSettings>): Promise<void>
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    'background only'
    setIsLoading(true)
    settingsService
      .initialize()
      .then(() => {
        setSettings(settingsService.getSettings())
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    'background only'
    const unsubscribe = settingsService.subscribe(newSettings => {
      setSettings(newSettings)
    })
    return unsubscribe
  }, [])

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      'background only'
      await settingsService.updateSettings(updates)
    },
    [],
  )

  return {
    settings,
    isLoading,
    updateSettings,
  }
}
