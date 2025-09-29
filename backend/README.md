# YT Deluxe Backend

A powerful FastAPI backend for YT Deluxe - a feature-rich YouTube downloader web app with glassmorphism UI.

## 🚀 Features

- **YouTube Search**: Search videos by keyword with smart suggestions
- **Video Details**: Get comprehensive video information and available formats
- **Download Management**: Download videos/audio with quality/format options
- **Video Trimming**: Trim videos using ffmpeg
- **Batch Downloads**: Download multiple videos simultaneously
- **Progress Tracking**: Real-time download progress monitoring
- **Download History**: Local storage of download history
- **File Renaming**: Custom filename support
- **Format Conversion**: MP4, MP3, and other format support

## 📋 Requirements

- Python 3.8+
- FFmpeg (for video processing)
- yt-dlp (for YouTube downloads)

## 🛠️ Installation

1. **Clone the repository** (if not already done)
2. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

3. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

4. **Activate virtual environment**:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

5. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

6. **Install FFmpeg**:
   - **Windows**: Download from [FFmpeg website](https://ffmpeg.org/download.html)
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`

## 🚀 Running the Backend

### Development Mode
```bash
python main.py
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📚 API Endpoints

### Search Videos
```http
GET /api/search?q=search_term
```
Returns a list of YouTube videos matching the search term.

### Get Video Details
```http
GET /api/video?url=youtube_url
```
Returns detailed information about a YouTube video including available formats.

### Download Video
```http
POST /api/download
```
Download a video with options:
- `url`: YouTube URL (required)
- `quality`: Video quality (optional)
- `format`: Output format (mp3, mp4, etc.)
- `trim_start`: Start time for trimming (seconds)
- `trim_end`: End time for trimming (seconds)
- `rename`: Custom filename

### Batch Download
```http
POST /api/batch-download
```
Download multiple videos:
- `urls`: List of YouTube URLs
- `quality`: Video quality for all downloads
- `format`: Output format for all downloads

### Download Progress
```http
GET /api/progress/{task_id}
```
Get real-time progress of a download task.

### Download History
```http
GET /api/history
```
Get list of all downloaded videos.

### Submit Feedback
```http
POST /api/feedback
```
Submit user feedback:
- `feedback`: Feedback text

### Legal Disclaimer
```http
GET /api/legal
```
Get legal disclaimer text.

### Serve Downloaded Files
```http
GET /api/downloads/{filename}
```
Download a file from the downloads directory.

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)

### File Structure
```
backend/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── downloads/          # Downloaded files directory
├── download_history.json # Download history (auto-generated)
└── README.md          # This file
```

## 🎯 Usage Examples

### Search for Videos
```bash
curl "http://localhost:8000/api/search?q=python+tutorial"
```

### Get Video Details
```bash
curl "http://localhost:8000/api/video?url=https://www.youtube.com/watch?v=VIDEO_ID"
```

### Download Video
```bash
curl -X POST "http://localhost:8000/api/download" \
  -F "url=https://www.youtube.com/watch?v=VIDEO_ID" \
  -F "quality=720" \
  -F "format=mp4"
```

### Download with Trimming
```bash
curl -X POST "http://localhost:8000/api/download" \
  -F "url=https://www.youtube.com/watch?v=VIDEO_ID" \
  -F "trim_start=30" \
  -F "trim_end=120" \
  -F "rename=my_video"
```

## 🔒 Legal Notice

This tool is for personal use only. Downloading copyrighted content may violate YouTube's terms of service. Use responsibly and respect copyright laws.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes. Please respect YouTube's terms of service and copyright laws.

## 🆘 Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the error logs
3. Ensure FFmpeg is properly installed
4. Verify YouTube URLs are accessible

---

**Happy Downloading! 🎉** 