# YT Deluxe

A full-stack, feature-rich YouTube downloader and media management web application with a modern glassmorphism UI. Built with a cutting-edge React frontend and a robust FastAPI backend, YT Deluxe empowers users to search, preview, and download YouTube videos and audio with advanced options.

---

## 🌟 Key Features

### Frontend

- **React 18**: Modern, concurrent UI with hooks and functional components.
- **Vite**: Ultra-fast development and build tool.
- **Redux Toolkit**: Simplified, scalable state management.
- **TailwindCSS**: Utility-first, highly customizable styling.
- **React Router v6**: Seamless, declarative routing.
- **D3.js & Recharts**: Powerful, interactive data visualizations.
- **React Hook Form**: Efficient, scalable form management.
- **Framer Motion**: Smooth, delightful UI animations.
- **Jest & React Testing Library**: Robust testing setup.
- **Responsive Design**: Mobile-first, fluid layouts.

### Backend

- **FastAPI**: High-performance, async Python API.
- **yt-dlp**: Advanced YouTube video/audio extraction.
- **FFmpeg**: Video/audio processing and trimming.
- **YouTube Search**: Search videos by keyword with smart suggestions.
- **Video Details**: Get comprehensive video information and available formats.
- **Download Management**: Download videos/audio with quality/format options.
- **Video Trimming**: Trim videos using ffmpeg.
- **Batch Downloads**: Download multiple videos simultaneously.
- **Progress Tracking**: Real-time download progress monitoring.
- **Download History**: Local storage of download history.
- **File Renaming**: Custom filename support.
- **Format Conversion**: MP4, MP3, and other format support.
- **CORS Enabled**: Secure frontend-backend communication.

---

## 🖼️ Demo

> _Add screenshots or a GIF here to showcase the UI and features!_

---

## 📁 Project Structure

```
yt-deluxe/
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules
├── .nvmrc                      # Node version config
├── README.md                   # This file
│
├── frontend/                   # React app (Vite + TailwindCSS)
│   ├── index.html              # HTML entry point
│   ├── package.json            # NPM dependencies & scripts
│   ├── vite.config.mjs         # Vite build config
│   ├── tailwind.config.js      # Tailwind theme & plugins
│   ├── postcss.config.js       # PostCSS config
│   ├── jsconfig.json           # JS path aliases
│   ├── public/                 # Static assets
│   │   ├── assets/             # Public assets
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── robots.txt
│   └── src/
│       ├── index.jsx           # Entry point
│       ├── App.jsx             # Main app component
│       ├── Routes.jsx          # App routes
│       ├── components/         # Reusable UI components
│       │   ├── AppIcon.jsx
│       │   ├── AppImage.jsx
│       │   ├── ErrorBoundary.jsx
│       │   ├── ScrollToTop.jsx
│       │   └── ui/             # Core UI components
│       │       ├── Button.jsx
│       │       ├── Checkbox.jsx
│       │       ├── Header.jsx
│       │       ├── Input.jsx
│       │       ├── ProgressNotification.jsx
│       │       └── Select.jsx
│       ├── pages/              # Feature pages
│       │   ├── NotFound.jsx
│       │   ├── home-search-dashboard/
│       │   ├── video-details-download/
│       │   ├── batch-download-manager/
│       │   ├── download-history-management/
│       │   ├── user-authentication/
│       │   └── user-settings-preferences/
│       ├── styles/             # Global styles & assets
│       │   ├── index.css
│       │   ├── tailwind.css
│       │   └── YT-Deluxe_logo.png
│       └── utils/              # Utility functions
│           ├── api.js          # API client
│           └── cn.js           # Classname helper
│
└── backend/                    # FastAPI backend
    ├── main.py                 # API entry point (all endpoints)
    ├── requirements.txt        # Python dependencies
    ├── cookies.txt             # YouTube auth cookies
    ├── downloads/              # Downloaded files directory
    ├── download_history.json   # Download history (auto-generated)
    └── feedback.json           # User feedback (auto-generated)
```

---

## 🚀 Getting Started

### Prerequisites

- **nvm**: 1.2.2
- **Node.js**: v20.20.0 (LTS)
- **npm**: (bundled with Node.js)
- **Python**: 3.8+
- **FFmpeg**: Required for video/audio processing

---

## 📦 Tech Stack & Dependencies

### Frontend Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | ^18.2.0 | UI library |
| react-dom | ^18.2.0 | React DOM renderer |
| react-router-dom | 6.0.2 | Client-side routing |
| @reduxjs/toolkit | ^2.6.1 | State management |
| redux | ^5.0.1 | State container |
| axios | ^1.8.4 | HTTP client |
| framer-motion | ^10.16.4 | UI animations |
| d3 | ^7.9.0 | Data visualization |
| recharts | ^2.15.2 | Chart components |
| react-hook-form | ^7.55.0 | Form handling |
| react-helmet | ^6.1.0 | Document head manager |
| lucide-react | ^0.484.0 | Icon library |
| clsx | ^2.1.1 | Classname utility |
| class-variance-authority | ^0.7.1 | Component variants |
| tailwind-merge | ^3.3.1 | Tailwind class merging |
| date-fns | ^4.1.0 | Date utilities |

### Frontend Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| vite | ^6.4.1 | Build tool |
| @vitejs/plugin-react | ^4.7.0 | React plugin for Vite |
| tailwindcss | 3.4.6 | Utility-first CSS |
| autoprefixer | 10.4.2 | CSS vendor prefixing |
| postcss | ^8.5.6 | CSS transformations |
| @tailwindcss/typography | ^0.5.16 | Typography plugin |
| @tailwindcss/forms | ^0.5.7 | Form styles plugin |
| @tailwindcss/aspect-ratio | ^0.4.2 | Aspect ratio plugin |
| @tailwindcss/container-queries | ^0.1.1 | Container queries |
| tailwindcss-animate | ^1.0.7 | Animation utilities |
| tailwindcss-fluid-type | ^2.0.7 | Fluid typography |
| tailwindcss-elevation | ^2.0.0 | Elevation/shadow utilities |

### Backend Dependencies

| Package | Version | Purpose |
|---|---|---|
| fastapi | 0.133.0 | High-performance async API |
| uvicorn[standard] | 0.41.0 | ASGI server |
| yt-dlp | 2026.2.21 | YouTube video/audio extraction |
| python-multipart | 0.0.22 | Form data parsing |
| aiofiles | 25.1.0 | Async file operations |
| requests | 2.32.5 | HTTP requests (video streaming) |

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev         # or: npm start
```

### Backend Setup

```bash
cd backend
python -m venv .venv
# Activate the venv:
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
# Make sure FFmpeg is installed and in your PATH
# Install FFmpeg:
#   Windows: Download from https://ffmpeg.org/download.html
#   macOS: brew install ffmpeg
#   Ubuntu/Debian: sudo apt install ffmpeg
uvicorn main:app --reload    # Dev mode
# or for production:
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🔗 Connecting Frontend & Backend

- By default, the frontend expects the backend API at `http://localhost:8000`.
- CORS is enabled for local development.
- Adjust API endpoints in the frontend if your backend runs on a different host/port.

---

## 🧩 Usage Guide

### Search for Videos

- Enter keywords in the search bar to get YouTube results with thumbnails, titles, and durations.
- API: `GET /api/search?q=search_term`

### View Video Details

- Click a video to see all available formats, resolutions, and metadata.
- API: `GET /api/video?url=youtube_url`

### Download Options

- Choose format (mp4, mp3, etc.), quality, and optionally trim the video.
- Batch download: Paste multiple URLs.
- Rename files before downloading.
- API: `POST /api/download` and `POST /api/batch-download`

### Track Progress

- Real-time progress bars for each download.
- View download history and re-download files.
- API: `GET /api/progress/{task_id}` and `GET /api/history`

### Submit Feedback

- Use the feedback form to send suggestions or report issues.
- API: `POST /api/feedback`

---

## 🛠️ API Reference

| Endpoint                | Method | Description                        |
|-------------------------|--------|------------------------------------|
| `/api/search`           | GET    | Search YouTube by keyword          |
| `/api/video`            | GET    | Get video details by URL           |
| `/api/download`         | POST   | Download video/audio with options  |
| `/api/batch-download`   | POST   | Download multiple videos           |
| `/api/progress/{id}`    | GET    | Get download progress              |
| `/api/history`          | GET    | List download history              |
| `/api/feedback`         | POST   | Submit user feedback               |
| `/api/legal`            | GET    | Get legal disclaimer               |
| `/api/downloads/{file}` | GET    | Download a file                    |

### API Usage Examples

#### Search for Videos

```bash
curl "http://localhost:8000/api/search?q=python+tutorial"
```

#### Get Video Details

```bash
curl "http://localhost:8000/api/video?url=https://www.youtube.com/watch?v=VIDEO_ID"
```

#### Download Video

```bash
curl -X POST "http://localhost:8000/api/download" \
  -F "url=https://www.youtube.com/watch?v=VIDEO_ID" \
  -F "quality=720" \
  -F "format=mp4"
```

#### Download with Trimming

```bash
curl -X POST "http://localhost:8000/api/download" \
  -F "url=https://www.youtube.com/watch?v=VIDEO_ID" \
  -F "trim_start=30" \
  -F "trim_end=120" \
  -F "rename=my_video"
```

#### Batch Download

```bash
curl -X POST "http://localhost:8000/api/batch-download" \
  -F "urls=[\"https://www.youtube.com/watch?v=ID1\",\"https://www.youtube.com/watch?v=ID2\"]" \
  -F "quality=720" \
  -F "format=mp4"
```

#### Download Progress

```bash
curl "http://localhost:8000/api/progress/{task_id}"
```

#### Download History

```bash
curl "http://localhost:8000/api/history"
```

#### Submit Feedback

```bash
curl -X POST "http://localhost:8000/api/feedback" -F "feedback=Great app!"
```

#### Legal Disclaimer

```bash
curl "http://localhost:8000/api/legal"
```

#### Download a File

```bash
curl -O "http://localhost:8000/api/downloads/{filename}"
```

---

## 🔧 Backend Configuration

### Environment Variables

- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)

### Backend File Structure

```
backend/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── downloads/           # Downloaded files directory
├── download_history.json # Download history (auto-generated)
└── README.md            # Backend documentation
```

---

## 🎨 Styling & Customization

- **TailwindCSS**: Easily customize themes, breakpoints, and animations.
- **Plugins**: Forms, typography, aspect ratio, container queries, and more.
- **Fluid Typography**: Responsive text scaling.

---

## 📦 Deployment

### Frontend

```bash
cd frontend
npm run build       # Output in dist/
npm run serve       # Preview production build
```

### Backend

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Quick Reference Commands

| Action | Command |
|---|---|
| Frontend dev server | `npm run dev` or `npm start` |
| Frontend build | `npm run build` |
| Frontend preview | `npm run serve` |
| Backend dev server | `uvicorn main:app --reload` |
| Backend production | `uvicorn main:app --host 0.0.0.0 --port 8000` |

---

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## ⚖️ Legal Notice

This tool is for personal use only. Downloading copyrighted content may violate YouTube’s terms of service. Use responsibly and respect copyright laws.

---

## 📄 License

This project is for educational purposes. Please respect YouTube’s terms of service and copyright laws.

---

## 🆘 Support

For issues and questions:

1. Check the API documentation at `/docs`
2. Review the error logs
3. Ensure FFmpeg is properly installed
4. Verify YouTube URLs are accessible

---

**Made With ❤️ UP7**

_Last Updated: February 2026_
