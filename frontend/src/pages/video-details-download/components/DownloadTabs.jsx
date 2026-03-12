import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

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
  'Audio Only': 'bg-pink-500',
};

// Quality descriptions
const QUALITY_DESC = {
  '8K': 'Ultra premium 8K',
  '4K': 'Ultra HD 4K',
  '2K': 'Quad HD 2K',
  '1080p': 'Full HD — Best quality',
  '720p': 'HD — Great balance',
  '480p': 'SD — Standard quality',
  '360p': 'Low — Smaller file',
  '240p': 'Low — Minimal quality',
  '144p': 'Minimum quality',
  'Audio Only': 'MP3 audio, no video',
};

const DownloadTabs = ({ videoData, onDownload }) => {
  const [activeTab, setActiveTab] = useState('video');
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [customFilename, setCustomFilename] = useState(videoData?.title || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const tabs = [
    { id: 'video', label: 'Video', icon: 'Video' },
    { id: 'audio', label: 'Audio', icon: 'Music' },
    { id: 'thumbnail', label: 'Thumbnail', icon: 'Image' },
  ];

  // ───── Build dynamic quality lists from real video formats ─────
  const { videoQualities, audioQualities } = useMemo(() => {
    const rawFormats = videoData?.formats || [];

    const videos = rawFormats
      .filter(f => f.type === 'video' && f.quality && f.height > 0)
      .sort((a, b) => b.height - a.height);

    // Deduplicate by quality label
    const seenLabels = new Set();
    const uniqueVideos = videos.filter(f => {
      if (seenLabels.has(f.quality)) return false;
      seenLabels.add(f.quality);
      return true;
    });

    // If no real formats yet (loading / mock), use a safe fallback list
    const fallbackVideos = [
      { quality: '1080p', height: 1080, ext: 'mp4', type: 'video' },
      { quality: '720p',  height: 720,  ext: 'mp4', type: 'video' },
      { quality: '480p',  height: 480,  ext: 'mp4', type: 'video' },
      { quality: '360p',  height: 360,  ext: 'mp4', type: 'video' },
      { quality: '144p',  height: 144,  ext: 'mp4', type: 'video' },
    ];

    const audios = rawFormats.filter(f => f.type === 'audio');

    return {
      videoQualities: uniqueVideos.length ? uniqueVideos : fallbackVideos,
      audioQualities: audios.length
        ? audios
        : [{ quality: 'Audio Only', ext: 'mp3', type: 'audio' }],
    };
  }, [videoData?.formats]);

  // ───── Thumbnail options (static) ─────
  const thumbnailOptions = [
    { quality: 'Max Resolution', ext: 'jpg', type: 'thumbnail', description: '1920×1080' },
    { quality: 'High Resolution', ext: 'jpg', type: 'thumbnail', description: '1280×720' },
    { quality: 'Standard',        ext: 'jpg', type: 'thumbnail', description: '640×480' },
  ];

  // ───── Active quality list ─────
  const getQualityOptions = () => {
    switch (activeTab) {
      case 'audio':     return audioQualities;
      case 'thumbnail': return thumbnailOptions;
      default:          return videoQualities;
    }
  };

  // Ensure selectedQuality is valid when tab changes
  const activeOptions = getQualityOptions();
  const effectiveSelected = selectedQuality &&
    activeOptions.find(o => o.quality === selectedQuality)
      ? selectedQuality
      : activeOptions[0]?.quality;

  // ───── Preset buttons: Best / Mid / Low ─────
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
    return 'Mid';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handlePresetDownload = (option) => {
    onDownload({
      type: option.type || activeTab,
      quality: option.quality,
      format: option.ext || (activeTab === 'audio' ? 'mp3' : 'mp4'),
      format_id: option.format_id || null,
      filename: customFilename || videoData?.title,
    });
  };

  const handleCustomDownload = () => {
    const option = activeOptions.find(o => o.quality === effectiveSelected) || activeOptions[0];
    if (!option) return;
    onDownload({
      type: option.type || activeTab,
      quality: option.quality,
      format: option.ext || (activeTab === 'audio' ? 'mp3' : 'mp4'),
      format_id: option.format_id || null,
      filename: customFilename || videoData?.title,
    });
  };

  const presets = getPresetButtons();

  return (
    <div className="space-y-6">

      {/* ── Tab Navigation ── */}
      <div className="flex space-x-1 glass-nav p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedQuality(null); }}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 spring-smooth flex-1 justify-center
              ${activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-glass-sm'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'}
            `}
          >
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Max Quality Badge ── */}
      {activeTab === 'video' && videoData?.max_quality && (
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Max available quality:</span>
          <span className={`px-2 py-0.5 rounded text-white text-xs font-bold ${QUALITY_COLORS[videoData.max_quality] || 'bg-primary'}`}>
            {videoData.max_quality}
          </span>
        </div>
      )}

      {/* ── Quick Preset Download ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Quick Download</h3>
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
                    <span className="text-muted-foreground">Quality:</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded text-white ${color}`}>{option.quality}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Format:</span>
                    <span className="text-foreground font-medium uppercase">{option.ext || 'mp4'}</span>
                  </div>
                  {option.fps && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">FPS:</span>
                      <span className="text-foreground font-medium">{option.fps}</span>
                    </div>
                  )}
                  {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  fullWidth
                  onClick={() => handlePresetDownload(option)}
                  iconName="Download"
                  iconPosition="left"
                >
                  Download {option.quality}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Advanced Options ── */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          iconName={showAdvanced ? 'ChevronUp' : 'ChevronDown'}
          iconPosition="right"
          className="w-full justify-between"
        >
          Advanced Options
        </Button>

        {showAdvanced && (
          <div className="glass-card p-6 space-y-6 animate-slide-down">

            {/* Quality Grid */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Select Quality</label>
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
                        p-3 rounded-lg border text-left transition-all spring-smooth
                        ${isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 text-foreground'}
                      `}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <div className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="font-semibold text-sm">{option.quality}</span>
                      </div>
                      <div className="text-xs opacity-60">
                        {option.resolution && option.resolution !== 'audio' ? option.resolution : ''}
                        {size ? ` • ~${size}` : ''}
                      </div>
                      {option.fps && (
                        <div className="text-xs opacity-60">{option.fps} fps</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filename */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Custom Filename</label>
              <div className="relative">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent pr-16"
                  placeholder="Enter custom filename"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  .{activeTab === 'audio' ? 'mp3' : activeTab === 'thumbnail' ? 'jpg' : 'mp4'}
                </div>
              </div>
            </div>

            {/* Custom Download Button */}
            <Button
              variant="default"
              size="lg"
              fullWidth
              onClick={handleCustomDownload}
              iconName="Download"
              iconPosition="left"
            >
              Download {effectiveSelected || activeOptions[0]?.quality || ''}
            </Button>
          </div>
        )}
      </div>

      {/* ── Quality Comparison Table ── */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Quality Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">Quality</th>
                <th className="text-left py-2 text-muted-foreground">Resolution</th>
                <th className="text-left py-2 text-muted-foreground">Format</th>
                <th className="text-left py-2 text-muted-foreground">Size</th>
                {activeTab === 'video' && <th className="text-left py-2 text-muted-foreground">FPS</th>}
              </tr>
            </thead>
            <tbody>
              {activeOptions.map((option, idx) => {
                const size = formatFileSize(option.filesize);
                return (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-2">
                      <span className={`text-white text-xs font-bold px-2 py-0.5 rounded ${QUALITY_COLORS[option.quality] || 'bg-primary'}`}>
                        {option.quality}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {option.resolution && option.resolution !== 'audio' ? option.resolution : '—'}
                    </td>
                    <td className="py-2 text-muted-foreground uppercase">{option.ext || 'mp4'}</td>
                    <td className="py-2 text-muted-foreground">{size ? `~${size}` : '—'}</td>
                    {activeTab === 'video' && (
                      <td className="py-2 text-muted-foreground">{option.fps || '—'}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DownloadTabs;