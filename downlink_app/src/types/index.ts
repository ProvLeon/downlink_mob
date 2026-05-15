export enum DownloadStatus {
  PENDING = 'pending',
  FETCHING_INFO = 'fetching_info',
  DOWNLOADING = 'downloading',
  MERGING = 'merging',
  SAVING = 'saving',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export type PresetId =
  | 'mp4_best'
  | 'mp4_1080p'
  | 'mp4_720p'
  | 'mp4_480p'
  | 'audio_mp3'
  | 'audio_aac'
  | 'audio_opus';

export interface FormatPreset {
  id: PresetId;
  label: string;
  description: string;
  container: string;
  videoQuality?: '1080p' | '720p' | '480p' | 'best' | 'none';
  audioQuality?: 'best' | '192k' | '128k';
}

export const FORMAT_PRESETS: Record<PresetId, FormatPreset> = {
  mp4_best: { id: 'mp4_best', label: 'MP4 Best', description: 'Highest quality MP4 video', container: 'mp4', videoQuality: 'best' },
  mp4_1080p: { id: 'mp4_1080p', label: 'MP4 1080p', description: 'Full HD MP4', container: 'mp4', videoQuality: '1080p' },
  mp4_720p: { id: 'mp4_720p', label: 'MP4 720p', description: 'HD MP4', container: 'mp4', videoQuality: '720p' },
  mp4_480p: { id: 'mp4_480p', label: 'MP4 480p', description: 'Mobile MP4', container: 'mp4', videoQuality: '480p' },
  audio_mp3: { id: 'audio_mp3', label: 'MP3', description: 'Audio only (MP3)', container: 'mp3', videoQuality: 'none' },
  audio_aac: { id: 'audio_aac', label: 'M4A', description: 'Audio only (AAC)', container: 'm4a', videoQuality: 'none' },
  audio_opus: { id: 'audio_opus', label: 'Opus', description: 'Audio only (Opus)', container: 'opus', videoQuality: 'none' },
};
