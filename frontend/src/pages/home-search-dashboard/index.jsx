import { useTranslation } from "react-i18next";import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProgressNotification from '../../components/ui/ProgressNotification';
import SearchBar from './components/SearchBar';
import TrendingSection from './components/TrendingSection';
import SearchResults from './components/SearchResults';
import QuickPreviewModal from './components/QuickPreviewModal';
import FloatingActionButton from './components/FloatingActionButton';

import YTDeluxeAPI from '../../utils/api';
import { TheInfiniteGrid } from '../../components/ui/the-infinite-grid';

const HomeSearchDashboard = () => {const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isTrendingLoadingMore, setIsTrendingLoadingMore] = useState(false);
  const [trendingKeywordIndex, setTrendingKeywordIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const navigate = useNavigate();

  // Mock trending videos data (fallback when API is not available)
  const mockTrendingVideos = [
  {
    id: 'trend1',
    title: 'React 18 Complete Tutorial - Build Modern Web Apps',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    duration: 3600,
    views: 1250000,
    uploadDate: '2024-01-15T10:00:00Z',
    quality: 'HD',
    channel: {
      name: 'TechMaster Pro',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      verified: true
    },
    likes: 45000,
    dislikes: 1200,
    tags: ['react', 'javascript', 'tutorial'],
    description: `Learn React 18 from scratch with this comprehensive tutorial. We'll cover all the new features including concurrent rendering, automatic batching, and Suspense improvements.`
  },
  {
    id: 'trend2',
    title: 'JavaScript ES2024 New Features You Must Know',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop',
    duration: 1800,
    views: 890000,
    uploadDate: '2024-01-20T14:30:00Z',
    quality: '4K',
    channel: {
      name: 'CodeWithSarah',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
      verified: true
    },
    likes: 32000,
    dislikes: 800,
    tags: ['javascript', 'es2024', 'features'],
    description: `Explore the latest JavaScript ES2024 features that will revolutionize how you write modern JavaScript code.`
  },
  {
    id: 'trend3',
    title: 'CSS Grid vs Flexbox - When to Use Which?',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop',
    duration: 1200,
    views: 650000,
    uploadDate: '2024-01-25T09:15:00Z',
    quality: 'HD',
    channel: {
      name: 'DesignGuru',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      verified: false
    },
    likes: 28000,
    dislikes: 500,
    tags: ['css', 'grid', 'flexbox'],
    description: `Master CSS layout with this comprehensive comparison between CSS Grid and Flexbox. Learn when to use each approach.`
  }];


  // Rotating trending keywords for variety across multiple categories
  const trendingKeywords = [
  'trending music India',
  'trending news',
  'trending in education',
  'comedy video trending',
  'entertainment viral today',
  'tech news trending',
  'finance India today',
  'viral India today',
  'top trending songs',
  'latest viral shorts',
  'gaming trending India',
  'sports highlights trending',
  'recipe cooking trending'];


  // Prepare categories for the chips (All + keywords)
  const categoryChips = ["All", "Music", "News", "Education", "Comedy", "Entertainment", "Tech", "Finance", "Viral", "Songs", "Shorts", "Gaming", "Sports", "Cooking"];

  // Mapping display category to actual search keyword
  const categoryToKeywordMap = {
    "All": "trending", // Special case, handled by rotating
    "Music": "trending music India",
    "News": "trending news",
    "Education": "trending in education",
    "Comedy": "comedy video trending",
    "Entertainment": "entertainment viral today",
    "Tech": "tech news trending",
    "Finance": "finance India today",
    "Viral": "viral India today",
    "Songs": "top trending songs",
    "Shorts": "latest viral shorts",
    "Gaming": "gaming trending India",
    "Sports": "sports highlights trending",
    "Cooking": "recipe cooking trending"
  };

  // Rotate keyword based on current 5-minute window so each session feels fresh
  const getRotatingKeyword = (offset = 0) => {
    const slotIndex = (Math.floor(Date.now() / (5 * 60 * 1000)) + offset) % trendingKeywords.length;
    return trendingKeywords[slotIndex];
  };
  // Load initial data
  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = JSON.parse(localStorage.getItem('ytdeluxe_recent_searches') || '[]');
    setRecentSearches(savedSearches);

    // Load trending videos immediately
    loadTrendingVideos();

    // Auto-refresh trending every 5 minutes
    const refreshInterval = setInterval(() => {
      loadTrendingVideos();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval); // Cleanup on unmount
  }, [activeCategory]);

  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const loadTrendingVideos = async (category = activeCategory) => {
    try {
      setIsTrendingLoading(true);
      setTrendingKeywordIndex(0);
      setHasMoreTrending(true);

      if (category === "All") {
        // Fetch 3 random categories and mix them up
        const randomKeywords = [...trendingKeywords].sort(() => 0.5 - Math.random()).slice(0, 3);
        console.log('[Trending] Using mixed keywords for All:', randomKeywords);

        const responses = await Promise.all(
          randomKeywords.map((kw) => YTDeluxeAPI.searchVideos(kw).catch(() => ({ results: [] })))
        );

        let mixedResults = [];
        responses.forEach((res, i) => {
          if (res.results) {
            mixedResults = [...mixedResults, ...res.results.map((v, j) => ({ ...v, originalId: v.id, id: `${v.id}_all_0_${i}_${j}` }))];
          }
        });

        mixedResults = shuffleArray(mixedResults);

        if (mixedResults.length > 0) {
          const normalizedResults = mixedResults.map((v) => ({
            ...v,
            thumbnail: v?.thumbnail || (v?.originalId ? `https://i.ytimg.com/vi/${v.originalId}/hqdefault.jpg` : '/assets/images/no_image.png')
          }));
          setTrendingVideos(normalizedResults);
          setLastUpdated(new Date().toISOString());
        } else {
          setTrendingVideos(shuffleArray(mockTrendingVideos.map((v) => ({ ...v, thumbnail: v?.thumbnail || '/assets/images/no_image.png' }))));
        }
      } else {
        // specific category
        const keyword = categoryToKeywordMap[category] || category;
        console.log('[Trending] Using keyword:', keyword, 'for category:', category);
        const response = await YTDeluxeAPI.searchVideos(keyword);

        if (response.results && response.results.length > 0) {
          const normalizedResults = response.results.map((v, j) => {
            return {
              ...v,
              originalId: v.id,
              id: `${v.id}_cat_0_${j}`,
              thumbnail: v?.thumbnail || (v?.id ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : '/assets/images/no_image.png')
            };
          });
          setTrendingVideos(normalizedResults);
          setLastUpdated(new Date().toISOString());
        } else {
          setTrendingVideos(mockTrendingVideos.map((v) => ({ ...v, thumbnail: v?.thumbnail || '/assets/images/no_image.png' })));
        }
      }
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      setTrendingVideos(mockTrendingVideos.map((v) => ({ ...v, thumbnail: v?.thumbnail || '/assets/images/no_image.png' })));
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    if (category === activeCategory) return;
    setActiveCategory(category);
    setTrendingVideos([]); // Clear current videos immediately for UX
    loadTrendingVideos(category);
  };

  const handleLoadMoreTrending = async () => {
    if (isTrendingLoadingMore || !hasMoreTrending) return;

    setIsTrendingLoadingMore(true);
    try {
      let nextIndex = trendingKeywordIndex + 1;
      let newResults = [];

      if (activeCategory === "All") {
        // Fetch another 3 random categories
        const randomKeywords = [...trendingKeywords].sort(() => 0.5 - Math.random()).slice(0, 3);
        console.log('[Trending] Loading more mixed keywords for All:', randomKeywords);

        const responses = await Promise.all(
          randomKeywords.map((kw) => YTDeluxeAPI.searchVideos(kw).catch(() => ({ results: [] })))
        );

        responses.forEach((res, i) => {
          if (res.results) {
            newResults = [...newResults, ...res.results.map((v, j) => ({ ...v, originalId: v.id, id: `${v.id}_all_${nextIndex}_${i}_${j}` }))];
          }
        });

        newResults = shuffleArray(newResults);
      } else {
        // Specific category infinite scroll - append modifiers to hit different pages
        const modifiers = ["latest", "viral", "top", "new", "2024", "best videos"];
        const modifier = modifiers[nextIndex % modifiers.length];
        const baseKeyword = categoryToKeywordMap[activeCategory] || activeCategory;
        const keyword = `${baseKeyword} ${modifier}`;

        console.log('[Trending] Loading more with specific keyword:', keyword);
        const response = await YTDeluxeAPI.searchVideos(keyword);
        if (response.results) {
          newResults = response.results.map((v, j) => ({ ...v, originalId: v.id, id: `${v.id}_cat_${nextIndex}_${j}` }));
        }
      }

      if (newResults.length > 0) {
        const normalizedResults = newResults.map((v) => {
          return {
            ...v,
            thumbnail: v?.thumbnail || (v?.originalId ? `https://i.ytimg.com/vi/${v.originalId}/hqdefault.jpg` : '/assets/images/no_image.png')
          };
        });
        setTrendingVideos((prev) => [...prev, ...normalizedResults]);
        setTrendingKeywordIndex(nextIndex);
        setLastUpdated(new Date().toISOString());

        // Stop if we've cycled enough batches
        if (nextIndex >= 10) {
          setHasMoreTrending(false);
        }
      } else {
        setHasMoreTrending(false);
      }
    } catch (error) {
      console.error('Failed to load more trending videos:', error);
      setHasMoreTrending(false);
    } finally {
      setIsTrendingLoadingMore(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query) return;
    
    // Save search to recent searches
    const updatedSearches = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 10);
    setRecentSearches(updatedSearches);
    localStorage.setItem('ytdeluxe_recent_searches', JSON.stringify(updatedSearches));

    // Navigate to the new isolated Search Results page
    navigate(`/search-results?q=${encodeURIComponent(query)}`);
  };

  const handleVoiceSearch = () => {
    // Voice search implementation would go here
    console.log('Voice search activated');
  };

  const handleClearRecentSearch = (searchToRemove) => {
    const updatedSearches = recentSearches.filter((search) => search !== searchToRemove);
    setRecentSearches(updatedSearches);
    localStorage.setItem('ytdeluxe_recent_searches', JSON.stringify(updatedSearches));
  };

  const trackDownloadProgress = async (taskId, downloadId) => {
    const progressInterval = setInterval(async () => {
      try {
        const progress = await YTDeluxeAPI.getDownloadProgress(taskId);

        setDownloads((prev) => prev.map((dl) =>
        dl.id === downloadId ?
        {
          ...dl,
          progress: progress.progress || 0,
          status: progress.status || 'downloading',
          filename: progress.filename || dl.filename,
          error: progress.error || null,
          speed: progress.speed || 0,
          timeRemaining: progress.eta || 0,
          downloaded_bytes: progress.downloaded_bytes || 0,
          total_bytes: progress.total_bytes || 0,
          filepath: progress.filepath || dl.filepath
        } :
        dl
        ));

        if (progress.status === 'completed' || progress.status === 'error') {
          clearInterval(progressInterval);

          if (progress.status === 'completed' && progress.filename) {
            const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;
            if (!isDesktop) {
              // Trigger browser download for web version
              const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/tempfiles/${encodeURIComponent(progress.filename)}`;
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = downloadUrl;
              a.download = progress.filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          }
        }
      } catch (error) {
        console.error('Progress tracking failed:', error);
        clearInterval(progressInterval);
      }
    }, 1000);
  };

  const handleQuickDownload = async (video, format = 'mp4') => {
    console.log('Starting quick download for:', video.title, 'Format:', format);
    
    const downloadId = Date.now() + Math.random();
    const newDownload = {
      id: downloadId,
      filename: `${video.title || 'video'}.${format}`,
      title: video.title,
      type: format === 'jpg' ? 'thumbnail' : (format === 'mp3' ? 'audio' : 'video'),
      progress: 0,
      status: 'pending',
      thumbnail: video.thumbnail
    };

    setDownloads((prev) => [...prev, newDownload]);

    try {
      const apiConfig = {
        url: video.url || `https://www.youtube.com/watch?v=${video.originalId || video.id?.split('_')?.[0]}`,
        quality: format === 'jpg' ? 'Max Resolution' : (format === 'mp4' ? '1080p' : '320kbps'),
        format: format,
        rename: video.title,
        type: newDownload.type
      };

      const response = await YTDeluxeAPI.downloadVideo(apiConfig);

      if (response.task_id) {
        trackDownloadProgress(response.task_id, downloadId);
      } else {
        throw new Error('No task ID received from server');
      }

    } catch (error) {
      console.error('Quick download failed:', error);
      setDownloads((prev) => prev.map((dl) =>
        dl.id === downloadId ? { ...dl, status: 'error', error: error.message } : dl
      ));
      setError('Download failed. Please try again.');
    }
  };

  const handlePreview = (video) => {
    setPreviewVideo(video);
    setIsPreviewOpen(true);
  };

  const handleLoadMore = async () => {
    setIsSearching(true);

    try {
      const response = await YTDeluxeAPI.searchVideos(searchQuery);

      if (response.results && response.results.length > 0) {
        const offset = searchResults.length;
        const moreResults = response.results.map((video, j) => ({
          ...video,
          originalId: video.id,
          id: `${video.id}_search_page_${offset}_${j}`,
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.png')
        }));

        setSearchResults((prev) => [...prev, ...moreResults]);
        // Stop infinite scroll if we keep pulling duplicate 12 limit items for now, or assume we have 6 cycles
        if (offset > 50) {
          setHasMoreResults(false);
        } else {
          setHasMoreResults(true);
        }
      } else {
        setHasMoreResults(false);
      }

    } catch (error) {
      console.error('Load more failed:', error);
      setError('Failed to load more results. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
            <TheInfiniteGrid />
            <Header />
            {downloads.length > 0 && <ProgressNotification downloads={downloads} />}

            <main className="pt-20 pb-32 lg:pb-8 px-4 lg:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Search Section */}
                    <div className="mb-12">
                        <motion.div 
                          className="text-center mb-8 mt-[85px]"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <h1 className="text-4xl lg:text-5xl allan-bold text-foreground mb-4"> {t("homeSearchDashboard.ytDeluxe")} 

              </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto"> {t("homeSearchDashboard.downloadYoutubeVideosWith")} 


              </p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        >
                        <SearchBar
              onSearch={handleSearch}
              onVoiceSearch={handleVoiceSearch}
              recentSearches={recentSearches}
              onClearRecentSearch={handleClearRecentSearch} />
                        </motion.div>
            
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800">{error}</p>
                      </div>
                    )}

                    {/* Content Section */}
                    <div className="space-y-12">
                        <TrendingSection
              videos={trendingVideos}
              onQuickDownload={handleQuickDownload}
              onPreview={handlePreview}
              isLoading={isTrendingLoading}
              onRefresh={() => loadTrendingVideos(activeCategory)}
              lastUpdated={lastUpdated}
              onLoadMore={handleLoadMoreTrending}
              isLoadingMore={isTrendingLoadingMore}
              hasMore={hasMoreTrending}
              categories={categoryChips}
              activeCategory={activeCategory}
              onCategorySelect={handleCategorySelect} />

                    </div>
                </div>
            </main>

            {/* Quick Preview Modal */}
            <QuickPreviewModal
        video={previewVideo}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewVideo(null);
        }}
        onDownload={handleQuickDownload} />
      

            {/* Floating Action Button */}
            <FloatingActionButton />
        </div>);

};

export default HomeSearchDashboard;
