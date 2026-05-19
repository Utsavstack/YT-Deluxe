import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import { useDownloadContext, formatSpeed, formatETA } from '../../context/DownloadContext';
import { formatTime } from '../../utils/dateFormat';

// ─── Mini format helpers ────────────────────────────────────────────────────
const getStatusColor = (status) => {
  switch (status) {
    case 'downloading':
    case 'pending': return 'text-warning';
    case 'processing': return 'text-primary';
    case 'completed': return 'text-success';
    case 'error': return 'text-error';
    case 'paused':
    case 'cancelled': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

const getStatusBarColor = (status) => {
  switch (status) {
    case 'completed': return 'bg-success';
    case 'error': return 'bg-error';
    case 'processing': return 'bg-primary';
    case 'paused': return 'bg-muted-foreground';
    default: return 'bg-primary';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Starting…';
    case 'downloading': return 'Downloading';
    case 'processing': return 'Processing…';
    case 'completed': return 'Download completed';
    case 'error': return 'Failed';
    case 'paused': return 'Paused';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

// ─── Single download card ────────────────────────────────────────────────────
const DownloadCard = ({ download, onCancel, onPause, onResume, onDismiss, onOpen }) => {
  const isActive = download.status === 'downloading' || download.status === 'pending' || download.status === 'processing';
  const isCompleted = download.status === 'completed';
  const isFailed = download.status === 'error';
  const isPaused = download.status === 'paused' || download.status === 'cancelled';

  const isProcessingPhase = download.status === 'processing' || download.status === 'pending';
  const iconName = isActive
    ? (isProcessingPhase ? 'Loader2' : 'Download')
    : isCompleted ? 'CheckCircle2'
      : isFailed ? 'AlertCircle'
        : 'PauseCircle';

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const isIndeterminate = isActive && (!download.progress || download.progress <= 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className="relative rounded-[22px] overflow-hidden border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-zinc-800 shadow-sm"
    >


      <div className="p-4">
        {/* Top row: icon + title + dismiss */}
        <div className="flex items-start gap-3.5">
          {/* Status icon with circular outline for completed/failed */}
          <div className={`mt-0.5 flex-shrink-0 ${getStatusColor(download.status)}`}>
            {isCompleted ? (
              <div className="w-[22px] h-[22px] rounded-full border-[2px] border-emerald-500 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10">
                <Icon name="Check" size={14} strokeWidth={3} className="text-emerald-500" />
              </div>
            ) : isFailed ? (
              <div className="w-[22px] h-[22px] rounded-full border-[2px] border-red-500 flex items-center justify-center bg-red-50 dark:bg-red-500/10">
                <Icon name="X" size={14} strokeWidth={3} className="text-red-500" />
              </div>
            ) : isPaused ? (
              <Icon
                name="PauseCircle"
                size={22}
                className="text-slate-400"
                strokeWidth={2.5}
              />
            ) : (
              <div className="relative w-[22px] h-[22px] flex items-center justify-center">
                {isIndeterminate ? (
                  <Icon name="Loader2" size={16} className="animate-spin text-primary" strokeWidth={3} />
                ) : (
                  <svg className="w-[22px] h-[22px] transform -rotate-90" viewBox="0 0 24 24">
                    <circle className="text-primary/10 dark:text-primary/20" strokeWidth="3" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                    <circle className="text-primary transition-all duration-300" strokeWidth="3" strokeDasharray={10 * 2 * Math.PI} strokeDashoffset={10 * 2 * Math.PI - ((download.progress || 0) / 100) * 10 * 2 * Math.PI} strokeLinecap="round" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Middle: title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              {/* Title */}
              <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 truncate pt-0.5">
                {(download.title || download.filename)?.replace(/\.mp4|\.webm|\.mp3/gi, '')}
              </p>

              {/* Action Buttons (Folder, X) */}
              <div className="flex items-center flex-shrink-0 gap-0.5 bg-slate-100 dark:bg-white/5 p-1 rounded-[10px] border border-black/5 dark:border-white/5">
                {isCompleted && (
                  <button
                    onClick={() => onOpen(download)}
                    className="flex items-center justify-center w-[26px] h-[26px] rounded-[8px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all"
                    title="Open folder"
                  >
                    <Icon name="Folder" size={14} />
                  </button>
                )}
                <button
                  onClick={() => onDismiss(download.id)}
                  className="flex items-center justify-center w-[26px] h-[26px] rounded-[8px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all"
                  title="Dismiss"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            </div>

            {/* Pill-based Metadata */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {download.format && (
                <div className="flex items-center gap-1.5 px-2 py-[3px] rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                  <Icon name={download.type === 'audio' ? 'Music' : 'Video'} size={11} className="text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{download.format}</span>
                </div>
              )}
              {download.quality && (
                <div className="flex items-center gap-1 px-2 py-[3px] rounded-[6px] border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/10 shadow-sm">
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{download.quality}</span>
                </div>
              )}
              {download.type && (
                <div className="flex items-center gap-1 px-2 py-[3px] rounded-[6px] border border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/10 shadow-sm">
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{download.type}</span>
                </div>
              )}
              {(download.format_id || download.audio_format_id) && (
                <div className="flex items-center gap-1.5 px-2 py-[3px] rounded-[6px] border border-purple-200 dark:border-purple-800/30 bg-purple-50 dark:bg-purple-900/10 shadow-sm">
                  <Icon name="Layers" size={11} className="text-purple-400" />
                  <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 tracking-wide">id:{download.format_id || download.audio_format_id}</span>
                </div>
              )}
              {(isCompleted || isFailed || isPaused) && download.completedAt && (
                <div className="flex items-center gap-1.5 px-2 py-[3px] rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                  <Icon name="Clock" size={11} className="text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    {formatTime(download.completedAt)}
                  </span>
                </div>
              )}
              {download.size && (
                <div className="flex items-center gap-1.5 px-2 py-[3px] rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                  <Icon name="HardDrive" size={11} className="text-slate-400" />
                  <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">{formatFileSize(download.size)}</span>
                </div>
              )}
              {download.trimSettings && (download.trimSettings.startTime > 0 || (download.trimSettings.endTime > 0 && download.trimSettings.endTime < ((download.duration || 999999) - 1))) && (
                <div className="flex items-center gap-1 px-2 py-[3px] rounded-[6px] border border-violet-200 dark:border-violet-800/30 bg-violet-50 dark:bg-violet-900/10 shadow-sm">
                  <Icon name="Scissors" size={10} className="text-violet-600 dark:text-violet-400" />
                  <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 tracking-wide">
                    {Math.floor((download.trimSettings.startTime || 0) / 60)}:{String(Math.round((download.trimSettings.startTime || 0) % 60)).padStart(2, '0')} – {Math.floor((download.trimSettings.endTime || 0) / 60)}:{String(Math.round((download.trimSettings.endTime || 0) % 60)).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {isCompleted ? (
              <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md w-fit shadow-sm">
                <Icon name="CheckCircle2" size={13} className="text-emerald-500" strokeWidth={2.5} />
                <span className="text-[10.5px] font-bold text-emerald-500 uppercase tracking-wider">
                  Download completed
                </span>
              </div>
            ) : isFailed ? (
              <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-md w-fit shadow-sm">
                <Icon name="AlertCircle" size={13} className="text-red-500" strokeWidth={2.5} />
                <span className="text-[10.5px] font-bold text-red-500 uppercase tracking-wider">
                  {getStatusLabel(download.status)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Real-time Progress bar */}
        {(isActive || isPaused) && (
          <div className="mt-4 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner-sm">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2 font-semibold px-0.5">
              <span className="flex items-center gap-1.5">
                {getStatusLabel(download.status)}
                {isActive && download.speedFormatted && (
                  <span className="text-[10px] text-primary bg-primary/10 px-1.5 rounded-[4px]">{download.speedFormatted}</span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                {isActive && download.etaFormatted && <span className="text-[10px] text-slate-400">{download.etaFormatted}</span>}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {isIndeterminate ? '...' : `${Math.round(download.progress || 0)}%`}
                </span>
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-[6px] overflow-hidden relative">
              {isIndeterminate ? (
                // Zap line animation replacing barber-pole
                <div className="absolute inset-0 h-full bg-primary overflow-hidden rounded-full">
                  <motion.div
                    className="h-full bg-white/60 w-1/3 rounded-full blur-[2px]"
                    animate={{ x: ['-300%', '400%'] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  />
                </div>
              ) : (
                <motion.div
                  className={`h-full rounded-full shadow-md ${getStatusBarColor(download.status)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${download.progress || 0}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                />
              )}
            </div>
          </div>
        )}

        {/* Modern Action buttons row */}
        {(isActive || isPaused || isFailed) && (
          <div className="flex items-center justify-between mt-3 px-0.5">
            <div className="flex items-center gap-2">
              {/* Pause button (active only) */}
              {isActive && (
                <button
                  onClick={() => onPause(download.id)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-warning px-3 py-1.5 rounded-lg hover:bg-warning/15 hover:shadow-sm border border-transparent hover:border-warning/20 transition-all font-bold active:scale-95"
                  title="Pause (cancel + re-queue)"
                >
                  <Icon name="Pause" size={13} strokeWidth={2.5} />
                  Pause
                </button>
              )}

              {/* Resume button (paused only) */}
              {isPaused && (
                <button
                  onClick={() => onResume(download.id)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-primary/15 hover:shadow-sm border border-transparent hover:border-primary/20 transition-all font-bold active:scale-95"
                  title="Resume download"
                >
                  <Icon name="Play" size={13} strokeWidth={2.5} />
                  Resume
                </button>
              )}

              {/* Cancel button (active or paused) */}
              {(isActive || isPaused) && (
                <button
                  onClick={() => onCancel(download.id)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-200 transition-all font-bold active:scale-95"
                  title="Cancel download"
                >
                  <Icon name="X" size={13} strokeWidth={2.5} />
                  Cancel
                </button>
              )}

              {/* Retry button (failed) */}
              {isFailed && (
                <button
                  onClick={() => onResume(download.id)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-primary/15 hover:shadow-sm border border-transparent hover:border-primary/20 transition-all font-bold active:scale-95"
                >
                  <Icon name="RotateCcw" size={13} strokeWidth={2.5} />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Floater ────────────────────────────────────────────────────────────
const GlobalProgressFloater = () => {
  const { downloads, activeCount, cancelDownload, pauseDownload, resumeDownload, dismissDownload } = useDownloadContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  // Visible downloads = not dismissed
  const visible = downloads.filter(d => !d.dismissed);

  // Sort helper: by startedAt time
  const sortByTime = (a, b) => {
    const timeA = new Date(a.startedAt || 0).getTime();
    const timeB = new Date(b.startedAt || 0).getTime();
    return sortNewestFirst ? timeB - timeA : timeA - timeB;
  };

  const active = visible.filter(d =>
    d.status === 'downloading' || d.status === 'pending' || d.status === 'processing'
  ).sort(sortByTime);
  const recent = visible.filter(d =>
    d.status === 'completed' || d.status === 'error' || d.status === 'paused' || d.status === 'cancelled'
  ).sort(sortByTime);

  // Auto-show when a new download starts
  useEffect(() => {
    if (activeCount > 0) {
      setIsHidden(false);
      setIsExpanded(true);
    }
  }, [activeCount]);

  // Listen for the custom event to show the floater from the Header bell menu
  useEffect(() => {
    const handleShowFloater = () => {
      setIsHidden(false);
      setIsExpanded(true);
    };
    window.addEventListener('showGlobalFloater', handleShowFloater);
    return () => window.removeEventListener('showGlobalFloater', handleShowFloater);
  }, []);

  const handleOpen = (download) => {
    if (!download.filename) return;
    const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;
    if (isDesktop) {
      fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/desktop/open-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: download.filename, filepath: download.filepath }),
      }).catch(() => { });
    } else {
      alert("File downloaded to your browser's default download folder. Please check your browser's downloads.");
    }
  };

  // Don't render at all if nothing to show
  if (visible.length === 0) return null;

  // Overall progress for pill
  const overallProgress = active.length > 0
    ? Math.round(active.reduce((sum, d) => sum + (d.progress || 0), 0) / active.length)
    : 100;

  // Determine pill status dot color
  let dotClasses = 'bg-emerald-500 border-emerald-500/50 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]';
  if (active.length > 0) {
    dotClasses = 'bg-orange-500 border-orange-500/50 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse';
  } else if (visible.length > 0 && visible[0].status === 'error') {
    dotClasses = 'bg-red-500 border-red-500/50 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]';
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ touchAction: "none" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed top-24 right-6 md:top-24 z-[200] flex flex-col items-end gap-2 pointer-events-auto w-fit h-fit cursor-grab active:cursor-grabbing"
    >
      <AnimatePresence>
        {/* ── Compact Pill (when minimized / hidden expanded) ── */}
        {(!isExpanded || isHidden) && !isHidden && (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-800 shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-white/10 hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
          >
            <div className={`w-2.5 h-2.5 rounded-full border ${dotClasses}`} />
            <span className="text-[14px] font-bold text-white tracking-wide">
              {active.length > 0 ? `${active.length} active` : 'Downloads'}
            </span>
            {active.length > 0 && (
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{overallProgress}%</span>
            )}
            <Icon name="ChevronUp" size={14} className="text-zinc-400 ml-1" />
          </motion.button>
        )}

        {/* ── Expanded Panel ── */}
        {isExpanded && !isHidden && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="w-[340px] max-w-[calc(100vw-2rem)] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-200 dark:border-white/10 overflow-hidden cursor-auto bg-[#FAF9F4] dark:bg-zinc-900"
            // Prevent drag from triggering when clicking inside the panel (unless dragging from header)
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Header - Make THIS the drag handle for the expanded panel */}
            <div
              onPointerDown={(e) => { e.stopPropagation(); }}
              className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-white/10 cursor-grab active:cursor-grabbing bg-transparent"
            >
              <div className="flex items-center gap-2.5">
                <Icon name="Download" size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Downloads
                </span>
                {active.length > 0 && (
                  <span className="text-[11px] bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 rounded-full px-2.5 py-[3px] font-bold tracking-wide">
                    {active.length} active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Sort toggle */}
                <button
                  onClick={() => setSortNewestFirst(prev => !prev)}
                  className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title={sortNewestFirst ? 'Newest first' : 'Oldest first'}
                >
                  <Icon name={sortNewestFirst ? 'ArrowDownWideNarrow' : 'ArrowUpNarrowWide'} size={14} />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Minimize"
                >
                  <Icon name="Minus" size={14} />
                </button>
                <button
                  onClick={() => setIsHidden(true)}
                  className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Hide panel"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="max-h-[420px] overflow-y-auto overscroll-contain px-3 py-2.5 space-y-2 custom-scrollbar pr-1.5">
              {/* Active downloads */}
              <AnimatePresence>
                {active.map(dl => (
                  <DownloadCard
                    key={dl.id}
                    download={dl}
                    onCancel={cancelDownload}
                    onPause={pauseDownload}
                    onResume={resumeDownload}
                    onDismiss={dismissDownload}
                    onOpen={handleOpen}
                  />
                ))}
              </AnimatePresence>

              {/* Recent downloads separator */}
              {recent.length > 0 && active.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] text-muted-foreground font-semibold">Recent Downloads</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}

              <AnimatePresence>
                {recent.map(dl => (
                  <DownloadCard
                    key={dl.id}
                    download={dl}
                    onCancel={cancelDownload}
                    onPause={pauseDownload}
                    onResume={resumeDownload}
                    onDismiss={dismissDownload}
                    onOpen={handleOpen}
                  />
                ))}
              </AnimatePresence>

              {visible.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">
                  No downloads yet
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Re-show button (when hidden) ── */}
        {isHidden && activeCount > 0 && (
          <motion.button
            key="reshow"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsHidden(false); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full glass shadow-glass-lg border text-xs font-semibold backdrop-blur-xl transition-colors border-warning/30 text-warning hover:bg-warning/10 animate-pulse`}
          >
            <Icon name="Download" size={13} />
            {activeCount} downloading…
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GlobalProgressFloater;
