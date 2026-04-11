import { useTranslation } from "react-i18next";import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoMetadata = ({ videoData }) => {const { t } = useTranslation();
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
    const minutes = Math.floor(seconds % 3600 / 60);
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
                            {videoData?.channel?.subscribers} {t("videoDetailsDownload.subscribers")} 
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
            className="hidden sm:flex rounded-xl">
            
                        {videoData?.likes}
                    </Button>

                    <Button
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={() => setIsBookmarked(!isBookmarked)}
            iconName="Bookmark"
            iconPosition="left"
            className="rounded-xl"> {t("videoDetailsDownload.save")} 


          </Button>

                    <Button
            variant="outline"
            size="sm"
            iconName="Share"
            iconPosition="left"
            className="rounded-xl"> {t("videoDetailsDownload.share")} 


          </Button>
                </div>
            </div>
            {/* Description */}
            <div className="glass-card p-4">
                <div className="space-y-4">
                    {/* Quick Info Summary Moved from Sidebar */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-3 bg-accent/20 rounded-xl border border-border/50 text-sm">

                        <div className="flex items-center space-x-2">
                            <Icon name="Calendar" size={16} className="text-primary" />
                            <span className="text-muted-foreground">{t("videoDetailsDownload.uploaded")}</span>
                            <span className="text-foreground font-semibold">{new Date(videoData?.uploadDate)?.toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Icon name="Eye" size={16} className="text-primary" />
                            <span className="text-muted-foreground">{t("videoDetailsDownload.views")}</span>
                            <span className="text-foreground font-semibold">{formatViews(videoData?.views)}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Icon name="ThumbsUp" size={16} className="text-primary" />
                            <span className="text-muted-foreground">{t("videoDetailsDownload.likes")}</span>
                            <span className="text-foreground font-semibold">{videoData?.likes}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Icon name="MessageCircle" size={16} className="text-primary" />
                            <span className="text-muted-foreground">{t("videoDetailsDownload.comments")}</span>
                            <span className="text-foreground font-semibold">{videoData?.comments}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{t("videoDetailsDownload.description")}</h4>
                        <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              iconName={isDescriptionExpanded ? "ChevronUp" : "ChevronDown"}
              iconPosition="right">
              
                            {isDescriptionExpanded ? 'Show less' : 'Show more'}
                        </Button>
                    </div>

                    <div className={`text-sm text-muted-foreground ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                        <p className="whitespace-pre-wrap">{videoData?.description}</p>
                    </div>

                    {isDescriptionExpanded &&
          <div className="pt-3 border-t border-border">
                            <div className="flex flex-wrap gap-2">
                                {videoData?.tags?.map((tag, index) =>
              <span
                key={index}
                className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">
                
                                        #{tag}
                                    </span>
              )}
                            </div>
                        </div>
          }
                </div>
            </div>
        </div>);

};

export default VideoMetadata;