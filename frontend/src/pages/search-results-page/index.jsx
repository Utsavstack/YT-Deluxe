import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import Header from '../../components/ui/Header';
import QuickPreviewModal from '../home-search-dashboard/components/QuickPreviewModal';
import SearchResultsComponent from '../home-search-dashboard/components/SearchResults';
import SearchBar from '../home-search-dashboard/components/SearchBar';
import YTDeluxeAPI from '../../utils/api';
import { TheInfiniteGrid } from '../../components/ui/the-infinite-grid';
import { useDownloadContext } from '../../context/DownloadContext';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';

const SearchResultsPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';

  // Accumulated results (infinite scroll — never cleared mid-session)
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);       // initial fetch
  const [isLoadingMore, setIsLoadingMore] = useState(false);   // "load more" fetches
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const [previewVideo, setPreviewVideo] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { addDownload } = useDownloadContext();
  const [recentSearches, setRecentSearches] = useState([]);

  // Sticky search bar and back to top state
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const searchBarRef = useRef(null);

  // Guard against duplicate "load more" calls
  const isLoadingMoreRef = useRef(false);
  // Track which query the current accumulated results belong to
  const currentQueryRef = useRef('');

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('ytdeluxe_recent_searches') || '[]');
    setRecentSearches(savedSearches);
  }, []);

  // Scroll listener for sticky behavior and back to top
  useEffect(() => {
    const onScroll = () => {
      setIsSearchSticky(window.scrollY > 84);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Initial search whenever query changes ──────────────────────────────────
  useEffect(() => {
    if (query) {
      // Reset accumulated state for a fresh query
      setSearchResults([]);
      setCurrentPage(1);
      setTotalPages(1);
      setHasMore(false);
      setError(null);
      currentQueryRef.current = query;
      performSearch(query, 1, true);
    } else {
      navigate('/home-search-dashboard');
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const performSearch = async (searchQuery, page = 1, isInitial = false) => {
    if (isInitial) {
      setIsSearching(true);
    } else {
      if (isLoadingMoreRef.current) return;
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
    }

    try {
      const response = await YTDeluxeAPI.smartSearchOrVideo(searchQuery, page);

      // If the user changed query mid-flight, discard stale results
      if (currentQueryRef.current !== searchQuery) return;

      if (response.video) {
        // Direct URL lookup — single result, no pagination
        const video = response.video;
        const transformedResult = {
          ...video,
          id: `${video.id}_url_0`,
          originalId: video.id,
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.webp'),
          url: `https://www.youtube.com/watch?v=${video.id}`
        };
        setSearchResults([transformedResult]);
        setTotalResults(1);
        setTotalPages(1);
        setCurrentPage(1);
        setHasMore(false);

      } else if (response.results && response.results.length > 0) {
        const transformedResults = response.results.map((video, j) => ({
          ...video,
          originalId: video.id,
          id: `${video.id}_search_p${page}_${j}`,
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.webp')
        }));

        if (isInitial) {
          setSearchResults(transformedResults);
        } else {
          setSearchResults(prev => {
            const existingIds = new Set(prev.map(v => v.id));
            const unique = transformedResults.filter(v => !existingIds.has(v.id));
            return [...prev, ...unique];
          });
        }

        const serverTotalResults = response.total_results ?? transformedResults.length;
        const serverTotalPages   = response.total_pages ?? 1;
        const serverPage         = response.page ?? page;

        setTotalResults(serverTotalResults);
        setTotalPages(serverTotalPages);
        setCurrentPage(serverPage);
        setHasMore(serverPage < serverTotalPages);

      } else {
        if (isInitial) {
          setSearchResults([]);
          setTotalResults(0);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
      if (isInitial) {
        setSearchResults([]);
        setTotalResults(0);
      }
      setHasMore(false);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

  // ── "Load more" — called by VirtuosoGrid endReached ───────────────────────
  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasMore) return;
    const nextPage = currentPage + 1;
    if (nextPage > totalPages) return;

    // Keep URL in sync so deep links work
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', nextPage.toString());
    setSearchParams(newParams, { replace: true });

    performSearch(query, nextPage, false);
  }, [currentPage, totalPages, hasMore, query, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreview = (video) => {
    setPreviewVideo(video);
    setIsPreviewOpen(true);
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

  const handleSearch = (newQuery) => {
    if (!newQuery) return;

    const updatedSearches = [newQuery, ...recentSearches.filter((s) => s !== newQuery)].slice(0, 10);
    setRecentSearches(updatedSearches);
    localStorage.setItem('ytdeluxe_recent_searches', JSON.stringify(updatedSearches));

    navigate(`/search-results?q=${encodeURIComponent(newQuery)}`);
  };

  const handleClearRecentSearch = (searchToRemove) => {
    const updatedSearches = recentSearches.filter((search) => search !== searchToRemove);
    setRecentSearches(updatedSearches);
    localStorage.setItem('ytdeluxe_recent_searches', JSON.stringify(updatedSearches));
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <TheInfiniteGrid />
      <Header isScrolled={isSearchSticky} />

      {/* Search Bar Container */}
      <div className="relative z-[90] w-full pt-[110px] pb-4 px-4 lg:px-6 max-w-7xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/home-search-dashboard')}
            className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] shadow-md shadow-primary/20 w-fit"
          >
            <div className="flex items-center justify-center p-1 rounded-full bg-white/20 shadow-inner">
              <Icon name="ArrowLeft" className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </div>
            <span className="font-semibold text-sm tracking-wide">
              {t("videoDetailsDownload.backToHome", "Back to Home")}
            </span>
          </button>
        </div>

        {/* Placeholder to prevent layout shift when SearchBar becomes fixed */}
        {isSearchSticky && <div className="h-[60px] w-full" />}

        <div
          ref={searchBarRef}
          className={`
            transition-all duration-500 ease-in-out pointer-events-none flex justify-center
            ${isSearchSticky
              ? 'fixed top-[26px] left-0 right-0 z-[105]'
              : 'relative w-full'
            }
          `}
        >
          <div className={`transition-all duration-500 w-full pointer-events-auto ${isSearchSticky ? 'max-w-[480px]' : 'max-w-3xl'}`}>
            <SearchBar
              onSearch={handleSearch}
              recentSearches={recentSearches}
              onClearRecentSearch={handleClearRecentSearch}
              isSticky={isSearchSticky}
              initialValue={query}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-32 lg:pb-8 px-4 lg:px-6 pt-4">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <SearchResultsComponent
            results={searchResults}
            searchQuery={query}
            onQuickDownload={handleQuickDownload}
            onPreview={handlePreview}
            isLoading={isSearching}
            totalResults={totalResults}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
          />
        </div>
      </main>

      <QuickPreviewModal
        video={previewVideo}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewVideo(null);
        }}
        onDownload={handleQuickDownload}
      />

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
    </div>
  );
};

export default SearchResultsPage;
