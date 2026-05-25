"""
Export YouTube cookies from your browser to cookies.txt
Run this script ONCE to set up the cookies file.
After running, restart the backend server.

Usage: python export_cookies.py
"""
import subprocess
import sys
import os

browsers = ['chrome', 'edge', 'firefox', 'chromium', 'brave']

print("YT Deluxe — Cookie Export Tool")
print("=" * 45)
print("This exports your YouTube login cookies so the")
print("downloader can access 1080p/4K/8K quality streams.")
print()
print("IMPORTANT: Close all Chrome/Edge windows first!")
print()

for browser in browsers:
    print(f"Trying {browser}...")
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'yt_dlp',
             '--cookies-from-browser', browser,
             '--cookies', 'cookies.txt',
             '--skip-download',
             'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
            capture_output=True, text=True, timeout=30,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if result.returncode == 0 and os.path.exists('cookies.txt'):
            size = os.path.getsize('cookies.txt')
            if size > 100:
                print(f"SUCCESS! Cookies exported from {browser} ({size} bytes)")
                print("You can now restart the backend server.")
                sys.exit(0)
            else:
                print(f"  Cookie file too small ({size} bytes), trying next browser...")
        else:
            err = result.stderr[:200] if result.stderr else 'no error'
            print(f"  Failed: {err.strip()}")
    except Exception as e:
        print(f"  Error: {e}")

print()
print("All browsers failed. Options:")
print("1. Close all browser windows, then re-run this script")
print("2. Use the 'Get cookies.txt LOCALLY' Chrome extension:")
print("   https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc")
print("   Then save as: backend/cookies.txt")
