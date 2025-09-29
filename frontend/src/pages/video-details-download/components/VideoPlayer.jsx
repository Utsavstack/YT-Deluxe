import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoPlayer = ({ videoData, onQualityChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [showCaptions, setShowCaptions] = useState(false);
  
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

    video?.addEventListener('timeupdate', updateTime);
    video?.addEventListener('loadedmetadata', updateDuration);
    video?.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      video?.removeEventListener('timeupdate', updateTime);
      video?.removeEventListener('loadedmetadata', updateDuration);
      video?.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef?.current;
    if (isPlaying) {
      video?.pause();
    } else {
      video?.play();
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
    videoRef.current.volume = newVolume;
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
    setSelectedQuality(quality);
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
      >
        <source src={videoData?.videoUrl} type="video/mp4" />
        {showCaptions && (
          <track kind="captions" src={videoData?.captionsUrl} srcLang="en" label="English" />
        )}
      </video>
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
      {/* Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
              onClick={() => window.history?.back()}
            >
              <Icon name="ArrowLeft" size={20} color="white" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quality Selector */}
            <div className="relative group/quality">
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white text-xs"
              >
                {selectedQuality}
                <Icon name="ChevronDown" size={14} className="ml-1" />
              </Button>
              <div className="absolute top-full right-0 mt-1 bg-black/80 backdrop-blur-sm rounded-lg py-1 opacity-0 invisible group-hover/quality:opacity-100 group-hover/quality:visible transition-all z-10">
                {qualities?.map((quality) => (
                  <button
                    key={quality?.value}
                    onClick={() => handleQualityChange(quality?.value)}
                    className={`block w-full px-3 py-1 text-xs text-left hover:bg-white/20 transition-colors ${
                      selectedQuality === quality?.value ? 'text-primary' : 'text-white'
                    }`}
                  >
                    {quality?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Captions Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`w-10 h-10 rounded-full backdrop-blur-sm hover:bg-black/60 ${
                showCaptions ? 'bg-primary' : 'bg-black/40'
              }`}
              onClick={() => setShowCaptions(!showCaptions)}
            >
              <Icon name="Captions" size={16} color="white" />
            </Button>
          </div>
        </div>

        {/* Center Controls */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
              onClick={() => skipTime(-10)}
            >
              <Icon name="RotateCcw" size={20} color="white" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
              onClick={togglePlay}
            >
              <Icon name={isPlaying ? "Pause" : "Play"} size={24} color="white" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
              onClick={() => skipTime(10)}
            >
              <Icon name="RotateCw" size={20} color="white" />
            </Button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-4 right-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer group/progress"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-primary rounded-full relative group-hover/progress:h-1.5 transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Time Display */}
              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Volume Control */}
              <div className="flex items-center space-x-2 group/volume">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-transparent hover:bg-white/20"
                  onClick={toggleMute}
                >
                  <Icon 
                    name={isMuted ? "VolumeX" : volume > 0.5 ? "Volume2" : "Volume1"} 
                    size={16} 
                    color="white" 
                  />
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer opacity-0 group-hover/volume:opacity-100 transition-opacity"
                />
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
                      className={`block w-full px-3 py-1 text-xs text-left hover:bg-white/20 transition-colors ${
                        playbackSpeed === speed ? 'text-primary' : 'text-white'
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
    </div>
  );
};

export default VideoPlayer;