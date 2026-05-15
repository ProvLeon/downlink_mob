import { useCallback, useState } from '@lynx-js/react'
import { X, Plus } from 'lucide-react'
import type { PresetId } from '../types/index.js'
import { FORMAT_PRESETS, DEFAULT_SETTINGS } from '../types/index.js'

interface AddDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string, preset: PresetId) => Promise<void>
  isLoading?: boolean
}

export function AddDownloadModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddDownloadModalProps) {
  const [url, setUrl] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(
    DEFAULT_SETTINGS.defaultPreset
  )
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    setError('')

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(url.trim(), selectedPreset)
      setUrl('')
      setError('')
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add download'
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [url, selectedPreset, onSubmit, onClose])

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setUrl('')
      setError('')
      setSelectedPreset(DEFAULT_SETTINGS.defaultPreset)
      onClose()
    }
  }, [isSubmitting, onClose])

  if (!isOpen) return null

  return (
    <view className='fixed inset-0 bg-black/50 flex items-end z-50'>
      <view className='bg-surface-800 w-full rounded-t-2xl p-4 space-y-4 animate-slideUp'>
        <view className='flex justify-between items-center'>
          <text className='text-lg font-semibold text-surface-50'>
            Add Download
          </text>
          <button
            className='p-1 hover:bg-surface-700 rounded transition-colors'
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} className='text-surface-400' />
          </button>
        </view>

        <view className='space-y-2'>
          <text className='text-sm font-medium text-surface-300'>
            Media URL
          </text>
          <view className='bg-surface-900 rounded-lg border border-surface-700 overflow-hidden'>
            <input
              type='text'
              placeholder='https://example.com/video'
              value={url}
              onInput={(e) => setUrl(e.target.value as string)}
              disabled={isSubmitting || isLoading}
              className='w-full px-3 py-2 bg-surface-900 text-surface-50 placeholder:text-surface-600 border-0 outline-0 text-sm'
            />
          </view>
        </view>

        <view className='space-y-2'>
          <text className='text-sm font-medium text-surface-300'>
            Format & Quality
          </text>
          <view className='grid grid-cols-2 gap-2'>
            {Object.entries(FORMAT_PRESETS).map(([id, preset]) => (
              <button
                key={id}
                className={`p-3 rounded-lg border-2 transition-all ${selectedPreset === id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-surface-700 bg-surface-900'
                  }`}
                onClick={() => setSelectedPreset(id as PresetId)}
                disabled={isSubmitting || isLoading}
              >
                <text
                  className={`text-xs font-medium ${selectedPreset === id
                      ? 'text-primary-400'
                      : 'text-surface-300'
                    }`}
                >
                  {preset.label}
                </text>
                <text className='text-xs text-surface-500 mt-1'>
                  {preset.description}
                </text>
              </button>
            ))}
          </view>
        </view>

        {error && <text className='text-sm text-error'>{error}</text>}

        <view className='flex gap-2'>
          <button
            className='flex-1 py-2 px-3 bg-surface-700 text-surface-100 rounded-lg font-medium hover:bg-surface-600 active:bg-surface-600 transition-colors disabled:opacity-50'
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </button>
          <button
            className='flex-1 py-2 px-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 active:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            <Plus size={16} />
            <text>Add</text>
          </button>
        </view>
      </view>
    </view>
  )
}
