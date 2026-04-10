import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';


const ThemeCustomization = ({ currentTheme, onThemeChange, currentAccentColor, onAccentColorChange }) => {
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

  return (
    <div className="space-y-6">
      {/* Dark/Light Mode Toggle */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Appearance Mode</h3>
            <p className="text-sm text-muted-foreground">Choose between light and dark themes</p>
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
              <span>Light</span>
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
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="glass rounded-lg p-4 border border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Icon name="Play" size={16} color="white" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">YT Deluxe</h4>
              <p className="text-xs text-muted-foreground">Live Preview</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-3/4 transition-all duration-300"></div>
          </div>
        </div>
      </div>
      {/* Accent Color Picker */}
      <div className="glass-card p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Accent Color</h3>
            <p className="text-sm text-muted-foreground">Customize the primary accent color</p>
          </div>
          <button 
             onClick={resetAccentColor}
             className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-black/5 dark:bg-white/5 border border-border/50 text-foreground rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
             <Icon name="RotateCcw" size={14} />
             <span>Reset to Default</span>
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {accentColors?.map((color) => (
            <button
              key={color?.value}
              onClick={() => handleAccentColorSelect(color?.value)}
              className={`w-12 h-12 rounded-full ${color?.class} transition-all spring-smooth hover:scale-110 ${selectedAccentColor === color?.value ? 'ring-2 ring-foreground ring-offset-2' : ''
                }`}
              title={color?.name}
            >
              {selectedAccentColor === color?.value && (
                <Icon name="Check" size={16} color="white" className="mx-auto" />
              )}
            </button>
          ))}
        </div>

        {/* Recently Used Colors */}
        {recentAccentColors.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <label className="block text-sm font-medium text-foreground mb-3">
              Recently Used
            </label>
            <div className="flex flex-wrap gap-3">
              {recentAccentColors.map((color) => (
                <button
                  key={`recent-${color}`}
                  onClick={() => handleAccentColorSelect(color)}
                  className={`w-10 h-10 rounded-full transition-all spring-smooth border border-border/50 hover:scale-110 ${selectedAccentColor === color ? 'ring-2 ring-foreground ring-offset-2' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedAccentColor === color && (
                    <Icon name="Check" size={14} color="white" className="mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Color Input */}
        <div className="mt-4 pt-4 border-t border-border">
          <label className="block text-sm font-medium text-foreground mb-2">
            Custom Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={selectedAccentColor}
              onChange={(e) => handleAccentColorSelect(e?.target?.value)}
              className="w-12 h-10 rounded-lg border border-border cursor-pointer"
            />
            <input
              type="text"
              value={selectedAccentColor}
              onChange={(e) => handleAccentColorSelect(e?.target?.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="#2C5DA9"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomization;