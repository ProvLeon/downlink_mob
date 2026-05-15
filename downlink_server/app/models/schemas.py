from pydantic import BaseModel
from typing import Optional, List


class VideoFormat(BaseModel):
    format_id: str
    format_note: Optional[str] = None
    ext: str
    resolution: Optional[str] = None
    fps: Optional[float] = None
    vcodec: Optional[str] = None
    acodec: Optional[str] = None
    filesize: Optional[int] = None
    filesize_approx: Optional[int] = None
    tbr: Optional[float] = None  # Total bitrate
    abr: Optional[float] = None  # Audio bitrate
    vbr: Optional[float] = None  # Video bitrate
    url: Optional[str] = None    # Direct CDN URL
    protocol: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class VideoInfo(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[float] = None        # seconds
    uploader: Optional[str] = None
    upload_date: Optional[str] = None
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    webpage_url: str
    extractor: str
    formats: List[VideoFormat] = []
    # Pre-selected best streams for common presets
    stream_720p: Optional[str] = None
    stream_1080p: Optional[str] = None
    stream_audio: Optional[str] = None


class InfoRequest(BaseModel):
    url: str


class FormatRequest(BaseModel):
    url: str
    preset: str  # mp4_720p | mp4_1080p | mp4_best | audio_mp3 etc.


class FormatResponse(BaseModel):
    video_url: Optional[str] = None   # Direct CDN URL for video stream
    audio_url: Optional[str] = None   # Direct CDN URL for audio stream (if separate)
    merged: bool = False              # True if a single URL contains both
    ext: str
    title: str
    thumbnail: Optional[str] = None
    filesize_approx: Optional[int] = None
    needs_merge: bool = False         # True = app must download both and merge


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
