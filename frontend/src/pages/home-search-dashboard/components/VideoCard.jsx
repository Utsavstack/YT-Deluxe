import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const VideoCard = ({ video, onQuickDownload, onPreview }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes?.toString()?.padStart(2, '0')}:${secs?.toString()?.padStart(2, '0')}`;
    }
    return `${minutes}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000)?.toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000)?.toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatUploadTime = (uploadDate) => {
    const now = new Date();
    const uploaded = new Date(uploadDate);
    const diffTime = Math.abs(now - uploaded);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleCardClick = () => {
    navigate('/video-details-download', {
      state: { video }
    });
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

  const handlePreview = (e) => {
    e?.stopPropagation();
    onPreview(video);
  };

  return (
    <div
      className="glass-card shadow-glass-md hover:shadow-glass-lg transition-all duration-300 spring-smooth cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Thumbnail Section */}
      <div className="relative overflow-hidden rounded-t-xl">
        <Image
          src={video?.thumbnail}
          alt={video?.title}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {formatDuration(video?.duration)}
        </div>

        {/* Quality Badge */}
        {video?.quality && (
          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded backdrop-blur-sm font-medium">
            {video?.quality}
          </div>
        )}

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center space-x-3 animate-fade-in">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePreview}
              iconName="Play"
              iconPosition="left"
              className="glass-card"
            >
              Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleQuickDownload}
              loading={isLoading}
              iconName="Download"
              iconPosition="left"
            >
              Download
            </Button>
          </div>
        )}
      </div>
      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {video?.title}
        </h3>

        {/* Channel Info */}
        <div className="flex items-center justify-between mb-2 mt-3">
          <div className="flex items-center space-x-2 overflow-hidden mr-2">
            {video?.channel?.avatar ? (
              <Image
                src={video?.channel?.avatar}
                alt={video?.channel?.name || video?.uploader || 'Channel Avatar'}
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
            ) : (
              (() => {
                const name = video?.channel?.name || video?.uploader || '?';
                // Simple hash function to generate deterministic color
                let hash = 0;
                for (let i = 0; i < name.length; i++) {
                  hash = name.charCodeAt(i) + ((hash << 5) - hash);
                }
                const hue = Math.abs(hash % 360);
                const bgColor = `hsl(${hue}, 70%, 85%)`; // Light pastel background
                const textColor = `hsl(${hue}, 80%, 30%)`; // Dark readable text

                return (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0"
                    style={{ backgroundColor: bgColor, color: textColor }}
                  >
                    {name[0]}
                  </div>
                );
              })()
            )}
            <span className="text-xs text-muted-foreground font-medium truncate">
              {video?.channel?.name || video?.uploader || 'Unknown Channel'}
            </span>
            {video?.channel?.verified && (
              <Icon name="CheckCircle" size={12} className="text-primary flex-shrink-0" />
            )}
          </div>
          {video?.views !== undefined && (
            <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
              {formatViews(video?.views)}
            </span>
          )}
        </div>

        {/* Video Stats */}
        {video?.uploadDate !== undefined && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              <span>{formatUploadTime(video?.uploadDate)}</span>
            </div>

            {/* Like Ratio Indicator */}
            {video?.likes && video?.dislikes && (
              <div className="flex items-center space-x-1">
                <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{
                      width: `${(video?.likes / (video?.likes + video?.dislikes)) * 100}%`
                    }}
                  />
                </div>
                <Icon name="ThumbsUp" size={10} className="text-success" />
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {video?.tags && video?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video?.tags?.slice(0, 3)?.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Quick Actions Footer */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="h-7 text-xs px-2 rounded-md font-medium text-muted-foreground"
            onClick={(e) => {
              e?.stopPropagation();
              onQuickDownload?.(video, 'jpg');
            }}
            title="Download Thumbnail (JPG)"
          >
            <Icon name="Image" size={14} className="mr-2" />
            Download Thumbnail
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={(e) => {
              e?.stopPropagation();
              if (video?.url) {
                navigator.clipboard.writeText(video.url);
                // Optional: You could trigger a toast notification here
                alert('URL Copied to clipboard!');
              }
            }}
            title="Copy Video Link"
          >
            <Icon name="Copy" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;