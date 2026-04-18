import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../utils/dateFormat';
import { motion, AnimatePresence } from 'framer-motion';

const HistoryCard = ({ item, onRedownload, onDelete, onOpenLocation, onShare, isSelected, onSelect }) => {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (totalSeconds) => {
    if (totalSeconds == null) return '';
    const s = Math.round(totalSeconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isTrimmed = (item?.trim_start > 0) || (item?.trim_end > 0 && item?.trim_end < (item?.duration - 1));

  const getFormatIcon = (format) => {
    switch (format?.toLowerCase()) {
      case 'mp4': return 'Video';
      case 'mp3': return 'Music';
      case 'webm': return 'FileVideo';
      default: return 'File';
    }
  };

  const getQualityColor = (quality) => {
    const q = quality?.toLowerCase() || '';
    if (q.includes('4320p') || q.includes('8k')) return 'text-purple-500 font-black';
    if (q.includes('2160p') || q.includes('4k')) return 'text-rose-500 font-bold';
    if (q.includes('1440p') || q.includes('2k')) return 'text-amber-500 font-bold';
    if (q.includes('1080p')) return 'text-emerald-500 font-bold';
    if (q.includes('720p')) return 'text-primary font-bold';
    if (q.includes('480p')) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      layout
      className={`glass-card hover:shadow-glass-lg transition-all duration-300 spring-smooth group relative overflow-hidden ${isSelected ? 'ring-2 ring-primary border-primary/50' : 'border-border/40'
        }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-4 relative z-10">
        <div className="flex items-start gap-0">
          {/* Selection Checkbox - Animated to remove gap by default */}
          <AnimatePresence initial={false}>
            {(showActions || isSelected) && (
              <motion.div
                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                animate={{ width: 32, opacity: 1, marginRight: 16 }}
                exit={{ width: 0, opacity: 0, marginRight: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-shrink-0 pt-1.5 overflow-hidden"
              >
                <button
                  onClick={() => onSelect(item?.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm ${isSelected
                    ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-primary/30'
                    : 'border-border/60 bg-muted/50 hover:border-primary/50 dark:border-white/20 dark:bg-white/5'
                    }`}
                >
                  {isSelected && <Icon name="Check" size={12} strokeWidth={3} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-20 rounded-2xl overflow-hidden bg-black/40 group-hover:shadow-glass-md transition-all border border-white/5">
              <Image
                src={item?.thumbnail}
                alt={item?.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-1.5 right-1.5 bg-black/90 backdrop-blur-md text-[9px] font-black text-white px-1.5 py-0.5 rounded-lg shadow-lg border border-white/10 uppercase tracking-tighter">
                {item?.duration ? formatDuration(item.duration) : '0:00'}
              </div>
              {isTrimmed && (
                <div className="absolute top-1.5 left-1.5 bg-violet-600/90 backdrop-blur-md text-[8px] font-black text-white px-1.5 py-0.5 rounded-md shadow-lg border border-violet-400/30 flex items-center gap-0.5">
                  <Icon name="Scissors" size={8} />
                  <span>Trimmed</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 ml-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors tracking-tight">
                  {item?.title || 'Untitled Video'}
                </h3>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wide truncate max-w-[200px]">
                    {item?.channel || 'Unknown Channel'}
                  </span>
                </div>
              </div>

              {/* Quick Actions - Floating Pill Style */}
              <div className={`flex items-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 shadow-glass-sm ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                <button
                  onClick={() => onRedownload(item)}
                  className="p-1.5 rounded-full transition-all hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  title={t("downloadHistoryManagement.redownload")}
                >
                  <Icon name="Download" size={14} />
                </button>

                {item.type !== 'saved' && (
                  <button
                    onClick={() => onOpenLocation(item)}
                    className="p-1.5 rounded-full transition-all hover:bg-white/10 text-muted-foreground hover:text-foreground"
                    title="Open File Location"
                  >
                    <Icon name="FolderOpen" size={14} />
                  </button>
                )}

                <button
                  onClick={() => onShare(item)}
                  className="p-1.5 rounded-full transition-all hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  title={t("homeSearchDashboard.shareVideo")}
                >
                  <Icon name="Share2" size={14} />
                </button>

                <div className="w-px h-3 bg-white/10 mx-0.5" />

                <button
                  onClick={() => onDelete(item)}
                  className="p-1.5 rounded-full transition-all hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                  title={t("downloadHistoryManagement.delete1")}
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>

            {/* Metadata Footer - Improved Grid/Layout */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[9px] font-black text-foreground uppercase tracking-widest">
                {item.type !== 'saved' && (
                  <>
                    {/* File Format Badge */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 shadow-sm text-muted-foreground">
                      <Icon name={getFormatIcon(item?.format)} size={10} className="text-primary/70" />
                      <span>{item?.format || 'N/A'}</span>
                    </div>

                    {/* Quality Badge (Hidden if thumbnail to avoid double labels) */}
                    {item?.quality && item.quality.toLowerCase() !== 'thumbnail' && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 shadow-sm">
                        <span className={getQualityColor(item?.quality)}>{item?.quality}</span>
                      </div>
                    )}

                    {/* Size Badge */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 shadow-sm text-muted-foreground">
                      <Icon name="HardDrive" size={10} className="opacity-50" />
                      <span>{formatFileSize(item?.fileSize || 0)}</span>
                    </div>
                  </>
                )}

                {item.type === 'saved' && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 shadow-sm text-primary">
                    <Icon name="Bookmark" size={10} />
                    <span>Saved Video</span>
                  </div>
                )}

                {/* Trimmed Badge */}
                {isTrimmed && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 shadow-sm text-violet-500">
                    <Icon name="Scissors" size={10} />
                    <span>{formatTimestamp(item.trim_start)} – {formatTimestamp(item.trim_end)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {(() => {
                  const fmt = (item?.format || '').toLowerCase();
                  const qlty = (item?.quality || '').toLowerCase();
                  let type = 'Video';
                  let cls = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                  if (item.type === 'saved') {
                    type = 'Saved'; cls = 'bg-primary/10 text-primary border-primary/20';
                  } else if (fmt === 'mp3' || qlty.includes('audio') || qlty.includes('kbps')) {
                    type = 'Music'; cls = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                  } else if (fmt === 'jpg' || fmt === 'png' || qlty.includes('thumbnail') || qlty.includes('resolution')) {
                    type = 'Thumbnail'; cls = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                  }
                  return (
                    <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${cls}`}>
                      {type}
                    </span>
                  );
                })()}
                <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider">
                  <Icon name="Calendar" size={11} className="opacity-30" />
                  <span>{formatDate(item?.downloadDate)}</span>
                  <span className="opacity-30"><Icon name="Clock" size={11} /></span>
                  <span>
                    {(() => {
                      try {
                        const d = new Date(item?.downloadDate);
                        return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch { return '--:--'; }
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
    </motion.div>
  );
};

export default HistoryCard;