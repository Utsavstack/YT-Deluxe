import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import QueueItem from './QueueItem';

const QueueManager = ({ queue, onUpdateQueue, onStartDownload, onPauseDownload, onRemoveItems }) => {
 const [selectedItems, setSelectedItems] = useState(new Set());
 const [sortBy, setSortBy] = useState('order');

 const sortOptions = [
  { value: 'order', label: 'Queue Order' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'duration', label: 'Duration' },
  { value: 'fileSize', label: 'File Size' },
  { value: 'status', label: 'Status' }
 ];

 const qualityPresets = [
  { value: '1080p', label: 'Excellent (1080p)' },
  { value: '480p', label: 'Medium (480p)' },
  { value: '144p', label: 'Average (144p)' },
  { value: 'audio', label: 'Audio Only' }
 ];

 const handleSelectAll = () => {
  if (selectedItems?.size === queue?.length) {
   setSelectedItems(new Set());
  } else {
   setSelectedItems(new Set(queue.map(item => item.id)));
  }
 };

 const handleSelectItem = (id, checked) => {
  const newSelected = new Set(selectedItems);
  if (checked) {
   newSelected?.add(id);
  } else {
   newSelected?.delete(id);
  }
  setSelectedItems(newSelected);
 };

 const handleRemoveSelected = () => {
  onRemoveItems(Array.from(selectedItems));
  setSelectedItems(new Set());
 };

 const handleApplyQualityPreset = (quality) => {
  const updatedQueue = queue?.map(item => 
   selectedItems?.has(item?.id) ? { ...item, quality } : item
  );
  onUpdateQueue(updatedQueue);
 };

 const handleMoveItem = (id, direction) => {
  const currentIndex = queue?.findIndex(item => item?.id === id);
  if (currentIndex === -1) return;

  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (newIndex < 0 || newIndex >= queue?.length) return;

  const newQueue = [...queue];
  [newQueue[currentIndex], newQueue[newIndex]] = [newQueue?.[newIndex], newQueue?.[currentIndex]];
  onUpdateQueue(newQueue);
 };

 const handleQualityChange = (id, quality) => {
  const updatedQueue = queue?.map(item => 
   item?.id === id ? { ...item, quality } : item
  );
  onUpdateQueue(updatedQueue);
 };

 const handleRemoveItem = (id) => {
  onRemoveItems([id]);
  setSelectedItems(prev => {
   const newSet = new Set(prev);
   newSet?.delete(id);
   return newSet;
  });
 };

 const getQueueStats = () => {
  const total = queue?.length;
  const completed = queue?.filter(item => item?.status === 'completed')?.length;
  const downloading = queue?.filter(item => item?.status === 'downloading')?.length;
  const pending = queue?.filter(item => item?.status === 'pending')?.length;
  const totalSize = queue?.reduce((sum, item) => {
   const size = parseFloat(item?.fileSize?.replace(/[^\d.]/g, ''));
   return sum + (isNaN(size) ? 0 : size);
  }, 0);

  return { total, completed, downloading, pending, totalSize };
 };

 const stats = getQueueStats();

 if (queue?.length === 0) {
  return (
   <div className="glass-card p-12 text-center">
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
     <Icon name="Download" size={32} className="text-muted-foreground" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">
     No Videos in Queue
    </h3>
    <p className="text-muted-foreground mb-6">
     Add YouTube URLs above to start building your download queue
    </p>
    <Button
     variant="outline"
     onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
     iconName="ArrowUp"
     iconPosition="left"
    >
     Add Videos
    </Button>
   </div>
  );
 }

 return (
  <div className="space-y-6">
   {/* Queue Header */}
   <div className="glass-card p-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
     <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Download Queue</h2>
      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
       <span>{stats?.total} videos</span>
       <span>{stats?.completed} completed</span>
       <span>{stats?.downloading} downloading</span>
       <span>{stats?.pending} pending</span>
       <span>~{stats?.totalSize?.toFixed(1)}MB total</span>
      </div>
     </div>

     <div className="flex items-center space-x-3">
      <Select
       options={sortOptions}
       value={sortBy}
       onChange={setSortBy}
       placeholder="Sort by"
       className="w-40"
      />
      <Button
       variant="default"
       onClick={onStartDownload}
       disabled={stats?.pending === 0}
       iconName="Play"
       iconPosition="left"
      >
       Start All
      </Button>
      <Button
       variant="outline"
       onClick={onPauseDownload}
       disabled={stats?.downloading === 0}
       iconName="Pause"
       iconPosition="left"
      >
       Pause All
      </Button>
     </div>
    </div>
   </div>
   {/* Bulk Actions */}
   {selectedItems?.size > 0 && (
    <div className="glass-card p-4">
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-3">
       <span className="text-sm font-medium text-foreground">
        {selectedItems?.size} selected
       </span>
       <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelectedItems(new Set())}
        iconName="X"
       >
        Clear
       </Button>
      </div>

      <div className="flex items-center space-x-2">
       <Select
        options={qualityPresets}
        onChange={handleApplyQualityPreset}
        placeholder="Apply quality"
        className="w-40"
       />
       <Button
        variant="destructive"
        size="sm"
        onClick={handleRemoveSelected}
        iconName="Trash2"
        iconPosition="left"
       >
        Remove Selected
       </Button>
      </div>
     </div>
    </div>
   )}
   {/* Desktop Table Header */}
   <div className="hidden md:block glass-card">
    <div className="p-4 border-b border-border">
     <div className="flex items-center space-x-4">
      <input
       type="checkbox"
       checked={selectedItems?.size === queue?.length && queue?.length > 0}
       onChange={handleSelectAll}
       className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
      />
      <div className="w-4"></div> {/* Drag handle space */}
      <div className="w-24 text-sm font-medium text-muted-foreground">Thumbnail</div>
      <div className="flex-1 text-sm font-medium text-muted-foreground">Video Details</div>
      <div className="w-48 text-sm font-medium text-muted-foreground">Quality</div>
      <div className="w-20 text-sm font-medium text-muted-foreground text-center">Size</div>
      <div className="w-32 text-sm font-medium text-muted-foreground">Status</div>
      <div className="w-24 text-sm font-medium text-muted-foreground text-center">Actions</div>
     </div>
    </div>
   </div>
   {/* Queue Items */}
   <div className="space-y-3">
    {queue?.map((item, index) => (
     <QueueItem
      key={item?.id}
      item={item}
      isSelected={selectedItems?.has(item?.id)}
      onSelect={handleSelectItem}
      onRemove={handleRemoveItem}
      onQualityChange={handleQualityChange}
      onMoveUp={() => handleMoveItem(item?.id, 'up')}
      onMoveDown={() => handleMoveItem(item?.id, 'down')}
      canMoveUp={index > 0}
      canMoveDown={index < queue?.length - 1}
     />
    ))}
   </div>
   {/* ZIP Download Option */}
   {stats?.completed > 0 && (
    <div className="glass-card p-6">
     <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
       <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
        <Icon name="Archive" size={24} className="text-success" />
       </div>
       <div>
        <h3 className="font-semibold text-foreground">Package Downloads</h3>
        <p className="text-sm text-muted-foreground">
         Download all completed videos as a single ZIP file
        </p>
       </div>
      </div>
      <Button
       variant="success"
       iconName="Download"
       iconPosition="left"
       onClick={() => {
        // ZIP download logic
        console.log('Creating ZIP package...');
       }}
      >
       Download ZIP ({stats?.completed} files)
      </Button>
     </div>
    </div>
   )}
  </div>
 );
};

export default QueueManager;