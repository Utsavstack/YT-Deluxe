/**
 * permissions.js — YT Deluxe Permission Manager
 *
 * Replaces the browser's native "localhost wants to..." popups with:
 * 1. A branded "YT Deluxe" in-app dialog
 * 2. Persistent grant/deny caching via YTDeluxeStorage (survives restarts)
 * 3. Auto-grant of previously approved permissions (no repeat popups)
 *
 * Usage:
 *   import { requestPermission, PERMISSIONS } from './permissions';
 *   const granted = await requestPermission(PERMISSIONS.CLIPBOARD_READ);
 */

import { YTDeluxeStorage } from './storage';

const PERM_STORAGE_KEY = 'ytdeluxe_permissions';

// ── Supported permission types ────────────────────────────────────────────────
export const PERMISSIONS = {
  CLIPBOARD_READ:  'clipboard-read',
  CLIPBOARD_WRITE: 'clipboard-write',
  NOTIFICATIONS:   'notifications',
  MICROPHONE:      'microphone',
};

// ── Human-readable metadata for each permission ───────────────────────────────
export const PERMISSION_META = {
  [PERMISSIONS.CLIPBOARD_READ]: {
    icon: 'ClipboardPaste',
    title: 'Clipboard Access',
    description: 'YT Deluxe wants to read your clipboard to auto-paste YouTube links.',
    reason: 'Used to detect YouTube links when you copy them.',
  },
  [PERMISSIONS.CLIPBOARD_WRITE]: {
    icon: 'Clipboard',
    title: 'Copy to Clipboard',
    description: 'YT Deluxe wants to copy content to your clipboard.',
    reason: 'Used for the copy title, description, and share link buttons.',
  },
  [PERMISSIONS.NOTIFICATIONS]: {
    icon: 'Bell',
    title: 'Notifications',
    description: 'YT Deluxe wants to send you desktop notifications.',
    reason: 'Used to notify you when downloads complete.',
  },
  [PERMISSIONS.MICROPHONE]: {
    icon: 'Mic',
    title: 'Microphone Access',
    description: 'YT Deluxe wants to use your microphone.',
    reason: 'Used for voice search functionality.',
  },
};

// ── In-memory cache (avoids storage round-trips during a session) ─────────────
let _memCache = null;

async function _loadGrants() {
  if (_memCache) return _memCache;
  const stored = await YTDeluxeStorage.getItem(PERM_STORAGE_KEY, {});
  _memCache = stored || {};
  return _memCache;
}

async function _saveGrants(grants) {
  _memCache = grants;
  await YTDeluxeStorage.setItem(PERM_STORAGE_KEY, grants);
}

/** Returns 'granted' | 'denied' | 'prompt' for a given permission key */
export async function getPermissionState(permissionKey) {
  const grants = await _loadGrants();
  return grants[permissionKey] || 'prompt';
}

/** Get all saved permission states */
export async function getAllPermissions() {
  return await _loadGrants();
}

/**
 * Reset a specific permission so the dialog shows again next time.
 * Called from the Settings > Permissions page.
 */
export async function resetPermission(permissionKey) {
  const grants = await _loadGrants();
  delete grants[permissionKey];
  await _saveGrants(grants);
}

/** Reset ALL permissions */
export async function resetAllPermissions() {
  await _saveGrants({});
}

// ── Dialog trigger (set by PermissionDialog.jsx) ─────────────────────────────
// The dialog component registers a callback here so the utility can trigger it.
let _showDialog = null;

export function _registerDialogHandler(handler) {
  _showDialog = handler;
}

/**
 * Main entry point — request a permission.
 *
 * - If previously granted → returns true immediately (no dialog)
 * - If previously denied  → returns false immediately (no dialog)
 * - If never asked        → shows the YT Deluxe branded in-app dialog
 *
 * @param {string} permissionKey  One of PERMISSIONS.*
 * @returns {Promise<boolean>}    true = granted, false = denied
 */
export async function requestPermission(permissionKey) {
  const grants = await _loadGrants();
  const existing = grants[permissionKey];

  // Previously decided — honour the cached result immediately
  if (existing === 'granted') return true;
  if (existing === 'denied')  return false;

  // First time — show in-app dialog
  if (!_showDialog) {
    // Fallback: no dialog registered yet — try native browser permission
    return await _requestNative(permissionKey);
  }

  return new Promise((resolve) => {
    _showDialog(permissionKey, async (allowed) => {
      const updated = { ...grants, [permissionKey]: allowed ? 'granted' : 'denied' };
      await _saveGrants(updated);
      resolve(allowed);
    });
  });
}

/** Actually request the native browser/OS permission after user approves in our dialog */
export async function _requestNative(permissionKey) {
  try {
    switch (permissionKey) {
      case PERMISSIONS.CLIPBOARD_READ:
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'clipboard-read' });
          return result.state !== 'denied';
        }
        return true;

      case PERMISSIONS.CLIPBOARD_WRITE:
        // clipboard-write is generally auto-granted in secure contexts
        return true;

      case PERMISSIONS.NOTIFICATIONS:
        if ('Notification' in window) {
          const result = await Notification.requestPermission();
          return result === 'granted';
        }
        return false;

      case PERMISSIONS.MICROPHONE:
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          return true;
        } catch { return false; }

      default:
        return false;
    }
  } catch {
    return false;
  }
}
