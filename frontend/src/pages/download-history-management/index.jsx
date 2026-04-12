import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressNotification from '../../components/ui/ProgressNotification';
import HistoryCard from './components/HistoryCard';
import FilterBar from './components/FilterBar';
import StorageUsage from './components/StorageUsage';
import BulkActions from './components/BulkActions';
import TabNavigation from './components/TabNavigation';
import EmptyState from './components/EmptyState';
import ConfirmationModal from './components/ConfirmationModal';
import YTDeluxeAPI from '../../utils/api';
import ShareModal from '../../components/ui/ShareModal';
import UndoToast from '../../components/ui/UndoToast';

const DownloadHistoryManagement = () => {
  const { t } = useTranslation();
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
  const [isLoading, setIsLoading] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [error, setError] = useState(null);
  const [storageStats, setStorageStats] = useState({ totalSize: 0, availableSpace: 0, itemCount: 0 });
  
  // Share & Undo State
  const [shareData, setShareData] = useState({ isOpen: false, url: '', title: '' });
  const [undoState, setUndoState] = useState({ isOpen: false, items: [], message: '', timerId: null });
  const undoRef = useRef(null);

  // Re-download progress tracking
  const [activeDownloads, setActiveDownloads] = useState([]);

  const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;

  useEffect(() => {
    loadDownloadHistory();
    return () => {
      // Clear any pending undo deletions on unmount
      if (undoRef.current) clearTimeout(undoRef.current);
    };
  }, []);

  const loadDownloadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await YTDeluxeAPI.getDownloadHistory();

      if (isDesktop && response.history) {
        // Transform backend data to match UI expectations
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
          type: 'all'
        }));
        setDownloadHistory(transformed);

        // Fetch Storage Space
        const dlPath = localStorage.getItem('ytdeluxe_download_path');
        try {
          const storageData = await YTDeluxeAPI.getStorageInfo(dlPath);
          if (storageData) {
            const totalSize = transformed.reduce((sum, item) => sum + item.fileSize, 0);
            setStorageStats({
              totalSize: totalSize,
              availableSpace: storageData.free,
              itemCount: transformed.length
            });
          }
        } catch {}
      } else {
        // Web Mode: Use local storage
        const localHistory = JSON.parse(localStorage.getItem('ytdeluxe_web_history') || '[]');
        const transformed = localHistory.map((item) => ({
          ...item,
          downloadDate: new Date(item.downloadDate || Date.now())
        }));
        setDownloadHistory(transformed);

        const totalSize = transformed.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        setStorageStats({ totalSize: totalSize, availableSpace: 10 * 1024 * 1024 * 1024, itemCount: transformed.length });
      }
    } catch (error) {
      console.error(error);
      setError('Failed to load download history.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    if (activeTab === 'watchLater') {
      let watchLaterItems = [];
      try {
        watchLaterItems = JSON.parse(localStorage.getItem('ytdeluxe_watch_later') || '[]').map((item) => ({
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
          type: 'watchLater',
          url: item.url,
          views: item.views,
          uploadDate: item.uploadDate
        }));
      } catch {}

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        watchLaterItems = watchLaterItems.filter((item) =>
          item.title?.toLowerCase().includes(query) ||
          item.channel?.toLowerCase().includes(query)
        );
      }
      return watchLaterItems;
    }

    let filtered = [...downloadHistory];

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

  const tabCounts = useMemo(() => {
    let watchLaterCount = 0;
    try {
      watchLaterCount = JSON.parse(localStorage.getItem('ytdeluxe_watch_later') || '[]').length;
    } catch {}
    return {
      all: downloadHistory.length,
      watchLater: watchLaterCount,
      bookmarks: 0
    };
  }, [downloadHistory]);

  const handleItemSelect = (itemId) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((item) => item.id === itemId);
      if (isSelected) {
        return prev.filter((item) => item.id !== itemId);
      } else {
        const item = downloadHistory.find((item) => item.id === itemId);
        return item ? [...prev, item] : prev;
      }
    });
  };

  const handleSelectAll = () => setSelectedItems(filteredAndSortedData);
  const handleDeselectAll = () => setSelectedItems([]);

  const handleRedownload = async (item) => {
    // Try multiple sources for the video URL
    let videoUrl = item.url;
    
    // Fallback: reconstruct from video ID if available
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

    try {
      const isDesktopEnv = typeof window !== 'undefined' && window.pywebview !== undefined;
      const response = await YTDeluxeAPI.downloadVideo({
        url: videoUrl,
        quality: item.quality,
        format: item.format,
        is_desktop: isDesktopEnv
      });

      if (response.task_id) {
        // Create a local download entry for progress tracking
        const dlEntry = {
          id: response.task_id,
          filename: item.title || 'Re-downloading...',
          title: item.title,
          type: item.format === 'mp3' ? 'audio' : item.format === 'jpg' ? 'thumbnail' : 'video',
          quality: item.quality,
          format: item.format,
          progress: 0,
          status: 'downloading',
          startedAt: new Date(),
        };
        setActiveDownloads(prev => [...prev, dlEntry]);

        // Poll progress
        const pollInterval = setInterval(async () => {
          try {
            const prog = await YTDeluxeAPI.getDownloadProgress(response.task_id);
            setActiveDownloads(prev => prev.map(d =>
              d.id === response.task_id
                ? { ...d, progress: prog.progress || 0, status: prog.status || 'downloading', filename: prog.filename || d.filename, filepath: prog.filepath }
                : d
            ));

            if (prog.status === 'completed' || prog.status === 'error') {
              clearInterval(pollInterval);
              // Reload history after successful re-download
              if (prog.status === 'completed') {
                setTimeout(() => loadDownloadHistory(), 1500);
              }
              // Auto-dismiss after 8 seconds
              setTimeout(() => {
                setActiveDownloads(prev => prev.filter(d => d.id !== response.task_id));
              }, 8000);
            }
          } catch (e) {
            clearInterval(pollInterval);
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Re-download failed:", err);
      alert("Re-download failed. Please try again.");
    }
  };

  const handleDelete = (item) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      data: [item],
      title: 'Delete Download',
      message: `Are you sure you want to delete "${item.title}"? Records will be removed from your download history profile.`
    });
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      data: selectedItems,
      title: 'Delete Selected Downloads',
      message: `Are you sure you want to delete ${selectedItems.length} selected download${selectedItems.length !== 1 ? 's' : ''}?`
    });
  };

  const handleOpenLocation = async (item) => {
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
  };

  const handleShare = (item) => {
    setShareData({
      isOpen: true,
      url: item.url || `https://youtube.com/watch?v=${item.id}`,
      title: item.title
    });
  };

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
        const current = JSON.parse(localStorage.getItem('ytdeluxe_web_history') || '[]');
        const updated = current.filter(h => !ids.includes(h.id));
        localStorage.setItem('ytdeluxe_web_history', JSON.stringify(updated));
      }
      // Reload stats after deletion
      await loadDownloadHistory();
    } catch (err) {
      console.error("Deletion failed:", err);
      setError("Failed to delete records from permanent storage.");
    }
  };

  const handleConfirmAction = (deleteFile = false) => {
    const itemsToDelete = confirmModal.data;
    
    // Immediate UI feedback
    const remainingHistory = downloadHistory.filter(h => !itemsToDelete.some(it => it.id === h.id));
    setDownloadHistory(remainingHistory);
    setSelectedItems([]);
    setConfirmModal({ isOpen: false, type: '', data: null, title: '', message: '' });

    // Show Undo Toast
    if (undoRef.current) clearTimeout(undoRef.current);
    
    setUndoState({
      isOpen: true,
      items: itemsToDelete,
      message: `${itemsToDelete.length} item${itemsToDelete.length > 1 ? 's' : ''} deleted`
    });

    // Schedule actual deletion
    undoRef.current = setTimeout(() => {
      executeActualDeletion(itemsToDelete, deleteFile);
      setUndoState(prev => ({ ...prev, isOpen: false }));
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (undoRef.current) clearTimeout(undoRef.current);
    
    // Restore UI
    setDownloadHistory(prev => [...undoState.items, ...prev].sort((a,b) => {
       // Restore sorting
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
        <ProgressNotification downloads={activeDownloads} />
        
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Page Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">
                  {t("downloadHistoryManagement.downloadHistoryManagement")}
                </h1>
                <p className="text-muted-foreground font-medium">
                  {t("downloadHistoryManagement.trackOrganizeAndManage")}
                </p>
              </div>
              <StorageUsage
                totalSize={storageStats.totalSize}
                availableSpace={storageStats.availableSpace}
                itemCount={storageStats.itemCount}
              />
            </div>

            {/* Main Interface */}
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-6">
                <TabNavigation
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  counts={tabCounts}
                />

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

                <BulkActions
                  selectedItems={selectedItems}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onBulkDelete={handleBulkDelete}
                  totalItems={filteredAndSortedData.length}
                />

                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                    <Icon name="AlertTriangle" size={18} />
                    {error}
                  </div>
                )}

                {isLoading && downloadHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">{t("downloadHistoryManagement.loading")}</p>
                  </div>
                ) : filteredAndSortedData.length === 0 ? (
                  <EmptyState
                    type={activeTab}
                    searchQuery={searchQuery}
                    hasFilters={hasActiveFilters()}
                    onClearFilters={handleClearFilters}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                    {filteredAndSortedData.map((item) => (
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
                )}
              </div>
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