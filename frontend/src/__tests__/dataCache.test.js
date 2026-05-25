/**
 * Unit Tests — DataCache (Two-layer caching system)
 *
 * Tests the in-memory + sessionStorage caching system with TTL support.
 * Uses jsdom environment for sessionStorage access.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DataCacheModule, { TTL, CacheKey } from '../utils/dataCache.js';

// Get a fresh cache instance for each test
let cache;

beforeEach(() => {
  // Create a fresh DataCache for isolation
  // We can't easily re-instantiate the singleton, so we clear it instead
  cache = DataCacheModule;
  cache.clear();
});

// ─── TTL Constants ─────────────────────────────────────────────────────────
describe('TTL constants', () => {
  it('TRENDING is 10 minutes', () => {
    expect(TTL.TRENDING).toBe(10 * 60 * 1000);
  });

  it('SEARCH is 30 minutes', () => {
    expect(TTL.SEARCH).toBe(30 * 60 * 1000);
  });

  it('VIDEO_DETAILS is 5 minutes', () => {
    expect(TTL.VIDEO_DETAILS).toBe(5 * 60 * 1000);
  });

  it('HISTORY has no TTL (null)', () => {
    expect(TTL.HISTORY).toBeNull();
  });

  it('STORAGE is 2 minutes', () => {
    expect(TTL.STORAGE).toBe(2 * 60 * 1000);
  });
});

// ─── CacheKey helpers ──────────────────────────────────────────────────────
describe('CacheKey helpers', () => {
  it('generates trending key with category', () => {
    expect(CacheKey.trending('10')).toBe('trending_10');
  });

  it('generates search key with query and page', () => {
    expect(CacheKey.search('javascript', 2)).toBe('search_javascript_p2');
  });

  it('generates video details key from URL', () => {
    expect(CacheKey.videoDetails('https://youtu.be/abc')).toBe('video_https://youtu.be/abc');
  });

  it('generates history key', () => {
    expect(CacheKey.history()).toBe('history');
  });

  it('generates storage key', () => {
    expect(CacheKey.storage()).toBe('storage');
  });
});

// ─── Core Cache Operations ─────────────────────────────────────────────────
describe('DataCache.set and .get', () => {
  it('stores and retrieves data', () => {
    cache.set('test-key', { foo: 'bar' }, 60000);
    expect(cache.get('test-key')).toEqual({ foo: 'bar' });
  });

  it('returns null for non-existent key', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('stores data without TTL (null = no expiry)', () => {
    cache.set('permanent', 'data', null);
    expect(cache.get('permanent')).toBe('data');
  });

  it('stores data without TTL when ttlMs is undefined', () => {
    cache.set('no-ttl', 'data');
    expect(cache.get('no-ttl')).toBe('data');
  });
});

describe('DataCache.has', () => {
  it('returns true when key exists', () => {
    cache.set('exists', 'value', 60000);
    expect(cache.has('exists')).toBe(true);
  });

  it('returns false when key does not exist', () => {
    expect(cache.has('missing')).toBe(false);
  });
});

describe('DataCache.invalidate', () => {
  it('removes a specific key', () => {
    cache.set('remove-me', 'data', 60000);
    cache.invalidate('remove-me');
    expect(cache.get('remove-me')).toBeNull();
  });

  it('does not affect other keys', () => {
    cache.set('keep', 'keep-data', 60000);
    cache.set('remove', 'remove-data', 60000);
    cache.invalidate('remove');
    expect(cache.get('keep')).toBe('keep-data');
  });
});

describe('DataCache.invalidatePrefix', () => {
  it('removes all keys with matching prefix', () => {
    cache.set('search_js_p1', 'result1', 60000);
    cache.set('search_js_p2', 'result2', 60000);
    cache.set('trending_0', 'trending', 60000);

    cache.invalidatePrefix('search_');

    expect(cache.get('search_js_p1')).toBeNull();
    expect(cache.get('search_js_p2')).toBeNull();
    expect(cache.get('trending_0')).toBe('trending'); // Not removed
  });
});

describe('DataCache.clear', () => {
  it('removes all entries', () => {
    cache.set('a', 1, 60000);
    cache.set('b', 2, 60000);
    cache.set('c', 3, 60000);
    cache.clear();

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
    expect(cache.get('c')).toBeNull();
  });
});

// ─── TTL Expiration ────────────────────────────────────────────────────────
describe('DataCache TTL expiration', () => {
  it('returns null for expired entries', () => {
    // Set with 1ms TTL
    cache.set('expiring', 'data', 1);

    // Advance time
    vi.useFakeTimers();
    vi.advanceTimersByTime(50);

    expect(cache.get('expiring')).toBeNull();

    vi.useRealTimers();
  });

  it('returns data for non-expired entries', () => {
    vi.useFakeTimers();
    cache.set('fresh', 'data', 60000);
    vi.advanceTimersByTime(1000); // only 1 second passed

    expect(cache.get('fresh')).toBe('data');

    vi.useRealTimers();
  });

  it('entries with null TTL never expire', () => {
    vi.useFakeTimers();
    cache.set('forever', 'immortal', null);
    vi.advanceTimersByTime(999999999); // ~11 days

    expect(cache.get('forever')).toBe('immortal');

    vi.useRealTimers();
  });
});
