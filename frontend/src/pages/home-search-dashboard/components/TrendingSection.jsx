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
        <div className="glass-card shadow-glass-xl p-12 text-center min-h-[60vh] flex flex-col justify-center items-center relative overflow-hidden border border-red-500/10">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none"></div>
          <div className="bg-red-500/10 p-5 rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <Icon name="WifiOff" size={48} className="text-red-500 relative z-10" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Connection Issue</h3>
          <p className="text-muted-foreground max-w-md text-center mb-8 leading-relaxed"> 
            It seems you're offline or the backend service is temporarily unresponsive. Please check your internet connection and try again.
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full transition-all text-sm font-medium"
            >
              <Icon name="RefreshCcw" size={16} />
              Refresh Page
            </button>
            <a 
              href="https://github.com/Utsavstack/YT-Deluxe/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 bg-card/60 hover:bg-red-500/10 hover:text-red-500 border border-border/50 hover:border-red-500/30 rounded-full transition-all text-sm font-medium text-foreground/80"
            >
              <Icon name="AlertCircle" size={16} />
              Report Issue
            </a>
          </div>
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