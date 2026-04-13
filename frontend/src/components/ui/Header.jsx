import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import ThemeToggle from './ThemeToggle';

const Header = ({ isScrolled: isScrolledProp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [internalScrolled, setInternalScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Pages where sticky nav collapse is enabled
  const stickyNavRoutes = ['/', '/home-search-dashboard', '/search-results'];
  const isStickyNavPage = stickyNavRoutes.includes(location.pathname);

  // If parent passes isScrolled (search results page), use that.
  // Otherwise, listen to scroll ourselves — but ONLY on allowed pages.
  // On other pages (Batch, History, Settings), nav always stays full.
  const isScrolled = isScrolledProp !== undefined ? isScrolledProp : (isStickyNavPage ? internalScrolled : false);

  useEffect(() => {
    if (isScrolledProp !== undefined) return; // parent controls it
    if (!isStickyNavPage) return; // don't listen on non-sticky pages
    const onScroll = () => setInternalScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isScrolledProp, isStickyNavPage]);

  // Close hamburger menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('#header-hamburger-menu')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const navigationItems = [
    { label: 'Home', path: '/home-search-dashboard', icon: 'Home', tooltip: 'Search and download videos' },
    { label: 'Batch', path: '/batch-download-manager', icon: 'Download', tooltip: 'Manage bulk downloads' },
    { label: 'History', path: '/download-history-management', icon: 'History', tooltip: 'View download history' },
    { label: 'Settings', path: '/user-settings-preferences', icon: 'Settings', tooltip: 'Configure preferences' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      {/* Floating Rounded Menus Container */}
      <div className="fixed top-6 left-0 right-0 z-[100] pointer-events-none flex justify-center w-full px-6">
        <div className="flex items-center justify-between max-w-7xl w-full relative">

          {/* Left: Logo */}
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="pointer-events-auto shrink-0"
          >
            <div
              className="menu-glass-card flex items-center space-x-4 p-2 pr-6 cursor-pointer group"
              onClick={() => handleNavigation('/home-search-dashboard')}
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-white/60 to-white/20 dark:from-white/25 dark:to-white/5 border border-white/60 dark:border-white/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] shrink-0 relative z-10 group-hover:rotate-6 transition-transform overflow-hidden">
                <img src="/assets/images/logo-light.png" alt="YT-Deluxe" className="w-14 h-14 object-contain" />
              </div>
              <div className="block relative z-10">
                <h1 className="text-xl allan-bold text-foreground leading-none mb-0.5 tracking-tight">YT-Deluxe</h1>
                <p className="text-[10px] text-muted-foreground leading-none tracking-tight opacity-70">Premium Media Downloader</p>
              </div>
            </div>
          </motion.div>

          {/* Center: Nav — collapses when scrolled */}
          <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none hidden md:flex justify-center items-center">
            <AnimatePresence mode="wait">
              {!isScrolled ? (
                <motion.div
                  key="full-nav"
                  initial={{ y: -60, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
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
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <Icon name={item?.icon} size={16} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                          <span>{item?.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Right Section: ThemeToggle + Hamburger (on scroll) */}
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="pointer-events-auto shrink-0"
            layout={false}
          >
            {/* Stable flex row — items here never re-animate */}
            <div className="flex items-center gap-3">
              <ThemeToggle />

              {/* Hamburger — appears when scrolled (desktop). 
                   This wrapper has fixed dimensions so toggling menu 
                   doesn't shift ThemeToggle or Logo positions.
                   Button is in normal flow; dropdown is a separate absolute sibling. */}
              <div id="header-hamburger-menu" className="relative hidden md:block" style={{ width: isScrolled ? 44 : 0, height: 44, overflow: 'visible', transition: 'width 0.3s ease' }}>
                {/* Button — normal flow, no absolute positioning */}
                <AnimatePresence>
                  {isScrolled && (
                    <motion.div
                      key="hamburger-btn"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: "spring", stiffness: 320, damping: 25 }}
                    >
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`menu-glass-card p-3 flex items-center justify-center transition-colors duration-300 ${menuOpen ? 'bg-primary/10 border-primary/30' : ''}`}
                        title="Navigation menu"
                        aria-label="Open navigation menu"
                      >
                        <motion.div
                          animate={{ rotate: menuOpen ? 90 : 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                          <Icon name={menuOpen ? 'X' : 'Menu'} size={20} className={menuOpen ? 'text-primary' : 'text-foreground'} />
                        </motion.div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dropdown Menu — separate from button, anchored to wrapper */}
                <AnimatePresence>
                  {menuOpen && isScrolled && (
                    <motion.div
                      key="hamburger-dropdown"
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="absolute right-[130px] top-[calc(100%-20px)] menu-glass-card p-2 flex flex-col gap-1 min-w-[200px] shadow-glass-xl z-50"
                    >
                      {navigationItems.map((item) => {
                        const isActive = isActivePath(item?.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={`
                              flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-left
                              transition-all duration-200 group relative
                              ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-foreground hover:bg-accent/40 hover:text-primary'
                              }
                            `}
                          >
                            <Icon
                              name={item.icon}
                              size={16}
                              className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}
                            />
                            <span>{item.label}</span>
                            {isActive && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Mobile Navigation (Floating Bottom Island) */}
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
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