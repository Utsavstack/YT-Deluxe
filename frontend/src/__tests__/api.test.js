/**
 * Unit Tests — YTDeluxeAPI static helper methods
 *
 * Tests: extractVideoId, formatDuration, formatFileSize, isYouTubeUrl
 * These are pure functions — no API calls, no DOM, no side effects.
 */
import { describe, it, expect } from 'vitest';

// We only need the class for its static methods, mock the fetch-dependent parts
const { default: YTDeluxeAPI } = await import('../utils/api.js');

// ─── extractVideoId ────────────────────────────────────────────────────────
describe('YTDeluxeAPI.extractVideoId', () => {
  it('extracts ID from standard youtube.com/watch?v= URL', () => {
    expect(YTDeluxeAPI.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be short URL', () => {
    expect(YTDeluxeAPI.extractVideoId('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URL', () => {
    expect(YTDeluxeAPI.extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from URL with extra query params', () => {
    expect(YTDeluxeAPI.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLx'))
      .toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube URLs', () => {
    expect(YTDeluxeAPI.extractVideoId('https://www.google.com')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(YTDeluxeAPI.extractVideoId('')).toBeNull();
  });

  it('extracts ID from mobile youtube URL', () => {
    expect(YTDeluxeAPI.extractVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });
});

// ─── formatDuration ────────────────────────────────────────────────────────
describe('YTDeluxeAPI.formatDuration', () => {
  it('formats seconds under a minute', () => {
    expect(YTDeluxeAPI.formatDuration(45)).toBe('0:45');
  });

  it('formats exact minutes', () => {
    expect(YTDeluxeAPI.formatDuration(120)).toBe('2:00');
  });

  it('formats minutes and seconds with padding', () => {
    expect(YTDeluxeAPI.formatDuration(185)).toBe('3:05');
  });

  it('formats hours correctly', () => {
    expect(YTDeluxeAPI.formatDuration(3661)).toBe('1:01:01');
  });

  it('handles zero seconds', () => {
    expect(YTDeluxeAPI.formatDuration(0)).toBe('0:00');
  });

  it('pads minutes when hours are present', () => {
    expect(YTDeluxeAPI.formatDuration(3600)).toBe('1:00:00');
  });
});

// ─── formatFileSize ────────────────────────────────────────────────────────
describe('YTDeluxeAPI.formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(YTDeluxeAPI.formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes', () => {
    expect(YTDeluxeAPI.formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(YTDeluxeAPI.formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes with decimals', () => {
    expect(YTDeluxeAPI.formatFileSize(1536 * 1024)).toBe('1.5 MB');
  });

  it('formats gigabytes', () => {
    expect(YTDeluxeAPI.formatFileSize(1073741824)).toBe('1 GB');
  });

  it('formats large file sizes with precision', () => {
    const result = YTDeluxeAPI.formatFileSize(1500000000);
    expect(result).toBe('1.4 GB');
  });
});

// ─── isYouTubeUrl ──────────────────────────────────────────────────────────
describe('YTDeluxeAPI.isYouTubeUrl', () => {
  it('returns true for youtube.com URL', () => {
    expect(YTDeluxeAPI.isYouTubeUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
  });

  it('returns true for youtu.be URL', () => {
    expect(YTDeluxeAPI.isYouTubeUrl('https://youtu.be/abc')).toBe(true);
  });

  it('returns false for non-YouTube URL', () => {
    expect(YTDeluxeAPI.isYouTubeUrl('https://www.google.com')).toBe(false);
  });

  it('returns false for plain text query', () => {
    expect(YTDeluxeAPI.isYouTubeUrl('how to code in javascript')).toBe(false);
  });

  it('returns false for non-string input', () => {
    expect(YTDeluxeAPI.isYouTubeUrl(123)).toBe(false);
    expect(YTDeluxeAPI.isYouTubeUrl(null)).toBe(false);
    expect(YTDeluxeAPI.isYouTubeUrl(undefined)).toBe(false);
  });
});
