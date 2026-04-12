import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { YTDeluxeStorage, STORAGE_KEYS } from './storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // Default to dark for premium feel
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await YTDeluxeStorage.getItem(STORAGE_KEYS.THEME, 'dark');
      setTheme(savedTheme);
      setIsLoaded(true);
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme
    YTDeluxeStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme, isLoaded]);

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

  const toggleTheme = () => {
    handleSetTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, toggleTheme, isLoaded }}>
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
