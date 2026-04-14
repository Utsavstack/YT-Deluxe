import { useTranslation } from "react-i18next";
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import WifiLoader from '../../../components/ui/WifiLoader';

const SearchResults = ({
  results,
  searchQuery,
  onQuickDownload,
  onPreview,
  isLoading,
  onLoadMore,
  hasMore,
  totalResults,
  sentinelRef, // passed from parent for IntersectionObserver
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchStage, setSearchStage] = useState('idle');

  // Manage fake delay for the new "Searching" loader transitioning to Skeleton
  useEffect(() => {
    if (isLoading && results?.length === 0) {
      setSearchStage('searching');
      const timer = setTimeout(() => {
        setSearchStage('skeleton');
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setSearchStage('idle');
    }
  }, [isLoading, results?.length]);

  // Initial loading state — no results yet
  if (isLoading && results?.length === 0) {
    if (searchStage === 'searching') {
      return (
        <div className="w-full min-h-[50vh] flex items-center justify-center animate-fade-in">
          <WifiLoader />
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header skeleton */}
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-muted rounded-full animate-pulse" />
          <div className="h-6 bg-muted rounded-lg w-40 animate-pulse" />
        </div>

        {/* Skeleton grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="glass-card shadow-glass-md animate-pulse rounded-[24px] overflow-hidden">
              <div className="w-full h-48 bg-muted/60" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded-lg w-3/4" />
                <div className="h-3 bg-muted rounded-lg w-1/2" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-7 h-7 bg-muted rounded-full" />
                  <div className="h-3 bg-muted rounded-lg w-1/3" />
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

      {/* Search Results Header — Premium Liquid Glass */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in group">
        
        {/* Animated Icon Box */}
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.05)] transition-all duration-300 group-hover:shadow-[0_0_25px_var(--color-primary)] group-hover:scale-105">
          {/* Subtle pulse behind icon */}
          <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-20 hidden group-hover:block" />
          <Icon name="Search" size={20} className="text-primary transition-transform duration-300 group-hover:rotate-12" />
        </div>

        {/* Title and Results Badge */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] animate-shimmer overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] sm:max-w-md hidden md:block tracking-tight">
            {t("homeSearchDashboard.searchResults")}
          </h2>
          
          <div className="flex items-center gap-2 text-sm mt-1 sm:mt-0">
            {totalResults > 0 ? (
              <div className="glass-card relative overflow-hidden bg-primary/5 hover:bg-primary/10 transition-colors duration-300 border border-primary/20 pl-7 pr-4 py-1.5 rounded-full flex items-center shadow-glass-md animate-pop-in">
                {/* Live pulsing dot indicator */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                
                <span className="font-black text-primary mr-1.5 text-[15px]" style={{ fontFamily: '"Roboto Mono", monospace' }}>
                  {totalResults?.toLocaleString()}
                </span>
                <span className="text-muted-foreground font-medium">
                  {t("homeSearchDashboard.resultsFor")} <b className="text-foreground ml-0.5 tracking-wide">&quot;{searchQuery}&quot;</b>
                </span>
              </div>
            ) : (
              <span className="glass-card border border-border/40 px-4 py-2 rounded-full shadow-glass-md animate-pop-in text-muted-foreground font-medium">
                No results found for <b className="text-foreground">&quot;{searchQuery}&quot;</b>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {results?.length === 0 && !isLoading ? (
        <div className="relative overflow-hidden glass-card shadow-glass-lg p-10 md:p-16 text-center rounded-[32px] border border-primary/10 w-full animate-fade-in group">
          
          {/* Decorative glowing orb in background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

          {/* Floating Icon Presentation */}
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

          {/* Suggestions as Premium Glass Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto mb-10">
            {[
              { icon: "TextCursorInput", text: t("homeSearchDashboard.checkingYourSpelling") },
              { icon: "Type", text: t("homeSearchDashboard.usingDifferentKeywords") },
              { icon: "Hash", text: t("homeSearchDashboard.tryingMoreGeneralTerms") },
              { icon: "Link2", text: t("homeSearchDashboard.pastingADirectYoutube") }
            ].map((suggestion, i) => (
              <div key={i} className="glass-card flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/40 text-[13px] text-muted-foreground/90 transition-all duration-300 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5">
                <Icon name={suggestion.icon} size={14} className="text-primary/60" />
                <span>{suggestion.text}</span>
              </div>
            ))}
          </div>

          <Button 
            variant="default"
            className="rounded-full px-8 py-6 shadow-[0_8px_20px_-10px_var(--color-primary)] transition-transform hover:scale-105"
            iconName="RefreshCw" 
            iconPosition="left"
            onClick={() => {
              navigate('/home-search-dashboard');
              setTimeout(() => window.scrollTo(0, 0), 100);
            }}
          >
            {t("homeSearchDashboard.tryDifferentSearch")}
          </Button>
        </div>
      ) : (
        <>
          {/* Video Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results?.map((video) => (
              <VideoCard
                key={video?.id}
                video={video}
                onQuickDownload={onQuickDownload}
                onPreview={onPreview}
              />
            ))}
          </div>

          {/* Infinite Scroll Loading Indicator */}
          {isLoading && results?.length > 0 && (
            <div className="flex items-center justify-center gap-3 py-6">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-medium">Loading more...</span>
            </div>
          )}

          {/* IntersectionObserver Sentinel — invisible trigger div */}
          {hasMore && !isLoading && (
            <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;