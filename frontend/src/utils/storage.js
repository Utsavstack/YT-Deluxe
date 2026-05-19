import YTDeluxeAPI from './api';

const STORAGE_KEYS = {
  HISTORY_WEB: 'ytdeluxe_web_history',
  SAVED: 'ytdeluxe_saved',
  THEME: 'ytdeluxe_theme',
  ACCENT_COLOR: 'ytdeluxe_accent_color',
  LANGUAGE: 'ytdeluxe_language',
  LANGUAGE_SETTINGS: 'ytdeluxe_language_settings',
  USER_PROFILE: 'ytdeluxe_user_profile',
  DOWNLOAD_PREFS: 'ytdeluxe_download_preferences',
  DOWNLOAD_PATH: 'ytdeluxe_download_path'
};

const isDesktop = () => typeof window !== 'undefined' && window.pywebview !== undefined;

class YTDeluxeStorage {
  static async getItem(key, defaultValue = null) {
    if (isDesktop()) {
      try {
        // For settings-related keys, we try to get from backend.
        // This keeps Desktop data in JSON files that survive app updates.
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/settings/${key}`);
        if (response.ok) {
          const data = await response.json();
          // KEY FIX: Only use backend value if it is truly non-null.
          // If the backend returns null (key never saved there), fall through
          // to localStorage — which acts as our reliable secondary source.
          if (data.value !== undefined && data.value !== null) {
            return data.value;
          }
        }
      } catch (error) {
        console.error(`Error loading ${key} from desktop settings:`, error);
      }
    }

    // Fallback: localStorage for web mode, OR for desktop when the backend
    // returned null/failed (e.g. first run, or previous save race-condition).
    // This prevents settings from resetting on every app restart.
    const item = localStorage.getItem(key);
    try {
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch {
      return item || defaultValue;
    }
  }

  static async setItem(key, value) {
    // Write to localStorage FIRST so the UI is instantly responsive and a
    // reliable fallback is always available (even if the backend call fails).
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);

    if (isDesktop()) {
      try {
        // Then persist to the backend (~/.yt-deluxe/settings.json) so settings
        // survive across WebView2 profile resets and app updates.
        await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/settings/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value })
        });
      } catch (error) {
        console.error(`Error saving ${key} to desktop settings:`, error);
      }
    }
  }

  static async removeItem(key) {
    localStorage.removeItem(key);

    if (isDesktop()) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/settings/${key}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error(`Error removing ${key} from desktop settings:`, error);
      }
    }
  }

  // Helper for history which is handled specifically by the history API on desktop
  static async getHistory() {
    if (isDesktop()) {
      const response = await YTDeluxeAPI.getDownloadHistory();
      return response.history || [];
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY_WEB) || '[]');
  }
}

export { STORAGE_KEYS, YTDeluxeStorage, isDesktop };
