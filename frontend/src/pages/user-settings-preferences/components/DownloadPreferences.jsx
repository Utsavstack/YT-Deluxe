import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const DownloadPreferences = ({ preferences, onPreferencesChange }) => {
  const { t } = useTranslation();
  const [downloadPrefs, setDownloadPrefs] = useState(preferences || {});

  const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;

  // Sync preferences when parent updates them
  useEffect(() => {
    if (preferences) {
      setDownloadPrefs(preferences);
    }
  }, [preferences]);

  // On desktop: fetch the effective unified path from backend on mount.
  // This merges installer registry + in-app settings.json so the two
  // sources never show different values.
  useEffect(() => {
    if (!isDesktop) return;
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${API_BASE}/api/desktop/settings`)
      .then(r => r.json())
      .then(data => {
        if (data && data.download_path) {
          // Update local state + localStorage + parent so all consumers are consistent
          const effectivePath = data.download_path;
          const effectiveOrganize = typeof data.auto_organize === 'boolean'
            ? data.auto_organize
            : (localStorage.getItem('ytdeluxe_organize_folders') === 'true');

          // Only update if it differs from what parent already loaded
          setDownloadPrefs(prev => {
            const needsUpdate =
              prev.downloadPath !== effectivePath ||
              prev.organizeFolders !== effectiveOrganize;
            if (!needsUpdate) return prev;
            const updated = { ...prev, downloadPath: effectivePath, organizeFolders: effectiveOrganize };
            // Sync localStorage
            localStorage.setItem('ytdeluxe_download_path', effectivePath);
            localStorage.setItem('ytdeluxe_organize_folders', effectiveOrganize ? 'true' : 'false');
            // Notify parent so api.js picks up the correct path for next download
            if (typeof onPreferencesChange === 'function') {
              onPreferencesChange(updated);
            }
            return updated;
          });
        }
      })
      .catch(() => { /* ignore — backend may not be running in dev mode */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  const namingConventionOptions = [
    { value: 'title', label: 'Video Title', description: 'Use original video title' },
    { value: 'title_channel', label: 'Title - Channel', description: 'Title with channel name' },
    { value: 'channel_title', label: 'Channel - Title', description: 'Channel name first' },
    { value: 'custom', label: 'Custom Template', description: 'Define your own pattern' }
  ];

  const handlePreferenceChange = (key, value) => {
    const updated = { ...downloadPrefs, [key]: value };
    setDownloadPrefs(updated);
    if (typeof onPreferencesChange === 'function') {
      onPreferencesChange(updated);
    }
    // Sync individual changed keys to backend (→ registry) immediately.
    // The parent's onPreferencesChange also persists the full prefs object,
    // but writing individual keys here ensures registry is updated even if
    // the parent handler is replaced or delayed.
    if (key === 'downloadPath' && value) {
      localStorage.setItem('ytdeluxe_download_path', value);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      fetch(`${API_BASE}/api/settings/ytdeluxe_download_path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      }).catch(() => {});
    }
    if (key === 'organizeFolders') {
      localStorage.setItem('ytdeluxe_organize_folders', value ? 'true' : 'false');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      fetch(`${API_BASE}/api/settings/ytdeluxe_organize_folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      }).catch(() => {});
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* File Naming */}
      <motion.div variants={itemVariants} className="glass-card p-6 group hover:shadow-glass transition-all duration-300 relative z-20">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{t('downloads.fileNaming')}</h3>
          <p className="text-sm text-muted-foreground">{t('downloads.fileNamingDesc')}</p>
        </div>

        <div className="space-y-6">
          <Select
            label={t('downloads.namingConv')}
            description={t('downloads.namingConvDesc')}
            options={namingConventionOptions}
            value={downloadPrefs?.namingConvention || 'title'}
            onChange={(value) => handlePreferenceChange('namingConvention', value)}
          />

          <AnimatePresence>
            {downloadPrefs?.namingConvention === 'custom' && (
              <motion.div
                key="custom-template"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <Input
                  label={t('downloads.customTemplate')}
                  description={t('downloads.customTemplateDesc')}
                  placeholder="{channel} - {title} [{quality}]"
                  value={downloadPrefs?.customTemplate || ''}
                  onChange={(e) => handlePreferenceChange('customTemplate', e?.target?.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Checkbox
              label={t('downloads.removeSpecial')}
              description={t('downloads.removeSpecialDesc')}
              checked={!!downloadPrefs?.removeSpecialChars}
              onChange={(e) => handlePreferenceChange('removeSpecialChars', e?.target?.checked ?? e)}
            />

            <Checkbox
              label={t('downloads.addDate')}
              description={t('downloads.addDateDesc')}
              checked={!!downloadPrefs?.addDownloadDate}
              onChange={(e) => handlePreferenceChange('addDownloadDate', e?.target?.checked ?? e)}
            />
          </div>
        </div>
      </motion.div>

      {/* Storage Location & Folder Organization - Desktop Only */}
      {isDesktop && (
        <motion.div variants={itemVariants} className="glass-card p-6 group hover:shadow-glass transition-all duration-300 relative z-10">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-foreground">{t('downloads.storageLocation')}</h3>
            <p className="text-sm text-muted-foreground">{t('downloads.storageLocationDesc')}</p>
          </div>

          <div className="space-y-6">
            {/* Download Path */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('downloads.downloadFolder')}
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={downloadPrefs?.downloadPath || ''}
                    onChange={(e) => handlePreferenceChange('downloadPath', e?.target?.value)}
                    placeholder="C:\Users\...\Downloads"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={async () => {
                    if (window.pywebview?.api?.pick_folder) {
                      try {
                        const picked = await window.pywebview.api.pick_folder();
                        if (picked) handlePreferenceChange('downloadPath', picked);
                      } catch { /* ignore */ }
                    } else {
                      const path = window.prompt('Enter the download folder path:', downloadPrefs?.downloadPath || '');
                      if (path) handlePreferenceChange('downloadPath', path);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-accent/30 text-sm font-medium text-foreground hover:bg-accent/60 hover:border-primary/30 transition-all shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  {t('downloads.browse')}
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Files will be saved to this folder. Leave blank to use your system Downloads folder.
              </p>
            </div>

            {/* Folder Organization */}
            <div className="pt-2 border-t border-border/40">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    id="organize-folders-toggle"
                    checked={!!downloadPrefs?.organizeFolders}
                    onChange={(e) => handlePreferenceChange('organizeFolders', e.target.checked)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                </div>
                <div>
                  <label htmlFor="organize-folders-toggle" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Separate files by type
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When enabled, files are sorted into <span className="font-medium text-foreground/70">Videos/</span>, <span className="font-medium text-foreground/70">Music/</span> and <span className="font-medium text-foreground/70">Thumbnails/</span> subfolders.
                  </p>
                </div>
              </div>

              {/* Live preview */}
              <div className="mt-3 ml-7 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/40 font-mono text-[11px] text-muted-foreground leading-5">
                {downloadPrefs?.organizeFolders ? (
                  <>
                    <div>📁 <span className="text-foreground/70">{downloadPrefs?.downloadPath || 'Downloads'}/</span></div>
                    <div className="ml-4">📂 Videos/</div>
                    <div className="ml-4">📂 Music/</div>
                    <div className="ml-4">📂 Thumbnails/</div>
                  </>
                ) : (
                  <>
                    <div>📁 <span className="text-foreground/70">{downloadPrefs?.downloadPath || 'Downloads'}/</span></div>
                    <div className="ml-4 text-foreground/50">video.mp4</div>
                    <div className="ml-4 text-foreground/50">song.mp3</div>
                    <div className="ml-4 text-foreground/50">thumbnail.jpg</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
};

export default DownloadPreferences;