import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';


const ThemeCustomization = ({ currentTheme, onThemeChange, currentAccentColor, onAccentColorChange }) => {
  const { t } = useTranslation();
  const defaultAccentColor = '#2C5DA9';
  const [selectedAccentColor, setSelectedAccentColor] = useState(currentAccentColor);
  const [recentAccentColors, setRecentAccentColors] = useState(() => {
    const saved = localStorage.getItem('ytdeluxe_recent_accents');
    return saved ? JSON.parse(saved) : [];
  });

  const accentColors = [
    { name: 'Blue', value: '#2c49a9', class: 'bg-blue-600' },
    { name: 'Purple', value: '#7C3AED', class: 'bg-purple-600' },
    { name: 'Green', value: '#059669', class: 'bg-emerald-600' },
    { name: 'Orange', value: '#EA580C', class: 'bg-orange-600' },
    { name: 'Pink', value: '#DB2777', class: 'bg-pink-600' },
    { name: 'Teal', value: '#0D9488', class: 'bg-teal-600' },
    { name: 'Red', value: '#DC2626', class: 'bg-red-600' },
    { name: 'Indigo', value: '#4F46E5', class: 'bg-indigo-600' }
  ];

  const handleThemeSelect = (e, themeId) => {
    onThemeChange(themeId, e);
  };

  const handleAccentColorSelect = (color) => {
    setSelectedAccentColor(color);
    onAccentColorChange(color);

    setRecentAccentColors((prev) => {
      // Add current color to top of recent list, remove duplicates, cap at 6
      const newRecents = [color, ...prev.filter(c => c !== color)].slice(0, 6);
      localStorage.setItem('ytdeluxe_recent_accents', JSON.stringify(newRecents));
      return newRecents;
    });
  };

  const resetAccentColor = () => {
    handleAccentColorSelect(defaultAccentColor);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Dark/Light Mode Toggle */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('theme.appearanceMode')}</h3>
            <p className="text-sm text-muted-foreground">{t('theme.appearanceModeDesc')}</p>
          </div>
          <div className="flex items-center p-1 rounded-full bg-black/5 dark:bg-white/5 border border-border/50 relative">
            <button
              onClick={(e) => handleThemeSelect(e, 'light')}
              className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentTheme === 'light' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {currentTheme === 'light' && (
                <motion.div layoutId="theme-active-pill" className="absolute inset-0 bg-primary shadow-sm rounded-full -z-10" />
              )}
              <Icon name="Sun" size={16} />
              <span>{t('theme.light')}</span>
            </button>
            <button
              onClick={(e) => handleThemeSelect(e, 'dark')}
              className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentTheme === 'dark' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {currentTheme === 'dark' && (
                <motion.div layoutId="theme-active-pill" className="absolute inset-0 bg-primary shadow-sm rounded-full -z-10" />
              )}
              <Icon name="Moon" size={16} />
              <span>{t('theme.dark')}</span>
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="glass rounded-xl p-5 border border-border/50 bg-gradient-to-br from-card/30 to-card/10 shadow-glass-sm transition-all duration-300"
        >
          <div className="flex items-center space-x-3 mb-4">
            <motion.div 
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"
            >
              <Icon name="Play" size={20} color="white" />
            </motion.div>
            <div>
              <h4 className="text-sm font-bold text-foreground">{t('theme.preview')}</h4>
              <p className="text-xs text-muted-foreground">{t('theme.previewDesc')}</p>
            </div>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/20 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Accent Color Picker */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('theme.accentColor')}</h3>
            <p className="text-sm text-muted-foreground">{t('theme.accentColorDesc')}</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetAccentColor}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-accent/50 text-accent-foreground border border-border/50 rounded-xl hover:bg-accent transition-all duration-200 shadow-sm"
          >
            <Icon name="RotateCcw" size={14} />
            <span>{t('theme.resetDefault')}</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {accentColors?.map((color, index) => (
            <motion.button
              key={color?.value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAccentColorSelect(color?.value)}
              className={`w-12 h-12 rounded-2xl ${color?.class} transition-all shadow-lg ${selectedAccentColor === color?.value ? 'ring-4 ring-primary/30 border-2 border-white dark:border-white/20' : 'border border-transparent'
                }`}
              title={color?.name}
            >
              {selectedAccentColor === color?.value && (
                <Icon name="Check" size={20} color="white" className="mx-auto" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Recently Used Colors */}
        {recentAccentColors.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <label className="block text-sm font-bold text-foreground uppercase tracking-widest opacity-60 mb-4">
              {t('theme.recentlyUsed')}
            </label>
            <div className="flex flex-wrap gap-4">
              {recentAccentColors.map((color, index) => (
                <motion.button
                  key={`recent-${color}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAccentColorSelect(color)}
                  className={`w-10 h-10 rounded-xl transition-all border border-border/50 shadow-sm ${selectedAccentColor === color ? 'ring-4 ring-primary/20' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedAccentColor === color && (
                    <Icon name="Check" size={16} color="white" className="mx-auto" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Color Input */}
        <div className="mt-6 pt-6 border-t border-border">
          <label className="block text-sm font-bold text-foreground uppercase tracking-widest opacity-60 mb-3">
            {t('theme.customColor')}
          </label>
          <div className="flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.05 }} className="shrink-0">
              <input
                type="color"
                value={selectedAccentColor}
                onChange={(e) => handleAccentColorSelect(e?.target?.value)}
                className="w-14 h-11 rounded-xl border-0 p-0 cursor-pointer overflow-hidden bg-transparent"
              />
            </motion.div>
            <div className="flex-1 relative group">
              <input
                type="text"
                value={selectedAccentColor}
                onChange={(e) => handleAccentColorSelect(e?.target?.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card/50 border border-border/50 rounded-xl text-foreground font-mono focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="#2C5DA9"
              />
              <Icon name="Hash" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ThemeCustomization;