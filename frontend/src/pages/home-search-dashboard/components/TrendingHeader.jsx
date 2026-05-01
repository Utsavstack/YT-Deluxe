import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import './TrendingHeader.css';

const TrendingHeader = ({
  onRefresh,
  lastUpdated,
  isLoading,
  categories = [],
  activeCategory = "All",
  onCategorySelect,
  isSticky = false,
  isCollapsed = false,
  onToggleCollapse
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full">
        
        {/* Left Capsule: Title & Refresh */}
        <div className="menu-glass-card flex items-center gap-[1px] pl-2.5 pr-1.5 py-1.5 rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] shrink-0 border border-border/50">
          <div className="flex flex-col py-0.5 cursor-default leading-tight pr-1">
            <div className="flex items-center gap-1.5">
              <Icon name="TrendingUp" size={13} className="text-primary group-hover:animate-pulse" />
              <h2 className="text-[11px] font-extrabold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer">
                {t("homeSearchDashboard.trendingVideos", "Trending")}
              </h2>
            </div>
            <span className="text-[9px] text-muted-foreground ml-4 font-medium opacity-80">
              {getTimeAgo(lastUpdated)}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={spinning || isLoading}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors group cursor-pointer disabled:opacity-50"
            title={t("homeSearchDashboard.refreshTrendingVideos")}
          >
            <Icon
              name="RefreshCw"
              size={13}
              className={`text-foreground group-hover:text-primary transition-colors ${spinning ? 'animate-spin text-primary' : ''}`}
            />
          </button>
        </div>

        {/* Right Capsule: Categories & Filter */}
        <div className={`menu-glass-card flex items-center transition-all duration-300 border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-0
           ${isCollapsed ? 'rounded-[16px] p-0' : 'rounded-[22px] p-1.5 gap-1'}
        `}>
          
          <AnimatePresence initial={false}>
            {!isCollapsed && categories.length > 0 && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden min-w-0"
              >
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pr-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => onCategorySelect?.(category)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shrink-0 ${activeCategory === category ?
                          'bg-primary text-primary-foreground shadow-sm' :
                          'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground'}`
                      }
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={onToggleCollapse}
            className={`flex items-center justify-center transition-all duration-300 shrink-0
              ${isCollapsed 
                ? 'w-[44px] h-[44px] rounded-[16px] text-primary hover:bg-black/5 dark:hover:bg-white/10 bg-primary/5' 
                : 'w-[35px] h-[35px] rounded-full text-foreground text-red-500 hover:bg-red-300 dark:hover:bg-red-200 bg-red-200/30'
              }`}
            title={isCollapsed ? t("homeSearchDashboard.showCategories", "Show Categories") : t("homeSearchDashboard.hideCategories", "Hide Categories")}
          >
            <Icon name={isCollapsed ? "Filter" : "FilterX"} size={16} className="transition-transform hover:scale-110" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default TrendingHeader;
