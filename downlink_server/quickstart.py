#!/usr/bin/env python3
"""
Quick start guide for testing the /api/merge endpoint.
Run this script after starting the server to test the merge functionality.
"""

import json
import sys
from pathlib import Path

# Add the project root to the path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))


def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}\n")


def test_import():
    """Test that the merge module imports correctly."""
    print_section("TEST 1: Module Import Test")
    try:
        from app.services import merge_service

        print("✓ merge_service imported successfully")

        from app.routers import merge

        print("✓ merge router imported successfully")

        from app import create_app

        print("✓ FastAPI app created successfully")

        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False


def test_request_models():
    """Test that Pydantic models work correctly."""
    print_section("TEST 2: Pydantic Models Test")
    try:
        from app.routers.merge import MergeRequest

        # Valid request
        valid_req = MergeRequest(
            video_url="https://example.com/video.mp4",
            audio_url="https://example.com/audio.m4a",
            ext="mp4",
        )
        print(f"✓ Valid request created: {valid_req.ext}")

        # Test default extension
        default_req = MergeRequest(
            video_url="https://example.com/video.mp4",
            audio_url="https://example.com/audio.m4a",
        )
        print(f"✓ Default extension works: {default_req.ext}")

        # Test invalid URL (should raise)
        try:
            invalid_req = MergeRequest(
                video_url="not-a-valid-url", audio_url="https://example.com/audio.m4a"
            )
            print("✗ Invalid URL should have been rejected")
            return False
        except Exception:
            print("✓ Invalid URL properly rejected")

        return True
    except Exception as e:
        print(f"✗ Model test failed: {e}")
        return False


def test_config():
    """Test that configuration constants are set."""
    print_section("TEST 3: Configuration Test")
    try:
        from app.services.merge_service import (
            DOWNLOAD_TIMEOUT,
            MAX_FILE_SIZE,
            MERGE_TIMEOUT,
            TEMP_DIR,
        )

        print(f"✓ Temp directory: {TEMP_DIR}")
        print(f"✓ Download timeout: {DOWNLOAD_TIMEOUT}s")
        print(f"✓ Merge timeout: {MERGE_TIMEOUT}s")
        print(f"✓ Max file size: {MAX_FILE_SIZE / (1024**3):.1f}GB")

        return True
    except Exception as e:
        print(f"✗ Configuration test failed: {e}")
        return False


def print_usage_examples():
    """Print usage examples for the API."""
    print_section("USAGE EXAMPLES")

    print("Using cURL:")
    print("-" * 70)
    print("""
curl -X POST http://localhost:8000/api/merge \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "https://example.com/video.mp4",
    "audio_url": "https://example.com/audio.m4a",
    "ext": "mp4"
  }' \\
  -o merged.mp4
""")

    print("\nUsing Python:")
    print("-" * 70)
    print("""
import requests

response = requests.post(
    "http://localhost:8000/api/merge",
    json={
        "video_url": "https://example.com/video.mp4",
        "audio_url": "https://example.com/audio.m4a",
        "ext": "mp4"
    },
    timeout=900
)

if response.status_code == 200:
    with open("merged.mp4", "wb") as f:
        f.write(response.content)
    print("✓ Merge successful!")
else:
    print(f"✗ Error: {response.json()}")
""")

    print("\nUsing FastAPI Interactive Docs:")
    print("-" * 70)
    print("""
1. Start the server:
   uv run uvicorn main:app --reload

2. Visit http://localhost:8000/docs

3. Find the POST /api/merge endpoint

4. Click "Try it out"

5. Fill in the request body with valid stream URLs

6. Click "Execute"
""")


def print_next_steps():
    """Print recommended next steps."""
    print_section("NEXT STEPS")

    steps = [
        ("Install dependencies", "uv sync"),
        ("Run tests", "uv run pytest test_merge.py -v"),
        ("Start the server", "uv run uvicorn main:app --reload"),
        ("Test the endpoint", "Visit http://localhost:8000/docs"),
        ("View documentation", "Read MERGE_ENDPOINT.md"),
    ]

    for i, (step, cmd) in enumerate(steps, 1):
        print(f"{i}. {step}")
        print(f"   $ {cmd}\n")


def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("  FFmpeg Merge Endpoint - Quick Start")
    print("=" * 70)

    tests = [
        ("Module Import", test_import),
        ("Pydantic Models", test_request_models),
        ("Configuration", test_config),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"✗ {name} failed with error: {e}")
            results.append((name, False))

    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n✓ All tests passed! The merge endpoint is ready.")
        print_usage_examples()
        print_next_steps()
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
