/**
 * Storage Service
 * Manages file system and storage information
 */

import type { FileSystemItem, StorageInfo } from '../types/index.js'
import { nativeModules } from './nativeModules.js'

class StorageService {
  private storageInfo: StorageInfo | null = null
  private listeners: Set<(info: StorageInfo) => void> = new Set()

  subscribe(listener: (info: StorageInfo) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    if (this.storageInfo) {
      this.listeners.forEach(listener => listener(this.storageInfo))
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    const result = await nativeModules.fileSystem.getStorageInfo()
    if (result.success && result.data) {
      this.storageInfo = result.data
      this.notifyListeners()
      return result.data
    }
    throw new Error('Failed to get storage info')
  }

  async listDirectory(path: string): Promise<FileSystemItem[]> {
    const result = await nativeModules.fileSystem.listDirectory(path)
    if (result.success && result.data) {
      return result.data
    }
    throw new Error(`Failed to list directory: ${path}`)
  }

  async ensureDirectory(path: string): Promise<void> {
    const result = await nativeModules.fileSystem.ensureDirectory(path)
    if (!result.success) {
      throw new Error(`Failed to ensure directory: ${path}`)
    }
  }

  getStoragePercent(): number {
    if (!this.storageInfo) return 0
    return (this.storageInfo.usedBytes / this.storageInfo.totalBytes) * 100
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }
}

export const storageService = new StorageService()
