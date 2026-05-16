#!/usr/bin/env python3
"""
Emergency test script for YouTube extraction.
Tests the current yt-dlp service against a known video.
"""

import os
import sys

# Add the project to path
sys.path.insert(0, os.path.dirname(__file__))

from app.services import ytdlp_service


def test_extraction():
    """Test basic video extraction."""
    test_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Rick Roll (should work)
        "https://www.youtube.com/watch?v=wwimSvG-S3E",  # The problematic one from logs
    ]

    for url in test_urls:
        print(f"\n{'=' * 60}")
        print(f"Testing: {url}")
        print("=" * 60)

        try:
            print("\n[1] Testing get_video_info()...")
            info = ytdlp_service.get_video_info(url)
            title = info.get("title", "Unknown")
            print(f"✓ SUCCESS: {title}")

            print("\n[2] Testing get_stream_urls() with mp4_720p...")
            result = ytdlp_service.get_stream_urls(url, "mp4_720p")
            print(f"✓ SUCCESS:")
            print(
                f"   - video_url: {result.get('video_url')[:80] if result.get('video_url') else None}..."
            )
            print(
                f"   - audio_url: {result.get('audio_url')[:80] if result.get('audio_url') else None}..."
            )
            print(f"   - needs_merge: {result.get('needs_merge')}")

        except Exception as e:
            print(f"✗ FAILED: {type(e).__name__}")
            print(f"   Error: {str(e)[:200]}")


if __name__ == "__main__":
    print("[Emergency Test] YouTube Extraction Diagnostics")
    print(
        f"[Env] YTDLP_COOKIES_BASE64: {'SET' if os.environ.get('YTDLP_COOKIES_BASE64') else 'NOT SET'}"
    )
    print(
        f"[Env] YTDLP_COOKIEFILE: {'SET' if os.environ.get('YTDLP_COOKIEFILE') else 'NOT SET'}"
    )
    print(f"[Env] YTDLP_PROXY: {'SET' if os.environ.get('YTDLP_PROXY') else 'NOT SET'}")

    test_extraction()
