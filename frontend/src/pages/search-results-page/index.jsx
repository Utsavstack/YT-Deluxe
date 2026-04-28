import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import Header from '../../components/ui/Header';
import QuickPreviewModal from '../home-search-dashboard/components/QuickPreviewModal';
import FloatingActionButton from '../home-search-dashboard/components/FloatingActionButton';
import SearchResultsComponent from '../home-search-dashboard/components/SearchResults';
import SearchBar from '../home-search-dashboard/components/SearchBar';
import YTDeluxeAPI from '../../utils/api';
import { TheInfiniteGrid } from '../../components/ui/the-infinite-grid';
import { useDownloadContext } from '../../context/DownloadContext';

const SearchResultsPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState(null);

  const [previewVideo, setPreviewVideo] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { addDownload } = useDownloadContext();
  const [recentSearches, setRecentSearches] = useState([]);

  // Sticky search bar state
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const searchBarRef = useRef(null);

  // IntersectionObserver sentinel ref
  const sentinelRef = useRef(null);

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('ytdeluxe_recent_searches') || '[]');
    setRecentSearches(savedSearches);
  }, []);

  // Scroll listener for sticky behavior
  useEffect(() => {
    const onScroll = () => {
      setIsSearchSticky(window.scrollY > 84);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      navigate('/home-search-dashboard');
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    setIsSearching(true);
    setSearchResults([]);
    setError(null);

    try {
      const response = await YTDeluxeAPI.smartSearchOrVideo(searchQuery);

      if (response.video) {
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
        setHasMoreResults(false);
      } else if (response.results && response.results.length > 0) {
        const transformedResults = response.results.map((video, j) => ({
          ...video,
          originalId: video.id,
          id: `${video.id}_search_0_${j}`,
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.webp')
        }));

        setSearchResults(transformedResults);
        setTotalResults(transformedResults.length > 0 ? Math.floor(Math.random() * 50000) + 1000 : 0);
        setHasMoreResults(transformedResults.length >= 10);
      } else {
        setSearchResults([]);
        setTotalResults(0);
        setHasMoreResults(false);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
      setSearchResults([]);
      setTotalResults(0);
      setHasMoreResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (isSearching || !hasMoreResults) return;
    setIsSearching(true);

    try {
      const response = await YTDeluxeAPI.searchVideos(query);
      if (response.results && response.results.length > 0) {
        const offset = searchResults.length;
        const moreResults = response.results.map((video, j) => ({
          ...video,
          originalId: video.id,
          id: `${video.id}_search_page_${offset}_${j}`,
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.webp')
        }));

        setSearchResults((prev) => [...prev, ...moreResults]);
        setHasMoreResults(offset <= 50);
      } else {
        setHasMoreResults(false);
      }
    } catch (err) {
      console.error('Load more failed:', err);
      setError('Failed to load more results. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [isSearching, hasMoreResults, query, searchResults.length]);

  // IntersectionObserver — auto-load when sentinel enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreResults && !isSearching) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [hasMoreResults, isSearching, handleLoadMore]);

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
            onLoadMore={handleLoadMore}
            hasMore={hasMoreResults}
            totalResults={totalResults}
            sentinelRef={sentinelRef}
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

      <FloatingActionButton />
    </div>
  );
};

export default SearchResultsPage;
