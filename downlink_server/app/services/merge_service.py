"""
FFmpeg merge service for combining video and audio streams.
Handles downloading streams, merging with ffmpeg, and cleanup.
"""

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import httpx

# Configuration
TEMP_DIR = Path(tempfile.gettempdir()) / "downlink_merge"
DOWNLOAD_TIMEOUT = 300  # 5 minutes
MERGE_TIMEOUT = 600  # 10 minutes
MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2GB


def _ensure_temp_dir() -> None:
    """Ensure temp directory exists."""
    TEMP_DIR.mkdir(parents=True, exist_ok=True)


def _cleanup_files(*file_paths: Path) -> None:
    """Safely remove temporary files."""
    for file_path in file_paths:
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            print(f"Warning: Failed to delete {file_path}: {e}")


def _download_stream(url: str, output_path: Path) -> None:
    """
    Download a stream to a temporary file.

    Args:
        url: The stream URL to download
        output_path: Where to save the downloaded file

    Raises:
        Exception: If download fails or exceeds size limit
    """
    try:
        with httpx.stream(
            "GET", url, timeout=DOWNLOAD_TIMEOUT, follow_redirects=True
        ) as response:
            response.raise_for_status()

            bytes_downloaded = 0
            with open(output_path, "wb") as f:
                for chunk in response.iter_bytes(chunk_size=65536):
                    if chunk:
                        bytes_downloaded += len(chunk)
                        if bytes_downloaded > MAX_FILE_SIZE:
                            raise ValueError(
                                f"Download exceeded maximum file size of {MAX_FILE_SIZE / (1024**3):.1f}GB"
                            )
                        f.write(chunk)
    except httpx.HTTPStatusError as e:
        raise Exception(f"HTTP error downloading stream: {e.response.status_code}")
    except httpx.TimeoutException:
        raise Exception(f"Download timeout after {DOWNLOAD_TIMEOUT}s")
    except Exception as e:
        raise Exception(f"Failed to download stream: {str(e)}")


def _merge_streams(
    video_path: Path, audio_path: Path, output_path: Path, ext: str
) -> None:
    """
    Merge video and audio streams using ffmpeg.

    Args:
        video_path: Path to video stream file
        audio_path: Path to audio stream file
        output_path: Where to save merged file
        ext: Output extension (mp4, mkv, etc.)

    Raises:
        Exception: If merge fails
    """
    # Map extensions to codec and container
    codec_map = {
        "mp4": ("libx264", "mp4"),
        "mkv": ("libx264", "matroska"),
        "webm": ("libvpx-vp9", "webm"),
        "mov": ("libx264", "mov"),
    }

    video_codec, container = codec_map.get(ext.lower(), ("copy", ext.lower()))

    # FFmpeg command: copy video and audio streams without re-encoding for speed
    cmd = [
        "ffmpeg",
        "-i",
        str(video_path),
        "-i",
        str(audio_path),
        "-c:v",
        "copy",  # Copy video stream (no re-encoding)
        "-c:a",
        "copy",  # Copy audio stream (no re-encoding)
        "-shortest",  # Use shortest stream length
        "-y",  # Overwrite output file
        str(output_path),
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=MERGE_TIMEOUT,
            check=False,
        )

        if result.returncode != 0:
            error_msg = result.stderr or "Unknown FFmpeg error"
            raise Exception(f"FFmpeg merge failed: {error_msg}")

    except subprocess.TimeoutExpired:
        raise Exception(f"Merge operation timed out after {MERGE_TIMEOUT}s")
    except Exception as e:
        raise Exception(f"Merge operation failed: {str(e)}")


def merge_streams(video_url: str, audio_url: str, ext: str = "mp4") -> bytes:
    """
    Download video and audio streams, merge them, and return the result.

    Args:
        video_url: URL to the video stream
        audio_url: URL to the audio stream
        ext: Output file extension (default: mp4)

    Returns:
        Binary content of the merged file

    Raises:
        Exception: If any step of the process fails
    """
    _ensure_temp_dir()

    # Generate unique temporary file paths
    session_id = os.urandom(8).hex()
    video_temp = TEMP_DIR / f"video_{session_id}.tmp"
    audio_temp = TEMP_DIR / f"audio_{session_id}.tmp"
    output_temp = TEMP_DIR / f"merged_{session_id}.{ext}"

    try:
        # Download streams
        print(f"Downloading video stream to {video_temp}")
        _download_stream(video_url, video_temp)

        print(f"Downloading audio stream to {audio_temp}")
        _download_stream(audio_url, audio_temp)

        # Merge streams
        print(f"Merging streams to {output_temp}")
        _merge_streams(video_temp, audio_temp, output_temp, ext)

        # Read merged file
        if not output_temp.exists():
            raise Exception("Merge operation failed: output file not created")

        with open(output_temp, "rb") as f:
            merged_content = f.read()

        print(f"Merge complete: {len(merged_content)} bytes")
        return merged_content

    finally:
        # Clean up temporary files
        _cleanup_files(video_temp, audio_temp, output_temp)


def cleanup_old_temp_files(max_age_hours: int = 24) -> None:
    """
    Clean up old temporary files (older than max_age_hours).
    Can be run periodically by a background task.

    Args:
        max_age_hours: Maximum age of files to keep (in hours)
    """
    if not TEMP_DIR.exists():
        return

    import time

    current_time = time.time()
    max_age_seconds = max_age_hours * 3600

    for file_path in TEMP_DIR.glob("*"):
        if file_path.is_file():
            file_age = current_time - file_path.stat().st_mtime
            if file_age > max_age_seconds:
                try:
                    file_path.unlink()
                    print(f"Cleaned up old temp file: {file_path}")
                except Exception as e:
                    print(f"Failed to cleanup {file_path}: {e}")
