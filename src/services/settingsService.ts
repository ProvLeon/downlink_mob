/**
 * Settings Service
 * Manages application settings persistence and access
 */

import type { AppSettings } from '../types/index.js'
import { DEFAULT_SETTINGS } from '../types/index.js'
import { nativeModules } from './nativeModules.js'

class SettingsService {
  private settings: AppSettings = DEFAULT_SETTINGS
  private listeners: Set<(settings: AppSettings) => void> = new Set()
  private initialized = false

  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings))
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    const result = await nativeModules.settings.getSettings()
    if (result.success && result.data) {
      this.settings = result.data
    } else {
      this.settings = DEFAULT_SETTINGS
    }

    this.initialized = true
    this.notifyListeners()
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates }
    const result = await nativeModules.settings.saveSettings(updates)

    if (result.success) {
      this.notifyListeners()
    } else {
      // Revert on failure
      this.settings = { ...this.settings, ...updates }
    }
  }

  getSettings(): AppSettings {
    return this.settings
  }

  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key]
  }
}

export const settingsService = new SettingsService()
