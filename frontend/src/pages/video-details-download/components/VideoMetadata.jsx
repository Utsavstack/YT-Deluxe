import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoMetadata = ({ videoData }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const formatViews = (views) => {
    // Clean string format if it has commas like "1,746,153,552"
    let numericViews = views;
    if (typeof views === 'string') {
      numericViews = parseInt(views.replace(/,/g, ''), 10);
    }

    if (isNaN(numericViews)) {
      return `${views || 0} views`;
    }

    if (numericViews >= 1000000) {
      return `${(numericViews / 1000000)?.toFixed(1)}M views`;
    } else if (numericViews >= 1000) {
      return `${(numericViews / 1000)?.toFixed(1)}K views`;
    }
    return `${numericViews} views`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes?.toString()?.padStart(2, '0')}:${secs?.toString()?.padStart(2, '0')}`;
    }
    return `${minutes}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const formatUploadDate = (date) => {
    if (!date) return 'Unknown date';
    const now = new Date();
    const uploadDate = new Date(date);

    if (isNaN(uploadDate.getTime())) {
      return 'Unknown date';
    }

    const diffTime = Math.abs(now - uploadDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-6">
      {/* Video Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-2">
          {videoData?.title}
        </h1>

        {/* Video Stats */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{formatViews(videoData?.views)}</span>
          <span>•</span>
          <span>{formatUploadDate(videoData?.uploadDate)}</span>
          <span>•</span>
          <span>{formatDuration(videoData?.duration)}</span>
        </div>
      </div>
      {/* Channel Info & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {videoData?.channel?.name?.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{videoData?.channel?.name}</h3>
            <p className="text-sm text-muted-foreground">
              {videoData?.channel?.subscribers} subscribers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={isLiked ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            iconName="ThumbsUp"
            iconPosition="left"
            className="hidden sm:flex"
          >
            {videoData?.likes}
          </Button>

          <Button
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={() => setIsBookmarked(!isBookmarked)}
            iconName="Bookmark"
            iconPosition="left"
          >
            Save
          </Button>

          <Button
            variant="outline"
            size="sm"
            iconName="Share"
            iconPosition="left"
          >
            Share
          </Button>
        </div>
      </div>
      {/* Description */}
      <div className="glass-card p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Description</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              iconName={isDescriptionExpanded ? "ChevronUp" : "ChevronDown"}
              iconPosition="right"
            >
              {isDescriptionExpanded ? 'Show less' : 'Show more'}
            </Button>
          </div>

          <div className={`text-sm text-muted-foreground ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
            <p className="whitespace-pre-wrap">{videoData?.description}</p>
          </div>

          {isDescriptionExpanded && (
            <div className="pt-3 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {videoData?.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Video Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full mx-auto mb-2">
            <Icon name="Eye" size={20} className="text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">{formatViews(videoData?.views)}</p>
          <p className="text-xs text-muted-foreground">Views</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-success/10 rounded-full mx-auto mb-2">
            <Icon name="ThumbsUp" size={20} className="text-success" />
          </div>
          <p className="text-lg font-semibold text-foreground">{videoData?.likes}</p>
          <p className="text-xs text-muted-foreground">Likes</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-warning/10 rounded-full mx-auto mb-2">
            <Icon name="MessageCircle" size={20} className="text-warning" />
          </div>
          <p className="text-lg font-semibold text-foreground">{videoData?.comments}</p>
          <p className="text-xs text-muted-foreground">Comments</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-accent/50 rounded-full mx-auto mb-2">
            <Icon name="Clock" size={20} className="text-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">{formatDuration(videoData?.duration)}</p>
          <p className="text-xs text-muted-foreground">Duration</p>
        </div>
      </div>
    </div>
  );
};

export default VideoMetadata;