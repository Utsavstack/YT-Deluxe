import { useTranslation } from "react-i18next";import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const FilterBar = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  filters,
  onFiltersChange,
  onClearFilters
}) => {const { t } = useTranslation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const sortOptions = [
  { value: 'downloadDate', label: 'Download Date' },
  { value: 'title', label: 'Title' },
  { value: 'fileSize', label: 'File Size' },
  { value: 'channel', label: 'Channel' },
  { value: 'duration', label: 'Duration' },
  { value: 'format', label: 'Format' }];


  const formatOptions = [
  { value: '', label: 'All Formats' },
  { value: 'mp4', label: 'MP4 Video' },
  { value: 'mp3', label: 'MP3 Audio' },
  { value: 'webm', label: 'WEBM Video' }];


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
  { value: 'Audio Only', label: 'Audio Only' }];


  const dateRangeOptions = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' }];


  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters)?.filter((value) => value && value !== '')?.length;
  };

  return (
    <div className="bg-white/90 dark:bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] shadow-glass-sm hover:shadow-glass-md transition-all inline-block w-full lg:w-auto" style={{ position: "relative", zIndex: 100 }}>
   <div className="p-[0.800rem]">
    {/* Search and Sort Row */}
    <div className={`flex flex-col lg:flex-row items-center gap-2 ${showAdvancedFilters ? 'mb-4' : ''}`}>
     {/* Search */}
     <div className="w-full lg:w-72 xl:w-80">
      <div className="relative">
       <Input
                type="search"
                placeholder={t("downloadHistoryManagement.searchByTitleChannel")}
                value={searchQuery}
                onChange={(e) => onSearchChange(e?.target?.value)}
                className="pl-10 border-transparent bg-[#f0f2f5] dark:bg-[#202020] shadow-none hover:bg-[#e4e6eb] dark:hover:bg-[#2a2a2a] transition-colors" />
              
       <Icon
                name="Search"
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              
      </div>
     </div>

     {/* Sort Controls */}
     <div className="flex items-center space-x-2">
      <Select
              options={sortOptions}
              value={sortBy}
              onChange={onSortChange}
              placeholder={t("downloadHistoryManagement.sortBy")}
              className="w-40" />
            
      <Button
              variant="outline"
              size="icon"
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#252525] shadow-none">
              
       <Icon name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={16} />
      </Button>
     </div>

     {/* Advanced Filters Toggle */}
     <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            iconName="Filter"
            iconPosition="left"
            className={`relative shadow-none ${!showAdvancedFilters ? 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#252525]' : ''}`}> 
            {t("downloadHistoryManagement.filters")} 

            {getActiveFiltersCount() > 0 &&
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
        {getActiveFiltersCount()}
       </span>
            }
     </Button>

     {/* Close Advanced Filters Red Cross */}
     {showAdvancedFilters && (
        <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowAdvancedFilters(false)}
            title="Close Filters"
            className="ml-[192px]"
        >
            <Icon name="X" size={16} />
        </Button>
     )}
    </div>

    {/* Advanced Filters */}
    {showAdvancedFilters &&
        <div className="border-t border-border/50 pt-5 mt-2 relative px-2 pb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pl-2 sm:pl-4 pr-8">
       <Select
              label={t("downloadHistoryManagement.format")}
              options={formatOptions}
              value={filters?.format || ''}
              onChange={(value) => handleFilterChange('format', value)} />
            
       
       <Select
              label={t("downloadHistoryManagement.quality")}
              options={qualityOptions}
              value={filters?.quality || ''}
              onChange={(value) => handleFilterChange('quality', value)} />
            
       
       <Select
              label={t("downloadHistoryManagement.dateRange")}
              options={dateRangeOptions}
              value={filters?.dateRange || ''}
              onChange={(value) => handleFilterChange('dateRange', value)} />
            
       
       <Input
              label={t("downloadHistoryManagement.channel")}
              type="text"
              placeholder={t("downloadHistoryManagement.filterByChannel")}
              value={filters?.channel || ''}
              onChange={(e) => handleFilterChange('channel', e?.target?.value)} />
            
      </div>

      {/* Filter Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
       <div className="text-sm text-muted-foreground">
        {getActiveFiltersCount() > 0 &&
              <span>{getActiveFiltersCount()} {t("downloadHistoryManagement.filter")}{getActiveFiltersCount() !== 1 ? 's' : ''} {t("downloadHistoryManagement.active")}</span>
              }
       </div>
       
       {getActiveFiltersCount() > 0 &&
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconPosition="left"> {t("downloadHistoryManagement.clearFilters")} 
            </Button>
            }
      </div>
     </div>
        }
   </div>
  </div>);

};

export default FilterBar;