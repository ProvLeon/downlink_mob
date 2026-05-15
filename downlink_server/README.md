# Downlink Server

Lightweight FastAPI backend for the Downlink mobile app.

**It never downloads video files.** It only uses `yt-dlp` to extract direct CDN stream URLs (a few KB of JSON per request). All heavy video data flows directly from YouTube's CDN to the user's device.

## Architecture

```
Mobile App ──POST /api/formats──▶ Downlink Server (yt-dlp --dump-json)
                                        │
                                        └──returns CDN URLs──▶ Mobile App
                                                                     │
                                   YouTube CDN ◀── downloads ────────┘
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/info` | Full video metadata + all formats |
| `POST` | `/api/formats` | Resolve best CDN stream URL(s) for a preset |
| `GET` | `/api/stream` | Thin proxy with Range support (fallback) |

### POST `/api/formats` — Primary endpoint

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "preset": "mp4_720p"
}
```

**Response:**
```json
{
  "video_url": "https://rr3---sn-xxx.googlevideo.com/...",
  "audio_url": "https://rr3---sn-xxx.googlevideo.com/...",
  "merged": false,
  "needs_merge": true,
  "ext": "mp4",
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://i.ytimg.com/vi/...",
  "filesize_approx": 52428800
}
```

**Available presets:**
- `mp4_best` — Highest quality (always needs_merge)
- `mp4_1080p` — 1080p Full HD (needs_merge)
- `mp4_720p` — 720p HD (needs_merge)
- `mp4_480p` — 480p (merged single stream)
- `audio_mp3` — MP3 audio only
- `audio_aac` — M4A audio only
- `audio_opus` — Opus audio only

When `needs_merge=true`, the app downloads `video_url` and `audio_url` separately, then uses `ffmpeg-kit-react-native` to merge them into a final `.mp4`.

## Setup

```bash
# Install dependencies
uv sync

# Run dev server
uv run uvicorn main:app --reload --port 8000

# API docs
open http://localhost:8000/docs
```

## Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init
railway up
```

Set environment variables on Railway:
- `PORT=8000`
- `ENVIRONMENT=production`

## Project Structure

```
downlink_server/
├── main.py                     # Entry point
├── pyproject.toml              # uv dependencies
├── Dockerfile                  # For Railway / Fly.io
├── app/
│   ├── __init__.py             # App factory + CORS
│   ├── models/
│   │   └── schemas.py          # Pydantic request/response models
│   ├── services/
│   │   └── ytdlp_service.py    # Core yt-dlp wrapper
│   └── routers/
│       ├── health.py           # GET /health
│       ├── info.py             # POST /api/info
│       ├── formats.py          # POST /api/formats
│       └── stream.py           # GET /api/stream
```
