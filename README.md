# YT Deluxe

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![pywebview](https://img.shields.io/badge/pywebview-FFD43B?style=for-the-badge&logo=python&logoColor=blue)](https://pywebview.flowrl.com)
[![yt-dlp](https://img.shields.io/github/v/release/yt-dlp/yt-dlp?label=yt-dlp&logo=youtube&logoColor=red&style=for-the-badge)](https://github.com/yt-dlp/yt-dlp)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org)
[![PO Token Provider](https://img.shields.io/github/v/release/Brainicism/bgutil-ytdlp-pot-provider?label=PO%20Token%20Provider&style=for-the-badge)](https://github.com/Brainicism/bgutil-ytdlp-pot-provider)

**YT Deluxe** is a Free & OpenSource, Full-stack, Feature-rich YouTube Downloader and Media Management Web Application with a premium **"Liquid Glass"** UI. Built with a React frontend and a robust FastAPI backend, **YT Deluxe** empowers users to search, preview, and download YouTube videos and audio with a streamlined, premium experience.

---

## 1. Why YT Deluxe?

### 1.1 The Problem

In today’s digital-first world, YouTube is one of the largest sources of video and audio content. However, YouTube itself does not allow direct downloading for offline use, creating significant inconvenience for learners, creators, and researchers. Most existing third-party downloaders are plagued with intrusive ads, malware risks, confusing interfaces, and limited format options.

### 1.2 The Solution

**YT-Deluxe** is envisioned as a clean, ad-free, free and and open source feature-rich media management system. It provides a secure environment for users to preserve digital content in multiple qualities and formats. By leveraging a state-of-the-art **"Liquid Glass"** interface and a robust backend architecture, it bridges the gap between raw technical power and premium user experience.

---

## 2. Features Overview

### 2.1 Frontend (Modern UI)

- **React 18 & Vite**: Ultra-fast, responsive UI leveraging modern concurrent rendering and hooks.
- **Liquid Glass Design Language**: Premium, high-blur, and transparent styling via TailwindCSS with **`rounded-xl`** geometry for consistent modern aesthetics.
- **Multilingual & Hinglish Support**: Native support for English, Hindi, German, and conversational **Hinglish** (Hindi-English) with persistent state synchronization.
- **Dynamic Mode Detection**: React automatically switches UI features (like local paths) based on the `isDesktop` environment flag.
- **Framer Motion**: Smooth, high-performance UI animations, including premium 'Sliding Pill' tab transitions and entrance effects.
- **Integrated Legal Hub**: Dedicated informational sections for About, Privacy Policy, and Terms & Conditions directly inside the app.
- **Lucide Icons**: Clean, light-weight, and professional-grade icon library.

### 2.2 Backend (Advanced Engine)

- **FastAPI Core**: Blazing fast asynchronous processing with comprehensive endpoint management.
- **Advanced yt-dlp Extractor**: Robust video/audio fetching with **PO Token** (Proof of Origin) support to bypass bot detection.
- **Integrated FFmpeg Merge**: Seamlessly merges high-res (1080p+) DASH video/audio streams into a single high-quality file.
- **Unified Download Engine**: On Windows Desktop, files are natively routed to your `Downloads` folder, with an "Open Folder" feature.
- **Thumbnail API Proxy**: Bypasses CORS and environment restrictions in desktop mode by routing image downloads through a secure backend proxy.
- **Precision Trimming**: Trim specific segments from your downloads with no quality re-encoding loss, featuring **MM:SS** time formatting.
- **Streamlined Preferences**: Removed technical "Advanced" overhead to focus on a cleaner, simplified user experience.
- **Progress Tracking**: Real-time download speed, percentage, and ETA polling.
- **History Persistence**: User downloads are logged and persist across sessions (JSON on Desktop, LocalStorage on Web).
- **Auto-Cleanup Daemon**: Server-side temp files are wiped after delivery to ensure data privacy and prevent bloating.
- **CORS Enabled**: Secure communication between frontend and backend.

---

## 3. Demo

> _Add screenshots or a GIF here to showcase the UI and features!_

---

## 4. Project Structure

```text
yt-deluxe/
├── .env            # Environment variables
├── .gitignore         # Git ignore rules
├── README.md          # This file
│
├── frontend/          # React app (Vite + TailwindCSS)
│  ├── package.json      # NPM dependencies & scripts
│  ├── vite.config.mjs     # Vite build config
│  └── src/
│    ├── pages/       # Core UI (Search, Details, History, Settings)
│    ├── components/     # Reusable UI parts
│    └── utils/api.js    # Backend communication client
│
├── backend/          # FastAPI application
│  ├── main.py         # Routes, FFmpeg execution, Background Tasks
│  ├── requirements.txt    # Python module dependencies
│  └── tempfiles/       # Ephemeral processing directory
│
└── desktop/          # Native Windows Wrappers
   ├── launcher.py       # Spawns Backend & PyWebView window
   ├── build.spec       # PyInstaller build config
   └── installer/       # Inno Setup 6 Distribution Scripts
       └── setup.iss     # Builds the final .exe Windows Installer
```

---

## 5. Architecture & Workflows

### 5.1 Unified Download Flow (yt-dlp to User Output)

_How a video converts from a YouTube URL into a file on your device._

```mermaid
flowchart TD
    UI[User Clicks Download] --> API[Backend API Receives Request]
    API --> YTDLP[yt-dlp fetches Metadata & Streams]
    
    YTDLP -- Resolution <= 720p --> Stream[Direct Single Stream File]
    YTDLP -- Resolution >= 1080p / Trimming --> Split[Separate Video & Audio Streams]
    
    Split --> FFMPEG[FFmpeg Processes & Merges Streams]
    FFMPEG --> Temp[Temporary Multiplexed .mp4/.mp3 File]
    Stream --> Temp
    
    Temp --> Output{Environment Check \n isDesktop flag}
    Output -- Web App Mode --> Web[Browser Triggers Download \n File Saves to Default Downloads]
    Output -- Windows Desktop Mode --> PC[File Moves to Local \n YT Deluxe Downloads/Videos]
```

**Detailed Step-by-Step Flow Explanation:**

1. **Request Initiation**: When a user selects a format and clicks Download, the React frontend sends a `POST` request to the `/api/download` endpoint with the video URL and selected quality parameters.
2. **Metadata Extraction**: The FastAPI backend invokes `yt-dlp` to fetch metadata. If a "PO Token" is required to bypass bot detection, it is automatically generated and injected into the request.
3. **Stream Selection Logic**:
   - **Standard Quality (<= 720p)**: YouTube provides these as "progressive" streams (Video and Audio combined). The app downloads this as a single coherent file directly to the temporary processing directory.
   - **High Quality (>= 1080p) & MP3**: YouTube serves these as separate "DASH" streams. The background task downloads the high-res video (without audio) and the high-bitrate audio (without video) as two distinct temporary files.
4. **Processing & Merging (FFmpeg)**:
   - If streams were split (High Quality), `FFmpeg` is automatically triggered to multiplex (merge) the video and audio into a single `.mp4` container.
   - If "Trimming" was requested, `FFmpeg` cuts the file at the specified `start` and `end` timestamps without re-encoding when possible, ensuring zero quality loss.
5. **Environment Check (`isDesktop` Flag)**:
   - **Web Mode**: Once the file is ready in the `tempfiles/` folder, the backend returns a success status. The frontend then uses a hidden `<a>` tag to trigger a native browser download, saving the file to the user's default browser downloads folder.
   - **Desktop Mode**: The `isDesktop` flag (detected via `window.pywebview`) tells the backend to handle the file writes natively. The file is downloaded directly to the user's local `YT Deluxe Downloads/` subdirectories (Videos, Music, or Thumbnails) instead of a temporary folder. The user can then click "Open in Explorer" in the UI to trigger a background API call that natively highlights the file in Windows Explorer.
6. **Auto-Cleanup**: After the user receives the file, a self-destruct timer wipes the file from the server's temporary storage to keep it lightweight.

---

### 5.2 Download Architecture Details

The application uses a sophisticated **Server-Merged Tempfile Architecture** to ensure the smoothest user experience:

1. **Background Tasks**: All extraction (including `<720p` progressive and `1080p+` DASH formats) occurs in a robust background worker inside the FastAPI backend.
2. **WebSocket/Polling Progress**: Frontend seamlessly pulls download speed, ETA, and progress from the backend without heavy page reloads, showing a smooth in-app progress bar.
3. **Seamless Native Delivery**: Upon 100% completion in the backend `tempfiles` directory, the UI assesses the `{Environment Check}` via the `isDesktop` flag (detected through `window.pywebview`).
    - **Web Form**: A hidden `<a download>` tag silently triggers the browser's native file saving window.
    - **Desktop Form**: FastAPI natively saves the file directly to your Custom Download Directory. An "Open Folder" button in the UI can execute a foreground Windows Explorer window to highlight the file.
4. **Auto-Cleanup**: A background threading daemon automatically sets self-destruct timers for completed files, wiping them from the `tempfiles` folder exactly 10 minutes after download to eliminate permanent server storage bloat.
5. **Anti-Bot Engine (PO Tokens)**: Deeply integrates a Node.js-based HTTP server inside the container alongside FastAPI that silently negotiates Proof-of-Origin limits with YouTube via mobile web profiles, effectively avoiding `HTTP 403 Forbidden` bans.
6. **Hybrid Architecture (`isDesktop`)**: Automatically detects if it's running in a browser or as an installed Windows app via `window.pywebview` presence. This detection dictates the **{Environment Check}** step in the workflow altering features (like hiding Storage Settings on the Web) seamlessly.
7. **Hybrid Storage & History Handling**:
   - `tempfiles/`: Used internally by the backend for processing FFmpeg merges.
   - `localStorage`: Fast, isolated history storage specifically for Web deployments.
   - `~/.yt-deluxe/`: Persistent local JSON for Desktop installations.

### 5.3 End-to-End System Structure

_How the entire platform communicates during a download lifecycle._

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant YouTube (yt-dlp)
    
    User->>Frontend: Submit URL
    Frontend->>Backend: Request Download Status
    Backend->>YouTube: Validate URL & Fetch Formats
    YouTube-->>Backend: Return Available Audio/Video
    Backend-->>Frontend: Send Formats to UI
    User->>Frontend: Select 1080p & Hit Download
    Frontend->>Backend: POST /api/download
    Backend-->>Frontend: Return Progress Tracking ID
    Backend->>YouTube: Download Raw Streams to Temp Folder
    Backend->>Backend: FFmpeg Merges Audio/Video
    Backend-->>Frontend: Progress Reaches 100%
    Frontend->>User: Deliver Media File
```

**End-to-End Sequence Breakdown:**

1. **Discovery**: The user enters a search term or URL. The frontend calls the backend which uses `yt-dlp` to fetch all available metadata (resolutions, formats, thumbnails).
2. **Configuration**: The backend sends the available formats back to the UI. The user selects their desired quality (e.g., 1080p MP4) and optional settings like "Trimming".
3. **Task Initiation**: Clicking "Download" sends a `POST` request. The backend initializes a `Background Task`, generates a unique `task_id`, and returns it immediately to the frontend.
4. **Active Processing**: While the backend is busy downloading and merging streams using FFmpeg, the frontend uses the `task_id` to poll for real-time progress updates.
5. **Final Delivery**: Once progress reaches 100%, the backend prepares the final file. The frontend then triggers the final download/move logic based on the detected environment.

---

### 5.4 Hosted Web Application Architecture

_How the platform operates when hosted on cloud servers._

```mermaid
flowchart LR
    subgraph Client Browser
        UI[React Frontend]
        Local[localStorage / History]
    end
    
    subgraph Cloud Server Infrastructure
        API[FastAPI Backend]
        Temp[Volatile tempfiles/ Dir]
        YTDLP[yt-dlp + FFmpeg Core]
    end
    
    UI <--> |API Requests / Polling| API
    API --> YTDLP
    YTDLP --> Temp
    Temp -- Final Media Stream --> UI
    UI -- Log Action --> Local
```

**Web Deployment Workflow:**

- **Client Layer**: The React frontend is served as static assets. It uses `localStorage` for local persistence of history and settings, ensuring that user data stays private and localized to their browser.
- **API Layer**: The FastAPI backend handles heavy lifting. It must be hosted on a service that supports persistent or scale-to-zero compute with `FFmpeg` installed.
- **Volatile Storage**: The `tempfiles/` directory acts as a high-speed workspace for stream merging. Files here are ephemeral and auto-deleted after 10 minutes to maintain server health.
- **Streaming**: The final file is streamed back to the user via an HTTP `FileResponse`, allowing the browser to handle the bitstream as a standard file download.

---

### 5.5 Native Windows Desktop Architecture

_How the platform operates when installed locally as an .exe via the Launcher._

```mermaid
flowchart TD
    subgraph User PC
        Exe[YT-Deluxe-Setup.exe]
        Launcher[launcher.py Spawns Processes]
        WebView[PyWebView Chromium Window]
        API["Locally Bundled Backend server\n(also serves Frontend via HTTP)"]
        
        Disk[(YT Deluxe Downloads / \n Videos, Music, Thumbnails)]
        Hist[(~/.yt-deluxe/download_history.json)]
    end
    
    Exe --> |Installs| Launcher
    Launcher --> |Starts Background| API
    Launcher --> |"Opens http://127.0.0.1:8000"| WebView
    WebView <--> |"HTTP Requests (same origin)"| API
    API -- Saves Raw Files --> Disk
    API -- Read/Writes --> Hist
```

**Desktop Integration Workflow:**

- **HTTP-Based Frontend Serving**: In packaged mode, the backend statically serves the React build at `http://127.0.0.1:8000`. The PyWebView wrapper loads this URL instead of a `file:///` path. This provides a valid HTTP origin, which is **critical** for YouTube iframe embeds (fixes Error 153: Video player configuration) and enables standard `BrowserRouter` routing.
- **Dynamic Path Resolution (YTDELUXE_FRONTEND_DIR)**: `launcher.py` safely evaluates the bundled frontend location at runtime and proxies it to the isolated `--onefile` backend via standard environment variables (`os.environ.get('YTDELUXE_FRONTEND_DIR')`). This fundamentally replaces hardcoded or `sys._MEIPASS` dependency checking, enabling modular pyinstaller build strategies.
- **Port Conflict Awareness**: If a developer launches the `YT-Deluxe.exe` application while their local Uvicorn dev server is active on `port 8000`, the bundled backend silently crashes (`winerror 10048 address already in use`), and the UI inadvertently communicates with the uncompiled dev server (resulting in a blank `{"detail":"Not Found"}` SPA fallback). Users must close dev shells before executing native wrapper tests.
- **Desktop Detection**: The frontend detects desktop mode natively via the `window.pywebview` object (injected by the compiled GUI framework), disregarding archaic `file:` protocol checks. This ensures reliable native download triggers.
- **Deep OS Access**:
  - **Native Downloads**: The backend has direct permission to write to the user's `Downloads/YT Deluxe Downloads` folder.
  - **Persistent History**: Instead of browser storage, the app writes to a standard JSON database located in the user's home directory (`~/.yt-deluxe/`).
- **One-Click Launch**: The `launcher.py` entry point ensures that both the server and the UI window open and close together gracefully.

---

### 5.6 Precision Trimming Architecture

_How the end-to-end trimming pipeline works€ from UI range selection to the final trimmed file on disk._

#### 5.6.1 Trimming Flow Overview

```mermaid
flowchart TD
    A["User sets trim range\n(handles / presets / time input)"] --> B["Clicks Download"]
    B --> C["Frontend sends POST /api/download\nwith trim_start & trim_end"]
    C --> D["yt-dlp downloads full file\nto tempfiles/ directory"]
    D --> E{"trim params\npresent?"}
    E -->|No| H["File ready as-is"]
    E -->|Yes| F["FFmpeg trims:\n-ss START -t DURATION -c copy"]
    F -->|Success| G["Rename temp → original filename"]
    F -->|Fail| F2["FFmpeg re-encode fallback:\nlibx264 + aac"]
    F2 --> G
    G --> H
    H --> I{"isDesktop?"}
    I -->|Desktop| J["File saved to\nYT Deluxe Downloads/Videos or Music"]
    I -->|Web| K["Browser triggers download\n+ auto-cleanup after 10min"]
```

#### 5.6.2 FFmpeg Trim Pipeline (Backend)

The trimming engine in `main.py` uses a **two-pass strategy** for maximum compatibility:

**Pass 1€ Stream Copy (Fast, ~0.5s):**

```bash
ffmpeg -y -ss 30 -i input.mp4 -t 90 -c copy -avoid_negative_ts make_zero _tmp_trim_abc123.mp4
```

- `-ss` before `-i` = fast input-side seeking (no full decode)
- `-c copy` = no re-encoding, preserves original quality
- `-avoid_negative_ts make_zero` = fixes timestamp discontinuities

**Pass 2€ Re-encode Fallback (Slower, always works):**

```bash
ffmpeg -y -ss 30 -i input.mp4 -t 90 -c:v libx264 -preset fast -c:a aac _tmp_trim_abc123.mp4
```

- Only triggered if Pass 1 fails (certain codecs don't support stream copy)
- Uses `libx264` (video) + `aac` (audio) for broad compatibility

**Clean Rename Strategy:**

```python
# Temp file → Original filename (no ugly prefixes)
temp_trimmed = f"_tmp_trim_{uuid.uuid4().hex[:8]}{file_ext}"
# After FFmpeg completes:
os.remove(filepath)              # delete original
os.rename(temp_trimmed, filepath) # rename temp → original name
```

> **Result:** User always gets the clean original title (e.g., `MONTAGEM ALQUIMIA (SLOWED).mp4`), never `trimmed_36a5caca_...`.

#### 5.6.3 Trimming€ Desktop vs Web Storage

```mermaid
flowchart LR
    subgraph "Desktop Mode"
        D1["yt-dlp downloads to\nYT Deluxe Downloads/Videos/"] --> D2["FFmpeg trims in-place\n(same directory)"]
        D2 --> D3["File stays permanently\non user's disk"]
        D3 --> D4["'Open in Explorer' button\nhighlights the file"]
    end

    subgraph "Web Mode"
        W1["yt-dlp downloads to\nbackend/tempfiles/"] --> W2["FFmpeg trims in-place\n(same directory)"]
        W2 --> W3["FileResponse streams\nto browser"]
        W3 --> W4["Browser saves to\ndefault Downloads folder"]
        W4 --> W5["Auto-cleanup daemon\ndeletes after 10 min"]
    end
```

| Aspect | Desktop | Web |
|--------|---------|-----|
| **Download location** | `~/Downloads/YT Deluxe Downloads/Videos/` (or Music/) | `backend/tempfiles/` → browser Downloads |
| **File persistence** | Permanent€ stays on user's disk | Ephemeral€ auto-deleted after 10 minutes |
| **Trim execution** | Same as Web (server-side FFmpeg) | Server-side FFmpeg |
| **History storage** | `~/.yt-deluxe/download_history.json` (JSON file) | `localStorage` (browser) |
| **File access** | "Open in Explorer" button via `/api/desktop/open-file` | Standard browser download |

#### 5.6.4 Preview Before Download

Users can preview the trimmed range before committing to a download:

```mermaid
flowchart TD
    P1["User clicks Preview"] --> P2{"Stream type?"}
    P2 -->|"Direct Stream\n(most videos)"| P3["Browser seeks to startTime\nvideo.currentTime = startTime"]
    P3 --> P4["Plays until endTime\nthen loops back to startTime"]
    
    P2 -->|"DASH/Protected\n(stream copy fails)"| P5["Backend generates clip:\n/api/preview-clip?start=X&duration=Y"]
    P5 --> P6["FFmpeg extracts short clip\nstreams back as video/mp4"]
    P6 --> P4
```

**Smart Resume:** Pausing and resuming continues from the paused position€ it only jumps to `startTime` if the playhead is outside the trim range.

#### 5.6.5 Audio Trimming & Embedded Thumbnails

When downloading audio (MP3), the backend automatically:

1. Downloads the best audio stream via yt-dlp
2. Embeds the YouTube video's thumbnail as album art (`EmbedThumbnail` postprocessor)
3. Trims with FFmpeg if a range was specified
4. Final output: `.mp3` file with embedded cover art

---

### 5.7 Trimmer Component Architecture

_How the frontend VideoTrimmer component manages state, syncs with DownloadTabs, and communicates with the backend._

#### 5.7.1 Component Hierarchy & Props

```mermaid
graph TD
    subgraph "index.jsx€ Parent Page"
        SC["selectedConfig\n{type, quality, format}"]
        TS["trimSettings\n{startTime, endTime}"]
        DL["downloads[]\n(active tasks)"]
    end
    
    subgraph "DownloadTabs"
        AT["activeTab\n(local, synced via useEffect)"]
        QG["Quality Grid"]
    end
    
    subgraph "VideoTrimmer"
        TL["Timeline\n(drag handles)"]
        PR["Presets"]
        PV["Preview Player"]
        TG["Trim as Toggle"]
        OV["Thumbnail Overlay"]
    end
    
    SC -->|"selectedConfig prop"| AT
    SC -->|"selectedConfig prop"| TG
    AT -->|"onSelect(config)"| SC
    TG -->|"onSelectConfig(config)"| SC
    OV -->|"onSelectConfig(config)"| SC
    TL -->|"onTrimChange(start, end)"| TS
    DL -->|"downloads prop"| PV
```

#### 5.7.2 Three-Way Toggle Sync

Three separate UI elements all reflect the same download type (Video/Audio/Thumbnail):

| Toggle Location | Purpose | How it Syncs |
|----------------|---------|--------------|
| **DownloadTabs** (main tabs) | Primary type selector | `useEffect` watches `selectedConfig.type` → updates local `activeTab` |
| **"Trim as" toggle** (inside VideoTrimmer) | Quick switch within trimmer | Calls `onSelectConfig()` → updates parent → propagates everywhere |
| **Warning overlay buttons** (glassmorphism card) | Exit thumbnail mode | Calls `onSelectConfig()` → dismisses overlay + updates tabs |

**Single Source of Truth:** `selectedConfig` in `index.jsx` is the only state that matters. All three toggles derive from it and write back to it.

#### 5.7.3 Player Visual States

The preview player has 3 mutually exclusive visual states:

```mermaid
stateDiagram-v2
    [*] --> Fetching: streamUrl loads
    Fetching --> Ready: canplay event fires
    Ready --> Playing: user clicks Play
    Playing --> Buffering: waiting event (slow network)
    Buffering --> Playing: playing event (buffer filled)
    Playing --> Ready: user clicks Pause
    Ready --> Trimming: user clicks Download
    Trimming --> Ready: download completes at 100%
```

| State | Trigger | Visual Indicator |
|-------|---------|-----------------|
| **Fetching / Buffering** | `isMediaLoading \|\| isBuffering \|\| clipLoading` | Triple-layer spinner (ping + spin + pulse icon) |
| **Trimming / Processing** | `activeDownload` found in `downloads[]` | Circular SVG progress ring + percentage + bottom glow bar |
| **Ready / Playing** | None of above | Hover-aware Play/Pause button with glassmorphism overlay |

#### 5.7.4 Estimated File Size Calculation

The trimmer estimates output file size based on quality bitrate:

| Quality | Bitrate (kbps) | Example: 2 min trim |
|---------|---------------|-------------------|
| 8K | 80,000 | ~1.2 GB |
| 4K | 40,000 | ~600 MB |
| 1080p | 8,000 | ~120 MB |
| 720p | 4,000 | ~60 MB |
| 480p | 2,000 | ~30 MB |
| Audio (MP3) | 192 | ~2.9 MB |

**Formula:** `estimatedBytes = (bitrate × 1000 / 8) × trimmedDuration`

---

## 6. Installation and Setup (Local Development)

Follow this setup to run both servers (React + FastAPI) locally on any development machine.

### 6.1 Frontend Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | `^18.2.0` | UI library |
| react-router-dom | `6.0.2` | Client-side routing |
| @reduxjs/toolkit | `^2.6.1` | State management |
| tailwindcss | `3.4.6` | Utility-first CSS |
| framer-motion | `^10.16.4` | UI animations |
| axios | `^1.8.4` | Backend API communication |

### 6.2 Backend Dependencies

| Package | Version | Purpose |
|---|---|---|
| fastapi | `0.133.0` | High-performance async API |
| uvicorn[standard] | `0.41.0` | ASGI server |
| yt-dlp | `>=2026.3.17` | YouTube video/audio extraction |
| ffmpeg | `>=16.04.2026` | Video merging and MP3 conversion |
| bgutil-pot-provider | `latest` | Automatic PO token generation |
| requests | `2.32.5` | HTTP requests & Streaming |
| python-multipart | `0.0.22` | Form-data parsing for FastAPI |
| aiofiles | `25.1.0` | Async file operations |

### 6.3 Desktop Dependencies

| Package | Version | Purpose |
|---|---|---|
| pywebview | `>=4.4.1` | Native OS window encapsulation (Chromium Edge) |
| pyinstaller | `>=6.4.0` | Bundling Python application to `.exe` |

### 6.4 Prerequisites

- **Node.js**: `v18 or LTS`
- **Python**: `3.10+ (Tested on 3.13)`
- **yt-dlp** `>=2026.3.17 (keep as soon as possible updated)` _for YouTube Downloads_

- **FFmpeg**: `>=16.04.2026 (keep as soon as possible updated)` _for Merging Videos_

### 6.5 Frontend Setup (Local)

Open your first terminal window:

```bash
cd frontend
npm install
npm run dev     # Starts Vite Server on http://localhost:5848
```

#### Frontend Files Structure

```text
├── frontend/          # React app (Vite + TailwindCSS)
│  ├── package.json      # NPM dependencies & scripts
│  ├── vite.config.mjs     # Vite build config
│  └── src/
│    ├── pages/       # Core UI (Search, Details, History, Settings)
│    ├── components/     # Reusable UI parts
│    └── utils/api.js    # Backend communication client
```

### 6.6 Backend Setup (Local)

Open a second terminal window:

```bash
cd backend
python -m venv .venv

# Activate the venv:
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Make sure FFmpeg is installed and added to your System's Environment Variables PATH
# Install FFmpeg:
# Windows: Download from https://ffmpeg.org/download.html OR
# https://www.gyan.dev/ffmpeg/builds/
# macOS: brew install ffmpeg
# Ubuntu/Debian: sudo apt install ffmpeg

# Starts FastAPI Dev server on http://localhost:8000
uvicorn main:app --reload  # Dev mode

# Check the API documentation at /docs
http://localhost:8000/docs

# for production:
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Backend Files Structure

```text
├── backend/          # FastAPI application
│  ├── main.py         # Routes, FFmpeg execution, Background Tasks
│  ├── requirements.txt    # Python module dependencies
│  └── tempfiles/       # Ephemeral processing directory
```

_By default, the frontend expects the backend at `localhost:8000`. Set `VITE_API_BASE_URL` in your `.env` if this differs._

---

## 7. API Reference

| Endpoint                           | Method | Description                                      |
|------------------------------------|--------|--------------------------------------------------|
| `/api/search`                      | GET    | Search YouTube by keyword                        |
| `/api/video`                       | GET    | Get video details and available formats          |
| `/api/stream`                      | GET    | Stream video/audio content with range support    |
| `/api/preview-clip`                | GET    | Generate a short FFmpeg clip for trim preview    |
| `/api/download`                    | POST   | Download video/audio with quality & trim options |
| `/api/batch-download`              | POST   | Download multiple videos simultaneously          |
| `/api/progress/{id}`               | GET    | Get real-time download progress and ETA          |
| `/api/history`                     | GET    | List local download history                      |
| `/api/history/{id}`                | DELETE | Delete a single history tracking item            |
| `/api/history/delete`              | POST   | Batch delete multiple history tracking items     |
| `/api/desktop/open-file`           | POST   | Natively open Windows Explorer highlighting file |
| `/api/desktop/open-folder`         | POST   | Natively open Windows Explorer at folder         |
| `/api/system/storage`              | POST   | Get local disk usage statistics                  |
| `/api/feedback`                    | POST   | Submit user feedback via application forms       |

---

## 8. Usage Guide

### 8.1 Search and Discovery

- Enter keywords in the search bar to fetch top YouTube results including thumbnails, durations, and channel metadata.
- **REST API**: `GET /api/search?q=search_term`

### 8.2 Format Selection, Metadata & Streaming

- Click any search result to extract all available DASH (High-Def) and Progressive (Standard-Def) formats directly from YouTube. You can also stream content directly without downloading.
- **REST API**: `GET /api/video?url=youtube_url` | `GET /api/stream?url=youtube_url&quality=1080p`

### 8.3 Download & Trimming Management

- Configure your download with quality options (144p to 8K), format selection (MP4, MP3), and precision trimming.
- **Trimming Workflow:**
  1. Select your desired quality in the **Download Options** tab (Video/Audio)
  2. Use the **Video Trimmer** below to select a range€ drag the blue handles, type exact times (M:SS), or click quick presets (First 30s, Last 5m, etc.)
  3. Click **Preview** to verify your selection plays the correct segment
  4. Click **Download**€ the backend downloads the full file, then FFmpeg trims it to your exact range
- The trimmer shows estimated file size based on quality bitrate and selected duration
- Integrated automatic PO Token negotiation ensures your IP remains safe from 403 blocks.
- **REST API**: `POST /api/download` with optional `trim_start` and `trim_end` parameters (in seconds)

### 8.4 Batch Processing

- Paste multiple YouTube URLs into the Batch Manager to download entire playlists or series simultaneously.
- **REST API**: `POST /api/batch-download`

### 8.5 Real-time Performance Tracking

- Monitor download speed (MB/s), percentage completed, and estimated time remaining (ETA) via a circular or linear visual progress bar.
- **REST API**: `GET /api/progress/{task_id}`

### 8.6 History and Storage Management

- Access your download history to re-download files, delete single entries, or clear multiple items at once. You can also monitor your local disk usage statistics.
- **REST API**: `GET /api/history` (List all), `DELETE /api/history/{id}` (Remove single entry), `POST /api/history/delete` (Batch remove), and `POST /api/system/storage` (Check disk availability).

### 8.7 Native Desktop Integrations

- For users on the Windows Desktop App, file exploration is deeply integrated. You can click to open specific files or their parent folders seamlessly inside Windows Explorer.
- **REST API**: `POST /api/desktop/open-file` and `POST /api/desktop/open-folder`

### 8.8 User Feedback

- Submit bug reports or suggestions directly from the application UI.
- **REST API**: `POST /api/feedback`

---

### 8.9 API Usage Examples (CLI/cURL)

#### Search for Videos

```bash
curl "http://localhost:8000/api/search?q=python+tutorial"
```

#### Download Video

```bash
curl -X POST "http://localhost:8000/api/download" \
 -F "url=https://www.youtube.com/watch?v=VIDEO_ID" \
 -F "quality=720" \
 -F "format=mp4"
```

#### Download Trimmed Video (30s to 2:00)

```bash
curl -X POST "http://localhost:8000/api/download" \
 -F "url=https://www.youtube.com/watch?v=VIDEO_ID" \
 -F "quality=1080" \
 -F "format=mp4" \
 -F "trim_start=30" \
 -F "trim_end=120"
```

#### Download Progress

```bash
curl "http://localhost:8000/api/progress/{task_id}"
```

---

## 9. Building & Deploying the Web App

To host YT Deluxe publicly on the internet (Vercel, Render, Heroku):

### 9.1 Backend (Cloud Web Service)

- Deploy the `backend/` directory as a standard Python Web Service.
- **Critical Build Logic**: The server _must_ install FFmpeg alongside Python.
  - Build Command: `pip install -r requirements.txt && apt-get update && apt-get install -y ffmpeg`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
                        OR

- **Use `Dockerfile` in backend folder to build and deploy.**
`yt-deluxe\backend\Dockerfile`

### 9.2 Frontend (Static Hosted App)

- Deploy the `frontend/` directory to any static hosting provider.
- **Build Command**: `npm run build`
- **Environment Variable**: Ensure you add `VITE_API_BASE_URL` pointing to your automatically deployed Backend URL (e.g., `https://my-backend-domain.com`).

### 9.3 Connecting Frontend & Backend

- By default, the frontend expects the backend API at `http://localhost:8000`.
- CORS is enabled for local development.
- Adjust API endpoints in the frontend if your backend runs on a different host/port.

---

## 10. Building for Desktop (Windows .exe)

To bundle the entire project into a completely standalone Windows application, follow this exact sequential pipeline. Each step fundamentally depends on the compiled output of the previous step.

### 10.1 Environment Preparation (Crucial)

Before building, **both** backend and desktop dependencies must be installed into the **backend's isolated `.venv`**. This ensures PyInstaller bundles everything cohesively without `ModuleNotFoundError` crashes.

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install pyinstaller

# Critical: Install desktop dependencies into the SAME backend .venv
cd ..\desktop
..\backend\.venv\Scripts\pip.exe install -r requirements.txt
```

### 10.2 Build Static Frontend

```powershell
cd frontend
npm run build 
```

_(Packages React into optimized HTML/JS inside `frontend/build`. The desktop `build.spec` copies this folder into the final bundle)._

### 10.3 Bundle Backend via PyInstaller

```powershell
cd backend
.venv\Scripts\pyinstaller.exe main.spec --clean -y
```

_(Packages Python, FastAPI, and `ffmpeg.exe` into a headless `backend/dist/main.exe`)._ **Note:** You must re-run this step anytime `main.py` is edited so changes are included in the bundle.

### 10.4 Build UI Launcher via PyInstaller

```powershell
cd desktop
# MUST use the backend's PyInstaller to guarantee pywebview dependency inclusion
..\backend\.venv\Scripts\pyinstaller.exe build.spec --clean -y
```

_(Creates the massive `desktop/dist/YT-Deluxe` application folder containing the PyWebView edge browser, the copied backend server, and the static frontend assets)._

### 10.5 Post-Build Testing (Port 8000 Conflict Awareness)

Before distributing your app, you should manually run the generated wrapper at `desktop/dist/YT-Deluxe/YT-Deluxe.exe`.

⚠️ **CRITICAL WARNING:** You **MUST CLOSE** any running local development servers (`uvicorn main:app --reload`) before double-clicking the generated `.exe`.
If a dev server is active, it occupies `port 8000`. The bundled `.exe` will launch, silently crash in the background due to `winerror 10048 address already in use`, and the UI window will mistakenly hit your uncompiled Dev server resulting in a blank `{"detail":"Not Found"}` SPA response.

### 10.6 Create the Final Setup Installer (Inno Setup)

To generate the distribution `.exe` that users can install on any Windows machine:

1. **Install Compiler**: Download and install [Inno Setup 6 (Unicode)](https://jrsoftware.org/isinfo.php).
2. **Dependency Prep**: Download the **Microsoft Edge WebView2 Evergreen Bootstrapper** (`MicrosoftEdgeWebview2Setup.exe`) from Microsoft and place it inside the `desktop/installer/` directory.
3. **Compile via GUI**:
   - Open Inno Setup Compiler.
   - Open the file `desktop/installer/setup.iss`.
   - Click **Build > Compile** (or press `Ctrl+F9`).

4. **Compile via CLI / One-Shot Full Rebuild Command**:

   ```powershell
   # Automate the entire 4-step build from terminal root:
   cd "d:\MyProject Reserve\30-9-25_Experimental\yt-deluxe"
   
   cd frontend && npm run build && cd ..
   cd backend && .venv\Scripts\pyinstaller.exe main.spec --clean -y && cd ..
   cd desktop && ..\backend\.venv\Scripts\pyinstaller.exe build.spec --clean -y && cd ..
   & "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "desktop/installer/setup.iss"
   ```

**What `setup.iss` does (Deep-Dive):**

- **UAC Elevation**: Requests Administrator privileges to install into `C:\Program Files\YT Deluxe\`.
- **WebView2 Silent Fix**: Automatically checks the Windows Registry. If the runtime is missing, it triggers a silent installation of the bundled bootstrapper (`/silent /install`) before the app first launches, preventing `.NET/WinForms` dependency crashes.
- **Path Verification**: Bundles the `backend/dist/main` and `desktop/dist/YT-Deluxe` assets into a single compressed package (~84MB).
- **Permission Hardening**: Configures the app to redirect all write operations (temp files and history) to the user's `%TEMP%` and `%USERPROFILE%` directories, dodging `WinError 5: Access Denied` errors common in installed apps.
- **Standardized Deployment**: Creates Start Menu and Desktop shortcuts with the high-res app icon, and includes a clean uninstaller.

---

## 11. Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 12. Legal Notice

This tool is for personal use only. Downloading copyrighted content may violate YouTube’s terms of service. Use responsibly and respect copyright laws.

---

## 13. License

This project is for educational purposes. Please respect YouTube’s terms of service and copyright laws.

---

## 14. Support & Maintenance

For issues and questions:

1. Check the API documentation at `/docs`
2. Review the error logs
3. Ensure FFmpeg is properly installed
4. Update yt-dlp to the latest version & documentations
5. Update PO token provider
6. Rotate Cookies file if needed.

---

**Built with as a Free & Open Source Project.**

👨‍💻 **Developer:** Utsav Parmar  
🔗 **LinkedIn:** [www.linkedin.com/in/utsavparmar-full-stack-dev](https://www.linkedin.com/in/utsavparmar-full-stack-dev)  
🐙 **GitHub:** [https://github.com/Utsavstack](https://github.com/Utsavstack)  

**Made With❤️UP7**

_Last Updated: April 2026_
