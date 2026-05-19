import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { YTDeluxeStorage, STORAGE_KEYS } from '../../../utils/storage';

const LanguageSettings = ({ currentLanguage, onLanguageChange, settings, onSettingsChange }) => {
  const { t, i18n } = useTranslation();
  const [languageSettings, setLanguageSettings] = useState(settings || {});

  useEffect(() => {
    if (settings) {
      setLanguageSettings(settings);
    }
  }, [settings]);

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
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">
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

              if (language.hasHinglish) {
                const isPureActive = currentLanguage === 'hi';
                const isHinglishActive = currentLanguage === 'hg';

                return (
                  <motion.div
                    key={language?.value}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex flex-col rounded-2xl border transition-all duration-300 relative ${isActive
                      ? 'bg-primary/10 border-primary shadow-glass-md z-10'
                      : 'glass border-border/50 hover:border-primary/30 hover:bg-primary/5'
                      }`}
                  >
                    <div className="flex h-full min-h-[120px]">
                      {/* Pure Hindi Side */}
                      <button
                        onClick={() => handleLanguageChange('hi')}
                        className={`flex-1 p-4 flex flex-col items-center justify-center transition-all hover:bg-primary/5 group/pure relative`}
                      >
                        <div className={`w-12 h-8 rounded-lg overflow-hidden border border-border/30 mb-2 shadow-sm transition-all duration-300 ${isPureActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg' : 'group-hover/pure:scale-105 opacity-60'}`}>
                          <img src={`https://flagcdn.com/w80/${language.flag}.png`} alt="Hindi" className="w-full h-full object-cover" />
                        </div>
                        <h4 className={`text-[11px] font-black tracking-tight transition-colors ${isPureActive ? 'text-primary' : 'text-muted-foreground group-hover/pure:text-foreground'}`}>Pure हिन्दी</h4>
                        {isPureActive && (
                          <div className="absolute top-2 right-2 bg-primary p-0.5 rounded-full text-primary-foreground">
                            <Icon name="Check" size={10} />
                          </div>
                        )}
                      </button>

                      <div className="w-[1.4px] bg-slate-400 dark:bg-white/40 self-stretch" />

                      {/* Hinglish Side */}
                      <button
                        onClick={() => handleLanguageChange('hg')}
                        className={`flex-1 p-4 flex flex-col items-center justify-center transition-all hover:bg-primary/5 group/hg relative`}
                      >
                        <div className={`w-12 h-8 rounded-lg overflow-hidden border border-border/30 mb-2 shadow-sm transition-all duration-300 ${isHinglishActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg' : 'group-hover/hg:scale-105 opacity-60'}`}>
                          <img src={`https://flagcdn.com/w80/${language.flag}.png`} alt="Hinglish" className="w-full h-full object-cover grayscale-[0.4]" />
                        </div>
                        <h4 className={`text-[11px] font-black tracking-tight transition-colors ${isHinglishActive ? 'text-primary' : 'text-muted-foreground group-hover/hg:text-foreground'}`}>Hinglish</h4>
                        {isHinglishActive && (
                          <div className="absolute top-2 right-2 bg-primary p-0.5 rounded-full text-primary-foreground">
                            <Icon name="Check" size={10} />
                          </div>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={language?.value}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isActive && handleLanguageChange(language.value)}
                  className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer min-h-[120px] justify-center ${isActive
                    ? 'bg-primary/10 text-foreground border-primary shadow-glass-md z-10'
                    : 'glass border-border/50 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-9 rounded-xl overflow-hidden border border-border/30 flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
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
                    {isActive && (
                      <div className="bg-primary p-1 rounded-full text-primary-foreground flex items-center justify-center w-6 h-6 ml-auto shadow-lg">
                        <Icon name="Check" size={14} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Regional Settings */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-6 md:p-8 group hover:shadow-glass-sm transition-all duration-500 border-primary/5 relative z-20"
      >
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
            value={languageSettings?.dateFormat || 'DD/MM/YYYY'}
            onChange={(value) => handleSettingChange('dateFormat', value)}
          />
          <Select
            label={t('language.timeFormat')}
            options={timeFormatOptions}
            value={languageSettings?.timeFormat || '12h'}
            onChange={(value) => handleSettingChange('timeFormat', value)}
          />
          <Select
            label={t('language.numberFormat')}
            options={numberFormatOptions}
            value={languageSettings?.numberFormat || 'en-US'}
            onChange={(value) => handleSettingChange('numberFormat', value)}
          />
          <div className="flex items-center space-x-4 pt-4">
            <Checkbox
              label={t('language.useSystemLocale')}
              description={t('language.syncOS')}
              checked={!!languageSettings?.useSystemLocale}
              onChange={(e) => handleSettingChange('useSystemLocale', e?.target?.checked ?? e)}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-8 pt-6 border-t border-border/40">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Live Preview</p>
          <div className="flex flex-wrap gap-3">
            {[
              {
                label: 'Date',
                value: (() => {
                  const now = new Date();
                  const fmt = languageSettings?.dateFormat || 'DD/MM/YYYY';
                  const d = String(now.getDate()).padStart(2, '0');
                  const m = String(now.getMonth() + 1).padStart(2, '0');
                  const y = now.getFullYear();
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  if (fmt === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
                  if (fmt === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
                  if (fmt === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
                  if (fmt === 'DD MMM YYYY') return `${d} ${months[now.getMonth()]} ${y}`;
                  return `${m}/${d}/${y}`;
                })()
              },
              {
                label: 'Time',
                value: (() => {
                  const now = new Date();
                  if ((languageSettings?.timeFormat || '12h') === '24h') {
                    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                  }
                  const h = now.getHours();
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  const h12 = h % 12 || 12;
                  return `${h12}:${String(now.getMinutes()).padStart(2,'0')} ${ampm}`;
                })()
              },
              {
                label: 'Number',
                value: (1234567.89).toLocaleString(languageSettings?.numberFormat || 'en-US')
              }
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className="text-sm font-bold text-foreground font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default LanguageSettings;