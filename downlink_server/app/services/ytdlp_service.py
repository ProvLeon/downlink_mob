"""
Core yt-dlp service with aggressive YouTube bot bypass.
Handles player extraction failures, IP blocks, and cookie issues.

CRITICAL ENHANCEMENTS:
- Intelligent retry with exponential backoff + jitter
- Per-request header & user agent randomization
- Player extraction fallback (OAuth + signature modes)
- Cookie-less extraction support (less reliable but functional)
- IP block detection with fallback strategies
- Remote component enabling for JS challenge solving
"""

import base64
import os
import random
import shutil
import tempfile
import time
import uuid
from typing import Any, Dict, List, Optional

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

# High-fidelity User Agents
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

ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-US,en;q=0.8,fr;q=0.7",
    "en-US,en;q=0.9,de;q=0.8",
    "en;q=0.9,en-US;q=0.8",
]


class _QuietLogger:
    """Suppress verbose yt-dlp logging."""

    def debug(self, msg):
        pass

    def warning(self, msg):
        pass

    def error(self, msg):
        if "Requested format is not available" not in msg:
            print(f"yt-dlp error: {msg}")


# ---------------------------------------------------------------------------
# Cookie Management (Enhanced with Validation)
# ---------------------------------------------------------------------------
_TEMP_COOKIE_FILE = None
_COOKIE_INIT_TIME = None


def _validate_cookie_file(path: str) -> bool:
    """Check if a cookie file is likely valid YouTube cookies."""
    try:
        with open(path, "r") as f:
            content = f.read()
            # Check for Netscape format header
            if "# Netscape HTTP Cookie File" not in content:
                print(f"[BotBypass] ⚠ File not in Netscape format: {path}")
                return False
            # Check for YouTube domain
            if ".youtube.com" not in content.lower():
                print(f"[BotBypass] ⚠ No YouTube cookies found in: {path}")
                return False
            return True
    except Exception as e:
        print(f"[BotBypass] ✗ Error validating cookies: {e}")
        return False


def _get_cookie_path() -> Optional[str]:
    """Returns valid cookie path or None."""
    global _TEMP_COOKIE_FILE, _COOKIE_INIT_TIME

    # Refresh cookies every 2 hours
    if _TEMP_COOKIE_FILE and _COOKIE_INIT_TIME:
        age = time.time() - _COOKIE_INIT_TIME
        if age > 7200:
            try:
                os.remove(_TEMP_COOKIE_FILE)
                _TEMP_COOKIE_FILE = None
                _COOKIE_INIT_TIME = None
                print("[BotBypass] Refreshing expired cookies")
            except:
                pass

    # Try Base64 env var
    encoded = os.environ.get("YTDLP_COOKIES_BASE64")
    if encoded:
        try:
            if _TEMP_COOKIE_FILE is None or not os.path.exists(_TEMP_COOKIE_FILE):
                fd, path = tempfile.mkstemp(suffix=".txt", prefix="cookies_b64_")
                with os.fdopen(fd, "wb") as f:
                    decoded = base64.b64decode(encoded)
                    f.write(decoded)
                    if len(decoded) < 10 or not _validate_cookie_file(path):
                        os.remove(path)
                        raise ValueError("Invalid cookie data")
                _TEMP_COOKIE_FILE = path
                _COOKIE_INIT_TIME = time.time()
                print(f"[BotBypass] ✓ Using YTDLP_COOKIES_BASE64")
            return _TEMP_COOKIE_FILE
        except Exception as e:
            print(f"[BotBypass] ✗ YTDLP_COOKIES_BASE64 invalid: {e}")
            _TEMP_COOKIE_FILE = None

    # Try explicit path
    cookie_path = os.environ.get("YTDLP_COOKIEFILE")
    if cookie_path and os.path.exists(cookie_path):
        try:
            if os.path.getsize(cookie_path) < 50:
                raise ValueError("Cookie file too small")
            if not _validate_cookie_file(cookie_path):
                raise ValueError("Not valid YouTube cookies")
            if _TEMP_COOKIE_FILE is None or not os.path.exists(_TEMP_COOKIE_FILE):
                fd, path = tempfile.mkstemp(suffix=".txt", prefix="cookies_writable_")
                os.close(fd)
                shutil.copy2(cookie_path, path)
                _TEMP_COOKIE_FILE = path
                _COOKIE_INIT_TIME = time.time()
                print(f"[BotBypass] ✓ Using YTDLP_COOKIEFILE")
            return _TEMP_COOKIE_FILE
        except Exception as e:
            print(f"[BotBypass] ✗ YTDLP_COOKIEFILE invalid: {e}")

    # Try local file
    if os.path.exists("cookies.txt"):
        try:
            if os.path.getsize("cookies.txt") > 50 and _validate_cookie_file(
                "cookies.txt"
            ):
                print("[BotBypass] ✓ Using local cookies.txt")
                return "cookies.txt"
        except:
            pass

    print(
        "[BotBypass] ⚠ No valid YouTube cookies found - will attempt cookie-less extraction"
    )
    return None


# ---------------------------------------------------------------------------
# Configuration Generator
# ---------------------------------------------------------------------------


def _get_opts(
    player_client: str = "web",
    format_selector: str = None,
    request_id: str = None,
    enable_remote_components: bool = False,
    use_oauth: bool = False,
) -> dict:
    """Generate yt-dlp options with aggressive bot bypass."""

    ua_options = USER_AGENTS.get(player_client, USER_AGENTS["web"])
    user_agent = random.choice(ua_options)
    accept_lang = random.choice(ACCEPT_LANGUAGES)

    opts = {
        # Core settings
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "logger": _QuietLogger(),
        # Timeouts & retries (AGGRESSIVE)
        "socket_timeout": 30,
        "retries": 10,
        "fragment_retries": 10,
        # TLS
        "nocheckcertificate": True,
        "geo_bypass": True,
        "geo_bypass_country": "US",
        # Manifests
        "check_formats": False,
        "youtube_include_dash_manifest": False,
        "youtube_include_hls_manifest": False,
        "youtube_include_video_remux_manifest": False,
        "lazy_extractors": True,
        # Headers
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
        # Player extraction
        "extractor_args": {
            "youtube": {
                "player_client": [player_client],
                "player_skip": ["js", "web_money", "configs"],
            }
        },
        "user_agent": user_agent,
    }

    # CRITICAL: Enable remote components for JS challenge solving
    if enable_remote_components:
        print("[PlayerExtraction] Enabling remote components for JS challenge solving")
        opts["remote_components"] = "ejs:github"

    # OAuth mode
    if use_oauth:
        print("[PlayerExtraction] Forcing OAuth extraction mode")
        opts["extractor_args"]["youtube"]["oauth_verify"] = True

    if format_selector:
        opts["format"] = format_selector

    # Attach cookies if available
    cp = _get_cookie_path()
    if cp:
        opts["cookiefile"] = cp

    # Proxy support
    proxy = os.environ.get("YTDLP_PROXY")
    if proxy:
        opts["proxy"] = proxy
        print(f"[BotBypass] Using proxy: {proxy}")

    if request_id:
        opts["http_headers"]["X-Request-ID"] = request_id

    return opts


# ---------------------------------------------------------------------------
# Error Classification
# ---------------------------------------------------------------------------


def _should_retry(error_msg: str) -> bool:
    """Determine if error is retryable."""
    error_lower = str(error_msg).lower()

    retryable = [
        "sign in to confirm",
        "failed to extract any player response",
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
        "player response",
        "player error",
        "remote components",
        "challenge",
    ]

    fatal = [
        "not found",
        "video not available",
        "private video",
        "age-restricted",
        "channel does not exist",
    ]

    for keyword in fatal:
        if keyword in error_lower:
            return False

    for keyword in retryable:
        if keyword in error_lower:
            return True

    return True


# ---------------------------------------------------------------------------
# Main Extraction with Fallbacks
# ---------------------------------------------------------------------------


def _extract_with_retry(
    url: str,
    player_clients: List[str],
    format_selector: str = None,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """
    Extract with intelligent retry + fallback strategies.

    Attempts:
    1. Standard extraction (all player clients, retries with backoff)
    2. Remote components enabled (for JS challenge solving)
    3. OAuth mode (for auth issues)
    """
    last_error = None
    request_id = str(uuid.uuid4())[:8]

    for client in player_clients:
        retry_count = 0

        while retry_count < max_retries:
            try:
                if retry_count > 0:
                    wait_time = (2**retry_count) * 1.0 + random.uniform(0, 1)
                    print(
                        f"[Retry] Client={client}, Attempt={retry_count + 1}/{max_retries}, Wait={wait_time:.1f}s"
                    )
                    time.sleep(wait_time)

                print(
                    f"[Extract] Client={client}, Attempt={retry_count + 1}, Format={format_selector or 'all'}"
                )

                opts = _get_opts(
                    player_client=client,
                    format_selector=format_selector,
                    request_id=request_id,
                    enable_remote_components=False,
                    use_oauth=False,
                )

                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    return ydl.sanitize_info(info)

            except Exception as e:
                error_msg = str(e)
                last_error = e

                # Special handling for player extraction failures
                if "failed to extract any player response" in error_msg.lower():
                    print(f"[PlayerExtraction] Fallback: Enabling remote components")

                    try:
                        opts = _get_opts(
                            player_client=client,
                            format_selector=format_selector,
                            request_id=request_id,
                            enable_remote_components=True,
                            use_oauth=False,
                        )
                        with yt_dlp.YoutubeDL(opts) as ydl:
                            info = ydl.extract_info(url, download=False)
                            print("[PlayerExtraction] ✓ SUCCESS with remote components")
                            return ydl.sanitize_info(info)
                    except Exception as rc_error:
                        print(
                            f"[PlayerExtraction] Remote components failed: {str(rc_error)[:80]}"
                        )

                    # Try OAuth
                    try:
                        opts = _get_opts(
                            player_client=client,
                            format_selector=format_selector,
                            request_id=request_id,
                            enable_remote_components=False,
                            use_oauth=True,
                        )
                        with yt_dlp.YoutubeDL(opts) as ydl:
                            info = ydl.extract_info(url, download=False)
                            print("[PlayerExtraction] ✓ SUCCESS with OAuth mode")
                            return ydl.sanitize_info(info)
                    except Exception as oauth_error:
                        print(
                            f"[PlayerExtraction] OAuth failed: {str(oauth_error)[:80]}"
                        )

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
    """Get full video metadata."""
    player_clients = ["web", "mweb", "android", "ios"]
    return _extract_with_retry(url, player_clients)


def get_stream_urls(url: str, preset: str) -> Dict[str, Any]:
    """Get CDN stream URLs for preset."""
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
    """Get available formats."""
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
