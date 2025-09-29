import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoTrimmer = ({ videoData, onTrimChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(videoData?.duration);
  const [isDragging, setIsDragging] = useState(null);
  const [previewTime, setPreviewTime] = useState(0);
  const timelineRef = useRef(null);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes?.toString()?.padStart(2, '0')}:${secs?.toString()?.padStart(2, '0')}`;
    }
    return `${minutes}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef?.current || isDragging) return;
    
    const rect = timelineRef?.current?.getBoundingClientRect();
    const clickX = e?.clientX - rect?.left;
    const percentage = clickX / rect?.width;
    const newTime = percentage * videoData?.duration;
    
    setPreviewTime(Math.max(0, Math.min(videoData?.duration, newTime)));
  };

  const handleDragStart = (type, e) => {
    setIsDragging(type);
    e?.preventDefault();
  };

  const handleDragMove = (e) => {
    if (!isDragging || !timelineRef?.current) return;
    
    const rect = timelineRef?.current?.getBoundingClientRect();
    const dragX = e?.clientX - rect?.left;
    const percentage = Math.max(0, Math.min(1, dragX / rect?.width));
    const newTime = percentage * videoData?.duration;
    
    if (isDragging === 'start') {
      const newStartTime = Math.max(0, Math.min(endTime - 1, newTime));
      setStartTime(newStartTime);
      onTrimChange?.(newStartTime, endTime);
    } else if (isDragging === 'end') {
      const newEndTime = Math.max(startTime + 1, Math.min(videoData?.duration, newTime));
      setEndTime(newEndTime);
      onTrimChange?.(startTime, newEndTime);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, startTime, endTime]);

  const handleTimeInput = (type, value) => {
    const timeInSeconds = parseFloat(value) || 0;
    
    if (type === 'start') {
      const newStartTime = Math.max(0, Math.min(endTime - 1, timeInSeconds));
      setStartTime(newStartTime);
      onTrimChange?.(newStartTime, endTime);
    } else {
      const newEndTime = Math.max(startTime + 1, Math.min(videoData?.duration, timeInSeconds));
      setEndTime(newEndTime);
      onTrimChange?.(startTime, newEndTime);
    }
  };

  const resetTrim = () => {
    setStartTime(0);
    setEndTime(videoData?.duration);
    onTrimChange?.(0, videoData?.duration);
  };

  const getTrimmedDuration = () => {
    return endTime - startTime;
  };

  const getEstimatedSize = () => {
    const originalSize = 45.2; // MB - mock original size
    const trimRatio = getTrimmedDuration() / videoData?.duration;
    return (originalSize * trimRatio)?.toFixed(1);
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
        iconPosition="right"
        className="w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          <Icon name="Scissors" size={16} />
          <span>Video Trimmer</span>
        </div>
      </Button>
      {isExpanded && (
        <div className="glass-card p-6 space-y-6 animate-slide-down">
          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Select Trim Range</h4>
            
            <div className="relative">
              {/* Timeline Track */}
              <div
                ref={timelineRef}
                className="relative h-12 bg-muted rounded-lg cursor-pointer select-none"
                onClick={handleTimelineClick}
              >
                {/* Progress Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg" />
                
                {/* Selected Range */}
                <div
                  className="absolute top-0 bottom-0 bg-primary/60 rounded-lg"
                  style={{
                    left: `${(startTime / videoData?.duration) * 100}%`,
                    width: `${((endTime - startTime) / videoData?.duration) * 100}%`
                  }}
                />
                
                {/* Start Handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-primary rounded cursor-ew-resize shadow-glass-md hover:scale-110 transition-transform"
                  style={{ left: `${(startTime / videoData?.duration) * 100}%` }}
                  onMouseDown={(e) => handleDragStart('start', e)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-4 bg-white rounded-full" />
                  </div>
                </div>
                
                {/* End Handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-primary rounded cursor-ew-resize shadow-glass-md hover:scale-110 transition-transform"
                  style={{ left: `${(endTime / videoData?.duration) * 100}%` }}
                  onMouseDown={(e) => handleDragStart('end', e)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-4 bg-white rounded-full" />
                  </div>
                </div>
                
                {/* Preview Indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-warning pointer-events-none"
                  style={{ left: `${(previewTime / videoData?.duration) * 100}%` }}
                />
              </div>
              
              {/* Time Markers */}
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0:00</span>
                <span>{formatTime(videoData?.duration)}</span>
              </div>
            </div>
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Time</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max={endTime - 1}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => handleTimeInput('start', e?.target?.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <span className="text-sm text-muted-foreground">seconds</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatTime(startTime)}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">End Time</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={startTime + 1}
                  max={videoData?.duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => handleTimeInput('end', e?.target?.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <span className="text-sm text-muted-foreground">seconds</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatTime(endTime)}</p>
            </div>
          </div>

          {/* Trim Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-accent/20 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Trimmed Duration</p>
              <p className="text-lg font-semibold text-foreground">{formatTime(getTrimmedDuration())}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Estimated Size</p>
              <p className="text-lg font-semibold text-foreground">{getEstimatedSize()} MB</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Size Reduction</p>
              <p className="text-lg font-semibold text-success">
                {((1 - getTrimmedDuration() / videoData?.duration) * 100)?.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-3">
            <h5 className="font-medium text-foreground">Quick Presets</h5>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartTime(0);
                  setEndTime(30);
                  onTrimChange?.(0, 30);
                }}
              >
                First 30s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartTime(0);
                  setEndTime(60);
                  onTrimChange?.(0, 60);
                }}
              >
                First 1min
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const start = Math.max(0, videoData?.duration - 30);
                  setStartTime(start);
                  setEndTime(videoData?.duration);
                  onTrimChange?.(start, videoData?.duration);
                }}
              >
                Last 30s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetTrim}
              >
                Full Video
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="default"
              size="lg"
              fullWidth
              iconName="Download"
              iconPosition="left"
              onClick={() => {
                // Handle trimmed download
                console.log('Download trimmed video:', { startTime, endTime });
              }}
            >
              Download Trimmed ({formatTime(getTrimmedDuration())})
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={resetTrim}
              iconName="RotateCcw"
              iconPosition="left"
            >
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTrimmer;