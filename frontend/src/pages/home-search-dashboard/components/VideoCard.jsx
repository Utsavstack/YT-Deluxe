import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ShareModal from '../../../components/ui/ShareModal';
import { YTDeluxeStorage, STORAGE_KEYS } from '../../../utils/storage';

const VideoCard = ({ video, onQuickDownload, onPreview }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Custom Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const navigate = useNavigate();
  const iframeRef = React.useRef(null);

  // Check watch later status on mount
  useEffect(() => {
    const checkSaved = async () => {
      const list = await YTDeluxeStorage.getItem(STORAGE_KEYS.WATCH_LATER, []);
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
      timer = setTimeout(() => {
        setPlayVideo(true);
      }, 600);
    } else {
      setPlayVideo(false);
      setVideoReady(false);
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
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
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

  const handleWatchLater = async (e) => {
    e?.stopPropagation();
    const list = await YTDeluxeStorage.getItem(STORAGE_KEYS.WATCH_LATER, []);
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
    
    await YTDeluxeStorage.setItem(STORAGE_KEYS.WATCH_LATER, newList);
    setIsSaved(added);
    setShowSavedToast(added ? 'saved' : 'removed');
  };

  const handleShare = async (e) => {
    e?.stopPropagation();
    setIsShareModalOpen(true);
  };

  return (
    <div
      className="glass-card shadow-glass-md hover:shadow-glass-lg transition-all duration-300 spring-smooth cursor-pointer group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {showSavedToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-spring-up" style={{ animationDuration: '0.4s' }}>
          <div className="bg-background/95 backdrop-blur-xl border border-border/50 px-4 py-2.5 rounded-full shadow-glass-xl flex items-center space-x-2 w-max">
            <div className={`p-1 rounded-full ${showSavedToast === 'saved' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
              <Icon name={showSavedToast === 'saved' ? 'Check' : 'Trash2'} size={14} />
            </div>
            <span className="text-sm font-medium text-foreground">
              {showSavedToast === 'saved' ? 'Added to Watch Later' : 'Removed from Watch Later'}
            </span>
          </div>
        </div>
      )}

      {/* Thumbnail Section */}
      <div className="relative overflow-hidden rounded-t-xl bg-black group-hover:bg-slate-900 border-b border-white/5">
        <Image
          src={video?.thumbnail}
          alt={video?.title}
          className={`w-full h-52 object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
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
              className="w-[125%] h-[125%] absolute top-[-12.5%] left-[-12.5%] object-cover opacity-100 pointer-events-none"
            />
            <div className="absolute top-0 left-0 w-full h-[85%] cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); handleCardClick(); }} />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-white px-3 pb-3 relative z-30">
                <button onClick={togglePlayState} className="p-1 hover:text-primary transition-colors focus:outline-none drop-shadow-md flex items-center justify-center">
                  <Icon name={isPlaying ? "Pause" : "Play"} size={20} fill={isPlaying ? "none" : "currentColor"} className={isPlaying ? "" : "ml-0.5"} />
                </button>
                <div className="flex items-center space-x-4">
                  <span className="text-[11px] select-none font-medium text-white/90 font-mono text-right drop-shadow-md pb-[1px]">
                    {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration || video?.duration || 0))}
                  </span>
                  <button onClick={toggleMuteState} className="hover:text-primary transition-colors focus:outline-none drop-shadow-md pb-[1px]">
                    <Icon name={isMuted ? "VolumeX" : "Volume2"} size={18} />
                  </button>
                </div>
              </div>
              <div className="w-full relative h-[4px] group/slider hover:h-[6px] transition-all bg-white/30 cursor-pointer flex items-center">
                <div className="absolute top-0 left-0 h-full bg-primary pointer-events-none transition-all duration-200 ease-linear" style={{ width: `${(currentTime || 0) / (duration || video?.duration || 1) * 100}%` }} />
                <input type="range" min="0" max={duration || video?.duration || 100} value={currentTime || 0} onChange={handleSeekChange} onClick={(e) => e.stopPropagation()} className="w-full h-full absolute inset-0 appearance-none cursor-pointer bg-transparent z-10 outline-none m-0 p-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_2px_rgba(0,0,0,0.3)] group-hover/slider:[&::-webkit-slider-thumb]:w-3.5 group-hover/slider:[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:transition-all" />
              </div>
            </div>
          </div>
        )}

        {isHovered && embedError && (
          <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center animate-fade-in pointer-events-none">
            <div className="bg-white/20 p-3 rounded-full mb-2 shadow-lg backdrop-blur-md border border-white/10">
              <Icon name="EyeOff" size={20} className="text-white opacity-90" />
            </div>
            <p className="text-white text-sm font-semibold px-4 text-center tracking-wide">{t("homeSearchDashboard.previewRestricted")}</p>
            <p className="text-white/80 text-xs mt-0.5">{t("homeSearchDashboard.clickToOpenView")}</p>
          </div>
        )}

        {!playVideo && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-20 pointer-events-none">
            {formatDuration(video?.duration)}
          </div>
        )}

        {!playVideo && video?.quality && (
          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded backdrop-blur-sm font-medium z-20 pointer-events-none shadow-sm">
            {video?.quality}
          </div>
        )}

        {isHovered && !videoReady && !embedError && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 bg-black/60 px-3 py-2 rounded-full backdrop-blur-sm pointer-events-none animate-fade-in shadow-lg border border-white/10">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
            <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
          {video?.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden mr-2">
            {video?.channel?.avatar ? (
              <Image src={video?.channel?.avatar} alt={video?.channel?.name || video?.uploader || 'Avatar'} className="w-6 h-6 rounded-full flex-shrink-0" />
            ) : (
              (() => {
                const name = video?.channel?.name || video?.uploader || '?';
                let hash = 0;
                for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
                const hue = Math.abs(hash % 360);
                return (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0" style={{ backgroundColor: `hsl(${hue}, 70%, 85%)`, color: `hsl(${hue}, 80%, 30%)` }}>
                    {name[0]}
                  </div>
                );
              })()
            )}
            <span className="text-xs text-muted-foreground font-medium truncate flex-1">{video?.channel?.name || video?.uploader || ''}</span>
            {video?.channel?.verified && <Icon name="CheckCircle" size={12} className="text-primary flex-shrink-0" />}
          </div>
          {video?.views !== undefined && <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{formatViews(video?.views)}</span>}
        </div>
        {video?.tags && video?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {video?.tags?.slice(0, 3)?.map((tag, index) => (
              <span key={index} className="text-[10px] bg-accent/30 text-accent-foreground px-2 py-0.5 rounded-full border border-border/50">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-border/20 pt-3">
        <Button
          variant="ghost"
          className="h-7 text-xs px-2 rounded-md font-medium text-muted-foreground hover:text-foreground"
          onClick={(e) => { e?.stopPropagation(); onQuickDownload?.(video, 'jpg'); }}
        >
          <Icon name="Image" size={14} className="mr-2" /> {t("homeSearchDashboard.downloadThumbnail")}
        </Button>
        <div className="flex items-center space-x-0.5 -mr-2">
          <button onClick={handleWatchLater} className={`p-1.5 rounded-full transition-all group/btn ${isSaved ? 'text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}>
            <Icon name="Clock" size={15} strokeWidth={isSaved ? 2.5 : 2} className={`transition-all duration-300 ${isSaved ? 'text-primary drop-shadow-[0_0_5px_rgba(44,93,169,0.5)] scale-110' : ''}`} />
          </button>
          <button onClick={handleShare} className="p-1.5 rounded-full transition-all hover:bg-accent/50 text-muted-foreground hover:text-foreground">
            <Icon name="Share2" size={15} />
          </button>
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