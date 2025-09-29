import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const EmptyState = ({ type = 'all', searchQuery, hasFilters, onClearFilters }) => {
  const navigate = useNavigate();

  const getEmptyStateContent = () => {
    if (searchQuery || hasFilters) {
      return {
        icon: 'Search',
        title: 'No results found',
        description: `No downloads match your current search${hasFilters ? ' and filters' : ''}.`,
        action: {
          label: hasFilters ? 'Clear Filters' : 'Clear Search',
          onClick: onClearFilters
        }
      };
    }

    switch (type) {
      case 'watchLater':
        return {
          icon: 'Clock',
          title: 'No videos in Watch Later',
          description: 'Videos you mark to watch later will appear here.',
          action: {
            label: 'Browse Videos',
            onClick: () => navigate('/home-search-dashboard')
          }
        };
      
      case 'bookmarks':
        return {
          icon: 'Bookmark',
          title: 'No bookmarked videos',
          description: 'Videos you bookmark will be saved here for easy access.',
          action: {
            label: 'Find Videos',
            onClick: () => navigate('/home-search-dashboard')
          }
        };
      
      default:
        return {
          icon: 'Download',
          title: 'No downloads yet',
          description: 'Your download history will appear here once you start downloading videos.',
          action: {
            label: 'Start Downloading',
            onClick: () => navigate('/home-search-dashboard')
          }
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="glass-card">
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
          <Icon name={content?.icon} size={32} className="text-accent-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {content?.title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {content?.description}
        </p>
        
        <Button
          variant="default"
          onClick={content?.action?.onClick}
          iconName={content?.icon}
          iconPosition="left"
        >
          {content?.action?.label}
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;