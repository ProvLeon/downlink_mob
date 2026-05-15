/**
 * Native module interfaces - Maps to native platform implementations
 * On mobile, this bridges to platform-specific download managers and file systems
 */

import type {
  AppSettings,
  Download,
  FileSystemItem,
  NativeDownloadManager,
  NativeFileSystem,
  NativeSettings,
  PresetId,
  Result,
  StorageInfo,
} from '../types/index.js'

// ============================================================================
// Mock Implementation for Development
// ============================================================================

class MockDownloadManager implements NativeDownloadManager {
  private downloads: Map<string, Download> = new Map()
  private nextId = 1

  async addDownload(url: string, preset: PresetId): Promise<Result<string>> {
    try {
      const id = `download-${this.nextId++}`
      const download: Download = {
        id,
        url,
        title: url.split('/').pop() || 'Download',
        status: 'pending',
        progress: {
          downloadedBytes: 0,
          totalBytes: 0,
          percentage: 0,
          speed: 0,
          eta: 0,
          startTime: Date.now(),
        },
        format: 'mp4',
        preset,
        filePath: `/downloads/${id}.mp4`,
        createdAt: Date.now(),
      }
      this.downloads.set(id, download)
      return { success: true, data: id }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: String(error),
        },
      }
    }
  }

  async startDownload(downloadId: string): Promise<Result<void>> {
    const download = this.downloads.get(downloadId)
    if (!download) {
      return {
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Download not found',
        },
      }
    }
    download.status = 'downloading'
    return { success: true }
  }

  async pauseDownload(downloadId: string): Promise<Result<void>> {
    const download = this.downloads.get(downloadId)
    if (!download) {
      return {
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Download not found',
        },
      }
    }
    download.status = 'paused'
    return { success: true }
  }

  async resumeDownload(downloadId: string): Promise<Result<void>> {
    const download = this.downloads.get(downloadId)
    if (!download) {
      return {
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Download not found',
        },
      }
    }
    download.status = 'downloading'
    return { success: true }
  }

  async cancelDownload(downloadId: string): Promise<Result<void>> {
    const download = this.downloads.get(downloadId)
    if (!download) {
      return {
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Download not found',
        },
      }
    }
    download.status = 'cancelled'
    return { success: true }
  }

  async getDownloads(): Promise<Result<Download[]>> {
    return { success: true, data: Array.from(this.downloads.values()) }
  }

  async getDownload(downloadId: string): Promise<Result<Download>> {
    const download = this.downloads.get(downloadId)
    if (!download) {
      return {
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Download not found',
        },
      }
    }
    return { success: true, data: download }
  }

  async clearCompleted(): Promise<Result<void>> {
    for (const [id, download] of this.downloads) {
      if (download.status === 'completed') {
        this.downloads.delete(id)
      }
    }
    return { success: true }
  }
}

class MockFileSystem implements NativeFileSystem {
  async readFile(path: string): Promise<Result<string>> {
    return { success: true, data: '' }
  }

  async writeFile(path: string, content: string): Promise<Result<void>> {
    return { success: true }
  }

  async deleteFile(path: string): Promise<Result<void>> {
    return { success: true }
  }

  async listDirectory(path: string): Promise<Result<FileSystemItem[]>> {
    return { success: true, data: [] }
  }

  async getStorageInfo(): Promise<Result<StorageInfo>> {
    return {
      success: true,
      data: {
        totalBytes: 1024 * 1024 * 1024, // 1GB
        usedBytes: 512 * 1024 * 1024, // 512MB
        availableBytes: 512 * 1024 * 1024, // 512MB
      },
    }
  }

  async ensureDirectory(path: string): Promise<Result<void>> {
    return { success: true }
  }
}

class MockSettings implements NativeSettings {
  private settings: AppSettings = {
    downloadPath: '/downloads',
    maxConcurrentDownloads: 3,
    theme: 'dark',
    enableNotifications: true,
    autoStartDownloads: false,
    defaultPreset: 'mp4_720p',
  }

  async getSettings(): Promise<Result<AppSettings>> {
    return { success: true, data: this.settings }
  }

  async saveSettings(
    updates: Partial<AppSettings>,
  ): Promise<Result<void>> {
    this.settings = { ...this.settings, ...updates }
    return { success: true }
  }
}

// ============================================================================
// Native Module Registry
// ============================================================================

export const nativeModules = {
  downloadManager: new MockDownloadManager(),
  fileSystem: new MockFileSystem(),
  settings: new MockSettings(),
}

export type NativeModules = typeof nativeModules
