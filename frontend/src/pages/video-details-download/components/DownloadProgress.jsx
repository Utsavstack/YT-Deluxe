import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DownloadProgress = ({ downloads, onCancel, onRetry, onComplete }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Show browser notification when download completes
    downloads?.forEach(download => {
      if (download?.status === 'completed' && !notifications?.includes(download?.id)) {
        if (Notification.permission === 'granted') {
          new Notification('Download Complete', {
            body: `${download.filename} has been downloaded successfully`,
            icon: '/favicon.ico'
          });
        }
        setNotifications(prev => [...prev, download?.id]);
        onComplete?.(download);
      }
    });
  }, [downloads, notifications, onComplete]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'downloading':
        return 'Download';
      case 'completed':
        return 'CheckCircle';
      case 'error':
        return 'AlertCircle';
      case 'cancelled':
        return 'XCircle';
      case 'paused':
        return 'Pause';
      default:
        return 'Clock';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'downloading':
        return 'text-primary';
      case 'completed':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'cancelled':
        return 'text-muted-foreground';
      case 'paused':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'downloading':
        return 'bg-primary';
      case 'completed':
        return 'bg-success';
      case 'error':
        return 'bg-error';
      case 'paused':
        return 'bg-warning';
      default:
        return 'bg-muted-foreground';
    }
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond || bytesPerSecond === 0) {
      return 'Calculating...';
    }
    
    if (bytesPerSecond >= 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024))?.toFixed(2)} MB/s`;
    } else if (bytesPerSecond >= 1024) {
      return `${(bytesPerSecond / 1024)?.toFixed(1)} KB/s`;
    }
    return `${Math.round(bytesPerSecond)} B/s`;
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds === 0) {
      return 'Calculating...';
    }
    
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s remaining`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.ceil(seconds % 60);
      return `${minutes}m ${remainingSeconds}s remaining`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m remaining`;
    }
  };

  if (downloads?.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Downloads</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {downloads?.filter(d => d?.status === 'downloading')?.length} active
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Clear completed downloads
              const activeDownloads = downloads?.filter(d => d?.status !== 'completed');
              console.log('Clear completed downloads');
            }}
          >
            Clear Completed
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {downloads?.map((download) => (
          <div key={download?.id} className="glass-card p-4">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${getStatusColor(download?.status)}`}>
                <Icon name={getStatusIcon(download?.status)} size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {download?.filename}
                  </h4>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {download?.status === 'downloading' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => {
                            // Pause/Resume download
                            console.log('Toggle pause:', download?.id);
                          }}
                        >
                          <Icon name={download?.status === 'paused' ? 'Play' : 'Pause'} size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-error hover:text-error"
                          onClick={() => onCancel?.(download?.id)}
                        >
                          <Icon name="X" size={12} />
                        </Button>
                      </>
                    )}
                    
                    {download?.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => onRetry?.(download?.id)}
                      >
                        <Icon name="RotateCcw" size={12} />
                      </Button>
                    )}
                    
                    {download?.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => {
                          // Open file location
                          console.log('Open file:', download?.id);
                        }}
                      >
                        <Icon name="FolderOpen" size={12} />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{download?.type?.toUpperCase()} • {download?.quality} • {download?.format?.toUpperCase()}</span>
                    <span>{download?.size}</span>
                  </div>
                  
                  {download?.status === 'downloading' && (
                    <>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ease-out ${getProgressColor(download?.status)}`}
                          style={{ width: `${download?.progress}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {download?.progress?.toFixed(1)}% complete
                          {download?.downloaded_bytes && download?.total_bytes ? 
                            ` (${(download?.downloaded_bytes / (1024 * 1024))?.toFixed(1)}/${(download?.total_bytes / (1024 * 1024))?.toFixed(1)} MB)` : 
                            ''}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span>{formatSpeed(download?.speed)}</span>
                          <span>•</span>
                          <span>{formatTimeRemaining(download?.timeRemaining)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {download?.status === 'completed' && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-success">Download completed</span>
                      <span className="text-muted-foreground">
                        {new Date(download.completedAt)?.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  
                  {download?.status === 'error' && (
                    <div className="text-xs text-error">
                      Error: {download?.error || 'Download failed'}
                    </div>
                  )}
                  
                  {download?.status === 'cancelled' && (
                    <div className="text-xs text-muted-foreground">
                      Download cancelled
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Overall Progress Summary */}
      {downloads?.filter(d => d?.status === 'downloading')?.length > 0 && (
        <div className="glass-card p-4 bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {downloads?.filter(d => d?.status === 'completed')?.length} of {downloads?.length} completed
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="h-2 bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${(downloads?.filter(d => d?.status === 'completed')?.length / downloads?.length) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadProgress;