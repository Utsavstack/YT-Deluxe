import webview
import subprocess
import sys
import os
import time
import http.client


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


def start_backend():
    """Spawn FastAPI backend as a subprocess."""
    env = os.environ.copy()
    env["YTDELUXE_DESKTOP"] = "true"  # Activates desktop CORS mode in main.py

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
    def read_clipboard(self):
        try:
            # Using PowerShell instead of ctypes to avoid GUI thread deadlocks 
            # and hard crashes with pywebview on Edge Chromium.
            import subprocess
            out = subprocess.check_output(
                ["powershell", "-command", "Get-Clipboard"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return out.decode("utf-8", errors="ignore").strip()
        except Exception:
            return ""


def main():
    # ── Step 1: Start Backend ─────────────────────────────────────────────
    print("[YT Deluxe] Starting backend...")
    backend_proc = start_backend()

    print("[YT Deluxe] Waiting for backend to be ready...")
    if not wait_for_backend(timeout=30):
        print("[YT Deluxe] ERROR: Backend did not respond within 30s. Exiting.")
        backend_proc.terminate()
        show_error(
            "YT Deluxe — Error",
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
        url = 'http://127.0.0.1:8000/'
    else:
        # Dev: Vite dev server must be running separately on port 5848
        url = 'http://localhost:5848'

    print(f"[YT Deluxe] Loading: {url}")

    # ── Step 3: Create Window ─────────────────────────────────────────────
    api = AppApi()
    window = webview.create_window(
        title='YT Deluxe',
        url=url,
        js_api=api,
        width=1280,
        height=800,
        min_size=(900, 600),
        resizable=True,
        text_select=True,
    )

    def on_closed():
        print("[YT Deluxe] Window closed. Terminating backend...")
        backend_proc.terminate()

    window.events.closed += on_closed

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
