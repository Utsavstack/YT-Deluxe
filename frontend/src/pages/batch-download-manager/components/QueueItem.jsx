import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Image from '../../../components/AppImage';

const QueueItem = ({ 
  item, 
  onRemove, 
  onQualityChange, 
  onMoveUp, 
  onMoveDown, 
  canMoveUp, 
  canMoveDown,
  isSelected,
  onSelect 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const qualityOptions = [
    { value: '1080p', label: '1080p HD (MP4)', description: '~150MB' },
    { value: '720p', label: '720p HD (MP4)', description: '~80MB' },
    { value: '480p', label: '480p SD (MP4)', description: '~45MB' },
    { value: '360p', label: '360p (MP4)', description: '~25MB' },
    { value: '144p', label: '144p (MP4)', description: '~10MB' },
    { value: 'audio', label: 'Audio Only (MP3)', description: '~5MB' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'downloading': return 'text-primary';
      case 'error': return 'text-error';
      case 'paused': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'CheckCircle';
      case 'downloading': return 'Download';
      case 'error': return 'AlertCircle';
      case 'paused': return 'Pause';
      default: return 'Clock';
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  return (
    <div className="glass-card hover:shadow-glass-lg transition-all duration-200">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Checkbox */}
            <div className="flex items-center pt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(item?.id, e?.target?.checked)}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>

            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={item?.thumbnail}
                  alt={item?.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                  {formatDuration(item?.duration)}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                {item?.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {item?.channel} • {item?.views} views
              </p>
              
              <div className="flex items-center space-x-2 mb-2">
                <Icon 
                  name={getStatusIcon(item?.status)} 
                  size={14} 
                  className={getStatusColor(item?.status)} 
                />
                <span className={`text-xs font-medium ${getStatusColor(item?.status)}`}>
                  {item?.status === 'downloading' ? `${item?.progress}%` : item?.status}
                </span>
              </div>

              {item?.status === 'downloading' && (
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="h-1.5 bg-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${item?.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {item?.progress?.toFixed(1)}%
                      {item?.downloaded_bytes && item?.total_bytes ? 
                        ` (${(item?.downloaded_bytes / (1024 * 1024))?.toFixed(1)}/${(item?.total_bytes / (1024 * 1024))?.toFixed(1)} MB)` : 
                        ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item?.timeRemaining ? 
                        `${Math.ceil(item?.timeRemaining / 60)} min left` : 
                        `~${Math.ceil((100 - item?.progress) / 20)} min left`}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {item?.quality} • {item?.fileSize}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Icon 
                    name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                    size={14} 
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Expanded Controls */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <Select
                label="Quality"
                options={qualityOptions}
                value={item?.quality}
                onChange={(value) => onQualityChange(item?.id, value)}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveUp(item?.id)}
                    disabled={!canMoveUp}
                    iconName="ArrowUp"
                  >
                    Up
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveDown(item?.id)}
                    disabled={!canMoveDown}
                    iconName="ArrowDown"
                  >
                    Down
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemove(item?.id)}
                  iconName="Trash2"
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(item?.id, e?.target?.checked)}
              className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
            />

            {/* Drag Handle */}
            <div className="cursor-move text-muted-foreground hover:text-foreground">
              <Icon name="GripVertical" size={16} />
            </div>

            {/* Thumbnail */}
            <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={item?.thumbnail}
                alt={item?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                {formatDuration(item?.duration)}
              </div>
            </div>

            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground line-clamp-1 mb-1">
                {item?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item?.channel} • {item?.views} views
              </p>
            </div>

            {/* Quality Selector */}
            <div className="w-48">
              <Select
                options={qualityOptions}
                value={item?.quality}
                onChange={(value) => onQualityChange(item?.id, value)}
                placeholder="Select quality"
              />
            </div>

            {/* File Size */}
            <div className="w-20 text-sm text-muted-foreground text-center">
              {item?.fileSize}
            </div>

            {/* Status & Progress */}
            <div className="w-32">
              <div className="flex items-center space-x-2 mb-1">
                <Icon 
                  name={getStatusIcon(item?.status)} 
                  size={14} 
                  className={getStatusColor(item?.status)} 
                />
                <span className={`text-sm font-medium ${getStatusColor(item?.status)}`}>
                  {item?.status === 'downloading' ? `${item?.progress}%` : item?.status}
                </span>
              </div>
              {item?.status === 'downloading' && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item?.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveUp(item?.id)}
                disabled={!canMoveUp}
                className="w-8 h-8"
              >
                <Icon name="ArrowUp" size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveDown(item?.id)}
                disabled={!canMoveDown}
                className="w-8 h-8"
              >
                <Icon name="ArrowDown" size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item?.id)}
                className="w-8 h-8 text-destructive hover:text-destructive"
              >
                <Icon name="Trash2" size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueItem;