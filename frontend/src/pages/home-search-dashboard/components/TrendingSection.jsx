import { useTranslation } from "react-i18next";
import React, { useEffect, useRef } from 'react';
import VideoCard from './VideoCard';
import Icon from '../../../components/AppIcon';

const TrendingSection = ({
  videos,
  onQuickDownload,
  onPreview,
  isLoading,
  onLoadMore,
  isLoadingMore,
  hasMore
}) => {
  const { t } = useTranslation();
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          onLoadMore?.();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {videos?.length === 0 && !isLoading ? (
        <div className="glass-card shadow-glass-md p-12 text-center">
          <Icon name="Video" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("homeSearchDashboard.noTrendingVideos")}</h3>
          <p className="text-muted-foreground"> 
            {t("homeSearchDashboard.unableToLoadTrending")} 
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos?.map((video) => (
              <VideoCard
                key={video?.id}
                video={video}
                onQuickDownload={onQuickDownload}
                onPreview={onPreview} />
            ))}
          </div>

          {hasMore && (
            <div ref={observerTarget} className="flex justify-center items-center py-8">
              {isLoadingMore && (
                <div className="flex items-center space-x-2 text-primary">
                  <Icon name="Loader2" size={24} className="animate-spin" />
                  <span className="font-medium">{t("homeSearchDashboard.loadingMoreVideos")}</span>
                </div>
              )}
            </div>
          )}

          {!hasMore && videos?.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("homeSearchDashboard.youveReachedTheEnd")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrendingSection;