import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const REPO               = 'Utsavstack/YT-Deluxe';
const CACHE_KEY          = 'ytdeluxe_changelog_jsx_cache';
const CACHE_TTL          = 60 * 60 * 1000;        // 1 hour  — for changelog display
const UPDATE_CHECK_KEY   = 'ytdeluxe_update_check'; // stores { result, timestamp }
const UPDATE_CHECK_TTL   = 24 * 60 * 60 * 1000;   // 24 hours — for update check
const UPDATE_MUTED_KEY   = 'ytdeluxe_update_muted_version';
const UPDATE_NOTIFY_KEY  = 'ytdeluxe_update_notify';
const INSTALLED_VER_KEY  = 'ytdeluxe_installed_version';

// ── Fallback data ─────────────────────────────────────────────────────────────
const FALLBACK_CHANGELOG = [
  {
    version: 'v1.0.0-beta',
    date: 'May 2026',
    type: 'latest',
    downloadUrl: `https://github.com/${REPO}/releases/latest`,
    downloads: null,
    changes: [
      'Initial Public Beta Release of YT Deluxe',
      'Premium Liquid Glass UI with dark and light mode',
      'High-speed video and audio downloading (144p to 8K)',
      'Multi-language support: English, Hindi, German, Hinglish',
      'Precision Lossless Trimmer with FFmpeg stream copy',
      'Native Windows installer built with Inno Setup',
      'Privacy-first: no tracking, no accounts, fully local',
    ],
  },
];

const STATIC_FAQS = [
  {
    id: 1,
    q: 'Where are my downloaded files saved?',
    a: "By default, files are saved in your system's Downloads folder. You can customize this path during installation or later inside the Settings page. If you enabled \"Auto-Organize\", files are sorted into Videos/, Music/, and Thumbnails/ subfolders automatically.",
  },
  {
    id: 2,
    q: 'Can I download videos in 4K or 8K resolution?',
    a: 'Yes! YT Deluxe supports all available resolutions from 144p up to 8K. Open the Quality Grid before downloading and select your preferred resolution. For 1080p and above, the app automatically merges the video and audio streams using FFmpeg.',
  },
  {
    id: 3,
    q: 'What audio and video formats are supported?',
    a: 'Video: MP4, WebM, MKV, MOV (and more via the Advanced Format Picker). Audio: MP3, M4A, Opus, and original formats. MP3 downloads include embedded album art and metadata automatically.',
  },
  {
    id: 4,
    q: 'How do update notifications work?',
    a: 'When "Updates On" is enabled, the app checks GitHub for a new release once every 24 hours. If a newer version is found, a banner appears here on the Changelog tab. You can click Download to get the new installer, mute that specific version with the bell-off icon (so it never shows again for that version), or dismiss it just for this session.',
  },
  {
    id: 5,
    q: 'Does this app track my usage or collect data?',
    a: 'No. YT Deluxe is completely local-first and does not track, collect, or transmit your personal data. All processing happens on your machine. The only optional network calls are YouTube data fetching and a once-per-24h GitHub version check (which you can disable).',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseChanges(body) {
  if (!body) return [];
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- ') || l.startsWith('* ') || l.startsWith('+ '))
    .map((l) => l.slice(2).trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function loadReleases() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }
  } catch { /* ignore */ }

  const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=5`);
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const releases = await res.json();

  const data = releases.map((r, idx) => {
    const exe =
      r.assets.find((a) => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe')) ||
      r.assets.find((a) => a.name.endsWith('.exe'));
    const totalDl = r.assets.reduce((sum, a) => sum + (a.download_count || 0), 0);
    return {
      version:     r.tag_name,
      date:        new Date(r.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
      type:        idx === 0 ? 'latest' : r.prerelease ? 'prerelease' : 'stable',
      downloadUrl: exe ? exe.browser_download_url : `https://github.com/${REPO}/releases/tag/${r.tag_name}`,
      downloads:   totalDl > 0 ? totalDl.toLocaleString() : null,
      changes:     parseChanges(r.body),
      htmlUrl:     r.html_url,
    };
  });

  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  return data;
}

// ── Version comparison helpers ──────────────────────────────────────────────
function normalizeVersion(v = '') {
  return v.toLowerCase().trim().replace(/^v/, '').replace(/\s+/g, '-');
}
function isNewVersionAvailable(latest, installed) {
  if (!latest || !installed) return false;
  return normalizeVersion(latest) !== normalizeVersion(installed);
}

// ── 24h Update Check ─────────────────────────────────────────────────────────
// Separate from the changelog display cache.
// Result is persisted so we don't call the API every app open.
async function checkForUpdateOnce(installedVer) {
  // 1. Read cached result
  try {
    const raw = localStorage.getItem(UPDATE_CHECK_KEY);
    if (raw) {
      const { result, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp < UPDATE_CHECK_TTL) {
        // Still within 24h — return cached result
        return result; // { hasUpdate, version, date, downloadUrl }
      }
    }
  } catch { /* ignore */ }

  // 2. 24h passed (or first run) — hit GitHub API
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!res.ok) return null;
    const r    = await res.json();
    const exe  =
      r.assets.find((a) => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe')) ||
      r.assets.find((a) => a.name.endsWith('.exe'));

    const result = {
      hasUpdate:   isNewVersionAvailable(r.tag_name, installedVer),
      version:     r.tag_name,
      date:        new Date(r.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      downloadUrl: exe ? exe.browser_download_url : `https://github.com/${REPO}/releases/tag/${r.tag_name}`,
      htmlUrl:     r.html_url,
    };

    // Cache for 24h
    localStorage.setItem(UPDATE_CHECK_KEY, JSON.stringify({ result, timestamp: Date.now() }));
    return result;
  } catch {
    return null; // API failed — show nothing
  }
}

// ── Force re-check (used by "Check now" button) ───────────────────────────────
function clearUpdateCache() {
  localStorage.removeItem(UPDATE_CHECK_KEY);
}

// ── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};
const tabVariants = {
  hidden:  (isFaq) => ({ opacity: 0, x: isFaq ? 20 : -20 }),
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeInOut', staggerChildren: 0.1 } },
  exit:    (isFaq) => ({ opacity: 0, x: isFaq ? -20 : 20, transition: { duration: 0.2 } }),
};

// ── Update Notification Banner ────────────────────────────────────────────────
function UpdateBanner({ latestRelease, onMute, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative mb-6 p-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Icon + text */}
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Icon name="Sparkles" size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              New version available —{' '}
              <span className="text-primary">{latestRelease.version}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {latestRelease.date} &bull; Check the Changelog tab for what&apos;s new
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={latestRelease.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Icon name="Download" size={13} />
            Download
          </a>
          <button
            onClick={onMute}
            title="Mute this version"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
          >
            <Icon name="BellOff" size={15} />
          </button>
          <button
            onClick={onDismiss}
            title="Dismiss"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
          >
            <Icon name="X" size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const ChangelogAndFaq = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab]     = useState('changelog');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [changelog, setChangelog]     = useState(FALLBACK_CHANGELOG);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);

  // Update notification state
  const [showBanner, setShowBanner]         = useState(false);
  const [latestForBanner, setLatestForBanner] = useState(null);
  // Whether user has notifications enabled (read from localStorage, set by installer)
  const [notifyEnabled, setNotifyEnabled]   = useState(
    () => localStorage.getItem(UPDATE_NOTIFY_KEY) !== '0'
  );

  // ── Fetch changelog (for display, 1h cache) ──────────────────────────────
  useEffect(() => {
    let mounted = true;
    loadReleases()
      .then((data) => { if (mounted && data?.length) setChangelog(data); })
      .catch(() => { if (mounted) setError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // ── 24h Update check (completely separate from changelog fetch) ───────────
  useEffect(() => {
    if (!notifyEnabled) return; // notifications off — skip entirely
    let mounted = true;
    const installedVer = localStorage.getItem(INSTALLED_VER_KEY) || 'v1.0.0-beta';

    checkForUpdateOnce(installedVer).then((result) => {
      if (!mounted || !result) return;
      const mutedVersion = localStorage.getItem(UPDATE_MUTED_KEY) || '';
      const isMuted = normalizeVersion(mutedVersion) === normalizeVersion(result.version);

      if (result.hasUpdate && !isMuted) {
        setLatestForBanner(result);
        setShowBanner(true);
      }
    });
    return () => { mounted = false; };
  }, [notifyEnabled]); // re-run if user toggles notifications on

  // ── Mute: save this version so banner never shows again for it ─────────────
  const handleMute = () => {
    if (latestForBanner) {
      localStorage.setItem(UPDATE_MUTED_KEY, latestForBanner.version);
    }
    setShowBanner(false);
  };

  // ── Dismiss: hide for this session only (not permanently muted) ────────────
  const handleDismiss = () => setShowBanner(false);

  // ── Toggle update notifications ────────────────────────────────────────────
  const toggleNotifications = () => {
    const next = !notifyEnabled;
    setNotifyEnabled(next);
    localStorage.setItem(UPDATE_NOTIFY_KEY, next ? '1' : '0');
    if (!next) setShowBanner(false);
  };

  // ── Computed: does "Latest" badge have a notification dot? ─────────────────
  const showDot = showBanner && notifyEnabled;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Update Notification Banner */}
      <AnimatePresence>
        {showBanner && latestForBanner && notifyEnabled && (
          <UpdateBanner
            latestRelease={latestForBanner}
            onMute={handleMute}
            onDismiss={handleDismiss}
          />
        )}
      </AnimatePresence>

      {/* Header Tabs */}
      <div className="flex space-x-2 p-1.5 bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl w-full max-w-md mx-auto mb-8 shadow-glass-sm">
        {/* Changelog tab — with optional notification dot */}
        <button
          onClick={() => setActiveTab('changelog')}
          className={`relative flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === 'changelog'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
          }`}
        >
          <Icon name="FileText" size={16} />
          <span>{t('updates.changelog', 'Changelog')}</span>
          {/* Notification dot */}
          {showDot && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_theme(colors.primary.DEFAULT)] animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === 'faq'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
          }`}
        >
          <Icon name="HelpCircle" size={16} />
          <span>{t('updates.faq', 'FAQ')}</span>
        </button>
      </div>

      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'changelog' ? (
            <motion.div
              key="changelog"
              custom={false}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* Section header + notification toggle */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Icon name="History" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {t('updates.versionHistory', 'Version History')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {loading
                        ? 'Loading from GitHub…'
                        : error
                          ? 'Showing cached data'
                          : 'Track the evolution of YT Deluxe'}
                    </p>
                  </div>
                </div>

                {/* Right-side controls: Check Now + Notification toggle */}
                <div className="flex items-center gap-2">
                  {/* Check Now — clears 24h cache, forces immediate re-check */}
                  {notifyEnabled && (
                    <button
                      onClick={() => {
                        clearUpdateCache();
                        const installedVer = localStorage.getItem(INSTALLED_VER_KEY) || 'v1.0.0-beta';
                        checkForUpdateOnce(installedVer).then((result) => {
                          if (!result) return;
                          const mutedVersion = localStorage.getItem(UPDATE_MUTED_KEY) || '';
                          const isMuted = normalizeVersion(mutedVersion) === normalizeVersion(result.version);
                          if (result.hasUpdate && !isMuted) {
                            setLatestForBanner(result);
                            setShowBanner(true);
                          } else {
                            setShowBanner(false);
                          }
                        });
                      }}
                      title="Check for updates now"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border/70 transition-all duration-300"
                    >
                      <Icon name="RefreshCw" size={12} />
                      <span className="hidden sm:inline">Check Now</span>
                    </button>
                  )}

                  {/* Notification on/off toggle */}
                  <button
                    onClick={toggleNotifications}
                    title={notifyEnabled ? 'Mute update notifications' : 'Enable update notifications'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                      notifyEnabled
                        ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                        : 'border-border/40 bg-card/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon name={notifyEnabled ? 'Bell' : 'BellOff'} size={13} />
                    <span className="hidden sm:inline">
                      {notifyEnabled ? 'Updates On' : 'Updates Off'}
                    </span>
                  </button>
                </div> {/* end: flex items-center gap-2 */}
              </div> {/* end: flex items-center justify-between */}

              {/* Changelog list */}
              <div className="space-y-5">
                {changelog.map((log, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="glass-card p-6 border-l-4 group transition-all duration-400 hover:-translate-y-1.5 hover:shadow-glass-lg relative overflow-hidden"
                    style={{
                      borderLeftColor:
                        log.type === 'latest'
                          ? 'var(--primary)'
                          : log.type === 'prerelease'
                            ? '#f59e0b'
                            : 'var(--border)',
                    }}
                  >
                    {log.type === 'latest' && (
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 relative z-10">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-black text-foreground tracking-tight">{log.version}</h3>
                        {log.type === 'latest' && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shadow-sm">
                            {t('updates.latest', 'Latest')}
                          </span>
                        )}
                        {log.type === 'prerelease' && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                            Pre-release
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {log.downloads && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Icon name="Download" size={12} />
                            {log.downloads}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5 bg-card/50 px-3 py-1.5 rounded-lg border border-border/50">
                          <Icon name="Calendar" size={14} />
                          <span>{log.date}</span>
                        </span>
                      </div>
                    </div>

                    {log.changes.length > 0 ? (
                      <ul className="space-y-3 relative z-10">
                        {log.changes.map((change, cIdx) => (
                          <li
                            key={cIdx}
                            className="flex items-start space-x-3 text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors duration-300"
                          >
                            <Icon name="CheckCircle" size={16} className="mt-0.5 text-primary/70 shrink-0" />
                            <span className="leading-relaxed">{change}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic relative z-10">No release notes available.</p>
                    )}

                    {log.downloadUrl && (
                      <div className="mt-5 relative z-10 flex gap-4">
                        <a
                          href={log.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary font-semibold transition-colors"
                        >
                          <Icon name="Download" size={13} />
                          Download {log.version}
                        </a>
                        {log.htmlUrl && (
                          <a
                            href={log.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Icon name="ExternalLink" size={12} />
                            GitHub
                          </a>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <motion.div variants={itemVariants} className="text-center pt-2">
                <a
                  href={`https://github.com/${REPO}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                >
                  View all releases on GitHub →
                </a>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="faq"
              custom={true}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                  <Icon name="MessageCircle" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    {t('updates.frequentlyAsked', 'Frequently Asked Questions')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('updates.faqDesc', 'Find answers to common questions')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {STATIC_FAQS.map((faq) => (
                  <motion.div
                    key={faq.id}
                    variants={itemVariants}
                    className={`glass-card overflow-hidden transition-all duration-300 border ${
                      expandedFaq === faq.id
                        ? 'border-primary/40 bg-primary/[0.03] shadow-glass-md'
                        : 'border-border/40 hover:border-primary/20 hover:bg-card/60'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                    >
                      <span className={`text-sm font-bold transition-colors ${expandedFaq === faq.id ? 'text-primary' : 'text-foreground'}`}>
                        {faq.q}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedFaq === faq.id ? 'bg-primary/10 text-primary' : 'bg-card/50 text-muted-foreground'}`}>
                        <Icon name="ChevronDown" size={16} className={`transition-transform duration-300 ${expandedFaq === faq.id ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedFaq === faq.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/20 pt-4">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              <motion.div
                variants={itemVariants}
                className="mt-10 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors duration-700" />
                <Icon name="LifeBuoy" size={32} className="mx-auto mb-4 text-primary drop-shadow-md" />
                <h3 className="text-lg font-black text-foreground mb-2">{t('updates.stillNeedHelp', 'Still need help?')}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  {t('updates.contactSupport', 'Our support team and community are always ready to assist you.')}
                </p>
                <a
                  href={`https://github.com/${REPO}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <Icon name="Github" size={18} />
                  <span>{t('updates.openIssue', 'Open an Issue')}</span>
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ChangelogAndFaq;
