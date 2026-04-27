import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';
import { usePIP } from '../../context/PIPContext';

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const GlobalPIPPlayer = () => {
  const { pipVideo, isPipOpen, closePip } = usePIP();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  // Ping YouTube iframe to listen
  useEffect(() => {
    let intervalId;
    if (isPipOpen && !embedError && pipVideo) {
      intervalId = setInterval(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
        }
      }, 250);
      setTimeout(() => clearInterval(intervalId), 3000); // Stop pinging after 3s
    }
    return () => clearInterval(intervalId);
  }, [isPipOpen, embedError, pipVideo]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (!e.origin.includes('youtube')) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        
        if (data.event === 'onError' || data.event === 'error' || data.info === 150 || data.info === 101) {
          setEmbedError(true);
        }
        if (data.event === 'onReady') {
          setVideoReady(true);
          // Set duration if valid
          if (pipVideo?.duration) setDuration(pipVideo.duration);
        }
        if (data.event === 'onStateChange' && (data.info === 1 || data.info === 3)) {
          setVideoReady(true);
        }
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) setCurrentTime(data.info.currentTime);
          if (data.info.duration !== undefined) setDuration(data.info.duration);
          if (data.info.playerState !== undefined) {
             setIsPlaying(data.info.playerState === 1 || data.info.playerState === 3);
          }
          if (data.info.muted !== undefined) setIsMuted(data.info.muted);
        }
      } catch (err) {}
    };

    if (isPipOpen) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isPipOpen, pipVideo]);

  // Reset state when video changes
  useEffect(() => {
    if (pipVideo) {
      setVideoReady(false);
      setEmbedError(false);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(pipVideo.duration || 0);
    }
  }, [pipVideo]);

  const handleYTCommand = (cmd, args = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args }), '*');
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    handleYTCommand(isPlaying ? 'pauseVideo' : 'playVideo');
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    handleYTCommand(isMuted ? 'unMute' : 'mute');
    setIsMuted(!isMuted);
  };

  const seekBy = (seconds, e) => {
    e?.stopPropagation();
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration || pipVideo?.duration || 100));
    setCurrentTime(newTime);
    handleYTCommand('seekTo', [newTime, true]);
  };

  const handleSeekChange = (e) => {
    e?.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    handleYTCommand('seekTo', [newTime, true]);
    // Continue playing if paused?
    // if (!isPlaying) handleYTCommand('playVideo');
  };

  const requestFullscreen = (e) => {
    e?.stopPropagation();
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 1500); // Wait 1.5s before hiding controls
  };

  const handleDownloadRedirect = (e) => {
    e?.stopPropagation();
    closePip();
    navigate('/video-details-download', { state: { video: pipVideo } });
  };

  if (!pipVideo) return null;

  const videoId = pipVideo?.originalId || pipVideo?.id?.split('_')?.[0];
  const originUrl = window.location.origin.startsWith('file') || window.location.origin === 'null' 
    ? 'https://www.youtube.com' 
    : window.location.origin;

  return (
    <AnimatePresence>
      {isPipOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          drag
          dragConstraints={{ left: -window.innerWidth + 350, right: 20, top: -window.innerHeight + 250, bottom: 20 }}
          dragElastic={0.15}
          dragMomentum={true}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 25, power: 0.2 }}
          whileDrag={{ scale: 1.02, cursor: "grabbing" }}
          className="fixed bottom-6 right-6 z-[9999] bg-black rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/20 overflow-hidden w-[340px] aspect-video group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* IFrame Player */}
          {!embedError ? (
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&disablekb=1&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${originUrl}`}
              title={pipVideo?.title}
              frameBorder="0"
              allow="autoplay; encrypted-media; fullscreen"
              className={`w-[140%] h-[140%] absolute top-[-20%] left-[-20%] object-cover transition-opacity duration-500 pointer-events-none ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : (
            /* ── Native video fallback ── */
            <>
              <video
                autoPlay
                className="w-full h-full object-cover"
                src={`${import.meta.env.VITE_API_BASE_URL || ''}/api/stream?url=${encodeURIComponent(pipVideo?.url || '')}&quality=480p`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => { setCurrentTime(e.target.currentTime); }}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
              />
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-none z-10">
                <Icon name="HardDrive" size={9} />
                Fallback
              </div>
            </>
          )}

          {/* Fallback loading */}
          {!videoReady && !embedError && (
             <div className="absolute inset-0 bg-black flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
             </div>
          )}

          {/* Top Title Bar (Draggable Area) */}
          <div className="absolute top-0 left-0 right-0 h-12 z-20 bg-gradient-to-b from-black/90 to-transparent flex items-start justify-between px-3 pt-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="font-semibold text-white text-[12px] line-clamp-1 mr-4 drop-shadow-md cursor-grab active:cursor-grabbing flex-1 pb-2">
              {pipVideo?.title}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); closePip(); }}
              className="text-white hover:text-red-500 bg-black/40 hover:bg-black/80 rounded-full p-1.5 -max-mt-1 -mr-1 transition-colors cursor-pointer pointer-events-auto"
            >
              <Icon name="X" size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Center Play/Pause Overlay */}
          <div 
            className={`absolute inset-0 z-10 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${!isPlaying ? 'opacity-100 bg-black/40' : (isHovered ? 'opacity-100' : 'opacity-0')}`}
            onClick={togglePlay}
          >
            <div className={`flex items-center space-x-6 transform transition-transform ${isHovered || !isPlaying ? 'scale-100' : 'scale-90 relative top-2'}`}>
              {/* Back 10s */}
              <button onClick={(e) => seekBy(-10, e)} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors active:scale-95 text-xs font-bold font-mono">
                -10
              </button>
              
              {/* Big Play/Pause */}
              <button 
                 onClick={togglePlay} 
                 className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary/50 transition-all hover:scale-105 active:scale-95"
              >
                <Icon name={isPlaying ? "Pause" : "Play"} size={24} fill={isPlaying ? "none" : "currentColor"} className={isPlaying ? "" : "ml-1"} />
              </button>
              
              {/* Forward 10s */}
              <button onClick={(e) => seekBy(10, e)} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors active:scale-95 text-xs font-bold font-mono">
                +10
              </button>
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-none">
             {/* Progress Bar Area */}
             <div className={`w-full relative h-1.5 hover:h-2 transition-all bg-white/20 cursor-pointer flex items-center pointer-events-auto ${isHovered || !isPlaying ? 'opacity-100' : 'opacity-0 translate-y-2'} duration-300`}>
                <div className="absolute top-0 left-0 h-full bg-primary pointer-events-none rounded-r-full" style={{ width: `${Math.max(0, Math.min(100, (currentTime || 0) / (duration || pipVideo?.duration || 1) * 100))}%` }} />
                <input 
                  type="range" min="0" max={duration || pipVideo?.duration || 100} value={currentTime || 0} 
                  onChange={handleSeekChange} onClick={(e) => e.stopPropagation()} 
                  className="w-full h-full absolute inset-0 appearance-none cursor-pointer bg-transparent z-10 outline-none m-0 p-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 hover:[&::-webkit-slider-thumb]:w-3 hover:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" 
                />
             </div>

             {/* Bottom row actions */}
             <div className={`px-2 py-1.5 bg-gradient-to-t from-black/90 to-black/20 flex justify-between items-center pointer-events-auto transition-all duration-300 ${isHovered || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
               <div className="flex items-center space-x-2">
                 <button onClick={toggleMute} className="text-white hover:text-primary p-1 rounded transition-colors active:scale-90">
                   <Icon name={isMuted ? "VolumeX" : "Volume2"} size={16} />
                 </button>
                 <span className="text-[10px] select-none font-bold text-white/90 font-mono tracking-widest">
                   {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration || pipVideo?.duration || 0))}
                 </span>
               </div>
               
               <div className="flex items-center space-x-1">
                 <button 
                   onClick={handleDownloadRedirect}
                   className="text-[10px] bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30 px-2 py-1 mr-1 rounded-md ml-1 font-bold tracking-wide transition-all uppercase flex items-center gap-1 active:scale-95"
                   title="Download Video"
                 >
                   <Icon name="DownloadCloud" size={12} strokeWidth={2.5}/> Download
                 </button>
                 
                 <button onClick={requestFullscreen} className="text-white hover:text-primary p-1 rounded transition-colors active:scale-90">
                   <Icon name="Maximize" size={14} />
                 </button>
               </div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalPIPPlayer;
