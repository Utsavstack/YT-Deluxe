import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

export const FileTypeBreakdown = ({ history = [] }) => {
  const stats = useMemo(() => {
    const data = {
      video: { size: 0, count: 0, color: 'bg-blue-500', label: 'Videos', icon: 'Video' },
      audio: { size: 0, count: 0, color: 'bg-purple-500', label: 'Audio', icon: 'Music' },
      other: { size: 0, count: 0, color: 'bg-emerald-500', label: 'Cover', icon: 'Image' }
    };

    let totalSize = 0;

    history.forEach(item => {
      const size = item.fileSize || 0;
      totalSize += size;
      
      const type = item.type?.toLowerCase() || '';
      const format = item.format?.toLowerCase() || '';
      
      if (type.includes('video') || format === 'mp4' || format === 'webm' || format === 'mkv') {
        data.video.size += size;
        data.video.count++;
      } else if (type.includes('audio') || format === 'mp3' || format === 'm4a' || format === 'wav') {
        data.audio.size += size;
        data.audio.count++;
      } else {
        data.other.size += size;
        data.other.count++;
      }
    });

    return { data: Object.values(data), totalSize };
  }, [history]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  return (
    <div className="bg-white/50 dark:bg-black/20 rounded-[2rem] border border-slate-200/50 dark:border-white/5 p-6 md:p-8 w-full h-full shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-foreground flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-black/5 dark:border-white/5">
            <Icon name="PieChart" size={16} className="text-foreground/80" />
          </div>
          <span>Content Breakdown</span>
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-start p-4 sm:p-5 bg-slate-100 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5">
        {/* Info Box to align with Path Display */}
        <div className="mb-6 p-3 bg-white/60 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Icon name="PieChart" size={10} />
              Storage BreakDown
            </span>
          </div>
        </div>

        {/* Percentage Cards */}
        <div className="flex items-center gap-2 mb-3">
          {stats.data.map((item, idx) => {
            const percentage = stats.totalSize > 0 ? ((item.size / stats.totalSize) * 100).toFixed(1) : 0;
            return (
              <div key={idx} className="flex-1 bg-white/60 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 px-1.5 sm:px-2 py-1 flex items-center justify-between gap-0.5 sm:gap-1 shadow-sm overflow-hidden">
                <span className="text-[9px] xl:text-[10px] font-semibold text-foreground/70 whitespace-nowrap truncate">{item.label}</span>
                <span className={`text-[9px] xl:text-[10px] font-bold shrink-0 ${item.color.replace('bg-', 'text-')}`}>
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Multi-color Progress Bar */}
        <div className="h-3 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden flex mb-6 shadow-inner">
          {stats.totalSize > 0 ? stats.data.map((item, idx) => (
            item.size > 0 && (
              <motion.div
                key={idx}
                initial={{ width: 0 }}
                animate={{ width: `${(item.size / stats.totalSize) * 100}%` }}
                className={`h-full ${item.color}`}
                title={`${item.label}: ${formatFileSize(item.size)}`}
              />
            )
          )) : (
            <div className="h-full w-full bg-slate-300 dark:bg-white/10" />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 mt-auto">
          {stats.data.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center sm:items-start p-2 xl:p-2.5 bg-white/60 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2.5 h-2.5 shrink-0 rounded-full ${item.color} shadow-sm`} />
                <span className="text-[10px] sm:text-xs font-medium text-foreground truncate">{item.label}</span>
              </div>
              <div className="text-[11px] sm:text-xs xl:text-sm font-bold text-foreground whitespace-nowrap tracking-tight text-center sm:text-left">
                {formatFileSize(item.size)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">
                {item.count} {item.count === 1 ? 'item' : 'items'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
