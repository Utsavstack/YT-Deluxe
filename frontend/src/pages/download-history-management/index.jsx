import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import HistoryCard from './components/HistoryCard';
import FilterBar from './components/FilterBar';
import StorageUsage, { StorageStatsBox } from './components/StorageUsage';
import { FileTypeBreakdown } from './components/FileTypeBreakdown';
import BulkActions from './components/BulkActions';
import TabNavigation from './components/TabNavigation';
import EmptyState from './components/EmptyState';
import ConfirmationModal from './components/ConfirmationModal';
import YTDeluxeAPI from '../../utils/api';
import dataCache, { CacheKey, TTL } from '../../utils/dataCache';
import ShareModal from '../../components/ui/ShareModal';
import UndoToast from '../../components/ui/UndoToast';
import { useDownloadContext } from '../../context/DownloadContext';
import Icon from '../../components/AppIcon';

const CHUNK_SIZE = 20; // Items to render per batch

const TopCardsSkeleton = () => (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full items-stretch">
    {[1, 2, 3].map((i) => (
      <div key={i} className="w-full h-full min-h-[300px]">
        <div className="bg-white/50 dark:bg-black/20 rounded-[2rem] border border-slate-200/50 dark:border-white/5 p-6 md:p-8 w-full h-full shadow-sm flex flex-col animate-pulse">
          {/* Header */}
          <div className="flex items-center mb-5 space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="w-32 h-5 rounded-md bg-slate-200 dark:bg-white/10" />
          </div>
          {/* Inner Content Container */}
          <div className="flex-1 p-4 bg-slate-100 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="w-16 h-6 rounded-full bg-slate-200/60 dark:bg-white/5" />
                <div className="w-32 h-6 rounded-full bg-slate-200/60 dark:bg-white/5" />
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200/60 dark:bg-white/5 mb-6" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="w-full h-16 rounded-xl bg-slate-200/60 dark:bg-white/5" />
              <div className="w-full h-16 rounded-xl bg-slate-200/60 dark:bg-white/5" />
              <div className="w-full h-16 rounded-xl bg-slate-200/60 dark:bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const HistoryCardSkeleton = () => (
  <div className="bg-white/90 dark:bg-[#1e1e1e]/80 rounded-[24px] border border-black/10 dark:border-white/10 p-4 animate-pulse h-[114px]">
    <div className="flex items-start gap-4 h-full">
      {/* Thumbnail */}
      <div className="w-32 h-20 rounded-2xl bg-slate-200 dark:bg-white/5 flex-shrink-0" />
      
      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between h-20">
        <div>
          <div className="w-3/4 h-4 rounded-md bg-slate-200 dark:bg-white/10 mb-2.5" />
          <div className="w-1/2 h-3 rounded-md bg-slate-200/60 dark:bg-white/5" />
        </div>
        
        {/* Footer badges */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-12 h-4 rounded-md bg-slate-200/60 dark:bg-white/5" />
            <div className="w-10 h-4 rounded-md bg-slate-200/60 dark:bg-white/5" />
            <div className="w-14 h-4 rounded-md bg-slate-200/60 dark:bg-white/5" />
          </div>
          <div className="w-24 h-4 rounded-full bg-slate-200/60 dark:bg-white/5" />
        </div>
      </div>
    </div>
  </div>
);

const DownloadHistoryManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('downloadDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    format: '',
    quality: '',
    dateRange: '',
    channel: ''
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null, title: '', message: '' });

  // ── Lazy initializers: read cache synchronously so first render is never blank ──
  const [isLoading, setIsLoading] = useState(() => !dataCache.has(CacheKey.history()));
  const [downloadHistory, setDownloadHistory] = useState(() => {
    const cached = dataCache.get(CacheKey.history());
    return cached ? cached.history : [];
  });
  const [storageStats, setStorageStats] = useState(() => {
    const cached = dataCache.get(CacheKey.history());
    return cached ? cached.storageStats : { totalSize: 0, availableSpace: 0, itemCount: 0 };
  });
  const [error, setError] = useState(null);
  
  // Share & Undo State
  const [shareData, setShareData] = useState({ isOpen: false, url: '', title: '' });
  const [undoState, setUndoState] = useState({ isOpen: false, items: [], message: '', timerId: null });
  const undoRef = useRef(null);

  // Re-download progress tracking
  const [activeDownloads, setActiveDownloads] = useState([]);

  // ── Incremental rendering: avoids blocking the main thread on page open ──
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;
  const { addDownload } = useDownloadContext();

  useEffect(() => {
    const cached = dataCache.has(CacheKey.history());
    if (cached) {
      // Cache available: silently refresh in background, no loading state
      fetchAndCacheHistory({ silent: true });
    } else {
      // First ever visit: fetch with loading spinner
      fetchAndCacheHistory({ silent: false });
    }
    return () => {
      if (undoRef.current) clearTimeout(undoRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core fetch helper: fetches both APIs in parallel, transforms, caches ──
  const fetchAndCacheHistory = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const dlPath = localStorage.getItem('ytdeluxe_download_path');

      // Parallel fetch: history + storage in one round-trip
      const [response, storageData] = await Promise.all([
        YTDeluxeAPI.getDownloadHistory(),
        YTDeluxeAPI.getStorageInfo(dlPath).catch(() => null),
      ]);

      if (response.history && response.history.length > 0) {
        const transformed = response.history.map((item, idx) => ({
          id: item.id || `hist_${idx}`,
          title: item.title,
          filename: item.filename,
          filepath: item.filepath,
          url: item.url || '',
          channel: item.channel || '',
          thumbnail: item.thumbnail || '',
          duration: item.duration || 0,
          format: item.format || 'mp4',
          quality: item.quality || '720p',
          fileSize: item.file_size || 0,
          downloadDate: item.downloaded_at ? new Date(item.downloaded_at) : new Date(),
          tags: item.tags || [],
          type: item.type || 'all',
          trim_start: item.trim_start ?? null,
          trim_end: item.trim_end ?? null,
          format_id: item.format_id || null,
          audio_format_id: item.audio_format_id || null,
          // Preserve file_exists flag from backend smart-recovery:
          //   true  = file found on disk
          //   false = file missing (drive removed / deleted)
          //   null  = web-mode entry, no local file
          file_exists: item.file_exists ?? null,
        }));

        const totalSize = transformed.reduce((sum, item) => sum + item.fileSize, 0);
        const newStorageStats = storageData
          ? { totalSize, availableSpace: storageData.free, itemCount: transformed.length }
          : { totalSize, availableSpace: 0, itemCount: transformed.length };

        // Update UI
        setDownloadHistory(transformed);
        setStorageStats(newStorageStats);

        // Save to cache (no TTL = lives until explicitly invalidated)
        dataCache.set(CacheKey.history(), { history: transformed, storageStats: newStorageStats }, TTL.HISTORY);

      } else {
        // Web Mode fallback: localStorage history
        const localHistory = JSON.parse(localStorage.getItem('ytdeluxe_web_history') || '[]');
        const transformed = localHistory.map((item) => ({
          ...item,
          downloadDate: new Date(item.downloadDate || Date.now())
        }));
        setDownloadHistory(transformed);
        const totalSize = transformed.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        setStorageStats({ totalSize, availableSpace: 10 * 1024 * 1024 * 1024, itemCount: transformed.length });
      }
    } catch (error) {
      console.error(error);
      if (!silent) setError('Failed to load download history.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };


  const filteredAndSortedData = useMemo(() => {
    if (activeTab === 'saved') {
      let savedItems = [];
      try {
        const list = JSON.parse(localStorage.getItem('ytdeluxe_saved') || '[]');
        savedItems = list.map((item) => ({
          id: item.id,
          title: item.title,
          channel: item.channel || '',
          thumbnail: item.thumbnail,
          duration: item.duration || 0,
          format: '-',
          quality: item.quality || '-',
          fileSize: 0,
          downloadDate: new Date(item.savedAt || Date.now()),
          tags: [],
          type: 'saved',
          url: item.url,
          views: item.views,
          uploadDate: item.uploadDate
        }));
      } catch {}
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        savedItems = savedItems.filter((item) =>
          item.title?.toLowerCase().includes(query) ||
          item.channel?.toLowerCase().includes(query)
        );
      }
      return savedItems;
    }

    let filtered = [...downloadHistory];

    // Exclude entries where the file is confirmed missing from disk.
    filtered = filtered.filter((item) => item.file_exists !== false);

    if (activeTab !== 'all') {
      filtered = filtered.filter((item) => item.type === activeTab);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title?.toLowerCase().includes(query) ||
        item.channel?.toLowerCase().includes(query) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filters.format) {
      filtered = filtered.filter((item) => item.format === filters.format);
    }
    if (filters.quality) {
      filtered = filtered.filter((item) => item.quality === filters.quality);
    }
    if (filters.channel) {
      filtered = filtered.filter((item) =>
        item.channel?.toLowerCase().includes(filters.channel.toLowerCase())
      );
    }
    if (filters.dateRange) {
      const filterDate = new Date();
      switch (filters.dateRange) {
        case 'today': filterDate.setHours(0, 0, 0, 0); break;
        case 'week': filterDate.setDate(filterDate.getDate() - 7); break;
        case 'month': filterDate.setMonth(filterDate.getMonth() - 1); break;
        case 'year': filterDate.setFullYear(filterDate.getFullYear() - 1); break;
        default: filterDate.setTime(0);
      }
      filtered = filtered.filter((item) => item.downloadDate >= filterDate);
    }

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      if (sortBy === 'downloadDate') {
        aValue = new Date(aValue); bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase(); bValue = bValue.toLowerCase();
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    return filtered;
  }, [downloadHistory, activeTab, searchQuery, filters, sortBy, sortOrder]);

  // ── Reset visible count whenever filters/sort/tab change ──
  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [activeTab, searchQuery, filters, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Incrementally render remaining items in background frames ──
  useEffect(() => {
    if (visibleCount >= filteredAndSortedData.length) return;
    const raf = requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredAndSortedData.length));
    });
    return () => cancelAnimationFrame(raf);
  }, [visibleCount, filteredAndSortedData.length]);

  const tabCounts = useMemo(() => {
    let savedCount = 0;
    try {
      savedCount = JSON.parse(localStorage.getItem('ytdeluxe_saved') || '[]').length;
    } catch {}
    return {
      all: downloadHistory.filter(i => i.file_exists !== false).length,
      saved: savedCount
    };
  }, [downloadHistory]);

  const handleItemSelect = useCallback((itemId) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((item) => item.id === itemId);
      if (isSelected) {
        return prev.filter((item) => item.id !== itemId);
      } else {
        const item = downloadHistory.find((item) => item.id === itemId);
        return item ? [...prev, item] : prev;
      }
    });
  }, [downloadHistory]);

  const handleSelectAll = () => setSelectedItems(filteredAndSortedData);
  const handleDeselectAll = () => setSelectedItems([]);

  const handleRedownload = useCallback((item) => {
    let videoUrl = item.url;
    
    if (!videoUrl && item.id) {
      const isYoutubeId = item.id.length === 11 && !item.id.includes('-');
      if (isYoutubeId) {
        videoUrl = `https://www.youtube.com/watch?v=${item.id}`;
      }
    }
    
    if (!videoUrl) {
      alert("Cannot re-download: Video URL not found in history.");
      return;
    }

    if (item.type === 'saved') {
      navigate('/video-details-download', { state: { video: item } });
      return;
    }

    const dlType = item.type === 'audio' ? 'audio' 
      : item.type === 'thumbnail' ? 'thumbnail'
      : (item.format === 'mp3' ? 'audio' : item.format === 'jpg' ? 'thumbnail' : 'video');

    const config = {
      url: videoUrl,
      quality: item.quality,
      format: item.format,
      filename: item.title,
      type: dlType,
      channel: item.channel,
      thumbnail: item.thumbnail,
    };

    if (item.trim_start != null || item.trim_end != null) {
      config.trim_start = item.trim_start;
      config.trim_end = item.trim_end;
      config.trimSettings = {
        startTime: item.trim_start,
        endTime: item.trim_end,
      };
    }

    addDownload(config, {
      title: item.title,
      duration: item.duration,
      channel: { name: item.channel },
      thumbnail: item.thumbnail,
    });
  }, [navigate, addDownload]);

  const handleDelete = useCallback((item) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      data: [item],
      title: 'Delete Download',
      message: `Are you sure you want to delete this download? Records will be removed from your download history profile.`
    });
  }, []);

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      data: selectedItems,
      title: 'Delete Selected Downloads',
      message: `Are you sure you want to delete ${selectedItems.length} selected download${selectedItems.length !== 1 ? 's' : ''}?`
    });
  };

  const handleOpenLocation = useCallback(async (item) => {
    if (!isDesktop) {
      alert("Browser based downloads are stored in your default downloads folder.");
      return;
    }
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/desktop/open-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: item.filename, filepath: item.filepath })
      });
    } catch (e) {
      console.error(e);
    }
  }, [isDesktop]);

  const handleShare = useCallback((item) => {
    setShareData({
      isOpen: true,
      url: item.url || `https://youtube.com/watch?v=${item.id}`,
      title: item.title
    });
  }, []);

  const executeActualDeletion = async (itemsToDelete, deleteFile = false) => {
    try {
      const ids = itemsToDelete.map(i => i.id);
      if (isDesktop) {
        if (ids.length === 1) {
          await YTDeluxeAPI.deleteHistoryItem(ids[0], deleteFile);
        } else {
          await YTDeluxeAPI.batchDeleteHistory(ids, deleteFile);
        }
      } else {
        const type = itemsToDelete[0]?.type;
        if (type === 'saved') {
          const current = JSON.parse(localStorage.getItem('ytdeluxe_saved') || '[]');
          const updated = current.filter(h => !ids.includes(h.id));
          localStorage.setItem('ytdeluxe_saved', JSON.stringify(updated));
        } else {
          const current = JSON.parse(localStorage.getItem('ytdeluxe_web_history') || '[]');
          const updated = current.filter(h => !ids.includes(h.id));
          localStorage.setItem('ytdeluxe_web_history', JSON.stringify(updated));
        }
      }
      // Invalidate stale cache, then hard-refresh from server
      dataCache.invalidate(CacheKey.history());
      await fetchAndCacheHistory({ silent: false });
    } catch (err) {
      console.error("Deletion failed:", err);
      setError("Failed to delete records from permanent storage.");
    }
  };

  const handleConfirmAction = (deleteFile = false) => {
    const itemsToDelete = confirmModal.data;
    
    const remainingHistory = downloadHistory.filter(h => !itemsToDelete.some(it => it.id === h.id));
    setDownloadHistory(remainingHistory);
    setSelectedItems([]);
    setConfirmModal({ isOpen: false, type: '', data: null, title: '', message: '' });

    if (undoRef.current) clearTimeout(undoRef.current);
    
    setUndoState({
      isOpen: true,
      items: itemsToDelete,
      message: `${itemsToDelete.length} item${itemsToDelete.length > 1 ? 's' : ''} deleted`
    });

    undoRef.current = setTimeout(() => {
      executeActualDeletion(itemsToDelete, deleteFile);
      setUndoState(prev => ({ ...prev, isOpen: false }));
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (undoRef.current) clearTimeout(undoRef.current);
    
    setDownloadHistory(prev => [...undoState.items, ...prev].sort((a,b) => {
       if (sortBy === 'downloadDate') return new Date(b.downloadDate) - new Date(a.downloadDate);
       return 0;
    }));
    
    setUndoState({ isOpen: false, items: [], message: '' });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({ format: '', quality: '', dateRange: '', channel: '' });
  };

  const hasActiveFilters = () => {
    return searchQuery || Object.values(filters).some(value => value && value !== '');
  };

  return (
    <>
      <Helmet>
        <title>{t("downloadHistoryManagement.downloadHistoryManagementYt")}</title>
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        
        <main className="pt-24 pb-32">
          <div className="container mx-auto px-4 max-w-[1600px]">
            {/* Modern Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-8 md:p-12 mb-8">
              <div className="relative z-10 flex flex-col gap-6">
                <div className="max-w-xl">
                  <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 tracking-tight leading-tight">
                    {t("downloadHistoryManagement.downloadHistoryManagement")}
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg font-medium mb-4">
                    {t("downloadHistoryManagement.trackOrganizeAndManage")}
                  </p>
                </div>

                {isLoading && downloadHistory.length === 0 ? (
                  <TopCardsSkeleton />
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full items-stretch">
                    <div className="w-full h-full">
                      <StorageStatsBox
                        totalSize={storageStats.totalSize}
                        availableSpace={storageStats.availableSpace}
                        itemCount={downloadHistory.length}
                      />
                    </div>
                    <div className="w-full h-full">
                      <FileTypeBreakdown history={downloadHistory} />
                    </div>
                    <div className="w-full h-full">
                      <StorageUsage itemCount={downloadHistory.length} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Navigation & Filters */}
            <div className="sticky top-20 z-50 py-4 -mx-4 px-4 md:mx-0 md:px-0 mb-8 transition-all">
              <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                <div className="w-full xl:w-auto shrink-0">
                  <TabNavigation
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={tabCounts}
                  />
                </div>
                <div className="w-full xl:w-auto xl:ml-auto flex xl:justify-end">
                  <FilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sortOrder={sortOrder}
                    onSortOrderChange={setSortOrder}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8">
              <div className="space-y-6">

                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                    <Icon name="AlertTriangle" size={18} />
                    {error}
                  </div>
                )}

                {isLoading && downloadHistory.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <HistoryCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredAndSortedData.length === 0 ? (
                  <EmptyState
                    type={activeTab}
                    searchQuery={searchQuery}
                    hasFilters={hasActiveFilters()}
                    onClearFilters={handleClearFilters}
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                      {filteredAndSortedData.slice(0, visibleCount).map((item) => (
                        <HistoryCard
                          key={item.id}
                          item={item}
                          onRedownload={handleRedownload}
                          onDelete={handleDelete}
                          onOpenLocation={handleOpenLocation}
                          onShare={handleShare}
                          isSelected={selectedItems.some((selected) => selected.id === item.id)}
                          onSelect={handleItemSelect}
                        />
                      ))}
                    </div>
                    {/* Subtle loader while remaining items stream in */}
                    {visibleCount < filteredAndSortedData.length && (
                      <div className="flex items-center justify-center gap-2 pt-6 pb-2 text-muted-foreground/50">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold tracking-widest uppercase">
                          {filteredAndSortedData.length - visibleCount} more loading…
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Selection bar — sticky within content area, floats above cards */}
              <BulkActions
                selectedItems={selectedItems}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onBulkDelete={handleBulkDelete}
                totalItems={filteredAndSortedData.length}
              />
            </div>
          </div>
        </main>

        {/* Global UI Components */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={handleConfirmAction}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          items={confirmModal.data || []}
          confirmText="Confirm Delete"
          isLoading={isLoading}
        />

        <ShareModal
          isOpen={shareData.isOpen}
          onClose={() => setShareData({ ...shareData, isOpen: false })}
          url={shareData.url}
          title={shareData.title}
        />

        <UndoToast
          isOpen={undoState.isOpen}
          message={undoState.message}
          onUndo={handleUndoDelete}
          onExpire={() => {}} // Clean deletion already scheduled by timeout
        />
      </div>
    </>
  );
};

export default DownloadHistoryManagement;