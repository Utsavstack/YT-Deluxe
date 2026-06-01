import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/AppIcon';
import Header from '../../components/ui/Header';
import ThemeCustomization from './components/ThemeCustomization';
import DownloadPreferences from './components/DownloadPreferences';
import LanguageSettings from './components/LanguageSettings';
import AccountManagement from './components/AccountManagement';
import AboutYTDeluxe from './components/AboutYTDeluxe';
import ChangelogAndFaq from './components/ChangelogAndFaq';
import ReportAProblem from './components/ReportAProblem';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import LicenseAndDisclaimer from './components/LicenseAndDisclaimer';

import { useTheme } from '../../utils/ThemeContext';
import { YTDeluxeStorage, STORAGE_KEYS } from '../../utils/storage';
import { getAllPermissions, resetPermission, resetAllPermissions, PERMISSION_META, PERMISSIONS } from '../../utils/permissions';
import { useUpdateCheck } from '../../hooks/useUpdateCheck';
import { UpdateBanner } from '../../components/ui/UpdateBanner';

// ── Auto-reads from package.json — just bump version there, no manual UI updates needed
const APP_VERSION = `v${import.meta.env.VITE_APP_VERSION || import.meta.env.PACKAGE_VERSION || '1.0.0-beta'}`;

const UserSettingsPreferences = () => {
  const { t, i18n } = useTranslation();
  const { theme: currentTheme, setTheme: onThemeChange, accentColor: currentAccentColor, setAccentColor: handleAccentColorChange } = useTheme();
  const [activeSection, setActiveSection] = useState('account');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hasUnseenUpdate, updateData } = useUpdateCheck();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Mock user data
  const [user, setUser] = useState({
    name: 'User',
    avatar: '',
    caption: "Hey I'm using YT Deluxe",
  });

  const DEFAULT_DOWNLOAD_PREFS = {
    defaultVideoQuality: '1080p',
    defaultVideoFormat: 'mp4',
    defaultAudioFormat: 'mp3',
    autoSelectBestQuality: true,
    namingConvention: 'title',
    customTemplate: '{channel} - {title} [{quality}]',
    removeSpecialChars: true,
    addDownloadDate: false,
    downloadPath: '',
    organizeFolders: false,        // default: flat — files go directly into download folder
    createChannelFolders: true,
    createDateFolders: false,
    maxConcurrentDownloads: 3,
    speedLimit: 0,
    resumeDownloads: true,
    verifyIntegrity: true,
    autoRetry: true,
    deleteAfterConversion: false
  };

  const DEFAULT_LANGUAGE_SETTINGS = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-US',
    useSystemLocale: false,
    autoTranslateTitles: false,
    autoTranslateDescriptions: false,
    showOriginalText: true,
    preferSubtitlesInLanguage: true,
    rtlLayout: false,
    localizedShortcuts: true,
    autoDetectInput: false
  };

  const [downloadPreferences, setDownloadPreferences] = useState(DEFAULT_DOWNLOAD_PREFS);
  const [languageSettings, setLanguageSettings] = useState(DEFAULT_LANGUAGE_SETTINGS);


  const settingSections = [
    { id: 'account', label: t('nav.myProfile'), icon: 'User', description: t('nav.profileDesc') },
    { id: 'theme', label: t('nav.theme'), icon: 'Palette', description: t('nav.themeDesc') },
    { id: 'downloads', label: t('nav.downloads'), icon: 'Download', description: t('nav.downloadsDesc') },
    { id: 'language', label: t('nav.language'), icon: 'Globe', description: t('nav.languageDesc') },
    { id: 'about', label: t('nav.about'), icon: 'Info', description: t('nav.aboutDesc') },
    { id: 'updates', label: t('nav.updates', 'Updates & FAQ'), icon: 'Zap', description: t('nav.updatesDesc', 'Changelog and support') },
    { id: 'permissions', label: 'App Permissions', icon: 'ShieldCheck', description: 'Manage permissions' },
    { id: 'privacy', label: t('nav.privacy'), icon: 'Shield', description: t('nav.privacyDesc') },
    { id: 'terms', label: t('nav.terms'), icon: 'FileText', description: t('nav.termsDesc') },
    { id: 'license', label: t('nav.license', 'License & Disclaimer'), icon: 'Scale', description: t('nav.licenseDesc', 'Legal terms and licenses') },
    { id: 'report', label: 'Report a Problem', icon: 'Bug', description: 'Bug reports & known issues' },
  ];

  // Load ALL persisted settings on mount
  useEffect(() => {
    const loadAllSettings = async () => {
      // Language
      const savedLanguage = await YTDeluxeStorage.getItem(STORAGE_KEYS.LANGUAGE, 'en');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
      }

      // Download preferences (merged over defaults so new keys are always present)
      const savedDownloadPrefs = await YTDeluxeStorage.getItem(STORAGE_KEYS.DOWNLOAD_PREFS, null);
      if (savedDownloadPrefs && typeof savedDownloadPrefs === 'object') {
        setDownloadPreferences(prev => ({ ...prev, ...savedDownloadPrefs }));
      }

      // Download path (stored separately for direct API use)
      const savedPath = await YTDeluxeStorage.getItem(STORAGE_KEYS.DOWNLOAD_PATH, '');
      if (savedPath) {
        setDownloadPreferences(prev => ({ ...prev, downloadPath: savedPath }));
      }

      // Language settings
      const savedLangSettings = await YTDeluxeStorage.getItem('ytdeluxe_language_settings', null);
      if (savedLangSettings && typeof savedLangSettings === 'object') {
        setLanguageSettings(prev => ({ ...prev, ...savedLangSettings }));
      }
    };
    loadAllSettings();
  }, []);

  const handleThemeChange = (newTheme) => onThemeChange(newTheme);

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    // Use YTDeluxeStorage so language persists in the backend settings file on desktop
    YTDeluxeStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    i18n.changeLanguage(language);
  };

  // Persist ALL download preferences to storage on every change
  const handleDownloadPreferencesChange = (updated) => {
    setDownloadPreferences(updated);
    // Save full prefs object — backend will extract downloadPath + organizeFolders
    // and sync both to Windows registry automatically (see /api/settings/:key handler)
    YTDeluxeStorage.setItem(STORAGE_KEYS.DOWNLOAD_PREFS, updated);

    // Also keep download path in its dedicated key (used by the download API + history recovery)
    if (updated.downloadPath !== undefined) {
      YTDeluxeStorage.setItem(STORAGE_KEYS.DOWNLOAD_PATH, updated.downloadPath);
    }

    // Keep organize_folders in its dedicated key:
    //   - localStorage  → read instantly by api.js for every download
    //   - YTDeluxeStorage (backend) → triggers registry sync so installer and
    //     in-app Settings never diverge
    if (updated.organizeFolders !== undefined) {
      localStorage.setItem('ytdeluxe_organize_folders', updated.organizeFolders ? 'true' : 'false');
      YTDeluxeStorage.setItem('ytdeluxe_organize_folders', updated.organizeFolders);
    }
  };

  // Persist language settings to storage on every change
  const handleLanguageSettingsChange = (updated) => {
    setLanguageSettings(updated);
    YTDeluxeStorage.setItem('ytdeluxe_language_settings', updated);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'theme':
        return <ThemeCustomization currentTheme={currentTheme} onThemeChange={handleThemeChange} currentAccentColor={currentAccentColor} onAccentColorChange={handleAccentColorChange} />;
      case 'downloads':
        return <DownloadPreferences preferences={downloadPreferences} onPreferencesChange={handleDownloadPreferencesChange} />;
      case 'language':
        return <LanguageSettings currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} settings={languageSettings} onSettingsChange={handleLanguageSettingsChange} />;
      case 'permissions':
        return <PermissionsPanel />;
      case 'updates':
        return <ChangelogAndFaq />;
      case 'report':
        return <ReportAProblem />;
      case 'account':
        return <AccountManagement user={user} onUserUpdate={setUser} />;
      case 'about':
        return <AboutYTDeluxe />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsAndConditions />;
      case 'license':
        return <LicenseAndDisclaimer />;
      default:
        return null;
    }
  };

  const getCurrentSectionInfo = () => settingSections?.find(section => section?.id === activeSection) || settingSections?.[0];

  const sidebarVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <>
      <Helmet>
        <title>Settings & Preferences - YT Deluxe</title>
        <meta name="description" content="Customize your YT Deluxe experience." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />


        <div className="pt-24 pb-12">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-8 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative"
            >
              <div className="flex items-center space-x-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-glass-md">
                  <Icon name="Settings2" size={20} />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{t('settings.title')}</h1>
                  <p className="text-xs text-muted-foreground">{t('settings.subtitle')}</p>
                </div>
              </div>
              
              {/* Global Update Banner */}
              {hasUnseenUpdate && updateData && !isBannerDismissed && activeSection !== 'updates' && (
                <div className="flex-1 flex justify-center w-full md:absolute md:left-1/2 md:-translate-x-1/2 pointer-events-none mt-4 md:mt-0">
                  <div className="pointer-events-auto">
                    <UpdateBanner 
                      latestRelease={updateData} 
                      onDismiss={() => setIsBannerDismissed(true)} 
                      className="mb-0"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 rounded-[2.5rem] bg-white/90 dark:bg-black/40 backdrop-blur-xl bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background border border-black/5 dark:border-white/5 p-6 md:p-8 mt-4">
              {/* Desktop Sidebar */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={sidebarVariants}
                className="hidden lg:block lg:col-span-1"
              >
                <div className="glass-card p-6 sticky top-28 space-y-6 bg-slate-50/50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    {t('settings.configMap')}
                  </div>
                  <nav className="space-y-2 max-h-[60vh] overflow-y-auto overscroll-contain pr-4">
                    {settingSections?.map((section) => (
                      <motion.button
                        key={section?.id}
                        variants={itemVariants}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveSection(section?.id)}
                        className={`w-full group flex items-center space-x-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 relative overflow-hidden ${activeSection === section?.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'glass border-transparent hover:border-primary/20 hover:bg-primary/5 text-foreground'
                          }`}
                      >
                        {activeSection === section?.id && (
                          <motion.div
                            layoutId="active-nav-bg"
                            className="absolute inset-0 bg-primary z-0"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <div className="relative z-10 flex items-center space-x-3 w-full">
                          <Icon name={section?.icon} size={18} className={activeSection === section?.id ? 'text-white' : 'text-primary/80 group-hover:text-primary'} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium tracking-tight">{section?.label}</p>
                            <p className={`text-xs truncate ${activeSection === section?.id ? 'text-white/80' : 'text-muted-foreground opacity-80'}`}>
                              {section?.description}
                            </p>
                          </div>
                        </div>
                        {section?.id === 'updates' && hasUnseenUpdate && (
                          <span className="absolute top-[10px] right-[10px] w-[6px] h-[6px] rounded-full bg-primary shadow-[0_0_6px_theme(colors.primary.DEFAULT)]" />
                        )}
                      </motion.button>
                    ))}
                  </nav>
                </div>
              </motion.div>

              {/* Mobile Section Selector */}
              <div className="lg:hidden mb-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="w-full glass-card p-4 flex items-center justify-between border-primary/20 bg-primary/5"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                      <Icon name={getCurrentSectionInfo()?.icon} size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">{getCurrentSectionInfo()?.label}</p>
                      <p className="text-xs text-muted-foreground">{getCurrentSectionInfo()?.description}</p>
                    </div>
                  </div>
                  <Icon name={isMobileMenuOpen ? "ChevronUp" : "ChevronDown"} size={20} className="text-primary" />
                </motion.button>

                <AnimatePresence>
                  {isMobileMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 glass-card p-2 overflow-hidden"
                    >
                      <nav className="space-y-1">
                        {settingSections?.map((section) => (
                          <button
                            key={section?.id}
                            onClick={() => {
                              setActiveSection(section?.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all ${activeSection === section?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'glass hover:bg-accent text-foreground'
                              }`}
                          >
                            <Icon name={section?.icon} size={18} />
                            <div>
                              <p className="text-sm font-medium">{section?.label}</p>
                              <p className={`text-xs ${activeSection === section?.id ? 'text-white/80' : 'text-muted-foreground opacity-80'}`}>{section?.description}</p>
                            </div>
                          </button>
                        ))}
                      </nav>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3 space-y-6">
                {/* Active Section Info Bar */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={`header-${activeSection}`}
                  className="glass-card p-6 border-l-4 border-primary group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <Icon name={getCurrentSectionInfo()?.icon} size={120} />
                  </div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                      <Icon name={getCurrentSectionInfo()?.icon} size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight">{getCurrentSectionInfo()?.label}</h2>
                      <p className="text-xs text-muted-foreground">{getCurrentSectionInfo()?.description}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Content Fragment */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ y: 30, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -30, opacity: 0, scale: 0.98 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    {renderActiveSection()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <footer className="bg-card/30 bg-gradient-to-b from-black/5 to-slate-200/50 dark:from-white/5 dark:to-background backdrop-blur-xl border border-black/5 dark:border-white/5 py-12 rounded-[2.5rem] mb-12">
            <div className="px-6 md:px-10">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
              {/* Brand Signal */}
              <div className="space-y-6 max-w-sm">
                <div
                  className="flex items-center space-x-3 group cursor-pointer"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center w-12 h-14 relative z-10 drop-shadow-md"
                  >
                    <img src="/assets/images/logo.webp" alt="YT-Deluxe" className="w-full h-full object-contain" />
                  </motion.div>
                  <div className="text-left">
                    <h3 className="text-xl allan-bold text-foreground leading-none tracking-tight">YT-Deluxe</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t('footer.premiumMedia')}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('footer.footerDesc')}
                </p>

                <div className="flex items-center space-x-3">
                  {[
                    { type: 'icon', name: 'Github', url: 'https://github.com/Utsavstack' },
                    { type: 'icon', name: 'Linkedin', url: 'https://linkedin.com/in/utsavparmar-full-stack-dev' },
                    { type: 'svg', content: <svg className="w-[16px] h-[16px]" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z"/></svg>, url: 'https://x.com/iutsavparmar' },
                    { type: 'icon', name: 'Instagram', url: 'https://instagram.com/_its_me_utsav_' }
                  ].map((social, idx) => (
                    <motion.a
                      key={idx}
                      whileHover={{ y: -3, backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 border border-transparent hover:border-primary/20"
                    >
                      {social.type === 'icon' ? <Icon name={social.name} size={18} /> : social.content}
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Navigation Map */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-left w-full lg:w-auto flex-1 lg:ml-12">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground tracking-wider opacity-70">Product</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><button onClick={() => setActiveSection('about')} className="hover:text-primary transition-colors flex items-center group">About YT Deluxe <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><a href="https://github.com/Utsavstack/YT-Deluxe/tree/main/docs" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center group">Documentation <Icon name="ExternalLink" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></a></li>
                    <li><a href="https://github.com/Utsavstack/YT-Deluxe/releases" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center group">Releases <Icon name="ExternalLink" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></a></li>
                    <li><button onClick={() => setActiveSection('updates')} className="hover:text-primary transition-colors flex items-center group">Changelog <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => setActiveSection('updates')} className="hover:text-primary transition-colors flex items-center group">FAQ <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => setActiveSection('report')} className="hover:text-primary transition-colors flex items-center group">Report a Bug <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => { setActiveSection('about'); setTimeout(() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-primary transition-colors flex items-center group">Features <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground tracking-wider opacity-70">Resources</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><a href="https://github.com/Utsavstack/YT-Deluxe" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center group">Source Code <Icon name="ExternalLink" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></a></li>
                    <li><a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center group">yt-dlp <Icon name="ExternalLink" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></a></li>
                    <li><a href="https://ffmpeg.org/" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center group">FFmpeg <Icon name="ExternalLink" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></a></li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground tracking-wider opacity-70">Legal</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><button onClick={() => setActiveSection('privacy')} className="hover:text-primary transition-colors flex items-center group">Privacy Policy <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => setActiveSection('terms')} className="hover:text-primary transition-colors flex items-center group">Terms & Conditions <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => setActiveSection('license')} className="hover:text-primary transition-colors flex items-center group">License <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => setActiveSection('license')} className="hover:text-primary transition-colors flex items-center group">Disclaimer <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-border/40 flex flex-col gap-6">

              <div className="flex flex-col lg:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center font-medium">
                  <span>&copy; 2026 YT Deluxe &bull; Utsav Parmar</span>
                </div>
                  
                <div className="flex items-center justify-center">
                  <span className="px-3 py-1 rounded-xl bg-slate-200/70 dark:bg-zinc-800 border border-slate-300/80 dark:border-white/10 text-[10px] font-black tracking-widest text-slate-700 dark:text-slate-300 shadow-sm">
                    {APP_VERSION}
                  </span>
                </div>

                <div className="flex items-center space-x-6 font-semibold">
                  <button onClick={() => setActiveSection('privacy')} className="flex items-center hover:text-primary transition-colors">
                    {t('nav.privacy')}
                  </button>
                  <button onClick={() => setActiveSection('terms')} className="flex items-center hover:text-primary transition-colors">
                    {t('nav.terms')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
};

// ─── Permissions Panel ────────────────────────────────────────────────────────
// Shown in Settings > App Permissions — lets users view and reset stored grants.
const PermissionsPanel = () => {
  const [grants, setGrants] = useState({});
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);

  // Detect if we are running inside the pywebview desktop shell.
  // In desktop mode clipboard is handled via the PowerShell bridge — no native
  // OS permission is ever requested, so the badge says "System Managed".
  const isDesktop = typeof window !== 'undefined' && !!window.pywebview?.api;

  const loadGrants = async () => {
    setLoading(true);
    const g = await getAllPermissions();
    setGrants(g || {});
    setLoading(false);
  };

  useEffect(() => { loadGrants(); }, []);

  const handleReset = async (key) => {
    setResetting(key);
    await resetPermission(key);
    await loadGrants();
    setResetting(null);
  };

  const handleResetAll = async () => {
    setResetting('all');
    await resetAllPermissions();
    await loadGrants();
    setResetting(null);
  };

  const STATUS_STYLE = {
    granted: { label: 'Allowed',    bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    denied:  { label: 'Denied',     bg: 'bg-red-500/10 text-red-500 border-red-500/20' },
    prompt:  { label: 'Not asked',  bg: 'bg-muted/60 text-muted-foreground border-border/40' },
    system:  { label: 'System',     bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  };

  const SYSTEM_MANAGED_KEYS = [PERMISSIONS.CLIPBOARD_READ, PERMISSIONS.CLIPBOARD_WRITE, PERMISSIONS.MICROPHONE];
  const allPermKeys = Object.values(PERMISSIONS);
  const hasAnyDecision = allPermKeys.some(k => grants[k] && grants[k] !== 'prompt');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header card */}
      <div className="glass-card p-6 border border-border/50 bg-card/90 dark:bg-card/30 shadow-glass-xl">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <Icon name="ShieldCheck" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">App Permissions</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your choices are stored locally and can be reset at any time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh button */}
            <button
              onClick={loadGrants}
              disabled={loading}
              title="Refresh permission states"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all disabled:opacity-40"
            >
              <Icon name={loading ? 'Loader2' : 'RefreshCw'} size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            {hasAnyDecision && (
              <button
                onClick={handleResetAll}
                disabled={resetting === 'all'}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                {resetting === 'all' ? 'Resetting...' : 'Reset All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Permission rows */}
      <div className="glass-card p-4 border border-border/50 bg-card/90 dark:bg-card/30 shadow-glass-xl space-y-2">
        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          allPermKeys.map((key) => {
            const meta   = PERMISSION_META[key] || { icon: 'Shield', title: key, reason: '' };
            const rawState = grants[key] || 'prompt';
            // Clipboard + Microphone in desktop mode are system-managed (no OS dialog ever fires)
            const isSystemManaged = isDesktop && SYSTEM_MANAGED_KEYS.includes(key) && rawState === 'granted';
            const displayState = isSystemManaged ? 'system' : rawState;
            const status = STATUS_STYLE[displayState] || STATUS_STYLE.prompt;
            const isResetting = resetting === key;

            return (
              <motion.div
                key={key}
                layout
                className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 dark:bg-white/[0.02] border border-border/30 hover:border-border/60 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon name={meta.icon} size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{meta.title}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                    {isSystemManaged ? 'Handled via system bridge no OS permission required' : meta.reason}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${status.bg}`}>
                    {status.label}
                  </span>
                  {/* Show reset for: decided user perms, OR any system-managed perm (user can revoke) */}
                  {((!isSystemManaged && rawState !== 'prompt') || isSystemManaged) && (
                    <button
                      onClick={() => handleReset(key)}
                      disabled={isResetting}
                      title="Reset will ask again next time"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-40"
                    >
                      <Icon name={isResetting ? 'Loader2' : 'RotateCcw'} size={13} className={isResetting ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}

        {!loading && !hasAnyDecision && !isDesktop && (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-center mx-auto mb-3">
              <Icon name="ShieldCheck" size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">No permissions asked yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">When YT Deluxe requests access, it will appear here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UserSettingsPreferences;
