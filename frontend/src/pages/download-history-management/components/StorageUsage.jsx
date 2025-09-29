import React from 'react';
import Icon from '../../../components/AppIcon';

const StorageUsage = ({ totalSize, availableSpace, itemCount }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const usedPercentage = totalSize > 0 ? Math.min((totalSize / (totalSize + availableSpace)) * 100, 100) : 0;

  const getUsageColor = () => {
    if (usedPercentage >= 90) return 'bg-error';
    if (usedPercentage >= 75) return 'bg-warning';
    return 'bg-primary';
  };

  const getUsageTextColor = () => {
    if (usedPercentage >= 90) return 'text-error';
    if (usedPercentage >= 75) return 'text-warning';
    return 'text-primary';
  };

  return (
    <div className="glass-card mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Icon name="HardDrive" size={20} />
            <span>Storage Usage</span>
          </h3>
          <div className="text-sm text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Used Space</span>
            <span className={getUsageTextColor()}>{usedPercentage?.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getUsageColor()}`}
              style={{ width: `${usedPercentage}%` }}
            />
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-accent/20 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {formatFileSize(totalSize)}
            </div>
            <div className="text-sm text-muted-foreground">Total Downloaded</div>
          </div>
          
          <div className="text-center p-3 bg-accent/20 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {formatFileSize(availableSpace)}
            </div>
            <div className="text-sm text-muted-foreground">Available Space</div>
          </div>
          
          <div className="text-center p-3 bg-accent/20 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {itemCount}
            </div>
            <div className="text-sm text-muted-foreground">Total Files</div>
          </div>
        </div>

        {/* Storage Warning */}
        {usedPercentage >= 90 && (
          <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2">
            <Icon name="AlertTriangle" size={16} className="text-error flex-shrink-0" />
            <div className="text-sm text-error">
              Storage space is running low. Consider deleting old downloads or clearing cache.
            </div>
          </div>
        )}

        {usedPercentage >= 75 && usedPercentage < 90 && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-warning flex-shrink-0" />
            <div className="text-sm text-warning">
              Storage space is getting full. You may want to clean up old files.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageUsage;