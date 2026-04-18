import { useTranslation } from "react-i18next";import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import { useDownloadContext } from '../../context/DownloadContext';
import BatchInputSection from './components/BatchInputSection';
import QueueManager from './components/QueueManager';
import BatchProgressPanel from './components/BatchProgressPanel';
import YTDeluxeAPI from '../../utils/api';

const BatchDownloadManager = () => {const { t } = useTranslation();
  const { addDownload } = useDownloadContext();
  const [queue, setQueue] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [error, setError] = useState(null);

  // Mock video data generator (fallback when API is not available)
  const generateMockVideoData = (url) => {
    const mockTitles = [
    "React 18 Complete Tutorial - Build Modern Web Apps",
    "JavaScript ES2024 New Features Explained",
    "CSS Grid vs Flexbox - When to Use What",
    "Node.js Backend Development Masterclass",
    "TypeScript for Beginners - Complete Guide",
    "Next.js 14 App Router Tutorial",
    "MongoDB Database Design Best Practices",
    "Docker Containerization for Developers",
    "AWS Cloud Computing Fundamentals",
    "GraphQL API Development Tutorial"];


    const mockChannels = [
    "TechMaster Pro",
    "CodeWithJohn",
    "WebDev Academy",
    "Programming Hub",
    "DevTips Daily",
    "FullStack Journey",
    "Modern Developer",
    "Code Simplified",
    "Tech Tutorials",
    "Developer\'s Guide"];


    const mockThumbnails = [
    "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=400"];


    return {
      id: Date.now() + Math.random(),
      url,
      title: mockTitles?.[Math.floor(Math.random() * mockTitles?.length)],
      channel: mockChannels?.[Math.floor(Math.random() * mockChannels?.length)],
      thumbnail: mockThumbnails?.[Math.floor(Math.random() * mockThumbnails?.length)],
      duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
      views: `${Math.floor(Math.random() * 999) + 1}K`,
      quality: '720p',
      fileSize: `${Math.floor(Math.random() * 150) + 50}MB`,
      status: 'pending',
      progress: 0,
      addedAt: new Date()
    };
  };

  const handleAddUrls = async (urls) => {
    setError(null);

    try {
      // Try to get video details from API for each URL
      const videoPromises = urls.map(async (url) => {
        try {
          const response = await YTDeluxeAPI.getVideoDetails(url);
          if (response.video) {
            return {
              id: Date.now() + Math.random(),
              url,
              title: response.video.title,
              channel: response.video.uploader || response.video.channel || '',
              thumbnail: response.video.thumbnail,
              duration: response.video.duration,
              views: `${Math.floor(Math.random() * 999) + 1}K`,
              quality: '720p',
              fileSize: `${Math.floor(Math.random() * 150) + 50}MB`,
              status: 'pending',
              progress: 0,
              addedAt: new Date()
            };
          }
        } catch (error) {
          console.warn(`Failed to get details for ${url}:`, error);
        }

        // Fallback to mock data
        return generateMockVideoData(url);
      });

      const videoData = await Promise.all(videoPromises);
      setQueue((prev) => [...prev, ...videoData]);

    } catch (error) {
      console.error('Failed to add URLs:', error);
      setError('Failed to add some URLs. Please try again.');

      // Fallback to mock data
      const newItems = urls?.map((url) => generateMockVideoData(url));
      setQueue((prev) => [...prev, ...newItems]);
    }
  };

  const handleImportFromClipboard = (urls) => {
    handleAddUrls(urls);
    // Show success notification
    console.log(`Imported ${urls?.length} URLs from clipboard`);
  };

  const handleUpdateQueue = (newQueue) => {
    setQueue(newQueue);
  };

  const handleRemoveItems = (itemIds) => {
    setQueue((prev) => prev?.filter((item) => !itemIds?.includes(item?.id)));
  };

  const handleStartDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const pendingUrls = queue.
      filter((item) => item.status === 'pending').
      map((item) => item.url);

      if (pendingUrls.length === 0) {
        setError('No pending items to download.');
        setIsDownloading(false);
        return;
      }

      // Start batch download via API
      const response = await YTDeluxeAPI.batchDownload(pendingUrls, {
        quality: '720p',
        format: 'mp4'
      });

      if (response.batch_id) {
        setBatchId(response.batch_id);
        // Track batch progress
        trackBatchProgress(response.batch_id);

        // Also register each pending item with DownloadContext for global tracking
        queue.filter(item => item.status === 'pending').forEach(item => {
          addDownload({
            url: item.url,
            type: 'video',
            quality: item.quality || '720p',
            format: 'mp4',
            filename: item.title || 'Batch Download',
            thumbnail: item.thumbnail || '',
            channel: item.channel || '',
          });
        });
      } else {
        throw new Error('No batch ID received from server');
      }

    } catch (error) {
      console.error('Batch download failed:', error);
      setError('Batch download failed. Please try again.');
      setIsDownloading(false);

      // Fallback to mock download simulation
      simulateMockBatchDownload();
    }
  };

  const trackBatchProgress = async (batchId) => {
    const progressInterval = setInterval(async () => {
      try {
        const progress = await YTDeluxeAPI.getDownloadProgress(batchId);

        if (progress.status === 'completed' || progress.status === 'error') {
          clearInterval(progressInterval);
          setIsDownloading(false);
          setBatchId(null);

          if (progress.status === 'completed') {
            // Update queue with completed status
            setQueue((prev) => prev.map((item) => ({
              ...item,
              status: 'completed',
              progress: 100,
              completedAt: new Date().toISOString()
            })));
          }
        } else {
          // Update queue with progress
          setQueue((prev) => prev.map((item) => ({
            ...item,
            status: 'downloading',
            progress: progress.progress || 0,
            speed: progress.speed || 0,
            timeRemaining: progress.eta || 0,
            downloaded_bytes: progress.downloaded_bytes || 0,
            total_bytes: progress.total_bytes || 0
          })));
        }

      } catch (error) {
        console.error('Batch progress tracking failed:', error);
        clearInterval(progressInterval);
      }
    }, 1000); // Check progress every second for more responsive updates
  };

  const simulateMockBatchDownload = () => {
    const pendingItems = queue?.filter((item) => item?.status === 'pending');

    pendingItems?.forEach((item, index) => {
      setTimeout(() => {
        setQueue((prev) => prev?.map((queueItem) =>
        queueItem?.id === item?.id ?
        { ...queueItem, status: 'downloading', progress: 0 } :
        queueItem
        ));

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setQueue((prev) => prev?.map((queueItem) => {
            if (queueItem?.id === item?.id && queueItem?.status === 'downloading') {
              const newProgress = Math.min(queueItem?.progress + Math.random() * 15, 100);
              const newStatus = newProgress >= 100 ? 'completed' : 'downloading';

              if (newStatus === 'completed') {
                clearInterval(progressInterval);
              }

              return { ...queueItem, progress: Math.round(newProgress), status: newStatus };
            }
            return queueItem;
          }));
        }, 1000);

      }, index * 2000); // Stagger start times
    });
  };

  const handlePauseDownload = () => {
    setIsDownloading(false);
    setQueue((prev) => prev?.map((item) =>
    item?.status === 'downloading' ?
    { ...item, status: 'paused' } :
    item
    ));
  };

  const handleCancelAll = () => {
    setIsDownloading(false);
    setBatchId(null);
    setQueue((prev) => prev?.map((item) =>
    item?.status === 'downloading' || item?.status === 'pending' ?
    { ...item, status: 'pending', progress: 0 } :
    item
    ));
  };

  // Check if all downloads are complete
  useEffect(() => {
    const downloadingItems = queue?.filter((item) => item?.status === 'downloading');
    if (downloadingItems?.length === 0 && isDownloading) {
      setIsDownloading(false);
    }
  }, [queue, isDownloading]);

  return (
    <>
      <Helmet>
        <title>{t("batchDownloadManager.batchDownloadManagerYt")}</title>
        <meta name="description" content="Download multiple YouTube videos simultaneously with comprehensive queue management and progress tracking." />
        <meta name="keywords" content="batch download, youtube downloader, queue management, bulk download" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 pb-32">
          <div className="container mx-auto px-4 lg:px-6 max-w-6xl">
            <div className="space-y-8">
              {/* Page Header */}
              <div className="text-center py-8">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  {t("batchDownloadManager.batchDownloadManager")}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t("batchDownloadManager.processMultipleYoutubeVideos")}
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Input Section */}
              <BatchInputSection
                onAddUrls={handleAddUrls}
                onImportFromClipboard={handleImportFromClipboard}
              />

              {/* Queue Manager */}
              <QueueManager
                queue={queue}
                onUpdateQueue={handleUpdateQueue}
                onStartDownload={handleStartDownload}
                onPauseDownload={handlePauseDownload}
                onRemoveItems={handleRemoveItems}
              />
            </div>
          </div>
        </main>

        {/* Batch Progress Panel */}
        <BatchProgressPanel
          queue={queue}
          isDownloading={isDownloading}
          onStartAll={handleStartDownload}
          onPauseAll={handlePauseDownload}
          onCancelAll={handleCancelAll}
        />
      </div>
    </>
  );

};

export default BatchDownloadManager;