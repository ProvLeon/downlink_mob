import { useMemo } from '@lynx-js/react'

interface ProgressBarProps {
  percentage: number
  speed?: number
  eta?: number
  showLabel?: boolean
}

export function ProgressBar({
  percentage,
  speed,
  eta,
  showLabel = true,
}: ProgressBarProps) {
  const displaySpeed = useMemo(() => {
    if (!speed) return ''
    if (speed > 1024 * 1024) {
      return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`
    }
    if (speed > 1024) {
      return `${(speed / 1024).toFixed(1)} KB/s`
    }
    return `${speed.toFixed(0)} B/s`
  }, [speed])

  const displayEta = useMemo(() => {
    if (!eta) return ''
    if (eta > 3600) {
      const hours = Math.floor(eta / 3600)
      const minutes = Math.floor((eta % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
    if (eta > 60) {
      const minutes = Math.floor(eta / 60)
      const seconds = eta % 60
      return `${minutes}m ${seconds}s`
    }
    return `${Math.ceil(eta)}s`
  }, [eta])

  const clampedPercentage = Math.max(0, Math.min(100, percentage || 0))

  return (
    <view className='w-full space-y-1'>
      <view className='bg-surface-700 rounded-lg overflow-hidden h-2'>
        <view
          className='bg-gradient-to-r from-primary-400 to-primary-500 h-full rounded-lg transition-all duration-300'
          style={{ width: `${clampedPercentage}%` }}
        />
      </view>
      {showLabel && (
        <view className='flex justify-between items-center px-1'>
          <text className='text-xs text-surface-400'>
            {clampedPercentage.toFixed(0)}%
          </text>
          {(displaySpeed || displayEta) && (
            <view className='flex gap-2'>
              {displaySpeed && (
                <text className='text-xs text-surface-400'>{displaySpeed}</text>
              )}
              {displayEta && (
                <text className='text-xs text-surface-400'>{displayEta}</text>
              )}
            </view>
          )}
        </view>
      )}
    </view>
  )
}
