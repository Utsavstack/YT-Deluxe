import { useTranslation } from "react-i18next"; import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { formatTime } from '../../../utils/dateFormat';

const DownloadProgress = ({ downloads, onCancel, onRetry, onComplete, onClearCompleted }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Show browser notification when download completes
    downloads?.forEach((download) => {
      if (download?.status === 'completed' && !notifications?.includes(download?.id)) {
        if (Notification.permission === 'granted') {
          new Notification('Download Complete', {
            body: `${download.filename} has been downloaded successfully`,
            icon: '/favicon.ico'
          });
        }
        setNotifications((prev) => [...prev, download?.id]);
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
      const minutes = Math.floor(seconds % 3600 / 60);
      return `${hours}h ${minutes}m remaining`;
    }
  };

  if (downloads?.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 glass-card p-6 border-t-4 border-t-primary/80">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Download" size={16} className="text-primary" />
          </div>
          <h3 className="text-lg font-black text-foreground tracking-tight">{t("videoDetailsDownload.downloads")}</h3>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md whitespace-nowrap">
            {downloads?.filter((d) => d?.status === 'downloading')?.length} {t("videoDetailsDownload.active")}
          </span>
          <button
            onClick={() => {
              if (onClearCompleted) onClearCompleted();
            }}
            className="text-[10px] font-bold text-muted-foreground hover:text-error transition-colors flex items-center gap-1.5 bg-transparent hover:bg-error/10 px-2 py-1 rounded-md whitespace-nowrap uppercase tracking-wider"
          >
            <Icon name="Trash2" size={12} />
            {t("videoDetailsDownload.clearCompleted")}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {downloads?.map((download) => (
          <div key={download?.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.02] transition-all duration-300 hover:border-primary/30 hover:shadow-glass-sm p-4">
            {/* Background progress fill for downloading state */}
            {download?.status === 'downloading' && (
              <div
                className="absolute inset-y-0 left-0 bg-primary/[0.03] dark:bg-primary/[0.05] transition-all duration-300 ease-out z-0"
                style={{ width: `${download?.progress}%` }}
              />
            )}

            <div className="relative z-10 flex items-start space-x-1">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${download?.status === 'completed' ? 'bg-success/10 text-success' :
                download?.status === 'error' ? 'bg-error/10 text-error' :
                  download?.status === 'cancelled' ? 'bg-muted/20 text-muted-foreground' :
                    'bg-primary/10 text-primary'
                }`}>
                {download?.status === 'downloading' ? (
                  <Icon name="Loader2" size={20} className="animate-spin" />
                ) : (
                  <Icon name={getStatusIcon(download?.status)} size={20} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-foreground truncate pr-4">
                    {download?.filename}
                  </h4>
                  <div className="flex items-center space-x-0 flex-shrink-0">
                    {download?.status === 'downloading' && (
                      <button
                        onClick={() => onCancel?.(download?.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-error/10 hover:text-error transition-colors"
                        title="Cancel"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    )}

                    {download?.status === 'error' && (
                      <button
                        onClick={() => onRetry?.(download?.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Retry"
                      >
                        <Icon name="RotateCcw" size={14} />
                      </button>
                    )}

                    {download?.status === 'completed' && (
                      <button
                        onClick={() => {
                          if (download?.filename) {
                            const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;
                            if (isDesktop) {
                              fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/desktop/open-file`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ filename: download.filename, filepath: download.filepath })
                              }).catch((e) => console.error(e));
                            } else {
                              alert("File downloaded to your browser's default download folder. Please check your browser's downloads.");
                            }
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-success/10 hover:text-success transition-colors"
                        title="Open File"
                      >
                        <Icon name="FolderOpen" size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Badges */}
                    {download?.type && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                        {download.type}
                      </span>
                    )}
                    {download?.quality && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-accent/20 text-foreground border border-border">
                        {download.quality}
                      </span>
                    )}
                    {download?.format && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-accent/20 text-foreground border border-border">
                        {download.format}
                      </span>
                    )}
                    {download?.size && (
                      <span className="ml-auto text-xs font-medium text-muted-foreground">
                        {download.size}
                      </span>
                    )}
                  </div>

                  {download?.status === 'downloading' && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ease-out ${getProgressColor(download?.status)}`}
                          style={{ width: `${download?.progress}%`, boxShadow: '0 0 10px rgba(var(--color-primary-rgb), 0.5)' }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                        <span>
                          <span className="text-primary font-bold">{download?.progress?.toFixed(1)}%</span>
                          {download?.downloaded_bytes && download?.total_bytes ?
                            ` • ${(download?.downloaded_bytes / (1024 * 1024))?.toFixed(1)} / ${(download?.total_bytes / (1024 * 1024))?.toFixed(1)} MB` :
                            ''}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span>{formatSpeed(download?.speed)}</span>
                          <span>•</span>
                          <span className="text-foreground/70">{formatTimeRemaining(download?.timeRemaining)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {download?.status === 'completed' && (
                    <div className="flex items-center justify-between text-[10px] font-medium mt-1">
                      <span className="text-success tracking-wide uppercase">{t("videoDetailsDownload.downloadCompleted")}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Icon name="Clock" size={10} />
                        {formatTime(download.completedAt)}
                      </span>
                    </div>
                  )}

                  {download?.status === 'error' && (
                    <div className="text-[10px] font-medium text-error mt-1 flex items-center gap-1 bg-error/10 px-2 py-1 rounded">
                      <Icon name="AlertTriangle" size={10} />
                      {t("videoDetailsDownload.error")} {download?.error || 'Download failed'}
                    </div>
                  )}

                  {download?.status === 'cancelled' && (
                    <div className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1">
                      <Icon name="XCircle" size={10} />
                      {t("videoDetailsDownload.downloadCancelled")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Progress Summary */}
      {downloads?.filter((d) => d?.status === 'downloading')?.length > 0 && (
        <div className="rounded-xl p-3 bg-primary/5 border border-primary/10 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-primary">{t("videoDetailsDownload.overallProgress")}</span>
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
              {downloads?.filter((d) => d?.status === 'completed')?.length} {t("videoDetailsDownload.of")} {downloads?.length} {t("videoDetailsDownload.completed")}
            </span>
          </div>

          <div className="w-full bg-primary/10 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${downloads?.filter((d) => d?.status === 'completed')?.length / downloads?.length * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadProgress;