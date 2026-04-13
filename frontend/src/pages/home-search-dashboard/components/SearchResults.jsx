import { useTranslation } from "react-i18next";
import React, { useRef, useEffect } from 'react';
import VideoCard from './VideoCard';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

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

  // Initial loading state — no results yet
  if (isLoading && results?.length === 0) {
    return (
      <div className="space-y-6">
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

      {/* Search Results Header — Premium */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Icon name="Search" size={16} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] sm:max-w-md hidden md:block">
            {t("homeSearchDashboard.searchResults")}
          </h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground leading-tight">
            {totalResults > 0 ? (
              <div className="glass-card border border-border/40 px-3 py-1.5 rounded-full flex items-center shadow-glass-sm animate-pop-in">
                <span className="font-semibold text-foreground mr-1" style={{ fontFamily: '"Roboto Mono", monospace' }}>
                  {totalResults?.toLocaleString()}
                </span>
                <span>{t("homeSearchDashboard.resultsFor")}<b>{searchQuery}</b>&quot;</span>
              </div>
            ) : (
              <span className="glass-card border border-border/40 px-3 py-1.5 rounded-full shadow-glass-sm animate-pop-in">
                No results found for &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {results?.length === 0 && !isLoading ? (
        <div className="glass-card shadow-glass-md p-12 text-center rounded-[24px]">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mx-auto mb-4">
            <Icon name="SearchX" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("homeSearchDashboard.noResultsFound")}</h3>
          <p className="text-muted-foreground mb-4">
            {t("homeSearchDashboard.weCouldntFindAny")} &quot;{searchQuery}&quot; {t("homeSearchDashboard.try")}
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 mb-6">
            <li>{t("homeSearchDashboard.checkingYourSpelling")}</li>
            <li>{t("homeSearchDashboard.usingDifferentKeywords")}</li>
            <li>{t("homeSearchDashboard.tryingMoreGeneralTerms")}</li>
            <li>{t("homeSearchDashboard.pastingADirectYoutube")}</li>
          </ul>
          <Button variant="outline" iconName="RefreshCw" iconPosition="left">
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