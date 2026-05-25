/**
 * Unit Tests — Date & Time Formatting Utilities
 *
 * Tests: formatDate, formatTime, formatDateTime, formatNumber
 * Uses jsdom for localStorage access.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { formatDate, formatTime, formatDateTime, formatNumber } from '../utils/dateFormat.js';

const SETTINGS_KEY = 'ytdeluxe_language_settings';

// Fixed date for deterministic tests: 2024-03-15 14:30:45
const FIXED_DATE = new Date(2024, 2, 15, 14, 30, 45);

beforeEach(() => {
  localStorage.clear();
});

// ─── formatDate ────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('defaults to DD/MM/YYYY format', () => {
    expect(formatDate(FIXED_DATE)).toBe('15/03/2024');
  });

  it('formats as MM/DD/YYYY when set', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dateFormat: 'MM/DD/YYYY' }));
    expect(formatDate(FIXED_DATE)).toBe('03/15/2024');
  });

  it('formats as YYYY-MM-DD (ISO) when set', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dateFormat: 'YYYY-MM-DD' }));
    expect(formatDate(FIXED_DATE)).toBe('2024-03-15');
  });

  it('formats as DD MMM YYYY when set', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dateFormat: 'DD MMM YYYY' }));
    expect(formatDate(FIXED_DATE)).toBe('15 Mar 2024');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('accepts Date objects, strings, and timestamps', () => {
    const timestamp = FIXED_DATE.getTime();
    const isoString = FIXED_DATE.toISOString();

    // All should produce the same result with default format
    expect(formatDate(FIXED_DATE)).toBe(formatDate(timestamp));
    expect(formatDate(FIXED_DATE)).toBe(formatDate(isoString));
  });
});

// ─── formatTime ────────────────────────────────────────────────────────────
describe('formatTime', () => {
  it('defaults to 12-hour format', () => {
    expect(formatTime(FIXED_DATE)).toBe('2:30 PM');
  });

  it('formats as 24-hour when set', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ timeFormat: '24h' }));
    expect(formatTime(FIXED_DATE)).toBe('14:30');
  });

  it('includes seconds when requested', () => {
    expect(formatTime(FIXED_DATE, { includeSeconds: true })).toBe('2:30:45 PM');
  });

  it('includes seconds in 24h format', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ timeFormat: '24h' }));
    expect(formatTime(FIXED_DATE, { includeSeconds: true })).toBe('14:30:45');
  });

  it('handles midnight (0:00) in 12h format', () => {
    const midnight = new Date(2024, 2, 15, 0, 5, 0);
    expect(formatTime(midnight)).toBe('12:05 AM');
  });

  it('handles noon (12:00) in 12h format', () => {
    const noon = new Date(2024, 2, 15, 12, 0, 0);
    expect(formatTime(noon)).toBe('12:00 PM');
  });

  it('returns empty string for invalid date', () => {
    expect(formatTime('invalid')).toBe('');
  });
});

// ─── formatDateTime ────────────────────────────────────────────────────────
describe('formatDateTime', () => {
  it('combines date and time with seconds', () => {
    const result = formatDateTime(FIXED_DATE);
    expect(result).toBe('15/03/2024, 2:30:45 PM');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDateTime('nope')).toBe('');
  });
});

// ─── formatNumber ──────────────────────────────────────────────────────────
describe('formatNumber', () => {
  it('formats with default en-US locale', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats with de-DE locale', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ numberFormat: 'de-DE' }));
    expect(formatNumber(1234567)).toMatch(/1\.234\.567/);
  });

  it('handles NaN gracefully', () => {
    const result = formatNumber(NaN);
    expect(result).toBe('NaN');
  });
});
