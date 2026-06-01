import { useTranslation } from "react-i18next";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

// ─── Missing Files Dropdown Panel ─────────────────────────────────────────────
const MissingFilesPanel = ({ missingItems, onDeleteMissing, onClose }) => {
  const [selected, setSelected] = useState([]);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const allSelected = missingItems.length > 0 && selected.length === missingItems.length;
  const toggleAll = () =>
    setSelected(allSelected ? [] : missingItems.map((i) => i.id));

  const handleDelete = () => {
    const ids = selected.length > 0 ? selected : missingItems.map((i) => i.id);
    onDeleteMissing(ids);
    setSelected([]);
    onClose();
  };

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="absolute top-[calc(100%+10px)] right-0 w-[340px] sm:w-[420px] bg-white dark:bg-zinc-900 backdrop-blur-2xl border border-amber-400/30 dark:border-amber-500/20 rounded-2xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)] overflow-hidden z-[300]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-amber-50/60 dark:bg-amber-950/30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center">
            <Icon name="FileX2" size={14} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground leading-none">Missing Files</p>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-0.5">
              {missingItems.length} file{missingItems.length !== 1 ? 's' : ''} not found on disk
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="X" size={14} />
        </button>
      </div>

      {/* Info strip */}
      <div className="px-4 py-2 bg-amber-50/40 dark:bg-amber-950/20 border-b border-border/30">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          These entries are hidden from main history. They may reappear if you reconnect the drive or restore the files.
        </p>
      </div>

      {/* Select all row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-primary border-primary' : 'border-border'}`}>
            {allSelected && <Icon name="Check" size={10} className="text-white" />}
          </div>
          Select All
        </button>
        <span className="text-[10px] text-muted-foreground/60 font-medium">
          {selected.length > 0 ? `${selected.length} selected` : 'None selected'}
        </span>
      </div>

      {/* Items list */}
      <div className="max-h-[240px] overflow-y-auto divide-y divide-border/20">
        {missingItems.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleSelect(item.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.03] transition-colors text-left group"
          >
            {/* Checkbox */}
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected.includes(item.id) ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'}`}>
              {selected.includes(item.id) && <Icon name="Check" size={10} className="text-white" />}
            </div>

            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg bg-muted/60 shrink-0 overflow-hidden border border-border/40">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover opacity-50" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="FileVideo" size={16} className="text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-snug">
                {item.title || item.filename || 'Unknown'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wide">
                  {item.format?.toUpperCase() || '—'}
                </span>
                {item.quality && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-[10px] text-muted-foreground/70 font-medium">{item.quality}</span>
                  </>
                )}
                {item.channel && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-[10px] text-muted-foreground/50 truncate max-w-[80px]">{item.channel}</span>
                  </>
                )}
              </div>
            </div>

            {/* Missing badge */}
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/20 shrink-0">
              Missing
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border/40 bg-foreground/[0.02]">
        <p className="text-[10px] text-muted-foreground/60 font-medium leading-tight max-w-[160px]">
          Clearing removes only the history entry, not any file.
        </p>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors shrink-0"
        >
          <Icon name="Trash2" size={12} />
          {selected.length > 0 ? `Clear ${selected.length}` : 'Clear All'}
        </button>
      </div>
    </motion.div>
  );
};


// ─── FilterBar ─────────────────────────────────────────────────────────────────
const FilterBar = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  filters,
  onFiltersChange,
  onClearFilters,
  // Missing files props
  missingItems = [],
  onDeleteMissing,
}) => {
  const { t } = useTranslation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMissingPanel, setShowMissingPanel] = useState(false);

  const sortOptions = [
    { value: 'downloadDate', label: 'Download Date' },
    { value: 'title', label: 'Title' },
    { value: 'fileSize', label: 'File Size' },
    { value: 'channel', label: 'Channel' },
    { value: 'duration', label: 'Duration' },
    { value: 'format', label: 'Format' },
  ];

  const formatOptions = [
    { value: '', label: 'All Formats' },
    { value: 'mp4', label: 'MP4 Video' },
    { value: 'mp3', label: 'MP3 Audio' },
    { value: 'webm', label: 'WEBM Video' },
  ];

  const qualityOptions = [
    { value: '', label: 'All Qualities' },
    { value: '4320p', label: '8K (4320p)' },
    { value: '2160p', label: '4K (2160p)' },
    { value: '1440p', label: '2K (1440p)' },
    { value: '1080p', label: '1080p HD' },
    { value: '720p', label: '720p HD' },
    { value: '480p', label: '480p SD' },
    { value: '360p', label: '360p' },
    { value: '240p', label: '240p' },
    { value: '144p', label: '144p' },
    { value: 'Max Resolution', label: 'Max Resolution' },
    { value: 'Audio Only', label: 'Audio Only' },
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFiltersCount = () =>
    Object.values(filters)?.filter((value) => value && value !== '')?.length;

  const hasMissing = missingItems.length > 0;

  return (
    <div
      className="bg-white/90 dark:bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] shadow-glass-sm hover:shadow-glass-md transition-all inline-block w-full lg:w-auto"
      style={{ position: 'relative', zIndex: 100 }}
    >
      <div className="p-[0.800rem]">
        {/* Search and Sort Row */}
        <div className={`flex flex-col lg:flex-row lg:flex-wrap items-center gap-2 w-full ${showAdvancedFilters ? 'mb-4' : ''}`}>

          {/* Search */}
          <div className="w-full lg:w-72 xl:w-80">
            <div className="relative">
              <Input
                type="search"
                placeholder={t("downloadHistoryManagement.searchByTitleChannel")}
                value={searchQuery}
                onChange={(e) => onSearchChange(e?.target?.value)}
                className="pl-10 border-transparent bg-[#f0f2f5] dark:bg-[#202020] shadow-none hover:bg-[#e4e6eb] dark:hover:bg-[#2a2a2a] transition-colors"
              />
              <Icon
                name="Search"
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={onSortChange}
              placeholder={t("downloadHistoryManagement.sortBy")}
              className="w-40"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#252525] shadow-none"
            >
              <Icon name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={16} />
            </Button>
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant={showAdvancedFilters ? 'default' : 'outline'}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            iconName="Filter"
            iconPosition="left"
            className={`relative shadow-none ${!showAdvancedFilters ? 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#252525]' : ''}`}
          >
            {t("downloadHistoryManagement.filters")}
            {getActiveFiltersCount() > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>

          {/* ── Missing Files button — shown only when missing items exist ── */}
          {hasMissing && (
            <div className="relative">
              <button
                onClick={() => setShowMissingPanel((p) => !p)}
                className={`relative flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-black transition-all shadow-none border
                  ${showMissingPanel
                    ? 'bg-amber-500/15 border-amber-400/60 text-amber-700 dark:text-amber-300'
                    : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 hover:border-amber-400/40'
                  }`}
              >
                <Icon name="FileX2" size={15} />
                <span>Missing</span>
                {/* Count badge */}
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                  {missingItems.length}
                </span>
                <Icon
                  name={showMissingPanel ? 'ChevronUp' : 'ChevronDown'}
                  size={12}
                  className="opacity-60"
                />
              </button>

              <AnimatePresence>
                {showMissingPanel && (
                  <MissingFilesPanel
                    missingItems={missingItems}
                    onDeleteMissing={onDeleteMissing}
                    onClose={() => setShowMissingPanel(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Close Advanced Filters */}
          {showAdvancedFilters && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowAdvancedFilters(false)}
              title="Close Filters"
              className="ml-auto"
            >
              <Icon name="X" size={16} />
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="border-t border-border/50 pt-5 mt-2 relative px-2 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pl-2 sm:pl-4 pr-8">
              <Select
                label={t("downloadHistoryManagement.format")}
                options={formatOptions}
                value={filters?.format || ''}
                onChange={(value) => handleFilterChange('format', value)}
              />
              <Select
                label={t("downloadHistoryManagement.quality")}
                options={qualityOptions}
                value={filters?.quality || ''}
                onChange={(value) => handleFilterChange('quality', value)}
              />
              <Select
                label={t("downloadHistoryManagement.dateRange")}
                options={dateRangeOptions}
                value={filters?.dateRange || ''}
                onChange={(value) => handleFilterChange('dateRange', value)}
              />
              <Input
                label={t("downloadHistoryManagement.channel")}
                type="text"
                placeholder={t("downloadHistoryManagement.filterByChannel")}
                value={filters?.channel || ''}
                onChange={(e) => handleFilterChange('channel', e?.target?.value)}
              />
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {getActiveFiltersCount() > 0 && (
                  <span>
                    {getActiveFiltersCount()} {t("downloadHistoryManagement.filter")}
                    {getActiveFiltersCount() !== 1 ? 's' : ''} {t("downloadHistoryManagement.active")}
                  </span>
                )}
              </div>
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onClearFilters}
                  iconName="X"
                  iconPosition="left"
                >
                  {t("downloadHistoryManagement.clearFilters")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;