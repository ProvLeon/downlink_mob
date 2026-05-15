import { Outlet, RootRoute } from '@tanstack/react-router'
import { useCallback, useState } from '@lynx-js/react'
import { Download, Settings, CheckCircle } from 'lucide-react'
import { AddDownloadModal } from '../components/AddDownloadModal.js'

export const Route = new RootRoute({
  component: RootLayout,
})

function RootLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddDownload = useCallback(
    async (url: string, preset: any) => {
      // Placeholder for add download logic
      console.log('Add download:', url, preset)
    },
    []
  )

  return (
    <view className='flex flex-col h-screen bg-surface-900'>
      <view className='flex-1 overflow-y-auto'>
        <Outlet />
      </view>

      <AddDownloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddDownload}
      />

      <view className='border-t border-surface-800 bg-surface-900 safe-area-inset-bottom'>
        <view className='flex justify-around px-2 py-3'>
          <a
            href='/queue'
            className='flex flex-col items-center gap-1 p-2 text-center text-surface-400 hover:text-primary-400 transition-colors group'
          >
            <Download
              size={24}
              className='group-hover:text-primary-500 transition-colors'
            />
            <text className='text-xs'>Queue</text>
          </a>

          <button
            onClick={() => setIsModalOpen(true)}
            className='flex flex-col items-center gap-1 p-2 -mt-6 bg-primary-500 rounded-full hover:bg-primary-600 transition-colors shadow-lg'
          >
            <view className='text-white text-2xl'>+</view>
          </button>

          <a
            href='/completed'
            className='flex flex-col items-center gap-1 p-2 text-center text-surface-400 hover:text-primary-400 transition-colors group'
          >
            <CheckCircle
              size={24}
              className='group-hover:text-primary-500 transition-colors'
            />
            <text className='text-xs'>Done</text>
          </a>

          <a
            href='/settings'
            className='flex flex-col items-center gap-1 p-2 text-center text-surface-400 hover:text-primary-400 transition-colors group'
          >
            <Settings
              size={24}
              className='group-hover:text-primary-500 transition-colors'
            />
            <text className='text-xs'>Settings</text>
          </a>
        </view>
      </view>
    </view>
  )
}
