import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ShareModal from '../../../components/ui/ShareModal';
import { YTDeluxeStorage, STORAGE_KEYS } from '../../../utils/storage';
import { usePIP } from '../../../context/PIPContext';

const VideoCard = ({ video, onPreview }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Custom Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { openPip } = usePIP();

  const navigate = useNavigate();
  const iframeRef    = useRef(null);
  const nativeRef    = useRef(null);
  const [nativeFallback, setNativeFallback] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Check saved status on mount
  useEffect(() => {
    const checkSaved = async () => {
      const list = await YTDeluxeStorage.getItem(STORAGE_KEYS.SAVED, []);
      const exists = list.some((v) => v.id === (video?.originalId || video?.id));
      setIsSaved(exists);
    };
    checkSaved();
  }, [video?.id, video?.originalId]);

  // Handle hover delay
  useEffect(() => {
    let timer;
    if (isHovered) {
      setEmbedError(false);
      setNativeFallback(false);
      timer = setTimeout(() => { setPlayVideo(true); }, 600);
    } else {
      setPlayVideo(false);
      setVideoReady(false);
      setNativeFallback(false);
    }
    return () => clearTimeout(timer);
  }, [isHovered]);

  // Fallback to display iframe
  useEffect(() => {
    let fallbackTimer;
    if (playVideo && !videoReady && !embedError) {
      fallbackTimer = setTimeout(() => {
        setVideoReady(true);
      }, 1500);
    }
    return () => clearTimeout(fallbackTimer);
  }, [playVideo, videoReady, embedError]);

  // Ping YouTube iframe
  useEffect(() => {
    let intervalId;
    if (playVideo && !embedError) {
      intervalId = setInterval(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), '*');
        }
      }, 250);
      setTimeout(() => clearInterval(intervalId), 3000);
    }
    return () => clearInterval(intervalId);
  }, [playVideo, embedError]);

  useEffect(() => {
    const handleMessage = (e) => {
      if (!e.origin.includes('youtube')) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'onError' || data.event === 'error' || data.info === 150 || data.info === 101) {
          setEmbedError(true);
          setPlayVideo(false);
          setVideoReady(false);
          // Switch to native video fallback
          setNativeFallback(true);
        }
        if (data.event === 'onStateChange' && (data.info === 1 || data.info === 3)) {
          setVideoReady(true);
        }
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) setCurrentTime(data.info.currentTime);
          if (data.info.duration !== undefined) setDuration(data.info.duration);
          if (data.info.playerState !== undefined) setIsPlaying(data.info.playerState === 1 || data.info.playerState === 3);
          if (data.info.muted !== undefined) setIsMuted(data.info.muted);
        }
      } catch (err) {}
    };

    if (playVideo) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [playVideo]);

  useEffect(() => {
    if (showSavedToast) {
      const t = setTimeout(() => setShowSavedToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [showSavedToast]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleYTCommand = (cmd, args = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args }), '*');
    }
  };

  const togglePlayState = (e) => {
    e?.stopPropagation();
    handleYTCommand(isPlaying ? 'pauseVideo' : 'playVideo');
    setIsPlaying(!isPlaying);
  };

  const toggleMuteState = (e) => {
    e?.stopPropagation();
    handleYTCommand(isMuted ? 'unMute' : 'mute');
    setIsMuted(!isMuted);
  };

  const handleSeekChange = (e) => {
    e?.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    handleYTCommand('seekTo', [newTime, true]);
  };

  const formatViews = (views) => {
    if (!views && views !== 0) return '0 views';
    let numericNum = views;
    if (typeof views === 'string') {
      const match = views.replace(/\s*views\s*$/i, '').match(/^([\d.]+)\s*([KMBkmb])\+?$/);
      if (match) {
        const val = parseFloat(match[1]);
        const suffix = match[2].toUpperCase();
        let multiplier = 1;
        if (suffix === 'K') multiplier = 1000;
        else if (suffix === 'M') multiplier = 1000000;
        else if (suffix === 'B') multiplier = 1000000000;
        numericNum = val * multiplier;
      } else {
        numericNum = parseInt(views.replace(/[^0-9]/g, ''), 10);
      }
    }
    if (isNaN(numericNum)) return `${views}`;

    if (numericNum >= 1000000000) return `${(numericNum / 1000000000).toFixed(1).replace(/\.0$/, '')}B views`;
    if (numericNum >= 1000000) return `${(numericNum / 1000000).toFixed(1).replace(/\.0$/, '')}M views`;
    if (numericNum >= 1000) return `${(numericNum / 1000).toFixed(1).replace(/\.0$/, '')}K views`;
    return `${numericNum} views`;
  };

  const handleCardClick = () => {
    navigate('/video-details-download', { state: { video } });
  };

  const handleQuickDownload = async (e) => {
    e?.stopPropagation();
    setIsLoading(true);
    try {
      await onQuickDownload(video);
    } catch (error) {
      console.error('Quick download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = async (e) => {
    e?.stopPropagation();
    const list = await YTDeluxeStorage.getItem(STORAGE_KEYS.SAVED, []);
    const videoId = video?.originalId || video?.id;
    const existsIndex = list.findIndex((v) => v.id === videoId);
    
    let newList = [...list];
    let added = false;
    
    if (existsIndex !== -1) {
      newList.splice(existsIndex, 1);
      added = false;
    } else {
      newList.unshift({
        id: videoId,
        title: video?.title,
        thumbnail: video?.thumbnail,
        channel: video?.channel?.name || video?.uploader || '',
        duration: video?.duration,
        views: video?.views,
        uploadDate: video?.uploadDate,
        url: video?.url,
        quality: video?.quality,
        savedAt: new Date().toISOString()
      });
      added = true;
    }
    
    await YTDeluxeStorage.setItem(STORAGE_KEYS.SAVED, newList);
    setIsSaved(added);
    setShowSavedToast(added ? 'saved' : 'removed');
  };

  const handleShare = async (e) => {
    e?.stopPropagation();
    setIsShareModalOpen(true);
  };

  return (
    <div
      className="bg-white dark:bg-[#1e1e1e]/80 backdrop-blur-xl border border-border/40 hover:border-primary/30 p-3 pb-5 rounded-[24px] sm:rounded-[32px] shadow-glass-sm hover:shadow-glass-xl transition-all duration-500 spring-smooth cursor-pointer group relative flex flex-col gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {showSavedToast && (
        <div className="absolute bottom-[60px] right-3 z-[100] animate-spring-up pointer-events-none" style={{ animationDuration: '0.4s' }}>
          <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-black/5 dark:border-white/10 px-2.5 py-1.5 rounded-[14px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center space-x-1.5 w-max">
            <div className={`p-1 rounded-[10px] flex items-center justify-center ${showSavedToast === 'saved' ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-red-500/20 text-red-500'}`}>
              <Icon name={showSavedToast === 'saved' ? 'BookmarkCheck' : 'BookmarkMinus'} size={12} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-bold text-foreground/80 tracking-widest uppercase pr-1">
              {showSavedToast === 'saved' ? 'Saved' : 'Removed'}
            </span>
          </div>
        </div>
      )}

      {/* Thumbnail Section */}
      <div className="relative overflow-hidden rounded-[16px] sm:rounded-[24px] bg-black group-hover:shadow-inner-lg transition-all duration-500 border border-white/5">
        <Image
          src={video?.thumbnail}
          alt={video?.title}
          className={`w-full h-52 object-cover transition-transform duration-700 ease-out ${isHovered ? 'scale-105' : 'scale-100'}`}
        />

        {playVideo && !embedError && (
          <div className={`absolute inset-0 z-10 transition-opacity duration-500 ease-in bg-black overflow-hidden ${videoReady ? 'opacity-100' : 'opacity-0'}`}>
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${video?.originalId || video?.id?.split('_')?.[0]}?autoplay=1&mute=0&controls=0&disablekb=1&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${window.location.origin.startsWith('file') || window.location.origin === 'null' ? 'https://www.youtube.com' : window.location.origin}`}
              title={video?.title}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              className="w-[140%] h-[140%] absolute top-[-20%] left-[-20%] object-cover opacity-100 pointer-events-none"
            />
            <div className="absolute inset-0 cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); handleCardClick(); }} />
            
            <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {/* Unified Controls Pill */}
              <div className="flex items-center bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1.5 shadow-glass-xl gap-3">
                
                {/* Left Controls (Play/Pause, Mute) */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button onClick={togglePlayState} className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-primary rounded-full text-white transition-all active:scale-90 border border-white/10 hover:border-primary/50">
                    <Icon name={isPlaying ? "Pause" : "Play"} size={14} fill={isPlaying ? "none" : "currentColor"} className={isPlaying ? "" : "ml-0.5"} />
                  </button>
                  <button onClick={toggleMuteState} className="text-white/80 hover:text-white transition-colors active:scale-90 p-1 hover:bg-white/10 rounded-full">
                    <Icon name={isMuted ? "VolumeX" : "Volume2"} size={14} />
                  </button>
                </div>
                
                {/* Progress Bar (Integrated) */}
                <div className="flex-1 relative h-1.5 group/slider hover:h-2 transition-all bg-white/20 cursor-pointer flex items-center rounded-full overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 h-full bg-primary pointer-events-none transition-all duration-200 ease-linear" style={{ width: `${Math.max(0, Math.min(100, (currentTime || 0) / (duration || video?.duration || 1) * 100))}%` }} />
                  <input type="range" min="0" max={duration || video?.duration || 100} value={currentTime || 0} onChange={handleSeekChange} onClick={(e) => e.stopPropagation()} className="w-full h-full absolute inset-0 appearance-none cursor-pointer bg-transparent z-10 outline-none m-0 p-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 group-hover/slider:[&::-webkit-slider-thumb]:w-3 group-hover/slider:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_5px_rgba(0,0,0,0.5)] [&::-webkit-slider-thumb]:transition-all" />
                </div>
                
                {/* Right Time */}
                <span className="text-[10px] font-bold text-white/90 tracking-widest font-mono drop-shadow-sm shrink-0">
                  {formatDuration(Math.floor(currentTime))} <span className="text-white/40 mx-0.5">/</span> {formatDuration(Math.floor(duration || video?.duration || 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Native video fallback when YouTube embed is restricted ── */}
        {nativeFallback && isHovered && (
          <div className="absolute inset-0 z-20 bg-black overflow-hidden">
            <video
              ref={nativeRef}
              autoPlay
              muted={isMuted}
              className="w-full h-full object-cover"
              src={`${import.meta.env.VITE_API_BASE_URL || ''}/api/stream?url=${encodeURIComponent(video?.url || '')}&quality=480p`}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.target.duration)}
            />
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
              <Icon name="HardDrive" size={9} />
              Fallback
            </div>
          </div>
        )}

        {!playVideo && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white font-medium text-[11px] px-1.5 py-0.5 rounded-md backdrop-blur-sm z-20 pointer-events-none tracking-wide shadow-sm">
            {formatDuration(video?.duration)}
          </div>
        )}

        {!playVideo && video?.quality && (
          <div className="absolute top-2 left-2 bg-primary/95 text-primary-foreground text-[10px] uppercase font-bold px-1.5 py-0.5 rounded backdrop-blur-sm z-20 pointer-events-none shadow-sm tracking-wider">
            {video?.quality}
          </div>
        )}

        {/* PIP Trigger Button - Restored to original size and position */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setPlayVideo(false);
            openPip(video);
          }}
          className={`absolute top-2 right-2 p-2 rounded-xl z-40 transition-all duration-300 shadow-lg active:scale-95 group/pip cursor-pointer flex items-center justify-center bg-black/70 hover:bg-primary text-white border border-white/20 hover:border-transparent backdrop-blur-md tooltip-trigger`}
          title="Play in Picture-in-Picture"
        >
          <Icon name="PictureInPicture2" size={18} className="opacity-100 group-hover/pip:scale-110 transition-transform" />
        </button>

        {isHovered && !videoReady && !embedError && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 bg-black/50 px-3 py-2 rounded-full backdrop-blur-sm pointer-events-none animate-fade-in shadow-lg border border-white/10">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
            <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
          </div>
        )}
      </div>

      {/* Content Section (Realigned to match YouTube Cards exactly) */}
      <div className="flex gap-3 pt-1 px-1 flex-col">
        <div className="flex gap-3 w-full">
          {/* Left Side: standalone Channel Avatar */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/search-results?q=${encodeURIComponent(video?.channel?.name || video?.uploader || '')}`);
            }}
            className="w-9 h-9 rounded-full overflow-hidden shrink-0 cursor-pointer border border-black/5 dark:border-white/10"
          >
            {video?.channel?.avatar && !avatarError ? (
              <img
                src={video?.channel?.avatar}
                alt={video?.channel?.name || video?.uploader || 'Avatar'}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
                loading="lazy"
              />
            ) : (
              (() => {
                const name = video?.channel?.name || video?.uploader || '?';
                let hash = 0;
                for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
                const hue = Math.abs(hash % 360);
                return (
                  <div className="w-full h-full flex items-center justify-center text-[12px] font-bold uppercase" style={{ backgroundColor: `hsl(${hue}, 70%, 85%)`, color: `hsl(${hue}, 80%, 30%)` }}>
                    {name[0]}
                  </div>
                );
              })()
            )}
          </div>

          {/* Right Side: Text details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-bold text-foreground/90 leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {video?.title}
              </h3>
              
              <div className="flex justify-between items-start mt-2">
                <div className="flex flex-col min-w-0 pr-2">
                  {/* Channel Name */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/search-results?q=${encodeURIComponent(video?.channel?.name || video?.uploader || '')}`);
                    }}
                    className="text-[13px] text-muted-foreground font-semibold hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="truncate">{video?.channel?.name || video?.uploader || ''}</span>
                    {video?.channel?.verified && <Icon name="CheckCircle" size={11} className="text-primary flex-shrink-0" />}
                  </div>

                  {/* Views • Upload Date */}
                  <div className="text-[13px] text-muted-foreground flex items-center gap-1 mt-0.5 flex-wrap">
                    {video?.views !== undefined && (
                      <span>{formatViews(video?.views)}</span>
                    )}
                    {video?.views !== undefined && video?.uploadedDate && (
                      <span className="text-muted-foreground/60">•</span>
                    )}
                    {video?.uploadedDate && (
                      <span className="truncate">{video.uploadedDate}</span>
                    )}
                  </div>
                </div>

                {/* Right Side Actions (Share/Save) */}
                <div className="flex shrink-0 gap-2.5 mt-1" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={handleToggleSave} 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md active:scale-95 shadow-sm ${isSaved ? 'bg-primary border-primary text-primary-foreground drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-foreground/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-primary'}`}
                    title={isSaved ? "Remove from Saved" : "Save to Favorites"}
                  >
                    <Icon name={isSaved ? "BookmarkCheck" : "Bookmark"} size={13} strokeWidth={isSaved ? 2.5 : 2} className={`${isSaved ? 'scale-110' : 'hover:scale-110'} transition-transform`} />
                  </button>

                  <button 
                    onClick={handleShare} 
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 shadow-sm active:scale-95 text-foreground/70 hover:text-primary"
                    title={t("homeSearchDashboard.share", "Share")}
                  >
                    <Icon name="Share2" size={13} className="hover:-rotate-12 transition-transform duration-300" />
                  </button>
                </div>
              </div>
              
              {video?.tags && video?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {video?.tags?.slice(0, 2)?.map((tag, index) => (
                    <span key={index} className="text-[9px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 transition-colors hover:bg-primary/20 cursor-pointer">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isShareModalOpen && (
        <div onClick={(e) => e.stopPropagation()} className="relative z-[260]">
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            url={video?.url || `https://www.youtube.com/watch?v=${video?.originalId || video?.id?.split('_')?.[0]}`}
            title={video?.title}
          />
        </div>
      )}
    </div>
  );
};

export default VideoCard;