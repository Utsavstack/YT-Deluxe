import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { YTDeluxeStorage, STORAGE_KEYS } from '../../../utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const StorageUsage = ({ totalSize, availableSpace, itemCount }) => {
  const { t } = useTranslation();

  const [downloadPath, setDownloadPath] = useState('');
  const [organizeFolders, setOrganizeFolders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;

  // ── Load from backend (Registry merge) on desktop, else localStorage ──────
  useEffect(() => {
    const loadSettings = async () => {
      if (isDesktop) {
        try {
          const data = await fetch(`${API_BASE}/api/desktop/settings`).then(r => r.json());
          if (data?.download_path) {
            const path = data.download_path;
            const organize = typeof data.auto_organize === 'boolean'
              ? data.auto_organize
              : localStorage.getItem('ytdeluxe_organize_folders') === 'true';
            setDownloadPath(path);
            setOrganizeFolders(organize);
            localStorage.setItem('ytdeluxe_download_path', path);
            localStorage.setItem('ytdeluxe_organize_folders', organize ? 'true' : 'false');
            return;
          }
        } catch { /* backend may not be running in dev */ }
      }
      // Fallback: localStorage / YTDeluxeStorage
      const savedPath = await YTDeluxeStorage.getItem(STORAGE_KEYS.DOWNLOAD_PATH, '');
      if (savedPath) {
        setDownloadPath(savedPath);
        window.dispatchEvent(new CustomEvent('ytdeluxe_downloadPathChanged', { detail: savedPath }));
      }
      const savedOrg = localStorage.getItem('ytdeluxe_organize_folders') === 'true';
      setOrganizeFolders(savedOrg);
    };
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  // ── Persist path change: localStorage + YTDeluxeStorage + backend registry ─
  const applyPathChange = async (newPath) => {
    setDownloadPath(newPath);
    window.dispatchEvent(new CustomEvent('ytdeluxe_downloadPathChanged', { detail: newPath }));
    setIsSaving(true);
    // localStorage (instant read by history page)
    localStorage.setItem('ytdeluxe_download_path', newPath);
    // YTDeluxeStorage → persists in settings.json (triggers backend registry sync)
    await YTDeluxeStorage.setItem(STORAGE_KEYS.DOWNLOAD_PATH, newPath);

    // Notify full DOWNLOAD_PREFS object so Settings page stays in sync
    const savedPrefs = await YTDeluxeStorage.getItem(STORAGE_KEYS.DOWNLOAD_PREFS, {});
    await YTDeluxeStorage.setItem(STORAGE_KEYS.DOWNLOAD_PREFS, { ...savedPrefs, downloadPath: newPath });

    // Also ping the backend REST endpoint so Windows Registry is updated immediately
    try {
      await fetch(`${API_BASE}/api/settings/ytdeluxe_download_path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newPath }),
      });
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  // ── Persist organise-folders toggle ──────────────────────────────────────
  const applyOrganizeChange = async (value) => {
    setOrganizeFolders(value);
    localStorage.setItem('ytdeluxe_organize_folders', value ? 'true' : 'false');
    await YTDeluxeStorage.setItem('ytdeluxe_organize_folders', value);

    const savedPrefs = await YTDeluxeStorage.getItem(STORAGE_KEYS.DOWNLOAD_PREFS, {});
    await YTDeluxeStorage.setItem(STORAGE_KEYS.DOWNLOAD_PREFS, { ...savedPrefs, organizeFolders: value });

    try {
      await fetch(`${API_BASE}/api/settings/ytdeluxe_organize_folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } catch { /* ignore */ }
  };

  // ── Browse folder (desktop only) ──────────────────────────────────────────
  const handleBrowse = async () => {
    if (window.pywebview?.api?.pick_folder) {
      try {
        const picked = await window.pywebview.api.pick_folder();
        if (picked) applyPathChange(picked);
      } catch { /* ignore */ }
    } else {
      const path = window.prompt('Enter the download folder path:', downloadPath || '');
      if (path) applyPathChange(path);
    }
  };

  // Extract drive letter/root from path for display
  const getDriveLabel = (path) => {
    if (!path) return null;
    // Windows: "C:\..." → "C:"
    const winDrive = path.match(/^([A-Za-z]:)/);
    if (winDrive) return winDrive[1];
    // Unix: "/mnt/..." → first two segments
    if (path.startsWith('/')) return path.split('/').slice(0, 3).join('/');
    return null;
  };

  const driveLabel = getDriveLabel(downloadPath);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/50 dark:bg-black/20 rounded-[2rem] border border-slate-200/50 dark:border-white/5 p-6 md:p-8 w-full h-full shadow-sm flex flex-col"
    >
      {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-black/5 dark:border-white/5">
              <Icon name="FolderCog" size={16} className="text-foreground/80" />
            </div>
            <span>Folder Settings</span>
          </h3>
        </div>

        {/* ── Download Folder section ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-start p-4 bg-slate-100 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">


          {/* Path input + Browse button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={downloadPath}
              onChange={(e) => applyPathChange(e.target.value)}
              placeholder="C:\Users\...\Downloads"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleBrowse}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs font-semibold text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all shrink-0"
            >
              <Icon name="Folder" size={13} />
              Browse
            </motion.button>
          </div>

          {/* ── Organize Folders (Separate by type) ──────────────────────── */}
          <div className="pt-2 border-t border-slate-200/70 dark:border-white/5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${organizeFolders ? 'bg-primary' : 'bg-slate-300 dark:bg-zinc-600'}`}
                onClick={() => applyOrganizeChange(!organizeFolders)}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${organizeFolders ? 'left-[18px]' : 'left-0.5'}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Separate files by type
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Sort into <span className="font-medium text-foreground/60">Videos/</span>, <span className="font-medium text-foreground/60">Music/</span> and <span className="font-medium text-foreground/60">Thumbnails/</span> subfolders
                </p>
              </div>
            </label>

            {/* Live folder preview */}
            <AnimatePresence initial={false}>
              <motion.div
                key={organizeFolders ? 'org' : 'flat'}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                className="mt-2.5 ml-11 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800/60 border border-slate-200/70 dark:border-white/5 font-mono text-[11px] text-muted-foreground leading-5"
              >
                {organizeFolders ? (
                  <>
                    <div>📁 <span className="text-foreground/70">{downloadPath || 'Downloads'}/</span></div>
                    <div className="ml-4">📂 Videos/</div>
                    <div className="ml-4">📂 Music/</div>
                    <div className="ml-4">📂 Thumbnails/</div>
                  </>
                ) : (
                  <>
                    <div>📁 <span className="text-foreground/70">{downloadPath || 'Downloads'}/</span></div>
                    <div className="ml-4 text-foreground/50">video.mp4</div>
                    <div className="ml-4 text-foreground/50">song.mp3</div>
                    <div className="ml-4 text-foreground/50">thumbnail.jpg</div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
    </motion.div>
  );
};

export const StorageStatsBox = ({ totalSize, availableSpace, itemCount }) => {
  const { t } = useTranslation();
  const [downloadPath, setDownloadPath] = useState('');
  const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;

  useEffect(() => {
    const loadPath = async () => {
      if (isDesktop) {
        try {
          const data = await fetch(`${API_BASE}/api/desktop/settings`).then(r => r.json());
          if (data?.download_path) setDownloadPath(data.download_path);
        } catch { /* ignore */ }
      } else {
        setDownloadPath(localStorage.getItem('ytdeluxe_download_path') || '');
      }
    };
    loadPath();

    const handlePathChange = (e) => setDownloadPath(e.detail);
    window.addEventListener('ytdeluxe_downloadPathChanged', handlePathChange);
    return () => window.removeEventListener('ytdeluxe_downloadPathChanged', handlePathChange);
  }, [isDesktop]);

  const getDriveLabel = (path) => {
    if (!path) return null;
    const match = path.match(/^([A-Za-z]:)/);
    return match ? match[1].toUpperCase() : null;
  };
  const driveLabel = getDriveLabel(downloadPath);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const usedPercentage = totalSize > 0 ? Math.min(totalSize / (totalSize + availableSpace) * 100, 100) : 0;

  const getUsageColor = () => {
    if (usedPercentage >= 90) return 'bg-red-500';
    if (usedPercentage >= 75) return 'bg-orange-500';
    return 'bg-primary';
  };

  const getUsageTextColor = () => {
    if (usedPercentage >= 90) return 'text-red-500';
    if (usedPercentage >= 75) return 'text-orange-500';
    return 'text-primary';
  };

  return (
    <div className="bg-white/50 dark:bg-black/20 rounded-[2rem] border border-slate-200/50 dark:border-white/5 p-6 md:p-8 w-full h-full shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-foreground flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-black/5 dark:border-white/5">
            <Icon name="HardDrive" size={16} className="text-foreground/80" />
          </div>
          <span>{t("downloadHistoryManagement.storageUsage")}</span>
        </h3>
      </div>

      {/* Inner Container */}
      <div className="flex-1 flex flex-col justify-start p-4 sm:p-5 bg-slate-100 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5">
        {/* Path Display */}
        <div className="mb-6 p-3 bg-white/60 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          {driveLabel && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Icon name="HardDrive" size={10} />
              {driveLabel}
            </span>
          )}
          <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
            <Icon name="FolderOpen" size={13} className="shrink-0 text-primary/60" />
            {downloadPath ? (
              <span className="truncate" title={downloadPath}>{downloadPath}</span>
            ) : (
              <span className="italic text-muted-foreground/40">No folder selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-semibold mb-3">
          <span className="text-muted-foreground">{t("downloadHistoryManagement.usedSpace")}</span>
          <span className={getUsageTextColor()}>{usedPercentage?.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-200/60 dark:bg-black/50 rounded-full h-3 shadow-inner overflow-hidden border border-black/5 dark:border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usedPercentage}%` }}
            transition={{ duration: 1, type: "spring", bounce: 0.2 }}
            className={`h-full rounded-full ${getUsageColor()} relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ animation: 'shimmer 2s infinite' }} />
          </motion.div>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-3 gap-1.5 xl:gap-2">
        {/* Total Downloaded */}
        <div className="flex flex-col items-center justify-center text-center p-1.5 sm:p-2 xl:p-2.5 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/20 transition-transform hover:-translate-y-1 hover:shadow-sm overflow-hidden w-full">
          <div className="flex flex-col items-center mb-1.5 w-full">
            <span className="text-[9px] xl:text-[10px] font-semibold text-muted-foreground leading-tight whitespace-normal break-words">{t("downloadHistoryManagement.totalDownloaded")}</span>
          </div>
          <div className="text-[13px] md:text-sm xl:text-base font-black tracking-tight text-blue-600 dark:text-blue-400 flex items-baseline justify-center whitespace-nowrap mt-auto">
            {formatFileSize(totalSize).split(' ')[0]}
            <span className="text-[9px] xl:text-[10px] font-bold ml-0.5 text-blue-500/70">{formatFileSize(totalSize).split(' ')[1]}</span>
          </div>
        </div>

        {/* Available Space */}
        <div className="flex flex-col items-center justify-center text-center p-1.5 sm:p-2 xl:p-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 transition-transform hover:-translate-y-1 hover:shadow-sm overflow-hidden w-full">
          <div className="flex flex-col items-center mb-1.5 w-full">
            <span className="text-[9px] xl:text-[10px] font-semibold text-muted-foreground leading-tight whitespace-normal break-words">{t("downloadHistoryManagement.availableSpace")}</span>
          </div>
          <div className="text-[13px] md:text-sm xl:text-base font-black tracking-tight text-emerald-600 dark:text-emerald-400 flex items-baseline justify-center whitespace-nowrap mt-auto">
            {formatFileSize(availableSpace).split(' ')[0]}
            <span className="text-[9px] xl:text-[10px] font-bold ml-0.5 text-emerald-500/70">{formatFileSize(availableSpace).split(' ')[1]}</span>
          </div>
        </div>

        {/* Total Files */}
        <div className="flex flex-col items-center justify-center text-center p-1.5 sm:p-2 xl:p-2.5 bg-purple-500/5 dark:bg-purple-500/10 rounded-2xl border border-purple-500/20 transition-transform hover:-translate-y-1 hover:shadow-sm overflow-hidden w-full">
          <div className="flex flex-col items-center mb-1.5 w-full">
            <span className="text-[9px] xl:text-[10px] font-semibold text-muted-foreground leading-tight whitespace-normal break-words w-min">{t("downloadHistoryManagement.totalFiles")}</span>
          </div>
          <div className="text-[13px] md:text-sm xl:text-base font-black tracking-tight text-purple-600 dark:text-purple-400 flex items-baseline justify-center whitespace-nowrap mt-auto">
            {itemCount}
            <span className="text-[9px] xl:text-[10px] font-bold ml-0.5 text-purple-500/70">{itemCount === 1 ? 'file' : 'files'}</span>
          </div>
        </div>
      </div>

      {/* Storage Warning */}
      <div className="mt-4 flex flex-col gap-2">
        {usedPercentage >= 90 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
            <Icon name="AlertTriangle" size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-red-600 dark:text-red-400 leading-tight">
              {t("downloadHistoryManagement.storageSpaceIsRunning")}
            </div>
          </motion.div>
        )}

        {usedPercentage >= 75 && usedPercentage < 90 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start space-x-3">
            <Icon name="AlertCircle" size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-orange-600 dark:text-orange-400 leading-tight">
              {t("downloadHistoryManagement.storageSpaceIsGetting")}
            </div>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
};

export default StorageUsage;