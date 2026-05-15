# FFmpeg Merge Endpoint

The `/api/merge` endpoint combines separate video and audio streams into a single media file using FFmpeg.

## Overview

**Endpoint:** `POST /api/merge`

**Purpose:** Download video and audio streams from CDN URLs, merge them using FFmpeg (without re-encoding for speed), and stream the result back to the client.

## Request

### Content-Type
```
application/json
```

### Body

```json
{
  "video_url": "https://cdn.example.com/video.mp4",
  "audio_url": "https://cdn.example.com/audio.m4a",
  "ext": "mp4"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `video_url` | URL string | Yes | URL to the video stream (must be valid HTTP/HTTPS URL) |
| `audio_url` | URL string | Yes | URL to the audio stream (must be valid HTTP/HTTPS URL) |
| `ext` | string | No | Output file extension. Supported: `mp4`, `mkv`, `webm`, `mov`. Default: `mp4` |

## Response

### Success (200 OK)

The endpoint returns the merged media file as binary content with appropriate headers:

```
Content-Type: video/mp4 (or appropriate type for the extension)
Content-Disposition: attachment; filename=merged.mp4
Content-Length: {file_size_in_bytes}
Cache-Control: no-cache, no-store, must-revalidate
```

The response body is the raw video file content.

### Error Responses

| Status | Description | Example |
|--------|-------------|---------|
| 400 | Bad Request - Invalid URL or extension | `{"detail": "Invalid extension 'avi'. Supported: mp4, mkv, webm, mov"}` |
| 422 | Validation Error - Missing required fields | `{"detail": [...]}` |
| 500 | Server Error - Download or merge failed | `{"detail": "Merge operation failed: FFmpeg merge failed: ..."}` |

## How It Works

1. **Validation**: Validates the input URLs and extension
2. **Download Video**: Downloads the video stream to a temporary file (with size limit checks)
3. **Download Audio**: Downloads the audio stream to a temporary file (with size limit checks)
4. **Merge**: Uses FFmpeg to merge the streams (copy codecs, no re-encoding for speed)
5. **Stream Response**: Streams the merged file back to the client
6. **Cleanup**: Automatically removes all temporary files after streaming

## Configuration

See `app/services/merge_service.py` for configurable constants:

- **DOWNLOAD_TIMEOUT**: 300 seconds (5 minutes) per stream download
- **MERGE_TIMEOUT**: 600 seconds (10 minutes) for the merge operation
- **MAX_FILE_SIZE**: 2 GB per downloaded stream

## Supported Formats

- **MP4** (default): H.264 video + AAC audio
- **MKV**: Matroska container (supports diverse codecs)
- **WebM**: VP9 video + Opus audio (web-optimized)
- **MOV**: Apple QuickTime format

## Example Usage

### Using cURL

```bash
curl -X POST http://localhost:8000/api/merge \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/video.mp4",
    "audio_url": "https://example.com/audio.m4a",
    "ext": "mp4"
  }' \
  -o merged.mp4
```

### Using Python

```python
import requests

response = requests.post(
    "http://localhost:8000/api/merge",
    json={
        "video_url": "https://example.com/video.mp4",
        "audio_url": "https://example.com/audio.m4a",
        "ext": "mp4"
    },
    timeout=900  # 15 minutes (download + merge time)
)

if response.status_code == 200:
    with open("merged.mp4", "wb") as f:
        f.write(response.content)
else:
    print(f"Error: {response.status_code} - {response.text}")
```

### Using JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:8000/api/merge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    video_url: 'https://example.com/video.mp4',
    audio_url: 'https://example.com/audio.m4a',
    ext: 'mp4'
  })
});

if (response.ok) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'merged.mp4';
  a.click();
}
```

## Performance Notes

- **Fast Merging**: The endpoint uses codec copy (`-c:v copy -c:a copy`), which means no re-encoding—just stream concatenation. This makes the operation fast.
- **Memory**: Streams are downloaded in chunks (65KB blocks) to avoid loading entire files into memory at once.
- **Large Files**: The endpoint can handle files up to 2GB per stream. Adjust `MAX_FILE_SIZE` in `merge_service.py` if needed.
- **Concurrent Requests**: Each request uses unique temporary filenames, so multiple merges can run concurrently.

## Architecture

### Files

- **`app/routers/merge.py`**: FastAPI route handler with request/response models
- **`app/services/merge_service.py`**: Core merge logic, downloading, FFmpeg orchestration, and cleanup

### Temporary Files

Temporary files are stored in the system's temp directory under `downlink_merge/`:
- `video_{session_id}.tmp` - Downloaded video stream
- `audio_{session_id}.tmp` - Downloaded audio stream
- `merged_{session_id}.{ext}` - Merged output (before streaming and cleanup)

All temporary files are cleaned up in a `finally` block after the response is streamed.

### Background Cleanup

For periodic cleanup of orphaned temp files (e.g., from crashed requests), you can run:

```python
from app.services.merge_service import cleanup_old_temp_files

cleanup_old_temp_files(max_age_hours=24)  # Remove files older than 24 hours
```

This could be called via a scheduled background task (e.g., APScheduler).

## Error Handling

The endpoint handles various failure scenarios gracefully:

1. **Invalid URLs**: Pydantic validation rejects malformed URLs before processing
2. **HTTP Errors**: Caught and reported (e.g., 404, 403)
3. **Download Timeouts**: Caught and reported with timeout duration
4. **File Size Exceeded**: Monitored during download, rejected if > 2GB
5. **FFmpeg Errors**: Stderr output captured and returned to client
6. **Merge Timeouts**: 10-minute timeout with clear error message

All temporary files are cleaned up even if an error occurs (via `finally` block).

## Docker / Deployment

The `Dockerfile` already includes FFmpeg:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*
```

To verify FFmpeg is installed in a running container:

```bash
docker exec <container_id> ffmpeg -version
```

## Security Considerations

- **URL Validation**: Pydantic validates URLs are valid HTTP/HTTPS
- **Timeout Limits**: Download and merge operations have strict timeout limits
- **File Size Limits**: 2GB max per stream to prevent disk exhaustion
- **Temp Directory**: Uses system temp directory (typically `/tmp` on Unix, `%TEMP%` on Windows)
- **Error Messages**: Error messages don't leak sensitive system info
- **CORS**: The endpoint respects the app's CORS configuration

### Production Recommendations

1. **Restrict CORS origins** to your specific domain instead of `"*"`
2. **Implement rate limiting** to prevent abuse
3. **Monitor disk space** of the temp directory
4. **Set up alerts** for failed merge operations
5. **Consider authentication** if this is a user-facing service
6. **Implement request logging** for audit trails

## Troubleshooting

### "FFmpeg merge failed" Error

Check if FFmpeg is installed:
```bash
which ffmpeg  # On Unix
where ffmpeg  # On Windows
```

### "Download timeout" Error

Increase `DOWNLOAD_TIMEOUT` in `merge_service.py` if downloading large streams.

### "Merge operation timed out" Error

Increase `MERGE_TIMEOUT` in `merge_service.py` for complex merges.

### "Download exceeded maximum file size" Error

Increase `MAX_FILE_SIZE` in `merge_service.py` or split your files.

### Temporary files not being cleaned up

Check disk permissions on the temp directory. You can also manually run:
```python
from app.services.merge_service import cleanup_old_temp_files
cleanup_old_temp_files(max_age_hours=0)  # Clean all
```

## Testing

### Using FastAPI Interactive Docs

1. Start the server: `uv run uvicorn main:app --reload`
2. Visit http://localhost:8000/docs
3. Find the `/api/merge` endpoint and click "Try it out"
4. Fill in the request body with valid stream URLs
5. Click "Execute"

### Using a Test Script

```python
import requests

# Test with real streaming URLs (YouTube example)
# Note: Make sure URLs are directly streamable (not behind JavaScript)
response = requests.post(
    "http://localhost:8000/api/merge",
    json={
        "video_url": "https://example.com/sample_video.mp4",
        "audio_url": "https://example.com/sample_audio.m4a",
        "ext": "mp4"
    },
    timeout=900
)

print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('content-type')}")
print(f"File Size: {len(response.content)} bytes")

if response.status_code == 200:
    with open("test_merged.mp4", "wb") as f:
        f.write(response.content)
    print("✓ Merge successful!")
else:
    print(f"✗ Error: {response.json()}")
```

---

**Created:** Production-ready FFmpeg merge endpoint for the Downlink API
**Last Updated:** 2024
