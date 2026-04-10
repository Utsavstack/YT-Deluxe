import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoPlayer = ({ videoData, onQualityChange }) => {
 const navigate = useNavigate();
 const [isPlaying, setIsPlaying] = useState(false);
 const [hasStarted, setHasStarted] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [volume, setVolume] = useState(1);
 const [isMuted, setIsMuted] = useState(false);
 const [playbackSpeed, setPlaybackSpeed] = useState(1);
 const [showControls, setShowControls] = useState(true);
 const [isFullscreen, setIsFullscreen] = useState(false);
 const [isBuffering, setIsBuffering] = useState(false);

 const videoRef = useRef(null);
 const containerRef = useRef(null);
 const controlsTimeoutRef = useRef(null);

 const qualities = [
  { label: '1080p', value: '1080p' },
  { label: '720p', value: '720p' },
  { label: '480p', value: '480p' },
  { label: '360p', value: '360p' },
  { label: '144p', value: '144p' }
 ];

 const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

 useEffect(() => {
  const video = videoRef?.current;
  if (!video) return;

  const updateTime = () => setCurrentTime(video?.currentTime);
  const updateDuration = () => setDuration(video?.duration);
  const handleWaiting = () => setIsBuffering(true);
  const handlePlaying = () => setIsBuffering(false);
  const handleSeeking = () => setIsBuffering(true);
  const handleSeeked = () => setIsBuffering(false);

  video?.addEventListener('timeupdate', updateTime);
  video?.addEventListener('loadedmetadata', updateDuration);
  video?.addEventListener('ended', () => setIsPlaying(false));
  video?.addEventListener('waiting', handleWaiting);
  video?.addEventListener('playing', handlePlaying);
  video?.addEventListener('seeking', handleSeeking);
  video?.addEventListener('seeked', handleSeeked);

  return () => {
   video?.removeEventListener('timeupdate', updateTime);
   video?.removeEventListener('loadedmetadata', updateDuration);
   video?.removeEventListener('ended', () => setIsPlaying(false));
   video?.removeEventListener('waiting', handleWaiting);
   video?.removeEventListener('playing', handlePlaying);
   video?.removeEventListener('seeking', handleSeeking);
   video?.removeEventListener('seeked', handleSeeked);
  };
 }, []);

 useEffect(() => {
  const handleKeyDown = (e) => {
   // Ignore if typing in an input or textarea
   if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

   if (e.code === 'Space') {
    e.preventDefault();
    const video = videoRef?.current;
    if (video) {
     if (video.paused) {
      video.play();
      setHasStarted(true);
      setIsPlaying(true);
     } else {
      video.pause();
      setIsPlaying(false);
     }
    }
   } else if (e.code === 'KeyF' || e.key?.toLowerCase() === 'f') {
    e.preventDefault();
    const container = containerRef?.current;
    if (!document.fullscreenElement) {
     container?.requestFullscreen();
     setIsFullscreen(true);
    } else {
     if (document.exitFullscreen) document.exitFullscreen();
     setIsFullscreen(false);
    }
   }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 const togglePlay = () => {
  const video = videoRef?.current;
  if (isPlaying) {
   video?.pause();
  } else {
   video?.play();
   if (!hasStarted) setHasStarted(true);
  }
  setIsPlaying(!isPlaying);
 };

 const handleSeek = (e) => {
  const video = videoRef?.current;
  const rect = e?.currentTarget?.getBoundingClientRect();
  const pos = (e?.clientX - rect?.left) / rect?.width;
  video.currentTime = pos * duration;
 };

 const handleVolumeChange = (e) => {
  const newVolume = parseFloat(e?.target?.value);
  setVolume(newVolume);
  if (videoRef.current) {
   videoRef.current.volume = newVolume;
   videoRef.current.muted = newVolume === 0;
  }
  setIsMuted(newVolume === 0);
 };

 const toggleMute = () => {
  const video = videoRef?.current;
  if (isMuted) {
   video.volume = volume;
   setIsMuted(false);
  } else {
   video.volume = 0;
   setIsMuted(true);
  }
 };

 const changePlaybackSpeed = (speed) => {
  videoRef.current.playbackRate = speed;
  setPlaybackSpeed(speed);
 };

 const skipTime = (seconds) => {
  const video = videoRef?.current;
  video.currentTime = Math.max(0, Math.min(duration, video?.currentTime + seconds));
 };

 const toggleFullscreen = () => {
  const container = containerRef?.current;
  if (!document.fullscreenElement) {
   container?.requestFullscreen();
   setIsFullscreen(true);
  } else {
   document.exitFullscreen();
   setIsFullscreen(false);
  }
 };

 const handleQualityChange = (quality) => {
  onQualityChange?.(quality);
 };

 const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds?.toString()?.padStart(2, '0')}`;
 };

 const showControlsTemporarily = () => {
  setShowControls(true);
  clearTimeout(controlsTimeoutRef?.current);
  controlsTimeoutRef.current = setTimeout(() => {
   if (isPlaying) setShowControls(false);
  }, 3000);
 };

 return (
  <div
   ref={containerRef}
   className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group"
   onMouseMove={showControlsTemporarily}
   onMouseLeave={() => isPlaying && setShowControls(false)}
  >
   {/* Video Element */}
   <video
    ref={videoRef}
    className="w-full h-full object-cover"
    poster={videoData?.thumbnail}
    onClick={togglePlay}
    src={videoData?.videoUrl}
   />
   {/* Play/Pause Overlay */}
   {!isPlaying && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
     <Button
      variant="ghost"
      size="icon"
      className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
      onClick={togglePlay}
     >
      <Icon name="Play" size={32} color="white" />
     </Button>
    </div>
   )}

   {/* Buffering Spinner - Always visible regardless of controls */}
   {isBuffering && (
     <div className="absolute inset-0 flex items-center justify-center z-[45] pointer-events-none">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
     </div>
   )}

   {/* Controls Overlay */}
   {hasStarted && (
    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
     {/* Top Controls - Only show back arrow in fullscreen */}
     {isFullscreen && (
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
       <div className="flex items-center space-x-2">
        <Button
         variant="ghost"
         size="icon"
         className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 shadow-glass-sm pointer-events-auto"
         onClick={(e) => {
          e.stopPropagation();
          if (document.exitFullscreen) document.exitFullscreen();
          setIsFullscreen(false);
         }}
        >
         <Icon name="ArrowLeft" size={20} color="white" />
        </Button>
       </div>
      </div>
     )}

     {/* Center Controls - Hide when buffering */}
     {!isBuffering && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
       <div className="flex items-center space-x-6 pointer-events-auto">
        <Button
         variant="ghost"
         size="icon"
         className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center relative transition-all active:scale-90"
         onClick={() => skipTime(-10)}
        >
         <Icon name="RotateCcw" size={24} color="white" />
         <span className="text-white font-bold absolute text-[10px] mt-0.5">10</span>
        </Button>

        <Button
         variant="ghost"
         size="icon"
         className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all active:scale-90"
         onClick={togglePlay}
        >
         <Icon name={isPlaying ? "Pause" : "Play"} size={24} color="white" />
        </Button>

        <Button
         variant="ghost"
         size="icon"
         className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center relative transition-all active:scale-90"
         onClick={() => skipTime(10)}
        >
         <Icon name="RotateCw" size={24} color="white" />
         <span className="text-white font-bold absolute text-[10px] mt-0.5">10</span>
        </Button>
       </div>
      </div>
     )}

     {/* Bottom Controls */}
     <div className="absolute bottom-4 left-4 right-4">
      {/* Progress Bar - Sync with VideoCard style */}
      <div className="mb-4 relative h-[6px] group/slider hover:h-[8px] transition-all bg-white/20 rounded-full cursor-pointer flex items-center">
       {/* Fill indicator */}
       <div 
        className="absolute top-0 left-0 h-full bg-primary pointer-events-none transition-all duration-150 ease-linear shadow-[0_0_10px_rgba(var(--primary),0.8)] rounded-full" 
        style={{ width: `${duration ? (currentTime / duration) * 101 : 0}%` }} 
       />
       
       {/* Transparent native range slider for interaction */}
       <input 
        type="range" 
        min="0" 
        max={duration || 100} 
        step="0.1"
        value={currentTime || 0} 
        onChange={(e) => {
         const video = videoRef.current;
         if (video) video.currentTime = parseFloat(e.target.value);
        }}
        className="w-full h-full absolute inset-0 appearance-none cursor-pointer bg-transparent z-10 outline-none m-0 p-0
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_2px_rgba(0,0,0,0.3)] group-hover/slider:[&::-webkit-slider-thumb]:w-3.5 group-hover/slider:[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:transition-all
        [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-[0_0_10px_2px_rgba(0,0,0,0.3)] group-hover/slider:[&::-moz-range-thumb]:w-3.5 group-hover/slider:[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:transition-all"
       />
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between">
       <div className="flex items-center space-x-4">
        {/* Time Display */}
        <span className="text-white text-sm font-mono">
         {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Volume Control */}
        <div className="flex items-center space-x-3 group/volume">
         <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full bg-transparent hover:bg-white/20 transition-all"
          onClick={toggleMute}
         >
          <Icon
           name={isMuted ? "VolumeX" : volume > 0.5 ? "Volume2" : "Volume1"}
           size={18}
           color="white"
          />
         </Button>
         <div className="w-24 relative h-[4.5px] bg-white/20 rounded-full flex items-center overflow-visible">
           {/* Color fill */}
           <div 
             className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-75"
             style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
           />
           <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-full absolute inset-0 appearance-none cursor-pointer bg-transparent z-10 outline-none m-0 p-0
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all group-hover/volume:[&::-webkit-slider-thumb]:scale-125
            [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all group-hover/volume:[&::-moz-range-thumb]:scale-125"
           />
         </div>
        </div>

        {/* Speed Control */}
        <div className="relative group/speed">
         <Button
          variant="ghost"
          size="sm"
          className="bg-transparent hover:bg-white/20 text-white text-xs"
         >
          {playbackSpeed}x
         </Button>
         <div className="absolute bottom-full left-0 mb-1 bg-black/80 backdrop-blur-sm rounded-lg py-1 opacity-0 invisible group-hover/speed:opacity-100 group-hover/speed:visible transition-all z-10">
          {playbackSpeeds?.map((speed) => (
           <button
            key={speed}
            onClick={() => changePlaybackSpeed(speed)}
            className={`block w-full px-3 py-1 text-xs text-left hover:bg-white/20 transition-colors ${playbackSpeed === speed ? 'text-primary' : 'text-white'
             }`}
           >
            {speed}x
           </button>
          ))}
         </div>
        </div>
       </div>

       <div className="flex items-center space-x-2">
        <Button
         variant="ghost"
         size="icon"
         className="w-8 h-8 rounded-full bg-transparent hover:bg-white/20"
         onClick={toggleFullscreen}
        >
         <Icon name={isFullscreen ? "Minimize" : "Maximize"} size={16} color="white" />
        </Button>
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default VideoPlayer;