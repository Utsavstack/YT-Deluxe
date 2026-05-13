/**
 * dataCache.js — YT-Deluxe Frontend Data Cache
 *
 * Two-layer cache:
 *  1. In-memory Map (fastest, wiped on page refresh)
 *  2. sessionStorage (survives F5 refresh, wiped when app window closes)
 *
 * Both layers respect per-entry TTL (Time-To-Live).
 * Use dataCache.get/set/has/invalidate everywhere instead of calling APIs directly.
 */

// ─── TTL Constants ────────────────────────────────────────────────────────────
export const TTL = {
  TRENDING:     10 * 60 * 1000,  // 10 min  (matches backend trending cache interval)
  SEARCH:       30 * 60 * 1000,  // 30 min  (matches backend search cache TTL)
  VIDEO_DETAILS: 5 * 60 * 1000,  // 5 min   (safe for download URLs which expire)
  HISTORY:      null,             // No TTL  (invalidated explicitly after downloads/deletes)
  STORAGE:       2 * 60 * 1000,  // 2 min
};

// ─── Session Storage Prefix ────────────────────────────────────────────────────
const SS_PREFIX = 'ytdeluxe_cache_';

// ─── Core Cache Class ─────────────────────────────────────────────────────────
class DataCache {
  constructor() {
    this._mem = new Map(); // { key: { data, expireAt } }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  _isExpired(entry) {
    if (!entry) return true;
    if (entry.expireAt === null) return false; // No TTL = never expires
    return Date.now() > entry.expireAt;
  }

  _readSession(key) {
    try {
      const raw = sessionStorage.getItem(SS_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (this._isExpired(entry)) {
        sessionStorage.removeItem(SS_PREFIX + key);
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  }

  _writeSession(key, entry) {
    try {
      sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(entry));
    } catch {
      // sessionStorage quota exceeded — silently skip persisting
    }
  }

  _removeSession(key) {
    try {
      sessionStorage.removeItem(SS_PREFIX + key);
    } catch {}
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  /**
   * get(key) — returns cached data or null if missing/expired.
   * Checks memory first (fastest), then sessionStorage (survives F5).
   */
  get(key) {
    // 1. Check in-memory
    const memEntry = this._mem.get(key);
    if (memEntry && !this._isExpired(memEntry)) {
      return memEntry.data;
    }

    // 2. Check sessionStorage (populate memory from it for next access)
    const ssEntry = this._readSession(key);
    if (ssEntry) {
      this._mem.set(key, ssEntry); // Warm up memory
      return ssEntry.data;
    }

    return null;
  }

  /**
   * set(key, data, ttlMs) — stores data in both layers.
   * ttlMs = null means "no expiry" (for history/saved items).
   */
  set(key, data, ttlMs) {
    const expireAt = ttlMs != null ? Date.now() + ttlMs : null;
    const entry = { data, expireAt };
    this._mem.set(key, entry);
    this._writeSession(key, entry);
  }

  /**
   * has(key) — true if data exists and is not expired.
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * invalidate(key) — remove a specific cache entry from both layers.
   * Use this after downloads complete, history items are deleted, etc.
   */
  invalidate(key) {
    this._mem.delete(key);
    this._removeSession(key);
  }

  /**
   * invalidatePrefix(prefix) — remove all keys starting with prefix.
   * Useful for clearing all search cache: invalidatePrefix('search_')
   */
  invalidatePrefix(prefix) {
    // Memory
    for (const key of this._mem.keys()) {
      if (key.startsWith(prefix)) {
        this._mem.delete(key);
      }
    }
    // sessionStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const ssKey = sessionStorage.key(i);
        if (ssKey && ssKey.startsWith(SS_PREFIX + prefix)) {
          keysToRemove.push(ssKey);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch {}
  }

  /**
   * clear() — wipe everything from both layers.
   */
  clear() {
    this._mem.clear();
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(SS_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch {}
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
// One shared instance across the entire app
const dataCache = new DataCache();
export default dataCache;

// ─── Cache Key Helpers ────────────────────────────────────────────────────────
// Use these constants everywhere to avoid typos in key names
export const CacheKey = {
  trending:     (categoryId) => `trending_${categoryId}`,
  search:       (query, page) => `search_${query}_p${page}`,
  videoDetails: (url)        => `video_${url}`,
  history:      ()           => `history`,
  storage:      ()           => `storage`,
};
