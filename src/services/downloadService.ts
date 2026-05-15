/**
 * Download Service
 * High-level abstraction over native download manager with local state management
 */

import type { Download, PresetId, Result } from '../types/index.js'
import { DownloadStatus } from '../types/index.js'
import { nativeModules } from './nativeModules.js'

class DownloadService {
  private listeners: Set<(downloads: Download[]) => void> = new Set()
  private localDownloads: Map<string, Download> = new Map()

  subscribe(listener: (downloads: Download[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    const downloads = Array.from(this.localDownloads.values())
    this.listeners.forEach(listener => listener(downloads))
  }

  async initialize(): Promise<void> {
    const result = await nativeModules.downloadManager.getDownloads()
    if (result.success && result.data) {
      result.data.forEach(download => {
        this.localDownloads.set(download.id, download)
      })
      this.notifyListeners()
    }
  }

  async addDownload(url: string, preset: PresetId): Promise<Result<string>> {
    const result = await nativeModules.downloadManager.addDownload(url, preset)
    if (result.success && result.data) {
      // Fetch the newly added download
      const downloadResult = await nativeModules.downloadManager.getDownload(
        result.data,
      )
      if (downloadResult.success && downloadResult.data) {
        this.localDownloads.set(result.data, downloadResult.data)
        this.notifyListeners()
      }
    }
    return result
  }

  async startDownload(downloadId: string): Promise<Result<void>> {
    const result = await nativeModules.downloadManager.startDownload(downloadId)
    if (result.success) {
      const download = this.localDownloads.get(downloadId)
      if (download) {
        download.status = DownloadStatus.DOWNLOADING
        this.notifyListeners()
      }
    }
    return result
  }

  async pauseDownload(downloadId: string): Promise<Result<void>> {
    const result = await nativeModules.downloadManager.pauseDownload(downloadId)
    if (result.success) {
      const download = this.localDownloads.get(downloadId)
      if (download) {
        download.status = DownloadStatus.PAUSED
        this.notifyListeners()
      }
    }
    return result
  }

  async resumeDownload(downloadId: string): Promise<Result<void>> {
    const result = await nativeModules.downloadManager.resumeDownload(
      downloadId,
    )
    if (result.success) {
      const download = this.localDownloads.get(downloadId)
      if (download) {
        download.status = DownloadStatus.DOWNLOADING
        this.notifyListeners()
      }
    }
    return result
  }

  async cancelDownload(downloadId: string): Promise<Result<void>> {
    const result = await nativeModules.downloadManager.cancelDownload(
      downloadId,
    )
    if (result.success) {
      const download = this.localDownloads.get(downloadId)
      if (download) {
        download.status = DownloadStatus.CANCELLED
        this.notifyListeners()
      }
    }
    return result
  }

  async clearCompleted(): Promise<Result<void>> {
    const result = await nativeModules.downloadManager.clearCompleted()
    if (result.success) {
      for (const [id, download] of this.localDownloads) {
        if (download.status === DownloadStatus.COMPLETED) {
          this.localDownloads.delete(id)
        }
      }
      this.notifyListeners()
    }
    return result
  }

  getDownloads(): Download[] {
    return Array.from(this.localDownloads.values())
  }

  getDownload(downloadId: string): Download | undefined {
    return this.localDownloads.get(downloadId)
  }
}

export const downloadService = new DownloadService()
