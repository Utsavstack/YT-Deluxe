from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from yt_dlp import YoutubeDL
import os, uuid, logging

app = FastAPI()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure downloads directory exists
os.makedirs("downloads", exist_ok=True)

def get_video_info(url: str):
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'extract_flat': False,
    }
    try:
        with YoutubeDL(ydl_opts) as ydl:
            return ydl.extract_info(url, download=False)
    except Exception as e:
        logger.error(f"Error fetching video info: {e}")
        raise HTTPException(status_code=400, detail="Invalid URL or video unavailable")

@app.post("/get-formats")
def get_formats(url: str = Form(...)):
    try:
        info = get_video_info(url)
        formats = []
        
        for f in info['formats']:
            # Skip unsupported formats
            if f.get('filesize') is None:
                continue
                
            # Skip DASH formats without codec info
            if not f.get('vcodec') and not f.get('acodec'):
                continue
                
            formats.append({
                "format_id": f['format_id'],
                "ext": f['ext'],
                "resolution": f.get('resolution') or f.get('height') or "N/A",
                "filesize": f.get('filesize', 0),
                "format_note": f.get('format_note', ''),
                "vcodec": f.get('vcodec', 'none'),
                "acodec": f.get('acodec', 'none'),
            })
        
        return JSONResponse(content={
            "title": info['title'],
            "thumbnail": info.get('thumbnail'),
            "formats": formats
        })
    except Exception as e:
        logger.error(f"Error in get_formats: {e}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@app.post("/download")
def download_video(url: str = Form(...), format_id: str = Form(...)):
    try:
        # Get format details
        info = get_video_info(url)
        selected_format = next(
            (f for f in info['formats'] if f['format_id'] == format_id), 
            None
        )
        
        if not selected_format:
            raise HTTPException(status_code=400, detail="Invalid format selected")
        
        # Determine if we need audio merge
        needs_audio_merge = (
            selected_format.get('vcodec') != 'none' and 
            selected_format.get('acodec') == 'none'
        )
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.%(ext)s"
        output_path = os.path.join("downloads", filename)
        
        # Configure download options
        
        ydl_opts = {
            'outtmpl': output_path,
            'quiet': True,
            'format': format_id,
            'merge_output_format': 'mp4',
             'ffmpeg_location': r'C:\ffmpeg\ffmpeg.exe',   # Update this path if needed
        } 
        
        # Add audio stream if needed
        if needs_audio_merge:
            ydl_opts['format'] = f'{format_id}+bestaudio'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }]
        
        # Download the file
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            real_path = ydl.prepare_filename(ydl.extract_info(url, download=False))
        
        # Find the actual downloaded file
        for file in os.listdir('downloads'):
            if file.startswith(os.path.basename(real_path).split('.')[0]):
                final_path = os.path.join('downloads', file)
                break
        else:
            raise FileNotFoundError("Downloaded file not found")
        
        # Send file to user
        return FileResponse(
            final_path,
            filename=f"{info['title']}.{file.split('.')[-1]}",
            media_type='video/mp4' if 'video' in file else 'audio/mpeg'
        )
        
    except Exception as e:
        logger.error(f"Download error: {e}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)