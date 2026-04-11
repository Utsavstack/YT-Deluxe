import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const LanguageSettings = ({ currentLanguage, onLanguageChange, settings, onSettingsChange }) => {
  const { t, i18n } = useTranslation();
  const [languageSettings, setLanguageSettings] = useState(settings);

  const languages = [
    { value: 'en', label: 'English', nativeName: 'English', flag: 'gb' },
    { value: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: 'in', hasHinglish: true },
    { value: 'de', label: 'German', nativeName: 'Deutsch', flag: 'de' },
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: 'US format' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: 'European format' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', description: 'ISO format' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY', description: 'Long format' }
  ];

  const timeFormatOptions = [
    { value: '12h', label: '12-hour (AM/PM)', description: '3:30 PM' },
    { value: '24h', label: '24-hour', description: '15:30' }
  ];

  const numberFormatOptions = [
    { value: 'en-US', label: '1,234.56', description: 'US format' },
    { value: 'de-DE', label: '1.234,56', description: 'German format' },
    { value: 'en-IN', label: '1,23,456.78', description: 'Indian format' }
  ];

  const handleLanguageChange = (languageCode) => {
    onLanguageChange(languageCode);
    i18n.changeLanguage(languageCode);
    localStorage.setItem('ytdeluxe_language', languageCode);
  };

  const isHindiFamily = (lang) => lang === 'hi' || lang === 'hg';

  const getCurrentLanguage = () => {
    if (currentLanguage === 'hg') {
      const hiBase = languages.find(l => l.value === 'hi');
      return { ...hiBase, label: 'Hinglish', nativeName: 'हिन्दी (Hinglish)', value: 'hg' };
    }
    return languages?.find(lang => lang?.value === currentLanguage) || languages?.[0];
  };

  const handleSettingChange = (key, value) => {
    const updated = { ...languageSettings, [key]: value };
    setLanguageSettings(updated);
    onSettingsChange(updated);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Language Selection */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-6 border-b border-border/40 pb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon name="Globe" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{t('language.interfaceLang')}</h3>
            <p className="text-[11px] text-muted-foreground font-medium">{t('language.interfaceLangDesc')}</p>
          </div>
        </div>

        {/* Current Language Display */}
        <motion.div
          className="mb-8 p-5 glass rounded-2xl border border-primary/20 bg-primary/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Icon name="Globe" size={100} />
          </div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-16 h-12 rounded-xl bg-primary/10 p-0.5 overflow-hidden border border-primary/20 flex items-center justify-center shadow-lg">
              <img
                src={`https://flagcdn.com/w80/${getCurrentLanguage()?.flag}.png`}
                alt={getCurrentLanguage()?.label}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-bold text-foreground">
                  {getCurrentLanguage()?.nativeName}
                </h4>
                {/* Active Ping Badge */}
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {getCurrentLanguage()?.label}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {languages?.map((language, index) => {
              const isActive = language.value === currentLanguage || (language.hasHinglish && isHindiFamily(currentLanguage));

              return (
                <motion.div
                  key={language?.value}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex flex-col p-4 rounded-xl border transition-all duration-300 relative ${isActive
                    ? 'bg-primary/5 text-foreground border-primary shadow-glass-md z-10'
                    : 'glass border-border/50 hover:border-primary/30'
                    }`}
                >
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-8 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
                      <img
                        src={`https://flagcdn.com/w80/${language.flag}.png`}
                        alt={language.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => handleLanguageChange(language.value)}>
                      <h4 className="text-sm font-bold truncate">
                        {language.nativeName}
                      </h4>
                      <p className={`text-[10px] truncate ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {language.label}
                      </p>
                    </div>
                    {isActive && !language.hasHinglish && (
                      <div className="bg-primary p-1 rounded-full text-primary-foreground text-xs flex items-center justify-center w-5 h-5 ml-auto">
                        <Icon name="Check" size={14} />
                      </div>
                    )}
                  </div>

                  {/* Hindi/Hinglish Toggle */}
                  {language.hasHinglish && isActive && (
                    <div className="mt-2 pt-3 border-t border-primary/20 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Switch Mode:</span>
                      <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLanguageChange('hi');
                          }}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currentLanguage === 'hi' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
                        >
                          Pure
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLanguageChange('hg');
                          }}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currentLanguage === 'hg' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
                        >
                          Hinglish
                        </button>
                      </div>
                    </div>
                  )}

                  {!isActive && (
                    <button
                      className="absolute inset-0 z-0"
                      onClick={() => handleLanguageChange(language.value)}
                      aria-label={`Select ${language.label}`}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Regional Settings */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 group hover:shadow-glass transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6 border-b border-border/40 pb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon name="MapPin" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{t('language.regional')}</h3>
            <p className="text-[11px] text-muted-foreground font-medium">{t('language.regionalDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <Select
            label={t('language.dateFormat')}
            options={dateFormatOptions}
            value={languageSettings?.dateFormat}
            onChange={(value) => handleSettingChange('dateFormat', value)}
          />
          <Select
            label={t('language.timeFormat')}
            options={timeFormatOptions}
            value={languageSettings?.timeFormat}
            onChange={(value) => handleSettingChange('timeFormat', value)}
          />
          <Select
            label={t('language.numberFormat')}
            options={numberFormatOptions}
            value={languageSettings?.numberFormat}
            onChange={(value) => handleSettingChange('numberFormat', value)}
          />
          <div className="flex items-center space-x-4 pt-4">
            <Checkbox
              label={t('language.useSystemLocale')}
              description={t('language.syncOS')}
              checked={languageSettings?.useSystemLocale}
              onChange={(e) => handleSettingChange('useSystemLocale', e?.target?.checked)}
            />
          </div>
        </div>
      </motion.div>

      {/* Translation Settings */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 group hover:shadow-glass transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6 border-b border-border/40 pb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon name="Languages" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{t('language.translation')}</h3>
            <p className="text-[11px] text-muted-foreground font-medium">{t('language.translationDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Checkbox
            label={t('language.autoTranslateTitles')}
            description={t('language.autoTranslateTitlesDesc')}
            checked={languageSettings?.autoTranslateTitles}
            onChange={(e) => handleSettingChange('autoTranslateTitles', e?.target?.checked)}
          />
          <Checkbox
            label={t('language.autoTranslateDesc')}
            description={t('language.autoTranslateDescDesc')}
            checked={languageSettings?.autoTranslateDescriptions}
            onChange={(e) => handleSettingChange('autoTranslateDescriptions', e?.target?.checked)}
          />
          <Checkbox
            label={t('language.showOriginal')}
            description={t('language.showOriginalDesc')}
            checked={languageSettings?.showOriginalText}
            onChange={(e) => handleSettingChange('showOriginalText', e?.target?.checked)}
          />
          <Checkbox
            label={t('language.preferSubs')}
            description={t('language.preferSubsDesc')}
            checked={languageSettings?.preferSubtitlesInLanguage}
            onChange={(e) => handleSettingChange('preferSubtitlesInLanguage', e?.target?.checked)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LanguageSettings;