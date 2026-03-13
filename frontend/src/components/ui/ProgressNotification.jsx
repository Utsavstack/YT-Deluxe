import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const ProgressNotification = ({ downloads = [] }) => {
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [playedStartSoundIds, setPlayedStartSoundIds] = useState(new Set());
  const [playedCompleteSoundIds, setPlayedCompleteSoundIds] = useState(new Set());

  // Convert downloads to notifications format
  useEffect(() => {
    if (!downloads || downloads.length === 0) {
      setNotifications([]);
      return;
    }

    const activeNotifications = downloads
      .filter(download => !dismissedIds.has(download.id))
      .map(download => {
        // Determine base file type string
        const fileType = download.type
          ? download.type.charAt(0).toUpperCase() + download.type.slice(1)
          : 'File';

        const isCompleted = download.status === 'completed';

        return {
          id: download.id,
          type: isCompleted ? 'success' : 'download',
          title: isCompleted ? 'Download Complete' : `${fileType} Download`,
          message: isCompleted
            ? `${fileType} Downloaded Successfully!`
            : `Downloading ${fileType}: "${download.filename}"`,
          progress: download.progress,
          status: download.status === 'downloading' ? 'in-progress' : download.status,
          timestamp: download.startedAt ? new Date(download.startedAt) : new Date(),
          filename: download.filename
        };
      });

    // Play sounds
    activeNotifications.forEach(notification => {
      // Start Sound
      if (notification.status === 'in-progress' && !playedStartSoundIds.has(notification.id)) {
        try {
          const audio = new Audio('/iphone-notification.mp3');
          audio.play().catch(e => console.warn(e));
        } catch (e) { }
        setPlayedStartSoundIds(prev => new Set(prev).add(notification.id));
      }
      // Complete Sound
      if (notification.status === 'completed' && !playedCompleteSoundIds.has(notification.id)) {
        try {
          const audio = new Audio('/whatsapp-notification.mp3');
          audio.play().catch(e => console.warn(e));
        } catch (e) { }
        setPlayedCompleteSoundIds(prev => new Set(prev).add(notification.id));
      }
    });

    setNotifications(activeNotifications);
  }, [downloads, dismissedIds, playedStartSoundIds, playedCompleteSoundIds]);

  const removeNotification = (id) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const getNotificationIcon = (type, status) => {
    if (status === 'in-progress') {
      return 'Loader2'; // Lucide spinner
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

  const getNotificationExtraClass = (status) => {
    if (status === 'in-progress') return 'animate-spin';
    return '';
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
                  className={getNotificationExtraClass(notification?.status)}
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
                      <span>{notification?.progress === 0 ? 'Starting...' : `${notification?.progress}%`}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      {notification?.progress === 0 && notification?.status === 'in-progress' ? (
                        <div className="w-full h-full bg-primary/40 animate-pulse rounded-full" />
                      ) : (
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${notification?.progress}%` }}
                        />
                      )}
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



                  {notification?.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => {
                        if (notification?.filename) {
                          const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/downloads/${encodeURIComponent(notification.filename)}`;
                          window.location.assign(downloadUrl);
                        }
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