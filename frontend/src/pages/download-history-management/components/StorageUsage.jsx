import { useTranslation } from "react-i18next";
import React from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const StorageUsage = ({ totalSize, availableSpace, itemCount }) => {
  const { t } = useTranslation();
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const usedPercentage = totalSize > 0 ? Math.min(totalSize / (totalSize + availableSpace) * 100, 100) : 0;

  const getUsageColor = () => {
    if (usedPercentage >= 90) return 'bg-red-500';
    if (usedPercentage >= 75) return 'bg-orange-500';
    return 'bg-primary';
  };

  const getUsageTextColor = () => {
    if (usedPercentage >= 90) return 'text-red-500';
    if (usedPercentage >= 75) return 'text-orange-500';
    return 'text-primary';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl dark:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] overflow-hidden"
    >
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-black/5 dark:border-white/5">
              <Icon name="HardDrive" size={16} className="text-foreground/80" />
            </div>
            <span>{t("downloadHistoryManagement.storageUsage")}</span>
          </h3>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5">
            {itemCount} {t("downloadHistoryManagement.item")}{itemCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-semibold mb-3">
            <span className="text-muted-foreground">{t("downloadHistoryManagement.usedSpace")}</span>
            <span className={getUsageTextColor()}>{usedPercentage?.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-black/50 rounded-full h-3 shadow-inner overflow-hidden border border-black/5 dark:border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usedPercentage}%` }}
              transition={{ duration: 1, type: "spring", bounce: 0.2 }}
              className={`h-full rounded-full ${getUsageColor()} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ animation: 'shimmer 2s infinite' }} />
            </motion.div>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-transform hover:-translate-y-1 hover:shadow-md">
            <div className="text-xl md:text-2xl font-black text-foreground mb-1 flex items-baseline justify-center">
              {formatFileSize(totalSize).split(' ')[0]}
              <span className="text-sm font-bold ml-1 text-muted-foreground">{formatFileSize(totalSize).split(' ')[1]}</span>
            </div>
            <div className="text-[10px] md:text-xs font-semibold text-muted-foreground leading-tight">{t("downloadHistoryManagement.totalDownloaded")}</div>
          </div>
          
          <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-transform hover:-translate-y-1 hover:shadow-md">
            <div className="text-xl md:text-2xl font-black text-foreground mb-1 flex items-baseline justify-center">
              {formatFileSize(availableSpace).split(' ')[0]}
              <span className="text-sm font-bold ml-1 text-muted-foreground">{formatFileSize(availableSpace).split(' ')[1]}</span>
            </div>
            <div className="text-[10px] md:text-xs font-semibold text-muted-foreground leading-tight">{t("downloadHistoryManagement.availableSpace")}</div>
          </div>
          
          <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-transform hover:-translate-y-1 hover:shadow-md">
            <div className="text-xl md:text-2xl font-black text-foreground mb-1 flex items-baseline justify-center">
              {itemCount}
            </div>
            <div className="text-[10px] md:text-xs font-semibold text-muted-foreground leading-tight">{t("downloadHistoryManagement.totalFiles")}</div>
          </div>
        </div>

        {/* Storage Warning */}
        {usedPercentage >= 90 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3">
            <Icon name="AlertTriangle" size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-medium text-red-600 dark:text-red-400 leading-tight">
              {t("downloadHistoryManagement.storageSpaceIsRunning")}
            </div>
          </motion.div>
        )}

        {usedPercentage >= 75 && usedPercentage < 90 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start space-x-3">
            <Icon name="AlertCircle" size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400 leading-tight">
              {t("downloadHistoryManagement.storageSpaceIsGetting")}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default StorageUsage;