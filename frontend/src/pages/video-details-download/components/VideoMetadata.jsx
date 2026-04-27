import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ShareModal from '../../../components/ui/ShareModal';
import { formatDate } from '../../../utils/dateFormat';
import { YTDeluxeStorage, STORAGE_KEYS } from '../../../utils/storage';

const VideoMetadata = ({ videoData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const handleKeywordClick = (keyword) => {
    if (!keyword) return;
    const cleanKeyword = keyword.startsWith('#') ? keyword.slice(1) : keyword;
    navigate(`/search-results?q=${encodeURIComponent(cleanKeyword)}`);
  };
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(videoData?.title || '');
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyDesc = () => {
    navigator.clipboard.writeText(videoData?.description || '');
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const linkifyText = (text) => {
    if (!text) return text;
    const combinedRegex = /(https?:\/\/[^\s]+|#[a-zA-Z0-9_]+)/g;
    const urlRegex = /https?:\/\/[^\s]+/;
    const hashtagRegex = /#[a-zA-Z0-9_]+/;

    return text.split(combinedRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline hover:text-primary/80 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      } else if (hashtagRegex.test(part)) {
        return (
          <span
            key={index}
            className="text-primary hover:underline hover:text-primary/80 cursor-pointer break-all font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              handleKeywordClick(part);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Sync with storage
  useEffect(() => {
    const checkSaved = async () => {
      if (!videoData?.id && !videoData?.url) return;
      const list = await YTDeluxeStorage.getItem(STORAGE_KEYS.SAVED, []);
      const rawId = videoData.id || videoData.url?.split('v=')?.[1]?.split('&')?.[0];
      setIsSaved(list.some(v => v.id === rawId));
    };
    checkSaved();
  }, [videoData]);

  const handleToggleSave = async () => {
    const list = await YTDeluxeStorage.getItem(STORAGE_KEYS.SAVED, []);
    const videoId = videoData.id || videoData.url?.split('v=')?.[1]?.split('&')?.[0];
    const existsIndex = list.findIndex(v => v.id === videoId);

    let newList = [...list];
    let saved = false;

    if (existsIndex !== -1) {
      newList.splice(existsIndex, 1);
      saved = false;
    } else {
      newList.unshift({
        id: videoId,
        title: videoData.title,
        thumbnail: videoData.thumbnail,
        channel: videoData.channel?.name,
        duration: videoData.duration,
        views: videoData.views,
        uploadDate: videoData.uploadDate,
        url: videoData.url,
        savedAt: new Date().toISOString()
      });
      saved = true;
    }

    await YTDeluxeStorage.setItem(STORAGE_KEYS.SAVED, newList);
    setIsSaved(saved);
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    
    let numericNum = num;
    if (typeof num === 'string') {
      // If it already has K, M, B suffix, return as is (like "1M+")
      if (/[KMB+]$/i.test(num)) return num;
      numericNum = parseInt(num.replace(/,/g, ''), 10);
    }

    if (isNaN(numericNum)) return `${num}`;

    if (numericNum >= 1000000000) {
      return `${(numericNum / 1000000000)?.toFixed(1).replace(/\.0$/, '')}B`;
    } else if (numericNum >= 1000000) {
      return `${(numericNum / 1000000)?.toFixed(1).replace(/\.0$/, '')}M`;
    } else if (numericNum >= 1000) {
      return `${(numericNum / 1000)?.toFixed(1).replace(/\.0$/, '')}K`;
    }
    return numericNum.toString();
  };

  const formatUploadDate = (date) => {
    if (!date) return 'Unknown date';
    const now = new Date();
    const uploadDate = new Date(date);

    if (isNaN(uploadDate.getTime())) {
      return 'Unknown date';
    }

    const diffTime = Math.abs(now - uploadDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-6">
      {/* Video Title */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-2xl lg:text-3xl font-black text-foreground leading-tight tracking-tight">
            {videoData?.title}
          </h1>
          <button
            onClick={handleCopyTitle}
            className={`shrink-0 mt-1 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
              ${copiedTitle 
                ? 'bg-success/10 text-success border border-success/30' 
                : 'bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20'
              }`}
            title="Copy Title"
          >
            <Icon name={copiedTitle ? "CheckCheck" : "Copy"} size={14} />
          </button>
        </div>

        {/* Video Stats */}
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-muted-foreground bg-black/5 dark:bg-white/5 inline-flex px-4 py-2 rounded-xl border border-border/50">
          <div className="flex items-center gap-1.5 text-foreground/90">
            <Icon name="Eye" size={16} className="text-primary" />
            <span>{formatNumber(videoData?.views)} views</span>
          </div>
          <span className="text-border text-lg leading-none">•</span>
          <div className="flex items-center gap-1.5 text-foreground/90">
            <Icon name="Calendar" size={16} className="text-primary" />
            <span>{formatUploadDate(videoData?.uploadDate)}</span>
          </div>
        </div>
      </div>

      {/* Channel Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/50 shadow-glass-sm transition-all hover:border-primary/20">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {videoData?.channel?.avatar ? (
              <img src={videoData.channel.avatar} alt={videoData.channel.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-primary/20 shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-xl">
                  {videoData?.channel?.name?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 
              className="text-lg font-bold text-foreground leading-tight cursor-pointer hover:text-primary hover:underline transition-colors"
              onClick={() => handleKeywordClick(videoData?.channel?.name)}
            >
              {videoData?.channel?.name}
            </h3>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              {formatNumber(videoData?.channel?.subscribers)} {t("videoDetailsDownload.subscribers")}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleToggleSave}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300
              ${isSaved 
                ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.15)]' 
                : 'bg-black/5 dark:bg-white/5 text-foreground hover:bg-primary/5 hover:text-primary border border-border/50 hover:border-primary/30'
              }`}
          >
            <Icon name={isSaved ? "BookmarkCheck" : "Bookmark"} size={16} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10 border border-border/50 transition-all duration-300"
          >
            <Icon name="Share" size={16} />
            <span>{t("videoDetailsDownload.share")}</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="relative group rounded-2xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-primary/20">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 opacity-50" />
        
        <div className="p-5 space-y-5">
          {/* Quick Info Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Icon name="Calendar" size={12} className="text-primary" />
                {t("videoDetailsDownload.uploaded")}
              </span>
              <span className="text-sm font-bold text-foreground">{formatDate(videoData?.uploadDate)}</span>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Icon name="Eye" size={12} className="text-primary" />
                {t("videoDetailsDownload.views")}
              </span>
              <span className="text-sm font-bold text-foreground">{formatNumber(videoData?.views)}</span>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Icon name="ThumbsUp" size={12} className="text-primary" />
                {t("videoDetailsDownload.likes")}
              </span>
              <span className="text-sm font-bold text-foreground">{formatNumber(videoData?.likes)}</span>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Icon name="MessageCircle" size={12} className="text-primary" />
                {t("videoDetailsDownload.comments")}
              </span>
              <span className="text-sm font-bold text-foreground">{formatNumber(videoData?.comments)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-foreground">{t("videoDetailsDownload.description")}</h3>
            <button
              onClick={handleCopyDesc}
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300
                ${copiedDesc 
                  ? 'bg-success/10 text-success border border-success/30' 
                  : 'bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20'
                }`}
              title="Copy Description"
            >
              <Icon name={copiedDesc ? "CheckCheck" : "Copy"} size={12} />
            </button>
          </div>

          <div className="space-y-3">
            <motion.div 
              initial={false}
              animate={{ height: isDescriptionExpanded ? 'auto' : '96px' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative overflow-hidden"
            >
              <div className="text-sm text-foreground/80 leading-relaxed font-medium pb-2">
                <p className="whitespace-pre-wrap">{linkifyText(videoData?.description)}</p>
              </div>
              <AnimatePresence>
                {!isDescriptionExpanded && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#f8f9fa] dark:from-[#0a0a0a] to-transparent pointer-events-none" 
                  />
                )}
              </AnimatePresence>
            </motion.div>

            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
            >
              {isDescriptionExpanded ? 'Show less' : 'Read more'}
              <Icon name={isDescriptionExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
            </button>
          </div>

          {isDescriptionExpanded && videoData?.tags && videoData.tags.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <div className="flex flex-wrap gap-2">
                {videoData.tags.map((tag, index) => (
                  <span
                    key={index}
                    onClick={() => handleKeywordClick(tag)}
                    className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>

      {isShareModalOpen && (
        <div onClick={(e) => e.stopPropagation()} className="relative z-[260]">
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            url={videoData?.url || `https://www.youtube.com/watch?v=${videoData?.originalId || videoData?.id?.split('_')?.[0]}`}
            title={videoData?.title}
          />
        </div>
      )}
    </div>
  );

};

export default VideoMetadata;