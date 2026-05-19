import React from 'react';
import Icon from '../../../components/AppIcon';
import { useNavigate } from 'react-router-dom';

const EmptyState = ({ type = 'all', searchQuery, hasFilters, onClearFilters }) => {
  const navigate = useNavigate();

  const getEmptyStateContent = () => {
    if (searchQuery || hasFilters) {
      return {
        icon: 'SearchX',
        title: 'No results found',
        description: `No downloads match your current search${hasFilters ? ' and filters' : ''}. Try adjusting your criteria.`,
        action: {
          label: hasFilters ? 'Clear Filters' : 'Clear Search',
          onClick: onClearFilters,
          icon: 'ListFilter'
        },
        color: 'text-orange-500',
        bgShape: 'bg-orange-500/20'
      };
    }

    switch (type) {
      case 'saved':
        return {
          icon: 'Bookmark',
          title: 'No saved videos',
          description: 'Videos you save will appear here for easy access. Build your own premium collection!',
          action: {
            label: 'Browse Videos',
            onClick: () => navigate('/home-search-dashboard'),
            icon: 'Compass'
          },
          color: 'text-primary',
          bgShape: 'bg-primary/20'
        };

      default:
        return {
          icon: 'DownloadCloud',
          title: 'No downloads yet',
          description: 'Your premium download history will appear here once you start downloading media.',
          action: {
            label: 'Start Downloading',
            onClick: () => navigate('/home-search-dashboard'),
            icon: 'ArrowRight'
          },
          color: 'text-accent',
          bgShape: 'bg-accent/20'
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="w-full flex flex-col items-center justify-center py-20 px-4 relative overflow-hidden rounded-[2rem]">
      {/* Ambient background glow inside the empty state */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] ${content.bgShape} rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-60 dark:opacity-30 pointer-events-none`} />

      <div className="relative z-10">
        <div className="relative mb-8">
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-[2rem] shadow-2xl dark:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.05)] border border-slate-200/80 dark:border-white/10">
            <Icon name={content.icon} size={64} className={`${content.color} drop-shadow-sm`} strokeWidth={1.5} />
          </div>
          
          <div className="absolute -bottom-2 -right-4">
            <div className="bg-slate-100 dark:bg-zinc-700 p-2.5 rounded-full shadow-lg border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300">
              <Icon name="Sparkles" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto">
        <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
          {content.title}
        </h3>
        <p className="text-[15px] text-muted-foreground/90 mb-8 leading-relaxed">
          {content.description}
        </p>

        <button
          onClick={content.action.onClick}
          className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 font-bold text-[15px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_20px_-8px_var(--color-primary)] transition-colors w-full sm:w-auto"
        >
          {content.action.label}
          <Icon name={content.action.icon} size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default EmptyState;