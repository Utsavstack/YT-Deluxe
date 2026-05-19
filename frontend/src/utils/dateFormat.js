/**
 * Regional date/time/number formatting utilities.
 * Reads user preferences from localStorage (sync) to avoid async in render paths.
 * Settings are written by LanguageSettings → YTDeluxeStorage, which also writes
 * to localStorage first, so this always has the latest value.
 *
 * Defaults: DD/MM/YYYY, 12-hour clock (EU default as requested).
 */

const SETTINGS_KEY = 'ytdeluxe_language_settings';

// ── Read settings synchronously from localStorage ──────────────────────────
function getRegionalSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

// ── Date formatting ────────────────────────────────────────────────────────
/**
 * Format a Date to the user's chosen date format.
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const settings = getRegionalSettings();
  const fmt = settings.dateFormat || 'DD/MM/YYYY';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  switch (fmt) {
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'DD MMM YYYY': return `${day} ${months[d.getMonth()]} ${year}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
}

// ── Time formatting ────────────────────────────────────────────────────────
/**
 * Format a Date to the user's chosen time format (12h or 24h).
 * @param {Date|string|number} date
 * @param {object} [opts] - { includeSeconds: boolean }
 * @returns {string}
 */
export function formatTime(date, opts = {}) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const settings = getRegionalSettings();
  const is24 = (settings.timeFormat || '12h') === '24h';
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  if (is24) {
    const hh = String(hours).padStart(2, '0');
    return opts.includeSeconds ? `${hh}:${minutes}:${seconds}` : `${hh}:${minutes}`;
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return opts.includeSeconds
    ? `${h12}:${minutes}:${seconds} ${ampm}`
    : `${h12}:${minutes} ${ampm}`;
}

// ── Combined date+time ─────────────────────────────────────────────────────
/**
 * Format a Date to "date, time" string with user settings.
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${formatDate(d)}, ${formatTime(d, { includeSeconds: true })}`;
}

// ── Number formatting ──────────────────────────────────────────────────────
/**
 * Format a number using the user's chosen number locale.
 * @param {number} num
 * @param {object} [opts] - Intl.NumberFormat options
 * @returns {string}
 */
export function formatNumber(num, opts = {}) {
  const settings = getRegionalSettings();
  const locale = settings.numberFormat || 'en-US';
  try {
    return new Intl.NumberFormat(locale, opts).format(num);
  } catch {
    return String(num);
  }
}

// Re-export settings reader for components that need raw values
export { getRegionalSettings };
