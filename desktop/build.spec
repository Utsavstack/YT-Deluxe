# -*- mode: python ; coding: utf-8 -*-
# YT Deluxe Desktop — PyInstaller build spec
# Output: desktop/dist/YT-Deluxe/ folder (--onedir mode)
import os

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT          = os.path.abspath(os.path.join(SPECPATH, '..'))
FRONTEND_DIR  = os.path.join(ROOT, 'frontend', 'build')      # npm run build output
BACKEND_EXE   = os.path.join(ROOT, 'backend', 'dist', 'main.exe')
FFMPEG_EXE    = os.path.join(ROOT, 'backend', 'ffmpeg.exe')  # place here before build
ICON_FILE     = os.path.join(SPECPATH, 'assets', 'icon.ico')

# ── Pre-build validation ──────────────────────────────────────────────────────
assert os.path.isdir(FRONTEND_DIR), (
    f"\n[ERROR] frontend/build/ not found.\n"
    f"Run this first:\n  cd frontend\n  npm run build\n"
    f"Expected at: {FRONTEND_DIR}\n"
)
assert os.path.isfile(BACKEND_EXE), (
    f"\n[ERROR] backend/dist/main.exe not found.\n"
    f"Run this first:\n  cd backend\n"
    f"  pyinstaller --onefile --windowed --name main main.py\n"
    f"Expected at: {BACKEND_EXE}\n"
)
assert os.path.isfile(FFMPEG_EXE), (
    f"\n[ERROR] backend/ffmpeg.exe not found.\n"
    f"Download from: https://www.gyan.dev/ffmpeg/builds/\n"
    f"Place ffmpeg.exe at: {FFMPEG_EXE}\n"
)

# ── Analysis ──────────────────────────────────────────────────────────────────
a = Analysis(
    [os.path.join(SPECPATH, 'launcher.py')],
    pathex=[SPECPATH],
    binaries=[
        (BACKEND_EXE, 'backend'),   # → YT-Deluxe/backend/main.exe
        (FFMPEG_EXE,  'backend'),   # → YT-Deluxe/backend/ffmpeg.exe
    ],
    datas=[
        (FRONTEND_DIR, 'frontend'), # → YT-Deluxe/frontend/ (entire build folder)
    ],
    hiddenimports=[
        'webview',
        'webview.platforms.winforms',
        'clr',
    ],
    hookspath=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

# ── EXE (launcher only — no data embedded) ───────────────────────────────────
exe = EXE(
    pyz,
    a.scripts,
    [],                   # ← Empty: data goes into COLLECT, not EXE
    exclude_binaries=True,  # ← Required for onedir mode
    name='YT-Deluxe',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,        # No black console window
    icon=ICON_FILE,
)

# ── COLLECT (assembles the onedir output folder) ─────────────────────────────
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='YT-Deluxe',    # Output folder name: desktop/dist/YT-Deluxe/
)
