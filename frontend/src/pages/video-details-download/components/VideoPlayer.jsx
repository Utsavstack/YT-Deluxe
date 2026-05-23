import React, { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

const VideoPlayer = ({ videoData, onQualityChange }) => {
  // ── Player Mode ──────────────────────────────────────────────────────────
  const [useIframe, setUseIframe]     = useState(true);
  const [embedError, setEmbedError]   = useState(false);
  const [videoReady, setVideoReady]   = useState(false);

  // ── Shared Playback State ─────────────────────────────────────────────────
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [hasStarted,     setHasStarted]     = useState(false);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [volume,         setVolume]         = useState(1);
  const [isMuted,        setIsMuted]        = useState(false);
  const [playbackSpeed,  setPlaybackSpeed]  = useState(1);
  const [showControls,   setShowControls]   = useState(true);
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [isBuffering,    setIsBuffering]    = useState(false);
  const [showSpeedMenu,  setShowSpeedMenu]  = useState(false);
  const [isEnded,        setIsEnded]        = useState(false);

  const videoRef          = useRef(null);
  const iframeRef         = useRef(null);
  const containerRef      = useRef(null);
  const controlsTimeout   = useRef(null);
  const speedMenuRef      = useRef(null);
  const durationRef       = useRef(0);
  const isEndedRef        = useRef(false);

  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Derived
  const videoId   = videoData?.id;
  const originUrl = (window.location.origin.startsWith('file') || window.location.origin === 'null')
    ? 'https://www.youtube.com'
    : window.location.origin;
  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  // ── Switch to native fallback on embed error ──────────────────────────────
  useEffect(() => {
    if (embedError) { setUseIframe(false); setVideoReady(false); }
  }, [embedError]);

  // ── YouTube IFrame: ping to activate API ─────────────────────────────────
  useEffect(() => {
    if (!useIframe || embedError) return;
    const id = setInterval(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 1 }), '*'
      );
    }, 250);
    const stop = setTimeout(() => clearInterval(id), 4000);
    return () => { clearInterval(id); clearTimeout(stop); };
  }, [useIframe, embedError, videoId]);

  // ── YouTube IFrame: handle postMessage events ─────────────────────────────
  useEffect(() => {
    if (!useIframe) return;
    const onMsg = (e) => {
      if (!e.origin.includes('youtube')) return;
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // Embed errors (info 150/101 = restricted)
        if (d.event === 'onError' || d.info === 150 || d.info === 101) {
          setEmbedError(true); return;
        }
        if (d.event === 'onReady') { setVideoReady(true); durationRef.current = d.info?.duration || 0; setDuration(durationRef.current); }
        if (d.event === 'onStateChange') {
          if (d.info === 1) { setIsPlaying(true); setIsBuffering(false); setVideoReady(true); setHasStarted(true); setIsEnded(false); isEndedRef.current = false; }
          if (d.info === 2) setIsPlaying(false);
          if (d.info === 3) setIsBuffering(true);
          if (d.info === 0) {
            setIsPlaying(false); setIsEnded(true); isEndedRef.current = true;
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), '*');
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
          }
        }
        if (d.event === 'infoDelivery' && d.info) {
          if (d.info.currentTime !== undefined) {
            setCurrentTime(d.info.currentTime);
            const dur = d.info.duration || durationRef.current;
            if (dur > 0 && d.info.currentTime >= dur - 0.4 && !isEndedRef.current) {
               isEndedRef.current = true;
               setIsPlaying(false); setIsEnded(true);
               iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), '*');
               iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
            }
          }
          if (d.info.duration    !== undefined) { setDuration(d.info.duration); durationRef.current = d.info.duration; }
          if (d.info.muted       !== undefined) setIsMuted(d.info.muted);
          if (d.info.volume      !== undefined) setVolume(d.info.volume / 100);
        }
      } catch (_) {}
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [useIframe]);

  // ── Native video: event listeners ────────────────────────────────────────
  useEffect(() => {
    if (useIframe) return;
    const v = videoRef.current;
    if (!v) return;
    const onTime    = () => setCurrentTime(v.currentTime);
    const onMeta    = () => setDuration(v.duration);
    const onWait    = () => setIsBuffering(true);
    const onPlay    = () => { setIsBuffering(false); setIsPlaying(true); setIsEnded(false); isEndedRef.current = false; };
    const onPause   = () => setIsPlaying(false);
    const onEnd     = () => { setIsPlaying(false); setIsEnded(true); isEndedRef.current = true; };
    v.addEventListener('timeupdate',     onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('waiting',        onWait);
    v.addEventListener('playing',        onPlay);
    v.addEventListener('pause',          onPause);
    v.addEventListener('ended',          onEnd);
    return () => {
      v.removeEventListener('timeupdate',     onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('waiting',        onWait);
      v.removeEventListener('playing',        onPlay);
      v.removeEventListener('pause',          onPause);
      v.removeEventListener('ended',          onEnd);
    };
  }, [useIframe]);

  // ── YT iframe command helper ──────────────────────────────────────────────
  const ytCmd = useCallback((func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }), '*'
    );
  }, []);

  // ── Controls (unified for both modes) ────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  }, []);

  const togglePlay = useCallback(() => {
    if (useIframe) {
      ytCmd(isPlaying ? 'pauseVideo' : 'playVideo');
      setIsPlaying(p => !p);
      if (!hasStarted) setHasStarted(true);
    } else {
      const v = videoRef.current;
      if (isPlaying) v?.pause();
      else { v?.play(); if (!hasStarted) setHasStarted(true); }
      setIsPlaying(p => !p);
    }
  }, [useIframe, isPlaying, hasStarted, ytCmd]);

  const skipTime = useCallback((sec) => {
    if (useIframe) {
      setCurrentTime(prev => {
        const t = Math.max(0, Math.min(duration, prev + sec));
        ytCmd('seekTo', [t, true]);
        return t;
      });
    } else {
      const v = videoRef.current;
      if (v) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + sec));
    }
  }, [useIframe, duration, ytCmd]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'KeyF' || e.key?.toLowerCase() === 'f') { e.preventDefault(); toggleFullscreen(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); skipTime(10); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); skipTime(-10); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, skipTime, toggleFullscreen]);

  const handleSeek = (e) => {
    const t = parseFloat(e.target.value);
    if (useIframe) { setCurrentTime(t); ytCmd('seekTo', [t, true]); }
    else if (videoRef.current) videoRef.current.currentTime = t;
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v); setIsMuted(v === 0);
    if (useIframe) { ytCmd('setVolume', [v * 100]); ytCmd(v === 0 ? 'mute' : 'unMute'); }
    else if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; }
  };

  const toggleMute = () => {
    if (useIframe) { ytCmd(isMuted ? 'unMute' : 'mute'); setIsMuted(p => !p); }
    else {
      const v = videoRef.current;
      if (isMuted) { v.volume = volume; setIsMuted(false); }
      else { v.volume = 0; setIsMuted(true); }
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed); setShowSpeedMenu(false);
    if (useIframe) ytCmd('setPlaybackRate', [speed]);
    else if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${m}:${String(sec).padStart(2,'0')}`;
  };

  const showCtrlsTemp = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      onMouseMove={showCtrlsTemp}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >

      {/* ── YouTube Iframe (Primary) ── */}
      {useIframe && (
        <>
          {/* Loading / thumbnail placeholder */}
          {!videoReady && !embedError && (
            <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
              {videoData?.thumbnail && (
                <img src={videoData.thumbnail} alt="" className="w-full h-full object-cover opacity-40" />
              )}
              <div className="absolute w-14 h-14 border-[3px] border-white/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          <iframe
            ref={iframeRef}
            width="100%" height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&controls=0&disablekb=1&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${originUrl}`}
            title={videoData?.title}
            frameBorder="0"
            allow="autoplay; encrypted-media; fullscreen"
            className={`w-[140%] h-[140%] absolute top-[-20%] left-[-20%] pointer-events-none transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          />
          {/* Transparent click-blocker so our controls intercept clicks */}
          <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} />
        </>
      )}

      {/* ── Native Video (Fallback on embedError) ── */}
      {!useIframe && (
        <>
          {!hasStarted && videoData?.thumbnail && (
            <div className="absolute inset-0">
              <img src={videoData.thumbnail} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster={videoData?.thumbnail}
            onClick={togglePlay}
            src={videoData?.videoUrl}
          />
          {/* Stream badge */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
            <Icon name="HardDrive" size={10} />
            Stream Fallback
          </div>
        </>
      )}

      {/* ── Buffering spinner ── */}
      {isBuffering && !useIframe && (
        <div className="absolute inset-0 flex items-center justify-center z-[45] pointer-events-none">
          <div className="w-14 h-14 border-[3px] border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* ── Initial big play button ── */}
      {!hasStarted && !isBuffering && !useIframe && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all duration-300 shadow-[0_0_40px_rgba(var(--color-primary-rgb),0.5)] hover:scale-110 active:scale-95 border border-white/20"
          >
            <Icon name="Play" size={34} className="text-white ml-1" />
          </button>
        </div>
      )}

      {/* ── Custom End Screen (Replay UI) ── */}
      {isEnded && (
        <div className="absolute inset-0 z-40 bg-black flex items-center justify-center transition-all duration-300">
          {videoData?.thumbnail && (
            <img src={videoData.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEnded(false);
              isEndedRef.current = false;
              if (useIframe) { ytCmd('seekTo', [0, true]); ytCmd('playVideo'); }
              else if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); }
            }}
            className="w-16 h-16 rounded-full bg-primary/80 hover:bg-primary border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-[0_0_25px_rgba(var(--color-primary-rgb),0.4)] relative z-10"
          >
            <Icon name="RotateCcw" size={26} className="text-white" />
          </button>
        </div>
      )}

      {/* ── Controls overlay (shown when hasStarted) ── */}
      {hasStarted && (
        <div className={`absolute inset-0 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

          {/* Fullscreen exit button */}
          {isFullscreen && (
            <div className="absolute top-4 left-4 z-30">
              <button
                onClick={(e) => { e.stopPropagation(); document.exitFullscreen(); setIsFullscreen(false); }}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/70 transition-all"
              >
                <Icon name="ArrowLeft" size={18} className="text-white" />
              </button>
            </div>
          )}

          {/* Center: play/pause only */}
          {!isBuffering && !isEnded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="flex items-center pointer-events-auto">
                <button onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-primary/80 hover:bg-primary border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-[0_0_25px_rgba(var(--color-primary-rgb),0.4)]">
                  <Icon name={isPlaying ? 'Pause' : 'Play'} size={26} className="text-white ml-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-30">
            {/* Progress bar */}
            <div className="mb-3 group/prog">
              <div className="relative h-[4px] group-hover/prog:h-[6px] transition-all duration-150 bg-white/20 rounded-full cursor-pointer">
                <div className="absolute top-0 left-0 h-full bg-white/15 rounded-full" style={{ width: `${Math.min(progressPct + 8, 100)}%` }} />
                <div className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.8)]" style={{ width: `${progressPct}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/prog:opacity-100 transition-all pointer-events-none" style={{ left: `${progressPct}%` }} />
                <input type="range" min="0" max={duration || 100} step="0.1" value={currentTime || 0}
                  onChange={handleSeek}
                  className="w-full h-full absolute inset-0 appearance-none cursor-pointer bg-transparent z-10 outline-none m-0 p-0
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0
                  [&::-moz-range-thumb]:w-0 [&::-moz-range-thumb]:h-0 [&::-moz-range-thumb]:border-none"
                />
              </div>
            </div>

            {/* Control bar */}
            <div className="flex items-center justify-between gap-2 mt-1">
              {/* Left */}
              <div className="flex items-center gap-2">
                <button onClick={togglePlay} className="h-[28px] px-3 rounded-lg bg-black/40 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 text-white transition-all border border-black/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md">
                  <Icon name={isPlaying ? 'Pause' : 'Play'} size={15} className={isPlaying ? '' : 'ml-0.5'} />
                </button>
                <div className="h-[28px] px-3 rounded-lg bg-black/40 dark:bg-white/10 border border-black/20 dark:border-white/10 text-white/90 text-[12px] font-medium tracking-wide flex items-center justify-center backdrop-blur-md">
                  {fmtTime(currentTime)} / {fmtTime(duration)}
                </div>
                {/* Volume */}
                <div className="h-[28px] px-3 rounded-lg bg-black/40 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 border border-black/20 dark:border-white/10 flex items-center gap-2 group/vol transition-all backdrop-blur-md">
                  <button onClick={toggleMute} className="text-white flex items-center justify-center">
                    <Icon name={isMuted ? 'VolumeX' : volume > 0.5 ? 'Volume2' : 'Volume1'} size={15} />
                  </button>
                  <div className="w-16 relative h-[3px] group-hover/vol:h-[4px] bg-white/30 dark:bg-white/20 rounded-full flex items-center cursor-pointer transition-all">
                    <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/vol:opacity-100 transition-opacity pointer-events-none" style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }} />
                    <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full h-full absolute inset-0 appearance-none cursor-pointer bg-transparent z-10 outline-none m-0 p-0
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-transparent
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">
                {/* Speed */}
                <div className="relative" ref={speedMenuRef}>
                  <button onClick={() => setShowSpeedMenu(p => !p)}
                    className="h-[28px] px-3 rounded-lg bg-black/40 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 text-white text-[12px] font-bold transition-all border border-black/20 dark:border-white/10 flex items-center justify-center min-w-[40px] backdrop-blur-md">
                    {playbackSpeed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/85 backdrop-blur-xl border border-white/10 rounded-xl py-1 min-w-[70px] shadow-xl z-50">
                      {SPEEDS.map(s => (
                        <button key={s} onClick={() => changeSpeed(s)}
                          className={`block w-full px-3 py-1.5 text-xs text-left rounded-lg transition-colors
                            ${playbackSpeed === s ? 'text-primary font-bold bg-primary/10' : 'text-white hover:bg-white/10'}`}>
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="h-[28px] px-3 rounded-lg bg-black/40 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 text-white transition-all border border-black/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md">
                  <Icon name={isFullscreen ? 'Minimize' : 'Maximize'} size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;