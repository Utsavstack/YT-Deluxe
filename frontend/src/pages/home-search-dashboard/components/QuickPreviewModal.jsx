import { useTranslation } from "react-i18next";import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ShareModal from '../../../components/ui/ShareModal';
import { formatDate } from '../../../utils/dateFormat';

const QuickPreviewModal = ({ video, isOpen, onClose, onDownload }) => {const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && videoRef?.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [isOpen, video]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes?.toString()?.padStart(2, '0')}:${secs?.toString()?.padStart(2, '0')}`;
    }
    return `${minutes}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef?.current) {
      if (isPlaying) {
        videoRef?.current?.pause();
      } else {
        videoRef?.current?.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef?.current) {
      setCurrentTime(videoRef?.current?.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef?.current) {
      setDuration(videoRef?.current?.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e?.currentTarget?.getBoundingClientRect();
    const pos = (e?.clientX - rect?.left) / rect?.width;
    const time = pos * duration;

    if (videoRef?.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e?.target?.value);
    setVolume(newVolume);
    if (videoRef?.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef?.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const changePlaybackSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef?.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef?.current) {
      clearTimeout(controlsTimeoutRef?.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
   <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
   <div className="relative w-full max-w-4xl glass-card shadow-glass-2xl animate-slide-up">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-border/50">
     <div className="flex items-center space-x-3">
      <Image
              src={video?.channel?.avatar}
              alt={video?.channel?.name}
              className="w-8 h-8 rounded-full" />
            
      <div>
       <h3 className="font-semibold text-foreground line-clamp-1">{video?.title}</h3>
       <p className="text-sm text-muted-foreground">{video?.channel?.name}</p>
      </div>
     </div>
     
     <div className="flex items-center space-x-2">
      <Button
              variant="default"
              size="sm"
              onClick={() => onDownload(video)}
              iconName="Download"
              iconPosition="left"> {t("homeSearchDashboard.download")} 


            </Button>
      <Button
              variant="ghost"
              size="icon"
              onClick={onClose}>
              
       <Icon name="X" size={20} />
      </Button>
     </div>
    </div>

    {/* Video Player */}
    <div
          className="relative bg-black aspect-video"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}>
          
     {/* Mock Video Player - In real app, this would be actual video */}
     <div className="absolute inset-0 flex items-center justify-center">
      <Image
              src={video?.thumbnail}
              alt={video?.title}
              className="w-full h-full object-cover" />
            
      <div className="absolute inset-0 bg-black/20" />
     </div>

     {/* Play Button Overlay */}
     <div className="absolute inset-0 flex items-center justify-center">
      <Button
              variant="secondary"
              size="lg"
              onClick={togglePlay}
              className="w-16 h-16 rounded-full glass-card shadow-glass-lg">
              
       <Icon name={isPlaying ? "Pause" : "Play"} size={24} />
      </Button>
     </div>

     {/* Video Controls */}
     <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
      {/* Progress Bar */}
      <div className="mb-4">
       <div
                className="w-full h-1 bg-white/30 rounded-full cursor-pointer"
                onClick={handleSeek}>
                
        <div
                  className="h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${currentTime / duration * 100}%` }} />
                
       </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
       <div className="flex items-center space-x-3">
        <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20">
                  
         <Icon name={isPlaying ? "Pause" : "Play"} size={20} />
        </Button>
        
        <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20">
                  
         <Icon name={isMuted ? "VolumeX" : "Volume2"} size={20} />
        </Button>
        
        <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-full appearance-none slider" />
                
        
        <span className="text-white text-sm">
         {formatTime(currentTime)} / {formatTime(duration)}
        </span>
       </div>

       <div className="flex items-center space-x-2">
        {/* Playback Speed */}
        <select
                  value={playbackSpeed}
                  onChange={(e) => changePlaybackSpeed(parseFloat(e?.target?.value))}
                  className="bg-white/20 text-white text-sm rounded px-2 py-1 border-none outline-none">
                  
         <option value={0.5}>{t("homeSearchDashboard.x")}</option>
         <option value={0.75}>{t("homeSearchDashboard.x1")}</option>
         <option value={1}>{t("homeSearchDashboard.x2")}</option>
         <option value={1.25}>{t("homeSearchDashboard.x3")}</option>
         <option value={1.5}>{t("homeSearchDashboard.x4")}</option>
         <option value={2}>{t("homeSearchDashboard.x5")}</option>
        </select>
        
        <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    // Toggle fullscreen
                    console.log('Toggle fullscreen');
                  }}>
                  
         <Icon name="Maximize" size={20} />
        </Button>
       </div>
      </div>
     </div>
    </div>

    {/* Video Info */}
    <div className="p-4 space-y-3">
     <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div className="flex items-center space-x-4">
       <span>{video?.views?.toLocaleString()} {t("homeSearchDashboard.views")}</span>
       <span>•</span>
       <span>{formatDate(video.uploadDate)}</span>
      </div>
      
      <div className="flex items-center space-x-2">
       <Button variant="ghost" size="sm" iconName="ThumbsUp" iconPosition="left">
        {video?.likes?.toLocaleString()}
       </Button>
       <Button variant="ghost" size="sm" iconName="Share2" iconPosition="left" onClick={() => setIsShareModalOpen(true)}> {t("homeSearchDashboard.share")} 

              </Button>
      </div>
     </div>
     
     {video?.description &&
          <p className="text-sm text-muted-foreground line-clamp-3">
       {video?.description}
      </p>
          }
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
  </div>);

};

export default QuickPreviewModal;