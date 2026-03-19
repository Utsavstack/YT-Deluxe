import React from 'react';
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
 totalResults 
}) => {
 if (isLoading && results?.length === 0) {
  return (
   <div className="space-y-6">
    <div className="flex items-center space-x-2">
     <Icon name="Search" size={20} className="text-primary" />
     <h2 className="text-xl font-bold text-foreground">Searching...</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     {Array.from({ length: 9 })?.map((_, index) => (
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
   {/* Search Results Header */}
   <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
     <Icon name="Search" size={20} className="text-primary" />
     <div>
      <h2 className="text-xl font-bold text-foreground">Search Results</h2>
      <p className="text-sm text-muted-foreground">
       {totalResults > 0 ? (
        <>
         Found {totalResults?.toLocaleString()} results for "{searchQuery}"
        </>
       ) : (
        `No results found for "${searchQuery}"`
       )}
      </p>
     </div>
    </div>
    
    {/* Search Filters */}
    <div className="hidden md:flex items-center space-x-2">
     <Button variant="outline" size="sm" iconName="Filter" iconPosition="left">
      Filters
     </Button>
     <Button variant="outline" size="sm" iconName="ArrowUpDown" iconPosition="left">
      Sort
     </Button>
    </div>
   </div>
   {/* Search Results Grid */}
   {results?.length === 0 && !isLoading ? (
    <div className="glass-card shadow-glass-md p-12 text-center">
     <Icon name="SearchX" size={48} className="text-muted-foreground mx-auto mb-4" />
     <h3 className="text-lg font-semibold text-foreground mb-2">No Results Found</h3>
     <p className="text-muted-foreground mb-4">
      We couldn't find any videos matching "{searchQuery}". Try:
     </p>
     <ul className="text-sm text-muted-foreground space-y-1 mb-6">
      <li>• Checking your spelling</li>
      <li>• Using different keywords</li>
      <li>• Trying more general terms</li>
      <li>• Pasting a direct YouTube URL</li>
     </ul>
     <Button variant="outline" iconName="RefreshCw" iconPosition="left">
      Try Different Search
     </Button>
    </div>
   ) : (
    <>
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

     {/* Load More Button */}
     {hasMore && (
      <div className="flex justify-center pt-6">
       <Button
        variant="outline"
        size="lg"
        onClick={onLoadMore}
        loading={isLoading}
        iconName="ChevronDown"
        iconPosition="right"
        className="min-w-32"
       >
        {isLoading ? 'Loading...' : 'Load More'}
       </Button>
      </div>
     )}

     {/* Results Summary */}
     <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border/50">
      Showing {results?.length} of {totalResults?.toLocaleString()} results
      {!hasMore && results?.length > 0 && (
       <span className="ml-2">• End of results</span>
      )}
     </div>
    </>
   )}
  </div>
 );
};

export default SearchResults;