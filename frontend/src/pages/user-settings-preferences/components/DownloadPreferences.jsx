import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';

const DownloadPreferences = ({ preferences, onPreferencesChange }) => {
  const { t } = useTranslation();
  const [downloadPrefs, setDownloadPrefs] = useState(() => {
    const savedPath = localStorage.getItem('ytdeluxe_download_path');
    if (savedPath && (!preferences || !preferences.downloadPath)) {
      return { ...preferences, downloadPath: savedPath };
    }
    return preferences || {};
  });

  const isDesktop = typeof window !== 'undefined' && window.pywebview !== undefined;

  const qualityOptions = [
    { value: '2160p', label: '4K (2160p)', description: 'Ultra HD quality' },
    { value: '1440p', label: '2K (1440p)', description: 'Quad HD quality' },
    { value: '1080p', label: 'Full HD (1080p)', description: 'High definition' },
    { value: '720p', label: 'HD (720p)', description: 'Standard HD' },
    { value: '480p', label: 'SD (480p)', description: 'Standard definition' },
    { value: '360p', label: 'Low (360p)', description: 'Low quality' },
    { value: '144p', label: 'Minimum (144p)', description: 'Lowest quality' }
  ];

  const formatOptions = [
    { value: 'mp4', label: 'MP4', description: 'Most compatible video format' },
    { value: 'webm', label: 'WebM', description: 'Web optimized format' },
    { value: 'mkv', label: 'MKV', description: 'High quality container' },
    { value: 'avi', label: 'AVI', description: 'Legacy video format' }
  ];

  const audioFormatOptions = [
    { value: 'mp3', label: 'MP3', description: 'Most compatible audio format' },
    { value: 'aac', label: 'AAC', description: 'High quality audio' },
    { value: 'ogg', label: 'OGG', description: 'Open source format' },
    { value: 'wav', label: 'WAV', description: 'Uncompressed audio' }
  ];

  const namingConventionOptions = [
    { value: 'title', label: 'Video Title', description: 'Use original video title' },
    { value: 'title_channel', label: 'Title - Channel', description: 'Title with channel name' },
    { value: 'channel_title', label: 'Channel - Title', description: 'Channel name first' },
    { value: 'custom', label: 'Custom Template', description: 'Define your own pattern' }
  ];

  const handlePreferenceChange = (key, value) => {
    const updated = { ...downloadPrefs, [key]: value };
    setDownloadPrefs(updated);
    if (typeof onPreferencesChange === 'function') {
      onPreferencesChange(updated);
    }
    if (key === 'downloadPath') {
      localStorage.setItem('ytdeluxe_download_path', value);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Default Quality Settings */}
      <motion.div variants={itemVariants} className="glass-card p-6 group hover:shadow-glass transition-all duration-300">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{t('downloads.defaultQuality')}</h3>
          <p className="text-sm text-muted-foreground">{t('downloads.defaultQualityDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label={t('downloads.vidQuality')}
            description={t('downloads.vidQualityDesc')}
            options={qualityOptions}
            value={downloadPrefs?.defaultVideoQuality}
            onChange={(value) => handlePreferenceChange('defaultVideoQuality', value)}
          />

          <Select
            label={t('downloads.vidFormat')}
            description={t('downloads.vidFormatDesc')}
            options={formatOptions}
            value={downloadPrefs?.defaultVideoFormat}
            onChange={(value) => handlePreferenceChange('defaultVideoFormat', value)}
          />

          <Select
            label={t('downloads.audioFormat')}
            description={t('downloads.audioFormatDesc')}
            options={audioFormatOptions}
            value={downloadPrefs?.defaultAudioFormat}
            onChange={(value) => handlePreferenceChange('defaultAudioFormat', value)}
          />

          <div className="flex items-center space-x-4 pt-6">
            <Checkbox
              label={t('downloads.autoBest')}
              description={t('downloads.autoBestDesc')}
              checked={downloadPrefs?.autoSelectBestQuality}
              onChange={(e) => handlePreferenceChange('autoSelectBestQuality', e?.target?.checked)}
            />
          </div>
        </div>
      </motion.div>

      {/* File Naming */}
      <motion.div variants={itemVariants} className="glass-card p-6 group hover:shadow-glass transition-all duration-300">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{t('downloads.fileNaming')}</h3>
          <p className="text-sm text-muted-foreground">{t('downloads.fileNamingDesc')}</p>
        </div>

        <div className="space-y-6">
          <Select
            label={t('downloads.namingConv')}
            description={t('downloads.namingConvDesc')}
            options={namingConventionOptions}
            value={downloadPrefs?.namingConvention}
            onChange={(value) => handlePreferenceChange('namingConvention', value)}
          />

          <AnimatePresence>
            {downloadPrefs?.namingConvention === 'custom' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Input
                  label={t('downloads.customTemplate')}
                  description={t('downloads.customTemplateDesc')}
                  placeholder="{channel} - {title} [{quality}]"
                  value={downloadPrefs?.customTemplate}
                  onChange={(e) => handlePreferenceChange('customTemplate', e?.target?.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Checkbox
              label={t('downloads.removeSpecial')}
              description={t('downloads.removeSpecialDesc')}
              checked={downloadPrefs?.removeSpecialChars}
              onChange={(e) => handlePreferenceChange('removeSpecialChars', e?.target?.checked)}
            />

            <Checkbox
              label={t('downloads.addDate')}
              description={t('downloads.addDateDesc')}
              checked={downloadPrefs?.addDownloadDate}
              onChange={(e) => handlePreferenceChange('addDownloadDate', e?.target?.checked)}
            />
          </div>
        </div>
      </motion.div>

      {/* Storage Location - Desktop Only */}
      {isDesktop && (
        <motion.div variants={itemVariants} className="glass-card p-6 group hover:shadow-glass transition-all duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t('downloads.storageLocation')}</h3>
            <p className="text-sm text-muted-foreground">{t('downloads.storageLocationDesc')}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <Input
                  label={t('downloads.downloadFolder')}
                  value={downloadPrefs?.downloadPath || ''}
                  onChange={(e) => handlePreferenceChange('downloadPath', e?.target?.value)}
                  placeholder="/Users/username/Downloads"
                />
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  iconName="FolderOpen"
                  onClick={() => console.log('Open folder picker')}
                >
                  {t('downloads.browse')}
                </Button>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Checkbox
                label={t('downloads.channelFolders')}
                description={t('downloads.channelFoldersDesc')}
                checked={downloadPrefs?.createChannelFolders}
                onChange={(e) => handlePreferenceChange('createChannelFolders', e?.target?.checked)}
              />

              <Checkbox
                label={t('downloads.dateFolders')}
                description={t('downloads.dateFoldersDesc')}
                checked={downloadPrefs?.createDateFolders}
                onChange={(e) => handlePreferenceChange('createDateFolders', e?.target?.checked)}
              />
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
};

import { AnimatePresence } from 'framer-motion';
export default DownloadPreferences;