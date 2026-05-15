"""
POST /api/formats
Returns the best CDN stream URLs for a given URL and preset.
This is the primary endpoint the mobile app calls before downloading.

Flow:
  1. App calls POST /api/formats with { url, preset }
  2. Server returns direct CDN stream URLs (video_url / audio_url)
  3. App downloads directly from the CDN — no bandwidth cost to the server
  4. If needs_merge=True, app uses ffmpeg-kit to merge the two streams
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import FormatRequest, FormatResponse, ErrorResponse
from app.services import ytdlp_service

router = APIRouter()

VALID_PRESETS = {
    "mp4_best", "mp4_1080p", "mp4_720p", "mp4_480p",
    "audio_mp3", "audio_aac", "audio_opus",
}


@router.post(
    "/formats",
    response_model=FormatResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Resolve CDN stream URLs for a given preset",
    description=(
        "Returns the direct CDN URLs for the video (and audio if separate) stream "
        "matching the requested preset. The mobile app then downloads directly from "
        "the CDN. `needs_merge=True` means the app must merge video + audio using "
        "ffmpeg-kit before saving to the gallery."
    ),
)
async def resolve_formats(request: FormatRequest):
    if not request.url or not request.url.strip():
        raise HTTPException(status_code=400, detail="URL is required")

    if request.preset not in VALID_PRESETS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid preset. Must be one of: {', '.join(sorted(VALID_PRESETS))}",
        )

    try:
        result = ytdlp_service.get_stream_urls(request.url.strip(), request.preset)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return FormatResponse(**result)
