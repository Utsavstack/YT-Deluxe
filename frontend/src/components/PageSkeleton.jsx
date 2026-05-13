import React from 'react';
import { useLocation } from 'react-router-dom';

const HeaderSkeleton = () => (
  <>
    {/* Desktop Floating Header Skeleton */}
    <div className="fixed top-6 left-0 right-0 z-[110] pointer-events-none flex justify-center w-full px-6">
      <div className="flex items-center justify-between max-w-7xl w-full relative">
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

        {/* Right: Icons (Theme, Bell, Fullscreen) */}
        <div className="flex items-center space-x-3">
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-12 mt-4 text-center">
        <div className="flex justify-center mb-4">
          {/* Big Title Skeleton */}
          <div className="w-64 h-12 lg:h-14 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse"></div>
        </div>
        <div className="space-y-3 max-w-2xl mx-auto mb-8 flex flex-col items-center">
          {/* Subtitle Skeletons */}
          <div className="h-5 bg-black/10 dark:bg-white/10 rounded-lg w-3/4 animate-pulse"></div>
          <div className="h-5 bg-black/10 dark:bg-white/10 rounded-lg w-1/2 animate-pulse"></div>
        </div>
        {/* Search Bar Skeleton */}
        <div className="max-w-3xl mx-auto h-14 bg-black/10 dark:bg-white/10 rounded-full animate-pulse shadow-sm border border-border/50"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="w-full aspect-video bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse relative border border-border/30"></div>
            <div className="flex gap-3">
              <div className="w-9 h-9 mt-1 rounded-full bg-black/10 dark:bg-white/10 animate-pulse flex-shrink-0"></div>
              <div className="flex flex-col gap-2 w-full pt-1">
                <div className="w-[85%] h-4 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
                <div className="w-[60%] h-3.5 bg-black/10 dark:bg-white/10 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </main>
);

const HistorySkeleton = () => (
  <main className="pt-32 pb-12">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="w-64 h-10 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse"></div>
          <div className="w-96 h-5 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse"></div>
        </div>
        <div className="w-full md:w-80 h-28 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse border border-border/30"></div>
      </div>
      <div className="space-y-6">
        <div className="flex gap-2">
          <div className="w-32 h-10 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse"></div>
          <div className="w-32 h-10 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse"></div>
        </div>
        <div className="w-full h-16 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse border border-border/30"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-[140px] bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse border border-border/30"></div>
          ))}
        </div>
      </div>
    </div>
  </main>
);

const SettingsSkeleton = () => (
  <main className="pt-32 pb-12 px-4 lg:px-6">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 flex-shrink-0 space-y-3">
        <div className="w-40 h-8 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse mb-6"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-full h-12 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse"></div>
        ))}
      </div>
      <div className="flex-1 min-w-0 space-y-8">
        <div className="w-48 h-8 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse"></div>
        <div className="w-full h-[320px] bg-black/10 dark:bg-white/10 rounded-3xl animate-pulse border border-border/30"></div>
        <div className="w-full h-[240px] bg-black/10 dark:bg-white/10 rounded-3xl animate-pulse border border-border/30"></div>
      </div>
    </div>
  </main>
);

const VideoDetailsSkeleton = () => (
  <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto min-h-screen">
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <div className="flex-grow w-full lg:max-w-[70%] xl:max-w-[75%] space-y-6">
        <div className="w-full aspect-video bg-black/10 dark:bg-white/10 rounded-[2rem] animate-pulse border border-border/30 shadow-glass-sm"></div>
        <div className="space-y-4 pt-2">
          <div className="w-3/4 h-8 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse"></div>
          <div className="flex items-center gap-4 pt-2">
            <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10 animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="w-48 h-5 bg-black/10 dark:bg-white/10 rounded-md animate-pulse"></div>
              <div className="w-32 h-4 bg-black/10 dark:bg-white/10 rounded-md animate-pulse"></div>
            </div>
            <div className="w-32 h-10 rounded-full bg-black/10 dark:bg-white/10 animate-pulse"></div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[30%] xl:w-[25%] flex-shrink-0 space-y-4">
        <div className="w-full h-14 bg-black/10 dark:bg-white/10 rounded-2xl animate-pulse"></div>
        <div className="w-full h-[500px] bg-black/10 dark:bg-white/10 rounded-[2rem] animate-pulse border border-border/30 shadow-glass-sm"></div>
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
