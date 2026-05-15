"""
POST /api/merge

Merge video and audio streams into a single file using FFmpeg.
Downloads both streams, merges them, and returns the result.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.services import merge_service

router = APIRouter()


class MergeRequest(BaseModel):
    """Request body for merge endpoint."""

    video_url: HttpUrl
    audio_url: HttpUrl
    ext: Optional[str] = "mp4"

    class Config:
        json_schema_extra = {
            "example": {
                "video_url": "https://example.com/video.mp4",
                "audio_url": "https://example.com/audio.m4a",
                "ext": "mp4",
            }
        }


class MergeResponse(BaseModel):
    """Response body for merge endpoint."""

    status: str
    message: str
    size_bytes: Optional[int] = None


@router.post(
    "/merge",
    summary="Merge video and audio streams",
    description=(
        "Downloads video and audio streams from the provided URLs, "
        "merges them using FFmpeg, and streams the result back to the client. "
        "The merged file is returned as binary content with appropriate headers."
    ),
    responses={
        200: {
            "description": "Merged media file",
            "content": {
                "video/mp4": {"description": "MP4 file"},
                "video/x-matroska": {"description": "MKV file"},
                "video/webm": {"description": "WebM file"},
                "video/quicktime": {"description": "MOV file"},
            },
        },
        400: {"description": "Invalid request (missing fields, invalid URLs)"},
        422: {"description": "Validation error"},
        500: {"description": "Server error (download failed, merge failed, etc.)"},
    },
)
async def merge_streams(request: MergeRequest):
    """
    Merge video and audio streams into a single file.

    **Request:**
    ```json
    {
        "video_url": "https://example.com/video.mp4",
        "audio_url": "https://example.com/audio.m4a",
        "ext": "mp4"
    }
    ```

    **Response:** Binary merged media file

    **Supported formats:** mp4, mkv, webm, mov
    """
    try:
        # Validate extension
        allowed_exts = {"mp4", "mkv", "webm", "mov"}
        if request.ext.lower() not in allowed_exts:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid extension '{request.ext}'. Supported: {', '.join(allowed_exts)}",
            )

        # Validate URLs are strings for merge_service
        video_url = str(request.video_url)
        audio_url = str(request.audio_url)

        # Perform merge
        merged_content = merge_service.merge_streams(
            video_url=video_url, audio_url=audio_url, ext=request.ext.lower()
        )

        # Determine content type
        content_type_map = {
            "mp4": "video/mp4",
            "mkv": "video/x-matroska",
            "webm": "video/webm",
            "mov": "video/quicktime",
        }
        content_type = content_type_map.get(
            request.ext.lower(), "application/octet-stream"
        )

        # Return the merged file as a streaming response
        from io import BytesIO

        from fastapi.responses import StreamingResponse

        return StreamingResponse(
            iter([merged_content]),
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename=merged.{request.ext.lower()}",
                "Content-Length": str(len(merged_content)),
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Access-Control-Allow-Origin": "*",
            },
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Merge operation failed: {str(e)}")
