"""
Core yt-dlp service with advanced bot bypass and resilience.
All yt-dlp interactions are centralised here so routers stay clean.
The service NEVER downloads the actual media — it only extracts metadata
and direct CDN stream URLs. All heavy lifting (the actual video bytes)
travels directly from the CDN to the user's device.

CRITICAL ENHANCEMENTS:
- Intelligent retry logic with exponential backoff
- Comprehensive header spoofing (TLS fingerprinting, Accept-Language, etc.)
- Request throttling and rate limit detection
- Robust cookie management with fallback mechanisms
- Response code-aware error handling
"""

import base64
import os
import random
import shutil
import tempfile
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

import yt_dlp

# ---------------------------------------------------------------------------
# Preset → yt-dlp format selector mapping
# ---------------------------------------------------------------------------
FORMAT_SELECTORS: Dict[str, str] = {
    "mp4_best": "bv+ba/b",
    "mp4_1080p": "bv[height<=1080]+ba/b[height<=1080]",
    "mp4_720p": "bv[height<=720]+ba/b[height<=720]",
    "mp4_480p": "bv[height<=480]+ba/b[height<=480]",
    "audio_mp3": "ba[ext=mp3]/ba/b",
    "audio_aac": "ba[ext=m4a]/ba/b",
    "audio_opus": "ba[ext=opus]/ba/b",
}

# High-fidelity User Agents with platform-specific details
USER_AGENTS = {
    "android": [
        "com.google.android.youtube/19.05.36 (Linux; U; Android 14; en_US) gzip",
        "com.google.android.youtube/19.05.35 (Linux; U; Android 14; en_US) gzip",
        "com.google.android.youtube/19.04.36 (Linux; U; Android 13; en_US) gzip",
    ],
    "ios": [
        "com.google.ios.youtube/19.05.36 (iPhone16,2; U; CPU iPhone OS 17_3 like Mac OS X; en_US)",
        "com.google.ios.youtube/19.05.35 (iPhone16,1; U; CPU iPhone OS 17_2 like Mac OS X; en_US)",
        "com.google.ios.youtube/19.04.36 (iPhone15,2; U; CPU iPhone OS 16_7 like Mac OS X; en_US)",
    ],
    "web": [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    ],
    "mweb": [
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
    ],
}

# Accept-Language variants to appear more natural
ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-US,en;q=0.8,fr;q=0.7",
    "en-US,en;q=0.9,de;q=0.8",
    "en;q=0.9,en-US;q=0.8",
]


class _QuietLogger:
    """Suppress verbose yt-dlp logging unless critical."""

    def debug(self, msg):
        pass

    def warning(self, msg):
        pass

    def error(self, msg):
        if "Requested format is not available" not in msg:
            print(f"yt-dlp error: {msg}")


# ---------------------------------------------------------------------------
# Cookie Management for Bot Bypass (Enhanced)
# ---------------------------------------------------------------------------
_TEMP_COOKIE_FILE = None
_COOKIE_INIT_TIME = None


def _get_cookie_path() -> Optional[str]:
    """
    Returns the path to a valid, writable cookie file.
    Supports multiple cookie sources with fallback:
    1. Base64 encoded cookies in YTDLP_COOKIES_BASE64
    2. Explicit path in YTDLP_COOKIEFILE
    3. Local cookies.txt file
    """
    global _TEMP_COOKIE_FILE, _COOKIE_INIT_TIME

    # Refresh cookies every 2 hours to prevent staleness
    if _TEMP_COOKIE_FILE and _COOKIE_INIT_TIME:
        age = time.time() - _COOKIE_INIT_TIME
        if age > 7200:  # 2 hours
            try:
                os.remove(_TEMP_COOKIE_FILE)
                _TEMP_COOKIE_FILE = None
                _COOKIE_INIT_TIME = None
                print("[BotBypass] Refreshing expired cookies")
            except:
                pass

    # 1. Check for Base64 encoded cookies in env
    encoded_cookies = os.environ.get("YTDLP_COOKIES_BASE64")
    if encoded_cookies:
        try:
            if _TEMP_COOKIE_FILE is None or not os.path.exists(_TEMP_COOKIE_FILE):
                fd, path = tempfile.mkstemp(suffix=".txt", prefix="cookies_b64_")
                with os.fdopen(fd, "wb") as f:
                    decoded = base64.b64decode(encoded_cookies)
                    f.write(decoded)
                    # Validate that it's not empty
                    if len(decoded) < 10:
                        raise ValueError("Cookie data too small - likely invalid")
                _TEMP_COOKIE_FILE = path
                _COOKIE_INIT_TIME = time.time()
                print(
                    f"[BotBypass] ✓ Cookies hydrated from YTDLP_COOKIES_BASE64 to {_TEMP_COOKIE_FILE}"
                )
            return _TEMP_COOKIE_FILE
        except Exception as e:
            print(f"[BotBypass] ✗ Error decoding YTDLP_COOKIES_BASE64: {e}")
            _TEMP_COOKIE_FILE = None

    # 2. Check for explicit path (Render Secret File)
    cookie_file_path = os.environ.get("YTDLP_COOKIEFILE")
    if cookie_file_path and os.path.exists(cookie_file_path):
        try:
            # Check file size
            if os.path.getsize(cookie_file_path) < 10:
                raise ValueError("Cookie file too small - likely invalid")

            if _TEMP_COOKIE_FILE is None or not os.path.exists(_TEMP_COOKIE_FILE):
                fd, path = tempfile.mkstemp(suffix=".txt", prefix="cookies_writable_")
                os.close(fd)
                shutil.copy2(cookie_file_path, path)
                _TEMP_COOKIE_FILE = path
                _COOKIE_INIT_TIME = time.time()
                print(f"[BotBypass] ✓ Copied read-only cookie to: {_TEMP_COOKIE_FILE}")
            return _TEMP_COOKIE_FILE
        except Exception as e:
            print(f"[BotBypass] ✗ Error copying cookie from {cookie_file_path}: {e}")

    # 3. Check for default file
    if os.path.exists("cookies.txt"):
        try:
            if os.path.getsize("cookies.txt") > 10:
                print("[BotBypass] ✓ Using local cookies.txt")
                return "cookies.txt"
        except:
            pass

    print("[BotBypass] ⚠ No cookies found - operating in cookie-less mode")
    return None


# ---------------------------------------------------------------------------
# Configuration Generator (Aggressive Bot Bypass)
# ---------------------------------------------------------------------------


def _get_opts(
    player_client: str = "web",
    format_selector: str = None,
    request_id: str = None,
) -> dict:
    """
    Generate yt-dlp options with aggressive bot bypass.

    Strategy:
    - Rotate user agents per request
    - Include realistic headers (Accept-Language, Accept-Encoding, etc.)
    - Enable geo-bypass with minimal manifest overhead
    - Use player-specific client selection
    - Aggressive timeout and retry tuning
    """
    # Rotate user agent for this specific request
    ua_options = USER_AGENTS.get(player_client, USER_AGENTS["web"])
    user_agent = random.choice(ua_options)

    # Random Accept-Language to appear natural
    accept_lang = random.choice(ACCEPT_LANGUAGES)

    opts = {
        # Core extraction
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "logger": _QuietLogger(),
        # Aggressive timeout tuning
        "socket_timeout": 30,
        "retries": 5,
        "fragment_retries": 5,
        # TLS/HTTP client spoofing
        "nocheckcertificate": True,
        "geo_bypass": True,
        "geo_bypass_country": "US",
        # Manifest optimization
        "check_formats": False,
        "youtube_include_dash_manifest": False,
        "youtube_include_hls_manifest": False,
        "youtube_include_video_remux_manifest": False,
        "lazy_extractors": True,
        # Request headers
        "http_headers": {
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": accept_lang,
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
        },
        # Player extraction strategy
        "extractor_args": {
            "youtube": {
                "player_client": [player_client],
                "player_skip": ["js", "web_money", "configs"],
            }
        },
        "user_agent": user_agent,
    }

    if format_selector:
        opts["format"] = format_selector

    # Attach cookies if available
    cp = _get_cookie_path()
    if cp:
        opts["cookiefile"] = cp
        print(f"[BotBypass] Using cookies: {cp}")

    # Use proxy if configured
    proxy = os.environ.get("YTDLP_PROXY")
    if proxy:
        opts["proxy"] = proxy
        print(f"[BotBypass] Using proxy: {proxy}")

    # Optional: Add request ID for debugging
    if request_id:
        opts["http_headers"]["X-Request-ID"] = request_id

    return opts


# ---------------------------------------------------------------------------
# Retry Logic with Exponential Backoff
# ---------------------------------------------------------------------------


def _should_retry(error_msg: str) -> bool:
    """
    Determine if an error is retryable vs. fatal.

    Retryable:
    - "Sign in to confirm" (bot detection)
    - "Requested format is not available" (transient)
    - "429" / "Too Many Requests" (rate limit)
    - "503" / "Service Unavailable" (temporary)

    Fatal:
    - "not found" / "Video not available" (permanent)
    - "Private video" (permission)
    - "Age-restricted" (policy)
    """
    error_lower = str(error_msg).lower()

    retryable_keywords = [
        "sign in to confirm",
        "requested format is not available",
        "429",
        "too many requests",
        "503",
        "service unavailable",
        "temporarily unavailable",
        "try again later",
        "connection reset",
        "connection timeout",
        "timed out",
    ]

    fatal_keywords = [
        "not found",
        "video not available",
        "private video",
        "age-restricted",
        "no video formats found",
        "channel does not exist",
    ]

    # Check fatal first (more specific)
    for keyword in fatal_keywords:
        if keyword in error_lower:
            return False

    # Then check retryable
    for keyword in retryable_keywords:
        if keyword in error_lower:
            return True

    # Default to retryable for unknown errors
    return True


def _extract_with_retry(
    url: str,
    player_clients: List[str],
    format_selector: str = None,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """
    Extract video info with intelligent retry logic.

    Strategy:
    1. Try each player client sequentially
    2. For each client, retry with exponential backoff on retryable errors
    3. Return on first success
    4. Raise last error if all attempts fail
    """
    last_error = None
    request_id = str(uuid.uuid4())[:8]

    for client_idx, client in enumerate(player_clients):
        retry_count = 0
        backoff_multiplier = 1

        while retry_count < max_retries:
            try:
                wait_time = (2**retry_count) * backoff_multiplier + random.uniform(0, 1)
                if retry_count > 0:
                    print(
                        f"[Retry] Client={client}, Attempt={retry_count + 1}/{max_retries}, Wait={wait_time:.1f}s"
                    )
                    time.sleep(wait_time)

                opts = _get_opts(
                    player_client=client,
                    format_selector=format_selector,
                    request_id=request_id,
                )

                print(
                    f"[Extract] Client={client}, Attempt={retry_count + 1}, Format={format_selector or 'all'}"
                )

                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    return ydl.sanitize_info(info)

            except Exception as e:
                error_msg = str(e)
                last_error = e

                if not _should_retry(error_msg):
                    print(f"[Fatal] {type(e).__name__}: {error_msg[:100]}")
                    raise

                retry_count += 1
                print(f"[Retryable] {type(e).__name__}: {error_msg[:100]}")

    raise last_error or Exception("All extraction attempts failed")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_video_info(url: str) -> Dict[str, Any]:
    """
    Return full metadata + all available formats for a URL.
    Uses intelligent retry logic with multiple player clients.
    """
    player_clients = ["web", "mweb", "android", "ios"]
    return _extract_with_retry(url, player_clients)


def get_stream_urls(url: str, preset: str) -> Dict[str, Any]:
    """
    Resolve best video + audio CDN URLs with aggressive retry logic.

    Returns:
    {
        "video_url": str,
        "audio_url": str (optional),
        "merged": bool,
        "needs_merge": bool,
        "ext": str,
        "title": str,
        "thumbnail": str,
        "filesize_approx": int (optional),
    }
    """
    selector = FORMAT_SELECTORS.get(preset, FORMAT_SELECTORS["mp4_720p"])
    is_audio_only = preset.startswith("audio_")
    ext = _ext_for_preset(preset)

    player_clients = ["web", "mweb", "android", "ios"]

    try:
        info = _extract_with_retry(url, player_clients, format_selector=selector)
    except Exception as e:
        raise Exception(f"Failed to extract stream info: {str(e)}")

    requested = info.get("requested_formats")

    if requested and len(requested) == 2:
        v_stream = requested[0]
        a_stream = requested[1]
        return {
            "video_url": v_stream.get("url"),
            "audio_url": a_stream.get("url"),
            "merged": False,
            "needs_merge": True,
            "ext": ext,
            "title": info.get("title", "Unknown"),
            "thumbnail": info.get("thumbnail"),
            "filesize_approx": (
                (v_stream.get("filesize") or v_stream.get("filesize_approx") or 0)
                + (a_stream.get("filesize") or a_stream.get("filesize_approx") or 0)
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
