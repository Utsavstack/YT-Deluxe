import { useTranslation } from "react-i18next";import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const HistoryCard = ({ item, onRedownload, onDelete, onOpenLocation, onShare, isSelected, onSelect }) => {const { t } = useTranslation();
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
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes?.toString()?.padStart(2, '0')}:${secs?.toString()?.padStart(2, '0')}`;
    }
    return `${minutes}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const getFormatIcon = (format) => {
    switch (format?.toLowerCase()) {
      case 'mp4':
        return 'Video';
      case 'mp3':
        return 'Music';
      case 'webm':
        return 'FileVideo';
      default:
        return 'File';
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case '1080p':
        return 'text-success';
      case '720p':
        return 'text-primary';
      case '480p':
        return 'text-warning';
      case '360p':case '240p':case '144p':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div
      className={`glass-card hover:shadow-glass-lg transition-all duration-300 spring-smooth ${
      isSelected ? 'ring-2 ring-primary' : ''}`
      }
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}>
      
   <div className="p-4">
    <div className="flex items-start space-x-4">
     {/* Selection Checkbox */}
     <div className="flex-shrink-0 pt-1">
      <button
              onClick={() => onSelect(item?.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected ?
              'bg-primary border-primary text-primary-foreground' :
              'border-border hover:border-primary'}`
              }>
              
       {isSelected && <Icon name="Check" size={12} />}
      </button>
     </div>

     {/* Thumbnail */}
     <div className="flex-shrink-0">
      <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-muted">
       <Image
                src={item?.thumbnail}
                alt={item?.title}
                className="w-full h-full object-cover" />
              
       <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
        {formatDuration(item?.duration)}
       </div>
      </div>
     </div>

     {/* Content */}
     <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between">
       <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
         {item?.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
         {item?.channel}
        </p>
       </div>
       
       {/* Quick Actions */}
       <div className={`flex items-center space-x-1 transition-opacity ${
              showActions ? 'opacity-100' : 'opacity-0'}`
              }>
        <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => onRedownload(item)}
                  title={t("downloadHistoryManagement.redownload")}>
                  
         <Icon name="Download" size={14} />
        </Button>
        <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => onShare(item)}
                  title={t("downloadHistoryManagement.share")}>
                  
         <Icon name="Share2" size={14} />
        </Button>
        <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(item)}
                  title={t("downloadHistoryManagement.delete1")}>
                  
         <Icon name="Trash2" size={14} />
        </Button>
       </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
       <div className="flex items-center space-x-1">
        <Icon name={getFormatIcon(item?.format)} size={12} />
        <span className="uppercase font-medium">{item?.format}</span>
       </div>
       <div className={`font-medium ${getQualityColor(item?.quality)}`}>
        {item?.quality}
       </div>
       <div>{formatFileSize(item?.fileSize)}</div>
       <div>{new Date(item.downloadDate)?.toLocaleDateString()}</div>
      </div>

      {/* Tags */}
      {item?.tags && item?.tags?.length > 0 &&
            <div className="flex flex-wrap gap-1 mt-2">
        {item?.tags?.slice(0, 3)?.map((tag, index) =>
              <span
                key={index}
                className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">
                
          {tag}
         </span>
              )}
        {item?.tags?.length > 3 &&
              <span className="text-xs text-muted-foreground">
          +{item?.tags?.length - 3} {t("downloadHistoryManagement.more")} 
              </span>
              }
       </div>
            }
     </div>
    </div>

    {/* Bottom Actions */}
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
     <div className="flex items-center space-x-2">
      <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenLocation(item)}
              iconName="FolderOpen"
              iconPosition="left"
              className="text-xs"> {t("downloadHistoryManagement.openLocation")} 


            </Button>
     </div>
     
     <div className="flex items-center space-x-2 text-xs text-muted-foreground">
      <Icon name="Calendar" size={12} />
      <span>{new Date(item.downloadDate)?.toLocaleString()}</span>
     </div>
    </div>
   </div>
  </div>);

};

export default HistoryCard;