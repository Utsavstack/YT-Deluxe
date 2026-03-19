import React, { useState, useEffect, useRef } from 'react';
import VideoCard from './VideoCard';
import Icon from '../../../components/AppIcon';

const TrendingSection = ({
 videos,
 onQuickDownload,
 onPreview,
 isLoading,
 onRefresh,
 lastUpdated,
 onLoadMore,
 isLoadingMore,
 hasMore,
 categories = [],
 activeCategory = "All",
 onCategorySelect
}) => {
 const [spinning, setSpinning] = useState(false);
 const observerTarget = useRef(null);

 useEffect(() => {
  const observer = new IntersectionObserver(
   entries => {
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

 const handleRefresh = async () => {
  if (spinning || isLoading) return;
  setSpinning(true);
  await onRefresh?.();
  setTimeout(() => setSpinning(false), 800);
 };

 const getTimeAgo = (date) => {
  if (!date) return 'Just now';
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  return `${Math.floor(diffMins / 60)} hr ago`;
 };

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

    <button
     onClick={handleRefresh}
     disabled={spinning || isLoading}
     className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
     title="Refresh trending videos"
    >
     <Icon
      name="RefreshCw"
      size={16}
      className={spinning ? 'animate-spin text-primary' : ''}
     />
     <span>Updated {getTimeAgo(lastUpdated)}</span>
    </button>
   </div>

   {/* Categories Chips */}
   {categories.length > 0 && (
    <div className="flex overflow-x-auto pb-2 -mx-4 px-4 lg:-mx-0 lg:px-0 hide-scrollbar gap-2">
     {categories.map((category) => (
      <button
       key={category}
       onClick={() => onCategorySelect?.(category)}
       className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${activeCategory === category
        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
        : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-border/80'
        }`}
      >
       {category}
      </button>
     ))}
    </div>
   )}

   {videos?.length === 0 && !isLoading ? (
    <div className="glass-card shadow-glass-md p-12 text-center">
     <Icon name="Video" size={48} className="text-muted-foreground mx-auto mb-4" />
     <h3 className="text-lg font-semibold text-foreground mb-2">No Trending Videos</h3>
     <p className="text-muted-foreground">
      Unable to load trending videos at the moment. Please try again later.
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
        onPreview={onPreview}
       />
      ))}
     </div>

     {hasMore && (
      <div ref={observerTarget} className="flex justify-center items-center py-8">
       {isLoadingMore && (
        <div className="flex items-center space-x-2 text-primary">
         <Icon name="Loader2" size={24} className="animate-spin" />
         <span className="font-medium">Loading more videos...</span>
        </div>
       )}
      </div>
     )}

     {!hasMore && videos?.length > 0 && (
      <div className="text-center py-8 text-muted-foreground">
       <p>You've reached the end of trending videos.</p>
      </div>
     )}
    </>
   )}
  </div>
 );
};

export default TrendingSection;