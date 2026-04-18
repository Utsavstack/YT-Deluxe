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
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';

const VideoDetailsDownload = () => {const { t } = useTranslation();
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
            tags: ['tutorial', 'guide', 'learning'],
            formats: response.video.formats || [],
            max_quality: bestQuality,
            url: fallbackUrl,
            videoUrl: `${import.meta.env.VITE_API_BASE_URL || ''}/api/stream?url=${encodeURIComponent(fallbackUrl)}&quality=720p`
          };
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
    return (
      <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-20 pb-8">
     <div className="max-w-7xl mx-auto px-4 lg:px-6">
      <div className="animate-pulse">
       <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
       <div className="h-96 bg-gray-200 rounded mb-6"></div>
       <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
     <div className="max-w-7xl mx-auto px-4 lg:px-6">
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
    <div className="max-w-7xl mx-auto px-4 lg:px-6">
     {/* Back Navigation */}
     <div className="pt-4 mb-4">
      <Button
              variant="outline"
              onClick={() => navigate(-1)}
              iconName="ArrowLeft"
              iconPosition="left"
              className="px-6 rounded-xl border-2 hover:bg-accent/50 transition-all spring-smooth"> {t("videoDetailsDownload.backToSearch")} 


            </Button>
     </div>

     <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="xl:col-span-2 space-y-8">
       {/* Video Player */}
       <VideoPlayer
                videoData={videoData}
                onQualityChange={handleQualityChange} />
              

       {/* Video Metadata */}
       <VideoMetadata videoData={videoData} />

       {/* Download Configuration */}
       <div className="space-y-6">
        <div className="flex items-center justify-between">
         <h2 id="download-options" className="text-2xl font-bold text-foreground">{t("videoDetailsDownload.downloadOptions")}</h2>
        </div>

        <DownloadTabs
                  videoData={videoData}
                  onDownload={handleDownload}
                  onSelect={handleSelectConfig}
                  selectedConfig={selectedConfig} />
                

        <VideoTrimmer
                  videoData={videoData}
                  onTrimChange={handleTrimChange}
                  onDownload={handleDownload}
                  onSelectConfig={handleSelectConfig}
                  selectedConfig={selectedConfig}
                  downloads={downloads} />
                
       </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
       {/* Quick Actions */}
       <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t("videoDetailsDownload.quickActions")}</h3>
        <div className="space-y-3">
          <Button
                    variant="default"
                    size="lg"
                    fullWidth
                    className="rounded-xl shadow-glass-sm hover:scale-[1.02] transition-all spring-smooth"
                    iconName="Download"
                    iconPosition="left"
                    loading={isDownloading}
                    onClick={() => handleDownload({
                      url: videoData?.url,
                      type: 'video',
                      quality: videoData?.max_quality || '1080p',
                      format: 'mp4',
                      filename: videoData?.title
                    })}> {t("videoDetailsDownload.quickDownload1")}

                    {videoData?.max_quality || '1080p'})
          </Button>

          <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    className="rounded-xl border-2 hover:bg-accent/50 transition-all spring-smooth"
                    iconName="Music"
                    iconPosition="left"
                    onClick={() => handleDownload({
                      url: videoData?.url,
                      type: 'audio',
                      quality: '320kbps',
                      format: 'mp3',
                      filename: videoData?.title,
                      size: '8.2 MB'
                    })}> {t("videoDetailsDownload.audioOnlyMp")} 


                  </Button>

          <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    className="rounded-xl border-2 hover:bg-accent/50 transition-all spring-smooth"
                    iconName="Image"
                    iconPosition="left"
                    onClick={() => handleDownload({
                      url: videoData?.url,
                      type: 'thumbnail',
                      quality: 'Max Resolution',
                      format: 'jpg',
                      filename: videoData?.title + ' Thumbnail',
                      size: 'Max Resolution'
                    })}> {t("videoDetailsDownload.downloadThumbnail")} 


                  </Button>
        </div>
       </div>

       {/* Download Progress */}
       <DownloadProgress
                downloads={downloads.filter(d => !d.dismissed && videoData?.url && d.url === videoData.url)}
                onCancel={handleCancelDownload}
                onRetry={handleRetryDownload}
                onClearCompleted={() => {
                  downloads
                    .filter(d => videoData?.url && d.url === videoData.url && d.status === 'completed')
                    .forEach(d => dismissDownload(d.id));
                }}
                onComplete={(download) => {
                  console.log('Download completed:', download);
                }} />
              

      </div>
     </div>
    </div>
   </main>
  </div>);

};

export default VideoDetailsDownload;