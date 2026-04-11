import { useTranslation } from "react-i18next";import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BatchProgressPanel = ({
  queue,
  isDownloading,
  onStartAll,
  onPauseAll,
  onCancelAll
}) => {const { t } = useTranslation();
  const getOverallProgress = () => {
    if (queue?.length === 0) return 0;

    const totalProgress = queue?.reduce((sum, item) => {
      if (item?.status === 'completed') return sum + 100;
      if (item?.status === 'downloading') return sum + item?.progress;
      return sum;
    }, 0);

    return Math.round(totalProgress / queue?.length);
  };

  const getStats = () => {
    const total = queue?.length;
    const completed = queue?.filter((item) => item?.status === 'completed')?.length;
    const downloading = queue?.filter((item) => item?.status === 'downloading')?.length;
    const pending = queue?.filter((item) => item?.status === 'pending')?.length;
    const failed = queue?.filter((item) => item?.status === 'error')?.length;

    return { total, completed, downloading, pending, failed };
  };

  const getEstimatedTime = () => {
    const downloadingItems = queue?.filter((item) => item?.status === 'downloading');
    if (downloadingItems?.length === 0) return null;

    // Calculate based on actual download speeds and remaining time
    const itemsWithEta = downloadingItems.filter((item) => item.timeRemaining);

    if (itemsWithEta.length > 0) {
      // Use the maximum remaining time as the overall estimate
      const maxEta = Math.max(...itemsWithEta.map((item) => item.timeRemaining));
      return Math.ceil(maxEta / 60); // Convert seconds to minutes
    }

    // Fallback to progress-based calculation
    const avgProgress = downloadingItems?.reduce((sum, item) => sum + item?.progress, 0) / downloadingItems?.length;
    const remainingProgress = 100 - avgProgress;
    const estimatedMinutes = Math.round(remainingProgress / 100 * 5); // Assume 5 min per video

    return estimatedMinutes;
  };

  const stats = getStats();
  const overallProgress = getOverallProgress();
  const estimatedTime = getEstimatedTime();

  if (queue?.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50">
   <div className="max-w-4xl mx-auto">
    <div className="glass-card shadow-glass-xl border border-border/50">
     <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
       <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
         <Icon name="Download" size={20} className="text-primary" />
        </div>
        <div>
         <h3 className="font-semibold text-foreground">{t("batchDownloadManager.batchDownloadProgress")}</h3>
         <p className="text-sm text-muted-foreground">
          {stats?.completed} {t("batchDownloadManager.of")} {stats?.total} {t("batchDownloadManager.completed")} 
                    {estimatedTime && ` • ~${estimatedTime} min remaining`}
          {stats?.downloading > 0 && ` • ${stats?.downloading} active downloads`}
         </p>
        </div>
       </div>

       <div className="flex items-center space-x-2">
        {!isDownloading ?
                <Button
                  variant="default"
                  size="sm"
                  onClick={onStartAll}
                  disabled={stats?.pending === 0}
                  iconName="Play"
                  iconPosition="left"> {t("batchDownloadManager.startAll")} 


                </Button> :

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPauseAll}
                  iconName="Pause"
                  iconPosition="left"> {t("batchDownloadManager.pauseAll")} 


                </Button>
                }
        
        <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelAll}
                  iconName="X"
                  iconPosition="left"> {t("batchDownloadManager.cancel")} 


                </Button>
       </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
       <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{t("batchDownloadManager.overallProgress")}</span>
        <span>{overallProgress}%</span>
       </div>
       <div className="w-full bg-muted rounded-full h-2">
        <div
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${overallProgress}%` }} />
                
       </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
       <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{stats?.total}</div>
        <div className="text-xs text-muted-foreground">{t("batchDownloadManager.total")}</div>
       </div>
       
       <div className="text-center">
        <div className="text-2xl font-bold text-success">{stats?.completed}</div>
        <div className="text-xs text-muted-foreground">{t("batchDownloadManager.completed1")}</div>
       </div>
       
       <div className="text-center">
        <div className="text-2xl font-bold text-primary">{stats?.downloading}</div>
        <div className="text-xs text-muted-foreground">{t("batchDownloadManager.downloading")}</div>
       </div>
       
       <div className="text-center">
        <div className="text-2xl font-bold text-warning">{stats?.pending}</div>
        <div className="text-xs text-muted-foreground">{t("batchDownloadManager.pending")}</div>
       </div>
       
       <div className="text-center">
        <div className="text-2xl font-bold text-error">{stats?.failed}</div>
        <div className="text-xs text-muted-foreground">{t("batchDownloadManager.failed")}</div>
       </div>
      </div>

      {/* Active Downloads */}
      {stats?.downloading > 0 &&
            <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-3"> {t("batchDownloadManager.currentlyDownloading")}
                {stats?.downloading})
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
         {queue?.filter((item) => item?.status === 'downloading')?.slice(0, 3)?.map((item) =>
                <div key={item?.id} className="flex items-center space-x-3">
            <div className="w-8 h-6 rounded bg-muted flex-shrink-0 overflow-hidden">
             <img
                      src={item?.thumbnail}
                      alt=""
                      className="w-full h-full object-cover" />
                    
            </div>
            <div className="flex-1 min-w-0">
             <div className="text-xs text-foreground truncate">
              {item?.title}
             </div>
             <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 bg-muted rounded-full h-1">
               <div
                          className="bg-primary h-1 rounded-full transition-all duration-300"
                          style={{ width: `${item?.progress}%` }} />
                        
              </div>
              <span className="text-xs text-muted-foreground w-8">
               {item?.progress}%
              </span>
             </div>
            </div>
           </div>
                )}
         
         {stats?.downloading > 3 &&
                <div className="text-xs text-muted-foreground text-center py-1">
           +{stats?.downloading - 3} {t("batchDownloadManager.moreDownloading")} 
                </div>
                }
        </div>
       </div>
            }
     </div>
    </div>
   </div>
  </div>);

};

export default BatchProgressPanel;