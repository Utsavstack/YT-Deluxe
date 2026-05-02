import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { YTDeluxeStorage, STORAGE_KEYS } from './storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default to light
  const [accentColor, setAccentColorState] = useState('#2C5DA9');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme and accent on mount
  useEffect(() => {
    const loadThemeAndAccent = async () => {
      const savedTheme = await YTDeluxeStorage.getItem(STORAGE_KEYS.THEME, 'light');
      const savedAccent = await YTDeluxeStorage.getItem(STORAGE_KEYS.ACCENT_COLOR, '#2C5DA9');
      
      setTheme(savedTheme);
      setAccentColorState(savedAccent);
      setIsLoaded(true);
    };
    loadThemeAndAccent();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    const applyTheme = (currentTheme) => {
      const root = window.document.documentElement;
      let isDark = false;
      
      if (currentTheme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = currentTheme === 'dark';
      }
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    
    // Save theme
    YTDeluxeStorage.setItem(STORAGE_KEYS.THEME, theme);

    // Listen to system changes if theme is system
    let mediaQuery;
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    if (theme === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, [theme, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    document.documentElement.style.setProperty('--color-primary', accentColor);
    YTDeluxeStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, accentColor);
  }, [accentColor, isLoaded]);

  const handleSetTheme = (newTheme) => {
    if (newTheme === theme) return;

    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });
  };

  const handleSetAccentColor = (newColor) => {
    if (newColor === accentColor) return;
    setAccentColorState(newColor);
  };

  const toggleTheme = () => {
    handleSetTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, accentColor, setAccentColor: handleSetAccentColor, toggleTheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
