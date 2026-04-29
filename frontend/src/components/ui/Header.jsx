import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import ThemeToggle from './ThemeToggle';
import { useDownloadContext } from '../../context/DownloadContext';

const Header = ({ isScrolled: isScrolledProp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [internalScrolled, setInternalScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Notification bell state
  const { downloads, activeCount, bellColor, cancelDownload, pauseDownload, resumeDownload, dismissDownload, clearHistory } = useDownloadContext();
  const visibleDownloads = downloads.filter(d => !d.dismissed);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const sortByTime = (a, b) => {
    const timeA = new Date(a.startedAt || 0).getTime();
    const timeB = new Date(b.startedAt || 0).getTime();
    return sortNewestFirst ? timeB - timeA : timeA - timeB;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  // Tooltip States
  const [showStartupHint, setShowStartupHint] = useState(false);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  
  // Fullscreen States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHoveringTop, setIsHoveringTop] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('ytdeluxe_started')) {
      sessionStorage.setItem('ytdeluxe_started', 'true');
      setShowStartupHint(true);
      const timer = setTimeout(() => setShowStartupHint(false), 5000); // 5 sec fade out
      return () => clearTimeout(timer);
    }
  }, []);

  // Pages where sticky nav collapse is enabled
  const stickyNavRoutes = ['/', '/home-search-dashboard', '/search-results'];
  const isStickyNavPage = stickyNavRoutes.includes(location.pathname);

  const isScrolled = isScrolledProp !== undefined ? isScrolledProp : (isStickyNavPage ? internalScrolled : false);

  useEffect(() => {
    if (isScrolledProp !== undefined) return;
    if (!isStickyNavPage) return;
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

  // Close bell panel on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const handleFullscreenToggle = () => {
    setIsFullscreen(prev => !prev);
    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.toggle_fullscreen();
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleMinimize = () => {
    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.minimize_window();
    }
  };

  const handleClose = () => {
    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.close_window();
    }
  };

  // Handle F11 key for desktop fullscreen
  useEffect(() => {
    const handleF11 = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        handleFullscreenToggle();
      }
    };
    window.addEventListener('keydown', handleF11);
    return () => window.removeEventListener('keydown', handleF11);
  }, [handleFullscreenToggle]);

  const navigationItems = [
    { label: 'Home', path: '/home-search-dashboard', icon: 'Home', tooltip: 'Search and download videos' },

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
      {/* Invisible Top Hover Trigger for Windows Control Ribbon in Fullscreen */}
      {isFullscreen && (
        <div 
          className="fixed top-0 left-0 right-0 h-6 z-[1000] cursor-default" 
          onMouseEnter={() => setIsHoveringTop(true)} 
          onMouseLeave={() => setIsHoveringTop(false)}
        >
          {/* Windows Control Ribbon (Drops down from top) */}
          <AnimatePresence>
            {isHoveringTop && (
              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
                className="absolute top-0 right-0 flex items-center bg-black dark:bg-[#1C1C1C] text-white shadow-xl pointer-events-auto border-b border-l border-white/10 rounded-bl-xl overflow-hidden"
              >
                <button
                  onClick={handleMinimize}
                  className="px-5 py-2.5 hover:bg-white/10 transition-colors flex items-center justify-center focus:outline-none"
                  title="Minimize"
                >
                  <Icon name="Minus" size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={handleFullscreenToggle}
                  className="px-5 py-2.5 hover:bg-white/10 transition-colors flex items-center justify-center focus:outline-none"
                  title="Restore Down"
                >
                  <Icon name="Copy" size={14} strokeWidth={2.5} className="rotate-180" />
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 hover:bg-red-600 transition-colors flex items-center justify-center focus:outline-none"
                  title="Close App"
                >
                  <Icon name="X" size={16} strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Rounded Menus Container */}
      <div 
        className="fixed top-6 left-0 right-0 z-[110] pointer-events-none flex justify-center w-full px-6"
      >
        <div className="flex items-center justify-between max-w-7xl w-full relative">

          {/* Left: Logo */}
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="pointer-events-auto shrink-0 relative"
          >
            <div
              className="menu-glass-card relative flex items-center space-x-4 p-2 pr-6 cursor-pointer group"
              onClick={() => {
                window.__ytdeluxe_unloading = true;
                if (window.pywebview && window.pywebview._returnValuesCallbacks) {
                  window.pywebview._returnValuesCallbacks = {};
                }
                setTimeout(() => window.location.reload(), 150);
              }}
              onMouseEnter={() => setIsHoveringLogo(true)}
              onMouseLeave={() => setIsHoveringLogo(false)}
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-white/60 to-white/20 dark:from-white/25 dark:to-white/5 border border-white/60 dark:border-white/30 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] shrink-0 relative z-10 group-hover:rotate-6 transition-transform overflow-hidden">
                <img src="/assets/images/logo-light.webp" alt="YT-Deluxe" className="w-14 h-14 object-contain" />
              </div>
              <div className="block relative z-10">
                <h1 className="text-xl allan-bold text-foreground leading-none mb-0.5 tracking-tight">YT-Deluxe</h1>
                <p className="text-[10px] text-muted-foreground leading-none tracking-tight opacity-70">Premium Media Downloader</p>
              </div>
            </div>

            {/* Hint Tooltip - Shows on startup OR on hover */}
            <AnimatePresence>
              {(showStartupHint || isHoveringLogo) && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: showStartupHint && !isHoveringLogo ? 0.3 : 0 }}
                  className="absolute top-full mt-4 left-4 bg-zinc-800 dark:bg-zinc-800 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl font-medium tracking-wide z-[999] pointer-events-none whitespace-nowrap border border-white/20"
                >
                  Click to refresh app if stuck
                  <div className="absolute -top-1 left-5 w-2 h-2 bg-zinc-800 rotate-45 border-l border-t border-white/20" />
                </motion.div>
              )}
            </AnimatePresence>
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
            <div className="flex items-center">
              <ThemeToggle />

              {/* ── Notification Bell ── */}
              <div ref={bellRef} className="relative ml-3">
                <button
                  onClick={() => setBellOpen(prev => !prev)}
                  className="group menu-glass-card w-[44px] h-[44px] flex items-center justify-center transition-all duration-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] active:scale-[0.8] relative"
                  title="Download notifications"
                  aria-label="Open download notifications"
                >
                  <Icon name="Bell" size={18} className="text-foreground" />
                  {/* Status dot */}
                  {bellColor && (
                    <span className={`absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-background z-10 ${
                      bellColor === 'yellow' ? 'bg-warning' :
                      bellColor === 'green'  ? 'bg-success'  : 'bg-error'
                    }`}>
                      {bellColor === 'yellow' && (
                        <span className="absolute inset-0 rounded-full bg-warning animate-ping opacity-75" />
                      )}
                    </span>
                  )}
                </button>

                {/* ── Notification Panel Dropdown ── */}
                <AnimatePresence>
                  {bellOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -8 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      className="absolute right-0 top-[calc(100%+12px)] w-[340px] max-h-[520px] rounded-2xl overflow-hidden shadow-glass-xl z-[500] flex flex-col bg-white/[0.65] dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/[0.08]"
                    >
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Icon name="Bell" size={15} className="text-primary" />
                          <span className="text-sm font-semibold text-foreground">Downloads</span>
                          {activeCount > 0 && (
                            <span className="text-[10px] bg-warning/20 text-warning border border-warning/30 rounded-full px-2 font-mono font-bold">
                              {activeCount} active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              window.dispatchEvent(new Event('showGlobalFloater'));
                              setBellOpen(false);
                            }}
                            className="text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-all border border-primary/20 flex items-center gap-1"
                            title="Show floating progress panel"
                          >
                            <Icon name="ExternalLink" size={10} />
                            Floater
                          </button>
                          <button
                            onClick={() => setSortNewestFirst(prev => !prev)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                            title={sortNewestFirst ? 'Newest first' : 'Oldest first'}
                          >
                            <Icon name={sortNewestFirst ? 'ArrowDownWideNarrow' : 'ArrowUpNarrowWide'} size={14} />
                          </button>
                          {visibleDownloads.length > 0 && (
                            <button
                              onClick={() => { clearHistory(); }}
                              className="text-[11px] text-muted-foreground hover:text-error px-2 py-1 rounded-lg hover:bg-error/10 transition-all"
                            >
                              Clear All
                            </button>
                          )}
                          <button onClick={() => setBellOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                            <Icon name="X" size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable list */}
                      <div className="overflow-y-auto flex-1 px-3 py-2 space-y-1.5">
                        {visibleDownloads.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Icon name="BellOff" size={28} className="text-muted-foreground/40" />
                            <p className="text-xs text-muted-foreground">No downloads yet</p>
                          </div>
                        ) : (
                          ['downloading', 'pending', 'processing', 'completed', 'error', 'paused', 'cancelled'].map(status => {
                            const group = visibleDownloads.filter(d => d.status === status).sort(sortByTime);
                            if (group.length === 0) return null;
                            const sectionLabel = {
                              downloading: 'Running', pending: 'Running', processing: 'Processing',
                              completed: 'Completed', error: 'Failed',
                              paused: 'Paused', cancelled: 'Cancelled',
                            }[status] || status;
                            return (
                              <div key={status}>
                                <div className="px-1 py-1.5 flex items-center">
                                  <span className="text-[11px] font-bold text-muted-foreground tracking-wide bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 py-0.5 px-2 rounded-md shadow-sm">
                                    {sectionLabel} ({group.length})
                                  </span>
                                </div>
                                {group.map(dl => (
                                  <div 
                                    key={dl.id} 
                                    className="flex items-center gap-2.5 px-2 py-2 rounded-xl border border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                    onClick={(e) => {
                                      if (!e.target.closest('button')) {
                                        setBellOpen(false);
                                        navigate('/download-history-management');
                                      }
                                    }}
                                  >
                                    {/* Status icon */}
                                    <div className={`flex-shrink-0 ${
                                      dl.status === 'completed' ? 'text-success' :
                                      dl.status === 'error' ? 'text-error' :
                                      dl.status === 'paused' || dl.status === 'cancelled' ? 'text-muted-foreground' :
                                      'text-warning'
                                    }`}>
                                      <Icon
                                        name={
                                          dl.status === 'completed' ? 'CheckCircle2' :
                                          dl.status === 'error' ? 'AlertCircle' :
                                          dl.status === 'processing' ? 'Loader2' : 'Download'
                                        }
                                        size={14}
                                        className={dl.status === 'processing' ? 'animate-spin' : ''}
                                      />
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-foreground truncate">{dl.title || dl.filename}</p>
                                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                        {(dl.status === 'downloading' || dl.status === 'pending') && (
                                          <span className="text-[10px] text-primary font-mono">{dl.progress || 0}%</span>
                                        )}
                                        {dl.type && (
                                          <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">{dl.type}</span>
                                        )}
                                        {dl.quality && (
                                          <span className="text-[9px] font-bold text-success uppercase bg-success/10 px-1.5 py-0.5 rounded">{dl.quality}</span>
                                        )}
                                        {dl.completedAt && (
                                          <span className="text-[9px] font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                            <Icon name="Clock" size={8} />
                                            {new Date(dl.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        )}
                                        {dl.error && <span className="text-[9px] text-error truncate max-w-[120px]">{dl.error}</span>}
                                      </div>
                                      {/* Mini progress bar */}
                                      {(dl.status === 'downloading' || dl.status === 'pending') && (
                                        <div className="w-full h-1 bg-border/40 rounded-full mt-1 overflow-hidden">
                                          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${dl.progress || 0}%` }} />
                                        </div>
                                      )}
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      {(dl.status === 'downloading') && (
                                        <button onClick={(e) => { e.stopPropagation(); pauseDownload(dl.id); }} className="p-1 rounded text-muted-foreground hover:text-warning transition-colors" title="Pause">
                                          <Icon name="PauseCircle" size={12} />
                                        </button>
                                      )}
                                      {(dl.status === 'paused') && (
                                        <button onClick={(e) => { e.stopPropagation(); resumeDownload(dl.id); }} className="p-1 rounded text-muted-foreground hover:text-success transition-colors" title="Resume">
                                          <Icon name="Play" size={12} />
                                        </button>
                                      )}
                                      {dl.status === 'completed' && window.pywebview && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/desktop/open-file`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: dl.filename, filepath: dl.filepath }) }).catch(() => {}); }}
                                          className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title="Open file"
                                        >
                                          <Icon name="FolderOpen" size={12} />
                                        </button>
                                      )}
                                      {dl.status === 'error' && (
                                        <button onClick={(e) => { e.stopPropagation(); resumeDownload(dl.id); }} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title="Retry">
                                          <Icon name="RotateCcw" size={12} />
                                        </button>
                                      )}
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (dl.status === 'downloading' || dl.status === 'pending' || dl.status === 'processing') {
                                            cancelDownload(dl.id);
                                          } else {
                                            dismissDownload(dl.id);
                                          }
                                        }} 
                                        className="p-1 rounded text-muted-foreground hover:text-error transition-colors" 
                                        title={dl.status === 'downloading' || dl.status === 'pending' ? "Cancel" : "Remove"}
                                      >
                                        <Icon name="X" size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Fullscreen Button */}
              <button
                onClick={handleFullscreenToggle}
                className={`menu-glass-card w-[44px] h-[44px] flex items-center justify-center transition-colors duration-300 ml-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]`}
                title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
                aria-label="Toggle Fullscreen"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isFullscreen ? 'min' : 'max'}
                    initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Icon name={isFullscreen ? "Minimize" : "Maximize"} size={18} className="text-foreground transition-transform" />
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Hamburger — appears when scrolled (desktop). 
                   This wrapper has fixed dimensions so toggling menu 
                   doesn't shift ThemeToggle or Logo positions.
                   Button is in normal flow; dropdown is a separate absolute sibling. */}
              <div id="header-hamburger-menu" className="relative hidden md:block" style={{ width: isScrolled ? 44 : 0, marginLeft: isScrolled ? 12 : 0, height: 44, overflow: 'visible', transition: 'all 0.3s ease' }}>
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