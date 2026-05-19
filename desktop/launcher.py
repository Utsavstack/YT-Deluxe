import webview
import subprocess
import sys
import os
import time
import http.client
import atexit


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
            subprocess.run(
                ["powershell", "-command", f"Set-Clipboard -Value '{text}'"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return True
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
    print("[YT Deluxe] Starting backend...")
    backend_proc = start_backend()

    print("[YT Deluxe] Waiting for backend to be ready...")
    if not wait_for_backend(timeout=30):
        print("[YT Deluxe] ERROR: Backend did not respond within 30s. Exiting.")
        kill_process_tree(backend_proc.pid)
        show_error(
            "YT Deluxe - Error",
            "YT Deluxe backend failed to start.\n\n"
            "Please try running the app again.\n"
            "If the problem persists, check if your antivirus is blocking it."
        )
        sys.exit(1)

    print("[YT Deluxe] Backend ready.")

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

    print(f"[YT Deluxe] Loading: {url}")

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
    def on_loaded():
        """Hook into WebView2's PermissionRequested to auto-grant all permissions.
        This prevents the native 'http://localhost:8000 wants to...' popup.
        Our JS-side PermissionDialog handles the branded user-facing flow instead.
        """
        try:
            from webview.platforms.edgechromium import BrowserView
            instance = BrowserView.instances.get(window.uid)
            if not instance:
                print("[YT Deluxe] No BrowserView instance found")
                return

            # Access the WinForms WebView2 control → CoreWebView2
            web_view = getattr(instance, 'browser', None) or getattr(instance, 'web_view', None)
            if not web_view:
                print("[YT Deluxe] No WebView2 control found on instance")
                return

            core = web_view.CoreWebView2
            if not core:
                print("[YT Deluxe] CoreWebView2 not yet initialized")
                return

            def on_permission_requested(sender, args):
                # CoreWebView2PermissionState: 0=Default, 1=Allow, 2=Deny
                args.State = 1  # Allow — our JS dialog already handled user consent
                kind = getattr(args, 'PermissionKind', 'unknown')
                print(f"[YT Deluxe] Auto-granted WebView2 permission: {kind}")

            core.PermissionRequested += on_permission_requested
            print("[YT Deluxe] WebView2 permission auto-grant: ACTIVE")

        except Exception as e:
            print(f"[YT Deluxe] Permission auto-grant setup failed: {e}")
            # Not fatal — JS-side dialog still works, user just sees native popup too

    window.events.loaded += on_loaded

    def on_closed():
        print("[YT Deluxe] Window closed. Killing backend process tree...")
        kill_process_tree(backend_proc.pid)

    window.events.closed += on_closed

    # Safety net: atexit fires even if on_closed is somehow skipped
    # (e.g., process killed externally or exception in webview)
    atexit.register(lambda: kill_process_tree(backend_proc.pid))

    # ── Step 4: Start WebView (blocking) ──────────────────────────────────
    # Try EdgeChromium first (best rendering), then fallback to default
    try:
        webview.start(debug=False, gui='edgechromium')
    except Exception as e:
        print(f"[YT Deluxe] EdgeChromium failed: {e}. Trying default...")
        try:
            webview.start(debug=False)
        except Exception as e2:
            backend_proc.terminate()
            show_error(
                "YT Deluxe — Missing Component",
                "YT Deluxe could not start because Microsoft WebView2 Runtime is missing.\n\n"
                "Please reinstall YT Deluxe using the Setup installer,\n"
                "or install WebView2 manually from:\n"
                "https://developer.microsoft.com/en-us/microsoft-edge/webview2/"
            )
            sys.exit(1)


if __name__ == '__main__':
    main()
