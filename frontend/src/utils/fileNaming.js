/**
 * File naming utility — applies user's Download Preferences (naming convention,
 * special char removal, download date suffix) to generate the final filename
 * that's sent to the backend as the "rename" parameter.
 *
 * Reads preferences from localStorage synchronously so it works in render paths
 * and callback contexts without async overhead.
 */
import { formatDate } from './dateFormat';

const PREFS_KEY = 'ytdeluxe_download_preferences';

function getDownloadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

/**
 * Remove special characters that cause issues on Windows/Mac/Linux file systems.
 * Keeps letters, numbers, spaces, dashes, underscores, parentheses, brackets.
 */
function sanitizeFilename(name) {
  // Replace characters illegal on Windows: \ / : * ? " < > |
  // Also remove control characters and leading/trailing dots/spaces
  return name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '');
}

/**
 * Build the final filename based on user's Download Preferences.
 *
 * @param {object} params
 * @param {string} params.title       - Original video/media title
 * @param {string} [params.channel]   - Channel name
 * @param {string} [params.quality]   - e.g. "1080p"
 * @param {string} [params.format]    - e.g. "mp4"
 * @param {string} [params.customTemplate] - Override from config (if naming = custom)
 * @returns {string} The processed filename (without extension)
 */
export function buildFilename({ title, channel, quality, format, customTemplate }) {
  const prefs = getDownloadPrefs();
  const convention = prefs.namingConvention || 'title';
  let filename;

  switch (convention) {
    case 'title_channel':
      filename = channel ? `${title} - ${channel}` : title;
      break;
    case 'channel_title':
      filename = channel ? `${channel} - ${title}` : title;
      break;
    case 'custom': {
      const template = customTemplate || prefs.customTemplate || '{title}';
      filename = template
        .replace(/\{title\}/gi, title || 'Untitled')
        .replace(/\{channel\}/gi, channel || 'Unknown')
        .replace(/\{quality\}/gi, quality || '')
        .replace(/\{format\}/gi, format || '')
        .replace(/\{date\}/gi, formatDate(new Date()));
      break;
    }
    case 'title':
    default:
      filename = title || 'Untitled';
      break;
  }

  // Remove special characters if enabled
  if (prefs.removeSpecialChars) {
    filename = sanitizeFilename(filename);
  }

  // Append download date if enabled
  if (prefs.addDownloadDate) {
    const dateStr = formatDate(new Date());
    filename = `${filename} [${dateStr}]`;
  }

  return filename;
}

export { getDownloadPrefs, sanitizeFilename };
