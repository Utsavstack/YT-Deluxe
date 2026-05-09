# Changelog

All notable changes to **YT Deluxe** will be documented in this file.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions
and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## 1.0 [1.0.0-beta] 2026-05-09

> **Initial Public Beta Release** The first public version of YT Deluxe.
> This is a beta release. Core features are stable, but some rough edges may exist.
> Feedback and bug reports are welcome via [GitHub Issues](https://github.com/Utsavstack/YT-Deluxe/issues).

### 1.1 Added

#### 1.1.1 Search & Preview
- Search YouTube by keyword or paste a direct video URL
- Live hover video preview on search results
- Picture-in-Picture (PiP) mini-player support

#### 1.1.2 Download Engine
- **Quick Actions** 1-click Best Video, Audio Only, and Thumbnail download
- **Quality Grid** Full resolution picker from 144p up to 8K
- **Format Control** MP4, WebM, MKV, MOV, MP3, M4A, Opus support
- **Advanced Format Picker** Select exact raw yt-dlp stream by format ID
- **Container Selection** Auto-native, MP4, MKV, WebM, MOV
- Embedded album art in MP3 and M4A audio downloads
- Real-time download progress bar with speed, percentage & ETA

#### 1.1.3 Precision Trimmer
- Drag timeline handles or type exact `M:SS` timestamps for clip range
- Quick preset chips First 30s, Last 5m, custom range
- Preview trim before downloading
- Zero re-encoding loss via FFmpeg stream copy mode

#### 1.1.4 Desktop App (Windows)
- Native `.exe` installer built with Inno Setup 6
- Files saved directly to `~/YT Deluxe Downloads/`
- "Open File" and "Open in Explorer" one-click post-download actions
- Persistent download history stored in `~/.yt-deluxe/`
- Professional multi-screen installer with Liquid Glass UI styling

#### 1.1.5 Web App
- Self-hostable instance on any cloud provider
- Browser-native download dialog
- Download history stored in `localStorage`
- Auto-cleanup of temporary server files after 10 minutes

#### 1.1.6 Privacy & Security
- **PO Token** (Proof of Origin) support bypasses YouTube bot detection
- All YouTube communication routed through your own backend (yt-dlp)
- No data sent to any third-party service
- Zero telemetry, zero analytics, zero user tracking

#### 1.1.7 Multilingual Support
- Full UI in English, Hindi, German, and conversational Hinglish
- Persistent language preference saved across sessions

#### 1.1.8 History & Management
- Full download history with re-download and delete options
- Batch delete support
- Disk storage usage monitor

#### 1.1.9 UI & Design
- Premium **Liquid Glass** aesthetic with glassmorphism effects
- Dark Mode and Light Mode fully themed across all views
- Smooth animations powered by Framer Motion
- Responsive layout works on desktop and mobile browsers
- Custom dropdown, search bar, notification bell, and loader components

#### 1.1.10 Landing Page (Website)
- Static marketing website at `/website`
- Mobile-first responsive design with hamburger navigation drawer
- Interactive feature gallery with Capsule (carousel) and Grid view modes
- Dark/Light mode image demos in gallery grid
- Full-screen image modal with keyboard navigation support
- Scroll-reveal animations and micro-interactions on feature cards
- Updates/Changelog section powered by GitHub Releases API
- FAQ section with animated accordion
- Legal pages Terms, Privacy Policy, License, Disclaimer
- About page with developer profile and social links

---

### 1.2 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| Backend | FastAPI, Uvicorn, yt-dlp, FFmpeg |
| Desktop | pywebview, PyInstaller, Inno Setup 6 |
| State | Redux Toolkit |
| i18n | i18next |
| Routing | React Router |
| HTTP | Axios |
| Bot Bypass | bgutil-ytdlp-pot-provider (PO Token) |

---

### 1.3 Known Limitations (Beta)

- Playlist batch download is **not yet supported** (coming in a future release)
- Subtitle/caption embedding is **not yet available**
- macOS and Linux desktop builds are **not yet packaged**
- OS-native progress notifications are **not yet implemented**

---

### 1.4 Dependencies

- **Node.js** v18 or LTS
- **Python** 3.10+ (tested on 3.13)
- **FFmpeg** must be in system PATH
- **yt-dlp** `>= 2026.3.17`

---

> **Note:** This is the initial beta release. No previous version exists to compare against.
> All features listed above are "Added" as this is the project's first public release.

---

## 2.0 [Unreleased]

### 2.1 In Progress
- Playlist batch download support
- Subtitle and caption embedding
- macOS & Linux desktop builds
- OS-native progress notifications

### 2.2 Planned (Future)
- Browser extension integration
- Scheduled / queued downloads
- SponsorBlock segment removal
- Cloud sync for download history
- Mobile web PWA support
- Plugin/extension system for custom post-processors

---

<p align="center">
  <a href="https://github.com/Utsavstack/YT-Deluxe">YT Deluxe</a> •
  <a href="https://github.com/Utsavstack/YT-Deluxe/issues">Report a Bug</a> •
  <a href="https://github.com/Utsavstack/YT-Deluxe/discussions">Request a Feature</a>
  <br><br>
  <em>Made With UP7</em>
</p>
