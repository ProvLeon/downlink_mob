import { useState } from '@lynx-js/react'
import { Route } from './route.js'
import { DownloadItem } from '../../components/DownloadItem.js'
import type { Download, StorageInfo } from '../../types/index.js'
import { DownloadStatus } from '../../types/index.js'

// Mock completed downloads
const mockCompletedDownloads: Download[] = [
  {
    id: '3',
    url: 'https://example.com/video2',
    title: 'Completed Video 1',
    status: DownloadStatus.COMPLETED,
    progress: {
      downloadedBytes: 1000 * 1024 * 1024,
      totalBytes: 1000 * 1024 * 1024,
      percentage: 100,
      speed: 0,
      eta: 0,
      startTime: Date.now() - 500000,
    },
    format: 'mp4',
    preset: 'mp4_720p',
    filePath: '/downloads/video2.mp4',
    duration: 3600,
    createdAt: Date.now() - 600000,
    completedAt: Date.now() - 100000,
  },
  {
    id: '4',
    url: 'https://example.com/audio2',
    title: 'Downloaded Song',
    status: DownloadStatus.COMPLETED,
    progress: {
      downloadedBytes: 50 * 1024 * 1024,
      totalBytes: 50 * 1024 * 1024,
      percentage: 100,
      speed: 0,
      eta: 0,
      startTime: Date.now() - 300000,
    },
    format: 'mp3',
    preset: 'audio_mp3',
    filePath: '/downloads/song.mp3',
    duration: 300,
    createdAt: Date.now() - 400000,
    completedAt: Date.now() - 50000,
  },
]

export const Route = new Route({
  component: CompletedPage,
})

function CompletedPage() {
  const [downloads] = useState<Download[]>(mockCompletedDownloads)

  const completedDownloads = downloads.filter(
    (d) => d.status === DownloadStatus.COMPLETED
  )

  return (
    <view className='flex flex-col h-full bg-surface-900'>
      <view className='p-4'>
        <view>
          <text className='text-2xl font-bold text-surface-50'>Completed</text>
          <text className='text-sm text-surface-400 mt-1'>
            {completedDownloads.length} downloads
          </text>
        </view>
      </view>

      <view className='flex-1 overflow-y-auto px-4 pb-4'>
        {completedDownloads.length > 0 ? (
          <view className='space-y-3'>
            {completedDownloads.map((download) => (
              <DownloadItem key={download.id} download={download} />
            ))}
          </view>
        ) : (
          <view className='flex flex-col items-center justify-center h-full'>
            <text className='text-surface-500 text-center'>
              No completed downloads yet
            </text>
          </view>
        )}
      </view>
    </view>
  )
}
