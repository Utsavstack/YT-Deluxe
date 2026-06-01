import React from 'react';
import { useLocation } from 'react-router-dom';

const HeaderSkeleton = () => (
  <>
    {/* Desktop Floating Header Skeleton */}
    <div className="fixed top-6 left-0 right-0 z-[110] pointer-events-none flex justify-center w-full px-6">
      <div className="flex items-center justify-between max-w-[1600px] w-full relative">
        {/* Left: Logo */}
        <div className="bg-background/20 backdrop-blur-md border border-border/20 rounded-2xl p-2 pr-6 flex items-center space-x-4 animate-pulse">
          <div className="w-11 h-11 rounded-2xl bg-black/10 dark:bg-white/10"></div>
          <div className="block">
            <div className="w-20 h-4 bg-black/10 dark:bg-white/10 rounded mb-1.5"></div>
            <div className="w-28 h-2.5 bg-black/10 dark:bg-white/10 rounded"></div>
          </div>
        </div>

        {/* Center: Nav (Exactly 3 items) */}
        <div className="absolute inset-x-0 top-0 bottom-0 hidden md:flex justify-center items-center">
          <div className="bg-background/20 backdrop-blur-md border border-border/20 rounded-2xl p-2 flex items-center space-x-2 animate-pulse">
            <div className="w-[96px] h-[40px] rounded-2xl bg-black/10 dark:bg-white/10"></div>
            <div className="w-[96px] h-[40px] rounded-2xl bg-black/10 dark:bg-white/10"></div>
            <div className="w-[96px] h-[40px] rounded-2xl bg-black/10 dark:bg-white/10"></div>
          </div>
        </div>

        {/* Right Section: Arrows + Theme + Bell + Fullscreen */}
        <div className="flex items-center space-x-3">
          {/* Nav Arrows Placeholder */}
          <div className="w-[84px] h-[44px] rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse border border-border/20"></div>
          
          <div className="w-[44px] h-[44px] rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse border border-border/20"></div>
          <div className="w-[44px] h-[44px] rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse border border-border/20"></div>
          <div className="w-[44px] h-[44px] rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse border border-border/20"></div>
        </div>
      </div>
    </div>

    {/* Mobile Floating Bottom Nav Skeleton */}
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100] pointer-events-none">
      <div className="bg-background/20 backdrop-blur-md border border-border/20 rounded-3xl py-3 px-2 flex justify-around animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10"></div>
        <div className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10"></div>
        <div className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10"></div>
      </div>
    </div>
  </>
);

const HomeSkeleton = () => (
  <main className="pt-32 pb-32 lg:pb-8 px-4 lg:px-6">
    <div className="max-w-[1600px] mx-auto">
      {/* Hero Section Skeleton */}
      <div className="mb-12 mt-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-72 h-14 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse"></div>
        </div>
        <div className="space-y-3 max-w-2xl mx-auto mb-10 flex flex-col items-center">
          <div className="h-5 bg-black/10 dark:bg-white/10 rounded-lg w-3/4 animate-pulse"></div>
          <div className="h-5 bg-black/10 dark:bg-white/10 rounded-lg w-1/2 animate-pulse"></div>
        </div>
        {/* Search Bar Placeholder */}
        <div className="max-w-3xl mx-auto h-16 bg-black/10 dark:bg-white/10 rounded-full animate-pulse shadow-sm border border-border/50 mb-8"></div>
        
        {/* Recent Searches Placeholder */}
        <div className="flex justify-center gap-3 mb-10">
          <div className="w-24 h-8 bg-black/10 dark:bg-white/10 rounded-full animate-pulse"></div>
          <div className="w-24 h-8 bg-black/10 dark:bg-white/10 rounded-full animate-pulse"></div>
          <div className="w-24 h-8 bg-black/10 dark:bg-white/10 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Main Container Skeleton */}
      <div className="relative z-10 rounded-[2.5rem] bg-white/10 dark:bg-black/10 border border-black/5 dark:border-white/5 p-6 md:p-8">
        {/* Category Header Placeholder */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-48 h-8 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse"></div>
          <div className="flex gap-2">
             {[1, 2, 3, 4, 5].map(i => (
               <div key={i} className="w-20 h-9 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse"></div>
             ))}
          </div>
        </div>

        {/* Video Grid Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="w-full aspect-video bg-black/10 dark:bg-white/10 rounded-3xl animate-pulse border border-border/30 shadow-sm"></div>
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-full bg-black/10 dark:bg-white/10 animate-pulse flex-shrink-0"></div>
                <div className="flex flex-col gap-2.5 w-full pt-1">
                  <div className="w-[90%] h-4 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
                  <div className="w-[60%] h-3.5 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </main>
);

const HistorySkeleton = () => (
  <main className="pt-24 pb-32 px-4 lg:px-6">
    <div className="max-w-[1600px] mx-auto">
      {/* Modern Hero Section Skeleton */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-8 md:p-12 mb-8">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="max-w-xl space-y-4">
            <div className="h-10 bg-slate-200 dark:bg-white/10 rounded-xl w-72 animate-pulse"></div>
            <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-lg w-96 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full items-stretch">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-full min-h-[300px]">
                <div className="bg-white/50 dark:bg-black/20 rounded-[2rem] border border-slate-200/50 dark:border-white/5 p-6 md:p-8 w-full h-full shadow-sm flex flex-col animate-pulse">
                  {/* Header */}
                  <div className="flex items-center mb-5 space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10" />
                    <div className="w-32 h-5 rounded-md bg-slate-200 dark:bg-white/10" />
                  </div>
                  {/* Inner Content Container */}
                  <div className="flex-1 p-4 bg-slate-100 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-16 h-6 rounded-full bg-slate-200/60 dark:bg-white/5" />
                        <div className="w-32 h-6 rounded-full bg-slate-200/60 dark:bg-white/5" />
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200/60 dark:bg-white/5 mb-6" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="w-full h-16 rounded-xl bg-slate-200/60 dark:bg-white/5" />
                      <div className="w-full h-16 rounded-xl bg-slate-200/60 dark:bg-white/5" />
                      <div className="w-full h-16 rounded-xl bg-slate-200/60 dark:bg-white/5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="py-4 mb-8">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="w-full xl:w-64 h-12 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse"></div>
          <div className="w-full xl:w-[600px] h-12 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse"></div>
        </div>
      </div>
      
      {/* Main Content Area Skeleton */}
      <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/90 dark:bg-[#1e1e1e]/80 rounded-[24px] border border-black/10 dark:border-white/10 p-4 animate-pulse h-[114px]">
              <div className="flex items-start gap-4 h-full">
                {/* Thumbnail */}
                <div className="w-32 h-20 rounded-2xl bg-slate-200 dark:bg-white/5 flex-shrink-0" />
                
                {/* Content */}
                <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between h-20">
                  <div>
                    <div className="w-3/4 h-4 rounded-md bg-slate-200 dark:bg-white/10 mb-2.5" />
                    <div className="w-1/2 h-3 rounded-md bg-slate-200/60 dark:bg-white/5" />
                  </div>
                  
                  {/* Footer badges */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-4 rounded-md bg-slate-200/60 dark:bg-white/5" />
                      <div className="w-10 h-4 rounded-md bg-slate-200/60 dark:bg-white/5" />
                      <div className="w-14 h-4 rounded-md bg-slate-200/60 dark:bg-white/5" />
                    </div>
                    <div className="w-24 h-4 rounded-full bg-slate-200/60 dark:bg-white/5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </main>
);

const SettingsSkeleton = () => (
  <main className="pt-24 pb-12 px-4 lg:px-6">
    <div className="max-w-[1600px] mx-auto">
      {/* Page Header Skeleton */}
      <div className="mb-8 flex items-center space-x-4 animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/10"></div>
        <div className="space-y-2">
          <div className="h-7 bg-black/10 dark:bg-white/10 rounded-lg w-48"></div>
          <div className="h-4 bg-black/10 dark:bg-white/10 rounded-md w-64"></div>
        </div>
      </div>

      {/* Main Settings Container Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10 rounded-[2.5rem] bg-white/10 dark:bg-black/10 border border-black/5 dark:border-white/5 p-6 md:p-8 mt-4 animate-pulse">
        {/* Sidebar Skeleton */}
        <div className="lg:col-span-1 space-y-6">
           <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-24 mb-4"></div>
           {[1, 2, 3, 4, 5, 6].map(i => (
             <div key={i} className="h-14 bg-black/10 dark:bg-white/10 rounded-xl w-full"></div>
           ))}
        </div>

        {/* Content Area Skeleton */}
        <div className="lg:col-span-3 space-y-8">
           <div className="h-24 bg-black/10 dark:bg-white/10 rounded-2xl w-full border border-black/5 dark:border-white/5"></div>
           <div className="h-[400px] bg-black/10 dark:bg-white/10 rounded-3xl w-full border border-black/5 dark:border-white/5"></div>
        </div>
      </div>

      {/* Footer Placeholder Skeleton */}
      <div className="mt-12 h-64 bg-black/10 dark:bg-white/10 rounded-[2.5rem] animate-pulse"></div>
    </div>
  </main>
);

const VideoDetailsSkeleton = () => (
  <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto min-h-screen">
    <div className="flex flex-col gap-10">
      {/* Block 1: Player & Info Skeleton */}
      <div className="relative z-10 rounded-[2.5rem] bg-white/10 dark:bg-black/10 border border-black/5 dark:border-white/5 p-6 md:p-8">
        <div className="w-full aspect-video bg-black/10 dark:bg-white/10 rounded-[2rem] animate-pulse border border-border/30 shadow-glass-sm"></div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10">
          <div className="xl:col-span-2 space-y-6">
            <div className="w-3/4 h-10 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse"></div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-black/10 dark:bg-white/10 animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="w-56 h-6 bg-black/10 dark:bg-white/10 rounded-md animate-pulse"></div>
                <div className="w-36 h-4 bg-black/10 dark:bg-white/10 rounded-md animate-pulse"></div>
              </div>
            </div>
            <div className="w-full h-40 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse mt-4"></div>
          </div>
          <div className="xl:col-span-1">
             <div className="w-full h-[320px] bg-black/10 dark:bg-white/10 rounded-[2rem] animate-pulse border border-border/30 shadow-glass-sm"></div>
          </div>
        </div>
      </div>

      {/* Block 2: Options Skeleton */}
      <div className="relative z-10 rounded-[2.5rem] bg-white/10 dark:bg-black/10 border border-black/5 dark:border-white/5 p-6 md:p-8">
        <div className="w-48 h-8 bg-black/10 dark:bg-white/10 rounded-xl mb-6 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-44 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse"></div>
           ))}
        </div>
      </div>

      {/* Block 3: Trimmer Skeleton */}
      <div className="relative z-10 rounded-[2.5rem] bg-white/10 dark:bg-black/10 border border-black/5 dark:border-white/5 p-6 md:p-8">
        <div className="w-40 h-8 bg-black/10 dark:bg-white/10 rounded-xl mb-6 animate-pulse"></div>
        <div className="w-full h-48 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse"></div>
      </div>
    </div>
  </main>
);

const PageSkeleton = () => {
  const location = useLocation();
  const path = location.pathname;

  let ContentSkeleton = HomeSkeleton;
  if (path.includes('download-history')) ContentSkeleton = HistorySkeleton;
  else if (path.includes('user-settings')) ContentSkeleton = SettingsSkeleton;
  else if (path.includes('video-details')) ContentSkeleton = VideoDetailsSkeleton;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <HeaderSkeleton />
      <ContentSkeleton />
    </div>
  );
};

export default PageSkeleton;
