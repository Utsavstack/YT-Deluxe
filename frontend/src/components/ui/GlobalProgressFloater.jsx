import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import { useDownloadContext, formatSpeed, formatETA } from '../../context/DownloadContext';

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
  // Top shimmer: show before real progress arrives (<1%) OR after 100% during backend processing
  const showTopShimmer = isActive && (isIndeterminate || download.status === 'processing');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className="relative rounded-[20px] overflow-hidden border border-white/5 dark:border-white/[0.08] bg-white/[0.65] dark:bg-black/40 backdrop-blur-2xl shadow-glass-sm"
    >
      {/* Shimmering top accent bar — only before first real progress or during post-download processing */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${getStatusBarColor(download.status)} ${showTopShimmer ? 'opacity-90' : 'opacity-40'}`}>
        {showTopShimmer && (
          <motion.div
            className="h-full bg-white/70"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        )}
      </div>

      <div className="p-3.5">
        {/* Top row: icon + title + dismiss */}
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className={`mt-0.5 flex-shrink-0 ${getStatusColor(download.status)}`}>
            <Icon
              name={iconName}
              size={18}
              className={isProcessingPhase ? 'animate-spin' : ''}
              strokeWidth={2.5}
            />
          </div>

          {/* Middle: title + meta */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-[13px] font-semibold text-foreground truncate leading-snug drop-shadow-sm">
              {(download.title || download.filename)?.replace(/\.mp4|\.webm|\.mp3/gi, '')}
            </p>

            {/* Pill-based Metadata */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {download.format && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-foreground/10 bg-foreground/5 shadow-sm">
                  <Icon name={download.type === 'audio' ? 'Music' : 'Video'} size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{download.format}</span>
                </div>
              )}
              {download.quality && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-success/20 bg-success/5 shadow-sm">
                  <span className="text-[10px] font-bold text-success uppercase tracking-wide">{download.quality}</span>
                </div>
              )}
              {download.size && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-foreground/10 bg-foreground/5 shadow-sm">
                  <Icon name="HardDrive" size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{formatFileSize(download.size)}</span>
                </div>
              )}
              {download.type && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-primary/20 bg-primary/5 shadow-sm">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{download.type}</span>
                </div>
              )}
              {(isCompleted || isFailed || isPaused) && download.completedAt && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-foreground/10 bg-foreground/5 shadow-sm">
                  <Icon name="Clock" size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-extrabold text-foreground tracking-widest">
                    {new Date(download.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {download.trimSettings && (download.trimSettings.startTime > 0 || (download.trimSettings.endTime > 0 && download.trimSettings.endTime < ((download.duration || 999999) - 1))) && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-violet-500/20 bg-violet-500/10 shadow-sm">
                  <Icon name="Scissors" size={10} className="text-violet-500" />
                  <span className="text-[10px] font-bold text-violet-500 tracking-wide">
                    {Math.floor((download.trimSettings.startTime || 0) / 60)}:{String(Math.round((download.trimSettings.startTime || 0) % 60)).padStart(2, '0')} – {Math.floor((download.trimSettings.endTime || 0) / 60)}:{String(Math.round((download.trimSettings.endTime || 0) % 60)).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {isCompleted ? (
              <p className="text-[11px] font-bold mt-1.5 text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.35)] animate-[pulse_3s_ease-in-out_infinite]">
                {getStatusLabel(download.status)}
              </p>
            ) : isFailed ? (
              <p className={`text-[11px] font-medium mt-1.5 drop-shadow-sm ${getStatusColor(download.status)}`}>
                {getStatusLabel(download.status)}
              </p>
            ) : null}
          </div>

          <div className="flex items-center flex-shrink-0 gap-0.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg shadow-sm">
            {/* Open file (browser fallback included) top-right */}
            {isCompleted && (
              <button
                onClick={() => onOpen(download)}
                className="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-muted-foreground hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
                title="Open folder"
              >
                <Icon name="FolderOpen" size={14} />
              </button>
            )}
            {/* Dismiss × */}
            <button
              onClick={() => onDismiss(download.id)}
              className="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
              title="Dismiss"
            >
              <Icon name="X" size={14} />
            </button>
          </div>
        </div>

        {/* Real-time Progress bar */}
        {(isActive || isPaused) && (
          <div className="mt-3.5 bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-black/5 dark:border-white/5 shadow-inner-sm border-t-0">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 font-medium px-0.5">
              <span className="flex items-center gap-1.5">
                {getStatusLabel(download.status)}
                {isActive && download.speedFormatted && (
                  <span className="text-[10px] text-primary bg-primary/10 px-1.5 rounded-sm">{download.speedFormatted}</span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                {isActive && download.etaFormatted && <span className="text-[10px] text-foreground/50">{download.etaFormatted}</span>}
                <span className="font-bold text-foreground">
                  {isIndeterminate ? '...' : `${Math.round(download.progress || 0)}%`}
                </span>
              </span>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-[6px] overflow-hidden shadow-inner-sm relative">
              {isIndeterminate ? (
                // Highly visible Indeterminate Barber-Pole Strip
                <motion.div
                  className="absolute inset-0 h-full bg-primary/70"
                  animate={{ backgroundPosition: ['2rem 0', '0 0'] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{
                    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)',
                    backgroundSize: '2rem 2rem'
                  }}
                />
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
          <div className="flex items-center justify-between mt-2.5 px-0.5">
            <div className="flex items-center gap-2">
              {/* Pause button (active only) */}
              {isActive && (
                <button
                  onClick={() => onPause(download.id)}
                  className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-warning px-2.5 py-1.5 rounded-lg hover:bg-warning/15 hover:shadow-sm border border-transparent hover:border-warning/20 transition-all font-semibold active:scale-95"
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
                  className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/15 hover:shadow-sm border border-transparent hover:border-primary/20 transition-all font-semibold active:scale-95"
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
                  className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-error px-2.5 py-1.5 rounded-lg hover:bg-error/15 hover:shadow-sm border border-transparent hover:border-error/20 transition-all font-semibold active:scale-95"
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
                  className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/15 hover:shadow-sm border border-transparent hover:border-primary/20 transition-all font-semibold active:scale-95"
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

  // Visible downloads = not dismissed
  const visible = downloads.filter(d => !d.dismissed);
  const active = visible.filter(d =>
    d.status === 'downloading' || d.status === 'pending' || d.status === 'processing'
  );
  const recent = visible.filter(d =>
    d.status === 'completed' || d.status === 'error' || d.status === 'paused' || d.status === 'cancelled'
  );

  // Auto-show when a new download starts
  useEffect(() => {
    if (activeCount > 0) {
      setIsHidden(false);
      setIsExpanded(true);
    }
  }, [activeCount]);

  // Auto-hide smartly when downloads finish
  useEffect(() => {
    if (activeCount === 0 && recent.length > 0 && !isHovered) {
      const timer = setTimeout(() => {
        setIsHidden(true);
      }, 5000); // hide after 5s of NO hover
      return () => clearTimeout(timer);
    }
  }, [activeCount, recent.length, isHovered]);

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
            className="flex items-center gap-2 px-3 py-2 rounded-full glass shadow-glass-lg border border-white/20 dark:border-white/10 backdrop-blur-xl hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse border border-warning/50 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            <span className="text-[13px] font-bold text-foreground">
              {active.length > 0 ? `${active.length} active` : 'Downloads'}
            </span>
            {active.length > 0 && (
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 rounded-full">{overallProgress}%</span>
            )}
            <Icon name="ChevronUp" size={14} className="text-muted-foreground ml-1" />
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
            className="w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-glass-xl border border-white/20 dark:border-white/10 overflow-hidden cursor-auto"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
            // Prevent drag from triggering when clicking inside the panel (unless dragging from header)
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Header - Make THIS the drag handle for the expanded panel */}
            <div
              onPointerDown={(e) => { e.stopPropagation(); }}
              className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-grab active:cursor-grabbing bg-black/5 dark:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <Icon name="Download" size={15} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Downloads
                </span>
                {active.length > 0 && (
                  <span className="text-xs bg-warning/20 text-warning border border-warning/30 rounded-full px-2 py-0.5 font-mono font-bold">
                    {active.length} active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Minimize"
                >
                  <Icon name="Minus" size={14} />
                </button>
                <button
                  onClick={() => setIsHidden(true)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Hide panel"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="max-h-[420px] overflow-y-auto overscroll-contain px-3 py-2.5 space-y-2">
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
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Recent</span>
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-full glass shadow-glass-lg border border-warning/30 text-warning text-xs font-semibold backdrop-blur-xl hover:bg-warning/10 transition-colors animate-pulse"
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
