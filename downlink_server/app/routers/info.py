"""
POST /api/info
Returns full video metadata + all format details.
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import InfoRequest, VideoInfo, VideoFormat, ErrorResponse
from app.services import ytdlp_service

router = APIRouter()


@router.post(
    "/info",
    response_model=VideoInfo,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Fetch video metadata and available streams",
    description=(
        "Accepts a video URL and returns full metadata including title, thumbnail, "
        "duration, and all available format/stream URLs. The actual video data is "
        "never downloaded by the server — only metadata is fetched."
    ),
)
async def get_info(request: InfoRequest):
    if not request.url or not request.url.strip():
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        raw = ytdlp_service.get_video_info(request.url.strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build slim format list
    formats = []
    for f in raw.get("formats", []):
        formats.append(VideoFormat(
            format_id=f.get("format_id", ""),
            ext=f.get("ext", ""),
            format_note=f.get("format_note"),
            resolution=f.get("resolution"),
            fps=f.get("fps"),
            vcodec=f.get("vcodec"),
            acodec=f.get("acodec"),
            filesize=f.get("filesize"),
            filesize_approx=f.get("filesize_approx"),
            tbr=f.get("tbr"),
            abr=f.get("abr"),
            vbr=f.get("vbr"),
            url=f.get("url"),
            protocol=f.get("protocol"),
            width=f.get("width"),
            height=f.get("height"),
        ))

    return VideoInfo(
        id=raw.get("id", ""),
        title=raw.get("title", "Unknown"),
        description=raw.get("description"),
        thumbnail=raw.get("thumbnail"),
        duration=raw.get("duration"),
        uploader=raw.get("uploader"),
        upload_date=raw.get("upload_date"),
        view_count=raw.get("view_count"),
        like_count=raw.get("like_count"),
        webpage_url=raw.get("webpage_url", request.url),
        extractor=raw.get("extractor", ""),
        formats=formats,
    )
