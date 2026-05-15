"""
Core yt-dlp service.
All yt-dlp interactions are centralised here so routers stay clean.
The service NEVER downloads the actual media — it only extracts metadata
and direct CDN stream URLs. All heavy lifting (the actual video bytes)
travels directly from the CDN to the user's device.
"""

from typing import Any, Dict, Optional

import yt_dlp

# ---------------------------------------------------------------------------
# Preset → yt-dlp format selector mapping
# ---------------------------------------------------------------------------
FORMAT_SELECTORS: Dict[str, str] = {
    "mp4_best": "bv*+ba/b",
    "mp4_1080p": "bv*[height<=1080]+ba/b[height<=1080]",
    "mp4_720p": "bv*[height<=720]+ba/b[height<=720]",
    "mp4_480p": "bv*[height<=480]+ba/b[height<=480]",
    "audio_mp3": "ba[ext=mp3]/ba/b",
    "audio_aac": "ba[ext=m4a]/ba/b",
    "audio_opus": "ba[ext=opus]/ba/b",
}

# Base options — never download, always quiet
_BASE_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "noplaylist": True,
    # YouTube bot detection bypass options
    "extractor_args": "youtube:player_client=web",
    "socket_timeout": 30,
}


def _make_opts(extra: dict = {}) -> dict:
    return {**_BASE_OPTS, **extra}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_video_info(url: str) -> Dict[str, Any]:
    """
    Return full metadata + all available formats for a URL.
    Format objects include the direct CDN `url` field.
    """
    opts = _make_opts()
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return ydl.sanitize_info(info)


def get_stream_urls(url: str, preset: str) -> Dict[str, Any]:
    """
    Resolve best video + audio CDN URLs with retry logic for YouTube bot detection.
    """
    selector = FORMAT_SELECTORS.get(preset, FORMAT_SELECTORS["mp4_720p"])
    is_audio_only = preset.startswith("audio_")
    ext = _ext_for_preset(preset)

    # Try multiple player clients to bypass YouTube bot detection
    player_clients = ["web", "mweb", "android", "ios"]
    last_error = None

    for player_client in player_clients:
        try:
            opts = _make_opts(
                {
                    "format": selector,
                    "extractor_args": f"youtube:player_client={player_client}",
                }
            )

            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)

            # Process the info and return
            requested = info.get("requested_formats")

            if requested and len(requested) == 2:
                video_stream = requested[0]
                audio_stream = requested[1]
                return {
                    "video_url": video_stream.get("url"),
                    "audio_url": audio_stream.get("url"),
                    "merged": False,
                    "needs_merge": True,
                    "ext": ext,
                    "title": info.get("title", "Unknown"),
                    "thumbnail": info.get("thumbnail"),
                    "filesize_approx": (
                        (
                            video_stream.get("filesize")
                            or video_stream.get("filesize_approx")
                            or 0
                        )
                        + (
                            audio_stream.get("filesize")
                            or audio_stream.get("filesize_approx")
                            or 0
                        )
                    )
                    or None,
                }

            return {
                "video_url": info.get("url") if not is_audio_only else None,
                "audio_url": info.get("url") if is_audio_only else None,
                "merged": not is_audio_only,
                "needs_merge": False,
                "ext": ext,
                "title": info.get("title", "Unknown"),
                "thumbnail": info.get("thumbnail"),
                "filesize_approx": info.get("filesize") or info.get("filesize_approx"),
            }
        except Exception as e:
            last_error = e
            continue

    raise last_error or Exception("Failed to extract stream URLs after retries")


def get_formats_list(url: str) -> list:
    """
    Return a simplified list of available formats for UI format picker.
    """
    info = get_video_info(url)
    formats = []
    for f in info.get("formats", []):
        formats.append(
            {
                "format_id": f.get("format_id"),
                "ext": f.get("ext"),
                "resolution": f.get("resolution"),
                "fps": f.get("fps"),
                "vcodec": f.get("vcodec"),
                "acodec": f.get("acodec"),
                "filesize": f.get("filesize") or f.get("filesize_approx"),
                "width": f.get("width"),
                "height": f.get("height"),
                "tbr": f.get("tbr"),
                "format_note": f.get("format_note"),
            }
        )
    return formats


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ext_for_preset(preset: str) -> str:
    mapping = {
        "mp4_best": "mp4",
        "mp4_1080p": "mp4",
        "mp4_720p": "mp4",
        "mp4_480p": "mp4",
        "audio_mp3": "mp3",
        "audio_aac": "m4a",
        "audio_opus": "opus",
    }
    return mapping.get(preset, "mp4")
