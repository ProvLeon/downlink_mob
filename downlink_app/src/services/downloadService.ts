/**
* Downlink Download Service
*
* Full download flow:
*  1. Call /api/formats on the Downlink backend (cheap — just JSON metadata)
*  2. For merged files (video + audio):
*     - Call /api/merge with the two stream URLs, backend handles FFmpeg
*     - Save merged file to device gallery
*  3. For single stream (video or audio only):
*     - Download directly from YouTube CDN to app cache
*     - Save to device gallery
*  4. Notify subscribers so the UI updates in real-time
*/

import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { FORMAT_PRESETS } from '../types/index';

// ─── Config ──────────────────────────────────────────────────────────────────
// Backend API URL - hosted on Render
const API_BASE = 'https://downlink-mob.onrender.com';

// ─── Types ───────────────────────────────────────────────────────────────────
export type DownloadStatus =
  | 'pending'
  | 'fetching_info'
  | 'downloading'
  | 'merging'
  | 'saving'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  progress: number;       // 0–100
  status: DownloadStatus;
  preset: typeof FORMAT_PRESETS[keyof typeof FORMAT_PRESETS];
  speed?: string;
  eta?: string;
  size?: string;
  error?: string;
  localUri?: string;      // Final gallery URI once completed
  needsMerge?: boolean;
}

type Listener = (items: DownloadItem[]) => void;

// ─── In-memory store ─────────────────────────────────────────────────────────
let _downloads: DownloadItem[] = [];
let _listeners: Listener[] = [];

const notify = () => _listeners.forEach((l) => l([..._downloads]));

const update = (id: string, patch: Partial<DownloadItem>) => {
  _downloads = _downloads.map((d) => (d.id === id ? { ...d, ...patch } : d));
  notify();
};

// ─── Active download callbacks map (for pause/cancel) ────────────────────────
const _activeDownloads = new Map<string, FileSystem.DownloadResumable>();

// ─── Public API ──────────────────────────────────────────────────────────────
export const DownloadService = {
  subscribe(listener: Listener) {
    _listeners.push(listener);
    listener([..._downloads]);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  },

  getDownloads() {
    return [..._downloads];
  },

  async addDownload(url: string, presetId: string) {
    const id = Date.now().toString();
    const preset = FORMAT_PRESETS[presetId as keyof typeof FORMAT_PRESETS] ?? FORMAT_PRESETS.mp4_720p;

    const item: DownloadItem = {
      id,
      url,
      title: 'Fetching info…',
      progress: 0,
      status: 'pending',
      preset,
    };

    _downloads = [item, ..._downloads];
    notify();

    // Kick off async — don't await so the UI stays responsive
    _runDownload(id, url, presetId).catch((err) => {
      console.error('[DownloadService] Unhandled error:', err);
      update(id, { status: 'failed', error: String(err) });
    });

    return id;
  },

  async pauseDownload(id: string) {
    const resumable = _activeDownloads.get(id);
    if (resumable) {
      await resumable.pauseAsync();
      update(id, { status: 'paused', speed: undefined });
    }
  },

  async resumeDownload(id: string) {
    const resumable = _activeDownloads.get(id);
    if (resumable) {
      update(id, { status: 'downloading' });
      resumable.resumeAsync();
    }
  },

  removeDownload(id: string) {
    const resumable = _activeDownloads.get(id);
    if (resumable) resumable.cancelAsync();
    _activeDownloads.delete(id);
    _downloads = _downloads.filter((d) => d.id !== id);
    notify();
  },
};

// ─── Core download orchestration ──────────────────────────────────────────────
async function _runDownload(id: string, url: string, presetId: string) {
  // Step 1: Resolve stream URLs from backend
  update(id, { status: 'fetching_info' });

  let streamInfo: {
    video_url?: string;
    audio_url?: string;
    merged: boolean;
    needs_merge: boolean;
    ext: string;
    title: string;
    thumbnail?: string;
    filesize_approx?: number;
  };

  try {
    const res = await fetch(`${API_BASE}/api/formats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, preset: presetId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail ?? 'Failed to resolve stream URLs');
    }

    streamInfo = await res.json();
  } catch (err: any) {
    const errorMsg = err.message ?? 'Network error';
    console.error('[DownloadService] Network error:', errorMsg);
    console.error('[DownloadService] API_BASE:', API_BASE);
    update(id, { status: 'failed', error: `Network error: ${errorMsg}. Make sure backend is running at ${API_BASE}` });
    return;
  }

  update(id, {
    title: streamInfo.title,
    thumbnail: streamInfo.thumbnail,
    needsMerge: streamInfo.needs_merge,
    size: streamInfo.filesize_approx
      ? _formatBytes(streamInfo.filesize_approx)
      : undefined,
    status: 'downloading',
    progress: 0,
  });

  const cacheDir = FileSystem.cacheDirectory + `downlink_${id}/`;
  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

  try {
    let finalUri: string;

    if (streamInfo.needs_merge && streamInfo.video_url && streamInfo.audio_url) {
      // Step 2: Call backend merge endpoint (handles FFmpeg on server)
      update(id, { status: 'merging', progress: 90, speed: undefined });

      try {
        const mergeRes = await fetch(`${API_BASE}/api/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_url: streamInfo.video_url,
            audio_url: streamInfo.audio_url,
            ext: streamInfo.ext,
          }),
        });

        if (!mergeRes.ok) {
          const err = await mergeRes.json().catch(() => ({}));
          throw new Error(
            err.detail || `Backend merge failed: ${mergeRes.status}`
          );
        }

        // Backend returns binary merged file
        const mergedBlob = await mergeRes.blob();
        const mergedPath = cacheDir + `merged.${streamInfo.ext}`;

        // Write blob to file system using base64
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = (reader.result as string).split(',')[1];
              await FileSystem.writeAsStringAsync(mergedPath, base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(mergedBlob);
        });

        finalUri = mergedPath;
      } catch (err: any) {
        throw new Error(
          `Merge error: ${err.message || String(err)}`
        );
      }
    } else {
      // Step 2: Single stream (merged or audio-only)
      const cdnUrl = streamInfo.video_url ?? streamInfo.audio_url ?? '';
      const filePath = cacheDir + `media.${streamInfo.ext}`;
      await _downloadFile(id, cdnUrl, filePath, 0, 95);
      finalUri = filePath;
    }

    // Step 3: Save to device gallery
    update(id, { status: 'saving', progress: 97 });

    const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
    if (permStatus !== 'granted') {
      throw new Error('Gallery permission denied');
    }

    const asset = await MediaLibrary.createAssetAsync(finalUri);

    // Clean up cache
    await FileSystem.deleteAsync(cacheDir, { idempotent: true });

    update(id, {
      status: 'completed',
      progress: 100,
      localUri: asset.uri,
      speed: undefined,
      eta: undefined,
    });
  } catch (err: any) {
    await FileSystem.deleteAsync(cacheDir, { idempotent: true }).catch(() => { });
    update(id, { status: 'failed', error: err.message ?? 'Download failed' });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function _downloadFile(
  id: string,
  cdnUrl: string,
  localPath: string,
  progressStart: number,
  progressEnd: number,
) {
  const range = progressEnd - progressStart;

  const resumable = FileSystem.createDownloadResumable(
    cdnUrl,
    localPath,
    {},
    (downloadProgress) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
      if (totalBytesExpectedToWrite > 0) {
        const pct =
          progressStart + (totalBytesWritten / totalBytesExpectedToWrite) * range;
        const speed = _formatBytes(totalBytesWritten) + '/s'; // rough approximation
        update(id, {
          progress: Math.min(pct, progressEnd),
          speed,
          eta: undefined,
        });
      }
    },
  );

  _activeDownloads.set(id, resumable);
  const result = await resumable.downloadAsync();
  _activeDownloads.delete(id);

  if (!result?.uri) throw new Error('Download returned no URI');
  return result.uri;
}

function _formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
