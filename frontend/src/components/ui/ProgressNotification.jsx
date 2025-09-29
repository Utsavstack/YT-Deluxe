import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const ProgressNotification = ({ downloads = [] }) => {
  const [notifications, setNotifications] = useState([]);

  // Convert downloads to notifications format
  useEffect(() => {
    if (!downloads || downloads.length === 0) {
      setNotifications([]);
      return;
    }
    
    const activeNotifications = downloads.map(download => ({
      id: download.id,
      type: download.status === 'completed' ? 'success' : 'download',
      title: download.status === 'completed' ? 'Download Complete' : 'Video Download',
      message: download.status === 'completed' 
        ? `Successfully downloaded "${download.filename}"` 
        : `Downloading "${download.filename}"`,
      progress: download.progress,
      status: download.status === 'downloading' ? 'in-progress' : download.status,
      timestamp: download.startedAt ? new Date(download.startedAt) : new Date()
    }));
    
    setNotifications(activeNotifications);
  }, [downloads]);

  const removeNotification = (id) => {
    setNotifications(prev => prev?.filter(notification => notification?.id !== id));
  };

  const getNotificationIcon = (type, status) => {
    if (type === 'download' && status === 'in-progress') {
      return 'Download';
    }
    if (type === 'success' || status === 'completed') {
      return 'CheckCircle';
    }
    if (type === 'error') {
      return 'AlertCircle';
    }
    if (type === 'warning') {
      return 'AlertTriangle';
    }
    return 'Info';
  };

  const getNotificationColor = (type, status) => {
    if (type === 'success' || status === 'completed') {
      return 'text-success';
    }
    if (type === 'error') {
      return 'text-error';
    }
    if (type === 'warning') {
      return 'text-warning';
    }
    return 'text-primary';
  };

  if (notifications?.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-150 space-y-3 w-80 max-w-[calc(100vw-2rem)]">
      {notifications?.map((notification) => (
        <div
          key={notification?.id}
          className="glass-card shadow-glass-lg animate-slide-down"
        >
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${getNotificationColor(notification?.type, notification?.status)}`}>
                <Icon 
                  name={getNotificationIcon(notification?.type, notification?.status)} 
                  size={20} 
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {notification?.title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 -mt-1 -mr-1 flex-shrink-0"
                    onClick={() => removeNotification(notification?.id)}
                  >
                    <Icon name="X" size={14} />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {notification?.message}
                </p>
                
                {notification?.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{notification?.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${notification?.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {notification?.timestamp?.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  
                  {notification?.status === 'in-progress' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => {
                        // Pause/cancel download logic
                        console.log('Pause download:', notification?.id);
                      }}
                    >
                      Pause
                    </Button>
                  )}
                  
                  {notification?.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => {
                        // Open file location logic
                        console.log('Open file:', notification?.id);
                      }}
                    >
                      Open
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressNotification;