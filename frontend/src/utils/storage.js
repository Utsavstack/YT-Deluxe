import YTDeluxeAPI from './api';

const STORAGE_KEYS = {
  HISTORY_WEB: 'ytdeluxe_web_history',
  SAVED: 'ytdeluxe_saved',
  THEME: 'ytdeluxe_theme',
  ACCENT_COLOR: 'ytdeluxe_accent_color',
  LANGUAGE: 'ytdeluxe_language',
  USER_PROFILE: 'ytdeluxe_user_profile',
  DOWNLOAD_PREFS: 'ytdeluxe_download_preferences',
  DOWNLOAD_PATH: 'ytdeluxe_download_path'
};

const isDesktop = () => typeof window !== 'undefined' && window.pywebview !== undefined;

class YTDeluxeStorage {
  static async getItem(key, defaultValue = null) {
    if (isDesktop()) {
      try {
        // For settings-related keys, we try to get from backend
        // This keeps Desktop data in JSON files
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/settings/${key}`);
        if (response.ok) {
          const data = await response.json();
          return data.value !== undefined ? data.value : defaultValue;
        }
      } catch (error) {
        console.error(`Error loading ${key} from desktop settings:`, error);
      }
    }
    
    // Fallback to localStorage for web or if desktop API fails
    const item = localStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return item || defaultValue;
    }
  }

  static async setItem(key, value) {
    if (isDesktop()) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/settings/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value })
        });
      } catch (error) {
        console.error(`Error saving ${key} to desktop settings:`, error);
      }
    }

    // Always keep a local copy for immediate UI responsiveness and web support
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  }

  static async removeItem(key) {
    if (isDesktop()) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/settings/${key}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error(`Error removing ${key} from desktop settings:`, error);
      }
    }
    localStorage.removeItem(key);
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
