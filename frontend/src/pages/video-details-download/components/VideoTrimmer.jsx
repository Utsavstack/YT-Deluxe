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
  const isThumbnail = dlType === 'thumbnail';

  // trimType is derived from the global selectedConfig — no local state needed
  // When thumbnail is selected, trimmer defaults to 'video' locally for display
  const trimType = isThumbnail ? 'video' : dlType;
  const isAudio = trimType === 'audio';

  // When user clicks "Trim as" toggle or overlay buttons → update parent's selectedConfig
  const handleTrimTypeChange = (type) => {
    if (isThumbnail) return;
    const format = type === 'audio' ? 'mp3' : (selectedConfig?.format || 'mp4');
    // Prevent stale 'audio' quality carrying over when switching to video
    const currentQ = selectedConfig?.quality;
    const quality = type === 'audio'
      ? 'audio'
      : (currentQ && currentQ !== 'audio' ? currentQ : (videoData?.max_quality || '1080p'));
    onSelectConfig?.({ type, format, quality, format_id: type === 'audio' ? null : dlFmtId });
  };

  const [isExpanded, setIsExpanded] = useState(true);
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

  const timelineRef = useRef(null);
  const videoRef = useRef(null);

  // ── Stream URLs ──────────────────────────────────────────────────────────
  // For video preview: use 360p stream. For audio: use bestaudio endpoint.
  const streamUrl = videoData?.url
    ? isAudio
      ? `${API_BASE}/api/stream?url=${encodeURIComponent(videoData.url)}&quality=audio`
      : `${API_BASE}/api/stream?url=${encodeURIComponent(videoData.url)}&quality=360p`
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
    if (dur > 0) applyTrim(0, dur);
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
    setStartInput(val);
    const secs = parseTime(val);
    applyTrim(secs, endTime);
  };

  const handleEndInput = (val) => {
    setEndInput(val);
    const secs = parseTime(val);
    applyTrim(startTime, secs);
  };

  // ── Download trimmed ──────────────────────────────────────────────────────
  const handleDownloadTrimmed = () => {
    if (!onDownload || isThumbnail) return;
    onDownload({
      url: videoData?.url,
      type: trimType,
      quality: dlQuality,
      format: trimType === 'audio' ? 'mp3' : dlFormat,
      format_id: trimType === 'audio' ? null : dlFmtId,
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
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
        iconPosition="right"
        className="w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          <Icon name="Scissors" size={16} />
          <span>{t('videoDetailsDownload.videoTrimmer')}</span>
        </div>
      </Button>

      {isExpanded && (
        <div className="relative glass-card p-6 space-y-6 animate-slide-down">

          {/* ── Thumbnail disabled overlay ─────────────────────────────── */}
          {isThumbnail && (
            <div className="absolute inset-0 z-50 rounded-xl overflow-hidden flex items-center justify-center">
              {/* Glassmorphism blur + dim — theme aware */}
              <div className={`absolute inset-0 backdrop-blur-[48px] rounded-xl z-0 ${isDark ? 'bg-gray-700/80' : 'bg-white/80'
                }`} />

              {/* Warning Card */}
              <div
                className={`relative z-10 flex flex-col items-center p-7 backdrop-blur-xl border rounded-3xl text-center w-[85%] max-w-[320px] ${isDark
                  ? 'bg-gray-900/90 border-white/10'
                  : 'bg-white/95 border-gray-200/80'
                  }`}
                style={{
                  boxShadow: isDark
                    ? '0 10px 50px rgba(0,0,0,0.5), 0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 10px 50px rgba(0,0,0,0.1), 0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-4">
                  <Icon name="AlertTriangle" size={32} className="text-amber-500" />
                </div>
                <p className="text-base font-black text-foreground mb-2">{t('videoDetailsDownload.thumbnailsCantBeTrimmed')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {t('videoDetailsDownload.switchToEnableTrimming')}
                </p>
                {/* Clickable Video / Audio switchers */}
                <div className="flex gap-2 w-full">
                  {[
                    { type: 'video', icon: 'Video', label: 'Video', format: 'mp4', quality: videoData?.max_quality || '1080p' },
                    { type: 'audio', icon: 'Music', label: 'Audio', format: 'mp3', quality: 'audio' },
                  ].map(({ type, icon, label, format, quality }) => (
                    <button
                      key={type}
                      onClick={() => onSelectConfig?.({ type, format, quality })}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 hover:scale-[1.03] active:scale-95"
                    >
                      <Icon name={icon} size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Preview Player ───────────────────────────────────────────── */}
          {streamUrl && !isThumbnail && (
            <div
              className="relative aspect-video rounded-xl overflow-hidden bg-black/90 border border-white/5 shadow-glass-lg group/player"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Render audio element for audio-only, video element otherwise */}
              {isAudio ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 px-4 bg-black/80">
                  {/* Thumbnail as background for context */}
                  {videoData?.thumbnail && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${videoData.thumbnail})` }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-3xl bg-pink-500/30 flex items-center justify-center border border-pink-500/40 shadow-glass-md transition-transform hover:scale-110 backdrop-blur-sm">
                      <Icon name="Music" size={32} color="var(--color-primary)" />
                    </div>
                    <p className="text-sm font-semibold text-white">{t('videoDetailsDownload.audioPreview')}</p>
                    <p className="text-xs font-medium text-white/70 text-center max-w-[80%] line-clamp-2">{videoData?.title}</p>
                  </div>
                  <audio
                    ref={videoRef}
                    src={streamUrl}
                    preload="metadata"
                    className="hidden"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={usingClip ? undefined : streamUrl}
                  className="w-full h-full object-contain"
                  preload="metadata"
                  playsInline
                  crossOrigin="anonymous"
                />
              )}

              {/* ── STATE 1: Media Fetching / Buffering Spinner ── */}
              {(isMediaLoading || isBuffering || clipLoading) && !activeDownload && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  {/* Triple-layer spinner */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-[3px] border-primary/10 animate-[ping_2s_ease-in-out_infinite]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-[3px] border-white/10 border-t-primary rounded-full animate-spin" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon name={isAudio ? 'Music' : 'Wifi'} size={16} className="text-primary/80 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STATE 2: Trimming / Processing Progress ── */}
              {activeDownload && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  {/* Circular progress indicator */}
                  <div className="relative w-24 h-24 mb-3">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="url(#trimGradient)" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - (activeDownload.progress || 0) / 100)}`}
                        className="transition-all duration-500 ease-out"
                        style={{ filter: 'drop-shadow(0 0 6px rgba(var(--color-primary-rgb),0.6))' }}
                      />
                      <defs>
                        <linearGradient id="trimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-primary)" />
                          <stop offset="100%" stopColor="var(--color-primary-light, #60a5fa)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-white font-mono leading-none">
                        {activeDownload.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
                      {activeDownload.status === 'processing' ? t('videoDetailsDownload.processing') : t('videoDetailsDownload.trimming')}
                    </span>
                    <span className="text-xs font-semibold text-white/80 truncate max-w-[250px]">
                      {videoData?.title}
                    </span>
                  </div>
                  {/* Bottom progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-primary-light to-primary transition-all duration-500 ease-out"
                      style={{
                        width: `${activeDownload.progress}%`,
                        boxShadow: '0 0 15px rgba(var(--color-primary-rgb),0.6), 0 0 30px rgba(var(--color-primary-rgb),0.3)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ── Play/Pause Controls (hidden during loading, buffering, clip prep, or trimming) ── */}
              {!isMediaLoading && !isBuffering && !clipLoading && !activeDownload && (
                <div className={`
                  absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 transition-all duration-500
                  ${isHovering || !isPlaying ? 'bg-black/20 opacity-100 backdrop-blur-[1px]' : 'bg-transparent opacity-0 pointer-events-none'}
                `}>
                  <button
                    onClick={togglePreview}
                    className="group/playbtn relative w-16 h-16 rounded-full bg-primary/90 text-white flex items-center justify-center hover:bg-primary hover:scale-110 transition-all shadow-glass-lg"
                    title={isPlaying ? 'Pause preview' : 'Play preview in selected range'}
                  >
                    <Icon name={isPlaying ? 'Pause' : 'Play'} size={28} className="transition-transform group-hover/playbtn:scale-110" />
                    {!isPlaying && (
                      <div className="absolute -inset-2 rounded-full border-2 border-primary/30 animate-ping opacity-20" />
                    )}
                  </button>
                </div>
              )}

              {/* Top: Current Seeking/Playback Time Overlay */}
              <div className="absolute top-4 left-4 z-40 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-glass-sm flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-white/40'}`} />
                <span className="text-xs font-mono font-bold text-white tracking-widest leading-none">
                  {fmtMmSs(playheadTime)} <span className="text-white/40">/</span> {fmtMmSs(dur)}
                </span>
              </div>


              {/* Bottom: playback range indicator display */}
              {!activeDownload && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40">
                  <div className="px-4 py-2 rounded-2xl bg-gray-950 border border-white/10 text-white shadow-glass-lg whitespace-nowrap flex items-center gap-3 active:scale-95 transition-transform duration-200 cursor-default">
                    <div className="flex items-center gap-2 text-white font-bold uppercase tracking-[0.15em] text-[9px]">
                      <Icon name="Scissors" size={12} className="text-primary animate-pulse" />
                      <span>{t('videoDetailsDownload.selectedRange')}</span>
                    </div>

                    <div className="h-4 w-px bg-white" />

                    <div className="flex items-center gap-2.5 font-mono font-black text-sm text-primary tracking-tight">
                      <span className="drop-shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]">{fmtMmSs(startTime)}</span>
                      <Icon name="ArrowRight" size={12} className="text-white" />
                      <span className="drop-shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]">{fmtMmSs(endTime)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Range selector label + Trim Guide ──────────────────────── */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground tracking-wide">
              {t('videoDetailsDownload.selectTrimRange')}
            </h4>
            <div className="relative">
              <button
                onClick={() => setShowTrimGuide(!showTrimGuide)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  showTrimGuide
                    ? 'bg-primary text-white shadow-glass-sm'
                    : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'
                }`}
              >
                <Icon name="HelpCircle" size={13} />
                <span className="hidden sm:inline">{t('videoDetailsDownload.trimmerGuide')}</span>
              </button>

              {/* Tooltip Popover */}
              {showTrimGuide && (
                <>
                  {/* Backdrop to close */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowTrimGuide(false)} />
                  <div
                    className={`absolute right-0 top-full mt-2 z-50 w-[320px] rounded-2xl border p-5 shadow-xl animate-scale-in ${
                      isDark
                        ? 'bg-gray-900 border-white/10'
                        : 'bg-white border-gray-200'
                    }`}
                    style={{
                      boxShadow: isDark
                        ? '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                        : '0 12px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Icon name="HelpCircle" size={14} className="text-primary" />
                        </div>
                        <span className="text-sm font-black text-foreground">{t('videoDetailsDownload.trimmerGuide')}</span>
                      </div>
                      <button onClick={() => setShowTrimGuide(false)} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                        <Icon name="X" size={16} />
                      </button>
                    </div>

                    {/* Guide items */}
                    <div className="space-y-3 text-xs">
                      {[
                        { icon: 'GripVertical', color: 'text-primary', labelKey: 'guideBlueHandles', descKey: 'guideBlueHandlesDesc' },
                        { icon: 'Circle', color: 'text-red-500', labelKey: 'guideRedPlayhead', descKey: 'guideRedPlayheadDesc' },
                        { icon: 'Zap', color: 'text-amber-500', labelKey: 'guideQuickPresets', descKey: 'guideQuickPresetsDesc' },
                        { icon: 'Type', color: 'text-emerald-500', labelKey: 'guideTimeInputs', descKey: 'guideTimeInputsDesc' },
                        { icon: 'Play', color: 'text-primary', labelKey: 'guidePreview', descKey: 'guidePreviewDesc' },
                        { icon: 'Download', color: 'text-blue-500', labelKey: 'guideDownload', descKey: 'guideDownloadDesc' },
                        { icon: 'RotateCcw', color: 'text-red-400', labelKey: 'guideResetAll', descKey: 'guideResetAllDesc' },
                      ].map(({ icon, color, labelKey, descKey }) => (
                        <div key={labelKey} className="flex items-start gap-2.5">
                          <div className={`w-6 h-6 rounded-md bg-accent/30 flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon name={icon} size={12} className={color} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground leading-tight">{t(`videoDetailsDownload.${labelKey}`)}</span>
                            <span className="text-muted-foreground leading-snug">{t(`videoDetailsDownload.${descKey}`)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>


          {/* ── Presets ───────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('videoDetailsDownload.quickPresets')}
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map(({ label, s, e }) => {
                // Strict match: only the preset whose start AND end exactly match current trim
                const sMatch = Math.abs(s - startTime) < 0.1;
                const eMatch = Math.abs(e - endTime) < 0.1;
                const active = sMatch && eMatch;
                return (
                  <button
                    key={label}
                    onClick={() => applyTrim(s, e)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all spring-smooth
                      ${active
                        ? 'bg-primary border-primary text-white shadow-glass-sm'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary'
                      }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>


          {/* ── Timeline ─────────────────────────────────────────────────── */}
          <div className="space-y-2" style={{ userSelect: 'none' }}>
            <div
              ref={timelineRef}
              className="relative h-10 rounded-xl cursor-pointer select-none"
              style={{ background: 'var(--color-muted)' }}
              onClick={(e) => {
                if (isDragging) return;
                const t = getTimeAt(e.clientX);
                if (videoRef.current && !usingClip) videoRef.current.currentTime = t;
              }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-muted-foreground/10 to-muted-foreground/5" />

              {/* Dimmed regions logic based on theme */}
              {isDark ? (
                <>
                  {/* Outside dimming for Dark Mode */}
                  <div
                    className="absolute top-0 bottom-0 rounded-l-xl bg-black/40"
                    style={{ left: 0, width: pct(startTime, dur) }}
                  />
                  <div
                    className="absolute top-0 bottom-0 rounded-r-xl bg-black/40"
                    style={{ left: pct(endTime, dur), right: 0 }}
                  />
                  {/* Highlight for Dark Mode */}
                  <div
                    className="absolute top-0 bottom-0 bg-primary/40 border-y-2 border-primary/60"
                    style={{
                      left: pct(startTime, dur),
                      width: pct(endTime - startTime, dur),
                    }}
                  />
                </>
              ) : (
                <>
                  {/* Inside dimming for Light Mode */}
                  <div
                    className="absolute top-0 bottom-0 bg-black/20"
                    style={{
                      left: pct(startTime, dur),
                      width: pct(endTime - startTime, dur),
                    }}
                  />
                  {/* Highlight/Border for Light Mode selection */}
                  <div
                    className="absolute top-0 bottom-0 border-y-2 border-primary/80"
                    style={{
                      left: pct(startTime, dur),
                      width: pct(endTime - startTime, dur),
                    }}
                  />
                </>
              )}

              {/* Time ruler ticks */}
              {[0.25, 0.5, 0.75].map((f) => (
                <div
                  key={f}
                  className="absolute top-1/4 bottom-1/4 w-px bg-white/10"
                  style={{ left: `${f * 100}%` }}
                />
              ))}

              {/* ── START HANDLE ── */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-40
                  w-5 h-9 rounded-md shadow-glass-md flex items-center justify-center gap-px
                  cursor-ew-resize transition-transform
                  ${isDragging === 'start' ? 'scale-110 bg-primary' : 'bg-primary hover:scale-105'} group`}
                style={{ left: pct(startTime, dur) }}
                onMouseDown={onHandleDown('start')}
                onTouchStart={onHandleDown('start')}
              >
                <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                {/* Tooltip */}
                <div className={`
                  absolute -top-8 left-1/2 -translate-x-1/2
                  px-2 py-0.5 rounded text-[10px] font-mono bg-primary text-white whitespace-nowrap shadow-md
                  transition-opacity ${isDragging === 'start' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}>
                  {fmtMmSs(startTime)}
                </div>
              </div>

              {/* ── END HANDLE ── */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-40
                  w-5 h-9 rounded-md shadow-glass-md flex items-center justify-center gap-px
                  cursor-ew-resize transition-transform
                  ${isDragging === 'end' ? 'scale-110 bg-primary' : 'bg-primary hover:scale-105'} group`}
                style={{ left: pct(endTime, dur) }}
                onMouseDown={onHandleDown('end')}
                onTouchStart={onHandleDown('end')}
              >
                <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                {/* Tooltip */}
                <div className={`
                  absolute -top-8 left-1/2 -translate-x-1/2
                  px-2 py-0.5 rounded text-[10px] font-mono bg-primary text-white whitespace-nowrap shadow-md
                  transition-opacity ${isDragging === 'end' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}>
                  {fmtMmSs(endTime)}
                </div>
              </div>

              {/* ── PLAYHEAD ── red glowing vertical line + draggable circle head */}
              {dur > 0 && (
                <div
                  className="absolute top-0 bottom-0 z-30 -translate-x-1/2 pointer-events-none"
                  style={{ left: pct(playheadTime, dur) }}
                >
                  {/* Glowing line */}
                  <div
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5"
                    style={{
                      background: '#ef4444',
                      boxShadow: '0 0 6px 2px rgba(239,68,68,0.7), 0 0 12px 4px rgba(239,68,68,0.35)',
                    }}
                  />
                  {/* Draggable circle head — re-enables pointer events */}
                  <div
                    className={`absolute -top-1 left-1/2 -translate-x-1/2
                      w-4 h-4 rounded-full border-2 border-red-400 bg-red-500
                      cursor-grab active:cursor-grabbing pointer-events-auto
                      transition-transform hover:scale-125
                      ${isDragging === 'playhead' ? 'scale-125' : ''}`}
                    style={{ boxShadow: '0 0 8px 3px rgba(239,68,68,0.8)' }}
                    onMouseDown={onHandleDown('playhead')}
                    onTouchStart={onHandleDown('playhead')}
                  />
                  {/* Floating time tooltip — always visible while dragging */}
                  {isDragging === 'playhead' && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2
                      px-2 py-0.5 rounded text-[10px] font-mono bg-red-500 text-white whitespace-nowrap shadow-md z-40">
                      {fmtMmSs(playheadTime)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Time markers */}
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-0.5">
              <span>{fmtMmSs(0)}</span>
              <span>{fmtMmSs(dur * 0.25)}</span>
              <span>{fmtMmSs(dur * 0.5)}</span>
              <span>{fmtMmSs(dur * 0.75)}</span>
              <span>{fmtMmSs(dur)}</span>
            </div>
          </div>

          {/* ── Time Inputs & Action Hub ────────────────────────────────── */}
          <div className="grid grid-cols-[1.2fr,auto,1.2fr] gap-3 items-end">
            {/* Start */}
            <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform duration-200 min-w-0">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-4">
                {t('videoDetailsDownload.startTime')}
              </label>
              <div
                className="flex items-center h-11 bg-primary/5 border border-primary/10 rounded-full p-1 transition-all hover:bg-primary/10 hover:border-primary/20 hover:shadow-glass-sm group/input"
              >
                <div className="flex-1 flex items-center bg-white/5 rounded-full px-4 h-full min-w-0">
                  <input
                    type="text"
                    value={startInput}
                    onChange={(e) => handleStartInput(e.target.value)}
                    placeholder="0:00"
                    className="w-full bg-transparent text-primary font-black border-none outline-none focus:ring-0 text-[13px] tracking-widest text-center"
                  />
                </div>
                <div className="px-3 h-full flex items-center bg-primary/20 rounded-full text-[9px] font-bold text-primary uppercase tracking-wider whitespace-nowrap ml-1">
                  {t('videoDetailsDownload.startBadge')}
                </div>
              </div>
            </div>

            {/* Hub: Preview & Download */}
            <div className="flex flex-col gap-2 pb-0.5 shrink-0">
              {!isThumbnail && (
                <div className="flex gap-2">
                  {/* Preview / Stop Button */}
                  <button
                    onClick={togglePreview}
                    className={`group/prev relative h-11 px-5 rounded-full flex items-center gap-2.5 font-bold text-[10px] uppercase tracking-widest transition-all duration-300 overflow-hidden
                      ${isPlaying
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-400/30 shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95'
                        : 'bg-white/5 border border-primary/25 text-primary hover:bg-primary/15 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.2)] active:scale-95'
                      }`}
                  >
                    {/* Inner shimmer on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover/prev:opacity-100 transition-opacity duration-500 ${isPlaying ? 'bg-gradient-to-r from-white/10 via-white/5 to-transparent' : 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent'}`} />

                    <div className="relative flex items-center gap-2">
                      {isPlaying && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                      <Icon
                        name={isPlaying ? 'Square' : 'Play'}
                        size={isPlaying ? 10 : 13}
                        className={`relative transition-transform duration-300 ${!isPlaying ? 'group-hover/prev:translate-x-0.5 group-hover/prev:scale-110' : ''}`}
                      />
                      <span className="relative">{clipLoading ? '...' : isPlaying ? t('videoDetailsDownload.stopPreview') : t('videoDetailsDownload.playPreview')}</span>
                    </div>
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={handleDownloadTrimmed}
                    disabled={!videoData?.url || isThumbnail}
                    className="group/dl relative h-11 px-6 rounded-full bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-[0_4px_15px_rgba(var(--color-primary-rgb),0.3)] hover:shadow-[0_4px_25px_rgba(var(--color-primary-rgb),0.5)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 disabled:opacity-40 disabled:grayscale disabled:pointer-events-none overflow-hidden"
                  >
                    {/* Inner shimmer on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover/dl:translate-x-[100%] transition-transform duration-700" />

                    <Icon
                      name={isAudio ? 'Music' : 'Download'}
                      size={13}
                      className="relative transition-transform duration-300 group-hover/dl:scale-110 group-hover/dl:-translate-y-0.5"
                    />
                    <span className="relative">{t('videoDetailsDownload.downloadBtn')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* End */}
            <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform duration-200 min-w-0">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-4">
                {t('videoDetailsDownload.endTime')}
              </label>
              <div
                className="flex items-center h-11 bg-primary/5 border border-primary/10 rounded-full p-1 transition-all hover:bg-primary/10 hover:border-primary/20 hover:shadow-glass-sm group/input"
              >
                <div className="flex-1 flex items-center bg-white/5 rounded-full px-4 h-full min-w-0">
                  <input
                    type="text"
                    value={endInput}
                    onChange={(e) => handleEndInput(e.target.value)}
                    placeholder="0:00"
                    className="w-full bg-transparent text-primary font-black border-none outline-none focus:ring-0 text-[13px] tracking-widest text-center"
                  />
                </div>
                <div className="px-3 h-full flex items-center bg-primary/20 rounded-full text-[9px] font-bold text-primary uppercase tracking-wider whitespace-nowrap ml-1">
                  {t('videoDetailsDownload.endBadge')}
                </div>
              </div>
            </div>
          </div>

          {/* ── Video / Audio toggle ──────────────────────────────────────── */}
          {!isThumbnail && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] shrink-0">{t('videoDetailsDownload.trimAs')}</span>
              <div className="flex bg-accent/30 rounded-full p-1 gap-1">
                {(['video', 'audio']).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTrimTypeChange(type)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200
                      ${trimType === type
                        ? 'bg-primary text-white shadow-glass-sm'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Icon name={type === 'audio' ? 'Music' : 'Video'} size={10} />
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Selected quality badge ────────────────────────────────────── */}
          {!isThumbnail && (() => {
            const effectiveFormat = isAudio ? 'MP3' : (dlFormat || 'mp4').toUpperCase();
            const effectiveQuality = isAudio
              ? 'Best Audio'
              : (dlQuality && dlQuality !== 'audio' ? dlQuality : (videoData?.max_quality || '1080p'));
            return (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/8 to-primary/4 border border-primary/20 relative overflow-hidden">
                {/* Subtle shimmer bg */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />

                {/* Icon */}
                <div className="relative w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 shadow-inner">
                  <Icon name={isAudio ? 'Music' : 'Video'} size={16} className="text-primary" />
                </div>

                {/* Label + value */}
                <div className="relative flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.18em] leading-none">{t('videoDetailsDownload.willDownloadAs')}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-black text-primary leading-none">{effectiveQuality}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-wider shadow-glass-sm">
                      {effectiveFormat}
                    </span>
                  </div>
                </div>

                {/* Info hint */}
                <div
                  className="relative ml-auto flex items-center gap-1.5 text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer group/hint"
                  title="Change quality in Download Options above"
                  onClick={() => document.getElementById('download-options')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                  <Icon name="ArrowUp" size={13} className="group-hover/hint:animate-bounce" />
                  <span className="text-[9px] italic hidden sm:block group-hover/hint:underline">{t('videoDetailsDownload.changeInOptions')}</span>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-3 gap-3">
            {/* Range */}
            <div className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-2xl bg-primary/5 border border-primary/15 hover:border-primary/25 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center mb-0.5">
                <Icon name="Scissors" size={15} className="text-primary" />
              </div>
              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.15em] leading-tight text-center">
                {t('videoDetailsDownload.rangeBadge')}
              </p>
              <p className="text-[13px] font-black text-primary font-mono text-base">
                {fmtMmSs(startTime)} → {fmtMmSs(endTime)}
              </p>
            </div>

            {/* Trimmed Duration */}
            <div className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-2xl bg-accent/10 border border-primary/15 hover:border-primary/25 transition-colors">             <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center mb-0.5">
              <Icon name="Clock" size={15} className="text-foreground/70" />
            </div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-tight text-center">
                {t('videoDetailsDownload.trimmedDurationBadge')}
              </p>
              <p className="text-base font-black text-foreground font-mono">{fmtDisplay(trimmedDur)}</p>
            </div>

            {/* Reset — full card clickable */}
            <div
              className="flex flex-col items-center gap-1.5 px-3 py-10 rounded-2xl bg-accent/10 border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer group/reset"
              onClick={() => applyTrim(0, dur)}
              title="Reset to full video"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/20 group-hover/reset:bg-red-500/15 flex items-center justify-center mb-0.5 transition-colors">
                <Icon name="RotateCcw" size={15} className="text-foreground/70 group-hover/reset:text-red-500 transition-colors" />
              </div>
              <p className="text-[9px] font-bold text-muted-foreground group-hover/reset:text-red-500 uppercase tracking-[0.15em] leading-tight text-center transition-colors">
                {t('videoDetailsDownload.resetAll')}
              </p>
            </div>
          </div>

          {/* ── Action bar ────────────────────────────────────────────── */}
          <div className="flex justify-between items-center bg-accent/10 p-4 rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{t('videoDetailsDownload.estFileSize')}</span>
              <span className="text-sm font-black text-foreground">{estimatedSize}</span>
            </div>

            {/* Size Reduction badge */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-[0.15em] leading-none mb-0.5">{t('videoDetailsDownload.sizeReductionBadge')}</span>
              <span className="text-base font-black text-emerald-500">−{sizeReduction}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTrimmer;