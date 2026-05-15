import { useCallback, useState } from '@lynx-js/react'
import { Route } from './route.js'
import type { AppSettings } from '../../types/index.js'
import { DEFAULT_SETTINGS, FORMAT_PRESETS } from '../../types/index.js'

export const Route = new Route({
  component: SettingsPage,
})

function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)

  const handleSettingChange = useCallback(
    (key: keyof AppSettings, value: any) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Placeholder for save logic
      console.log('Saving settings:', settings)
      // Simulate save
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  return (
    <view className='flex flex-col h-full bg-surface-900'>
      <view className='p-4'>
        <text className='text-2xl font-bold text-surface-50'>Settings</text>
      </view>

      <view className='flex-1 overflow-y-auto px-4 pb-4 space-y-4'>
        <view className='bg-surface-800 rounded-lg p-4 space-y-3 border border-surface-700'>
          <text className='text-sm font-semibold text-surface-100'>
            Download
          </text>

          <view>
            <view className='flex justify-between items-center mb-2'>
              <text className='text-sm text-surface-300'>
                Max Concurrent
              </text>
              <text className='text-sm font-medium text-primary-400'>
                {settings.maxConcurrentDownloads}
              </text>
            </view>
            <view className='flex gap-2'>
              {[1, 2, 3, 5].map((num) => (
                <button
                  key={num}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${settings.maxConcurrentDownloads === num
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                    }`}
                  onClick={() =>
                    handleSettingChange('maxConcurrentDownloads', num)
                  }
                  disabled={isSaving}
                >
                  {num}
                </button>
              ))}
            </view>
          </view>

          <view>
            <view className='flex justify-between items-center mb-2'>
              <text className='text-sm text-surface-300'>Default Format</text>
            </view>
            <view className='grid grid-cols-2 gap-2'>
              {Object.entries(FORMAT_PRESETS).map(([id, preset]) => (
                <button
                  key={id}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors ${settings.defaultPreset === id
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                    }`}
                  onClick={() =>
                    handleSettingChange('defaultPreset', id as any)
                  }
                  disabled={isSaving}
                >
                  {preset.label}
                </button>
              ))}
            </view>
          </view>
        </view>

        <view className='bg-surface-800 rounded-lg p-4 space-y-3 border border-surface-700'>
          <text className='text-sm font-semibold text-surface-100'>
            Appearance
          </text>

          <view>
            <view className='flex justify-between items-center mb-2'>
              <text className='text-sm text-surface-300'>Theme</text>
            </view>
            <view className='flex gap-2'>
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <button
                  key={theme}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${settings.theme === theme
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                    }`}
                  onClick={() => handleSettingChange('theme', theme)}
                  disabled={isSaving}
                >
                  {theme}
                </button>
              ))}
            </view>
          </view>
        </view>

        <view className='bg-surface-800 rounded-lg p-4 space-y-3 border border-surface-700'>
          <view className='flex items-center justify-between'>
            <text className='text-sm font-semibold text-surface-100'>
              Notifications
            </text>
            <button
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${settings.enableNotifications
                  ? 'bg-primary-500'
                  : 'bg-surface-700'
                }`}
              onClick={() =>
                handleSettingChange(
                  'enableNotifications',
                  !settings.enableNotifications
                )
              }
              disabled={isSaving}
            >
              <view
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.enableNotifications
                    ? 'translate-x-5'
                    : 'translate-x-1'
                  } mt-0.5`}
              />
            </button>
          </view>
        </view>

        <view className='bg-surface-800 rounded-lg p-4 space-y-3 border border-surface-700'>
          <view className='flex items-center justify-between'>
            <text className='text-sm font-semibold text-surface-100'>
              Auto-start Downloads
            </text>
            <button
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${settings.autoStartDownloads
                  ? 'bg-primary-500'
                  : 'bg-surface-700'
                }`}
              onClick={() =>
                handleSettingChange(
                  'autoStartDownloads',
                  !settings.autoStartDownloads
                )
              }
              disabled={isSaving}
            >
              <view
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.autoStartDownloads
                    ? 'translate-x-5'
                    : 'translate-x-1'
                  } mt-0.5`}
              />
            </button>
          </view>
        </view>
      </view>

      <view className='border-t border-surface-800 p-4 space-y-2'>
        <button
          className='w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 active:bg-primary-600 transition-colors disabled:opacity-50'
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </view>
    </view>
  )
}
