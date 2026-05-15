import { useCallback } from '@lynx-js/react'
import {
  Pause,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react'
import type { Download, DownloadStatus } from '../types/index.js'
import { DownloadStatus as DS } from '../types/index.js'
import { ProgressBar } from './ProgressBar.js'

interface DownloadItemProps {
  download: Download
  onPlay?: (id: string) => void
  onPause?: (id: string) => void
  onCancel?: (id: string) => void
}

export function DownloadItem({
  download,
  onPlay,
  onPause,
  onCancel,
}: DownloadItemProps) {
  const handlePlay = useCallback(
    () => onPlay?.(download.id),
    [download.id, onPlay]
  )
  const handlePause = useCallback(
    () => onPause?.(download.id),
    [download.id, onPause]
  )
  const handleCancel = useCallback(
    () => onCancel?.(download.id),
    [download.id, onCancel]
  )

  const getStatusIcon = (status: DownloadStatus) => {
    switch (status) {
      case DS.COMPLETED:
        return <CheckCircle size={20} className='text-success' />
      case DS.FAILED:
        return <AlertCircle size={20} className='text-error' />
      case DS.DOWNLOADING:
        return <Download size={20} className='text-primary-500' />
      default:
        return null
    }
  }

  const getStatusColor = (status: DownloadStatus): string => {
    switch (status) {
      case DS.DOWNLOADING:
        return 'text-primary-500'
      case DS.PAUSED:
        return 'text-warning'
      case DS.COMPLETED:
        return 'text-success'
      case DS.FAILED:
        return 'text-error'
      default:
        return 'text-surface-400'
    }
  }

  const isActive =
    download.status === DS.DOWNLOADING || download.status === DS.PENDING

  return (
    <view className='bg-surface-800 rounded-lg p-3 space-y-2 border border-surface-700'>
      <view className='flex justify-between items-start gap-2'>
        <view className='flex-1 min-w-0'>
          <text
            className='text-sm font-medium text-surface-50 truncate'
            numberOfLines={1}
          >
            {download.title}
          </text>
          <text className='text-xs text-surface-500 mt-1'>
            {download.format.toUpperCase()}
            {download.progress.totalBytes > 0
              ? ` • ${(download.progress.totalBytes / (1024 * 1024)).toFixed(1)} MB`
              : ''}
          </text>
        </view>
        <view className='flex gap-1'>
          {isActive && download.status !== DS.DOWNLOADING && (
            <button
              className='p-1.5 hover:bg-surface-700 rounded active:bg-surface-600 transition-colors'
              onClick={handlePlay}
            >
              <Play size={16} className='text-primary-500' />
            </button>
          )}
          {download.status === DS.DOWNLOADING && (
            <button
              className='p-1.5 hover:bg-surface-700 rounded active:bg-surface-600 transition-colors'
              onClick={handlePause}
            >
              <Pause size={16} className='text-primary-500' />
            </button>
          )}
          {download.status !== DS.COMPLETED && (
            <button
              className='p-1.5 hover:bg-surface-700 rounded active:bg-surface-600 transition-colors'
              onClick={handleCancel}
            >
              <X size={16} className='text-surface-500' />
            </button>
          )}
        </view>
      </view>

      {download.status === DS.DOWNLOADING && (
        <ProgressBar
          percentage={download.progress.percentage}
          speed={download.progress.speed}
          eta={download.progress.eta}
          showLabel
        />
      )}

      <view className='flex justify-between items-center'>
        <view className='flex items-center gap-2'>
          {getStatusIcon(download.status)}
          <text
            className={`text-xs font-medium capitalize ${getStatusColor(download.status)}`}
          >
            {download.status}
          </text>
        </view>
        {download.status === DS.DOWNLOADING && (
          <text className='text-xs text-surface-400'>
            {(
              download.progress.downloadedBytes /
              (1024 * 1024)
            ).toFixed(1)}{' '}
            MB
          </text>
        )}
      </view>

      {download.error && (
        <text className='text-xs text-error'>{download.error}</text>
      )}
    </view>
  )
}
