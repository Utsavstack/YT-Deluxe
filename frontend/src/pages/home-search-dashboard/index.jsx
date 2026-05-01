import { useTranslation } from "react-i18next";import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Header from '../../components/ui/Header';
import SearchBar from './components/SearchBar';
import TrendingHeader from './components/TrendingHeader';
import TrendingSection from './components/TrendingSection';
import SearchResults from './components/SearchResults';
import QuickPreviewModal from './components/QuickPreviewModal';

import YTDeluxeAPI from '../../utils/api';
import { TheInfiniteGrid } from '../../components/ui/the-infinite-grid';
import { useDownloadContext } from '../../context/DownloadContext';

const HomeSearchDashboard = () => {const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isTrendingLoadingMore, setIsTrendingLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('0'); // YT category ID, '0' = All
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);
  const [trendingCursor, setTrendingCursor] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState(null);
  const { addDownload } = useDownloadContext();
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [isTrendingSticky, setIsTrendingSticky] = useState(false);
  const [isTrendingCollapsed, setIsTrendingCollapsed] = useState(false);
  const navigate = useNavigate();

  // YT official category IDs + display names
  const categoryChips = [
    { id: '0',  label: 'All' },
    { id: '10', label: 'Music' },
    { id: '20', label: 'Gaming' },
    { id: '25', label: 'News' },
    { id: '17', label: 'Sports' },
    { id: '1',  label: 'Film' },
  ];
  const categoryLabels = categoryChips.map(c => c.label);

  // Scroll listener for sticky search bar, trending header, and back to top
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  useEffect(() => {
    const onScroll = () => {
      setIsSearchSticky(window.scrollY > 84);
      setIsTrendingSticky(window.scrollY > 164);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Category bar is open by default. User can manually collapse it via the filter icon.


  // Load initial data
  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('ytdeluxe_recent_searches') || '[]');
    setRecentSearches(savedSearches);
    loadTrendingVideos('0');
    const refreshInterval = setInterval(() => loadTrendingVideos(activeCategory), 10 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTrendingVideos = async (categoryId = activeCategory, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsTrendingLoadingMore(true);
      } else {
        setIsTrendingLoading(true);
      }
      
      const currentCursor = isLoadMore ? trendingCursor : 0;
      const response = await YTDeluxeAPI.getTrending(categoryId, 'IN', currentCursor, 18);
      
      if (response.results && response.results.length > 0) {
        if (isLoadMore) {
          setTrendingVideos(prev => {
            // Filter out potential duplicates based on ID
            const existingIds = new Set(prev.map(v => v.id));
            const newUniqueVideos = response.results.filter(v => !existingIds.has(v.id));
            return [...prev, ...newUniqueVideos];
          });
        } else {
          setTrendingVideos(response.results);
        }
        setTrendingCursor(response.next_cursor);
        setHasMoreTrending(response.next_cursor !== -1);
        setLastUpdated(new Date().toISOString());
      } else {
        if (!isLoadMore) setTrendingVideos([]);
        setHasMoreTrending(false);
      }
    } catch (error) {
      console.warn('[Trending] Failed to load:', error);
      if (!isLoadMore) setTrendingVideos([]);
    } finally {
      setIsTrendingLoading(false);
      setIsTrendingLoadingMore(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    if (categoryId === activeCategory) return;
    setActiveCategory(categoryId);
    setTrendingVideos([]);
    setTrendingCursor(0);
    setHasMoreTrending(true);
    loadTrendingVideos(categoryId, false);
  };

  const handleLoadMoreTrending = () => {
    if (isTrendingLoadingMore) return;
    
    // If we temporarily hit -1 (e.g., fetch failed), reset to 0 to try getting a fresh batch
    const nextCursor = trendingCursor === -1 ? 0 : trendingCursor;
    loadTrendingVideos(activeCategory, true);
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

  const handleQuickDownload = (video, format = 'mp4') => {
    const videoUrl = video.url || `https://www.youtube.com/watch?v=${video.originalId || video.id?.split('_')?.[0]}`;
    const dlType = format === 'jpg' ? 'thumbnail' : (format === 'mp3' ? 'audio' : 'video');

    addDownload({
      url: videoUrl,
      quality: format === 'jpg' ? 'Max Resolution' : (format === 'mp4' ? '1080p' : '320kbps'),
      format: format,
      filename: video.title,
      type: dlType,
      thumbnail: video.thumbnail,
      channel: video.channel?.name || '',
    }, {
      title: video.title,
      duration: video.duration,
      channel: video.channel,
      thumbnail: video.thumbnail,
    });
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
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.webp')
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
            <Header isScrolled={isSearchSticky} />


            <main className="pt-20 pb-32 lg:pb-8 px-4 lg:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Search Section */}
                    <div className="mb-8">
                        <motion.div 
                          className="text-center mb-8 mt-[85px]"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{
                            maxHeight: isSearchSticky ? '0px' : '200px',
                            opacity: isSearchSticky ? 0 : 1,
                            overflow: 'hidden',
                            marginBottom: isSearchSticky ? 0 : undefined,
                            transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, margin-bottom 0.3s ease',
                          }}
                        >
                            <h1 className="text-4xl lg:text-5xl allan-bold text-foreground mb-4"> {t("homeSearchDashboard.ytDeluxe")} 

              </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto"> {t("homeSearchDashboard.downloadYoutubeVideosWith")} 


              </p>
                        </motion.div>

                        {/* Sticky SearchBar */}
                        {isSearchSticky && <div className="h-[60px] w-full" />}
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            layout: { type: "spring", stiffness: 250, damping: 30 },
                            opacity: { duration: 0.6, delay: 0.2, ease: "easeOut" },
                            scale: { duration: 0.6, delay: 0.2, ease: "easeOut" }
                          }}
                          className={`
                            ${isSearchSticky
                              ? 'fixed top-[26px] left-0 right-0 z-[105] pointer-events-none flex justify-center'
                              : 'relative'
                            }
                          `}
                        >
                        <motion.div layout transition={{ layout: { type: "spring", stiffness: 250, damping: 30 } }} className={`w-full ${isSearchSticky ? 'max-w-[480px] pointer-events-auto' : 'max-w-3xl mx-auto'}`}>
                        <SearchBar
              onSearch={handleSearch}
              onVoiceSearch={handleVoiceSearch}
              recentSearches={recentSearches}
              onClearRecentSearch={handleClearRecentSearch}
              isSticky={isSearchSticky} />
                        </motion.div>
                        </motion.div>
            
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800">{error}</p>
                      </div>
                    )}

                    {/* Smooth Placeholder for Sticky State */}
                    {isTrendingSticky && (
                      <div className="w-full h-[50px]" />
                    )}
                    
                    <div
                      className={`
                        ${isTrendingSticky
                          ? 'fixed top-[84px] left-0 right-0 z-[104] flex justify-center px-4 lg:px-6 pointer-events-none mb-6'
                          : 'relative overflow-hidden mt-6 mb-8'
                        }
                      `}
                    >
                      <div className={`w-full pointer-events-auto transition-all ${isTrendingSticky ? 'max-w-7xl flex justify-center' : ''}`}>
                          <TrendingHeader
                            onRefresh={() => loadTrendingVideos(activeCategory)}
                            lastUpdated={lastUpdated}
                            isLoading={isTrendingLoading}
                            categories={categoryLabels}
                            activeCategory={categoryChips.find(c => c.id === activeCategory)?.label || 'All'}
                            onCategorySelect={(label) => {
                              const chip = categoryChips.find(c => c.label === label);
                              if (chip) handleCategorySelect(chip.id);
                            }}
                            isSticky={isTrendingSticky}
                            isCollapsed={isTrendingCollapsed}
                            onToggleCollapse={() => setIsTrendingCollapsed(!isTrendingCollapsed)}
                          />
                        </div>
                      </div>

                    {/* Video Cards Grid — this is the only scrolling content */}
                    <div className="space-y-12">
                        <TrendingSection
              videos={trendingVideos}
              onQuickDownload={handleQuickDownload}
              onPreview={handlePreview}
              isLoading={isTrendingLoading}
              onLoadMore={handleLoadMoreTrending}
              isLoadingMore={isTrendingLoadingMore}
              hasMore={hasMoreTrending} />

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
      
            {/* Back to Top Button (Using FAB Styling) */}
            <AnimatePresence>
              {showBackToTop && (
                <div className="fixed bottom-[110px] md:bottom-12 right-6 z-[110] flex flex-col items-end">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center border transition-all duration-300 relative z-50 bg-gradient-to-tr from-primary to-accent border-white/20 text-white shadow-[0_8px_30px_rgba(var(--color-primary-rgb),0.5)] backdrop-blur-md cursor-pointer"
                    title={t("homeSearchDashboard.backToTop", "Back to Top")}
                  >
                    <Icon name="ArrowUp" size={26} strokeWidth={2.5} />
                  </motion.button>
                </div>
              )}
            </AnimatePresence>
        </div>);

};

export default HomeSearchDashboard;
