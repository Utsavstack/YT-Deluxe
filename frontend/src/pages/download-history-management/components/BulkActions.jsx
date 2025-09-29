import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActions = ({ 
  selectedItems, 
  onSelectAll, 
  onDeselectAll, 
  onBulkDelete, 
  onBulkExport, 
  onCreateZip,
  totalItems 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  const handleBulkAction = async (action, callback) => {
    setIsLoading(true);
    setLoadingAction(action);
    
    try {
      await callback();
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const getTotalSize = () => {
    return selectedItems?.reduce((total, item) => total + item?.fileSize, 0);
  };

  if (selectedItems?.length === 0) {
    return null;
  }

  return (
    <div className="glass-card mb-6 border-primary/20">
      <div className="p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Icon name="Check" size={14} className="text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {selectedItems?.length} of {totalItems} selected
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Total: {formatFileSize(getTotalSize())}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 flex-wrap">
            {/* Select All/None */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAll}
                disabled={selectedItems?.length === totalItems}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDeselectAll}
              >
                Clear
              </Button>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export', onBulkExport)}
                loading={isLoading && loadingAction === 'export'}
                iconName="Download"
                iconPosition="left"
              >
                Export
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('zip', onCreateZip)}
                loading={isLoading && loadingAction === 'zip'}
                iconName="Archive"
                iconPosition="left"
              >
                Create ZIP
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('delete', onBulkDelete)}
                loading={isLoading && loadingAction === 'delete'}
                iconName="Trash2"
                iconPosition="left"
              >
                Delete ({selectedItems?.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-foreground">
                {selectedItems?.filter(item => item?.format === 'mp4')?.length}
              </div>
              <div className="text-xs text-muted-foreground">MP4 Videos</div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-foreground">
                {selectedItems?.filter(item => item?.format === 'mp3')?.length}
              </div>
              <div className="text-xs text-muted-foreground">MP3 Audio</div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-foreground">
                {selectedItems?.filter(item => item?.quality === '1080p')?.length}
              </div>
              <div className="text-xs text-muted-foreground">HD Quality</div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-foreground">
                {new Set(selectedItems.map(item => item.channel))?.size}
              </div>
              <div className="text-xs text-muted-foreground">Channels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;