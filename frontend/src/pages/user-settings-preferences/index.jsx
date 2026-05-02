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
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';

import { useTheme } from '../../utils/ThemeContext';

const UserSettingsPreferences = () => {
  const { t, i18n } = useTranslation();
  const { theme: currentTheme, setTheme: onThemeChange, accentColor: currentAccentColor, setAccentColor: handleAccentColorChange } = useTheme();
  const [activeSection, setActiveSection] = useState('account');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock user data
  const [user, setUser] = useState({
    name: 'User',
    avatar: '',
    caption: "Hey I'm using YT Deluxe",
  });

  // Mock settings states
  const [downloadPreferences, setDownloadPreferences] = useState({
    defaultVideoQuality: '1080p',
    defaultVideoFormat: 'mp4',
    defaultAudioFormat: 'mp3',
    autoSelectBestQuality: true,
    namingConvention: 'title',
    customTemplate: '{channel} - {title} [{quality}]',
    removeSpecialChars: true,
    addDownloadDate: false,
    downloadPath: '/Users/username/Downloads',
    createChannelFolders: true,
    createDateFolders: false,
    maxConcurrentDownloads: 3,
    speedLimit: 0,
    resumeDownloads: true,
    verifyIntegrity: true,
    autoRetry: true,
    deleteAfterConversion: false
  });

  const [languageSettings, setLanguageSettings] = useState({
    dateFormat: 'MM/DD/YYYY',
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
  });


  const settingSections = [
    { id: 'account', label: t('nav.myProfile'), icon: 'User', description: t('nav.profileDesc') },
    { id: 'theme', label: t('nav.theme'), icon: 'Palette', description: t('nav.themeDesc') },
    { id: 'downloads', label: t('nav.downloads'), icon: 'Download', description: t('nav.downloadsDesc') },
    { id: 'language', label: t('nav.language'), icon: 'Globe', description: t('nav.languageDesc') },
    { id: 'about', label: t('nav.about'), icon: 'Info', description: t('nav.aboutDesc') },
    { id: 'privacy', label: t('nav.privacy'), icon: 'Shield', description: t('nav.privacyDesc') },
    { id: 'terms', label: t('nav.terms'), icon: 'FileText', description: t('nav.termsDesc') }
  ];

  useEffect(() => {
    const savedLanguage = localStorage.getItem('ytdeluxe_language');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
  }, []);

  const handleThemeChange = (newTheme) => onThemeChange(newTheme);

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('ytdeluxe_language', language);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'theme':
        return <ThemeCustomization currentTheme={currentTheme} onThemeChange={handleThemeChange} currentAccentColor={currentAccentColor} onAccentColorChange={handleAccentColorChange} />;
      case 'downloads':
        return <DownloadPreferences preferences={downloadPreferences} onPreferencesChange={setDownloadPreferences} />;
      case 'language':
        return <LanguageSettings currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} settings={languageSettings} onSettingsChange={setLanguageSettings} />;
      case 'account':
        return <AccountManagement user={user} onUserUpdate={setUser} />;
      case 'about':
        return <AboutYTDeluxe />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsAndConditions />;
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-glass-md">
                  <Icon name="Settings2" size={20} />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{t('settings.title')}</h1>
                  <p className="text-xs text-muted-foreground">{t('settings.subtitle')}</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Desktop Sidebar */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={sidebarVariants}
                className="hidden lg:block lg:col-span-1"
              >
                <div className="glass-card p-3 sticky top-28 space-y-4">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground opacity-70">
                    {t('settings.configMap')}
                  </div>
                  <nav className="space-y-1">
                    {settingSections?.map((section) => (
                      <motion.button
                        key={section?.id}
                        variants={itemVariants}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveSection(section?.id)}
                        className={`w-full group flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-300 relative overflow-hidden ${activeSection === section?.id
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

        <footer className="bg-card/30 backdrop-blur-xl border-t border-border mt-16 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    { icon: 'Github', url: 'https://github.com/Utsavstack' },
                    { icon: 'Linkedin', url: 'https://www.linkedin.com/in/utsavparmar-full-stack-dev' }
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
                      <Icon name={social.icon} size={18} />
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Navigation Map */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-left w-full lg:w-auto flex-1 lg:ml-12">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground tracking-wider opacity-70">{t('footer.system')}</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><button onClick={() => setActiveSection('account')} className="hover:text-primary transition-colors flex items-center group">{t('footer.profile')} <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => setActiveSection('theme')} className="hover:text-primary transition-colors flex items-center group">{t('footer.appearance')} <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => setActiveSection('downloads')} className="hover:text-primary transition-colors flex items-center group">{t('footer.engine')} <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground tracking-wider opacity-70">{t('footer.security')}</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><button onClick={() => setActiveSection('privacy')} className="hover:text-primary transition-colors flex items-center group">{t('footer.privacyHub')} <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><button onClick={() => setActiveSection('terms')} className="hover:text-primary transition-colors flex items-center group">{t('footer.eula')} <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground tracking-wider opacity-70">{t('footer.aboutSection')}</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><button onClick={() => setActiveSection('about')} className="hover:text-primary transition-colors flex items-center group">{t('footer.history')} <Icon name="ChevronRight" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></button></li>
                    <li><a href="https://github.com/Utsavstack/YT-Deluxe" className="hover:text-primary transition-colors flex items-center group">{t('footer.repository')} <Icon name="ExternalLink" size={12} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" /></a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-border/40 flex flex-col gap-6">

              <div className="flex flex-col lg:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center font-medium">
                  <span>&copy; 2026 YT Deluxe &bull; Utsav Parmar</span>
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
    </>
  );
};

export default UserSettingsPreferences;
