import React from 'react';

const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-20 px-4 lg:px-6 flex items-center justify-between">
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted animate-pulse"></div>
          <div className="hidden md:flex flex-col gap-1">
            <div className="w-24 h-5 bg-muted rounded animate-pulse"></div>
            <div className="w-32 h-3 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center justify-center p-2 rounded-full border border-border bg-muted/50 shadow-sm gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-10 rounded-full bg-muted animate-pulse"></div>
          ))}
        </div>

        {/* Sign In Button */}
        <div className="w-20 h-9 rounded-lg bg-muted animate-pulse"></div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 lg:pb-8 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 mt-8">
            {/* Main Title */}
            <div className="flex justify-center mb-4">
              <div className="w-48 h-12 bg-muted rounded-lg animate-pulse"></div>
            </div>
            {/* Subtitle Lines */}
            <div className="space-y-3 max-w-2xl mx-auto mb-8">
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto animate-pulse"></div>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto h-12 bg-muted rounded-full animate-pulse shadow-sm border border-border"></div>
          </div>

          {/* Home Content Section */}
          <div className="space-y-6">
            {/* Trending Header */}
            <div className="flex items-center justify-between mb-4 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-32 h-8 bg-gray-200 rounded border border-gray-100 animate-pulse"></div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-hidden pb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className={`h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0 ${i === 1 ? 'w-12 bg-gray-300' : 'w-20'}`}></div>
              ))}
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-10">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  {/* Thumbnail Box */}
                  <div className="w-full aspect-video bg-muted rounded-xl animate-pulse relative border border-border">
                    <div className="absolute bottom-2 right-2 w-10 h-5 bg-muted rounded animate-pulse"></div>
                  </div>
                  {/* Video Details */}
                  <div className="flex gap-3">
                    <div className="w-9 h-9 mt-1 rounded-full bg-muted animate-pulse flex-shrink-0"></div>
                    <div className="flex flex-col gap-2 w-full pt-1">
                      <div className="w-[90%] h-4 bg-muted rounded animate-pulse"></div>
                      <div className="w-[60%] h-4 bg-muted rounded animate-pulse"></div>
                      <div className="w-[40%] h-3 bg-muted rounded animate-pulse mt-1"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageSkeleton;
