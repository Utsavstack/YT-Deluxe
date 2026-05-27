# Changelog 2.0
---

**YT Deluxe** is a premium, privacy-focused YouTube media downloader and player. Engineered with an ultra-sleek glassmorphic desktop interface, dynamic format streams picker (resolutions up to 8K, custom trimming, and FFmpeg post-processing), an asynchronous FastAPI backend proxy layer, and state-of-the-art token scraping architectures to ensure consistent, rate-limit-free downloads.

All notable architectural milestones, feature updates, bug fixes, and security hardening patches are documented chronologically in this release log.

### 🛠️ Release Integrity & Hash Generation Guide
When building a new release, follow these step-by-step instructions in English to generate and compile the executable installer with integrity hashes:

1. **Build the Desktop Installer (Inno Setup)**
   ```powershell
   & "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "desktop/installer/setup.iss"
   ```
   *This compiles and generates `YT-Deluxe-Setup-v<Version>.exe` under the `desktop/installer/Output/` directory.*

2. **Compute SHA-256 Checksum**
   Generate the integrity hash by executing the following command in PowerShell:
   ```powershell
   Get-FileHash "D:\MyProject Reserve\30-9-25_Experimental\yt-deluxe\desktop\installer\Output\YT-Deluxe-Setup-v<Version>.exe" -Algorithm SHA256 | Select-Object Hash
   ```
   *Copy the hexadecimal hash value from the console output.*

3. **Publish to GitHub Releases**
   In the GitHub release notes / description block, paste the following integrity verification card:
   ```markdown
   ## ✅ Verify Download Integrity
   - **SHA-256 (Setup.exe)**: <Hex-Hash-Value>
   - **Verification Command (PowerShell)**:
     ```powershell
     Get-FileHash "YT-Deluxe-Setup-v<Version>.exe" -Algorithm SHA256
     ```
   ```

---


## 2.0 [2026-05-27] Latest

> [!NOTE]
> **Major Release: UI/UX, Performance, Security!**
> This release brings a massive upgrade to the core architecture, including real-time Piped API integration for search and trending pages, an advanced diagnostics problem reporter, two-phase video details rendering, comprehensive testing suites, full technical SEO overhaul, and high-fidelity glassmorphic visual polish.

> [!IMPORTANT]
> **Flat Download Path Migration**
> We transitioned to flat downloads as the default directory format (saving files directly to standard Downloads). If you preferred automated wrapping inside a nested "YT Deluxe Downloads/" folder, please enable "Separate files by type" or update your Download Preferences in User Settings.

> [!IMPORTANT]
> **Verify Download Integrity (v2.0.0)**
> - **SHA-256 (Setup.exe)**: `F03055B6ED82662FA73E4803931F6CD853F75E79736D3EC36581271A3B94FCCC`
> - **Verification Command (PowerShell)**:
>   ```powershell
>   Get-FileHash "YT-Deluxe-Setup-v2.0.0.exe" -Algorithm SHA256
>   ```

> [!TIP]
> **Release Highlights**
> - **Lightning-Fast Video Loading**: Two-phase rendering with instant UI feedback and parallel Piped API metadata fetching reduces load times from ~20s down to ~3s.
> - **Premium Glassmorphism Aesthetics**: Complete overhaul of all player panels, navigation headers (`FilterBar`, `TabNavigation`), and modal controllers with ultra-frosted glass styling.
> - **Seamless Caching & Navigation**: Implemented in-memory/`sessionStorage` caching and eager background preloading for immediate 0ms page transitions.
> - **Custom Incremental History Renderer**: Replaced `VirtuosoGrid` with a `requestAnimationFrame`-based chunked renderer to eliminate scroll thrashing on large history lists.
> - **In-App Diagnostics & Problem Reporter**: Premium interactive troubleshooting and local log file analyzer inside User Settings with one-click GitHub Issue templates compiler.
> - **Rigorous Testing & Operations**: 14 asynchronous FastAPI contract tests and comprehensive Vitest/jsdom frontend testing suites.

---

### ✨ New Features
- [d78230e](https://github.com/Utsavstack/YT-Deluxe/commit/d78230ea70d45aed8d234ead138269463977dcb7) - **seo: complete technical SEO sprint and performance optimization**
- [186e688](https://github.com/Utsavstack/YT-Deluxe/commit/186e688b3bfc9c245c18177dd6aab050b715dd7c) - **core: overhaul permissions architecture, logging, security, UI polish, tests, config & diagnostics reporter**
- [e2544d3](https://github.com/Utsavstack/YT-Deluxe/commit/e2544d38f2efc93a6bb3976de4f1d67ac8269907) - **core: integrate Piped API, two-phase video load, gallery expansion, and full UI overhaul**
- [f2132d1](https://github.com/Utsavstack/YT-Deluxe/commit/f2132d18fed3fd4cea60909aa0f101946df7c9e4) - **desktop: overhaul download management, settings persistence, permissions, and UI polish**
- [41483b9](https://github.com/Utsavstack/YT-Deluxe/commit/41483b9a4d805ca73b030ce586180c2bb32be121) - **ui: redesign new container layout, fix scroll glitch, and add incremental rendering, overhaul history page UI**
- [dd07435](https://github.com/Utsavstack/YT-Deluxe/commit/dd074358ce6017b2b8c9d09c69d8545e8a4d45d3) - **core: implement real-time search suggestions and overhaul player UIs**
- [5eaa827](https://github.com/Utsavstack/YT-Deluxe/commit/5eaa82783dab7fac2fcc7282b62afd8f40f963d0) - **landing: integrate dynamic release version and date analytics on landing page**
- [193ad3f](https://github.com/Utsavstack/YT-Deluxe/commit/193ad3f7c01a5185dc587ffb4aeb9ba78c7b3204) - **core: finalize dynamic distribution pipeline, version sync, and architecture docs**
- [57eb83f](https://github.com/Utsavstack/YT-Deluxe/commit/57eb83f0ab0853210ffbca8eaed07161a0c9c653) - **seo: finalize Phase 4 with social media meta tags and Vercel URLs**
- [c897f0c](https://github.com/Utsavstack/YT-Deluxe/commit/c897f0c4f7e398a9aebdcd3bdb5e365749e814cb) - **landing: finalize phase 1 fixes & integrate github releases api**
---
### 🐛 Bug Fixes
- [e67c143](https://github.com/Utsavstack/YT-Deluxe/commit/e67c143491acbf1e5e0ecbc9d75e8113483d0e4b) - **desktop: resolve silent HTTPS failure in search suggestions and winotify in .exe build**
---
### ⚡ Performance Improvements
- [4c72656](https://github.com/Utsavstack/YT-Deluxe/commit/4c7265613f7329fba3cb6fb95365fb56c9795247) - **core: implement comprehensive performance optimization and UI polish**

---

### 2.1 Added

#### 2.1.1 Piped API Proxy Layer
- High-performance primary proxy layer for video searches and trending feeds
- Multi-instance failover lists to maximize availability: `api.piped.private.coffee` > `pipedapi.kavin.rocks` > `pipedapi.leptons.xyz`
- Seamless `yt-dlp` search fallback mechanism when Piped instances are rate-limited or unreachable
- Infinite scrolling with deduplication on cursor-based loaded results

#### 2.1.2 Two-Phase Video Details Engine
- Implemented a lightning-fast two-phase details rendering state machine to reduce loading times from ~20s down to ~3s
- Instant UI shell renders from cached/transition states with beautiful shimmer placeholders
- Quick Enrich phase retrieves video description, avatar, sub count, likes, views, and upload date via parallel Piped API calls and returnyoutubedislikeapi.com (RYD)
- Background Full phase processes `yt-dlp` in the background to load high-resolution quality formats and initialize the clip trimmer

#### 2.1.3 Frontend Diagnostics & Problem Reporter
- In-app premium interactive Diagnostics dashboard in User Settings (`ReportAProblem.jsx`)
- Pre-known troubleshooting guides covering WebView2 blank screens, port 8000 conflicts, download blocks, DASH stream separation, trim deviations, and antivirus false positives
- Interactive logs browser supporting text `FileReader` local uploads and dynamic folder access via PyWebView desktop bridge
- One-click compiler to compile browser/system metadata, versions, and log tails directly into GitHub Issue templates

#### 2.1.4 Real-Time Search Suggestions
- Implemented a 280ms debounced real-time Google search suggestions feed
- Clean JSON-parsing proxy endpoint (`/api/suggestions`) to circumvent CORS restrictions
- Fully redesigned input UI with micro-spinner and smooth keyboard navigation support (Up/Down arrows and Escape keys)

#### 2.1.5 System Permissions Dialog & Controls
- Branded permission dialogue popups on web and custom WebView2 permission auto-grants on desktop
- Dynamic clipboard intercept and media device permissions handling
- Settings interface showing active/revokable permissions and real-time validation checks

#### 2.1.6 Global Navigation & Analytics
- Elegant glassmorphic Back/Forward navigation controls integrated globally inside `Header`
- Dynamic release updates and downloader metadata fetched via GitHub Releases API on landing page
- Frictionless 1-hour `localStorage` caching layer on the landing page to respect API limits
- Standalone privacy-centric download & page-view analytics without invasive external tracking

#### 2.1.7 Comprehensive Testing & Architecture Docs
- Frontend unit testing powered by Vitest (`^4.1.7`) and jsdom (`^29.1.1`)
- Comprehensive test suites validating caching layers, API parsers, and date formatting
- Asynchronous backend API contract testing suite (`backend/test_main.py`) with 14 detailed FastAPI TestClient scenarios
- Fully updated `ARCHITECTURE.md` detailing system design, sequence flows, caching pipelines, and Mermaid architecture diagrams

### 2.2 Changed

#### 2.2.1 UI & UX Glassmorphism Overhaul
- Full redesign of search pages, history panels, settings grid, and video players using an ultra-premium frosted glass aesthetic
- Overhauled `FilterBar` and `TabNavigation` using smooth Framer Motion sliding animations and rounded pill styling
- Sleek, compact `ShareModal` and `ConfirmationModal` with spring transitions and interactive close triggers
- PageSkeletons made completely route-aware to completely eliminate cumulative layout shifts (CLS)
- Replaced `--glass-bg` and `--glass-border` Tailwind variables globally to fix dimness in Light Mode

#### 2.2.2 Video Players Visual Refresh
- Global PiP mini-player: Glassmorphic upgrade, 2.5s idle auto-hide controls/cursor in fullscreen, and fixed browser-level F11 fullscreen scoping
- Inline player: Bulky rectangular controls replaced with sleek, floating glass control pills and detached floating progress bars

#### 2.2.3 Settings, Naming & Defaults
- Flat download organization: Downloads save directly to user's native Downloads/ folder rather than nested subfolders by default
- Flexible date & time formatting options, transitioning default preferences to DD/MM/YYYY and 12-hour clocks
- Full redesign of About Page with large click-to-preview spring-animated profile views
- Privacy policy and license agreements overhauled with Inter typography and micro-animations

### 2.3 Performance

#### 2.3.1 Incremental RAF History Renderer
- Replaced `VirtuosoGrid` (which caused scroll jumping in multi-column grids) with a `requestAnimationFrame`-based chunked renderer
- Instantly loads first 20 history cards and renders subsequent items asynchronously, achieving 0ms page load times even with large histories

#### 2.3.2 Two-Layer Frontend Cache
- In-memory Map + `sessionStorage` caching system (`dataCache.js`) with strict Time-To-Live (TTL) support
- Enables instant (0ms) revisits across Search, Trending, and Video Details pages
- Explicit cache invalidations on download completion to preserve data freshness

#### 2.3.3 Lifecycle & Navigation Preloading
- 500ms delayed background preloading for high-frequency routes (History, Settings) to guarantee instantaneous navigations
- 24-hour cache TTL on Desktop update checker to eliminate unnecessary background network requests

### 2.4 Fixed

#### 2.4.1 PyInstaller SSL Verification Crash
- Fixed silent HTTPS failures inside search suggestions in the packaged `.exe` by transitioning to `requests.get` with verify fallback and bundling `certifi`'s CA certificates

#### 2.4.2 Process Lifespan & Memory Leaks
- Forcefully terminates child process trees on app exit via Windows `taskkill /F /T /PID`, eliminating ghost background `yt-dlp`/`ffmpeg` memory leaks

#### 2.4.3 Packaged Toast Notifications
- Moved `winotify` imports to module-level and bundled package variables, resolving silent notification crashes on desktop builds

#### 2.4.4 Build Regressions
- Restored Vite builder to `v6.4.1` to bypass Vite 8's aggressive LightningCSS vendor prefix stripping, preserving `-webkit-backdrop-filter` header blur in WebView2
- Corrected History list TDZ ReferenceErrors and scroll thrashing by removing layout triggers
- Fixed settings/theme resetting on relaunch by writing storage records to local caching synchronously

### 2.5 Security

#### 2.5.1 Path Traversal Protection
- Hardened `serve_download` and `serve_tempfile` backend endpoints using realpath resolution, ensuring file retrievals are locked strictly within authorized temporary directories

#### 2.5.2 Privacy Hardening
- Completely eliminated third-party Google reCAPTCHA tracking from the marketing website, delegating all bot mitigation to Vercel Edge networks

### 2.6 Removed
- Removed `VirtuosoGrid` virtualization library from frontend dependencies to address layout/scroll regressions
- Removed redundant math-generated placeholder views and ratings to provide clean, real-time analytics
- Cleared multiple Ruff lint warnings and unused package imports from FastAPI backend files

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

<p align="center">
  <a href="https://github.com/Utsavstack/YT-Deluxe">YT Deluxe</a> •
  <a href="https://github.com/Utsavstack/YT-Deluxe/issues">Report a Bug</a> •
  <a href="https://github.com/Utsavstack/YT-Deluxe/discussions">Request a Feature</a>
  <br><br>
  <em>Made With❤️UP7</em>
</p>
