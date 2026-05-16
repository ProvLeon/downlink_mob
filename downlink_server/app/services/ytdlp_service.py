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


class _QuietLogger:
    def debug(self, msg):
        pass

    def warning(self, msg):
        pass

    def error(self, msg):
        # Only log errors if they are not the common "format not available" ones
        # which we expect during retries
        if "Requested format is not available" not in msg:
            print(f"yt-dlp error: {msg}")


import base64
import os
import tempfile
from typing import Any, Dict, Optional

import yt_dlp

# ---------------------------------------------------------------------------
# Cookie Management for Bot Bypass
# ---------------------------------------------------------------------------
_TEMP_COOKIE_FILE = None


def _get_cookie_path() -> Optional[str]:
    """
    Returns the path to a valid cookie file.
    Priority:
    1. YTDLP_COOKIES_BASE64 (encoded content in env)
    2. YTDLP_COOKIEFILE (path in env)
    3. cookies.txt in project root
    """
    global _TEMP_COOKIE_FILE

    # 1. Check for Base64 encoded cookies in env
    encoded_cookies = os.environ.get("YTDLP_COOKIES_BASE64")
    if encoded_cookies:
        try:
            if _TEMP_COOKIE_FILE is None:
                # Create a persistent temp file for the session
                fd, path = tempfile.mkstemp(suffix=".txt", prefix="cookies_")
                with os.fdopen(fd, "wb") as f:
                    f.write(base64.b64decode(encoded_cookies))
                _TEMP_COOKIE_FILE = path
                print(f"[BotBypass] Cookies hydrated from ENV to {_TEMP_COOKIE_FILE}")
            return _TEMP_COOKIE_FILE
        except Exception as e:
            print(f"[BotBypass] Error decoding YTDLP_COOKIES_BASE64: {e}")

    # 2. Check for explicit path
    cookie_file_path = os.environ.get("YTDLP_COOKIEFILE")
    if cookie_file_path and os.path.exists(cookie_file_path):
        return cookie_file_path

    # 3. Check for default file
    if os.path.exists("cookies.txt"):
        return "cookies.txt"

    return None


# Base options — never download, always quiet
_BASE_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "noplaylist": True,
    "logger": _QuietLogger(),
    # Advanced bot detection bypass options
    "extractor_args": {
        "youtube": {
            "player_client": ["android", "ios", "web", "mweb"],
            "player_skip": ["js"],
            "include_dash_manifest": False,
        }
    },
    "http_headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Dest": "document",
        "Referer": "https://www.google.com/",
    },
    "socket_timeout": 30,
    "nocheckcertificate": True,
    "geo_bypass": True,
}

# Apply proxy if configured
proxy = os.environ.get("YTDLP_PROXY")
if proxy:
    _BASE_OPTS["proxy"] = proxy


def _make_opts(extra: dict = {}) -> dict:
    opts = {**_BASE_OPTS, **extra}

    # Always try to inject cookies if available
    cp = _get_cookie_path()
    if cp:
        opts["cookiefile"] = cp

    return opts


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_video_info(url: str) -> Dict[str, Any]:
    """
    Return full metadata + all available formats for a URL.
    Format objects include the direct CDN `url` field.
    """
    # Try multiple times with different player clients
    # Prioritise mobile/API clients which are less likely to trigger web CAPTCHAs
    player_clients = ["android", "ios", "mweb", "web"]
    last_error = None

    for player_client in player_clients:
        try:
            opts = _make_opts(
                {
                    "extractor_args": {"youtube": {"player_client": [player_client]}},
                }
            )
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return ydl.sanitize_info(info)
        except Exception as e:
            last_error = e
            continue

    raise last_error or Exception("Failed to extract video info after retries")


def get_stream_urls(url: str, preset: str) -> Dict[str, Any]:
    """
    Resolve best video + audio CDN URLs with retry logic for YouTube bot detection.
    """
    selector = FORMAT_SELECTORS.get(preset, FORMAT_SELECTORS["mp4_720p"])
    is_audio_only = preset.startswith("audio_")
    ext = _ext_for_preset(preset)

    # Try multiple player clients to bypass YouTube bot detection.
    # Prioritise mobile/API clients which are less likely to trigger web CAPTCHAs
    player_clients = ["android", "ios", "mweb", "web"]
    last_error = None

    for player_client in player_clients:
        try:
            opts = _make_opts(
                {
                    "format": selector,
                    "extractor_args": {"youtube": {"player_client": [player_client]}},
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
