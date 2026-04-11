import { useTranslation } from "react-i18next"; import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

// Quality badge colors
const QUALITY_COLORS = {
  '8K': 'bg-purple-500',
  '4K': 'bg-violet-500',
  '2K': 'bg-blue-500',
  '1080p': 'bg-success',
  '720p': 'bg-emerald-500',
  '480p': 'bg-warning',
  '360p': 'bg-orange-400',
  '240p': 'bg-orange-500',
  '144p': 'bg-muted-foreground',
  'Audio Only': 'bg-pink-500'
};

// Quality descriptions
const QUALITY_DESC = {
  '8K': 'Ultra premium 8K',
  '4K': 'Ultra HD 4K',
  '2K': 'Quad HD 2K',
  '1080p': 'Full HD Best quality',
  '720p': 'HD Great balance',
  '480p': 'SD Standard quality',
  '360p': 'Low Smaller file',
  '240p': 'Low Minimal quality',
  '144p': 'Minimum quality',
  'Audio Only': 'MP3 audio, no video'
};

const DownloadTabs = ({ videoData, onDownload }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('video');
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [customFilename, setCustomFilename] = useState(videoData?.title || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const tabs = [
    { id: 'video', label: 'Video', icon: 'Video' },
    { id: 'audio', label: 'Audio', icon: 'Music' },
    { id: 'thumbnail', label: 'Thumbnail', icon: 'Image' }];


  // Build dynamic quality lists from real video formats
  const { videoQualities, audioQualities } = useMemo(() => {
    const rawFormats = videoData?.formats || [];

    const videos = rawFormats.
      filter((f) => f.type === 'video' && f.quality && f.height > 0).
      sort((a, b) => b.height - a.height);

    // Deduplicate by quality label
    const seenLabels = new Set();
    const uniqueVideos = videos.filter((f) => {
      if (seenLabels.has(f.quality)) return false;
      seenLabels.add(f.quality);
      return true;
    });

    // If no real formats yet (loading / mock), use a safe fallback list
    const fallbackVideos = [
      { quality: '1080p', height: 1080, ext: 'mp4', type: 'video' },
      { quality: '720p', height: 720, ext: 'mp4', type: 'video' },
      { quality: '480p', height: 480, ext: 'mp4', type: 'video' },
      { quality: '360p', height: 360, ext: 'mp4', type: 'video' },
      { quality: '144p', height: 144, ext: 'mp4', type: 'video' }];


    const audios = rawFormats.filter((f) => f.type === 'audio');

    return {
      videoQualities: uniqueVideos.length ? uniqueVideos : fallbackVideos,
      audioQualities: audios.length ?
        audios :
        [{ quality: 'Audio Only', ext: 'mp3', type: 'audio' }]
    };
  }, [videoData?.formats]);

  // Thumbnail options (static)
  const thumbnailOptions = [
    { quality: 'Max Resolution', ext: 'jpg', type: 'thumbnail', description: '1920×1080' },
    { quality: 'High Resolution', ext: 'jpg', type: 'thumbnail', description: '1280×720' },
    { quality: 'Standard', ext: 'jpg', type: 'thumbnail', description: '640×480' }];


  // Active quality list
  const getQualityOptions = () => {
    switch (activeTab) {
      case 'audio': return audioQualities;
      case 'thumbnail': return thumbnailOptions;
      default: return videoQualities;
    }
  };

  // Ensure selectedQuality is valid when tab changes
  const activeOptions = getQualityOptions();
  const effectiveSelected = selectedQuality &&
    activeOptions.find((o) => o.quality === selectedQuality) ?
    selectedQuality :
    activeOptions[0]?.quality;

  // Preset buttons: Best / Mid / Low
  const getPresetButtons = () => {
    const opts = getQualityOptions();
    if (!opts.length) return [];
    const len = opts.length;
    if (len === 1) return [opts[0]];
    if (len === 2) return [opts[0], opts[1]];
    // Pick first (best), middle, last (lowest)
    const mid = Math.floor((len - 1) / 2);
    return [opts[0], opts[mid], opts[len - 1]];
  };

  const presetLabel = (idx, total) => {
    if (total === 1) return 'Best';
    if (idx === 0) return 'Best';
    if (idx === total - 1) return 'Lowest';
    return 'Medium';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handlePresetDownload = (option) => {
    onDownload({
      type: option.type || activeTab,
      quality: option.quality,
      format: option.ext || (activeTab === 'audio' ? 'mp3' : 'mp4'),
      format_id: option.format_id || null,
      filename: customFilename || videoData?.title
    });
  };

  const handleCustomDownload = () => {
    const option = activeOptions.find((o) => o.quality === effectiveSelected) || activeOptions[0];
    if (!option) return;
    onDownload({
      type: option.type || activeTab,
      quality: option.quality,
      format: option.ext || (activeTab === 'audio' ? 'mp3' : 'mp4'),
      format_id: option.format_id || null,
      filename: customFilename || videoData?.title
    });
  };

  const presets = getPresetButtons();

  return (
    <div className="space-y-6">

      {/* ── Tab Navigation ── */}
      <div className="flex items-center space-x-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-border/50 relative w-fit mx-auto lg:mx-0">
        {tabs.map((tab) =>
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedQuality(null); }}
            className={`
              relative z-10 flex items-center space-x- 2 px-5 py-2.5 rounded-xl text-sm font-medium
              transition-colors duration-300
              ${activeTab === tab.id ?
                'text-primary-foreground' :
                'text-muted-foreground hover:text-foreground'}
            `}>

            {activeTab === tab.id &&
              <motion.div
                layoutId="active-tab-pill"
                className="absolute inset-0 bg-primary shadow-glass-sm rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />

            }
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
          </button>
        )}
      </div>

      {/* ── Max Quality Badge ── */}
      {activeTab === 'video' && videoData?.max_quality &&
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">{t("videoDetailsDownload.maxAvailableQuality")}</span>
          <span className={`px-2 py-0.5 rounded text-white text-xs font-bold ${QUALITY_COLORS[videoData.max_quality] || 'bg-primary'}`}>
            {videoData.max_quality}
          </span>
        </div>
      }

      {/* ── Quick Preset Download ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t("videoDetailsDownload.quickDownload")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map((option, idx) => {
            const label = presetLabel(idx, presets.length);
            const color = QUALITY_COLORS[option.quality] || 'bg-primary';
            const size = formatFileSize(option.filesize);
            const desc = QUALITY_DESC[option.quality] || option.description || '';
            return (
              <div key={option.quality} className="glass-card p-4 hover:shadow-glass-md transition-all spring-smooth">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="font-semibold text-foreground">{label}</span>
                  </div>
                  {size && <span className="text-sm text-muted-foreground">~{size}</span>}
                </div>
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("videoDetailsDownload.quality")}</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded text-white ${color}`}>{option.quality}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("videoDetailsDownload.format")}</span>
                    <span className="text-foreground font-medium uppercase">{option.ext || 'mp4'}</span>
                  </div>
                  {option.fps &&
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("videoDetailsDownload.fps")}</span>
                      <span className="text-foreground font-medium">{option.fps}</span>
                    </div>
                  }
                  {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  fullWidth
                  className="rounded-xl shadow-sm hover:shadow-md transition-all spring-smooth"
                  onClick={() => handlePresetDownload(option)}
                  iconName="Download"
                  iconPosition="left"> {t("videoDetailsDownload.download")}

                  {option.quality}
                </Button>
              </div>);

          })}
        </div>
      </div>

      {/* ── Advanced Options ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t("videoDetailsDownload.advancedOptions")}</h3>

        <div className="glass-card p-6 space-y-6">

          {/* Quality Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t("videoDetailsDownload.selectQuality")}</label>
              <div className="relative group">
                <button
                  className="p-1 px-2 flex items-center space-x-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-accent/20 rounded-xl">

                  <Icon name="Info" size={14} />
                  <span>{t("videoDetailsDownload.qualityInfo")}</span>
                </button>

                {/* Popover/Tooltip Table */}
                <div className="absolute right-0 top-10 w-[300px] sm:w-[500px] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[60]">
                  <div className="bg-background dark:bg-background p-4 rounded-xl shadow-2xl border border-border">
                    <h4 className="text-sm font-bold mb-3 flex items-center">
                      <Icon name="Info" size={16} className="mr-2 text-primary" /> {t("videoDetailsDownload.qualityComparison")}

                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] sm:text-xs">
                        <thead>
                          <tr className="border-b border-border/50 text-muted-foreground">
                            <th className="text-left py-1">{t("videoDetailsDownload.quality1")}</th>
                            <th className="text-left py-1">{t("videoDetailsDownload.res")}</th>
                            <th className="text-left py-1">{t("videoDetailsDownload.format1")}</th>
                            <th className="text-left py-1">{t("videoDetailsDownload.size")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeOptions.map((option, idx) =>
                            <tr key={idx} className="border-b border-border/20">
                              <td className="py-1.5 font-bold">{option.quality}</td>
                              <td className="py-1.5 opacity-70">{option.resolution || '-'}</td>
                              <td className="py-1.5 uppercase opacity-70">{option.ext || 'mp4'}</td>
                              <td className="py-1.5 opacity-70">{formatFileSize(option.filesize) || '-'}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {activeOptions.map((option) => {
                const isSelected = effectiveSelected === option.quality;
                const color = QUALITY_COLORS[option.quality] || 'bg-primary';
                const size = formatFileSize(option.filesize);
                return (
                  <button
                    key={option.quality}
                    onClick={() => setSelectedQuality(option.quality)}
                    className={`
           p-3 rounded-xl border text-left transition-all spring-smooth
           ${isSelected ?
                        'border-primary bg-primary/10 text-primary' :
                        'border-border hover:border-primary/50 text-foreground'}
          `}>

                    <div className="flex items-center space-x-1.5 mb-1">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="font-semibold text-sm">{option.quality}</span>
                    </div>
                    <div className="text-xs opacity-60">
                      {option.resolution && option.resolution !== 'audio' ? option.resolution : ''}
                      {size ? ` • ~${size}` : ''}
                    </div>
                    {option.fps &&
                      <div className="text-xs opacity-60">{option.fps} {t("videoDetailsDownload.fps1")}</div>
                    }
                  </button>);

              })}
            </div>
          </div>

          {/* Filename */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t("videoDetailsDownload.customFilename")}</label>
            <div className="relative">
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent pr-16"
                placeholder={t("videoDetailsDownload.enterCustomFilename")} />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                .{activeTab === 'audio' ? 'mp3' : activeTab === 'thumbnail' ? 'jpg' : 'mp4'}
              </div>
            </div>
          </div>

          {/* Custom Download Button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="default"
              size="sm"
              className="px-10 rounded-xl shadow-sm hover:shadow-md transition-all spring-smooth"
              onClick={handleCustomDownload}
              iconName="Download"
              iconPosition="left"> {t("videoDetailsDownload.download")}

              {effectiveSelected || activeOptions[0]?.quality || ''}
            </Button>
          </div>
        </div>
      </div>

    </div>);

};

export default DownloadTabs;