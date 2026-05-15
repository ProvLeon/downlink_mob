"""
GET /api/stream?url=<video_url>&preset=mp4_720p
Thin proxy endpoint for clients that cannot make direct CDN requests
(e.g., browser-based testing, range-request issues on specific CDNs).

NOTE: The mobile app should prefer the direct CDN URLs from /api/formats
and only fall back to this endpoint if the CDN URL is ephemeral or
CORS-restricted in a web context.
"""

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from app.services import ytdlp_service

router = APIRouter()


@router.get(
    "/stream",
    summary="Thin proxy stream for a URL + preset",
    description=(
        "Streams the resolved media directly to the client. "
        "Supports HTTP Range requests for seek support. "
        "Prefer /api/formats for the direct CDN URL in the mobile app."
    ),
)
async def proxy_stream(
    request: Request,
    url: str = Query(..., description="Original video page URL"),
    preset: str = Query("mp4_720p", description="Quality preset"),
):
    try:
        resolved = ytdlp_service.get_stream_urls(url, preset)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Pick the right CDN URL
    cdn_url = resolved.get("video_url") or resolved.get("audio_url")
    if not cdn_url:
        raise HTTPException(status_code=404, detail="No stream URL resolved")

    # Forward Range header if present (enables seeking)
    headers = {}
    if "range" in request.headers:
        headers["Range"] = request.headers["range"]

    async def stream_generator():
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("GET", cdn_url, headers=headers) as resp:
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    yield chunk

    # Probe response headers
    async with httpx.AsyncClient(timeout=15) as client:
        head = await client.head(cdn_url, headers=headers)

    content_type = head.headers.get("content-type", "video/mp4")
    content_length = head.headers.get("content-length")
    accept_ranges = head.headers.get("accept-ranges", "bytes")
    status_code = 206 if "range" in request.headers else 200

    response_headers = {
        "Content-Type": content_type,
        "Accept-Ranges": accept_ranges,
        "Access-Control-Allow-Origin": "*",
    }
    if content_length:
        response_headers["Content-Length"] = content_length
    if "range" in request.headers:
        response_headers["Content-Range"] = head.headers.get("content-range", "")

    return StreamingResponse(
        stream_generator(),
        status_code=status_code,
        headers=response_headers,
        media_type=content_type,
    )
