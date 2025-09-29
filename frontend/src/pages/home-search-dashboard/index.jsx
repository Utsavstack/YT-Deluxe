import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProgressNotification from '../../components/ui/ProgressNotification';
import SearchBar from './components/SearchBar';
import TrendingSection from './components/TrendingSection';
import SearchResults from './components/SearchResults';
import QuickPreviewModal from './components/QuickPreviewModal';
import FloatingActionButton from './components/FloatingActionButton';
import BackgroundShapes from './components/BackgroundShapes';
import YTDeluxeAPI from '../../utils/api';

const HomeSearchDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState(null);
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
    }
  ];

  // Load initial data
  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = JSON.parse(localStorage.getItem('ytdeluxe_recent_searches') || '[]');
    setRecentSearches(savedSearches);

    // Load trending videos (try API first, fallback to mock)
    loadTrendingVideos();
  }, []);

  const loadTrendingVideos = async () => {
    try {
      // Try to get trending videos from API
      const response = await YTDeluxeAPI.searchVideos('trending');
      if (response.results && response.results.length > 0) {
        setTrendingVideos(response.results);
      } else {
        // Fallback to mock data
        setTrendingVideos(mockTrendingVideos);
      }
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      setTrendingVideos(mockTrendingVideos);
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    setSearchResults([]);
    setError(null);

    try {
      // Save search to recent searches
      const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updatedSearches);
      localStorage.setItem('ytdeluxe_recent_searches', JSON.stringify(updatedSearches));

      // Use smart search (keyword or URL)
      const response = await YTDeluxeAPI.smartSearchOrVideo(query);

      if (response.video) {
        // If a single video is returned (from URL), show as single result
        const video = response.video;
        const transformedResult = {
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          duration: video.duration,
          views: Math.floor(Math.random() * 1000000) + 10000, // Mock views
          uploadDate: new Date().toISOString(),
          quality: 'HD',
          channel: {
            name: video.uploader || 'Unknown Channel',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
            verified: false
          },
          likes: Math.floor(Math.random() * 50000) + 1000,
          dislikes: Math.floor(Math.random() * 1000) + 100,
          tags: [query.toLowerCase(), 'tutorial', 'guide'],
          description: video.description || `Learn about ${query} with this comprehensive tutorial.`,
          url: `https://www.youtube.com/watch?v=${video.id}`
        };
        setSearchResults([transformedResult]);
        setTotalResults(1);
        setHasMoreResults(false);
      } else if (response.results && response.results.length > 0) {
        // Transform API results to match our component expectations
        const transformedResults = response.results.map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          duration: video.duration,
          views: Math.floor(Math.random() * 1000000) + 10000, // Mock views
          uploadDate: new Date().toISOString(), // Mock upload date
          quality: 'HD',
          channel: {
            name: video.uploader || 'Unknown Channel',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
            verified: false
          },
          likes: Math.floor(Math.random() * 50000) + 1000,
          dislikes: Math.floor(Math.random() * 1000) + 100,
          tags: [query.toLowerCase(), 'tutorial', 'guide'],
          description: video.description || `Learn about ${query} with this comprehensive tutorial.`,
          url: video.url
        }));

        setSearchResults(transformedResults);
        setTotalResults(transformedResults.length);
        setHasMoreResults(transformedResults.length > 9);
      } else {
        // Fallback to mock search results
        const mockResults = mockTrendingVideos
          .filter(video => 
            video.title.toLowerCase().includes(query.toLowerCase()) ||
            video.channel.name.toLowerCase().includes(query.toLowerCase()) ||
            video.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
          )
          .map(video => ({
            ...video,
            id: `search_${video.id}_${Date.now()}`,
            views: video.views + Math.floor(Math.random() * 100000),
            uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          }));

        setSearchResults(mockResults);
        setTotalResults(mockResults.length);
        setHasMoreResults(mockResults.length > 9);
      }

    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
      setSearchResults([]);
      setTotalResults(0);
      setHasMoreResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVoiceSearch = () => {
    // Voice search implementation would go here
    console.log('Voice search activated');
  };

  const handleClearRecentSearch = (searchToRemove) => {
    const updatedSearches = recentSearches.filter(search => search !== searchToRemove);
    setRecentSearches(updatedSearches);
    localStorage.setItem('ytdeluxe_recent_searches', JSON.stringify(updatedSearches));
  };

  const handleQuickDownload = async (video) => {
    try {
      console.log('Starting quick download for:', video.title);
      
      // Navigate to video details page with video data
      navigate('/video-details-download', { 
        state: { video, autoDownload: true } 
      });
      
    } catch (error) {
      console.error('Quick download failed:', error);
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
      // For now, we'll simulate loading more results
      // In a real implementation, you'd make another API call with pagination
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const moreResults = Array.from({ length: 6 }, (_, index) => ({
        id: `more_${searchResults.length + index}_${Date.now()}`,
        title: `${searchQuery} - Extended Tutorial ${searchResults.length + index + 1}`,
        thumbnail: `https://images.unsplash.com/photo-${1600000000000 + index}?w=400&h=225&fit=crop`,
        duration: 1200 + Math.floor(Math.random() * 2400),
        views: Math.floor(Math.random() * 300000) + 25000,
        uploadDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        quality: Math.random() > 0.3 ? 'HD' : '4K',
        channel: {
          name: `Advanced${searchQuery}${index + 1}`,
          avatar: `https://images.unsplash.com/photo-${1300000000000 + index}?w=40&h=40&fit=crop&crop=face`,
          verified: Math.random() > 0.6
        },
        likes: Math.floor(Math.random() * 15000) + 500,
        dislikes: Math.floor(Math.random() * 800) + 50,
        tags: [searchQuery.toLowerCase(), 'advanced', 'tutorial'],
        description: `Advanced ${searchQuery} concepts and techniques for experienced developers looking to level up their skills.`
      }));
      
      setSearchResults(prev => [...prev, ...moreResults]);
      setHasMoreResults(searchResults.length + moreResults.length < totalResults - 20);
      
    } catch (error) {
      console.error('Load more failed:', error);
      setError('Failed to load more results. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BackgroundShapes />
      <Header />
      {/* ProgressNotification will only be shown when downloads are active */}
      
      <main className="pt-20 pb-8 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Search Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                YT Deluxe
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Download YouTube videos with premium quality and advanced features. 
                Search, preview, and download in multiple formats.
              </p>
            </div>
            
            <SearchBar
              onSearch={handleSearch}
              onVoiceSearch={handleVoiceSearch}
              recentSearches={recentSearches}
              onClearRecentSearch={handleClearRecentSearch}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Content Section */}
          <div className="space-y-12">
            {searchQuery && searchResults.length >= 0 ? (
              <SearchResults
                results={searchResults}
                searchQuery={searchQuery}
                onQuickDownload={handleQuickDownload}
                onPreview={handlePreview}
                isLoading={isSearching}
                onLoadMore={handleLoadMore}
                hasMore={hasMoreResults}
                totalResults={totalResults}
              />
            ) : (
              <TrendingSection
                videos={trendingVideos}
                onQuickDownload={handleQuickDownload}
                onPreview={handlePreview}
                isLoading={isTrendingLoading}
              />
            )}
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
        onDownload={handleQuickDownload}
      />

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
};

export default HomeSearchDashboard;