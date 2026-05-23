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
  const [localDownloadIds, setLocalDownloadIds] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [trimSettings, setTrimSettings] = useState(null);
  const [videoData, setVideoData] = useState(null);

  // Phase 1: show full-page skeleton until Piped meta + min 1.5s delay done
  const [isMetaLoaded, setIsMetaLoaded] = useState(false);
  // Phase 2: show format skeleton until yt-dlp formats ready
  const [isFormatsLoaded, setIsFormatsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);

  // Keep backward-compat: old code checked isLoadingVideo
  const isLoadingVideo = !isMetaLoaded;

  const initialVideo = location.state?.video;

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    loadVideoData();
  }, []);

  const loadVideoData = async () => {
    setIsMetaLoaded(false);
    setIsFormatsLoaded(false);
    setError(null);

    try {
      if (!initialVideo) {
        setError('No video data available. Please go back and select a video.');
        setIsMetaLoaded(true);
        return;
      }

      const cardVideoId = initialVideo.id || initialVideo.url?.split('v=')?.[1]?.split('&')?.[0] || '';
      const fallbackUrl = initialVideo.url || `https://www.youtube.com/watch?v=${cardVideoId}`;

      // Build base data from card (used as starting point)
      const baseData = {
        id: cardVideoId,
        title: initialVideo.title || '',
        description: initialVideo.description || '',
        thumbnail: initialVideo.thumbnail || `https://i.ytimg.com/vi/${cardVideoId}/hqdefault.jpg`,
        duration: initialVideo.duration,
        views: initialVideo.views || 0,
        likes: 0,
        comments: 0,
        uploadDate: null,
        channel: {
          name: initialVideo.channel?.name || initialVideo.uploader || '',
          subscribers: initialVideo.channel?.subscribers || '',
          avatar: initialVideo.channel?.avatar || null,
          verified: initialVideo.channel?.verified || false,
        },
        formats: [],
        all_formats: [],
        max_quality: null,
        url: fallbackUrl,
        videoUrl: `${import.meta.env.VITE_API_BASE_URL || ''}/api/stream?url=${encodeURIComponent(fallbackUrl)}&quality=720p`,
      };

      // ── Check cache before anything ──────────────────────────────────────
      const cacheKey = CacheKey.videoDetails(fallbackUrl);
      const cached = dataCache.get(cacheKey);
      if (cached) {
        setVideoData({ ...baseData, ...cached });
        setIsMetaLoaded(true);
        setIsFormatsLoaded(true);
        if (location.state?.autoDownload) {
          handleDownload({ url: cached.url, type: 'video', quality: cached.max_quality || '1080p', format: 'mp4', filename: cached.title });
        }
        return;
      }

      // ── PHASE 1: Quick metadata (multi-source) + 1.5s min skeleton delay ──
      // Backend tries Piped, YouTube page scrape, and RYD API in parallel.
      // Both metadata fetch and min delay run in parallel; we wait for BOTH.
      const minDelayPromise = new Promise(res => setTimeout(res, 1500));

      let quickMeta = null;
      let quickFailed = false;

      if (cardVideoId) {
        const quickPromise = YTDeluxeAPI.getVideoQuick(cardVideoId)
          .then(res => {
            if (res?.metadata) quickMeta = res.metadata;
            else { quickFailed = true; console.warn('[Phase 1] Quick metadata returned null'); }
          })
          .catch((err) => { quickFailed = true; console.error('[Phase 1] Quick metadata failed:', err); });

        await Promise.all([minDelayPromise, quickPromise]);
      } else {
        await minDelayPromise;
        quickFailed = true;
      }

      if (quickFailed) {
        // ── FALLBACK: All quick sources failed → keep skeleton, wait for full yt-dlp ──
        // Do NOT setIsMetaLoaded(true) here — skeleton stays until yt-dlp finishes
        console.warn('[Phase 1 Fallback] Quick metadata failed, falling back to full yt-dlp extraction');

        try {
          const response = await YTDeluxeAPI.getVideoDetails(fallbackUrl);
          if (response.video) {
            const videoFormats = (response.video.formats || []).filter(f => f.type === 'video');
            const bestQuality = response.video.max_quality || (videoFormats.length ? videoFormats[0].quality : '1080p');
            const fullData = {
              ...baseData,
              id: response.video.id || baseData.id,
              title: response.video.title || baseData.title,
              description: response.video.description || '',
              thumbnail: response.video.thumbnail || baseData.thumbnail,
              duration: response.video.duration || baseData.duration,
              views: response.video.view_count || baseData.views,
              likes: response.video.like_count || 0,
              comments: response.video.comment_count || 0,
              uploadDate: response.video.upload_date
                ? (response.video.upload_date.includes('T')
                    ? response.video.upload_date
                    : response.video.upload_date.length >= 8
                      ? `${response.video.upload_date.slice(0,4)}-${response.video.upload_date.slice(4,6)}-${response.video.upload_date.slice(6,8)}T00:00:00Z`
                      : new Date().toISOString())
                : null,
              channel: {
                name: (typeof response.video.channel === 'object' ? response.video.channel?.name : response.video.channel) || response.video.uploader || baseData.channel.name || 'Unknown Channel',
                subscribers: response.video.channel_follower_count || baseData.channel.subscribers || '',
                avatar: response.video.channel_avatar || baseData.channel.avatar || null,
                verified: response.video.channel_verified || false,
              },
              formats: response.video.formats || [],
              all_formats: response.video.all_formats || response.video.formats || [],
              max_quality: bestQuality,
              url: fallbackUrl,
              videoUrl: baseData.videoUrl,
            };
            dataCache.set(cacheKey, fullData, TTL.VIDEO_DETAILS);
            setVideoData(fullData);
            setIsFormatsLoaded(true);  // Formats also ready — no skeleton needed
            setIsMetaLoaded(true);     // NOW show the page — everything is complete
            if (location.state?.autoDownload) {
              handleDownload({ url: fallbackUrl, type: 'video', quality: bestQuality, format: 'mp4', filename: fullData.title });
            }
          } else {
            // yt-dlp returned no video data
            setVideoData(baseData);
            setIsMetaLoaded(true);
          }
        } catch (ytErr) {
          console.error('[Fallback] yt-dlp also failed:', ytErr);
          setError('Failed to load video information. Please try again.');
          setIsMetaLoaded(true);
        }
        return;
      }

      // ── Quick metadata succeeded: build enriched meta and show page ────────
      const m = quickMeta;
      const enrichedData = {
        ...baseData,
        description: m.description || baseData.description,
        likes: m.likes || 0,
        views: m.views || baseData.views,
        uploadDate: m.uploadDate || null,
        channel: {
          ...baseData.channel,
          name: m.uploaderName || baseData.channel.name,
          avatar: m.uploaderAvatar || baseData.channel.avatar,
          subscribers: m.uploaderSubscriberCount || baseData.channel.subscribers,
          verified: m.uploaderVerified || baseData.channel.verified,
        },
      };

      setVideoData(enrichedData);
      setIsMetaLoaded(true); // ← Page renders now (Phase 1 complete)

      // ── PHASE 2: yt-dlp format extraction in background ─────────────────
      try {
        const response = await YTDeluxeAPI.getVideoDetails(fallbackUrl);
        if (response.video) {
          const videoFormats = (response.video.formats || []).filter(f => f.type === 'video');
          const bestQuality = response.video.max_quality || (videoFormats.length ? videoFormats[0].quality : '1080p');

          setVideoData(prev => {
            if (!prev) return prev;
            const merged = {
              ...prev,
              id: response.video.id || prev.id,
              title: response.video.title || prev.title,
              description: prev.description || response.video.description || '',
              thumbnail: response.video.thumbnail || prev.thumbnail,
              duration: response.video.duration || prev.duration,
              views: prev.views || response.video.view_count || 0,
              likes: prev.likes || response.video.like_count || 0,
              comments: response.video.comment_count || prev.comments,
              uploadDate: prev.uploadDate || (response.video.upload_date
                ? (response.video.upload_date.includes('T')
                    ? response.video.upload_date
                    : response.video.upload_date.length >= 8
                      ? `${response.video.upload_date.slice(0,4)}-${response.video.upload_date.slice(4,6)}-${response.video.upload_date.slice(6,8)}T00:00:00Z`
                      : new Date().toISOString())
                : null),
              channel: {
                name: prev.channel?.name || (typeof response.video.channel === 'object' ? response.video.channel?.name : response.video.channel) || response.video.uploader || 'Unknown Channel',
                subscribers: prev.channel?.subscribers || response.video.channel_follower_count || '',
                avatar: prev.channel?.avatar || response.video.channel_avatar || null,
                verified: prev.channel?.verified || response.video.channel_verified || false,
              },
              formats: response.video.formats || [],
              all_formats: response.video.all_formats || response.video.formats || [],
              max_quality: bestQuality,
              url: prev.url,
              videoUrl: prev.videoUrl,
            };
            dataCache.set(cacheKey, merged, TTL.VIDEO_DETAILS);
            return merged;
          });
          setIsFormatsLoaded(true);

          if (location.state?.autoDownload) {
            handleDownload({ url: fallbackUrl, type: 'video', quality: bestQuality || '1080p', format: 'mp4', filename: response.video.title });
          }
        }
      } catch (formatError) {
        console.error('[Phase 2] yt-dlp format extraction failed:', formatError);
        // Page is still usable — metadata shown, download tabs stay in skeleton
      }

    } catch (err) {
      console.error('loadVideoData failed:', err);
      setError('Failed to load video information. Please try again.');
      setIsMetaLoaded(true);
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
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                  {/* Metadata Skeleton */}
                  <div className="xl:col-span-2 space-y-6">
                    {/* Video Player Skeleton */}
                    <div className="w-full aspect-video bg-black/10 dark:bg-white/10 rounded-2xl relative overflow-hidden shadow-sm">
                       {shimmerSweep}
                    </div>

                    <div className="h-8 bg-black/10 dark:bg-white/10 rounded-lg w-3/4 relative overflow-hidden mt-6">
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
            {/* Block 1: Player, Metadata & Quick Actions */}
            <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Left: Player + Metadata (Title, Channel, Description) */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                  {/* Video Player */}
                  <div className="w-full">
                    <VideoPlayer
                      videoData={videoData}
                      onQualityChange={handleQualityChange} />
                  </div>
                  
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
                        disabled={isDownloading || !isFormatsLoaded}
                        className={`group relative w-full flex items-center justify-between p-4 rounded-xl overflow-hidden shadow-md shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] border border-primary/20 bg-primary text-white ${!isFormatsLoaded ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 group-hover:opacity-100 bg-[length:200%_100%] animate-shimmer transition-opacity duration-500 pointer-events-none"
                          style={{ animationDuration: '2s', animationTimingFunction: 'ease-in-out' }}
                        ></div>

                        <div className="flex items-center gap-3 relative z-10">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner flex items-center justify-center text-white">
                            {isDownloading || !isFormatsLoaded ? (
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
                              {isFormatsLoaded ? `MP4 • ${videoData?.max_quality || '1080p'}` : 'Preparing formats...'}
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

                {!isFormatsLoaded && videoData?.formats?.length === 0 ? (
                  /* Phase 2 skeleton: pixel-perfect download cards layout */
                  /* Phase 2 skeleton: exact pixel-perfect DownloadTabs layout */
                  <div className="space-y-6">
                    {(() => {
                      const shimmer = <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/60 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" style={{ animationDuration: '2s' }} />;
                      return (
                        <>
                          {/* MAIN TAB NAVIGATION skeleton */}
                          <div className="relative flex items-center space-x-2 bg-black/5 dark:bg-white/5 w-fit p-1.5 rounded-2xl border border-border/50 overflow-hidden">
                            {shimmer}
                            <div className="px-5 py-2.5 rounded-xl bg-black/10 dark:bg-white/10 w-24 h-10 relative" />
                            <div className="px-5 py-2.5 rounded-xl w-24 h-10 relative" />
                            <div className="px-5 py-2.5 rounded-xl w-28 h-10 relative" />
                          </div>

                          {/* Quick Preset Download skeleton */}
                          <div className="space-y-4">
                            <div className="h-6 w-36 bg-black/10 dark:bg-white/10 rounded-lg relative overflow-hidden">{shimmer}</div>
                            
                            {/* Max Quality Badge */}
                            <div className="flex items-center space-x-3 bg-black/5 dark:bg-white/5 w-fit px-4 py-2.5 rounded-2xl border border-border/50 mb-4 relative overflow-hidden">
                              {shimmer}
                              <div className="h-4 w-40 bg-black/10 dark:bg-white/10 rounded-md" />
                              <div className="h-6 w-16 bg-primary/20 rounded-xl" />
                            </div>
                            
                            {/* 3 Large Cards Grid Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[
                                { label: 'Best', accent: 'bg-emerald-500/20', ring: 'border-emerald-500/20' },
                                { label: 'Medium', accent: 'bg-blue-500/10', ring: 'border-blue-500/10' },
                                { label: 'Lowest', accent: 'bg-orange-400/10', ring: 'border-orange-400/10' },
                              ].map(({ label, accent, ring }, i) => {
                                const cardShimmer = <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/60 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" style={{ animationDuration: '2s', animationDelay: `${i * 0.2}s` }} />;
                                return (
                                  <div key={label} className={`relative bg-black/5 dark:bg-[#121212]/60 border ${ring} rounded-2xl p-5 flex flex-col gap-4 overflow-hidden shadow-glass-sm`}>
                                    {cardShimmer}
                                    {/* Header row */}
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${accent.replace('/10', '').replace('/20', '')} bg-black/20 dark:bg-white/20 shrink-0`} />
                                        <div className="h-3 w-16 bg-black/10 dark:bg-white/10 rounded" />
                                      </div>
                                      <div className="h-5 w-14 bg-black/5 dark:bg-white/5 rounded-md" />
                                    </div>
                                    {/* Quality label */}
                                    <div className="h-8 w-24 bg-black/10 dark:bg-white/10 rounded-lg" />
                                    {/* Info grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className={`${accent} border ${ring} rounded-xl p-3 flex flex-col gap-1.5`}>
                                        <div className="h-2.5 w-10 bg-black/10 dark:bg-white/10 rounded" />
                                        <div className="h-5 w-12 bg-black/15 dark:bg-white/15 rounded" />
                                      </div>
                                      <div className="bg-black/5 dark:bg-white/5 border border-border/50 rounded-xl p-3 flex flex-col gap-1.5">
                                        <div className="h-2.5 w-8 bg-black/10 dark:bg-white/10 rounded" />
                                        <div className="h-5 w-16 bg-black/10 dark:bg-white/10 rounded" />
                                      </div>
                                    </div>
                                    {/* Download button skeleton */}
                                    <div className="w-full h-12 bg-primary/20 rounded-xl mt-auto" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Advanced Options accordion wrapper skeleton */}
                          <div className="space-y-4 pt-4">
                            {/* Advanced options heading skeleton */}
                            <div className="flex items-center gap-2 px-1 relative overflow-hidden w-fit">
                              {shimmer}
                              <div className="w-5 h-5 bg-black/10 dark:bg-white/10 rounded-full" />
                              <div className="h-6 w-48 bg-black/10 dark:bg-white/10 rounded-lg" />
                            </div>

                            {/* The Advanced Options body box */}
                            <div className="bg-black/5 dark:bg-white/[0.02] p-6 md:p-8 space-y-8 relative z-10 border border-border/50 dark:border-white/5 flex flex-col rounded-3xl overflow-hidden">
                              {shimmer}
                              {/* Header + Tabs skeleton */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 relative z-20">
                                <div className="flex items-center justify-between sm:justify-start gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10" />
                                    <div className="h-4 w-28 bg-black/10 dark:bg-white/10 rounded-md" />
                                  </div>
                                  <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 border border-border/50 rounded-xl gap-1">
                                    <div className="h-7 w-16 bg-black/10 dark:bg-white/10 rounded-lg" />
                                    <div className="h-7 w-16 rounded-lg" />
                                    <div className="h-7 w-20 rounded-lg" />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3.5 h-3.5 rounded-full bg-black/5 dark:bg-white/5" />
                                  <div className="h-3 w-16 bg-black/5 dark:bg-white/5 rounded-md" />
                                </div>
                              </div>

                              {/* "Preparing…" hint */}
                              <div className="flex items-center gap-2.5 text-muted-foreground/70 bg-primary/5 p-3 rounded-xl border border-primary/10 relative z-20">
                                <div className="w-4 h-4 rounded-full border-2 border-primary/40 border-t-primary animate-spin shrink-0" />
                                <span className="text-xs font-medium">Extracting rich formats from YouTube...</span>
                              </div>

                              {/* Quality Cards Grid Skeleton (6 cards) */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 relative z-20">
                                {[1, 2, 3, 4, 5, 6].map((i) => {
                                  const cardShimmer = <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/60 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" style={{ animationDuration: '2s', animationDelay: `${i * 0.1}s` }} />;
                                  // First card highlighted like 1080p
                                  const isPrimary = i === 1;
                                  return (
                                    <div key={i} className={`relative bg-white/20 dark:bg-white/[0.03] border ${isPrimary ? 'border-primary/30 bg-primary/10' : 'border-border/40'} rounded-2xl p-4 flex flex-col overflow-hidden shadow-sm`}>
                                      {cardShimmer}
                                      <div className="mb-2">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                          <div className={`w-2 h-2 rounded-full ${isPrimary ? 'bg-primary/80' : 'bg-black/10 dark:bg-white/10'} shrink-0`} />
                                          <div className="h-4 w-12 bg-black/10 dark:bg-white/10 rounded" />
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-2">
                                          <div className={`h-4 w-10 ${isPrimary ? 'bg-primary/20' : 'bg-black/10 dark:bg-white/10'} rounded-md`} />
                                          <div className="h-4 w-16 bg-black/5 dark:bg-white/5 rounded-md" />
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        <div className="h-5 w-20 bg-black/5 dark:bg-white/5 rounded-md" />
                                        <div className="h-5 w-14 bg-black/5 dark:bg-white/5 rounded-md" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Advanced Formats Dropdown */}
                              <div className="w-full h-10 bg-black/10 dark:bg-white/10 rounded-xl border border-border/40 relative z-20" />

                              {/* Container Format */}
                              <div className="space-y-3 pt-2 relative z-20">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-black/10 dark:bg-white/10 rounded" />
                                  <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded" />
                                </div>
                                <div className="w-[300px] max-w-full h-10 bg-black/10 dark:bg-white/10 rounded-xl border border-border/40" />
                              </div>

                              {/* Custom Filename */}
                              <div className="space-y-3 pt-2 relative z-20">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-black/10 dark:bg-white/10 rounded" />
                                  <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded" />
                                </div>
                                <div className="w-full h-14 bg-black/10 dark:bg-white/10 rounded-2xl border border-border/40" />
                              </div>

                              {/* Download Button */}
                              <div className="flex justify-center pt-4 mt-2 border-t border-border/10 relative z-20">
                                <div className="w-full sm:w-auto min-w-[250px] h-14 bg-primary/20 rounded-2xl" />
                              </div>

                            </div>
                          </div>

                          {/* Integrated Trimmer Skeleton (matching closed accordion layout) */}
                          <div className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 bg-black/5 dark:bg-white/5 border-border/50 relative overflow-hidden mt-6">
                            {shimmer}
                            <div className="flex items-start gap-4 relative z-20">
                              <div className="mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10 text-muted-foreground/30">
                                <Icon name="Scissors" size={18} />
                              </div>
                              <div className="flex flex-col gap-2 pt-1">
                                <div className="h-4 w-28 bg-black/10 dark:bg-white/10 rounded-md" />
                                <div className="h-3 w-48 sm:w-60 bg-black/5 dark:bg-white/5 rounded-md" />
                              </div>
                            </div>
                            <div className="shrink-0 w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground/30 relative z-20">
                              <Icon name="ChevronDown" size={16} />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <DownloadTabs
                    videoData={videoData}
                    onDownload={handleDownload}
                    onSelect={handleSelectConfig}
                    selectedConfig={selectedConfig} />
                )}
              </div>
            </div>

            {/* Block 3: Video Trimmer */}
            {(isFormatsLoaded || videoData?.formats?.length > 0) && (
              <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
                <VideoTrimmer
                  videoData={videoData}
                  onTrimChange={handleTrimChange}
                  onDownload={handleDownload}
                  onSelectConfig={handleSelectConfig}
                  selectedConfig={selectedConfig}
                  downloads={downloads} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>);

};

export default VideoDetailsDownload;
