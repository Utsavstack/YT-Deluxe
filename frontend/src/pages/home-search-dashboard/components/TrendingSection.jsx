import { useTranslation } from "react-i18next";
import React, { forwardRef } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
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

  // Skeleton card — Premium design with YouTube-like shimmer sweep
  const SkeletonCard = () => (
    <div className="glass-card shadow-glass-md rounded-[24px] overflow-hidden relative bg-card/40">
      {/* Shimmer sweep effect */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" style={{ animationDuration: '2s' }} />
      
      <div className="w-full h-48 bg-black/10 dark:bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-black/10 dark:bg-white/10 rounded-lg w-3/4" />
        <div className="h-3 bg-black/10 dark:bg-white/10 rounded-lg w-1/2" />
        <div className="flex items-center gap-2 mt-2">
          <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-full shrink-0" />
          <div className="h-3 bg-black/10 dark:bg-white/10 rounded-lg w-1/3" />
        </div>
        <div className="flex justify-between mt-1">
          <div className="h-3 bg-black/10 dark:bg-white/10 rounded-lg w-1/4" />
          <div className="h-3 bg-black/10 dark:bg-white/10 rounded-lg w-1/4" />
        </div>
      </div>
    </div>
  );

  const showInitialSkeleton = isLoading && videos?.length === 0;

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
        <VirtuosoGrid
          useWindowScroll
          style={{ overflow: 'hidden' }}
          data={videos}
          endReached={() => {
            if (!isLoading && !isLoadingMore) {
              onLoadMore?.();
            }
          }}
          overscan={400}
          components={{
            List: forwardRef(({ style, children, ...props }, ref) => (
              <div ref={ref} {...props} style={style} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children}
              </div>
            )),
            Item: ({ children, ...props }) => (
              <div {...props}>
                {children}
              </div>
            ),
            Footer: () => (
              <div className="py-8 w-full flex flex-col items-center justify-center gap-6">
                {/* Initial load skeletons — shown before first batch arrives */}
                {showInitialSkeleton && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonCard key={`init-skel-${i}`} />
                    ))}
                  </div>
                )}
                
                {/* Pagination skeletons — shown while loading more */}
                {isLoadingMore && !showInitialSkeleton && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonCard key={`more-skel-${i}`} />
                    ))}
                  </div>
                )}

                {/* Explicit Fallback Loading Spinner */}
                {(isLoadingMore || showInitialSkeleton) && (
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/5 dark:bg-white/5 border border-border/50 backdrop-blur-md">
                    <Icon name="Loader2" size={18} className="animate-spin text-primary" />
                    <span className="text-sm font-medium text-foreground opacity-80">
                      {t("common.loading", "Loading more trending...")}
                    </span>
                  </div>
                )}
              </div>
            )
          }}
          itemContent={(index, video) => (
            <VideoCard
              video={video}
              onQuickDownload={onQuickDownload}
              onPreview={onPreview} 
            />
          )}
        />
      )}
    </div>
  );
};

export default TrendingSection;