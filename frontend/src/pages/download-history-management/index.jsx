import React, { useState, useEffect, useMemo } from 'react';
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

const DownloadHistoryManagement = () => {
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
 const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });
 const [isLoading, setIsLoading] = useState(false);
 const [downloadHistory, setDownloadHistory] = useState([]);
 const [error, setError] = useState(null);

 useEffect(() => {
  loadDownloadHistory();
 }, []);

 const loadDownloadHistory = async () => {
  setIsLoading(true);
  setError(null);
  try {
   const response = await YTDeluxeAPI.getDownloadHistory();
   if (response.history) {
    // Transform backend data to match UI expectations
    const transformed = response.history.map((item, idx) => ({
     id: item.id || idx,
     title: item.title,
     channel: item.channel || 'Unknown Channel',
     thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
     duration: item.duration || 0,
     format: item.format || 'mp4',
     quality: item.quality || '720p',
     fileSize: item.file_size || 0,
     downloadDate: item.downloaded_at ? new Date(item.downloaded_at) : new Date(),
     tags: item.tags || [],
     type: 'all',
    }));
    setDownloadHistory(transformed);
   } else {
    setDownloadHistory([]);
   }
  } catch (error) {
   setError('Failed to load download history.');
   setDownloadHistory([]);
  } finally {
   setIsLoading(false);
  }
 };

 // Filter and sort data
 const filteredAndSortedData = useMemo(() => {
  let filtered = downloadHistory;

  // Filter by tab
  if (activeTab !== 'all') {
   filtered = filtered?.filter(item => item?.type === activeTab);
  }

  // Filter by search query
  if (searchQuery) {
   const query = searchQuery?.toLowerCase();
   filtered = filtered?.filter(item =>
    item?.title?.toLowerCase()?.includes(query) ||
    item?.channel?.toLowerCase()?.includes(query) ||
    item?.tags?.some(tag => tag?.toLowerCase()?.includes(query))
   );
  }

  // Apply filters
  if (filters?.format) {
   filtered = filtered?.filter(item => item?.format === filters?.format);
  }
  if (filters?.quality) {
   filtered = filtered?.filter(item => item?.quality === filters?.quality);
  }
  if (filters?.channel) {
   filtered = filtered?.filter(item => 
    item?.channel?.toLowerCase()?.includes(filters?.channel?.toLowerCase())
   );
  }
  if (filters?.dateRange) {
   const now = new Date();
   const filterDate = new Date();
   
   switch (filters?.dateRange) {
    case 'today':
     filterDate?.setHours(0, 0, 0, 0);
     break;
    case 'week':
     filterDate?.setDate(now?.getDate() - 7);
     break;
    case 'month':
     filterDate?.setMonth(now?.getMonth() - 1);
     break;
    case 'year':
     filterDate?.setFullYear(now?.getFullYear() - 1);
     break;
    default:
     filterDate?.setTime(0);
   }
   
   filtered = filtered?.filter(item => item?.downloadDate >= filterDate);
  }

  // Sort data
  filtered?.sort((a, b) => {
   let aValue = a?.[sortBy];
   let bValue = b?.[sortBy];

   if (sortBy === 'downloadDate') {
    aValue = new Date(aValue);
    bValue = new Date(bValue);
   } else if (typeof aValue === 'string') {
    aValue = aValue?.toLowerCase();
    bValue = bValue?.toLowerCase();
   }

   if (sortOrder === 'asc') {
    return aValue > bValue ? 1 : -1;
   } else {
    return aValue < bValue ? 1 : -1;
   }
  });

  return filtered;
 }, [downloadHistory, activeTab, searchQuery, filters, sortBy, sortOrder]);

 // Calculate counts for tabs
 const tabCounts = useMemo(() => ({
  all: downloadHistory?.length,
  watchLater: 0,
  bookmarks: 0
 }), [downloadHistory]);

 // Calculate storage usage
 const storageStats = useMemo(() => {
  const totalSize = downloadHistory?.reduce((sum, item) => sum + item?.fileSize, 0);
  const availableSpace = 10737418240; // 10GB mock available space
  
  return {
   totalSize,
   availableSpace,
   itemCount: downloadHistory?.length
  };
 }, [downloadHistory]);

 const handleItemSelect = (itemId) => {
  setSelectedItems(prev => {
   const isSelected = prev?.some(item => item?.id === itemId);
   if (isSelected) {
    return prev?.filter(item => item?.id !== itemId);
   } else {
    const item = downloadHistory?.find(item => item?.id === itemId);
    return item ? [...prev, item] : prev;
   }
  });
 };

 const handleSelectAll = () => {
  setSelectedItems(filteredAndSortedData);
 };

 const handleDeselectAll = () => {
  setSelectedItems([]);
 };

 const handleRedownload = (item) => {
  console.log('Re-downloading:', item?.title);
  // Implement re-download logic
 };

 const handleDelete = (item) => {
  setConfirmModal({
   isOpen: true,
   type: 'danger',
   data: [item],
   title: 'Delete Download',
   message: `Are you sure you want to delete "${item?.title}"? This action cannot be undone.`
  });
 };

 const handleBulkDelete = () => {
  setConfirmModal({
   isOpen: true,
   type: 'danger',
   data: selectedItems,
   title: 'Delete Selected Downloads',
   message: `Are you sure you want to delete ${selectedItems?.length} selected download${selectedItems?.length !== 1 ? 's' : ''}? This action cannot be undone.`
  });
 };

 const handleOpenLocation = (item) => {
  console.log('Opening file location for:', item?.title);
  // Implement file location opening logic
 };

 const handleShare = (item) => {
  console.log('Sharing:', item?.title);
  // Implement sharing logic
 };

 const handleBulkExport = async () => {
  setIsLoading(true);
  try {
   console.log('Exporting selected items:', selectedItems);
   // Implement export logic
   await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export
  } finally {
   setIsLoading(false);
  }
 };

 const handleCreateZip = async () => {
  setIsLoading(true);
  try {
   console.log('Creating ZIP for selected items:', selectedItems);
   // Implement ZIP creation logic
   await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate ZIP creation
  } finally {
   setIsLoading(false);
  }
 };

 const handleConfirmAction = async () => {
  setIsLoading(true);
  try {
   console.log('Deleting items:', confirmModal?.data);
   // Implement deletion logic
   await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate deletion
   setSelectedItems([]);
   setConfirmModal({ isOpen: false, type: '', data: null });
  } finally {
   setIsLoading(false);
  }
 };

 const handleClearFilters = () => {
  setSearchQuery('');
  setFilters({
   format: '',
   quality: '',
   dateRange: '',
   channel: ''
  });
 };

 const hasActiveFilters = () => {
  return searchQuery || Object.values(filters)?.some(value => value && value !== '');
 };

 return (
  <>
   <Helmet>
    <title>Download History & Management - YT Deluxe</title>
    <meta name="description" content="Manage and organize your YouTube download history with advanced filtering, sorting, and bulk operations." />
   </Helmet>
   <div className="min-h-screen bg-background">
    <Header />
    <ProgressNotification />
    
    <main className="pt-20 pb-8">
     <div className="container mx-auto px-4 lg:px-6">
      {/* Page Header */}
      <div className="mb-8">
       <h1 className="text-3xl font-bold text-foreground mb-2">
        Download History & Management
       </h1>
       <p className="text-muted-foreground">
        Track, organize, and manage all your downloaded content
       </p>
      </div>

      {/* Storage Usage */}
      <StorageUsage
       totalSize={storageStats?.totalSize}
       availableSpace={storageStats?.availableSpace}
       itemCount={storageStats?.itemCount}
      />

      {/* Tab Navigation */}
      <TabNavigation
       activeTab={activeTab}
       onTabChange={setActiveTab}
       counts={tabCounts}
      />

      {/* Filter Bar */}
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

      {/* Bulk Actions */}
      <BulkActions
       selectedItems={selectedItems}
       onSelectAll={handleSelectAll}
       onDeselectAll={handleDeselectAll}
       onBulkDelete={handleBulkDelete}
       onBulkExport={handleBulkExport}
       onCreateZip={handleCreateZip}
       totalItems={filteredAndSortedData?.length}
      />

      {/* Error Display */}
      {error && (
       <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
       </div>
      )}

      {/* Content */}
      {isLoading ? (
       <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filteredAndSortedData?.length === 0 ? (
       <EmptyState
        type={activeTab}
        searchQuery={searchQuery}
        hasFilters={hasActiveFilters()}
        onClearFilters={handleClearFilters}
       />
      ) : (
       <div className="space-y-4">
        {filteredAndSortedData?.map((item) => (
         <HistoryCard
          key={item?.id}
          item={item}
          onRedownload={handleRedownload}
          onDelete={handleDelete}
          onOpenLocation={handleOpenLocation}
          onShare={handleShare}
          isSelected={selectedItems?.some(selected => selected?.id === item?.id)}
          onSelect={handleItemSelect}
         />
        ))}
       </div>
      )}
     </div>
    </main>

    {/* Confirmation Modal */}
    <ConfirmationModal
     isOpen={confirmModal?.isOpen}
     onClose={() => setConfirmModal({ isOpen: false, type: '', data: null })}
     onConfirm={handleConfirmAction}
     title={confirmModal?.title}
     message={confirmModal?.message}
     type={confirmModal?.type}
     confirmText="Delete"
     isLoading={isLoading}
    />
   </div>
  </>
 );
};

export default DownloadHistoryManagement;