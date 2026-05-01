import { useTranslation } from "react-i18next";
import React, { forwardRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtuosoGrid } from 'react-virtuoso';
import VideoCard from './VideoCard';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import WifiLoader from '../../../components/ui/WifiLoader';

// Skeleton card — Premium design with YouTube-like shimmer sweep
const SkeletonCard = () => (
  <div className="glass-card shadow-glass-md rounded-[24px] overflow-hidden relative bg-card/40">
    {/* Shimmer sweep effect */}
    <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" style={{ animationDuration: '2s' }} />
    
    <div className="w-full h-48 bg-muted" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-muted rounded-lg w-3/4" />
      <div className="h-3 bg-muted rounded-lg w-1/2" />
      <div className="flex items-center gap-2 mt-2">
        <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
        <div className="h-3 bg-muted rounded-lg w-1/3" />
      </div>
      <div className="flex justify-between mt-1">
        <div className="h-3 bg-muted rounded-lg w-1/4" />
        <div className="h-3 bg-muted rounded-lg w-1/4" />
      </div>
    </div>
  </div>
);

const SearchResults = ({
  results,
  searchQuery,
  onQuickDownload,
  onPreview,
  isLoading,
  totalResults,
  onLoadMore,
  isLoadingMore,
  hasMore,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchStage, setSearchStage] = useState('idle');

  useEffect(() => {
    if (isLoading && results?.length === 0) {
      setSearchStage('searching');
      const timer = setTimeout(() => setSearchStage('skeleton'), 1500);
      return () => clearTimeout(timer);
    } else {
      setSearchStage('idle');
    }
  }, [isLoading, results?.length]);

  const showInitialSkeleton = isLoading && results?.length === 0;

  // ── Initial loading state ──────────────────────────────────────────────────
  if (showInitialSkeleton) {
    if (searchStage === 'searching') {
      return (
        <div className="w-full min-h-[50vh] flex items-center justify-center animate-fade-in">
          <WifiLoader />
        </div>
      );
    }
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Skeleton Header matching the "Search Results!" pill */}
        <div className="flex mb-8">
          <div className="glass-card flex flex-col justify-center px-6 py-4 rounded-[20px] shadow-glass-sm border border-primary/10 bg-card/40 backdrop-blur-md relative overflow-hidden w-[280px] h-[72px]">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" style={{ animationDuration: '2s' }} />
            <div className="relative flex items-center gap-4 z-0">
              <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
              <div className="flex flex-col gap-2.5 w-full">
                <div className="h-4 bg-muted rounded-md w-3/4" />
                <div className="h-2.5 bg-muted rounded-md w-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Search Results Header */}
      <div className="flex animate-fade-in mb-8">
        <div className="glass-card flex flex-col justify-center px-6 py-4 rounded-[20px] shadow-glass-sm border border-primary/10 bg-card/40 backdrop-blur-md relative overflow-hidden group">
          {/* Subtle background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          
          <div className="relative flex items-start gap-4">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 shrink-0">
              <Icon name="Search" size={18} className="text-primary" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-[20px] font-bold text-foreground tracking-tight leading-none">
                {t("homeSearchDashboard.searchResults")}
              </h2>
              <div className="flex items-center gap-1.5 text-[15px] text-muted-foreground/80 font-medium">
                <span className="text-primary/90 font-semibold tracking-wide">
                  {totalResults?.toLocaleString()}
                </span>
                <span>
                  {t("homeSearchDashboard.resultsFor")}<b className="text-primary font-extrabold ml-0.5">&quot;{searchQuery}&quot;</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid (empty state) or VirtuosoGrid (infinite scroll) */}
      {results?.length === 0 && !isLoading ? (
        <div className="relative overflow-hidden glass-card shadow-glass-lg p-10 md:p-16 text-center rounded-[32px] border border-primary/10 w-full animate-fade-in group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border border-dashed border-primary/30 animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-background to-muted shadow-glass-sm animate-glass-float">
              <Icon name="SearchX" size={32} className="text-primary/70" />
            </div>
          </div>
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 mb-3 tracking-tight">
            {t("homeSearchDashboard.noResultsFound")}
          </h3>
          <p className="text-muted-foreground/80 mb-8 max-w-md mx-auto leading-relaxed">
            {t("homeSearchDashboard.weCouldntFindAny")} <span className="font-semibold text-foreground">&quot;{searchQuery}&quot;</span>. {t("homeSearchDashboard.try")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto mb-10">
            {[
              { icon: "TextCursorInput", text: t("homeSearchDashboard.checkingYourSpelling") },
              { icon: "Type",            text: t("homeSearchDashboard.usingDifferentKeywords") },
              { icon: "Hash",            text: t("homeSearchDashboard.tryingMoreGeneralTerms") },
              { icon: "Link2",           text: t("homeSearchDashboard.pastingADirectYoutube") }
            ].map((suggestion, i) => (
              <div key={i} className="glass-card flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/40 text-[13px] text-muted-foreground/90 transition-all duration-300 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5">
                <Icon name={suggestion.icon} size={14} className="text-primary/60" />
                <span>{suggestion.text}</span>
              </div>
            ))}
          </div>
          <Button
            variant="default"
            type="button"
            className="rounded-full px-8 py-6 shadow-[0_8px_20px_-10px_var(--color-primary)] transition-transform hover:scale-105"
            iconName="RefreshCw"
            iconPosition="left"
            onClick={() => { navigate('/home-search-dashboard'); setTimeout(() => window.scrollTo(0, 0), 100); }}
          >
            {t("homeSearchDashboard.tryDifferentSearch")}
          </Button>
        </div>
      ) : (
        <VirtuosoGrid
          useWindowScroll
          style={{ overflow: 'hidden' }}
          data={results}
          endReached={() => {
            if (!isLoading && !isLoadingMore && hasMore) {
              onLoadMore?.();
            }
          }}
          overscan={500}
          components={{
            List: forwardRef(({ style, children, ...props }, ref) => (
              <div
                ref={ref}
                {...props}
                style={style}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {children}
              </div>
            )),
            Item: ({ children, ...props }) => (
              <div {...props}>{children}</div>
            ),
            Footer: () => (
              <div className="py-8 w-full flex flex-col items-center justify-center gap-6">
                {/* "Load more" skeletons */}
                {isLoadingMore && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonCard key={`more-skel-${i}`} />
                    ))}
                  </div>
                )}

                {/* Spinner pill */}
                {isLoadingMore && (
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/5 dark:bg-white/5 border border-border/50 backdrop-blur-md">
                    <Icon name="Loader2" size={18} className="animate-spin text-primary" />
                    <span className="text-sm font-medium text-foreground opacity-80">
                      {t("common.loading", "Loading more results...")}
                    </span>
                  </div>
                )}

                {/* End of results */}
                {!hasMore && !isLoadingMore && results?.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md text-sm text-muted-foreground">
                    <Icon name="CheckCircle2" size={15} className="text-primary/60" />
                    {t("homeSearchDashboard.allResultsLoaded", "All results loaded")}
                  </div>
                )}
              </div>
            ),
          }}
          itemContent={(index, video) => (
            <VideoCard
              key={video?.id}
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

export default SearchResults;