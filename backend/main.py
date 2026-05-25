from fastapi import FastAPI, Request, BackgroundTasks, Form, HTTPException

from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uuid
import os
import subprocess
import sys
from yt_dlp import YoutubeDL
from datetime import datetime
import json
import requests
import threading
import time
import shutil
import logging
import logging.handlers

# ── Backend Logging Setup ──────────────────────────────────────────────────────
# Logs to %APPDATA%\YT Deluxe\logs\backend.log (same dir as launcher.log)
# Rotating: 5 MB × 3 backups. Both files can be shared together for debugging.
def _setup_backend_logging():
    log_dir = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "YT Deluxe", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "backend.log")

    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S")

    root = logging.getLogger()
    root.setLevel(logging.INFO)

    fh = logging.handlers.RotatingFileHandler(
        log_file, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    fh.setFormatter(fmt)
    root.addHandler(fh)

    # Redirect uvicorn loggers to the same file
    for uvicorn_logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_log = logging.getLogger(uvicorn_logger_name)
        uvicorn_log.handlers = []
        uvicorn_log.addHandler(fh)
        uvicorn_log.propagate = False

    return logging.getLogger("backend"), log_file

logger, BACKEND_LOG_PATH = _setup_backend_logging()
logger.info("=" * 60)
logger.info("YT Deluxe Backend starting")
logger.info(f"Log file: {BACKEND_LOG_PATH}")
logger.info(f"Python: {sys.version}")
# ──────────────────────────────────────────────────────────────────────────────

# ── GLOBAL SUBPROCESS FIX FOR WINDOWS GUI (.exe) ──────────────────────────
# Prevent child processes (like ffmpeg spawned by yt-dlp) from flashing terminal windows
if os.name == 'nt':
    original_popen = subprocess.Popen
    def patched_popen(*args, **kwargs):
        # Override creationflags to suppress cmd windows
        if 'creationflags' not in kwargs:
            kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
        # Force UTF-8 encoding to prevent UnicodeDecodeError (cp1252) on Windows
        # when yt-dlp output contains Hindi/special characters in video titles
        if kwargs.get('encoding') is None and kwargs.get('text') is None:
            kwargs.setdefault('encoding', 'utf-8')
            kwargs.setdefault('errors', 'replace')
        return original_popen(*args, **kwargs)
    subprocess.Popen = patched_popen
# ────────────────────────────────────────────────────────────────────────

def get_ffmpeg_path():
    """
    Returns correct ffmpeg binary path.
    - In PyInstaller onefile: ffmpeg.exe is in the same folder as main.exe
    - In dev mode: looks for ffmpeg.exe in the same folder as main.py, else calls 'ffmpeg' via PATH
    """
    if getattr(sys, 'frozen', False):
        return os.path.join(os.path.dirname(sys.executable), 'ffmpeg.exe')
    
    local_ffmpeg = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ffmpeg.exe')
    if os.path.isfile(local_ffmpeg):
        return local_ffmpeg
        
    return 'ffmpeg'

def format_time_hhmmss(seconds: float) -> str:
    """Format seconds as HH:MM:SS.mmm for yt-dlp --download-sections and ffmpeg"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

def get_downloads_folder():
    if os.name == 'nt':
        import winreg
        try:
            sub_key = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders"
            downloads_guid = "{374DE290-123F-4565-9164-39C4925E467B}"
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, sub_key) as key:
                location = winreg.QueryValueEx(key, downloads_guid)[0]
            return location
        except Exception:
            pass
    from pathlib import Path
    return os.path.join(str(Path.home()), "Downloads")

def get_desktop_registry_settings():
    """
    Reads installer-written preferences from the Windows registry.
    Returns a dict with 'download_path' and 'auto_organize' (bool).
    Fallback: system Downloads folder, no folder organization.
    """
    result = {'download_path': get_downloads_folder(), 'auto_organize': False}
    if os.name != 'nt':
        return result
    try:
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Software\YTDeluxe\Settings') as key:
            try:
                path_val = winreg.QueryValueEx(key, 'DownloadPath')[0]
                if path_val and os.path.isdir(path_val):
                    result['download_path'] = path_val
            except Exception:
                pass
            try:
                org_val = winreg.QueryValueEx(key, 'AutoOrganize')[0]
                result['auto_organize'] = str(org_val).strip() == '1'
            except Exception:
                pass
    except Exception:
        pass
    return result

bgutil_process = None

app = FastAPI(title="YT Deluxe Backend")

@app.on_event("startup")
def startup_event():
  global bgutil_process
  # Try Rust binary first (Docker/Render), then fall back to Node.js (local dev)
  rust_path = '/usr/local/bin/bgutil-pot'
  node_path = os.path.join(os.path.dirname(__file__), 'bgutil-ytdlp-pot-provider', 'server', 'build', 'main.js')
  
  if os.path.exists(rust_path):
    try:
      print("Starting PO Token Generator Server (Rust) on port 4416...")
      bgutil_process = subprocess.Popen(
        [rust_path, "server", "--host", "127.0.0.1", "--port", "4416"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
      )
    except Exception as e:
      print(f"Failed to start Rust bgutil token server: {e}")
  elif os.path.exists(node_path):
    try:
      print("Starting PO Token Generator Server (Node.js) on port 4416...")
      bgutil_process = subprocess.Popen(["node", node_path, "-p", "4416"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
      print(f"Failed to start Node.js bgutil token server: {e}")
  else:
    print("WARNING: No PO Token Generator found. YouTube may block requests.")

@app.on_event("shutdown")
def shutdown_event():
  global bgutil_process
  if bgutil_process:
    print("Shutting down PO Token Generator Server...")
    bgutil_process.terminate()
    bgutil_process.wait()


def get_cookie_opts():
  import base64
  # Priority 1: Base64-encoded cookies from Render environment variable
  env_cookie_b64 = os.environ.get('YOUTUBE_COOKIES_BASE64')
  # Use a separate folder that is NOT targeted by the 10-minute cleanup task
  env_cookie_dir = 'secrets_runtime'
  env_cookie_path = os.path.join(env_cookie_dir, 'youtube_cookies.txt')
  
  if env_cookie_b64:
    try:
      os.makedirs(env_cookie_dir, exist_ok=True)
      with open(env_cookie_path, 'w', encoding='utf-8') as f:
        f.write(base64.b64decode(env_cookie_b64).decode('utf-8'))
      print(f"[cookies] Persisted Base64 cookies to {env_cookie_path}")
      return {'cookiefile': env_cookie_path}
    except Exception as e:
      print(f"[cookies] Failed to decode environment cookies: {e}")
  
  # Priority 1b: If the file already exists (e.g., copied manually for local testing)
  if os.path.exists(env_cookie_path) and os.path.getsize(env_cookie_path) >= 200:
    print(f"[cookies] Using existing secrets_runtime cookies ({os.path.getsize(env_cookie_path)} bytes)")
    return {'cookiefile': env_cookie_path}

  # Priority 2: cookies.txt in backend directory
  cookie_path = os.path.join(os.path.dirname(__file__), 'cookies.txt')
  if os.path.exists(cookie_path) and os.path.getsize(cookie_path) >= 200:
    print(f"[cookies] Using local cookies.txt ({os.path.getsize(cookie_path)} bytes)")
    return {'cookiefile': cookie_path}
  
  # Priority 3: cookies.txt in temp directory (user-exported)
  temp_cookie_path = os.path.join(os.path.dirname(__file__), '..', 'temp', 'cookies.txt')
  if os.path.exists(temp_cookie_path) and os.path.getsize(temp_cookie_path) >= 200:
    print(f"[cookies] Using temp/cookies.txt ({os.path.getsize(temp_cookie_path)} bytes)")
    return {'cookiefile': temp_cookie_path}
  
  print("[cookies] No cookies available. YouTube may block requests on cloud!")
  return {}

def get_yt_opts():
  return {
    'ffmpeg_location': get_ffmpeg_path(),
    'js_runtimes': {'node': {}},
    'extractor_args': {
      'youtube': {
        'player_client': ['mweb', 'default'],
      }
    },
    'http_headers': {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    'nocheckcertificate': True,
    'no_warnings': True,
    'quiet': True,
  }

def get_yt_search_opts():
  return {
    'ffmpeg_location': get_ffmpeg_path(),
    'js_runtimes': {'node': {}},
    'extractor_args': {
      'youtube': {
        'player_client': ['web_creator', 'default'],
      }
    },
    'http_headers': {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    'nocheckcertificate': True,
    'quiet': True,
  }

# Determine a writable temp directory for web-mode downloads
# In frozen (installed) mode, CWD may be C:\Program Files which is read-only
# So we use the system TEMP folder instead
if getattr(sys, 'frozen', False):
  TEMPFILES_DIR = os.path.join(os.environ.get('TEMP', os.path.expanduser('~')), 'yt-deluxe-tempfiles')
else:
  TEMPFILES_DIR = "tempfiles"

os.makedirs(TEMPFILES_DIR, exist_ok=True)

# Also make active_tasks.json writable
if getattr(sys, 'frozen', False):
  TASKS_FILE = os.path.join(os.environ.get('TEMP', os.path.expanduser('~')), 'yt-deluxe-active-tasks.json')
else:
  TASKS_FILE = "active_tasks.json"

# Set by desktop/launcher.py when running as Windows app
DESKTOP_MODE = os.environ.get("YTDELUXE_DESKTOP", "false").lower() == "true"

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"] if not DESKTOP_MODE else ["http://127.0.0.1", "http://localhost", "null", "file://"],
  allow_origin_regex=".*" if DESKTOP_MODE else None,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


def _load_tasks():
    try:
        if os.path.exists(TASKS_FILE):
            with open(TASKS_FILE, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def _save_tasks():
    try:
        with open(TASKS_FILE, 'w') as f:
            json.dump(download_tasks, f)
    except Exception:
        pass

download_tasks = _load_tasks()
download_history = []
feedback_list = []

# ── In-memory search cache (query → {results, expires_at}) ────────────────
import threading as _threading
_search_cache: dict = {}
_search_cache_lock = _threading.Lock()
SEARCH_CACHE_TTL = 30 * 60  # 30 minutes
SEARCH_PAGE_SIZE = 18
SEARCH_CACHE_FETCH = 180  # fetch 180, serve 18 per page (10 pages max)

# ── Cancellation infrastructure ───────────────────────────────────────────────
# Thread-safe set of task_ids that should be aborted.
# The progress_hook checks this on every callback and raises to abort yt-dlp.
cancelled_tasks: set = set()
cancelled_tasks_lock = threading.Lock()

class DownloadCancelled(Exception):
    """Raised inside progress_hook to abort yt-dlp when user cancels."""
    pass

# ── Helper: normalize a single yt-dlp entry to our video dict ──────────────
def _normalize_entry(entry: dict) -> dict:
  raw_uploader = entry.get('uploader') or entry.get('channel') or entry.get('uploader_id') or 'Unknown Channel'
  uploader_name = raw_uploader.lstrip('@') if raw_uploader else 'Unknown Channel'
  vid_id = entry.get('id', '')
  return {
    'id': vid_id,
    'title': entry.get('title'),
    'url': f"https://www.youtube.com/watch?v={vid_id}",
    'thumbnail': entry.get('thumbnail') or (f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg" if vid_id else None),
    'duration': entry.get('duration'),
    'uploader': uploader_name,
    'views': entry.get('view_count'),
  }

# ── Piped API configuration ──────────────────────────────────────────────────
PIPED_API_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.leptons.xyz",
  "https://pipedapi.adminforge.de",
  "https://api.piped.projectsegfau.lt",
]
PIPED_API_BASE = PIPED_API_INSTANCES[0]  # Primary instance
PIPED_TIMEOUT = 10  # seconds (for search/trending which can be slow)
PIPED_TIMEOUT_FAST = 4  # seconds (for quick metadata — fail fast)

def _piped_get(path: str, timeout: int = None):
  """Try each Piped instance in order until one succeeds. Returns response JSON or None."""
  _timeout = timeout or PIPED_TIMEOUT
  for base in PIPED_API_INSTANCES:
    try:
      url = f"{base}{path}"
      resp = requests.get(url, timeout=_timeout)
      resp.raise_for_status()
      return resp.json()
    except Exception as e:
      print(f"[Piped] {base}{path} failed: {type(e).__name__}: {str(e)[:80]}")
      continue
  return None

# ── Helper: normalize a single Piped API entry to our video dict ─────────────
def _convert_piped_avatar(piped_url: str) -> str:
  """Convert Piped proxy avatar URL to direct YouTube URL.
  Piped format: https://proxy.piped.xxx/{path}?host=yt3.ggpht.com
  YouTube format: https://yt3.ggpht.com/{path}
  """
  if not piped_url:
    return None
  try:
    from urllib.parse import urlparse, parse_qs
    parsed = urlparse(piped_url)
    host_param = parse_qs(parsed.query).get('host', [None])[0]
    if host_param:
      # Extract the path (remove leading /) and reconstruct with original host
      path = parsed.path
      return f"https://{host_param}{path}"
  except Exception:
    pass
  # If conversion fails, return the original Piped URL as fallback
  return piped_url

def _normalize_piped_entry(item: dict) -> dict:
  vid_id = (item.get('url') or '').split('?v=')[-1] if '?v=' in (item.get('url') or '') else ''
  raw_uploader = item.get('uploaderName') or 'Unknown Channel'
  uploader_name = raw_uploader.lstrip('@') if raw_uploader else 'Unknown Channel'
  thumb = f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg" if vid_id else item.get('thumbnail')
  dur = item.get('duration')
  avatar = _convert_piped_avatar(item.get('uploaderAvatar'))
  return {
    'id': vid_id,
    'title': item.get('title'),
    'url': f"https://www.youtube.com/watch?v={vid_id}" if vid_id else '',
    'thumbnail': thumb,
    'duration': dur if dur is not None and dur > 0 else None,
    'uploader': uploader_name,
    'views': item.get('views'),
    'uploadedDate': item.get('uploadedDate'),   # "5 months ago" or null
    'uploaded': item.get('uploaded'),            # ms timestamp or -1
    'channel': {
      'name': uploader_name,
      'avatar': avatar,                          # Direct YouTube avatar URL
      'verified': item.get('uploaderVerified', False),
      'url': item.get('uploaderUrl', ''),
    },
    'isShort': item.get('isShort', False),
  }

def _fetch_piped_trending(region: str = "IN"):
  """Fetch trending videos from Piped API (multi-instance). Returns list of normalized dicts or None."""
  try:
    print(f"[Piped] Fetching trending for region={region}")
    items = _piped_get(f"/trending?region={region}")
    if items is None or not isinstance(items, list):
      print("[Piped] Trending: no valid response from any instance")
      return None
    videos = [_normalize_piped_entry(e) for e in items if e and e.get('url') and '/shorts/' not in (e.get('url') or '')]
    print(f"[Piped] Trending returned {len(videos)} videos")
    return videos
  except Exception as e:
    print(f"[Piped] Trending fetch failed: {e}")
    return None

def _fetch_piped_search(query: str, filter_type: str = "videos"):
  """Fetch search results from Piped API (multi-instance). Returns (items, nextpage) or (None, None)."""
  try:
    import urllib.parse
    path = f"/search?q={urllib.parse.quote(query)}&filter={filter_type}"
    print(f"[Piped] Searching: {query}")
    data = _piped_get(path)
    if data is None:
      print("[Piped] Search: no valid response from any instance")
      return None, None
    items_raw = data.get('items') or []
    nextpage = data.get('nextpage')
    videos = [_normalize_piped_entry(e) for e in items_raw if e and e.get('url') and '/shorts/' not in (e.get('url') or '')]
    print(f"[Piped] Search returned {len(videos)} videos, nextpage={'yes' if nextpage else 'no'}")
    return videos, nextpage
  except Exception as e:
    print(f"[Piped] Search failed: {e}")
    return None, None

def _fetch_piped_search_nextpage(query: str, nextpage: str, filter_type: str = "videos"):
  """Fetch next page of Piped search using cursor (multi-instance). Returns (items, nextpage) or (None, None)."""
  try:
    import urllib.parse
    path = f"/nextpage/search?q={urllib.parse.quote(query)}&filter={filter_type}&nextpage={urllib.parse.quote(nextpage)}"
    print(f"[Piped] Fetching nextpage search for: {query}")
    data = _piped_get(path)
    if data is None:
      print("[Piped] Nextpage search: no valid response from any instance")
      return None, None
    items_raw = data.get('items') or []
    new_nextpage = data.get('nextpage')
    videos = [_normalize_piped_entry(e) for e in items_raw if e and e.get('url') and '/shorts/' not in (e.get('url') or '')]
    print(f"[Piped] Nextpage search returned {len(videos)} videos, nextpage={'yes' if new_nextpage else 'no'}")
    return videos, new_nextpage
  except Exception as e:
    print(f"[Piped] Nextpage search failed: {e}")
    return None, None

# Endpoint: Search YouTube (by keyword) — Piped API first, yt-dlp fallback
@app.get("/api/search")
async def search_videos(q: str, page: int = 1, nextpage: str = None):
  import asyncio as _asyncio
  try:
    page = max(1, page)
    cache_key = q.strip().lower()
    now = time.time()

    # ── Piped API path (cursor-based pagination) ──────────────────────────────
    # If nextpage cursor is provided, use Piped's nextpage endpoint directly
    if nextpage:
      print(f"[Search] Piped nextpage fetch for '{q}'")
      piped_results, new_nextpage = _fetch_piped_search_nextpage(q, nextpage)
      if piped_results is not None and len(piped_results) > 0:
        return {
          "results": piped_results,
          "page": page,
          "total_pages": page + (1 if new_nextpage else 0),
          "total_results": len(piped_results),
          "page_size": len(piped_results),
          "nextpage": new_nextpage,
        }
      # If nextpage fetch failed, fall through to yt-dlp

    # ── First page: try Piped API first ──────────────────────────────────────
    if page == 1:
      # Check cache first
      with _search_cache_lock:
        cached = _search_cache.get(cache_key)
        if cached and cached['expires_at'] > now and cached.get('piped_results'):
          print(f"[Search] Piped cache HIT for '{q}'")
          return {
            "results": cached['piped_results'],
            "page": 1,
            "total_pages": 2 if cached.get('piped_nextpage') else 1,
            "total_results": len(cached['piped_results']),
            "page_size": len(cached['piped_results']),
            "nextpage": cached.get('piped_nextpage'),
          }

      # Fresh Piped fetch
      piped_results, piped_nextpage = _fetch_piped_search(q)
      if piped_results is not None and len(piped_results) > 0:
        # Cache the Piped results
        with _search_cache_lock:
          _search_cache[cache_key] = {
            'piped_results': piped_results,
            'piped_nextpage': piped_nextpage,
            'expires_at': now + SEARCH_CACHE_TTL,
          }
        return {
          "results": piped_results,
          "page": 1,
          "total_pages": 2 if piped_nextpage else 1,
          "total_results": len(piped_results),
          "page_size": len(piped_results),
          "nextpage": piped_nextpage,
        }
      print(f"[Search] Piped failed for '{q}', falling back to yt-dlp...")

    # ── yt-dlp fallback (existing logic) ─────────────────────────────────────
    # Check yt-dlp cache
    with _search_cache_lock:
      cached = _search_cache.get(cache_key)
      min_acceptable = SEARCH_CACHE_FETCH // 3
      if cached and cached['expires_at'] > now and cached.get('results') and len(cached['results']) >= min_acceptable:
        all_results = cached['results']
        print(f"[Search] yt-dlp Cache HIT for '{q}' ({len(all_results)} results cached)")
      elif cached and cached['expires_at'] > now and cached.get('results') and len(cached['results']) >= SEARCH_QUICK_FETCH:
        all_results = cached['results']
        print(f"[Search] Partial cache HIT for '{q}' ({len(all_results)} results, full fill in progress)")
      else:
        all_results = None

    # Cache miss: quick first fetch then background fill
    if all_results is None:
      print(f"[Search] yt-dlp Cache MISS for '{q}' — quick fetch ({SEARCH_QUICK_FETCH} results) via executor...")

      def _do_quick_fetch():
        ydl_opts_quick = {
          **get_yt_search_opts(),
          'extract_flat': True,
          'skip_download': True,
          'ignoreerrors': True,
          **get_cookie_opts()
        }
        with YoutubeDL(ydl_opts_quick) as ydl:
          res = ydl.extract_info(f"ytsearch{SEARCH_QUICK_FETCH}:{q}", download=False)
        return [_normalize_entry(e) for e in (res.get('entries') or []) if e and e.get('id')]

      loop = _asyncio.get_event_loop()
      all_results = await loop.run_in_executor(None, _do_quick_fetch)

      with _search_cache_lock:
        existing = _search_cache.get(cache_key, {})
        existing.update({
          'results': all_results,
          'expires_at': now + SEARCH_CACHE_TTL,
          'extension_count': 0,
          'filling': True,
        })
        _search_cache[cache_key] = existing
      print(f"[Search] Quick cache: {len(all_results)} results for '{q}'. Starting background fill...")

      # Background thread: fetch full SEARCH_CACHE_FETCH and replace cache
      def _background_fill_search(query, ck, expiry):
        try:
          print(f"[Search] BG fill starting for '{query}' ({SEARCH_CACHE_FETCH} results)...")
          ydl_opts_full = {
            **get_yt_search_opts(),
            'extract_flat': True,
            'skip_download': True,
            'ignoreerrors': True,
            **get_cookie_opts()
          }
          with YoutubeDL(ydl_opts_full) as ydl:
            full_result = ydl.extract_info(f"ytsearch{SEARCH_CACHE_FETCH}:{query}", download=False)
          full_results = [
            _normalize_entry(e)
            for e in (full_result.get('entries') or [])
            if e and e.get('id')
          ]
          if full_results:
            with _search_cache_lock:
              existing = _search_cache.get(ck)
              if existing:
                existing_ids = {v['id'] for v in full_results}
                quick_only = [v for v in existing.get('results', []) if v['id'] not in existing_ids]
                merged = full_results + quick_only
                existing.update({
                  'results': merged,
                  'expires_at': expiry,
                  'extension_count': 0,
                  'filling': False,
                })
                _search_cache[ck] = existing
            print(f"[Search] BG fill done for '{query}': {len(full_results)} results cached")
        except Exception as bg_err:
          print(f"[Search] BG fill error for '{query}': {bg_err}")
          with _search_cache_lock:
            entry = _search_cache.get(ck)
            if entry:
              entry['filling'] = False

      import threading as _search_bg_thread
      _search_bg_thread.Thread(
        target=_background_fill_search,
        args=(q, cache_key, now + SEARCH_CACHE_TTL),
        daemon=True
      ).start()

    # Auto-extend when cache is running low
    total = len(all_results)
    start_pos = (page - 1) * SEARCH_PAGE_SIZE
    remaining = total - start_pos

    EXTEND_THRESHOLD = SEARCH_PAGE_SIZE * 2

    if remaining <= EXTEND_THRESHOLD:
      with _search_cache_lock:
        ext_count = _search_cache.get(cache_key, {}).get('extension_count', 0)

      print(f"[Search] Cache running low for '{q}': {remaining} left — extension #{ext_count + 1}")
      try:
        seeds = [
          "latest", "new", "top", "popular", "best", "viral", "trending",
          "hot", "hits", "fresh", "must watch", "2024", "2025", "2026",
          "today", "this week", "right now", "epic", "amazing",
        ]
        seed = seeds[ext_count % len(seeds)]
        extended_query = f"{q} {seed}"
        print(f"[Search] Extension query: '{extended_query}'")

        ydl_opts_ext = {
          **get_yt_search_opts(),
          'extract_flat': True,
          'skip_download': True,
          'ignoreerrors': True,
          **get_cookie_opts()
        }
        with YoutubeDL(ydl_opts_ext) as ydl:
          ext_result = ydl.extract_info(f"ytsearch{SEARCH_CACHE_FETCH}:{extended_query}", download=False)

        new_videos = [
          _normalize_entry(e)
          for e in (ext_result.get('entries') or [])
          if e and e.get('id')
        ]

        existing_ids = {v['id'] for v in all_results}
        unique_new = [v for v in new_videos if v['id'] not in existing_ids]
        print(f"[Search] Extension: {len(new_videos)} fetched, {len(unique_new)} unique after dedup")

        if unique_new:
          all_results = all_results + unique_new
          with _search_cache_lock:
            existing = _search_cache.get(cache_key, {})
            existing.update({
              'results': all_results,
              'expires_at': now + SEARCH_CACHE_TTL,
              'extension_count': ext_count + 1,
            })
            _search_cache[cache_key] = existing
          total = len(all_results)
          print(f"[Search] Cache extended to {total} results for '{q}'")

      except Exception as ext_err:
        print(f"[Search] Extension fetch failed: {ext_err}")

    # Paginate from all_results
    total_pages = max(1, (total + SEARCH_PAGE_SIZE - 1) // SEARCH_PAGE_SIZE)
    page = min(page, total_pages)
    start = (page - 1) * SEARCH_PAGE_SIZE
    end = start + SEARCH_PAGE_SIZE
    page_results = all_results[start:end]

    return {
      "results": page_results,
      "page": page,
      "total_pages": total_pages,
      "total_results": total,
      "page_size": SEARCH_PAGE_SIZE,
      "nextpage": None,  # yt-dlp fallback doesn't use Piped cursors
    }
  except Exception as e:
    print(f"[Search] Error: {e}")
    return JSONResponse({"error": str(e)}, status_code=500)


# ── In-memory trending cache (category_id → {results, expires_at}) ────────
import threading as _trending_threading
_trending_cache: dict = {}
_trending_cache_lock = _trending_threading.Lock()
TRENDING_CACHE_TTL = 30 * 60   # 30 minutes
TRENDING_FETCH_SIZE = 120       # Full background fill size
TRENDING_QUICK_FETCH = 21       # Quick first batch (multiple of 3, serves first page instantly)
TRENDING_PAGE_SIZE = 18
SEARCH_QUICK_FETCH = 21         # Quick first batch for search (serves page 1 instantly)

# Endpoint: Trending videos — Piped API first, yt-dlp fallback, cursor-based infinite scroll
@app.get("/api/trending")
def get_trending(category_id: str = "0", region: str = "IN", cursor: int = 0, limit: int = TRENDING_PAGE_SIZE, refresh: bool = False):
  """
  Returns `limit` trending videos starting from `cursor` index.
  Uses Piped API for "All" category (id=0) and Piped search for specific categories.
  Falls back to yt-dlp if Piped fails.
  Pass refresh=true to force-clear the cache and fetch genuinely new data.
  Returns next_cursor=-1 when no more items are available.
  """
  cache_key = f"{category_id}_{region}"
  now = time.time()

  # --- Force-clear cache if refresh=true is requested ---
  if refresh:
    with _trending_cache_lock:
      if cache_key in _trending_cache:
        del _trending_cache[cache_key]
        print(f"[Trending] Cache CLEARED for '{cache_key}' (force refresh requested)")

  # --- Check cache ---
  with _trending_cache_lock:
    cached = _trending_cache.get(cache_key)
    if cached and cached['expires_at'] > now:
      all_videos = cached['results']
      print(f"[Trending] Cache HIT for '{cache_key}' ({len(all_videos)} cached)")
    else:
      all_videos = None

  # --- Fetch if cache miss or cursor=0 (force fresh on category switch) ---
  if all_videos is None or cursor == 0:
    videos = []

    # ── Try Piped API first ──────────────────────────────────────────────────
    # Use Piped search for ALL categories (including "All") to guarantee
    # uploadedDate and proper durations. The /trending endpoint returns
    # mostly shorts/live with no timestamps.
    piped_category_search_map = {
      "0":  "trending viral today India",
      "10": "trending music India",
      "20": "trending gaming India",
      "25": "trending news today India",
      "17": "trending sports highlights India",
      "1":  "trending movies trailers India",
    }

    cat_query = piped_category_search_map.get(str(category_id), "trending viral today India")
    piped_videos, _ = _fetch_piped_search(cat_query)
    if piped_videos and len(piped_videos) >= 5:
      videos = piped_videos
      print(f"[Trending] Piped search returned {len(videos)} videos for category '{category_id}'")

    # ── yt-dlp fallback if Piped didn't return enough results ────────────────
    if len(videos) < 5:
      print(f"[Trending] Piped insufficient ({len(videos)}) — falling back to yt-dlp")

      if category_id and category_id != "0":
        trending_url = f"https://www.youtube.com/feed/trending?bp=4gI{category_id}"
      else:
        trending_url = "https://www.youtube.com/feed/trending"

      def _fetch_feed():
        ydl_opts = {
          **get_yt_search_opts(),
          'extract_flat': True,
          'skip_download': True,
          'ignoreerrors': True,
          'extractor_args': {'youtube': {'player_client': ['web', 'default']}},
          **get_cookie_opts()
        }
        with YoutubeDL(ydl_opts) as ydl:
          info = ydl.extract_info(trending_url, download=False)
        if not info:
          return []
        entries = info.get('entries') or []
        return [_normalize_entry(e) for e in entries if e and e.get('id')]

      try:
        print(f"[Trending] Fetching real feed: {trending_url}")
        ydl_videos = _fetch_feed()
        print(f"[Trending] Real feed returned {len(ydl_videos)} videos")
        if len(ydl_videos) >= 5:
          videos = ydl_videos
      except Exception as e:
        print(f"[Trending] Real feed failed: {e} — using keyword fallback")

      if len(videos) < 5:
        print(f"[Trending] Insufficient results ({len(videos)}) — quick keyword fetch ({TRENDING_QUICK_FETCH})")
        try:

          cat_keyword_map = {
            "0":  "trending viral today India",
            "10": "trending music songs India",
            "20": "trending gaming India",
            "25": "trending news today",
            "17": "trending sports highlights",
            "1":  "trending movies trailers",
          }
          base_keyword = cat_keyword_map.get(str(category_id), "trending viral today")
          quick_keyword = f"{base_keyword} popular"
          qdl_opts = {
            **get_yt_search_opts(),
            'extract_flat': True,
            'skip_download': True,
            'ignoreerrors': True,
            **get_cookie_opts()
          }
          with YoutubeDL(qdl_opts) as ydl:
            quick_res = ydl.extract_info(f"ytsearch{TRENDING_QUICK_FETCH}:{quick_keyword}", download=False)
          videos = [_normalize_entry(e) for e in (quick_res.get('entries') or []) if e and e.get('id')]
          print(f"[Trending] Quick fetch got {len(videos)} videos")
        except Exception as fe:
          print(f"[Trending] Quick fetch failed: {fe}")
          return JSONResponse({"error": "Failed to fetch trending videos"}, status_code=500)

    # Store results immediately
    all_videos = videos
    with _trending_cache_lock:
      _trending_cache[cache_key] = {
        'results': all_videos,
        'expires_at': now + TRENDING_CACHE_TTL,
        'filling': True,
      }
    print(f"[Trending] Quick cache: {len(all_videos)} results for '{cache_key}'. Starting BG fill...")

    # Background thread: fill up to TRENDING_FETCH_SIZE
    def _background_fill_trending(ck, cat_id, reg, expiry):
      try:
        # Try Piped search for background fill too
        bg_piped_map = {
          "0":  "trending viral today India",
          "10": "trending music songs India",
          "20": "trending gaming India",
          "25": "trending news today India",
          "17": "trending sports highlights India",
          "1":  "trending movies trailers India",
        }
        bg_query = bg_piped_map.get(str(cat_id), "trending viral today India")

        # Try multiple pages of Piped search for more results
        piped_all = []
        piped_results, np = _fetch_piped_search(bg_query)
        if piped_results:
          piped_all.extend(piped_results)
          # Fetch 2 more pages if available
          for _ in range(2):
            if not np:
              break
            more_results, np = _fetch_piped_search_nextpage(bg_query, np)
            if more_results:
              piped_all.extend(more_results)

        if len(piped_all) >= 20:
          print(f"[Trending] BG Piped fill got {len(piped_all)} results")
          new_videos = piped_all
        else:
          # Fallback to yt-dlp keyword search
          import math as _math
          cat_keyword_map = {
            "0":  "trending viral today India",
            "10": "trending music songs India",
            "20": "trending gaming India",
            "25": "trending news today",
            "17": "trending sports highlights",
            "1":  "trending movies trailers",
          }
          base_keyword = cat_keyword_map.get(str(cat_id), "trending viral today")
          hour_slot = _math.floor(time.time() / 3600)
          seeds = ["latest", "viral", "new", "top", "popular", "best", "hot", "hits",
                   "fresh", "must watch", "2024", "2025", "2026", "today", "this week"]
          seed = seeds[hour_slot % len(seeds)]
          keyword = f"{base_keyword} {seed}"
          print(f"[Trending] BG yt-dlp fill with keyword: '{keyword}'")
          ydl_opts_bg = {
            **get_yt_search_opts(),
            'extract_flat': True,
            'skip_download': True,
            'ignoreerrors': True,
            **get_cookie_opts()
          }
          with YoutubeDL(ydl_opts_bg) as ydl:
            result = ydl.extract_info(f"ytsearch{TRENDING_FETCH_SIZE}:{keyword}", download=False)
          new_videos = [_normalize_entry(e) for e in (result.get('entries') or []) if e and e.get('id')]

        if new_videos:
          with _trending_cache_lock:
            existing = _trending_cache.get(ck)
            if existing:
              existing_ids = {v['id'] for v in new_videos}
              quick_only = [v for v in existing.get('results', []) if v['id'] not in existing_ids]
              merged = new_videos + quick_only
              _trending_cache[ck] = {
                'results': merged,
                'expires_at': expiry,
                'filling': False,
              }
          print(f"[Trending] BG fill done for '{ck}': {len(new_videos)} results cached")
      except Exception as bg_err:
        print(f"[Trending] BG fill error for '{ck}': {bg_err}")
        with _trending_cache_lock:
          entry = _trending_cache.get(ck)
          if entry:
            entry['filling'] = False

    _trending_threading.Thread(
      target=_background_fill_trending,
      args=(cache_key, category_id, region, now + TRENDING_CACHE_TTL),
      daemon=True
    ).start()

  # --- Slice with cursor — auto-extend cache when exhausted ---
  GRID_COLS = 3  # Must match frontend grid columns
  total = len(all_videos)
  start = cursor
  remaining = total - start

  # Trigger extension BEFORE we run out — when remaining is less than a full page
  if remaining <= limit:
    with _trending_cache_lock:
      cached_info = _trending_cache.get(cache_key, {})
      ext_count = cached_info.get('extension_count', 0)
      # Retrieve stored Piped nextpage cursor for deep pagination
      stored_nextpage = cached_info.get('piped_nextpage_cursor')

    print(f"[Trending] Cache running low: remaining={remaining}, limit={limit}. Fetching more (ext #{ext_count})...")
    try:

      new_videos = []

      # ── Strategy 1: Use stored Piped nextpage cursor for truly new results ──
      if stored_nextpage:
        piped_category_query_map = {
          "0":  "trending viral today India",
          "10": "trending music India",
          "20": "trending gaming India",
          "25": "trending news today India",
          "17": "trending sports highlights India",
          "1":  "trending movies trailers India",
        }
        base_query = piped_category_query_map.get(str(category_id), "trending viral today India")
        page_results, next_np = _fetch_piped_search_nextpage(base_query, stored_nextpage)
        if page_results:
          new_videos = page_results
          stored_nextpage = next_np
          print(f"[Trending] Piped nextpage extension returned {len(new_videos)} videos")

      # ── Strategy 2: Fresh Piped search with varied keywords (multiple pages) ──
      if len(new_videos) < 5:
        ext_piped_map = {
          "0":  "trending viral popular India",
          "10": "trending music hits India",
          "20": "trending gaming videos India",
          "25": "trending news breaking India",
          "17": "trending sports India",
          "1":  "trending movies India",
        }
        seeds = ["latest", "viral", "new", "top", "popular", "best", "hot", "hits", "fresh", "must watch",
                 "2026", "today", "this week", "right now", "live", "epic", "amazing", "super", "mega"]
        seed = seeds[ext_count % len(seeds)]
        ext_query = f"{ext_piped_map.get(str(category_id), 'trending viral today India')} {seed}"

        piped_ext, next_np = _fetch_piped_search(ext_query)
        if piped_ext and len(piped_ext) >= 5:
          new_videos = piped_ext
          stored_nextpage = next_np
          print(f"[Trending] Piped keyword extension returned {len(new_videos)} videos")

          # Fetch 1-2 more nextpages to get a bigger pool of unique results
          for _ in range(2):
            if not stored_nextpage:
              break
            more, stored_nextpage = _fetch_piped_search_nextpage(ext_query, stored_nextpage)
            if more:
              new_videos.extend(more)
              print(f"[Trending] Piped extra nextpage: +{len(more)} videos")

      # ── Strategy 3: yt-dlp keyword fallback ──
      if len(new_videos) < 5:
        cat_keyword_map = {
          "0":  "trending viral today India",
          "10": "trending music songs India",
          "20": "trending gaming India",
          "25": "trending news today",
          "17": "trending sports highlights",
          "1":  "trending movies trailers",
        }
        seed = seeds[ext_count % len(seeds)]
        base_keyword = cat_keyword_map.get(str(category_id), "trending viral today")
        keyword = f"{base_keyword} {seed}"
        print(f"[Trending] Extension yt-dlp fetch with keyword: '{keyword}'")

        ydl_opts = {
          **get_yt_search_opts(),
          'extract_flat': True,
          'skip_download': True,
          'ignoreerrors': True,
          **get_cookie_opts()
        }
        with YoutubeDL(ydl_opts) as ydl:
          result = ydl.extract_info(f"ytsearch{TRENDING_FETCH_SIZE}:{keyword}", download=False)
        new_videos = [_normalize_entry(e) for e in (result.get('entries') or []) if e and e.get('id')]

      # ── Strict dedup: only add genuinely unique videos ──
      existing_ids = set(v.get('id') for v in all_videos)
      unique_new = [v for v in new_videos if v.get('id') and v.get('id') not in existing_ids]
      # Track IDs within the new batch too
      seen = set()
      deduped = []
      for v in unique_new:
        if v['id'] not in seen:
          seen.add(v['id'])
          deduped.append(v)
      unique_new = deduped

      print(f"[Trending] Got {len(new_videos)} videos, {len(unique_new)} unique after strict dedup")

      with _trending_cache_lock:
        cached_info = _trending_cache.get(cache_key, {})
        if unique_new:
          all_videos = all_videos + unique_new
          cached_info['results'] = all_videos
        cached_info['extension_count'] = ext_count + 1
        cached_info['piped_nextpage_cursor'] = stored_nextpage
        cached_info['expires_at'] = now + TRENDING_CACHE_TTL
        _trending_cache[cache_key] = cached_info

      total = len(all_videos)
      print(f"[Trending] Cache extended to {total} videos ({len(unique_new)} new)")
    except Exception as ext_err:
      print(f"[Trending] Extension fetch failed: {ext_err}")

  # Slice the page
  end = min(start + limit, total)
  page_videos = all_videos[start:end] if start < total else []

  # Trim to multiple of GRID_COLS so we never serve partial rows
  # ONLY trim if we have at least one full row to serve, otherwise we might trim to 0 and cause a dead end.
  if len(page_videos) >= GRID_COLS and len(page_videos) % GRID_COLS != 0:
    trim_count = len(page_videos) % GRID_COLS
    if trim_count > 0:
      page_videos = page_videos[:-trim_count]
      end = start + len(page_videos)

  # Only return -1 if we have absolutely nothing left AND couldn't find more
  next_cursor = end if end < total else (total if len(page_videos) > 0 else -1)

  return {
    "results": page_videos,
    "cursor": cursor,
    "next_cursor": next_cursor,
    "total": total,
    "category_id": category_id,
    "region": region,
  }

# ── Endpoint: YouTube Search Suggestions (real-time autocomplete) ──────────
# Uses Google's public YouTube suggestion API — same as ytdlnis / YouTube app
#
# WHY `requests` instead of `urllib`:
#   In a PyInstaller --windowed (no-console) .exe, `urllib.request.urlopen()`
#   fails silently on HTTPS. The packaged exe cannot locate Windows CA
#   certificates via the standard ssl module path, throwing SSLCertVerificationError.
#   Since sys.stderr is None in windowed mode, the exception is swallowed and
#   the endpoint returns []. `requests` is already a top-level import AND
#   PyInstaller's built-in `requests` hook auto-bundles `certifi` (its own CA
#   store), so HTTPS works correctly in the .exe without any extra config.
@app.get("/api/suggestions")
async def get_search_suggestions(q: str, lang: str = "en"):
  """
  Returns real-time YouTube keyword suggestions for the given query.
  Uses Firefox client UA for clean JSON (no JSONP wrapper).
  Response: { "suggestions": ["suggestion1", "suggestion2", ...] }

  NOTE: verify=False is required because PyInstaller --windowed .exe cannot
  locate SSL CA certificates from the packaged temp path. `requests` + certifi
  normally handles this, but --onefile extraction breaks the cert path lookup.
  Since this only hits Google's public suggestion API, disabling verification
  is safe and is the only reliable fix for the desktop build.
  """
  if not q or not q.strip():
    return {"suggestions": []}
  try:
    import urllib.parse
    import json as _json
    import re as _re
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    query_encoded = urllib.parse.quote(q.strip())

    # Primary: 'firefox' client → clean JSON response: ["query", ["sug1", ...]]
    url = (
      f"https://suggestqueries.google.com/complete/search"
      f"?client=firefox&ds=yt&q={query_encoded}&hl={lang}"
    )
    headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
      "Accept": "application/json",
      "Accept-Language": f"{lang},en;q=0.9",
    }
    resp = requests.get(url, headers=headers, timeout=5, verify=False)
    data = resp.json()

    if isinstance(data, list) and len(data) > 1 and isinstance(data[1], list):
      suggestions = [s for s in data[1] if isinstance(s, str)]
      try:
        print(f"[Suggestions] '{q}' → {len(suggestions)} results")
      except Exception:
        pass  # sys.stdout is None in windowed .exe
      return {"suggestions": suggestions[:10]}

    # Fallback: 'youtube' client → JSONP, strip wrapper
    url2 = (
      f"https://suggestqueries.google.com/complete/search"
      f"?client=youtube&ds=yt&q={query_encoded}&hl={lang}"
    )
    h2 = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": f"{lang},en;q=0.9",
    }
    resp2 = requests.get(url2, headers=h2, timeout=5, verify=False)
    match = _re.search(r'\((\[.*\])\)\s*$', resp2.text, _re.DOTALL)
    if match:
      data2 = _json.loads(match.group(1))
      raw_items = data2[1] if len(data2) > 1 else []
      suggestions = [item[0] for item in raw_items if isinstance(item, list) and item]
      try:
        print(f"[Suggestions JSONP fallback] '{q}' → {len(suggestions)} results")
      except Exception:
        pass
      return {"suggestions": suggestions[:10]}

    return {"suggestions": []}
  except Exception as e:
    try:
      print(f"[Suggestions] Error for '{q}': {e}")
    except Exception:
      pass  # sys.stdout is None in windowed .exe
    return {"suggestions": []}

# ── Quick metadata helpers ─────────────────────────────────────────────────────
def _scrape_youtube_page(video_id: str) -> dict:
  """Scrape YouTube watch page for metadata. ~2-3s. Returns dict or None."""
  import re as _re
  try:
    url = f"https://www.youtube.com/watch?v={video_id}"
    headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
    resp = requests.get(url, headers=headers, timeout=5)
    html = resp.text

    result = {}

    # Extract ytInitialPlayerResponse
    match = _re.search(r'var ytInitialPlayerResponse\s*=\s*({.+?});\s*(?:var|</script>)', html)
    if match:
      import json as _json
      player = _json.loads(match.group(1))
      vd = player.get('videoDetails', {})
      micro = player.get('microformat', {}).get('playerMicroformatRenderer', {})

      result['title'] = vd.get('title')
      result['views'] = int(vd.get('viewCount', 0) or 0)
      result['duration'] = int(vd.get('lengthSeconds', 0) or 0)
      result['uploaderName'] = vd.get('author', '')
      result['channelId'] = vd.get('channelId', '')
      result['description'] = vd.get('shortDescription', '')
      result['uploadDate'] = micro.get('uploadDate') or micro.get('publishDate')
      result['category'] = micro.get('category')
      result['uploaderVerified'] = False  # Not available from page scrape
      # Construct avatar URL from channel ID (reliable pattern)
      # Will be enriched from yt-dlp in Phase 2

    # Try to get avatar from ytInitialData
    match2 = _re.search(r'var ytInitialData\s*=\s*({.+?});\s*(?:var|</script>)', html)
    if match2:
      try:
        import json as _json
        init_data = _json.loads(match2.group(1))
        # Navigate to video owner renderer for avatar
        contents = init_data.get('contents', {}).get('twoColumnWatchNextResults', {}).get('results', {}).get('results', {}).get('contents', [])
        for content in contents:
          owner = content.get('videoSecondaryInfoRenderer', {}).get('owner', {}).get('videoOwnerRenderer', {})
          if owner:
            thumbs = owner.get('thumbnail', {}).get('thumbnails', [])
            if thumbs:
              result['uploaderAvatar'] = thumbs[-1].get('url', '')
            sub_text = owner.get('subscriberCountText', {}).get('simpleText', '')
            if sub_text:
              result['uploaderSubscriberCount'] = sub_text
            break
      except Exception:
        pass

    return result if result else None
  except Exception as e:
    print(f"[YT Scrape] Error for {video_id}: {e}")
    return None


def _get_ryd_data(video_id: str) -> dict:
  """Get likes/dislikes from Return YouTube Dislike API. ~1-2s."""
  try:
    resp = requests.get(
      f"https://returnyoutubedislikeapi.com/votes?videoId={video_id}",
      timeout=4
    )
    resp.raise_for_status()
    data = resp.json()
    return {
      'likes': data.get('likes', 0),
      'dislikes': data.get('dislikes', 0),
      'viewCount': data.get('viewCount', 0),
    }
  except Exception as e:
    print(f"[RYD API] Error for {video_id}: {e}")
    return None


# Endpoint: Quick video metadata — multi-source parallel (fastest wins)
@app.get("/api/video/quick")
async def get_video_quick(id: str):
  """Fast metadata from multiple sources running IN PARALLEL.
  All sources start simultaneously; we merge results as they arrive.
  Piped (if working): ~1-2s | YT scrape: ~2-3s | RYD: ~1-2s
  Returns within 2-3s regardless of Piped status."""
  import asyncio as _asyncio
  try:
    loop = _asyncio.get_event_loop()

    # Only try 1-2 fastest Piped instances (not all 5) with very short timeout
    def _piped_quick(vid_id):
      """Try only the most reliable Piped instances with 2s timeout."""
      fast_instances = PIPED_API_INSTANCES[:2]  # Only first 2
      for base in fast_instances:
        try:
          url = f"{base}/streams/{vid_id}"
          resp = requests.get(url, timeout=2)
          resp.raise_for_status()
          data = resp.json()
          if data and data.get('title'):
            return data
        except Exception as e:
          print(f"[Piped Quick] {base} failed: {type(e).__name__}: {str(e)[:60]}")
          continue
      return None

    # Launch ALL three sources in parallel
    piped_future = loop.run_in_executor(None, lambda: _piped_quick(id))
    scrape_future = loop.run_in_executor(None, lambda: _scrape_youtube_page(id))
    ryd_future = loop.run_in_executor(None, lambda: _get_ryd_data(id))

    # Wait for all to complete (they run in parallel, so total time ≈ slowest one ≈ 3s)
    piped_data, scrape_data, ryd_data = await _asyncio.gather(
      piped_future, scrape_future, ryd_future,
      return_exceptions=True
    )

    # Handle exceptions from gather
    if isinstance(piped_data, Exception):
      print(f"[Video Quick] Piped exception: {piped_data}")
      piped_data = None
    if isinstance(scrape_data, Exception):
      print(f"[Video Quick] Scrape exception: {scrape_data}")
      scrape_data = None
    if isinstance(ryd_data, Exception):
      print(f"[Video Quick] RYD exception: {ryd_data}")
      ryd_data = None

    # ── Priority 1: Use Piped data if available (most complete) ──
    if piped_data and isinstance(piped_data, dict) and piped_data.get('title'):
      print(f"[Video Quick] Piped succeeded for {id}")
      meta = {
        "description": piped_data.get('description'),
        "likes": piped_data.get('likes'),
        "dislikes": piped_data.get('dislikes'),
        "views": piped_data.get('views'),
        "uploadDate": piped_data.get('uploadDate'),
        "uploaderAvatar": _convert_piped_avatar(piped_data.get('uploaderAvatar')),
        "uploaderName": (piped_data.get('uploader') or piped_data.get('uploaderName') or '').lstrip('@'),
        "uploaderVerified": piped_data.get('uploaderVerified', False),
        "uploaderSubscriberCount": piped_data.get('uploaderSubscriberCount'),
        "duration": piped_data.get('duration'),
        "category": piped_data.get('category'),
        "title": piped_data.get('title'),
        "thumbnailUrl": piped_data.get('thumbnailUrl'),
        "source": "piped",
      }
      # Enrich with RYD likes if Piped didn't have them
      if ryd_data and isinstance(ryd_data, dict) and not meta.get('likes'):
        meta['likes'] = ryd_data.get('likes', 0)
        meta['dislikes'] = ryd_data.get('dislikes', 0)
      return {"metadata": meta}

    # ── Priority 2: Use YT scrape + RYD data ──
    if scrape_data and isinstance(scrape_data, dict):
      print(f"[Video Quick] Using YT scrape + RYD for {id}")
      meta = {
        'title': scrape_data.get('title'),
        'description': scrape_data.get('description'),
        'views': scrape_data.get('views', 0),
        'uploadDate': scrape_data.get('uploadDate'),
        'uploaderName': scrape_data.get('uploaderName', ''),
        'uploaderAvatar': scrape_data.get('uploaderAvatar'),
        'uploaderVerified': scrape_data.get('uploaderVerified', False),
        'uploaderSubscriberCount': scrape_data.get('uploaderSubscriberCount'),
        'duration': scrape_data.get('duration', 0),
        'category': scrape_data.get('category'),
      }
      if ryd_data and isinstance(ryd_data, dict):
        meta['likes'] = ryd_data.get('likes', 0)
        meta['dislikes'] = ryd_data.get('dislikes', 0)
        if not meta.get('views'):
          meta['views'] = ryd_data.get('viewCount', 0)
      meta['source'] = 'scrape+ryd'
      return {"metadata": meta}

    # ── Priority 3: RYD only (very limited but better than nothing) ──
    if ryd_data and isinstance(ryd_data, dict):
      print(f"[Video Quick] Only RYD data available for {id}")
      return {"metadata": {
        "likes": ryd_data.get('likes', 0),
        "dislikes": ryd_data.get('dislikes', 0),
        "views": ryd_data.get('viewCount', 0),
        "source": "ryd_only",
      }}

    print(f"[Video Quick] All sources failed for {id}")
    return {"metadata": None}

  except Exception as e:
    print(f"[Video Quick] Error: {e}")
    return {"metadata": None}

# Endpoint: Get video details (by URL) — full format extraction via yt-dlp
@app.get("/api/video")
async def get_video_details(url: str):
  import asyncio as _asyncio
  try:
    def _do_extract():
      return _extract_video_formats(url)
    loop = _asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _do_extract)
    return result
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)

def _extract_video_formats(url: str):
  try:
    ydl_opts = {
      **get_yt_opts(),
      'skip_download': True,
      'extract_flat': False,
      'ignoreerrors': True,
      **get_cookie_opts()
    }
    with YoutubeDL(ydl_opts) as ydl:
      info = ydl.extract_info(url, download=False)
      
    if not info:
      return JSONResponse({"error": "Failed to extract video info. The video may require sign-in, be unavailable, or the format is unsupported by the current client."}, status_code=400)
      
    # ── Helper functions (Changes A+B) ──────────────────────────────────────
    def _audio_quality_label(idx):
      return ['High Quality', 'Medium Quality', 'Low Quality'][idx] if idx < 3 else 'Audio'

    def _codec_display_name(acodec_str):
      c = (acodec_str or '').lower()
      if 'opus' in c: return 'Opus'
      if any(x in c for x in ('mp4a', 'aac')): return 'AAC'
      return acodec_str.upper()[:6] if acodec_str else 'Audio'

    def _real_ext(af):
      c = (af.get('acodec') or '').lower()
      if any(x in c for x in ('mp4a', 'aac')): return 'm4a'
      return af.get('ext', 'webm')  # opus usually comes as webm container

    def _codec_family(vcodec_str):
      c = (vcodec_str or '').lower()
      if 'avc' in c or 'h264' in c: return 'avc1'
      if 'vp9' in c: return 'vp9'
      if 'av01' in c or 'av1' in c: return 'av01'
      return 'other'

    # Build deduplicated, quality-grouped format list
    # Collect all unique heights from real video formats
    seen_heights = {}
    audio_formats = []
    all_video_formats_raw = []  # for all_formats response

    for f in info.get('formats', []):
      height = f.get('height')
      vcodec = f.get('vcodec', 'none')
      acodec = f.get('acodec', 'none')
      ext = f.get('ext', '')

      # Change A: Collect ALL valid audio-only formats (append, not replace)
      if vcodec == 'none' and acodec != 'none':
        abr = f.get('abr') or 0
        if ext in ('mhtml', 'vtt') or abr == 0:
          continue
        audio_formats.append(f)
        continue

      # Only include real video formats with a height
      if not height or vcodec == 'none':
        continue

      # Collect every distinct video stream for all_formats
      all_video_formats_raw.append(f)

      # Keep only the best format per height (prefer highest bitrate/filesize)
      existing = seen_heights.get(height)
      if existing is None:
        seen_heights[height] = f
      else:
        # Compare by total bitrate (tbr) or approximate filesize
        curr_size = f.get('tbr') or f.get('filesize') or f.get('filesize_approx') or 0
        prev_size = existing.get('tbr') or existing.get('filesize') or existing.get('filesize_approx') or 0
        # If sizes are roughly equal, slightly prefer mp4 container
        if curr_size > prev_size * 1.05 or (curr_size >= prev_size * 0.95 and f.get('ext') == 'mp4' and existing.get('ext') != 'mp4'):
          seen_heights[height] = f

    # Change B: Deduplicate audio — keep best per codec family, max 3 options
    audio_formats.sort(key=lambda x: x.get('abr') or 0, reverse=True)
    seen_audio_families = {}
    deduped_audio = []
    for af in audio_formats:
      acodec_raw = af.get('acodec', '').lower()
      if 'opus' in acodec_raw:
        family = 'opus'
      elif any(x in acodec_raw for x in ('mp4a', 'aac')):
        family = 'm4a'
      else:
        family = 'other'
      if family not in seen_audio_families:
        seen_audio_families[family] = True
        deduped_audio.append(af)
      if len(deduped_audio) >= 3:
        break
    audio_formats = deduped_audio

    # Sort heights descending (8K to 144p)
    sorted_heights = sorted(seen_heights.keys(), reverse=True)

    # Build quality label map
    height_labels = {
      4320: '8K', 2160: '4K', 1440: '2K',
      1080: '1080p', 720: '720p', 480: '480p',
      360: '360p', 240: '240p', 144: '144p',
    }

    # Recommended formats (1 best per height) — for default UI view
    formats = []
    for h in sorted_heights:
      f = seen_heights[h]
      label = height_labels.get(h) or f'{h}p'
      formats.append({
        'format_id': f.get('format_id'),
        'quality': label,
        'height': h,
        'ext': f.get('ext', 'mp4'),
        'resolution': f'{f.get("width", "?")}x{h}',
        'filesize': f.get('filesize') or f.get('filesize_approx'),
        'vcodec': f.get('vcodec', 'none'),
        'acodec': f.get('acodec', 'none'),
        'fps': f.get('fps'),
        'tbr': f.get('tbr'),
        'codec_family': _codec_family(f.get('vcodec', '')),
        'type': 'video',
      })

    # Change B: Add ALL audio options (up to 3, deduplicated by codec family)
    for i, af in enumerate(audio_formats):
      real_ext = _real_ext(af)
      formats.append({
        'format_id': af.get('format_id'),
        'quality': _audio_quality_label(i),
        'quality_index': i,           # 0=best, 1=medium, 2=low
        'height': 0,
        'ext': real_ext,              # actual extension, NOT 'mp3'
        'native_ext': real_ext,       # preserved separately for frontend
        'resolution': 'audio',
        'filesize': af.get('filesize') or af.get('filesize_approx'),
        'vcodec': 'none',
        'acodec': af.get('acodec', 'none'),
        'codec_display': _codec_display_name(af.get('acodec')),
        'abr': af.get('abr'),
        'tbr': af.get('tbr'),
        'type': 'audio',
      })

    # Change B: Build all_formats — every distinct stream for Advanced View
    # Sort all video streams: height desc, then tbr desc
    all_video_formats_raw.sort(
      key=lambda x: (x.get('height') or 0, x.get('tbr') or 0), reverse=True
    )
    all_formats = []
    for f in all_video_formats_raw:
      h = f.get('height') or 0
      label = height_labels.get(h) or f'{h}p'
      fps = f.get('fps')
      fps_label = f'{label}{fps}' if fps and fps > 30 else label
      all_formats.append({
        'format_id': f.get('format_id'),
        'quality': fps_label,
        'height': h,
        'ext': f.get('ext', 'mp4'),
        'resolution': f'{f.get("width", "?")}x{h}',
        'filesize': f.get('filesize') or f.get('filesize_approx'),
        'vcodec': f.get('vcodec', 'none'),
        'acodec': f.get('acodec', 'none'),
        'fps': f.get('fps'),
        'tbr': f.get('tbr'),
        'vbr': f.get('vbr'),
        'codec_family': _codec_family(f.get('vcodec', '')),
        'type': 'video',
      })
    # Add all audio formats to all_formats too
    for af in audio_formats:
      real_ext = _real_ext(af)
      all_formats.append({
        'format_id': af.get('format_id'),
        'quality': _audio_quality_label(audio_formats.index(af)),
        'quality_index': audio_formats.index(af),
        'height': 0,
        'ext': real_ext,
        'native_ext': real_ext,
        'resolution': 'audio',
        'filesize': af.get('filesize') or af.get('filesize_approx'),
        'vcodec': 'none',
        'acodec': af.get('acodec', 'none'),
        'codec_display': _codec_display_name(af.get('acodec')),
        'abr': af.get('abr'),
        'tbr': af.get('tbr'),
        'asr': af.get('asr'),
        'type': 'audio',
      })

    # Extract channel info securely and strip @ handle prefix
    raw_channel = info.get('channel') or info.get('uploader') or info.get('uploader_id') or 'Unknown Channel'
    channel_name = raw_channel.lstrip('@') if raw_channel else 'Unknown Channel'

    # NOTE: Piped enrichment moved to /api/video/quick (Phase 2) for faster page load.
    # Frontend now calls /api/video/quick in parallel for metadata (avatar, likes, etc.)
    # and /api/video for format extraction only.
    vid_id = info.get('id', '')

    video = {
      'id': vid_id,
      'title': info.get('title'),
      'thumbnail': info.get('thumbnail'),
      'duration': info.get('duration'),
      'uploader': channel_name,
      'channel': channel_name,
      'channel_avatar': None,  # Piped enrichment now handled by /api/video/quick
      'channel_follower_count': info.get('channel_follower_count'),
      'channel_verified': False,
      'description': info.get('description'),
      'view_count': info.get('view_count'),
      'like_count': info.get('like_count'),
      'comment_count': info.get('comment_count'),
      'upload_date': info.get('upload_date'),
      'formats': formats,
      'all_formats': all_formats,
      'max_quality': height_labels.get(sorted_heights[0], f'{sorted_heights[0]}p') if sorted_heights else 'Unknown',
    }
    return {"video": video}
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)

# Endpoint: Stream video (with quality selection)
@app.get("/api/stream")
def stream_video(request: Request, url: str, quality: Optional[str] = None, download: bool = False):
  try:
    # Map quality to yt-dlp format string
    quality_map = {
      '1080p': 'best[height<=1080]',
      '720p': 'best[height<=720]',
      '480p': 'best[height<=480]',
      '360p': 'best[height<=360]',
      '144p': 'best[height<=144]',
      'audio': 'bestaudio/best',
    }
    
    # Default to best quality if not specified or invalid
    format_string = quality_map.get(quality, 'best')
    
    ydl_opts = {
      **get_yt_opts(),
      'skip_download': True,
      'format': format_string,
      'ignoreerrors': True,
      **get_cookie_opts()
    }
    
    with YoutubeDL(ydl_opts) as ydl:
      info = ydl.extract_info(url, download=False)
      
      # Get the best format that matches our criteria
      formats = info.get('formats', [])
      best_format = None
      
      for f in formats:
        if quality == 'audio':
          # Look for audio-only formats
          if f.get('acodec') != 'none' and f.get('vcodec') == 'none':
            if best_format is None or f.get('abr', 0) > best_format.get('abr', 0):
              best_format = f
        else:
          # Look for video+audio formats
          if f.get('vcodec') != 'none' and f.get('acodec') != 'none':
            if best_format is None or f.get('height', 0) > best_format.get('height', 0):
              best_format = f
      
      if best_format and best_format.get('url'):
        video_url = best_format['url']
        
        # Get the headers from yt-dlp to bypass 403
        headers = best_format.get('http_headers', {})
        if not headers:
          headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Referer': 'https://www.youtube.com/'
          }
        
        # Pass down range header for seeking support
        range_header = request.headers.get('Range')
        if range_header:
          headers['Range'] = range_header
        
        # Stream the video content
        response = requests.get(video_url, stream=True, headers=headers)
        
        # Status code may be 206 Partial Content
        status_code = response.status_code
        
        response.raise_for_status()
        
        disposition_type = "attachment" if download else "inline"
        
        # Create filename, stripping non-ascii if necessary/helpful
        filename = info.get("title", "audio" if quality == "audio" else "video")
        safe_filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_')).rstrip()
        ext = "mp3" if quality == "audio" else "mp4"
        content_disposition = f'{disposition_type}; filename="{safe_filename}.{ext}"'
        
        response_headers = {
          'Accept-Ranges': 'bytes',
          'Content-Disposition': content_disposition,
          'Access-Control-Expose-Headers': 'Content-Disposition'
        }
        
        if 'Content-Range' in response.headers:
          response_headers['Content-Range'] = response.headers['Content-Range']
        if 'Content-Length' in response.headers:
          response_headers['Content-Length'] = response.headers['Content-Length']
        
        media_type = response.headers.get('Content-Type')
        if not media_type:
          media_type = 'audio/mpeg' if quality == 'audio' else 'video/mp4'
        
        return StreamingResponse(
          response.iter_content(chunk_size=8192),
          status_code=status_code,
          media_type=media_type,
          headers=response_headers
        )
      else:
        raise HTTPException(status_code=404, detail="No suitable video format found")
        
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)

# Endpoint: Preview clip (ffmpeg pipe — DASH + combined streams)
@app.get("/api/preview-clip")
def get_preview_clip(
  request: Request,
  url: str,
  start: float = 0,
  clip_duration: float = 15
):
  """
  Pipe a short preview clip via ffmpeg.
  - Combined formats (360p/480p): stream copy — very fast
  - DASH-only formats: re-encode with ultrafast preset
  Output: fragmented MP4 for browser streaming.
  """
  try:
    ydl_opts = {
      **get_yt_opts(),
      'skip_download': True,
      'format': 'best[height<=480][ext=mp4]/best[height<=480]/bestvideo[height<=480]+bestaudio/best',
      **get_cookie_opts()
    }
    with YoutubeDL(ydl_opts) as ydl:
      info = ydl.extract_info(url, download=False)

    if not info:
      return JSONResponse({'error': 'Could not extract video info'}, status_code=400)

    all_formats = info.get('formats', [])

    # Prefer combined (video+audio in one stream) ≤ 480p for fast stream copy
    combined = [
      f for f in all_formats
      if f.get('vcodec', 'none') != 'none'
      and f.get('acodec', 'none') != 'none'
      and (f.get('height') or 0) <= 480
    ]

    # Shared headers helper
    def build_headers_str(fmt):
      h = fmt.get('http_headers', {})
      if not h:
        h = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.youtube.com/'
        }
      return ''.join(f'{k}: {v}\r\n' for k, v in h.items())

    if combined:
      # --- FAST PATH: stream copy ---
      best = max(combined, key=lambda f: f.get('height') or 0)
      stream_url = best['url']
      headers_str = build_headers_str(best)

      cmd = [
        get_ffmpeg_path(), '-loglevel', 'error',
        '-headers', headers_str,
        '-ss', str(start),
        '-i', stream_url,
        '-t', str(clip_duration),
        '-c', 'copy',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        'pipe:1'
      ]
    else:
      # --- DASH PATH: separate video + audio, re-encode ---
      video_fmts = sorted(
        [f for f in all_formats if f.get('vcodec', 'none') != 'none' and f.get('acodec', 'none') == 'none' and (f.get('height') or 0) <= 480],
        key=lambda f: f.get('height') or 0, reverse=True
      )
      audio_fmts = sorted(
        [f for f in all_formats if f.get('acodec', 'none') != 'none' and f.get('vcodec', 'none') == 'none'],
        key=lambda f: f.get('abr') or 0, reverse=True
      )

      if not video_fmts or not audio_fmts:
        return JSONResponse({'error': 'No suitable DASH streams found'}, status_code=404)

      bv = video_fmts[0]
      ba = audio_fmts[0]
      shared_headers = build_headers_str(bv)

      cmd = [
        get_ffmpeg_path(), '-loglevel', 'error',
        '-headers', shared_headers,
        '-ss', str(start), '-i', bv['url'],
        '-ss', str(start), '-i', ba['url'],
        '-t', str(clip_duration),
        '-map', '0:v:0', '-map', '1:a:0',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
        '-c:a', 'aac', '-b:a', '128k',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        'pipe:1'
      ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def stream_clip():
      try:
        while True:
          chunk = process.stdout.read(65536)
          if not chunk:
            break
          yield chunk
      finally:
        process.stdout.close()
        try:
          process.wait(timeout=10)
        except Exception:
          process.kill()

    return StreamingResponse(
      stream_clip(),
      media_type='video/mp4',
      headers={
        'Cache-Control': 'no-cache',
        'Content-Disposition': 'inline; filename="preview.mp4"',
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Access-Control-Allow-Origin': '*',
      }
    )

  except Exception as e:
    return JSONResponse({'error': str(e)}, status_code=500)

# Endpoint: Download video/audio (with options)
@app.post("/api/download")
def download_video(
  url: str = Form(...),
  quality: Optional[str] = Form(None),
  format: Optional[str] = Form(None),
  format_id: Optional[str] = Form(None),       # exact YouTube stream ID (preferred)
  audio_format_id: Optional[str] = Form(None), # Change C: specific audio stream ID
  container: Optional[str] = Form(None),        # Change C: mp4/mkv/webm/mov
  convert_to_mp3: bool = Form(False),           # Change C: explicit MP3 transcode toggle
  trim_start: Optional[float] = Form(None),
  trim_end: Optional[float] = Form(None),
  rename: Optional[str] = Form(None),
  is_desktop: bool = Form(False),
  download_path: Optional[str] = Form(None),
  organize_folders: Optional[bool] = Form(None),  # None → read from registry; True/False → explicit override
  type: Optional[str] = Form(None),
  channel: Optional[str] = Form(None),
  thumbnail: Optional[str] = Form(None),
  background_tasks: BackgroundTasks = None
):
  try:
    task_id = str(uuid.uuid4())
    download_tasks[task_id] = {
      "status": "pending",
      "progress": 0,
      "url": url,
      "filename": None,
      "error": None,
      "channel": channel,
      "thumbnail": thumbnail,
      "started_at": datetime.now().isoformat()
    }

    # Start background download task
    background_tasks.add_task(
      download_worker,
      task_id, url, quality, format,
      trim_start, trim_end, rename, format_id, is_desktop, download_path, type,
      audio_format_id, container, convert_to_mp3, organize_folders
    )

    return {"task_id": task_id, "message": "Download started successfully."}
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)
# (duplicate get_cookie_opts removed — using the one at top of file)

def schedule_deletion(filepath: str, delay: int = 600):
  def delete_task():
    time.sleep(delay)
    try:
      if os.path.exists(filepath):
        os.remove(filepath)
        print(f"Auto-deleted {filepath}")
    except Exception as e:
      print(f"Error deleting {filepath}: {e}")
      
  threading.Thread(target=delete_task, daemon=True).start()

# Download worker function
def download_worker(task_id: str, url: str, quality: str = None,
          format: str = None, trim_start: float = None,
          trim_end: float = None, rename: str = None,
          format_id: str = None, is_desktop: bool = False,
          download_path: str = None, type: str = None,
          audio_format_id: str = None,   # Change D: specific audio stream
          container: str = None,          # Change D: output container
          convert_to_mp3: bool = False,   # Change D: MP3 transcode toggle
          organize_folders: bool = None): # None → fall back to registry AutoOrganize setting
  try:
    if is_desktop:
      # ── Resolve desktop download path ────────────────────────────────────
      # Priority: (1) path passed from frontend settings, (2) registry DownloadPath,
      # (3) system Downloads folder.
      reg_settings = get_desktop_registry_settings()

      if download_path and os.path.isdir(download_path):
        base_dir = download_path
      elif reg_settings['download_path'] and os.path.isdir(reg_settings['download_path']):
        base_dir = reg_settings['download_path']
      else:
        base_dir = get_downloads_folder()

      # ── Resolve folder organization ───────────────────────────────────────
      # Priority: (1) explicit frontend override, (2) installer registry value.
      if organize_folders is None:
        use_subfolders = reg_settings['auto_organize']
      else:
        use_subfolders = bool(organize_folders)

      if use_subfolders:
        # Organized mode: type subfolders inside base_dir
        if format == "mp3" or quality == "audio" or "audio" in str(quality).lower() or type == "audio":
          subfolder = "Music"
        elif type == "thumbnail" or format == "jpg":
          subfolder = "Thumbnails"
        else:
          subfolder = "Videos"
        TARGET_DIR = os.path.join(base_dir, subfolder)
      else:
        # Flat mode (default): files go directly into base_dir
        TARGET_DIR = base_dir

      os.makedirs(TARGET_DIR, exist_ok=True)
    else:
      TARGET_DIR = TEMPFILES_DIR
      os.makedirs(TARGET_DIR, exist_ok=True)

    download_tasks[task_id]["status"] = "downloading"
    # Store the full download config so /api/resume can restart the worker
    download_tasks[task_id]["_download_config"] = {
      "url": url, "quality": quality, "format": format,
      "trim_start": trim_start, "trim_end": trim_end, "rename": rename,
      "format_id": format_id, "is_desktop": is_desktop,
      "download_path": download_path, "type": type,
      "audio_format_id": audio_format_id, "container": container,
      "convert_to_mp3": convert_to_mp3, "organize_folders": organize_folders
    }
    _save_tasks()
    
    # Get video info first (needed for title and format metadata)
    ydl_opts_info = {
      **get_yt_opts(),
      'skip_download': True,
      **get_cookie_opts(),
    }
    with YoutubeDL(ydl_opts_info) as ydl:
      info = ydl.extract_info(url, download=False)
    
    # Determine output filename
    if rename:
      base_filename = rename
    else:
      base_filename = info.get('title', 'video')
    
    # Clean filename for filesystem
    base_filename = "".join(c for c in base_filename if c.isalnum() or c in (' ', '-', '_')).rstrip()
    
    # Check for direct thumbnail download
    if type == "thumbnail":
      thumbnail_url = info.get('thumbnail')
      if thumbnail_url:
        filename = f"{base_filename}.jpg"
        filepath = os.path.join(TARGET_DIR, filename)
        import requests
        r = requests.get(thumbnail_url)
        with open(filepath, 'wb') as f:
          f.write(r.content)
        
        download_tasks[task_id].update({
          "status": "completed",
          "progress": 100,
          "filename": filename,
          "filepath": filepath,
          "completed_at": datetime.now().isoformat()
        })
        _save_tasks()
        
        history_entry = {
          "id": task_id,
          "title": info.get('title', 'Unknown Thumbnail'),
          "url": url,
          "filename": filename,
          "filepath": filepath,
          "downloaded_at": datetime.now().isoformat(),
          "file_size": os.path.getsize(filepath),
          "format": "jpg",
          "quality": "Thumbnail",
          "thumbnail": download_tasks[task_id].get("thumbnail") or info.get('thumbnail', ''),
          "channel": download_tasks[task_id].get("channel") or info.get('uploader') or info.get('channel', ''),
          "duration": info.get('duration', 0),
          "batch_id": download_tasks[task_id].get("batch_id"),
          "format_id": download_tasks[task_id].get("format_id"),
          "audio_format_id": download_tasks[task_id].get("audio_format_id")
        }
        download_history.append(history_entry)
        save_history()
        return
      else:
        raise Exception("Thumbnail URL not found")
        
    # Determine format spec
    cookie_opts = get_cookie_opts()
    
    if format_id and not convert_to_mp3 and type != 'audio':
      # FORMAT_ID BASED VIDEO DOWNLOAD — specific audio + dynamic container
      all_raw_fmts = info.get('formats', [])
      selected_fmt = next(
        (f for f in all_raw_fmts if f.get('format_id') == format_id), None
      )
      needs_audio = (
        selected_fmt is not None and
        selected_fmt.get('vcodec', 'none') != 'none' and
        selected_fmt.get('acodec', 'none') == 'none'
      )

      # ── Container resolution ──────────────────────────────────────────────
      # If user explicitly picked a container (mp4/mkv/webm/mov), honour it.
      # Otherwise (auto/native): derive the container from the selected video
      # stream's own native ext so yt-dlp doesn't silently fall back to MKV.
      safe_container = container if container in ('mp4', 'mkv', 'webm', 'mov') else None
      native_video_ext = (selected_fmt.get('ext') or '').lower() if selected_fmt else ''
      if not safe_container and needs_audio and native_video_ext in ('webm', 'mp4', 'mov'):
        safe_container = native_video_ext

      # ── Audio spec — must be codec-compatible with the output container ───
      # WebM container only accepts Opus audio; mixing M4A/AAC causes yt-dlp
      # to silently fall back to MKV.  MP4/MKV are fine with M4A (AAC).
      if needs_audio:
        if audio_format_id:
          # User explicitly chose an audio stream — trust their choice
          audio_spec = audio_format_id
        elif safe_container == 'webm':
          # WebM container → must use Opus (WebM-native audio)
          audio_spec = "bestaudio[ext=webm][acodec=opus]/bestaudio[acodec=opus]/bestaudio"
        else:
          # MP4 / MKV / default → prefer m4a (AAC)
          audio_spec = "bestaudio[ext=m4a]/bestaudio"
        fmt_spec = f"{format_id}+{audio_spec}"
      else:
        fmt_spec = format_id

      output_template = f"{TARGET_DIR}/{base_filename}.%(ext)s"
      ydl_opts = {
        **get_yt_opts(),
        'outtmpl': output_template,
        'format': fmt_spec,
        'progress_hooks': [lambda d: progress_hook(d, task_id)],
        'retries': 10,
        'fragment_retries': 10,
        **cookie_opts,
      }
      if safe_container:
        ydl_opts['merge_output_format'] = safe_container

    elif type == 'audio' or convert_to_mp3 or format in ('mp3', 'opus', 'm4a', 'audio'):
      # Change F: AUDIO DOWNLOAD — native format OR MP3 transcode
      output_template = f"{TARGET_DIR}/{base_filename}.%(ext)s"
      # Determine which audio stream to use
      # The frontend passes the chosen stream in `audio_format_id` for audio downloads
      effective_audio_id = audio_format_id or format_id
      audio_fmt = effective_audio_id if effective_audio_id else 'bestaudio/best'

      if convert_to_mp3 or format == 'mp3':
        # MP3 transcode path (original behavior preserved)
        ydl_opts = {
          **get_yt_opts(),
          'outtmpl': output_template,
          'format': audio_fmt,
          'writethumbnail': True,
          'postprocessors': [
            {'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': '192'},
            {'key': 'EmbedThumbnail'},
            {'key': 'FFmpegMetadata', 'add_metadata': True},
          ],
          'progress_hooks': [lambda d: progress_hook(d, task_id)],
          'retries': 10,
          'fragment_retries': 10,
          'ignoreerrors': True,
          **cookie_opts,
        }
      else:
        # Native format — no FFmpeg transcode
        # Detect codec to decide thumbnail embedding strategy
        all_raw_fmts = info.get('formats', [])
        selected_audio_fmt = next(
          (f for f in all_raw_fmts if f.get('format_id') == effective_audio_id), None
        ) if effective_audio_id else None
        acodec_str = (selected_audio_fmt.get('acodec', '') if selected_audio_fmt else '').lower()

        # Also detect from the `format` parameter when no format_id is available
        # (frontend passes format='m4a'/'webm'/'opus' but format_id=null for audio)
        is_m4a_codec = (
          any(x in acodec_str for x in ('mp4a', 'aac')) or
          (not effective_audio_id and format == 'm4a')
        )

        # Build format-specific yt-dlp spec when no explicit stream ID is given
        if not effective_audio_id:
          if format == 'm4a':
            audio_fmt = 'bestaudio[ext=m4a]/bestaudio[acodec~=mp4a]/bestaudio'
          elif format in ('webm', 'opus'):
            audio_fmt = 'bestaudio[ext=webm][acodec=opus]/bestaudio[acodec=opus]/bestaudio'
          # else: keep 'bestaudio/best' set above

        if is_m4a_codec:
          # m4a/aac: EmbedThumbnail works natively
          ydl_opts = {
            **get_yt_opts(),
            'outtmpl': output_template,
            'format': audio_fmt,
            'writethumbnail': True,
            'postprocessors': [
              {'key': 'FFmpegMetadata', 'add_metadata': True},
              {'key': 'EmbedThumbnail'},
            ],
            'progress_hooks': [lambda d: progress_hook(d, task_id)],
            'retries': 10,
            'fragment_retries': 10,
            **cookie_opts,
          }
        else:
          # opus/webm: EmbedThumbnail not natively supported
          # Will generate music card image after download (see post-processing below)
          ydl_opts = {
            **get_yt_opts(),
            'outtmpl': output_template,
            'format': audio_fmt,
            'postprocessors': [
              {'key': 'FFmpegMetadata', 'add_metadata': True},
            ],
            'progress_hooks': [lambda d: progress_hook(d, task_id)],
            'retries': 10,
            'fragment_retries': 10,
            **cookie_opts,
          }
    else:
      # Video download — strip 'p' from quality (e.g. "1080p" → "1080")
      if quality:
        # Handle labels like "1080p", "4K", "2K", "8K", "720p", etc.
        quality_height_map = {
          '8k': '4320', '8K': '4320',
          '4k': '2160', '4K': '2160',
          '2k': '1440', '2K': '1440',
        }
        if quality in quality_height_map:
          height_val = quality_height_map[quality]
        else:
          # Strip 'p' suffix and any non-digit chars to get numeric height
          height_val = ''.join(filter(str.isdigit, quality))
        
        if height_val:
          # Use bestvideo+bestaudio for proper DASH stream merging
          # This is critical for 1080p+ on YouTube which are always DASH
          format_spec = (
            f"bestvideo[height<={height_val}][ext=mp4]+bestaudio[ext=m4a]"
            f"/bestvideo[height<={height_val}]+bestaudio"
            f"/best[height<={height_val}]"
            f"/best"
          )
        else:
          format_spec = "bestvideo+bestaudio/best"
      else:
        format_spec = "bestvideo+bestaudio/best"
      
      safe_container = container if container in ('mp4', 'mkv', 'webm', 'mov') else None
      output_template = f"{TARGET_DIR}/{base_filename}.%(ext)s"
      ydl_opts = {
        **get_yt_opts(),
        'outtmpl': output_template,
        'format': format_spec,
        'progress_hooks': [lambda d: progress_hook(d, task_id)],
        **cookie_opts,
        'retries': 10,
        'fragment_retries': 10,
      }
      if safe_container:
        ydl_opts['merge_output_format'] = safe_container
    
    # ── For TRIMMED downloads: patch outtmpl to use task_id prefix so the file
    # is always unique — no collision with previous downloads of the same video.
    is_trimmed_request = (trim_start is not None or trim_end is not None)
    trim_unique_prefix = f"_ytd_{task_id[:12]}"
    if is_trimmed_request and 'outtmpl' in ydl_opts:
      orig_outtmpl = ydl_opts['outtmpl']
      # Insert unique prefix before the extension placeholder
      ydl_opts['outtmpl'] = orig_outtmpl.replace('.%(ext)s', f'{trim_unique_prefix}.%(ext)s')

    # ── Check cancellation before starting the heavy download ──────────────
    with cancelled_tasks_lock:
      if task_id in cancelled_tasks:
        print(f"[cancel] Task {task_id} was cancelled before download started")
        download_tasks[task_id].update({"status": "cancelled", "error": None})
        _save_tasks()
        cancelled_tasks.discard(task_id)
        return

    # Get list of files before download to detect new files
    existing_files = set(os.listdir(TARGET_DIR)) if os.path.exists(TARGET_DIR) else set()

    # Download the file (progress_hook will raise DownloadCancelled if user cancels)
    try:
      with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    except DownloadCancelled:
      task_status = download_tasks.get(task_id, {}).get("status", "cancelled")
      is_pause = task_status == "paused"
      print(f"[{'pause' if is_pause else 'cancel'}] yt-dlp aborted for task {task_id}")

      if not is_pause:
        # Cancel — clean up partial files
        print("[cancel] Cleaning up partial files...")
        try:
          current_files = set(os.listdir(TARGET_DIR))
          partial_files = current_files - existing_files
          for pf in partial_files:
            pf_path = os.path.join(TARGET_DIR, pf)
            try:
              os.remove(pf_path)
              print(f"[cancel] Removed partial file: {pf}")
            except Exception:
              pass
        except Exception:
          pass
        download_tasks[task_id].update({"status": "cancelled", "error": None})
      else:
        # Pause — keep .part files for resume
        print("[pause] Keeping partial files for resume")
        download_tasks[task_id].update({"error": None})

      _save_tasks()
      with cancelled_tasks_lock:
        cancelled_tasks.discard(task_id)
      return

    # Find the downloaded file
    # ── TRIMMED: look for the task_id-prefixed file (100% deterministic) ──
    if is_trimmed_request:
      trim_files = [f for f in os.listdir(TARGET_DIR) if trim_unique_prefix in f]
      downloaded_files = trim_files if trim_files else []
    else:
      # ── PRIMARY: find files NEW since the pre-download snapshot ──
      current_files = set(os.listdir(TARGET_DIR))
      new_files = current_files - existing_files
      if new_files:
        matching = [f for f in new_files if f.lower().startswith(base_filename.lower()[:50])]
        downloaded_files = matching if matching else list(new_files)
      else:
        # ── FALLBACK A: title-prefix match among files modified in the last 90 s ──
        recent_by_name = [
          f for f in os.listdir(TARGET_DIR)
          if f.lower().startswith(base_filename.lower()[:50])
          and (time.time() - os.path.getmtime(os.path.join(TARGET_DIR, f))) < 90
        ]
        if recent_by_name:
          recent_by_name.sort(
            key=lambda f: os.path.getmtime(os.path.join(TARGET_DIR, f)), reverse=True
          )
          downloaded_files = [recent_by_name[0]]
        else:
          # ── FALLBACK B: most recently modified file in the last 60 s ──
          all_files = os.listdir(TARGET_DIR)
          if all_files:
            all_files_with_time = [
              (f, os.path.getmtime(os.path.join(TARGET_DIR, f)))
              for f in all_files
            ]
            all_files_with_time.sort(key=lambda x: x[1], reverse=True)
            if time.time() - all_files_with_time[0][1] < 60:
              downloaded_files = [all_files_with_time[0][0]]
            else:
              downloaded_files = []
          else:
            downloaded_files = []

    if downloaded_files:
      filename = downloaded_files[0]
      filepath = os.path.join(TARGET_DIR, filename)
      
      # Apply trimming if specified
      if trim_start is not None or trim_end is not None:
        ts = float(trim_start or 0)
        te = float(trim_end) if trim_end is not None else float(info.get('duration', ts + 1))
        clip_duration = te - ts
        
        # Use a temp file for ffmpeg output, then rename back to original filename
        file_ext = os.path.splitext(filename)[1]
        temp_trimmed = os.path.join(TARGET_DIR, f"_tmp_trim_{uuid.uuid4().hex[:8]}{file_ext}")
        
        # Use ffmpeg to trim: -ss BEFORE -i for fast input seek (no full-decode)
        # -t specifies duration (safer than -to with input seeking)
        # -c copy = stream copy, no re-encoding — much faster
        cmd = [
          get_ffmpeg_path(), '-y',
          '-ss', str(ts),          # fast seek (input-side)
          '-i', filepath,
          '-t', str(clip_duration), # output duration
          '-c', 'copy',             # no re-encode
          '-avoid_negative_ts', 'make_zero',
          temp_trimmed
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if result.returncode != 0:
          print(f"[trim] FFmpeg stream-copy failed: {result.stderr[-300:]}")
          # Fallback: re-encode — codecs must match the output container
          # WebM only accepts VP8/VP9/AV1 video + Vorbis/Opus audio
          # MP4/MKV accept libx264 + AAC
          if file_ext.lower() == '.webm':
            fb_codecs = ['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus', '-b:a', '128k']
          elif file_ext.lower() == '.opus':
            fb_codecs = ['-vn', '-c:a', 'libopus', '-b:a', '128k']
          elif file_ext.lower() == '.m4a':
            fb_codecs = ['-vn', '-c:a', 'aac', '-b:a', '192k']
          else:
            # MP4, MKV, MOV — safe with H264 + AAC
            fb_codecs = ['-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac']
          cmd_fallback = [
            get_ffmpeg_path(), '-y',
            '-ss', str(ts), '-i', filepath,
            '-t', str(clip_duration),
            *fb_codecs,
            temp_trimmed
          ]
          result_fb = subprocess.run(cmd_fallback, capture_output=True, text=True, encoding='utf-8', errors='replace')
          if result_fb.returncode != 0:
            print(f"[trim] FFmpeg fallback also failed: {result_fb.stderr[-300:]}")
        
        # Replace the task_id-prefixed file with the trimmed output,
        # then rename to clean base_filename so history shows a clean name.
        if os.path.exists(filepath):
          os.remove(filepath)
        if os.path.exists(temp_trimmed):
          # Clean filename = base_filename + ext (no task_id prefix)
          clean_filename = f"{base_filename}{file_ext}"
          clean_filepath = os.path.join(TARGET_DIR, clean_filename)
          # Overwrite any old file with the same clean name
          if os.path.exists(clean_filepath):
            os.remove(clean_filepath)
          os.rename(temp_trimmed, clean_filepath)
          filename = clean_filename
          filepath = clean_filepath
        # filename and filepath now point to the clean, trimmed file

      # Schedule auto-deletion after 10 minutes only for web
      if not is_desktop:
        schedule_deletion(filepath, 600)
      
      # Update task status
      download_tasks[task_id].update({
        "status": "completed",
        "progress": 100,
        "filename": filename,
        "filepath": filepath,
        "completed_at": datetime.now().isoformat()
      })
      _save_tasks()
      
      # Update batch progress if this is part of a batch
      batch_id = download_tasks[task_id].get("batch_id")
      if batch_id and batch_id in download_tasks:
        batch_task = download_tasks[batch_id]
        batch_task["completed_urls"] += 1
        batch_progress = (batch_task["completed_urls"] / batch_task["total_urls"]) * 100
        batch_task["progress"] = batch_progress
        
        if batch_task["completed_urls"] == batch_task["total_urls"]:
          batch_task["status"] = "completed"
          batch_task["completed_at"] = datetime.now().isoformat()
      
      # Add to history
      history_entry = {
        "id": task_id,
        "title": info.get('title', 'Unknown'),
        "url": url,
        "filename": filename,
        "filepath": filepath,
        "downloaded_at": datetime.now().isoformat(),
        "file_size": os.path.getsize(filepath) if os.path.exists(filepath) else 0,
        "format": format or ('mp3' if quality == 'audio' else 'mp4'),
        "quality": quality or '1080p',
        "thumbnail": download_tasks[task_id].get("thumbnail") or info.get('thumbnail', ''),
        "channel": download_tasks[task_id].get("channel") or info.get('uploader') or info.get('channel', ''),
        "duration": info.get('duration', 0),
        "batch_id": batch_id,
        "trim_start": trim_start,
        "trim_end": trim_end,
        "type": type,
        "format_id": format_id,
        "audio_format_id": audio_format_id
      }
      download_history.append(history_entry)
      save_history()
      
    else:
      download_tasks[task_id].update({
        "status": "error",
        "error": "Downloaded file not found"
      })
      
      # Update batch progress if this is part of a batch
      batch_id = download_tasks[task_id].get("batch_id")
      if batch_id and batch_id in download_tasks:
        batch_task = download_tasks[batch_id]
        batch_task["failed_urls"] += 1
      
  except Exception as e:
    # Check if this was actually a cancellation/pause that yt-dlp wrapped in DownloadError
    with cancelled_tasks_lock:
      was_aborted = task_id in cancelled_tasks
      cancelled_tasks.discard(task_id)
    
    if was_aborted or isinstance(e, DownloadCancelled):
      task_status = download_tasks.get(task_id, {}).get("status", "cancelled")
      is_pause = task_status == "paused"
      print(f"[{'pause' if is_pause else 'cancel'}] Task {task_id} aborted (caught in outer handler)")
      if not is_pause:
        download_tasks[task_id].update({"status": "cancelled", "error": None})
      else:
        download_tasks[task_id].update({"error": None})
      _save_tasks()
      return

    download_tasks[task_id].update({
      "status": "error",
      "error": str(e)
    })
    _save_tasks()
    
    # Update batch progress if this is part of a batch
    batch_id = download_tasks[task_id].get("batch_id")
    if batch_id and batch_id in download_tasks:
      batch_task = download_tasks[batch_id]
      batch_task["failed_urls"] += 1

# Progress hook for ytdlp ---
def progress_hook(d, task_id):
  # ── Check cancellation on EVERY progress callback ──────────────────────
  with cancelled_tasks_lock:
    if task_id in cancelled_tasks:
      print(f"[cancel] progress_hook: aborting task {task_id}")
      raise DownloadCancelled(f"Download {task_id} cancelled by user")

  if task_id in download_tasks:
    if d['status'] == 'downloading':
      # Calculate progress percentage
      if 'total_bytes' in d and d['total_bytes']:
        progress = (d['downloaded_bytes'] / d['total_bytes']) * 100
        speed = d.get('speed', 0)
        eta = d.get('eta', 0)
      elif 'total_bytes_estimate' in d and d['total_bytes_estimate']:
        progress = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100
        speed = d.get('speed', 0)
        eta = d.get('eta', 0)
      else:
        progress = download_tasks[task_id].get('progress', 0)
        speed = download_tasks[task_id].get('speed', 0)
        eta = download_tasks[task_id].get('eta', 0)
      
      # Update task with accurate progress information
      download_tasks[task_id].update({
        "progress": round(progress, 2), # Round to 2 decimal places for more precision
        "speed": speed,         # Download speed in bytes per second
        "eta": eta,           # Estimated time remaining in seconds
        "downloaded_bytes": d.get('downloaded_bytes', 0),
        "total_bytes": d.get('total_bytes') or d.get('total_bytes_estimate', 0)
      })
      _save_tasks()

# Endpoint: Download progress
@app.get("/api/progress/{task_id}")
def get_progress(task_id: str):
  task = download_tasks.get(task_id)
  if not task:
    return JSONResponse({"error": "Task not found"}, status_code=404)
  
  return {
    "task_id": task_id,
    "status": task.get("status"),
    "progress": task.get("progress", 0),
    "filename": task.get("filename"),
    "filepath": task.get("filepath"),
    "error": task.get("error"),
    "started_at": task.get("started_at"),
    "completed_at": task.get("completed_at"),
    "speed": task.get("speed", 0),
    "eta": task.get("eta", 0),
    "downloaded_bytes": task.get("downloaded_bytes", 0),
    "total_bytes": task.get("total_bytes", 0),
    "channel": task.get("channel"),
    "thumbnail": task.get("thumbnail")
  }

# ─────────────────────────────────────────────────────────────────────────────
# Endpoint: Cancel an active download task
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/cancel/{task_id}")
def cancel_download(task_id: str):
  task = download_tasks.get(task_id)
  if not task:
    return JSONResponse({"error": "Task not found"}, status_code=404)
  
  # 1) Add to the cancellation set so the progress_hook raises on next callback
  with cancelled_tasks_lock:
    cancelled_tasks.add(task_id)
  print(f"[cancel] Task {task_id} flagged for cancellation")

  # 2) Mark as cancelled in the task store (progress endpoint returns this)
  download_tasks[task_id]["status"] = "cancelled"
  _save_tasks()

  return {"status": "cancelled", "task_id": task_id}

# ─────────────────────────────────────────────────────────────────────────────
# Endpoint: Pause an active download (keeps .part files for resume)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/pause/{task_id}")
def pause_download(task_id: str):
  task = download_tasks.get(task_id)
  if not task:
    return JSONResponse({"error": "Task not found"}, status_code=404)
  
  # Mark as paused BEFORE adding to abort set (so download_worker knows to keep files)
  download_tasks[task_id]["status"] = "paused"
  _save_tasks()

  # Add to abort set so progress_hook raises on next callback
  with cancelled_tasks_lock:
    cancelled_tasks.add(task_id)
  print(f"[pause] Task {task_id} flagged for pause (keeping .part files)")

  return {"status": "paused", "task_id": task_id}

# ─────────────────────────────────────────────────────────────────────────────
# Endpoint: Resume a paused download (yt-dlp auto-resumes from .part file)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/resume/{task_id}")
def resume_download(task_id: str, background_tasks: BackgroundTasks):
  task = download_tasks.get(task_id)
  if not task:
    return JSONResponse({"error": "Task not found"}, status_code=404)
  
  config = task.get("_download_config")
  if not config:
    return JSONResponse({"error": "No saved download config to resume from"}, status_code=400)
  
  # Clear from abort set
  with cancelled_tasks_lock:
    cancelled_tasks.discard(task_id)
  
  # Reset task state (keep existing progress for UI)
  download_tasks[task_id]["status"] = "downloading"
  download_tasks[task_id]["error"] = None
  _save_tasks()
  print(f"[resume] Task {task_id} resuming — yt-dlp will auto-detect .part files")

  # Restart the download worker with the same config
  background_tasks.add_task(
    download_worker,
    task_id, **config
  )

  return {"status": "resuming", "task_id": task_id}

# ─────────────────────────────────────────────────────────────────────────────
# Endpoint: Desktop OS-level notification (Windows toast)
#
# WHY top-level try/import instead of inline `from winotify import`:
#   PyInstaller only bundles packages it detects at analysis time (top-level).
#   An inline `from winotify import` inside a function body is NOT detected
#   by PyInstaller's static analysis — so winotify is excluded from the .exe
#   and the ImportError fallback fires every time, silently doing nothing.
# ─────────────────────────────────────────────────────────────────────────────
try:
  from winotify import Notification as _WinNotification
  from winotify import audio as _winaudio
  _WINOTIFY_AVAILABLE = True
except Exception:
  _WINOTIFY_AVAILABLE = False

@app.post("/api/desktop/notify")
async def desktop_notify(request: Request):
  try:
    data = await request.json()
    title      = data.get("title", "YT Deluxe")
    message    = data.get("message", "")
    notif_type = data.get("type", "info")  # "success" | "error" | "info"

    # Only fire on Windows
    if os.name != "nt":
      return {"status": "skipped", "reason": "not_windows"}

    if not _WINOTIFY_AVAILABLE:
      print(f"[notify] winotify not available. Toast: [{notif_type.upper()}] {title} — {message}")
      return {"status": "fallback", "reason": "winotify_not_available"}

    try:
      # Resolve app icon — use bundled icon.ico if available, else no icon
      # Empty string ("") causes winotify to crash; must be a real path or omitted
      if getattr(sys, 'frozen', False):
        # Packaged .exe: icon sits in _internal/ next to the exe
        _icon_candidate = os.path.join(os.path.dirname(sys.executable), '_internal', 'icon.ico')
      else:
        _icon_candidate = os.path.join(os.path.dirname(__file__), '..', 'desktop', 'assets', 'icon.ico')
      
      _icon_path = _icon_candidate if os.path.isfile(_icon_candidate) else ""

      toast = _WinNotification(
        app_id="YT Deluxe",
        title=title,
        msg=message,
        duration="short",
        icon=_icon_path
      )

      # Different audio cues by notification type
      if notif_type == "error":
        toast.set_audio(_winaudio.Default, loop=False)
      elif notif_type == "success":
        toast.set_audio(_winaudio.Default, loop=False)
      else:
        toast.set_audio(_winaudio.Default, loop=False)

      toast.show()
      return {"status": "success"}

    except Exception as toast_err:
      # Toast failed (COM error, Windows version, etc.) — non-fatal, log and continue
      print(f"[notify] Toast failed: {toast_err}")
      return {"status": "fallback", "reason": str(toast_err)}

  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)


def get_history_file_path():
  history_dir = os.path.join(os.path.expanduser("~"), ".yt-deluxe")
  os.makedirs(history_dir, exist_ok=True)
  return os.path.join(history_dir, "download_history.json")

def get_settings_file_path():
  history_dir = os.path.join(os.path.expanduser("~"), ".yt-deluxe")
  os.makedirs(history_dir, exist_ok=True)
  return os.path.join(history_dir, "settings.json")

# Save history to file
def save_history():
  try:
    with open(get_history_file_path(), "w") as f:
      json.dump(download_history, f, indent=2)
  except Exception as e:
    print(f"Error saving history: {e}")

# Load history from file
def load_history():
  try:
    path = get_history_file_path()
    if os.path.exists(path):
      with open(path, "r") as f:
        return json.load(f)
  except Exception as e:
    print(f"Error loading history: {e}")
  return []

# Endpoint: Download history
@app.get("/api/history")
def get_history():
  global download_history

  # Filter out entries where the file has been manually deleted from disk.
  # We only check entries that have a filepath (desktop downloads).
  # Web entries (no filepath, or filepath in temp dir) are kept as-is.
  valid_history = []
  orphaned = False

  for item in download_history:
    filepath = item.get("filepath")
    if filepath:
      exists = os.path.exists(filepath)
      if not exists:
        # File was manually deleted — remove from history entirely
        orphaned = True
        print(f"[History] Purging orphaned entry: {item.get('title', 'Unknown')} ({filepath})")
        continue
      # File exists: include it with the flag
      valid_history.append({ **item, "file_exists": True })
    else:
      # Web mode or no path — keep entry, mark as N/A
      valid_history.append({ **item, "file_exists": None })

  # Persist the cleaned-up list if any orphaned entries were removed
  if orphaned:
    download_history = valid_history
    save_history()

  return {"history": valid_history}

@app.delete("/api/history/{task_id}")
def delete_history_item(task_id: str, delete_file: bool = False):
  global download_history
  
  if delete_file:
    for item in download_history:
      if str(item.get("id")) == str(task_id):
        filepath = item.get("filepath")
        if filepath and os.path.exists(filepath):
          try:
            os.remove(filepath)
          except Exception as e:
            print(f"Error deleting file {filepath}: {e}")
        break

  download_history = [item for item in download_history if str(item.get("id")) != str(task_id)]
  save_history()
  return {"status": "success"}

@app.post("/api/history/delete")
async def batch_delete_history(request: Request, delete_file: bool = False):
  global download_history
  data = await request.json()
  ids = data.get("ids", [])
  
  if delete_file:
    for item in download_history:
      if str(item.get("id")) in [str(i) for i in ids]:
        filepath = item.get("filepath")
        if filepath and os.path.exists(filepath):
          try:
            os.remove(filepath)
          except Exception as e:
            print(f"Error deleting file {filepath}: {e}")
            
  download_history = [item for item in download_history if str(item.get("id")) not in [str(i) for i in ids]]
  save_history()
  return {"status": "success"}

@app.delete("/api/history/all")
def clear_all_history(delete_file: bool = False):
  global download_history
  
  if delete_file:
    for item in download_history:
      filepath = item.get("filepath")
      if filepath and os.path.exists(filepath):
        try:
          os.remove(filepath)
        except Exception as e:
          print(f"Error deleting file {filepath}: {e}")
            
  download_history = []
  save_history()
  return {"status": "success"}

# Settings Persistence Endpoints
@app.get("/api/settings/{key}")
def get_setting(key: str):
  try:
    path = get_settings_file_path()
    if os.path.exists(path):
      with open(path, "r") as f:
        settings = json.load(f)
        return {"value": settings.get(key)}
  except Exception:
    pass
  return {"value": None}

@app.post("/api/settings/{key}")
async def save_setting(key: str, request: Request):
  try:
    data = await request.json()
    value = data.get("value")
    path = get_settings_file_path()
    settings = {}
    if os.path.exists(path):
      with open(path, "r") as f:
        settings = json.load(f)
    
    settings[key] = value
    with open(path, "w") as f:
      json.dump(settings, f, indent=2)
    return {"status": "success"}
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)

@app.delete("/api/settings/{key}")
def delete_setting(key: str):
  try:
    path = get_settings_file_path()
    if os.path.exists(path):
      with open(path, "r") as f:
        settings = json.load(f)
      if key in settings:
        del settings[key]
        with open(path, "w") as f:
          json.dump(settings, f, indent=2)
    return {"status": "success"}
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)

# Initialize history on startup
download_history = load_history()

# Endpoint: Batch download
@app.post("/api/batch-download")
def batch_download(
  urls: List[str] = Form(...),
  quality: Optional[str] = Form(None),
  format: Optional[str] = Form(None),
  is_desktop: bool = Form(False),
  background_tasks: BackgroundTasks = None
):
  try:
    batch_id = str(uuid.uuid4())
    
    # Create batch tracking
    download_tasks[batch_id] = {
      "status": "batch_pending",
      "progress": 0,
      "total_urls": len(urls),
      "completed_urls": 0,
      "failed_urls": 0,
      "urls": urls,
      "started_at": datetime.now().isoformat(),
      "batch_tasks": []
    }
    
    # Start individual downloads for each URL
    for i, url in enumerate(urls):
      task_id = f"{batch_id}_{i}"
      download_tasks[task_id] = {
        "status": "pending",
        "progress": 0,
        "url": url,
        "filename": None,
        "error": None,
        "started_at": datetime.now().isoformat(),
        "batch_id": batch_id
      }
      
      # Add to batch tasks list
      download_tasks[batch_id]["batch_tasks"].append(task_id)
      
      # Start background download task
      background_tasks.add_task(
        download_worker, 
        task_id, url, quality, format, 
        None, None, None, None, is_desktop # No trim/rename for batch
      )
    
    return {"batch_id": batch_id, "message": f"Batch download started for {len(urls)} videos."}
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)

# Endpoint: Feedback submission
@app.post("/api/feedback")
def submit_feedback(feedback: str = Form(...)):
  try:
    feedback_list.append({
      "feedback": feedback,
      "timestamp": datetime.now().isoformat()
    })
    # Save feedback to file
    with open("feedback.json", "w") as f:
      json.dump(feedback_list, f, indent=2)
    return {"message": "Feedback received. Thank you!"}
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)

# Endpoint: Legal disclaimer
@app.get("/api/legal")
def get_legal():
  disclaimer = "This tool is for personal use only. Downloading copyrighted content may violate YouTube's terms of service. Use responsibly."
  return {"disclaimer": disclaimer}

# Static file serving for downloads (optional)
@app.get("/api/downloads/{filename}")
def serve_download(filename: str):
  # SECURITY FIX: Resolve path and verify it stays inside TEMPFILES_DIR (prevents path traversal)
  base = os.path.realpath(TEMPFILES_DIR)
  file_path = os.path.realpath(os.path.join(TEMPFILES_DIR, filename))
  if not file_path.startswith(base + os.sep) and file_path != base:
    return JSONResponse({"error": "Invalid path"}, status_code=400)
  if os.path.exists(file_path):
    response = FileResponse(file_path, filename=os.path.basename(file_path))
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    return response
  return JSONResponse({"error": "File not found."}, status_code=404)

@app.get("/api/tempfiles/{filename}")
def serve_tempfile(filename: str):
  # SECURITY FIX: Resolve path and verify it stays inside TEMPFILES_DIR (prevents path traversal)
  base = os.path.realpath(TEMPFILES_DIR)
  file_path = os.path.realpath(os.path.join(TEMPFILES_DIR, filename))
  if not file_path.startswith(base + os.sep) and file_path != base:
    return JSONResponse({"error": "Invalid path"}, status_code=400)
  if os.path.exists(file_path):
    response = FileResponse(file_path, filename=os.path.basename(file_path))
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    return response
  return JSONResponse({"error": "File not found or expired."}, status_code=404)

# Desktop operations


@app.post("/api/desktop/open-file")
async def open_desktop_file(request: Request):
  data = await request.json()
  filepath = data.get("filepath")
  
  if not filepath or not os.path.exists(filepath):
    filename = data.get("filename")
    if not filename:
      return JSONResponse({"error": "File path or name required"}, status_code=400)
    
    # Search in configured download base dir (registry or system Downloads)
    reg = get_desktop_registry_settings()
    download_path = data.get("download_path")
    BASE_DIR = download_path if (download_path and os.path.isdir(download_path)) else reg['download_path']
    filepath = os.path.join(BASE_DIR, filename)
    
    if not os.path.exists(filepath):
      # Recursive search (covers organized subfolders Videos/Music/Thumbnails)
      found = False
      for root, dirs, files in os.walk(BASE_DIR):
        if filename in files:
          filepath = os.path.join(root, filename)
          found = True
          break
      
      if not found:
        return JSONResponse({"error": "File not found"}, status_code=404)

  if os.path.exists(filepath):
    try:
      subprocess.Popen(['explorer', '/select,', os.path.normpath(filepath)])
      return {"status": "success"}
    except Exception as e:
      return JSONResponse({"error": f"Could not open file: {e}"}, status_code=500)
  return JSONResponse({"error": "File not found"}, status_code=404)

@app.post("/api/desktop/open-folder")
async def open_desktop_folder(request: Request):
  data = await request.json()
  reg = get_desktop_registry_settings()
  download_path = data.get("download_path")
  if download_path and os.path.isdir(download_path):
    TARGET_DIR = download_path
  else:
    TARGET_DIR = reg['download_path']
    
  os.makedirs(TARGET_DIR, exist_ok=True)
  if os.path.exists(TARGET_DIR):
    try:
      subprocess.Popen(['explorer', os.path.normpath(TARGET_DIR)])
      return {"status": "success"}
    except Exception as e:
      return JSONResponse({"error": str(e)}, status_code=500)
  return JSONResponse({"error": "Folder not found"}, status_code=404)



@app.post("/api/system/storage")
async def get_storage_info(request: Request):
  try:
    data = await request.json()
    download_path = data.get("download_path")
    if download_path and os.path.exists(download_path):
      target_path = download_path
    else:
      target_path = get_downloads_folder()
      
    total, used, free = shutil.disk_usage(target_path)
    return {
      "total": total,
      "used": used,
      "free": free,
      "target_path": target_path
    }
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)

# ── Serve Frontend (packaged desktop mode only) ─────────────────────────────
# When running as a PyInstaller exe, the backend also serves the React build
# so the app loads via http://127.0.0.1:8000 instead of file:// protocol.
# This gives YouTube embeds a valid HTTP origin (fixes Error 153).
#
# NOTE: The frontend files are bundled with the LAUNCHER (desktop/build.spec),
# not with the backend exe (which is --onefile). The launcher passes the
# frontend path via the YTDELUXE_FRONTEND_DIR environment variable.
_frontend_dir = os.environ.get('YTDELUXE_FRONTEND_DIR', '')
if _frontend_dir and os.path.isdir(_frontend_dir):
    _index_html = os.path.join(_frontend_dir, 'index.html')

    # SPA catch-all: any route not starting with /api/ returns index.html
    # so React Router can handle client-side navigation on page refresh
    @app.get('/{path:path}')
    async def _spa_fallback(path: str):
        # If the path matches a real static file, serve it
        file_path = os.path.join(_frontend_dir, path)
        if path and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html for React Router
        return FileResponse(_index_html)

    print(f'[YT Deluxe] Serving frontend from: {_frontend_dir}')
elif getattr(sys, 'frozen', False):
    print('WARNING: YTDELUXE_FRONTEND_DIR not set or invalid. Frontend will not be served.')

# Main entry point
if __name__ == "__main__":
  import uvicorn
  print(" Starting YT Deluxe Backend...")
  print(" API available at: http://localhost:8000")
  print(" API docs at: http://localhost:8000/docs")
  is_packaged = getattr(sys, 'frozen', False)
  uvicorn.run(app, host="0.0.0.0", port=8000, reload=not is_packaged)

