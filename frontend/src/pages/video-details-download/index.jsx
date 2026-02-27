import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProgressNotification from '../../components/ui/ProgressNotification';
import VideoPlayer from './components/VideoPlayer';
import VideoMetadata from './components/VideoMetadata';
import DownloadTabs from './components/DownloadTabs';
import VideoTrimmer from './components/VideoTrimmer';
import DownloadProgress from './components/DownloadProgress';
import YTDeluxeAPI from '../../utils/api';
import Button from '../../components/ui/Button';

const VideoDetailsDownload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [downloads, setDownloads] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [trimSettings, setTrimSettings] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [error, setError] = useState(null);

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
          videoInfo = {
            id: response.video.id,
            title: response.video.title,
            description: response.video.description || 'No description available.',
            thumbnail: response.video.thumbnail,
            duration: response.video.duration,
            views: response.video.view_count || (initialVideo && initialVideo.views) || Math.floor(Math.random() * 1000000) + 10000,
            likes: Math.floor(Math.random() * 50000) + 1000, // Mock likes
            comments: Math.floor(Math.random() * 5000) + 100, // Mock comments
            uploadDate: response.video.upload_date
              ? `${response.video.upload_date.slice(0, 4)}-${response.video.upload_date.slice(4, 6)}-${response.video.upload_date.slice(6, 8)}T00:00:00Z`
              : new Date().toISOString(),
            channel: {
              name: response.video.uploader || 'Unknown Channel',
              subscribers: '1M+',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
            },
            tags: ['tutorial', 'guide', 'learning'],
            formats: response.video.formats || [],
            url: initialVideo.url,
            videoUrl: `/api/stream?url=${encodeURIComponent(initialVideo.url)}&quality=720p`
          };
        }
      }

      // Fallback to mock data if API fails or no video URL
      if (!videoInfo) {
        videoInfo = {
          id: "dQw4w9WgXcQ",
          title: "Complete React Tutorial 2024 - Build Modern Web Applications",
          description: `Learn React from scratch in this comprehensive tutorial! This course covers everything you need to know to build modern web applications with React 18.\n\nWhat you'll learn:\n• React fundamentals and JSX\n• Components and Props\n• State management with hooks\n• Event handling and forms\n• API integration\n• Routing with React Router\n• State management with Context API\n• Performance optimization\n• Testing React applications\n• Deployment strategies\n\nPerfect for beginners and intermediate developers looking to master React development. All source code and resources are available in the description.\n\n🔗 Source Code: https://github.com/example/react-tutorial\n📚 Documentation: https://reactjs.org\n💬 Discord Community: https://discord.gg/react\n\n#React #JavaScript #WebDevelopment #Programming #Tutorial`,
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
            "frontend", "hooks", "components", "jsx", "modern-web", "coding", "learn-to-code"
          ],
          formats: []
        };
      }

      setVideoData(videoInfo);

      // Auto-download if requested
      if (location.state?.autoDownload) {
        handleDownload({
          url: videoInfo.url,
          type: 'video',
          quality: '1080p',
          format: 'mp4',
          filename: videoInfo.title,
          size: '45.2 MB'
        });
      }

    } catch (error) {
      console.error('Failed to load video data:', error);
      setError('Failed to load video information. Please try again.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleDownload = async (downloadConfig) => {
    // Quick handle for thumbnail download to match HomeSearchDashboard
    if (downloadConfig?.type === 'thumbnail') {
      try {
        const response = await fetch(videoData.thumbnail);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${videoData.title || 'thumbnail'}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (e) {
        // Fallback
        window.open(videoData.thumbnail, '_blank');
      }
      return;
    }

    const newDownload = {
      id: Date.now() + Math.random(),
      filename: `${downloadConfig?.filename || 'video'}.${downloadConfig?.format || 'mp4'}`,
      type: downloadConfig?.type,
      quality: downloadConfig?.quality,
      format: downloadConfig?.format,
      size: downloadConfig?.size,
      progress: 0,
      status: 'downloading',
      speed: 0,
      timeRemaining: 0,
      startedAt: new Date(),
      trimSettings: trimSettings
    };

    setDownloads(prev => [...prev, newDownload]);
    setIsDownloading(true);

    try {
      // Prepare download configuration
      const apiConfig = {
        url: downloadConfig.url || videoData?.url,
        quality: downloadConfig.quality,
        format: downloadConfig.format,
        rename: downloadConfig.filename,
        trim_start: trimSettings?.startTime,
        trim_end: trimSettings?.endTime
      };

      // Start download via API
      const response = await YTDeluxeAPI.downloadVideo(apiConfig);

      if (response.task_id) {
        // Track progress
        trackDownloadProgress(response.task_id, newDownload.id);
      } else {
        throw new Error('No task ID received from server');
      }

    } catch (error) {
      console.error('Download setup failed:', error);
      setDownloads(prev => prev.map(download =>
        download.id === newDownload.id
          ? { ...download, status: 'error', error: error.message }
          : download
      ));
      setError('Download setup failed. Please try again.');
      setIsDownloading(false);
    }
  };

  const trackDownloadProgress = async (taskId, downloadId) => {
    const progressInterval = setInterval(async () => {
      try {
        const progress = await YTDeluxeAPI.getDownloadProgress(taskId);

        setDownloads(prev => prev.map(download =>
          download.id === downloadId
            ? {
              ...download,
              progress: progress.progress || 0,
              status: progress.status || 'downloading',
              filename: progress.filename || download.filename,
              error: progress.error || null,
              speed: progress.speed || 0,
              timeRemaining: progress.eta || 0,
              downloaded_bytes: progress.downloaded_bytes || 0,
              total_bytes: progress.total_bytes || 0
            }
            : download
        ));

        // Stop tracking if download is complete or failed
        if (progress.status === 'completed' || progress.status === 'error') {
          clearInterval(progressInterval);
          setIsDownloading(false);

          if (progress.status === 'completed') {
            // Update the download with 100% progress
            setDownloads(prev => prev.map(download =>
              download.id === downloadId
                ? {
                  ...download,
                  progress: 100,
                  status: 'completed',
                  completedAt: new Date().toISOString()
                }
                : download
            ));

            // Show success notification
            if (Notification.permission === 'granted') {
              const completedDownload = downloads.find(d => d.id === downloadId);
              if (completedDownload) {
                const fileType = completedDownload.type
                  ? completedDownload.type.charAt(0).toUpperCase() + completedDownload.type.slice(1)
                  : 'File';
                new Notification('Download Complete', {
                  body: `${fileType} Downloaded Successfully!`,
                  icon: '/favicon.ico'
                });
              }
            }

            // Actually trigger the browser download by navigating to the file URL
            if (progress.filename) {
              try {
                // Using window.location.assign forces an immediate navigation.
                // Since the backend sets Content-Disposition: attachment, it won't change the page
                // but will instantly pop up the native browser download dialog/notification.
                const downloadUrl = `/api/downloads/${encodeURIComponent(progress.filename)}`;
                window.location.assign(downloadUrl);
              } catch (e) {
                console.error("Failed to trigger download", e);
              }
            }
          }
        }

      } catch (error) {
        console.error('Progress tracking failed:', error);
        clearInterval(progressInterval);
      }
    }, 1000); // Check progress every second
  };

  const handleCancelDownload = (downloadId) => {
    setDownloads(prev => prev.map(download =>
      download.id === downloadId
        ? { ...download, status: 'cancelled', progress: 0 }
        : download
    ));
  };

  const handleRetryDownload = (downloadId) => {
    const download = downloads.find(d => d.id === downloadId);
    if (download) {
      setDownloads(prev => prev.map(d =>
        d.id === downloadId
          ? { ...d, status: 'downloading', progress: 0, error: null }
          : d
      ));

      // Retry the download
      handleDownload({
        url: videoData?.url,
        type: download.type,
        quality: download.quality,
        format: download.format,
        filename: download.filename,
        size: download.size
      });
    }
  };

  const handleTrimChange = (startTime, endTime) => {
    setTrimSettings({ startTime, endTime });
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Video</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button
                variant="default"
                onClick={() => navigate('/home-search-dashboard')}
              >
                Back to Search
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {downloads.length > 0 && <ProgressNotification downloads={downloads} />}
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Back Navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/home-search-dashboard')}
              iconName="ArrowLeft"
              iconPosition="left"
              className="mb-4"
            >
              Back to Search
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              {/* Video Player */}
              <VideoPlayer
                videoData={videoData}
                onQualityChange={handleQualityChange}
              />

              {/* Video Metadata */}
              <VideoMetadata videoData={videoData} />

              {/* Download Configuration */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Download Options</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    iconName="Share"
                    iconPosition="left"
                  >
                    Share
                  </Button>
                </div>

                <DownloadTabs
                  videoData={videoData}
                  onDownload={handleDownload}
                />

                <VideoTrimmer
                  videoData={videoData}
                  onTrimChange={handleTrimChange}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="default"
                    size="lg"
                    fullWidth
                    iconName="Download"
                    iconPosition="left"
                    loading={isDownloading}
                    onClick={() => handleDownload({
                      url: videoData?.url,
                      type: 'video',
                      quality: '1080p',
                      format: 'mp4',
                      filename: videoData?.title,
                      size: '45.2 MB'
                    })}
                  >
                    Quick Download (1080p)
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    iconName="Music"
                    iconPosition="left"
                    onClick={() => handleDownload({
                      url: videoData?.url,
                      type: 'audio',
                      quality: '320kbps',
                      format: 'mp3',
                      filename: videoData?.title,
                      size: '8.2 MB'
                    })}
                  >
                    Audio Only (MP3)
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    iconName="Image"
                    iconPosition="left"
                    onClick={() => handleDownload({
                      url: videoData?.url,
                      type: 'thumbnail',
                      quality: 'Max Resolution',
                      format: 'jpg',
                      filename: videoData?.title + ' Thumbnail',
                      size: 'Max Resolution'
                    })}
                  >
                    Download Thumbnail
                  </Button>
                </div>
              </div>

              {/* Download Progress */}
              <DownloadProgress
                downloads={downloads}
                onCancel={handleCancelDownload}
                onRetry={handleRetryDownload}
                onComplete={(download) => {
                  console.log('Download completed:', download);
                }}
              />

              {/* Video Info Summary */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Video Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="text-foreground font-medium">
                      {YTDeluxeAPI.formatDuration(videoData?.duration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Views:</span>
                    <span className="text-foreground font-medium">
                      {(videoData?.views / 1000000)?.toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Channel:</span>
                    <span className="text-foreground font-medium">{videoData?.channel?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upload Date:</span>
                    <span className="text-foreground font-medium">
                      {new Date(videoData?.uploadDate)?.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Actions */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">More Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    iconName="History"
                    iconPosition="left"
                    onClick={() => navigate('/download-history-management')}
                    className="justify-start"
                  >
                    View Download History
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    iconName="Download"
                    iconPosition="left"
                    onClick={() => navigate('/batch-download-manager')}
                    className="justify-start"
                  >
                    Batch Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    iconName="Settings"
                    iconPosition="left"
                    onClick={() => navigate('/user-settings-preferences')}
                    className="justify-start"
                  >
                    Download Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoDetailsDownload;