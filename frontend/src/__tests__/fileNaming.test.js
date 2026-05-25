/**
 * Unit Tests — File Naming Utility
 *
 * Tests: sanitizeFilename, buildFilename with various naming conventions
 * Uses jsdom for localStorage access.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeFilename, buildFilename, getDownloadPrefs } from '../utils/fileNaming.js';

const PREFS_KEY = 'ytdeluxe_download_preferences';

beforeEach(() => {
  localStorage.clear();
});

// ─── sanitizeFilename ──────────────────────────────────────────────────────
describe('sanitizeFilename', () => {
  it('removes Windows-illegal characters (\\/:*?"<>|)', () => {
    expect(sanitizeFilename('file:name*test?.txt')).toBe('filenametest.txt');
  });

  it('removes control characters', () => {
    expect(sanitizeFilename('hello\x00world\x1F')).toBe('helloworld');
  });

  it('collapses multiple spaces into single space', () => {
    expect(sanitizeFilename('hello    world')).toBe('hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeFilename('  hello world  ')).toBe('hello world');
  });

  it('removes leading and trailing dots', () => {
    expect(sanitizeFilename('...filename...')).toBe('filename');
  });

  it('keeps valid characters (letters, numbers, dashes, underscores)', () => {
    expect(sanitizeFilename('my-video_2024 (1080p)')).toBe('my-video_2024 (1080p)');
  });

  it('handles empty string after sanitization', () => {
    expect(sanitizeFilename(':::**???')).toBe('');
  });
});

// ─── buildFilename ─────────────────────────────────────────────────────────
describe('buildFilename', () => {
  it('defaults to title-only naming convention', () => {
    const result = buildFilename({ title: 'My Cool Video' });
    expect(result).toBe('My Cool Video');
  });

  it('uses title_channel convention when set', () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ namingConvention: 'title_channel' }));
    const result = buildFilename({ title: 'My Video', channel: 'TechGuru' });
    expect(result).toBe('My Video - TechGuru');
  });

  it('uses channel_title convention when set', () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ namingConvention: 'channel_title' }));
    const result = buildFilename({ title: 'My Video', channel: 'TechGuru' });
    expect(result).toBe('TechGuru - My Video');
  });

  it('falls back to title only when channel is missing for title_channel', () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ namingConvention: 'title_channel' }));
    const result = buildFilename({ title: 'My Video' });
    expect(result).toBe('My Video');
  });

  it('applies custom template with placeholders', () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      namingConvention: 'custom',
      customTemplate: '{channel} - {title} [{quality}]',
    }));
    const result = buildFilename({ title: 'Video', channel: 'Creator', quality: '1080p' });
    expect(result).toBe('Creator - Video [1080p]');
  });

  it('uses "Untitled" when title is empty', () => {
    const result = buildFilename({ title: '' });
    expect(result).toBe('Untitled');
  });

  it('sanitizes filename when removeSpecialChars is enabled', () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ removeSpecialChars: true }));
    const result = buildFilename({ title: 'Video: The *Best* Version?' });
    expect(result).toBe('Video The Best Version');
  });

  it('appends download date when addDownloadDate is enabled', () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ addDownloadDate: true }));
    // Also set date format to something predictable
    localStorage.setItem('ytdeluxe_language_settings', JSON.stringify({ dateFormat: 'YYYY-MM-DD' }));
    const result = buildFilename({ title: 'My Video' });
    // Should contain the date in brackets
    expect(result).toMatch(/^My Video \[\d{4}-\d{2}-\d{2}\]$/);
  });
});

// ─── getDownloadPrefs ──────────────────────────────────────────────────────
describe('getDownloadPrefs', () => {
  it('returns empty object when no prefs are stored', () => {
    expect(getDownloadPrefs()).toEqual({});
  });

  it('returns stored preferences', () => {
    const prefs = { namingConvention: 'title_channel', removeSpecialChars: true };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    expect(getDownloadPrefs()).toEqual(prefs);
  });

  it('returns empty object when localStorage has invalid JSON', () => {
    localStorage.setItem(PREFS_KEY, 'not-json');
    expect(getDownloadPrefs()).toEqual({});
  });
});
