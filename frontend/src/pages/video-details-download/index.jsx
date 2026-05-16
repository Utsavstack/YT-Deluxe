import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from 'react-router-dom';
import { useDownloadContext } from '../../context/DownloadContext';
import VideoPlayer from './components/VideoPlayer';
import VideoMetadata from './components/VideoMetadata';
import DownloadTabs from './components/DownloadTabs';
import VideoTrimmer from './components/VideoTrimmer';
import DownloadProgress from './components/DownloadProgress';
import YTDeluxeAPI from '../../utils/api';
import dataCache, { CacheKey, TTL } from '../../utils/dataCache';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';

const VideoDetailsDownload = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { addDownload, cancelDownload, resumeDownload, downloads, dismissDownload } = useDownloadContext();
  // Keep a local set of download IDs created by this page for DownloadProgress sidebar
  const [localDownloadIds, setLocalDownloadIds] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [trimSettings, setTrimSettings] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [error, setError] = useState(null);
  // Tracks the quality/type the user currently has selected in DownloadTabs
  const [selectedConfig, setSelectedConfig] = useState(null);

  // Get video data from location state or URL params
  const initialVideo = location.state?.video;

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Load video data
    loadVideoData();
  }, []);

  const loadVideoData = async () => {
    setIsLoadingVideo(true);
    setError(null);

    try {
      let videoInfo = null;

      if (initialVideo?.url) {
        // Cache-first: check if we already fetched this video's details
        const cacheKey = CacheKey.videoDetails(initialVideo.url);
        const cached = dataCache.get(cacheKey);
        if (cached) {
          setVideoData(cached);
          setIsLoadingVideo(false);
          if (location.state?.autoDownload) {
            handleDownload({
              url: cached.url,
              type: 'video',
              quality: cached.max_quality || '1080p',
              format: 'mp4',
              filename: cached.title
            });
          }
          return;
        }

        // Get video details from API
        const response = await YTDeluxeAPI.getVideoDetails(initialVideo.url);
        if (response.video) {
          // Determine the best available quality from real formats
          const videoFormats = (response.video.formats || []).filter((f) => f.type === 'video');
          const bestQuality = response.video.max_quality || (
            videoFormats.length ? videoFormats[0].quality : '1080p');

          const fallbackUrl = initialVideo.url || `https://www.youtube.com/watch?v=${initialVideo.originalId || initialVideo.id?.split('_')?.[0] || response.video.id}`;

          videoInfo = {
            id: response.video.id,
            title: response.video.title,
            description: response.video.description || 'No description available.',
            thumbnail: response.video.thumbnail,
            duration: response.video.duration,
            views: response.video.view_count || initialVideo && initialVideo.views || Math.floor(Math.random() * 1000000) + 10000,
            likes: Math.floor(Math.random() * 50000) + 1000,
            comments: Math.floor(Math.random() * 5000) + 100,
            uploadDate: (response.video.upload_date && response.video.upload_date.length >= 8) ?
              `${response.video.upload_date.slice(0, 4)}-${response.video.upload_date.slice(4, 6)}-${response.video.upload_date.slice(6, 8)}T00:00:00Z` :
              (response.video.upload_date || new Date().toISOString()),
            channel: {
              name: (typeof response.video.channel === 'object' ? response.video.channel?.name : response.video.channel) ||
                response.video.uploader ||
                initialVideo?.channel?.name ||
                initialVideo?.uploader ||
                'Unknown Channel',
              subscribers: response.video.channel_follower_count || '1M+',
              avatar: response.video.channel_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
            },
            formats: response.video.formats || [],
            all_formats: response.video.all_formats || response.video.formats || [],
            max_quality: bestQuality,
            url: fallbackUrl,
            videoUrl: `${import.meta.env.VITE_API_BASE_URL || ''}/api/stream?url=${encodeURIComponent(fallbackUrl)}&quality=720p`
          };

          // Cache the video details (5 min TTL — safe for download links)
          dataCache.set(cacheKey, videoInfo, TTL.VIDEO_DETAILS);
        }
      }

      // Fallback to mock data if API fails or no video URL
      if (!videoInfo) {
        videoInfo = {
          id: "dQw4w9WgXcQ",
          title: "Complete React Tutorial 2024 - Build Modern Web Applications",
          description: `Learn React from scratch in this comprehensive tutorial! This course covers everything you need to know to build modern web applications with React 18.\n\nWhat you'll learn:\n• React fundamentals and JSX\n• Components and Props\n• State management with hooks\n• Event handling and forms\n• API integration\n• Routing with React Router\n• State management with Context API\n• Performance optimization\n• Testing React applications\n• Deployment strategies\n\nPerfect for beginners and intermediate developers looking to master React development. All source code and resources are available in the description.\n\n Source Code: https://github.com/example/react-tutorial\n Documentation: https://reactjs.org\n Discord Community: https://discord.gg/react\n\n#React #JavaScript #WebDevelopment #Programming #Tutorial`,
          thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
          videoUrl: "https://example.com/video.mp4",
          captionsUrl: "https://example.com/captions.vtt",
          duration: 3847, // 64 minutes 7 seconds
          views: 1250000,
          likes: 45600,
          comments: 2340,
          uploadDate: "2024-01-15T10:30:00Z",
          channel: {
            name: "CodeMaster Academy",
            subscribers: "2.1M",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
          },
          tags: [
            "react", "javascript", "web-development", "programming", "tutorial",
            "frontend", "hooks", "components", "jsx", "modern-web", "coding", "learn-to-code"],

          formats: []
        };
      }

      setVideoData(videoInfo);

      // Auto-download if requested — use best available quality
      if (location.state?.autoDownload) {
        handleDownload({
          url: videoInfo.url,
          type: 'video',
          quality: videoInfo.max_quality || '1080p',
          format: 'mp4',
          filename: videoInfo.title
        });
      }

    } catch (error) {
      console.error('Failed to load video data:', error);
      setError('Failed to load video information. Please try again.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleDownload = (downloadConfig) => {
    setIsDownloading(true);
    const id = addDownload(
      {
        url: videoData?.url,
        filename: videoData?.title || downloadConfig.filename,
        ...downloadConfig,
        trimSettings,
      },
      videoData
    );
    setLocalDownloadIds(prev => [...prev, id]);
    // Reset isDownloading flag after a short moment (context handles the real tracking)
    setTimeout(() => setIsDownloading(false), 1200);
  };


  const handleCancelDownload = (downloadId) => {
    cancelDownload(downloadId);
    setIsDownloading(false);
  };

  const handleRetryDownload = (downloadId) => {
    const dl = downloads.find(d => d.id === downloadId);
    if (dl) {
      resumeDownload(downloadId);
      const newId = addDownload({
        url: videoData?.url,
        type: dl.type,
        quality: dl.quality,
        format: dl.format,
        filename: dl.title || dl.filename,
        size: dl.size,
      }, videoData);
      setLocalDownloadIds(prev => [...prev, newId]);
    }
  };


  const handleTrimChange = (startTime, endTime) => {
    setTrimSettings({ startTime, endTime });
  };

  // Called by DownloadTabs when user changes quality/tab — no download triggered
  const handleSelectConfig = (config) => {
    setSelectedConfig(config);
  };

  const handleQualityChange = (quality) => {
    console.log('Quality changed to:', quality);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: videoData?.title,
        text: 'Check out this video!',
        url: window.location?.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard?.writeText(window.location?.href);
      // Show toast notification
      console.log('Link copied to clipboard');
    }
  };

  if (isLoadingVideo) {
    const shimmerSweep = <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" style={{ animationDuration: '2s' }} />;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-8">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
            
            {/* Back Navigation Skeleton */}
            <div className="pt-4 mb-4">
              <div className="w-36 h-10 bg-black/10 dark:bg-white/10 rounded-full relative overflow-hidden">
                 {shimmerSweep}
              </div>
            </div>

            <div className="flex flex-col gap-8 mt-4">
              {/* Block 1 Skeleton: Player & Metadata Row */}
              <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
                {/* Full Width Video Player Skeleton */}
                <div className="w-full aspect-video bg-black/10 dark:bg-white/10 rounded-2xl relative overflow-hidden shadow-sm">
                   {shimmerSweep}
                </div>

                {/* Metadata & Quick Actions Row Skeleton */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10">
                  {/* Metadata Skeleton */}
                  <div className="xl:col-span-2 space-y-6">
                    <div className="h-8 bg-black/10 dark:bg-white/10 rounded-lg w-3/4 relative overflow-hidden">
                       {shimmerSweep}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-black/10 dark:bg-white/10 rounded-full shrink-0 relative overflow-hidden">
                         {shimmerSweep}
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <div className="h-5 bg-black/10 dark:bg-white/10 rounded w-40 relative overflow-hidden">
                           {shimmerSweep}
                        </div>
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-28 relative overflow-hidden">
                           {shimmerSweep}
                        </div>
                      </div>
                    </div>
                    {/* Description Skeleton */}
                    <div className="h-32 bg-black/10 dark:bg-white/10 rounded-xl w-full relative overflow-hidden mt-4">
                       {shimmerSweep}
                    </div>
                  </div>

                  {/* Sidebar Skeleton */}
                  <div className="xl:col-span-1 space-y-6">
                    <div className="glass-card p-6 border-t-4 border-t-muted relative overflow-hidden rounded-[20px] bg-card/40">
                      {shimmerSweep}
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 bg-black/10 dark:bg-white/10 rounded-xl" />
                         <div className="h-6 bg-black/10 dark:bg-white/10 rounded-lg w-32" />
                      </div>
                      <div className="space-y-3">
                        <div className="w-full h-[72px] bg-black/10 dark:bg-white/10 rounded-xl" />
                        <div className="w-full h-[72px] bg-black/10 dark:bg-white/10 rounded-xl" />
                        <div className="w-full h-[72px] bg-black/10 dark:bg-white/10 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 2 Skeleton: Download Options */}
              <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
                <div className="h-8 bg-black/10 dark:bg-white/10 rounded-lg w-48 mb-6 relative overflow-hidden">
                   {shimmerSweep}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 bg-black/10 dark:bg-white/10 rounded-xl relative overflow-hidden">
                       {shimmerSweep}
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 3 Skeleton: Trimmer */}
              <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
                <div className="h-8 bg-black/10 dark:bg-white/10 rounded-lg w-36 mb-6 relative overflow-hidden">
                   {shimmerSweep}
                </div>
                <div className="h-48 bg-black/10 dark:bg-white/10 rounded-xl w-full relative overflow-hidden">
                   {shimmerSweep}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>);
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-8">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">{t("videoDetailsDownload.errorLoadingVideo")}</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button
                variant="default"
                onClick={() => navigate(-1)}> {t("videoDetailsDownload.backToSearch")}


              </Button>
            </div>
          </div>
        </main>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-8">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          {/* Back Navigation */}
          <div className="pt-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] shadow-md shadow-primary/20"
            >
              <div className="flex items-center justify-center p-1 rounded-full bg-white/20 shadow-inner">
                <Icon name="ArrowLeft" className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              </div>
              <span className="font-semibold text-sm tracking-wide">
                {t("videoDetailsDownload.backToSearch")}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-8 mt-4">
            {/* Block 1: Full Width Player & Metadata Row */}
            <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
              {/* Full Width Video Player */}
              <div className="w-full">
                <VideoPlayer
                  videoData={videoData}
                  onQualityChange={handleQualityChange} />
              </div>

              {/* Metadata & Quick Actions Row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10">
                {/* Left: Metadata (Title, Channel, Description) */}
                <div className="xl:col-span-2">
                  <VideoMetadata videoData={videoData} />
                </div>

                {/* Right: Quick Actions */}
                <div className="xl:col-span-1">
                  <div className="glass-card p-6 border-t-4 border-t-primary sticky top-24 relative overflow-hidden">
                    {/* Optional subtle glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>

                    <div className="flex items-center gap-0 mb-6 relative z-10">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
                        <Icon name="Zap" className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground tracking-tight">{t("videoDetailsDownload.quickActions")}</h3>
                    </div>

                    <div className="space-y-3 relative z-10">
                      {/* VIDEO BUTTON */}
                      <button
                        onClick={() => handleDownload({
                          url: videoData?.url,
                          type: 'video',
                          quality: videoData?.max_quality || '1080p',
                          format: 'mp4',
                          filename: videoData?.title
                        })}
                        disabled={isDownloading}
                        className="group relative w-full flex items-center justify-between p-4 rounded-xl overflow-hidden shadow-md shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] border border-primary/20 bg-primary text-white"
                      >
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 group-hover:opacity-100 bg-[length:200%_100%] animate-shimmer transition-opacity duration-500 pointer-events-none"
                          style={{ animationDuration: '2s', animationTimingFunction: 'ease-in-out' }}
                        ></div>

                        <div className="flex items-center gap-3 relative z-10">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner flex items-center justify-center text-white">
                            {isDownloading ? (
                              <Icon name="Loader2" className="w-5 h-5 animate-spin" />
                            ) : (
                              <Icon name="Download" className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <span className="font-bold text-sm leading-tight text-white">
                              {typeof t("videoDetailsDownload.quickDownload1") === 'string'
                                ? t("videoDetailsDownload.quickDownload1").replace(/\s*\(\s*$/, '')
                                : t("videoDetailsDownload.quickDownload1")}
                            </span>
                            <span className="text-[11px] font-medium text-white/80 mt-0.5 tracking-wide">
                              MP4 • {videoData?.max_quality || '1080p'}
                            </span>
                          </div>
                        </div>

                        <div className="relative z-10 bg-black/20 px-2 py-1 rounded text-[10px] font-bold tracking-wider backdrop-blur-md border border-white/10 shadow-sm text-white">
                          VIDEO
                        </div>
                      </button>

                      {/* AUDIO BUTTON */}
                      <button
                        onClick={() => handleDownload({
                          url: videoData?.url,
                          type: 'audio',
                          quality: 'High Quality',
                          format: 'mp3',
                          filename: videoData?.title,
                          convert_to_mp3: true
                        })}
                        className="group w-full flex items-center justify-between p-4 rounded-xl glass-card border border-white/10 hover:border-pink-500/50 hover:bg-pink-500/5 hover:shadow-[0_0_15px_rgba(236,72,153,0.15)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="p-2 bg-accent/50 dark:bg-white/5 rounded-lg text-muted-foreground group-hover:text-pink-500 group-hover:bg-pink-500/10 transition-colors duration-300 flex items-center justify-center">
                            <Icon name="Music" className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <span className="font-bold text-sm text-foreground leading-tight group-hover:text-pink-500 transition-colors duration-300">
                              {t("videoDetailsDownload.audioOnlyMp")}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground mt-0.5 tracking-wide">
                              MP3 • High Quality
                            </span>
                          </div>
                        </div>

                        <div className="bg-pink-500/10 border border-pink-500/20 text-pink-500 px-2 py-1 rounded text-[10px] font-bold tracking-wider relative z-10">
                          AUDIO
                        </div>
                      </button>

                      {/* THUMBNAIL BUTTON */}
                      <button
                        onClick={() => handleDownload({
                          url: videoData?.url,
                          type: 'thumbnail',
                          quality: 'Max Resolution',
                          format: 'jpg',
                          filename: videoData?.title + ' Thumbnail'
                        })}
                        className="group w-full flex items-center justify-between p-4 rounded-xl glass-card border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="p-2 bg-accent/50 dark:bg-white/5 rounded-lg text-muted-foreground group-hover:text-purple-500 group-hover:bg-purple-500/10 transition-colors duration-300 flex items-center justify-center">
                            <Icon name="Image" className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <span className="font-bold text-sm text-foreground leading-tight group-hover:text-purple-500 transition-colors duration-300">
                              {t("videoDetailsDownload.downloadThumbnail")}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground mt-0.5 tracking-wide">
                              JPG • Max Res
                            </span>
                          </div>
                        </div>

                        <div className="bg-purple-500/10 border border-purple-500/20 text-purple-500 px-2 py-1 rounded text-[10px] font-bold tracking-wider relative z-10">
                          THUMB
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2: Download Options */}
            <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 id="download-options" className="text-2xl font-bold text-foreground">{t("videoDetailsDownload.downloadOptions")}</h2>
                </div>

                <DownloadTabs
                  videoData={videoData}
                  onDownload={handleDownload}
                  onSelect={handleSelectConfig}
                  selectedConfig={selectedConfig} />
              </div>
            </div>

            {/* Block 3: Video Trimmer */}
            <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
              <VideoTrimmer
                videoData={videoData}
                onTrimChange={handleTrimChange}
                onDownload={handleDownload}
                onSelectConfig={handleSelectConfig}
                selectedConfig={selectedConfig}
                downloads={downloads} />
            </div>
          </div>
        </div>
      </main>
    </div>);

};

export default VideoDetailsDownload;
