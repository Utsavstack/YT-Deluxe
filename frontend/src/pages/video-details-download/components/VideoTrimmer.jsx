import { useTranslation } from "react-i18next";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useTheme } from '../../../utils/ThemeContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format seconds → "MM:SS" for display labels / time markers */
const fmtMmSs = (secs) => {
  const s = Math.max(0, secs);
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
};

/** Format seconds → "Xm Ys" for badge labels (no raw seconds shown) */
const fmtDisplay = (secs) => {
  const s = Math.max(0, secs);
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  if (m === 0) return `${ss}s`;
  if (ss === 0) return `${m}m`;
  return `${m}m ${ss}s`;
};

/** Parse string (MM:SS, MM.SS, or M) → total seconds */
const parseTime = (val) => {
  if (!val) return 0;
  const str = String(val).replace(',', '.');
  if (str.includes(':') || str.includes('.')) {
    const parts = str.split(/[:.]/);
    const m = parseInt(parts[0]) || 0;
    const s = parseInt(parts[1]) || 0;
    return m * 60 + s;
  }
  // Assume plain number is minutes as per previous behavior, 
  // but if it's > 1000 maybe it's seconds? No, let's stick to minutes or handle both.
  return (parseFloat(str) || 0) * 60;
};

/** Convert percentage (0–1) to left CSS value */
const pct = (t, dur) => (dur > 0 ? `${Math.max(0, Math.min(100, (t / dur) * 100))}%` : '0%');

// ─── Component ────────────────────────────────────────────────────────────────

const VideoTrimmer = ({ videoData, onTrimChange, onDownload, onSelectConfig, selectedConfig, downloads = [] }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const dur = videoData?.duration || 0;

  // Derive current download type / quality from selectedConfig (set by DownloadTabs)
  const dlType = selectedConfig?.type || 'video';
  const dlQuality = selectedConfig?.quality || videoData?.max_quality || '1080p';
  const dlFormat = selectedConfig?.format || 'mp4';
  const dlFmtId = selectedConfig?.format_id || null;
  // Change R: new format control fields from DownloadTabs selection
  const dlAudioFormatId = selectedConfig?.audio_format_id || null;
  const dlContainer = selectedConfig?.container || 'mp4';
  const dlConvertToMp3 = selectedConfig?.convert_to_mp3 || false;
  const dlNativeExt = selectedConfig?.format && selectedConfig.format !== 'mp3' ? selectedConfig.format : 'opus';
  const isThumbnail = dlType === 'thumbnail';

  // trimType is derived from the global selectedConfig — no local state needed
  // When thumbnail is selected, trimmer defaults to 'video' locally for display
  const trimType = isThumbnail ? 'video' : dlType;
  const isAudio = trimType === 'audio';

  // Track last explicit audio and video configs so toggling restores the user's choice
  const lastAudioConfig = React.useRef(null);
  const lastVideoConfig = React.useRef(null);

  // Keep refs up-to-date whenever selectedConfig changes from DownloadTabs
  React.useEffect(() => {
    if (!selectedConfig) return;
    if (selectedConfig.type === 'audio') {
      lastAudioConfig.current = selectedConfig;
    } else if (selectedConfig.type === 'video') {
      lastVideoConfig.current = selectedConfig;
    }
  }, [selectedConfig]);

  // When user clicks "Trim as" toggle — restore last config for that type,
  // or auto-pick best native format if no previous config exists.
  const handleTrimTypeChange = (type) => {
    if (isThumbnail) return;
    if (type === 'audio') {
      if (lastAudioConfig.current) {
        // Restore previous explicit audio selection from DownloadTabs
        onSelectConfig?.(lastAudioConfig.current);
      } else {
        // Auto: pick best native audio (WebM/Opus or whatever dlNativeExt is)
        const audioFormat = dlConvertToMp3 ? 'mp3' : (dlNativeExt || 'opus');
        onSelectConfig?.({ type: 'audio', format: audioFormat, quality: 'audio', format_id: null });
      }
    } else {
      if (lastVideoConfig.current) {
        // Restore previous explicit video selection from DownloadTabs
        onSelectConfig?.(lastVideoConfig.current);
      } else {
        // Auto: pick best native video — clear any audio-only formats
        const audioOnlyFormats = ['mp3', 'opus', 'm4a'];
        const videoFormat = audioOnlyFormats.includes(dlFormat) ? 'mp4' : (dlFormat || 'mp4');
        const videoQuality = (dlQuality && dlQuality !== 'audio')
          ? dlQuality
          : (videoData?.max_quality || '1080p');
        const videoFmtId = audioOnlyFormats.includes(dlFormat) ? null : dlFmtId;
        onSelectConfig?.({ type: 'video', format: videoFormat, quality: videoQuality, format_id: videoFmtId });
      }
    }
  };


  const [isExpanded, setIsExpanded] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(dur);
  const [isDragging, setIsDragging] = useState(null); // 'start' | 'end'
  const [startMin, setStartMin] = useState(0);
  const [endMin, setEndMin] = useState(Math.ceil(dur / 60));
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [usingClip, setUsingClip] = useState(false); // true when using /api/preview-clip
  const [clipLoading, setClipLoading] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0); // current playback position
  const [isHovering, setIsHovering] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [showTrimGuide, setShowTrimGuide] = useState(false); // initial fetch/load of the stream
  const [previewEnabled, setPreviewEnabled] = useState(false); // stream only loads after first interaction

  const timelineRef = useRef(null);
  const videoRef = useRef(null);

  // ── Stream URLs ──────────────────────────────────────────────────────────
  // For video preview: use 720p stream. For audio: use bestaudio endpoint.
  const streamUrl = videoData?.url
    ? isAudio
      ? `${API_BASE}/api/stream?url=${encodeURIComponent(videoData.url)}&quality=audio`
      : `${API_BASE}/api/stream?url=${encodeURIComponent(videoData.url)}&quality=720p`
    : null;

  const buildClipUrl = useCallback((start, clipDur = 20) => {
    if (!videoData?.url) return null;
    return `${API_BASE}/api/preview-clip?url=${encodeURIComponent(videoData.url)}&start=${Math.floor(start)}&clip_duration=${Math.ceil(clipDur)}`;
  }, [videoData?.url]);

  // ── Apply trim (clamp + notify parent) ───────────────────────────────────
  const applyTrim = useCallback((start, end) => {
    const s = Math.max(0, Math.min(dur - 1, start));
    const e = Math.max(s + 1, Math.min(dur, end));
    setStartTime(s);
    setEndTime(e);
    setStartMin(Math.floor(s / 60));
    setEndMin(Math.ceil(e / 60));
    onTrimChange?.(s, e);
  }, [dur, onTrimChange]);

  // ── Reset to defaults when videoData changes ──────────────────────────────
  useEffect(() => {
    if (dur > 0) {
      applyTrim(0, dur);
      // Offset playhead slightly by default so it doesn't overlap the left handle
      const defaultOffset = Math.min(1, dur * 0.02);
      setPlayheadTime(defaultOffset);
      if (videoRef.current && !usingClip) {
         videoRef.current.currentTime = defaultOffset;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dur]);

  // ── Presets ───────────────────────────────────────────────────────────────
  const presets = [
    { label: 'First 30s', s: 0, e: Math.min(30, dur) },
    { label: 'First 1m', s: 0, e: Math.min(60, dur) },
    { label: 'First 5m', s: 0, e: Math.min(300, dur) },
    { label: 'First 10m', s: 0, e: Math.min(600, dur) },
    { label: 'First Half', s: 0, e: dur / 2 },
    { label: 'Second Half', s: dur / 2, e: dur },
    { label: 'Last 30s', s: Math.max(0, dur - 30), e: dur },
    { label: 'Last 1m', s: Math.max(0, dur - 60), e: dur },
    { label: 'Last 5m', s: Math.max(0, dur - 300), e: dur },

  ].filter((p) => p.e > p.s + 0.1); // remove invalid presets for very short videos

  // ── Timeline mouse/touch drag ─────────────────────────────────────────────
  const getTimeAt = useCallback((clientX) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || dur === 0) return 0;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return (x / rect.width) * dur;
  }, [dur]);

  const onHandleDown = (type) => (e) => {
    e.preventDefault();
    setPreviewEnabled(true); // first drag → unlock stream
    setIsDragging(type);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (clientX) => {
      const t = getTimeAt(clientX);
      if (isDragging === 'start') {
        const ns = Math.max(0, Math.min(endTime - 1, t));
        setStartTime(ns);
        setStartMin(Math.floor(ns / 60));
        onTrimChange?.(ns, endTime);
        // Make playhead independent: only push it if the handle pushes past it
        if (playheadTime < ns) {
          setPlayheadTime(ns);
          if (videoRef.current && !usingClip) videoRef.current.currentTime = ns;
        }
      } else if (isDragging === 'end') {
        const ne = Math.max(startTime + 1, Math.min(dur, t));
        setEndTime(ne);
        setEndMin(Math.ceil(ne / 60));
        onTrimChange?.(startTime, ne);
        // Make playhead independent: only pull it if the handle pulls past it
        if (playheadTime > ne) {
          setPlayheadTime(ne);
          if (videoRef.current && !usingClip) videoRef.current.currentTime = ne;
        }
      } else if (isDragging === 'playhead') {
        // Clamp playhead within trim range
        const clamped = Math.max(startTime, Math.min(endTime, t));
        setPlayheadTime(clamped);
        if (videoRef.current && !usingClip) {
          videoRef.current.currentTime = clamped;
        }
      }
    };

    const onMouseMove = (e) => onMove(e.clientX);
    const onTouchMove = (e) => { e.preventDefault(); onMove(e.touches[0].clientX); };
    const onUp = () => setIsDragging(null);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [isDragging, startTime, endTime, dur, getTimeAt, onTrimChange, usingClip]);

  // ── Preview player ────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    // Only mark as stopped if it's a genuine user-pause, not a buffering pause
    const onPause = () => {
      if (!video.seeking) setIsPlaying(false);
    };
    const onLoadStart = () => setIsMediaLoading(true);
    const onLoadedData = () => {
      setIsMediaLoading(false);
      setIsBuffering(false);
      if (!usingClip && video && video.duration > 0) {
         if (Math.abs(video.currentTime - startTime) < 0.1) {
             video.currentTime = startTime + Math.min(1, video.duration * 0.02);
         }
      }
    };
    const onCanPlay = () => {
      setPreviewReady(true);
      setIsMediaLoading(false);
      setIsBuffering(false);
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsMediaLoading(false);
      setIsPlaying(true); // 🔑 buffering resumes → play event doesn't re-fire, so set here
    };
    const onError = () => {
      setIsMediaLoading(false);
      // Primary stream failed → switch to preview-clip endpoint
      if (!usingClip && videoData?.url) {
        setUsingClip(true);
        setPreviewReady(false);
      }
    };
    const onTimeUpdate = () => {
      // Sync playhead with video (skip if user is manually dragging it)
      if (isDragging !== 'playhead') {
        setPlayheadTime(video.currentTime);
      }
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
        if (!isPlaying) video.pause();
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('loadstart', onLoadStart);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [startTime, endTime, isPlaying, usingClip, videoData?.url, isDragging]);

  const togglePreview = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      return;
    }

    if (usingClip) {
      // Generate preview clip from backend
      setClipLoading(true);
      const clipUrl = buildClipUrl(startTime, endTime - startTime);
      video.src = clipUrl;
      video.load();
      video.oncanplay = () => {
        setClipLoading(false);
        setPreviewReady(true);
        video.play().catch(() => { });
      };
      video.onerror = () => {
        setClipLoading(false);
        console.warn('[VideoTrimmer] preview-clip also failed');
      };
    } else {
      // Use streaming endpoint — native browser seek
      // Only jump to startTime if playhead is outside the trim range
      try {
        const pos = video.currentTime;
        if (pos < startTime || pos >= endTime) {
          video.currentTime = startTime;
        }
        await video.play();
      } catch {
        // Autoplay blocked or stream issue → fallback to clip
        setUsingClip(true);
      }
    }
  }, [isPlaying, usingClip, startTime, endTime, buildClipUrl]);

  // ── Time input handlers ──────────────────────────────────────────────────
  const [startInput, setStartInput] = useState('0');
  const [endInput, setEndInput] = useState(fmtMmSs(dur));

  // Sync inputs when time changes externally (dragging, presets)
  useEffect(() => {
    if (isDragging !== 'start') setStartInput(fmtMmSs(startTime));
  }, [startTime, isDragging]);

  useEffect(() => {
    if (isDragging !== 'end') setEndInput(fmtMmSs(endTime));
  }, [endTime, isDragging]);

  const handleStartInput = (val) => {
    const cleaned = val.replace(/[^0-9:]/g, '');
    setStartInput(cleaned);
    setPreviewEnabled(true); // manual input → unlock stream
    const secs = parseTime(cleaned);
    applyTrim(secs, endTime);
  };

  const handleEndInput = (val) => {
    const cleaned = val.replace(/[^0-9:]/g, '');
    setEndInput(cleaned);
    setPreviewEnabled(true); // manual input → unlock stream
    const secs = parseTime(cleaned);
    applyTrim(startTime, secs);
  };

  // Change R: handleDownloadTrimmed — sync all new format fields
  const handleDownloadTrimmed = () => {
    if (!onDownload || isThumbnail) return;
    const isAudioTrim = trimType === 'audio';
    onDownload({
      url: videoData?.url,
      type: trimType,
      quality: dlQuality,
      format: isAudioTrim
        ? (dlConvertToMp3 ? 'mp3' : dlNativeExt)
        : dlFormat,
      format_id: isAudioTrim ? null : dlFmtId,
      audio_format_id: isAudioTrim ? (dlAudioFormatId || null) : null,
      container: !isAudioTrim ? dlContainer : null,
      convert_to_mp3: isAudioTrim ? dlConvertToMp3 : false,
      filename: videoData?.title,
      trim_start: startTime,
      trim_end: endTime,
    });
  };

  const trimmedDur = Math.max(0, endTime - startTime);
  const sizeReduction = dur > 0 ? ((1 - trimmedDur / dur) * 100).toFixed(0) : 0;
  const isTrimmed = !(startTime === 0 && endTime === dur);

  // ── Estimate trimmed file size ────────────────────────────────────────────
  // Approximate bitrates (kbps) per quality for estimation
  const BITRATE_MAP = {
    '8K': 80000, '4K': 40000, '2K': 20000,
    '1080p': 8000, '720p': 4000, '480p': 2000, '360p': 1000, '240p': 600, '144p': 300,
    'audio': 192,
  };
  const qualityKey = isAudio ? 'audio' : (dlQuality || '1080p');
  const bitrate = BITRATE_MAP[qualityKey] || 8000; // kbps
  const estimatedBytes = (bitrate * 1000 / 8) * trimmedDur; // bytes
  const fmtSize = (bytes) => {
    if (bytes >= 1e9) return `~${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `~${(bytes / 1e6).toFixed(0)} MB`;
    return `~${(bytes / 1e3).toFixed(0)} KB`;
  };
  const estimatedSize = estimatedBytes > 0 ? fmtSize(estimatedBytes) : '—';

  // Find active download/trimming task for this video that is specifically a trim task
  const activeDownload = (downloads || []).find(d =>
    d.url === videoData?.url &&
    d.trim_start !== undefined &&
    (d.status === 'downloading' || d.status === 'processing' || d.status === 'pending')
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group text-left focus:outline-none focus:ring-2 focus:ring-primary/30
          ${isExpanded
            ? 'bg-primary/10 border-primary/30 dark:bg-primary/10 dark:border-primary/30'
            : 'bg-white hover:bg-primary/5 border-black/10 hover:border-primary/20 dark:bg-[#1a1a1a] dark:hover:bg-primary/5 dark:border-white/10 shadow-sm'
          }`}
      >
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
            ${isExpanded
              ? 'bg-primary text-white shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)]'
              : 'bg-primary/10 text-primary group-hover:bg-primary/20'
            }`}>
            <Icon name="Scissors" size={18} className={isExpanded ? 'animate-pulse' : ''} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm tracking-wide">
              {t('videoDetailsDownload.videoTrimmer')}
            </span>
            <span className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
              Cut out intros, select specific clips, or grab just the audio hook before downloading.
            </span>
          </div>
        </div>
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
          ${isExpanded
            ? 'bg-primary/20 text-primary rotate-180'
            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
          }`}>
          <Icon name="ChevronDown" size={16} />
        </div>
      </button>

      {isExpanded && (
        <div className="relative bg-white dark:bg-[#121212]/80 border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-[2rem] shadow-sm animate-slide-down mt-2">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ── LEFT COLUMN: Player & Metadata ── */}
            <div className="w-full lg:w-[45%] flex flex-col gap-4">
              
              {/* Thumbnail Disabled Overlay & Player container */}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-glass-sm border border-black/5 dark:border-white/5 bg-black/90 group/player"
                   onMouseEnter={() => setIsHovering(true)}
                   onMouseLeave={() => setIsHovering(false)}>
                {isThumbnail && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center">
                    <div className={`absolute inset-0 backdrop-blur-2xl z-0 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'}`} />
                    <div className="relative z-10 flex flex-col items-center p-6 text-center w-[90%] max-w-[320px]">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-3">
                        <Icon name="AlertTriangle" size={28} className="text-amber-500" />
                      </div>
                      <p className="text-sm font-black text-foreground mb-2">{t('videoDetailsDownload.thumbnailsCantBeTrimmed')}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{t('videoDetailsDownload.switchToEnableTrimming')}</p>
                      <div className="flex gap-2 w-full">
                        {[
                          { type: 'video', icon: 'Video', label: 'Video', format: 'mp4', quality: videoData?.max_quality || '1080p' },
                          { type: 'audio', icon: 'Music', label: 'Audio', format: dlConvertToMp3 ? 'mp3' : 'opus', quality: 'audio' },
                        ].map(({ type, icon, label, format, quality }) => (
                          <button
                            key={type}
                            onClick={() => onSelectConfig?.({ type, format, quality })}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-[11px] uppercase tracking-wider hover:bg-primary hover:text-white transition-all active:scale-95"
                          >
                            <Icon name={icon} size={12} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Real Preview Player */}
                {!isThumbnail && (
                  previewEnabled && streamUrl ? (
                    <>
                      {isAudio ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 px-4 bg-black/80">
                          {videoData?.thumbnail && (
                            <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${videoData.thumbnail})` }} />
                          )}
                          <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-3xl bg-pink-500/30 flex items-center justify-center border border-pink-500/40 shadow-glass-md backdrop-blur-sm">
                              <Icon name="Music" size={28} color="var(--color-primary)" />
                            </div>
                            <p className="text-sm font-semibold text-white">{t('videoDetailsDownload.audioPreview')}</p>
                          </div>
                          <audio ref={videoRef} src={streamUrl} preload="metadata" className="hidden" crossOrigin="anonymous" />
                        </div>
                      ) : (
                        <video ref={videoRef} src={usingClip ? undefined : streamUrl} className="w-full h-full object-contain" preload="metadata" playsInline crossOrigin="anonymous" />
                      )}

                      {/* State: Media Loading */}
                      {(isMediaLoading || isBuffering || clipLoading) && !activeDownload && (
                        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-12 h-12 border-[3px] border-white/10 border-t-primary rounded-full animate-spin" />
                        </div>
                      )}

                      {/* State: Trimming Progress */}
                      {activeDownload && (
                        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center">
                           <div className="text-3xl font-black text-white mb-2">{activeDownload.progress}%</div>
                           <div className="text-xs font-bold text-primary uppercase tracking-widest">{activeDownload.status === 'processing' ? t('videoDetailsDownload.processing') : t('videoDetailsDownload.trimming')}</div>
                           <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${activeDownload.progress}%` }} />
                           </div>
                        </div>
                      )}

                      {/* Play/Pause overlay controls */}
                      {!isMediaLoading && !isBuffering && !clipLoading && !activeDownload && (
                        <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center transition-all duration-500 ${isHovering || !isPlaying ? 'bg-black/30 opacity-100 backdrop-blur-[2px]' : 'opacity-0 pointer-events-none'}`}>
                          <button onClick={togglePreview} className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-glass-lg">
                            <Icon name={isPlaying ? 'Pause' : 'Play'} size={28} />
                          </button>
                        </div>
                      )}
                      
                      {/* Playhead time top left */}
                      <div className="absolute top-3 left-3 z-40 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-white/40'}`} />
                         <span className="text-[10px] font-mono font-bold text-white">{fmtMmSs(playheadTime)}</span>
                      </div>
                    </>
                  ) : !previewEnabled && !isThumbnail ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer group" onClick={() => setPreviewEnabled(true)}>
                      {videoData?.thumbnail && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${videoData.thumbnail})` }} />}
                      <div className="relative z-10 w-14 h-14 rounded-full bg-primary/80 border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-glass-lg backdrop-blur-md">
                        <Icon name="Play" size={24} className="ml-1" />
                      </div>
                      <span className="relative z-10 text-xs font-bold text-white drop-shadow-md bg-black/40 px-3 py-1 rounded-full">Load Preview</span>
                    </div>
                  ) : null
                )}
              </div>

              {/* Quick Presets */}
              <div className="space-y-2 mt-2 px-1">
                <h4 className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-2">
                  {t('videoDetailsDownload.quickPresets')}
                </h4>
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
                  {presets.map(({ label, s, e }) => {
                    const active = Math.abs(s - startTime) < 0.1 && Math.abs(e - endTime) < 0.1;
                    return (
                      <button
                        key={label}
                        onClick={() => { setPreviewEnabled(true); applyTrim(s, e); }}
                        className={`shrink-0 snap-start px-3 py-1.5 text-[10px] font-bold rounded-full border transition-all ${
                          active
                            ? 'bg-primary border-primary text-white shadow-glass-sm'
                            : 'bg-transparent border-black/10 dark:border-white/10 text-muted-foreground hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar (Est Size) */}
              <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-4 rounded-2xl mt-auto">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{t('videoDetailsDownload.estFileSize')}</span>
                  <span className="text-sm font-black text-foreground">{estimatedSize}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-none mb-1">{t('videoDetailsDownload.sizeReductionBadge')}</span>
                  <span className="text-sm font-black text-emerald-500">−{sizeReduction}%</span>
                </div>
              </div>

              {/* Trim Tip */}
              {!isThumbnail && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 mt-1">
                  <Icon name="Lightbulb" size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400/90 leading-relaxed font-medium">
                    <strong className="font-bold">Tip:</strong> Use the Quick Presets on the right to instantly select popular segments, like the First 30s or the Last 1m of the video.
                  </p>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Trimmer Controls ── */}
            <div className="w-full lg:w-[55%] flex flex-col gap-6 pt-2 lg:pt-0">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground tracking-[0.1em] uppercase">
                  {t('videoDetailsDownload.selectTrimRange')}
                </h4>
                <div className="relative">
                  <button onClick={() => setShowTrimGuide(!showTrimGuide)} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                    <Icon name="HelpCircle" size={12} />
                    <span>{t('videoDetailsDownload.trimmerGuide')}</span>
                  </button>
                  {/* Trim Guide Popover */}
                  {showTrimGuide && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowTrimGuide(false)} />
                      <div className="absolute right-0 top-full mt-2 z-50 w-[280px] rounded-2xl bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 p-5 shadow-2xl animate-scale-in">
                         {/* Header */}
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center"><Icon name="HelpCircle" size={12} className="text-primary" /></div>
                             <span className="text-[11px] font-black uppercase text-foreground">{t('videoDetailsDownload.trimmerGuide')}</span>
                           </div>
                           <button onClick={() => setShowTrimGuide(false)} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={14} /></button>
                         </div>
                         <div className="space-y-3 text-[10px]">
                            {[
                              { icon: 'GripVertical', color: 'text-primary', labelKey: 'guideBlueHandles', descKey: 'guideBlueHandlesDesc' },
                              { icon: 'Circle', color: 'text-red-500', labelKey: 'guideRedPlayhead', descKey: 'guideRedPlayheadDesc' },
                              { icon: 'Zap', color: 'text-amber-500', labelKey: 'guideQuickPresets', descKey: 'guideQuickPresetsDesc' },
                              { icon: 'Type', color: 'text-emerald-500', labelKey: 'guideTimeInputs', descKey: 'guideTimeInputsDesc' },
                            ].map(({ icon, color, labelKey, descKey }) => (
                              <div key={labelKey} className="flex items-start gap-2">
                                <Icon name={icon} size={12} className={`mt-0.5 shrink-0 ${color}`} />
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground">{t(`videoDetailsDownload.${labelKey}`)}</span>
                                  <span className="text-muted-foreground leading-tight">{t(`videoDetailsDownload.${descKey}`)}</span>
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2 select-none">
                <div
                  ref={timelineRef}
                  className="relative h-12 rounded-lg cursor-pointer select-none bg-gray-200 dark:bg-white/10 border-x border-black/5 dark:border-white/5"
                  onClick={(e) => {
                    if (isDragging) return;
                    const t = getTimeAt(e.clientX);
                    if (videoRef.current && !usingClip) videoRef.current.currentTime = t;
                  }}
                >
                  {/* Inside dimming for Light Mode and Dark Mode */}
                  <div className="absolute top-0 bottom-0 rounded-l-lg bg-black/20 dark:bg-black/40" style={{ left: 0, width: pct(startTime, dur) }} />
                  <div className="absolute top-0 bottom-0 rounded-r-lg bg-black/20 dark:bg-black/40" style={{ left: pct(endTime, dur), right: 0 }} />
                  
                  {/* Active Highlight Track */}
                  <div className="absolute top-0 bottom-0 bg-primary/20 border-y-2 border-primary" style={{ left: pct(startTime, dur), width: pct(endTime - startTime, dur) }} />

                  {/* Start Handle */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-40 w-4 h-14 bg-primary rounded-md shadow-glass-md cursor-ew-resize flex items-center justify-center gap-[2px] transition-transform hover:scale-110 active:scale-100"
                    style={{ left: pct(startTime, dur) }}
                    onMouseDown={onHandleDown('start')}
                    onTouchStart={onHandleDown('start')}
                  >
                     <div className="w-[2px] h-5 bg-white/90 rounded-full" />
                     <div className="w-[2px] h-5 bg-white/90 rounded-full" />
                  </div>

                  {/* End Handle */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-40 w-4 h-14 bg-primary rounded-md shadow-glass-md cursor-ew-resize flex items-center justify-center gap-[2px] transition-transform hover:scale-110 active:scale-100"
                    style={{ left: pct(endTime, dur) }}
                    onMouseDown={onHandleDown('end')}
                    onTouchStart={onHandleDown('end')}
                  >
                     <div className="w-[2px] h-5 bg-white/90 rounded-full" />
                     <div className="w-[2px] h-5 bg-white/90 rounded-full" />
                  </div>

                  {/* Playhead */}
                  {dur > 0 && (
                    <div className="absolute top-0 bottom-0 z-30 -translate-x-1/2 pointer-events-none" style={{ left: pct(playheadTime, dur) }}>
                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
                      <div
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 border border-white/20 cursor-grab active:cursor-grabbing pointer-events-auto shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                        onMouseDown={onHandleDown('playhead')}
                        onTouchStart={onHandleDown('playhead')}
                      />
                    </div>
                  )}
                </div>

                {/* Markers */}
                <div className="flex justify-between text-[9px] font-mono font-bold text-muted-foreground mt-1">
                  <span>{fmtMmSs(0)}</span>
                  <span>{fmtMmSs(dur * 0.25)}</span>
                  <span>{fmtMmSs(dur * 0.5)}</span>
                  <span>{fmtMmSs(dur * 0.75)}</span>
                  <span>{fmtMmSs(dur)}</span>
                </div>
              </div>

              {/* Start & End Inputs */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('videoDetailsDownload.startTime')}</label>
                  <div className="flex items-center h-12 border border-black/10 dark:border-white/10 rounded-xl focus-within:border-primary/50 overflow-hidden">
                    <input type="text" maxLength={5} value={startInput} onChange={(e) => handleStartInput(e.target.value)} placeholder="0:00" className="w-full h-full bg-transparent text-primary font-black text-sm text-center outline-none border-none focus:ring-0" />
                    <div className="px-3 h-full flex items-center bg-black/5 dark:bg-white/5 text-[9px] font-black text-primary uppercase">IN</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('videoDetailsDownload.endTime')}</label>
                  <div className="flex items-center h-12 border border-black/10 dark:border-white/10 rounded-xl focus-within:border-primary/50 overflow-hidden">
                    <input type="text" maxLength={5} value={endInput} onChange={(e) => handleEndInput(e.target.value)} placeholder="0:00" className="w-full h-full bg-transparent text-primary font-black text-sm text-center outline-none border-none focus:ring-0" />
                    <div className="px-3 h-full flex items-center bg-black/5 dark:bg-white/5 text-[9px] font-black text-primary uppercase">OUT</div>
                  </div>
                </div>
              </div>

              {/* Settings Badges */}
              <div className="flex flex-col gap-2">
                {/* Quality Row */}
                {!isThumbnail && (() => {
                  let effectiveFormat = isAudio ? (dlConvertToMp3 ? 'MP3' : (dlNativeExt || 'opus').toUpperCase()) : (dlFormat || 'mp4').toUpperCase();
                  const effectiveQuality = isAudio ? 'Best Audio' : (dlQuality && dlQuality !== 'audio' ? dlQuality : (videoData?.max_quality || '1080p'));
                  return (
                    <div className="flex items-center justify-between px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl">
                      <div className="flex items-center gap-2">
                         <Icon name={isAudio ? 'Music' : 'Video'} size={14} className="text-primary" />
                         <span className="text-sm font-black text-foreground">{effectiveQuality}</span>
                         <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-black uppercase tracking-wider">{effectiveFormat}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => document.getElementById('advanced-options')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                        <span className="text-[10px] italic underline decoration-muted-foreground/30 underline-offset-2">{t('videoDetailsDownload.changeInOptions')}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Duration & Trim As Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                    <Icon name="Clock" size={12} />
                    <span>Duration: <span className="text-foreground">{isTrimmed ? fmtDisplay(trimmedDur) : fmtDisplay(dur)}</span></span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 shrink-0">
                    {!isThumbnail && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Trim As</span>
                        <div className="flex bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-0.5">
                          {(['video', 'audio']).map((type) => (
                            <button
                              key={type}
                              onClick={() => handleTrimTypeChange(type)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${trimType === type ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                              <Icon name={type === 'audio' ? 'Music' : 'Video'} size={12} />
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button onClick={() => applyTrim(0, dur)} className="flex items-center gap-1.5 text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors bg-red-500/10 px-3 py-2 rounded-lg">
                      <Icon name="RotateCcw" size={12} />
                      {t('videoDetailsDownload.resetAll')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Buttons Row */}
              <div className="grid grid-cols-[1fr_1.5fr] gap-3 mt-4 border-t border-black/5 dark:border-white/5 pt-6">
                 <button onClick={togglePreview} className="h-12 flex items-center justify-center gap-2 border-2 border-primary/20 text-primary font-black text-[11px] uppercase tracking-widest rounded-xl hover:border-primary transition-all">
                    <Icon name={isPlaying ? 'Pause' : 'Play'} size={14} />
                    {isPlaying ? 'PAUSE' : 'PREVIEW'}
                 </button>
                 <button onClick={handleDownloadTrimmed} disabled={!videoData?.url || isThumbnail} className="h-12 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(var(--color-primary-rgb),0.3)] disabled:opacity-50">
                    <Icon name={isAudio ? 'Music' : 'Download'} size={14} />
                    {t('videoDetailsDownload.downloadBtn')}
                 </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTrimmer;