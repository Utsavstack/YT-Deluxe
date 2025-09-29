import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Header from '../../components/ui/Header';
import ProgressNotification from '../../components/ui/ProgressNotification';
import ThemeCustomization from './components/ThemeCustomization';
import DownloadPreferences from './components/DownloadPreferences';
import NotificationSettings from './components/NotificationSettings';
import LanguageSettings from './components/LanguageSettings';
import AdvancedSettings from './components/AdvancedSettings';
import AccountManagement from './components/AccountManagement';

const UserSettingsPreferences = () => {
  const [activeSection, setActiveSection] = useState('theme');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [currentAccentColor, setCurrentAccentColor] = useState('#2C5DA9');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock user data
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    joinDate: '2024-01-15',
    subscription: 'free',
    downloadCount: 1247,
    totalSize: '15.6 GB',
    favoriteChannels: 23
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

  const [notificationSettings, setNotificationSettings] = useState({
    browserNotifications: true,
    downloadComplete: true,
    downloadError: true,
    batchProgress: true,
    storageWarnings: true,
    soundEnabled: true,
    soundType: 'default',
    volume: 50,
    soundOnComplete: true,
    soundOnError: true,
    position: 'top-right',
    autoDismissTime: 5,
    showProgress: true,
    persistentErrors: true,
    successAnimations: true,
    systemTray: false,
    emailNotifications: false,
    emailAddress: '',
    dailySummary: false,
    weeklyReport: false,
    batchCompletion: true,
    maintenanceAlerts: true
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

  const [advancedSettings, setAdvancedSettings] = useState({
    clipboardMonitoring: true,
    autoPasteDetection: true,
    clipboardNotifications: true,
    proxyType: 'none',
    proxyHost: '',
    proxyPort: '',
    proxyUsername: '',
    proxyPassword: '',
    userAgent: 'YT Deluxe/1.0.0',
    enableLogging: true,
    logLevel: 'info',
    maxLogSize: 10,
    enableAnalytics: true,
    crashReporting: true,
    betaFeatures: false,
    developerMode: false,
    apiTimeout: 30,
    retryAttempts: 3,
    cacheSize: 100,
    hardwareAcceleration: true,
    preloadMetadata: true,
    anonymousReporting: true
  });

  const settingSections = [
    {
      id: 'theme',
      label: 'Theme',
      icon: 'Palette',
      description: 'Appearance and colors'
    },
    {
      id: 'downloads',
      label: 'Downloads',
      icon: 'Download',
      description: 'Download preferences'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'Bell',
      description: 'Alert settings'
    },
    {
      id: 'language',
      label: 'Language',
      icon: 'Globe',
      description: 'Language and region'
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: 'Settings',
      description: 'Advanced options'
    },
    {
      id: 'account',
      label: 'Account',
      icon: 'User',
      description: 'Profile and privacy'
    }
  ];

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('ytdeluxe_language');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem('ytdeluxe_theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }

    // Load saved accent color
    const savedAccentColor = localStorage.getItem('ytdeluxe_accent_color');
    if (savedAccentColor) {
      setCurrentAccentColor(savedAccentColor);
    }
  }, []);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('ytdeluxe_theme', theme);
    // Apply theme changes to document
    document.documentElement?.setAttribute('data-theme', theme);
  };

  const handleAccentColorChange = (color) => {
    setCurrentAccentColor(color);
    localStorage.setItem('ytdeluxe_accent_color', color);
    // Apply accent color changes
    document.documentElement?.style?.setProperty('--color-primary', color);
  };

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('ytdeluxe_language', language);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'theme':
        return (
          <ThemeCustomization
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            currentAccentColor={currentAccentColor}
            onAccentColorChange={handleAccentColorChange}
          />
        );
      case 'downloads':
        return (
          <DownloadPreferences
            preferences={downloadPreferences}
            onPreferencesChange={setDownloadPreferences}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            settings={notificationSettings}
            onSettingsChange={setNotificationSettings}
          />
        );
      case 'language':
        return (
          <LanguageSettings
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            settings={languageSettings}
            onSettingsChange={setLanguageSettings}
          />
        );
      case 'advanced':
        return (
          <AdvancedSettings
            settings={advancedSettings}
            onSettingsChange={setAdvancedSettings}
          />
        );
      case 'account':
        return (
          <AccountManagement
            user={user}
            onUserUpdate={setUser}
          />
        );
      default:
        return null;
    }
  };

  const getCurrentSectionInfo = () => {
    return settingSections?.find(section => section?.id === activeSection) || settingSections?.[0];
  };

  return (
    <>
      <Helmet>
        <title>Settings & Preferences - YT Deluxe</title>
        <meta name="description" content="Customize your YT Deluxe experience with theme options, download preferences, notifications, and advanced settings." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <ProgressNotification />

        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-glass-md">
                  <Icon name="Settings" size={20} color="white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings & Preferences</h1>
                  <p className="text-muted-foreground">Customize your YT Deluxe experience</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Desktop Sidebar */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="glass-card p-4 sticky top-24">
                  <nav className="space-y-1">
                    {settingSections?.map((section) => (
                      <button
                        key={section?.id}
                        onClick={() => setActiveSection(section?.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all spring-smooth ${
                          activeSection === section?.id
                            ? 'bg-primary text-primary-foreground shadow-glass-sm'
                            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Icon name={section?.icon} size={18} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{section?.label}</p>
                          <p className="text-xs opacity-80 truncate">{section?.description}</p>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Mobile Section Selector */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="w-full glass-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Icon name={getCurrentSectionInfo()?.icon} size={20} />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{getCurrentSectionInfo()?.label}</p>
                      <p className="text-sm text-muted-foreground">{getCurrentSectionInfo()?.description}</p>
                    </div>
                  </div>
                  <Icon name={isMobileMenuOpen ? "ChevronUp" : "ChevronDown"} size={20} />
                </button>

                {isMobileMenuOpen && (
                  <div className="mt-2 glass-card p-2">
                    <nav className="space-y-1">
                      {settingSections?.map((section) => (
                        <button
                          key={section?.id}
                          onClick={() => {
                            setActiveSection(section?.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all spring-smooth ${
                            activeSection === section?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          <Icon name={section?.icon} size={16} />
                          <div>
                            <p className="text-sm font-medium">{section?.label}</p>
                            <p className="text-xs opacity-80">{section?.description}</p>
                          </div>
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  {/* Section Header */}
                  <div className="glass-card p-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                        <Icon name={getCurrentSectionInfo()?.icon} size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{getCurrentSectionInfo()?.label}</h2>
                        <p className="text-muted-foreground">{getCurrentSectionInfo()?.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Content */}
                  {renderActiveSection()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-card border-t border-border mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary">
                  <Icon name="Play" size={16} color="white" />
                </div>
                <span className="text-lg font-semibold text-foreground">YT Deluxe</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date()?.getFullYear()} YT Deluxe. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default UserSettingsPreferences;