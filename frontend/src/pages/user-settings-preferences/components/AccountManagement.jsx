import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import YTDeluxeAPI from '../../../utils/api';
import { formatDate } from '../../../utils/dateFormat';

const AccountManagement = ({ user, onUserUpdate }) => {
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState({
    name: 'Cristiano',
    avatar: '/assets/images/developer.jpg',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '' });
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('downloadDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const fileInputRef = useRef(null);

  // Load profile from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ytdeluxe_user_profile');
    if (stored) {
      try { setUserProfile(JSON.parse(stored)); } catch { }
    } else if (user) {
      setUserProfile({ name: user.name || 'User', avatar: user.avatar || '' });
    }
  }, [user]);

  // Load real download history from backend/localStorage
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await YTDeluxeAPI.getDownloadHistory();
      const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;

      if (isDesktop && response.history) {
        const transformed = response.history.map((item, idx) => ({
          id: item.id || idx,
          title: item.title,
          channel: item.channel || '',
          thumbnail: item.thumbnail || '',
          format: item.format || 'mp4',
          quality: item.quality || '720p',
          fileSize: item.file_size || 0,
          downloadDate: item.downloaded_at ? new Date(item.downloaded_at) : new Date(),
          duration: item.duration || 0,
        }));
        setDownloadHistory(transformed);
      } else {
        const localHistory = JSON.parse(localStorage.getItem('ytdeluxe_web_history') || '[]');
        setDownloadHistory(localHistory.map(item => ({
          ...item,
          downloadDate: new Date(item.downloadDate || Date.now())
        })));
      }
    } catch {
      setDownloadHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute real stats from history
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

  // Sort history for the list view
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
    return sorted.slice(0, 10); // Show latest 10
  }, [downloadHistory, sortBy, sortOrder]);

  const sortOptions = [
    { value: 'downloadDate', label: 'Download Date', icon: 'Calendar' },
    { value: 'title', label: 'Title', icon: 'Type' },
    { value: 'fileSize', label: 'File Size', icon: 'HardDrive' },
    { value: 'channel', label: 'Channel', icon: 'Users' },
    { value: 'duration', label: 'Duration', icon: 'Clock' },
    { value: 'format', label: 'Format', icon: 'Film' },
  ];

  const handleEditToggle = () => {
    if (isEditing) {
      const updated = { ...userProfile, name: editForm.name };
      setUserProfile(updated);
      localStorage.setItem('ytdeluxe_user_profile', JSON.stringify(updated));
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
      reader.onloadend = () => {
        const updated = { ...userProfile, avatar: reader.result };
        setUserProfile(updated);
        localStorage.setItem('ytdeluxe_user_profile', JSON.stringify(updated));
        if (onUserUpdate) onUserUpdate(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetData = () => {
    if (confirm(t('profile.resetConfirm'))) {
      localStorage.removeItem('ytdeluxe_web_history');
      setDownloadHistory([]);
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
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 group hover:shadow-glass-sm transition-all duration-500">
        <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="User" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">{t('profile.identity')}</h3>
              <p className="text-[11px] text-muted-foreground font-medium">{t('profile.identityDesc')}</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              iconName={isEditing ? "Check" : "Edit"}
              iconPosition="left"
              onClick={handleEditToggle}
            >
              {isEditing ? t('profile.save') : t('profile.edit')}
            </Button>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-5 sm:space-y-0 sm:space-x-6">
          {/* Avatar */}
          <div
            className={`relative group/avatar flex-shrink-0 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => isEditing && handleAvatarClick()}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <motion.div
              whileHover={isEditing ? { scale: 1.05 } : {}}
              className={`w-24 h-24 rounded-2xl overflow-hidden bg-muted border-2 transition-all duration-300 shadow-glass ${isEditing ? 'border-primary/50 group-hover/avatar:border-primary' : 'border-primary/20'}`}
            >
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=0D8ABC&color=fff&size=128`; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Icon name="User" size={36} className="text-muted-foreground/40" /></div>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-2xl">
                  <Icon name="Camera" size={22} className="text-white drop-shadow-md" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Name */}
          <div className="flex-1 w-full flex flex-col justify-center">
            {isEditing ? (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="max-w-sm space-y-4">
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
                  className="text-xs"
                >
                  Change Profile Photo
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center sm:text-left">
                <h4 className="text-2xl font-black text-foreground tracking-tight mt-8">{userProfile.name}</h4>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Download Statistics — real data from history */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
          <Icon name="BarChart2" size={140} />
        </div>

        <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="BarChart2" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">{t('profile.stats')}</h3>
              <p className="text-[11px] text-muted-foreground font-medium">{t('profile.statsDesc')}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">{t('profile.loading')}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {[
              { label: t('profile.totalDownloads'), value: stats.totalDownloads, icon: 'Download' },
              { label: t('profile.totalSize'), value: stats.totalSize, icon: 'HardDrive' },
              { label: t('profile.uniqueChannels'), value: stats.uniqueChannels, icon: 'Users' },
              { label: t('profile.topFormat'), value: stats.topFormat, icon: 'Film' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -3, scale: 1.02 }}
                className="glass rounded-xl p-5 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glass-sm flex flex-col items-center justify-center text-center group/stat"
              >
                <div className="w-11 h-11 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-3 group-hover/stat:bg-primary group-hover/stat:text-white transition-colors">
                  <Icon name={stat.icon} size={20} />
                </div>
                <p className="text-xl font-black text-foreground tracking-tight leading-none mb-1.5">{stat.value}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Downloads — like history page */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-border/40 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="Clock" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">{t('profile.recentDownloads')}</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Your latest {Math.min(10, downloadHistory.length)} of {downloadHistory.length} downloads</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-card border border-border/50 text-xs font-medium text-foreground hover:border-primary/30 transition-colors"
              >
                <span>{sortOptions.find(s => s.value === sortBy)?.label}</span>
                <Icon name={showSortDropdown ? "ChevronUp" : "ChevronDown"} size={14} />
              </button>
              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-card border border-border shadow-glass-md z-50 overflow-hidden"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSortBy(option.value); setShowSortDropdown(false); }}
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-xs text-left transition-colors ${sortBy === option.value ? 'bg-primary text-white font-bold' : 'hover:bg-accent text-foreground'}`}
                      >
                        <Icon name={option.icon} size={14} />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Sort order toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 rounded-lg bg-card border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
            >
              <Icon name={sortOrder === 'desc' ? 'ArrowDown' : 'ArrowUp'} size={14} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">{t('profile.loading')}</div>
        ) : sortedHistory.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
              <Icon name="Download" size={28} className="text-primary/40" />
            </div>
            <p className="text-sm font-bold text-foreground">{t('profile.noDownloads')}</p>
            <p className="text-xs text-muted-foreground">{t('profile.noDownloadsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ x: 3 }}
                className="flex items-center space-x-4 p-3 glass rounded-xl border border-transparent hover:border-primary/20 transition-all duration-200 cursor-default group/item"
              >
                {/* Thumbnail */}
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/30">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className={`w-full h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${item.thumbnail ? 'hidden' : 'flex'}`}><Icon name="Play" size={14} className="text-primary/60" /></div>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover/item:text-primary transition-colors">{item.title || 'Untitled'}</p>
                  <div className="flex items-center space-x-3 mt-0.5">
                    <span className="text-[11px] text-muted-foreground truncate">{item.channel}</span>
                    <span className="text-[10px] text-muted-foreground/60">•</span>
                    <span className="text-[10px] text-muted-foreground/70">{(item.format || '').toUpperCase()}</span>
                    <span className="text-[10px] text-muted-foreground/60">•</span>
                    <span className="text-[10px] text-muted-foreground/70">{item.quality}</span>
                  </div>
                </div>
                {/* Size & Date */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs font-bold text-foreground">{formatBytes(item.fileSize || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(item.downloadDate)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Reset Data */}
        {downloadHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/30 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              iconName="Trash2"
              iconPosition="left"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
              onClick={handleResetData}
            >
              {t('profile.clearHistory')}
            </Button>
          </div>
        )}
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

export default AccountManagement;