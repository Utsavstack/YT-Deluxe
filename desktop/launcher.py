import webview
import subprocess
import sys
import os
import time
import http.client
import atexit
import logging
import logging.handlers


# ── Logging Setup ──────────────────────────────────────────────────────────────
# Logs are written to %APPDATA%\YT Deluxe\logs\launcher.log
# Rotating: max 5 MB per file, keeps last 3 backups (15 MB total)
# This lets users share logs when reporting crashes or issues.
def _setup_logging():
    log_dir = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "YT Deluxe", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "launcher.log")

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)

    # Rotating file handler (5 MB × 3 backups)
    fh = logging.handlers.RotatingFileHandler(
        log_file, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S"))
    root.addHandler(fh)

    # Also keep console output (shows in dev mode terminal)
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(logging.Formatter("[YT Deluxe] %(message)s"))
    root.addHandler(ch)

    return logging.getLogger("launcher"), log_file

logger, LOG_FILE_PATH = _setup_logging()
logger.info("=" * 60)
logger.info("YT Deluxe Launcher starting")
logger.info(f"Log file: {LOG_FILE_PATH}")
logger.info(f"Python: {sys.version}")
logger.info(f"Frozen (packaged): {getattr(sys, 'frozen', False)}")
# ──────────────────────────────────────────────────────────────────────────────
def resource(relative_path):
    """
    Returns absolute path to a bundled resource.
    Works in both:
    - Dev mode: relative to desktop/ folder
    - PyInstaller onedir mode: relative to the .exe's directory
    """
    if getattr(sys, 'frozen', False):
        # PyInstaller onedir (v6+): data/binaries live in _internal/ (sys._MEIPASS)
        base = sys._MEIPASS
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, relative_path)


def show_error(title, message):
    """Show a Windows error dialog to the user."""
    try:
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)
    except Exception:
        print(f"[ERROR] {title}: {message}")


def kill_process_tree(pid):
    """Kill a process AND ALL its children on Windows.
    
    Uses taskkill /F /T which recursively terminates all child processes.
    This is the only reliable way to kill frozen PyInstaller exes and their
    spawned children (yt-dlp, ffmpeg, bgutil PO token server).
    """
    try:
        subprocess.run(
            ['taskkill', '/F', '/T', '/PID', str(pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
            timeout=5
        )
    except Exception:
        # Last resort: use Python's kill()
        try:
            import signal
            os.kill(pid, signal.SIGTERM)
        except Exception:
            pass


def start_backend():
    """Spawn FastAPI backend as a subprocess."""
    env = os.environ.copy()
    env["YTDELUXE_DESKTOP"] = "true"  # Activates desktop CORS mode in main.py

    # Tell the backend where the frontend build lives so it can serve it via HTTP
    # (frontend is bundled with the launcher, not the backend exe)
    frontend_dir = resource('frontend')
    if os.path.isdir(frontend_dir):
        env["YTDELUXE_FRONTEND_DIR"] = frontend_dir

    backend_exe = resource(os.path.join('backend', 'main.exe'))

    if os.path.exists(backend_exe):
        # Packaged mode: use bundled backend .exe
        return subprocess.Popen(
            [backend_exe],
            cwd=os.path.dirname(backend_exe),  # So backend finds ffmpeg.exe etc.
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW  # No black console popup on Windows
        )
    else:
        # Dev mode: run uvicorn directly from source
        backend_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', 'backend')
        )
        return subprocess.Popen(
            [sys.executable, '-m', 'uvicorn', 'main:app',
             '--host', '127.0.0.1', '--port', '8000'],
            cwd=backend_dir,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


def wait_for_backend(timeout=30):
    """Poll backend until /docs returns 200 or timeout."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            conn = http.client.HTTPConnection('127.0.0.1', 8000, timeout=1)
            conn.request('GET', '/docs')
            res = conn.getresponse()
            if res.status == 200:
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False


class AppApi:
    def __init__(self):
        self._window = None

    def toggle_fullscreen(self):
        if self._window:
            self._window.toggle_fullscreen()
            return True
        return False

    def minimize_window(self):
        if self._window:
            self._window.minimize()
            return True
        return False

    def close_window(self):
        if self._window:
            self._window.destroy()
            return True
        return False

    def read_clipboard(self):
        try:
            import subprocess
            out = subprocess.check_output(
                ["powershell", "-command", "Get-Clipboard"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return out.decode("utf-8", errors="ignore").strip()
        except Exception:
            return ""

    def write_clipboard(self, text):
        try:
            import subprocess
            # SECURITY FIX: Pass text via stdin instead of interpolating into the command string.
            # Previously: f"Set-Clipboard -Value '{text}'" — a video title like `'; Start-Process calc; '`
            # would execute arbitrary PowerShell code. Using $input | Set-Clipboard prevents this.
            process = subprocess.run(
                ["powershell", "-command", "$input | Set-Clipboard"],
                input=text,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return process.returncode == 0
        except Exception:
            return False

    def open_url(self, url):
        try:
            import webbrowser
            webbrowser.open(url)
            return True
        except Exception:
            return False

    def pick_folder(self):
        """Open native Windows folder picker dialog.
        Returns the selected folder path, or None if cancelled.
        """
        try:
            if self._window:
                result = self._window.create_file_dialog(
                    webview.FOLDER_DIALOG
                )
                if result and len(result) > 0:
                    return result[0]
        except Exception:
            pass
        return None

    def open_logs_folder(self):
        """Open the YT Deluxe logs folder in Windows Explorer."""
        try:
            log_dir = os.path.join(
                os.environ.get('APPDATA', os.path.expanduser('~')),
                'YT Deluxe', 'logs'
            )
            os.makedirs(log_dir, exist_ok=True)  # ensure it exists
            subprocess.Popen(
                ['explorer', log_dir],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return True
        except Exception as e:
            logger.warning(f"open_logs_folder failed: {e}")
            return False

    def read_installer_config(self):
        """Read installer-set preferences from Windows registry.
        Returns dict with: download_path, auto_organize, update_notify,
        allow_metadata, allow_network. Returns empty dict on failure.
        """
        try:
            import winreg
            config = {}
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                                 r'Software\YTDeluxe\Settings')
            for name, default in [
                ('DownloadPath', ''),
                ('AutoOrganize', '1'),
                ('UpdateNotify', '1'),
                ('AllowMetadata', '1'),
                ('AllowNetwork', '1'),
            ]:
                try:
                    val, _ = winreg.QueryValueEx(key, name)
                    config[name] = val
                except FileNotFoundError:
                    config[name] = default
            winreg.CloseKey(key)
            return config
        except Exception:
            return {}


def main():
    # ── Step 1: Start Backend ─────────────────────────────────────────────
    logger.info("Starting backend...")
    backend_proc = start_backend()

    logger.info("Waiting for backend to be ready...")
    if not wait_for_backend(timeout=30):
        logger.error("Backend did not respond within 30s. Exiting.")
        kill_process_tree(backend_proc.pid)
        show_error(
            "YT Deluxe - Error",
            "YT Deluxe backend failed to start.\n\n"
            "Please try running the app again.\n"
            "If the problem persists, check if your antivirus is blocking it.\n\n"
            f"Log file: {LOG_FILE_PATH}"
        )
        sys.exit(1)

    logger.info("Backend ready.")

    # ── Step 2: Determine URL ─────────────────────────────────────────────
    if getattr(sys, 'frozen', False):
        # Packaged: serve frontend via backend's local HTTP server
        # Using http:// instead of file:// gives YouTube embeds a valid origin
        # (fixes Error 153: Video player configuration error)
        # Using localhost instead of 127.0.0.1 to pass YouTube restriction checks
        url = 'http://localhost:8000/'
    else:
        # Dev: Vite dev server must be running separately on port 5848
        url = 'http://localhost:5848'

    logger.info(f"Loading: {url}")

    # ── Polyfill for Pywebview to suppress stale Javascript Exceptions ─────
    import webview.window
    original_evaluate_js = webview.window.Window.evaluate_js
    def safe_evaluate_js(self, script, *args, **kwargs):
        try:
            return original_evaluate_js(self, script, *args, **kwargs)
        except Exception:
            pass # Silently ignore JS bridge errors during reloads
    
    webview.window.Window.evaluate_js = safe_evaluate_js

    # ── Step 3: Create Window ─────────────────────────────────────────────
    api = AppApi()

    # Persist WebView2 user data (including permission grants) across sessions.
    # Without this, WebView2 resets ALL stored permissions on every app launch,
    # meaning the native microphone/notification popup would reappear every time.
    _webview_storage = os.path.join(
        os.environ.get('APPDATA', os.path.expanduser('~')),
        'YT Deluxe', 'webview_storage'
    )
    os.makedirs(_webview_storage, exist_ok=True)

    window = webview.create_window(
        title='YT Deluxe',
        url=url,
        js_api=api,
        width=1280,
        height=800,
        min_size=(300, 500),
        resizable=True,
        text_select=True,
        maximized=True,
    )
    api._window = window

    # ── Auto-grant WebView2 permissions (suppress native "localhost" dialogs) ──
    # We hook into CoreWebView2.PermissionRequested to silently auto-grant every
    # native browser permission request. This prevents "localhost:8000 wants to..."
    # prompts from appearing — our JS-side PermissionDialog handles user consent.
    #
    # Root cause of the ImportError: PyInstaller bundles pywebview's platform
    # modules under internal names. By the time func= fires, pywebview has
    # already imported its guilib — we find BrowserView via sys.modules instead
    # of a fragile hardcoded path.
    _permission_hook_installed = False

    def _find_browser_view():
        """Locate pywebview's BrowserView class however it was imported."""
        import sys
        import importlib

        # Strategy 1: Try known module paths (dev mode / non-frozen)
        for mod_path in (
            'webview.platforms.edgechromium',
            'webview.platforms.winforms',
            'webview.platforms.chromium',
        ):
            try:
                mod = importlib.import_module(mod_path)
                bv = getattr(mod, 'BrowserView', None)
                if bv and hasattr(bv, 'instances'):
                    logger.info(f"[PermHook] BrowserView found via import: {mod_path}")
                    return bv
            except ImportError:
                pass

        # Strategy 2: Search already-loaded modules (PyInstaller-safe)
        for name, mod in list(sys.modules.items()):
            if mod is None:
                continue
            bv = getattr(mod, 'BrowserView', None)
            if bv and hasattr(bv, 'instances'):
                logger.info(f"[PermHook] BrowserView found in sys.modules: {name}")
                return bv

        # Strategy 3: Use webview.guilib (set after webview.start initialises)
        try:
            import webview as _wv
            guilib = getattr(_wv, 'guilib', None)
            if guilib:
                bv = getattr(guilib, 'BrowserView', None)
                if bv and hasattr(bv, 'instances'):
                    logger.info("[PermHook] BrowserView found via webview.guilib")
                    return bv
        except Exception:
            pass

        return None

    def _install_permission_hook():
        """Called from the webview GUI thread once the window is ready."""
        nonlocal _permission_hook_installed
        if _permission_hook_installed:
            return
        try:
            BrowserView = _find_browser_view()
            if not BrowserView:
                logger.warning("[PermHook] BrowserView class not found in any module")
                return

            # Try by window uid first, then fall back to iterating all instances
            instance = BrowserView.instances.get(window.uid)
            if not instance:
                all_instances = list(BrowserView.instances.values())
                instance = all_instances[0] if all_instances else None

            if not instance:
                logger.warning("[PermHook] No BrowserView instance found")
                return

            # pywebview exposes the WinForms WebView2 control under different names
            web_view = (
                getattr(instance, 'browser', None)
                or getattr(instance, 'web_view', None)
                or getattr(instance, 'webview', None)
                or getattr(instance, '_browser', None)
            )
            if not web_view:
                logger.warning("[PermHook] WebView2 control not found on instance")
                return

            core = getattr(web_view, 'CoreWebView2', None)
            if not core:
                logger.warning("[PermHook] CoreWebView2 not initialised yet")
                return

            def on_permission_requested(sender, args):
                """Auto-grant every WebView2 permission request.
                YT Deluxe's JS dialog already obtained user consent before
                triggering the underlying browser API call.
                CoreWebView2PermissionState: 0=Default, 1=Allow, 2=Deny
                """
                try:
                    args.State = 1  # Allow
                    kind = getattr(args, 'PermissionKind', 'unknown')
                    logger.info(f"[PermHook] Auto-granted: {kind}")
                except Exception as inner:
                    logger.warning(f"[PermHook] Could not set State: {inner}")

            core.PermissionRequested += on_permission_requested
            _permission_hook_installed = True
            logger.info("[PermHook] WebView2 permission auto-grant: ACTIVE")

        except Exception as e:
            logger.warning(f"[PermHook] Setup failed: {e}", exc_info=True)

    # Also hook on_loaded as a secondary attempt in case the func= callback
    # fires too early (before CoreWebView2 is ready on some pywebview versions).
    # Retry up to 12 times with 800ms delay (total ~9.6s window).
    # CoreWebView2 on slow machines / first launch takes 4-8s to initialise.
    def on_loaded():
        import threading
        def _retry_hook():
            # Initial wait: BrowserView instance may not exist in sys yet
            time.sleep(1.5)
            for attempt in range(12):
                if _permission_hook_installed:
                    logger.info(f"[PermHook] Hook installed on retry attempt {attempt + 1}")
                    return
                _install_permission_hook()
                time.sleep(0.8)
            if not _permission_hook_installed:
                logger.warning("[PermHook] All retry attempts exhausted — mic dialog may appear")
        threading.Thread(target=_retry_hook, daemon=True).start()

    window.events.loaded += on_loaded

    def on_closed():
        logger.info("Window closed. Killing backend process tree...")
        kill_process_tree(backend_proc.pid)

    window.events.closed += on_closed

    # Safety net: atexit fires even if on_closed is somehow skipped
    # (e.g., process killed externally or exception in webview)
    atexit.register(lambda: kill_process_tree(backend_proc.pid))

    # ── Step 4: Start WebView (blocking) ─────────────────────────────────
    # Try EdgeChromium first (best rendering), then fallback to default.
    # Pass _install_permission_hook as func= so it runs on the GUI thread
    # once the WebView2 control is fully initialised — the correct moment to
    # subscribe to CoreWebView2.PermissionRequested.
    try:
        webview.start(
            func=_install_permission_hook,
            debug=False,
            gui='edgechromium',
            private_mode=False,
            storage_path=_webview_storage,
        )
    except Exception as e:
        logger.warning(f"EdgeChromium failed: {e}. Trying default...", exc_info=True)
        try:
            webview.start(
                func=_install_permission_hook,
                debug=False,
                private_mode=False,
                storage_path=_webview_storage,
            )
        except Exception as e2:
            logger.error(f"WebView2 completely unavailable: {e2}", exc_info=True)
            backend_proc.terminate()
            show_error(
                "YT Deluxe - Missing Component",
                "YT Deluxe could not start because Microsoft WebView2 Runtime is missing.\n\n"
                "Please reinstall YT Deluxe using the Setup installer,\n"
                "or install WebView2 manually from:\n"
                "https://developer.microsoft.com/en-us/microsoft-edge/webview2/\n\n"
                f"Log file: {LOG_FILE_PATH}"
            )
            sys.exit(1)


if __name__ == '__main__':
    main()
