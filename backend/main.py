from fastapi import FastAPI, Request, BackgroundTasks, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
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
import atexit

def get_ffmpeg_path():
    """
    Returns correct ffmpeg binary path.
    - In PyInstaller .exe: ffmpeg.exe is in sys._MEIPASS/
    - In dev/Render: 'ffmpeg' must be in system PATH
    """
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, 'ffmpeg.exe')
    return 'ffmpeg'

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
  
  print("[cookies] No cookies available — YouTube may block requests on cloud")
  return {}

def get_yt_opts():
  return {
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

# Endpoint: Search YouTube (by keyword)
@app.get("/api/search")
def search_videos(q: str):
  try:
    ydl_opts = {
      **get_yt_search_opts(),
      'extract_flat': True,
      'skip_download': True,
      'ignoreerrors': True,
      **get_cookie_opts()
    }
    with YoutubeDL(ydl_opts) as ydl:
      # ytsearch12 returns top 12 results (perfect for 3-column grid)
      search_result = ydl.extract_info(f"ytsearch12:{q}", download=False)
    videos = []
    for entry in search_result.get('entries', []):
      videos.append({
        'id': entry.get('id'),
        'title': entry.get('title'),
        'url': f"https://www.youtube.com/watch?v={entry.get('id')}",
        'thumbnail': entry.get('thumbnail'),
        'duration': entry.get('duration'),
        'uploader': entry.get('uploader'),
        'views': entry.get('view_count'),
      })
    return {"results": videos}
  except Exception as e:
    return JSONResponse({"error": str(e)}, status_code=500)
# Endpoint: Get video details (by URL)
@app.get("/api/video")
def get_video_details(url: str):
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
      
    # Build deduplicated, quality-grouped format list
    # Collect all unique heights from real video formats
    seen_heights = {}
    audio_formats = []
    
    for f in info.get('formats', []):
      height = f.get('height')
      vcodec = f.get('vcodec', 'none')
      acodec = f.get('acodec', 'none')
      ext = f.get('ext', '')
      
      # Collect best audio-only formats
      if vcodec == 'none' and acodec != 'none':
        abr = f.get('abr') or 0
        if not audio_formats or abr > (audio_formats[0].get('abr') or 0):
          audio_formats = [f]
        continue
      
      # Only include real video formats with a height
      if not height or vcodec == 'none':
        continue
      
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
    
    # Sort heights descending (8K → 144p)
    sorted_heights = sorted(seen_heights.keys(), reverse=True)
    
    # Build quality label map
    height_labels = {
      4320: '8K', 2160: '4K', 1440: '2K',
      1080: '1080p', 720: '720p', 480: '480p',
      360: '360p', 240: '240p', 144: '144p',
    }
    
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
        'type': 'video',
      })
    
    # Add best audio option
    if audio_formats:
      af = audio_formats[0]
      formats.append({
        'format_id': af.get('format_id'),
        'quality': 'Audio Only',
        'height': 0,
        'ext': 'mp3',
        'resolution': 'audio',
        'filesize': af.get('filesize') or af.get('filesize_approx'),
        'vcodec': 'none',
        'acodec': af.get('acodec', 'none'),
        'abr': af.get('abr'),
        'type': 'audio',
      })
    
    video = {
      'id': info.get('id'),
      'title': info.get('title'),
      'thumbnail': info.get('thumbnail'),
      'duration': info.get('duration'),
      'uploader': info.get('uploader') or info.get('channel'),
      'channel': info.get('channel') or info.get('uploader'),
      'description': info.get('description'),
      'view_count': info.get('view_count'),
      'upload_date': info.get('upload_date'),
      'formats': formats,
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

# Endpoint: Download video/audio (with options)
@app.post("/api/download")
def download_video(
  url: str = Form(...),
  quality: Optional[str] = Form(None),
  format: Optional[str] = Form(None),
  format_id: Optional[str] = Form(None),  # ← exact YouTube stream ID (preferred)
  trim_start: Optional[float] = Form(None),
  trim_end: Optional[float] = Form(None),
  rename: Optional[str] = Form(None),
  is_desktop: bool = Form(False),
  download_path: Optional[str] = Form(None),
  type: Optional[str] = Form(None),
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
      "started_at": datetime.now().isoformat()
    }

    
    # Start background download task
    background_tasks.add_task(
      download_worker, 
      task_id, url, quality, format,
      trim_start, trim_end, rename, format_id, is_desktop, download_path, type
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
          download_path: str = None, type: str = None):
  try:
    if is_desktop:
      if download_path and os.path.exists(download_path):
        base_dir = os.path.join(download_path, "YT Deluxe Downloads")
      else:
        base_dir = os.path.join(get_downloads_folder(), "YT Deluxe Downloads")
        
      if format == "mp3" or quality == "audio" or "audio" in str(quality).lower() or type == "audio":
        subfolder = "Music"
      elif type == "thumbnail" or format == "jpg":
        subfolder = "Thumbnails"
      else:
        subfolder = "Videos"
        
      TARGET_DIR = os.path.join(base_dir, subfolder)
      os.makedirs(TARGET_DIR, exist_ok=True)
    else:
      TARGET_DIR = TEMPFILES_DIR
      os.makedirs(TARGET_DIR, exist_ok=True)

    download_tasks[task_id]["status"] = "downloading"
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
          "thumbnail": info.get('thumbnail', ''),
          "channel": info.get('uploader') or info.get('channel', ''),
          "duration": info.get('duration', 0),
          "batch_id": download_tasks[task_id].get("batch_id")
        }
        download_history.append(history_entry)
        save_history()
        return
      else:
        raise Exception("Thumbnail URL not found")
        
    # Determine format spec
    cookie_opts = get_cookie_opts()
    
    if format_id and format != 'mp3':
      # FORMAT_ID BASED DOWNLOAD (highest quality, reliable)
      # Detect if this format is video-only (needs audio merge)
      all_formats = info.get('formats', [])
      selected_fmt = next(
        (f for f in all_formats if f.get('format_id') == format_id), None
      )
      needs_audio = (
        selected_fmt is not None and
        selected_fmt.get('vcodec', 'none') != 'none' and
        selected_fmt.get('acodec', 'none') == 'none'
      )
      
      if needs_audio:
        fmt_spec = f"{format_id}+bestaudio"
      else:
        fmt_spec = format_id
      
      output_template = f"{TARGET_DIR}/{base_filename}.%(ext)s"
      ydl_opts = {
        **get_yt_opts(),
        'outtmpl': output_template,
        'format': fmt_spec,
        'merge_output_format': 'mp4',
        'progress_hooks': [lambda d: progress_hook(d, task_id)],
        'retries': 10,
        'fragment_retries': 10,
        **cookie_opts,
      }
    
    elif format == "mp3":
      output_template = f"{TARGET_DIR}/{base_filename}.%(ext)s"
      ydl_opts = {
        **get_yt_opts(),
        'outtmpl': output_template,
        'format': 'bestaudio/best',
        'postprocessors': [{
          'key': 'FFmpegExtractAudio',
          'preferredcodec': 'mp3',
          'preferredquality': '192',
        }],
        'progress_hooks': [lambda d: progress_hook(d, task_id)],
        'retries': 10,
        'fragment_retries': 10,
        'ignoreerrors': True,
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
      
      output_template = f"{TARGET_DIR}/{base_filename}.%(ext)s"
      ydl_opts = {
        **get_yt_opts(),
        'outtmpl': output_template,
        'format': format_spec,
        'merge_output_format': 'mp4',
        'progress_hooks': [lambda d: progress_hook(d, task_id)],
        # Apply valid cookies.txt if available
        **cookie_opts,
        'retries': 10,
        'fragment_retries': 10,
      }
    
    # Get list of files before download to detect new files
    existing_files = set(os.listdir(TARGET_DIR)) if os.path.exists(TARGET_DIR) else set()
    
    # Download the file
    with YoutubeDL(ydl_opts) as ydl:
      ydl.download([url])
    
    # Find the downloaded file
    # Method 1: Match by base_filename (case-insensitive startswith)
    downloaded_files = [
      f for f in os.listdir(TARGET_DIR)
      if f.lower().startswith(base_filename.lower()[:50]) # Use first 50 chars for matching
    ]
    
    # Method 2: Fallback - find new files added to tempfiles folder
    if not downloaded_files:
      current_files = set(os.listdir(TARGET_DIR))
      new_files = current_files - existing_files
      if new_files:
        downloaded_files = list(new_files)
    
    # Method 3: Fallback - find most recently modified file
    if not downloaded_files:
      all_files = os.listdir(TARGET_DIR)
      if all_files:
        all_files_with_time = [
          (f, os.path.getmtime(os.path.join(TARGET_DIR, f)))
          for f in all_files
        ]
        all_files_with_time.sort(key=lambda x: x[1], reverse=True)
        # Check if the most recent file was modified in the last 60 seconds
        import time
        if time.time() - all_files_with_time[0][1] < 60:
          downloaded_files = [all_files_with_time[0][0]]
    
    if downloaded_files:
      filename = downloaded_files[0]
      filepath = os.path.join(TARGET_DIR, filename)
      
      # Apply trimming if specified
      if trim_start is not None or trim_end is not None:
        trimmed_filename = f"trimmed_{filename}"
        trimmed_filepath = os.path.join(TARGET_DIR, trimmed_filename)
        
        # Use ffmpeg to trim
        cmd = [get_ffmpeg_path(), "-i", filepath, "-y"]
        if trim_start:
          cmd.extend(["-ss", str(trim_start)])
        if trim_end:
          cmd.extend(["-t", str(trim_end - (trim_start or 0))])
        cmd.append(trimmed_filepath)
        
        subprocess.run(cmd, check=True)
        
        # Replace original with trimmed version
        os.remove(filepath)
        filename = trimmed_filename
        filepath = trimmed_filepath
        
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
        "thumbnail": info.get('thumbnail', ''),
        "channel": info.get('uploader') or info.get('channel', ''),
        "duration": info.get('duration', 0),
        "batch_id": batch_id
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
    "total_bytes": task.get("total_bytes", 0)
  }

def get_history_file_path():
  history_dir = os.path.join(os.path.expanduser("~"), ".yt-deluxe")
  os.makedirs(history_dir, exist_ok=True)
  return os.path.join(history_dir, "download_history.json")

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
  return {"history": download_history}

@app.delete("/api/history/{task_id}")
def delete_history_item(task_id: str):
  global download_history
  download_history = [item for item in download_history if item.get("id") != task_id]
  save_history()
  return {"status": "success"}

@app.post("/api/history/delete")
async def batch_delete_history(request: Request):
  global download_history
  data = await request.json()
  ids = data.get("ids", [])
  download_history = [item for item in download_history if str(item.get("id")) not in [str(i) for i in ids]]
  save_history()
  return {"status": "success"}

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
  file_path = os.path.join(TEMPFILES_DIR, filename)
  if os.path.exists(file_path):
    response = FileResponse(file_path, filename=filename)
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    return response
  return JSONResponse({"error": "File not found."}, status_code=404)

@app.get("/api/tempfiles/{filename}")
def serve_tempfile(filename: str):
  file_path = os.path.join(TEMPFILES_DIR, filename)
  if os.path.exists(file_path):
    response = FileResponse(file_path, filename=filename)
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    return response
  return JSONResponse({"error": "File not found or expired."}, status_code=404)

# Desktop operations
from fastapi import Request

@app.post("/api/desktop/open-file")
async def open_desktop_file(request: Request):
  data = await request.json()
  filepath = data.get("filepath")
  
  if not filepath or not os.path.exists(filepath):
    filename = data.get("filename")
    if not filename:
      return JSONResponse({"error": "File path or name required"}, status_code=400)
    
    # Fallback to recursively searching the YT Deluxe Downloads folder
    TARGET_DIR = os.path.join(get_downloads_folder(), "YT Deluxe Downloads")
    filepath = os.path.join(TARGET_DIR, filename)
    
    if not os.path.exists(filepath):
      # Try searching in subfolders (Videos, Music, Thumbnails)
      found = False
      for root, dirs, files in os.walk(TARGET_DIR):
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
  download_path = data.get("download_path")
  if download_path and os.path.exists(download_path):
    TARGET_DIR = os.path.join(download_path, "YT Deluxe Downloads")
  else:
    TARGET_DIR = os.path.join(get_downloads_folder(), "YT Deluxe Downloads")
    
  os.makedirs(TARGET_DIR, exist_ok=True)
  if os.path.exists(TARGET_DIR):
    try:
      subprocess.Popen(['explorer', os.path.normpath(TARGET_DIR)])
      return {"status": "success"}
    except Exception as e:
      return JSONResponse({"error": str(e)}, status_code=500)
  return JSONResponse({"error": "Folder not found"}, status_code=404)

import shutil

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
    print(f'WARNING: YTDELUXE_FRONTEND_DIR not set or invalid. Frontend will not be served.')

# Main entry point
if __name__ == "__main__":
  import uvicorn
  print(" Starting YT Deluxe Backend...")
  print(" API available at: http://localhost:8000")
  print(" API docs at: http://localhost:8000/docs")
  is_packaged = getattr(sys, 'frozen', False)
  uvicorn.run(app, host="0.0.0.0", port=8000, reload=not is_packaged)

