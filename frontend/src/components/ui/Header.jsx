import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Home',
      path: '/home-search-dashboard',
      icon: 'Home',
      tooltip: 'Search and download videos'
    },
    {
      label: 'Batch',
      path: '/batch-download-manager',
      icon: 'Download',
      tooltip: 'Manage bulk downloads'
    },
    {
      label: 'History',
      path: '/download-history-management',
      icon: 'History',
      tooltip: 'View download history'
    },
    {
      label: 'Settings',
      path: '/user-settings-preferences',
      icon: 'Settings',
      tooltip: 'Configure preferences'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Floating Rounded Menus Container */}
      <div className="fixed top-6 left-0 right-0 z-[100] pointer-events-none flex justify-center w-full px-6">
        <div className="flex items-center justify-between max-w-7xl w-full relative">

          {/* Left Menu: Logo as a Rounded Floating Menu glass-card */}
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="pointer-events-auto shrink-0"
          >
            <div className="menu-glass-card flex items-center space-x-4 p-2 pr-6 cursor-pointer group" onClick={() => handleNavigation('/home-search-dashboard')}>
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-white/60 to-white/20 dark:from-white/25 dark:to-white/5 border border-white/60 dark:border-white/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] shrink-0 relative z-10 group-hover:rotate-6 transition-transform overflow-hidden">
                <img src="/assets/images/logo-light.png" alt="YT-Deluxe" className="w-14 h-14 object-contain" />
              </div>
              <div className="block relative z-10">
                <h1 className="text-xl allan-bold text-foreground leading-none mb-0.5 tracking-tight">YT-Deluxe</h1>
                <p className="text-[10px] text-muted-foreground leading-none tracking-tight opacity-70">Premium Media Downloader</p>
              </div>
            </div>
          </motion.div>

          {/* Center Menu: Nav as a Rounded Floating Menu glass-card */}
          <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none hidden md:flex justify-center items-center">
            <motion.div
              initial={{ y: -60, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1
              }}
              className="pointer-events-auto"
            >
              <nav className="menu-glass-card flex items-center space-x-2 p-2 w-fit shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              {navigationItems?.map((item) => {
                const isActive = isActivePath(item?.path);
                return (
                  <button
                    key={item?.path}
                    onClick={() => handleNavigation(item?.path)}
                    className={`
            flex items-center space-x-2 px-6 py-2.5 rounded-2xl text-sm font-medium
            transition-all duration-300 relative z-10
            ${isActive ? 'text-foreground drop-shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'}
           `}
                    title={item?.tooltip}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="header-active-tab-v2"
                        className="absolute inset-0 bg-background/60 dark:bg-white/10 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-border/50 rounded-2xl -z-10"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                      />
                    )}
                    <Icon name={item?.icon} size={16} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                    <span>{item?.label}</span>
                  </button>
                );
              })}
              </nav>
            </motion.div>
          </div>

          {/* Right Section: Theme Toggle */}
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="pointer-events-auto shrink-0"
          >
            <ThemeToggle />
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation (Floating Bottom Island) */}
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.3
        }}
        className="md:hidden fixed bottom-6 left-6 right-6 z-[100] pointer-events-none"
      >
        <nav className="menu-glass-card flex items-center justify-around py-3 px-2 pointer-events-auto backdrop-blur-3xl shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
          {navigationItems?.map((item) => {
            const isActive = isActivePath(item?.path);
            return (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`
            flex flex-col items-center space-y-1.5 px-1 py-1 rounded-2xl text-[10px] font-bold uppercase tracking-[0.1em]
            transition-all duration-300 min-w-0 flex-1 relative z-10
            ${isActive ? 'text-blue-600 scale-110' : 'text-muted-foreground hover:text-foreground'}
           `}
                title={item?.tooltip}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-tab"
                    className="absolute inset-0 bg-background/40 dark:bg-white/10 backdrop-blur-2xl border border-border/40 rounded-2xl -z-10"
                    initial={false}
                  />
                )}
                <Icon name={item?.icon} size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                <span className="truncate pt-0.5">{item?.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
};

export default Header;