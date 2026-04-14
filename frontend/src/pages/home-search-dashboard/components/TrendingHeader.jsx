import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import './TrendingHeader.css';

const TrendingHeader = ({
  onRefresh,
  lastUpdated,
  isLoading,
  categories = [],
  activeCategory = "All",
  onCategorySelect,
  isSticky = false
}) => {
  const { t } = useTranslation();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = async () => {
    if (spinning || isLoading) return;
    setSpinning(true);
    await onRefresh?.();
    setTimeout(() => setSpinning(false), 800);
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Just now';
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    return `${Math.floor(diffMins / 60)} hr ago`;
  };

  return (
    <div
      className={`trending-header-wrapper transition-all duration-500 ease-in-out ${isSticky ? 'trending-header-sticky' : ''}`}
    >
      <div className="space-y-3">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 title-row">
          <div className="group flex w-max items-center space-x-2 px-4 py-1.5 bg-card/60 backdrop-blur-md rounded-full border border-border/50 hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/40 shadow-glass-sm hover:shadow-[0_4px_20px_-5px_var(--color-primary)] transition-all duration-300 cursor-default">
            <Icon name="TrendingUp" size={20} className="text-primary group-hover:animate-pulse" />
            <h2 className="text-sm font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer">{t("homeSearchDashboard.trendingVideos")}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={spinning || isLoading}
              className="group refresh-btn flex w-max items-center space-x-2 px-4 py-1.5 bg-card/60 hover:bg-muted/80 backdrop-blur-lg rounded-full border border-border/50 hover:border-primary/50 shadow-glass-sm hover:shadow-[0_0_15px_var(--color-primary)] hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 cursor-pointer"
              title={t("homeSearchDashboard.refreshTrendingVideos")}>
              <Icon
                name="RefreshCw"
                size={14}
                className={`text-muted-foreground group-hover:text-primary transition-colors duration-300 ${spinning ? 'animate-spin text-primary' : ''}`} />
              <span className="text-xs font-semibold tracking-wide text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                {t("homeSearchDashboard.updated")} {getTimeAgo(lastUpdated)}
              </span>
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        {categories.length > 0 && (
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 lg:-mx-0 lg:px-0 custom-scrollbar gap-2">
            {categories.map((category) => (
              <button
                    key={category}
                    onClick={() => onCategorySelect?.(category)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border shrink-0 ${activeCategory === category ?
                        'bg-primary text-primary-foreground border-primary shadow-sm' :
                        'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-border/80'}`
                    }>
                    {category}
                  </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingHeader;
