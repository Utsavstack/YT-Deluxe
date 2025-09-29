import React from 'react';
import VideoCard from './VideoCard';
import Icon from '../../../components/AppIcon';

const TrendingSection = ({ videos, onQuickDownload, onPreview, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Icon name="TrendingUp" size={20} className="text-primary" />
          <h2 className="text-xl font-bold text-foreground">Trending Videos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 })?.map((_, index) => (
            <div key={index} className="glass-card shadow-glass-md animate-pulse">
              <div className="w-full h-48 bg-muted rounded-t-xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-muted rounded-full"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon name="TrendingUp" size={20} className="text-primary" />
          <h2 className="text-xl font-bold text-foreground">Trending Videos</h2>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="RefreshCw" size={16} />
          <span>Updated 2 hours ago</span>
        </div>
      </div>
      {videos?.length === 0 ? (
        <div className="glass-card shadow-glass-md p-12 text-center">
          <Icon name="Video" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Trending Videos</h3>
          <p className="text-muted-foreground">
            Unable to load trending videos at the moment. Please try again later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos?.map((video) => (
            <VideoCard
              key={video?.id}
              video={video}
              onQuickDownload={onQuickDownload}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingSection;