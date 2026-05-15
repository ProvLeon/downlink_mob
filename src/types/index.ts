/**
 * Core type definitions for Downlink media downloader
 */

// ============================================================================
// Download State Types
// ============================================================================

export enum DownloadStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface DownloadProgress {
  downloadedBytes: number
  totalBytes: number
  percentage: number
  speed: number // bytes/sec
  eta: number // seconds remaining
  startTime: number // timestamp
}

export interface Download {
  id: string
  url: string
  title: string
  status: DownloadStatus
  progress: DownloadProgress
  format: string
  preset: PresetId
  filePath: string
  thumbnail?: string
  duration?: number
  error?: string
  createdAt: number
  completedAt?: number
}

export interface DownloadQueue {
  downloads: Download[]
  activeDownloadId?: string
}

// ============================================================================
// Preset & Format Types
// ============================================================================

export type PresetId =
  | 'mp4_best'
  | 'mp4_1080p'
  | 'mp4_720p'
  | 'mp4_480p'
  | 'audio_mp3'
  | 'audio_aac'
  | 'audio_opus'

export interface FormatPreset {
  id: PresetId
  label: string
  description: string
  container: 'mp4' | 'webm' | 'mkv' | 'mp3' | 'm4a' | 'opus' | 'wav'
  videoQuality?: '1080p' | '720p' | '480p' | 'best' | 'none'
  audioQuality?: 'best' | '192k' | '128k'
  codec?: string
}

export const FORMAT_PRESETS: Record<PresetId, FormatPreset> = {
  mp4_best: {
    id: 'mp4_best',
    label: 'MP4 Best',
    description: 'Highest quality MP4 video',
    container: 'mp4',
    videoQuality: 'best',
    audioQuality: 'best',
  },
  mp4_1080p: {
    id: 'mp4_1080p',
    label: 'MP4 1080p',
    description: 'Full HD MP4',
    container: 'mp4',
    videoQuality: '1080p',
    audioQuality: 'best',
  },
  mp4_720p: {
    id: 'mp4_720p',
    label: 'MP4 720p',
    description: 'HD MP4',
    container: 'mp4',
    videoQuality: '720p',
    audioQuality: 'best',
  },
  mp4_480p: {
    id: 'mp4_480p',
    label: 'MP4 480p',
    description: 'Mobile MP4',
    container: 'mp4',
    videoQuality: '480p',
    audioQuality: 'best',
  },
  audio_mp3: {
    id: 'audio_mp3',
    label: 'MP3',
    description: 'Audio only (MP3)',
    container: 'mp3',
    videoQuality: 'none',
    audioQuality: 'best',
  },
  audio_aac: {
    id: 'audio_aac',
    label: 'M4A',
    description: 'Audio only (AAC)',
    container: 'm4a',
    videoQuality: 'none',
    audioQuality: 'best',
  },
  audio_opus: {
    id: 'audio_opus',
    label: 'Opus',
    description: 'Audio only (Opus)',
    container: 'opus',
    videoQuality: 'none',
    audioQuality: 'best',
  },
}

// ============================================================================
// Settings Types
// ============================================================================

export interface AppSettings {
  downloadPath: string
  maxConcurrentDownloads: number
  theme: 'light' | 'dark' | 'auto'
  enableNotifications: boolean
  autoStartDownloads: boolean
  defaultPreset: PresetId
  proxyUrl?: string
  customHeaders?: Record<string, string>
  storageLimit?: number // MB
}

export const DEFAULT_SETTINGS: AppSettings = {
  downloadPath: '/downloads',
  maxConcurrentDownloads: 3,
  theme: 'dark',
  enableNotifications: true,
  autoStartDownloads: false,
  defaultPreset: 'mp4_720p',
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageInfo {
  totalBytes: number
  usedBytes: number
  availableBytes: number
}

export interface FileSystemItem {
  path: string
  name: string
  size: number
  modifiedAt: number
  isDirectory: boolean
}

// ============================================================================
// Error & Response Types
// ============================================================================

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_URL = 'INVALID_URL',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  STORAGE_FULL = 'STORAGE_FULL',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

export interface Result<T> {
  success: boolean
  data?: T
  error?: AppError
}

// ============================================================================
// Native Module Types
// ============================================================================

export interface NativeDownloadManager {
  addDownload(url: string, preset: PresetId): Promise<Result<string>>
  startDownload(downloadId: string): Promise<Result<void>>
  pauseDownload(downloadId: string): Promise<Result<void>>
  resumeDownload(downloadId: string): Promise<Result<void>>
  cancelDownload(downloadId: string): Promise<Result<void>>
  getDownloads(): Promise<Result<Download[]>>
  getDownload(downloadId: string): Promise<Result<Download>>
  clearCompleted(): Promise<Result<void>>
}

export interface NativeFileSystem {
  readFile(path: string): Promise<Result<string>>
  writeFile(path: string, content: string): Promise<Result<void>>
  deleteFile(path: string): Promise<Result<void>>
  listDirectory(path: string): Promise<Result<FileSystemItem[]>>
  getStorageInfo(): Promise<Result<StorageInfo>>
  ensureDirectory(path: string): Promise<Result<void>>
}

export interface NativeSettings {
  getSettings(): Promise<Result<AppSettings>>
  saveSettings(settings: Partial<AppSettings>): Promise<Result<void>>
}

// ============================================================================
// App State Context
// ============================================================================

export interface AppContextValue {
  // State
  downloads: Download[]
  activeDownloadId?: string
  settings: AppSettings
  storageInfo: StorageInfo
  isLoading: boolean
  error?: AppError

  // Download Actions
  addDownload(url: string, preset: PresetId): Promise<void>
  startDownload(downloadId: string): Promise<void>
  pauseDownload(downloadId: string): Promise<void>
  resumeDownload(downloadId: string): Promise<void>
  cancelDownload(downloadId: string): Promise<void>
  clearCompleted(): Promise<void>

  // Settings Actions
  updateSettings(settings: Partial<AppSettings>): Promise<void>
}
