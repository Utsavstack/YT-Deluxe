import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import YTDeluxeAPI from '../../../utils/api';
import { formatDate } from '../../../utils/dateFormat';
import { YTDeluxeStorage, STORAGE_KEYS, isDesktop } from '../../../utils/storage';

const AccountManagement = ({ user, onUserUpdate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    name: 'User',
    avatar: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '' });
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('downloadDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const fileInputRef = useRef(null);

  // Load profile using platform-aware storage
  useEffect(() => {
    const loadProfile = async () => {
      const stored = await YTDeluxeStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        setUserProfile(stored);
      } else if (user) {
        const initial = { name: user.name || 'User', avatar: user.avatar || '' };
        setUserProfile(initial);
        await YTDeluxeStorage.setItem(STORAGE_KEYS.USER_PROFILE, initial);
      }
    };
    loadProfile();
  }, [user]);

  // Load real download history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const history = await YTDeluxeStorage.getHistory();
      const transformed = history.map((item, idx) => ({
        id: item.id || idx,
        title: item.title,
        channel: item.channel || '',
        thumbnail: item.thumbnail || '',
        format: item.format || 'mp4',
        quality: item.quality || '720p',
        fileSize: item.file_size || item.fileSize || 0,
        downloadDate: new Date(item.downloaded_at || item.downloadDate || Date.now()),
        duration: item.duration || 0,
      }));
      setDownloadHistory(transformed);
    } catch (err) {
      console.error("Failed to load history in settings:", err);
      setDownloadHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute stats from history
  const stats = useMemo(() => {
    const totalDownloads = downloadHistory.length;
    const totalBytes = downloadHistory.reduce((sum, item) => sum + (item.fileSize || 0), 0);
    const channels = new Set(downloadHistory.map(item => item.channel)).size;
    const formats = {};
    downloadHistory.forEach(item => {
      const f = (item.format || 'unknown').toUpperCase();
      formats[f] = (formats[f] || 0) + 1;
    });
    const topFormat = Object.entries(formats).sort((a, b) => b[1] - a[1])[0];

    return {
      totalDownloads,
      totalSize: formatBytes(totalBytes),
      uniqueChannels: channels,
      topFormat: topFormat ? `${topFormat[0]} (${topFormat[1]})` : '—',
    };
  }, [downloadHistory]);

  const sortedHistory = useMemo(() => {
    const sorted = [...downloadHistory];
    sorted.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'downloadDate') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return sorted.slice(0, 10);
  }, [downloadHistory, sortBy, sortOrder]);

  const sortOptions = [
    { value: 'downloadDate', label: 'Download Date', icon: 'Calendar' },
    { value: 'title', label: 'Title', icon: 'Type' },
    { value: 'fileSize', label: 'File Size', icon: 'HardDrive' },
    { value: 'channel', label: 'Channel', icon: 'Users' },
    { value: 'duration', label: 'Duration', icon: 'Clock' },
    { value: 'format', label: 'Format', icon: 'Film' },
  ];

  const handleEditToggle = async () => {
    if (isEditing) {
      const updated = { ...userProfile, name: editForm.name };
      setUserProfile(updated);
      await YTDeluxeStorage.setItem(STORAGE_KEYS.USER_PROFILE, updated);
      if (onUserUpdate) onUserUpdate(updated);
    } else {
      setEditForm({ name: userProfile.name });
    }
    setIsEditing(!isEditing);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const updated = { ...userProfile, avatar: reader.result };
        setUserProfile(updated);
        await YTDeluxeStorage.setItem(STORAGE_KEYS.USER_PROFILE, updated);
        if (onUserUpdate) onUserUpdate(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetData = async () => {
    if (confirm(t('profile.resetConfirm'))) {
      try {
        if (isDesktop()) {
          await YTDeluxeAPI.clearAllHistory();
        }
        await YTDeluxeStorage.removeItem(STORAGE_KEYS.HISTORY_WEB);
        setDownloadHistory([]);
      } catch (err) {
        console.error("Clear history failed:", err);
      }
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    try {
      if (isDesktop()) {
        await YTDeluxeAPI.deleteHistoryItem(id, false);
      }
      const historyItems = await YTDeluxeStorage.getItem(STORAGE_KEYS.HISTORY_WEB, []);
      const updated = historyItems.filter(item => item.id !== id);
      await YTDeluxeStorage.setItem(STORAGE_KEYS.HISTORY_WEB, updated);
      setDownloadHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">

      {/* Identity Card */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 relative overflow-hidden border border-border/50 bg-card/90 dark:bg-card/30 shadow-glass-xl group">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
        
        <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-5 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Icon name="User" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">{t('profile.identity')}</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">{t('profile.identityDesc')}</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              iconName={isEditing ? "Check" : "Edit"}
              iconPosition="left"
              onClick={handleEditToggle}
              className="rounded-xl px-5 shadow-sm"
            >
              {isEditing ? t('profile.save') : t('profile.edit')}
            </Button>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 relative z-10">
          {/* Avatar */}
          <div
            className={`relative group/avatar flex-shrink-0 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => isEditing && handleAvatarClick()}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <motion.div
              whileHover={isEditing ? { scale: 1.05 } : {}}
              className={`w-32 h-32 rounded-[2rem] overflow-hidden bg-muted border-4 transition-all duration-300 shadow-xl ${isEditing ? 'border-primary/50 group-hover/avatar:border-primary' : 'border-background dark:border-white/5'}`}
            >
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=0D8ABC&color=fff&size=128`; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/80">
                  <Icon name="User" size={48} className="text-muted-foreground/30" />
                </div>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                  <Icon name="Camera" size={28} className="text-white drop-shadow-lg" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Name Info */}
          <div className="flex-1 w-full flex flex-col justify-center py-2 text-center sm:text-left">
            {isEditing ? (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="max-w-md space-y-4">
                <Input
                  label={t('profile.displayName')}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ name: e.target.value })}
                  placeholder="Your name"
                />
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Camera"
                  iconPosition="left"
                  onClick={handleAvatarClick}
                  className="text-xs rounded-xl"
                >
                  Change Profile Photo
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-2 block">Account Holder</span>
                <h4 className="text-4xl font-black text-foreground tracking-tight">{userProfile.name}</h4>
                <div className="flex items-center justify-center sm:justify-start space-x-3 mt-4 text-[10px] font-bold">
                   <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5">
                     <Icon name="ShieldCheck" size={12} />
                     Verified User
                   </div>
                   <span className="text-muted-foreground/40">•</span>
                   <span className="text-muted-foreground tracking-widest">ID: #{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Download Statistics */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 relative overflow-hidden group border border-border/50 bg-card/90 dark:bg-card/30 shadow-glass-xl">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 group-hover:opacity-[0.04] transition-all duration-1000 pointer-events-none text-primary">
          <Icon name="Activity" size={200} />
        </div>

        <div className="flex items-center space-x-4 mb-8 border-b border-border/40 pb-5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
            <Icon name="BarChart2" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground tracking-tight">{t('profile.stats')}</h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">{t('profile.statsDesc')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-xs font-black text-muted-foreground animate-pulse uppercase tracking-widest">{t('profile.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {[
              { label: t('profile.totalDownloads'), value: stats.totalDownloads, icon: 'Download', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: t('profile.totalSize'), value: stats.totalSize, icon: 'HardDrive', color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
              { label: t('profile.uniqueChannels'), value: stats.uniqueChannels, icon: 'Users', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
              { label: t('profile.topFormat'), value: stats.topFormat, icon: 'Film', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-muted/30 dark:bg-muted/10 rounded-3xl p-6 border border-border/40 hover:border-border/80 transition-all duration-300 hover:shadow-glass-md flex flex-col items-center justify-center text-center group/stat overflow-hidden relative"
              >
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-all duration-500 shadow-inner group-hover/stat:scale-110`}>
                  <Icon name={stat.icon} size={24} />
                </div>
                <p className="text-3xl font-black text-foreground tracking-tighter leading-none mb-2">{stat.value}</p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Downloads Premium List */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 relative overflow-hidden border border-border/50 bg-card/90 dark:bg-card/30 shadow-glass-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Icon name="Clock" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">{t('profile.recentDownloads')}</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Your latest {Math.min(10, downloadHistory.length)} entries</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-sm"
              >
                <span>{sortOptions.find(s => s.value === sortBy)?.label}</span>
                <Icon name={showSortDropdown ? "ChevronUp" : "ChevronDown"} size={14} className="text-primary ml-2" />
              </button>
              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-card border border-border/50 shadow-glass-2xl z-50 overflow-hidden backdrop-blur-xl"
                  >
                    {sortOptions.map((option) => (
                      <button
                         key={option.value}
                         onClick={() => { setSortBy(option.value); setShowSortDropdown(false); }}
                         className={`w-full flex items-center space-x-3 px-4 py-3 text-xs text-left transition-all ${sortBy === option.value ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground font-medium'}`}
                      >
                         <Icon name={option.icon} size={14} className={sortBy === option.value ? 'text-primary' : 'text-muted-foreground'} />
                         <span>{option.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-sm"
            >
              <Icon name={sortOrder === 'desc' ? 'ArrowDown' : 'ArrowUp'} size={14} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center animate-pulse">
             <div className="w-10 h-10 bg-primary/10 rounded-full mx-auto mb-4" />
             <div className="h-4 bg-primary/10 w-32 rounded mx-auto" />
          </div>
        ) : sortedHistory.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <div className="w-20 h-20 rounded-3xl bg-background flex items-center justify-center mx-auto shadow-sm border border-border/40 mb-6">
              <Icon name="Inbox" size={32} className="text-muted-foreground/50" />
            </div>
            <p className="text-lg font-black text-foreground mb-1">{t('profile.noDownloads')}</p>
            <p className="text-xs text-muted-foreground max-w-[250px] mx-auto uppercase tracking-widest">{t('profile.noDownloadsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate('/download-history-management')}
                className="flex items-center p-3.5 bg-muted/30 dark:bg-black/20 rounded-2xl border border-border/30 hover:bg-muted/60 dark:hover:bg-black/40 hover:border-border/60 transition-all duration-300 group/item cursor-pointer relative"
              >
                {/* Individual Delete Button */}
                <button
                  onClick={(e) => handleDeleteItem(e, item.id)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shadow-lg z-20 hover:bg-red-600 active:scale-90"
                  title="Remove record"
                >
                  <Icon name="X" size={12} strokeWidth={3} />
                </button>

                {/* Thumbnail */}
                <div className="w-28 h-16 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/5 shadow-inner relative">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt="" 
                      className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" 
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} 
                    />
                  ) : null}
                  <div className={`w-full h-full items-center justify-center bg-muted/50 absolute inset-0 ${item.thumbnail ? 'hidden' : 'flex'}`}>
                    <Icon name="Video" size={16} className="text-muted-foreground/40" />
                  </div>
                </div>
                
                {/* Info Text */}
                <div className="flex-1 min-w-0 ml-4">
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate group-hover/item:text-primary transition-colors tracking-tight">
                    {item.title || 'Untitled Video'}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wide truncate max-w-[200px]">
                      {item.channel || 'Unknown Channel'}
                    </span>
                  </div>
                  
                  {/* Metadata Row matching HistoryCard */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 text-[9px] font-black text-foreground uppercase tracking-widest">
                    {/* File Format Badge */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 shadow-sm text-muted-foreground">
                      <Icon name={getFormatIcon(item.format)} size={10} className="text-primary/70" />
                      <span>{item.format || 'N/A'}</span>
                    </div>

                    {/* Quality Badge (Hidden if thumbnail) */}
                    {item.quality && item.quality.toLowerCase() !== 'thumbnail' && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 shadow-sm">
                        <span className={getQualityColor(item.quality)}>{item.quality}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Size & Date & Type */}
                <div className="text-right flex-shrink-0 ml-4 hidden sm:flex flex-col items-end justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 shadow-sm text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      <Icon name="HardDrive" size={10} className="opacity-50" />
                      <span>{formatBytes(item.fileSize || 0)}</span>
                    </div>

                    {(() => {
                      let type = 'Video';
                      let bgClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                      const fmt = (item.format || '').toLowerCase();
                      const qlty = (item.quality || '').toLowerCase();
                      
                      if (fmt === 'mp3' || qlty.includes('audio')) {
                        type = 'Music';
                        bgClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                      } else if (fmt === 'jpg' || qlty.includes('thumbnail') || qlty.includes('resolution')) {
                        type = 'Thumbnail';
                        bgClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                      }
                      
                      return (
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${bgClass}`}>
                          {type}
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider mt-auto pt-2">
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={11} className="opacity-30" />
                      <span>{formatDate(item.downloadDate)}</span>
                    </div>
                    <span className="opacity-20">•</span>
                    <div className="flex items-center gap-1">
                      <Icon name="Clock" size={11} className="opacity-30" />
                      <span>{new Date(item.downloadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            Total Records: <span className="text-foreground">{downloadHistory.length}</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            iconName="Trash2"
            iconPosition="left"
            className="border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold rounded-xl px-5 transition-all"
            onClick={handleResetData}
            disabled={downloadHistory.length === 0}
          >
            {t('profile.clearHistory')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const getFormatIcon = (format) => {
  switch ((format || '').toLowerCase()) {
    case 'mp4': return 'Video';
    case 'mp3': return 'Music';
    case 'webm': return 'FileVideo';
    default: return 'File';
  }
};

const getQualityColor = (quality) => {
  const q = (quality || '').toLowerCase();
  if (q.includes('4320p') || q.includes('8k')) return 'text-purple-500 font-black';
  if (q.includes('2160p') || q.includes('4k')) return 'text-rose-500 font-bold';
  if (q.includes('1440p') || q.includes('2k')) return 'text-amber-500 font-bold';
  if (q.includes('1080p')) return 'text-emerald-500 font-bold';
  if (q.includes('720p')) return 'text-primary font-bold';
  if (q.includes('480p')) return 'text-warning';
  return 'text-muted-foreground';
};

export default AccountManagement;