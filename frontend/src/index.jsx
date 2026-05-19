import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./utils/i18n";
import "./styles/tailwind.css";
import "./styles/index.css";
import { requestPermission, PERMISSIONS } from "./utils/permissions";

// Guard: stop calling pywebview bridge during page reload/unload
window.__ytdeluxe_unloading = false;
window.addEventListener('beforeunload', () => {
  window.__ytdeluxe_unloading = true;
});

// ─── Clipboard Intercepts ────────────────────────────────────────────────────
// Replace the native clipboard APIs with versions that:
//   1. Use the pywebview bridge on desktop (no OS permission popup at all)
//   2. Fall back to the browser API on web
// This means no "localhost wants to..." dialog EVER appears for clipboard.

if (!navigator.clipboard) {
  navigator.clipboard = {};
}

const _originalReadText  = navigator.clipboard.readText?.bind(navigator.clipboard);
const _originalWriteText = navigator.clipboard.writeText?.bind(navigator.clipboard);

// readText — use pywebview bridge (powershell Get-Clipboard, no permission needed)
navigator.clipboard.readText = async function () {
  if (window.__ytdeluxe_unloading) return "";
  try {
    if (
      window.pywebview?.api?.read_clipboard &&
      window.pywebview?._returnValuesCallbacks
    ) {
      return await window.pywebview.api.read_clipboard();
    }
  } catch { /* bridge not ready */ }

  if (_originalReadText) {
    try { return await _originalReadText(); } catch { /* denied */ }
  }
  return "";
};

// writeText — use pywebview bridge (powershell Set-Clipboard, no permission needed)
navigator.clipboard.writeText = async function (text) {
  if (window.__ytdeluxe_unloading) return;
  try {
    if (
      window.pywebview?.api?.write_clipboard &&
      window.pywebview?._returnValuesCallbacks
    ) {
      await window.pywebview.api.write_clipboard(text);
      return;
    }
  } catch { /* bridge not ready */ }

  if (_originalWriteText) {
    try { await _originalWriteText(text); } catch { /* denied */ }
  }
};

// ─── Microphone Intercept ────────────────────────────────────────────────────
// Intercept getUserMedia so our YT Deluxe branded dialog shows INSTEAD of the
// native WebView2 "localhost:8000 wants to use your microphone" popup.
// The Python-side auto-grant (launcher.py) ensures the native dialog is suppressed
// even after we call the original getUserMedia.

const _originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);

if (navigator.mediaDevices && _originalGetUserMedia) {
  navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (window.__ytdeluxe_unloading) {
      throw new DOMException('App unloading', 'AbortError');
    }

    // Only intercept microphone — it's the only one YT Deluxe uses (voice search)
    if (constraints?.audio) {
      const granted = await requestPermission(PERMISSIONS.MICROPHONE);
      if (!granted) {
        throw new DOMException('Microphone permission denied by YT Deluxe', 'NotAllowedError');
      }
    }

    // Permission granted (or cached) — proceed with original call
    // Python-side auto-grant suppresses the native WebView2 dialog
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

