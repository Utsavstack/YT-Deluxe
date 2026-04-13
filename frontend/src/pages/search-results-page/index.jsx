import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import Header from '../../components/ui/Header';
import ProgressNotification from '../../components/ui/ProgressNotification';
import QuickPreviewModal from '../home-search-dashboard/components/QuickPreviewModal';
import FloatingActionButton from '../home-search-dashboard/components/FloatingActionButton';
import SearchResultsComponent from '../home-search-dashboard/components/SearchResults';
import SearchBar from '../home-search-dashboard/components/SearchBar';
import YTDeluxeAPI from '../../utils/api';
import { TheInfiniteGrid } from '../../components/ui/the-infinite-grid';

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
  const [downloads, setDownloads] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('ytdeluxe_recent_searches') || '[]');
    setRecentSearches(savedSearches);
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
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.png'),
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
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.png')
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

  const handleLoadMore = async () => {
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
          thumbnail: video?.thumbnail || (video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : '/assets/images/no_image.png')
        }));

        setSearchResults((prev) => [...prev, ...moreResults]);
        if (offset > 50) {
          setHasMoreResults(false);
        } else {
          setHasMoreResults(true);
        }
      } else {
        setHasMoreResults(false);
      }
    } catch (err) {
      console.error('Load more failed:', err);
      setError('Failed to load more results. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreview = (video) => {
    setPreviewVideo(video);
    setIsPreviewOpen(true);
  };

  // Keep download functionality intact
  const trackDownloadProgress = async (taskId, downloadId) => {
    const progressInterval = setInterval(async () => {
      try {
        const progress = await YTDeluxeAPI.getDownloadProgress(taskId);
        setDownloads((prev) => prev.map((dl) =>
          dl.id === downloadId ? { 
            ...dl, 
            progress: progress.progress || 0,
            status: progress.status || 'downloading',
            filename: progress.filename || dl.filename
          } : dl
        ));
        
        if (progress.status === 'completed' || progress.status === 'error') {
          clearInterval(progressInterval);
        }
      } catch (error) {
        clearInterval(progressInterval);
      }
    }, 1000);
  };

  const handleQuickDownload = async (video, format = 'mp4') => {
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
        throw new Error('No task ID received');
      }
    } catch (err) {
      setDownloads((prev) => prev.map((dl) =>
        dl.id === downloadId ? { ...dl, status: 'error', error: err.message } : dl
      ));
      setError('Download failed. Please try again.');
    }
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
      <Header />
      {downloads.length > 0 && <ProgressNotification downloads={downloads} />}

      <main className="pt-20 pb-32 lg:pb-8 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-8">
            <SearchBar
              onSearch={handleSearch}
              recentSearches={recentSearches}
              onClearRecentSearch={handleClearRecentSearch} 
            />
          </div>

          <div className="space-y-12">
            <SearchResultsComponent
              results={searchResults}
              searchQuery={query}
              onQuickDownload={handleQuickDownload}
              onPreview={handlePreview}
              isLoading={isSearching}
              onLoadMore={handleLoadMore}
              hasMore={hasMoreResults}
              totalResults={totalResults} 
            />
          </div>
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
