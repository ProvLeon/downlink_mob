import { useMemo } from '@lynx-js/react'
import { HardDrive } from 'lucide-react'
import type { StorageInfo } from '../types/index.js'

interface StorageIndicatorProps {
  storageInfo: StorageInfo
  compact?: boolean
}

export function StorageIndicator({
  storageInfo,
  compact = false,
}: StorageIndicatorProps) {
  const { usedPercent, displayUsed, displayTotal } = useMemo(() => {
    const total = storageInfo.totalBytes || 1
    const used = storageInfo.usedBytes || 0
    const percent = (used / total) * 100

    const formatBytes = (bytes: number): string => {
      if (bytes > 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
      }
      if (bytes > 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      }
      if (bytes > 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
      }
      return `${bytes} B`
    }

    return {
      usedPercent: Math.min(100, percent),
      displayUsed: formatBytes(used),
      displayTotal: formatBytes(total),
    }
  }, [storageInfo])

  if (compact) {
    return (
      <view className='flex items-center gap-2'>
        <HardDrive size={16} className='text-primary-500' />
        <text className='text-sm text-surface-400'>
          {displayUsed} / {displayTotal}
        </text>
      </view>
    )
  }

  return (
    <view className='w-full space-y-2 p-3 bg-surface-800 rounded-lg'>
      <view className='flex justify-between items-center'>
        <view className='flex items-center gap-2'>
          <HardDrive size={18} className='text-primary-500' />
          <text className='text-sm font-medium text-surface-100'>Storage</text>
        </view>
        <text className='text-sm text-surface-400'>
          {displayUsed} / {displayTotal}
        </text>
      </view>
      <view className='bg-surface-700 rounded-full overflow-hidden h-2'>
        <view
          className='bg-gradient-to-r from-primary-400 to-primary-500 h-full transition-all duration-300'
          style={{ width: `${usedPercent}%` }}
        />
      </view>
      <text className='text-xs text-surface-500'>
        {usedPercent.toFixed(0)}% used
      </text>
    </view>
  )
}
