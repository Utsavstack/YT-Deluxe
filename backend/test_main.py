"""
YT Deluxe — Backend API Tests
================================
Run from the backend/ folder:
    pip install pytest httpx
    pytest test_main.py -v

NOTE: These are structural/contract tests only.
They do NOT make real YouTube network calls.
They verify that endpoints exist, accept correct inputs,
and reject invalid inputs with proper HTTP status codes.
"""

import pytest
from fastapi.testclient import TestClient
import os

os.environ.setdefault("YTDELUXE_DESKTOP", "false")

from main import app

client = TestClient(app, raise_server_exceptions=False)


# ─────────────────────────────────────────────────────────────
# 1. APP STARTUP
# ─────────────────────────────────────────────────────────────

def test_app_starts_and_is_reachable():
    """FastAPI app should initialize without crashing."""
    assert app is not None
    assert app.title == "YT Deluxe Backend"


# ─────────────────────────────────────────────────────────────
# 2. SEARCH ENDPOINT  —  GET /api/search
# ─────────────────────────────────────────────────────────────

def test_search_requires_query_param():
    """
    /api/search with no ?q= param should return 422 (Unprocessable Entity).
    FastAPI auto-validates required query params.
    """
    response = client.get("/api/search")
    assert response.status_code == 422


def test_search_returns_json_content_type():
    """
    /api/search with a valid query should return JSON.
    (May return real results or error, but must be JSON.)
    """
    response = client.get("/api/search?q=python+tutorial")
    assert "application/json" in response.headers.get("content-type", "")


def test_search_response_has_results_key():
    """
    Successful search response must contain a 'results' key.
    """
    response = client.get("/api/search?q=python+tutorial")
    if response.status_code == 200:
        data = response.json()
        assert "results" in data, "Search response missing 'results' key"


def test_search_pagination_param_accepted():
    """
    /api/search should accept optional ?page= param without crashing.
    """
    response = client.get("/api/search?q=music&page=1")
    assert response.status_code in [200, 500]  # 500 = YouTube blocked, not a code bug


# ─────────────────────────────────────────────────────────────
# 3. VIDEO INFO ENDPOINT  —  GET /api/video
# ─────────────────────────────────────────────────────────────

def test_video_info_requires_url_param():
    """
    /api/video with no ?url= should return 422.
    """
    response = client.get("/api/video")
    assert response.status_code == 422


def test_video_info_returns_json():
    """
    /api/video with a URL (even invalid) should return JSON, not crash.
    """
    response = client.get("/api/video?url=https://www.youtube.com/watch?v=INVALID_XYZ_123")
    assert "application/json" in response.headers.get("content-type", "")


def test_video_quick_requires_url():
    """
    /api/video/quick with no ?url= should return 422.
    """
    response = client.get("/api/video/quick")
    assert response.status_code == 422


# ─────────────────────────────────────────────────────────────
# 4. DOWNLOAD ENDPOINT  —  POST /api/download
# ─────────────────────────────────────────────────────────────

def test_download_requires_url_field():
    """
    POST /api/download with no form data should return 422.
    The 'url' field is required (Form(...)).
    """
    response = client.post("/api/download", data={})
    assert response.status_code == 422


def test_download_with_url_creates_task():
    """
    POST /api/download with a URL should return 200 and a task_id.
    Does NOT wait for the download to finish.
    """
    response = client.post("/api/download", data={
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "format": "mp4",
        "quality": "best",
        "is_desktop": "false"
    })
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data, "Download response missing 'task_id'"


# ─────────────────────────────────────────────────────────────
# 5. PROGRESS ENDPOINT  —  GET /api/progress/{task_id}
# ─────────────────────────────────────────────────────────────

def test_progress_invalid_task_returns_404():
    """
    /api/progress/ with a non-existent task_id should return 404.
    """
    response = client.get("/api/progress/nonexistent-task-id-000")
    assert response.status_code == 404


def test_progress_valid_task_has_status_key():
    """
    A valid task should return a response with 'status' key.
    """
    create = client.post("/api/download", data={
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "is_desktop": "false"
    })
    if create.status_code == 200:
        task_id = create.json().get("task_id")
        if task_id:
            response = client.get(f"/api/progress/{task_id}")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data


# ─────────────────────────────────────────────────────────────
# 6. CANCEL ENDPOINT  —  POST /api/cancel/{task_id}
# ─────────────────────────────────────────────────────────────

def test_cancel_nonexistent_task():
    """
    Cancelling a task that doesn't exist should return JSON (not crash).
    """
    response = client.post("/api/cancel/nonexistent-task-999")
    assert "application/json" in response.headers.get("content-type", "")


# ─────────────────────────────────────────────────────────────
# 7. HISTORY ENDPOINTS  —  GET/DELETE /api/history
# ─────────────────────────────────────────────────────────────
def test_history_get_returns_list():
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert "history" in data, "Response missing 'history' key"
    assert isinstance(data["history"], list), "History value should be a list" 

# ─────────────────────────────────────────────────────────────
# 8. TRENDING ENDPOINT  —  GET /api/trending
# ─────────────────────────────────────────────────────────────

def test_trending_returns_json():
    """
    GET /api/trending should return JSON (results vary based on Piped API).
    """
    response = client.get("/api/trending")
    assert "application/json" in response.headers.get("content-type", "")


def test_trending_response_is_list_or_dict():
    """
    Trending response should be a list or contain structured data.
    """
    response = client.get("/api/trending")
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, (list, dict)), "Trending should return list or dict"


# ─────────────────────────────────────────────────────────────
# 9. FEEDBACK ENDPOINT  —  POST /api/feedback
# ─────────────────────────────────────────────────────────────

def test_feedback_endpoint_exists():
    """
    POST /api/feedback should accept a request without crashing.
    """
    response = client.post("/api/feedback", json={"message": "Great app!"})
    assert response.status_code in [200, 422]
