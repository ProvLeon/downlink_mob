import { useCallback, useState } from '@lynx-js/react'
import { Route } from './route.js'
import { DownloadItem } from '../../components/DownloadItem.js'
import { StorageIndicator } from '../../components/StorageIndicator.js'
import type { Download, PresetId, StorageInfo } from '../../types/index.js'
import { DownloadStatus } from '../../types/index.js'

// Mock data for demonstration
const mockDownloads: Download[] = [
  {
    id: '1',
    url: 'https://example.com/video1',
    title: 'Sample Video 1',
    status: DownloadStatus.DOWNLOADING,
    progress: {
      downloadedBytes: 500 * 1024 * 1024,
      totalBytes: 1000 * 1024 * 1024,
      percentage: 50,
      speed: 5 * 1024 * 1024,
      eta: 100,
      startTime: Date.now() - 100000,
    },
    format: 'mp4',
    preset: 'mp4_720p',
    filePath: '/downloads/video1.mp4',
    duration: 3600,
    createdAt: Date.now() - 200000,
  },
  {
    id: '2',
    url: 'https://example.com/audio1',
    title: 'Podcast Episode',
    status: DownloadStatus.PENDING,
    progress: {
      downloadedBytes: 0,
      totalBytes: 150 * 1024 * 1024,
      percentage: 0,
      speed: 0,
      eta: 0,
      startTime: 0,
    },
    format: 'mp3',
    preset: 'audio_mp3',
    filePath: '/downloads/podcast.mp3',
    duration: 7200,
    createdAt: Date.now(),
  },
]

const mockStorageInfo: StorageInfo = {
  totalBytes: 500 * 1024 * 1024 * 1024,
  usedBytes: 250 * 1024 * 1024 * 1024,
  availableBytes: 250 * 1024 * 1024 * 1024,
}

export const Route = new Route({
  component: QueuePage,
})

function QueuePage() {
  const [downloads, setDownloads] = useState<Download[]>(mockDownloads)
  const [storageInfo] = useState<StorageInfo>(mockStorageInfo)

  const handlePlay = useCallback((downloadId: string) => {
    console.log('Play download:', downloadId)
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === downloadId
          ? { ...d, status: DownloadStatus.DOWNLOADING }
          : d
      )
    )
  }, [])

  const handlePause = useCallback((downloadId: string) => {
    console.log('Pause download:', downloadId)
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === downloadId ? { ...d, status: DownloadStatus.PAUSED } : d
      )
    )
  }, [])

  const handleCancel = useCallback((downloadId: string) => {
    console.log('Cancel download:', downloadId)
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === downloadId
          ? { ...d, status: DownloadStatus.CANCELLED }
          : d
      )
    )
  }, [])

  const activeDownloads = downloads.filter(
    (d) =>
      d.status === DownloadStatus.DOWNLOADING ||
      d.status === DownloadStatus.PENDING ||
      d.status === DownloadStatus.PAUSED
  )

  return (
    <view className='flex flex-col h-full bg-surface-900'>
      <view className='p-4 space-y-4'>
        <view>
          <text className='text-2xl font-bold text-surface-50'>Downloads</text>
          <text className='text-sm text-surface-400 mt-1'>
            {activeDownloads.length} active
          </text>
        </view>

        <StorageIndicator storageInfo={storageInfo} />
      </view>

      <view className='flex-1 overflow-y-auto px-4 pb-4'>
        {activeDownloads.length > 0 ? (
          <view className='space-y-3'>
            {activeDownloads.map((download) => (
              <DownloadItem
                key={download.id}
                download={download}
                onPlay={handlePlay}
                onPause={handlePause}
                onCancel={handleCancel}
              />
            ))}
          </view>
        ) : (
          <view className='flex flex-col items-center justify-center h-full'>
            <text className='text-surface-500 text-center'>
              No active downloads
            </text>
          </view>
        )}
      </view>
    </view>
  )
}
