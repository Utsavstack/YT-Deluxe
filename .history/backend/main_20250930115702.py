from fastapi import FastAPI, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uuid
import os
import subprocess
from yt_dlp import YoutubeDL
from datetime import datetime
import json

app = FastAPI(title="YT Deluxe Backend")

# Allow CORS for frontend (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory stores for demo (replace with persistent storage as needed) ---
download_tasks = {}
download_history = []
feedback_list = []

# --- Endpoint: Search YouTube (by keyword) ---
@app.get("/api/search")
def search_videos(q: str):
    try:
        ydl_opts = {
            'quiet': True,
            'extract_flat': True,
            'skip_download': True,
            'cookiesfrombrowser': ('chrome',),  # Try to use Chrome cookies
            'extractor_args': {
                'youtube': {
                    'player_client': ['web', 'android', 'mobile'],
                }
            },
            'nocheckcertificate': True,
            'ignoreerrors': True,
            'no_warnings': True,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Dest': 'document',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        }
        with YoutubeDL(ydl_opts) as ydl:
            # ytsearch10 returns top 10 results
            search_result = ydl.extract_info(f"ytsearch10:{q}", download=False)
        videos = []
        for entry in search_result.get('entries', []):
            videos.append({
                'id': entry.get('id'),
                'title': entry.get('title'),
                'url': f"https://www.youtube.com/watch?v={entry.get('id')}",
                'thumbnail': entry.get('thumbnail'),
                'duration': entry.get('duration'),
                'uploader': entry.get('uploader'),
            })
        return {"results": videos}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
# --- Endpoint: Get video details (by URL) ---
@app.get("/api/video")
def get_video_details(url: str):
    try:
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'cookiesfrombrowser': ('chrome',),  # Try to use Chrome cookies
            'extractor_args': {
                'youtube': {
                    'player_client': ['web', 'android', 'mobile'],
                }
            },
            'nocheckcertificate': True,
            'ignoreerrors': True,
            'no_warnings': True,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Dest': 'document',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        }
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        formats = []
        for f in info.get('formats', []):
            formats.append({
                'format_id': f.get('format_id'),
                'ext': f.get('ext'),
                'resolution': f.get('resolution') or f.get('height') or 'N/A',
                'filesize': f.get('filesize'),
                'format_note': f.get('format_note', ''),
                'vcodec': f.get('vcodec', 'none'),
                'acodec': f.get('acodec', 'none'),
            })
        video = {
            'id': info.get('id'),
            'title': info.get('title'),
            'thumbnail': info.get('thumbnail'),
            'duration': info.get('duration'),
            'uploader': info.get('uploader'),
            'description': info.get('description'),
            'formats': formats,
        }
        return {"video": video}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# --- Endpoint: Download video/audio (with options) ---
@app.post("/api/download")
def download_video(
    url: str = Form(...),
    quality: Optional[str] = Form(None),
    format: Optional[str] = Form(None),
    trim_start: Optional[float] = Form(None),
    trim_end: Optional[float] = Form(None),
    rename: Optional[str] = Form(None),
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
            trim_start, trim_end, rename
        )
        
        return {"task_id": task_id, "message": "Download started successfully."}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# --- Download worker function ---
def download_worker(task_id: str, url: str, quality: str = None, 
                   format: str = None, trim_start: float = None, 
                   trim_end: float = None, rename: str = None):
    try:
        download_tasks[task_id]["status"] = "downloading"
        
        # Get video info first
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'cookiesfrombrowser': ('chrome',),  # Try to use Chrome cookies
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Dest': 'document',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        }
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        
        # Determine output filename
        if rename:
            base_filename = rename
        else:
            base_filename = info.get('title', 'video')
            # Clean filename for filesystem
            base_filename = "".join(c for c in base_filename if c.isalnum() or c in (' ', '-', '_')).rstrip()
        
        # Set format based on quality preference
        if format == "mp3":
            output_template = f"downloads/{base_filename}.%(ext)s"
            ydl_opts = {
                'outtmpl': output_template,
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    ' preferredquality': '192',
                }],
                'progress_hooks': [lambda d: progress_hook(d, task_id)],
                'extractor_args': {
                    'youtube': {
                        'player_client': ['android', 'web', 'mobile'],
                    }
                },
                'retries': 10,
                'fragment_retries': 10,
                'ignoreerrors': True,
                'no_warnings': True,
                'nocheckcertificate': True,
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Sec-Fetch-Mode': 'navigate',
                    'Referer': 'https://www.youtube.com/'
                }
            }
        else:
            # Video download
            if quality:
                format_spec = f"best[height<={quality}]/best"
            else:
                format_spec = "best"
            
            output_template = f"downloads/{base_filename}.%(ext)s"
            ydl_opts = {
                'outtmpl': output_template,
                'format': format_spec,
                'progress_hooks': [lambda d: progress_hook(d, task_id)],
                'extractor_args': {
                    'youtube': {
                        'player_client': ['web', 'android', 'mobile']
                    }
                },
                'retries': 10,
                'fragment_retries': 10,
                'ignoreerrors': True,
                'no_warnings': True,
                'nocheckcertificate': True,
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Sec-Fetch-Mode': 'navigate',
                    'Referer': 'https://www.youtube.com/'
                }
            }
        
        # Download the file
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        # Find the downloaded file (fix: match with spaces and special characters, case-insensitive)
        downloaded_files = [
            f for f in os.listdir("downloads")
            if f.lower().startswith(base_filename.lower())
        ]
        
        if downloaded_files:
            filename = downloaded_files[0]
            filepath = os.path.join("downloads", filename)
            
            # Apply trimming if specified
            if trim_start is not None or trim_end is not None:
                trimmed_filename = f"trimmed_{filename}"
                trimmed_filepath = os.path.join("downloads", trimmed_filename)
                
                # Use ffmpeg to trim
                cmd = ["ffmpeg", "-i", filepath, "-y"]
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
            
            # Update task status
            download_tasks[task_id].update({
                "status": "completed",
                "progress": 100,
                "filename": filename,
                "filepath": filepath,
                "completed_at": datetime.now().isoformat()
            })
            
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
                "downloaded_at": datetime.now().isoformat(),
                "file_size": os.path.getsize(filepath) if os.path.exists(filepath) else 0,
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
        
        # Update batch progress if this is part of a batch
        batch_id = download_tasks[task_id].get("batch_id")
        if batch_id and batch_id in download_tasks:
            batch_task = download_tasks[batch_id]
            batch_task["failed_urls"] += 1

# --- Progress hook for yt-dlp ---
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
                "progress": round(progress, 2),  # Round to 2 decimal places for more precision
                "speed": speed,                 # Download speed in bytes per second
                "eta": eta,                     # Estimated time remaining in seconds
                "downloaded_bytes": d.get('downloaded_bytes', 0),
                "total_bytes": d.get('total_bytes') or d.get('total_bytes_estimate', 0)
            })

# --- Endpoint: Download progress ---
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
        "error": task.get("error"),
        "started_at": task.get("started_at"),
        "completed_at": task.get("completed_at"),
        "speed": task.get("speed", 0),
        "eta": task.get("eta", 0),
        "downloaded_bytes": task.get("downloaded_bytes", 0),
        "total_bytes": task.get("total_bytes", 0)
    }

# --- Save history to file ---
def save_history():
    try:
        with open("download_history.json", "w") as f:
            json.dump(download_history, f, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")

# --- Load history from file ---
def load_history():
    try:
        if os.path.exists("download_history.json"):
            with open("download_history.json", "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading history: {e}")
    return []

# --- Endpoint: Download history ---
@app.get("/api/history")
def get_history():
    return {"history": download_history}

# --- Initialize history on startup ---
download_history = load_history()

# --- Endpoint: Batch download ---
@app.post("/api/batch-download")
def batch_download(
    urls: List[str] = Form(...),
    quality: Optional[str] = Form(None),
    format: Optional[str] = Form(None),
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
                None, None, None  # No trim/rename for batch
            )
        
        return {"batch_id": batch_id, "message": f"Batch download started for {len(urls)} videos."}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# --- Endpoint: Feedback submission ---
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

# --- Endpoint: Legal disclaimer ---
@app.get("/api/legal")
def get_legal():
    disclaimer = "This tool is for personal use only. Downloading copyrighted content may violate YouTube's terms of service. Use responsibly."
    return {"disclaimer": disclaimer}

# --- Static file serving for downloads (optional) ---
@app.get("/api/downloads/{filename}")
def serve_download(filename: str):
    file_path = os.path.join("downloads", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    return JSONResponse({"error": "File not found."}, status_code=404)

# --- Main entry point ---
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting YT Deluxe Backend...")
    print("📡 API available at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

