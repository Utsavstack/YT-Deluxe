import { useTranslation } from "react-i18next";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import CustomDropdown from '../../../components/ui/CustomDropdown';

const CONTAINER_OPTIONS = [
  { value: 'auto', label: 'Auto - Native Stream (Recommended!)', color: 'bg-emerald-500' },
  { value: 'mp4', label: 'MP4 - Universal', color: 'bg-blue-500' },
  { value: 'mkv', label: 'MKV - Lossless merge', color: 'bg-pink-500' },
  { value: 'webm', label: 'WebM - Web optimized', color: 'bg-purple-500' },
  { value: 'mov', label: 'MOV - Apple compatible', color: 'bg-amber-500' }
];

const ExtDropdown = ({ filenameExt, selectedContainer, setSelectedContainer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 text-xs font-mono font-bold text-primary border border-primary/30 hover:border-primary/50 shadow-sm transition-colors"
      >
        .{filenameExt}
        <Icon name="ChevronDown" size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 bottom-full mb-2 w-max min-w-[220px] z-[120] rounded-xl border border-border/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] bg-white dark:bg-[#0f0f0f] overflow-hidden"
          >
            {CONTAINER_OPTIONS.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => { setSelectedContainer(opt.value); setIsOpen(false); }}
                className={`w-full px-4 py-3 text-left text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between group ${i !== CONTAINER_OPTIONS.length - 1 ? 'border-b border-border/30' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${opt.color} shrink-0`} />
                  <span className="font-medium">{opt.label}</span>
                </div>
                {selectedContainer === opt.value && <Icon name="Check" size={14} className="text-primary shrink-0 ml-3" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quality badge colors (Changes I: extended with audio quality labels)
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
  'High Quality': 'bg-pink-500',
  'Medium Quality': 'bg-rose-400',
  'Low Quality': 'bg-rose-300',
  'Max Resolution': 'bg-purple-500',
  'High Resolution': 'bg-blue-500',
  'Standard': 'bg-emerald-500',
};

// Quality active glow styles (hover + selected)
const QUALITY_ACTIVE_STYLES = {
  '8K': { hover: 'hover:shadow-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5', selected: 'border-transparent bg-purple-500/10 ring-[1.5px] ring-purple-500 shadow-[0_10px_40px_-10px_rgba(168,85,247,0.35)] z-20', gradient: 'from-purple-500/20' },
  '4K': { hover: 'hover:shadow-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/5', selected: 'border-transparent bg-violet-500/10 ring-[1.5px] ring-violet-500 shadow-[0_10px_40px_-10px_rgba(139,92,246,0.35)] z-20', gradient: 'from-violet-500/20' },
  '2K': { hover: 'hover:shadow-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5', selected: 'border-transparent bg-blue-500/10 ring-[1.5px] ring-blue-500 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.35)] z-20', gradient: 'from-blue-500/20' },
  '1080p': { hover: 'hover:shadow-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5', selected: 'border-transparent bg-emerald-500/10 ring-[1.5px] ring-emerald-500 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.35)] z-20', gradient: 'from-emerald-500/20' },
  '720p': { hover: 'hover:shadow-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5', selected: 'border-transparent bg-emerald-500/10 ring-[1.5px] ring-emerald-500 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.35)] z-20', gradient: 'from-emerald-500/20' },
  '480p': { hover: 'hover:shadow-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/5', selected: 'border-transparent bg-amber-500/10 ring-[1.5px] ring-amber-500 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.35)] z-20', gradient: 'from-amber-500/20' },
  '360p': { hover: 'hover:shadow-orange-400/20 hover:border-orange-400/50 hover:bg-orange-400/5', selected: 'border-transparent bg-orange-400/10 ring-[1.5px] ring-orange-400 shadow-[0_10px_40px_-10px_rgba(251,146,60,0.35)] z-20', gradient: 'from-orange-400/20' },
  '240p': { hover: 'hover:shadow-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5', selected: 'border-transparent bg-orange-500/10 ring-[1.5px] ring-orange-500 shadow-[0_10px_40px_-10px_rgba(249,115,22,0.35)] z-20', gradient: 'from-orange-500/20' },
  '144p': { hover: 'hover:shadow-gray-500/20 hover:border-gray-500/50 hover:bg-gray-500/5', selected: 'border-transparent bg-gray-500/10 ring-[1.5px] ring-gray-500 shadow-[0_10px_40px_-10px_rgba(107,114,128,0.35)] z-20', gradient: 'from-gray-500/20' },
  'Audio Only': { hover: 'hover:shadow-pink-500/20 hover:border-pink-500/50 hover:bg-pink-500/5', selected: 'border-transparent bg-pink-500/10 ring-[1.5px] ring-pink-500 shadow-[0_10px_40px_-10px_rgba(236,72,153,0.35)] z-20', gradient: 'from-pink-500/20' },
  'High Quality': { hover: 'hover:shadow-pink-500/20 hover:border-pink-500/50 hover:bg-pink-500/5', selected: 'border-transparent bg-pink-500/10 ring-[1.5px] ring-pink-500 shadow-[0_10px_40px_-10px_rgba(236,72,153,0.35)] z-20', gradient: 'from-pink-500/20' },
  'Medium Quality': { hover: 'hover:shadow-rose-400/20 hover:border-rose-400/50 hover:bg-rose-400/5', selected: 'border-transparent bg-rose-400/10 ring-[1.5px] ring-rose-400 shadow-[0_10px_40px_-10px_rgba(251,113,133,0.35)] z-20', gradient: 'from-rose-400/20' },
  'Low Quality': { hover: 'hover:shadow-rose-300/20 hover:border-rose-300/50 hover:bg-rose-300/5', selected: 'border-transparent bg-rose-300/10 ring-[1.5px] ring-rose-300 shadow-[0_10px_40px_-10px_rgba(253,164,175,0.35)] z-20', gradient: 'from-rose-300/20' },
  'Max Resolution': { hover: 'hover:shadow-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5', selected: 'border-transparent bg-purple-500/10 ring-[1.5px] ring-purple-500 shadow-[0_10px_40px_-10px_rgba(168,85,247,0.35)] z-20', gradient: 'from-purple-500/20' },
  'High Resolution': { hover: 'hover:shadow-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5', selected: 'border-transparent bg-blue-500/10 ring-[1.5px] ring-blue-500 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.35)] z-20', gradient: 'from-blue-500/20' },
  'Standard': { hover: 'hover:shadow-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5', selected: 'border-transparent bg-emerald-500/10 ring-[1.5px] ring-emerald-500 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.35)] z-20', gradient: 'from-emerald-500/20' },
  'Universal MP3': { hover: 'hover:shadow-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/5', selected: 'border-transparent bg-amber-500/10 ring-[1.5px] ring-amber-500 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.35)] z-20', gradient: 'from-amber-500/20' },
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
  'Audio Only': 'MP3 audio, no video',
  'High Quality': 'Best audio bitrate',
  'Medium Quality': 'Balanced quality',
  'Low Quality': 'Smallest audio file',
};

// Format colors for clear identification
const FORMAT_COLORS = {
  mp4: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
  webm: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400',
  mkv: 'bg-pink-500/10 border-pink-500/20 text-pink-700 dark:text-pink-400',
  opus: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  mp3: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
  m4a: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400',
  jpg: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
};

// Change I: Codec badge definitions (Lucide icons + bestFor tooltip no emojis)
const CODEC_BADGE = {
  avc1: {
    label: 'H.264', subLabel: 'Compatible', icon: 'Shield',
    cls: 'text-green-600 bg-green-500/10 border border-green-500/20',
    bestFor: 'Best for: Old devices, TVs, WhatsApp sharing, max compatibility',
  },
  vp9: {
    label: 'VP9', subLabel: 'Compressed', icon: 'Zap',
    cls: 'text-blue-500 bg-blue-500/10 border border-blue-500/20',
    bestFor: 'Best for: Storage saving, YouTube quality, modern devices',
  },
  av01: {
    label: 'AV1', subLabel: 'Advanced', icon: 'Rocket',
    cls: 'text-purple-500 bg-purple-500/10 border border-purple-500/20',
    bestFor: 'Best for: Smallest file size, Most Advance format',
  },
  mp4a: {
    label: 'AAC', subLabel: 'Stable', icon: 'Shield',
    cls: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
    bestFor: 'Best for: Car stereos, Apple devices, old Bluetooth speakers',
  },
  opus: {
    label: 'Opus', subLabel: 'Better Quality', icon: 'Zap',
    cls: 'text-pink-500 bg-pink-500/10 border border-pink-500/20',
    bestFor: 'Best for: Better sound at smaller size, streaming, modern devices',
  },
};

// Codec badge component with hover tooltip
const CodecBadge = ({ vcodec, acodec }) => {
  const key = (() => {
    const vc = (vcodec || '').toLowerCase();
    const ac = (acodec || '').toLowerCase();
    if (vc.includes('avc') || vc.includes('h264')) return 'avc1';
    if (vc.includes('vp9')) return 'vp9';
    if (vc.includes('av01') || vc.includes('av1')) return 'av01';
    if (ac.includes('mp4a') || ac.includes('aac')) return 'mp4a';
    if (ac.includes('opus')) return 'opus';
    return null;
  })();
  const badge = key ? CODEC_BADGE[key] : null;
  if (!badge) return null;
  return (
    <div className="relative group/badge inline-flex">
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide ${badge.cls} cursor-default`}>
        <Icon name={badge.icon} size={8} />
        {badge.label} <span className="opacity-75 font-medium">({badge.subLabel})</span>
      </span>
      {/* bestFor hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center mb-1.5 z-[999] pointer-events-none invisible group-hover/badge:visible opacity-0 group-hover/badge:opacity-100 transition-all duration-200">
        <div className="bg-gray-900 border border-white/10 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-normal w-[170px] text-center leading-tight relative z-10">
          {badge.bestFor}
        </div>
        <div className="w-2 h-2 bg-gray-900 border-r border-b border-white/10 rotate-45 -mt-1 relative z-0" />
      </div>
    </div>
  );
};

const DownloadTabs = ({ videoData, onDownload, onSelect, selectedConfig }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('video');
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [customFilename, setCustomFilename] = useState(videoData?.title || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Change I: New state variables
  const [selectedContainer, setSelectedContainer] = useState('auto'); // Default to Auto (Native)
  const [selectedAudioFormatId, setSelectedAudioFormatId] = useState(null);
  const [showAllFormats, setShowAllFormats] = useState(false);      // Advanced toggle
  const [advancedSelectedId, setAdvancedSelectedId] = useState(null); // Exact format override

  // MP3 card: track if user explicitly selected the MP3 card
  const MP3_SENTINEL = 'mp3'; // special quality value for the dedicated MP3 card
  const isMp3Selected = selectedQuality === MP3_SENTINEL;

  // Tooltip state for video and audio
  const [showVideoTooltip, setShowVideoTooltip] = useState(false);
  const [showAudioTooltip, setShowAudioTooltip] = useState(false);
  const videoTooltipRef = useRef(null);
  const audioTooltipRef = useRef(null);

  // Close tooltips on outside click
  useEffect(() => {
    const handler = (e) => {
      if (videoTooltipRef.current && !videoTooltipRef.current.contains(e.target)) setShowVideoTooltip(false);
      if (audioTooltipRef.current && !audioTooltipRef.current.contains(e.target)) setShowAudioTooltip(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sliding Tab Pill State & Effect
  const [mainPillStyle, setMainPillStyle] = useState({ left: 0, width: 0, top: 0, height: 0, opacity: 0 });
  const [advPillStyle, setAdvPillStyle] = useState({ left: 0, width: 0, top: 0, height: 0, opacity: 0 });
  const mainTabRefs = useRef({});
  const advTabRefs = useRef({});

  useEffect(() => {
    const updatePills = () => {
      const mainTab = mainTabRefs.current[activeTab];
      if (mainTab) {
        setMainPillStyle({ left: mainTab.offsetLeft, top: mainTab.offsetTop, width: mainTab.offsetWidth, height: mainTab.offsetHeight, opacity: 1 });
      }
      const advTab = advTabRefs.current[activeTab];
      if (advTab) {
        setAdvPillStyle({ left: advTab.offsetLeft, top: advTab.offsetTop, width: advTab.offsetWidth, height: advTab.offsetHeight, opacity: 1 });
      }
    };
    updatePills();
    const timeout = setTimeout(updatePills, 100);
    window.addEventListener('resize', updatePills);
    return () => { clearTimeout(timeout); window.removeEventListener('resize', updatePills); };
  }, [activeTab, videoData]);

  // Sync tab when parent changes selectedConfig (e.g. from VideoTrimmer toggle)
  useEffect(() => {
    if (selectedConfig?.type && selectedConfig.type !== activeTab) {
      setActiveTab(selectedConfig.type);
    }
  }, [selectedConfig?.type]);

  const tabs = [
    { id: 'video', label: 'Video', icon: 'Video' },
    { id: 'audio', label: 'Audio', icon: 'Music' },
    { id: 'thumbnail', label: 'Thumbnail', icon: 'Image' },
  ];

  // Change J: Build quality lists audio sorted by quality_index
  const { videoQualities, audioQualities } = useMemo(() => {
    const rawFormats = videoData?.formats || [];

    const videos = rawFormats
      .filter((f) => f.type === 'video' && f.quality && f.height > 0)
      .sort((a, b) => b.height - a.height);

    const seenLabels = new Set();
    const uniqueVideos = videos.filter((f) => {
      if (seenLabels.has(f.quality)) return false;
      seenLabels.add(f.quality);
      return true;
    });

    const fallbackVideos = [
      { quality: '1080p', height: 1080, ext: 'mp4', type: 'video' },
      { quality: '720p', height: 720, ext: 'mp4', type: 'video' },
      { quality: '480p', height: 480, ext: 'mp4', type: 'video' },
      { quality: '360p', height: 360, ext: 'mp4', type: 'video' },
      { quality: '144p', height: 144, ext: 'mp4', type: 'video' },
    ];

    // Change J: Sort audio by quality_index (0=best)
    const audios = rawFormats
      .filter((f) => f.type === 'audio')
      .sort((a, b) => (a.quality_index ?? 99) - (b.quality_index ?? 99));

    return {
      videoQualities: uniqueVideos.length ? uniqueVideos : fallbackVideos,
      audioQualities: audios.length
        ? audios
        : [{ quality: 'High Quality', ext: 'opus', native_ext: 'opus', type: 'audio', quality_index: 0, codec_display: 'Opus' }],
    };
  }, [videoData?.formats]);

  const thumbnailOptions = [
    { quality: 'Max Resolution', ext: 'jpg', type: 'thumbnail', description: '1920x1080' },
    { quality: 'High Resolution', ext: 'jpg', type: 'thumbnail', description: '1280x720' },
    { quality: 'Standard', ext: 'jpg', type: 'thumbnail', description: '640x480' },
  ];

  const getQualityOptions = () => {
    switch (activeTab) {
      case 'audio': return audioQualities;
      case 'thumbnail': return thumbnailOptions;
      default: return videoQualities;
    }
  };

  const activeOptions = getQualityOptions();
  const effectiveSelected = selectedQuality === MP3_SENTINEL
    ? MP3_SENTINEL
    : (selectedQuality && activeOptions.find((o) => o.quality === selectedQuality)
      ? selectedQuality
      : activeOptions[0]?.quality);

  const getPresetButtons = () => {
    const opts = getQualityOptions();
    if (!opts.length) return [];
    const len = opts.length;
    if (len === 1) return [opts[0]];
    if (len === 2) return [opts[0], opts[1]];
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

  const formatBitrate = (abr) => {
    if (!abr) return null;
    return `${Math.round(abr)}k`;
  };

  // Change K: handlePresetDownload — use advanced format data when advancedSelectedId is active
  const handlePresetDownload = (option) => {
    const isAudio = activeTab === 'audio';
    const isThisMp3 = option.quality === MP3_SENTINEL;

    // If an advanced format is selected, override everything with its metadata
    const advFormat = advancedSelectedId ? allFormats.find(f => f.format_id === advancedSelectedId) : null;
    if (advFormat) {
      const advIsAudio = advFormat.type === 'audio';
      onDownload({
        type: advFormat.type || activeTab,
        quality: advFormat.quality,
        format: advIsAudio
          ? (advFormat.native_ext || advFormat.ext || 'opus')
          : (advFormat.native_ext || advFormat.ext || 'mp4'),
        format_id: advIsAudio ? null : advFormat.format_id,
        audio_format_id: advIsAudio ? advFormat.format_id : null,
        container: !advIsAudio && activeTab !== 'thumbnail' ? selectedContainer : null,
        convert_to_mp3: false,
        filename: customFilename || videoData?.title,
      });
      return;
    }

    const effectiveFormatId = option.format_id || null;
    onDownload({
      type: option.type || activeTab,
      quality: isThisMp3 ? 'High Quality' : option.quality,
      format: isAudio
        ? (isThisMp3 ? 'mp3' : (option.native_ext || option.ext || 'opus'))
        : (option.ext || 'mp4'),
      format_id: isAudio ? null : effectiveFormatId,
      audio_format_id: isAudio && !isThisMp3 ? (selectedAudioFormatId || option.format_id || null) : null,
      container: !isAudio && activeTab !== 'thumbnail' ? selectedContainer : null,
      convert_to_mp3: isAudio ? isThisMp3 : false,
      filename: customFilename || videoData?.title,
    });
  };

  // Change L: handleCustomDownload — use advanced format data when advancedSelectedId is active
  const handleCustomDownload = () => {
    const isAudio = activeTab === 'audio';
    const isThisMp3 = isMp3Selected;

    // If an advanced format is selected, override everything with its metadata
    const advFormat = advancedSelectedId ? allFormats.find(f => f.format_id === advancedSelectedId) : null;
    if (advFormat) {
      const advIsAudio = advFormat.type === 'audio';
      onDownload({
        type: advFormat.type || activeTab,
        quality: advFormat.quality,
        format: advIsAudio
          ? (advFormat.native_ext || advFormat.ext || 'opus')
          : (advFormat.native_ext || advFormat.ext || 'mp4'),
        format_id: advIsAudio ? null : advFormat.format_id,
        audio_format_id: advIsAudio ? advFormat.format_id : null,
        container: !advIsAudio && activeTab !== 'thumbnail' ? selectedContainer : null,
        convert_to_mp3: false,
        filename: customFilename || videoData?.title,
      });
      return;
    }

    const option = activeOptions.find((o) => o.quality === effectiveSelected) || activeOptions[0];
    if (!option) return;
    const effectiveFormatId = option.format_id || null;
    onDownload({
      type: option.type || activeTab,
      quality: isThisMp3 ? 'High Quality' : option.quality,
      format: isAudio
        ? (isThisMp3 ? 'mp3' : (option.native_ext || option.ext || 'opus'))
        : (option.ext || 'mp4'),
      format_id: isAudio ? null : effectiveFormatId,
      audio_format_id: isAudio && !isThisMp3 ? (selectedAudioFormatId || option.format_id || null) : null,
      container: !isAudio && activeTab !== 'thumbnail' ? selectedContainer : null,
      convert_to_mp3: isAudio ? isThisMp3 : false,
      filename: customFilename || videoData?.title,
    });
  };

  // All formats from API (for advanced view)
  const allFormats = videoData?.all_formats || videoData?.formats || [];

  const presets = getPresetButtons();

  // Change Q1: Dynamic extension for filename display
  const filenameExt = activeTab === 'thumbnail'
    ? 'jpg'
    : activeTab === 'audio'
      ? (isMp3Selected ? 'mp3' : (audioQualities.find((o) => o.quality === effectiveSelected)?.native_ext || 'opus'))
      : (selectedContainer === 'auto'
        ? (advancedSelectedId
          ? (allFormats.find(f => f.format_id === advancedSelectedId)?.ext || 'mp4')
          : (activeOptions.find((o) => o.quality === effectiveSelected)?.ext || 'mp4'))
        : selectedContainer);

  // ── Container Compatibility Warning ────────────────────────────────────────
  // Warn when user picks MP4 container but the selected video stream uses
  // VP9 or AV1 codec those codecs have very limited support inside MP4.
  // MKV is a far safer choice for these codecs (universal container).
  const selectedVideoVcodec = (() => {
    if (activeTab !== 'video') return null;
    if (advancedSelectedId) {
      return allFormats.find(f => f.format_id === advancedSelectedId)?.vcodec || null;
    }
    return activeOptions.find(o => o.quality === effectiveSelected)?.vcodec || null;
  })();
  const isNonH264Codec = selectedVideoVcodec &&
    (selectedVideoVcodec.toLowerCase().includes('vp9') ||
      selectedVideoVcodec.toLowerCase().includes('vp09') ||
      selectedVideoVcodec.toLowerCase().includes('av01') ||
      selectedVideoVcodec.toLowerCase().includes('av1'));
  const showContainerWarning = selectedContainer === 'mp4' && isNonH264Codec;

  return (
    <div className="space-y-6">

      {/* Tab Navigation (Main) */}
      <div className="flex items-center justify-center sm:justify-start space-x-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-border/50 relative w-fit mx-auto lg:mx-0">
        <div
          className="absolute bg-primary shadow-glass-sm rounded-xl transition-all duration-500 pointer-events-none"
          style={{ left: mainPillStyle.left, top: mainPillStyle.top, width: mainPillStyle.width, height: mainPillStyle.height, opacity: mainPillStyle.opacity, transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
        />
        {tabs.map((tab) =>
          <button
            key={tab.id}
            ref={(el) => mainTabRefs.current[tab.id] = el}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedQuality(null);
              setAdvancedSelectedId(null);
              if (onSelect) {
                const newOpts = tab.id === 'audio' ? audioQualities : tab.id === 'thumbnail' ? thumbnailOptions : videoQualities;
                const best = newOpts[0] || {};
                onSelect?.({
                  type: best.type || tab.id,
                  quality: best.quality,
                  format: tab.id === 'audio'
                    ? (best.native_ext || best.ext || 'opus')
                    : (best.ext || 'mp4'),
                  format_id: best.format_id || null,
                  convert_to_mp3: false,
                  container: tab.id !== 'audio' && tab.id !== 'thumbnail' ? selectedContainer : null,
                });
              }
            }}
            className={`
              relative z-10 flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-medium
              transition-colors duration-300
              ${activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
            `}>
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
          </button>
        )}
      </div>

      {/* Quick Preset Download */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t("videoDetailsDownload.quickDownload")}</h3>
        {/* Max Quality Badge */}
        {activeTab === 'video' && videoData?.max_quality &&
          <div className="flex items-center space-x-3 text-sm bg-black/5 dark:bg-white/5 w-fit px-4 py-2.5 rounded-2xl border border-border/50 shadow-sm mb-4">
            <span className="text-foreground font-semibold">{t("videoDetailsDownload.maxAvailableQuality") || 'Max available quality:'}</span>
            <span className={`px-3 py-1 rounded-xl text-white text-xs font-black shadow-md ${QUALITY_COLORS[videoData.max_quality] || 'bg-primary'} ring-2 ring-white/20 dark:ring-black/20`}>
              {videoData.max_quality}
            </span>
          </div>
        }
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map((option, idx) => {
            const label = presetLabel(idx, presets.length);
            const color = QUALITY_COLORS[option.quality] || 'bg-primary';
            const size = formatFileSize(option.filesize);
            const desc = QUALITY_DESC[option.quality] || option.description || '';
            const formatStr = activeTab === 'audio'
              ? (option.quality === MP3_SENTINEL ? 'mp3' : (option.native_ext || option.ext || 'opus'))
              : (option.ext || 'mp4');
            const formatColorCls = FORMAT_COLORS[formatStr.toLowerCase()] || 'bg-black/5 dark:bg-white/5 border-border/50 text-foreground';
            const activeStyle = QUALITY_ACTIVE_STYLES[option.quality] || { hover: 'hover:shadow-primary/20 hover:border-primary/50 hover:bg-primary/5' };
            return (
              <div
                key={`${activeTab}-${option.quality}`}
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                className={`animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out hover:-translate-y-1 hover:scale-[1.02] bg-white/85 dark:bg-[#121212]/60 backdrop-blur-xl p-5 transition-all relative z-10 hover:z-50 group border border-border/50 dark:border-white/5 flex flex-col h-full rounded-2xl transform-gpu will-change-transform shadow-glass-sm ${activeStyle.hover}`}
              >
                {/* Header */}
                <div className="flex flex-col mb-4 gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 mt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                      <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-widest truncate">{label}</span>
                    </div>
                    {activeTab !== 'thumbnail' ? (
                      <div className="shrink-0">
                        <CodecBadge vcodec={option.vcodec} acodec={option.acodec} />
                      </div>
                    ) : size && (
                      <div className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-mono font-semibold text-muted-foreground border border-border/50 shrink-0">
                        {size}
                      </div>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight line-clamp-2" title={option.quality}>
                    {option.quality}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 mb-5 flex-grow">
                  <div className={`p-3 rounded-xl border flex flex-col justify-center ${formatColorCls}`}>
                    <span className="block text-[10px] uppercase opacity-70 font-bold mb-1 tracking-wider">Format</span>
                    <span className="text-sm font-black uppercase">
                      {formatStr}
                    </span>
                  </div>
                  <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border/50 flex flex-col justify-center items-start">
                    {activeTab === 'thumbnail' ? (
                      <>
                        <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1 tracking-wider">Resolution</span>
                        <span className="text-sm font-black text-foreground">{option.description || 'Unknown'}</span>
                      </>
                    ) : (
                      <>
                        <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1 tracking-wider">Size</span>
                        <span className="text-sm font-black text-foreground">{size || 'Unknown'}</span>
                      </>
                    )}
                  </div>
                  {option.abr && (
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border/50 flex flex-col justify-center items-start">
                      <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1 tracking-wider">Bitrate</span>
                      <span className="text-sm font-black text-foreground">{formatBitrate(option.abr)}</span>
                    </div>
                  )}
                  {desc && activeTab !== 'thumbnail' && (
                    <div className="col-span-2 mt-1">
                      <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-2">{desc}</p>
                    </div>
                  )}
                </div>

                {/* Button */}
                <div className="mt-auto">
                  <button
                    onClick={() => handlePresetDownload(option)}
                    className="w-full relative group/btn overflow-hidden flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-primary-foreground bg-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/40 active:translate-y-0"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12" />
                    <Icon name="Download" size={18} className="relative z-10 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:drop-shadow-md" />
                    <span className="relative z-10">{t("videoDetailsDownload.download")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Options */}
      <motion.div
        id="advanced-options"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4 pt-4"
      >
        <div className="flex items-center gap-2 px-1">
          <Icon name="Cog" size={20} className="text-primary" />
          <h3 className="text-xl font-bold text-foreground tracking-tight">{t("videoDetailsDownload.advancedOptions")}</h3>
        </div>
        <div className="bg-white/85 dark:bg-[#121212]/60 backdrop-blur-xl p-6 md:p-8 space-y-8 relative z-10 group border border-border/50 dark:border-white/5 hover:border-primary/20 transition-colors duration-500 flex flex-col rounded-3xl shadow-glass-lg">



          {/* Quality Grid header with Tooltip */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                  <Icon name="Target" size={16} className="text-muted-foreground/70" />
                  {t("videoDetailsDownload.selectQuality")}
                </label>

                {/* SMALL TAB NAVIGATION */}
                <div className="relative flex items-center space-x-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-border/50">
                  <div
                    className="absolute bg-primary shadow-glass-sm rounded-lg transition-all duration-500 pointer-events-none"
                    style={{ left: advPillStyle.left, top: advPillStyle.top, width: advPillStyle.width, height: advPillStyle.height, opacity: advPillStyle.opacity, transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
                  />
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      ref={(el) => advTabRefs.current[tab.id] = el}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSelectedQuality(null);
                        setAdvancedSelectedId(null);
                        if (onSelect) {
                          const newOpts = tab.id === 'audio' ? audioQualities : tab.id === 'thumbnail' ? thumbnailOptions : videoQualities;
                          const best = newOpts[0] || {};
                          onSelect?.({
                            type: best.type || tab.id,
                            quality: best.quality,
                            format: tab.id === 'audio'
                              ? (best.native_ext || best.ext || 'opus')
                              : (best.ext || 'mp4'),
                            format_id: best.format_id || null,
                            convert_to_mp3: false,
                            container: tab.id !== 'audio' && tab.id !== 'thumbnail' ? selectedContainer : null,
                          });
                        }
                      }}
                      className={`
                        relative z-10 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                        transition-colors duration-300
                        ${activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
                      `}>
                      <Icon name={tab.icon} size={12} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Separate Video or Audio HelpCircle tooltip */}
              {activeTab === 'video' && (
                <div className="relative" ref={videoTooltipRef}>
                  <button
                    onClick={() => setShowVideoTooltip((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${showVideoTooltip ? 'bg-primary text-white shadow-glass-sm' : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'}`}
                  >
                    <Icon name="HelpCircle" size={13} />
                    <span className="hidden sm:inline">Video Guide</span>
                  </button>
                  <AnimatePresence>
                    {showVideoTooltip && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 z-50 w-[340px] bg-background border border-border rounded-2xl p-5 shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                              <Icon name="HelpCircle" size={14} className="text-primary" />
                            </div>
                            <span className="text-sm font-black text-foreground">Video Format Guide</span>
                          </div>
                          <button onClick={() => setShowVideoTooltip(false)} className="text-muted-foreground/40 hover:text-foreground">
                            <Icon name="X" size={16} />
                          </button>
                        </div>
                        <div className="space-y-4 text-xs mt-1">
                          {/* Codec Guide */}
                          <div>
                            <div className="font-bold flex items-center gap-1.5 mb-2 text-foreground">
                              <Icon name="Cpu" size={13} className="text-blue-500" /> Video Codec
                            </div>
                            <div className="space-y-2 pl-4 border-l border-border/50">
                              <div className="flex flex-col gap-0.5 items-start">
                                <CodecBadge vcodec="avc1" />
                                <span className="text-muted-foreground text-[10px]">Highly compatible (Older TVs, WhatsApp).</span>
                              </div>
                              <div className="flex flex-col gap-0.5 items-start">
                                <CodecBadge vcodec="vp9" />
                                <span className="text-muted-foreground text-[10px]">Smaller file, YouTube preferred standard.</span>
                              </div>
                              <div className="flex flex-col gap-0.5 items-start">
                                <CodecBadge vcodec="av01" />
                                <span className="text-muted-foreground text-[10px]">Smallest size, high efficiency (Needs modern device).</span>
                              </div>
                            </div>
                          </div>

                          {/* Container Guide */}
                          <div>
                            <div className="font-bold flex items-center gap-1.5 mb-2 text-foreground">
                              <Icon name="Box" size={13} className="text-emerald-500" /> Container Format
                            </div>
                            <div className="flex flex-wrap gap-1.5 pl-4">
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-bold font-mono">.MP4</span>
                              <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-500 border border-pink-500/20 text-[9px] font-bold font-mono">.MKV</span>
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[9px] font-bold font-mono">.WEBM</span>
                              <span className="text-muted-foreground text-[10px] mt-1 w-full leading-tight">Different wrappers for your video. MP4 is universally supported everywhere.</span>
                            </div>
                          </div>

                          {/* Resolution & FPS Guide */}
                          <div>
                            <div className="font-bold flex items-center gap-1.5 mb-2 text-foreground">
                              <Icon name="Monitor" size={13} className="text-purple-500" /> Resolution & FPS
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pl-4">
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-foreground">
                                <Icon name="Monitor" size={10} /> 1080p
                              </div>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-foreground">
                                <Icon name="Zap" size={10} /> 60fps
                              </div>
                              <span className="text-muted-foreground text-[10px] mt-1 leading-tight">Resolution is sharpness (1080p/4K). FPS is motion smoothness (60fps is ultra-smooth).</span>
                            </div>
                          </div>

                          {/* Format ID Guide */}
                          <div>
                            <div className="font-bold flex items-center gap-1.5 mb-2 text-foreground">
                              <Icon name="Hash" size={13} className="text-amber-500" /> Format ID
                            </div>
                            <div className="flex flex-col gap-1 pl-4">
                              <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-mono text-muted-foreground w-fit">id:299</span>
                              <span className="text-muted-foreground text-[10px] leading-tight">YouTube's unique internal stream identifier. Useful for advanced users.</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="relative" ref={audioTooltipRef}>
                  <button
                    onClick={() => setShowAudioTooltip((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${showAudioTooltip ? 'bg-primary text-white shadow-glass-sm' : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'}`}
                  >
                    <Icon name="HelpCircle" size={13} />
                    <span className="hidden sm:inline">Audio Guide</span>
                  </button>
                  <AnimatePresence>
                    {showAudioTooltip && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 z-50 w-[340px] bg-background border border-border rounded-2xl p-5 shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                              <Icon name="HelpCircle" size={14} className="text-primary" />
                            </div>
                            <span className="text-sm font-black text-foreground">Audio Format Guide</span>
                          </div>
                          <button onClick={() => setShowAudioTooltip(false)} className="text-muted-foreground/40 hover:text-foreground">
                            <Icon name="X" size={16} />
                          </button>
                        </div>
                        <div className="space-y-4 text-xs mt-1">
                          {/* Audio Codec Guide */}
                          <div>
                            <div className="font-bold flex items-center gap-1.5 mb-2 text-foreground">
                              <Icon name="Music" size={13} className="text-pink-500" /> Audio Codec
                            </div>
                            <div className="space-y-2 pl-4 border-l border-border/50">
                              <div className="flex flex-col gap-0.5 items-start">
                                <CodecBadge acodec="opus" />
                                <span className="text-muted-foreground text-[10px]">Best quality at lower sizes. YouTube's native standard format.</span>
                              </div>
                              <div className="flex flex-col gap-0.5 items-start">
                                <CodecBadge acodec="mp4a" />
                                <span className="text-muted-foreground text-[10px]">Highly compatible. Works on old car stereos and Apple devices natively.</span>
                              </div>
                            </div>
                          </div>

                          {/* Bitrate Guide */}
                          <div>
                            <div className="font-bold flex items-center gap-1.5 mb-2 text-foreground">
                              <Icon name="Activity" size={13} className="text-green-500" /> Bitrate (Quality)
                            </div>
                            <div className="flex flex-col gap-1 pl-4 border-l border-border/50">
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-foreground w-fit">
                                <Icon name="Activity" size={10} /> 160kbps
                              </div>
                              <span className="text-muted-foreground text-[10px] leading-tight">Measures audio detail. Higher kbps means better sound quality.</span>
                            </div>
                          </div>

                          {/* MP3 Conversion Guide */}
                          <div>
                            <div className="font-bold flex items-center gap-1.5 mb-2 text-foreground">
                              <Icon name="Radio" size={13} className="text-amber-500" /> Universal MP3 Conversion
                            </div>
                            <div className="flex flex-col gap-1.5 pl-4 border-l border-border/50">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold font-mono tracking-wider">.MP3</span>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[9px] font-medium text-muted-foreground">
                                  <Icon name="RefreshCw" size={9} /> Requires Conversion
                                </div>
                              </div>
                              <span className="text-muted-foreground text-[10px] leading-tight">MP3 is not native to YouTube. We convert it perfectly for maximum compatibility on legacy devices.</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Change M: Default Quality Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {activeOptions.map((option, idx) => {
                const isSelected = advancedSelectedId
                  ? advancedSelectedId === option.format_id
                  : effectiveSelected === option.quality;
                const color = QUALITY_COLORS[option.quality] || 'bg-primary';
                const activeStyle = QUALITY_ACTIVE_STYLES[option.quality] || {
                  hover: 'hover:shadow-primary/20 hover:border-primary/50 hover:bg-primary/5',
                  selected: 'border-transparent bg-primary/10 ring-[1.5px] ring-primary shadow-[0_10px_40px_-10px_rgba(var(--primary),0.35)] z-20',
                  gradient: 'from-primary/20'
                };
                const size = formatFileSize(option.filesize);
                const nativeExt = option.native_ext || option.ext || 'opus';
                return (
                  <button
                    key={`${activeTab}-${option.format_id || option.quality}`}
                    style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                    onClick={() => {
                      setSelectedQuality(option.quality);
                      setAdvancedSelectedId(null);
                      if (option.type === 'audio') setSelectedAudioFormatId(option.format_id || null);
                      onSelect?.({
                        type: option.type || activeTab,
                        quality: option.quality,
                        format: option.type === 'audio'
                          ? (option.native_ext || option.ext || 'opus')
                          : (option.ext || 'mp4'),
                        format_id: option.format_id || null,
                        audio_format_id: option.type === 'audio' ? (option.format_id || null) : null,
                        convert_to_mp3: false,
                        container: option.type !== 'audio' ? selectedContainer : null,
                      });
                    }}
                    className={`animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 rounded-2xl text-left transition-all ease-out relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] active:translate-y-0 ${isSelected
                      ? activeStyle.selected
                      : `border border-border/40 text-foreground bg-black/5 dark:bg-white/[0.03] shadow-sm z-10 ${activeStyle.hover}`
                      }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="selected-quality-glow"
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${activeStyle.gradient} via-transparent to-transparent pointer-events-none`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <div className={`w-2 h-2 rounded-full ${color} shrink-0 ${isSelected ? 'animate-pulse' : ''}`} />
                        <span className="font-bold text-sm">{option.quality}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider ${FORMAT_COLORS[nativeExt.toLowerCase()] || 'bg-accent/30 border-border/50 text-muted-foreground'}`}>
                          .{nativeExt}
                        </span>
                        {size && (
                          <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-border/50 text-[10px] font-bold text-foreground/80 tracking-tight shadow-sm whitespace-nowrap">
                            ~{size}
                          </span>
                        )}
                        {option.type === 'thumbnail' && option.description && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-border/50 text-[10px] font-bold text-foreground/80 tracking-tight shadow-sm whitespace-nowrap">
                            <Icon name="Monitor" size={10} className="opacity-70" />
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {option.resolution && option.resolution !== 'audio' && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                          <Icon name="Monitor" size={10} />
                          {option.resolution}
                        </div>
                      )}
                      {option.type === 'audio' && option.abr && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                          <Icon name="Activity" size={10} />
                          {Math.round(option.abr)}kbps
                        </div>
                      )}
                      {option.fps && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                          <Icon name="Zap" size={10} />
                          {option.fps}fps
                        </div>
                      )}

                      <CodecBadge vcodec={option.vcodec} acodec={option.acodec} />
                    </div>
                  </button>
                );
              })}

              {/* Dedicated MP3 card always last in audio tab */}
              {activeTab === 'audio' && (
                <button
                  key={`${activeTab}-${MP3_SENTINEL}`}
                  style={{ animationDelay: `${activeOptions.length * 30}ms`, animationFillMode: 'both' }}
                  onClick={() => {
                    setSelectedQuality(MP3_SENTINEL);
                    setAdvancedSelectedId(null);
                    setSelectedAudioFormatId(null);
                    onSelect?.({
                      type: 'audio',
                      quality: 'High Quality',
                      format: 'mp3',
                      format_id: null,
                      audio_format_id: null,
                      convert_to_mp3: true,
                    });
                  }}
                  className={`animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 rounded-2xl text-left transition-all ease-out relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] active:translate-y-0 ${isMp3Selected
                    ? QUALITY_ACTIVE_STYLES['Universal MP3'].selected
                    : `border border-border/40 text-foreground bg-black/5 dark:bg-white/[0.03] shadow-sm z-10 ${QUALITY_ACTIVE_STYLES['Universal MP3'].hover}`
                    }`}
                >
                  {/* subtle amber shimmer when selected */}
                  {isMp3Selected && (
                    <motion.div
                      layoutId="selected-quality-glow"
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${QUALITY_ACTIVE_STYLES['Universal MP3'].gradient} via-transparent to-transparent pointer-events-none`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="mb-2 relative">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <div className={`w-2 h-2 rounded-full bg-amber-500 shrink-0 ${isMp3Selected ? 'animate-pulse' : ''}`} />
                      <span className="font-bold text-sm">Universal MP3</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider ${FORMAT_COLORS['mp3']}`}>
                        .mp3
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-border/50 text-[10px] font-bold text-foreground/80 tracking-tight shadow-sm whitespace-nowrap">
                        ~192kbps
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2 relative">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      <Icon name="Radio" size={10} />
                      Most Compatible
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      <Icon name="RefreshCw" size={10} />
                      Requires Conversion
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Change M: Advanced Format Toggle + Grid */}
            {(activeTab === 'video' || activeTab === 'audio') && (
              <div className="space-y-3">
                <CustomDropdown
                  selected={advancedSelectedId && allFormats.find(f => f.format_id === advancedSelectedId) ? {
                    label: (() => {
                      const f = allFormats.find(f => f.format_id === advancedSelectedId);
                      return (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground w-full py-0.5">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${FORMAT_COLORS[(f.native_ext || f.ext)?.toLowerCase()] || 'bg-black/5 dark:bg-white/5 border-border/50 text-foreground'}`}>
                            .{f.native_ext || f.ext}
                          </span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-bold shrink-0 text-primary">{f.quality}</span>
                            {f.resolution && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-muted-foreground shrink-0">
                                <Icon name="Monitor" size={10} />
                                {f.resolution}
                              </div>
                            )}
                            <CodecBadge vcodec={f.vcodec} acodec={f.acodec} />
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-auto">
                            {f.filesize && (
                              <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-border/50 text-[10px] font-bold text-foreground/80 tracking-tight shadow-sm">
                                ~{formatFileSize(f.filesize)}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-mono text-muted-foreground">
                              id:{f.format_id}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  } : null}
                  placeholder={showAllFormats ? 'Hide Advanced Formats' : `Show All Advanced Formats (${allFormats.length} Available)`}
                  isOpenProp={showAllFormats}
                  onToggle={(val) => { setShowAllFormats(val !== undefined ? val : !showAllFormats); }}
                  buttonClassName={showAllFormats ? "ring-2 ring-primary border-primary" : (advancedSelectedId ? "border-primary bg-primary/5" : "")}
                  direction="up"
                  floatingChildren={true}
                  onClear={() => setAdvancedSelectedId(null)}
                >
                  <div className="flex flex-col">
                    {/* Video formats in advanced view */}
                    {activeTab === 'video' && allFormats.filter((f) => f.type === 'video').length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-accent/20 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Icon name="Video" size={10} />
                          Video Streams
                        </div>
                        {allFormats.filter((f) => f.type === 'video').map((f) => {
                          const isSelected = advancedSelectedId === f.format_id;
                          const size = formatFileSize(f.filesize);
                          return (
                            <button
                              key={f.format_id}
                              onClick={() => {
                                setAdvancedSelectedId(f.format_id);
                                onSelect?.({
                                  type: 'video',
                                  quality: f.quality,
                                  format: f.ext || 'mp4',
                                  format_id: f.format_id,
                                  container: selectedContainer,
                                });
                                setShowAllFormats(false);
                              }}
                              className={`w-full flex flex-wrap items-center gap-2 px-4 py-3 text-sm transition-all border-b border-border/20 last:border-0 ${isSelected
                                ? 'bg-primary/5 text-primary'
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground'
                                }`}
                            >
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${FORMAT_COLORS[f.ext?.toLowerCase()] || 'bg-black/5 dark:bg-white/5 border-border/50 text-foreground'}`}>
                                .{f.ext}
                              </span>

                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-bold shrink-0">{f.quality}</span>

                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-muted-foreground shrink-0">
                                  <Icon name="Monitor" size={10} />
                                  {f.resolution}
                                </div>

                                <CodecBadge vcodec={f.vcodec} />

                                {f.tbr && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-muted-foreground shrink-0">
                                    <Icon name="Activity" size={10} />
                                    {Math.round(f.tbr)}k
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-auto">
                                {size && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-border/50 text-[10px] font-bold text-foreground/80 tracking-tight shadow-sm">
                                    ~{size}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-mono text-muted-foreground">
                                  id:{f.format_id}
                                </span>
                                {isSelected && <Icon name="Check" size={14} className="text-primary ml-1" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Audio formats in advanced view */}
                    {allFormats.filter((f) => f.type === 'audio').length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-accent/20 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Icon name="Music" size={10} />
                          Audio Streams
                        </div>
                        {allFormats.filter((f) => f.type === 'audio').map((f) => {
                          const isSelected = advancedSelectedId === f.format_id;
                          const size = formatFileSize(f.filesize);
                          return (
                            <button
                              key={f.format_id}
                              onClick={() => {
                                setAdvancedSelectedId(f.format_id);
                                setSelectedAudioFormatId(f.format_id);
                                onSelect?.({
                                  type: 'audio',
                                  quality: f.quality,
                                  format: convertToMp3 ? 'mp3' : (f.native_ext || f.ext || 'opus'),
                                  format_id: f.format_id,
                                  audio_format_id: f.format_id,
                                  convert_to_mp3: convertToMp3,
                                });
                                setShowAllFormats(false);
                              }}
                              className={`w-full flex flex-wrap items-center gap-2 px-4 py-3 text-sm transition-all border-b border-border/20 last:border-0 ${isSelected
                                ? 'bg-primary/5 text-primary'
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground'
                                }`}
                            >
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${FORMAT_COLORS[(f.native_ext || f.ext)?.toLowerCase()] || 'bg-black/5 dark:bg-white/5 border-border/50 text-foreground'}`}>
                                .{f.native_ext || f.ext}
                              </span>

                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-bold shrink-0">{f.quality}</span>

                                <CodecBadge acodec={f.acodec} />

                                {f.abr && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-medium text-muted-foreground shrink-0">
                                    <Icon name="Activity" size={10} />
                                    {Math.round(f.abr)}kbps
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-auto">
                                {size && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-border/50 text-[10px] font-bold text-foreground/80 tracking-tight shadow-sm">
                                    ~{size}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[10px] font-mono text-muted-foreground">
                                  id:{f.format_id}
                                </span>
                                {isSelected && <Icon name="Check" size={14} className="text-primary ml-1" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CustomDropdown>
              </div>
            )}
          </div>

          {/* Container Dropdown (Moved to bottom) */}
          {activeTab === 'video' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2 mb-1">
                <Icon name="Box" size={16} className="text-muted-foreground/70" />
                Container Format
              </label>

              <CustomDropdown
                selected={CONTAINER_OPTIONS.find(o => o.value === selectedContainer) || CONTAINER_OPTIONS[0]}
                options={CONTAINER_OPTIONS}
                onSelect={(opt) => setSelectedContainer(opt.value)}
                buttonClassName={showContainerWarning ? "border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]" : ""}
                containerClassName="w-fit max-w-full"
              />

              {/* VP9/AV1 in MP4 compatibility warning */}
              <AnimatePresence>
                {showContainerWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 p-3 mt-2 rounded-xl bg-amber-500/10 border border-amber-400/40">
                      <Icon name="AlertTriangle" size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          Compatibility Warning {selectedVideoVcodec?.toUpperCase().slice(0, 4) || 'VP9'} in MP4
                        </p>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mt-0.5 leading-snug">
                          {selectedVideoVcodec?.toLowerCase().includes('av') ? 'AV1' : 'VP9'} codec is not universally supported inside MP4. Many older devices may refuse to play this file.
                        </p>
                        <button
                          onClick={() => setSelectedContainer('mkv')}
                          className="mt-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-2 transition-colors"
                        >
                          Switch to MKV instead (recommended) →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Filename dynamic extension */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <Icon name="FileText" size={16} className="text-muted-foreground/70" />
              {t("videoDetailsDownload.customFilename")}
            </label>
            <div className="relative group">
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="w-full pl-4 pr-20 py-3.5 border border-border/50 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none placeholder:text-muted-foreground/50 group-hover:border-border"
                placeholder={t("videoDetailsDownload.enterCustomFilename")}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {activeTab === 'video' ? (
                  <ExtDropdown
                    filenameExt={filenameExt}
                    selectedContainer={selectedContainer}
                    setSelectedContainer={setSelectedContainer}
                  />
                ) : (
                  <span className="px-3 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-xs font-mono font-bold text-primary border border-primary/30 shadow-sm">
                    .{filenameExt}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Custom Download Button */}
          <div className="pt-4 mt-2 border-t border-white/5">
            <button
              onClick={handleCustomDownload}
              className="w-full sm:w-auto min-w-[250px] mx-auto relative group/btn overflow-hidden flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-black text-primary-foreground bg-primary shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/40 active:translate-y-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12" />
              <Icon name="Download" size={20} className="relative z-10 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:drop-shadow-md" />
              <span className="relative z-10 text-base tracking-wide">
                {t("videoDetailsDownload.download")} <span className="opacity-80 font-semibold">{advancedSelectedId ? `(id: ${advancedSelectedId})` : (effectiveSelected || activeOptions[0]?.quality || '')}</span>
              </span>
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default DownloadTabs;