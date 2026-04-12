import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { YTDeluxeStorage, STORAGE_KEYS } from '../../../utils/storage';

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

  const handleLanguageChange = async (languageCode) => {
    onLanguageChange(languageCode);
    i18n.changeLanguage(languageCode);
    // Platform-aware sync
    await YTDeluxeStorage.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
  };

  const isHindiFamily = (lang) => lang === 'hi' || lang === 'hg';

  const getCurrentLanguage = () => {
    if (currentLanguage === 'hg') {
      const hiBase = languages.find(l => l.value === 'hi');
      return { ...hiBase, label: 'Hinglish', nativeName: 'हिन्दी (Hinglish)', value: 'hg' };
    }
    return languages?.find(lang => lang?.value === currentLanguage) || languages?.[0];
  };

  const handleSettingChange = async (key, value) => {
    const updated = { ...languageSettings, [key]: value };
    setLanguageSettings(updated);
    onSettingsChange(updated);
    // Platform-aware sync
    await YTDeluxeStorage.setItem(STORAGE_KEYS.LANGUAGE_SETTINGS, updated);
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
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Icon name="Globe" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{t('language.interfaceLang')}</h3>
            <p className="text-[11px] text-muted-foreground font-medium">{t('language.interfaceLangDesc')}</p>
          </div>
        </div>

        {/* Current Language Display */}
        <motion.div
          className="mb-8 p-6 glass rounded-2xl border border-primary/20 bg-primary/5 relative overflow-hidden group shadow-inner"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 text-primary">
            <Icon name="Globe" size={120} />
          </div>
          <div className="flex items-center space-x-5 relative z-10">
            <div className="w-20 h-14 rounded-2xl bg-primary/10 p-0.5 overflow-hidden border border-primary/20 flex items-center justify-center shadow-glass-sm">
              <img
                src={`https://flagcdn.com/w160/${getCurrentLanguage()?.flag}.png`}
                alt={getCurrentLanguage()?.label}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-xl font-black text-foreground tracking-tight">
                  {getCurrentLanguage()?.nativeName}
                </h4>
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.1em]">Active</span>
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {getCurrentLanguage()?.label} Edition
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
                  onClick={() => !isActive && handleLanguageChange(language.value)}
                  className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer ${isActive
                    ? 'bg-primary/10 text-foreground border-primary shadow-glass-md z-10'
                    : 'glass border-border/50 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-9 rounded-xl overflow-hidden border border-border/30 flex-shrink-0 shadow-sm">
                      <img
                        src={`https://flagcdn.com/w80/${language.flag}.png`}
                        alt={language.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-black tracking-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {language.nativeName}
                      </h4>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary/70' : 'text-muted-foreground'}`}>
                        {language.label}
                      </p>
                    </div>
                    {isActive && !language.hasHinglish && (
                      <div className="bg-primary p-1 rounded-full text-primary-foreground flex items-center justify-center w-6 h-6 ml-auto shadow-lg">
                        <Icon name="Check" size={14} />
                      </div>
                    )}
                  </div>

                  {/* Hindi/Hinglish Toggle */}
                  {language.hasHinglish && isActive && (
                    <div className="mt-2 pt-4 border-t border-primary/20 flex items-center justify-between">
                      <span className="text-[9px] font-black text-muted-foreground uppercase opacity-70 tracking-tighter">Variant:</span>
                      <div className="flex bg-muted/40 p-1 rounded-xl border border-border/30 shadow-inner">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLanguageChange('hi');
                          }}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${currentLanguage === 'hi' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                          Pure
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLanguageChange('hg');
                          }}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${currentLanguage === 'hg' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                          Hinglish
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Regional Settings */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 group hover:shadow-glass-sm transition-all duration-500 border-primary/5">
        <div className="flex items-center space-x-3 mb-6 border-b border-border/40 pb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Icon name="MapPin" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{t('language.regional')}</h3>
            <p className="text-[11px] text-muted-foreground font-medium">{t('language.regionalDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
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
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 group hover:shadow-glass-sm transition-all duration-500 border-primary/5">
        <div className="flex items-center space-x-3 mb-6 border-b border-border/40 pb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Icon name="Languages" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{t('language.translation')}</h3>
            <p className="text-[11px] text-muted-foreground font-medium">{t('language.translationDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
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