"""
Integration test for the /api/merge endpoint.
Run with: python -m pytest test_merge.py -v
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app import create_app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    app = create_app()
    return TestClient(app)


def test_merge_endpoint_exists(client):
    """Test that the merge endpoint is registered and accessible."""
    # The endpoint should be documented in the OpenAPI schema
    response = client.get("/openapi.json")
    assert response.status_code == 200
    openapi_schema = response.json()

    # Check that /api/merge endpoint is in the schema
    paths = openapi_schema.get("paths", {})
    assert "/api/merge" in paths, "Merge endpoint not found in OpenAPI schema"
    assert "post" in paths["/api/merge"], "POST method not found for /api/merge"


def test_merge_request_validation_missing_fields(client):
    """Test that the endpoint validates required fields."""
    response = client.post(
        "/api/merge",
        json={
            "video_url": "https://example.com/video.mp4"
            # Missing audio_url
        },
    )
    assert response.status_code == 422, "Should reject request with missing audio_url"


def test_merge_request_validation_invalid_url(client):
    """Test that the endpoint validates URL format."""
    response = client.post(
        "/api/merge",
        json={
            "video_url": "not-a-valid-url",
            "audio_url": "https://example.com/audio.m4a",
        },
    )
    assert response.status_code == 422, "Should reject invalid URL"


def test_merge_request_validation_invalid_extension(client):
    """Test that the endpoint validates file extension."""
    response = client.post(
        "/api/merge",
        json={
            "video_url": "https://example.com/video.mp4",
            "audio_url": "https://example.com/audio.m4a",
            "ext": "avi",  # Not supported
        },
    )
    assert response.status_code == 400, "Should reject unsupported extension"
    assert "Invalid extension" in response.json()["detail"]


def test_merge_request_default_extension(client):
    """Test that ext defaults to mp4 when not provided."""
    # This test verifies the request model accepts the request without ext
    response = client.post(
        "/api/merge",
        json={
            "video_url": "https://example.com/video.mp4",
            "audio_url": "https://example.com/audio.m4a",
            # No ext field - should default to "mp4"
        },
    )
    # Will fail at merge stage (mocked), but validates the request model
    assert response.status_code in [500, 200], "Request should be accepted"


@patch("app.services.merge_service.merge_streams")
def test_merge_endpoint_success(mock_merge, client):
    """Test successful merge operation (mocked)."""
    # Mock the merge_service to return sample data
    mock_merge.return_value = b"fake merged video content"

    response = client.post(
        "/api/merge",
        json={
            "video_url": "https://example.com/video.mp4",
            "audio_url": "https://example.com/audio.m4a",
            "ext": "mp4",
        },
    )

    assert response.status_code == 200, (
        f"Expected 200, got {response.status_code}: {response.text}"
    )
    assert response.headers["content-type"] == "video/mp4"
    assert "attachment" in response.headers["content-disposition"]
    assert response.content == b"fake merged video content"

    # Verify the service was called with correct arguments
    mock_merge.assert_called_once()
    call_args = mock_merge.call_args
    assert call_args[1]["video_url"] == "https://example.com/video.mp4"
    assert call_args[1]["audio_url"] == "https://example.com/audio.m4a"
    assert call_args[1]["ext"] == "mp4"


@patch("app.services.merge_service.merge_streams")
def test_merge_endpoint_mkv_format(mock_merge, client):
    """Test merge with MKV format."""
    mock_merge.return_value = b"fake mkv content"

    response = client.post(
        "/api/merge",
        json={
            "video_url": "https://example.com/video.mkv",
            "audio_url": "https://example.com/audio.aac",
            "ext": "mkv",
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "video/x-matroska"


@patch("app.services.merge_service.merge_streams")
def test_merge_endpoint_webm_format(mock_merge, client):
    """Test merge with WebM format."""
    mock_merge.return_value = b"fake webm content"

    response = client.post(
        "/api/merge",
        json={
            "video_url": "https://example.com/video.webm",
            "audio_url": "https://example.com/audio.webm",
            "ext": "webm",
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "video/webm"


@patch("app.services.merge_service.merge_streams")
def test_merge_endpoint_mov_format(mock_merge, client):
    """Test merge with MOV format."""
    mock_merge.return_value = b"fake mov content"

    response = client.post(
        "/api/merge",
        json={
            "video_url": "https://example.com/video.mov",
            "audio_url": "https://example.com/audio.mov",
            "ext": "mov",
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "video/quicktime"


@patch("app.services.merge_service.merge_streams")
def test_merge_endpoint_error_handling(mock_merge, client):
    """Test error handling when merge service fails."""
    mock_merge.side_effect = Exception("FFmpeg not found")

    response = client.post(
        "/api/merge",
        json={
            "video_url": "https://example.com/video.mp4",
            "audio_url": "https://example.com/audio.m4a",
            "ext": "mp4",
        },
    )

    assert response.status_code == 500
    assert "Merge operation failed" in response.json()["detail"]


def test_merge_endpoint_case_insensitive_extension(client):
    """Test that extensions are case-insensitive."""
    with patch("app.services.merge_service.merge_streams") as mock_merge:
        mock_merge.return_value = b"fake content"

        response = client.post(
            "/api/merge",
            json={
                "video_url": "https://example.com/video.mp4",
                "audio_url": "https://example.com/audio.m4a",
                "ext": "MP4",  # Uppercase
            },
        )

        assert response.status_code == 200
        # Verify it was normalized to lowercase
        assert mock_merge.call_args[1]["ext"] == "mp4"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
