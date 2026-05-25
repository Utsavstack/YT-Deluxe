import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./utils/i18n";
import "./styles/tailwind.css";
import "./styles/index.css";
import { requestPermission, getPermissionState, PERMISSIONS, markClipboardGranted, markMicrophoneGranted } from "./utils/permissions";

// Guard: stop calling pywebview bridge during page reload/unload
window.__ytdeluxe_unloading = false;
window.addEventListener('beforeunload', () => {
  window.__ytdeluxe_unloading = true;
});

// ─── Clipboard Intercepts ────────────────────────────────────────────────────
// Clipboard is system-managed on desktop (like microphone):
//   - Auto-granted at startup — no native OS dialog
//   - If user resets in Settings, the YT Deluxe branded dialog shows next time
//   - State is persisted in YTDeluxeStorage so it survives restarts
// On web, falls back to native browser clipboard API.

if (!navigator.clipboard) {
  navigator.clipboard = {};
}

const _originalReadText  = navigator.clipboard.readText?.bind(navigator.clipboard);
const _originalWriteText = navigator.clipboard.writeText?.bind(navigator.clipboard);

/**
 * Check clipboard permission state and auto-grant on desktop if needed.
 * Returns true if allowed, false if denied.
 */
async function _ensureClipboardPermission(permKey) {
  const state = await getPermissionState(permKey);

  if (state === 'granted') return true;
  if (state === 'denied') return false;

  // state === 'prompt' — first time or after reset
  const isDesktop = !!window.pywebview?.api;
  if (isDesktop) {
    // Desktop: auto-grant without dialog (system managed)
    await markClipboardGranted();
    return true;
  }

  // Web mode: show YT Deluxe branded dialog
  return await requestPermission(permKey);
}

// readText — permission-aware, uses pywebview bridge on desktop
navigator.clipboard.readText = async function () {
  if (window.__ytdeluxe_unloading) return "";

  const allowed = await _ensureClipboardPermission(PERMISSIONS.CLIPBOARD_READ);
  if (!allowed) return "";

  // Desktop bridge (PowerShell Get-Clipboard — no OS popup)
  try {
    if (
      window.pywebview?.api?.read_clipboard &&
      window.pywebview?._returnValuesCallbacks
    ) {
      return await window.pywebview.api.read_clipboard();
    }
  } catch { /* bridge not ready */ }

  // Web fallback
  if (_originalReadText) {
    try { return await _originalReadText(); } catch { /* denied */ }
  }
  return "";
};

// writeText — permission-aware, uses pywebview bridge on desktop
navigator.clipboard.writeText = async function (text) {
  if (window.__ytdeluxe_unloading) return;

  const allowed = await _ensureClipboardPermission(PERMISSIONS.CLIPBOARD_WRITE);
  if (!allowed) return;

  // Desktop bridge (PowerShell Set-Clipboard — no OS popup)
  try {
    if (
      window.pywebview?.api?.write_clipboard &&
      window.pywebview?._returnValuesCallbacks
    ) {
      await window.pywebview.api.write_clipboard(text);
      return;
    }
  } catch { /* bridge not ready */ }

  // Web fallback
  if (_originalWriteText) {
    try { await _originalWriteText(text); } catch { /* denied */ }
  }
};

// ── Desktop system-managed auto-grant ───────────────────────────────────────────
// When running in the pywebview desktop app, clipboard AND microphone are
// system-managed — no OS permission dialog ever appears. Mark them as 'granted'
// in storage so Settings > App Permissions shows the correct status.
if (typeof window !== 'undefined') {
  const _tryMarkSystemPerms = () => {
    if (window.pywebview?.api) {
      markClipboardGranted();
      markMicrophoneGranted();
    }
  };
  // Try immediately (may already be injected)
  _tryMarkSystemPerms();
  // Also try after a short delay in case the bridge initialises just after JS runs
  setTimeout(_tryMarkSystemPerms, 1500);
}


// ─── Microphone Intercept ────────────────────────────────────────────────────────
// Microphone is system-managed on desktop (like clipboard):
//   - Auto-granted at startup — no native "localhost wants to..." dialog
//   - If user resets in Settings, the YT Deluxe branded dialog shows next time
//   - Result is persisted in YTDeluxeStorage so it survives restarts

const _originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);

if (navigator.mediaDevices && _originalGetUserMedia) {
  navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (window.__ytdeluxe_unloading) {
      throw new DOMException('App unloading', 'AbortError');
    }

    // Only intercept audio (microphone) — it's the only mediaDevice YT Deluxe uses
    if (constraints?.audio) {
      const state = await getPermissionState(PERMISSIONS.MICROPHONE);

      if (state === 'granted') {
        // Already granted (system or user) — proceed silently
        return await _originalGetUserMedia(constraints);
      }

      if (state === 'denied') {
        // User explicitly denied via our dialog or Settings
        throw new DOMException('Microphone permission denied by YT Deluxe', 'NotAllowedError');
      }

      // state === 'prompt' — first time or after reset
      const isDesktop = !!window.pywebview?.api;
      if (isDesktop) {
        // Desktop: auto-grant without showing any dialog (system managed)
        await markMicrophoneGranted();
        return await _originalGetUserMedia(constraints);
      }

      // Web mode: show the YT Deluxe branded dialog
      const granted = await requestPermission(PERMISSIONS.MICROPHONE);
      if (!granted) {
        throw new DOMException('Microphone permission denied by YT Deluxe', 'NotAllowedError');
      }
      return await _originalGetUserMedia(constraints);
    }

    // Non-audio constraints — pass through unchanged
    return await _originalGetUserMedia(constraints);
  };
}

// ─── Notification Intercept ──────────────────────────────────────────────────
// Same pattern: show our branded dialog, not the browser's "localhost" one.

if ('Notification' in window) {
  const _originalRequestPerm = Notification.requestPermission?.bind(Notification);

  Notification.requestPermission = async function (callback) {
    const granted = await requestPermission(PERMISSIONS.NOTIFICATIONS);
    const result = granted ? 'granted' : 'denied';
    if (callback) callback(result);
    return result;
  };
}

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);

