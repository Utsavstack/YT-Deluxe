import React, { createContext, useState, useContext, useRef, useCallback } from 'react';
import YTDeluxeAPI from '../utils/api';

const DownloadContext = createContext(null);

export const useDownloadContext = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownloadContext must be used within a DownloadProvider');
  }
  return context;
};

// ─── Audio helpers ─────────────────────────────────────────────────────────
const playSound = (src) => {
  try {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  } catch (_) {}
};

// ─── Format helpers ─────────────────────────────────────────────────────────
export const formatSpeed = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec <= 0) return '';
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSec} B/s`;
};

export const formatETA = (seconds) => {
  if (!seconds || seconds <= 0) return '';
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s left`;
};

// ─── Provider ────────────────────────────────────────────────────────────────
export const DownloadProvider = ({ children }) => {
  const [downloads, setDownloads] = useState([]);
  // Tracks which download IDs have already played start/complete/fail sounds
  const playedSoundsRef = useRef({ start: new Set(), complete: new Set(), fail: new Set() });
  // Pending timers for the 800ms cancel-window
  const cancelWindowTimers = useRef({});
  // Interval refs for progress polling
  const progressIntervals = useRef({});

  // ── Internal helpers ──────────────────────────────────────────────────────
  const updateDownload = useCallback((id, patch) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  // Animate progress from current → target over `ms` milliseconds
  const animateProgress = useCallback((id, fromVal, toVal, ms = 1200) => {
    const steps = 30;
    const stepMs = ms / steps;
    const delta = (toVal - fromVal) / steps;
    let step = 0;
    const intervalId = setInterval(() => {
      step++;
      const next = Math.min(fromVal + delta * step, toVal);
      setDownloads(prev =>
        prev.map(d => (d.id === id && d.progress < toVal) ? { ...d, progress: Math.round(next) } : d)
      );
      if (step >= steps) clearInterval(intervalId);
    }, stepMs);
  }, []);

  // Start real API progress polling
  const startProgressPolling = useCallback((taskId, downloadId) => {
    const intervalId = setInterval(async () => {
      try {
        const progress = await YTDeluxeAPI.getDownloadProgress(taskId);

        setDownloads(prev => prev.map(d => {
          if (d.id !== downloadId) return d;

          // Only advance progress forward (never go backwards)
          const newProgress = Math.max(d.progress, progress.progress || 0);

          // Play completion sound once
          if (
            (progress.status === 'completed') &&
            !playedSoundsRef.current.complete.has(downloadId)
          ) {
            playedSoundsRef.current.complete.add(downloadId);
            playSound('/completed.mp3');
          }

          // Play failure sound once
          if (
            progress.status === 'error' &&
            !playedSoundsRef.current.fail.has(downloadId)
          ) {
            playedSoundsRef.current.fail.add(downloadId);
            playSound('/error.mp3');
          }

          // Sanitize yt-dlp technical errors
          let safeError = progress.error || null;
          if (safeError) {
            let rawErr = String(safeError);
            const cleanErr = rawErr.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
            if (cleanErr.includes('ffmpeg is not installed')) {
              safeError = 'ffmpeg missing! Please install ffmpeg to merge HD video & audio.';
            } else if (cleanErr.includes('undefined') || cleanErr.includes('[generic]')) {
              safeError = 'Failed to download. Invalid or unsupported URL.';
            } else {
              safeError = cleanErr.replace(/^ERROR:\s*/i, '').trim() || 'Download failed.';
            }
          }

          return {
            ...d,
            progress: progress.status === 'completed' ? 100 : newProgress,
            status: progress.status || d.status,
            filename: progress.filename || d.filename,
            filepath: progress.filepath || d.filepath,
            speed: progress.speed || 0,
            speedFormatted: formatSpeed(progress.downloaded_bytes && progress.eta
              ? progress.downloaded_bytes / Math.max(progress.eta, 1)
              : 0),
            timeRemaining: progress.eta || 0,
            etaFormatted: formatETA(progress.eta),
            downloaded_bytes: progress.downloaded_bytes || 0,
            total_bytes: progress.total_bytes || 0,
            error: safeError,
            completedAt: progress.status === 'completed' ? new Date().toISOString() : d.completedAt,
          };
        }));

        if (progress.status === 'completed' || progress.status === 'error') {
          clearInterval(progressIntervals.current[downloadId]);
          delete progressIntervals.current[downloadId];

          // Web-mode: save to localStorage history
          if (progress.status === 'completed') {
            setDownloads(prev => {
              const completed = prev.find(d => d.id === downloadId);
              if (completed) {
                const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;
                if (!isDesktop) {
                  const historyItem = {
                    id: completed.id,
                    title: completed.title || 'Downloaded Media',
                    url: completed.url || '',
                    filename: progress.filename || completed.filename,
                    filepath: progress.filepath,
                    channel: completed.channel || '',
                    thumbnail: completed.thumbnail || '',
                    duration: completed.duration || 0,
                    format: completed.format || 'mp4',
                    quality: completed.quality || 'Auto',
                    fileSize: progress.total_bytes || 0,
                    downloadDate: new Date().toISOString(),
                    type: completed.type || 'video',
                    trim_start: completed.trimSettings?.startTime || null,
                    trim_end: completed.trimSettings?.endTime || null,
                  };
                  const existing = JSON.parse(localStorage.getItem('ytdeluxe_web_history') || '[]');
                  if (!existing.some(h => h.id === historyItem.id)) {
                    existing.unshift(historyItem);
                    localStorage.setItem('ytdeluxe_web_history', JSON.stringify(existing));
                  }
                }

                // Web: trigger browser file download
                if (!window.pywebview && progress.filename) {
                  try {
                    const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/tempfiles/${encodeURIComponent(progress.filename)}`;
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = downloadUrl;
                    a.download = progress.filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } catch (_) {}
                }

                // Desktop: OS-level toast
                if (window.pywebview) {
                  fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/desktop/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: 'Download Complete',
                      message: `${completed.filename} downloaded successfully!`,
                      type: 'success',
                    }),
                  }).catch(() => {});
                } else if (Notification.permission === 'granted') {
                  new Notification('Download Complete', {
                    body: `${completed.filename} downloaded!`,
                    icon: '/favicon.ico',
                  });
                }
              }
              return prev;
            });
          } else {
            // Failed — OS toast
            if (window.pywebview) {
              fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/desktop/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Download Failed', message: progress.error || 'Something went wrong.', type: 'error' }),
              }).catch(() => {});
            }
          }
        }
      } catch (_) {
        clearInterval(progressIntervals.current[downloadId]);
        delete progressIntervals.current[downloadId];
        updateDownload(downloadId, { status: 'error', error: 'Progress tracking lost' });
        if (!playedSoundsRef.current.fail.has(downloadId)) {
          playedSoundsRef.current.fail.add(downloadId);
          playSound('/winxp-error.mp3');
        }
      }
    }, 1000);
    progressIntervals.current[downloadId] = intervalId;
  }, [updateDownload]);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * addDownload(config) — creates a new download entry.
   * 800ms cancel-window: if user calls cancelDownload(id) before 800ms,
   * the API call is suppressed entirely.
   */
  const addDownload = useCallback((config, videoData = null) => {
    const id = Date.now() + Math.random();

    const newDownload = {
      id,
      url: config.url,
      filename: `${config.filename || 'file'}.${config.format || 'mp4'}`,
      title: config.filename || videoData?.title || 'Downloading…',
      channel: videoData?.channel?.name || config.channel || '',
      thumbnail: videoData?.thumbnail || config.thumbnail || '',
      type: config.type || 'video',
      quality: config.quality || 'Auto',
      format: config.format || 'mp4',
      size: config.size || null,
      progress: 0,
      status: 'pending', // pending → downloading → processing → completed|error
      speed: 0,
      speedFormatted: '',
      timeRemaining: 0,
      etaFormatted: '',
      startedAt: new Date(),
      completedAt: null,
      taskId: null,
      filepath: null,
      error: null,
      trimSettings: config.trimSettings || null,
      duration: videoData?.duration || 0,
      isCancelledInWindow: false,
    };

    setDownloads(prev => [...prev, newDownload]);

    // Play start sound
    if (!playedSoundsRef.current.start.has(id)) {
      playedSoundsRef.current.start.add(id);
      playSound('/started.mp3');
    }

    // Request notification permission early
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 800ms cancel-window timer
    const timer = setTimeout(async () => {
      delete cancelWindowTimers.current[id];

      // Check if user cancelled during the window
      setDownloads(prev => {
        const dl = prev.find(d => d.id === id);
        if (!dl || dl.isCancelledInWindow) return prev; // Aborted — do nothing
        return prev;
      });

      // Read current state synchronously via ref workaround
      let wasCancelled = false;
      setDownloads(prev => {
        const dl = prev.find(d => d.id === id);
        if (dl?.isCancelledInWindow) wasCancelled = true;
        return prev;
      });

      if (wasCancelled) return;

      // ── Real API call ──
      try {
        if (!config.url || config.url === 'undefined') {
          throw new Error('Invalid or missing URL');
        }

        updateDownload(id, { status: 'downloading' });

        const apiConfig = {
          url: config.url,
          quality: config.quality,
          format: config.format,
          rename: config.filename,
          trim_start: config.trim_start ?? config.trimSettings?.startTime,
          trim_end: config.trim_end ?? config.trimSettings?.endTime,
          type: config.type,
          channel: videoData?.channel?.name || config.channel || '',
          thumbnail: videoData?.thumbnail || config.thumbnail || '',
        };

        const response = await YTDeluxeAPI.downloadVideo(apiConfig);

        if (response.direct_url) {
          // Direct CDN download (no task_id)
          handleDirectCdnDownload(response.direct_url, response.filename, id);
        } else if (response.task_id) {
          updateDownload(id, { taskId: response.task_id });
          startProgressPolling(response.task_id, id);
        } else {
          throw new Error('No task_id or direct_url from server');
        }
      } catch (err) {
        // Hide technical errors from yt-dlp/backend and show friendly message
        const errStr = err?.message || String(err);
        const friendlyError = (errStr.includes('undefined') || errStr.includes('[generic]') || Object.keys(err).length === 0) 
           ? "Failed to download. Invalid or unsupported URL." 
           : "Download failed. Please try again.";
           
        updateDownload(id, { status: 'error', error: friendlyError });
        if (!playedSoundsRef.current.fail.has(id)) {
          playedSoundsRef.current.fail.add(id);
          playSound('/error.mp3');
        }
      }
    }, 800);

    cancelWindowTimers.current[id] = timer;
    return id;
  }, [startProgressPolling, updateDownload]);

  // Direct CDN progress (streams bytes directly)
  const handleDirectCdnDownload = useCallback(async (url, filename, downloadId) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok || !response.body) throw new Error('Fetch failed');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        const p = total ? Math.round((loaded / total) * 100) : 0;
        updateDownload(downloadId, { progress: p, status: 'downloading', downloaded_bytes: loaded, total_bytes: total });
      }

      const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = objectUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(objectUrl); document.body.removeChild(a); }, 1000);

      updateDownload(downloadId, { progress: 100, status: 'completed', completedAt: new Date().toISOString() });
      if (!playedSoundsRef.current.complete.has(downloadId)) {
        playedSoundsRef.current.complete.add(downloadId);
        playSound('/whatsapp-notification.mp3');
      }
    } catch (_) {
      // CORS fallback: plain anchor download
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'download'; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      updateDownload(downloadId, { progress: 100, status: 'completed', completedAt: new Date().toISOString() });
    }
  }, [updateDownload]);

  /** cancelDownload: if within 800ms window, suppresses API call */
  const cancelDownload = useCallback((id) => {
    // Clear cancel-window timer if still active (no API call made yet)
    if (cancelWindowTimers.current[id]) {
      clearTimeout(cancelWindowTimers.current[id]);
      delete cancelWindowTimers.current[id];
      updateDownload(id, { status: 'cancelled', progress: 0, isCancelledInWindow: true });
      return;
    }

    // Past cancel window — cancel via backend
    setDownloads(prev => {
      const dl = prev.find(d => d.id === id);
      if (dl?.taskId) {
        fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/cancel/${dl.taskId}`, { method: 'POST' }).catch(() => {});
      }
      return prev;
    });

    // Clear progress interval
    if (progressIntervals.current[id]) {
      clearInterval(progressIntervals.current[id]);
      delete progressIntervals.current[id];
    }

    updateDownload(id, { status: 'cancelled', error: null });
  }, [updateDownload]);

  /** pauseDownload: cancel + re-queue with original config */
  const pauseDownload = useCallback((id) => {
    cancelDownload(id);
    updateDownload(id, { status: 'paused' });
  }, [cancelDownload, updateDownload]);

  /** resumeDownload: re-trigger a paused/cancelled download */
  const resumeDownload = useCallback((id) => {
    setDownloads(prev => {
      const dl = prev.find(d => d.id === id);
      if (dl && (dl.status === 'paused' || dl.status === 'error' || dl.status === 'cancelled')) {
        setTimeout(() => {
          addDownload({
            url: dl.url,
            type: dl.type,
            quality: dl.quality,
            format: dl.format,
            filename: dl.title || dl.filename,
            size: dl.size,
            trimSettings: dl.trimSettings,
            thumbnail: dl.thumbnail,
            channel: dl.channel
          }, { title: dl.title, duration: dl.duration });
        }, 0);
        return prev.map(d => d.id === id ? { ...d, dismissed: true } : d);
      }
      return prev;
    });
  }, [addDownload]);

  /** dismissDownload: removes from visible panel but keeps in history */
  const dismissDownload = useCallback((id) => {
    updateDownload(id, { dismissed: true });
  }, [updateDownload]);

  /** clearHistory: removes all completed/failed/cancelled entries */
  const clearHistory = useCallback(() => {
    setDownloads(prev => prev.filter(d =>
      d.status === 'downloading' || d.status === 'pending' || d.status === 'processing'
    ));
  }, []);

  // Derived counts
  const activeCount = downloads.filter(d =>
    d.status === 'downloading' || d.status === 'pending' || d.status === 'processing'
  ).length;

  const bellColor = (() => {
    if (downloads.some(d => d.status === 'downloading' || d.status === 'pending' || d.status === 'processing')) return 'yellow';
    if (downloads.some(d => d.status === 'error')) return 'red';
    if (downloads.some(d => d.status === 'completed')) return 'green';
    return null;
  })();

  return (
    <DownloadContext.Provider value={{
      downloads,
      activeCount,
      bellColor,
      addDownload,
      cancelDownload,
      pauseDownload,
      resumeDownload,
      dismissDownload,
      clearHistory,
    }}>
      {children}
    </DownloadContext.Provider>
  );
};
