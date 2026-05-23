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
    <div className="bg-white dark:bg-[#1e1e1e]/80 backdrop-blur-xl border border-border/40 p-3 pb-5 rounded-[24px] sm:rounded-[32px] shadow-glass-sm relative flex flex-col gap-3 overflow-hidden">
      {/* Shimmer sweep effect */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" style={{ animationDuration: '2s' }} />
      
      {/* Thumbnail Section */}
      <div className="relative overflow-hidden rounded-[16px] sm:rounded-[24px] bg-slate-200/50 dark:bg-zinc-800/50 w-full h-52 border border-black/5 dark:border-white/5" />
      
      {/* Content Section */}
      <div className="flex gap-3 pt-1 px-1 flex-col">
        <div className="flex gap-3 w-full">
          {/* Channel Avatar */}
          <div className="w-9 h-9 rounded-full bg-slate-200/50 dark:bg-zinc-800/50 shrink-0 border border-black/5 dark:border-white/10" />

          {/* Text details */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Title (2 lines) */}
            <div className="h-4 bg-slate-200/50 dark:bg-zinc-800/50 rounded-lg w-full mb-1.5" />
            <div className="h-4 bg-slate-200/50 dark:bg-zinc-800/50 rounded-lg w-4/5 mb-1" />
            
            <div className="flex justify-between items-start mt-2">
              <div className="flex flex-col min-w-0 w-full pr-2 gap-2">
                {/* Channel Name */}
                <div className="h-3 bg-slate-200/50 dark:bg-zinc-800/50 rounded-md w-1/2" />
                {/* Views */}
                <div className="h-3 bg-slate-200/50 dark:bg-zinc-800/50 rounded-md w-2/3" />
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-2.5 mt-1">
                <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-zinc-800/50" />
                <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-zinc-800/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const showInitialSkeleton = isLoading && videos?.length === 0;

  // Inject skeletons directly into the grid data to maintain perfectly aligned columns
  const GRID_COLS = 3;
  const items = videos || [];
  const count = items.length;
  const remainder = count % GRID_COLS;
  let displayData = items;
  if (showInitialSkeleton) {
    displayData = Array(6).fill({ isSkeleton: true });
  } else if (isLoadingMore) {
    const fillPartial = remainder > 0 ? (GRID_COLS - remainder) : 0;
    const totalSkels = fillPartial + GRID_COLS;
    displayData = [...items, ...Array(totalSkels).fill({ isSkeleton: true })];
  } else if (hasMore && remainder > 0) {
    const fillPartial = GRID_COLS - remainder;
    displayData = [...items, ...Array(fillPartial).fill({ isSkeleton: true })];
  }

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
          data={displayData}
          computeItemKey={(index, item) => item.isSkeleton ? `skel-${index}` : item.id}
          endReached={() => {
            if (!isLoading && !isLoadingMore && hasMore) {
              onLoadMore?.();
            }
          }}
          overscan={400}
          components={{
            List: forwardRef(({ style, children, ...props }, ref) => (
              <div ref={ref} {...props} style={style} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {children}
              </div>
            )),
            Item: ({ children, ...props }) => (
              <div {...props}>
                {children}
              </div>
            ),
            Footer: () => (
              <div className="py-2 w-full"></div>
            )
          }}
          itemContent={(index, item) => 
            item.isSkeleton ? (
              <SkeletonCard />
            ) : (
              <VideoCard
                video={item}
                onQuickDownload={onQuickDownload}
                onPreview={onPreview} 
              />
            )
          }
        />
      )}
    </div>
  );
};

export default TrendingSection;